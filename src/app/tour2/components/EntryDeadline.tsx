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
//
// KEIN turnier-spezifischer Deep-Link möglich — geprüft (Adressstruktur, ohne Anmeldung):
//   * Kein Portal trägt eine Turnier-Kennung in der Adresse. Die öffentliche ITF-
//     Turnierseite verlinkt nur die blanke `tourzone.world.tennis/` (kein Turnier-Param).
//   * Kein Portal leitet nach dem Login an das ursprüngliche Turnier zurück (kein
//     returnUrl): Tour Zone ist eine SPA ohne Auth-Redirect; WTA PlayerZone leitet zu
//     Microsoft-OAuth mit `redirect_uri` = blanker App-Root (nicht das Turnier).
//   * ATP PlayerZone (atptour.com) sperrt KI-Nutzung → nicht prüfbar; die Meldung läuft
//     ohnehin in der ATP-App.
// Das Beste, was existiert, ist deshalb: bei ITF die öffentliche Turnierseite (unten in
// `tournament.website`, landet beim richtigen Turnier) PLUS der generische Portal-Link.
// Wer später einen Deep-Link sucht: es gibt keinen — hier nicht weiter suchen.
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
    return <span className={`${sz} font-semibold text-[var(--t2-muted)]`}>{t("tour.entryUnknownShort")}</span>;
  }
  const ms = dl.entry.getTime() - now;
  if (ms <= 0) {
    return <span className={`${sz} font-semibold text-[var(--t2-faint)]`}>{t("tour.entryExpired")}</span>;
  }
  const days = Math.ceil(ms / DAY);
  const urgent = days <= 7; // wie NextDeadline: drängender in Bernstein, aber kein Rot/Blinken
  return (
    <span className={`${sz} font-bold tabular-nums ${urgent ? "text-amber-700" : "text-[var(--t2-ink)]"}`}>
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
  const link = "block font-semibold text-[var(--t2-accent)] hover:underline";
  const note = "mt-0.5 text-[11px] leading-relaxed text-[var(--t2-faint)]";

  return (
    <div className="mt-2 text-[12px]">
      <p className="mb-1 t2-kicker">{t("tour.entryPathTitle")}</p>

      {/* Turnierseite — bei ITF-Turnieren die öffentliche itftennis.com-Turnierseite
          (in `website` aufgelöst, MU: aus der claim-source_url der ITF-Endpunkt-Claims).
          Ehrlich als „Turnierseite mit Meldeinfo" (NICHT „Jetzt anmelden") + Hinweis:
          die Seite MELDET NICHT AN, sie zeigt das Turnier samt Fact Sheet und führt zum
          Portal. Vorteil ggü. der blanken Tour-Zone-Startseite: der Nutzer landet beim
          RICHTIGEN Turnier, nicht auf einer generischen Portalseite. Der Tour-Zone-Link
          bleibt darunter, für wer direkt ins Portal will.
          Nur ITF-Turniere haben eine `website` (WTA/Challenger: kein itftennis.com-Link
          in den Claims → Feld bleibt NULL → dieser Zweig erscheint dort nicht). */}
      {tournament.website && (
        <>
          <a href={tournament.website} target="_blank" rel="noopener noreferrer" className={link}>
            {t("tour.entryWebsite")} →
          </a>
          <p className={note}>{t("tour.entryWebsiteNote")}</p>
        </>
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
            <a href={ATP_APP_IOS} target="_blank" rel="noopener noreferrer" className="font-semibold text-[var(--t2-muted)] hover:underline">{t("tour.entryAtpAppIos")}</a>
            {" · "}
            <a href={ATP_APP_ANDROID} target="_blank" rel="noopener noreferrer" className="font-semibold text-[var(--t2-muted)] hover:underline">{t("tour.entryAtpAppAndroid")}</a>
          </p>
        </>
      )}
    </div>
  );
}
