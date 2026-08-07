# Bild-Zuordnung: tennis-point-Schlägerbilder ↔ web.rackets (Messung)

**Stand:** 2026-08-06 · **Art:** reine Messung — **nichts kopiert, verschoben, umbenannt; nichts in die DB geschrieben.**

## Herkunft der Bilder (bitte überall mitführen, wo die Bilder später genutzt werden)
Die Bilder unter `~/Downloads/tennis-point-schlaeger/` stammen laut Auftraggeber von
**tennis-point.ch**, für die eine **Nutzungserlaubnis bestehen soll**. Diese Herkunft
und die *behauptete* Erlaubnis sind vor jeder Verwendung zu prüfen und im Code/Asset
zu vermerken (Quelle + Erlaubnis), damit später niemand rätselt.

## 1. Bestand
- **Dateien gesamt:** 3108 (alle `.jpg`)
- **Distinkte Schläger (nach Entfernen der Bildnummer `_N` / `_N-2`):** **699**
- Normalisiert (Marke + Modell, Deskriptoren entfernt) fallen einige zusammen → **570** distinkte Modelle
- 70 Dateien ohne Bildnummer (Einzelansicht, oft Bundles „2x … plus Schlägertasche")

## 2. Marken (nach Dateien)
| Marke (Datei) | Dateien | im Katalog? |
|---|---:|---|
| Wilson | 1055 | ja (73) |
| HEAD | 536 | ja (122) |
| Babolat | 475 | ja (47) |
| Tecnifibre | 285 | ja (34) |
| Prince | 256 | ja (34) |
| Dunlop | 204 | ja (25) |
| Yonex | 187 | ja (30) |
| PROKENNEX | 60 | ja (Pro Kennex, 29) |
| Racket-Roots | 50 | **nein** |

Umgekehrt: Katalog-Marken **ohne** Bilder → **Solinco (6)** und **Lacoste (2)** = 8 Einträge
können strukturell nie ein Bild bekommen.

## 3. Zuordnung der 402 Katalogeinträge
Methode: **Marke + normalisierter Modellname**. Normalisierung: Kleinschreibung,
Umlaute aufgelöst (ä→ae …), Klammern + Inhalt entfernt (z. B. `(300g)`), Bindestriche/
Punkte zu Leerzeichen, Füllwörter entfernt (`raquette`, `besaitet`, `unbesaitet` **plus**
die Kategorie-Deskriptoren `turnierschläger/allroundschläger/testschläger/kinderschläger/
tns`, die kein Modellname sind). Anker ist **exakte Token-Gleichheit** — bewusst nicht
Teilmenge, damit „Muse 100" nicht fälschlich auf „Muse 100 **L**" trifft.

| Ergebnis | Anzahl | Anteil |
|---|---:|---:|
| **Eindeutig** (genau ein exakter Treffer) | **125** | 31 % |
| **Unsicher / mehrdeutig** (nur nahe Teilmenge, ≥1 Kandidat, aber Tokens weichen ab) | **156** | 39 % |
| **Gar nicht gefunden** | **121** | 30 % |

> „Mehrdeutig im engen Sinn" (zwei *identische* Bildnamen für einen Katalogeintrag) = **0** —
> die exakte Gleichheit ist sauber. Das Risiko sitzt im Bucket **Unsicher**: dort weicht
> genau ein Token ab (Version `V1`, Jahr, `Pro`, `100` vs `100L`), und *manchmal* ist das
> derselbe Schläger, *manchmal* ein anderer. Genau hier wäre Auto-Zuordnung gefährlich.

## 4. Beispiele

### 10, die eindeutig passen (Katalog ⇄ Bild-Basisname)
| Katalog | Bild |
|---|---|
| Yonex Muse 100 (295g) | Muse-100-Allroundschläger |
| Wilson Blade 100 V10 US Open 2026 (300g) | Blade-100-V10-US-Open-2026-Turnierschläger-unbesaitet |
| Head Extreme MP XL 2026 (300g) | Extreme-MP-XL-2026-Turnierschläger-unbesaitet |
| Head Extreme MP UL 2026 (260g) | Extreme-MP-UL-2026-Allroundschläger-Testschläger |
| Head Extreme Elite 2026 (260g) | Extreme-Elite-2026-Allroundschläger-besaitet |
| Head Extreme Team 2026 (265g) | Extreme-Team-2026-Allroundschläger-Testschläger |
| Head Extreme MP L 2026 (280g) | Extreme-MP-L-2026-Turnierschläger-unbesaitet |
| Head Extreme MP 2026 (300g) | Extreme-MP-2026-Turnierschläger-unbesaitet |
| Head Extreme Pro 2026 (305g) | Extreme-Pro-2026-Turnierschläger-unbesaitet |
| Head Speed MP 2026 (300g) | Speed-MP-2026-Turnierschläger-unbesaitet |

### 10, die nicht passen — mit Grund
| Katalog | warum kein Treffer |
|---|---|
| Head Speed MP 2024 (300g) | Bilder haben Speed MP 2022/2025/2026, **nicht** 2024 (Jahr) |
| Yonex Muse 100L (280g) | Bild „Muse-100-L" vorhanden, aber Token `l` unterscheidet → korrekt getrennt (kein Fehlmatch mit „Muse 100") |
| Solinco Black Out 300 v2 (300g) | Marke Solinco **gar nicht** im Bildordner |
| Wilson Pro Staff 97L Classic (290g) | keine passende Modell-Kombination in den Bildern |
| Yonex Junior Ocean Blue 23 (200g) | Junior-Benennung weicht ab |
| Yonex Ezone Alpha 275g 2025 | Katalogname trägt Gewicht als Token, Bild anders benannt |
| Wilson Burn 100S V6 (300g) | Version/Modell nicht in dieser Form in den Bildern |
| Lacoste L23 (300g) | Marke Lacoste **gar nicht** im Bildordner |
| Head Radical MP 2023 (300g) | Jahr 2023 fehlt in den Bildern |
| Wilson Clash 100UL V3 Reverse (265g) | Variantenkette (`100UL`, `Reverse`) weicht ab |

### Unsicher (Gefahrenzone) — je ein Token daneben
- Wilson **Defyer 98 Pro** ⇄ Bild „Defyer-98-Pro-**V1**" *und* Bundle „2x-Defyer-98-Pro-V1-plus-Schlägertasche" → wahrscheinlich derselbe, aber `V1`/Bundle unklar.
- Wilson **Clash 100 V3 Reverse** ⇄ „Clash-100-V3.0-Reverse" *und* „Clash-100-**Pro**-V3.0-Reverse" → zwei Kandidaten, einer ist das **Pro**-Modell (anderer Schläger).

## 5. Einschätzung: automatisch oder Handarbeit?
**Teils-teils — automatisch nur für die 125 exakten Treffer (31 %), der Rest von Hand.**

- Die **125 eindeutigen** sind über exakte Marke+Modell+Jahr belegt und tragfähig zum Auto-Zuordnen.
- Die **156 unsicheren** dürfen **nicht** automatisch zugeordnet werden: Es hängt an einem einzelnen Token (`V1`, Jahr, `Pro`, `100` vs `100L`), und eine Fehlzuordnung ist schlimmer als keine — der Katalog zeigte sonst das falsche Foto. Diese Liste ist ein guter **Vorschlags-Kandidatensatz für die manuelle Bestätigung** (1-Klick „ja/nein"), aber keine Automatik.
- Die **121 fehlenden** (inkl. 8 Einträge der Marken Solinco/Lacoste ohne Bilder, plus Jahr-/Versionslücken) bleiben ohne Bild, bis es passende Aufnahmen gibt.

**Empfehlung:** exakte 125 automatisch übernehmen, die 156 unsicheren als kuratierten Vorschlags-Screen manuell abhaken, den Rest offen lassen. Nichts raten.
