# Wikipedia-Import — TROCKENLAUF (nichts geschrieben)

> Erzeugt von `scripts/wikipedia-import.mjs` · Lauf: 2026-08-02T19:43:10.503Z
> Ziel: web.tour_tournaments + web.tour_tournament_claims. **Kein DB-Zugriff** in diesem Lauf.

## 1. Je Seite

| Serie | Jahr | Seite | Zeilen | importierbar | verworfen | Fehler |
|---|---|---|---:|---:|---:|---|
| ITF | 2025 | 2025 ITF (January–March) | 143 | 143 | 0 | – |
| ITF | 2025 | 2025 ITF (April–June) | 168 | 168 | 0 | – |
| ITF | 2025 | 2025 ITF (July–September) | 195 | 195 | 0 | – |
| ITF | 2025 | 2025 ITF (October–December) | 130 | 130 | 0 | – |
| Challenger | 2025 | 2025 Challenger | 221 | 220 | 1 | – |
| ITF | 2026 | 2026 ITF (January–March) | 122 | 122 | 0 | – |
| ITF | 2026 | 2026 ITF (April–June) | 178 | 176 | 2 | – |
| ITF | 2026 | 2026 ITF (July–September) | 73 | 73 | 0 | – |
| ITF | 2026 | 2026 ITF (October–December) | 0 | 0 | 0 | Seite fehlt (missing) |
| Challenger | 2026 | 2026 Challenger | 263 | 263 | 0 | – |

**Summe:** 1490 importierbar, 3 verworfen. Claims gesamt: 13890.

## 2. Verworfene Zeilen nach Grund

- **land_fehlt** — 2×
- **land_unbekannt** — 1×

### Alle verworfenen Zeilen (Seite · Woche · Ort · Land · Grund)

- 2025 Challenger · October 27 · Los Inkas Open{{efn|name=Guayaquil|The Challenger Ciudad de Guayaquil was origin… · Peru due to safety concerns. It was then later rescheduled for 17 · land_unbekannt: Peru due to safety concerns. It was then later rescheduled for 1…
- 2026 ITF (April–June) · April 13 · — · — · land_fehlt (kein Land im Kalender)
- 2026 ITF (April–June) · April 20 · — · — · land_fehlt (kein Land im Kalender)

## 3. Unbekannte Ländernamen (Tabelle ergänzen)

- `Peru due to safety concerns. It was then later rescheduled for 17` — 1×

## 4. Stichprobe: 10 Datensätze — Identitätszeile (Stamm) + Claims (Herkunft)

Der Import schreibt in `tour_tournaments` NUR die Identitätsfelder; alle übrigen Felder
stehen als Claims und werden später von `scripts/resolve-tournaments.mjs` in den Stamm aufgelöst.

### itf:m-itf-ind-2024-009
```json
// tour_tournaments
{
  "source_ref": "itf:m-itf-ind-2024-009",
  "tournament_monday": "2024-12-30",
  "series": "itf_wtt"
}
// tour_tournament_claims
[
  {
    "field_name": "tournament_monday",
    "field_value": "2024-12-30",
    "source": "wikipedia_itf_2025_q1",
    "source_url": "https://en.wikipedia.org/wiki/2025_ITF_Men's_World_Tennis_Tour_(January%E2%80%93March)",
    "confidence": 0.9
  },
  {
    "field_name": "series",
    "field_value": "itf_wtt",
    "source": "wikipedia_itf_2025_q1",
    "source_url": "https://en.wikipedia.org/wiki/2025_ITF_Men's_World_Tennis_Tour_(January%E2%80%93March)",
    "confidence": 0.9
  },
  {
    "field_name": "category",
    "field_value": "M25",
    "source": "wikipedia_itf_2025_q1",
    "source_url": "https://en.wikipedia.org/wiki/2025_ITF_Men's_World_Tennis_Tour_(January%E2%80%93March)",
    "confidence": 0.9
  },
  {
    "field_name": "city",
    "field_value": "Indore",
    "source": "wikipedia_itf_2025_q1",
    "source_url": "https://en.wikipedia.org/wiki/2025_ITF_Men's_World_Tennis_Tour_(January%E2%80%93March)",
    "confidence": 0.9
  },
  {
    "field_name": "country",
    "field_value": "IN",
    "source": "wikipedia_itf_2025_q1",
    "source_url": "https://en.wikipedia.org/wiki/2025_ITF_Men's_World_Tennis_Tour_(January%E2%80%93March)",
    "confidence": 0.9
  },
  {
    "field_name": "surface",
    "field_value": "hard",
    "source": "wikipedia_itf_2025_q1",
    "source_url": "https://en.wikipedia.org/wiki/2025_ITF_Men's_World_Tennis_Tour_(January%E2%80%93March)",
    "confidence": 0.9
  },
  {
    "field_name": "indoor",
    "field_value": "false",
    "source": "wikipedia_itf_2025_q1",
    "source_url": "https://en.wikipedia.org/wiki/2025_ITF_Men's_World_Tennis_Tour_(January%E2%80%93March)",
    "confidence": 0.9
  },
  {
    "field_name": "prize_money",
    "field_value": "25000",
    "source": "abgeleitet_aus_kategorie",
    "source_url": "https://en.wikipedia.org/wiki/2025_ITF_Men's_World_Tennis_Tour_(January%E2%80%93March)",
    "confidence": 0.5
  },
  {
    "field_name": "prize_currency",
    "field_value": "USD",
    "source": "abgeleitet_aus_kategorie",
    "source_url": "https://en.wikipedia.org/wiki/2025_ITF_Men's_World_Tennis_Tour_(January%E2%80%93March)",
    "confidence": 0.5
  }
]
```

### itf:m-itf-ina-2024-007
```json
// tour_tournaments
{
  "source_ref": "itf:m-itf-ina-2024-007",
  "tournament_monday": "2024-12-30",
  "series": "itf_wtt"
}
// tour_tournament_claims
[
  {
    "field_name": "tournament_monday",
    "field_value": "2024-12-30",
    "source": "wikipedia_itf_2025_q1",
    "source_url": "https://en.wikipedia.org/wiki/2025_ITF_Men's_World_Tennis_Tour_(January%E2%80%93March)",
    "confidence": 0.9
  },
  {
    "field_name": "series",
    "field_value": "itf_wtt",
    "source": "wikipedia_itf_2025_q1",
    "source_url": "https://en.wikipedia.org/wiki/2025_ITF_Men's_World_Tennis_Tour_(January%E2%80%93March)",
    "confidence": 0.9
  },
  {
    "field_name": "category",
    "field_value": "M25",
    "source": "wikipedia_itf_2025_q1",
    "source_url": "https://en.wikipedia.org/wiki/2025_ITF_Men's_World_Tennis_Tour_(January%E2%80%93March)",
    "confidence": 0.9
  },
  {
    "field_name": "city",
    "field_value": "Bali",
    "source": "wikipedia_itf_2025_q1",
    "source_url": "https://en.wikipedia.org/wiki/2025_ITF_Men's_World_Tennis_Tour_(January%E2%80%93March)",
    "confidence": 0.9
  },
  {
    "field_name": "country",
    "field_value": "ID",
    "source": "wikipedia_itf_2025_q1",
    "source_url": "https://en.wikipedia.org/wiki/2025_ITF_Men's_World_Tennis_Tour_(January%E2%80%93March)",
    "confidence": 0.9
  },
  {
    "field_name": "surface",
    "field_value": "hard",
    "source": "wikipedia_itf_2025_q1",
    "source_url": "https://en.wikipedia.org/wiki/2025_ITF_Men's_World_Tennis_Tour_(January%E2%80%93March)",
    "confidence": 0.9
  },
  {
    "field_name": "indoor",
    "field_value": "false",
    "source": "wikipedia_itf_2025_q1",
    "source_url": "https://en.wikipedia.org/wiki/2025_ITF_Men's_World_Tennis_Tour_(January%E2%80%93March)",
    "confidence": 0.9
  },
  {
    "field_name": "prize_money",
    "field_value": "25000",
    "source": "abgeleitet_aus_kategorie",
    "source_url": "https://en.wikipedia.org/wiki/2025_ITF_Men's_World_Tennis_Tour_(January%E2%80%93March)",
    "confidence": 0.5
  },
  {
    "field_name": "prize_currency",
    "field_value": "USD",
    "source": "abgeleitet_aus_kategorie",
    "source_url": "https://en.wikipedia.org/wiki/2025_ITF_Men's_World_Tennis_Tour_(January%E2%80%93March)",
    "confidence": 0.5
  }
]
```

### itf:m-itf-fra-2025-001
```json
// tour_tournaments
{
  "source_ref": "itf:m-itf-fra-2025-001",
  "tournament_monday": "2025-01-06",
  "series": "itf_wtt"
}
// tour_tournament_claims
[
  {
    "field_name": "tournament_monday",
    "field_value": "2025-01-06",
    "source": "wikipedia_itf_2025_q1",
    "source_url": "https://en.wikipedia.org/wiki/2025_ITF_Men's_World_Tennis_Tour_(January%E2%80%93March)",
    "confidence": 0.9
  },
  {
    "field_name": "series",
    "field_value": "itf_wtt",
    "source": "wikipedia_itf_2025_q1",
    "source_url": "https://en.wikipedia.org/wiki/2025_ITF_Men's_World_Tennis_Tour_(January%E2%80%93March)",
    "confidence": 0.9
  },
  {
    "field_name": "category",
    "field_value": "M25",
    "source": "wikipedia_itf_2025_q1",
    "source_url": "https://en.wikipedia.org/wiki/2025_ITF_Men's_World_Tennis_Tour_(January%E2%80%93March)",
    "confidence": 0.9
  },
  {
    "field_name": "city",
    "field_value": "Hazebrouck",
    "source": "wikipedia_itf_2025_q1",
    "source_url": "https://en.wikipedia.org/wiki/2025_ITF_Men's_World_Tennis_Tour_(January%E2%80%93March)",
    "confidence": 0.9
  },
  {
    "field_name": "country",
    "field_value": "FR",
    "source": "wikipedia_itf_2025_q1",
    "source_url": "https://en.wikipedia.org/wiki/2025_ITF_Men's_World_Tennis_Tour_(January%E2%80%93March)",
    "confidence": 0.9
  },
  {
    "field_name": "surface",
    "field_value": "hard",
    "source": "wikipedia_itf_2025_q1",
    "source_url": "https://en.wikipedia.org/wiki/2025_ITF_Men's_World_Tennis_Tour_(January%E2%80%93March)",
    "confidence": 0.9
  },
  {
    "field_name": "indoor",
    "field_value": "true",
    "source": "wikipedia_itf_2025_q1",
    "source_url": "https://en.wikipedia.org/wiki/2025_ITF_Men's_World_Tennis_Tour_(January%E2%80%93March)",
    "confidence": 0.9
  },
  {
    "field_name": "prize_money",
    "field_value": "25000",
    "source": "abgeleitet_aus_kategorie",
    "source_url": "https://en.wikipedia.org/wiki/2025_ITF_Men's_World_Tennis_Tour_(January%E2%80%93March)",
    "confidence": 0.5
  },
  {
    "field_name": "prize_currency",
    "field_value": "USD",
    "source": "abgeleitet_aus_kategorie",
    "source_url": "https://en.wikipedia.org/wiki/2025_ITF_Men's_World_Tennis_Tour_(January%E2%80%93March)",
    "confidence": 0.5
  }
]
```

### itf:m-itf-ind-2025-001
```json
// tour_tournaments
{
  "source_ref": "itf:m-itf-ind-2025-001",
  "tournament_monday": "2025-01-06",
  "series": "itf_wtt"
}
// tour_tournament_claims
[
  {
    "field_name": "tournament_monday",
    "field_value": "2025-01-06",
    "source": "wikipedia_itf_2025_q1",
    "source_url": "https://en.wikipedia.org/wiki/2025_ITF_Men's_World_Tennis_Tour_(January%E2%80%93March)",
    "confidence": 0.9
  },
  {
    "field_name": "series",
    "field_value": "itf_wtt",
    "source": "wikipedia_itf_2025_q1",
    "source_url": "https://en.wikipedia.org/wiki/2025_ITF_Men's_World_Tennis_Tour_(January%E2%80%93March)",
    "confidence": 0.9
  },
  {
    "field_name": "category",
    "field_value": "M25",
    "source": "wikipedia_itf_2025_q1",
    "source_url": "https://en.wikipedia.org/wiki/2025_ITF_Men's_World_Tennis_Tour_(January%E2%80%93March)",
    "confidence": 0.9
  },
  {
    "field_name": "city",
    "field_value": "Bhopal",
    "source": "wikipedia_itf_2025_q1",
    "source_url": "https://en.wikipedia.org/wiki/2025_ITF_Men's_World_Tennis_Tour_(January%E2%80%93March)",
    "confidence": 0.9
  },
  {
    "field_name": "country",
    "field_value": "IN",
    "source": "wikipedia_itf_2025_q1",
    "source_url": "https://en.wikipedia.org/wiki/2025_ITF_Men's_World_Tennis_Tour_(January%E2%80%93March)",
    "confidence": 0.9
  },
  {
    "field_name": "surface",
    "field_value": "hard",
    "source": "wikipedia_itf_2025_q1",
    "source_url": "https://en.wikipedia.org/wiki/2025_ITF_Men's_World_Tennis_Tour_(January%E2%80%93March)",
    "confidence": 0.9
  },
  {
    "field_name": "indoor",
    "field_value": "false",
    "source": "wikipedia_itf_2025_q1",
    "source_url": "https://en.wikipedia.org/wiki/2025_ITF_Men's_World_Tennis_Tour_(January%E2%80%93March)",
    "confidence": 0.9
  },
  {
    "field_name": "prize_money",
    "field_value": "25000",
    "source": "abgeleitet_aus_kategorie",
    "source_url": "https://en.wikipedia.org/wiki/2025_ITF_Men's_World_Tennis_Tour_(January%E2%80%93March)",
    "confidence": 0.5
  },
  {
    "field_name": "prize_currency",
    "field_value": "USD",
    "source": "abgeleitet_aus_kategorie",
    "source_url": "https://en.wikipedia.org/wiki/2025_ITF_Men's_World_Tennis_Tour_(January%E2%80%93March)",
    "confidence": 0.5
  }
]
```

### itf:m-itf-usa-2025-001
```json
// tour_tournaments
{
  "source_ref": "itf:m-itf-usa-2025-001",
  "tournament_monday": "2025-01-06",
  "series": "itf_wtt"
}
// tour_tournament_claims
[
  {
    "field_name": "tournament_monday",
    "field_value": "2025-01-06",
    "source": "wikipedia_itf_2025_q1",
    "source_url": "https://en.wikipedia.org/wiki/2025_ITF_Men's_World_Tennis_Tour_(January%E2%80%93March)",
    "confidence": 0.9
  },
  {
    "field_name": "series",
    "field_value": "itf_wtt",
    "source": "wikipedia_itf_2025_q1",
    "source_url": "https://en.wikipedia.org/wiki/2025_ITF_Men's_World_Tennis_Tour_(January%E2%80%93March)",
    "confidence": 0.9
  },
  {
    "field_name": "category",
    "field_value": "M25",
    "source": "wikipedia_itf_2025_q1",
    "source_url": "https://en.wikipedia.org/wiki/2025_ITF_Men's_World_Tennis_Tour_(January%E2%80%93March)",
    "confidence": 0.9
  },
  {
    "field_name": "city",
    "field_value": "Ithaca",
    "source": "wikipedia_itf_2025_q1",
    "source_url": "https://en.wikipedia.org/wiki/2025_ITF_Men's_World_Tennis_Tour_(January%E2%80%93March)",
    "confidence": 0.9
  },
  {
    "field_name": "country",
    "field_value": "US",
    "source": "wikipedia_itf_2025_q1",
    "source_url": "https://en.wikipedia.org/wiki/2025_ITF_Men's_World_Tennis_Tour_(January%E2%80%93March)",
    "confidence": 0.9
  },
  {
    "field_name": "surface",
    "field_value": "hard",
    "source": "wikipedia_itf_2025_q1",
    "source_url": "https://en.wikipedia.org/wiki/2025_ITF_Men's_World_Tennis_Tour_(January%E2%80%93March)",
    "confidence": 0.9
  },
  {
    "field_name": "indoor",
    "field_value": "true",
    "source": "wikipedia_itf_2025_q1",
    "source_url": "https://en.wikipedia.org/wiki/2025_ITF_Men's_World_Tennis_Tour_(January%E2%80%93March)",
    "confidence": 0.9
  },
  {
    "field_name": "prize_money",
    "field_value": "25000",
    "source": "abgeleitet_aus_kategorie",
    "source_url": "https://en.wikipedia.org/wiki/2025_ITF_Men's_World_Tennis_Tour_(January%E2%80%93March)",
    "confidence": 0.5
  },
  {
    "field_name": "prize_currency",
    "field_value": "USD",
    "source": "abgeleitet_aus_kategorie",
    "source_url": "https://en.wikipedia.org/wiki/2025_ITF_Men's_World_Tennis_Tour_(January%E2%80%93March)",
    "confidence": 0.5
  }
]
```

### atp:canberra-tennis-international-2024-12-30
```json
// tour_tournaments
{
  "source_ref": "atp:canberra-tennis-international-2024-12-30",
  "tournament_monday": "2024-12-30",
  "series": "challenger"
}
// tour_tournament_claims
[
  {
    "field_name": "tournament_monday",
    "field_value": "2024-12-30",
    "source": "wikipedia_challenger_2025",
    "source_url": "https://en.wikipedia.org/wiki/2025_ATP_Challenger_Tour",
    "confidence": 0.9
  },
  {
    "field_name": "series",
    "field_value": "challenger",
    "source": "wikipedia_challenger_2025",
    "source_url": "https://en.wikipedia.org/wiki/2025_ATP_Challenger_Tour",
    "confidence": 0.9
  },
  {
    "field_name": "category",
    "field_value": "Challenger 125",
    "source": "wikipedia_challenger_2025",
    "source_url": "https://en.wikipedia.org/wiki/2025_ATP_Challenger_Tour",
    "confidence": 0.9
  },
  {
    "field_name": "name",
    "field_value": "Canberra Tennis International",
    "source": "wikipedia_challenger_2025",
    "source_url": "https://en.wikipedia.org/wiki/2025_ATP_Challenger_Tour",
    "confidence": 0.9
  },
  {
    "field_name": "city",
    "field_value": "Canberra",
    "source": "wikipedia_challenger_2025",
    "source_url": "https://en.wikipedia.org/wiki/2025_ATP_Challenger_Tour",
    "confidence": 0.9
  },
  {
    "field_name": "country",
    "field_value": "AU",
    "source": "wikipedia_challenger_2025",
    "source_url": "https://en.wikipedia.org/wiki/2025_ATP_Challenger_Tour",
    "confidence": 0.9
  },
  {
    "field_name": "surface",
    "field_value": "hard",
    "source": "wikipedia_challenger_2025",
    "source_url": "https://en.wikipedia.org/wiki/2025_ATP_Challenger_Tour",
    "confidence": 0.9
  },
  {
    "field_name": "indoor",
    "field_value": "false",
    "source": "wikipedia_challenger_2025",
    "source_url": "https://en.wikipedia.org/wiki/2025_ATP_Challenger_Tour",
    "confidence": 0.9
  },
  {
    "field_name": "prize_money",
    "field_value": "125000",
    "source": "abgeleitet_aus_kategorie",
    "source_url": "https://en.wikipedia.org/wiki/2025_ATP_Challenger_Tour",
    "confidence": 0.5
  },
  {
    "field_name": "prize_currency",
    "field_value": "USD",
    "source": "abgeleitet_aus_kategorie",
    "source_url": "https://en.wikipedia.org/wiki/2025_ATP_Challenger_Tour",
    "confidence": 0.5
  }
]
```

### atp:open-nouvelle-caledonie-2024-12-30
```json
// tour_tournaments
{
  "source_ref": "atp:open-nouvelle-caledonie-2024-12-30",
  "tournament_monday": "2024-12-30",
  "series": "challenger"
}
// tour_tournament_claims
[
  {
    "field_name": "tournament_monday",
    "field_value": "2024-12-30",
    "source": "wikipedia_challenger_2025",
    "source_url": "https://en.wikipedia.org/wiki/2025_ATP_Challenger_Tour",
    "confidence": 0.9
  },
  {
    "field_name": "series",
    "field_value": "challenger",
    "source": "wikipedia_challenger_2025",
    "source_url": "https://en.wikipedia.org/wiki/2025_ATP_Challenger_Tour",
    "confidence": 0.9
  },
  {
    "field_name": "category",
    "field_value": "Challenger 100",
    "source": "wikipedia_challenger_2025",
    "source_url": "https://en.wikipedia.org/wiki/2025_ATP_Challenger_Tour",
    "confidence": 0.9
  },
  {
    "field_name": "name",
    "field_value": "Open Nouvelle-Calédonie",
    "source": "wikipedia_challenger_2025",
    "source_url": "https://en.wikipedia.org/wiki/2025_ATP_Challenger_Tour",
    "confidence": 0.9
  },
  {
    "field_name": "city",
    "field_value": "Nouméa",
    "source": "wikipedia_challenger_2025",
    "source_url": "https://en.wikipedia.org/wiki/2025_ATP_Challenger_Tour",
    "confidence": 0.9
  },
  {
    "field_name": "country",
    "field_value": "NC",
    "source": "wikipedia_challenger_2025",
    "source_url": "https://en.wikipedia.org/wiki/2025_ATP_Challenger_Tour",
    "confidence": 0.9
  },
  {
    "field_name": "surface",
    "field_value": "hard",
    "source": "wikipedia_challenger_2025",
    "source_url": "https://en.wikipedia.org/wiki/2025_ATP_Challenger_Tour",
    "confidence": 0.9
  },
  {
    "field_name": "indoor",
    "field_value": "false",
    "source": "wikipedia_challenger_2025",
    "source_url": "https://en.wikipedia.org/wiki/2025_ATP_Challenger_Tour",
    "confidence": 0.9
  },
  {
    "field_name": "prize_money",
    "field_value": "100000",
    "source": "abgeleitet_aus_kategorie",
    "source_url": "https://en.wikipedia.org/wiki/2025_ATP_Challenger_Tour",
    "confidence": 0.5
  },
  {
    "field_name": "prize_currency",
    "field_value": "USD",
    "source": "abgeleitet_aus_kategorie",
    "source_url": "https://en.wikipedia.org/wiki/2025_ATP_Challenger_Tour",
    "confidence": 0.5
  }
]
```

### atp:nonthaburi-challenger-2024-12-30
```json
// tour_tournaments
{
  "source_ref": "atp:nonthaburi-challenger-2024-12-30",
  "tournament_monday": "2024-12-30",
  "series": "challenger"
}
// tour_tournament_claims
[
  {
    "field_name": "tournament_monday",
    "field_value": "2024-12-30",
    "source": "wikipedia_challenger_2025",
    "source_url": "https://en.wikipedia.org/wiki/2025_ATP_Challenger_Tour",
    "confidence": 0.9
  },
  {
    "field_name": "series",
    "field_value": "challenger",
    "source": "wikipedia_challenger_2025",
    "source_url": "https://en.wikipedia.org/wiki/2025_ATP_Challenger_Tour",
    "confidence": 0.9
  },
  {
    "field_name": "category",
    "field_value": "Challenger 75",
    "source": "wikipedia_challenger_2025",
    "source_url": "https://en.wikipedia.org/wiki/2025_ATP_Challenger_Tour",
    "confidence": 0.9
  },
  {
    "field_name": "name",
    "field_value": "Nonthaburi Challenger",
    "source": "wikipedia_challenger_2025",
    "source_url": "https://en.wikipedia.org/wiki/2025_ATP_Challenger_Tour",
    "confidence": 0.9
  },
  {
    "field_name": "city",
    "field_value": "Nonthaburi",
    "source": "wikipedia_challenger_2025",
    "source_url": "https://en.wikipedia.org/wiki/2025_ATP_Challenger_Tour",
    "confidence": 0.9
  },
  {
    "field_name": "country",
    "field_value": "TH",
    "source": "wikipedia_challenger_2025",
    "source_url": "https://en.wikipedia.org/wiki/2025_ATP_Challenger_Tour",
    "confidence": 0.9
  },
  {
    "field_name": "surface",
    "field_value": "hard",
    "source": "wikipedia_challenger_2025",
    "source_url": "https://en.wikipedia.org/wiki/2025_ATP_Challenger_Tour",
    "confidence": 0.9
  },
  {
    "field_name": "indoor",
    "field_value": "false",
    "source": "wikipedia_challenger_2025",
    "source_url": "https://en.wikipedia.org/wiki/2025_ATP_Challenger_Tour",
    "confidence": 0.9
  },
  {
    "field_name": "prize_money",
    "field_value": "75000",
    "source": "abgeleitet_aus_kategorie",
    "source_url": "https://en.wikipedia.org/wiki/2025_ATP_Challenger_Tour",
    "confidence": 0.5
  },
  {
    "field_name": "prize_currency",
    "field_value": "USD",
    "source": "abgeleitet_aus_kategorie",
    "source_url": "https://en.wikipedia.org/wiki/2025_ATP_Challenger_Tour",
    "confidence": 0.5
  }
]
```

### atp:nonthaburi-challenger-ii-2025-01-06
```json
// tour_tournaments
{
  "source_ref": "atp:nonthaburi-challenger-ii-2025-01-06",
  "tournament_monday": "2025-01-06",
  "series": "challenger"
}
// tour_tournament_claims
[
  {
    "field_name": "tournament_monday",
    "field_value": "2025-01-06",
    "source": "wikipedia_challenger_2025",
    "source_url": "https://en.wikipedia.org/wiki/2025_ATP_Challenger_Tour",
    "confidence": 0.9
  },
  {
    "field_name": "series",
    "field_value": "challenger",
    "source": "wikipedia_challenger_2025",
    "source_url": "https://en.wikipedia.org/wiki/2025_ATP_Challenger_Tour",
    "confidence": 0.9
  },
  {
    "field_name": "category",
    "field_value": "Challenger 75",
    "source": "wikipedia_challenger_2025",
    "source_url": "https://en.wikipedia.org/wiki/2025_ATP_Challenger_Tour",
    "confidence": 0.9
  },
  {
    "field_name": "name",
    "field_value": "Nonthaburi Challenger II",
    "source": "wikipedia_challenger_2025",
    "source_url": "https://en.wikipedia.org/wiki/2025_ATP_Challenger_Tour",
    "confidence": 0.9
  },
  {
    "field_name": "city",
    "field_value": "Nonthaburi",
    "source": "wikipedia_challenger_2025",
    "source_url": "https://en.wikipedia.org/wiki/2025_ATP_Challenger_Tour",
    "confidence": 0.9
  },
  {
    "field_name": "country",
    "field_value": "TH",
    "source": "wikipedia_challenger_2025",
    "source_url": "https://en.wikipedia.org/wiki/2025_ATP_Challenger_Tour",
    "confidence": 0.9
  },
  {
    "field_name": "surface",
    "field_value": "hard",
    "source": "wikipedia_challenger_2025",
    "source_url": "https://en.wikipedia.org/wiki/2025_ATP_Challenger_Tour",
    "confidence": 0.9
  },
  {
    "field_name": "indoor",
    "field_value": "false",
    "source": "wikipedia_challenger_2025",
    "source_url": "https://en.wikipedia.org/wiki/2025_ATP_Challenger_Tour",
    "confidence": 0.9
  },
  {
    "field_name": "prize_money",
    "field_value": "75000",
    "source": "abgeleitet_aus_kategorie",
    "source_url": "https://en.wikipedia.org/wiki/2025_ATP_Challenger_Tour",
    "confidence": 0.5
  },
  {
    "field_name": "prize_currency",
    "field_value": "USD",
    "source": "abgeleitet_aus_kategorie",
    "source_url": "https://en.wikipedia.org/wiki/2025_ATP_Challenger_Tour",
    "confidence": 0.5
  }
]
```

### atp:lexus-nottingham-challenger-2025-01-06
```json
// tour_tournaments
{
  "source_ref": "atp:lexus-nottingham-challenger-2025-01-06",
  "tournament_monday": "2025-01-06",
  "series": "challenger"
}
// tour_tournament_claims
[
  {
    "field_name": "tournament_monday",
    "field_value": "2025-01-06",
    "source": "wikipedia_challenger_2025",
    "source_url": "https://en.wikipedia.org/wiki/2025_ATP_Challenger_Tour",
    "confidence": 0.9
  },
  {
    "field_name": "series",
    "field_value": "challenger",
    "source": "wikipedia_challenger_2025",
    "source_url": "https://en.wikipedia.org/wiki/2025_ATP_Challenger_Tour",
    "confidence": 0.9
  },
  {
    "field_name": "category",
    "field_value": "Challenger 75",
    "source": "wikipedia_challenger_2025",
    "source_url": "https://en.wikipedia.org/wiki/2025_ATP_Challenger_Tour",
    "confidence": 0.9
  },
  {
    "field_name": "name",
    "field_value": "Lexus Nottingham Challenger",
    "source": "wikipedia_challenger_2025",
    "source_url": "https://en.wikipedia.org/wiki/2025_ATP_Challenger_Tour",
    "confidence": 0.9
  },
  {
    "field_name": "city",
    "field_value": "Nottingham",
    "source": "wikipedia_challenger_2025",
    "source_url": "https://en.wikipedia.org/wiki/2025_ATP_Challenger_Tour",
    "confidence": 0.9
  },
  {
    "field_name": "country",
    "field_value": "GB",
    "source": "wikipedia_challenger_2025",
    "source_url": "https://en.wikipedia.org/wiki/2025_ATP_Challenger_Tour",
    "confidence": 0.9
  },
  {
    "field_name": "surface",
    "field_value": "hard",
    "source": "wikipedia_challenger_2025",
    "source_url": "https://en.wikipedia.org/wiki/2025_ATP_Challenger_Tour",
    "confidence": 0.9
  },
  {
    "field_name": "indoor",
    "field_value": "true",
    "source": "wikipedia_challenger_2025",
    "source_url": "https://en.wikipedia.org/wiki/2025_ATP_Challenger_Tour",
    "confidence": 0.9
  },
  {
    "field_name": "prize_money",
    "field_value": "75000",
    "source": "abgeleitet_aus_kategorie",
    "source_url": "https://en.wikipedia.org/wiki/2025_ATP_Challenger_Tour",
    "confidence": 0.5
  },
  {
    "field_name": "prize_currency",
    "field_value": "USD",
    "source": "abgeleitet_aus_kategorie",
    "source_url": "https://en.wikipedia.org/wiki/2025_ATP_Challenger_Tour",
    "confidence": 0.5
  }
]
```

## 4b. Jahreswechsel-Kontrolle (tournament_monday im Dezember oder Januar)

| source_ref | tournament_monday | Serie | Quelle (Seite) |
|---|---|---|---|
| itf:m-itf-ind-2024-009 | 2024-12-30 | itf_wtt | wikipedia_itf_2025_q1 |
| itf:m-itf-ina-2024-007 | 2024-12-30 | itf_wtt | wikipedia_itf_2025_q1 |
| atp:canberra-tennis-international-2024-12-30 | 2024-12-30 | challenger | wikipedia_challenger_2025 |
| atp:open-nouvelle-caledonie-2024-12-30 | 2024-12-30 | challenger | wikipedia_challenger_2025 |
| atp:nonthaburi-challenger-2024-12-30 | 2024-12-30 | challenger | wikipedia_challenger_2025 |
| itf:m-itf-fra-2025-001 | 2025-01-06 | itf_wtt | wikipedia_itf_2025_q1 |
| itf:m-itf-ind-2025-001 | 2025-01-06 | itf_wtt | wikipedia_itf_2025_q1 |
| itf:m-itf-usa-2025-001 | 2025-01-06 | itf_wtt | wikipedia_itf_2025_q1 |
| itf:m-itf-jam-2025-001 | 2025-01-06 | itf_wtt | wikipedia_itf_2025_q1 |
| itf:m-itf-nor-2025-001 | 2025-01-06 | itf_wtt | wikipedia_itf_2025_q1 |
| itf:m-itf-esp-2025-001 | 2025-01-06 | itf_wtt | wikipedia_itf_2025_q1 |
| itf:m-itf-tun-2025-001 | 2025-01-06 | itf_wtt | wikipedia_itf_2025_q1 |
| itf:m-itf-tur-2025-001 | 2025-01-06 | itf_wtt | wikipedia_itf_2025_q1 |
| atp:nonthaburi-challenger-ii-2025-01-06 | 2025-01-06 | challenger | wikipedia_challenger_2025 |
| atp:lexus-nottingham-challenger-2025-01-06 | 2025-01-06 | challenger | wikipedia_challenger_2025 |
| atp:oeiras-indoors-2025-01-06 | 2025-01-06 | challenger | wikipedia_challenger_2025 |
| itf:m-itf-ind-2025-002 | 2025-01-13 | itf_wtt | wikipedia_itf_2025_q1 |
| itf:m-itf-chi-2025-001 | 2025-01-13 | itf_wtt | wikipedia_itf_2025_q1 |
| itf:m-itf-fra-2025-002 | 2025-01-13 | itf_wtt | wikipedia_itf_2025_q1 |
| itf:m-itf-ger-2025-001 | 2025-01-13 | itf_wtt | wikipedia_itf_2025_q1 |
| itf:m-itf-jam-2025-002 | 2025-01-13 | itf_wtt | wikipedia_itf_2025_q1 |
| itf:m-itf-qat-2025-001 | 2025-01-13 | itf_wtt | wikipedia_itf_2025_q1 |
| itf:m-itf-esp-2025-002 | 2025-01-13 | itf_wtt | wikipedia_itf_2025_q1 |
| itf:m-itf-tun-2025-002 | 2025-01-13 | itf_wtt | wikipedia_itf_2025_q1 |
| itf:m-itf-tur-2025-002 | 2025-01-13 | itf_wtt | wikipedia_itf_2025_q1 |
| atp:oeiras-indoors-ii-2025-01-13 | 2025-01-13 | challenger | wikipedia_challenger_2025 |
| atp:nonthaburi-challenger-iii-2025-01-13 | 2025-01-13 | challenger | wikipedia_challenger_2025 |
| atp:challenger-de-tigre-2025-01-13 | 2025-01-13 | challenger | wikipedia_challenger_2025 |
| itf:m-itf-ger-2025-002 | 2025-01-20 | itf_wtt | wikipedia_itf_2025_q1 |
| itf:m-itf-gbr-2025-001 | 2025-01-20 | itf_wtt | wikipedia_itf_2025_q1 |
| itf:m-itf-lux-2025-001 | 2025-01-20 | itf_wtt | wikipedia_itf_2025_q1 |
| itf:m-itf-qat-2025-002 | 2025-01-20 | itf_wtt | wikipedia_itf_2025_q1 |
| itf:m-itf-chi-2025-002 | 2025-01-20 | itf_wtt | wikipedia_itf_2025_q1 |
| itf:m-itf-fra-2025-003 | 2025-01-20 | itf_wtt | wikipedia_itf_2025_q1 |
| itf:m-itf-esp-2025-003 | 2025-01-20 | itf_wtt | wikipedia_itf_2025_q1 |
| itf:m-itf-tun-2025-003 | 2025-01-20 | itf_wtt | wikipedia_itf_2025_q1 |
| itf:m-itf-tur-2025-003 | 2025-01-20 | itf_wtt | wikipedia_itf_2025_q1 |
| atp:open-quimper-bretagne-2025-01-20 | 2025-01-20 | challenger | wikipedia_challenger_2025 |
| atp:oeiras-indoors-iii-2025-01-20 | 2025-01-20 | challenger | wikipedia_challenger_2025 |
| atp:punta-open-2025-01-20 | 2025-01-20 | challenger | wikipedia_challenger_2025 |
| atp:bw-open-2025-01-20 | 2025-01-20 | challenger | wikipedia_challenger_2025 |
| itf:m-itf-gbr-2025-002 | 2025-01-27 | itf_wtt | wikipedia_itf_2025_q1 |
| itf:m-itf-tur-2025-004 | 2025-01-27 | itf_wtt | wikipedia_itf_2025_q1 |
| itf:m-itf-egy-2025-001 | 2025-01-27 | itf_wtt | wikipedia_itf_2025_q1 |
| itf:m-itf-kuw-2025-003 | 2025-01-27 | itf_wtt | wikipedia_itf_2025_q1 |
| itf:m-itf-mex-2025-001 | 2025-01-27 | itf_wtt | wikipedia_itf_2025_q1 |
| itf:m-itf-tun-2025-004 | 2025-01-27 | itf_wtt | wikipedia_itf_2025_q1 |
| itf:m-itf-usa-2025-002 | 2025-01-27 | itf_wtt | wikipedia_itf_2025_q1 |
| atp:koblenz-open-2025-01-27 | 2025-01-27 | challenger | wikipedia_challenger_2025 |
| atp:brasil-tennis-challenger-2025-01-27 | 2025-01-27 | challenger | wikipedia_challenger_2025 |
| atp:queensland-international-2025-01-27 | 2025-01-27 | challenger | wikipedia_challenger_2025 |
| atp:cleveland-open-2025-01-27 | 2025-01-27 | challenger | wikipedia_challenger_2025 |
| itf:m-itf-vie-2025-002 | 2025-12-01 | itf_wtt | wikipedia_itf_2025_q4 |
| itf:m-itf-ind-2025-010 | 2025-12-01 | itf_wtt | wikipedia_itf_2025_q4 |
| itf:m-itf-esp-2025-031 | 2025-12-01 | itf_wtt | wikipedia_itf_2025_q4 |
| itf:m-itf-tur-2025-041 | 2025-12-01 | itf_wtt | wikipedia_itf_2025_q4 |
| itf:m-itf-egy-2025-025 | 2025-12-01 | itf_wtt | wikipedia_itf_2025_q4 |
| itf:m-itf-tun-2025-055 | 2025-12-01 | itf_wtt | wikipedia_itf_2025_q4 |
| itf:m-itf-per-2025-001 | 2025-12-01 | itf_wtt | wikipedia_itf_2025_q4 |
| atp:copenhagen-challenger-2025-12-07 | 2025-12-07 | challenger | wikipedia_challenger_2026 |
| atp:la-paz-challenger-2025-12-07 | 2025-12-07 | challenger | wikipedia_challenger_2026 |
| atp:monastir-open-2025-12-07 | 2025-12-07 | challenger | wikipedia_challenger_2026 |
| atp:rio-de-janeiro-challenger-2025-12-07 | 2025-12-07 | challenger | wikipedia_challenger_2026 |
| itf:m-itf-nzl-2025-002 | 2025-12-08 | itf_wtt | wikipedia_itf_2025_q4 |
| itf:m-itf-esp-2025-046 | 2025-12-08 | itf_wtt | wikipedia_itf_2025_q4 |
| itf:m-itf-tur-2025-042 | 2025-12-08 | itf_wtt | wikipedia_itf_2025_q4 |
| itf:m-itf-egy-2025-026 | 2025-12-08 | itf_wtt | wikipedia_itf_2025_q4 |
| itf:m-itf-tun-2025-056 | 2025-12-08 | itf_wtt | wikipedia_itf_2025_q4 |
| itf:m-itf-per-2025-002 | 2025-12-08 | itf_wtt | wikipedia_itf_2025_q4 |
| itf:m-itf-nzl-2025-003 | 2025-12-15 | itf_wtt | wikipedia_itf_2025_q4 |
| itf:m-itf-tur-2025-043 | 2025-12-15 | itf_wtt | wikipedia_itf_2025_q4 |
| itf:m-itf-tun-2025-057 | 2025-12-15 | itf_wtt | wikipedia_itf_2025_q4 |
| itf:m-itf-per-2025-003 | 2025-12-15 | itf_wtt | wikipedia_itf_2025_q4 |
| itf:m-itf-tur-2025-044 | 2025-12-22 | itf_wtt | wikipedia_itf_2025_q4 |
| itf:m-itf-tun-2025-058 | 2025-12-22 | itf_wtt | wikipedia_itf_2025_q4 |
| itf:m-itf-mar-2025-004 | 2025-12-22 | itf_wtt | wikipedia_itf_2025_q4 |
| itf:m-itf-tun-2026-009 | 2025-12-29 | itf_wtt | wikipedia_itf_2025_q4 |
| itf:m-itf-mar-2026-001 | 2025-12-29 | itf_wtt | wikipedia_itf_2025_q4 |
| itf:m-itf-fra-2026-002 | 2026-01-05 | itf_wtt | wikipedia_itf_2026_q1 |
| itf:m-itf-tur-2026-001 | 2026-01-05 | itf_wtt | wikipedia_itf_2026_q1 |
| itf:m-itf-tun-2026-001 | 2026-01-05 | itf_wtt | wikipedia_itf_2026_q1 |
| itf:m-itf-usa-2026-010 | 2026-01-05 | itf_wtt | wikipedia_itf_2026_q1 |
| itf:m-itf-esp-2026-001 | 2026-01-05 | itf_wtt | wikipedia_itf_2026_q1 |
| itf:m-itf-nor-2026-001 | 2026-01-05 | itf_wtt | wikipedia_itf_2026_q1 |
| itf:m-itf-egy-2026-002 | 2026-01-05 | itf_wtt | wikipedia_itf_2026_q1 |
| atp:bengaluru-open-2026-01-05 | 2026-01-05 | challenger | wikipedia_challenger_2026 |
| atp:canberra-tennis-international-2026-01-05 | 2026-01-05 | challenger | wikipedia_challenger_2026 |
| atp:bnc-tennis-open-2026-01-05 | 2026-01-05 | challenger | wikipedia_challenger_2026 |
| atp:nonthaburi-challenger-2026-01-05 | 2026-01-05 | challenger | wikipedia_challenger_2026 |
| atp:lexus-nottingham-challenger-2026-01-05 | 2026-01-05 | challenger | wikipedia_challenger_2026 |
| itf:m-itf-ind-2026-001 | 2026-01-12 | itf_wtt | wikipedia_itf_2026_q1 |
| itf:m-itf-tur-2026-002 | 2026-01-12 | itf_wtt | wikipedia_itf_2026_q1 |
| itf:m-itf-tun-2026-002 | 2026-01-12 | itf_wtt | wikipedia_itf_2026_q1 |
| itf:m-itf-usa-2026-003 | 2026-01-12 | itf_wtt | wikipedia_itf_2026_q1 |
| itf:m-itf-chi-2026-001 | 2026-01-12 | itf_wtt | wikipedia_itf_2026_q1 |
| itf:m-itf-esp-2026-006 | 2026-01-12 | itf_wtt | wikipedia_itf_2026_q1 |
| itf:m-itf-fra-2026-001 | 2026-01-12 | itf_wtt | wikipedia_itf_2026_q1 |
| itf:m-itf-ger-2026-002 | 2026-01-12 | itf_wtt | wikipedia_itf_2026_q1 |
| itf:m-itf-egy-2026-003 | 2026-01-12 | itf_wtt | wikipedia_itf_2026_q1 |
| atp:nonthaburi-challenger-ii-2026-01-12 | 2026-01-12 | challenger | wikipedia_challenger_2026 |
| atp:challenger-aat-2026-01-12 | 2026-01-12 | challenger | wikipedia_challenger_2026 |
| atp:glasgow-challenger-2026-01-12 | 2026-01-12 | challenger | wikipedia_challenger_2026 |
| itf:m-itf-tur-2026-003 | 2026-01-19 | itf_wtt | wikipedia_itf_2026_q1 |
| itf:m-itf-chi-2026-002 | 2026-01-19 | itf_wtt | wikipedia_itf_2026_q1 |
| itf:m-itf-ind-2026-002 | 2026-01-19 | itf_wtt | wikipedia_itf_2026_q1 |
| itf:m-itf-esp-2026-007 | 2026-01-19 | itf_wtt | wikipedia_itf_2026_q1 |
| itf:m-itf-fra-2026-005 | 2026-01-19 | itf_wtt | wikipedia_itf_2026_q1 |
| itf:m-itf-tun-2026-003 | 2026-01-19 | itf_wtt | wikipedia_itf_2026_q1 |
| atp:oeiras-indoors-2026-01-19 | 2026-01-19 | challenger | wikipedia_challenger_2026 |
| atp:itajai-open-2026-01-19 | 2026-01-19 | challenger | wikipedia_challenger_2026 |
| atp:soma-bay-open-2026-01-19 | 2026-01-19 | challenger | wikipedia_challenger_2026 |
| atp:phan-thiet-challenger-2026-01-19 | 2026-01-19 | challenger | wikipedia_challenger_2026 |
| itf:m-itf-gbr-2026-002 | 2026-01-26 | itf_wtt | wikipedia_itf_2026_q1 |
| itf:m-itf-ger-2026-004 | 2026-01-26 | itf_wtt | wikipedia_itf_2026_q1 |
| itf:m-itf-ind-2026-003 | 2026-01-26 | itf_wtt | wikipedia_itf_2026_q1 |
| itf:m-itf-kuw-2026-003 | 2026-01-26 | itf_wtt | wikipedia_itf_2026_q1 |
| itf:m-itf-tur-2026-004 | 2026-01-26 | itf_wtt | wikipedia_itf_2026_q1 |
| itf:m-itf-egy-2026-001 | 2026-01-26 | itf_wtt | wikipedia_itf_2026_q1 |
| itf:m-itf-tun-2026-004 | 2026-01-26 | itf_wtt | wikipedia_itf_2026_q1 |
| itf:m-itf-usa-2026-002 | 2026-01-26 | itf_wtt | wikipedia_itf_2026_q1 |
| itf:m-itf-mex-2026-001 | 2026-01-26 | itf_wtt | wikipedia_itf_2026_q1 |
| atp:bahrain-ministry-of-interior-tennis-challenger-2026-01-26 | 2026-01-26 | challenger | wikipedia_challenger_2026 |
| atp:open-quimper-bretagne-2026-01-26 | 2026-01-26 | challenger | wikipedia_challenger_2026 |
| atp:challenger-concepcion-2026-01-26 | 2026-01-26 | challenger | wikipedia_challenger_2026 |
| atp:san-diego-open-2026-01-26 | 2026-01-26 | challenger | wikipedia_challenger_2026 |
| atp:oeiras-indoors-ii-2026-01-26 | 2026-01-26 | challenger | wikipedia_challenger_2026 |
| atp:phan-thiet-challenger-ii-2026-01-26 | 2026-01-26 | challenger | wikipedia_challenger_2026 |

_127 Datensätze im Dez/Jan. Prüfpunkt: Dezember-Wochen auf einer Q1-/Challenger-Jahresseite müssen ins VORJAHR fallen._

## 5. Hinweise

- **Trockenlauf ist Voreinstellung.** Ohne `--write` wird keine DB-Verbindung geöffnet. Scharf: `node scripts/wikipedia-import.mjs --write`.
- **Idempotenz** (scharf): Stamm `upsert onConflict source_ref`; Claims `upsert onConflict (tournament_id,field_name,source,field_value) ignoreDuplicates`.
- **Preisgeld** ist ABGELEITET (Claim-Quelle `abgeleitet_aus_kategorie`, confidence 0.5). Die Challenger-Währung **USD** ist eine Annahme — bei Bedarf die Tabelle `PRIZE_USD`/`prize_currency` korrigieren.
- **Länder** kommen ausschließlich aus der expliziten Tabelle `COUNTRY_ISO`; unbekannte Namen führen zum Verwerfen (§2/§3), kein Raten.
