# Turnier-Auflösung — SCHARFER LAUF

> Erzeugt von `scripts/resolve-tournaments.mjs` · Lauf: 2026-08-02T20:43:27.884Z · Regel: resolveClaimField v1
> Nur NICHT-Identitätsfelder werden aufgelöst; source_ref/tournament_monday/series bleiben unberührt.

## 1. Überblick

- Turniere gesamt: **1489**
- Turniere mit ≥1 aufgelöstem Feld: **1489**
- Feld-Auflösungen gesamt: **10902**
- Erkannte Konflikte: **0**
- Geschrieben: **1489** Stammzeilen aktualisiert, 0 Fehler.

## 2. Feld-Siege je Quelle (welche Quelle setzt welches Feld wie oft)

| Feld | Quelle → Anzahl |
|---|---|
| category | wikipedia_challenger_2026: 262 · wikipedia_challenger_2025: 220 · wikipedia_itf_2025_q3: 195 · wikipedia_itf_2026_q2: 176 · wikipedia_itf_2025_q2: 167 · wikipedia_itf_2025_q1: 143 · wikipedia_itf_2025_q4: 130 · wikipedia_itf_2026_q1: 122 · wikipedia_itf_2026_q3: 73 |
| name | wikipedia_challenger_2026: 262 · wikipedia_challenger_2025: 220 |
| city | wikipedia_challenger_2026: 262 · wikipedia_challenger_2025: 220 · wikipedia_itf_2025_q3: 195 · wikipedia_itf_2026_q2: 176 · wikipedia_itf_2025_q2: 168 · wikipedia_itf_2025_q1: 143 · wikipedia_itf_2025_q4: 130 · wikipedia_itf_2026_q1: 122 · wikipedia_itf_2026_q3: 73 |
| country | wikipedia_challenger_2026: 262 · wikipedia_challenger_2025: 220 · wikipedia_itf_2025_q3: 195 · wikipedia_itf_2026_q2: 176 · wikipedia_itf_2025_q2: 168 · wikipedia_itf_2025_q1: 143 · wikipedia_itf_2025_q4: 130 · wikipedia_itf_2026_q1: 122 · wikipedia_itf_2026_q3: 73 |
| surface | wikipedia_challenger_2026: 262 · wikipedia_challenger_2025: 220 · wikipedia_itf_2025_q3: 195 · wikipedia_itf_2026_q2: 176 · wikipedia_itf_2025_q2: 168 · wikipedia_itf_2025_q1: 143 · wikipedia_itf_2025_q4: 130 · wikipedia_itf_2026_q1: 122 · wikipedia_itf_2026_q3: 73 |
| indoor | wikipedia_challenger_2026: 262 · wikipedia_challenger_2025: 220 · wikipedia_itf_2025_q3: 195 · wikipedia_itf_2026_q2: 176 · wikipedia_itf_2025_q2: 168 · wikipedia_itf_2025_q1: 143 · wikipedia_itf_2025_q4: 130 · wikipedia_itf_2026_q1: 122 · wikipedia_itf_2026_q3: 73 |
| prize_money | abgeleitet_aus_kategorie: 1488 |
| prize_currency | abgeleitet_aus_kategorie: 1488 |

**Feldübergreifend je Quelle:** abgeleitet_aus_kategorie: 2976 · wikipedia_challenger_2026: 1572 · wikipedia_challenger_2025: 1320 · wikipedia_itf_2025_q3: 975 · wikipedia_itf_2026_q2: 880 · wikipedia_itf_2025_q2: 839 · wikipedia_itf_2025_q1: 715 · wikipedia_itf_2025_q4: 650 · wikipedia_itf_2026_q1: 610 · wikipedia_itf_2026_q3: 365

## 3. Konflikte (unterschiedliche Werte für dasselbe Feld)

Keine — aktuell stammen alle Claims aus einer Quelle je Feld (nur Wikipedia). Konflikte
werden auftreten, sobald eine zweite Quelle (Verbandskalender) hinzukommt.

## 4. Hinweise

- **Trockenlauf ist Voreinstellung.** Scharf: `node scripts/resolve-tournaments.mjs --write`.
- **Idempotent:** gleiche Claims ⇒ deterministisch gleiche Werte; ein zweiter Lauf setzt dieselben Werte.
- **Quellen-Rangfolge** (in der Domain-Regel): verband → wikipedia → abgeleitet.
- status/website/latitude/longitude haben aktuell keine Claims → bleiben unverändert (Default/NULL).
