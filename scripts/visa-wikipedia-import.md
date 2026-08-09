# Visa-Anforderungen aus Wikipedia — Import-Bericht

Erzeugt von `scripts/visa-wikipedia-import.mjs`. Ziel: `web.tour_visa_requirements`
(Tabelle aus `supabase/web_tour_visa_requirements.sql`). Quelle: MediaWiki-API,
Seiten „Visa requirements for X citizens" (CC BY-SA), maschinell gelesen. **Keine
amtliche Auskunft** — Herkunft und Frische sind je Zeile mitgeführt
(`source_url`, `source_revised_at`, `imported_at`).

## Umfang

- **31 Nationalitäten** (inkl. visabefreiter Kontrollgruppe), festgezurrt.
- **83 Zielländer**, live aus `web.tour_tournaments` (aktiv) — der Import greift genau
  dort, wo es Turniere gibt.
- **2.410 Zeilen** geschrieben (Upsert auf `(nationality, destination)`, idempotent:
  zweiter Lauf → weiterhin 2.410).
- Seiten-Revisionen: 2026-04-12 bis 2026-08-08.

## Klassenverteilung

| Klasse | Zeilen |
|---|--:|
| visa_required | 1.006 |
| visa_free | 943 |
| evisa | 368 |
| eta | 52 |
| visa_on_arrival | 34 |
| **admission_refused** | **7** |

## Harte Sperren (admission_refused) — eigene Klasse, kein Antragslink

`IR→AE`, `IR→US`, `IL→IR` („Travel illegal under Israeli law"), `IL→KW`,
`RU→CZ`, `RU→FI`, `RU→PL`.

## Bewusst NICHT importiert

**Fehlerrichtung (Leitregel):** Eine FALSCHE Sperre kostet einen Spieler ein Turnier,
das er hätte spielen können — er sieht es nie und erfährt den Grund nicht. Eine
FEHLENDE Sperre führt nur zu einer Warnung, die er ohnehin beim Konsulat prüfen muss.
Im Zweifel also überspringen und protokollieren.

- **Bedingte Sperre (1):** `RU→NO` „Admission refused **except for Schengen Residents**"
  — nicht als harte Sperre importiert.
- **Restriction/Permission, uneindeutig (5):** `IR→AU`, `IL→MY`, `IL→PK`, `IN→PK`,
  `PK→IN` — keine harte Sperre, kein falscher Ausschluss.

## Akzeptierte Coverage-Lücken (→ „keine Angabe", generische Warnung; unschädlich)

- **GU, HK, NC, TW** — stehen in der separaten „Dependent territories"-Tabelle, die
  bewusst nicht mitgeparst wird (Kleinstziele, 2–4 Turniere je).
- **BR→Südamerika** (12) — die Brasilien-Seite baut ihre Regionalzeilen anders
  (Kontrollgruppe).
- **4 Hex-Farbzellen ohne Template** (`US/MX/UA→CN` visumpflichtig, `KR→IR` schwarz)
  — keine Klasse aus bloßer Hintergrundfarbe abgeleitet.

## Stichprobe (aus der DB verifiziert)

| Nationalität → Ziel | Klasse | Aufenthalt | Seite geändert |
|---|---|---|---|
| IR → US | admission_refused | — | 2026-07-25 |
| IN → ES | visa_required | — | 2026-07-26 |
| TN → FR | visa_required | — | 2026-07-17 |
| US → FR | visa_free | 90 | 2026-08-07 |
| JP → IT | visa_free | 90 | 2026-05-26 |
| AU → ES | visa_free | 90 | 2026-07-25 |

Die Kontrollgruppe (US/JP/AU …) steht auf `visa_free` — die Warnung schweigt dort,
wo sie schweigen soll.

## Erneut ausführen

```bash
node scripts/visa-wikipedia-import.mjs           # Trockenlauf (nur Bericht)
node scripts/visa-wikipedia-import.mjs --write    # schreibt per Upsert (idempotent)
```
