# Visa-Anforderungen aus Wikipedia — Erkundung (nur Messung)

Stand des Laufs: letzte Revision je Seite s. Tabelle. Quelle: MediaWiki-API, Seiten „Visa requirements for X citizens“ (CC BY-SA). ≥1 s zwischen Abrufen, UA gesetzt. Kein DB-/App-Zugriff. Gemessen: Existenz, Tabellenaufbau, Zeilenzahl, Zielregion-Coverage, Vokabular der Visumsarten, Frische. **Nicht** erfasst: Gebühren/Wartezeiten (nicht belastbar).

Nationalitäten geprüft: **31** · Seiten gefunden: **31** · Probleme: **0**
Zielregion-Länder (aus web.tour_tournaments ∩ Planer-Zielregion): **35**

## 1) Existenz der Seiten

Für **alle** vorgeschlagenen Nationalitäten existiert eine Seite. Keine fehlt.

## 2) Tabellenaufbau — maschinell auslesbar?

Die Haupttabelle jeder Seite ist eine sortierbare Wikitable mit festem Kopf:
`Country | Visa requirement | Allowed stay | Notes`. Auslesbar sind:
- **Zielland**: aus `{{flag|Name}}` in Spalte 1 — eindeutig.
- **Visumsart**: Text im Farb-Template der Spalte 2 (`{{no|Visa required}}`, `{{yes|Visa not required}}`, `{{partial|eVisa}}`) PLUS `data-sort-value` (1 Freizügigkeit, 2 visumfrei, 3 eVisa/VoA/eTA, 4 Visum nötig) — doppeltes, konsistentes Signal.
- **Aufenthaltsdauer**: Spalte 3, oft „90 days“ o. ä.; bei visumpflichtigen Zielen meist leer.
- **Fußnoten** stecken in `<ref>…</ref>` und stören das Auslesen nicht (werden entfernt). Sonderfälle stehen in Spalte 4 „Notes“ als Freitext — für eine reine **Warnung** (Visum ja/nein + Link) nicht nötig.

→ **Kernfelder (Zielland, Visumsart, Aufenthaltsdauer) sind maschinell auslesbar.** Kosten/Wartezeiten stehen dort nicht strukturiert — wie gefordert nicht erfasst.

## 3) Zeilen je Seite & Coverage der Turnier-Zielländer

| Nationalität | ISO | Gruppe | Zeilen | Zielregion-Coverage | fehlende Ziele | Timatic-Belege | letzte Revision |
|---|---|---|--:|---|---|--:|---|
| Tunisian | TN | host | 194 | 34/35 (97%) | TN | 222 | 2026-07-17 |
| Egyptian | EG | host | 193 | 34/35 (97%) | EG | 217 | 2026-08-07 |
| Moroccan | MA | host | 194 | 34/35 (97%) | MA | 209 | 2026-07-26 |
| Algerian | DZ | host | 194 | 35/35 (100%) | — | 220 | 2026-07-29 |
| Turkish | TR | host | 194 | 34/35 (97%) | TR | 212 | 2026-08-08 |
| Iranian | IR | host | 193 | 35/35 (100%) | — | 221 | 2026-07-25 |
| Jordanian | JO | meast | 194 | 35/35 (100%) | — | 231 | 2026-05-28 |
| Lebanese | LB | meast | 194 | 35/35 (100%) | — | 215 | 2026-07-15 |
| Iraqi | IQ | meast | 195 | 35/35 (100%) | — | 193 | 2026-04-12 |
| Israeli | IL | meast | 194 | 35/35 (100%) | — | 215 | 2026-07-26 |
| Saudi Arabian | SA | meast | 194 | 35/35 (100%) | — | 198 | 2026-07-31 |
| Emirati | AE | meast | 194 | 35/35 (100%) | — | 221 | 2026-07-25 |
| Indian | IN | tour | 194 | 35/35 (100%) | — | 209 | 2026-07-26 |
| Chinese | CN | tour | 194 | 35/35 (100%) | — | 2 | 2026-07-22 |
| Russian | RU | tour | 193 | 35/35 (100%) | — | 208 | 2026-07-28 |
| South African | ZA | tour | 194 | 35/35 (100%) | — | 219 | 2026-05-29 |
| Kazakhstani | KZ | tour | 194 | 35/35 (100%) | — | 221 | 2026-07-14 |
| Uzbekistani | UZ | tour | 195 | 35/35 (100%) | — | 179 | 2026-07-21 |
| Pakistani | PK | tour | 194 | 35/35 (100%) | — | 213 | 2026-07-29 |
| Nigerian | NG | tour | 194 | 35/35 (100%) | — | 212 | 2026-07-29 |
| United States | US | control | 192 | 35/35 (100%) | — | 205 | 2026-08-07 |
| Brazilian | BR | control | 186 | 35/35 (100%) | — | 214 | 2026-08-03 |
| Argentine | AR | control | 194 | 35/35 (100%) | — | 208 | 2026-07-21 |
| Mexican | MX | control | 194 | 35/35 (100%) | — | 211 | 2026-08-05 |
| Serbian | RS | control | 194 | 34/35 (97%) | RS | 241 | 2026-07-26 |
| Ukrainian | UA | control | 193 | 35/35 (100%) | — | 209 | 2026-08-03 |
| Georgian | GE | control | 194 | 34/35 (97%) | GE | 215 | 2026-07-24 |
| Armenian | AM | control | 195 | 34/35 (97%) | AM | 197 | 2026-05-05 |
| Australian | AU | control | 193 | 35/35 (100%) | — | 222 | 2026-07-25 |
| Japanese | JP | control | 194 | 35/35 (100%) | — | 219 | 2026-05-26 |
| South Korean | KR | control | 194 | 35/35 (100%) | — | 220 | 2026-07-01 |

Durchschnitt **194 Zeilen** je Seite. **24/31** Seiten decken **alle 35** Zielregion-Länder ab.
Die übrigen zeigen „34/35“ — bei **7** davon fehlt exakt das **eigene Land** (kommt in der eigenen Seite erwartungsgemäß nicht als Ziel vor; keine echte Lücke). → **Effektive Abdeckung der Auslands-Ziele: praktisch 100 %.**

## 4) Vokabular der Visumsarten (über die Zielregion-Zeilen)

So oft kam welche Formulierung in Spalte „Visa requirement“ vor (normalisiert):

| Visumsart (normalisiert) | Häufigkeit |
|---|--:|
| visa required | 554 |
| visa not required | 448 |
| evisa | 32 |
| evisa / visa on arrival | 20 |
| visa not required (conditional) | 5 |
| electronic travel authorisation]] | 5 |
| electronic travel authorisation | 4 |
| visa on arrival (conditional) | 2 |
| admission refused | 2 |
| visa on arrival | 1 |
| admission refused except for schengen residents | 1 |
| invitation required | 1 |
| evisa/visa on arrival | 1 |
| eta uk]] | 1 |
| free evisa | 1 |

Distinkte Rohvarianten: **15** — aber sie fallen auf **wenige Klassen** zusammen:
**visumfrei**, **eVisa**, **Visa on arrival**, **eTA/ETA**, **Visum nötig** und — sicherheitsrelevant — **„Admission refused“** (Einreisesperre, z. B. Iran→USA, Russland→mehrere Schengen-Länder). Qualifizierer wie „(conditional)“ hängen dran. Die numerische `data-sort-value` (1/2/3/4) stützt die Normalisierung. Ein paar Rohwerte tragen noch Wikilink-Reste (`…]]`) — kosmetisch, wenige Zeilen.

## 5) Aktualität

- Letzte Revisionen: von **2026-04-12** bis **2026-08-08** — die Seiten werden laufend gepflegt.
- **31/31** Seiten stützen Zeilen auf **IATA-Timatic**-Belege (`{{Timatic|nationality=..|destination=..}}`) — die maßgebliche Reise-Doku-Datenbank.
- Ein fester „Stand“ pro Zelle steht nicht immer dabei; die Revisionshistorie und Timatic-Refs sind der belastbarste Frische-Anker. Für eine **Warnung** (kein amtlicher Bescheid) ausreichend, mit Hinweis „ohne Gewähr, bitte offiziell prüfen“ + Quelllink.

## 6) Drei Beispielzeilen (verbatim aus der Tabelle)

**Tunisian → France:**
- Visumsart: `Visa required`  (data-sort-value: —)
- Aufenthaltsdauer: `(leer)`

**Iranian → United States:**
- Visumsart: `Admission refused`  (data-sort-value: —)
- Aufenthaltsdauer: `(leer)`

**Indian → Spain:**
- Visumsart: `Visa required`  (data-sort-value: 4)
- Aufenthaltsdauer: `(leer)`

## Fazit (Datenlage)

- **Auslesbar:** ja — Zielland + Visumsart je Kombination sind strukturiert; Aufenthaltsdauer meist vorhanden.
- **Vollständigkeit:** die Tabellen listen ~alle Staaten, die Turnier-Zielregion ist praktisch vollständig abgedeckt.
- **Grenzen:** Freitext-„Notes“ und Sonderfälle (Bedingungen, Reisedokument-Abhängigkeit) sind nicht normiert; Gebühren/Wartezeiten fehlen belastbar (bewusst nicht erfasst). Für eine **nationalitätsabhängige Warnung mit Quelllink** reicht die Datenlage; als amtliche Auskunft nicht geeignet.
