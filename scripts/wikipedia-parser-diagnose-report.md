# Wikipedia-Parser-Diagnose: verlorene Turnierzeilen

> Automatisch erzeugt von `scripts/wikipedia-parser-diagnose.mjs` · Lauf: 2026-08-02T13:43:36.843Z
> Misst den Parser aus `scripts/wikipedia-calendar-coverage.mjs` (verbatim kopiert) gegen eine
> parser-UNABHÄNGIGE Rohzählung. Nur Diagnose — der Parser wurde NICHT verändert.

## Methodik

- **Rohzeilen**: alle Datenzeilen (`|-`) der als Kalender erkannten Tabellen.
- **Erkannt**: Zeilen, in denen der Parser eine Turnier-Zelle findet (`<br` + Belag/Kategorie).
- **Unabhängige Turnier-Zählung**: ITF über eindeutige Draw-Codes `m-itf-xxx-YYYY-NNN`,
  Challenger über distinkte Eigenseiten-Wikilinks `[[YYYY …]]` (ohne „– Singles/Doubles").
- **Nicht erkannte Zeilen** mit Turnier-Signal (ITF-Code ODER Kategorie+Ort) = echte Verluste;
  ohne Signal = legitime Nicht-Turnier-Zeilen (Gewinner-Folgezeilen, Kopf/Summe, leer).

## 1. Zahlen je Seite

| Serie | Jahr | Seite | Tab. | Kal.-Tab. | Rohzeilen | Erkannt | Nicht erk. | davon m. Signal | Indep. Turniere | Codes in Nicht-Kal.-Tab. | Fehler |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| ITF | 2024 | 2024 ITF (January–March) | 4 | 3 | 254 | 123 | 129 | 0 | 123 | 0 | – |
| ITF | 2024 | 2024 ITF (April–June) | 4 | 3 | 326 | 160 | 163 | 0 | 160 | 0 | – |
| ITF | 2024 | 2024 ITF (July–September) | 4 | 3 | 397 | 196 | 198 | 0 | 196 | 0 | – |
| ITF | 2024 | 2024 ITF (October–December) | 4 | 3 | 243 | 119 | 121 | 0 | 119 | 0 | – |
| ITF | 2025 | 2025 ITF (January–March) | 4 | 3 | 292 | 143 | 146 | 0 | 143 | 0 | – |
| ITF | 2025 | 2025 ITF (April–June) | 4 | 3 | 342 | 168 | 171 | 0 | 168 | 0 | – |
| ITF | 2025 | 2025 ITF (July–September) | 4 | 3 | 396 | 195 | 198 | 0 | 195 | 0 | – |
| ITF | 2025 | 2025 ITF (October–December) | 4 | 3 | 265 | 130 | 132 | 0 | 130 | 0 | – |
| ITF | 2026 | 2026 ITF (January–March) | 4 | 3 | 249 | 122 | 124 | 0 | 122 | 0 | – |
| ITF | 2026 | 2026 ITF (April–June) | 4 | 3 | 362 | 178 | 181 | 0 | 178 | 0 | – |
| ITF | 2026 | 2026 ITF (July–September) | 3 | 2 | 150 | 73 | 75 | 0 | 73 | 0 | – |
| ITF | 2026 | 2026 ITF (October–December) | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | Seite fehlt (missing) |
| Challenger | 2025 | 2025 Challenger | 15 | 12 | 449 | 221 | 228 | 0 | 258 | 0 | – |
| Challenger | 2026 | 2026 Challenger | 15 | 12 | 507 | 253 | 254 | 0 | 261 | 0 | – |

**Summen:** Rohzeilen 4232 · Erkannt 2081 · Nicht erkannt 2120 · davon mit Turnier-Signal (echter Verlust) **0** · unabhängige Turniere 2126 · Turnier-Codes in NICHT erkannten Tabellen **0**.

## 2. Muster der ECHTEN Verluste (nicht erkannt, aber Turnier-Signal)

Keine — jede Zeile mit Turnier-Signal wurde erkannt.

## 3. Nicht erkannte Zeilen OHNE Turnier-Signal (legitim, Kontrolle)

- **sonstige | br=true kat=false flags=true** — 2058×
  - `[2024 ITF Men's World Tennis Tour (January–March)] style="vertical-align:top" |'''{{flagicon|GBR}} [[Jacob Fearnley]] <br/> {{flagicon|USA}} …`
  - `[2024 ITF Men's World Tennis Tour (January–March)] style="vertical-align:top" |'''{{flagicon|HUN}} Mátyás Füle <br/> {{flagicon|HUN}} [[Gerge…`
  - `[2024 ITF Men's World Tennis Tour (January–March)] style="vertical-align:top" |'''{{flagicon|}} [[Petr Bar Biryukov]] <br/> {{flagicon|}} [[I…`
- **kopf_oder_summenzeile** — 54×
  - `[2024 ITF Men's World Tennis Tour (January–March)] !width="65"|Week of ! style="width:190px;"|Tournament ! style="width:210px;"|Winner ! styl…`
  - `[2024 ITF Men's World Tennis Tour (January–March)] !width="65"|Week of ! style="width:190px;"|Tournament ! style="width:210px;"|Winner ! styl…`
  - `[2024 ITF Men's World Tennis Tour (January–March)] !width="65"|Week of ! style="width:190px;"|Tournament ! style="width:210px;"|Winner ! styl…`
- **sonstige | br=false kat=false flags=false** — 7×
  - `[2024 ITF Men's World Tennis Tour (January–March)] style="vertical-align:top" | rowspan="22" |February 26`
  - `[2024 ITF Men's World Tennis Tour (January–March)] style="vertical-align:top" |rowspan=25|March 4`
  - `[2024 ITF Men's World Tennis Tour (January–March)] style="vertical-align:top" |rowspan=37|March 11`
- **gewinner_folgezeile (rowspan)** — 1×
  - `[2026 ITF Men's World Tennis Tour (January–March)] style="vertical-align:top" |colspan=2 rowspan=1 style="text-align:center; background:#eded…`

## 4. Erkannte Turniere OHNE ableitbaren source_ref-Code

Gesamt: **3**.
- **challenger_ohne_eigenseite** — 3×
  - `[2026 ATP Challenger Tour] [[Internazionali di Tennis Città di Todi]]<br/>[[Todi]], Italy <br/> Clay – Challenger 75 …`
  - `[2026 ATP Challenger Tour] [[Copa Sevilla]]<br/>[[Seville]], Spain <br/> Clay – Challenger 125 – 32S/24Q/16D<br/>Sing…`
  - `[2026 ATP Challenger Tour] [[Bari Challlenger]]<br/>[[Bari]], Italy <br/> Clay – Challenger 50 – 32S/24Q/16D<br/>Sing…`

## 5. Verteilung: häufen sich Verluste auf bestimmten Seiten?

| Seite | Nicht-Kal.-Codes | Verlust m. Signal | ohne-Code |
|---|---:|---:|---:|
| 2024 ITF (January–March) | 0 | 0 | 0 |
| 2024 ITF (April–June) | 0 | 0 | 0 |
| 2024 ITF (July–September) | 0 | 0 | 0 |
| 2024 ITF (October–December) | 0 | 0 | 0 |
| 2025 ITF (January–March) | 0 | 0 | 0 |
| 2025 ITF (April–June) | 0 | 0 | 0 |
| 2025 ITF (July–September) | 0 | 0 | 0 |
| 2025 ITF (October–December) | 0 | 0 | 0 |
| 2026 ITF (January–March) | 0 | 0 | 0 |
| 2026 ITF (April–June) | 0 | 0 | 0 |
| 2026 ITF (July–September) | 0 | 0 | 0 |
| 2026 ITF Men's World Tennis Tour (October–December) | — | — | FEHLER |
| 2025 Challenger | 0 | 0 | 0 |
| 2026 Challenger | 0 | 0 | 3 |

## 6. Fazit — größte Verlustquellen

- **Komplett verlorene Tabellen** (Turnier-Codes in NICHT als Kalender erkannten Tabellen): **0**.
- **Zeilen-Verluste** in erkannten Tabellen (Turnier-Signal, aber nicht erkannt): **0**.
- **Erkannt, aber ohne source_ref-Code**: **3**.


### Einschätzung

1. **Der Zeilen-Parser verliert praktisch nichts.** In allen Seiten ist „mit Turnier-Signal, aber
   nicht erkannt" = 0 und „Codes in Nicht-Kalender-Tabellen" = 0. Die große Zahl „nicht erkannt"
   ist strukturell die **Gewinner-Folgezeile je Turnier** (rowspan; ~2000× reine Flaggen-/Spieler-Zeilen
   in §3), kein Verlust. ITF 2024 = 123+160+196+119 = **598 erkannt** (≈ die erwarteten ~600).
   Die früher genannten „384" stammten aus einem groben Vorab-Probe-Skript, nicht aus diesem Parser.
2. **Das eigentliche Risiko ist die source_ref-Extraktion, nicht der Parser** — und auch das ist klein,
   sobald zwei Dinge beachtet werden: (a) ITF-Codes existieren in **zwei Formaten**
   ('m-itf-ind-2024-009' und 'm-itf-lux-01a-2024'); ein zu enges Muster zählt 2024 fälschlich als codelos.
   (b) Challenger-Namen sind teils nicht-englisch/vertippt ('Copa Sevilla', 'Città di Todi', 'Bari Challlenger') —
   sie haben trotzdem eine eigene Turnierseite. Nach dieser Korrektur bleiben **3** ohne ableitbaren Code.
