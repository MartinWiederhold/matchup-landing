# Wikipedia-Vorlauf: Anlage & Füllstand der ITF-/Challenger-Kalenderseiten

> Automatisch erzeugt von `scripts/wikipedia-lead-time.mjs` · Lauf: 2026-08-02T07:28:16.348Z
> Quelle: MediaWiki-API (https://en.wikipedia.org/w/api.php). Kein HTML-Scraping. Nur Zahlen/Zeitstempel.

## Methodik

Je Seite: älteste Version (`rvdir=newer&rvlimit=1`) → **Anlagedatum**. **Vorlauf** = Wochen
zwischen Anlage und **Beginn** des abgedeckten Zeitraums (positiv = vorausschauend, negativ = rückwirkend).
**Füllstand**: Stichprobenversionen in Monatsabständen (max. 10/Seite, `rvstart=…&rvdir=older`),
je Version die Turnierzeilen der Kalendertabellen gezählt (gleicher Parser wie die Abdeckungsmessung).
**„80 % gefüllt"** = Wochen relativ zum Periodenstart, ab denen der Stand ≥ 80 % des beobachteten Maximums ist.
Jede Abfrage ist isoliert (Timeout 60s, 1 Retry); Fehlschläge beenden den Lauf nicht.

## 1. Anlagedatum & Vorlauf je Seite

| Serie | Jahr | Seite | Periodenstart | Angelegt | Vorlauf (Wochen) | Max. Turniere | Fehler |
|---|---|---|---|---|---:|---:|---|
| Challenger | 2023 | 2023 ATP Challenger Tour | 2023-01-01 | 2022-07-24 | +23.0 | 202 | – |
| ITF | 2023 | 2023 ITF … (January–March) | 2023-01-01 | 2023-01-10 | -1.3 | 111 | – |
| ITF | 2023 | 2023 ITF … (April–June) | 2023-04-01 | 2023-03-27 | +0.6 | 162 | – |
| ITF | 2023 | 2023 ITF … (July–September) | 2023-07-01 | 2023-07-01 | -0.0 | 171 | – |
| ITF | 2023 | 2023 ITF … (October–December) | 2023-10-01 | 2023-10-07 | -0.9 | 128 | – |
| Challenger | 2024 | 2024 ATP Challenger Tour | 2024-01-01 | 2023-08-10 | +20.6 | 210 | – |
| ITF | 2024 | 2024 ITF … (January–March) | 2024-01-01 | 2024-01-13 | -1.8 | 123 | – |
| ITF | 2024 | 2024 ITF … (April–June) | 2024-04-01 | 2024-03-17 | +2.1 | 160 | – |
| ITF | 2024 | 2024 ITF … (July–September) | 2024-07-01 | 2024-07-02 | -0.2 | 197 | – |
| ITF | 2024 | 2024 ITF … (October–December) | 2024-10-01 | 2024-08-25 | +5.3 | 119 | – |
| Challenger | 2025 | 2025 ATP Challenger Tour | 2025-01-01 | 2024-09-07 | +16.5 | 221 | – |
| ITF | 2025 | 2025 ITF … (January–March) | 2025-01-01 | 2025-01-02 | -0.2 | 143 | – |
| ITF | 2025 | 2025 ITF … (April–June) | 2025-04-01 | 2025-04-01 | -0.1 | 168 | – |
| ITF | 2025 | 2025 ITF … (July–September) | 2025-07-01 | 2025-06-30 | +0.1 | 195 | – |
| ITF | 2025 | 2025 ITF … (October–December) | 2025-10-01 | 2025-10-02 | -0.2 | 130 | – |
| Challenger | 2026 | 2026 ATP Challenger Tour | 2026-01-01 | 2025-09-18 | +14.9 | 253 | – |
| ITF | 2026 | 2026 ITF … (January–March) | 2026-01-01 | 2025-12-29 | +0.4 | 122 | – |
| ITF | 2026 | 2026 ITF … (April–June) | 2026-04-01 | 2026-03-30 | +0.2 | 178 | – |
| ITF | 2026 | 2026 ITF … (July–September) | 2026-07-01 | 2026-06-29 | +0.2 | 73 | – |
| ITF | 2026 | 2026 ITF … (October–December) | 2026-10-01 | — | — | 0 | Seite fehlt (missing) |

## 2. Füllstand je Stichprobenversion (Zeitreihe: Datum → Turnierzahl)

- **Challenger 2023** (Start 2023-01-01, 80 % ab +38.0 Wo): 2022-07-24:0 · 2022-07-24:0 · 2022-11-10:18 · 2023-01-23:45 · 2023-03-23:96 · 2023-05-21:140 · 2023-07-23:161 · 2023-09-23:202 · 2023-11-23:202 · 2023-12-21:202
- **ITF 2023 January–March** (Start 2023-01-01, 80 % ab +9.3 Wo): 2023-01-10:0 · 2023-02-09:67 · 2023-03-06:111 · 2023-03-30:111
- **ITF 2023 April–June** (Start 2023-04-01, 80 % ab +12.3 Wo): 2023-03-27:42 · 2023-04-26:95 · 2023-05-26:95 · 2023-06-26:162 · 2023-06-29:162
- **ITF 2023 July–September** (Start 2023-07-01, 80 % ab +12.8 Wo): 2023-07-01:64 · 2023-07-31:64 · 2023-08-31:119 · 2023-09-28:171
- **ITF 2023 October–December** (Start 2023-10-01, 80 % ab +9.5 Wo): 2023-10-07:61 · 2023-11-06:58 · 2023-12-06:128 · 2023-12-30:128
- **Challenger 2024** (Start 2024-01-01, 80 % ab +36.1 Wo): 2023-08-10:0 · 2023-08-10:0 · 2023-12-04:31 · 2024-02-09:84 · 2024-04-09:101 · 2024-05-09:129 · 2024-07-09:167 · 2024-09-09:206 · 2024-11-09:210 · 2024-12-29:210
- **ITF 2024 January–March** (Start 2024-01-01, 80 % ab +12.8 Wo): 2024-01-13:0 · 2024-02-11:31 · 2024-03-10:80 · 2024-03-30:123
- **ITF 2024 April–June** (Start 2024-04-01, 80 % ab +2.2 Wo): 2024-03-17:0 · 2024-04-16:148 · 2024-05-16:160 · 2024-06-16:160 · 2024-06-29:160
- **ITF 2024 July–September** (Start 2024-07-01, 80 % ab +4.5 Wo): 2024-07-02:0 · 2024-08-01:173 · 2024-09-01:197 · 2024-09-29:196
- **ITF 2024 October–December** (Start 2024-10-01, 80 % ab +3.4 Wo): 2024-08-25:0 · 2024-09-22:89 · 2024-10-24:109 · 2024-11-24:114 · 2024-12-22:119 · 2024-12-30:119
- **Challenger 2025** (Start 2025-01-01, 80 % ab +31.1 Wo): 2024-09-07:0 · 2024-09-07:0 · 2025-01-06:47 · 2025-02-06:66 · 2025-04-06:130 · 2025-06-06:134 · 2025-08-06:181 · 2025-09-06:219 · 2025-11-06:221 · 2025-12-30:221
- **ITF 2025 January–March** (Start 2025-01-01, 80 % ab +12.7 Wo): 2025-01-02:2 · 2025-02-01:35 · 2025-03-01:85 · 2025-03-30:143
- **ITF 2025 April–June** (Start 2025-04-01, 80 % ab +12.8 Wo): 2025-04-01:4 · 2025-04-30:41 · 2025-05-31:102 · 2025-06-29:168
- **ITF 2025 July–September** (Start 2025-07-01, 80 % ab +12.8 Wo): 2025-06-30:16 · 2025-07-28:81 · 2025-08-29:147 · 2025-09-28:195
- **ITF 2025 October–December** (Start 2025-10-01, 80 % ab +8.8 Wo): 2025-10-02:11 · 2025-11-01:65 · 2025-12-01:130 · 2025-12-29:130
- **Challenger 2026** (Start 2026-01-01, 80 % ab +28.3 Wo): 2025-09-18:0 · 2025-09-18:0 · 2025-11-02:18 · 2026-01-17:63 · 2026-02-17:148 · 2026-03-17:159 · 2026-04-17:163 · 2026-06-17:195 · 2026-07-17:250 · 2026-08-02:253
- **ITF 2026 January–March** (Start 2026-01-01, 80 % ab +12.7 Wo): 2025-12-29:7 · 2026-01-28:40 · 2026-02-28:79 · 2026-03-30:122
- **ITF 2026 April–June** (Start 2026-04-01, 80 % ab +12.7 Wo): 2026-03-30:7 · 2026-04-29:56 · 2026-05-29:114 · 2026-06-29:178
- **ITF 2026 July–September** (Start 2026-07-01, 80 % ab +3.9 Wo): 2026-06-29:15 · 2026-07-28:73 · 2026-08-02:73
- **ITF 2026** October–December — FEHLER: Seite fehlt (missing)

## 3. 2026 — Füllstand künftiger Quartale (Periodenstart nach 2026-08-02)

| Quartal | Periodenstart | Seite existiert? | Aktuelle Turnierzahl |
|---|---|---|---:|
| October–December | 2026-10-01 | nein/Fehler | — |

Kontext — alle 2026-Quartale (aktueller Höchststand):
- January–March: 122 Turniere, angelegt 2025-12-29, Vorlauf +0.4 Wo
- April–June: 178 Turniere, angelegt 2026-03-30, Vorlauf +0.2 Wo
- July–September: 73 Turniere, angelegt 2026-06-29, Vorlauf +0.2 Wo
- October–December: FEHLER (Seite fehlt (missing))

## 4. Fazit in Zahlen

| Serie | n Seiten | Ø Vorlauf (Wo) | Median Vorlauf | Ø 80%-Zeitpunkt (Wo z. Start) | Median 80% |
|---|---:|---:|---:|---:|---:|
| ITF (Quartale) | 15 | +0.3 | -0.0 | +9.5 | +12.3 |
| Challenger (Jahr) | 4 | +18.7 | +18.5 | +33.4 | +33.6 |

Lesart: Vorlauf **positiv** = Seite vor Periodenstart angelegt. „80%-Zeitpunkt" **negativ** = 80 %
des Endstands schon *vor* Periodenstart erreicht (vorausschauend); **positiv** = erst *nach* Start (nachwachsend).
Planungsschwelle des Produkts: Turniere ≥ 8 Wochen vor Beginn.

## 5. Verwendete API-Aufrufe (Volltext, 123 Stück)

```
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2023+ATP+Challenger+Tour&rvlimit=1&rvdir=newer&rvprop=timestamp%7Cids
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2023+ATP+Challenger+Tour&rvlimit=1&rvdir=older&rvstart=2022-07-24T00%3A44%3A18.000Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2023+ATP+Challenger+Tour&rvlimit=1&rvdir=older&rvstart=2022-09-24T00%3A00%3A00.000Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2023+ATP+Challenger+Tour&rvlimit=1&rvdir=older&rvstart=2022-11-24T00%3A00%3A00.000Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2023+ATP+Challenger+Tour&rvlimit=1&rvdir=older&rvstart=2023-01-24T00%3A00%3A00.000Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2023+ATP+Challenger+Tour&rvlimit=1&rvdir=older&rvstart=2023-03-24T00%3A00%3A00.000Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2023+ATP+Challenger+Tour&rvlimit=1&rvdir=older&rvstart=2023-05-24T00%3A00%3A00.000Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2023+ATP+Challenger+Tour&rvlimit=1&rvdir=older&rvstart=2023-07-24T00%3A00%3A00.000Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2023+ATP+Challenger+Tour&rvlimit=1&rvdir=older&rvstart=2023-09-24T00%3A00%3A00.000Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2023+ATP+Challenger+Tour&rvlimit=1&rvdir=older&rvstart=2023-11-24T00%3A00%3A00.000Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2023+ATP+Challenger+Tour&rvlimit=1&rvdir=older&rvstart=2023-12-31T00%3A00%3A00.000Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2023+ITF+Men%27s+World+Tennis+Tour+%28January%E2%80%93March%29&rvlimit=1&rvdir=newer&rvprop=timestamp%7Cids
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2023+ITF+Men%27s+World+Tennis+Tour+%28January%E2%80%93March%29&rvlimit=1&rvdir=older&rvstart=2023-01-10T09%3A24%3A19.000Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2023+ITF+Men%27s+World+Tennis+Tour+%28January%E2%80%93March%29&rvlimit=1&rvdir=older&rvstart=2023-02-10T00%3A00%3A00.000Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2023+ITF+Men%27s+World+Tennis+Tour+%28January%E2%80%93March%29&rvlimit=1&rvdir=older&rvstart=2023-03-10T00%3A00%3A00.000Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2023+ITF+Men%27s+World+Tennis+Tour+%28January%E2%80%93March%29&rvlimit=1&rvdir=older&rvstart=2023-03-31T00%3A00%3A00.000Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2023+ITF+Men%27s+World+Tennis+Tour+%28April%E2%80%93June%29&rvlimit=1&rvdir=newer&rvprop=timestamp%7Cids
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2023+ITF+Men%27s+World+Tennis+Tour+%28April%E2%80%93June%29&rvlimit=1&rvdir=older&rvstart=2023-03-27T23%3A58%3A57.000Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2023+ITF+Men%27s+World+Tennis+Tour+%28April%E2%80%93June%29&rvlimit=1&rvdir=older&rvstart=2023-04-27T00%3A00%3A00.000Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2023+ITF+Men%27s+World+Tennis+Tour+%28April%E2%80%93June%29&rvlimit=1&rvdir=older&rvstart=2023-05-27T00%3A00%3A00.000Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2023+ITF+Men%27s+World+Tennis+Tour+%28April%E2%80%93June%29&rvlimit=1&rvdir=older&rvstart=2023-06-27T00%3A00%3A00.000Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2023+ITF+Men%27s+World+Tennis+Tour+%28April%E2%80%93June%29&rvlimit=1&rvdir=older&rvstart=2023-06-30T00%3A00%3A00.000Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2023+ITF+Men%27s+World+Tennis+Tour+%28July%E2%80%93September%29&rvlimit=1&rvdir=newer&rvprop=timestamp%7Cids
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2023+ITF+Men%27s+World+Tennis+Tour+%28July%E2%80%93September%29&rvlimit=1&rvdir=older&rvstart=2023-07-01T08%3A21%3A59.000Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2023+ITF+Men%27s+World+Tennis+Tour+%28July%E2%80%93September%29&rvlimit=1&rvdir=older&rvstart=2023-08-01T00%3A00%3A00.000Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2023+ITF+Men%27s+World+Tennis+Tour+%28July%E2%80%93September%29&rvlimit=1&rvdir=older&rvstart=2023-09-01T00%3A00%3A00.000Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2023+ITF+Men%27s+World+Tennis+Tour+%28July%E2%80%93September%29&rvlimit=1&rvdir=older&rvstart=2023-09-30T00%3A00%3A00.000Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2023+ITF+Men%27s+World+Tennis+Tour+%28October%E2%80%93December%29&rvlimit=1&rvdir=newer&rvprop=timestamp%7Cids
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2023+ITF+Men%27s+World+Tennis+Tour+%28October%E2%80%93December%29&rvlimit=1&rvdir=older&rvstart=2023-10-07T05%3A35%3A02.000Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2023+ITF+Men%27s+World+Tennis+Tour+%28October%E2%80%93December%29&rvlimit=1&rvdir=older&rvstart=2023-11-07T00%3A00%3A00.000Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2023+ITF+Men%27s+World+Tennis+Tour+%28October%E2%80%93December%29&rvlimit=1&rvdir=older&rvstart=2023-12-07T00%3A00%3A00.000Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2023+ITF+Men%27s+World+Tennis+Tour+%28October%E2%80%93December%29&rvlimit=1&rvdir=older&rvstart=2023-12-31T00%3A00%3A00.000Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2024+ATP+Challenger+Tour&rvlimit=1&rvdir=newer&rvprop=timestamp%7Cids
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2024+ATP+Challenger+Tour&rvlimit=1&rvdir=older&rvstart=2023-08-10T02%3A51%3A34.000Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2024+ATP+Challenger+Tour&rvlimit=1&rvdir=older&rvstart=2023-10-10T00%3A00%3A00.000Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2024+ATP+Challenger+Tour&rvlimit=1&rvdir=older&rvstart=2023-12-10T00%3A00%3A00.000Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2024+ATP+Challenger+Tour&rvlimit=1&rvdir=older&rvstart=2024-02-10T00%3A00%3A00.000Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2024+ATP+Challenger+Tour&rvlimit=1&rvdir=older&rvstart=2024-04-10T00%3A00%3A00.000Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2024+ATP+Challenger+Tour&rvlimit=1&rvdir=older&rvstart=2024-05-10T00%3A00%3A00.000Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2024+ATP+Challenger+Tour&rvlimit=1&rvdir=older&rvstart=2024-07-10T00%3A00%3A00.000Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2024+ATP+Challenger+Tour&rvlimit=1&rvdir=older&rvstart=2024-09-10T00%3A00%3A00.000Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2024+ATP+Challenger+Tour&rvlimit=1&rvdir=older&rvstart=2024-11-10T00%3A00%3A00.000Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2024+ATP+Challenger+Tour&rvlimit=1&rvdir=older&rvstart=2024-12-31T00%3A00%3A00.000Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2024+ITF+Men%27s+World+Tennis+Tour+%28January%E2%80%93March%29&rvlimit=1&rvdir=newer&rvprop=timestamp%7Cids
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2024+ITF+Men%27s+World+Tennis+Tour+%28January%E2%80%93March%29&rvlimit=1&rvdir=older&rvstart=2024-01-13T17%3A58%3A38.000Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2024+ITF+Men%27s+World+Tennis+Tour+%28January%E2%80%93March%29&rvlimit=1&rvdir=older&rvstart=2024-02-13T00%3A00%3A00.000Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2024+ITF+Men%27s+World+Tennis+Tour+%28January%E2%80%93March%29&rvlimit=1&rvdir=older&rvstart=2024-03-13T00%3A00%3A00.000Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2024+ITF+Men%27s+World+Tennis+Tour+%28January%E2%80%93March%29&rvlimit=1&rvdir=older&rvstart=2024-03-31T00%3A00%3A00.000Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2024+ITF+Men%27s+World+Tennis+Tour+%28April%E2%80%93June%29&rvlimit=1&rvdir=newer&rvprop=timestamp%7Cids
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2024+ITF+Men%27s+World+Tennis+Tour+%28April%E2%80%93June%29&rvlimit=1&rvdir=older&rvstart=2024-03-17T00%3A28%3A38.000Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2024+ITF+Men%27s+World+Tennis+Tour+%28April%E2%80%93June%29&rvlimit=1&rvdir=older&rvstart=2024-04-17T00%3A00%3A00.000Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2024+ITF+Men%27s+World+Tennis+Tour+%28April%E2%80%93June%29&rvlimit=1&rvdir=older&rvstart=2024-05-17T00%3A00%3A00.000Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2024+ITF+Men%27s+World+Tennis+Tour+%28April%E2%80%93June%29&rvlimit=1&rvdir=older&rvstart=2024-06-17T00%3A00%3A00.000Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2024+ITF+Men%27s+World+Tennis+Tour+%28April%E2%80%93June%29&rvlimit=1&rvdir=older&rvstart=2024-06-30T00%3A00%3A00.000Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2024+ITF+Men%27s+World+Tennis+Tour+%28July%E2%80%93September%29&rvlimit=1&rvdir=newer&rvprop=timestamp%7Cids
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2024+ITF+Men%27s+World+Tennis+Tour+%28July%E2%80%93September%29&rvlimit=1&rvdir=older&rvstart=2024-07-02T09%3A42%3A16.000Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2024+ITF+Men%27s+World+Tennis+Tour+%28July%E2%80%93September%29&rvlimit=1&rvdir=older&rvstart=2024-08-02T00%3A00%3A00.000Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2024+ITF+Men%27s+World+Tennis+Tour+%28July%E2%80%93September%29&rvlimit=1&rvdir=older&rvstart=2024-09-02T00%3A00%3A00.000Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2024+ITF+Men%27s+World+Tennis+Tour+%28July%E2%80%93September%29&rvlimit=1&rvdir=older&rvstart=2024-09-30T00%3A00%3A00.000Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2024+ITF+Men%27s+World+Tennis+Tour+%28October%E2%80%93December%29&rvlimit=1&rvdir=newer&rvprop=timestamp%7Cids
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2024+ITF+Men%27s+World+Tennis+Tour+%28October%E2%80%93December%29&rvlimit=1&rvdir=older&rvstart=2024-08-25T03%3A05%3A59.000Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2024+ITF+Men%27s+World+Tennis+Tour+%28October%E2%80%93December%29&rvlimit=1&rvdir=older&rvstart=2024-09-25T00%3A00%3A00.000Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2024+ITF+Men%27s+World+Tennis+Tour+%28October%E2%80%93December%29&rvlimit=1&rvdir=older&rvstart=2024-10-25T00%3A00%3A00.000Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2024+ITF+Men%27s+World+Tennis+Tour+%28October%E2%80%93December%29&rvlimit=1&rvdir=older&rvstart=2024-11-25T00%3A00%3A00.000Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2024+ITF+Men%27s+World+Tennis+Tour+%28October%E2%80%93December%29&rvlimit=1&rvdir=older&rvstart=2024-12-25T00%3A00%3A00.000Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2024+ITF+Men%27s+World+Tennis+Tour+%28October%E2%80%93December%29&rvlimit=1&rvdir=older&rvstart=2024-12-31T00%3A00%3A00.000Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2025+ATP+Challenger+Tour&rvlimit=1&rvdir=newer&rvprop=timestamp%7Cids
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2025+ATP+Challenger+Tour&rvlimit=1&rvdir=older&rvstart=2024-09-07T12%3A15%3A16.000Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2025+ATP+Challenger+Tour&rvlimit=1&rvdir=older&rvstart=2024-11-07T00%3A00%3A00.000Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2025+ATP+Challenger+Tour&rvlimit=1&rvdir=older&rvstart=2025-01-07T00%3A00%3A00.000Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2025+ATP+Challenger+Tour&rvlimit=1&rvdir=older&rvstart=2025-02-07T00%3A00%3A00.000Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2025+ATP+Challenger+Tour&rvlimit=1&rvdir=older&rvstart=2025-04-07T00%3A00%3A00.000Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2025+ATP+Challenger+Tour&rvlimit=1&rvdir=older&rvstart=2025-06-07T00%3A00%3A00.000Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2025+ATP+Challenger+Tour&rvlimit=1&rvdir=older&rvstart=2025-08-07T00%3A00%3A00.000Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2025+ATP+Challenger+Tour&rvlimit=1&rvdir=older&rvstart=2025-09-07T00%3A00%3A00.000Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2025+ATP+Challenger+Tour&rvlimit=1&rvdir=older&rvstart=2025-11-07T00%3A00%3A00.000Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2025+ATP+Challenger+Tour&rvlimit=1&rvdir=older&rvstart=2025-12-31T00%3A00%3A00.000Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2025+ITF+Men%27s+World+Tennis+Tour+%28January%E2%80%93March%29&rvlimit=1&rvdir=newer&rvprop=timestamp%7Cids
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2025+ITF+Men%27s+World+Tennis+Tour+%28January%E2%80%93March%29&rvlimit=1&rvdir=older&rvstart=2025-01-02T14%3A15%3A28.000Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2025+ITF+Men%27s+World+Tennis+Tour+%28January%E2%80%93March%29&rvlimit=1&rvdir=older&rvstart=2025-02-02T00%3A00%3A00.000Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2025+ITF+Men%27s+World+Tennis+Tour+%28January%E2%80%93March%29&rvlimit=1&rvdir=older&rvstart=2025-03-02T00%3A00%3A00.000Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2025+ITF+Men%27s+World+Tennis+Tour+%28January%E2%80%93March%29&rvlimit=1&rvdir=older&rvstart=2025-03-31T00%3A00%3A00.000Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2025+ITF+Men%27s+World+Tennis+Tour+%28April%E2%80%93June%29&rvlimit=1&rvdir=newer&rvprop=timestamp%7Cids
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2025+ITF+Men%27s+World+Tennis+Tour+%28April%E2%80%93June%29&rvlimit=1&rvdir=older&rvstart=2025-04-01T14%3A05%3A03.000Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2025+ITF+Men%27s+World+Tennis+Tour+%28April%E2%80%93June%29&rvlimit=1&rvdir=older&rvstart=2025-05-01T00%3A00%3A00.000Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2025+ITF+Men%27s+World+Tennis+Tour+%28April%E2%80%93June%29&rvlimit=1&rvdir=older&rvstart=2025-06-01T00%3A00%3A00.000Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2025+ITF+Men%27s+World+Tennis+Tour+%28April%E2%80%93June%29&rvlimit=1&rvdir=older&rvstart=2025-06-30T00%3A00%3A00.000Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2025+ITF+Men%27s+World+Tennis+Tour+%28July%E2%80%93September%29&rvlimit=1&rvdir=newer&rvprop=timestamp%7Cids
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2025+ITF+Men%27s+World+Tennis+Tour+%28July%E2%80%93September%29&rvlimit=1&rvdir=older&rvstart=2025-06-30T08%3A22%3A24.000Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2025+ITF+Men%27s+World+Tennis+Tour+%28July%E2%80%93September%29&rvlimit=1&rvdir=older&rvstart=2025-07-30T00%3A00%3A00.000Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2025+ITF+Men%27s+World+Tennis+Tour+%28July%E2%80%93September%29&rvlimit=1&rvdir=older&rvstart=2025-08-30T00%3A00%3A00.000Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2025+ITF+Men%27s+World+Tennis+Tour+%28July%E2%80%93September%29&rvlimit=1&rvdir=older&rvstart=2025-09-30T00%3A00%3A00.000Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2025+ITF+Men%27s+World+Tennis+Tour+%28October%E2%80%93December%29&rvlimit=1&rvdir=newer&rvprop=timestamp%7Cids
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2025+ITF+Men%27s+World+Tennis+Tour+%28October%E2%80%93December%29&rvlimit=1&rvdir=older&rvstart=2025-10-02T13%3A56%3A52.000Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2025+ITF+Men%27s+World+Tennis+Tour+%28October%E2%80%93December%29&rvlimit=1&rvdir=older&rvstart=2025-11-02T00%3A00%3A00.000Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2025+ITF+Men%27s+World+Tennis+Tour+%28October%E2%80%93December%29&rvlimit=1&rvdir=older&rvstart=2025-12-02T00%3A00%3A00.000Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2025+ITF+Men%27s+World+Tennis+Tour+%28October%E2%80%93December%29&rvlimit=1&rvdir=older&rvstart=2025-12-31T00%3A00%3A00.000Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2026+ATP+Challenger+Tour&rvlimit=1&rvdir=newer&rvprop=timestamp%7Cids
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2026+ATP+Challenger+Tour&rvlimit=1&rvdir=older&rvstart=2025-09-18T18%3A27%3A17.000Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2026+ATP+Challenger+Tour&rvlimit=1&rvdir=older&rvstart=2025-10-18T00%3A00%3A00.000Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2026+ATP+Challenger+Tour&rvlimit=1&rvdir=older&rvstart=2025-11-18T00%3A00%3A00.000Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2026+ATP+Challenger+Tour&rvlimit=1&rvdir=older&rvstart=2026-01-18T00%3A00%3A00.000Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2026+ATP+Challenger+Tour&rvlimit=1&rvdir=older&rvstart=2026-02-18T00%3A00%3A00.000Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2026+ATP+Challenger+Tour&rvlimit=1&rvdir=older&rvstart=2026-03-18T00%3A00%3A00.000Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2026+ATP+Challenger+Tour&rvlimit=1&rvdir=older&rvstart=2026-04-18T00%3A00%3A00.000Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2026+ATP+Challenger+Tour&rvlimit=1&rvdir=older&rvstart=2026-06-18T00%3A00%3A00.000Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2026+ATP+Challenger+Tour&rvlimit=1&rvdir=older&rvstart=2026-07-18T00%3A00%3A00.000Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2026+ATP+Challenger+Tour&rvlimit=1&rvdir=older&rvstart=2026-08-02T07%3A28%3A16.348Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2026+ITF+Men%27s+World+Tennis+Tour+%28January%E2%80%93March%29&rvlimit=1&rvdir=newer&rvprop=timestamp%7Cids
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2026+ITF+Men%27s+World+Tennis+Tour+%28January%E2%80%93March%29&rvlimit=1&rvdir=older&rvstart=2025-12-29T06%3A57%3A22.000Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2026+ITF+Men%27s+World+Tennis+Tour+%28January%E2%80%93March%29&rvlimit=1&rvdir=older&rvstart=2026-01-29T00%3A00%3A00.000Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2026+ITF+Men%27s+World+Tennis+Tour+%28January%E2%80%93March%29&rvlimit=1&rvdir=older&rvstart=2026-03-01T00%3A00%3A00.000Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2026+ITF+Men%27s+World+Tennis+Tour+%28January%E2%80%93March%29&rvlimit=1&rvdir=older&rvstart=2026-03-31T00%3A00%3A00.000Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2026+ITF+Men%27s+World+Tennis+Tour+%28April%E2%80%93June%29&rvlimit=1&rvdir=newer&rvprop=timestamp%7Cids
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2026+ITF+Men%27s+World+Tennis+Tour+%28April%E2%80%93June%29&rvlimit=1&rvdir=older&rvstart=2026-03-30T13%3A45%3A05.000Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2026+ITF+Men%27s+World+Tennis+Tour+%28April%E2%80%93June%29&rvlimit=1&rvdir=older&rvstart=2026-04-30T00%3A00%3A00.000Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2026+ITF+Men%27s+World+Tennis+Tour+%28April%E2%80%93June%29&rvlimit=1&rvdir=older&rvstart=2026-05-30T00%3A00%3A00.000Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2026+ITF+Men%27s+World+Tennis+Tour+%28April%E2%80%93June%29&rvlimit=1&rvdir=older&rvstart=2026-06-30T00%3A00%3A00.000Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2026+ITF+Men%27s+World+Tennis+Tour+%28July%E2%80%93September%29&rvlimit=1&rvdir=newer&rvprop=timestamp%7Cids
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2026+ITF+Men%27s+World+Tennis+Tour+%28July%E2%80%93September%29&rvlimit=1&rvdir=older&rvstart=2026-06-29T06%3A58%3A29.000Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2026+ITF+Men%27s+World+Tennis+Tour+%28July%E2%80%93September%29&rvlimit=1&rvdir=older&rvstart=2026-07-29T00%3A00%3A00.000Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2026+ITF+Men%27s+World+Tennis+Tour+%28July%E2%80%93September%29&rvlimit=1&rvdir=older&rvstart=2026-08-02T07%3A28%3A16.348Z&rvprop=timestamp%7Ccontent&rvslots=main
https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&titles=2026+ITF+Men%27s+World+Tennis+Tour+%28October%E2%80%93December%29&rvlimit=1&rvdir=newer&rvprop=timestamp%7Cids
```