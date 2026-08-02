# Wikidata-Abdeckung: ITF-Futures (M15/M25) & ATP-Challenger

> Automatisch erzeugt von `scripts/wikidata-coverage.mjs` · Lauf: 2026-08-01T21:14:50.893Z
> Quelle: Wikidata Query Service (https://query.wikidata.org/sparql), Lizenz der Daten: CC0.
> Region = Europa (Kontinent Q46) ∪ Türkei (Q43), Tunesien (Q948), Ägypten (Q79), Marokko (Q1028).

## Methodik

Drei **unabhängige** Klassifikations-Varianten, je Jahr getrennt gezählt (nie zusammengefasst).
Tier-Erkennung über Regex `M15|M25|Challenger|Futures|ITF` im Turnier- bzw. Serien-Label.
**Jahresfilter:** Alle drei Varianten filtern das Jahr primär über ein **Pflicht-Datumsfeld**
(`P580`/`P585`). Das ist nötig, damit die Label-/Serien-Regex nur eine kleine Menge scannt
(sonst Timeouts). **Folge:** Die Datums-Vollständigkeit ist damit bauartbedingt ~100 % und
**kein** Abdeckungssignal — die übrigen Felder (Ort, Koordinaten, Website, Belag, Preisgeld) sind es.
Für **V1/V3** greift bei 0 Treffern ein **Alt-Filter** (Jahreszahl im Label), um datumslose Ausgaben zu fangen (markiert).

**Regionszuordnung:** Das Land wird bevorzugt über `P17` des Turniers bestimmt; fehlt es,
ersatzweise über den **Ort** (`P276` → dessen `P17`). Turniere, deren Land sich auf
**keinem** Weg auflösen lässt, werden als **„Land unbekannt"** separat ausgewiesen
(nicht stillschweigend aus der Region entfernt).

**Robustheit:** Jede Abfrage ist isoliert (Timeout 90s, 1 Retry). Ein Fehlschlag beendet den
Lauf nicht, sondern erscheint in der betroffenen Zelle als Fehler.

Geprüfte Felder: Ort (P276), Land (P17), Koordinaten (P625), Website (P856), Startdatum (P580/P585), Belag (P765), Preisgeld (P2769).

## 1. Turnierzahlen je Variante und Jahr

| Variante | Jahr | Gefunden | davon in Region | Land unbekannt | Fallback? | Fehler |
|---|---|---:|---:|---:|---|---|
| V1 | 2024 | 189 | 7 | 145 | – | – |
| V1 | 2025 | 185 | 4 | 160 | – | – |
| V1 | 2026 | 54 | 0 | 50 | – | – |
| V2 | 2024 | 200 | 7 | 156 | – | – |
| V2 | 2025 | 198 | 4 | 173 | – | – |
| V2 | 2026 | 62 | 0 | 58 | – | – |
| V3 | 2024 | 0 | 0 | 0 | – | – |
| V3 | 2025 | 1 | 0 | 1 | – | – |
| V3 | 2026 | 0 | 0 | 0 | – | HTTP 504 Gateway Timeout |

**Varianten:**
- **V1** — P31 (instance of → tennis tournament, Q13219666)
- **V2** — P641 (Sport = Tennis Q847, Datum Pflicht)
- **V3** — P179 (Turnierserie: Challenger/World Tennis Tour/ITF/Futures, Datum Pflicht)

## 2. Feldvollständigkeit (absolut / Prozent, bezogen auf „Gefunden")

| Variante | Jahr | n | Ort (P276) | Land (P17) | Koordinaten (P625) | Website (P856) | Startdatum (P580/P585) | Belag (P765) | Preisgeld (P2769) |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| V1 | 2024 | 189 | 2 / 1.1% | 44 / 23.3% | 0 / 0.0% | 0 / 0.0% | 189 / 100.0% | 21 / 11.1% | 0 / 0.0% |
| V1 | 2025 | 185 | 2 / 1.1% | 25 / 13.5% | 0 / 0.0% | 2 / 1.1% | 185 / 100.0% | 17 / 9.2% | 0 / 0.0% |
| V1 | 2026 | 54 | 0 / 0.0% | 4 / 7.4% | 0 / 0.0% | 0 / 0.0% | 54 / 100.0% | 0 / 0.0% | 0 / 0.0% |
| V2 | 2024 | 200 | 2 / 1.0% | 44 / 22.0% | 0 / 0.0% | 0 / 0.0% | 200 / 100.0% | 21 / 10.5% | 0 / 0.0% |
| V2 | 2025 | 198 | 2 / 1.0% | 25 / 12.6% | 0 / 0.0% | 2 / 1.0% | 198 / 100.0% | 17 / 8.6% | 0 / 0.0% |
| V2 | 2026 | 62 | 0 / 0.0% | 4 / 6.5% | 0 / 0.0% | 0 / 0.0% | 62 / 100.0% | 0 / 0.0% | 0 / 0.0% |
| V3 | 2024 | 0 | 0 / 0.0% | 0 / 0.0% | 0 / 0.0% | 0 / 0.0% | 0 / 0.0% | 0 / 0.0% | 0 / 0.0% |
| V3 | 2025 | 1 | 0 / 0.0% | 0 / 0.0% | 0 / 0.0% | 0 / 0.0% | 1 / 100.0% | 0 / 0.0% | 0 / 0.0% |
| V3 | 2026 | 0 | 0 / 0.0% | 0 / 0.0% | 0 / 0.0% | 0 / 0.0% | 0 / 0.0% | 0 / 0.0% | 0 / 0.0% |

## 3. Stichprobe (20 Turniere, Region bevorzugt)

Spalte „Land" zeigt das aufgelöste Land (P17 des Turniers, sonst über den Ort); „(Ort)" markiert die Auflösung über den Ort.

| QID | Label | Ort | Land | Koord. | Website | Datum | Belag | Preisgeld | Region |
|---|---|---|---|---|---|---|---|---|---|
| Q124619994 | 2024 Challenger Città di Lugano | — | Switzerland | — | — | 2024-01-01 | — | — | ja |
| Q124814510 | 2024 Girona Challenger | — | Spain | — | — | 2024-01-01 | — | — | ja |
| Q125110490 | 2024 Antalya Challenger | — | Turkey | — | — | 2024-01-01 | clay | — | ja |
| Q126720328 | 2024 Ion Țiriac Challenger | — | Romania | — | — | 2024-01-01 | — | — | ja |
| Q128106613 | 2024 ITF W100 Disa Gran Canaria | — | Spain | — | — | 2024-01-01 | — | — | ja |
| Q129254706 | 2024 Dobrich Challenger | — | Bulgaria | — | — | 2024-01-01 | — | — | ja |
| Q130259944 | 2024 Dobrich Challenger II | — | Bulgaria | — | — | 2024-01-01 | — | — | ja |
| Q132485518 | 2025 Challenger Città di Lugano | — | Switzerland | — | — | 2025-01-01 | — | — | ja |
| Q133306672 | 2025 Girona Challenger | — | Spain | — | — | 2025-01-01 | clay court | — | ja |
| Q134930097 | 2025 Ion Țiriac Challenger | — | Romania | — | — | 2025-01-01 | — | — | ja |
| Q135728221 | 2025 ITF W100 Disa Gran Canaria | — | Spain | — | — | 2025-01-01 | — | — | ja |
| Q130271781 | 2024 Las Vegas Challenger – Doubles | — | United States | — | — | 2024-01-01 | — | — | — |
| Q130272767 | 2024 Antofagasta Challenger | — | — | — | — | 2024-01-01 | — | — | — |
| Q130298779 | 2024 Columbus Challenger | — | United States | — | — | 2024-01-01 | — | — | — |
| Q130303911 | 2024 Bangkok Challenger | — | Thailand | — | — | 2024-01-01 | — | — | — |
| Q130314983 | 2024 Tiburon Challenger | — | United States | — | — | 2024-01-01 | — | — | — |
| Q130320810 | 2024 Buenos Aires Challenger | — | Argentina | — | — | 2024-01-01 | clay court | — | — |
| Q130348622 | 2024 Antofagasta Challenger – Singles | — | — | — | — | 2024-01-01 | — | — | — |
| Q130349401 | 2024 Nonthaburi Challenger IV – Singles | — | — | — | — | 2024-01-01 | — | — | — |
| Q130354051 | 2024 Nonthaburi Challenger IV – Doubles | — | — | — | — | 2024-01-01 | — | — | — |

## 4. Verwendete SPARQL-Abfragen (Volltext)

Zweiphasig: **Phase 1** holt je Variante/Jahr nur die QIDs (leichtgewichtig),
**Phase 2** lädt die Felder je QID-Chunk per `VALUES` (immer schnell, kein Timeout).
Beispielhaft für **Jahr 2024**; für 2025/2026 wird nur die Jahreszahl ersetzt.
Der Alt-Jahresfilter (nur V1/V3, greift bei 0 Treffern) ersetzt das Pflicht-Datum durch `FILTER(CONTAINS(?itemLabelRaw,"JAHR"))`.

### V1 — P31 (instance of → tennis tournament, Q13219666) · Phase 1 (QIDs)

```sparql
SELECT DISTINCT ?item WHERE {
  ?item wdt:P31/wdt:P279* wd:Q13219666 .
  ?item (wdt:P580|wdt:P585) ?d . FILTER(YEAR(?d) = 2024)
  ?item rdfs:label ?itemLabelRaw . FILTER(LANG(?itemLabelRaw) = "en")
  FILTER(REGEX(?itemLabelRaw, "M15|M25|Challenger|Futures|ITF", "i"))
} LIMIT 4000
```

**Alt-Jahresfilter (V1, 2024):**

```sparql
SELECT DISTINCT ?item WHERE {
  ?item wdt:P31/wdt:P279* wd:Q13219666 .
  FILTER(CONTAINS(?itemLabelRaw, "2024"))
  ?item rdfs:label ?itemLabelRaw . FILTER(LANG(?itemLabelRaw) = "en")
  FILTER(REGEX(?itemLabelRaw, "M15|M25|Challenger|Futures|ITF", "i"))
} LIMIT 4000
```

### V2 — P641 (Sport = Tennis Q847, Datum Pflicht) · Phase 1 (QIDs)

```sparql
SELECT DISTINCT ?item WHERE {
  ?item wdt:P641 wd:Q847 .
  ?item (wdt:P580|wdt:P585) ?d . FILTER(YEAR(?d) = 2024)
  ?item rdfs:label ?itemLabelRaw . FILTER(LANG(?itemLabelRaw) = "en")
  FILTER(REGEX(?itemLabelRaw, "M15|M25|Challenger|Futures|ITF", "i"))
} LIMIT 4000
```

### V3 — P179 (Turnierserie: Challenger/World Tennis Tour/ITF/Futures, Datum Pflicht) · Phase 1 (QIDs)

```sparql
SELECT DISTINCT ?item WHERE {
  ?item (wdt:P580|wdt:P585) ?d . FILTER(YEAR(?d) = 2024)
  ?item wdt:P179 ?series .
  ?series rdfs:label ?seriesLabel . FILTER(LANG(?seriesLabel) = "en")
  FILTER(REGEX(?seriesLabel, "Challenger|World Tennis Tour|ITF|Futures", "i"))
} LIMIT 4000
```

### Phase 2 — Felder je QID-Chunk (für alle Varianten gleich)

```sparql
SELECT ?item ?itemLabel ?locLabel ?country ?countryLabel ?locCountry ?locCountryLabel ?coord ?website ?start ?point ?surfaceLabel ?prize WHERE {
  VALUES ?item { wd:Q_BEISPIEL_1 wd:Q_BEISPIEL_2 }
  OPTIONAL { ?item wdt:P580 ?start. }
  OPTIONAL { ?item wdt:P585 ?point. }
  OPTIONAL { ?item wdt:P276 ?loc. OPTIONAL { ?loc wdt:P17 ?locCountry. } }
  OPTIONAL { ?item wdt:P17 ?country. }
  OPTIONAL { ?item wdt:P625 ?coord. }
  OPTIONAL { ?item wdt:P856 ?website. }
  OPTIONAL { ?item wdt:P765 ?surface. }
  OPTIONAL { ?item wdt:P2769 ?prize. }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
```

## 5. Hinweise

- Alle Zahlen stammen unverändert aus dem Query Service; nichts ist geschätzt oder ergänzt.
- Mehrfachwerte (z. B. zwei Orte pro Turnier) werden pro Turnier zu „vorhanden" zusammengefasst.
- „Region" prüft die aufgelöste Land-QID gegen eine feste Liste europäischer Länder-QIDs plus Türkei/Tunesien/Ägypten/Marokko (kein `P30`-Kontinent-Join — der trieb die Abfragen in Timeouts).
- Property-Annahmen: Belag = `P765` (surface played on), Preisgeld = `P2769` (prize money).
