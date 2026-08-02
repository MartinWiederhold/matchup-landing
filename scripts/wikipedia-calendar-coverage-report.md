# Wikipedia-Kalender-Abdeckung: ITF Men's World Tennis Tour & ATP Challenger Tour

> Automatisch erzeugt von `scripts/wikipedia-calendar-coverage.mjs` · Lauf: 2026-08-02T07:12:50.363Z
> Quelle: MediaWiki-API (https://en.wikipedia.org/w/api.php), en.wikipedia.org. Kein HTML-Scraping.
> Region = Europa (feste Länderliste) ∪ Türkei, Tunesien, Ägypten, Marokko.

## Methodik

Wikitext je Seite über `action=query&prop=revisions&rvslots=main` geladen, Kalendertabellen
(Header „Week of"+„Tournament") aus dem Wikitext geparst. Jede Seite ist isoliert
(Timeout 60s, 1 Retry); ein Fehlschlag beendet den Lauf nicht und steht unten als Fehler.
ITF-Turniere stammen aus den Quartalsseiten, Challenger aus der Jahresseite.

**Preisgeld** steht nicht in den Kalendertabellen — nur als Spanne im Fließtext. Daher getrennt:
„Preisgeld (in Tabelle)" (praktisch 0) vs. „Preisgeld (aus Kategorie ableitbar)" (M15=15k, M25=25k,
Challenger 50/75/100/125/175). „Halle/Freiluft" gilt als bestimmbar, sobald der Belag bekannt ist
(Freiluft = Default, Halle über „(i)").

## 1. Abgerufene Seiten (Status)

| Serie | Jahr | Seite | Status | Turniere |
|---|---|---|---|---:|
| Challenger | 2025 | 2025 ATP Challenger Tour | OK | 221 |
| ITF | 2025 | 2025 ITF Men's World Tennis Tour | OK | 0 |
| ITF | 2025 | 2025 ITF Men's World Tennis Tour (January–March) | OK | 143 |
| ITF | 2025 | 2025 ITF Men's World Tennis Tour (April–June) | OK | 168 |
| ITF | 2025 | 2025 ITF Men's World Tennis Tour (July–September) | OK | 195 |
| ITF | 2025 | 2025 ITF Men's World Tennis Tour (October–December) | OK | 130 |
| Challenger | 2026 | 2026 ATP Challenger Tour | OK | 253 |
| ITF | 2026 | 2026 ITF Men's World Tennis Tour | OK | 0 |
| ITF | 2026 | 2026 ITF Men's World Tennis Tour (January–March) | OK | 122 |
| ITF | 2026 | 2026 ITF Men's World Tennis Tour (April–June) | OK | 178 |
| ITF | 2026 | 2026 ITF Men's World Tennis Tour (July–September) | OK | 73 |
| ITF | 2026 | 2026 ITF Men's World Tennis Tour (October–December) | FEHLT/FEHLER: Seite fehlt (missing) | 0 |

## 2. Turnierzahlen je Serie und Jahr

| Serie | Jahr | Turniere gesamt | davon in Region | Wikilink eigene Seite | davon Halle „(i)" |
|---|---|---:|---:|---:|---:|
| Challenger | 2025 | 221 | 106 | 217 (98.2%) | 34 |
| Challenger | 2026 | 253 | 113 | 158 (62.5%) | 31 |
| ITF | 2025 | 636 | 370 | 0 (0.0%) | 57 |
| ITF | 2026 | 373 | 225 | 0 (0.0%) | 38 |

## 3. Feldvollständigkeit (absolut / Prozent, bezogen auf „Turniere gesamt")

| Serie | Jahr | n | Turniername | Ort | Land | Woche/Datum | Belag | Halle/Freiluft | Kategorie | Preisgeld (in Tabelle) | Preisgeld (aus Kategorie ableitbar) |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Challenger | 2025 | 221 | 217 / 98.2% | 221 / 100.0% | 221 / 100.0% | 221 / 100.0% | 221 / 100.0% | 221 / 100.0% | 221 / 100.0% | 0 / 0.0% | 221 / 100.0% |
| Challenger | 2026 | 253 | 158 / 62.5% | 253 / 100.0% | 253 / 100.0% | 253 / 100.0% | 253 / 100.0% | 253 / 100.0% | 253 / 100.0% | 0 / 0.0% | 253 / 100.0% |
| ITF | 2025 | 636 | 0 / 0.0% | 636 / 100.0% | 636 / 100.0% | 636 / 100.0% | 636 / 100.0% | 636 / 100.0% | 635 / 99.8% | 0 / 0.0% | 635 / 99.8% |
| ITF | 2026 | 373 | 0 / 0.0% | 372 / 99.7% | 371 / 99.5% | 373 / 100.0% | 373 / 100.0% | 373 / 100.0% | 373 / 100.0% | 0 / 0.0% | 373 / 100.0% |

## 4. Stichprobe (20 Turniere der Zielregion)

| Serie | Jahr | Name | Ort | Land | Woche | Belag | Halle | Kategorie | Preis ableitbar | Wikilink |
|---|---|---|---|---|---|---|---|---|---|---|
| Challenger | 2025 | Lexus Nottingham Challenger | Nottingham | United Kingdom | January 6 | Hard | ja | Challenger 75 | ja | ja |
| Challenger | 2025 | Open Quimper Bretagne | Quimper | France | January 20 | Hard | ja | Challenger 125 | ja | ja |
| Challenger | 2025 | Koblenz Open | Koblenz | Germany | January 27 | Hard | ja | Challenger 100 | ja | ja |
| Challenger | 2025 | Play In Challenger | Lille | France | February 3 | Hard | ja | Challenger 125 | ja | ja |
| Challenger | 2025 | Tenerife Challenger | Tenerife | Spain | February 3 | Hard | — | Challenger 75 | ja | ja |
| Challenger | 2025 | Tenerife Challenger II | Tenerife | Spain | February 10 | Hard | — | Challenger 75 | ja | ja |
| Challenger | 2025 | Glasgow Challenger | Glasgow | United Kingdom | February 17 | Hard | ja | Challenger 75 | ja | ja |
| Challenger | 2025 | Challenger Città di Lugano | Lugano | Switzerland | February 24 | Hard | ja | Challenger 75 | ja | ja |
| Challenger | 2025 | Thionville Open | Thionville | France | March 3 | Hard | ja | Challenger 75 | ja | ja |
| Challenger | 2025 | Crete Challenger | Hersonissos | Greece | March 3 | Hard | — | Challenger 50 | ja | ja |
| Challenger | 2025 | Challenger La Manche | Cherbourg | France | March 10 | Hard | ja | Challenger 75 | ja | ja |
| Challenger | 2025 | Crete Challenger II | Hersonissos | Greece | March 10 | Hard | — | Challenger 50 | ja | ja |
| Challenger | 2025 | Murcia Open | Murcia | Spain | March 17 | Clay | — | Challenger 75 | ja | ja |
| Challenger | 2025 | Zadar Open | Zadar | Croatia | March 17 | Clay | — | Challenger 75 | ja | ja |
| Challenger | 2025 | Napoli Tennis Cup | Naples | Italy | March 24 | Clay | — | Challenger 125 | ja | ja |
| Challenger | 2025 | Girona Challenger | Girona | Spain | March 24 | Clay | — | Challenger 100 | ja | ja |
| Challenger | 2025 | Open Menorca | Menorca | Spain | March 31 | Clay | — | Challenger 100 | ja | ja |
| Challenger | 2025 | Open Città della Disfida | Barletta | Italy | March 31 | Clay | — | Challenger 75 | ja | ja |
| Challenger | 2025 | Open Comunidad de Madrid | Madrid | Spain | April 7 | Clay | — | Challenger 100 | ja | ja |
| Challenger | 2025 | Monza Open | Monza | Italy | April 7 | Clay | — | Challenger 100 | ja | ja |

## 5. Verwendete API-Aufrufe (Volltext)

Existenzprüfung der Titel (einmalig):

```
https://en.wikipedia.org/w/api.php?action=query&format=json&redirects=1&titles=<Titel1>|<Titel2>|…
```

Inhalt je Seite:

- ✓ `https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&rvslots=main&rvprop=content&titles=2025+ATP+Challenger+Tour`
- ✓ `https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&rvslots=main&rvprop=content&titles=2025+ITF+Men%27s+World+Tennis+Tour`
- ✓ `https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&rvslots=main&rvprop=content&titles=2025+ITF+Men%27s+World+Tennis+Tour+%28January%E2%80%93March%29`
- ✓ `https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&rvslots=main&rvprop=content&titles=2025+ITF+Men%27s+World+Tennis+Tour+%28April%E2%80%93June%29`
- ✓ `https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&rvslots=main&rvprop=content&titles=2025+ITF+Men%27s+World+Tennis+Tour+%28July%E2%80%93September%29`
- ✓ `https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&rvslots=main&rvprop=content&titles=2025+ITF+Men%27s+World+Tennis+Tour+%28October%E2%80%93December%29`
- ✓ `https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&rvslots=main&rvprop=content&titles=2026+ATP+Challenger+Tour`
- ✓ `https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&rvslots=main&rvprop=content&titles=2026+ITF+Men%27s+World+Tennis+Tour`
- ✓ `https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&rvslots=main&rvprop=content&titles=2026+ITF+Men%27s+World+Tennis+Tour+%28January%E2%80%93March%29`
- ✓ `https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&rvslots=main&rvprop=content&titles=2026+ITF+Men%27s+World+Tennis+Tour+%28April%E2%80%93June%29`
- ✓ `https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&rvslots=main&rvprop=content&titles=2026+ITF+Men%27s+World+Tennis+Tour+%28July%E2%80%93September%29`
- ✗ `https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&rvslots=main&rvprop=content&titles=2026+ITF+Men%27s+World+Tennis+Tour+%28October%E2%80%93December%29`

## 6. Hinweise

- Alle Zahlen stammen aus dem geparsten Wikitext; nichts ist geschätzt oder ergänzt.
- „Wikilink eigene Seite" = Turnier-Zelle enthält einen Wikilink, dessen Ziel mit einer Jahreszahl
  beginnt (eigene Turnier-Edition-Seite mit exakten Daten). Bei ITF sind Wikilinks meist Stadt-Links → niedrige Quote.
- Land wird als Klartext hinter dem Ort geparst; uneinheitliche Zellen können einzelne Felder leer lassen (nicht geglättet).
