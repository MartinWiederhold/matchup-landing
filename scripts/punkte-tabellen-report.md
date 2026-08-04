# Ranglistenpunkte je Runde — Recherche-Bericht

> **STATUS: VOLLSTÄNDIG (ATP + ITF verifiziert).** Die ATP-Kapitel-9-PDFs (2024, 2025 in zwei
> Fassungen, 2026) wurden vom Nutzer lokal abgelegt (der Host blockte automatisierten Zugriff mit
> HTTP 403) und **spaltenerkennend ausgelesen** (`pdfplumber`, Geometrie über die x-Positionen der
> Kopfzeile — nicht reine Textextraktion). §3 ist damit befüllt: alle fünf Challenger-Tiers und die
> M15/M25-Hauptfeldpunkte (ATP-Ranking), je Zahl mit Jahrgang + gedruckter Seite. Der kritische
> Punkt (Spaltenzuordnung R64 vs. Q) ist per Geometrie eindeutig geklärt (§3c). Nur ITF-**2026-WTR-
> Quali**-Punkte bleiben unbestätigt (Standalone-PDF existiert nicht, siehe §2b) — für den
> Hauptfeld-Rechner irrelevant, da Hauptfeld = ATP-Punkte (§2c).

> **Zweck:** Belegte Punktetabellen (Runde → Punkte) für den geplanten /tour-Punkte-Rechner
> (erzielte Punkte aus Matchergebnis + Kategorie, 52-Wochen-Verfall). Nur belegte Zahlen —
> nichts geschätzt, abgeleitet oder interpoliert. Auf Sekundärquellen (Wikipedia, Blogs) wurde
> bewusst **nicht** ausgewichen; jede ATP-Zahl stammt aus dem jeweiligen Kapitel-9-PDF.

---

## 1. Erreichbarkeit der Quellen (Stand der Recherche: 2026-08)

| Quelle | URL | Zugriff |
|---|---|---|
| ATP Rulebook 2024, Kap. 9 „PIF ATP Rankings" | `https://www.atptour.com/-/media/files/rulebook/2024/2024-rulebook-chapter-9_pif-atp-rankings_27feb.pdf` | **HTTP 403** (WAF-Blockseite statt PDF) |
| ATP Rulebook 2025, Kap. 9 (10feb) | `https://www.atptour.com/-/media/files/rulebook/2025/2025-rulebook-chapter-9_pif-atp-rankings_10feb.pdf` | **HTTP 403** |
| ATP Rulebook 2025, Kap. 9 (23dec) | `https://www.atptour.com/-/media/files/rulebook/2025/2025-rulebook-chapter-9_pif-atp-rankings_23dec.pdf` | (nicht separat getestet, gleicher Host) |
| ATP Rulebook 2026, Kap. 9 (22dec25) | `https://www.atptour.com/-/media/files/rulebook/2026/2026-rulebook-chapter-9_pif-atp-rankings_22dec25.pdf` | **HTTP 403** |
| ITF World Tennis Ranking — Points Tables 2025 | `https://www.itftennis.com/media/13763/itf-points-tables-2025.pdf` | **OK** (PDF geladen, Text lokal extrahiert) |

Die ATP-URLs sind über die Websuche als offizielle Dokumente auf `atptour.com` auffindbar
(u. a. verlinkt von der Wikipedia-Seite „ATP Challenger Tour 175"), liefern aber sowohl über
den Fetch-Dienst als auch über `curl` mit Browser-User-Agent eine **403-WAF-Blockseite**
(6 KB HTML) statt der PDF. Der Zugang ist host-/WAF-seitig gesperrt, nicht URL-abhängig.

**Auflösung:** Die drei (bzw. vier mit der 23dec-Fassung) PDFs wurden **manuell im Browser
gespeichert** und lokal mit `pdfplumber` ausgelesen (§3). Die 403-Blockade betraf nur den
automatisierten Abruf, nicht die Dokumente selbst.

---

## 2. ITF World Tennis Tour — VERIFIZIERT (mit Klarstellung)

**Quelle:** „ITF World Tennis Ranking points tables", `itf-points-tables-2025.pdf`
(`https://www.itftennis.com/media/13763/itf-points-tables-2025.pdf`), PDF-Metadaten:
erstellt 2025-01-08. Abschnitt „Men's Singles", Tabelle mit Überschrift **„2020–2025 ITF
Ranking Points Table"**. (Nur die Zahlen übernommen, kein Text/Layout.)

**ZENTRALER BEFUND — das ändert, was „ITF-Punkte je Runde" bedeutet:**
Das Dokument stellt wörtlich klar, dass **ITF-World-Tennis-Ranking-Punkte NUR in den
Qualifikations-Einzeln vergeben werden** („earned only in Singles Qualifying events"). Im
**Hauptfeld** (W/F/SF/QF/R16/R32) gibt es für M15/M25 seit 2020 **KEINE ITF-Ranking-Punkte**
— alle Hauptfeld-Spalten stehen auf „-".

### 2a. ITF World Tennis Ranking (WTR) — Herren-Einzel, gültig 2020–2025

| Kategorie | W | F | SF | QF | R16 | R32 | **Q** | **FRQ** |
|---|---|---|---|---|---|---|---|---|
| M25 +H | – | – | – | – | – | – | **4** | **1** |
| M25 | – | – | – | – | – | – | **3** | **1** |
| M15 +H | – | – | – | – | – | – | **3** | **1** |
| M15 | – | – | – | – | – | – | **2** | **1** |

- **Q** = Qualifikation erreicht/bestanden, **FRQ** = erste Qualifikationsrunde. Legende aus
  der PDF-Kopfzeile („W F S Q R16 R32 Q FRQ").
- **+H** = mit Hospitality (Unterkunft/Verpflegung gestellt). +H gibt je 1 Quali-Punkt mehr.
- **Keine Feldgrößen-Abhängigkeit** in dieser Tabelle (keine 32er/48er-Spalten).
- **Fassung/Gültigkeit:** Tabellenüberschrift „2020–2025" → die WTR-Quali-Punkte für M15/M25
  waren **2020 bis 2025 unverändert** (deckt also 2024 und 2025 ab).

### 2b. 2026-Prüfung (verifiziert, keine Sekundärquelle)

- **Standalone-PDF unter gleicher Adressstruktur wie 2025:** existiert **NICHT**. `itf-points-tables-2026.pdf` unter `/media/13763/` → **HTTP 404**. Die Media-IDs sind pro Datei, nicht jahres-tauschbar; die 2025er-Struktur trägt nicht auf 2026.
- **2026-Primärquelle gefunden:** `2026-wtt-regulations.pdf` (`https://www.itftennis.com/media/15546/2026-wtt-regulations.pdf`, 222 S., geladen). Der lokal extrahierbare Inhalt dort ist die **Preisgeld-Tabelle je Runde**, NICHT die WTR-Ranglistenpunkte-Tabelle. → Die **2026-ITF-WTR-Ranglistenpunkte konnten NICHT verifiziert werden** (kein sauberer Textlayer/Fundort gefunden). Bewusst nichts übernommen.
- **Nebenbefund (Preisgeld, KEINE Punkte):** Im 2026-Regelwerk ist **M25 = $30.000** (2024/2025 war es $25.000), M15 = $15.000. Das ist eine **strukturelle Änderung 2026** — relevant als Warnung, dass die ATP-Punkte für 2026 separat zu prüfen sind, aber die Zahlen 2.160/4.612 usw. sind **Preisgeld ($), nicht Ranglistenpunkte** und gehören NICHT in eine Punktetabelle.
- **Betrifft laufenden Code:** `scripts/wikipedia-import.mjs` leitet das Preisgeld aus der Kategorie ab (`PRIZE_USD`, Zeile 91) mit **`"M25": 25000` fest verdrahtet** (Claim-Quelle `abgeleitet_aus_kategorie`, geringe confidence). Für **2026er M25-Turniere ist das falsch** ($30.000). Hier nur dokumentiert, **nicht** geändert.
- **Offen für 2026:** die ITF-WTR-Quali-Punkte (ob unverändert ggü. 2020–2025) und — falls M25 nun $30k statt $25k ist — ob die **ATP-Punkte** für M25/M15 2026 gleich blieben. Beides nur aus den jeweiligen Primär-PDFs klärbar.

### 2c. Modell-Konsequenz: EIN Punktesystem, nicht zwei

**Dieser Befund ändert das Datenmodell des Rechners.** Ein M15/M25-Spieler sammelt im
**Hauptfeld** (W/F/SF/QF/R16/R32) **keine ITF-WTR-Punkte** — dort zählen **ATP-Ranglistenpunkte**.
ITF-WTR-Punkte fallen **nur in der Qualifikation** an (die wenigen Werte aus §2a: M15 2 / M15+H 3
/ M25 3 / M25+H 4, FRQ je 1). Für den Rechner heißt das:

- **Alles im Hauptfeld = ATP-Punkte.** Challenger **und** M15/M25-Hauptfeld laufen im **selben**
  ATP-Ranking-Punktesystem (aus dem ATP-Regelwerk, §3). Der Rechner braucht also **EIN**
  Punktesystem für die eigentliche Saison-/Rangrechnung, **nicht zwei** (kein paralleles
  ITF-Ranking mit eigenen Hauptfeld-Punkten — das gibt es seit 2020 nicht mehr).
- Die ITF-WTR-Quali-Punkte sind eine **separate, sehr kleine Größe**, die mit dem ATP-Ranking
  **nicht** verrechnet wird — höchstens getrennt anzeigbar (siehe offene Produktfrage in §4).

### 2b. Historischer Kontext — „2019 ITF Ranking Points Table" (aus derselben PDF)

Dieselbe PDF enthält zusätzlich eine als **„2019"** überschriebene, historische Tabelle mit
vollen Hauptfeld-Punkten (aus der Zeit vor der ATP/ITF-Umstellung). Nur als Kontext, **nicht**
für 2024–2026 gültig:

| Kategorie (2019) | W | F | SF | QF | R16 | R32 | Q | FRQ |
|---|---|---|---|---|---|---|---|---|
| ATP Challengers (nicht 125er) | – | – | – | – | – | – | 30 | – |
| $25.000 +H | 225 | 135 | 67 | 27 | 9 | 0 | 3 | 1 |
| $25.000 | 150 | 90 | 45 | 18 | 6 | 0 | 3 | 1 |
| $15.000 +H | 150 | 90 | 45 | 18 | 6 | 0 | 3 | 1 |
| $15.000 | 100 | 60 | 30 | 12 | 4 | 0 | 2 | 1 |

⚠️ **Nur historisch (2019).** Ab 2020 zählen die Hauptfeld-Punkte dieser Turniere zum
**ATP-Ranking**, nicht mehr zum ITF-Ranking (siehe 2a). NICHT für den 2024–2026-Rechner verwenden.

---

## 3. ATP Challenger Tour + M15/M25 (ATP-Ranking) — VERIFIZIERT

**Quelle:** ATP Rulebook, Kapitel 9 „PIF ATP Rankings", Abschnitt **„5) Singles Point table"**.
Vier Fassungen lokal ausgelesen:

| Jahrgang | Datei | Einzel-Punktetabelle auf (gedruckte Seite) |
|---|---|---|
| 2024 | `2024-rulebook-chapter-9_pif-atp-rankings_27feb.pdf` | **S. 254** (Challenger + ITF zusammen) |
| 2025 (10feb) | `2025-rulebook-chapter-9_pif-atp-rankings_10feb.pdf` | **S. 265** |
| 2025 (23dec) | `2025-rulebook-chapter-9_pif-atp-rankings_23dec.pdf` | **S. 265** (identisch zur 10feb-Fassung) |
| 2026 | `2026-rulebook-chapter-9_pif-atp-rankings_22dec25.pdf` | **S. 272–273** (Ch 175–75 auf 272, Ch 50 + M25/M15 auf 273) |

**Methode (spaltenerkennend, nicht Textfluss):** Aus der Kopfzeile wurden die x-Positionen jeder
Spalte bestimmt (`W=247, F=271, SF=292, QF=312, R16=332, R32=352, R64=371, R128=391, Q=416,
Q3=431, Q2=449` PDF-Punkte). Jede Zahl einer Datenzeile wurde per Geometrie der nächstliegenden
Spalte zugeordnet (Toleranz ±12 pt) — nicht über die Reihenfolge im Textstrom. Die x-Positionen
sind über **alle vier** Fassungen identisch.

### 3a. Challenger Tour — Herren-Einzel (ATP-Ranglistenpunkte)

**Über alle vier Fassungen (2024, 2025-10feb, 2025-23dec, 2026) Zahl für Zahl identisch.**

| Tier | W | F | SF | QF | R16 | 1. Rd (R32) | Quali Q | Quali Q2 |
|---|---|---|---|---|---|---|---|---|
| Challenger 175 | 175 | 90 | 50 | 25 | 13 | **0** | 6 | 3 |
| Challenger 125 | 125 | 64 | 35 | 16 | 8 | **0** | 5 | 3 |
| Challenger 100 | 100 | 50 | 25 | 14 | 7 | **0** | 4 | 2 |
| Challenger 75 | 75 | 44 | 22 | 12 | 6 | **0** | 4 | 2 |
| Challenger 50 | 50 | 25 | 14 | 8 | 4 | **0** | 3 | 1 |

- **Fundstelle je Zahl:** 2024 S. 254 · 2025 S. 265 · 2026 S. 272–273 (Ch 50 auf 273). Werte
  jahrgangsübergreifend gleich → eine Zeile deckt alle drei relevanten Jahre.
- **1. Runde = 0:** Die Tabelle listet keine R32/R64/R128-Punkte für Challenger. Niedrigste
  Hauptfeld-Punkte = R16. Erstrundenverlust gibt **0** (Regel §3d, G.2).
- **Keine Feldgrößen-Abhängigkeit:** anders als ATP Tour 250/500 (dort getrennte „–48 Draw" /
  „–32 Draw"-Zeilen) hat Challenger **eine** Zeile je Tier. Die frühere offene Frage (32er vs.
  48er-Draw) ist damit beantwortet: **keine** Punkt-Differenzierung nach Draw-Größe.
- **Quali Q / Q2:** Spaltenüberschrift der Quali-Blöcke ist „Q Q3 Q2". Challenger füllt **Q** und
  **Q2** (Q3 leer). Diese Quali-Punkte gibt es **nur bei Challenger, nicht bei ITF** (Regel §3d,
  G.3) und **zusätzlich** zu den Hauptfeld-Punkten.

### 3b. ITF Men's WTT (M15/M25) — Herren-Einzel im **ATP-Ranking** (Hauptfeld)

Dies sind die **ATP-Ranglistenpunkte** fürs Hauptfeld dieser ITF-Turniere (nicht die ITF-WTR-
Punkte aus §2 — die gibt es im Hauptfeld nicht). Bestätigt §2c: **Hauptfeld = ATP-Punkte.**

| Kategorie | Jahrgang | W | F | SF | QF | R16 | 1. Rd | Quali |
|---|---|---|---|---|---|---|---|---|
| M25 / M25+H | **2024 + 2025** | 25 | 16 | 8 | 3 | 1 | **0** | – |
| M25 / M25+H | **2026** | 25 | **14** | **7** | 3 | 1 | **0** | – |
| M15 / M15+H | 2024 + 2025 + 2026 | 15 | 8 | 4 | 2 | 1 | **0** | – (unverändert) |

- **Fundstelle:** M25/M15 2024 S. 254 · 2025 S. 265 · 2026 S. 273.
- **2026-Änderung M25 (bestätigt):** Finalist (F) **16 → 14**, Halbfinale (SF) **8 → 7**. W/QF/R16
  unverändert. Quelle: 2024 S. 254 (16/8) vs. 2026 S. 273 (14/7).
- **M15 unverändert** über alle drei Jahre (2024 S. 254 = 2026 S. 273: W15 F8 SF4 QF2 R16-1).
- **Quali = „–":** Für ITF sind die Quali-Spalten leer — Qualifikanten bekommen bei ITF **keinen**
  Bonus (Regel §3d, G.3-Ausnahme). +H (Hospitality) ändert die **ATP-Punkte nicht**; die Tabelle
  führt M25 und M25+H in **einer** Zeile.

### 3c. Der kritische Punkt — Spaltenzuordnung R64 vs. Q (eindeutig geklärt)

Die Frage war: Challenger 175 hat im Textfluss sieben Werte `175 90 50 25 13 6 3` — ist der letzte
(3) ein **R64**-Wert oder ein **Quali**-Wert? **Antwort per Geometrie: es sind Quali-Punkte, kein
R64.** Die zwei letzten Werte liegen bei x=416 und x=451:

| Wert | x-Position im PDF | nächste Kopfspalte (x) | → Spalte |
|---|---|---|---|
| 175 | 241 | W (247) | W |
| 90 | 266 | F (271) | F |
| 50 | 292 | SF (292) | SF |
| 25 | 313 | QF (312) | QF |
| 13 | 334 | R16 (332) | R16 |
| 6 | 416 | **Q (416)** | **Q** |
| 3 | 451 | **Q2 (449)** | **Q2** |

Die Spalten **R32 (352), R64 (371), R128 (391) sind leer** — dort steht in der Zeile kein Wert.
Der Sprung von x=334 (R16) direkt auf x=416 (Q) überspringt die drei mittleren Spalten. Damit ist
`6` = **Q** und `3` = **Q2**, **nicht** R64. Das ist plausibel: Challenger-Hauptfelder sind 32er-
(teils 48er-)Draws ohne R64/R128, und der Erstrundenverlust gibt 0 (G.2) — es *kann* dort keinen
R64-Wert geben. **Identisch geprüft für alle Tiers und alle vier Fassungen** (die Quali-Werte
liegen durchgängig bei x≈416/451, nie bei x≈371). Nicht geraten — aus den tatsächlichen
Spaltenpositionen abgelesen.

### 3d. Regelfakten (mit Fundstelle, Jahrgang + gedruckte Seite)

Aus dem Fließtext des Kapitels 9 (wörtlich geprüft), relevant für den Rechner:

1. **Kein Punkt für Erstrundenverlust bei Challenger und ITF.** Wortlaut: *„No points are awarded
   for a first round loss at ATP Tour 500 & 250 events, ATP Challenger Tour or ITF Men's WTT
   events."* — **Regel 9.03 G.2**, 2024 **S. 254**, 2026 **S. 272**.
2. **Qualifikanten: Bonuspunkte bei Challenger, KEINE bei ITF.** Wortlaut: *„Players qualifying for
   the main draw through the qualifying competition shall receive qualifying points in addition to
   any points earned, as per the following table, **with the exception of ITF Men's WTT events**."*
   — **Regel 9.03 G.3**, 2024 **S. 254**, 2026 **S. 272**. (Deckt sich mit §3a: Challenger hat
   Q/Q2-Werte, ITF nicht.)
3. **Zählende Ergebnisse: 2024/2025 „best seven", 2026 „best six".** 2024/2025: *„… his best seven
   (7) results from the United Cup, all ATP Tour 500, ATP Tour 250, ATP Challenger Tour and …"* —
   2024 **S. 250**. 2026: *„… his best six (6) results …"* — 2026 **S. 268**. (Zählregel, Abschnitt
   9.03 A/B — die Zahl der zählenden Nicht-Pflicht-Turniere sinkt 2026 von 7 auf 6.)
4. **ITF-Turniere kommen erst am zweiten Montag nach der Turnierwoche ins System.** Wortlaut:
   *„ITF tournaments … are only entered into the system on the second Monday following the
   tournament's week."* — **Regel 9.01 E**, 2024 **S. 249**, 2026 **S. 267**. (Wichtig für die
   zeitliche Verbuchung im Rechner: ITF-Punkte werden ~2 Wochen verzögert wirksam.)

---

## 4. Was noch offen ist

1. ~~Zugang zu den ATP-Kapitel-9-PDFs~~ — **erledigt.** Alle vier Fassungen (2024, 2025×2, 2026)
   lokal ausgelesen, §3 vollständig befüllt (fünf Challenger-Tiers + M15/M25-Hauptfeld, alle drei
   Jahrgänge, Regelfakten mit Fundstelle). Feldgrößen-Frage beantwortet: keine 32/48-Differenzierung
   bei Challenger.
2. **2026-ITF-WTR-Ranglistenpunkte** (nur Quali): standalone `itf-points-tables-2026.pdf` existiert
   nicht (404); im `2026-wtt-regulations.pdf` war nur die Preisgeld-Tabelle extrahierbar. Ob die
   ITF-**WTR**-Quali-Punkte (§2a) 2026 unverändert sind: **offen**. **Für den Hauptfeld-Rechner
   irrelevant** — im Hauptfeld zählen ATP-Punkte (§3b), die für 2026 vollständig belegt sind.

## 5. Offene Produktfrage (NICHT selbst entschieden)

**Soll der Rechner die wenigen ITF-WTR-Qualifikationspunkte (M15 2 / M15+H 3 / M25 3 / M25+H 4,
FRQ je 1) überhaupt anzeigen — oder ausschließlich ATP-Ranglistenpunkte führen?**

Hintergrund (§2c): Im Hauptfeld gibt es nur ATP-Punkte; die ITF-WTR-Punkte sind eine separate,
sehr kleine Größe, die nur in der Qualifikation anfällt und nicht mit dem ATP-Ranking verrechnet
wird. Zwei Optionen, bewusst hier **nicht** entschieden:
- **A) Nur ATP-Punkte** — ein System, einfacher, deckt die relevante Saison-/Rangrechnung ab;
  die ITF-WTR-Quali-Punkte werden gar nicht angezeigt.
- **B) ATP-Punkte + ITF-WTR-Quali getrennt ausweisen** — vollständiger, aber zwei nicht
  verrechenbare Größen in der UI, mit Erklärungsbedarf.

*Erstellt als reine Recherche/Doku. Kein Code, keine Tabelle im Repo-Datenpfad angelegt.*
