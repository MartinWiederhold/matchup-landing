# Der digitale "Tennis-Operating-System": Recherche zu Kalender, Visa/Meldungen und Steuern für Tour-Profis

## TL;DR
- **Es gibt bislang keine spielerzentrierte "Operating-System"-WebApp, die Turniermeldungen/Deadlines, Reise-/Visa-Logistik und Ausgaben-/Steuermanagement für einzelne Tour-Profis bündelt** — der Markt ist aufgeteilt in Club-/Akademie-Software (Playtomic, Upper Hand), Video-/Analyse-Systeme (Wingfield, PlaySight, SwingVision) und Nischen-Tools (Match Tennis App für Junioren/Eltern). Diese Lücke ist die zentrale Produktchance.
- **Alle drei Bereiche laufen heute manuell und fragmentiert ab:** Meldungen über ATP PlayerZone/ITF IPIN mit festen Deadlines (Rankings-Stichtag max. 42 Tage vor Turnierstart bei ATP, 21 Tage bei Challenger, ITF-Freeze 4 Tage vorher), Order of Play erst am Vorabend, Visa-Tracking per Excel/Kopf, Ausgaben per Belegkasten oder Expensify plus Steuerberater. Die Bausteine (Kalender-APIs, OCR/LLM-Belegerfassung, Schengen-Rechner, DATEV-Export) existieren jedoch alle einzeln als reife Technologien.
- **Eine WebApp sollte auf drei Säulen bauen:** (1) ein Sync-Kalender, der ATP/ITF-Deadlines und Order-of-Play automatisch einliest und Team-Koordination (Coach/Physio/Hitting Partner) ermöglicht; (2) ein Visa-/Aufenthaltstage-Tracker mit Länder-Regelwerk (Schengen 90/180, ESTA, UK ETA, Australien ETA) und Countdown-Alerts; (3) eine OCR/KI-Belegerfassung mit automatischer Kategorisierung und steuerfertigem Export (DATEV EXTF/CSV, Mehrwährungs- und Mehrländer-Logik).

---

## Key Findings

**Bereich 1 – Kalender & Training**
- Der ATP-Kalender umfasste laut ATP Tour ("Tennis Explained: Explaining The Tour", atptour.com) 2023 "more than 60 events in nearly 30 countries"; die Turnierteilnahme richtet sich nach Ranking-Cut, Punkten und Preisgeld.
- Meldungen laufen über die **ATP PlayerZone** (offizielles Kommunikationsmedium, App + Web, passwortgeschützt) und über **ITF IPIN/Tour Zone** für die World Tennis Tour. Die PlayerZone-App wird von Spielern in Store-Reviews als kompliziert und wenig benutzerfreundlich kritisiert.
- **Order of Play** wird typischerweise erst am Vorabend veröffentlicht (Beispiel: "Not Before 6:00 pm"), was Planung für Team und Reise erschwert.
- Für Trainingsplanung/Coach-Koordination existieren nur Club-/Akademie-Tools (SportEasy, TeamSnap, CoachNow, Upper Hand, Playtomic) — keine spielerzentrierte Tour-Lösung. Viele Profis nutzen laut Recherche generische Tools (Google/Apple Calendar, Excel, Notion).

**Bereich 2 – Visa & Meldungen**
- **ATP Entry Deadline** für das Singles-Hauptfeld: 12 Uhr Eastern Time, **42 Tage** vor dem Montag der Turnierwoche (ATP Tour); **21 Tage** bei ATP Challenger. Das ATP-Rulebook 2025 (Kapitel 9, atptour.com) hält fest: "Rankings lists utilized shall not be more than 42 days prior to the start of the tournament." Withdrawal Deadline und On-Site Sign-in mit weiteren festen Fristen (u.a. Freitag 10 Uhr ET vor Turnierwoche für Late Withdrawal).
- **ITF IPIN**: kostenpflichtige Mitgliedschaft, verpflichtende Education-Kurse, Turnier-Ein-/Austritt über IPIN-Account; Entry/Withdrawal/Freeze/Sign-in-Deadlines pro Fact Sheet (Freeze: 14:00 GMT, 4 Tage vor Montag der Turnierwoche).
- **Visa-Realität**: Spieler reisen 250–320 Tage/Jahr. Relevante Regime: Schengen 90/180 (rollierend), US ESTA/B-1/P-1/O-1, UK ETA (harte Durchsetzung ab 25. Februar 2026; Anstieg von £16 auf £20 ab 8. April 2026, gültig 2 Jahre — UK Home Office ETA-Factsheet), Australien ETA, EU EES/ETIAS (Rollout 2026). Tracking heute meist manuell.
- Bestehende Consumer-Apps für Aufenthaltstage: Pebbles, Nomad Tracker, TrackingDays, Flamingo Compliance, Days of Stay — keine ist tennis-spezifisch oder mit Turnierkalender verknüpft.

**Bereich 3 – Ausgaben & Steuern**
- Typische Kategorien: Flüge, Hotels, Coach-Honorare, Physio, Bespannung/Equipment, Turniergebühren, Agenten, Sparringspartner.
- **Besteuerung**: Quellensteuer nach Ort der Einnahme. Die USA erheben laut IRS (irs.gov, "Withholding tax on payments to foreign artists and athletes") nach IRC §§1441/1442 pauschal **30% Quellensteuer** auf FDAP-Bruttoeinnahmen (inkl. Preisgeld) ohne Abzug von Ausgaben, sofern kein DBA gilt — reduzierbar über ein Central Withholding Agreement (Antrag ≥45 Tage vorher). Hinzu kommt die **"jock tax"** der Bundesstaaten: Sie gilt laut Rotfleisch/Mondaq (2026) "in every state where matches are played. California, New York, and New Jersey impose the highest marginal rates; Texas and Florida impose none", berechnet nach "duty days". Frankreich behält 15% ein, UK 20% Withholding (bis 45% effektiv). Doppelbesteuerungsabkommen mildern via Foreign Tax Credit; viele Profis mit Wohnsitz Monaco/Schweiz/Dubai.
- **Steuerexport**: In DACH ist **DATEV EXTF/CSV** (Buchungsstapel) das Standardformat, plus DATEV Unternehmen online, SKR03/SKR04-Kontenrahmen; Tools wie sevDesk, Lexware Office, WISO MeinBüro bieten Ein-Klick-Export.
- **OCR/KI**: reife Technologien. Veryfis eigener Benchmark 2025 nennt 98,7% Feldgenauigkeit bei ~2,8 Sek. Antwortzeit (91 Währungen/38 Sprachen); unabhängige Benchmarks (invoicedataextraction.com, 2026) nennen realistisch "85% to 99% field-level accuracy" je nach Dokumentkomplexität. Trend 2025/26: Wechsel von klassischem OCR zu LLM-basierter Extraktion (bessere Erkennung mehrsprachiger/ausländischer Belege, aber Halluzinationsrisiko bei Beträgen).
- **Athleten-Fintech** existiert v.a. im US-College/NIL-Bereich (Athlete+, Scout, NIL Ledger) sowie B2B-Preisgeld-Auszahlung (Payment Labs) — nichts Tennis-Tour-spezifisches.

---

## Details

### Bereich 1: Trainings- und Matchkalender

**A) Wie es aktuell abläuft.** Der ATP-Turnierkalender umfasste laut ATP 2023 mehr als 60 Events in fast 30 Ländern, aufgeteilt in Grand Slams, Masters 1000, ATP 500 und ATP 250 sowie die ATP Challenger Tour und darunter die ITF World Tennis Tour. Ob ein Spieler ins Hauptfeld oder in die Qualifikation kommt, entscheidet sein Ranking zum Stichtag; weitere Faktoren sind Punkte, Preisgeld und Reiselogistik.

Die Meldung erfolgt über zwei offizielle Systeme:
- **ATP PlayerZone** – laut ATP-Regelwerk zusammen mit dem "Player's Weekly" das offizielle Kommunikationsmedium der ATP. Die dazugehörige App bündelt für Spieler und Betreuerstab Turnier-, Melde- und Business-Informationen; sie ist passwortgeschützt und nur nach ATP-Freigabe nutzbar. In App-Store-Bewertungen wird sie als unübersichtlich und wenig nutzerfreundlich kritisiert ("Everything about this app feels like it's done to make things so complicated").
- **ITF IPIN / World Tennis Tour Zone** – für die ITF-Ebene. Ein-/Austritt und Zeitplan laufen 24/7 über den IPIN-Account.

**Order of Play**: Der Spielplan des Folgetages wird typischerweise erst am Vorabend veröffentlicht, oft mit unpräzisen Startangaben ("Not Before 6:00 pm" oder "Followed by"). Das erschwert die exakte Planung von Aufwärmen, Physio-Slot, Mahlzeiten und Reise erheblich und ist eine strukturelle Unsicherheit, die keine offizielle App auflöst.

**Team-Koordination**: Für die Abstimmung mit Coach, Physio und Hitting Partner existiert keine tourweite Lösung. Die verfügbaren Tools (SportEasy, TeamSnap, CoachNow, Upper Hand, Koalendar, Planubo, Vev) sind auf Clubs, Akademien und lokale Coaching-Businesses zugeschnitten (Court-Booking, Mitgliederverwaltung, Rechnungsstellung). Profis behelfen sich mit generischen Tools (Google/Apple Calendar, Excel, WhatsApp, Notion-Templates).

**Bestehende "Smart Court"-Plattformen** (Wingfield, PlaySight, SwingVision, Zenniz, Mojjo) adressieren Videoanalyse und Leistungsdaten, nicht Logistik/Kalender. Wingfield (Hannover, gegründet 2017) verkauft die Wingfield Box als Netzpfosten-Hardware und ist offizielles Validierungstool für das LK-Ranking des DTB. PlaySight (Israel, 2010) betreibt SmartCourt-Kamerasysteme. SwingVision (Silicon Valley) bringt Smartphone-basierte KI-Analyse; laut Kingscrowd/Wefunder-Analyse (2025) haben "over 100 collegiate tennis teams across NCAA Division I, II, and III" SwingVision integriert, das Unternehmen zählt >20.000 zahlende Abonnenten, >4 Mio. USD ARR und wurde in >500 offiziellen USTA-Matches für elektronisches Line-Calling eingesetzt (Series A: 6 Mio. USD, angeführt von Andy Roddick und James Blake).

**B) Optimale WebApp-Umsetzung.** Kern wäre ein **intelligenter Sync-Kalender**, der:
- ATP-/ITF-Deadlines automatisiert einliest (Entry, Withdrawal, Sign-in) und in den persönlichen Kalender überträgt;
- die Order of Play scrapt/per API bezieht und bei Veröffentlichung Push-Alerts sendet;
- Team-Rollen (Coach, Physio, Hitting Partner, Agent) mit geteilten, rollenbasierten Kalendern und Verfügbarkeiten koordiniert;
- via Kalender-APIs (Google Calendar API, Apple CalDAV/EventKit, Microsoft Graph) bidirektional synchronisiert;
- Echtzeit-Sync (WebSockets/Server-Sent-Events oder Backend-as-a-Service wie Firebase/Supabase) und Push-Benachrichtigungen (Web Push, FCM/APNs) nutzt.

### Bereich 2: Visa, Entry Deadlines, ATP-Meldungen

**A) ATP Entry System & Deadlines.** Für die Teilnahme muss ein Spieler ATP Player Member oder Registered Player sein. Zentrale Fristen laut ATP-Regelwerk:
- **Entry/Withdrawal Deadline Singles-Hauptfeld (ATP Tour)**: 12 Uhr Eastern Time, **42 Tage** vor dem Montag der Turnierwoche (das ATP-Rulebook 2025 formuliert den Stichtag: "Rankings lists utilized shall not be more than 42 days prior to the start of the tournament").
- **ATP Challenger**: 12 Uhr ET, **21 Tage** vorher.
- **Late Withdrawal**: nach 10 Uhr ET am Freitag vor der Turnierwoche → Strafe (Fine).
- **Late Entry Spot (ATP 250)**: reservierter Platz, Deadline Donnerstag 10 Uhr ET.
- **On-Site Sign-in / Alternate / Lucky Loser**: per Telefon/Text/E-Mail an den Supervisor, mit halbstündigen Fristen vor Matchbeginn.

**ITF IPIN.** Pflicht-Mitgliedschaft für alle ITF-Circuits; einmalige, lebenslange IPIN-Nummer; verpflichtende ITF-Academy-Education-Kurse; Turnier-Ein-/Austritt und Zahlungen über den Account. Die WTT-Regeln definieren Entry Deadline, Withdrawal Deadline, Freeze Deadline (14:00 GMT, 4 Tage vor Montag der Turnierwoche) und Sign-in Deadline pro Fact Sheet; ab April 2025 fließt die World Tennis Number (WTN) in die Singles-Akzeptanz ein.

**Visa-Anforderungen.** Bei 250–320 Reisetagen sind mehrere Regime gleichzeitig relevant:
- **Schengen 90/180** (rollierend, alle Schengen-Länder gemeinsam); Überschreitung → Bußgeld, Einreisesperre; seit EES digitale Erfassung.
- **USA**: ESTA (Visa Waiver, max. 90 Tage) oder B-1 (Preisgeld ok); P-1 (Sportler) oder O-1 (Top-1%) für höhere Einkommen.
- **UK ETA**: seit 2025 gestaffelt Pflicht, harte Durchsetzung ab 25. Februar 2026; £20 ab 8. April 2026; gültig 2 Jahre.
- **Australien ETA**, sowie kommend **EU EES/ETIAS** (Rollout 2026).

**Tracking heute**: überwiegend manuell (Kopf, Excel, Reisepass-Stempel). Consumer-Apps (Pebbles, Nomad Tracker, TrackingDays, Flamingo Compliance, Days of Stay) bieten Schengen-90/180-Rechner, 183-Tage-Steuerresidenz-Tracker und teils GPS-Automatik, sind aber nicht mit dem Tenniskalender verknüpft.

**B) Optimale WebApp-Umsetzung.** Ein **Visa-/Compliance-Modul**, das:
- pro Reisepass/Nationalität das Länder-Regelwerk hinterlegt und Aufenthaltstage automatisch aus dem (aus dem Kalender abgeleiteten) Reiseverlauf berechnet;
- rollierende Schengen-90/180-Fenster, US-Substantial-Presence und 183-Tage-Steuerresidenz parallel führt ("Dual Mode": Immigration vs. Fiskal);
- ETA/ESTA/Visa-Ablaufdaten trackt und mit Countdown/Push warnt;
- Entry-/Withdrawal-Deadlines aus Bereich 1 in dieselbe Alert-Engine einspeist;
- "Ghost Trips"/Simulationen erlaubt (Auswirkung geplanter Turniere auf Visa-Runway).

### Bereich 3: Ausgaben automatisch kategorisieren und Steuerexport

**A) Aktueller Stand.** Profis verwalten Ausgaben per Belegkasten, Excel oder generischen Tools (Expensify, Dext) plus Steuerberater. Typische Kategorien: Flüge, Hotels, Coach-Honorare, Physio/Medizin, Bespannung/Equipment, Turnier-/Meldegebühren, Agentenprovision, Sparringspartner.

**Besteuerung** ist der komplexeste Teil: Preisgeld wird quellenbasiert am Turnierort besteuert. Die USA erheben laut IRS 30% Withholding auf US-Preisgeld für Nicht-Ansässige (FDAP-Bruttoeinnahmen, ohne Ausgabenabzug), plus die "jock tax" der Bundesstaaten (höchste Sätze in Kalifornien, New York und New Jersey; keine in Texas und Florida), berechnet nach "duty days". Frankreich behält 15% Quellensteuer direkt über die FFT ein; UK 20% Withholding, effektiv bis 45%, inkl. anteiliger Endorsement-Erträge (Agassi-Fall 2006). Doppelbesteuerungsabkommen mildern via Foreign Tax Credit. Viele Top-Spieler wählen Wohnsitz in Monaco, der Schweiz, Dubai oder den Bahamas.

**Steuerexport-Formate**: In Deutschland/DACH ist **DATEV** Standard — konkret das **EXTF-/CSV-Buchungsstapel-Format** (mit Berater-/Mandantennummer, Wirtschaftsjahr, Buchungszeitraum), plus DATEV Unternehmen online und Kontenrahmen SKR03/SKR04. Tools wie sevDesk, Lexware Office, WISO MeinBüro erzeugen Ein-Klick-DATEV-Exporte (ZIP mit CSV + Belegbildern). Für einfache Fälle genügt CSV.

**OCR/KI**: reife Marktlösungen (Dext, Veryfi, Klippa, Tabscanner, Expensify SmartScan). Extrahiert werden Händler, Datum, Betrag, Steuer, Zahlungsart, teils Einzelposten. Genauigkeit: Veryfi nennt im eigenen Benchmark 98,7% Feldgenauigkeit bei ~2,8 Sek.; unabhängig ist mit 85–99% je nach Dokumentkomplexität zu rechnen. Trend 2025/26: Wechsel von klassischem OCR zu LLM-basierter Extraktion — bessere Erkennung mehrsprachiger/ausländischer Belege, aber Halluzinationsrisiko bei Beträgen (Verifikation nötig).

**B) Optimale WebApp-Umsetzung.** Ein **Finanz-/Steuermodul**, das:
- Belege per Foto/Upload/E-Mail-Weiterleitung erfasst und per OCR+LLM extrahiert;
- automatisch in tennis-spezifische Kategorien einordnet (Bespannung, Turniergebühr, Physio etc.) und Mehrwährung/Mehrländer handhabt;
- jede Ausgabe dem Turnier/der Reise zuordnet (Verknüpfung mit Kalender/Visa-Modul → "duty days");
- steuerfertige Exporte erzeugt (DATEV EXTF/CSV für DACH, generisches CSV/JSON, Anbindung QuickBooks/Xero);
- Preisgeld-Withholding pro Land erfasst und für die Foreign-Tax-Credit-Berechnung aufbereitet.

### Vergleichbare "Operating Systems" in anderen Sportarten

Ein echtes spielerzentriertes Business-OS existiert auch in anderen Individualsportarten nicht. **Teamworks** vermarktet sich als "The Operating System for Sports" (Scheduling, Logistik, Kommunikation, Nutrition, NIL), ist aber organisations-/teamseitig verkauft, nicht an Einzelathleten. Im Golf dominieren Club-/Tournament-Management (Golf Genius, Golfmanager, Lightspeed Golf) sowie Caddie-/Trip-Apps (u.a. Caddy Clubhouse, gegründet von Tour-Pros); im Radsport gibt es Management-Agenturen (THE·TEAM) und Club-/Ride-Apps (Cyql), aber kein Solo-Profi-OS. Athleten-Fintech konzentriert sich auf US-College/NIL (Athlete+, Scout, NIL Ledger) oder B2B-Preisgeldauszahlung (Payment Labs, das laut eigenen Angaben Preisgeld "across 180+ countries" mit Steuer-Compliance auszahlt — aber an Veranstalter, nicht an Spieler). Das Player-Funding-Startup Commonwealth (CEO Brian Doxtator) finanziert Spielerkarrieren über Fan-Anteile, adressiert aber nicht Logistik/Steuer. Fazit: Die spielerzentrierte Tennis-OS-Idee besetzt ein reales, durch mehrere Quellen (ESPN, PTPA, ATP Baseline) validiertes, aber unbesetztes Feld — Profitennis wird dort wiederholt als "self-funded startup" mit hoher Reise-/Steuer-/Ausgabenlast beschrieben.

---

## Recommendations

**Phase 1 (MVP, 0–6 Monate) – Kalender & Deadlines als Anker.** Beginne mit dem höchsten, klar messbaren Schmerzpunkt: verpasste Entry-/Withdrawal-Deadlines und Order-of-Play-Chaos. Baue den Sync-Kalender mit automatischem Deadline-Import (ATP 42/21 Tage, ITF Freeze/Sign-in) und Push-Alerts, plus geteilte Team-Kalender. Erfolgsmetrik: aktive Wochen-Nutzung durch Spieler + mindestens ein Betreuer.

**Phase 2 (6–12 Monate) – Visa-/Aufenthaltstage-Tracker.** Ergänze das Compliance-Modul (Schengen 90/180, ESTA, UK/AUS ETA, ETIAS) mit Countdown und Ghost-Trip-Simulation, gespeist aus dem Kalender-Reiseverlauf. Benchmark für Weiterbau: Nutzer verknüpfen ≥1 Reisepass und tracken aktiv Tage.

**Phase 3 (12–24 Monate) – Finanz-/Steuermodul.** OCR/LLM-Belegerfassung, tennis-spezifische Kategorien, DATEV-EXTF/CSV-Export und Preisgeld-Withholding-Tracking je Land. Da Steuer haftungssensibel ist: zunächst als Aufbereitungs-/Exporttool für den Steuerberater positionieren, nicht als Steuerberatung. Kooperation mit auf Sportler spezialisierten Kanzleien/Fintechs.

**Was die Prioritäten ändern würde:** Falls ATP/ITF eine offene API oder Partnerschaft anbieten (statt Scraping), rückt Bereich 1 schneller in Vollausbau. Falls ein Fintech-Partner (z.B. Payment-Labs-Modell) verfügbar ist, kann Bereich 3 vorgezogen werden. Falls eine EES/ETIAS-Verschärfung 2026 den Visa-Schmerz akut erhöht, priorisiere Bereich 2.

**Go-to-Market:** Challenger-/ITF-Spieler (Ränge ~100–500) sind die beste Zielgruppe — hoher administrativer Schmerz, kein Management-Team, das ihn abnimmt, im Gegensatz zu Top-50-Spielern mit Vollzeit-Agenten.

## Caveats
- Deadlines und Fristen stammen aus ATP/ITF-Regelwerken (2024–2026) und werden regelmäßig angepasst; konkrete Uhrzeiten/Tage bitte pro Saison verifizieren. ATP kann Fristen bei unvorhergesehenen Umständen verlängern.
- Steuersätze/-regeln (US 30%, FR 15%, UK 20%/45%) sind vereinfachte Darstellungen; die US-30%-Regel ist IRS-belegt, die tatsächliche Belastung hängt jedoch von DBA, Central Withholding Agreement, Wohnsitz und Einzelfall ab und erfordert Fachberatung.
- Visa-Regeln (UK ETA, ETIAS, EES) befinden sich 2025/26 in aktiver Einführung mit sich ändernden Terminen; vor Reise stets offizielle Regierungsquellen prüfen.
- OCR-Genauigkeitsangaben (98,7% Veryfi) sind teils Herstellerbenchmarks; unabhängig ist mit niedrigeren Werten bei schwierigen Belegen zu rechnen.
- Ein Scraping der Order of Play / Deadlines ohne offizielle ATP/ITF-API kann rechtlich/technisch fragil sein.
- Die Aussage "kein spielerzentriertes Tennis-OS existiert" basiert auf umfangreicher, aber nicht erschöpfender Marktrecherche (Stand Juli 2026); ein Stealth-Startup ist nicht ausgeschlossen.