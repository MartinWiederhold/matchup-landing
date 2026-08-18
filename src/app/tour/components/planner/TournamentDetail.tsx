"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useT, useLocale } from "@/lib/i18n";
import { DeadlineCountdown, ITF_PORTAL, ATP_PORTAL, ATP_APP_IOS, ATP_APP_ANDROID } from "../EntryDeadline";
import InfoHint from "./InfoHint";
import { hotelUrl, flightUrl, carUrl, flightPriceQuery, type LivePrice } from "@/lib/travelpayouts";
import { loadTourPresence, joinTourPresence, leaveTourPresence, contactHref, type TourPresence } from "@/lib/tourPresence";
import { demoPresenceFor, TOUR_PRESENCE_DEMO_ON, type DemoPlayer } from "@/lib/tourPresenceDemo";
import DemoPlayerSheet from "./DemoPlayerSheet";
import TrainingSlots from "./TrainingSlots";
import TournamentDocuments from "./TournamentDocuments";

// Gemeinsame Form der Absichts-Details (echte Präsenz + Beispiel) für die Anzeige-Zeile.
type IntentInfo = {
  looking: boolean; lookingRoom: boolean; surface: string | null;
  partnerLevel: string | null; partnerDays: string[] | null;
  roomFrom: string | null; roomTo: string | null; roomArea: string | null; roomCost: string | null; roomType: string | null;
};
import { loadProvidersNearCoords, type ProviderNear } from "@/lib/services";
import { loadEffectiveVisa, type NatVisaInfo } from "@/lib/tourVisaRequirements";
import { loadTravelDocuments } from "@/lib/tourTravelDocuments";
import { bestDocumentFor, needsDocument } from "@/domain/tour/travelDocMatch";
import { isSchengen } from "@/lib/schengen";
import { countryRegime, regimeFacts } from "@/lib/visa";
import type { TourTravelDocument } from "@/lib/types";
import { setEntryStatus, setFeePaid, logEntryEvent, deleteEntryEvent } from "@/lib/tourSeason";
import { entryHistory } from "@/domain/tour/entryTrend";
import { expectedPoints, toPointsCategory, type PointsRound } from "@/domain/tour/points";
import { tourDeadlines } from "@/domain/tour/deadlines";
import { loadTournamentNote, saveTournamentNote } from "@/lib/tourTournamentNote";
import { loadWildcardContacts } from "@/lib/tourWildcards";
import TourChatPanel from "./TourChatPanel";
import type { TourTournament, TourCostRates, TourEntryStatus, TourEntryEvent } from "@/lib/types";

// Entry-Status-Auswahl im Editor: der Lebenszyklus ohne die Legacy-Codes.
const ENTRY_STATUS_OPTS: TourEntryStatus[] = ["planned", "entered", "main_draw", "qualifying", "alternate", "withdrawn"];

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
  { k: "documents", label: "tour.tabDocuments" },
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
  planId, entryStatus, alternatePosition, feePaid, entryEvents, onEntryChanged,
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
  // Entry-Status des Saisoneintrags (null = nicht in der Saison → keine Status-Zeile).
  planId: string | null;
  entryStatus: TourEntryStatus;
  alternatePosition: number | null;
  feePaid: boolean;
  entryEvents: TourEntryEvent[]; // Beobachtungs-Verlauf dieser Planzeile (chronologisch)
  onEntryChanged: () => void; // nach dem Speichern/Löschen: Parent lädt Plan + Verlauf neu
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
  // Ansichts-Filter der Liste (getrennt vom eigenen Opt-in): wer welche Absicht hat.
  const [hereFilter, setHereFilter] = useState<"all" | "partner" | "room">("all");
  // Detailfelder des eigenen Opt-in (kurzes Formular, alles optional).
  const [pLevel, setPLevel] = useState("");
  const [pDays, setPDays] = useState<string[]>([]);
  const [pSurface, setPSurface] = useState("");
  const [pRoomFrom, setPRoomFrom] = useState("");
  const [pRoomTo, setPRoomTo] = useState("");
  const [pRoomArea, setPRoomArea] = useState("");
  const [pRoomCost, setPRoomCost] = useState("");
  const [pRoomType, setPRoomType] = useState("");
  const [chatWith, setChatWith] = useState<TourPresence | null>(null);
  // Gewählter Beispiel-Spieler → simulierte Profil-/Chat-Vorschau (nichts wird gespeichert).
  const [demoSelected, setDemoSelected] = useState<DemoPlayer | null>(null);

  // ── Fact-Sheet-Notizen des Spielers (eigene Angaben, owner-only) + Direktor-Verweis.
  const [noteOpen, setNoteOpen] = useState(false);
  const [nFee, setNFee] = useState("");
  const [nCurrency, setNCurrency] = useState("EUR");
  const [nCourts, setNCourts] = useState("");
  const [nConditions, setNConditions] = useState("");
  const [nHotel, setNHotel] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteLoaded, setNoteLoaded] = useState(false); // true, sobald geladen (für „leer vs. befüllt")
  const [directorName, setDirectorName] = useState<string | null>(null); // read-only aus tour_wildcard_contact
  useEffect(() => {
    let alive = true;
    setNoteLoaded(false);
    Promise.all([loadTournamentNote(viewerId, tt.id), loadWildcardContacts(viewerId)]).then(([n, wcs]) => {
      if (!alive) return;
      setNFee(n?.fee_amount != null ? String(n.fee_amount) : "");
      setNCurrency(n?.fee_currency || "EUR");
      setNCourts(n?.training_courts ?? "");
      setNConditions(n?.conditions ?? "");
      setNHotel(n?.official_hotel ?? "");
      setDirectorName(wcs.find((w) => w.tournament_id === tt.id)?.director_name ?? null);
      setNoteLoaded(true);
    }).catch(() => { if (alive) setNoteLoaded(true); });
    return () => { alive = false; };
  }, [tt.id, viewerId]);
  const saveNote = async () => {
    setNoteSaving(true);
    try {
      const feeNum = nFee.trim() === "" ? null : Number(nFee.replace(",", "."));
      const nn = (s: string) => (s.trim() === "" ? null : s.trim());
      await saveTournamentNote(viewerId, tt.id, {
        fee_amount: feeNum != null && Number.isFinite(feeNum) ? feeNum : null,
        fee_currency: nn(nCurrency)?.toUpperCase().slice(0, 3) ?? null,
        training_courts: nn(nCourts), conditions: nn(nConditions), official_hotel: nn(nHotel),
      });
      setNoteOpen(false);
    } finally {
      setNoteSaving(false);
    }
  };
  const hasNote = !!(nFee.trim() || nCourts.trim() || nConditions.trim() || nHotel.trim());
  const [activeTab, setActiveTab] = useState<DetailTab>("overview");

  // ── Entry-Status-Editor (nur in der Saison). Anfangswerte aus den Props; die Komponente
  // ist per key=tt.id gemountet, daher ist das Seed-once korrekt. Beim Speichern wird IMMER
  // automatisch ein Event geschrieben (Verlauf ohne Zutun) — „Stand vom" bleibt änderbar.
  const [entryOpen, setEntryOpen] = useState(false);
  const [histOpen, setHistOpen] = useState(false);
  const [eStatus, setEStatus] = useState<TourEntryStatus>(entryStatus);
  const [ePos, setEPos] = useState<string>(alternatePosition != null ? String(alternatePosition) : "");
  const [eObserved, setEObserved] = useState<string>(new Date(nowMs).toISOString().slice(0, 10));
  const [eFee, setEFee] = useState<boolean>(feePaid);
  const [eNote, setENote] = useState<string>("");
  const [savingEntry, setSavingEntry] = useState(false);
  const saveEntry = async () => {
    if (!planId) return;
    setSavingEntry(true);
    try {
      const pos = eStatus === "alternate" && parseInt(ePos, 10) > 0 ? parseInt(ePos, 10) : null;
      await setEntryStatus(planId, eStatus, pos);                                   // aktuellen Stand an die Planzeile
      await logEntryEvent(viewerId, planId, { status: eStatus, alternatePosition: pos, observedAt: eObserved || undefined, note: eNote }); // AUTO-Event → Verlauf
      if (eFee !== feePaid) await setFeePaid(planId, eFee);
      onEntryChanged();
      setEntryOpen(false);
    } finally {
      setSavingEntry(false);
    }
  };
  // Append-only: eine Fehl-Beobachtung LÖSCHEN (nicht ändern). Danach Parent neu laden.
  const delObs = async (id: string) => { await deleteEntryEvent(id); onEntryChanged(); };

  // ── Schnell-Melden: der häufigste Übergang (geplant → gemeldet) mit EINEM Klick, statt den
  // Editor zu öffnen. Schreibt den Status 'entered' an die Planzeile UND ein Verlaufs-Event.
  const [quickBusy, setQuickBusy] = useState(false);
  const isEnteredLike = (s: TourEntryStatus) => s === "entered" || s === "main_draw" || s === "qualifying" || s === "confirmed";
  const quickEnter = async () => {
    if (!planId) return;
    setQuickBusy(true);
    try {
      await setEntryStatus(planId, "entered", null);
      await logEntryEvent(viewerId, planId, { status: "entered", observedAt: new Date(nowMs).toISOString().slice(0, 10) });
      onEntryChanged();
    } finally {
      setQuickBusy(false);
    }
  };
  const openEntryEditor = () => { setActiveTab("overview"); setEntryOpen(true); };
  // Gebühr fällig-Warnung nur, wenn wirklich gemeldet (nicht bei geplant/zurückgezogen).
  const feeDue = !!planId && !feePaid && (entryStatus === "entered" || entryStatus === "main_draw" || entryStatus === "qualifying" || entryStatus === "alternate");
  useEffect(() => {
    let alive = true;
    loadTourPresence(tt.id).then((rows) => {
      if (!alive) return;
      setPresence(rows);
      const mine = rows.find((r) => r.user_id === viewerId);
      if (mine) {
        setPContact(mine.contact ?? ""); setPPartner(mine.looking); setPRoom(mine.looking_room);
        setPLevel(mine.partner_level ?? ""); setPDays(mine.partner_days ?? []); setPSurface(mine.surface ?? "");
        setPRoomFrom(mine.room_from ?? ""); setPRoomTo(mine.room_to ?? ""); setPRoomArea(mine.room_area ?? "");
        setPRoomCost(mine.room_cost ?? ""); setPRoomType(mine.room_type ?? "");
      }
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
    await joinTourPresence(viewerId, tt.id, { name: viewerName, rankLabel: viewerRank, nationality: viewerNationality }, pPartner, pRoom, pContact, {
      surface: pSurface || null, partnerLevel: pLevel || null, partnerDays: pDays,
      roomFrom: pRoomFrom || null, roomTo: pRoomTo || null, roomArea: pRoomArea || null, roomCost: pRoomCost || null, roomType: pRoomType || null,
    });
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

  // Eigene Reisedokumente des Nutzers (owner-only). Zuordnung zum Turnierland über den
  // Geltungsbereich (Land/Schengen-Raum), nicht über die Art — siehe travelDocMatch.
  const [travelDocs, setTravelDocs] = useState<TourTravelDocument[]>([]);
  useEffect(() => {
    let alive = true;
    loadTravelDocuments(viewerId).then((d) => { if (alive) setTravelDocs(d); }).catch(() => { if (alive) setTravelDocs([]); });
    return () => { alive = false; };
  }, [viewerId]);
  const destIsSchengen = isSchengen(countryName);
  const myDoc = tt.country && visaInfo ? bestDocumentFor(travelDocs, tt.country, destIsSchengen) : null;

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
  // Kompaktes Beobachtungsdatum (ISO-Tag, UTC) für die Verlaufsliste.
  const fmtObsDate = (iso: string) => new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short", timeZone: "UTC" }).format(new Date(iso + "T00:00:00Z"));

  // Flugpreis (Zahl oder null). "loading" → null → keine Zeile (kein Platzhalter, kein Hinweis).
  const flightPrice = price === "loading" ? null : price.price;

  // ── Kompakter Übersicht-Reiter: alles Erklärende wandert hinter „i". ──────────────
  // Weg zur Meldung: dieselben belegten Adressen wie EntryPath (geteilt), nur kompakt.
  const isItf = tt.series === "itf_wtt";
  const portalUrl = isItf ? ITF_PORTAL : ATP_PORTAL;
  const portalLabel = isItf ? t("tour.entryPortalItf") : t("tour.entryPortalAtp");
  const noteCls = "font-semibold text-neutral-500 underline";
  const entryHint = (
    <>
      {/* Turnierseite (aktuell nirgends gepflegt → erscheint nie) bleibt erreichbar. */}
      {tt.website && <p><a href={tt.website} target="_blank" rel="noopener noreferrer" className={noteCls}>{t("tour.entryWebsite")} →</a></p>}
      {isItf ? (
        <p className={tt.website ? "mt-1" : ""}>{t("tour.entryPortalItfNote")}</p>
      ) : (
        <>
          <p className={tt.website ? "mt-1" : ""}>{t("tour.entryPortalAtpNote")}</p>
          <p className="mt-1">
            <a href={ATP_APP_IOS} target="_blank" rel="noopener noreferrer" className={noteCls}>{t("tour.entryAtpAppIos")}</a>
            {" · "}
            <a href={ATP_APP_ANDROID} target="_blank" rel="noopener noreferrer" className={noteCls}>{t("tour.entryAtpAppAndroid")}</a>
          </p>
        </>
      )}
    </>
  );
  // Datenstand + Quelle + Konsulats-Vorbehalt (nur wenn eine Angabe vorliegt).
  const visaProvInner = visaInfo && (
    <>
      <p>{t("mode.visaNatSource", { date: visaInfo.sourceRevisedAt ? fmtDay(visaInfo.sourceRevisedAt.slice(0, 10)) : "—" })} · <a href={visaInfo.sourceUrl} target="_blank" rel="noopener noreferrer" className={noteCls}>{t("mode.visaNatSourceLink")}</a></p>
      <p className="mt-1 font-semibold text-neutral-500">{t("mode.visaNatConsulate")}</p>
    </>
  );
  // Einreise als EIN Wort + Grund/Details hinter „i". „Keine Angabe" ist NEUTRAL (grau,
  // keine Wertung, kein Fehler) — der häufigste Fall; der Grund steht im „i".
  let visaWord: string;
  let visaWordNeutral = false;
  let visaHint: ReactNode;
  if (visa === "loading") {
    visaWord = "…"; visaWordNeutral = true; visaHint = <p>{t("tour.loading")}</p>;
  } else if (viewerPassports.length === 0) {
    visaWord = t("tour.wsVisaNone"); visaWordNeutral = true; visaHint = <p>{t("tour.wsVisaNoPassInfo")}</p>;
  } else if (!visaInfo) {
    visaWord = t("tour.wsVisaNone"); visaWordNeutral = true; visaHint = <p>{t("tour.wsVisaNoComboInfo")}</p>;
  } else {
    visaWord = t(`mode.visaNatClass_${visaInfo.requirementClass}`);
    visaHint = (
      <>
        <p>{t("mode.visaNatForPassport", { nat: visaInfo.nationality })}{visaInfo.allowedStayDays != null ? ` · ${t("mode.visaNatStay", { n: visaInfo.allowedStayDays })}` : ""}</p>
        {visaProvInner}
      </>
    );
  }

  // Eigener Dokument-Stand für dieses Turnierland — nur bei Klassen, die ein Dokument brauchen.
  // „du hast eins bis …" / „beantragt" / „noch nicht beantragt" (+ Antragslink).
  const showDocLine = !!visaInfo && needsDocument(visaInfo.requirementClass);
  const todayDocIso = new Date(nowMs).toISOString().slice(0, 10);
  // Antragslink: zielland-basiertes Regime aus visa.ts; sonst die Bestand-Quelle (Konsulat prüfen).
  const applyUrl = (countryName && regimeFacts(countryRegime(countryName)).officialUrl) || visaInfo?.sourceUrl || "";
  let docNode: ReactNode = null;
  if (showDocLine) {
    if (myDoc && myDoc.status === "have") {
      const expired = myDoc.valid_until ? myDoc.valid_until < todayDocIso : false;
      docNode = <p className={`mt-1 text-[12px] font-semibold ${expired ? "text-amber-700" : "text-emerald-700"}`}>{myDoc.valid_until ? t("tour.wsDocHave", { date: fmtDay(myDoc.valid_until) }) : t("tour.wsDocHaveNoDate")}</p>;
    } else if (myDoc && myDoc.status === "applied") {
      docNode = <p className="mt-1 text-[12px] text-neutral-500">{t("tour.wsDocApplied")}</p>;
    } else {
      docNode = (
        <p className="mt-1 text-[12px] text-neutral-500">
          {t("tour.wsDocNone")}
          {applyUrl && <> · <a href={applyUrl} target="_blank" rel="noopener noreferrer" className={noteCls}>{t("tour.wsDocApply")} ↗</a></>}
        </p>
      );
    }
  }

  const link = "flex items-center justify-between rounded-xl border border-black/10 px-3 py-2.5 text-[13px] font-semibold text-neutral-800 transition-colors hover:bg-black/[0.03]";

  // Pill-Tönung je Status (dezent, kein Alarmrot): angenommen = grün, Alternate = bernstein,
  // zurückgezogen = grau/durchgestrichen, geplant = neutral.
  const entryPillClass = (s: TourEntryStatus) =>
    s === "main_draw" || s === "entered" || s === "qualifying" || s === "confirmed" ? "bg-emerald-500/10 text-emerald-700"
    : s === "alternate" ? "bg-amber-500/10 text-amber-700"
    : s === "withdrawn" || s === "cancelled" ? "bg-black/[0.05] text-neutral-500 line-through"
    : "bg-black/[0.05] text-neutral-600";
  const entryWord = `${t(`tour.status_${entryStatus}`)}${entryStatus === "alternate" && alternatePosition != null ? ` #${alternatePosition}` : ""}`;
  const inp2 = "w-full rounded-lg border border-black/15 bg-white px-2.5 py-1.5 text-[13px] text-neutral-900 placeholder:text-neutral-400 focus:border-black/30 focus:outline-none";

  // ── „Vor Ort": aus den zwei Absichten LESBARE Aussagen bilden — „Sucht Trainingspartner",
  // „Sucht Unterkunft in {Stadt}". Bild + Name kommen aus dem Profil (Punkt 1: Name liegt in
  // player_presence, das Bild wird per user_id aus profiles verknüpft; fehlt es → Monogramm).
  // Ein „bis TT.MM."-Datum gibt es in player_presence NICHT → wird bewusst nicht behauptet.
  const seekText = (looking: boolean, room: boolean): string => {
    const parts: string[] = [];
    if (looking) parts.push(t("tour.wsSeekPartnerStmt"));
    if (room) parts.push(t("tour.wsSeekRoomStmt", { city: tt.city || countryName }));
    return parts.length ? parts.join(" · ") : t("tour.wsHerePresent");
  };
  const avatarEl = (src: string | null, name: string | null) =>
    src ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt="" loading="lazy" decoding="async" className="h-10 w-10 shrink-0 rounded-full bg-neutral-100 object-cover" />
    ) : (
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-[15px] font-bold text-neutral-500">{(name || "?").slice(0, 1).toUpperCase()}</span>
    );

  // ── Lesbare Detail-Zeile zu den Absichten (statt bloßem „Sucht Unterkunft"). ────────────
  const fmtShort = (iso: string | null) => (iso ? new Intl.DateTimeFormat(locale, { day: "2-digit", month: "2-digit", timeZone: "UTC" }).format(new Date(iso + "T00:00:00Z")) : "");
  const roomTypeLabel = (r: string | null) => (r ? t(`tour.roomType_${r}`) : "");
  const intentLine = (x: IntentInfo): string => {
    const parts: string[] = [];
    if (x.looking) {
      // „Wann" (partner_days als Freitext). KEIN Belag/Niveau mehr.
      const when = (x.partnerDays ?? []).join(" · ");
      parts.push(t("tour.wsSeekPartnerStmt") + (when ? ` · ${when}` : ""));
    }
    if (x.lookingRoom) {
      const detail = [x.roomArea || tt.city || countryName, x.roomFrom && x.roomTo ? `${fmtShort(x.roomFrom)}–${fmtShort(x.roomTo)}` : "", roomTypeLabel(x.roomType)].filter(Boolean).join(", ");
      parts.push(t("tour.wsSeekRoomIn", { detail }));
    }
    return parts.length ? parts.join(" · ") : t("tour.wsHerePresent");
  };
  const realIntent = (r: TourPresence): IntentInfo => ({ looking: r.looking, lookingRoom: r.looking_room, surface: r.surface, partnerLevel: r.partner_level, partnerDays: r.partner_days, roomFrom: r.room_from, roomTo: r.room_to, roomArea: r.room_area, roomCost: r.room_cost, roomType: r.room_type });
  const demoIntent = (d: DemoPlayer): IntentInfo => ({ looking: d.looking, lookingRoom: d.lookingRoom, surface: d.surface, partnerLevel: d.partnerLevel, partnerDays: d.partnerDays, roomFrom: d.roomFrom, roomTo: d.roomTo, roomArea: d.roomArea, roomCost: d.roomCost, roomType: d.roomType });

  // Filter der Liste (Alle/Partner/Mitbewohner) — getrennt vom eigenen Opt-in.
  const filterMatch = (looking: boolean, room: boolean) => hereFilter === "all" || (hereFilter === "partner" && looking) || (hereFilter === "room" && room);
  const othersShown = others.filter((r) => filterMatch(r.looking, r.looking_room));
  const demoAll = TOUR_PRESENCE_DEMO_ON ? demoPresenceFor(tt.id, tt.category, tt.tournament_monday) : [];
  const demoShown = demoAll.filter((d) => filterMatch(d.looking, d.lookingRoom));
  const selCls = "w-full rounded-lg border border-black/15 bg-white px-2.5 py-1.5 text-[13px] text-neutral-900 focus:border-black/30 focus:outline-none";

  // ── Punkte je Runde aus points.ts (belegt, ATP-Regelwerk). Nur wenn die Kategorie erkannt
  //    ist; sonst Hinweis statt Nullen. Erstrunde (R32) = 0 bei Challenger/ITF → bewusst gezeigt.
  const POINTS_ROUNDS: PointsRound[] = ["W", "F", "SF", "QF", "R16"];
  // Kurze Labels (Sieg/F/HF/VF/AF) für die EINE-Zeile-Darstellung — die Punkte sind eine
  // Aufzählung, keine Auswahl; als Zeile liest es sich schneller als in zwei Pillen-Reihen.
  const roundPts = toPointsCategory(tt.category)
    ? POINTS_ROUNDS.map((code) => ({ code, label: t(`tour.ovRnd_${code}`), points: expectedPoints(tt.category, code, tt.tournament_monday).points }))
    : null;

  // Meldefrist prominent (groß) NUR bei echtem Countdown. Die große Darstellung war für den
  // laufenden Countdown gedacht — nicht für ein „unbekannt" (Challenger) oder „abgelaufen".
  const dl = tourDeadlines(new Date(tt.tournament_monday + "T00:00:00Z"), tt.series);
  const hasCountdown = dl.known && !!dl.entry && dl.entry.getTime() > nowMs;

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
            {/* Belag NICHT mehr als Chip hier — er steht jetzt als eigene Zeile im Übersicht-
                Reiter (mit drinnen/draußen), dort ist er nicht doppelt. */}
            {tt.category && <span className="rounded-full bg-matchup/10 px-2.5 py-0.5 text-[11px] font-bold text-matchup">{tt.category}</span>}
          </div>
        </div>

        {/* HAUPTAKTION direkt unter dem Titel. Nicht in der Saison → aufnehmen. In der Saison →
            der MELDE-Knopf: geplant → prominenter „Melden" (ein Klick = Status 'entered'), danach
            grün „Gemeldet"; andere Stände öffnen den Editor. Darunter eine schlanke „Entfernen"-Zeile. */}
        {!inSeason ? (
          <button type="button" onClick={onToggle} className="w-full rounded-2xl bg-matchup px-5 py-3.5 text-[15px] font-bold text-white shadow-sm transition-colors hover:bg-matchup-hover">
            {t("tour.wsDetailAdd")}
          </button>
        ) : (
          <div className="space-y-2">
            {planId && entryStatus === "planned" ? (
              <button type="button" onClick={quickEnter} disabled={quickBusy} className="w-full rounded-2xl bg-matchup px-5 py-3.5 text-[15px] font-bold text-white shadow-sm transition-colors hover:bg-matchup-hover disabled:opacity-60">
                {quickBusy ? t("tour.wsFilling") : t("tour.wsReportCta")}
              </button>
            ) : planId && isEnteredLike(entryStatus) ? (
              <button type="button" onClick={openEntryEditor} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500/10 px-5 py-3.5 text-[15px] font-bold text-emerald-700 ring-1 ring-emerald-500/20 transition-colors hover:bg-emerald-500/15">
                <span aria-hidden>✓</span>{t("tour.wsReportedCta")}{entryStatus !== "entered" ? ` · ${t(`tour.status_${entryStatus}`)}` : ""}
              </button>
            ) : planId ? (
              // alternate / withdrawn / cancelled → aktuellen Stand zeigen; Klick öffnet den Editor.
              <button type="button" onClick={openEntryEditor} className={`flex w-full items-center justify-center rounded-2xl px-5 py-3 text-[14px] font-bold ring-1 ${entryStatus === "alternate" ? "bg-amber-500/10 text-amber-700 ring-amber-500/20" : "bg-black/[0.04] text-neutral-500 ring-black/10"}`}>
                {entryWord}
              </button>
            ) : null}
            <div className="flex items-center justify-between gap-3 px-1 text-[12px]">
              <span className="flex items-center gap-1.5 text-neutral-400"><span aria-hidden>✓</span>{t("tour.wsDetailInSeason")}</span>
              <button type="button" onClick={onToggle} className="shrink-0 font-semibold text-neutral-400 hover:text-neutral-700">{t("tour.wsDetailRemove")}</button>
            </div>
          </div>
        )}

        {/* Reiter — fünf Pills: auf Desktop füllen sie gleichmäßig (flex-1), auf schmalem
            Schirm (≈390 px) verhindert min-w-fit das Abschneiden und die Leiste scrollt
            horizontal statt umzubrechen (bewusst: scrollen, nicht zusammenlegen). */}
        <div className="flex gap-1 overflow-x-auto rounded-full bg-black/[0.04] p-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {DETAIL_TABS.map((tab) => (
            <button key={tab.k} type="button" onClick={() => setActiveTab(tab.k)} className={`min-w-fit flex-1 whitespace-nowrap rounded-full px-2.5 py-1.5 text-[12px] font-bold transition-colors ${activeTab === tab.k ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-800"}`}>
              {t(tab.label)}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
        // Gruppiert: erst TURNIER-FAKTEN (Belag, Punkte je Runde), dann MEIN STAND (Entry-
        // Status, Gebühr, Frist), dann REFERENZ (Kosten, Einreise, Weg zur Meldung, Notizen).
        // Alles Erklärende hinter „i". Eine Einreisesperre bleibt sichtbar (rot).
        <div className="divide-y divide-black/[0.06]">

          {/* ── TURNIER-FAKTEN ───────────────────────────────────────────────────────────── */}
          {/* Belag — aus dem Bestand (tour_tournaments), mit drinnen/draußen falls bekannt. */}
          {tt.surface && (
            <div className="flex items-center justify-between gap-3 py-2.5">
              <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">{t("tour.ovSurfaceTitle")}</span>
              <span className="text-[13px] font-semibold text-neutral-700">{t(`tour.surface_${tt.surface}`)}{tt.indoor != null ? ` · ${tt.indoor ? t("tour.ovIndoor") : t("tour.ovOutdoor")}` : ""}</span>
            </div>
          )}

          {/* Punkte je Runde — belegt aus points.ts (ATP-Regelwerk). EINE Zeile (Aufzählung,
              keine Auswahl). Erstrunde = 0 bleibt SICHTBAR in derselben Zeile (der ehrliche
              Teil), nicht hinter dem „i". */}
          <div className="py-2.5">
            <span className="flex items-center text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">
              {t("tour.ovPointsTitle")}
              <InfoHint label={t("tour.ovPointsInfo")}><p>{t("tour.ovPointsInfo")}</p></InfoHint>
            </span>
            {roundPts ? (
              <p className="mt-1 text-[12px] leading-relaxed text-neutral-700">
                {roundPts.map((r) => `${r.label} ${r.points}`).join(" · ")} <span className="text-neutral-400">· {t("tour.ovFirstRoundLine")}</span>
              </p>
            ) : (
              <p className="mt-1 text-[12px] text-neutral-400">{t("tour.ovPointsUnknownCat")}</p>
            )}
          </div>

          {/* ── MEIN STAND ───────────────────────────────────────────────────────────────── */}
          {/* Entry-Status — nur in der Saison (dann existiert eine Planzeile). Der Kern des
              Management-Werkzeugs: wo stehe ich? Bearbeiten öffnet den Editor darunter. */}
          {planId && (
            <div className="py-2.5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">{t("tour.wsEntryStatusLabel")}</span>
                <div className="flex items-center gap-2.5">
                  {entryEvents.length > 0 && (
                    <button type="button" onClick={() => setHistOpen((o) => !o)} className={`text-[11px] font-semibold ${histOpen ? "text-matchup" : "text-neutral-400 hover:text-neutral-700"}`}>{t("tour.wsEntryHistory")} ({entryEvents.length})</button>
                  )}
                  <button type="button" onClick={() => setEntryOpen((o) => !o)} className="flex items-center gap-1.5">
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${entryPillClass(entryStatus)}`}>{entryWord}</span>
                    <svg viewBox="0 0 24 24" aria-hidden className="h-3.5 w-3.5 text-neutral-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>
                  </button>
                </div>
              </div>

              {/* Verlauf — chronologisch, neueste zuerst; Abstände zeigen das Tempo. Jede
                  Beobachtung löschbar (append-only: nur löschen, nicht ändern). */}
              {histOpen && (
                <ul className="mt-2 space-y-1 rounded-xl border border-black/10 bg-black/[0.02] p-2.5">
                  {entryHistory(entryEvents.map((e) => ({ id: e.id, observedAt: e.observed_at, status: e.status, alternatePosition: e.alternate_position, note: e.note }))).map((r) => (
                    <li key={r.id} className="flex items-start justify-between gap-2 text-[12px]">
                      <span className="min-w-0">
                        <span className="font-semibold text-neutral-700">{fmtObsDate(r.observedAt)}</span>
                        <span className="text-neutral-500"> · {t(`tour.status_${r.status}`)}{r.status === "alternate" && r.alternatePosition != null ? ` #${r.alternatePosition}` : ""}</span>
                        {r.gapDays != null && <span className="text-neutral-400"> · {r.gapDays === 0 ? t("tour.wsEntryGapSameDay") : t("tour.wsEntryGapDays", { n: r.gapDays })}</span>}
                        {r.note && <span className="block truncate text-[11px] text-neutral-400">{r.note}</span>}
                      </span>
                      <button type="button" onClick={() => delObs(r.id)} aria-label={t("tour.wsEntryDelete")} className="shrink-0 text-neutral-300 transition-colors hover:text-red-500">✕</button>
                    </li>
                  ))}
                </ul>
              )}

              {entryOpen && (
                <div className="mt-2 space-y-2.5 rounded-xl border border-black/10 bg-black/[0.02] p-3">
                  {/* Status-Auswahl */}
                  <div className="flex flex-wrap gap-1.5">
                    {ENTRY_STATUS_OPTS.map((s) => (
                      <button key={s} type="button" onClick={() => setEStatus(s)} className={`rounded-full px-3 py-1.5 text-[12px] font-semibold ring-1 ${eStatus === s ? "bg-matchup text-white ring-matchup" : "bg-white text-neutral-700 ring-black/10 hover:bg-black/[0.03]"}`}>{t(`tour.status_${s}`)}</button>
                    ))}
                  </div>
                  {/* Position nur bei Alternate */}
                  {eStatus === "alternate" && (
                    <label className="flex items-center gap-2 text-[12px] font-semibold text-neutral-600">{t("tour.wsEntryPosition")}
                      <input type="number" min={1} value={ePos} onChange={(e) => setEPos(e.target.value)} className="w-24 rounded-lg border border-black/15 bg-white px-2.5 py-1.5 text-[13px] focus:border-black/30 focus:outline-none" />
                    </label>
                  )}
                  {/* Stand vom (bleibt änderbar — Nachtrag möglich) + Gebühr */}
                  <div className="grid grid-cols-2 gap-2">
                    <label className="block text-[12px] font-semibold text-neutral-600">{t("tour.wsEntryObservedAt")}
                      <input type="date" value={eObserved} onChange={(e) => setEObserved(e.target.value)} className={`mt-1 ${inp2}`} />
                    </label>
                    <label className="flex items-end gap-2 pb-1.5 text-[12px] text-neutral-700">
                      <input type="checkbox" checked={eFee} onChange={(e) => setEFee(e.target.checked)} className="h-4 w-4 accent-matchup" />{t("tour.wsEntryFeePaid")}
                    </label>
                  </div>
                  <input value={eNote} onChange={(e) => setENote(e.target.value)} placeholder={t("tour.wsEntryNote")} className={inp2} />
                  <p className="text-[11px] leading-relaxed text-neutral-400">{t("tour.wsEntryHint")}</p>
                  <button type="button" onClick={saveEntry} disabled={savingEntry} className="w-full rounded-full bg-matchup py-2 text-[13px] font-bold text-white transition-colors hover:bg-matchup-hover disabled:opacity-50">
                    {savingEntry ? t("tour.wsFilling") : t("tour.wsEntrySet")}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Meldegebühr offen — sichtbare Warnung (nur wenn gemeldet + unbezahlt). Ein
              verfallener Startplatz wegen vergessener Gebühr ist genau der Fehler, den das
              Werkzeug verhindern soll. Tippen öffnet den Editor (dort abhaken). */}
          {feeDue && (
            <button type="button" onClick={() => setEntryOpen(true)} className="flex w-full items-center gap-1.5 py-2.5 text-left text-[12px] font-semibold text-amber-700">
              <span aria-hidden>⚠</span>{t("tour.wsFeeUnpaid")}<span className="font-normal text-amber-700/80">· {t("tour.wsFeeUnpaidHint")}</span>
            </button>
          )}

          {/* Meldefrist (mein Stand) — GROSS nur bei echtem Countdown; sonst normale Zeile.
              Grund: die Prominenz war für den laufenden Countdown gedacht, nicht für ein
              „unbekannt" (Challenger) oder „abgelaufen". */}
          <div className={`flex items-center justify-between gap-3 ${hasCountdown ? "py-3" : "py-2.5"}`}>
            <span className={hasCountdown ? "text-[12px] font-bold uppercase tracking-[0.1em] text-neutral-600" : "text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400"}>{t("tour.wsDetailDeadline")}</span>
            <DeadlineCountdown tournament={tt} now={nowMs} size={hasCountdown ? "lg" : "sm"} />
          </div>

          {/* 2) Wochenkosten — Live-Flugpreis + Hinweis auf fehlende Sätze hinter „i" */}
          <div className="flex items-center justify-between gap-3 py-2.5">
            <span className="flex items-center text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">
              {t("tour.wsWeekCostLabel")}
              {(flightPrice != null || !ratesDone) && (
                <InfoHint label={t("tour.wsCostInfo")}>
                  {flightPrice != null && <p>✈ {t("tour.wsFlightLine", { origin: originLabel ?? "", amount: fmtEUR(flightPrice), date: fmtStand(nowMs) })}</p>}
                  {!ratesDone && <p className={flightPrice != null ? "mt-1" : ""}>{t("tour.wsWeekCostNoRates")}</p>}
                </InfoHint>
              )}
            </span>
            <span className="text-[13px] font-semibold text-neutral-700">{ratesDone ? t("tour.wsWeekCostValue", { amount: fmtCur(weekMinor, rates!.currency ?? "EUR") }) : "—"}</span>
          </div>

          {/* 3) Einreise — EIN Wort. AUSNAHME: Sperre bleibt sichtbar & deutlich (rot). */}
          {tt.country && (
            visaInfo && visaInfo.requirementClass === "admission_refused" ? (
              <div className="py-2.5">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">{t("tour.wsVisaTitle")}</span>
                  <span className="shrink-0 rounded-full bg-red-500/10 px-2.5 py-0.5 text-[11px] font-bold text-red-600">{t("mode.visaNatClass_admission_refused")}</span>
                </div>
                <p className="mt-1 text-[12px] leading-relaxed text-red-700">
                  {t("mode.visaNatRefusedBody", { nat: visaInfo.nationality, country: countryName })}
                  <InfoHint label={t("tour.wsVisaInfo")}>{visaProvInner}</InfoHint>
                </p>
              </div>
            ) : (
              <div className="py-2.5">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">
                    {t("tour.wsVisaTitle")}
                    <InfoHint label={t("tour.wsVisaInfo")}>{visaHint}</InfoHint>
                  </span>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${visaWordNeutral ? "bg-black/[0.05] text-neutral-500" : "bg-matchup/10 text-matchup"}`}>{visaWord}</span>
                </div>
                {docNode}
              </div>
            )
          )}

          {/* 4) Weg zur Meldung — schlichter Link; App-Erklärung/Links hinter „i" */}
          <div className="flex items-center justify-between gap-3 py-2.5">
            <span className="flex items-center text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">
              {t("tour.entryPathTitle")}
              <InfoHint label={t("tour.wsEntryInfo")}>{entryHint}</InfoHint>
            </span>
            <a href={portalUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 text-[13px] font-semibold text-matchup hover:underline">{portalLabel} →</a>
          </div>

          {/* ── MEINE NOTIZEN (Fact Sheet) — EIGENE Angaben des Spielers, klar getrennt von den
              Bestandsdaten darüber (Selbstauskunft, keine amtlichen Daten). ─────────────────── */}
          <div className="py-2.5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">{t("tour.ovNotesTitle")}</span>
              <button type="button" onClick={() => setNoteOpen((o) => !o)} className="text-[11px] font-semibold text-matchup hover:underline">{hasNote ? t("tour.ovNotesEdit") : t("tour.ovNotesAdd")}</button>
            </div>
            <p className="mt-0.5 text-[11px] text-neutral-400">{t("tour.ovNotesHint")}</p>

            {/* Anzeige: nur befüllte Felder, gestrichelte Karte + „Eigene Notiz"-Merkmal. */}
            {!noteOpen && hasNote && (
              <div className="mt-2 space-y-1 rounded-xl border border-dashed border-black/15 bg-black/[0.015] p-2.5">
                <span className="inline-flex items-center rounded-full bg-black/[0.05] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-neutral-500">{t("tour.ovNotesBadge")}</span>
                {nFee.trim() && <p className="text-[12px] text-neutral-700"><span className="text-neutral-400">{t("tour.ovNoteFee")}: </span>{nFee} {nCurrency}</p>}
                {nCourts.trim() && <p className="text-[12px] text-neutral-700"><span className="text-neutral-400">{t("tour.ovNoteCourts")}: </span>{nCourts}</p>}
                {nConditions.trim() && <p className="text-[12px] text-neutral-700"><span className="text-neutral-400">{t("tour.ovNoteConditions")}: </span>{nConditions}</p>}
                {nHotel.trim() && <p className="text-[12px] text-neutral-700"><span className="text-neutral-400">{t("tour.ovNoteHotel")}: </span>{nHotel}</p>}
              </div>
            )}
            {!noteOpen && !hasNote && noteLoaded && <p className="mt-1 text-[12px] text-neutral-400">{t("tour.ovNotesEmpty")}</p>}

            {/* Turnierdirektor read-only aus tour_wildcard_contact (getrennt gepflegt). */}
            {directorName && (
              <p className="mt-2 text-[12px] text-neutral-500">{t("tour.ovNoteDirector")}: <span className="font-semibold text-neutral-700">{directorName}</span> · <a href="/tour/wildcards" className="font-semibold text-matchup hover:underline">{t("tour.wildcardsOpen")} →</a></p>
            )}

            {/* Bearbeiten — kurzes Formular. */}
            {noteOpen && (
              <div className="mt-2 space-y-2 rounded-xl border border-black/10 bg-black/[0.02] p-3">
                <div className="grid grid-cols-3 gap-2">
                  <label className="col-span-2 block"><span className="mb-1 block text-[11px] font-semibold text-neutral-500">{t("tour.ovNoteFee")}</span>
                    <input value={nFee} onChange={(e) => setNFee(e.target.value)} inputMode="decimal" placeholder="40" className={selCls} /></label>
                  <label className="block"><span className="mb-1 block text-[11px] font-semibold text-neutral-500">{t("tour.ovNoteCurrency")}</span>
                    <input value={nCurrency} onChange={(e) => setNCurrency(e.target.value.toUpperCase().slice(0, 3))} className={selCls} /></label>
                </div>
                <label className="block"><span className="mb-1 block text-[11px] font-semibold text-neutral-500">{t("tour.ovNoteCourts")}</span>
                  <input value={nCourts} onChange={(e) => setNCourts(e.target.value)} placeholder={t("tour.ovNoteCourtsPh")} className={selCls} /></label>
                <label className="block"><span className="mb-1 block text-[11px] font-semibold text-neutral-500">{t("tour.ovNoteConditions")}</span>
                  <input value={nConditions} onChange={(e) => setNConditions(e.target.value)} placeholder={t("tour.ovNoteConditionsPh")} className={selCls} /></label>
                <label className="block"><span className="mb-1 block text-[11px] font-semibold text-neutral-500">{t("tour.ovNoteHotel")}</span>
                  <input value={nHotel} onChange={(e) => setNHotel(e.target.value)} className={selCls} /></label>
                <button type="button" onClick={saveNote} disabled={noteSaving} className="w-full rounded-full bg-matchup py-2 text-[13px] font-bold text-white transition-colors hover:bg-matchup-hover disabled:opacity-50">{noteSaving ? t("tour.wsFilling") : t("tour.ovNotesSave")}</button>
              </div>
            )}
          </div>

        </div>
        )}

        {activeTab === "onsite" && (
        <>
        {/* Wer ist hier? — Opt-in-Präsenz (freiwillig, selbst gewählter Kontakt). */}
        <section>
          <p className="text-[13px] font-bold uppercase tracking-[0.14em] text-neutral-400">{t("tour.wsHereTitle")}{presence ? ` · ${presence.length}` : ""}</p>

          {/* Eigene Eintragung (Opt-in): zwei Absichten + Kontakt, PLUS eine Vorschau in genau
              der Form, wie andere dich sehen — damit klar ist, was preisgegeben wird. */}
          <div className="mt-2 rounded-2xl border border-matchup/20 bg-matchup/5 p-3">
            <p className="text-[13px] font-bold text-neutral-800">{meListed ? t("tour.wsHereListed") : t("tour.wsHereAsk")}</p>
            <label className="mt-2 flex items-center gap-2 text-[13px] text-neutral-700">
              <input type="checkbox" checked={pPartner} onChange={(e) => setPPartner(e.target.checked)} className="h-4 w-4 accent-matchup" />{t("tour.wsSeekPartner")}
            </label>
            <label className="mt-1 flex items-center gap-2 text-[13px] text-neutral-700">
              <input type="checkbox" checked={pRoom} onChange={(e) => setPRoom(e.target.checked)} className="h-4 w-4 accent-matchup" />{t("tour.wsSeekRoom")}
            </label>
            <input value={pContact} onChange={(e) => setPContact(e.target.value)} placeholder={t("tour.wsContactPlaceholder")} className="mt-2 w-full rounded-xl border border-black/15 bg-white px-3 py-2 text-[13px] placeholder:text-neutral-400 focus:border-black/30 focus:outline-none" />

            {/* Detailfelder — NUR zur angekreuzten Absicht, alles optional (kurzes Formular). */}
            {/* Partner-Zeiten laufen jetzt über die Trainingsslots (unten), nicht mehr als
                Freitext im Opt-in. */}
            {pRoom && (
              <div className="mt-2 space-y-2 rounded-xl bg-white/70 p-2.5 ring-1 ring-black/5">
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-neutral-400">{t("tour.wsSeekRoom")}</p>
                <div className="grid grid-cols-2 gap-2">
                  <label className="block"><span className="mb-1 block text-[11px] font-semibold text-neutral-500">{t("tour.wsRoomFrom")}</span>
                    <input type="date" value={pRoomFrom} onChange={(e) => setPRoomFrom(e.target.value)} className={selCls} /></label>
                  <label className="block"><span className="mb-1 block text-[11px] font-semibold text-neutral-500">{t("tour.wsRoomTo")}</span>
                    <input type="date" value={pRoomTo} onChange={(e) => setPRoomTo(e.target.value)} className={selCls} /></label>
                </div>
                <label className="block"><span className="mb-1 block text-[11px] font-semibold text-neutral-500">{t("tour.wsRoomArea")}</span>
                  <input value={pRoomArea} onChange={(e) => setPRoomArea(e.target.value)} className={selCls} /></label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="block"><span className="mb-1 block text-[11px] font-semibold text-neutral-500">{t("tour.wsRoomCost")}</span>
                    <input value={pRoomCost} onChange={(e) => setPRoomCost(e.target.value)} placeholder="~40 €/N" className={selCls} /></label>
                  <label className="block"><span className="mb-1 block text-[11px] font-semibold text-neutral-500">{t("tour.wsRoomTypeLabel")}</span>
                    <select value={pRoomType} onChange={(e) => setPRoomType(e.target.value)} className={selCls}><option value="">—</option><option value="room">{t("tour.roomType_room")}</option><option value="apartment">{t("tour.roomType_apartment")}</option></select></label>
                </div>
              </div>
            )}

            {/* Vorschau: so erscheinst du für andere vor Ort. */}
            <div className="mt-3 flex items-center gap-2.5 rounded-xl bg-white px-2.5 py-2 ring-1 ring-black/5">
              {avatarEl(myPresence?.profile_image ?? null, viewerName)}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold text-neutral-900">{viewerName || t("tour.fieldMissing")}</span>
                <span className="block truncate text-[12px] text-neutral-600">{seekText(pPartner, pRoom)}</span>
              </span>
            </div>
            <p className="mt-1 text-[11px] text-neutral-400">{t("tour.wsHerePreviewNote")}</p>

            <div className="mt-2 flex gap-2">
              <button type="button" onClick={joinP} disabled={pBusy} className="flex-1 rounded-full bg-matchup px-3 py-2 text-[12px] font-bold text-white transition-colors hover:bg-matchup-hover disabled:opacity-50">{meListed ? t("tour.wsHereUpdate") : t("tour.wsHereJoin")}</button>
              {meListed && <button type="button" onClick={leaveP} disabled={pBusy} className="rounded-full bg-neutral-100 px-3 py-2 text-[12px] font-semibold text-neutral-500 hover:bg-neutral-200 disabled:opacity-50">{t("tour.wsHereLeave")}</button>}
            </div>
          </div>

          {/* Ansichts-Filter: wer welche Absicht hat (getrennt vom eigenen Opt-in oben). Wirkt
              auf echte UND Beispiel-Einträge. */}
          <div className="mt-3 flex gap-1 rounded-full bg-black/[0.04] p-1">
            {(["all", "partner", "room"] as const).map((f) => (
              <button key={f} type="button" onClick={() => setHereFilter(f)} className={`flex-1 rounded-full px-2 py-1.5 text-[12px] font-bold transition-colors ${hereFilter === f ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-800"}`}>{t(`tour.hereFilter_${f}`)}</button>
            ))}
          </div>

          {/* Andere vor Ort — lesbare Aussage mit Bild und Name statt Häkchen. */}
          {presence == null ? (
            <p className="mt-2 text-[12px] text-neutral-400">{t("tour.loading")}</p>
          ) : othersShown.length === 0 ? (
            <p className="mt-2 text-[12px] text-neutral-400">{t("tour.wsHereEmpty")}</p>
          ) : (
            <div className="mt-2 space-y-1.5">
              {othersShown.map((r) => {
                const href = r.contact ? contactHref(r.contact) : null;
                return (
                  <div key={r.user_id} className="flex items-center gap-2.5 rounded-xl border border-neutral-200 bg-white px-2.5 py-2">
                    {avatarEl(r.profile_image, r.name)}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-semibold text-neutral-900">{r.name || t("tour.fieldMissing")}</span>
                      <span className="block truncate text-[12px] text-neutral-600">{intentLine(realIntent(r))}</span>
                      {(r.rank_label || r.nationality) && <span className="block truncate text-[11px] text-neutral-400">{[r.rank_label, r.nationality].filter(Boolean).join(" · ")}</span>}
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

          {/* BEISPIEL-Block — reine Anzeige (nie in player_presence). Hinweis über der Liste,
              „Beispiel"-Merkmal je Eintrag, KEIN Anschreiben/Kontakt. Abschaltbar über
              NEXT_PUBLIC_TOUR_PRESENCE_DEMO. Siehe src/lib/tourPresenceDemo.ts (Herkunft/Lizenz). */}
          {TOUR_PRESENCE_DEMO_ON && demoShown.length > 0 && (
            <div className="mt-4">
              <p className="flex items-center gap-1.5 rounded-xl bg-black/[0.03] px-3 py-2 text-[11px] font-semibold text-neutral-500">
                <span aria-hidden>ⓘ</span>{t("tour.wsHereDemoBanner")}
              </p>
              <div className="mt-2 space-y-1.5">
                {demoShown.map((d) => (
                  // Klick öffnet die simulierte Profil-/Chat-Vorschau. KEIN Anschreiben-/Kontakt-
                  // Knopf (würde an may_match scheitern) — die Vorschau ersetzt ihn.
                  <button key={d.id} type="button" onClick={() => setDemoSelected(d)} className="flex w-full items-center gap-2.5 rounded-xl border border-neutral-200 bg-white px-2.5 py-2 text-left transition-colors hover:bg-black/[0.02]">
                    {avatarEl(d.image, d.name)}
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="truncate text-[13px] font-semibold text-neutral-900">{d.name}</span>
                        <span className="shrink-0 rounded-full bg-black/[0.06] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-neutral-500">{t("tour.wsHereDemoBadge")}</span>
                      </span>
                      <span className="block truncate text-[12px] text-neutral-600">{intentLine(demoIntent(d))}</span>
                      <span className="block truncate text-[11px] text-neutral-400">{[d.rankLabel, d.nationality].filter(Boolean).join(" · ")}</span>
                    </span>
                    <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4 shrink-0 text-neutral-300" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Trainingsslots — eigene anbieten, fremde sehen/melden, Anfragen zu-/absagen. */}
        <TrainingSlots tournamentId={tt.id} tournamentMonday={tt.tournament_monday} viewerId={viewerId} viewerContact={pContact.trim() || null} nowMs={nowMs} />

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

        {activeTab === "documents" && (
          <TournamentDocuments tournamentId={tt.id} viewerId={viewerId} />
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

      {/* Simulierte Vorschau eines Beispiel-Spielers (Profil + Chat) — nichts wird gespeichert. */}
      {demoSelected && (
        <DemoPlayerSheet player={demoSelected} city={tt.city || countryName} onClose={() => setDemoSelected(null)} />
      )}
    </div>
  );
}
