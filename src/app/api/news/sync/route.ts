import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { getServiceClient } from "@/lib/adminClient";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * News-Sync (kostenlos, ohne externen Dienst):
 *  Liest öffentliche RSS-Feeds (Tennis/Padel/Pickleball), speichert nur
 *  Überschrift + Quelle + Link + optionales Bild + Kurztext idempotent in
 *  web.news und löscht Einträge älter als 7 Tage (→ 7-Tage-Historie).
 *  Volltexte werden bewusst NICHT gespeichert — Klick öffnet die Originalquelle.
 *
 * Schutz: mit gesetztem CRON_SECRET nur via Vercel-Cron-Header oder ?secret=.
 */
function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  if (req.headers.get("authorization") === `Bearer ${secret}`) return true;
  return new URL(req.url).searchParams.get("secret") === secret;
}

type Sport = "tennis" | "padel" | "pickleball";
type Feed = { sport: Sport; url: string; source?: string };

// Zuverlässige, öffentliche Feeds. tennisnet liefert Bilder; Google-News-Suche
// liefert frische Multi-Quellen-Headlines (mit Quellenname + Datum).
const FEEDS: Feed[] = [
  { sport: "tennis", url: "https://www.tennisnet.com/rss.xml", source: "tennisnet" },
  { sport: "tennis", url: "https://news.google.com/rss/search?q=Tennis+ATP+WTA&hl=de&gl=DE&ceid=DE:de" },
  { sport: "padel", url: "https://news.google.com/rss/search?q=Padel+Tennis&hl=de&gl=DE&ceid=DE:de" },
  { sport: "pickleball", url: "https://news.google.com/rss/search?q=Pickleball&hl=en&gl=US&ceid=US:en" },
];

const MAX_PER_FEED = 20;
const KEEP_DAYS = 7;

function decode(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/\s+/g, " ")
    .trim();
}

function tag(block: string, name: string): string | null {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i"));
  return m ? m[1] : null;
}
function attrOf(block: string, tagName: string, attr: string): string | null {
  const m = block.match(new RegExp(`<${tagName}\\b[^>]*?\\b${attr}="([^"]+)"`, "i"));
  return m ? m[1] : null;
}

function pickImage(block: string): string | null {
  const enc = block.match(/<enclosure\b[^>]*url="([^"]+)"[^>]*type="image/i);
  if (enc) return enc[1];
  const media = attrOf(block, "media:content", "url") || attrOf(block, "media:thumbnail", "url");
  if (media && /^https?:/i.test(media)) return media;
  const desc = tag(block, "description") || tag(block, "content:encoded") || "";
  const img = desc.match(/<img[^>]+src="([^"]+)"/i);
  if (img) return img[1];
  return null;
}

function hostSource(link: string): string {
  try {
    return new URL(link).hostname.replace(/^www\./, "");
  } catch {
    return "News";
  }
}

type Item = {
  id: string;
  sport: Sport;
  title: string;
  link: string;
  source: string;
  image_url: string | null;
  summary: string | null;
  published_at: string;
};

function parseFeed(xml: string, feed: Feed): Item[] {
  const items: Item[] = [];
  const blocks = xml.split(/<item\b/i).slice(1);
  const cutoff = Date.now() - KEEP_DAYS * 86400000;
  for (const raw of blocks.slice(0, MAX_PER_FEED)) {
    const block = "<item " + raw;
    const rawTitle = tag(block, "title");
    const rawLink = tag(block, "link");
    if (!rawTitle || !rawLink) continue;
    const title = decode(rawTitle);
    const link = decode(rawLink);
    if (!title || !/^https?:/i.test(link)) continue;

    const pub = tag(block, "pubDate") || tag(block, "dc:date") || tag(block, "published");
    const ts = pub ? Date.parse(decode(pub)) : NaN;
    const when = Number.isNaN(ts) ? Date.now() : ts;
    if (when < cutoff) continue;

    // Google-News-Titel enden oft mit " - Quelle" → Quelle extrahieren, Titel kürzen
    let source =
      decode(tag(block, "source") || "") || feed.source || "";
    let cleanTitle = title;
    if (!source) {
      const dash = title.lastIndexOf(" - ");
      if (dash > 20) {
        source = title.slice(dash + 3).trim();
        cleanTitle = title.slice(0, dash).trim();
      }
    } else if (feed.source == null) {
      const dash = title.lastIndexOf(" - ");
      if (dash > 20 && title.slice(dash + 3).trim().length < 30) cleanTitle = title.slice(0, dash).trim();
    }
    if (!source) source = hostSource(link);

    const descRaw = tag(block, "description");
    const summary = descRaw ? decode(descRaw).slice(0, 180) || null : null;

    items.push({
      id: createHash("sha1").update(link).digest("hex").slice(0, 24),
      sport: feed.sport,
      title: cleanTitle,
      link,
      source,
      image_url: pickImage(block),
      summary,
      published_at: new Date(when).toISOString(),
    });
  }
  return items;
}

async function fetchFeed(feed: Feed): Promise<Item[]> {
  try {
    const res = await fetch(feed.url, {
      headers: { "User-Agent": "Mozilla/5.0 MatchupNews/1.0 (wiederhold.martin@web.de)" },
      cache: "no-store",
    });
    if (!res.ok) return [];
    const xml = await res.text();
    return parseFeed(xml, feed);
  } catch {
    return [];
  }
}

const THROTTLE_MIN = 20;

export async function GET(req: Request) {
  try {
    const svc = getServiceClient();

    // Öffentliche Aufrufe (Lazy-Refresh aus der App) sind erlaubt, aber
    // serverseitig gedrosselt: höchstens alle 20 Min wird wirklich gesynct.
    // Mit CRON_SECRET (Vercel-Cron oder ?secret=) wird die Drossel umgangen.
    if (!authorized(req)) {
      const { data: recent } = await svc
        .from("news")
        .select("created_at")
        .order("created_at", { ascending: false })
        .limit(1);
      const last = recent?.[0]?.created_at ? Date.parse(recent[0].created_at as string) : 0;
      if (Date.now() - last < THROTTLE_MIN * 60000) {
        return NextResponse.json({ ok: true, skipped: "throttled" });
      }
    }

    const perFeed = await Promise.all(FEEDS.map(fetchFeed));
    // pro id nur einmal (letzter gewinnt) – identische Links aus mehreren Feeds mergen
    const byId = new Map<string, Item>();
    for (const list of perFeed) for (const it of list) byId.set(it.id, it);
    const rows = [...byId.values()];

    let upserted = 0;
    if (rows.length) {
      const { error } = await svc.from("news").upsert(rows, { onConflict: "id" });
      if (error) throw new Error(error.message);
      upserted = rows.length;
    }

    // 7-Tage-Historie: Ältere entfernen
    const cutoff = new Date(Date.now() - KEEP_DAYS * 86400000).toISOString();
    await svc.from("news").delete().lt("published_at", cutoff);

    return NextResponse.json({
      ok: true,
      upserted,
      perFeed: perFeed.map((l, i) => ({ feed: FEEDS[i].url, items: l.length })),
      at: new Date().toISOString(),
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

export const POST = GET;
