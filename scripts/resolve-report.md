# Turnier-Auflösung — SCHARFER LAUF

> Erzeugt von `scripts/resolve-tournaments.mjs` · Lauf: 2026-08-22T13:59:45.904Z · Regel: resolveClaimField v1
> Nur NICHT-Identitätsfelder werden aufgelöst; source_ref/tournament_monday/series bleiben unberührt.

## 1. Überblick

- Turniere gesamt: **2342**
- Turniere mit ≥1 aufgelöstem Feld: **2342**
- Feld-Auflösungen gesamt: **21020**
- ITF-Turnierseite in `website` gehoben: **801** (nur itftennis.com/en/tournament/…)
- Erkannte Konflikte: **0**
- Geschrieben: **2342** Stammzeilen aktualisiert, 0 Fehler.

## 2. Feld-Siege je Quelle (welche Quelle setzt welches Feld wie oft)

| Feld | Quelle → Anzahl |
|---|---|
| category | itf_endpoint: 801 · wikipedia_challenger_2026: 270 · wikipedia_challenger_2025: 220 · wikipedia_itf_2025_q3: 195 · wikipedia_itf_2026_q2: 176 · wikipedia_itf_2025_q2: 167 · wikipedia_itf_2025_q1: 143 · wikipedia_itf_2025_q4: 130 · wikipedia_itf_2026_q1: 122 · wikipedia_itf_2026_q3: 73 · wta_endpoint: 44 |
| name | itf_endpoint: 801 · wikipedia_challenger_2026: 270 · wikipedia_challenger_2025: 220 · wta_endpoint: 44 |
| city | itf_endpoint: 801 · wikipedia_challenger_2026: 270 · wikipedia_challenger_2025: 220 · wikipedia_itf_2025_q3: 195 · wikipedia_itf_2026_q2: 176 · wikipedia_itf_2025_q2: 168 · wikipedia_itf_2025_q1: 143 · wikipedia_itf_2025_q4: 130 · wikipedia_itf_2026_q1: 122 · wikipedia_itf_2026_q3: 73 · wta_endpoint: 44 |
| country | itf_endpoint: 801 · wikipedia_challenger_2026: 270 · wikipedia_challenger_2025: 220 · wikipedia_itf_2025_q3: 195 · wikipedia_itf_2026_q2: 176 · wikipedia_itf_2025_q2: 168 · wikipedia_itf_2025_q1: 143 · wikipedia_itf_2025_q4: 130 · wikipedia_itf_2026_q1: 122 · wikipedia_itf_2026_q3: 73 · wta_endpoint: 44 |
| latitude | nominatim: 1889 · manual: 150 |
| longitude | nominatim: 1889 · manual: 150 |
| surface | itf_endpoint: 801 · wikipedia_challenger_2026: 270 · wikipedia_challenger_2025: 220 · wikipedia_itf_2025_q3: 195 · wikipedia_itf_2026_q2: 176 · wikipedia_itf_2025_q2: 168 · wikipedia_itf_2025_q1: 143 · wikipedia_itf_2025_q4: 130 · wikipedia_itf_2026_q1: 122 · wikipedia_itf_2026_q3: 73 · wta_endpoint: 44 |
| indoor | itf_endpoint: 801 · wikipedia_challenger_2026: 270 · wikipedia_challenger_2025: 220 · wikipedia_itf_2025_q3: 195 · wikipedia_itf_2026_q2: 176 · wikipedia_itf_2025_q2: 168 · wikipedia_itf_2025_q1: 143 · wikipedia_itf_2025_q4: 130 · wikipedia_itf_2026_q1: 122 · wikipedia_itf_2026_q3: 73 · wta_endpoint: 44 |
| prize_money | abgeleitet_aus_kategorie: 1496 · itf_endpoint: 409 · wta_endpoint: 44 |
| prize_currency | abgeleitet_aus_kategorie: 1496 · itf_endpoint: 409 · wta_endpoint: 44 |

**Feldübergreifend je Quelle:** itf_endpoint: 5624 · nominatim: 3778 · abgeleitet_aus_kategorie: 2992 · wikipedia_challenger_2026: 1620 · wikipedia_challenger_2025: 1320 · wikipedia_itf_2025_q3: 975 · wikipedia_itf_2026_q2: 880 · wikipedia_itf_2025_q2: 839 · wikipedia_itf_2025_q1: 715 · wikipedia_itf_2025_q4: 650 · wikipedia_itf_2026_q1: 610 · wikipedia_itf_2026_q3: 365 · wta_endpoint: 352 · manual: 300

## 3. Konflikte (unterschiedliche Werte für dasselbe Feld)

Keine — aktuell stammen alle Claims aus einer Quelle je Feld (nur Wikipedia). Konflikte
werden auftreten, sobald eine zweite Quelle (Verbandskalender) hinzukommt.

## 4. Hinweise

- **Trockenlauf ist Voreinstellung.** Scharf: `node scripts/resolve-tournaments.mjs --write`.
- **Idempotent:** gleiche Claims ⇒ deterministisch gleiche Werte; ein zweiter Lauf setzt dieselben Werte.
- **Quellen-Rangfolge** (in der Domain-Regel): verband → wikipedia → abgeleitet.
- `website` hat keine eigenen Claims; für ITF-Turniere wird die öffentliche
  itftennis.com-Turnierseite aus der claim-source_url gehoben (nur itftennis.com/en/tournament/…).
- status/latitude/longitude haben aktuell keine Claims → bleiben unverändert (Default/NULL).
