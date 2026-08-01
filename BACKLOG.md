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
**Problem:** Im Onboarding lassen sich Fotos nur einzeln hinzufügen, im Profil-Editor dagegen mehrere auf einmal (bis 5 Galeriebilder).
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
