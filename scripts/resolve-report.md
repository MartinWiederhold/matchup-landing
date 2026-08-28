# Turnier-Auflösung — SCHARFER LAUF

> Erzeugt von `scripts/resolve-tournaments.mjs` · Lauf: 2026-08-27T19:52:17.260Z · Regel: resolveClaimField v1
> Nur NICHT-Identitätsfelder werden aufgelöst; source_ref/tournament_monday/series bleiben unberührt.

## 1. Überblick

- Turniere gesamt: **2373**
- Turniere mit ≥1 aufgelöstem Feld: **2373**
- Feld-Auflösungen gesamt: **21258**
- ITF-Turnierseite in `website` gehoben: **830** (nur itftennis.com/en/tournament/…)
- Erkannte Konflikte: **16**
- Geschrieben: **2373** Stammzeilen aktualisiert, 0 Fehler.

## 2. Feld-Siege je Quelle (welche Quelle setzt welches Feld wie oft)

| Feld | Quelle → Anzahl |
|---|---|
| category | itf_endpoint: 830 · wikipedia_challenger_2026: 272 · wikipedia_challenger_2025: 220 · wikipedia_itf_2025_q3: 195 · wikipedia_itf_2026_q2: 176 · wikipedia_itf_2025_q2: 167 · wikipedia_itf_2025_q1: 143 · wikipedia_itf_2025_q4: 130 · wikipedia_itf_2026_q1: 122 · wikipedia_itf_2026_q3: 73 · wta_endpoint: 44 |
| name | itf_endpoint: 830 · wikipedia_challenger_2026: 272 · wikipedia_challenger_2025: 220 · wta_endpoint: 44 |
| city | itf_endpoint: 830 · wikipedia_challenger_2026: 272 · wikipedia_challenger_2025: 220 · wikipedia_itf_2025_q3: 195 · wikipedia_itf_2026_q2: 176 · wikipedia_itf_2025_q2: 168 · wikipedia_itf_2025_q1: 143 · wikipedia_itf_2025_q4: 130 · wikipedia_itf_2026_q1: 122 · wikipedia_itf_2026_q3: 73 · wta_endpoint: 44 |
| country | itf_endpoint: 830 · wikipedia_challenger_2026: 272 · wikipedia_challenger_2025: 220 · wikipedia_itf_2025_q3: 195 · wikipedia_itf_2026_q2: 176 · wikipedia_itf_2025_q2: 168 · wikipedia_itf_2025_q1: 143 · wikipedia_itf_2025_q4: 130 · wikipedia_itf_2026_q1: 122 · wikipedia_itf_2026_q3: 73 · wta_endpoint: 44 |
| latitude | nominatim: 1896 · manual: 150 |
| longitude | nominatim: 1896 · manual: 150 |
| surface | itf_endpoint: 830 · wikipedia_challenger_2026: 272 · wikipedia_challenger_2025: 220 · wikipedia_itf_2025_q3: 195 · wikipedia_itf_2026_q2: 176 · wikipedia_itf_2025_q2: 168 · wikipedia_itf_2025_q1: 143 · wikipedia_itf_2025_q4: 130 · wikipedia_itf_2026_q1: 122 · wikipedia_itf_2026_q3: 73 · wta_endpoint: 44 |
| indoor | itf_endpoint: 830 · wikipedia_challenger_2026: 272 · wikipedia_challenger_2025: 220 · wikipedia_itf_2025_q3: 195 · wikipedia_itf_2026_q2: 176 · wikipedia_itf_2025_q2: 168 · wikipedia_itf_2025_q1: 143 · wikipedia_itf_2025_q4: 130 · wikipedia_itf_2026_q1: 122 · wikipedia_itf_2026_q3: 73 · wta_endpoint: 44 |
| prize_money | abgeleitet_aus_kategorie: 1498 · itf_endpoint: 426 · wta_endpoint: 44 |
| prize_currency | abgeleitet_aus_kategorie: 1498 · itf_endpoint: 426 · wta_endpoint: 44 |

**Feldübergreifend je Quelle:** itf_endpoint: 5832 · nominatim: 3792 · abgeleitet_aus_kategorie: 2996 · wikipedia_challenger_2026: 1632 · wikipedia_challenger_2025: 1320 · wikipedia_itf_2025_q3: 975 · wikipedia_itf_2026_q2: 880 · wikipedia_itf_2025_q2: 839 · wikipedia_itf_2025_q1: 715 · wikipedia_itf_2025_q4: 650 · wikipedia_itf_2026_q1: 610 · wikipedia_itf_2026_q3: 365 · wta_endpoint: 352 · manual: 300

## 3. Konflikte (unterschiedliche Werte für dasselbe Feld)

| Turnier (source_ref) | Feld | gewählt | widersprüchliche Werte (Wert@Quelle) |
|---|---|---|---|
| itf:w-itf-chn-2026-034 | indoor | false | true@itf_endpoint · false@itf_endpoint |
| itf:w-itf-aus-2026-016 | name | Sydney Olympic Park International #1 | Sydney Olympic Park International #1@itf_endpoint · Wollongong Tennis International #1@itf_endpoint |
| itf:w-itf-aus-2026-016 | city | Sydney | Sydney@itf_endpoint · Wollongong@itf_endpoint |
| itf:w-itf-usa-2026-046 | name | Lake Las Vegas Open | W35 Las Vegas, NV@itf_endpoint · Lake Las Vegas Open@itf_endpoint |
| itf:w-itf-hun-2026-003 | name | DRK Pécs Ladies Open | Elektromos Open@itf_endpoint · DRK Pécs Ladies Open@itf_endpoint |
| itf:w-itf-usa-2026-048 | name | Lexington County Pro Classic | W50 Lexington, SC@itf_endpoint · Lexington County Pro Classic@itf_endpoint |
| itf:w-itf-arg-2026-013 | surface | hard | clay@itf_endpoint · hard@itf_endpoint |
| itf:w-itf-usa-2026-050 | name | Ascension Project Women's Open | W35 Redding, CA@itf_endpoint · Ascension Project Women's Open@itf_endpoint |
| itf:w-itf-aus-2026-017 | name | Sydney Olympic Park International #2 | Sydney Olympic Park International #2@itf_endpoint · Wollongong Tennis International #2@itf_endpoint |
| itf:w-itf-aus-2026-017 | city | Sydney | Sydney@itf_endpoint · Wollongong@itf_endpoint |
| itf:j-j200-uru-2026-001 | name | Uruguay Bowl 2026 | Uruguay Bowl 2026@itf_endpoint · Carrasco Bowl 2025@itf_endpoint |
| itf:w-itf-chn-2026-033 | indoor | false | true@itf_endpoint · false@itf_endpoint |
| itf:w-itf-chn-2026-035 | indoor | false | true@itf_endpoint · false@itf_endpoint |
| wta:1180:2026 | name | Curitiba Open - Curitiba, BRA | Curitiba Open - Curitiba, BRA@wta_endpoint · Abierto de Curitiba - Curitiba, BRA@wta_endpoint |
| itf:w-itf-lux-2026-001 | category | W75 | W50@itf_endpoint · W75@itf_endpoint |
| itf:w-itf-lux-2026-001 | prize_money | 60000 | 40000@itf_endpoint · 60000@itf_endpoint |

## 4. Hinweise

- **Trockenlauf ist Voreinstellung.** Scharf: `node scripts/resolve-tournaments.mjs --write`.
- **Idempotent:** gleiche Claims ⇒ deterministisch gleiche Werte; ein zweiter Lauf setzt dieselben Werte.
- **Quellen-Rangfolge** (in der Domain-Regel): verband → wikipedia → abgeleitet.
- `website` hat keine eigenen Claims; für ITF-Turniere wird die öffentliche
  itftennis.com-Turnierseite aus der claim-source_url gehoben (nur itftennis.com/en/tournament/…).
- status/latitude/longitude haben aktuell keine Claims → bleiben unverändert (Default/NULL).
