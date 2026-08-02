# Turnier-Auflösung — TROCKENLAUF (nichts geschrieben)

> Erzeugt von `scripts/resolve-tournaments.mjs` · Lauf: 2026-08-02T19:51:26.751Z · Regel: resolveClaimField v1
> Nur NICHT-Identitätsfelder werden aufgelöst; source_ref/tournament_monday/series bleiben unberührt.

## 1. Überblick

- Turniere gesamt: **1465**
- Turniere mit ≥1 aufgelöstem Feld: **1465**
- Feld-Auflösungen gesamt: **10710**
- Erkannte Konflikte: **14**
- (Trockenlauf — keine Stammzeile geschrieben.)

## 2. Feld-Siege je Quelle (welche Quelle setzt welches Feld wie oft)

| Feld | Quelle → Anzahl |
|---|---|
| category | wikipedia_challenger_2026: 238 · wikipedia_challenger_2025: 220 · wikipedia_itf_2025_q3: 195 · wikipedia_itf_2026_q2: 176 · wikipedia_itf_2025_q2: 167 · wikipedia_itf_2025_q1: 143 · wikipedia_itf_2025_q4: 130 · wikipedia_itf_2026_q1: 122 · wikipedia_itf_2026_q3: 73 |
| name | wikipedia_challenger_2026: 238 · wikipedia_challenger_2025: 220 |
| city | wikipedia_challenger_2026: 238 · wikipedia_challenger_2025: 220 · wikipedia_itf_2025_q3: 195 · wikipedia_itf_2026_q2: 176 · wikipedia_itf_2025_q2: 168 · wikipedia_itf_2025_q1: 143 · wikipedia_itf_2025_q4: 130 · wikipedia_itf_2026_q1: 122 · wikipedia_itf_2026_q3: 73 |
| country | wikipedia_challenger_2026: 238 · wikipedia_challenger_2025: 220 · wikipedia_itf_2025_q3: 195 · wikipedia_itf_2026_q2: 176 · wikipedia_itf_2025_q2: 168 · wikipedia_itf_2025_q1: 143 · wikipedia_itf_2025_q4: 130 · wikipedia_itf_2026_q1: 122 · wikipedia_itf_2026_q3: 73 |
| surface | wikipedia_challenger_2026: 238 · wikipedia_challenger_2025: 220 · wikipedia_itf_2025_q3: 195 · wikipedia_itf_2026_q2: 176 · wikipedia_itf_2025_q2: 168 · wikipedia_itf_2025_q1: 143 · wikipedia_itf_2025_q4: 130 · wikipedia_itf_2026_q1: 122 · wikipedia_itf_2026_q3: 73 |
| indoor | wikipedia_challenger_2026: 238 · wikipedia_challenger_2025: 220 · wikipedia_itf_2025_q3: 195 · wikipedia_itf_2026_q2: 176 · wikipedia_itf_2025_q2: 168 · wikipedia_itf_2025_q1: 143 · wikipedia_itf_2025_q4: 130 · wikipedia_itf_2026_q1: 122 · wikipedia_itf_2026_q3: 73 |
| prize_money | abgeleitet_aus_kategorie: 1464 |
| prize_currency | abgeleitet_aus_kategorie: 1464 |

**Feldübergreifend je Quelle:** abgeleitet_aus_kategorie: 2928 · wikipedia_challenger_2026: 1428 · wikipedia_challenger_2025: 1320 · wikipedia_itf_2025_q3: 975 · wikipedia_itf_2026_q2: 880 · wikipedia_itf_2025_q2: 839 · wikipedia_itf_2025_q1: 715 · wikipedia_itf_2025_q4: 650 · wikipedia_itf_2026_q1: 610 · wikipedia_itf_2026_q3: 365

## 3. Konflikte (unterschiedliche Werte für dasselbe Feld)

| Turnier (source_ref) | Feld | gewählt | widersprüchliche Werte (Wert@Quelle) |
|---|---|---|---|
| atp:phan-thiet-challenger-2026 | name | Phan Thiết Challenger IV | Phan Thiết Challenger IV@wikipedia_challenger_2026 · Phan Thiết Challenger III@wikipedia_challenger_2026 · Phan Thiết Challenger@wikipedia_challenger_2026 |
| atp:roehampton-challenger-2026 | name | Roehampton Challenger II | Roehampton Challenger II@wikipedia_challenger_2026 · Roehampton Challenger@wikipedia_challenger_2026 |
| atp:queensland-international-2026 | name | Queensland International III | Queensland International III@wikipedia_challenger_2026 · Queensland International@wikipedia_challenger_2026 |
| atp:plovdiv-challenger-2026 | category | Challenger 75 | Challenger 50@wikipedia_challenger_2026 · Challenger 75@wikipedia_challenger_2026 |
| atp:plovdiv-challenger-2026 | name | Plovdiv Challenger IV | Plovdiv Challenger IV@wikipedia_challenger_2026 · Plovdiv Challenger III@wikipedia_challenger_2026 · Plovdiv Challenger@wikipedia_challenger_2026 |
| atp:plovdiv-challenger-2026 | prize_money | 75000 | 75000@abgeleitet_aus_kategorie · 50000@abgeleitet_aus_kategorie |
| atp:monastir-open-2026 | name | Monastir Open II | Monastir Open II@wikipedia_challenger_2026 · Monastir Open@wikipedia_challenger_2026 |
| atp:fujairah-open-2026 | name | Fujairah Open II | Fujairah Open II@wikipedia_challenger_2026 · Fujairah Open@wikipedia_challenger_2026 |
| atp:santa-cruz-challenger-2026 | name | Santa Cruz Challenger II | Santa Cruz Challenger II@wikipedia_challenger_2026 · Santa Cruz Challenger@wikipedia_challenger_2026 |
| atp:centurion-challenger-2026 | category | Challenger 75 | Challenger 75@wikipedia_challenger_2026 · Challenger 50@wikipedia_challenger_2026 |
| atp:centurion-challenger-2026 | name | Centurion Challenger IV | Centurion Challenger IV@wikipedia_challenger_2026 · Centurion Challenger@wikipedia_challenger_2026 · Centurion Challenger III@wikipedia_challenger_2026 |
| atp:centurion-challenger-2026 | prize_money | 75000 | 75000@abgeleitet_aus_kategorie · 50000@abgeleitet_aus_kategorie |
| atp:crete-challenger-2026 | name | Crete Challenger IV | Crete Challenger@wikipedia_challenger_2026 · Crete Challenger IV@wikipedia_challenger_2026 · Crete Challenger III@wikipedia_challenger_2026 |
| atp:kingston-open-2026 | name | Kingston Open II | Kingston Open II@wikipedia_challenger_2026 · Kingston Open@wikipedia_challenger_2026 |

## 4. Hinweise

- **Trockenlauf ist Voreinstellung.** Scharf: `node scripts/resolve-tournaments.mjs --write`.
- **Idempotent:** gleiche Claims ⇒ deterministisch gleiche Werte; ein zweiter Lauf setzt dieselben Werte.
- **Quellen-Rangfolge** (in der Domain-Regel): verband → wikipedia → abgeleitet.
- status/website/latitude/longitude haben aktuell keine Claims → bleiben unverändert (Default/NULL).
