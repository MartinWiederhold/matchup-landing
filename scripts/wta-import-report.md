# WTA-Haupttour-Import — TROCKENLAUF (nichts geschrieben)

> `scripts/wta-import.mjs` · 2026-08-21T19:52:25.286Z · Zeitraum 2026-08-21 … 2027-12-31
> Quelle: api.wtatennis.com/tennis/tournaments (offen, keine Bot-Abwehr). ITF ausgeschlossen.

## Menge
- Endpunkt gesamt: **46** · verwertbar: **44** · verworfen: 2
- **NEU: 44** · Dublette (source_ref): 0

## Verworfen nach Grund
- **level_ausser_haupttour** — 2×

## Level-Verteilung
- WTA 125: 30
- WTA 250: 6
- WTA 500: 5
- WTA 1000: 3

## Länderverteilung (Top 20)
CN 6 · TR 4 · US 3 · MX 3 · CO 3 · BR 3 · PT 3 · IT 3 · ES 2 · JP 2 · FR 2 · CH 1 · SI 1 · SG 1 · KR 1 · AO 1 · IN 1 · HK 1 · CL 1 · AR 1

## Drei vollständige Beispiele
```json
// tour_tournaments (Identität)
{
  "source_ref": "wta:1017:2026",
  "tournament_monday": "2026-08-10",
  "series": "wta"
}
// tour_tournament_claims (Herkunft)
[
  {
    "field_name": "tournament_monday",
    "field_value": "2026-08-10",
    "source": "wta_endpoint",
    "source_url": "https://api.wtatennis.com/tennis/tournaments/?level=WTA%201000",
    "confidence": 0.9
  },
  {
    "field_name": "series",
    "field_value": "wta",
    "source": "wta_endpoint",
    "source_url": "https://api.wtatennis.com/tennis/tournaments/?level=WTA%201000",
    "confidence": 0.9
  },
  {
    "field_name": "name",
    "field_value": "Cincinnati Open - Cincinnati, OH, USA",
    "source": "wta_endpoint",
    "source_url": "https://api.wtatennis.com/tennis/tournaments/?level=WTA%201000",
    "confidence": 0.9
  },
  {
    "field_name": "city",
    "field_value": "CINCINNATI",
    "source": "wta_endpoint",
    "source_url": "https://api.wtatennis.com/tennis/tournaments/?level=WTA%201000",
    "confidence": 0.9
  },
  {
    "field_name": "country",
    "field_value": "US",
    "source": "wta_endpoint",
    "source_url": "https://api.wtatennis.com/tennis/tournaments/?level=WTA%201000",
    "confidence": 0.9
  },
  {
    "field_name": "category",
    "field_value": "WTA 1000",
    "source": "wta_endpoint",
    "source_url": "https://api.wtatennis.com/tennis/tournaments/?level=WTA%201000",
    "confidence": 0.9
  },
  {
    "field_name": "surface",
    "field_value": "hard",
    "source": "wta_endpoint",
    "source_url": "https://api.wtatennis.com/tennis/tournaments/?level=WTA%201000",
    "confidence": 0.9
  },
  {
    "field_name": "indoor",
    "field_value": "false",
    "source": "wta_endpoint",
    "source_url": "https://api.wtatennis.com/tennis/tournaments/?level=WTA%201000",
    "confidence": 0.9
  },
  {
    "field_name": "prize_money",
    "field_value": "7433076",
    "source": "wta_endpoint",
    "source_url": "https://api.wtatennis.com/tennis/tournaments/?level=WTA%201000",
    "confidence": 0.9
  },
  {
    "field_name": "prize_currency",
    "field_value": "USD",
    "source": "wta_endpoint",
    "source_url": "https://api.wtatennis.com/tennis/tournaments/?level=WTA%201000",
    "confidence": 0.9
  }
]
// Rohfelder (Kontrolle, inkl. singlesDrawSize — für die feldgrößenabhängigen unteren Runden)
{
  "title": "Cincinnati Open - Cincinnati, OH, USA",
  "city": "CINCINNATI",
  "iso": "US",
  "level": "WTA 1000",
  "surface": "hard",
  "prize": 7433076,
  "monday": "2026-08-10",
  "drawSingles": 96,
  "startDate": "2026-08-13",
  "sourceRef": "wta:1017:2026"
}
```
```json
// tour_tournaments (Identität)
{
  "source_ref": "wta:1039:2026",
  "tournament_monday": "2026-08-17",
  "series": "wta"
}
// tour_tournament_claims (Herkunft)
[
  {
    "field_name": "tournament_monday",
    "field_value": "2026-08-17",
    "source": "wta_endpoint",
    "source_url": "https://api.wtatennis.com/tennis/tournaments/?level=WTA%20500",
    "confidence": 0.9
  },
  {
    "field_name": "series",
    "field_value": "wta",
    "source": "wta_endpoint",
    "source_url": "https://api.wtatennis.com/tennis/tournaments/?level=WTA%20500",
    "confidence": 0.9
  },
  {
    "field_name": "name",
    "field_value": "Abierto GNP Seguros - Monterrey, MEX",
    "source": "wta_endpoint",
    "source_url": "https://api.wtatennis.com/tennis/tournaments/?level=WTA%20500",
    "confidence": 0.9
  },
  {
    "field_name": "city",
    "field_value": "MONTERREY",
    "source": "wta_endpoint",
    "source_url": "https://api.wtatennis.com/tennis/tournaments/?level=WTA%20500",
    "confidence": 0.9
  },
  {
    "field_name": "country",
    "field_value": "MX",
    "source": "wta_endpoint",
    "source_url": "https://api.wtatennis.com/tennis/tournaments/?level=WTA%20500",
    "confidence": 0.9
  },
  {
    "field_name": "category",
    "field_value": "WTA 500",
    "source": "wta_endpoint",
    "source_url": "https://api.wtatennis.com/tennis/tournaments/?level=WTA%20500",
    "confidence": 0.9
  },
  {
    "field_name": "surface",
    "field_value": "hard",
    "source": "wta_endpoint",
    "source_url": "https://api.wtatennis.com/tennis/tournaments/?level=WTA%20500",
    "confidence": 0.9
  },
  {
    "field_name": "indoor",
    "field_value": "false",
    "source": "wta_endpoint",
    "source_url": "https://api.wtatennis.com/tennis/tournaments/?level=WTA%20500",
    "confidence": 0.9
  },
  {
    "field_name": "prize_money",
    "field_value": "1206446",
    "source": "wta_endpoint",
    "source_url": "https://api.wtatennis.com/tennis/tournaments/?level=WTA%20500",
    "confidence": 0.9
  },
  {
    "field_name": "prize_currency",
    "field_value": "USD",
    "source": "wta_endpoint",
    "source_url": "https://api.wtatennis.com/tennis/tournaments/?level=WTA%20500",
    "confidence": 0.9
  }
]
// Rohfelder (Kontrolle, inkl. singlesDrawSize — für die feldgrößenabhängigen unteren Runden)
{
  "title": "Abierto GNP Seguros - Monterrey, MEX",
  "city": "MONTERREY",
  "iso": "MX",
  "level": "WTA 500",
  "surface": "hard",
  "prize": 1206446,
  "monday": "2026-08-17",
  "drawSingles": 28,
  "startDate": "2026-08-23",
  "sourceRef": "wta:1039:2026"
}
```
```json
// tour_tournaments (Identität)
{
  "source_ref": "wta:1166:2026",
  "tournament_monday": "2026-08-17",
  "series": "wta"
}
// tour_tournament_claims (Herkunft)
[
  {
    "field_name": "tournament_monday",
    "field_value": "2026-08-17",
    "source": "wta_endpoint",
    "source_url": "https://api.wtatennis.com/tennis/tournaments/?level=WTA%20125",
    "confidence": 0.9
  },
  {
    "field_name": "series",
    "field_value": "wta",
    "source": "wta_endpoint",
    "source_url": "https://api.wtatennis.com/tennis/tournaments/?level=WTA%20125",
    "confidence": 0.9
  },
  {
    "field_name": "name",
    "field_value": "Ennoble Care Philly Open - Philadelphia, PA, USA",
    "source": "wta_endpoint",
    "source_url": "https://api.wtatennis.com/tennis/tournaments/?level=WTA%20125",
    "confidence": 0.9
  },
  {
    "field_name": "city",
    "field_value": "PHILADELPHIA",
    "source": "wta_endpoint",
    "source_url": "https://api.wtatennis.com/tennis/tournaments/?level=WTA%20125",
    "confidence": 0.9
  },
  {
    "field_name": "country",
    "field_value": "US",
    "source": "wta_endpoint",
    "source_url": "https://api.wtatennis.com/tennis/tournaments/?level=WTA%20125",
    "confidence": 0.9
  },
  {
    "field_name": "category",
    "field_value": "WTA 125",
    "source": "wta_endpoint",
    "source_url": "https://api.wtatennis.com/tennis/tournaments/?level=WTA%20125",
    "confidence": 0.9
  },
  {
    "field_name": "surface",
    "field_value": "hard",
    "source": "wta_endpoint",
    "source_url": "https://api.wtatennis.com/tennis/tournaments/?level=WTA%20125",
    "confidence": 0.9
  },
  {
    "field_name": "indoor",
    "field_value": "false",
    "source": "wta_endpoint",
    "source_url": "https://api.wtatennis.com/tennis/tournaments/?level=WTA%20125",
    "confidence": 0.9
  },
  {
    "field_name": "prize_money",
    "field_value": "115000",
    "source": "wta_endpoint",
    "source_url": "https://api.wtatennis.com/tennis/tournaments/?level=WTA%20125",
    "confidence": 0.9
  },
  {
    "field_name": "prize_currency",
    "field_value": "USD",
    "source": "wta_endpoint",
    "source_url": "https://api.wtatennis.com/tennis/tournaments/?level=WTA%20125",
    "confidence": 0.9
  }
]
// Rohfelder (Kontrolle, inkl. singlesDrawSize — für die feldgrößenabhängigen unteren Runden)
{
  "title": "Ennoble Care Philly Open - Philadelphia, PA, USA",
  "city": "PHILADELPHIA",
  "iso": "US",
  "level": "WTA 125",
  "surface": "hard",
  "prize": 115000,
  "monday": "2026-08-17",
  "drawSingles": 32,
  "startDate": "2026-08-23",
  "sourceRef": "wta:1166:2026"
}
```

## Hinweise
- **Keine Meldefrist im Endpunkt** — berechnet in `deadlines.ts` (Serie `wta`): Entry = Montag −28 T (belegt, III.A.2.a.i), OHNE Uhrzeit, Vorbehalt „unless otherwise determined by the WTA". Withdrawal/Freeze null.
- **Punkte** in `points.ts` (v6, Serie-Kategorien wta_1000/500/250/125, VIII.A.5). `singlesDrawSize` liegt als Rohfeld vor (feldgrößenabhängige untere Runden).
- **series-CHECK** muss vor `--write` um `wta` erweitert sein (MU-050).