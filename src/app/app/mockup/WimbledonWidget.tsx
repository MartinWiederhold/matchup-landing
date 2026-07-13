"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

type P = { name: string; country: string | null; flag: string | null; seed: number | null; sets: number[]; won: boolean };
type M = { round: string; court: string | null; state: "pre" | "in" | "post"; statusText: string; date: string | null; players: P[] };
type Cat = { key: string; label: string; matches: M[] };
type Data = {
  updatedAt: string;
  tournament: { name: string; startDate: string | null; endDate: string | null; year: number | null } | null;
  categories: Cat[];
};

const WD = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
const MON = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
const MON_S = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
const TZ = "Europe/Berlin";

function dayKey(iso: string): string {
  try { return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date(iso)); } catch { return ""; }
}
function todayKey(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());
}
function labelTop(key: string): string {
  const [Y, M, D] = key.split("-").map(Number);
  return key === todayKey() ? "Heute" : WD[new Date(Date.UTC(Y, M - 1, D, 12)).getUTCDay()];
}
function labelBottom(key: string): string {
  const [, M, D] = key.split("-").map(Number);
  return `${D}. ${MON[M - 1]}`;
}
function fmtTime(iso: string): string {
  try { return new Intl.DateTimeFormat("de-CH", { hour: "2-digit", minute: "2-digit", timeZone: TZ }).format(new Date(iso)); } catch { return ""; }
}
/** Offizielles Turnier-Icon über die echte Domain (Google-Favicon-Dienst). */
function slamLogo(name: string): string | null {
  const n = name.toLowerCase();
  let domain = "";
  if (n.includes("wimbledon")) domain = "wimbledon.com";
  else if (n.includes("roland") || n.includes("french")) domain = "rolandgarros.com";
  else if (n.includes("us open")) domain = "usopen.org";
  else if (n.includes("australian")) domain = "ausopen.com";
  else return null;
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
}
function fmtRange(a: string | null, b: string | null): string {
  if (!a || !b) return "";
  const da = new Date(a), db = new Date(b);
  const dd = (d: Date) => Number(new Intl.DateTimeFormat("en-CA", { timeZone: TZ, day: "2-digit" }).format(d));
  const mm = (d: Date) => Number(new Intl.DateTimeFormat("en-CA", { timeZone: TZ, month: "2-digit" }).format(d)) - 1;
  const yy = (d: Date) => Number(new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric" }).format(d));
  return `${dd(da)}. ${MON_S[mm(da)]} bis ${dd(db)}. ${MON_S[mm(db)]} ${yy(db)}`;
}

export default function WimbledonWidget({ theme = "dark" }: { theme?: "dark" | "light" }) {
  const dark = theme === "dark";
  const cx = {
    ring: dark ? "ring-1 ring-white/10" : "ring-1 ring-black/10",
    outer: "",
    headerBg: dark ? "bg-white" : "bg-white",
    badge: dark ? "bg-neutral-100" : "bg-neutral-100",
    body: dark ? "bg-[#0c0c0f]" : "bg-white",
    dayBorder: dark ? "border-white/[0.07]" : "border-black/10",
    dayActive: dark ? "text-white" : "text-neutral-900",
    dayIdle: dark ? "text-zinc-500" : "text-neutral-400",
    dayUnderline: dark ? "bg-white" : "bg-matchup",
    divide: dark ? "divide-white/[0.06]" : "divide-black/[0.07]",
    round: dark ? "text-zinc-400" : "text-neutral-500",
    nameWon: dark ? "text-white" : "text-neutral-900",
    name: dark ? "text-zinc-200" : "text-neutral-700",
    seed: dark ? "text-zinc-500" : "text-neutral-400",
    setWon: dark ? "text-white" : "text-neutral-900",
    set: dark ? "text-zinc-500" : "text-neutral-400",
    cur: dark ? "bg-matchup/25 text-white ring-1 ring-matchup/50" : "bg-matchup/15 text-matchup ring-1 ring-matchup/40",
    foot: dark ? "text-zinc-500" : "text-neutral-400",
    flag: dark ? "bg-white/10" : "bg-black/10",
    empty: dark ? "text-zinc-500" : "text-neutral-400",
    live: dark ? "text-emerald-400" : "text-emerald-600",
  };
  const [data, setData] = useState<Data | null>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "empty">("loading");
  const [catKey, setCatKey] = useState("ms");
  const [day, setDay] = useState<string | null>(null);
  const [open, setOpen] = useState(false); // eingeklappt starten
  const touched = useRef(false); // hat der Nutzer eine Kategorie gewählt?
  const activeDayRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const r = await fetch("/api/tennis", { cache: "no-store" });
        const d = (await r.json()) as Data;
        if (!alive) return;
        setData(d);
        setStatus(d.categories?.length ? "ok" : "empty");
      } catch {
        if (alive) setStatus("empty");
      }
    }
    void load();
    const id = setInterval(load, 30000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  const cats = data?.categories ?? [];
  const cat = cats.find((c) => c.key === catKey) ?? cats[0];

  // Beim ersten Laden automatisch die Kategorie mit Live-Match zeigen
  useEffect(() => {
    if (touched.current || !cats.length) return;
    const liveCat = cats.find((c) => c.matches.some((m) => m.state === "in"));
    if (liveCat && liveCat.key !== catKey) { setCatKey(liveCat.key); setDay(null); }
  }, [cats, catKey]);

  // Tage aus den Matches — plus IMMER „heute", damit der aktuelle Tag markiert & sichtbar ist.
  const days = useMemo(() => {
    const s = new Set<string>();
    (cat?.matches ?? []).forEach((m) => { if (m.date) s.add(dayKey(m.date)); });
    s.add(todayKey());
    return Array.from(s).sort();
  }, [cat]);

  // Standard-Tag: heute (wenn dort Partien), sonst der nächste kommende Spieltag
  // (z. B. das morgige Finale), sonst der jüngste vergangene Spieltag.
  useEffect(() => {
    if (!cat) return;
    if (day && days.includes(day)) return;
    const tk = todayKey();
    const matchDays = Array.from(new Set(cat.matches.map((m) => (m.date ? dayKey(m.date) : "")).filter(Boolean))).sort();
    const liveDay = cat.matches.find((m) => m.state === "in" && m.date)?.date;
    let target: string | null;
    if (liveDay) target = dayKey(liveDay);
    else if (matchDays.includes(tk)) target = tk;
    else target = matchDays.find((d) => d >= tk) ?? matchDays[matchDays.length - 1] ?? tk;
    setDay(target);
  }, [cat, days, day]);

  const shown = useMemo(() => {
    if (!cat) return [];
    return cat.matches.filter((m) => (m.date ? dayKey(m.date) === day : day === todayKey()));
  }, [cat, day]);

  // Aktiven Tag automatisch in die Sicht scrollen (horizontal, kein Seiten-Scroll),
  // damit „heute" nicht erst nach rechts gescrollt werden muss.
  useEffect(() => {
    if (open && activeDayRef.current) {
      activeDayRef.current.scrollIntoView({ inline: "center", block: "nearest" });
    }
  }, [day, open, catKey]);

  const t = data?.tournament;
  const liveAny = cats.some((c) => c.matches.some((m) => m.state === "in"));

  // Turnier-Logo automatisch: erst Slam-Fallback, dann echte Domain aus web.tournaments
  // (Namensabgleich) → Google-Favicon. Fällt bei Fehler auf das generische Icon zurück.
  const [logo, setLogo] = useState<string | null>(null);
  const [logoOk, setLogoOk] = useState(true);
  useEffect(() => {
    const name = t?.name;
    setLogoOk(true);
    if (!name) { setLogo(null); return; }
    let alive = true;
    setLogo(slamLogo(name));
    supabase.from("tournaments").select("url").ilike("name", name).not("url", "is", null).limit(1)
      .then(({ data: rows }) => {
        if (!alive) return;
        const url = (rows?.[0] as { url?: string } | undefined)?.url;
        if (url) { try { setLogo(`https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=128`); setLogoOk(true); } catch { /* ignore */ } }
      });
    return () => { alive = false; };
  }, [t?.name]);

  return (
    <div className={`mt-4 overflow-hidden rounded-[24px] ${cx.ring} ${cx.outer}`}>
      {/* Kopf — klickbar zum Auf-/Zuklappen */}
      <div className={`${cx.headerBg} px-4 pt-4`}>
        <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-3 pb-4 text-left">
          <span className={`flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full ring-1 ring-black/10 ${cx.badge}`}>
            {logo && logoOk ? (
              <img src={logo} alt="" onError={() => setLogoOk(false)} className="h-7 w-7 object-contain" />
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4b3bf3" strokeWidth="1.7" strokeLinecap="round">
                <path d="M7 3l4 8M17 3l-4 8M4 6l6 4M20 6l-6 4" />
                <circle cx="12" cy="15" r="6" />
              </svg>
            )}
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-[19px] font-bold leading-tight text-neutral-900">{t?.name || "Grand Slam"}</h3>
            {t?.startDate && <p className="text-[13px] text-neutral-500">{fmtRange(t.startDate, t.endDate)}</p>}
          </div>
          {liveAny && (
            <span className="flex shrink-0 items-center gap-1.5 text-[13px] font-bold text-neutral-900">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" /> Live
            </span>
          )}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 text-neutral-500 transition-transform ${open ? "rotate-180" : ""}`}>
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
        {/* Kategorie-Tabs (nur aufgeklappt) */}
        {open && (
          <div className="no-scrollbar -mx-4 flex gap-5 overflow-x-auto px-4">
            {cats.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => { touched.current = true; setCatKey(c.key); setDay(null); }}
                className={`shrink-0 whitespace-nowrap border-b-2 pb-2.5 text-[12px] font-bold uppercase tracking-wide transition-colors ${
                  c.key === (cat?.key ?? "") ? "border-matchup text-neutral-900" : "border-transparent text-neutral-400"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tages-Leiste + Matches (nur aufgeklappt) */}
      {open && (
      <div className={cx.body}>
        {days.length > 0 && (
          <div className={`no-scrollbar flex gap-1 overflow-x-auto border-b ${cx.dayBorder} px-2 py-2`}>
            {days.map((k) => {
              const active = k === day;
              return (
                <button
                  key={k}
                  ref={active ? activeDayRef : undefined}
                  type="button"
                  onClick={() => setDay(k)}
                  className="flex shrink-0 flex-col items-center rounded-lg px-3 py-1.5"
                >
                  <span className={`text-[12px] font-bold ${active ? cx.dayActive : cx.dayIdle}`}>{labelTop(k)}</span>
                  <span className={`text-[12px] ${active ? cx.dayActive : cx.dayIdle}`}>{labelBottom(k)}</span>
                  <span className={`mt-1 h-0.5 w-6 rounded-full ${active ? cx.dayUnderline : "bg-transparent"}`} />
                </button>
              );
            })}
          </div>
        )}

        {/* Matches */}
        <div className={`divide-y ${cx.divide}`}>
          {status === "loading" && <p className={`py-8 text-center text-sm ${cx.empty}`}>Lädt Live-Daten …</p>}
          {status === "empty" && <p className={`py-8 text-center text-sm ${cx.empty}`}>Aktuell keine Daten im Feed.</p>}
          {status === "ok" && shown.length === 0 && <p className={`py-8 text-center text-sm ${cx.empty}`}>Keine Partien an diesem Tag.</p>}
          {shown.map((m, i) => (
            <MatchRow key={i} m={m} cx={cx} />
          ))}
        </div>

        {/* Fuss */}
        <div className={`flex items-center justify-between px-4 py-3 text-[11px] ${cx.foot}`}>
          <span>Alle Zeitangaben: MEZ</span>
          {data?.updatedAt && <span>Quelle ESPN · {fmtTime(data.updatedAt)}</span>}
        </div>
      </div>
      )}
    </div>
  );
}

type CX = Record<string, string>;
function MatchRow({ m, cx }: { m: M; cx: CX }) {
  const live = m.state === "in";
  const maxSets = Math.max(m.players[0]?.sets.length ?? 0, m.players[1]?.sets.length ?? 0);
  return (
    <div className="px-4 py-3">
      <div className="mb-1.5 flex items-center justify-between">
        <span className={`truncate text-[12px] ${cx.round}`}>{m.round || "Match"}</span>
        {live ? (
          <span className={`flex items-center gap-1 text-[12px] font-semibold ${cx.live}`}>
            Live
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M9 6l6 6-6 6" /></svg>
          </span>
        ) : m.state === "post" ? (
          <span className={`text-[12px] ${cx.set}`}>Beendet</span>
        ) : (
          <span className={`text-[12px] ${cx.round}`}>{m.date ? fmtTime(m.date) : ""}</span>
        )}
      </div>
      {m.players.map((p, i) => {
        const opp = m.players[1 - i];
        return (
          <div key={i} className="flex items-center gap-2.5 py-[3px]">
            {p.flag ? (
              <img src={p.flag} alt="" className="h-4 w-[26px] shrink-0 rounded-sm object-cover" />
            ) : (
              <span className={`h-4 w-[26px] shrink-0 rounded-sm ${cx.flag}`} />
            )}
            <span className={`w-5 shrink-0 text-center text-[13px] ${cx.seed}`}>{p.seed ?? ""}</span>
            <span className={`min-w-0 flex-1 truncate text-[15px] ${p.won ? `font-bold ${cx.nameWon}` : cx.name}`}>{p.name}</span>
            <span className="flex shrink-0 items-center gap-1">
              {Array.from({ length: maxSets }).map((_, s) => {
                const v = p.sets[s];
                const o = opp?.sets[s];
                const isCurrent = live && s === maxSets - 1;
                const won = v != null && o != null && v > o;
                return (
                  <span
                    key={s}
                    className={`flex h-7 w-7 items-center justify-center text-[14px] tabular-nums ${
                      isCurrent ? `rounded-md font-bold ${cx.cur}` : won ? `font-bold ${cx.setWon}` : cx.set
                    }`}
                  >
                    {v ?? ""}
                  </span>
                );
              })}
            </span>
          </div>
        );
      })}
    </div>
  );
}
