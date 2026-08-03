# Matchup — Backlog

> Format: `MU-xxx` · Aufwand S/M/L · Status: `offen` | `in Arbeit` | `erledigt`
> Regel: Ein Ticket = ein Claude-Code-Prompt. Was größer ist, wird vorher geteilt.
> Nach Änderungen diese Datei aktualisieren und im Claude-Projekt neu hochladen.

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

## Priorität 2 — Produktwert (Tour ist der Burggraben)

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

## Priorität 3 — Advice-Ausbaustufen (Flags aktuell aus)

### MU-020 · Pro-Setup-Datenbank statt hardcodiertem Bespannungs-Block · M · offen
Aktuell sind Profi-Besaitungen hart im Code. Auf Datenquelle mit Provenance/Confidence umstellen, wie bei Rackets/Strings.

### MU-021 · Lead-Capture · S · offen
Flag `lead_capture`. Wizard „Allgemeine Beratung" speichert Anfragen.

### MU-022 · Racket-/String-Daten aus Supabase statt Seed-Dateien · M · offen
`getRackets()` / `getStrings()` sind bereits als Abstraktion angelegt — Umstellung ohne UI-Änderung möglich.

## Erledigt

- ✅ RLS-Härtung über alle 44 Tabellen, Events-Datenschutz (Teilnehmerzeilen nicht öffentlich)
- ✅ Compete/Tour-Modus komplett gebaut (3 Etappen), hinter Early-Access-Gate
- ✅ Advice: Schläger-Finder, Saiten-/Spannungs-Finder, Vergleich, Problem-Solver, Methodik (13 Tests grün)
- ✅ Falscher Link `www.generali-open.at` (NXDOMAIN) → `generali-open.at` korrigiert
- ✅ Test-Account `claude-compete-test` gelöscht
- ✅ Event-Detailseite `/events/[id]` mit SEO-Metadata (`fcfdf39`)
- ✅ Profilgalerie mit Mehrfachauswahl im Profil-Editor (`a67e02c`)
