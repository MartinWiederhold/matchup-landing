# Matchup — Backlog

> Format: `MU-xxx` · Aufwand S/M/L · Status: `offen` | `in Arbeit` | `erledigt`
> Regel: Ein Ticket = ein Claude-Code-Prompt. Was größer ist, wird vorher geteilt.
> Nach Änderungen diese Datei aktualisieren und im Claude-Projekt neu hochladen.
>
> **Nummerierung:** Neue Tickets bekommen die nächste freie Nummer; alte werden NIE
> umnummeriert (eine Nummer kann in Commits, Verläufen oder Notizen außerhalb des Repos
> stehen). **Doppelt vergeben:** `MU-020`, `MU-021` und `MU-022` existieren je zweimal —
> einmal in Priorität 3 (Advice, älter) und einmal im Compete/Tour-Kontext (Kalender/Karte).
> Bewusst so belassen; im Zweifel die Sektion/den Titel zur Unterscheidung nennen.

## Priorität 1 — vor Launch

### MU-001 · Turnier-Logos zuverlässig machen · M · offen
**Problem:** `tournamentLogo()` holt Logos über den Google-Favicon-Dienst der Turnier-Domain. Für kleine Domains (z. B. `generali-open.at`) gibt es kein Favicon → generischer Globus. Der Home-Tab zeigt stattdessen Länder-Flaggen-Emojis, die Map echte Logos. Inkonsistent.
**Lösung:** Override-Tabelle pro Turnier (lokale Logos in `public/tournaments/`) + sauberer Fallback-Verlauf: lokales Logo → Favicon → **Flagge oder Monogramm**, nie Globus. Home und Map benutzen dieselbe Funktion.
**Dateien:** `src/lib/tournaments.ts`, Logo-Helper, `public/tournaments/`, Home-Tab, Map-Komponenten
**Fertig wenn:** Kein Globus mehr sichtbar; Wimbledon zeigt echtes Logo; Generali Open zeigt Flagge/Monogramm; Home und Map sehen gleich aus.
**Risiko:** niedrig. Rein visuell.

### MU-002 · Onboarding-Foto-Upload: Mehrfachauswahl · S · offen
**Erledigt (Teil 1):** Der Profil-Editor beherrscht die Mehrfachauswahl bereits (Commit `a67e02c`, `MAX_PHOTOS=6` = 1 Hauptbild + 5 Galeriebilder).
**Offen:** Nur noch die Übernahme in den **Onboarding-Foto-Schritt** — dort lassen sich Fotos bislang nur einzeln hinzufügen.
**Lösung:** Die Mehrfachauswahl-Logik aus `EditProfile` in den Onboarding-Foto-Schritt übernehmen. Hauptbild weiterhin über den Kreis-Cropper.
**Dateien:** `src/app/app/components/Onboarding/` (Foto-Schritt), `subviews/EditProfile` als Vorlage
**Fertig wenn:** Im Onboarding lassen sich mehrere Bilder auf einmal wählen, max. 5 Galeriebilder plus Hauptbild, Upload landet in `web-avatars/<userId>/`.

### MU-003 · `profiles select *` durch explizite Spalten ersetzen · M · offen · **Security MEDIUM**
**Problem:** `select *` auf `profiles` liefert `fcm_token`, `device_fingerprint` und weitere sensible Felder an jeden eingeloggten Nutzer.
**Lösung:** Alle Stellen finden, eine zentrale Spaltenkonstante definieren (z. B. `PROFILE_PUBLIC_COLUMNS` und `PROFILE_OWN_COLUMNS` in `src/lib/types.ts` oder daneben), überall einsetzen.
**Dateien:** alles unter `src/app/app/**` und `src/lib/**`, das `from("profiles").select` aufruft
**Fertig wenn:** Kein `select("*")` und kein `select()` ohne Spaltenliste mehr auf `profiles`; Discover, Profil, Matches funktionieren unverändert; `tsc` grün.
**Vorgehen:** Erst nur suchen und Liste vorlegen, dann in einem zweiten Durchgang ändern.

### MU-004 · `NEXT_PUBLIC_ADMIN_EMAILS` server-only machen · S · offen · **Security LOW**
**Problem:** Die Admin-E-Mail-Allowlist liegt im Client-Bundle und ist damit öffentlich lesbar.
**Lösung:** Auf server-only `ADMIN_EMAILS` umstellen, in `verifyAdmin` nur serverseitig lesen. Env-Var in Vercel anlegen, alte nach dem Umbau entfernen.
**Dateien:** `src/lib/adminAction.ts` / `verifyAdmin`, Admin-Routen, Vercel-Env
**Fertig wenn:** `NEXT_PUBLIC_ADMIN_EMAILS` kommt im gebauten Client-Bundle nicht mehr vor; Admin-Login funktioniert weiter.

### MU-005 · Seed- und Demo-Daten vor Launch prüfen · S · offen
**Problem:** Discover nutzt teils Seed-Profile (`is_seed=true`), die Story-Row hat hardcodierte Demo-Avatare, Events haben Fallback-Demo-Einträge.
**Lösung:** Bestandsaufnahme aller Stellen; Schalter, um Seed-Inhalte in Produktion auszublenden; Entscheidung je Stelle dokumentieren.
**Fertig wenn:** Es gibt eine Liste aller Demo-/Seed-Quellen und eine bewusste Entscheidung pro Stelle.

### MU-006 · Lizenz der Seed-Profilfotos klären · S · offen · **Priorität 1**
**Problem:** `public/seed/pm1.jpg` und `pf1.jpg` sind Pexels-Fotos mit erkennbaren Personen, eingesetzt als Fake-Profilfotos in einer Partnersuche-App. Die Pexels-Lizenz schließt Darstellungen aus, die eine Billigung suggerieren oder Personen in ungewollte Kontexte setzen; dazu kommt die DSGVO-Frage bei identifizierbaren Personen ohne Einwilligung.
**Optionen:** KI-generierte Porträts, Illustrationen/Avatare, oder Seed-Profile ohne Gesicht und sichtbar als Beispiel gekennzeichnet.
**Fertig wenn:** Kein Foto einer realen identifizierbaren Person mehr als Seed-Profil live.

### MU-007 · CHECK-Constraint für `profiles.additional_images` · S · offen
**Problem:** Das Limit von 5 Galeriebildern wird nur clientseitig erzwungen. In der DB ist `additional_images` ein `text[]` ohne Längenbeschränkung.
**Lösung:** CHECK-Constraint (`array_length <= 5`) als Migration unter `supabase/`. Vorher prüfen, ob bestehende Zeilen das verletzen.
**Fertig wenn:** DB lehnt mehr als 5 Galeriebilder ab; bestehende Daten bleiben gültig.

### MU-008 · Events-Migration in `supabase/` dokumentieren · S · offen
**Hinweis:** `web_events.sql` wurde direkt über die Management-API auf Prod ausgeführt (nicht per Datei/Migrations-Runner).
**Lösung:** Am Dateikopf einen Kommentar ergänzen: „ausgeführt am `<Datum>`, Stand verifiziert". Damit später nachvollziehbar bleibt, was schon live ist.
**Fertig wenn:** Der Dateikopf dokumentiert Ausführungsdatum + Verifikationsstand.

### MU-014 · Challenger-Fristen in `src/lib/deadlines.ts` sind geraten · S · offen · **Vor Launch**
**Problem:** `deadlines.ts` rät Entry = Montag − 21 Tage und Withdrawal = Freitag davor. Für ATP Challenger gilt das ATP-Regelwerk, nicht die ITF-Regel. Keine Quelle belegt diese Werte.
**Risiko:** Spieler verpasst eine Meldefrist. Teuerster möglicher Fehler des Produkts.
**Lösung:** Entweder die echte ATP-Regel belegen und eintragen, oder in der UI „Frist unbekannt, bitte im Spielerportal prüfen" anzeigen. Muster: `src/domain/tour/deadlines.ts` gibt für Challenger bewusst `null` (+ `"regel_unbekannt"`) zurück.
**Fertig wenn:** Keine geratene Challenger-Frist mehr sichtbar, oder Regel mit Quelle belegt.
**Sperre:** `COMPETE_EARLY_ACCESS_OPEN` darf nicht auf `true`, solange offen.

### MU-016 · Rangprognose ohne 52-Wochen-Verfall in `src/lib/tournaments.ts` · M · offen · **Vor Launch**
**Problem:** `projectSeasonPoints` rechnet in `CompeteRanking` `totalProjected = curPoints + projPoints`. Der 52-Wochen-Verfall fehlt vollständig — Punkte, die der Spieler verteidigen muss, werden nicht abgezogen. `CompeteRanking` zeigt damit eine systematisch zu hohe Projektion, und der Fehler wächst mit dem Erfolg der Vorsaison.
**Wirkung:** Ein Spieler plant seine Saison auf einer Rangprognose, die nicht eintreten kann. Das ist die Kernzahl des Wettkampf-Modus.
**Ursache:** Es gibt keine Punktehistorie je Turnier mit Erzielungsdatum. `tour_profiles` hält nur einen aktuellen Gesamtwert (`points`/`ranking`).
**Lösung (zwei Wege, Entscheidung offen):**
- a) Datenstruktur für Punkte je Turnier schaffen und echten Verfall rechnen.
- b) Bis dahin die Projektion ehrlich kennzeichnen: „ohne Verfall gerechnet, tatsächlicher Rang wird niedriger liegen".
**Sperre:** `COMPETE_EARLY_ACCESS_OPEN` darf nicht auf `true`, solange die Projektion den Verfall verschweigt.

### MU-017 · Verwaiste Belegfotos im Bucket `tour-receipts` · M · offen · **Vor Launch**
**Problem:** Wird eine Ausgabe gelöscht, bleibt die Belegdatei im Bucket `tour-receipts` liegen. Der naheliegende Weg über einen DB-Trigger ist auf Supabase NICHT möglich: direktes Löschen in `storage.objects` wird abgelehnt (`42501`, „Use the Storage API instead") — ein solcher Trigger würde außerdem den gesamten Löschvorgang abbrechen und /tour wie /app beschädigen. Belegt und wieder entfernt bei der Einrichtung des Buckets (`supabase/web_tour_receipts.sql`).
**Wirkung:** Gelöschte Belege leben als Datei weiter. Auf einem Bon stehen Ort, Uhrzeit und oft Kartenstellen. Besonders relevant, weil /app (`ExpensesView`) Ausgaben löscht, ohne den Beleg zu kennen.
**Lösung (zwei Teile):**
- a) /tour löscht beim Entfernen einer Ausgabe die Datei über die Storage-API mit (`storage.from('tour-receipts').remove([...])`) — deckt den Normalfall, kommt mit der Datenschicht.
- b) Ein geplanter Aufräum-Lauf (Edge Function oder Cron mit Service-Rolle), der Objekte ohne passende `tour_expenses`-Zeile entfernt — deckt /app-Löschungen und Abbrüche beim Upload.
**Sperre:** Nicht mit echten Nutzern starten, solange b) fehlt.

### MU-018 · Schengen-Zähler unterschätzt den Aufenthalt · M · offen · **Vor Launch**
**Problem:** `schengenProjection` (`src/lib/schengen.ts`) zählt nur Turnierfenster (`start_date` bis `end_date`), nicht den durchgehenden Aufenthalt. Wer zwischen zwei Turnieren im Schengen-Raum bleibt — bei Clustern der Normalfall — sammelt ungezählte Tage.
**Wirkung:** Die Anzeige ist systematisch zu optimistisch. Bei einer Regel, deren Verletzung eine Einreisesperre nach sich zieht, ist das die gefährliche Richtung. Ein Spieler erfährt es an der Grenze.
**Lösung:** Entweder Aufenthalte durchgehend zählen (Nutzer trägt Ein- und Ausreise ein), oder die Anzeige klar als Untergrenze kennzeichnen („mindestens X Tage, tatsächlicher Aufenthalt kann höher liegen").
**Stand (e58a504):** `/tour` hat einen EIGENEN Zähler, der auf bestätigten, durchgehenden Aufenthalten rechnet (`src/domain/tour/schengen.ts`, `web.tour_stays`, Route `/tour/schengen`) — dort ist die Untererfassung behoben. Das Ticket bleibt trotzdem offen: Es betrifft den Zähler im **/app-Compete** (`src/lib/schengen.ts`), der weiterhin auf Turnierfenstern rechnet und unterschätzt.
**Sperre:** `COMPETE_EARLY_ACCESS_OPEN` nicht auf `true`, solange die Anzeige eine Untererfassung als Restkontingent darstellt.

### MU-019 · Visa-Regeln ignorieren die Nationalität · M · offen · **Vor Launch**
**Problem:** `countryRegime` in `src/lib/visa.ts` entscheidet nur nach Zielland. „USA → ESTA $21" gilt nur für Spieler mit Visa-Waiver-Pass. Für alle anderen ist die Auskunft falsch. Zusätzlich sind die Gebühren hartkodiert, undatiert und ohne Quellenbeleg (UK ETA lag zuvor bei £10).
**Wirkung:** Betrifft besonders Spieler aus Afrika, Südasien und Lateinamerika — genau die Gruppe mit den größten Visa-Hürden.
**Lösung:** Nationalität einbeziehen, oder die Aussage auf das reduzieren, was ohne sie stimmt („Einreisebestimmungen prüfen", mit Amtslink). Gebühren mit Datenstand versehen oder weglassen.
**Sperre:** Nicht mit echten Nutzern starten, solange eine nationalitätsabhängige Aussage als allgemeingültig erscheint.

### MU-020 · Kalender-Token lässt sich nicht zurückziehen · M · offen · **Vor Launch**
**Problem:** `ensureCalendarToken` erzeugt einen Token einmalig und rotiert nie. `web.tour_calendar` hat kein Ablauffeld, kein Code-Pfad löscht oder erneuert die Zeile. Die Feed-URL `/api/tour/calendar/<token>.ics` ist login-los.
**Wirkung:** Wer die URL einmal hat — geteiltes Gerät, Screenshot, ein Kalenderdienst der Feeds protokolliert — sieht dauerhaft alle Termine mit Titel und Notiz. Ein Widerruf ist die Grundfunktion jedes Freigabe-Links und fehlt.
**Lösung:** Token rotieren können (neuer Token, alter ungültig), plus Möglichkeit, den Feed ganz abzuschalten. Optional ein Ablaufdatum.
**Sperre:** Nicht mit echten Nutzern starten, solange ein einmal geteilter Feed nicht widerrufbar ist.

### MU-024 · CARTO-Kacheln kommerziell nicht gedeckt · M · offen · **Vor Launch**
**Problem (geklärt):** Die Karte nutzt den schlüssellosen CARTO-Basemap-CDN (`basemaps.cartocdn.com`) ohne API-Schlüssel und ohne Vertrag. CARTOs eigene `LICENSE.md` sagt wörtlich, dass der Zugang zu den Basemap-Tile-Diensten auf **Enterprise-Kunden und Non-Profit-Grants** beschränkt ist und **nicht** zur freien öffentlichen Nutzung steht; die CARTO-Doku bestätigt, dass kommerzielle Nutzung eine **Enterprise-Lizenz** erfordert. Die aktuelle schlüssellose Nutzung in `/map` ist damit **nicht gedeckt** — die Lizenzlage ist nicht mehr offen, sondern negativ.
**Wirkung:** Fällt der Zugang weg oder wird abgerechnet, ist die Karte in /app und /tour gleichzeitig betroffen. Bei einer bezahlten App ist das ein Lizenzverstoß, kein offener Prüfpunkt.
**Lösung:** Wechsel auf eine Kachelquelle mit klarer, kommerziell erlaubter Lizenz.
- **Erste Wahl: OpenFreeMap** — kein Schlüssel, keine Abrufgrenze, kommerziell erlaubt, Vektorkacheln für MapLibre (`maplibre-gl` ist bereits installiert). **Risiko:** spendenfinanziert, kein Vertrag/SLA — Verfügbarkeit nicht garantiert.
- **Rückfall: Protomaps selbst gehostet** — PMTiles auf Objektspeicher, unbegrenzt, nur Speicher- und Transferkosten, Leaflet-tauglich (kein Anbieter-Risiko, dafür Betriebsaufwand).
Attribution in beiden Fällen sicherstellen.
**Sperre:** Nicht mit echten Nutzern starten, solange die Karte auf der CARTO-Quelle läuft.

### MU-026 · Team-Mitglieder sehen mehr als ihre Rolle rechtfertigt · M · offen · **Vor Launch**
**Problem:** Die RLS-Policies auf `tour_profiles`, `tour_events` und `tour_messages` prüfen nur `status='active'`, nicht die Rolle. Nur die Finanzdaten (`tour_expenses`, `tour_prize`) sind auf `role='agent'` beschränkt. Ein als Hitting Partner oder Physio eingeladenes Mitglied kann damit die volle `tour_profiles`-Zeile lesen: Pässe, Steuersitz, ESTA-Status, Saisonbudget, Verletzungsdaten — sowie alle Termine inklusive Gegner, Ergebnis und Notizen.
**Verschärfend:** Die UI (`TourPlayerView`) zeigt einem Coach nur Termine. Der Schutz liegt allein in der Policy, nicht in der Oberfläche — ein direkter API-Aufruf liefert das volle Profil. Wer die UI prüft, hält das System für sicherer als es ist.
**Wirkung:** Pässe und Steuerdaten sind eine andere Datenklasse als Turnierergebnisse. Ein Spieler lädt jemanden zum Terminabgleich ein und gibt ihm seinen Steuersitz.
**Lösung:** Policies je Rolle differenzieren. Mindestens: sensible Profilfelder (Pässe, Steuersitz, ESTA, Budget) nur für Rolle `agent` oder gar nicht; `tour_events`-Sicht für Nicht-Agenten auf die Felder beschränken, die die UI ohnehin zeigt. Zusätzlich dem Spieler in der UI zeigen, worauf jede Rolle Zugriff hat.
**Sperre:** Nicht mit echten Nutzern starten, solange eine Rolle mehr sieht, als der Spieler ihr bewusst gibt.

### MU-027 · Team-Einladungslink ohne Ablauf und ohne Widerrufsspur · M · offen · **Vor Launch**
**Problem:** `invite_token` in `tour_team` hat kein Ablaufdatum. Der Link `/app?team=<token>` ist login-los erreichbar, der erste eingeloggte Nutzer der ihn öffnet bindet ihn. Wer den Link weiterleitet oder in einer Gruppe teilt, verschenkt Zugriff an die falsche Person.
**Wirkung:** Gleiches Muster wie MU-020 beim Kalender-Token. Hier wiegt es schwerer, weil es Zugriff auf fremde Daten gibt, nicht nur Leserechte auf einen Feed.
**Lösung:** Ablaufdatum je Einladung, Token nach Annahme entwerten, und dem Spieler anzeigen, wann ein Link erzeugt wurde und ob er noch offen ist.
**Sperre:** Nicht mit echten Nutzern starten, solange ein einmal erzeugter Einladungslink unbegrenzt gültig bleibt.

## Priorität 2 — Produktwert (Tour ist der Burggraben)

### MU-029 · Turniere ohne Koordinaten — Karte unvollständig · M · offen
**Ausgangslage:** Alle 1489 Zeilen in `web.tour_tournaments` hatten `latitude`/`longitude` auf `null`; der Wikipedia-Import befüllte die Spalten nie, eine Geocodierung fand nicht statt. `/tour/map` und die Kartenvorschau zeigten für JEDEN Nutzer „keine Turniere mit Koordinaten".
**Stand (Commit 99f275c):** 1234 von 1489 Turnieren haben jetzt Koordinaten aus **Nominatim (OSM)** — geschrieben als Claims mit Quelle `nominatim` und confidence 0.6, dann in den Stamm aufgelöst. **Die Karte ist funktional.** Skript `scripts/geocode-tournaments.mjs` (Trockenlauf als Default, Rate-Limit ≥1 s/Anfrage, Roh-Cache, idempotent geprüft); Bericht `scripts/geocoding-report.md`.
**Restumfang:** 255 Turniere an 124 Orten fehlen noch — **121 mehrdeutige** Ortsnamen (echte Doppelnamen wie Las Vegas NV/NM, Savannah 5×, Tigre) und **3 nicht gefundene** (Nouméa, Hong Kong, Harmon/Guam). Alle mit Kandidaten-Koordinaten in `scripts/geocoding-report.md` gelistet. **32 der 124 Orte liegen in der Zielregion** (Europa/TR/TN/EG/MA), der Rest überwiegend USA, Südamerika, Asien.
**Lösung (Rest):** je offenem Ort die richtige Koordinate manuell als Claim setzen (bei Doppelnamen anhand der Kandidatenliste im Bericht) und mit `scripts/resolve-tournaments.mjs --write` auflösen. Nicht mehr launch-blockierend — die Karte ist nutzbar, nur unvollständig.

### MU-021 · Kalendertermine ohne Zeitzone · M · offen
**Problem:** `web.tour_events.event_time` ist `time without time zone`, der ICS-Export liefert `DTSTART` ohne `TZID`. Ein Termin „14:00" erscheint in jeder Kalender-App als lokale 14 Uhr des Betrachters.
**Wirkung:** Betrifft genau die Zielgruppe — wer zwischen Monastir, Antalya und Spanien pendelt, trägt einen Termin in einer Zeitzone ein und sieht ihn in einer anderen zur falschen Zeit. Bei einem Matchtermin ist das kein Schönheitsfehler.
**Lösung:** Zeitzone je Termin führen (aus dem Turnierland ableitbar) und im ICS als `TZID` ausgeben. Alternativ die Konvention ausdrücklich benennen, damit der Nutzer sie kennt.

### MU-010 · Geteilte Unterkunft zwischen Spielern · L · offen
**Warum:** Laut Marktanalyse von **keiner** existierenden App abgedeckt und einer der stärksten Sparhebel für Spieler (Zimmer/Apartments teilen).
**Idee:** Pro Turnier eine „Ich suche / Ich biete Mitbewohner"-Ansicht; Matching über bestehende Matching-Bausteine; Chat läuft über vorhandene Match-/Gruppen-Struktur.
**Vorarbeit:** Erst `ANALYSE:` im Claude-Projekt — Datenmodell, RLS, Missbrauchsschutz.

### MU-011 · Ausgaben-Export (steuerfertig) · M · offen
**Warum:** Beleg-OCR existiert bereits; der Export ist der Punkt, für den Spieler zahlen.
**Idee:** CSV/PDF-Export je Saison und Währung, Kategorien, Summen, Beleg-Anhänge.
**Dateien:** `ExpensesView`, `/api/tour/scan-receipt`, neuer Export-Endpunkt

### MU-012 · Punkte-Simulator „was passiert, wenn" · L · offen
**Warum:** Der Grund, die App täglich zu öffnen. 52-Wochen-Rolling, zu verteidigende Punkte, Szenarien.
**Achtung:** Reine Rechenlogik → gehört nach `src/domain/**` inklusive Vitest-Tests, wie die Advice-Engine.

### MU-013 · Reise-Affiliate ausbauen · M · offen
**Warum:** Reise ist der größte Kostenblock der Zielgruppe und damit die volumenstärkste Monetarisierung. Travelpayouts ist bereits angebunden (`lib/travelpayouts.ts`, `/api/prices`).

### MU-015 · Saisonplaner-Kosten auf Reiseketten-Domain umstellen · M · offen
**Problem:** `computePlan`/`leg` in `src/lib/tournaments.ts` berechnet über `leg(prev, t)` bei gleichem Ort trotzdem eine Anreise (`Math.round(0*0.35)+20` = 20 €). Folge: **Der /map-Saisonplaner stellt Turnier-Cluster teurer dar, als sie sind, und verzerrt genau den Vergleich, um den es geht** — „drei Wochen am selben Ort" (Monastir/Antalya/Sharm, real *einmal* Anreise) gegen „drei verschiedene Orte". Für die Zielgruppe (Futures-Spieler mit knappem Budget) ist das die zentrale Entscheidung; ein zu teuer gerechneter Cluster kann sie in die falsche, teurere Planung lenken. Zusätzlich: Beträge als Float auf ganze Euro gerundet (unnötiger Rundungsfehler), und alles wird als € dargestellt, obwohl das Modell keine echte Währung führt (kein Wechselkurs, kein Datenstand).
**Kein Launch-Blocker:** Es werden **keine** echten Fremdwährungen still zusammenaddiert (das Modell kennt keine Währungen; `ExpensesView` summiert bereits je Währung getrennt) — daher nicht analog MU-014, sondern eine Genauigkeits-/Vergleichbarkeits-Schwäche.
**Lösung:** `computePlan` auf `src/domain/tour/costs.ts` (reine, getestete Reiseketten-Domain) umstellen: **Cluster-Dedup** (Anreise nur bei Ortswechsel), **Integer-Cent** statt Float, **getrennte Summen je Währung**. Distanz-/Modus-Schätzung von `leg` kann als Anreise-Kostensatz einfließen, aber ohne Anreise bei gleichem Ort.
**Dateien:** `src/lib/tournaments.ts` (`computePlan`/`leg`/`PlanCost`), `src/app/map/SeasonPlanner.tsx` (Anzeige), Muster: `src/domain/tour/costs.ts` + Test.
**Fertig wenn:** Ein Cluster von drei Wochen am selben Ort wird im Planer nachweislich günstiger dargestellt als drei verschiedene Orte; keine Float-Zwischenwerte; mehrere Währungen (falls je eingeführt) getrennt ausgewiesen.

### MU-028 · Preisgeld-Ableitung ohne Jahres-Staffelung · M · offen
**Problem:** `PRIZE_USD` in `scripts/wikipedia-import.mjs` (Zeile 90–95) leitet das Preisgeld aus der Kategorie ab, mit festen, JAHRES-UNABHÄNGIGEN Werten. M25 steht dort auf 25000 USD; laut 2026-WTT-Regelwerk sind es 2026 aber 30000. Die Struktur kann Jahresänderungen grundsätzlich nicht abbilden.
**Wirkung:** Alle 2026er M25-Turniere tragen einen um 5000 USD zu niedrigen Preisgeld-Claim. Bei jeder künftigen ITF-Preisgeldreform wiederholt sich der Fehler still. Entschärfend: Der Wert ist als Ableitung mit niedriger confidence markiert, nicht als Beobachtung.
**Lösung:** `PRIZE_USD` nach Jahr staffeln (Kategorie + Jahr → Betrag), mit Quellenangabe je Jahrgang. Danach die betroffenen Claims neu berechnen — der Import ist idempotent, ein erneuter Lauf reicht. Belegt in `scripts/punkte-tabellen-report.md` §2b.

### MU-030 · Spieler-Setups im Konfigurator ohne Datenstand und Quelle · M · offen
**Problem:** Die zwölf Spieler-Setups im Konfigurator (`src/components/shop/BespannungConfigurator.tsx`) tragen weder Datenstand noch Quellenangabe. Tour-Setups ändern sich saisonal — belegt am Fall **Alcaraz**, dessen Saite von RPM Blast auf RPM Team wechselte und an zwei Stellen unterschiedlich stand (behoben mit `3ad5897`). Für die übrigen elf ist die Aktualität unbekannt: keine Quelle, kein Datum.
**Wirkung:** Ein Nutzer besaitet nach einer Angabe, die zwei Jahre alt sein kann, und hält sie für aktuell. Das widerspricht der Haltung im Projekt — Begründung, Datenstand, Confidence.
**Lösung:** Je Setup eine Quellenangabe und einen Datenstand führen und anzeigen. Setups ohne belegte Quelle als solche kennzeichnen. **Ohne Quelle nichts ändern** — raten wäre schlimmer als eine alte Angabe mit Datum.
**Einzelfälle:**
- **Federer** ist seit 2022 zurückgetreten. Bei „Spiele wie die Profis" führt ein vier Jahre altes Setup in die Irre. Entweder entfernen oder als Referenz kennzeichnen — Produktentscheidung.
- **Fritz** zeigt „Racket brand: Head" neben einer Solinco-Saite. Das ist auf der Tour üblich und kein Fehler, liest sich aber wie ein Widerspruch. Beschriftungsfrage.

## Priorität 3 — Advice-Ausbaustufen (Flags aktuell aus)

### MU-020 · Pro-Setup-Datenbank statt hardcodiertem Bespannungs-Block · M · offen
Aktuell sind Profi-Besaitungen hart im Code. Auf Datenquelle mit Provenance/Confidence umstellen, wie bei Rackets/Strings.

### MU-021 · Lead-Capture · S · offen
Flag `lead_capture`. Wizard „Allgemeine Beratung" speichert Anfragen.

### MU-022 · Racket-/String-Daten aus Supabase statt Seed-Dateien · M · offen
`getRackets()` / `getStrings()` sind bereits als Abstraktion angelegt — Umstellung ohne UI-Änderung möglich.

### MU-025 · Turnierlogos sind Website-Favicons · S · offen
**Problem:** `tournamentLogo()` in `src/lib/tournaments.ts` leitet das Logo aus Googles Favicon-Dienst ab. Gezeigt wird das Favicon der Turnier-Website, nie das echte Turnierlogo; fehlt die URL, fällt der Marker auf einen Stern zurück.
**Wirkung:** Kosmetisch. Das dokumentierte Generali-Open-Problem.
**Lösung:** Logos kuratiert hinterlegen oder sauberer Fallback (Landesflagge oder Monogramm) statt Favicon-Rateversuch.

## Erledigt

- ✅ RLS-Härtung über alle 44 Tabellen, Events-Datenschutz (Teilnehmerzeilen nicht öffentlich)
- ✅ Compete/Tour-Modus komplett gebaut (3 Etappen), hinter Early-Access-Gate
- ✅ Advice: Schläger-Finder, Saiten-/Spannungs-Finder, Vergleich, Problem-Solver, Methodik (13 Tests grün)
- ✅ Falscher Link `www.generali-open.at` (NXDOMAIN) → `generali-open.at` korrigiert
- ✅ Test-Account `claude-compete-test` gelöscht
- ✅ Event-Detailseite `/events/[id]` mit SEO-Metadata (`fcfdf39`)
- ✅ Profilgalerie mit Mehrfachauswahl im Profil-Editor (`a67e02c`)
