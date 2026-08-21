# nuLiga-PROBE — Region Baden (TROCKENLAUF)

> `scripts/nuliga-import.mjs` · 2026-08-21T19:00:30.178Z · nächste 3 Monate (2026-08-17 … 2026-11-16)
> Quelle Stufe 1: baden.liga.nu tournamentCalendar (robots-erlaubt). Stufe 2 (Detail) robots-GESPERRT (s. u.).

## Kennzahlen
- Wochen abgefragt: 14 · davon aus Cache: 0
- HTTP-Requests gesamt: 56 · **503-Antworten: 56**
- Laufzeit: **554.9 s** (netto Requests 3.2 s + Pausen)
- Turniere in Baden / 3 Monate (dedupliziert): **0**
- Nach Filter übrig (Herren/Damen-Einzel, offen): **0** · herausgefiltert: 0

## Wochen-Status (503-Häufigkeit)
- 2026-08-17: 503
- 2026-08-24: 503
- 2026-08-31: 503
- 2026-09-07: 503
- 2026-09-14: 503
- 2026-09-21: 503
- 2026-09-28: 503
- 2026-10-05: 503
- 2026-10-12: 503
- 2026-10-19: 503
- 2026-10-26: 503
- 2026-11-02: 503
- 2026-11-09: 503
- 2026-11-16: 503

## KERNBEFUND — Meldefrist/Nenngeld/Belag nicht über erlaubten Pfad
Die Listenzeilen verlinken das Detail ausschließlich auf `tennis.de/…/turniersuche.html#detail/<id>`.
Dieses Detail (mit **Meldeschluss, Nenngeld, Belag**) rendert das ZK-Widget von **`widgets.tennis.de`**
— und dessen robots.txt lautet `User-agent: * / Disallow: /`. `www.tennis.de` liefert die Frist NICHT
(bestätigt: die Antworten mit „Meldeschluss"/„Nenngeld" kamen nur von widgets.tennis.de: `.zul` + `zkau`).
**→ Der versprochene „gelesene Meldeschluss" ist nicht regelkonform abrufbar.** Dieses Skript ruft ihn nicht ab.

## Was die LISTE (erlaubt) liefert
Datum, Name (inkl. Verein — **kein separates Ort-Feld**; Ort nur aus dem Namen ableitbar), Konkurrenz, LK, „Offen für".
Meldeschluss/Nenngeld/Belag: **nicht in der Liste** (nur im gesperrten Detail).

## Drei vollständige Beispiele (nach Filter)
_(keine Treffer nach Filter — s. Wochen-Status; evtl. 503 oder saisonbedingt leer)_

## Nachtrag — Live-Lauf vs. Parser-Validierung
**Live-Lauf (dieser Trockenlauf):** 14 Wochen, **56 von 56 Requests = HTTP 503**, Laufzeit ~555 s, **0 Turniere** geladen. Der Baden-Backend war die gesamten ~9 Minuten überlastet; der 503-Backoff (warten/wiederholen, kein Hämmern) griff, aber der Server erholte sich nicht. **Das ist keine Ausnahme, sondern der Normalzustand während dieser Prüfung.**

**Parser-Validierung** gegen eine FRÜHER erfolgreich geladene Baden-Woche (157 KB, HTTP 200):
- Roh-Turnierzeilen (mit `#detail`): **36**
- Nach Filter (Herren/Damen-Einzel, „Offen für" ≠ eigener Verein): **15** (~42 %)
- Herausgefiltert: 21 — davon **6 „eigener Verein"** + **15 andere Konkurrenz** (Junioren U12/U14, Herren 30/50, Doppel/Mixed).
- Daten-Fallstricke: Namen enthalten Verein+Ort verschmolzen (kein Ort-Feld); ein Eintrag trug **„(abgesagt)"** im Namen → wie ITF-„(Cancelled)" zu erkennen/überspringen; Datum oft als **Bereich** („01.06. bis 30.09.").

## Größenordnung / Kosten für 18 Regionen
- Baden ~36 Turniere je Wochenansicht → grob ~15 offene Erwachsenen-Einzel je Woche nach Filter.
- Über 3 Monate × ~18 Regionen: vierstellige Rohmenge, gefiltert vielleicht ~700–1400 Einträge — **grobe Schätzung**, weil (a) der Backend flakig ist und (b) Turniere über Wochen mehrfach auftauchen (Dedup nötig).
- **Realkosten dominiert NICHT die Menge, sondern:** (1) der 503-Backend (Läufe brauchen Backoff + Wiederholung über Stunden, nicht Minuten), (2) **das Detail ist robots-gesperrt** → die Frist (der einzige Mehrwert gegenüber gerechneten Fristen) fehlt.

## Schema-Vorschlag (NICHT angewandt)
- **series-Wert:** `dtb` (Deutscher Tennis Bund) — kurz, verbandsklar. Alternative `de_nuliga`.
- **CHECK-Erweiterung:** `alter table web.tour_tournaments drop constraint tour_tournaments_series_check; alter table web.tour_tournaments add constraint tour_tournaments_series_check check (series = any (array['itf_wtt','challenger','itf_juniors','dtb']));`
- **category:** die deutsche Konkurrenz/LK passt NICHT ins ITF-Kategorie-/Punktemodell (LK ist ein eigenes nationales System). Vorschlag: `category` = Konkurrenz (z. B. „Herren Einzel"), plus ein eigenes Feld/Claim für die **LK-Spanne**; KEINE ATP/WTA-Punkte (die deutschen LK-Turniere zählen nicht ins ATP/WTA-Ranking).

## Meldefrist ↔ deadlines.ts (Vorschlag)
Heute rechnet `deadlines.ts` die Frist aus dem Turniermontag (ITF/Challenger). Für DTB-Turniere stünde sie **in den Daten** — wenn sie abrufbar wäre. Vorschlag für die Zusammenführung:
- Ein **optionales Frist-Feld am Turnier** (z. B. `entry_deadline timestamptz null`, als Claim mit Herkunft `nuliga`).
- `tourDeadlines()` bekäme einen **Vorrang-Zweig**: *ist eine gelesene `entry_deadline` gesetzt, nutze sie (known=true, Quelle „gelesen"); sonst wie bisher rechnen.* Also **gelesene Frist geht der gerechneten vor** — sauber getrennt, kein Vermischen.
- **ABER:** Solange das Detail hinter `widgets.tennis.de` (Disallow:/) liegt, bleibt `entry_deadline` für DTB leer → es würde doch wieder gerechnet (falls überhaupt eine deutsche Rechenregel belegt ist). Der Mehrwert „gelesene Frist" ist damit vorerst nicht realisierbar.

## Verdikt
**Die Liste trägt (erlaubt, parsebar), aber die Probe trägt NICHT wie erhofft:** (1) Der Backend war 100 % 503 — betrieblich teuer. (2) Der einzige echte Mehrwert (gelesene Meldefrist, dazu Nenngeld/Belag) liegt hinter einem robots-`Disallow:/`-Host und ist nicht regelkonform abrufbar. Ein Import brächte deutsche Turniere OHNE Frist/Gebühr/Belag — also weniger als ITF, bei mehr Aufwand (18 Regionen, HTML, Dedup, 503-Backoff). **Empfehlung: zurückstellen, bis es eine offizielle DTB-Datenfreigabe gibt** (wie Tennis Europe, MU-049).
