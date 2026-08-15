"use client";

import { useEffect, useState } from "react";
import { useT, useLocale } from "@/lib/i18n";
import { DeadlineCountdown, EntryPath } from "../EntryDeadline";
import { hotelUrl, flightUrl, carUrl, flightPriceQuery, type LivePrice } from "@/lib/travelpayouts";
import { loadTourPresence, joinTourPresence, leaveTourPresence, contactHref, type TourPresence } from "@/lib/tourPresence";
import { loadProvidersNearCoords, type ProviderNear } from "@/lib/services";
import { loadEffectiveVisa, type NatVisaInfo } from "@/lib/tourVisaRequirements";
import TourChatPanel from "./TourChatPanel";
import type { TourTournament, TourCostRates } from "@/lib/types";

const DAY = 86_400_000;
// Dienstleister-Umkreis: 50 km ≈ Turnierstadt + direktes Umland (taggleich erreichbar).
// Bewusst KEINE Auto-Erweiterung — lieber ehrlich leer als Unnütze aus 200 km.
const PROVIDER_RADIUS_KM = 50;
const SVC_CAT_ORDER = ["coach", "physio", "stringer", "sc", "mental", "nutrition", "hitting", "tour_companion"];
// Reiter des Turnierdetails (Etappe a des /tour-Vier-Spalten-Umbaus). Der Shell lädt
// Präsenz/Anbieter/Flugpreis EINMAL je tt.id; die Reiter rendern nur konditional →
// Wechsel = reines Re-Render, kein neuer Abruf.
const DETAIL_TABS = [
  { k: "overview", label: "tour.tabOverview" },
  { k: "onsite", label: "tour.tabOnSite" },
  { k: "services", label: "tour.tabServices" },
  { k: "booking", label: "tour.tabBooking" },
] as const;
type DetailTab = (typeof DETAIL_TABS)[number]["k"];
// Website-Logo je Anbieter = Favicon der eigenen Website (öffentliche Marke, KEIN
// Personenfoto → MU-035 unberührt). Ohne Website fällt die Zeile auf ein Monogramm zurück.
function providerDomain(website: string | null): string | null {
  if (!website) return null;
  try { return new URL(website).hostname.replace(/^www\./, ""); } catch { return null; }
}

/** ISO-Datum + n Tage (UTC, deterministisch). */
function addDaysISO(iso: string, n: number): string {
  return new Date(Date.parse(iso + "T00:00:00Z") + n * DAY).toISOString().slice(0, 10);
}

/**
 * Live-Flugpreis (das Einzige, was Travelpayouts noch liefert — Hotellook ist 10/2025
 * eingestellt, hotelPriceQuery gibt immer null). Origin ist der Startort (Stadt ODER
 * IATA); die /api/prices-Route löst eine Stadt server-seitig zu IATA auf. Die Komponente
 * wird pro Turnier neu gemountet (key=tt.id) → Anfangszustand "loading", genau ein Abruf.
 */
type PriceState = "loading" | LivePrice;
function useFlightPrice(city: string, country: string, start: string, end: string, origin: string): PriceState {
  const [state, setState] = useState<PriceState>("loading");
  useEffect(() => {
    let cancel = false;
    flightPriceQuery({ city, country, start, end }, origin || undefined).then((r) => { if (!cancel) setState(r); });
    return () => { cancel = true; };
  }, [city, country, start, end, origin]);
  return state;
}

/**
 * Turnier-Detail des Saisonplaners: Kopf, PROMINENTE Hauptaktion (zur Saison hinzufügen/
 * entfernen), Meldefrist + Weg zur Meldung, Wochenkosten-Richtwert und Live-Flugpreis mit
 * EHRLICHEM Fallback („Keine Live-Preise für diesen Ort" statt leerem Kasten/Endlos-Spinner).
 * Buchungs-Deep-Links funktionieren immer, auch ohne Live-Preis.
 */
export default function TournamentDetail({
  tt, countryName, inSeason, onToggle, onClose, originCity, originLabel, nights, rates, nowMs,
  viewerId, viewerName, viewerRank, viewerNationality, viewerPassports,
}: {
  tt: TourTournament;
  countryName: string;
  inSeason: boolean;
  onToggle: () => void;
  onClose: () => void;
  originCity: string | null;
  originLabel: string | null;
  nights: number;
  rates: TourCostRates | null;
  nowMs: number;
  viewerId: string;
  viewerName: string | null;
  viewerRank: string | null;
  viewerNationality: string | null;
  viewerPassports: string[];
}) {
  const t = useT();
  const { locale } = useLocale();

  // ── „Wer ist hier?" — Opt-in-Präsenz (web.player_presence, geteilt mit /map).
  // Komponente ist per key=tt.id gemountet → Anfangszustand frisch, ein Laden.
  const [presence, setPresence] = useState<TourPresence[] | null>(null);
  const [pContact, setPContact] = useState("");
  const [pPartner, setPPartner] = useState(true);
  const [pRoom, setPRoom] = useState(false);
  const [pBusy, setPBusy] = useState(false);
  const [chatWith, setChatWith] = useState<TourPresence | null>(null);
  const [activeTab, setActiveTab] = useState<DetailTab>("overview");
  useEffect(() => {
    let alive = true;
    loadTourPresence(tt.id).then((rows) => {
      if (!alive) return;
      setPresence(rows);
      const mine = rows.find((r) => r.user_id === viewerId);
      if (mine) { setPContact(mine.contact ?? ""); setPPartner(mine.looking); setPRoom(mine.looking_room); }
    });
    return () => { alive = false; };
  }, [tt.id, viewerId]);
  const meListed = !!presence?.some((r) => r.user_id === viewerId);
  const others = (presence ?? []).filter((r) => r.user_id !== viewerId);
  // In-App-Anschreiben nur, wenn ich selbst mit Absicht eingetragen bin (spiegelt die
  // RLS web.may_match: beide brauchen Präsenz + Absicht — sonst lehnt die DB den Match ab).
  const myPresence = presence?.find((r) => r.user_id === viewerId);
  const canMessage = !!myPresence && (myPresence.looking || myPresence.looking_room);
  const refreshPresence = async () => setPresence(await loadTourPresence(tt.id));
  const joinP = async () => {
    setPBusy(true);
    await joinTourPresence(viewerId, tt.id, { name: viewerName, rankLabel: viewerRank, nationality: viewerNationality }, pPartner, pRoom, pContact);
    await refreshPresence();
    setPBusy(false);
  };
  const leaveP = async () => { setPBusy(true); await leaveTourPresence(viewerId, tt.id); await refreshPresence(); setPBusy(false); };

  // ── Dienstleister im Umkreis (50 km um den Turnierort), redaktioneller Bestand.
  const [prov, setProv] = useState<ProviderNear[] | null>(null);
  const [provCat, setProvCat] = useState<string>("all");
  useEffect(() => {
    if (tt.latitude == null || tt.longitude == null) { setProv([]); return; }
    let alive = true;
    loadProvidersNearCoords(tt.latitude, tt.longitude, PROVIDER_RADIUS_KM).then((rows) => { if (alive) setProv(rows); });
    return () => { alive = false; };
  }, [tt.id, tt.latitude, tt.longitude]);
  const [openProv, setOpenProv] = useState<Set<string>>(new Set());
  const [provShowAll, setProvShowAll] = useState(false);
  const toggleProv = (id: string) => setOpenProv((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const provCats = prov ? SVC_CAT_ORDER.filter((c) => prov.some((p) => p.category === c)) : [];
  const provShown = (prov ?? []).filter((p) => provCat === "all" || p.category === provCat);
  // Standard: die 3 NÄCHSTEN je Kategorie (prov ist nach Distanz sortiert) — kurz halten,
  // damit auch der Buchen-Block sichtbar bleibt; „mehr anzeigen" öffnet die volle Liste.
  const provCapped = provShowAll ? provShown : (() => {
    const perCat = new Map<string, number>();
    const out: ProviderNear[] = [];
    for (const p of provShown) { const n = perCat.get(p.category) ?? 0; if (n < 3) { perCat.set(p.category, n + 1); out.push(p); } }
    return out;
  })();
  const unitLabel = (u: string | null) => (u ? t(`services.per${u.charAt(0).toUpperCase()}${u.slice(1)}`) : "");

  // ── Reisedokumente/Einreise für das Turnierland (Übersicht-Reiter). Nationalitäts-
  //    abhängiger Bestand (web.tour_visa_requirements) — günstigste Klasse über alle Pässe,
  //    exakt wie /app › Visa. "loading" bis geladen; null = kein Eintrag hinterlegt. Der
  //    passKey (join) als Dep verhindert Neu-Laden bei stabiler, nur neu erzeugter Array-Prop.
  const passKey = viewerPassports.join(",");
  const [visa, setVisa] = useState<NatVisaInfo | null | "loading">("loading");
  useEffect(() => {
    const passports = passKey ? passKey.split(",") : [];
    if (!tt.country || passports.length === 0) { setVisa(null); return; }
    let alive = true;
    setVisa("loading");
    loadEffectiveVisa(passports).then((m) => { if (alive) setVisa(m.get(tt.country as string) ?? null); }).catch(() => { if (alive) setVisa(null); });
    return () => { alive = false; };
  }, [tt.id, tt.country, passKey]);
  const visaInfo = visa === "loading" ? null : visa;

  const start = tt.tournament_monday;
  const end = addDaysISO(start, nights > 0 ? nights : 7);
  const stop = { city: tt.city ?? "", country: countryName, start, end };
  const price = useFlightPrice(tt.city ?? "", countryName, start, end, originCity ?? "");

  const fmtEUR = (n: number) => new Intl.NumberFormat(locale, { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
  const fmtDay = (iso: string) => new Intl.DateTimeFormat(locale, { day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(iso + "T00:00:00Z"));

  // Wochenkosten-Richtwert dieses Turniers (nur wenn Pflichtsätze da sind).
  const ratesDone = rates?.currency != null && rates.arrival_minor != null && rates.per_night_minor != null && rates.food_per_day_minor != null;
  const weekMinor = ratesDone ? (rates!.arrival_minor ?? 0) + (rates!.per_night_minor ?? 0) * nights + (rates!.food_per_day_minor ?? 0) * nights + (rates!.coach_per_week_minor ?? 0) : 0;
  const fmtCur = (minor: number, cur: string) => new Intl.NumberFormat(locale, { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(minor / 100);
  // Abrufdatum (Tag genügt) — nowMs vom Elter, kein Laufzeit-Clock in Render.
  const fmtStand = (ms: number) => new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short" }).format(new Date(ms));

  // Flugpreis (Zahl oder null). "loading" → null → keine Zeile (kein Platzhalter, kein Hinweis).
  const flightPrice = price === "loading" ? null : price.price;

  // Datenstand + Quelle + Konsulats-Vorbehalt stehen an JEDER Visa-Aussage (auch „keine Angabe").
  const visaProvenance = (
    <div className="mt-2 border-t border-black/[0.06] pt-2 text-[10.5px] leading-relaxed text-neutral-400">
      {visaInfo ? (
        <p>
          {t("mode.visaNatSource", { date: visaInfo.sourceRevisedAt ? fmtDay(visaInfo.sourceRevisedAt.slice(0, 10)) : "—" })}
          {" · "}
          <a href={visaInfo.sourceUrl} target="_blank" rel="noopener noreferrer" className="font-bold text-neutral-500 underline">{t("mode.visaNatSourceLink")}</a>
        </p>
      ) : (
        <p>{t("mode.visaNatNoData")}</p>
      )}
      <p className="mt-0.5 font-semibold text-neutral-500">{t("mode.visaNatConsulate")}</p>
    </div>
  );

  const link = "flex items-center justify-between rounded-xl border border-black/10 px-3 py-2.5 text-[13px] font-semibold text-neutral-800 transition-colors hover:bg-black/[0.03]";

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Kopf mit Zurück */}
      <div className="flex shrink-0 items-center gap-2 border-b border-neutral-200 px-4 py-3">
        <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-[18px] text-neutral-500 hover:bg-black/[0.04]" aria-label={t("tour.wsDetailBack")}>←</button>
        <span className="text-[13px] font-bold text-neutral-500">{t("tour.wsDetailBack")}</span>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
        {/* Titel */}
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-neutral-900">{tt.city || t("tour.fieldMissing")}</h2>
          <p className="text-[13px] text-neutral-500">{countryName} · {fmtDay(start)}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {tt.category && <span className="rounded-full bg-matchup/10 px-2.5 py-0.5 text-[11px] font-bold text-matchup">{tt.category}</span>}
            {tt.surface && <span className="rounded-full bg-black/[0.04] px-2.5 py-0.5 text-[11px] font-semibold text-neutral-600">{tt.surface}</span>}
          </div>
        </div>

        {/* HAUPTAKTION — prominent, nicht als kleiner Link */}
        <button
          type="button"
          onClick={onToggle}
          className={`w-full rounded-2xl px-5 py-3.5 text-[15px] font-bold transition-colors ${inSeason ? "bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-300 hover:bg-emerald-500/15" : "bg-matchup text-white shadow-sm hover:bg-matchup-hover"}`}
        >
          {inSeason ? `✓ ${t("tour.wsDetailInSeason")}` : t("tour.wsDetailAdd")}
        </button>
        {inSeason && <button type="button" onClick={onToggle} className="w-full text-center text-[12px] font-semibold text-neutral-400 hover:text-neutral-700">{t("tour.wsDetailRemove")}</button>}

        {/* Reiter */}
        <div className="flex gap-1 rounded-full bg-black/[0.04] p-1">
          {DETAIL_TABS.map((tab) => (
            <button key={tab.k} type="button" onClick={() => setActiveTab(tab.k)} className={`flex-1 rounded-full px-2 py-1.5 text-[12px] font-bold transition-colors ${activeTab === tab.k ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-800"}`}>
              {t(tab.label)}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
        <>
        {/* Meldefrist + Weg zur Meldung */}
        <section className="rounded-2xl bg-black/[0.02] p-4 ring-1 ring-black/5">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">{t("tour.wsDetailDeadline")}</p>
          <div className="mt-1"><DeadlineCountdown tournament={tt} now={nowMs} /></div>
          <EntryPath tournament={tt} />
        </section>

        {/* Reisedokumente/Einreise — nationalitätsabhängig (Muster wie /app › Visa). KEIN
            Preisgeld: der DB-Wert ist reine Kategorie×1000 (MU-028), keine echten Preisdaten. */}
        {tt.country && (
          <section className="rounded-2xl border border-black/[0.07] p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">{t("tour.wsVisaTitle")}</p>
            {viewerPassports.length === 0 ? (
              <p className="mt-1.5 text-[12px] leading-relaxed text-neutral-500">{t("tour.wsVisaNoPass")}</p>
            ) : visa === "loading" ? (
              <p className="mt-1.5 text-[12px] text-neutral-400">{t("tour.loading")}</p>
            ) : visaInfo && visaInfo.requirementClass === "admission_refused" ? (
              <div className="mt-2 rounded-xl border border-red-200 bg-red-50 p-3">
                <p className="text-[13px] font-bold text-red-700">{t("mode.visaNatRefusedTitle")}</p>
                <p className="mt-1 text-[12px] leading-relaxed text-red-800">{t("mode.visaNatRefusedBody", { nat: visaInfo.nationality, country: countryName })}</p>
                {visaProvenance}
              </div>
            ) : (
              <div className="mt-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[12px] font-semibold text-neutral-700">{visaInfo ? t("mode.visaNatForPassport", { nat: visaInfo.nationality }) : t("mode.visaNatNoData")}</span>
                  {visaInfo && <span className="shrink-0 rounded-full bg-matchup/10 px-2.5 py-0.5 text-[11px] font-bold text-matchup">{t(`mode.visaNatClass_${visaInfo.requirementClass}`)}</span>}
                </div>
                {visaInfo?.allowedStayDays != null && <p className="mt-1 text-[12px] text-neutral-600">{t("mode.visaNatStay", { n: visaInfo.allowedStayDays })}</p>}
                {visaProvenance}
              </div>
            )}
          </section>
        )}

        {/* Kosten: Wochen-Richtwert + (NUR falls vorhanden) der Live-Flugpreis als EINE
            Zeile. Kein Preis → keine Zeile: bei ~36 % Abdeckung, nur Flügen und volatilen
            Werten trägt das keinen eigenen Block. Was fehlt, wird nicht angekündigt. */}
        {(ratesDone || flightPrice != null) && (
          <section className="space-y-1">
            {ratesDone && <p className="text-[12px] text-neutral-500">{t("tour.wsWeekCostThis", { amount: fmtCur(weekMinor, rates!.currency ?? "EUR") })}</p>}
            {flightPrice != null && (
              // Mit Abrufdatum, weil der Preis morgen anders sein kann.
              <p className="text-[12px] font-semibold text-neutral-700">✈ {t("tour.wsFlightLine", { origin: originLabel ?? "", amount: fmtEUR(flightPrice), date: fmtStand(nowMs) })}</p>
            )}
          </section>
        )}

        </>
        )}

        {activeTab === "onsite" && (
        <>
        {/* Wer ist hier? — Opt-in-Präsenz (freiwillig, selbst gewählter Kontakt). */}
        <section>
          <p className="text-[13px] font-bold uppercase tracking-[0.14em] text-neutral-400">{t("tour.wsHereTitle")}{presence ? ` · ${presence.length}` : ""}</p>

          {/* Eigene Eintragung (Opt-in): zwei Absichten + Kontakt. */}
          <div className="mt-2 rounded-2xl border border-matchup/20 bg-matchup/5 p-3">
            <p className="text-[13px] font-bold text-neutral-800">{meListed ? t("tour.wsHereListed") : t("tour.wsHereAsk")}</p>
            <label className="mt-2 flex items-center gap-2 text-[13px] text-neutral-700">
              <input type="checkbox" checked={pPartner} onChange={(e) => setPPartner(e.target.checked)} className="h-4 w-4 accent-matchup" />{t("tour.wsSeekPartner")}
            </label>
            <label className="mt-1 flex items-center gap-2 text-[13px] text-neutral-700">
              <input type="checkbox" checked={pRoom} onChange={(e) => setPRoom(e.target.checked)} className="h-4 w-4 accent-matchup" />{t("tour.wsSeekRoom")}
            </label>
            <input value={pContact} onChange={(e) => setPContact(e.target.value)} placeholder={t("tour.wsContactPlaceholder")} className="mt-2 w-full rounded-xl border border-black/15 bg-white px-3 py-2 text-[13px] placeholder:text-neutral-400 focus:border-black/30 focus:outline-none" />
            <div className="mt-2 flex gap-2">
              <button type="button" onClick={joinP} disabled={pBusy} className="flex-1 rounded-full bg-matchup px-3 py-2 text-[12px] font-bold text-white transition-colors hover:bg-matchup-hover disabled:opacity-50">{meListed ? t("tour.wsHereUpdate") : t("tour.wsHereJoin")}</button>
              {meListed && <button type="button" onClick={leaveP} disabled={pBusy} className="rounded-full bg-neutral-100 px-3 py-2 text-[12px] font-semibold text-neutral-500 hover:bg-neutral-200 disabled:opacity-50">{t("tour.wsHereLeave")}</button>}
            </div>
          </div>

          {/* Andere vor Ort */}
          {presence == null ? (
            <p className="mt-2 text-[12px] text-neutral-400">{t("tour.loading")}</p>
          ) : others.length === 0 ? (
            <p className="mt-2 text-[12px] text-neutral-400">{t("tour.wsHereEmpty")}</p>
          ) : (
            <div className="mt-2 space-y-1.5">
              {others.map((r) => {
                const href = r.contact ? contactHref(r.contact) : null;
                return (
                  <div key={r.user_id} className="flex items-center gap-2.5 rounded-xl border border-neutral-200 bg-white px-2.5 py-2">
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-1.5">
                        <span className="truncate text-[13px] font-semibold text-neutral-900">{r.name || t("tour.fieldMissing")}</span>
                        {r.looking && <span className="shrink-0 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-600">🎾 {t("tour.wsPartnerBadge")}</span>}
                        {r.looking_room && <span className="shrink-0 rounded-full bg-matchup/10 px-1.5 py-0.5 text-[9px] font-bold text-matchup">🛏 {t("tour.wsRoomBadge")}</span>}
                      </span>
                      <span className="block truncate text-[11px] text-neutral-400">{[r.rank_label, r.nationality].filter(Boolean).join(" · ")}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-1.5">
                      {canMessage && (r.looking || r.looking_room) && (
                        <button type="button" onClick={() => setChatWith(r)} className="rounded-full bg-matchup px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-matchup-hover">{t("tour.wsMessage")}</button>
                      )}
                      {r.contact && (href
                        ? <a href={href} target="_blank" rel="noreferrer" className="rounded-full bg-neutral-100 px-2.5 py-1.5 text-[11px] font-bold text-neutral-700 hover:bg-neutral-200">{t("tour.wsContact")}</a>
                        : <span className="text-[11px] text-neutral-500">{r.contact}</span>)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
          <p className="mt-1.5 text-[11px] leading-relaxed text-neutral-400">{t("tour.wsHereNote")}</p>
        </section>

        </>
        )}

        {activeTab === "services" && (
        <>
        {/* Dienstleister vor Ort — Anbieter im 50-km-Umkreis, redaktioneller Bestand.
            Kein Bild (auch bei Selbst-Einträgen): Darstellung wie Plätze/Vereine in /map. */}
        <section>
          <p className="text-[13px] font-bold uppercase tracking-[0.14em] text-neutral-400">
            {t("tour.svcTitle")}{prov && prov.length > 0 ? ` · ${prov.length}` : ""}
          </p>
          {prov == null ? (
            <p className="mt-2 text-[12px] text-neutral-400">{t("tour.loading")}</p>
          ) : prov.length === 0 ? (
            <p className="mt-2 text-[12px] text-neutral-400">{t("tour.svcEmpty", { city: tt.city || countryName })}</p>
          ) : (
            <>
              {provCats.length > 1 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {["all", ...provCats].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => { setProvCat(c); setProvShowAll(false); }}
                      className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold ${provCat === c ? "bg-matchup text-white" : "bg-black/[0.05] text-neutral-500"}`}
                    >
                      {c === "all" ? t("tour.svcAll") : t(`services.cat_${c}`)}
                    </button>
                  ))}
                </div>
              )}
              <div className="mt-2 space-y-1.5">
                {provCapped.map((p) => {
                  const dom = providerDomain(p.website);
                  const open = openProv.has(p.id);
                  return (
                    <div key={p.id} className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
                      <button type="button" onClick={() => toggleProv(p.id)} aria-expanded={open} className="flex w-full items-center gap-2.5 px-2.5 py-2 text-left">
                        {dom ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={`https://icons.duckduckgo.com/ip3/${dom}.ico`} alt="" loading="lazy" decoding="async" className="h-9 w-9 shrink-0 rounded-full bg-neutral-100 object-contain p-1.5" />
                        ) : (
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-[13px] font-bold text-neutral-500">{(p.name || "?").slice(0, 1).toUpperCase()}</span>
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-semibold text-neutral-900">{p.name}</span>
                          <span className="block truncate text-[11px] text-neutral-500">
                            {t(`services.cat_${p.category}`)}{p.city ? ` · ${p.city}` : ""} · {Math.round(p.distance_km)} km
                            {p.price_from != null ? ` · ${t("tour.svcFrom")} ${p.currency ?? ""} ${p.price_from}${p.price_unit ? " " + unitLabel(p.price_unit) : ""}` : ""}
                          </span>
                        </span>
                        <svg viewBox="0 0 24 24" aria-hidden className={`h-4 w-4 shrink-0 text-neutral-400 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
                      </button>
                      {open && (
                        <div className="border-t border-neutral-100 px-3 py-2.5">
                          {p.languages?.length > 0 && <p className="mb-2 text-[11px] text-neutral-400">{p.languages.join(" · ").toUpperCase()}</p>}
                          <div className="flex flex-wrap gap-1.5">
                            {p.phone && <a href={`tel:${p.phone}`} className="rounded-full bg-neutral-100 px-3 py-1.5 text-[12px] font-bold text-neutral-700 hover:bg-neutral-200">{t("tour.svcPhone")}</a>}
                            {p.website && <a href={p.website} target="_blank" rel="noreferrer" className="rounded-full bg-neutral-100 px-3 py-1.5 text-[12px] font-bold text-neutral-700 hover:bg-neutral-200">{t("tour.svcWeb")}</a>}
                            {p.contact_email && <a href={`mailto:${p.contact_email}`} className="rounded-full bg-matchup px-3 py-1.5 text-[12px] font-bold text-white hover:bg-matchup-hover">{t("tour.svcEmail")}</a>}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                {provShown.length > provCapped.length && (
                  <button type="button" onClick={() => setProvShowAll(true)} className="w-full rounded-xl px-3 py-2 text-[12px] font-semibold text-matchup hover:bg-matchup/[0.06]">{t("tour.svcShowAll", { n: provShown.length })}</button>
                )}
                {provShowAll && provShown.length > 3 && (
                  <button type="button" onClick={() => setProvShowAll(false)} className="w-full rounded-xl px-3 py-2 text-[12px] font-semibold text-neutral-500 hover:bg-black/[0.03]">{t("tour.svcShowLess")}</button>
                )}
              </div>
            </>
          )}
        </section>

        </>
        )}

        {activeTab === "booking" && (
        <>
        {/* Buchen — Deep-Links. Funktionieren IMMER (auch ohne Live-Preis) und sind der
            eigentliche Nutzen. Bewusst KEIN „Live-Preise"-Titel mehr. */}
        <section>
          <p className="text-[13px] font-bold uppercase tracking-[0.14em] text-neutral-400">{t("tour.wsBookTitle")}</p>
          <div className="mt-2 space-y-1.5">
            <a href={flightUrl(stop, originCity || undefined)} target="_blank" rel="noopener noreferrer" className={link}><span>✈ {t("tour.wsBookFlights")}</span><span className="text-neutral-400">↗</span></a>
            <a href={hotelUrl(stop)} target="_blank" rel="noopener noreferrer" className={link}><span>🏨 {t("tour.wsBookHotels")}</span><span className="text-neutral-400">↗</span></a>
            <a href={carUrl(stop)} target="_blank" rel="noopener noreferrer" className={link}><span>🚗 {t("tour.wsBookCars")}</span><span className="text-neutral-400">↗</span></a>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-neutral-400">{t("tour.wsBookNote")}</p>
        </section>
        </>
        )}
      </div>

      {chatWith && (
        <TourChatPanel
          meId={viewerId}
          otherId={chatWith.user_id}
          otherName={chatWith.name ?? ""}
          onClose={() => setChatWith(null)}
        />
      )}
    </div>
  );
}
