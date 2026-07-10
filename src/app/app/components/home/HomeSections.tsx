"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useT, useLocale } from "@/lib/i18n";
import { useAppNav } from "../appNav";
import Avatar from "../shared/Avatar";
import { sportLabel } from "@/lib/utils/formatters";
import {
  ChevronRightIcon,
  PlusIcon,
  MapPinIcon,
  UsersIcon,
  SportIcon,
} from "../shared/icons";
import type { Profile, GameEvent, Sport } from "@/lib/types";

/* ── Begrüßung nach Tageszeit ─────────────────────────────── */
export function greeting(t: ReturnType<typeof useT>, name: string): string {
  const h = new Date().getHours();
  const key = h < 11 ? "discover.greetMorning" : h < 18 ? "discover.greetDay" : "discover.greetEvening";
  return `${t(key)}, ${name}`;
}

function SectionHead({ label, action, onAction }: { label: string; action?: string; onAction?: () => void }) {
  return (
    <div className="mb-2.5 flex items-center justify-between px-0.5">
      <span className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-neutral-400">{label}</span>
      {action && (
        <button type="button" onClick={onAction} className="flex items-center gap-0.5 text-[11px] font-bold uppercase tracking-wider text-matchup">
          {action} <ChevronRightIcon size={13} />
        </button>
      )}
    </div>
  );
}

/* ── Form-Ring (MatchScore/Elo) ───────────────────────────── */
export function FormRing({ score, onOpen }: { score: number; onOpen: () => void }) {
  const t = useT();
  const R = 40;
  const C = 2 * Math.PI * R;
  const pct = Math.max(4, Math.min(100, ((score - 800) / 800) * 100));
  const off = C * (1 - pct / 100);
  return (
    <button type="button" onClick={onOpen} className="flex w-full items-center gap-4 rounded-2xl bg-black/[0.035] p-4 text-left">
      <div className="relative h-[92px] w-[92px] shrink-0">
        <svg width="92" height="92" viewBox="0 0 92 92" className="-rotate-90">
          <circle cx="46" cy="46" r={R} fill="none" stroke="rgba(0,0,0,.08)" strokeWidth="8.5" />
          <circle cx="46" cy="46" r={R} fill="none" stroke="#4b3bf3" strokeWidth="8.5" strokeLinecap="round"
            strokeDasharray={C} strokeDashoffset={off} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[22px] font-extrabold leading-none tracking-tight text-neutral-900">{score}</span>
          <span className="mt-1 text-[8px] font-extrabold uppercase tracking-[0.16em] text-neutral-400">{t("discover.matchScore")}</span>
        </div>
      </div>
      <div className="min-w-0">
        <div className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-neutral-400">{t("discover.yourForm")}</div>
        <h3 className="mt-1 text-base font-extrabold tracking-tight text-neutral-900">{t("discover.formSub")}</h3>
        <p className="mt-1 flex items-center gap-1 text-[12.5px] text-neutral-500">{t("discover.formTap")} <ChevronRightIcon size={13} /></p>
      </div>
    </button>
  );
}

/* ── Story-Reihe „Neue Leute" ─────────────────────────────── */
export function StoryRow({ people, onOpen, onFind }: { people: Profile[]; onOpen: (id: string) => void; onFind: () => void }) {
  const t = useT();
  if (!people.length) return null;
  return (
    <section className="mt-6 px-4">
      <SectionHead label={t("discover.newPeople")} />
      <div className="no-scrollbar flex gap-3.5 overflow-x-auto">
        <button type="button" onClick={onFind} className="flex w-[60px] shrink-0 flex-col items-center gap-1.5">
          <span className="flex h-[58px] w-[58px] items-center justify-center rounded-full border border-dashed border-black/25 text-neutral-400"><PlusIcon size={22} /></span>
          <span className="max-w-[60px] truncate text-[11px] text-neutral-400">{t("discover.find")}</span>
        </button>
        {people.map((p) => (
          <button key={p.id} type="button" onClick={() => onOpen(p.id)} className="flex w-[60px] shrink-0 flex-col items-center gap-1.5">
            <span className="block h-[58px] w-[58px] rounded-full bg-gradient-to-br from-matchup to-indigo-500 p-[2px]">
              <span className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-neutral-200 text-sm font-bold text-neutral-500 ring-[2.5px] ring-white">
                {p.profile_image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.profile_image} alt="" className="h-full w-full object-cover" />
                ) : (
                  (p.first_name?.[0] ?? "?").toUpperCase()
                )}
              </span>
            </span>
            <span className="max-w-[60px] truncate text-[11px] font-medium text-neutral-600">{p.first_name}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

/* ── Sport-Gruppen (Tennis/Padel/Pickleball) mit Mitglieder-Avataren ── */
const SPORT_GROUPS: { key: Sport; color: string }[] = [
  { key: "tennis", color: "#10e6a0" },
  { key: "padel", color: "#7b6cff" },
  { key: "pickleball", color: "#f59e0b" },
];
export function SportGroups({ people, onSelect }: { people: Profile[]; onSelect: (sport: Sport) => void }) {
  const t = useT();
  return (
    <section className="mt-6 px-4">
      <SectionHead label={t("discover.sportsSection")} />
      <div className="grid grid-cols-3 gap-3">
        {SPORT_GROUPS.map((s) => {
          const members = people.filter((p) => (p.sports ?? []).includes(s.key));
          return (
            <button key={s.key} type="button" onClick={() => onSelect(s.key)} className="flex flex-col items-center gap-2 rounded-2xl bg-black/[0.035] py-4">
              <div className="relative flex h-16 w-16 items-center justify-center rounded-full" style={{ background: `radial-gradient(circle at 32% 28%, ${s.color}55, ${s.color}14)` }}>
                {members.length ? (
                  <div className="flex -space-x-2.5">
                    {members.slice(0, 3).map((p, i) => (
                      <span key={i} className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-neutral-200 text-[10px] font-bold text-neutral-500 ring-2 ring-white">
                        {p.profile_image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.profile_image} alt="" className="h-full w-full object-cover" />
                        ) : (
                          (p.first_name?.[0] ?? "?").toUpperCase()
                        )}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="flex -space-x-2.5">
                    {[0, 1, 2].map((i) => (
                      <span key={i} className="h-8 w-8 rounded-full bg-black/10 ring-2 ring-white" />
                    ))}
                  </div>
                )}
                <span className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full ring-2 ring-white" style={{ background: s.color }} />
              </div>
              <span className="text-xs font-extrabold">{sportLabel(s.key)}</span>
              <span className="text-[10px] text-neutral-400">{members.length} {t("discover.players")}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

/* ── Wetter-Icon + Mapping (WMO-Code) ─────────────────────── */
function wxKind(code: number): { d: string; good: boolean } {
  if (code <= 1) return { d: "sun", good: true };
  if (code <= 3) return { d: "cloudsun", good: true };
  if (code <= 48) return { d: "cloud", good: true };
  return { d: "rain", good: false };
}
function WxIcon({ kind }: { kind: string }) {
  const c = "h-[15px] w-[15px]";
  if (kind === "sun") return <svg className={c} viewBox="0 0 24 24" fill="none" stroke="#ffd06a" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="4.2" /><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8" /></svg>;
  if (kind === "rain") return <svg className={c} viewBox="0 0 24 24" fill="none" stroke="#9db4ff" strokeWidth="1.8" strokeLinecap="round"><path d="M17.5 15H7a4 4 0 0 1 0-8 6 6 0 0 1 11.3 1.6A3.5 3.5 0 0 1 17.5 15z" /><path d="M8 19l-1 2M12 19l-1 2M16 19l-1 2" /></svg>;
  return <svg className={c} viewBox="0 0 24 24" fill="none" stroke="#cfd6e6" strokeWidth="1.8" strokeLinecap="round"><path d="M17.5 18H7a4 4 0 0 1 0-8 6 6 0 0 1 11.3 1.6A3.5 3.5 0 0 1 17.5 18z" /></svg>;
}

/* ── „Dein nächstes Spiel" (+ Wetter best-effort) ─────────── */
type Wx = { temp: number; kind: string; good: boolean } | null;
export function NextGameCard({ onOpen, onAll }: { onOpen: (id: string) => void; onAll: () => void }) {
  const t = useT();
  const { locale } = useLocale();
  const loc = locale === "de" ? "de-CH" : "en-GB";
  const { profile } = useAppNav();
  const [game, setGame] = useState<GameEvent | null>(null);
  const [wx, setWx] = useState<Wx>(null);

  useEffect(() => {
    let cancel = false;
    (async () => {
      const nowIso = new Date().toISOString();
      const sel = `*, participants:game_participants(status, profile:profiles(first_name, profile_image)), creator:profiles!game_events_created_by_fkey(first_name, profile_image)`;
      const [mine, joined] = await Promise.all([
        supabase.from("game_events").select(sel).eq("created_by", profile.id).eq("status", "planned").gte("date_time", nowIso).order("date_time").limit(1),
        supabase.from("game_participants").select(`game:game_events(${sel})`).eq("user_id", profile.id).eq("status", "accepted"),
      ]);
      const cand: GameEvent[] = [];
      if (mine.data?.[0]) cand.push(mine.data[0] as GameEvent);
      for (const r of joined.data ?? []) {
        const raw = (r as { game: GameEvent | GameEvent[] }).game;
        const g = Array.isArray(raw) ? raw[0] : raw;
        if (g && g.status === "planned" && g.date_time >= nowIso) cand.push(g);
      }
      cand.sort((a, b) => (a.date_time < b.date_time ? -1 : 1));
      const next = cand[0] ?? null;
      if (cancel) return;
      setGame(next);
      if (next?.club_id) void loadWx(next);
    })();
    async function loadWx(g: GameEvent) {
      try {
        const { data: v } = await supabase.from("venues").select("lat,lng").eq("id", g.club_id!).maybeSingle();
        if (!v?.lat || !v?.lng) return;
        const day = g.date_time.slice(0, 10);
        const diff = (Date.parse(day) - Date.now()) / 86400000;
        if (diff > 15 || diff < -1) return; // Vorhersage nur ~16 Tage
        const u = `https://api.open-meteo.com/v1/forecast?latitude=${v.lat}&longitude=${v.lng}&hourly=temperature_2m,weather_code&start_date=${day}&end_date=${day}&timezone=auto`;
        const r = await fetch(u);
        const d = await r.json();
        const times: string[] = d?.hourly?.time ?? [];
        const hour = g.date_time.slice(0, 13); // YYYY-MM-DDTHH
        let idx = times.findIndex((x) => x.slice(0, 13) === hour);
        if (idx < 0) idx = 12;
        const temp = d?.hourly?.temperature_2m?.[idx];
        const code = d?.hourly?.weather_code?.[idx];
        if (typeof temp !== "number") return;
        const k = wxKind(code ?? 0);
        if (!cancel) setWx({ temp: Math.round(temp), kind: k.d, good: k.good });
      } catch {}
    };
    return () => { cancel = true; };
  }, [profile.id]);

  if (!game) return null;
  const d = new Date(game.date_time);
  const dd = d.toLocaleDateString(loc, { weekday: "short", day: "numeric", month: "numeric" });
  const hh = d.toLocaleTimeString(loc, { hour: "2-digit", minute: "2-digit" });
  const accepted = 1 + (game.participants?.filter((p) => p.status === "accepted").length ?? 0);
  const cap = game.max_participants ?? (game.game_type === "singles" ? 2 : 4);
  const free = Math.max(0, cap - accepted);
  const people = [game.creator, ...((game.participants ?? []).filter((p) => p.status === "accepted").map((p) => p.profile))].filter(Boolean).slice(0, 3);

  return (
    <section className="mt-6 px-4">
      <SectionHead label={t("discover.nextGame")} action={t("discover.openGamesAll")} onAction={onAll} />
      <button type="button" onClick={() => onOpen(game.id)} className="flex w-full items-center gap-3.5 rounded-2xl bg-black/[0.035] p-4 text-left">
        <div className="w-14 shrink-0 text-center">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400">{dd}</div>
          <div className="mt-0.5 text-[19px] font-extrabold tracking-tight">{hh}</div>
        </div>
        <div className="min-w-0 flex-1 border-l border-black/10 pl-3.5">
          <div className="flex items-center gap-1.5 text-sm font-extrabold"><SportIcon sport={game.sport} size={15} /> {sportLabel(game.sport)}</div>
          <div className="mt-0.5 flex items-center gap-1 truncate text-xs text-neutral-500"><MapPinIcon size={13} /> {game.location}{free > 0 ? ` · ${t("discover.openGamesSpots", { count: free })}` : ""}</div>
          <div className="mt-2 flex items-center gap-2.5">
            {wx && (
              <span className={`inline-flex items-center gap-1.5 rounded-full bg-black/[0.05] px-2 py-1 text-[11px] font-bold ${wx.good ? "text-neutral-600" : "text-amber-600"}`}>
                <WxIcon kind={wx.kind} /> {wx.temp}° · {wx.good ? t("discover.wxGood") : t("discover.wxMeh")}
              </span>
            )}
            <div className="flex -space-x-2">
              {people.map((p, i) => <span key={i} className="rounded-full ring-2 ring-[#0d0d11]"><Avatar src={p!.profile_image} alt={p!.first_name} size="sm" /></span>)}
            </div>
          </div>
        </div>
      </button>
    </section>
  );
}

/* ── Live im Profitennis (aktueller/nächster Grand Slam) ──── */
type Slam = { name: string; surface: string; start_date: string; end_date: string; url: string | null; live: boolean } | null;
export function LiveTennisCard({ onOpen }: { onOpen?: () => void }) {
  const t = useT();
  const { locale } = useLocale();
  const [s, setS] = useState<Slam>(null);
  useEffect(() => {
    let cancel = false;
    (async () => {
      const today = new Date().toISOString().slice(0, 10);
      const sel = "name,surface,start_date,end_date,url";
      let live = true;
      let { data } = await supabase.from("tournaments").select(sel).eq("tier", "GS").lte("start_date", today).gte("end_date", today).limit(1);
      if (!data?.length) {
        live = false;
        const r = await supabase.from("tournaments").select(sel).eq("tier", "GS").gt("start_date", today).order("start_date").limit(1);
        data = r.data;
      }
      if (!cancel && data?.[0]) setS({ ...(data[0] as Omit<NonNullable<Slam>, "live">), live });
    })();
    return () => { cancel = true; };
  }, []);
  if (!s) return null;
  const fmt = (iso: string) => new Date(iso + "T00:00:00").toLocaleDateString(locale === "de" ? "de-CH" : "en-GB", { day: "numeric", month: "short" });
  return (
    <section className="mt-6 px-4">
      <SectionHead label={t("discover.liveTennis")} />
      <button type="button" onClick={onOpen} className="relative flex w-full items-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-br from-matchup to-indigo-600 p-4 text-left shadow-lg">
        <div className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-[0.14em] text-white/80">
            <span className={`h-1.5 w-1.5 rounded-full bg-white ${s.live ? "animate-pulse" : ""}`} />
            {s.live ? t("discover.slamLive") : t("discover.slamNext")}
          </span>
          <h3 className="mt-1 truncate text-[16px] font-extrabold tracking-tight text-white">{s.name}</h3>
          <div className="mt-0.5 text-[11px] text-white/70">{s.surface} · {fmt(s.start_date)}–{fmt(s.end_date)}</div>
        </div>
        <span className="flex shrink-0 items-center gap-1 rounded-full bg-white/20 px-2.5 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-white">{t("discover.results")}<ChevronRightIcon size={13} /></span>
      </button>
    </section>
  );
}

/* ── Community-Puls (neuester Beitrag) ────────────────────── */
type PostRow = { content: string | null; author: { first_name: string | null; profile_image: string | null } | null };
export function CommunityCard({ onOpen }: { onOpen: () => void }) {
  const t = useT();
  const [post, setPost] = useState<PostRow | null>(null);
  const [loaded, setLoaded] = useState(false);
  const load = useCallback(async () => {
    const { data } = await supabase
      .from("community_posts")
      .select("content, author:profiles!community_posts_author_id_fkey(first_name, profile_image)")
      .is("club_id", null)
      .order("created_at", { ascending: false })
      .limit(1);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row: any = data?.[0];
    const author = row ? (Array.isArray(row.author) ? row.author[0] : row.author) ?? null : null;
    setPost(row ? { content: row.content ?? null, author } : null);
    setLoaded(true);
  }, []);
  useEffect(() => { void load(); }, [load]);
  if (!loaded || !post) return null;
  return (
    <section className="mt-6 px-4">
      <button type="button" onClick={onOpen} className="w-full rounded-2xl bg-black/[0.035] p-4 text-left">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-neutral-400"><UsersIcon size={14} /> {t("discover.community")}</span>
          <ChevronRightIcon size={16} className="text-neutral-400" />
        </div>
        <div className="mt-3 flex items-start gap-2.5">
          <Avatar src={post.author?.profile_image} alt={post.author?.first_name ?? ""} size="sm" />
          <p className="text-[12.5px] leading-snug text-neutral-500 line-clamp-2"><b className="text-neutral-900">{post.author?.first_name}</b> {post.content}</p>
        </div>
      </button>
    </section>
  );
}
