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

### MU-045 · Damen-Turniere ohne Punktemodell — WTA-Punkte fehlen in points.ts · M · **erledigt** · ✅ **Sperre aufgehoben**
**Erledigt:** WTA-Punktemodell in `points.ts` (v2) ergänzt — eigene `WTA_SINGLES_POINTS`-Tabelle, belegt aus **2026 ITF WTT Regulations, Appendix K §1, S. 180** (WTA-Werte, NICHT aus ATP abgeleitet). `toPointsCategory` mappt W15/W35/W50/W75/W100; `lookupPoints` nutzt für Damen die WTA-Tabelle (getrennt von der ATP-Ära-Logik). `expectedPoints("W50","R16")` = 6 statt 0 → unter „most_points" tragen Damen ihren echten Wert. 7 neue Vitest-Fälle, 256 Tests grün. **Sperre aufgehoben.**
**Zwei belegte Entscheidungen dabei:** (a) **W25** bleibt bewusst ungemappt (`null`) — 2026 keine gültige Kategorie; das eine DB-Turnier (`itf:w-itf-egy-2026-037`, Sharm) ist eine **Quell-Inkonsistenz** (ITF-Seite: Titel „W35", Grade-Feld „W25", Preisgeld $30k), kein reiner Import-Fehler → nicht überschrieben. (b) **Feldgröße:** Der ITF-Endpunkt liefert keine (27 Felder geprüft, kein `drawSize`) → je Kategorie die **32S-Zeile** als dokumentierte Annahme; einzige Abweichung im relevanten Bereich: W35 R16 = 4 (32S) statt 5 (48S). Im Code fett vermerkt, dass WTA — anders als ATP — feldgrößenabhängig ist (nicht „vereinheitlichen").
**Offener Folgepunkt (klein):** `scorePoints` (erzielte Ergebnisse, /app) übernimmt für Damen vorläufig die ATP-Aggregatstruktur (kein +14-Verzug, ATP-Zählgrenze) — die WTA-Wirksamkeits-/Zählregeln sind in Appendix K nicht enthalten und noch nicht belegt. Betrifft NICHT den Optimierer (der nutzt nur `expectedPoints`). Im Code als MU-045-Folge markiert.
**🚫 Sperre (aufgehoben):** ~~Nicht mit echten Nutzern starten, solange das Punkte-Objektiv für Damen-Turniere 0 liefert.~~
**Begründung:** Frauen gehören gleichermaßen zur Zielgruppe. Allein für Europa und die nächsten drei Monate stehen **103 Damen-Turniere** bereit — genauso viele wie bei den Herren. Ein Optimierer, der sie alle mit 0 bewertet, liefert der Hälfte der Nutzerinnen ein **unbrauchbares Ergebnis, ohne es zu sagen** (stiller Fehler).
**Problem:** `points.ts` modelliert ausschließlich **ATP**-Punkte (Quelle: ATP-Regelwerk Kapitel 9, `scripts/punkte-tabellen-report.md`). Die 200 Damen-Turniere (W15, W35, W50, W75, W100 — dazu ein W25) haben **keine** Kategorie-Zuordnung: `CAT_DISPLAY_TO_POINTS` kennt sie nicht → `toPointsCategory("W35")` liefert `null` → `expectedPoints` gibt `{ points: 0, note: "erwartungspunkte_null" }`.
**Wirkung:** Unter dem Optimierer-Objektiv **„meiste Punkte" (most_points)** tragen Damen-Turniere **0** bei und landen in der Beam-Sortierung (`b.points - a.points`) hinten. Sie werden nur als **Lückenfüller** gewählt, nie wegen ihres Werts; eine reine Damen-Saison degeneriert zu „alle 0" (Auswahl entscheidet dann nur die Kostenskala). **Kein Absturz, kein sichtbares Symptom — der Fehler ist still.** Unter „meiste Turniere" (Standard-Objektiv) ist es folgenlos: Damen zählen dort gleichwertig (geprüft: 103 Damen vs. 103 Herren, Europa/3 Monate).
**Lösung:** Ein **eigenes WTA-Punktemodell**, belegt aus dem **WTA-Regelwerk** — **KEIN Kopieren der Herrenwerte.** Die Punkte je Runde unterscheiden sich zwischen ATP und WTA. Analog zur ATP-Quelle vorgehen: Werte belegen (Regelwerk-Fassung + Seite), Jahrgangsabhängigkeit prüfen, nichts schätzen.
**Betroffen:** `src/domain/tour/points.ts` (Kategorien-Typ, `CAT_DISPLAY_TO_POINTS`, Punktetabellen), `src/domain/tour/optimizeSeason.ts` (nutzt `expectedPoints` — greift automatisch, sobald points.ts Damen kennt). Tests: neue Vitest-Fälle für die W-Kategorien; ggf. `POINTS_RULES_VERSION` hochziehen.
**Nicht Teil davon (geprüft, korrekt):** Beschriftung (Damen = `itf_wtt` → „ITF World Tennis Tour"), Meldeweg (IPIN), Fristen (Do −18 / Di −13 / Do-Freeze, belegt aus dem gemeinsamen WTT-Regelwerk), Preisgeld (echt im Stamm, W35 zwei Werte).
**Fertig wenn:** `toPointsCategory` bildet W15–W100 (und W25) auf belegte WTA-Punkte ab; unter „most_points" tragen Damen-Turniere ihren echten Wert; Tests grün; Sperre aufgehoben.

### MU-044 · Reihenfolge bei Datenimporten: Code zuerst deployen, Daten danach · S · offen
**Problem:** Das Seiten-Gate wurde am 09.08. entfernt (Commit `6050fbb`). Seither ist `/tour` (und `/tour/browse`) für **jeden eingeloggten Nutzer** erreichbar; `COMPETE_EARLY_ACCESS_OPEN` steuert nur noch den Mode-Umschalter INNERHALB `/app`, nicht die eigenständigen `/tour/*`-Routen.
**Wirkung:** Neue Daten gehen **sofort live, sobald sie in der (gemeinsamen) Prod-DB stehen — ohne Deploy, ohne Prüfung**. Bei den 392 Junioren-Turnieren (MU-043) ist genau das passiert: sie waren öffentlich sichtbar mit **falschen Fristen** (Do −18 statt Di −20) und **falscher Beschriftung** („ATP Challenger"), weil der zugehörige Code erst später deployt wurde. Der Zustand war zwischenzeitlich schlechter als vorher.
**Lösung:** **Reihenfolge umkehren — Code ZUERST deployen, Daten DANACH importieren.** Für jeden Import, der neue Serien/Kategorien/Felder einführt, die die UI anders darstellt: (1) UI/Domain-Code deployen, der die neuen Daten korrekt rendert, (2) erst dann `--write` in die Prod-DB, (3) Prod prüfen. Als Regel in `CLAUDE.md` verankert (Supabase-Abschnitt).
**Fertig wenn:** Die Regel steht in `CLAUDE.md` und wird bei künftigen Importen befolgt. (Regel eingetragen — Ticket bleibt offen als Erinnerung, bis das Muster ein paarmal gelebt wurde.)

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
**Stand (2026-08-16):** Für /tour ist Weg a) gebaut — `web.tour_result_history` + `src/domain/tour/pointsForecast.ts` (nutzt den bewiesenen Verfall aus `points.ts`) speisen die Rangprognose auf `/tour/points` (Stand + Ausblick +4/+8/+12 Wochen + Verfallsplan, PUNKTE statt Ränge). OFFEN bleibt der /app-Pfad: `projectSeasonPoints`/`CompeteRanking` in `src/lib/tournaments.ts` addiert weiterhin ohne Verfall (liegt unter `src/app/app/**` bzw. wird dort genutzt).
**Sperre:** `COMPETE_EARLY_ACCESS_OPEN` darf nicht auf `true`, solange die /app-Projektion den Verfall verschweigt.

### MU-017 · Verwaiste Belegfotos im Bucket `tour-receipts` · M · offen · **Vor Launch**
**Problem:** Wird eine Ausgabe gelöscht, bleibt die Belegdatei im Bucket `tour-receipts` liegen. Der naheliegende Weg über einen DB-Trigger ist auf Supabase NICHT möglich: direktes Löschen in `storage.objects` wird abgelehnt (`42501`, „Use the Storage API instead") — ein solcher Trigger würde außerdem den gesamten Löschvorgang abbrechen und /tour wie /app beschädigen. Belegt und wieder entfernt bei der Einrichtung des Buckets (`supabase/web_tour_receipts.sql`).
**Wirkung:** Gelöschte Belege leben als Datei weiter. Auf einem Bon stehen Ort, Uhrzeit und oft Kartenstellen. Besonders relevant, weil /app (`ExpensesView`) Ausgaben löscht, ohne den Beleg zu kennen.
**Lösung (zwei Teile):**
- a) /tour löscht beim Entfernen einer Ausgabe die Datei über die Storage-API mit (`storage.from('tour-receipts').remove([...])`) — deckt den Normalfall, kommt mit der Datenschicht.
- b) Ein geplanter Aufräum-Lauf (Edge Function oder Cron mit Service-Rolle), der Objekte ohne passende `tour_expenses`-Zeile entfernt — deckt /app-Löschungen und Abbrüche beim Upload. **Gilt auch für den Bucket `tour-documents`** (Turnier-Ordner): dort ist der Hauptvektor bereits geschlossen (nur /tour schreibt; Upload mit Kompensation; Löschen entfernt die Datei zuerst), Restvektor ist der Profil-Hard-Delete (Cascade löscht die Zeile, nicht die Datei). Derselbe Lauf entfernt Objekte ohne passende `tour_tournament_document`-Zeile — der Pfad `<uid>/<tournament_id>/…` macht die Zuordnung eindeutig.
**Sperre:** Nicht mit echten Nutzern starten, solange b) fehlt.

### MU-018 · Schengen-Zähler unterschätzt den Aufenthalt · M · offen · **Vor Launch**
**Problem:** `schengenProjection` (`src/lib/schengen.ts`) zählt nur Turnierfenster (`start_date` bis `end_date`), nicht den durchgehenden Aufenthalt. Wer zwischen zwei Turnieren im Schengen-Raum bleibt — bei Clustern der Normalfall — sammelt ungezählte Tage.
**Wirkung:** Die Anzeige ist systematisch zu optimistisch. Bei einer Regel, deren Verletzung eine Einreisesperre nach sich zieht, ist das die gefährliche Richtung. Ein Spieler erfährt es an der Grenze.
**Lösung:** Entweder Aufenthalte durchgehend zählen (Nutzer trägt Ein- und Ausreise ein), oder die Anzeige klar als Untergrenze kennzeichnen („mindestens X Tage, tatsächlicher Aufenthalt kann höher liegen").
**Stand (e58a504):** `/tour` hat einen EIGENEN Zähler, der auf bestätigten, durchgehenden Aufenthalten rechnet (`src/domain/tour/schengen.ts`, `web.tour_stays`, Route `/tour/schengen`) — dort ist die Untererfassung behoben. Das Ticket bleibt trotzdem offen: Es betrifft den Zähler im **/app-Compete** (`src/lib/schengen.ts`), der weiterhin auf Turnierfenstern rechnet und unterschätzt.
**Sperre:** `COMPETE_EARLY_ACCESS_OPEN` nicht auf `true`, solange die Anzeige eine Untererfassung als Restkontingent darstellt.

### MU-019 · Visa-Regeln ignorieren die Nationalität · M · **erledigt** · **Vor Launch**
**Problem:** `countryRegime` in `src/lib/visa.ts` entscheidet nur nach Zielland. „USA → ESTA $21" gilt nur für Spieler mit Visa-Waiver-Pass. Für alle anderen ist die Auskunft falsch. Zusätzlich sind die Gebühren hartkodiert, undatiert und ohne Quellenbeleg (UK ETA lag zuvor bei £10).
**Wirkung:** Betrifft besonders Spieler aus Afrika, Südasien und Lateinamerika — genau die Gruppe mit den größten Visa-Hürden.
**Gelöst** (`44f670d`, `68a6564`): Neuer nationalitätsabhängiger Bestand `web.tour_visa_requirements` (2410 Zeilen, 31 Nationalitäten × 83 Zielländer, Quelle Wikipedia mit Revisionsdatum je Zeile) plus `optimizeSeason` v2 mit `entryBanned` und dem Ablehnungsgrund `einreise_gesperrt`. Per Playwright belegt: Bei iranischer Nationalität erscheint die Sperr-Karte ohne Antragslink, US-Turniere tauchen im Vorschlag nicht auf und stehen mit Grund unter den verworfenen Kandidaten.
**Bekannte Lücke:** KR → IR (schwarze Zelle ohne Vorlage, in `scripts/visa-wikipedia-import.md` dokumentiert). Fehlerrichtung bewusst: im Zweifel keine Sperre.
**Offen bleibt:** `src/lib/visa.ts` existiert weiterhin daneben und entscheidet nur nach Zielland. Ob es abgelöst wird, ist eine eigene Entscheidung → als [MU-031] aufgenommen (Priorität 2).

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

### MU-032 · Kein ITF-Turnier mit offener Meldefrist — Planer für Futures-Spieler leer · L · ✅ ERLEDIGT
**Problem:** Kein aktives ITF-Turnier hat eine offene Meldefrist. Der späteste ITF-Turniermontag im Bestand ist `2026-08-03`, heute ist `2026-08-09`. Ursache: Wikipedia trägt ITF-Turniere erst nach, wenn sie laufen — der Kalender endet strukturell in der Vergangenheit.
**Wirkung:** Für einen Futures-Spieler ist der Planer leer. Alle 1007 ITF-Turniere zeigen „Meldeschluss abgelaufen", der Optimierer wählt nur aus Challengern. Der Meldefrist-Countdown (`aba9789`) greift bei null Turnieren. Das trifft genau die Zielgruppe.
**Gelöst** durch `scripts/itf-import.mjs` (Endpunkt `TournamentApi/GetCalendar`, Circuits MT und WT). 409 Turniere importiert, davon 291 mit offener Meldefrist. Der Optimierer findet 172 Kandidaten in Europa für die nächsten drei Monate — vorher 0. Junioren (395) bleiben offen, siehe MU-043.

### MU-035 · Fremde Personenfotos ohne Einwilligung in `service_providers.image_url` · M · offen · **Vor Launch** · **Rechtsfrage**
**Problem:** Alle 77 Einträge in `web.service_providers` tragen ein `image_url`, das auf einen fremden Server zeigt. 33 sind Website-Favicons über `icons.duckduckgo.com` — als Anbieterfoto wertlos. Die übrigen 44 sind von den Websites der Anbieter gehotlinkt; jedes Personenfoto darunter erscheint ohne Einwilligung der abgebildeten Person. Ein Porträt ist ein personenbezogenes Datum, eine Rechtsgrundlage liegt nicht vor. Aus der URL lässt sich nicht unterscheiden, welche Bilder Personen zeigen. Verschärfend: Die Bilder werden live von fremden Servern geladen — fremde Bandbreite, und wer die Datei dort austauscht, ändert das Bild in unserer App.
**Wirkung:** Sobald ein Services-Bereich sichtbar wird, zeigt die App fremde Personenfotos ohne Grundlage. Bei einem Widerspruch wäre das nicht verhandelbar.
**Lösung:** `image_url` nicht anzeigen. Stattdessen Monogramm oder Initialen, wie bei den Turnierlogos (MU-025). Echte Bilder nur von Anbietern, die sich selbst eintragen und eins hochladen — dafür fehlt heute der Upload: `ProviderListingForm` hat kein Bildfeld, `createProviderListing` schreibt kein `image_url`.
**Ergänzend prüfen:** Ob die 77 `image_url`-Werte überhaupt in der Datenbank stehen bleiben sollen oder geleert werden.
**Sperre:** Kein Services-Bereich mit Fremdbildern.

### MU-036 · `matches`-Insert erzwingt kein gegenseitiges Verbinden — unaufgefordertes Anschreiben möglich · M · offen · **Vor Launch** · **Sicherheit**
**Problem:** Die INSERT-Policy `web_matches_ins` (in `supabase/web_security_hardening_2.sql`) prüft nur `auth.uid() in (user1_id, user2_id)` — also dass der Erzeuger selbst Teilnehmer der Unterhaltung ist. Ein **gegenseitiges Like wird nicht verlangt.** `ensureMatch` (`src/lib/matchmaking.ts`) prüft es ebenfalls nicht — es legt die Zeile idempotent an. Die Produktkonvention „Chat nur bei gegenseitigem Verbinden" ist reine Client-Konvention (`LikesTab.tsx:61` ruft `ensureMatch` erst beim Rück-Like); die Datenbank erzwingt sie nicht. Wer die PostgREST-API direkt anspricht, kann für sich und eine beliebige fremde `user_id` eine `matches`-Zeile anlegen und danach sofort über `messages` schreiben (deren Insert nur `sender_id = auth.uid() AND is_my_match(match_id)` prüft — beides dann erfüllt).
**Wirkung:** Unaufgefordertes Anschreiben Fremder ist möglich. In einer App, in der man sich mit Fremden verabredet, ist genau das das, was Nutzerinnen zuerst vertreibt — der erste Missbrauchsfall, nicht der letzte.
**Lösung:** `web_matches_ins` muss zusätzlich zur Teilnehmer-Prüfung eine Verbindungs-Bedingung erzwingen: **gegenseitiges Like ODER gemeinsames Spiel-Event.** Das ODER ist zwingend, weil Matches auch über `game_event_id` (aus Spielen) entstehen — ganz ohne Like; eine reine Mutual-Like-Prüfung würde die legitimen Spiel-Matches blockieren. Umsetzung über einen `SECURITY DEFINER`-Helper mit fixem `search_path` (wie `is_my_match`), z. B. `web.may_match(a uuid, b uuid) returns boolean`, der true liefert, wenn **(1)** beide Like-Richtungen zwischen a und b in `web.likes` existieren **ODER (2)** a und b als Teilnehmer im selben `game_event` stehen. Policy dann: `with check (auth.uid() in (user1_id, user2_id) AND web.may_match(user1_id, user2_id))`. `ensureMatch` defensiv nachziehen (Bedingung clientseitig vorab prüfen, sauberer Fehler statt RLS-Ablehnung). Nur INSERT betroffen — bestehende Matches bleiben unangetastet.
**Beweis der Wirkung:** Zwei Testkonten ohne gegenseitiges Like → direkter `matches`-Insert via API muss mit `row violates check`/permission denied scheitern; mit gegenseitigem Like **oder** gemeinsamem Spiel-Event muss er durchgehen.
**Hinweis (Turnier-Chat):** Der geplante Turnier-Chat soll das Anschreiben an ein beidseitiges Präsenz-Opt-in koppeln (beide beim selben Turnier eingetragen, beide mit Absicht). Das ist eine **dritte** erlaubte Verbindung und gehört als weiterer ODER-Zweig in genau diese Policy/`may_match` — nicht über die hier geschlossene Lücke. `may_match` deshalb erweiterbar bauen.
**Sperre:** Nicht mit echten Nutzern starten, solange die Datenbank unaufgefordertes Anschreiben Fremder zulässt.

### MU-037 · „Günstigste Saison füllen" ersetzt die bestehende Saison — Datenverlust ohne Vorwarnung · M · **erledigt** · **Vor Launch**
**Erledigt (14.08.):** „Ergänzen statt ersetzen" umgesetzt (`smartFill` in `SeasonWorkspace.tsx`): belegte Wochen fallen aus den Kandidaten, gefüllt wird nur ins Restbudget, persistiert wird ausschließlich `addToSeason` — kein `removeFromSeason` mehr. Rückmeldung nach dem Füllen. Beleg `e2e/tour-fill.spec.ts` (REST-Snapshot/Restore): Bestand B1=6 → S1=15, ergänzt=9, gelöscht=0. **Sperre aufgehoben.**
**Problem:** „Günstigste Saison füllen" (`smartFill` in `SeasonWorkspace.tsx`) **ersetzt** die bestehende Saison. Der Diff entfernt alle Einträge, die nicht unter den Optimierer-Picks sind (`toRemove = aktuelle \ picks`, sofort persistiert via `removeFromSeason`). Eine von Hand kuratierte Saison ist damit weg — ohne Warnung, ohne Rückweg.
**Belegt:** Beim /tour-Audit am 14.08. hat ein einziger Klick sechs kuratierte Einträge des Testkontos gelöscht. Die IDs waren nicht wiederherstellbar.
**Wirkung:** Ein Spieler plant seine Saison von Hand, drückt aus Neugier den Knopf und verliert die Arbeit. Das ist Datenverlust ohne Vorwarnung — bei der zentralen Aktion der Seite.
**Lösung:** Entweder **ergänzen statt ersetzen** (belegte Wochen sperren, wie es der früher gebaute Vorschlag tat), oder vor dem Ersetzen fragen und sagen, wie viele Einträge entfernt würden. Die erste Variante ist die bessere: Der Knopf heißt „füllen", nicht „ersetzen".
**Sperre:** Nicht mit echten Nutzern starten, solange ein Klick eine geplante Saison löschen kann.

## Priorität 2 — Produktwert (Tour ist der Burggraben)

### MU-043 · Junioren-Turniere (Circuit JT) — Schritt 1 erledigt, Schritt 2 (Alterskontingent) offen · M · teilweise
**Schritt 1 — ✅ ERLEDIGT (Import + Fristen):**
- `tour_tournaments_series_check` um `itf_juniors` erweitert (`supabase/web_tour_tournaments_series_juniors.sql`, additive Allowlist, Rollback im File).
- `deadlines.ts` v2: Junioren-Fristen **eigenständig aus dem Junioren-Regelwerk §39 belegt** (nicht von der WTT übernommen): Entry Di −20 (nur J30–J300), Withdrawal Di −13, Freeze Mi davor, je 14:00 GMT. **J500 / Junior Grand Slam (JGS): Meldeschluss UNBEKANNT** (41/34/27/20 T turnierspezifisch → `entry = null`, wie bei Challengern). Im Code ausdrücklich vermerkt, dass Withdrawal/Freeze nur ZUFÄLLIG mit der WTT übereinstimmen. Grad wird durch die Fristen-UI + reminders-Route durchgereicht (`decide.ts` gegen null-Entry abgesichert).
- **392 Junioren importiert** (`itf-import.mjs --write`, JT jetzt writable) + resolve. Grade: J30 190, J60 105, J100 56, J200 25, J300 9 (Standard, Frist berechnet) · J500 3, JGS/GC/JM 4 (Entry unbekannt).
- **Minderjährige unter 13 nicht meldeberechtigt** (§4 b / Age Eligibility Chart Note 3): jedes Junioren-Fristen-Ergebnis trägt den Code `unter_13_nicht_meldeberechtigt`. Domain benennt es; die **UI-Anzeige dieses Hinweises steht noch aus** (kleiner Rest von Schritt 1 → Schritt 2 oder eigener UI-Task).

**Schritt 2 — offen (Belastungssteuerung/Alterskontingent):** Turnieranzahl pro Jahr nach Alter (§ Age Eligibility Chart: 13→10, 14→14, 15→18, 16→25, 17/18 unbegrenzt; gezählt **ab Geburtstag**, nicht Kalenderjahr; max. 3 Meldungen/Woche). Braucht ein **Geburtsdatum** — `profiles` speichert bewusst keins. Bewusste Produktentscheidung (Datenschutz Minderjähriger), nicht nebenbei bauen. Ebenfalls hier: den `unter_13`-Hinweis in der Junioren-Ansicht sichtbar machen (i18n DE/EN).

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

### MU-028 · Preisgeld-Ableitung ohne Jahres-Staffelung · M · ✅ ERLEDIGT
**Problem:** `PRIZE_USD` in `scripts/wikipedia-import.mjs` (Zeile 90–95) leitet das Preisgeld aus der Kategorie ab, mit festen, JAHRES-UNABHÄNGIGEN Werten. M25 steht dort auf 25000 USD; laut 2026-WTT-Regelwerk sind es 2026 aber 30000. Die Struktur kann Jahresänderungen grundsätzlich nicht abbilden.
**Wirkung:** Alle 2026er M25-Turniere tragen einen um 5000 USD zu niedrigen Preisgeld-Claim. Bei jeder künftigen ITF-Preisgeldreform wiederholt sich der Fehler still. Entschärfend: Der Wert ist als Ableitung mit niedriger confidence markiert, nicht als Beobachtung.
**Gelöst** — der Endpunkt (`scripts/itf-import.mjs`) liefert echte Preisgelder, die vom abgeleiteten Kategorie-mal-tausend abweichen (M25 = 30.000 statt 25.000, W35 mit zwei verschiedenen Werten). Als Claim mit Confidence 0.9 importiert; `resolveClaimField` zieht sie dem abgeleiteten Wert (0.5) vor. Auf den Live-Zeilen bestätigt.

### MU-030 · Spieler-Setups im Konfigurator ohne Datenstand und Quelle · M · offen
**Problem:** Die zwölf Spieler-Setups im Konfigurator (`src/components/shop/BespannungConfigurator.tsx`) tragen weder Datenstand noch Quellenangabe. Tour-Setups ändern sich saisonal — belegt am Fall **Alcaraz**, dessen Saite von RPM Blast auf RPM Team wechselte und an zwei Stellen unterschiedlich stand (behoben mit `3ad5897`). Für die übrigen elf ist die Aktualität unbekannt: keine Quelle, kein Datum.
**Wirkung:** Ein Nutzer besaitet nach einer Angabe, die zwei Jahre alt sein kann, und hält sie für aktuell. Das widerspricht der Haltung im Projekt — Begründung, Datenstand, Confidence.
**Lösung:** Je Setup eine Quellenangabe und einen Datenstand führen und anzeigen. Setups ohne belegte Quelle als solche kennzeichnen. **Ohne Quelle nichts ändern** — raten wäre schlimmer als eine alte Angabe mit Datum.
**Einzelfälle:**
- **Federer** ist seit 2022 zurückgetreten. Bei „Spiele wie die Profis" führt ein vier Jahre altes Setup in die Irre. Entweder entfernen oder als Referenz kennzeichnen — Produktentscheidung.
- **Fritz** zeigt „Racket brand: Head" neben einer Solinco-Saite. Das ist auf der Tour üblich und kein Fehler, liest sich aber wie ein Widerspruch. Beschriftungsfrage.

### MU-031 · `visa.ts` ablösen oder zielland-basiert belassen · M · offen
**Kontext:** Mit MU-019 steht der nationalitätsabhängige Bestand `web.tour_visa_requirements` samt `optimizeSeason`-Sperre und Anzeige. `src/lib/visa.ts` (zielland-basierter Regime-Mapper: Schengen/UK-ETA/ESTA/… mit Antragslink, Kosten, Doku-Checkliste) läuft bewusst daneben weiter — der neue Bestand trat neben ihn, ohne ihn anzufassen.
**Entscheidung:** Ob und wie `visa.ts` abgelöst wird, ist eine eigene Frage. Optionen: (a) ganz durch den Bestand ersetzen — dann fehlen aber Antragslink/Kosten/Checkliste, die der Bestand bewusst nicht führt; (b) beide verschränken — Bestand liefert Klasse + Datenstand, `visa.ts` die Regime-Handreichung; (c) `visa.ts` als reine Regime-Hilfe belassen. Vermutlich (b).
**Wirkung:** Solange beide nebeneinander laufen, kann eine zielland-basierte Aussage (visa.ts) neben einer nationalitätsabhängigen (Bestand) stehen — für den Nutzer nicht immer klar getrennt.
**Lösung:** Rollen der beiden Quellen festlegen, Anzeige zusammenführen, Doppelaussagen vermeiden.

### MU-034 · Dienstleister-Bestand deckt die Turnierländer nicht — Services-Abschnitt vorerst nicht bauen · M · offen
**Problem:** Die 77 Dienstleister in `web.service_providers` verteilen sich auf vier Länder, 60 davon in der Schweiz. **85% der Turniere (1273 von 1489) liegen in Ländern mit null Anbietern** — darunter alle volumenstarken Turnierländer: USA 117, Tunesien 96, Italien 94, China 69, Türkei 53, Ägypten 50, Portugal 47, Deutschland 43. Die Verteilung ist invertiert: Wo die meisten Anbieter sitzen (Schweiz, 60), finden 12 Turniere statt.
**Wirkung:** Ein Dienstleister-Abschnitt in /tour wäre für die Zielgruppe in der großen Mehrheit der Turnierwochen leer. Echten Nutzen hätte er heute nur in Spanien (6 Anbieter, 96 Turniere) und Frankreich (5 / 79).
**Lösung:** Bestand in den Turnierländern aufbauen, bevor die Oberfläche gebaut wird — Besaiter und Physios in Tunesien, der Türkei, Ägypten, Italien und Portugal. Die technische Seite ist vorbereitet: `service_providers` hat vollständige Koordinaten (77/77), `src/lib/services.ts` ist UI-unabhängig, eine Umkreissuche wäre ohne Schemaänderung möglich.
**Entscheidung:** Vorerst **NICHT bauen**. Ein Element, das in 85% der Fälle nichts zeigt, wirkt wie ein Fehler — dasselbe Muster wie die Karte ohne Koordinaten (MU-029).

### MU-041 · Beispiel-Spieler in „Vor Ort" vor dem Start mit echten Nutzern abschalten · S · offen
**Kontext:** Der „Vor Ort"-Reiter zeigt fünf Beispiel-Spieler je Turnier (`src/lib/tourPresenceDemo.ts`) — zum Vorführen, damit die Ansicht nicht leer ist. Sie stehen NICHT in `player_presence` (reine Anzeigedaten), tragen einen Hinweis über der Liste und eine „Beispiel"-Pille, und haben keinen Anschreiben-Knopf.
**Wirkung:** Sobald echte Spieler sich eintragen, stünden erfundene neben echten Einträgen — auch gekennzeichnet ist das unschön und kann verwirren.
**Lösung:** Vor dem Start mit echten Nutzern in Vercel `NEXT_PUBLIC_TOUR_PRESENCE_DEMO=off` setzen und neu deployen (Vorgabe ist AN). Danach verschwinden die Beispiele; die lokalen Pexels-Bilder in `/public/seed/tour` können bleiben oder mit entfernt werden. Gehört zum Launch-Cleanup neben `COMPETE_EARLY_ACCESS_OPEN=false` und dem Löschen des Prod-Testkontos.

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

### MU-038 · Jahresübergreifende Turnier-Identität fehlt · M · offen
**Problem:** `web.tour_tournaments` führt einen Eintrag je AUSGABE und Jahr (`source_ref` ist jahresspezifisch, z. B. `itf:m-itf-tun-2025-032`); es gibt KEINE Kennung, die dasselbe Turnier über die Jahre verbindet. Alles, was pro Turnier hängt, hängt damit am Turnier 2026, nicht am Turnier überhaupt.
**Wirkung:** Der Wildcard-Kontakt (`tour_wildcard_contact`) ist je Edition — wer dasselbe Turnier zwei Jahre spielt, trägt den Direktor zweimal ein. Bekannte Einschränkung, keine Nachlässigkeit. Betrifft ebenso „hier habe ich letztes Jahr gut gespielt" und eine spätere Cut-off-Historie (falls je verfügbar).
**Lösung:** Eine stabile Turnier-Serien-Kennung (z. B. normalisiert aus Ort/Kategorie/Woche oder eine kuratierte `tournament_series`-Tabelle), an die editionsübergreifende Daten hängen können. Ein „aus dem Vorjahr übernehmen"-Kopierschritt wäre die minimale Zwischenlösung.

### MU-039 · Gegnerstärke fehlt für die Leistungsauswertung · M · offen
**Problem:** Der Bericht nennt „Siegquote gegen Top 500 / gegen 500 bis 1000" als Planungsgrundlage. Das ist heute nicht berechenbar: `web.tour_events.opponent` ist FREITEXT (ein Name), es gibt KEINE Rangangabe zum Gegner. `tour_profiles.ranking` ist der eigene Rang, `player_presence.rank_label` gehört zu Discover — beide sind nicht der Gegner.
**Wirkung:** Die Leistungsauswertung (`/tour/form`) zeigt Siegquoten nach Belag und Kategorie, aber NICHT nach Gegnerstärke. In der UI ist das benannt („kein Rang zum Gegner erfasst"), nicht geschätzt.
**Lösung:** Spalte `opponent_rank` (int, nullable) in `web.tour_events` + Erfassung im /app-Kalender (dort werden Matches eingetragen). Dann eine Domain-Funktion, die Siegquoten nach Rang-Bändern (Top 100 / 100–250 / 250–500 / 500–1000 / >1000) bildet. **Eigener Auftrag mit /app-Eingriff** — bewusst kein Nebenschritt der Auswertung.

### MU-040 · Team-Leserecht auf Stammdaten (Besaiter/Coach) · S · offen
**Problem:** Die Spielerstammdaten liegen nach Empfindlichkeit getrennt: `web.tour_equipment` (Ausrüstung) und `web.tour_emergency_contact` (Notfallkontakt) sind eigene Tabellen — HEUTE beide owner-only. Der Besaiter dürfte die Ausrüstung sehen, der Coach womöglich den Notfallkontakt.
**Wirkung:** Ein Besaiter vor Ort muss die Ausrüstung heute mündlich erfragen; der Coach hat den Notfallkontakt nicht.
**Lösung:** Je Tabelle eine rollenscharfe Read-Policy über `web.tour_team` (Muster wie die Finanz-Agent-Policy MU-026): Ausrüstung → Rolle `stringer` (die es in tour_team NOCH NICHT gibt → zuerst Rolle + Einladungs-Flow im /app-Team ergänzen), Notfallkontakt → Rolle `coach`. Der Notfallkontakt sind fremde Personendaten (MU-035) → das Freigeben bleibt eine BEWUSSTE Entscheidung des Spielers, kein Default. Die Tabellenstruktur ist bereits darauf ausgelegt (je eine Ein-Policy-Änderung).

### MU-042 · Aufräum-Cron für vergangene Trainingsslots · S · offen
**Problem:** Vergangene Trainingsslots (`web.tour_training_slot` mit `slot_date < heute`) werden im „Vor Ort"-Reiter nur AUSGEBLENDET (Anzeige-Filter `isPastSlot`), nicht gelöscht. Ebenso hängen die zugehörigen `web.tour_training_slot_response`-Zeilen (per FK `on delete cascade` an den Slot gebunden).
**Wirkung:** Bei einem aktiven Spieler sammeln sich über eine Saison hunderte Slot-Zeilen plus Antworten an — tote Daten, die nie wieder sichtbar werden. Kein Handlungsdruck, rein hygienisch.
**Lösung:** Täglicher Cron (Muster wie `/api/sync/tournaments` in `vercel.json`, Service-Client), der `web.tour_training_slot` mit `slot_date < current_date` löscht; die Antworten gehen per Cascade mit. Karenz erwägen (z. B. `slot_date < current_date - 7`), damit eine gerade vergangene, noch relevante Verabredung nicht sofort verschwindet. Kein UI-Eingriff.

## Erledigt

- ✅ MU-033 · Verwaister TourWorkspace-Cluster entfernt: `TourWorkspace`, `useTourWorkspace`, `sections/*` (SeasonList, SeasonOverview, MapPreview, RareStuff, NextDeadline). `SetupPanel` blieb (hängt an `/tour/setup`). Teil des /tour-Umbaus auf `SeasonWorkspace`.

- ✅ RLS-Härtung über alle 44 Tabellen, Events-Datenschutz (Teilnehmerzeilen nicht öffentlich)
- ✅ Compete/Tour-Modus komplett gebaut (3 Etappen), hinter Early-Access-Gate
- ✅ Advice: Schläger-Finder, Saiten-/Spannungs-Finder, Vergleich, Problem-Solver, Methodik (13 Tests grün)
- ✅ Falscher Link `www.generali-open.at` (NXDOMAIN) → `generali-open.at` korrigiert
- ✅ Test-Account `claude-compete-test` gelöscht
- ✅ Event-Detailseite `/events/[id]` mit SEO-Metadata (`fcfdf39`)
- ✅ Profilgalerie mit Mehrfachauswahl im Profil-Editor (`a67e02c`)
