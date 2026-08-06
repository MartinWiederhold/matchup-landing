# Erkundung extreme-tennis.fr — Schlägerdaten (Trockenlauf)

**Stand:** 2026-08-06 · **Umfang:** nur 3 Produktseiten + Kategorie-Übersicht (kein
Vollimport, keine DB-Schreibvorgänge). Ziel: verstehen, **wo** die Daten liegen, **in
welcher Form**, **wie viele** Schläger es sind und **ob ein Feed** einfacher wäre als
HTML-Auswertung.

**Methode:** `curl` mit aussagekräftigem User-Agent
(`Mozilla/5.0 (compatible; MatchupBot/1.0; +https://matchup-app.com)`), `-L` für
Redirects, **≥ 1 Sekunde Pause** zwischen allen Abrufen. HTML lokal in `/tmp`
zwischengespeichert, Analyse mit Python (kein Re-Fetch bei erneuter Auswertung).

**Abgerufene Seiten (3 Produkte, verschiedene Hersteller):**
1. `https://www.extreme-tennis.fr/fr/raquette-de-tennis/24005-raquette-head-extreme-mp-xl-2026-300g.html` (Referenz, Head)
2. `.../fr/raquettes-wilson-clash/...-wilson-clash-100-v3-...` (Wilson) — via 301-Redirect
3. `.../fr/raquettes-yonex-muse/...-yonex-muse-100-...` (Yonex) — via 301-Redirect
+ Kategorie `https://www.extreme-tennis.fr/fr/8-raquette-de-tennis` (Seite 1 und Seite 6).

---

## 1. Shop-System & Datenherkunft

**Shop-System: PrestaShop.** Erkennbar an `data-sheet`-Markup, `id_product`,
`id_feature`, `descriptive_feature_values` und dem Modul **`qcdcomparator`**
(Vergleichs-/Radar-Modul), das die Testwerte einbettet.

**Kernbefund: Alle relevanten Daten stehen im statischen HTML.** Es ist **kein**
zweiter JS-/JSON-Abruf nötig, um an die Werte zu kommen. Zwei Fundorte:

### a) Die 7 Testwerte + Gesamtscore → Inline-Script `xcompareHookData`
Jede Produktseite enthält ein Inline-`<script>` mit
`var xcompareHookData = { … currentProduct: { … } … }`. Darin:
- `currentProduct.features` = Liste `{id_feature, value}` mit den **7 Testwerten** (Skala **0–100**, im Shop als „Critère sur 100" beschriftet).
- `currentProduct.score` = **Gesamtscore** (z. B. 69.7).
- `currentProduct.price_tax_incl`, `id_product` = Preis/ID.
- Eine `features:`-Liste (id_feature → Klartextname) liefert das **Label-Mapping**.

**id_feature → Testwert:** 130 Puissance · 131 Contrôle · 132 Confort ·
133 Prise d'effet · 134 Tolérance · 135 Maniabilité · 136 Stabilité.

> Hinweis Zeichenkodierung: Namen sind HTML-entity-kodiert (`&eacute;` → é) und
> „Prise d**'**effet" nutzt ein **typografisches** Apostroph (’, U+2019). Vor dem
> Abgleich `html.unescape` + Apostroph normalisieren, sonst matcht das Label nicht.

Der `<canvas id="xc-hook-radarChart">` auf der Seite ist nur die visuelle
Darstellung genau dieser 7 Werte — die Zahlen selbst liegen schon im HTML.

### b) Vollständige Technik → PrestaShop `data-sheet`
Ein `<dl class="data-sheet">` mit `<dt class="name">Label</dt><dd class="value">Wert</dd>`
listet die komplette Technik (19 Paare auf der Referenzseite), u. a.:
Poids non cordée, Équilibre, Tamis (Kopfgröße), Plan de cordage (Besaitungsbild),
Rigidité (Steifigkeit, „ra"), Inertie, Profil, Twistweight, **Longueur (Länge)**,
**Recoil Weight**, **Plow-through**. Eine Teilmenge davon steht zusätzlich strukturiert
in `xcompareHookData…descriptive_feature_values` (id → Wert).

### c) Maschinenlesbare Zusatzdaten
- **JSON-LD** (`schema.org/Product`, `BreadcrumbList`, `Organization`, `WebPage`):
  nur **Identität** — Name, `sku`/`mpn`, Marke, Gewicht, Preis, Verfügbarkeit.
  **Keine** der 7 Testwerte. Nützlich als saubere ID/Marke/Preis-Quelle.
- **OpenGraph** (`og:title/description/image/url`, `product:price:*`): vorhanden,
  ebenfalls nur Identität/Preis.
- Kein separater Microdata-Block über JSON-LD hinaus nötig.

---

## 2. Struktur der Übersicht & Anzahl

- Kategorie „Raquette de tennis", id **8**: `.../fr/8-raquette-de-tennis`.
- **Blätterung** klassisch über `?page=N` (1…6, Seite 6 ist die letzte). **Kein**
  Infinite-Scroll fürs Grunddaten-Rendering; Filter (Marke, Preis, Niveau …) hängen
  nur weitere Query-Parameter an.
- Produktlinks der Übersicht zeigen auf `/fr/raquette-de-tennis/{id}-…` und leiten per
  **301** auf marken-spezifische Pfade um (z. B. `raquettes-wilson-clash`,
  `raquettes-yonex-muse`) — beim Crawl `-L` mitgeben.
- **Menge (Schätzung): ~394 Schläger.** Seite 1 = 70 Produkte, Seite 6 = 44; bei
  ~70/Seite × 5 + 44 ≈ 394. **Exakte Zahl** nur durch Zählen aller 6 Seiten sicher —
  das gehört in den späteren Vollimport, nicht in diesen Trockenlauf.
- Marken gemischt (Head, Wilson, Tecnifibre, Yonex, Dunlop, Prince, Solinco …).

---

## 3. Extrahierte Werte — 3 Seiten zur Kontrolle der Zuordnung

### Testwerte (Skala 0–100, aus `xcompareHookData`)
| Kriterium | Head Extreme MP XL | Wilson Clash 100 v3 | Yonex Muse 100 |
|---|---:|---:|---:|
| Puissance (Power) | 86 | 70 | 67 |
| Contrôle (Kontrolle) | 60 | 75 | 74 |
| Confort (Komfort) | 54 | 81 | 81 |
| Prise d'effet (Spin) | 81 | 77 | 81 |
| Tolérance (Toleranz) | 67 | 72 | 77 |
| Maniabilité (Handling) | 62 | 70 | 67 |
| Stabilité (Stabilität) | 78 | 70 | 69 |
| **Gesamtscore** | **69.7** | **73.6** | **73.7** |
| Preis (€, inkl.) | 233,90 | 166,85 | 209,80 |

### Technik (aus `data-sheet`)
| Merkmal | Head Extreme MP XL | Wilson Clash 100 v3 | Yonex Muse 100 |
|---|---|---|---|
| Poids non cordée (Gewicht) | 300 g | — | — |
| Équilibre (Balance) | 32 cm | — | — |
| Tamis (Kopfgröße) | 645 cm² | 645 cm² | 645 cm² |
| Plan de cordage (Besaitung) | 16×19 | 16×19 | 16×18 |
| Rigidité (Steifigkeit) | 66 ra | 57 ra | 55 ra |
| Inertie | 291 | 287 | 286 |
| Profil | 23/26/21 mm | — | — |
| Twistweight | 15.2 | 15.6 | 15.3 |
| Longueur (Länge) | 70 cm | 68,5 cm | 68,5 cm |
| Recoil Weight | 145.8 | 156.9 | 143.2 |
| Plow-through | 285.3 | 281.8 | 280.6 |

> Zahlen 1:1 aus der Quelle übernommen; Kommas sind Dezimaltrenner (fr-Format).
> „—" = Feld auf **dieser** Seite nicht im `data-sheet` gepflegt (kein geratener Wert).
> Poids/Équilibre/Profil stehen bei Head im `data-sheet`, bei Wilson/Yonex teils nur
> im `descriptive_feature_values`-Block — beim Vollimport beide Quellen zusammenführen.

---

## 4. Feed/API vs. HTML — Empfehlung

**HTML-Parsing ist hier der einfachste Weg — kein Feed nötig.**
- Die 7 Testwerte gibt es **nur** über den Shop selbst; sie stecken bereits als
  saubere, per-Produkt-strukturierte JSON-Objekte (`xcompareHookData.currentProduct`)
  im HTML. Das ist zuverlässiger und einfacher als jede Zusatzschnittstelle.
- Eine **PrestaShop-Webservice-API** existiert prinzipiell, bräuchte aber einen vom
  Betreiber freizuschaltenden **API-Key** und liefert die editoriellen Testwerte nicht
  garantiert mit — mehr Aufwand als das Parsen des ohnehin vorhandenen Inline-JSON.
- Das Modul `qcdcomparator` hat einen `searchAutocompleteV2`-Endpunkt (+ Token), der
  aber nur die Vergleichs-UI bedient — für die Extraktion **nicht** erforderlich.

**Vorgeschlagener Import-Weg (späterer Schritt):** Pro Produktseite (1) `xcompareHookData`
→ 7 Testwerte + Score + ID/Preis, (2) `data-sheet` → Technik, (3) JSON-LD → Marke/SKU/
Name als stabile Identität. Übersicht über `?page=1…6` einsammeln, Redirects folgen,
≥ 1 s Pause, Werte als „observed" mit Datenstand ablegen (Muster
`scripts/wikipedia-import.mjs`: Trockenlauf-Default, `--write` erst für den echten Lauf).

---

## Fazit (die vier Fragen)
1. **Wo liegen die Daten?** Komplett im statischen HTML jeder Produktseite.
2. **In welcher Form?** 7 Testwerte + Score im Inline-JSON `xcompareHookData`
   (Skala 0–100); volle Technik im `data-sheet`-`<dl>`; Identität/Preis zusätzlich in
   JSON-LD/OpenGraph. Kein JS-Nachladen nötig.
3. **Wie viele Schläger?** ~394 (6 Seiten, `?page=`-Blätterung; exakte Zahl beim
   Vollimport bestätigen).
4. **Feed einfacher?** Nein — HTML-/Inline-JSON-Parsing ist der direkteste, robusteste
   Weg; eine API brächte hier keinen Vorteil.
