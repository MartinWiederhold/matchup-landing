# Datenanfrage Swiss Tennis / Advantage — Turnierkalender

**Empfänger (Vorschlag):**
- Swiss Tennis, Abteilung Wettkampf/Turnierwesen — über das Kontaktformular bzw. `info@swisstennis.ch`
- Advantage (tennisplattform.ch / advantage.ch) — Betreiber der Turniersoftware, für die technische Schnittstelle

**Betreff:** Anfrage: Datenzugang Turnierkalender (Metadaten) für Matchup

---

Sehr geehrte Damen und Herren

Wir entwickeln **Matchup** (matchup-app.com), eine App für Tennis-, Padel- und Pickleball-Spieler:innen. Ein zentrales Feature ist ein Turnier-Finder, der Spieler:innen abhängig von **Land, Klassierung (R/N) und Alterskategorie** die für sie passenden Turniere anzeigt.

Für den Schweizer Markt möchten wir den **offiziellen Swiss-Tennis-Turnierkalender** korrekt und aktuell abbilden. Wir bitten Sie um einen sanktionierten **Datenzugang zu den Turnier-Metadaten**, konkret:

- Turniername, Veranstalter/Club, Ort/Stadt, Region/Verband
- Start-/Enddatum, Meldeschluss
- Kategorie (Alterskategorie + Klassierungsband, z. B. „R7–R9", „N & R1–R3")
- Link zur offiziellen Anmeldung/Detailseite

Wir benötigen ausdrücklich **keine personenbezogenen Daten** (keine Spielernamen, Tableaus oder Ergebnisse) — nur die öffentlichen Turnier-Metadaten. In der App verlinken wir für Anmeldung und Details **zurück auf Ihre offiziellen Seiten** (MyTennis / tennisplattform.ch) und weisen die Quelle sichtbar aus.

Möglich wäre für uns jede praktikable Form:
- eine **API / GraphQL-Schnittstelle** (z. B. eine öffentliche/anonyme Rolle im MyTennis-Backend),
- ein regelmässiger **Daten-Export** (CSV/JSON/iCal),
- oder eine **Freigabe zur automatisierten Abfrage** des öffentlichen Kalenders.

Wir richten uns selbstverständlich nach Ihren Nutzungsbedingungen und dem revidierten Datenschutzgesetz (revDSG). Gerne stellen wir Matchup in einem kurzen Call vor und besprechen Rahmen, Aktualisierungsintervall und Attribution.

Vielen Dank — wir freuen uns auf Ihre Rückmeldung.

Freundliche Grüsse
Martin Wiederhold
Matchup · matchup-app.com · wiederhold.martin@web.de

---

## Hinweis zur technischen Machbarkeit (intern)
- Öffentlicher Alt-Servlet `comp.swisstennis.ch/advantage/servlet/TournamentList` liefert nur **von/bis/Ort/Name** und zeigt eine **veraltete, gescopte** Liste; Detail-Servlet (`TournamentDisplay`) ist bereits auf **MyTennis (React/Hasura-GraphQL, JWT)** umgezogen (902-Byte-Stub). → **Kein tragfähiger Scrape** für aktuelle Daten + Klassierung.
- Tragfähig ist nur: **offizieller Zugang** (diese Anfrage) ODER eine anonyme Hasura-Rolle, die live an den MyTennis-Netzwerk-Calls verifiziert werden müsste.
- Bis dahin bleibt der **Deep-Link-Turnier-Finder** in der App der ehrliche Interim.
