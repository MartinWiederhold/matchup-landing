"use client";

/**
 * Countdown zur Meldefrist + Weg zur Meldung — geteilt zwischen Saison-Vorschlag
 * (Step3Proposal) und Saisonliste (SeasonList), damit beide Ansichten identisch
 * bleiben (eine Wahrheit). Formensprache wie NextDeadline/tourUi: Bernstein ab
 * ≤ 7 Tagen, KEIN Alarmrot, KEIN Blinken.
 *
 * Fristen kommen ausschließlich aus der Domain-Funktion `tourDeadlines` (unverändert).
 * Der STICHTAG (`now`) wird von der aufrufenden Komponente hereingereicht, nicht aus
 * dem Domain-Modul. Challenger liefern KEINE bekannte Frist (deadlines.ts → null,
 * MU-014) — dort wird NICHT geraten, sondern „unbekannt" gesagt und auf das Portal
 * verwiesen.
 */
import { useT } from "@/lib/i18n";
import { tourDeadlines } from "@/domain/tour/deadlines";
import type { TourTournament } from "@/lib/types";

const DAY = 86_400_000;

// Offizielle Portal-Adressen (mit Quelle belegt, nicht geraten):
//  ITF → „World Tennis Tour Zone" (ehemals IPIN): tourzone.world.tennis
//        Beleg: ITF verschob die Adresse von ipin.itftennis.com auf tourzone.world.tennis
//        (itftennis.com/en/about-us/organisation/about-ipin, .../info-for-players).
//  ATP → ATP PlayerZone. Die Meldung läuft in der PlayerZone-APP (iOS/Android),
//        es gibt KEINEN öffentlichen Web-Meldelink. Als stabile offizielle Landing
//        verlinken wir die ATP-Spielerseite — der Link führt bewusst NUR dorthin,
//        nicht zur Meldung selbst (siehe Hinweis-Text in der UI).
// Exportiert (additiv), damit die kompakte Meldeweg-Zeile im Turnierdetail dieselben
// belegten Adressen nutzt, OHNE die geteilte EntryPath-Komponente (auch in SeasonCard) zu ändern.
export const ITF_PORTAL = "https://tourzone.world.tennis";
export const ATP_PORTAL = "https://www.atptour.com/en/players";
// WTA-Haupttour meldet über die WTA PlayerZone (belegt: WTA Rulebook „enter online via
// PlayerZone"; öffentlich auffindbar unter live.apps.wtatennis.com). Nicht ITF, nicht ATP.
export const WTA_PORTAL = "https://live.apps.wtatennis.com/login-or-register.html";
export const ATP_APP_IOS = "https://apps.apple.com/app/atp-playerzone/id1461247931";
export const ATP_APP_ANDROID = "https://play.google.com/store/apps/details?id=com.atptour.playerzone";

/**
 * Der Countdown selbst — gut sichtbar (nicht kleingedruckt). Drei Zustände:
 *  - ITF, Frist in der Zukunft: „Meldeschluss in N Tagen" (≤ 7 Tage → Bernstein)
 *  - ITF, Frist verstrichen:    „Meldeschluss abgelaufen" (klar, KEINE negative Zahl)
 *  - Challenger (Frist unbekannt): „Meldefrist unbekannt" (nicht geraten)
 * Ankerpunkt ist der Meldeschluss (Entry), nicht der Rückzug (Withdrawal).
 */
export function DeadlineCountdown({ tournament, now, size = "sm" }: { tournament: TourTournament; now: number; size?: "sm" | "lg" }) {
  const t = useT();
  const dl = tourDeadlines(new Date(tournament.tournament_monday + "T00:00:00Z"), tournament.series, tournament.category);
  // „lg" für die prominente Anzeige im Turnierdetail (wichtigste Angabe des Reiters).
  const sz = size === "lg" ? "text-[18px]" : "text-[13px]";

  if (!dl.known || !dl.entry) {
    return <span className={`${sz} font-semibold text-neutral-500`}>{t("tour.entryUnknownShort")}</span>;
  }
  const ms = dl.entry.getTime() - now;
  if (ms <= 0) {
    return <span className={`${sz} font-semibold text-neutral-400`}>{t("tour.entryExpired")}</span>;
  }
  const days = Math.ceil(ms / DAY);
  const urgent = days <= 7; // wie NextDeadline: drängender in Bernstein, aber kein Rot/Blinken
  return (
    <span className={`${sz} font-bold tabular-nums ${urgent ? "text-amber-700" : "text-neutral-800"}`}>
      {t("tour.entryCountdown", { n: days })}
    </span>
  );
}

/**
 * Der Weg zur Meldung — ehrlich beschriftet, KEIN Knopf, der eine Anmeldung suggeriert.
 * Die App meldet NICHT an; sie verweist auf das zuständige Portal.
 */
export function EntryPath({ tournament }: { tournament: TourTournament }) {
  const t = useT();
  // Meldeweg je Serie: Challenger → ATP · WTA-Haupttour → WTA PlayerZone · sonst (WTT/Junioren) → ITF.
  const isChallenger = tournament.series === "challenger";
  const isWta = tournament.series === "wta";
  const link = "block font-semibold text-matchup hover:underline";
  const note = "mt-0.5 text-[11px] leading-relaxed text-neutral-400";

  return (
    <div className="mt-2 text-[12px]">
      <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">{t("tour.entryPathTitle")}</p>

      {/* Turnierseite — nur wenn eine website vorhanden ist, ehrlich als „Turnierseite"
          (NICHT „Jetzt anmelden"). ACHTUNG / TOTER CODE: Aktuell hat KEINE der 1489
          Zeilen in web.tour_tournaments eine website (Stand der Umsetzung) — dieser
          Zweig erscheint also NIE, bis das Feld gepflegt wird. Wer später sucht, warum
          der Link fehlt: das ist der Grund, kein Bug. */}
      {tournament.website && (
        <a href={tournament.website} target="_blank" rel="noopener noreferrer" className={link}>
          {t("tour.entryWebsite")} →
        </a>
      )}

      {isWta ? (
        <>
          <a href={WTA_PORTAL} target="_blank" rel="noopener noreferrer" className={link}>
            {t("tour.entryPortalWta")} →
          </a>
          <p className={note}>{t("tour.entryPortalWtaNote")}</p>
        </>
      ) : !isChallenger ? (
        <>
          <a href={ITF_PORTAL} target="_blank" rel="noopener noreferrer" className={link}>
            {t("tour.entryPortalItf")} →
          </a>
          <p className={note}>{t("tour.entryPortalItfNote")}</p>
        </>
      ) : (
        <>
          <a href={ATP_PORTAL} target="_blank" rel="noopener noreferrer" className={link}>
            {t("tour.entryPortalAtp")} →
          </a>
          {/* Ehrlich: die Meldung läuft in der App, der Link führt nur zur ATP-Seite. */}
          <p className={note}>{t("tour.entryPortalAtpNote")}</p>
          <p className={note}>
            <a href={ATP_APP_IOS} target="_blank" rel="noopener noreferrer" className="font-semibold text-neutral-500 hover:underline">{t("tour.entryAtpAppIos")}</a>
            {" · "}
            <a href={ATP_APP_ANDROID} target="_blank" rel="noopener noreferrer" className="font-semibold text-neutral-500 hover:underline">{t("tour.entryAtpAppAndroid")}</a>
          </p>
        </>
      )}
    </div>
  );
}
