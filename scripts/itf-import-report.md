# ITF-Import — SCHARFER LAUF

> `scripts/itf-import.mjs` · 2026-08-20T21:27:06.894Z · Zeitraum 2026-08-20 … 2027-12-31 · Abrufe: 9
> Quelle: ITF TournamentApi/GetCalendar (browserartiger Client, Pausen 3000 ms).

## 1. Je Kategorie: Menge, Zukunft, neu/Dublette

| Circuit | Serie | gesamt | verwertbar | in Zukunft | NEU | Dublette (source_ref) | Soft-Dublette (gleiches Land+Woche+Kat, anderer Key) |
|---|---|---:|---:|---:|---:|---:|---:|
| MT — Herren (M15/M25) | itf_wtt | 209 | 209 | 195 | 198 | 11 | 0 |
| WT — Damen (W15–W100) | itf_wtt | 200 | 200 | 190 | 200 | 0 | 0 |
| JT — Junioren (J30–J500) | itf_juniors | 395 | 395 | 370 | 395 | 0 | 0 |

✅ **Junioren (JT) sind seit MU-043 Schritt 1 schreibbar:** `tour_tournaments_series_check` erlaubt `itf_juniors`, und `deadlines.ts` kennt die Junioren-Fristen (§39 i/vi: Entry Di −20 für J30–J300, J500/Grand Slam turnierspezifisch → unbekannt; Withdrawal Di −13; Freeze Mi davor). Der scharfe Lauf **schreibt JT mit**.

## 2. Verworfene Zeilen nach Grund

- MT: keine
- WT: keine
- JT: keine

## 2b. Unbekannte Ländernamen (in COUNTRY_ISO ergänzen, sonst verworfen)

Keine — alle Ländernamen sind zugeordnet.

## 3. Länderverteilung (Top 20, verwertbare Turniere aller Kategorien)

US 50 · EG 40 · ES 35 · IT 27 · CN 27 · TN 27 · FR 25 · TR 24 · BR 19 · MX 19 · GR 18 · AU 17 · PT 16 · JP 15 · RO 14 · PL 13 · BG 13 · DE 12 · RS 12 · HU 12

## 4. Preisgeld — echte Werte oder Kategorie-Konstante?

Je Kategorie die DISTINKTEN Preisgeld-Werte aus dem Endpunkt. Mehr als ein Wert ⇒ echt (nicht Kategorie×1000).

**MT:**
- M15: 1 distinkt → $15,000
- M25: 1 distinkt → $30,000
**WT:**
- W100: 1 distinkt → $100,000
- W15: 1 distinkt → $15,000
- W25: 1 distinkt → $30,000
- W35: 2 distinkt → $25,000, $30,000
- W50: 1 distinkt → $40,000
- W75: 1 distinkt → $60,000

## 5. Stichprobe: 3 Turniere vollständig

### itf:m-itf-ger-2026-015
```json
// tour_tournaments (Identität)
{
  "source_ref": "itf:m-itf-ger-2026-015",
  "tournament_monday": "2026-08-17",
  "series": "itf_wtt"
}
// tour_tournament_claims (Herkunft)
[
  {
    "field_name": "tournament_monday",
    "field_value": "2026-08-17",
    "source": "itf_endpoint",
    "source_url": "https://www.itftennis.com/en/tournament/m25-ueberlingen/ger/2026/m-itf-ger-2026-015/",
    "confidence": 0.9
  },
  {
    "field_name": "series",
    "field_value": "itf_wtt",
    "source": "itf_endpoint",
    "source_url": "https://www.itftennis.com/en/tournament/m25-ueberlingen/ger/2026/m-itf-ger-2026-015/",
    "confidence": 0.9
  },
  {
    "field_name": "name",
    "field_value": "Überlingen Open",
    "source": "itf_endpoint",
    "source_url": "https://www.itftennis.com/en/tournament/m25-ueberlingen/ger/2026/m-itf-ger-2026-015/",
    "confidence": 0.9
  },
  {
    "field_name": "city",
    "field_value": "Ueberlingen",
    "source": "itf_endpoint",
    "source_url": "https://www.itftennis.com/en/tournament/m25-ueberlingen/ger/2026/m-itf-ger-2026-015/",
    "confidence": 0.9
  },
  {
    "field_name": "country",
    "field_value": "DE",
    "source": "itf_endpoint",
    "source_url": "https://www.itftennis.com/en/tournament/m25-ueberlingen/ger/2026/m-itf-ger-2026-015/",
    "confidence": 0.9
  },
  {
    "field_name": "category",
    "field_value": "M25",
    "source": "itf_endpoint",
    "source_url": "https://www.itftennis.com/en/tournament/m25-ueberlingen/ger/2026/m-itf-ger-2026-015/",
    "confidence": 0.9
  },
  {
    "field_name": "surface",
    "field_value": "clay",
    "source": "itf_endpoint",
    "source_url": "https://www.itftennis.com/en/tournament/m25-ueberlingen/ger/2026/m-itf-ger-2026-015/",
    "confidence": 0.9
  },
  {
    "field_name": "indoor",
    "field_value": "false",
    "source": "itf_endpoint",
    "source_url": "https://www.itftennis.com/en/tournament/m25-ueberlingen/ger/2026/m-itf-ger-2026-015/",
    "confidence": 0.9
  },
  {
    "field_name": "prize_money",
    "field_value": "30000",
    "source": "itf_endpoint",
    "source_url": "https://www.itftennis.com/en/tournament/m25-ueberlingen/ger/2026/m-itf-ger-2026-015/",
    "confidence": 0.9
  },
  {
    "field_name": "prize_currency",
    "field_value": "USD",
    "source": "itf_endpoint",
    "source_url": "https://www.itftennis.com/en/tournament/m25-ueberlingen/ger/2026/m-itf-ger-2026-015/",
    "confidence": 0.9
  }
]
// Rohfelder aus dem Endpunkt (zur Kontrolle)
{
  "name": "Überlingen Open",
  "city": "Ueberlingen",
  "iso": "DE",
  "category": "M25",
  "surface": "clay",
  "prize": 30000,
  "monday": "2026-08-17",
  "startDate": "2026-08-17T00:00:00",
  "endDate": "2026-08-23T00:00:00",
  "sourceRef": "itf:m-itf-ger-2026-015",
  "tournamentLink": "/en/tournament/m25-ueberlingen/ger/2026/m-itf-ger-2026-015/",
  "prizeRaw": "$30,000"
}
```

### itf:w-itf-srb-2026-016
```json
// tour_tournaments (Identität)
{
  "source_ref": "itf:w-itf-srb-2026-016",
  "tournament_monday": "2026-08-17",
  "series": "itf_wtt"
}
// tour_tournament_claims (Herkunft)
[
  {
    "field_name": "tournament_monday",
    "field_value": "2026-08-17",
    "source": "itf_endpoint",
    "source_url": "https://www.itftennis.com/en/tournament/w75-kursumlijska-banja-/srb/2026/w-itf-srb-2026-016/",
    "confidence": 0.9
  },
  {
    "field_name": "series",
    "field_value": "itf_wtt",
    "source": "itf_endpoint",
    "source_url": "https://www.itftennis.com/en/tournament/w75-kursumlijska-banja-/srb/2026/w-itf-srb-2026-016/",
    "confidence": 0.9
  },
  {
    "field_name": "name",
    "field_value": "W75 Kursumlijska Banja ",
    "source": "itf_endpoint",
    "source_url": "https://www.itftennis.com/en/tournament/w75-kursumlijska-banja-/srb/2026/w-itf-srb-2026-016/",
    "confidence": 0.9
  },
  {
    "field_name": "city",
    "field_value": "KURSUMLIJSKA BANJA",
    "source": "itf_endpoint",
    "source_url": "https://www.itftennis.com/en/tournament/w75-kursumlijska-banja-/srb/2026/w-itf-srb-2026-016/",
    "confidence": 0.9
  },
  {
    "field_name": "country",
    "field_value": "RS",
    "source": "itf_endpoint",
    "source_url": "https://www.itftennis.com/en/tournament/w75-kursumlijska-banja-/srb/2026/w-itf-srb-2026-016/",
    "confidence": 0.9
  },
  {
    "field_name": "category",
    "field_value": "W75",
    "source": "itf_endpoint",
    "source_url": "https://www.itftennis.com/en/tournament/w75-kursumlijska-banja-/srb/2026/w-itf-srb-2026-016/",
    "confidence": 0.9
  },
  {
    "field_name": "surface",
    "field_value": "clay",
    "source": "itf_endpoint",
    "source_url": "https://www.itftennis.com/en/tournament/w75-kursumlijska-banja-/srb/2026/w-itf-srb-2026-016/",
    "confidence": 0.9
  },
  {
    "field_name": "indoor",
    "field_value": "false",
    "source": "itf_endpoint",
    "source_url": "https://www.itftennis.com/en/tournament/w75-kursumlijska-banja-/srb/2026/w-itf-srb-2026-016/",
    "confidence": 0.9
  },
  {
    "field_name": "prize_money",
    "field_value": "60000",
    "source": "itf_endpoint",
    "source_url": "https://www.itftennis.com/en/tournament/w75-kursumlijska-banja-/srb/2026/w-itf-srb-2026-016/",
    "confidence": 0.9
  },
  {
    "field_name": "prize_currency",
    "field_value": "USD",
    "source": "itf_endpoint",
    "source_url": "https://www.itftennis.com/en/tournament/w75-kursumlijska-banja-/srb/2026/w-itf-srb-2026-016/",
    "confidence": 0.9
  }
]
// Rohfelder aus dem Endpunkt (zur Kontrolle)
{
  "name": "W75 Kursumlijska Banja ",
  "city": "KURSUMLIJSKA BANJA",
  "iso": "RS",
  "category": "W75",
  "surface": "clay",
  "prize": 60000,
  "monday": "2026-08-17",
  "startDate": "2026-08-17T00:00:00",
  "endDate": "2026-08-23T00:00:00",
  "sourceRef": "itf:w-itf-srb-2026-016",
  "tournamentLink": "/en/tournament/w75-kursumlijska-banja-/srb/2026/w-itf-srb-2026-016/",
  "prizeRaw": "$60,000"
}
```

### itf:j-j300-srb-2026-001
```json
// tour_tournaments (Identität)
{
  "source_ref": "itf:j-j300-srb-2026-001",
  "tournament_monday": "2026-08-17",
  "series": "itf_juniors"
}
// tour_tournament_claims (Herkunft)
[
  {
    "field_name": "tournament_monday",
    "field_value": "2026-08-17",
    "source": "itf_endpoint",
    "source_url": "https://www.itftennis.com/en/tournament/j300-pancevo/srb/2026/j-j300-srb-2026-001/",
    "confidence": 0.9
  },
  {
    "field_name": "series",
    "field_value": "itf_juniors",
    "source": "itf_endpoint",
    "source_url": "https://www.itftennis.com/en/tournament/j300-pancevo/srb/2026/j-j300-srb-2026-001/",
    "confidence": 0.9
  },
  {
    "field_name": "name",
    "field_value": "J300 Pancevo",
    "source": "itf_endpoint",
    "source_url": "https://www.itftennis.com/en/tournament/j300-pancevo/srb/2026/j-j300-srb-2026-001/",
    "confidence": 0.9
  },
  {
    "field_name": "city",
    "field_value": "Pancevo",
    "source": "itf_endpoint",
    "source_url": "https://www.itftennis.com/en/tournament/j300-pancevo/srb/2026/j-j300-srb-2026-001/",
    "confidence": 0.9
  },
  {
    "field_name": "country",
    "field_value": "RS",
    "source": "itf_endpoint",
    "source_url": "https://www.itftennis.com/en/tournament/j300-pancevo/srb/2026/j-j300-srb-2026-001/",
    "confidence": 0.9
  },
  {
    "field_name": "category",
    "field_value": "J300",
    "source": "itf_endpoint",
    "source_url": "https://www.itftennis.com/en/tournament/j300-pancevo/srb/2026/j-j300-srb-2026-001/",
    "confidence": 0.9
  },
  {
    "field_name": "surface",
    "field_value": "clay",
    "source": "itf_endpoint",
    "source_url": "https://www.itftennis.com/en/tournament/j300-pancevo/srb/2026/j-j300-srb-2026-001/",
    "confidence": 0.9
  },
  {
    "field_name": "indoor",
    "field_value": "false",
    "source": "itf_endpoint",
    "source_url": "https://www.itftennis.com/en/tournament/j300-pancevo/srb/2026/j-j300-srb-2026-001/",
    "confidence": 0.9
  }
]
// Rohfelder aus dem Endpunkt (zur Kontrolle)
{
  "name": "J300 Pancevo",
  "city": "Pancevo",
  "iso": "RS",
  "category": "J300",
  "surface": "clay",
  "prize": null,
  "monday": "2026-08-17",
  "startDate": "2026-08-17T00:00:00",
  "endDate": "2026-08-23T00:00:00",
  "sourceRef": "itf:j-j300-srb-2026-001",
  "tournamentLink": "/en/tournament/j300-pancevo/srb/2026/j-j300-srb-2026-001/",
  "prizeRaw": ""
}
```

## 6. Hinweise

- **Trockenlauf ist Voreinstellung.** Ohne `--write` wird NICHT geschrieben (nur der Bestand wird für den Dubletten-Report gelesen).
- **Dedup:** `upsert onConflict source_ref`. `source_ref = "itf:" + tournamentKey` (lowercase) deckt sich 1:1 mit dem Wikipedia-Bestand (`itf:m-itf-…`) → Herren-Dubletten fallen sauber zusammen; Damen/Junioren sind neu.
- **Preisgeld:** echter Endpunkt-Wert, Claim-Quelle `itf_endpoint`, confidence 0.9 — schlägt den abgeleiteten Wikipedia-Wert (0.5) in `resolve-tournaments.mjs` (MU-028).
- **Nicht aus dem Endpunkt:** Meldefrist (rechnet `deadlines.ts` aus dem Montag), Punkte (`points.ts`). Nichts erfunden.
- **Junioren:** werden geschrieben (series `itf_juniors`); Fristen via §39 in `deadlines.ts`. Alterskontingent/Belastungssteuerung ist Schritt 2 (braucht Geburtsdatum).

**Geschrieben:** 804 Turniere, 7250 Claims, 0 Fehler; JT übersprungen: 0.
