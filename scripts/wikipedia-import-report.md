# Wikipedia-Import — TROCKENLAUF (nichts geschrieben)

> Erzeugt von `scripts/wikipedia-import.mjs` · Lauf: 2026-08-22T08:04:06.818Z
> Ziel: web.tour_tournaments + web.tour_tournament_claims. **Kein DB-Zugriff** in diesem Lauf.

## 1. Je Seite

| Serie | Jahr | Seite | Zeilen | importierbar | verworfen | Fehler |
|---|---|---|---:|---:|---:|---|
| Challenger | 2026 | 2026 Challenger | 265 | 262 | 3 | – |
| Challenger | 2027 | 2027 Challenger | 0 | 0 | 0 | Seite fehlt (missing) |

**Summe:** 262 importierbar, 3 verworfen. Claims gesamt: 2620.

## 2. Verworfene Zeilen nach Grund

- **keine_source_ref (kein_challenger_wikilink)** — 3×

### Alle verworfenen Zeilen (Seite · Woche · Ort · Land · Grund)

- 2026 Challenger · June 22 · Durham · United States · keine_source_ref: kein_challenger_wikilink
- 2026 Challenger · August 17 · Tashkent · Uzbekistan · keine_source_ref: kein_challenger_wikilink
- 2026 Challenger · October 19 · Alicante · Spain · keine_source_ref: kein_challenger_wikilink

## 3. Unbekannte Ländernamen (Tabelle ergänzen)

Keine — alle vorkommenden Ländernamen sind zugeordnet.

## 4. Stichprobe: 10 Datensätze — Identitätszeile (Stamm) + Claims (Herkunft)

Der Import schreibt in `tour_tournaments` NUR die Identitätsfelder; alle übrigen Felder
stehen als Claims und werden später von `scripts/resolve-tournaments.mjs` in den Stamm aufgelöst.

### atp:bengaluru-open-2026-01-05
```json
// tour_tournaments
{
  "source_ref": "atp:bengaluru-open-2026-01-05",
  "tournament_monday": "2026-01-05",
  "series": "challenger"
}
// tour_tournament_claims
[
  {
    "field_name": "tournament_monday",
    "field_value": "2026-01-05",
    "source": "wikipedia_challenger_2026",
    "source_url": "https://en.wikipedia.org/wiki/2026_ATP_Challenger_Tour",
    "confidence": 0.9
  },
  {
    "field_name": "series",
    "field_value": "challenger",
    "source": "wikipedia_challenger_2026",
    "source_url": "https://en.wikipedia.org/wiki/2026_ATP_Challenger_Tour",
    "confidence": 0.9
  },
  {
    "field_name": "category",
    "field_value": "Challenger 125",
    "source": "wikipedia_challenger_2026",
    "source_url": "https://en.wikipedia.org/wiki/2026_ATP_Challenger_Tour",
    "confidence": 0.9
  },
  {
    "field_name": "name",
    "field_value": "Bengaluru Open",
    "source": "wikipedia_challenger_2026",
    "source_url": "https://en.wikipedia.org/wiki/2026_ATP_Challenger_Tour",
    "confidence": 0.9
  },
  {
    "field_name": "city",
    "field_value": "Bengaluru",
    "source": "wikipedia_challenger_2026",
    "source_url": "https://en.wikipedia.org/wiki/2026_ATP_Challenger_Tour",
    "confidence": 0.9
  },
  {
    "field_name": "country",
    "field_value": "IN",
    "source": "wikipedia_challenger_2026",
    "source_url": "https://en.wikipedia.org/wiki/2026_ATP_Challenger_Tour",
    "confidence": 0.9
  },
  {
    "field_name": "surface",
    "field_value": "hard",
    "source": "wikipedia_challenger_2026",
    "source_url": "https://en.wikipedia.org/wiki/2026_ATP_Challenger_Tour",
    "confidence": 0.9
  },
  {
    "field_name": "indoor",
    "field_value": "false",
    "source": "wikipedia_challenger_2026",
    "source_url": "https://en.wikipedia.org/wiki/2026_ATP_Challenger_Tour",
    "confidence": 0.9
  },
  {
    "field_name": "prize_money",
    "field_value": "125000",
    "source": "abgeleitet_aus_kategorie",
    "source_url": "https://en.wikipedia.org/wiki/2026_ATP_Challenger_Tour",
    "confidence": 0.5
  },
  {
    "field_name": "prize_currency",
    "field_value": "USD",
    "source": "abgeleitet_aus_kategorie",
    "source_url": "https://en.wikipedia.org/wiki/2026_ATP_Challenger_Tour",
    "confidence": 0.5
  }
]
```

### atp:canberra-tennis-international-2026-01-05
```json
// tour_tournaments
{
  "source_ref": "atp:canberra-tennis-international-2026-01-05",
  "tournament_monday": "2026-01-05",
  "series": "challenger"
}
// tour_tournament_claims
[
  {
    "field_name": "tournament_monday",
    "field_value": "2026-01-05",
    "source": "wikipedia_challenger_2026",
    "source_url": "https://en.wikipedia.org/wiki/2026_ATP_Challenger_Tour",
    "confidence": 0.9
  },
  {
    "field_name": "series",
    "field_value": "challenger",
    "source": "wikipedia_challenger_2026",
    "source_url": "https://en.wikipedia.org/wiki/2026_ATP_Challenger_Tour",
    "confidence": 0.9
  },
  {
    "field_name": "category",
    "field_value": "Challenger 125",
    "source": "wikipedia_challenger_2026",
    "source_url": "https://en.wikipedia.org/wiki/2026_ATP_Challenger_Tour",
    "confidence": 0.9
  },
  {
    "field_name": "name",
    "field_value": "Canberra Tennis International",
    "source": "wikipedia_challenger_2026",
    "source_url": "https://en.wikipedia.org/wiki/2026_ATP_Challenger_Tour",
    "confidence": 0.9
  },
  {
    "field_name": "city",
    "field_value": "Canberra",
    "source": "wikipedia_challenger_2026",
    "source_url": "https://en.wikipedia.org/wiki/2026_ATP_Challenger_Tour",
    "confidence": 0.9
  },
  {
    "field_name": "country",
    "field_value": "AU",
    "source": "wikipedia_challenger_2026",
    "source_url": "https://en.wikipedia.org/wiki/2026_ATP_Challenger_Tour",
    "confidence": 0.9
  },
  {
    "field_name": "surface",
    "field_value": "hard",
    "source": "wikipedia_challenger_2026",
    "source_url": "https://en.wikipedia.org/wiki/2026_ATP_Challenger_Tour",
    "confidence": 0.9
  },
  {
    "field_name": "indoor",
    "field_value": "false",
    "source": "wikipedia_challenger_2026",
    "source_url": "https://en.wikipedia.org/wiki/2026_ATP_Challenger_Tour",
    "confidence": 0.9
  },
  {
    "field_name": "prize_money",
    "field_value": "125000",
    "source": "abgeleitet_aus_kategorie",
    "source_url": "https://en.wikipedia.org/wiki/2026_ATP_Challenger_Tour",
    "confidence": 0.5
  },
  {
    "field_name": "prize_currency",
    "field_value": "USD",
    "source": "abgeleitet_aus_kategorie",
    "source_url": "https://en.wikipedia.org/wiki/2026_ATP_Challenger_Tour",
    "confidence": 0.5
  }
]
```

### atp:bnc-tennis-open-2026-01-05
```json
// tour_tournaments
{
  "source_ref": "atp:bnc-tennis-open-2026-01-05",
  "tournament_monday": "2026-01-05",
  "series": "challenger"
}
// tour_tournament_claims
[
  {
    "field_name": "tournament_monday",
    "field_value": "2026-01-05",
    "source": "wikipedia_challenger_2026",
    "source_url": "https://en.wikipedia.org/wiki/2026_ATP_Challenger_Tour",
    "confidence": 0.9
  },
  {
    "field_name": "series",
    "field_value": "challenger",
    "source": "wikipedia_challenger_2026",
    "source_url": "https://en.wikipedia.org/wiki/2026_ATP_Challenger_Tour",
    "confidence": 0.9
  },
  {
    "field_name": "category",
    "field_value": "Challenger 75",
    "source": "wikipedia_challenger_2026",
    "source_url": "https://en.wikipedia.org/wiki/2026_ATP_Challenger_Tour",
    "confidence": 0.9
  },
  {
    "field_name": "name",
    "field_value": "BNC Tennis Open",
    "source": "wikipedia_challenger_2026",
    "source_url": "https://en.wikipedia.org/wiki/2026_ATP_Challenger_Tour",
    "confidence": 0.9
  },
  {
    "field_name": "city",
    "field_value": "Nouméa",
    "source": "wikipedia_challenger_2026",
    "source_url": "https://en.wikipedia.org/wiki/2026_ATP_Challenger_Tour",
    "confidence": 0.9
  },
  {
    "field_name": "country",
    "field_value": "NC",
    "source": "wikipedia_challenger_2026",
    "source_url": "https://en.wikipedia.org/wiki/2026_ATP_Challenger_Tour",
    "confidence": 0.9
  },
  {
    "field_name": "surface",
    "field_value": "hard",
    "source": "wikipedia_challenger_2026",
    "source_url": "https://en.wikipedia.org/wiki/2026_ATP_Challenger_Tour",
    "confidence": 0.9
  },
  {
    "field_name": "indoor",
    "field_value": "false",
    "source": "wikipedia_challenger_2026",
    "source_url": "https://en.wikipedia.org/wiki/2026_ATP_Challenger_Tour",
    "confidence": 0.9
  },
  {
    "field_name": "prize_money",
    "field_value": "75000",
    "source": "abgeleitet_aus_kategorie",
    "source_url": "https://en.wikipedia.org/wiki/2026_ATP_Challenger_Tour",
    "confidence": 0.5
  },
  {
    "field_name": "prize_currency",
    "field_value": "USD",
    "source": "abgeleitet_aus_kategorie",
    "source_url": "https://en.wikipedia.org/wiki/2026_ATP_Challenger_Tour",
    "confidence": 0.5
  }
]
```

### atp:nonthaburi-challenger-2026-01-05
```json
// tour_tournaments
{
  "source_ref": "atp:nonthaburi-challenger-2026-01-05",
  "tournament_monday": "2026-01-05",
  "series": "challenger"
}
// tour_tournament_claims
[
  {
    "field_name": "tournament_monday",
    "field_value": "2026-01-05",
    "source": "wikipedia_challenger_2026",
    "source_url": "https://en.wikipedia.org/wiki/2026_ATP_Challenger_Tour",
    "confidence": 0.9
  },
  {
    "field_name": "series",
    "field_value": "challenger",
    "source": "wikipedia_challenger_2026",
    "source_url": "https://en.wikipedia.org/wiki/2026_ATP_Challenger_Tour",
    "confidence": 0.9
  },
  {
    "field_name": "category",
    "field_value": "Challenger 50",
    "source": "wikipedia_challenger_2026",
    "source_url": "https://en.wikipedia.org/wiki/2026_ATP_Challenger_Tour",
    "confidence": 0.9
  },
  {
    "field_name": "name",
    "field_value": "Nonthaburi Challenger",
    "source": "wikipedia_challenger_2026",
    "source_url": "https://en.wikipedia.org/wiki/2026_ATP_Challenger_Tour",
    "confidence": 0.9
  },
  {
    "field_name": "city",
    "field_value": "Nonthaburi",
    "source": "wikipedia_challenger_2026",
    "source_url": "https://en.wikipedia.org/wiki/2026_ATP_Challenger_Tour",
    "confidence": 0.9
  },
  {
    "field_name": "country",
    "field_value": "TH",
    "source": "wikipedia_challenger_2026",
    "source_url": "https://en.wikipedia.org/wiki/2026_ATP_Challenger_Tour",
    "confidence": 0.9
  },
  {
    "field_name": "surface",
    "field_value": "hard",
    "source": "wikipedia_challenger_2026",
    "source_url": "https://en.wikipedia.org/wiki/2026_ATP_Challenger_Tour",
    "confidence": 0.9
  },
  {
    "field_name": "indoor",
    "field_value": "false",
    "source": "wikipedia_challenger_2026",
    "source_url": "https://en.wikipedia.org/wiki/2026_ATP_Challenger_Tour",
    "confidence": 0.9
  },
  {
    "field_name": "prize_money",
    "field_value": "50000",
    "source": "abgeleitet_aus_kategorie",
    "source_url": "https://en.wikipedia.org/wiki/2026_ATP_Challenger_Tour",
    "confidence": 0.5
  },
  {
    "field_name": "prize_currency",
    "field_value": "USD",
    "source": "abgeleitet_aus_kategorie",
    "source_url": "https://en.wikipedia.org/wiki/2026_ATP_Challenger_Tour",
    "confidence": 0.5
  }
]
```

### atp:lexus-nottingham-challenger-2026-01-05
```json
// tour_tournaments
{
  "source_ref": "atp:lexus-nottingham-challenger-2026-01-05",
  "tournament_monday": "2026-01-05",
  "series": "challenger"
}
// tour_tournament_claims
[
  {
    "field_name": "tournament_monday",
    "field_value": "2026-01-05",
    "source": "wikipedia_challenger_2026",
    "source_url": "https://en.wikipedia.org/wiki/2026_ATP_Challenger_Tour",
    "confidence": 0.9
  },
  {
    "field_name": "series",
    "field_value": "challenger",
    "source": "wikipedia_challenger_2026",
    "source_url": "https://en.wikipedia.org/wiki/2026_ATP_Challenger_Tour",
    "confidence": 0.9
  },
  {
    "field_name": "category",
    "field_value": "Challenger 50",
    "source": "wikipedia_challenger_2026",
    "source_url": "https://en.wikipedia.org/wiki/2026_ATP_Challenger_Tour",
    "confidence": 0.9
  },
  {
    "field_name": "name",
    "field_value": "Lexus Nottingham Challenger",
    "source": "wikipedia_challenger_2026",
    "source_url": "https://en.wikipedia.org/wiki/2026_ATP_Challenger_Tour",
    "confidence": 0.9
  },
  {
    "field_name": "city",
    "field_value": "Nottingham",
    "source": "wikipedia_challenger_2026",
    "source_url": "https://en.wikipedia.org/wiki/2026_ATP_Challenger_Tour",
    "confidence": 0.9
  },
  {
    "field_name": "country",
    "field_value": "GB",
    "source": "wikipedia_challenger_2026",
    "source_url": "https://en.wikipedia.org/wiki/2026_ATP_Challenger_Tour",
    "confidence": 0.9
  },
  {
    "field_name": "surface",
    "field_value": "hard",
    "source": "wikipedia_challenger_2026",
    "source_url": "https://en.wikipedia.org/wiki/2026_ATP_Challenger_Tour",
    "confidence": 0.9
  },
  {
    "field_name": "indoor",
    "field_value": "true",
    "source": "wikipedia_challenger_2026",
    "source_url": "https://en.wikipedia.org/wiki/2026_ATP_Challenger_Tour",
    "confidence": 0.9
  },
  {
    "field_name": "prize_money",
    "field_value": "50000",
    "source": "abgeleitet_aus_kategorie",
    "source_url": "https://en.wikipedia.org/wiki/2026_ATP_Challenger_Tour",
    "confidence": 0.5
  },
  {
    "field_name": "prize_currency",
    "field_value": "USD",
    "source": "abgeleitet_aus_kategorie",
    "source_url": "https://en.wikipedia.org/wiki/2026_ATP_Challenger_Tour",
    "confidence": 0.5
  }
]
```

## 4b. Jahreswechsel-Kontrolle (tournament_monday im Dezember oder Januar)

| source_ref | tournament_monday | Serie | Quelle (Seite) |
|---|---|---|---|
| atp:copenhagen-challenger-2025-12-07 | 2025-12-07 | challenger | wikipedia_challenger_2026 |
| atp:la-paz-challenger-2025-12-07 | 2025-12-07 | challenger | wikipedia_challenger_2026 |
| atp:monastir-open-2025-12-07 | 2025-12-07 | challenger | wikipedia_challenger_2026 |
| atp:rio-de-janeiro-challenger-2025-12-07 | 2025-12-07 | challenger | wikipedia_challenger_2026 |
| atp:bengaluru-open-2026-01-05 | 2026-01-05 | challenger | wikipedia_challenger_2026 |
| atp:canberra-tennis-international-2026-01-05 | 2026-01-05 | challenger | wikipedia_challenger_2026 |
| atp:bnc-tennis-open-2026-01-05 | 2026-01-05 | challenger | wikipedia_challenger_2026 |
| atp:nonthaburi-challenger-2026-01-05 | 2026-01-05 | challenger | wikipedia_challenger_2026 |
| atp:lexus-nottingham-challenger-2026-01-05 | 2026-01-05 | challenger | wikipedia_challenger_2026 |
| atp:nonthaburi-challenger-ii-2026-01-12 | 2026-01-12 | challenger | wikipedia_challenger_2026 |
| atp:challenger-aat-2026-01-12 | 2026-01-12 | challenger | wikipedia_challenger_2026 |
| atp:glasgow-challenger-2026-01-12 | 2026-01-12 | challenger | wikipedia_challenger_2026 |
| atp:oeiras-indoors-2026-01-19 | 2026-01-19 | challenger | wikipedia_challenger_2026 |
| atp:itajai-open-2026-01-19 | 2026-01-19 | challenger | wikipedia_challenger_2026 |
| atp:soma-bay-open-2026-01-19 | 2026-01-19 | challenger | wikipedia_challenger_2026 |
| atp:phan-thiet-challenger-2026-01-19 | 2026-01-19 | challenger | wikipedia_challenger_2026 |
| atp:bahrain-ministry-of-interior-tennis-challenger-2026-01-26 | 2026-01-26 | challenger | wikipedia_challenger_2026 |
| atp:open-quimper-bretagne-2026-01-26 | 2026-01-26 | challenger | wikipedia_challenger_2026 |
| atp:challenger-concepcion-2026-01-26 | 2026-01-26 | challenger | wikipedia_challenger_2026 |
| atp:san-diego-open-2026-01-26 | 2026-01-26 | challenger | wikipedia_challenger_2026 |
| atp:oeiras-indoors-ii-2026-01-26 | 2026-01-26 | challenger | wikipedia_challenger_2026 |
| atp:phan-thiet-challenger-ii-2026-01-26 | 2026-01-26 | challenger | wikipedia_challenger_2026 |

_22 Datensätze im Dez/Jan. Prüfpunkt: Dezember-Wochen auf einer Q1-/Challenger-Jahresseite müssen ins VORJAHR fallen._

## 5. Hinweise

- **Trockenlauf ist Voreinstellung.** Ohne `--write` wird keine DB-Verbindung geöffnet. Scharf: `node scripts/wikipedia-import.mjs --write`.
- **Idempotenz** (scharf): Stamm `upsert onConflict source_ref`; Claims `upsert onConflict (tournament_id,field_name,source,field_value) ignoreDuplicates`.
- **Preisgeld** ist ABGELEITET (Claim-Quelle `abgeleitet_aus_kategorie`, confidence 0.5). Die Challenger-Währung **USD** ist eine Annahme — bei Bedarf die Tabelle `PRIZE_USD`/`prize_currency` korrigieren.
- **Länder** kommen ausschließlich aus der expliziten Tabelle `COUNTRY_ISO`; unbekannte Namen führen zum Verwerfen (§2/§3), kein Raten.
