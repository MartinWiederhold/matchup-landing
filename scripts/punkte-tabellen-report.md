# Ranglistenpunkte je Runde — Recherche-Bericht

> **STATUS (bekannte Lücke, nicht übersehen):** ITF verifiziert. **ATP Kapitel 9 (PIF ATP
> Rankings, Jahrgänge 2024/2025/2026) ist host-seitig blockiert — HTTP 403 (Akamai/WAF), sowohl
> per Fetch-Dienst als auch per `curl`.** Der Zugang wird **manuell beschafft** (Nutzer legt die
> PDFs lokal ab, dann werden die Zahlen lokal ausgelesen). Bis dahin bleiben die Challenger-Tiers
> (50/75/100/125/175) und die M15/M25-Hauptfeldpunkte in §3 offen — bewusst nicht geschätzt.

> **Zweck:** Belegte Punktetabellen (Runde → Punkte) für den geplanten /tour-Punkte-Rechner
> (erzielte Punkte aus Matchergebnis + Kategorie, 52-Wochen-Verfall). Nur belegte Zahlen —
> nichts geschätzt, abgeleitet oder interpoliert.
>
> **Status: UNVOLLSTÄNDIG.** Die ITF-Zahlen sind aus der offiziellen ITF-PDF verifiziert.
> Die **ATP-Regelwerk-PDFs (Primärquelle für ALLE Challenger-Tiers und für die M15/M25-
> HAUPTFELD-Punkte) sind nicht erreichbar** (HTTP 403). Diese Tabellen sind daher unten
> ausdrücklich als „Quelle nicht erreichbar" markiert und NICHT befüllt. Auf Sekundärquellen
> (Wikipedia, Blogs) wurde bewusst NICHT ausgewichen (Vorgabe).

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

## 3. ATP Challenger Tour + M15/M25 (ATP-Ranking) — QUELLE NICHT ERREICHBAR

Die Punkte je Runde für **Challenger 50 / 75 / 100 / 125 / 175** sowie die **Hauptfeld-Punkte
für M15/M25 im ATP-Ranking** stehen im ATP-Regelwerk, Kapitel 9 „PIF ATP Rankings". Dieses PDF
ist **nicht erreichbar** (HTTP 403, siehe §1). Es wurde bewusst **nichts** aus Sekundärquellen
oder aus dem Gedächtnis eingetragen.

| Kategorie | W | F | SF | QF | R16 | R32/R1 | Quali | Feldgröße-abhängig? |
|---|---|---|---|---|---|---|---|---|
| Challenger 175 | — Quelle nicht erreichbar — | | | | | | | ? |
| Challenger 125 | — Quelle nicht erreichbar — | | | | | | | ? |
| Challenger 100 | — Quelle nicht erreichbar — | | | | | | | ? |
| Challenger 75 | — Quelle nicht erreichbar — | | | | | | | ? |
| Challenger 50 | — Quelle nicht erreichbar — | | | | | | | ? |
| M25 (ATP-Ranking, Hauptfeld) | — Quelle nicht erreichbar — | | | | | | | ? |
| M15 (ATP-Ranking, Hauptfeld) | — Quelle nicht erreichbar — | | | | | | | ? |

**Offene Fragen, die nur die ATP-PDF beantwortet** (bewusst NICHT geraten):
- Genaue Punkte je Runde für alle fünf Challenger-Tiers und für M15/M25 (Hauptfeld).
- **Feldgrößen-Abhängigkeit:** Challenger haben 32er- **und** 48er-Draws (mit zusätzlicher R32-
  Runde). Ob und wie die Punkte je Feldgröße differieren — ungeklärt, weil Quelle fehlt.
- **Qualifikationspunkte** im ATP-Ranking für diese Kategorien.
- **Fassungen 2024 / 2025 / 2026:** Es existieren getrennte Kapitel-9-PDFs je Jahr (URLs in §1).
  Der Rechner muss historische Ergebnisse verarbeiten, also sind **alle drei Jahrgänge** zu
  belegen. Insbesondere: Die Challenger-Tier-Struktur (50/75/100/125/175) wurde 2023 eingeführt;
  ob sich Punktwerte zwischen 2024, 2025 und 2026 unterscheiden, ist **offen** bis zur PDF.

---

## 4. Was zur Fertigstellung fehlt

1. **Zugang zu den ATP-Kapitel-9-PDFs** (2024, 2025, 2026). Die Dateien sind öffentlich, aber
   die WAF von `atptour.com` blockiert automatisierten Zugriff (403). Nutzer legt die PDFs lokal
   ab → dann werden die Zahlen wie bei der ITF-PDF lokal ausgelesen und §3 vollständig befüllt
   (alle fünf Challenger-Tiers + M15/M25-Hauptfeld, Feldgrößen 32/48, Jahrgänge 2024/25/26).
2. **2026-ITF-WTR-Ranglistenpunkte** (Quali): standalone `itf-points-tables-2026.pdf` existiert
   nicht (404); im `2026-wtt-regulations.pdf` war nur die Preisgeld-Tabelle extrahierbar. Ob die
   Quali-Punkte 2026 unverändert sind: **offen** (Primärquelle noch nicht sauber lesbar).

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
