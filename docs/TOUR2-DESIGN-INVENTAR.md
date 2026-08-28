# /tour2 — Design-Ist-Zustand

Erhoben am 2026-08-28 gegen `feature/matchup-webapp`. Reine Bestandsaufnahme,
kein Änderungsvorschlag. Wo etwas nicht abschließend feststellbar war, steht
„unklar" statt einer Vermutung.

Datei-Referenzen sind `pfad:zeile` — Zeilen sind ungefähr, aber im typischen
Editor direkt anspringbar.

---

## 1. Routen und Dateien

### 1.1 Öffentliche Routen und die Ansicht dahinter

| Route | Wrapper (page.tsx) | Ansicht / Zieldatei | Zeilen | RSC? |
|---|---|---|---:|---|
| `/tour2` | `src/app/tour2/page.tsx` | `components/home/HomeView.tsx` | **816** | Client (`"use client"`) |
| `/tour2/finder` | `finder/page.tsx` | `tournaments/TournamentsView.tsx` | **553** | Client |
| `/tour2/season` | `season/page.tsx` | `components/planner/SeasonWorkspace.tsx` | **1363** | Client |
| `/tour2/ranking` | `ranking/page.tsx` | `points/components/PointsView.tsx` | 230 | Client |
| `/tour2/travel` | `travel/page.tsx` | `travel/TravelHub.tsx` | 306 | Client |
| `/tour2/documents` | `documents/page.tsx` | `documents/DocumentsView.tsx` | 228 | Client |
| `/tour2/network` | `network/page.tsx` | `network/NetworkView.tsx` | 197 | Client |
| `/tour2/profile` | `profile/page.tsx` | `setup/ProfileView.tsx` | 201 | Client |
| `/tour2/calendar` | `calendar/page.tsx` | `calendar/components/CalendarWeek.tsx` | 368 | Client |
| `/tour2/timeline` | `timeline/page.tsx` (Subpage-Wrapper) | `timeline/components/TimelineView.tsx` | **443** | Client |
| `/tour2/costs` | `costs/page.tsx` (Subpage-Wrapper) | `costs/components/CostsView.tsx` | ~140 | Client |
| `/tour2/expenses` | `expenses/page.tsx` (Subpage-Wrapper) | `expenses/components/ExpensesTourView.tsx` | 239 | Client |
| `/tour2/finance` | `finance/page.tsx` → redirect `/tour2/travel` | (siehe `finance/FinanceView.tsx`, 244) | 244 | Client |
| `/tour2/schengen` | `schengen/page.tsx` (Subpage-Wrapper) | `schengen/components/SchengenView.tsx` | 192 | Client |
| `/tour2/form` | `form/page.tsx` (Subpage-Wrapper) | `form/FormView.tsx` | 197 | Client |
| `/tour2/wildcards` | `wildcards/page.tsx` → redirect `/tour2/network` | (siehe `wildcards/WildcardsView.tsx`, 277) | 277 | Client |
| `/tour2/tournaments` | redirect `/tour2/finder` | — | — | Server |
| `/tour2/points` | redirect `/tour2/ranking` | — | — | Server |
| `/tour2/pipeline` | redirect `/tour2/season` (Ansicht `pipeline/PipelineView.tsx`, 186) | — | 186 | Client |
| `/tour2/browse` | redirect `/tour2/finder` | — | — | Server |
| `/tour2/map` | redirect `/tour2/finder` (Ansicht `map/components/TourMapView.tsx`, 159) | — | 159 | Client |
| `/tour2/planner?id=…` | redirect `/tour2/season/…` | — | — | Server |
| `/tour2/setup` | redirect `/tour2/profile` | — | — | Server |

Die `Redirect`-Wrapper zeigen: bereits gebaute Ansichten (`FinanceView`,
`WildcardsView`, `PipelineView`, `TourMapView`) sind **nicht mehr aktiv
verlinkt**, existieren aber weiter im Bundle. Kandidaten zum Aufräumen.

### 1.2 Layout / Shell / gemeinsame Komponenten

| Datei | Zweck | Zeilen |
|---|---|---:|
| `src/app/tour2/layout.tsx` | Wurzel-Layout, lädt Instrument Sans, wickelt AuthProvider | 30 |
| `src/app/tour2/tour2.css` | 98 selbstdefinierte `.t2-*`-Klassen, Farb- und Radius-Variablen | **686** |
| `src/app/tour2/components/shell/Tour2Shell.tsx` | Desktop-Rail + Mobile-Header, Nav-Zustand, Sprach-Switcher | 294 |
| `src/app/tour2/components/shell/Tour2TabBar.tsx` | Mobile-untere-Tab-Leiste | 79 |
| `src/app/tour2/components/Tour2Subpage.tsx` | Rahmen für Werkzeug-Seiten (Titel, Untertitel, Back-Link) | 33 |
| `src/app/tour2/components/Tour2Area.tsx` | Prefetch-Hilfe für Bereichs-Wechsel | 27 |
| `src/app/tour2/components/Tour2Prefetch.tsx` | Route-Prefetch beim Sichtbarwerden | 22 |
| `src/app/tour2/components/Tour2ActionList.tsx` | Handlungsbedarf-Liste (Rot/Amber-Dots) | 70 |
| `src/app/tour2/components/TourLoginCard.tsx` | Login-Karte für nicht angemeldete Nutzer | 62 |
| `src/app/tour2/components/EntryDeadline.tsx` | Countdown-Anzeige an Karten | 144 |
| `src/app/tour2/components/TourDeadlineBlock.tsx` | Deadline-Info-Block | 84 |
| `src/app/tour2/components/TourDecideBlock.tsx` | Entscheidungs-Block | 92 |
| `src/app/tour2/components/home/DayGlance.tsx` | Heute/Morgen-Karte (aktuell nicht mehr gerendert) | 75 |
| `src/app/tour2/components/planner/*` | 9 Planer-Komponenten (Karte, Chat, Trainings-Slots, Turnierdetail …) | siehe unten |
| `src/app/tour2/components/setup/*` | 4 Onboarding-Schritte + Rahmen | ~350 |
| `src/app/tour2/components/t2Action.ts` | Route-Helper (`T2_SEASON`, `T2_FINDER` …) | 33 |
| `src/app/tour2/components/tourUi.ts` | UI-Helper (unklar wie viele Nutzer) | 25 |
| `src/app/tour2/components/t2ui.ts` | UI-Helper (unklar Abgrenzung zu tourUi.ts) | 41 |
| `src/app/tour2/t2mark.ts` | Performance-Markierungen (`t2markArea`, `t2markNavStart`) | 42 |

### 1.3 Dateien über 400 Zeilen — Aufteilungs-Kandidaten

| Datei | Zeilen |
|---|---:|
| `src/app/tour2/components/planner/SeasonWorkspace.tsx` | **1363** |
| `src/app/tour2/components/planner/TournamentDetail.tsx` | **1157** |
| `src/app/tour2/components/home/HomeView.tsx` | **816** |
| `src/app/tour2/tour2.css` | **686** |
| `src/app/tour2/tournaments/TournamentsView.tsx` | **553** |
| `src/app/tour2/timeline/components/TimelineView.tsx` | **443** |

`SeasonWorkspace.tsx` (1363 Zeilen, 1 Datei, 1 Komponente) und
`TournamentDetail.tsx` (1157 Zeilen) sind die klarsten Monolithen im Bereich.

---

## 2. Farben

### 2.1 CSS-Variablen `--t2-*` (Definitionsort: `src/app/tour2/tour2.css:3–19`)

| Variable | Wert | genutzt in n Dateien |
|---|---|---:|
| `--t2-paper` | `#ffffff` | 12 |
| `--t2-card` | `#ffffff` | 5 |
| `--t2-surface` | `#f3f3f1` | 25 |
| `--t2-ink` | `#0a0a0a` | 36 |
| `--t2-muted` | `#6b6b6b` | 51 |
| `--t2-faint` | `#9a9a9a` | 36 |
| `--t2-line` | `rgba(10,10,10,0.09)` | 39 |
| `--t2-line-strong` | `rgba(10,10,10,0.16)` | 9 |
| `--t2-accent` | `#4b3bf3` | 11 |
| `--t2-accent-hover` | `#3b2cd9` | 1 (nur in `.t2-cta:hover`) |
| `--t2-accent-soft` | `rgba(75,59,243,0.08)` | 3 |
| `--t2-radius` | `16px` | 1 |
| `--t2-radius-lg` | `22px` | 1 (**unklar wo aktiv genutzt**) |
| `--t2-shadow` | `0 1px 2px rgba(10,10,10,0.04), 0 12px 32px -12px rgba(10,10,10,0.12)` | 1 |
| `--t2-shadow-hover` | `0 2px 4px rgba(10,10,10,0.05), 0 30px 60px -20px rgba(10,10,10,0.22)` | 1 |
| `--t2-rail` | `175px` | 1 |
| `--t2-chrome` | `0px` | 1 |
| `--t2-font` | (Instrument-Sans-CSS-Variable, in `layout.tsx:11`) | 2 |

Zusätzlich in `src/app/globals.css:7–8`:

| Variable | Wert |
|---|---|
| `--matchup-blue` | `#4b3bf3` (dopplet mit `--t2-accent`) |
| `--matchup-blue-hover` | `#3b2cd9` (dopplet mit `--t2-accent-hover`) |

### 2.2 Direkt im Code stehende Farbwerte

**Hex (unterschiedliche Werte, alle Fundstellen im /tour2-Baum):**

| Hex | Häufigkeit | typisch benutzt für |
|---|---:|---|
| `#fff` / `#ffffff` | 18 + 2 = 20 | Weiß-Overlays, Rail-Text, Marker-Kern |
| `#4b3bf3` | 5 | Akzent-Duplikat zum CSS-Var |
| `#0a0a0a` | 2 | Ink-Duplikat |
| `#3b2cd9` | 1 | Akzent-Hover-Duplikat |
| `#f3f3f1` | 1 | Surface-Duplikat |
| `#e7e5e4` | 1 | Zone-D-Donut-Rest |
| `#d6d3d1` | 1 | Donut-Segment |
| `#a8a29e` | 1 | Donut-Segment |
| `#9a9a9a` | 1 | Faint-Duplikat |
| `#78716c` | 1 | Donut-Segment |
| `#6b6b6b` | 1 | Muted-Duplikat |
| `#888` | 1 | unklar (kurzform, vermutlich Legacy) |

**Distinkte Hex-Werte im /tour2-Baum: 12** (nach `#fff↔#ffffff`-Normalisierung).
Davon **8** dopplen bereits definierte CSS-Variablen (Duplikate statt Referenz).

**rgba/rgb-Literale (29 unterschiedliche Tuple):**
- 10 × `rgba(255,255,255, …)` mit 10 verschiedenen Alphas (0.08, 0.1, 0.12, 0.14, 0.15, 0.18, 0.2, 0.28, 0.62, 0.82, 0.85, 0.86) — praktisch alle in `tour2.css` im Rail-/Overlay-Kontext.
- 10 × `rgba(10,10,10, …)` mit unterschiedlichen Alphas (0.04, 0.05, 0.09, 0.12, 0.16, 0.22, 0.25, 0.4, 0.92) — Karten-Schatten, Linien.
- 5 × `rgba(0,0,0, …)` (0.05, 0.06, 0.18, 0.25, 0.3, 0.6) — vermischt mit obigen semantisch identisch, aber anderer Schreibweise.
- 2 × `rgba(75,59,243, …)` — Akzent-Halo.

**Distinkte rgba-Werte: 29.**

**Tailwind-Bracket-Werte** (`bg-[#…]`, `text-[rgba(…)]`): **0 Fundstellen** — kein
neuer Farbwert wird als Arbitrary-Value in JSX gesetzt.

### 2.3 Tailwind-Farbklassen nach Familie

Insgesamt **47** unterschiedliche `text|bg|border|ring|from|to|via|fill|stroke`-`Familie`-`Ton`-Kombinationen. Nach Familie zusammengefasst (Präfix egal):

| Familie | Töne verwendet | häufigste Klasse (Fundstellen) |
|---|---|---|
| **neutral** | 200, 300, 400, 500, 600, 700, 800, 900 | `text-neutral-600` (23), `text-neutral-900` (20), `text-neutral-400` (20) |
| **amber** | 50, 100, 200, 500, 600, 700, 800 | `text-amber-700` (17), `bg-amber-500` (7 + 500/10-Alpha), `bg-amber-50` (8) |
| **emerald** | 50, 500, 600, 700 | `text-emerald-700` (13), `text-emerald-600` (12), `bg-emerald-500` (8) |
| **red** | 50, 200, 500, 600, 700, 800 | `text-red-500` (8), `text-red-700` (6), `bg-red-600` (2) |
| **rose** | 500, 600, 700 | `bg-rose-500` (4), `text-rose-600` (2) |
| **violet** | 500, 600 | `bg-violet-500`, `text-violet-600` |
| **sky** | 500, 600 | `bg-sky-500`, `text-sky-600` |
| **indigo** | 500 | `to-indigo-500` (1) |
| **matchup** (custom via `@theme inline`) | keine Töne | `text-matchup`, `border-matchup` (~10 Fundstellen kumuliert) |
| **white / black** | — | `border-white` (12), `border-black` (3) |

Distinkte Tone-Familie-Kombinationen (unabhängig vom Präfix `text|bg|…`): **33**.

### 2.4 Grand Total unterschiedliche Farbspezifikationen

| Kategorie | Wert |
|---|---:|
| CSS-Variablen `--t2-*` (Definitionen) | 18 (davon 4 Alpha-Nuancen `--t2-line/-strong`, `--t2-accent-soft`) |
| Direkte Hex-Werte (nach Normalisierung) | 12 |
| Direkte rgba-Werte | 29 |
| Tailwind-Farbklassen (Familie-Ton-Kombinationen) | 47 |
| **Zusammen (grobe Obergrenze, ohne Duplikat-Entdeckung über Varianten hinweg)** | **~106** |

Die tatsächliche visuelle Palette ist deutlich kleiner (viele rgba-Werte sind
Alpha-Varianten desselben Grundtons Ink/Weiß). Trotzdem liegt hier ein
klassisches „Palette gewachsen, nicht geplant"-Signal: **8 Hex-Werte doppeln
existierende CSS-Variablen**, und die drei Grau-Familien `neutral-*`,
`stone-*`(implizit über Hex `#78716c` etc.) und `--t2-muted/faint/line/ink`
laufen parallel.

---

## 3. Typografie

### 3.1 Schrift-Einbindung

| Schrift | Wo eingebunden | Wie |
|---|---|---|
| DM Sans | `src/app/layout.tsx:2, 9–12` | `next/font/google`, CSS-Variable `--font-dm-sans` |
| Instrument Sans | `src/app/tour2/layout.tsx:1, 9–13` | `next/font/google`, CSS-Variable `--t2-font`, Weights `400,500,600,700` |

Instrument Sans wird ausschließlich unter `/tour2` benutzt (Kommentar in
`layout.tsx:8`: „nur für /tour2, next/font"). Der Rest der App läuft auf
DM Sans. Font-Setup ist sauber und diskret — kein CSS-Import, kein lokales
`@font-face`.

### 3.2 Schriftgrößen

**Semantische Tailwind-Größen** (nur 4 verschiedene, sehr selten benutzt):

| Klasse | Fundstellen |
|---|---:|
| `text-sm` | 90 |
| `text-lg` | 13 |
| `text-xl` | 1 |
| `text-5xl` | 1 |

**Arbitrary-Pixel-Größen (`text-[Npx]`)** — der dominante Teil des Systems:

| Klasse | Fundstellen |
|---|---:|
| `text-[12px]` | 252 |
| `text-[11px]` | 170 |
| `text-[13px]` | 125 |
| `text-[14px]` | 36 |
| `text-[15px]` | 24 |
| `text-[10px]` | 19 |
| `text-[17px]` | 10 |
| `text-[18px]` | 8 |
| `text-[9px]` | 5 |
| `text-[16px]` | 4 |
| `text-[26px]` | 2 |
| `text-[22px]` | 2 |
| `text-[20px]` | 2 |
| `text-[2rem]` | 2 |
| `text-[32px]` | 1 |
| `text-[8px]` | 1 |

**Clamp-Ausdrücke** (16 unterschiedliche Wertesätze, alle Einzel- oder Doppel-Fundstellen):

`clamp(2.4rem,8vw,5rem)` (2), `clamp(1.75rem,3.5vw,2.35rem)` (2),
`clamp(1.45rem,3vw,1.95rem)` (2), `clamp(2rem,5vw,3.25rem)`,
`clamp(2.25rem,5vw,3.25rem)`, `clamp(1.9rem,5.5vw,2.9rem)`,
`clamp(1.9rem,4vw,2.55rem)`, `clamp(1.8rem,5vw,2.4rem)`,
`clamp(1.7rem,3.4vw,2.15rem)`, `clamp(1.75rem,3vw,2.25rem)`,
`clamp(1.6rem,5vw,2.2rem)`, `clamp(1.6rem,4vw,2.2rem)`,
`clamp(1.4rem,3vw,1.85rem)`, `clamp(1.35rem,2.8vw,1.7rem)`,
`clamp(1.15rem,2.4vw,1.6rem)`, `clamp(1.05rem,2.2vw,1.35rem)`.

**Zahl unterschiedlicher Schriftgrößen: 36** (4 semantische + 16 Pixelgrößen + 16 clamp-Ausdrücke).
Das ist ein hoher Wert — eine kuratierte Typo-Skala hätte typisch 8–10 Stufen.

### 3.3 `uppercase` und `letter-spacing`

`uppercase` wird an **77 Stellen in 15 Dateien** benutzt. Konzentrationen:

| Datei | Fundstellen |
|---|---:|
| `components/planner/TournamentDetail.tsx` | 18 |
| `calendar/components/CalendarWeek.tsx` | 11 |
| `components/planner/SeasonHealthBar.tsx` | 7 |
| `tour2.css` (in `.t2-kicker`, `.t2-eyebrow`, `.t2-tag`, `.t2-badge`, `.t2-chip`) | 5 |
| `components/home/HomeView.tsx` | 5 |
| `components/planner/SeasonWorkspace.tsx` | 4 |
| `travel/TravelHub.tsx` | 3 |
| Rest verstreut | je 1–2 |

`tracking-[…]` wird an **65 Stellen** benutzt, überwiegend eng gestaffelt:

| Wert | Fundstellen |
|---|---:|
| `tracking-[0.12em]` | 23 |
| `tracking-[0.14em]` | 11 |
| `tracking-[0.16em]` | 8 |
| `tracking-[-0.03em]` | 6 |
| `tracking-[-0.02em]` | 5 |
| `tracking-[0.1em]` | 4 |
| `tracking-[0.18em]` | 3 |
| `tracking-[0.22em]` | 2 |
| `tracking-[-0.04em]` | 2 |
| `tracking-[-0.01em]` | 1 |

Positive Trackings (0.10–0.22em) begleiten Uppercase-Labels; negative
Trackings (-0.01 bis -0.04em) sitzen auf großen Zahlen (Hero-Werte).

### 3.4 Tabellarische Ziffern

`tabular-nums` wird in **10 Dateien, insgesamt 42 Fundstellen** benutzt:

| Datei | Fundstellen |
|---|---:|
| `components/home/HomeView.tsx` | 12 |
| `finance/FinanceView.tsx` | 10 |
| `form/FormView.tsx` | 7 |
| `calendar/components/CalendarWeek.tsx` | 5 |
| `components/planner/TournamentDetail.tsx` | 4 |
| `tournaments/TournamentsView.tsx` | 3 |
| `tour2.css` | 2 |
| `expenses/components/ExpensesTourView.tsx` | 2 |
| `costs/components/SeasonCostBreakdown.tsx` | 2 |
| `wildcards/WildcardsView.tsx` | 1 |

`font-variant-numeric`-CSS direkt: nicht gefunden. Alles läuft über die
Tailwind-Kurzform. Konsistente Anwendung überall dort, wo Zahlen in Tabellen
oder Listen stehen.

---

## 4. Abstände, Radien, Linien, Schatten

### 4.1 Abstände

**Häufigste semantische Werte** (Tailwind-Skala `1 = 0.25rem = 4px`):

| Klasse | Fundstellen |
|---|---:|
| `mt-2` | 115 |
| `mt-1` | 100 |
| `mb-1` | 78 |
| `gap-3` | 74 |
| `mt-3` | 72 |
| `gap-2` | 70 |
| `px-4` | 59 |
| `mt-4` | 59 |
| `py-2` | 56 |
| `mt-6` | 52 |
| `mt-8` | 38 |
| `gap-1.5` | 35 |
| `mt-0.5` | 32 |
| `py-1.5` | 30 |
| `px-2.5` | 28 |

Die 0.5er-Zwischenstufen (`1.5`, `2.5`, `0.5`) sind auf einem 2px-Sub-Raster —
Tailwind-typisch, akzeptabel.

**Arbitrary-Abstände außerhalb der Skala:**

| Klasse | Wert | Auf 4er-Raster? |
|---|---|---|
| `mt-[5px]` | 5 px | **nein** |
| `ml-[11px]` | 11 px | **nein** |
| `pb-[max(6.5rem,calc(5.5rem+env(safe-area-inset-bottom)))]` | Safe-Area | n/a (dynamisch) |
| `pb-[max(14px,env(safe-area-inset-bottom))]` | Safe-Area | n/a |
| `pb-[max(0.75rem,env(safe-area-inset-bottom))]` | Safe-Area | n/a |

Nur **2 echte Off-Raster-Werte** — sehr sauber. Die drei Safe-Area-Padings sind
bewusst gewählte iOS-Anpassungen (fallen nicht unter „Raster").

### 4.2 Ecken-Radien

**Tailwind:**

| Klasse | Fundstellen |
|---|---:|
| `rounded-full` | 104 (Pillen, Avatare, Dots) |
| `rounded-xl` | 42 |
| `rounded-2xl` | 22 |
| `rounded-lg` | 17 |
| `rounded` | 7 |
| `rounded-3xl` | 3 |
| `rounded-t-3` | 3 |
| `rounded-md` | 2 |
| `rounded-tr`, `rounded-tl` | je 1 |

**Arbitrary:** `rounded-[12px]` (3 Fundstellen).

**CSS-Radien direkt** in `tour2.css` (22 Fundstellen):
`999px` (14×), `var(--t2-radius)` (3×, entspricht 16px), `12px` (5×),
`10px` (1×), `8px` (2×), `6px` (2×), `5px` (1×).

**Distinkte Radius-Werte im gesamten /tour2-Baum: 11**
(`0.125rem/rounded`, `0.375rem/md`, `0.5rem/lg`, `0.75rem/xl`, `1rem/2xl`,
`1.5rem/3xl`, `999px/full`, `12px`, `10px`, `8px`, `6px`, `5px`).

### 4.3 Rahmen (Farbe + Stärke)

Stärke: fast immer `1px` (Tailwind-Default für `border` / `border-*`),
`border-2` nur in `t2-cta` (CSS, 1px inset) und Ring-Utilities (`ring-2`).

Farb-Referenzen (Top-Werte):

| Klasse | Fundstellen |
|---|---:|
| `border-[var(--t2-line)]` | 89 |
| `border-[var(--t2-line-strong)]` | 12 |
| `border-white` | 12 |
| `border-matchup` | 6 |
| `border-[var(--t2-ink)]` | 4 |
| `border-[var(--t2-accent)]` | 4 |
| `border-neutral-300` | 3 |
| `border-black` | 3 |
| `border-red-600` / `border-red-200` | je 1 |

Konsistent. Der Rot-Rahmen (`border-red-600`) ist Warnkontext (siehe §6).

### 4.4 Schatten

**Tailwind-Klassen:**

| Klasse | Fundstellen |
|---|---:|
| `shadow` | 24 |
| `shadow-sm` | 8 |
| `shadow-2xl` | 8 |
| `shadow-xl` | 4 |
| `shadow-lg` | 4 |

**Arbitrary:**
- `shadow-[0_-12px_40px_rgba(0,0,0,0.18)]` (Mobile-More-Sheet).
- `shadow-[0_16px_50px_-12px_rgba(0,0,0,0.25)]` (Overlay-Karte).

**Direkte `box-shadow` in `tour2.css`** (13 Fundstellen): Hero-Schatten der
`.t2-card` (2 Stufen normal/hover via `--t2-shadow` und `--t2-shadow-hover`),
Rail-Schatten (12px 0 40px), Marker-Schatten (0 20px 50px), CTA-Hover-Glow
(0 14px 30px in Akzentfarbe), Input-Focus-Ring, Dash-Card-Micro-Schatten
(`0 1px 2px rgba(10,10,10,0.04)` — wiederholt in `.t2-dash-card`,
`.t2-kpi-card`).

Der Overview-Bereich (HomeView) benutzt praktisch keinen Schatten, weil
`.t2-dash-card` nur den Micro-Schatten hat — passt zum aktuellen „Rahmen
statt Schatten"-Stil. Andere Bereiche (SeasonWorkspace, TournamentDetail)
mischen `shadow-2xl`/`shadow-xl` in Popovers und Sheets.

---

## 5. Wiederkehrende Bausteine

Der wichtigste Abschnitt.

### 5.1 CSS-Klassen in `tour2.css`

`tour2.css` definiert **98 selbstgeschriebene `.t2-*`-Klassen**. Die
wichtigsten Bausteine und ihre echte Nutzung:

| Klasse | Definiert | Genutzt in n Dateien | Ist es eine „Komponente"? |
|---|---|---:|---|
| `.t2-cta` | `tour2.css:102–119` | **32** | ja — Primary-Button, ein einheitliches Ding |
| `.t2-input` | `tour2.css:251–263` | **22** | ja — Text-Input |
| `.t2-kicker` | `tour2.css:36–42` (11px caps, tracking) | **36** | ja — aber wird auf zwei sehr unterschiedliche Rollen abgebildet: als Karten-Titel UND als Metadata-Label (vgl. §11) |
| `.t2-dash-card` | `tour2.css:621–627` | 7 | ja — Karten-Rahmen für Dashboard-Tiles |
| `.t2-panel` | `tour2.css:265–…` | **27** | ja — Formular-/Werkzeug-Papier |
| `.t2-card` | `tour2.css:138–…` | 8 | ja — größere Editorial-Karte (kein Dashboard-Tile) |
| `.t2-chip` | `tour2.css:272–…` | 6 | ja — Filter-Chips |
| `.t2-ghost` | `tour2.css:121–135` | 7 | ja — Sekundär-Button |
| `.t2-row` | `tour2.css:236–248` | 3 | ja — anklickbare Listenzeile mit Hover |
| `.t2-display` | `tour2.css:50–55` (H1-Hero) | 9 | ja — Hero-Titel |
| `.t2-h2` | `tour2.css:56–61` | 5 | ja — Sektions-Titel (mittel) |
| `.t2-lead` | `tour2.css:62–67` | 2 | ja — Fließtext-Absatz |
| `.t2-eyebrow` | `tour2.css:43–48` | 4 | ja — kleines Über-Label über Hero |
| `.t2-tag` | `tour2.css:166–…` | 1 | **unklar** — nur eine Nutzung, wirkt orphaned |
| `.t2-badge` | `tour2.css:181–…` | 1 | **unklar** — nur eine Nutzung |
| `.t2-media` | `tour2.css:151–…` | 1 | **unklar** — nur eine Nutzung |
| `.t2-telem` | `tour2.css:196–…` | 2 | ja — Kennzahl-Trio |
| `.t2-kpi-card` | `tour2.css:637–643` | **1** | **toter Code** — als KPI-Kachel definiert, wird aber nirgends gerendert |
| `.t2-season-chip` | `tour2.css:628–636` | **1** | **toter Code** — nach HomeView-Redesign nur noch in `Tour2Shell` als `.t2-rail-season` (andere Klasse) sichtbar; genau eine Fundstelle in JSX (Tour2Shell.tsx) |
| `.t2-route-card`, `.t2-route-scroll`, `.t2-route-leg` | `tour2.css:644–681` | 2 (nur `HomeView.tsx` + eine weitere) | ja — Route-Zeitachse; Definitionen und Nutzung zentralisiert |
| `.t2-rail-*` (17 Sub-Klassen für die Rail) | `tour2.css:400–556` | 2 (Rail selbst) | ja — Rail-Baustein-Familie |
| `.t2-workspace-main` | `tour2.css` | 2 | ja — Haupt-Scroll-Bereich |

### 5.2 React-Komponenten

Echte wiederverwendete UI-Bausteine (nicht View-Container):

| Komponente | Datei | Zeilen | Wo eingesetzt |
|---|---|---:|---|
| `Tour2Shell` | `components/shell/Tour2Shell.tsx` | 294 | jede Seite (via Layout) |
| `Tour2TabBar` | `components/shell/Tour2TabBar.tsx` | 79 | Mobile-Tabbar |
| `Tour2Subpage` | `components/Tour2Subpage.tsx` | 33 | Werkzeug-Seiten (Costs, Expenses, Form, Schengen, Timeline) |
| `Tour2ActionList` | `components/Tour2ActionList.tsx` | 70 | Home + Season-Workspace |
| `TourLoginCard` | `components/TourLoginCard.tsx` | 62 | jede View mit `useAuth` |
| `EntryDeadline` (+`DeadlineCountdown`) | `components/EntryDeadline.tsx` | 144 | Detail-Screens |
| `TourDeadlineBlock`, `TourDecideBlock` | jeweils eigene Datei | 84/92 | Turnier-Detail |
| `SeasonJourney`, `SeasonHealthBar`, `TrainingSlots`, `InfoHint`, `DemoPlayerSheet`, `PlannerMap`, `TournamentDocuments`, `TourChatPanel` | `components/planner/*` | 60–361 | ausschließlich in `SeasonWorkspace` |
| `WindowedList` | `components/WindowedList.tsx` | 80 | großen Listen (Turniere) |

### 5.3 Kopierte Muster (kein echter Baustein)

Klare Fälle mehrfach kopierten Codes:

| Muster | Fundstellen | Warum das ein Problem ist |
|---|---|---|
| Kennzahl-Kachel „`<big number> + 11px-caps-Label`" | HomeView, PointsView, FinanceView, PipelineView, CostsView, SeasonHealthBar | in HomeView war früher `<Kpi>`-Local-Component definiert (siehe `HomeView.tsx:63–74`), außerhalb HomeView aber jedes Mal per Hand mit inline-Tailwind neu gebaut |
| Status-Pill „`rounded-full bg-<color>/10 text-<color>-700`" | `PipelineView.tsx:86`, `TournamentDetail.tsx:460`, `TrainingSlots.tsx:142`, mind. 4 weitere | dieselbe Struktur, jedes Mal per Hand mit unterschiedlichen Ton-Kombinationen (amber/emerald/red uneinheitlich) |
| Loading-Placeholder „`<p className="p-6 text-sm text-[var(--t2-muted)]">Lade …</p>`" | HomeView, PointsView, DocumentsView, NetworkView, TravelHub, ExpensesTourView … (~12 Views) | textuelle Fallbacks statt Skeleton-Muster |
| Ampel-Punkt (Warn-Dot) `h-2 w-2 rounded-full bg-<red|matchup>` | Tour2ActionList (siehe `56`), HomeView (neu, `:664`), unklar ob weitere | zwei Codestellen bauen denselben Punkt eigenständig; Verhalten bisher zufällig konsistent |
| „SeasonWorkspace"-Sidebar-Sektionen (H2-Kicker + Div-Border) | innerhalb `SeasonWorkspace.tsx` 6-mal wiederholt | 1363-Zeilen-Datei hat viele fast identische Abschnitte |

---

## 6. Zustände und Ampelfarben

| Zustand | Datei / Zeile | Farbe / Form | Konsistent? |
|---|---|---|---|
| Meldefrist verpasst (Aktions-Liste) | `Tour2ActionList.tsx:56` | roter Punkt `bg-red-600` + rote/amber-Severity im Domain | ja |
| Meldefrist verpasst (Route in Zone B) | `HomeView.tsx:664` | roter Punkt `bg-red-600`, roter Rahmen `border-red-600/60`, `opacity-60` | ja (frisch angeglichen) |
| Frist naht („amber") | Action-Board `severity: "amber"` → im UI `bg-matchup` (Violet!), nicht Amber | **inkonsistent**: `Tour2ActionList.tsx:56` mappt Amber-Severity auf `bg-matchup` (Akzent-Violett), nicht auf Amber |
| Budget überzogen | HomeView Zone D Rechts: `text-red-700`, wenn `leftMinor < 0` | einheitlich Rot |
| Status-Pill „Alternate" | `PipelineView.tsx:86`, `TournamentDetail.tsx:460` | `bg-amber-500/10 text-amber-700` | ja (aber siehe Amber-Wechsel oben — hier echtes Amber, in Action-Liste dagegen Violett) |
| Status-Pill „Confirmed/Accepted" | `TrainingSlots.tsx:142` | `bg-emerald-500/10 text-emerald-700` | ja |
| Status-Pill „Declined" | `TrainingSlots.tsx:142` | `bg-[var(--t2-surface)] text-[var(--t2-muted)]` (Grau) | ja |
| Erledigt (Action-Board leer) | `Tour2ActionList.tsx:39` | großer Positiv-Satz „Alles klar" (`text-[clamp(1.15…)]`), keine Farbe | ja |
| Vergangener Stop (Route) | `HomeView.tsx:646` | `opacity-40` auf dem Container, kein Farb-Tag | uneinheitlich zu anderen Bereichen — `SeasonWorkspace` zeigt vergangene Stops NICHT gedämpft |
| Fehler-Zustand (Doc expired vs expiring) | `DocumentsView.tsx:194` | `text-red-800` bzw. Standard-Ink | ja intern, aber die Farbstufen 700/800 wechseln je Datei |

**Konkrete Widersprüche:**
1. **Amber-Severity aus dem Action-Board wird im UI als Violett gerendert**
   (`Tour2ActionList.tsx:56`: `a.severity === "red" ? "bg-red-600" : "bg-matchup"`).
   Das Domain-Modell kennt Rot und Amber; das UI kennt Rot und Violett. Nutzer
   sehen für „Frist naht" den Akzent-Violett, für die gleichzeitige Timeline-
   oder Pipeline-Ansicht dagegen echtes Amber (`bg-amber-500/10`).
2. **Rot-Textstufen** liegen je nach Datei bei `red-500`, `red-600`, `red-700`,
   `red-800`. Keine zentrale Regel welche Stufe für welchen Zweck.
3. **Frist-verpasst-Markierung in der Route** wurde erst frisch eingebaut
   (`HomeView.tsx:664`), in anderen Ansichten mit Route/Zeitachse
   (`TimelineView.tsx`, `SeasonWorkspace`) fehlt sie.

---

## 7. Leer- und Ladezustände

Grep-basierte Inventur (mit menschlichem Blick auf die Ansichten):

| Bereich (View) | „lädt gerade" definiert | „keine Daten" definiert |
|---|---|---|
| HomeView | **ja** — `state === "loading"` → Textzeile | **ja** — Zone-B-Empty, Zone-D-Links-Empty seit letzter Runde |
| SeasonWorkspace | **ja** — Loading-Text | **ja** — mehrere Empty-Zustände (`noStuff`, `t2ovRouteEmpty`) |
| TournamentsView | ja | ja (Filter-Empty) |
| DocumentsView | ja | ja (`w.severity === "error"` sonst Standard) |
| NetworkView | ja | ja |
| TravelHub | ja | teilweise — vor allem `noStuff` für Reise-Docs |
| ProfileView | ja | **nein** — kein Empty-Fallback wenn Profil leer, Formularfelder bleiben leer |
| SchengenView | ja | ja |
| ExpensesTourView | ja | ja (Empty-Hinweis pro Turnier) |
| FinanceView | ja | ja (aber sehr knapp; Text-Fallbacks) |
| PointsView | ja | ja („no results recorded") |
| PipelineView | ja | ja |
| TimelineView | ja | ja |
| CostsView | ja | ja |
| FormView | ja | ja |
| CalendarWeek | ja | ja |
| TourMapView | **unklar** — keine erkennbaren Loading/Empty-Marker in einfachem grep | unklar |

Alle größeren Views haben Loading-Zustände (18/18 wo gemessen). Empty-States
fehlen definitiv nur in `ProfileView.tsx`; bei `TourMapView.tsx` war es per
Grep nicht eindeutig — **unklar**, hier müsste ein Blick in den DOM-Aufbau
folgen.

Skeleton-Placeholder (echte Shimmer) existieren **an keiner Stelle** — alle
Loading-Zustände sind reine Text-Fallbacks („Daten werden geladen …").

---

## 8. Mobil

### 8.1 Umbruchpunkte

| Breakpoint | Fundstellen |
|---|---:|
| `sm:` | 54 |
| `md:` | 39 |
| `lg:` | 10 |
| `xl:` | 17 |
| `2xl:` | 0 |

Klarer Bias zu `sm:` und `md:`; `xl:` wird für die Grid-Umschaltung im
Overview genutzt. `2xl:` (1536px+) kommt gar nicht vor.

### 8.2 Desktop- vs. Mobil-Spezifik

- Rail (Sidebar) versus Bottom-Tab-Leiste sind sauber über `md:hidden`
  (5 Fundstellen) und `md:block` (2), `md:flex` (6), `md:grid` (3) getrennt.
- Eigene mobile Navigation: **ja** — `Tour2TabBar.tsx` mit 5-Slot-Design
  plus ein „Mehr"-Bogen (Bottom-Sheet, `Tour2Shell.tsx:203–236`).
- Desktop-Only-Reste: unklar — keine Ansicht ist erkennbar für Mobile
  gebrochen, aber `SeasonWorkspace` hat mehrere Panels, die auf Mobil eng
  werden (nicht separat geprüft).
- Safe-Area-iOS: berücksichtigt (`pb-[max(0.75rem,env(safe-area-inset-bottom))]`
  in der Tabbar, weitere in Overlays).

### 8.3 Fehlende Stellen (Vermutung)

Der 1363-Zeilen-`SeasonWorkspace` und der 1157-Zeilen-`TournamentDetail`
enthalten viele Tabellen/Grids — dort dürften einige Layouts erst ab `md:`
sauber sein. Nicht abschließend geprüft, **unklar**.

---

## 9. Texte und Sprache

### 9.1 Zahl der Textschlüssel im `tour`-Namespace

- DE: **1239** Top-Level-Keys
- EN: **1239** Top-Level-Keys

(Die reine `grep`-Zählung ergibt 1241/1242, weil einzelne Nested-Objects wie
`docWarn_*` verschachtelte Keys enthalten. Nach Parser-Bereinigung: 1239/1239.)

### 9.2 Nur-DE- oder nur-EN-Schlüssel

**0 Fehlstellen** — Parität ist voll gegeben.

### 9.3 Hardcodierte sichtbare Texte im /tour2-Baum

| Text | Datei / Zeile | Bewertung |
|---|---|---|
| „MATCHUP TOUR" | `components/shell/Tour2Shell.tsx:148` | Brand-Wort; i18n grundsätzlich möglich, aber weder englischer noch deutscher Nutzer sieht hier einen Unterschied |
| „START" | `components/planner/PlannerMap.tsx:65` | echter Text, im HTML-String einer Leaflet-Marker-Vorlage; wird auch in DE mit „START" ausgeliefert — **Fehlerquelle** |
| „M" (Rail-Mark) | `Tour2Shell.tsx:98, 182` | Ein-Buchstaben-Logo, nicht i18n-relevant |

Kein weiteres hartes Klartext-Vorkommen im JSX (Regex-Suche ergab keine
Treffer außerhalb der TypeScript-Generics `Promise<…>`).

---

## 10. Daten

### 10.1 Datenquellen pro Bereich

Aus den `load*()`-Aufrufen in den Views (auf Namen der Loader gemappt, echte
Tabellen liegen in den entsprechenden `src/lib/tour*.ts`-Modulen):

| View | Loader (Ausschnitt) |
|---|---|
| HomeView | `loadPlannerProfile`, `loadSeason`, `loadAllEntryEvents`, `loadCostRates`, `loadResultHistory`, `loadPlayerDocs`, `loadWildcardContacts`, `loadTravelDocuments`, `loadSetupState`, `loadExpenses`, `loadEvents`, `loadStays`, `loadSlotsOnDates`, `getTourCatalog` |
| SeasonWorkspace | `loadPlannerProfile`, `loadPlayerMaster`, `loadPlayerDocs`, `loadEntries`, `loadAllEntryEvents`, `loadCostRates`, `loadStays`, `loadTravelDocuments`, `loadWildcardContacts`, `loadIncome`, `loadExpenses`, `loadPrizes` |
| TournamentsView | `loadPlannerProfile`, `loadCostRates`, `loadEntries`, `loadAllEntryEvents`, `loadSeasonPlanRows`, `loadEffectiveVisa`, `getTourCatalog` |
| DocumentsView | `loadPlayerMaster`, `loadPlannerProfile`, `loadTravelDocuments`, `loadStays`, `loadSeason` |
| NetworkView | `loadWildcardContacts`, `loadProvidersNearCoords`, `loadTournamentSlots`, `loadTourPresence`, `loadSeason` |
| TravelHub | `loadPlannerProfile`, `loadCostRates`, `loadSeason`, `loadStays`, `loadExpenses` |
| ProfileView | `loadPlayerDocs`, `loadReminderSettings`, `loadCostRates`, `loadSetupState`, `loadTourOptPrefs` |
| SchengenView | `loadStays` |
| ExpensesTourView | `loadSeason`, `loadExpenses`, `loadPrizes` |
| FinanceView | `loadSeasonPlanRows`, `loadTournamentsByIds`, `loadExpenses`, `loadIncome`, `loadPrizes`, `loadPointsData` |
| PointsView | `loadResultHistory` |
| PipelineView | `loadSeasonPlanRows`, `loadTournamentsByIds`, `loadAllEntryEvents`, `loadCostRates` |
| TimelineView | `loadSeason`, `loadEvents`, `loadPlannerProfile` |
| CostsView | `loadSeason`, `loadCostRates` |
| FormView | `loadPerformance`, `loadPointsData` |
| CalendarWeek | `loadSeason`, `loadEvents` |

Fast alle Loader schlagen auf die Tabellen `web.tour_*` durch (Turniere,
Season-Entries, Stays, Wildcards, Expenses, Prizes, Income, Player-Docs,
Reminder-Settings, Result-History). Sensible Ausleger sind `profiles`
(basis) und `tour_profiles` (Ranking, Budget, Pässe).

### 10.2 `select("*")`-Befunde

**Zwei Fundstellen im Daten-Pfad zu /tour2:**

| Datei / Zeile | Tabelle | Warum das ein Problem ist |
|---|---|---|
| `src/lib/auth.tsx:87–90` | `.from("profiles").select("*")` | CLAUDE.md verbietet `select *` auf `profiles`. Diese Ladung fließt in den Auth-Context, den auch `/tour2` konsumiert. Alle Spalten (auch später hinzukommende) landen im Client. |
| `src/lib/tour.ts:35–37` | `.from("tour_profiles").select("*")` | dasselbe Muster, hier für `tour_profiles`. Explizite Spaltenliste steht nicht im Weg. |

Beide Fundstellen betreffen zwar nicht direkt eine /tour2-Komponente, aber
das dortige `loadPlannerProfile` (in `src/lib/tourPlanner.ts:38–40`)
_macht es richtig_ (`select("first_name, display_name, city, country, …")`).
Die zwei genannten Stellen sind Datenschutz-Findings, die beim Redesign
mitgezogen werden sollten.

---

## 11. Befund (unangenehm ehrlich)

1. **Zwei Datei-Monolithen** setzen jedes Redesign unter Druck: `SeasonWorkspace.tsx` (1363 Zeilen) und `TournamentDetail.tsx` (1157 Zeilen). Beide bündeln Layout, Datenzugriff, Zustands-Übergänge und Sub-Widgets in einer einzigen Client-Component. Bevor hier irgendetwas visuell umgestellt wird, muss aufgeteilt werden — sonst kollidiert jede kleine Farbanpassung mit ungetesteten Zustands-Threads.
2. **Schriftgrößen sind nicht kuratiert.** 36 unterschiedliche Größen (davon 16 einzeln benutzte `clamp()`-Ausdrücke) sind das Ergebnis von „Größe pro Bildschirm neu erfinden". Eine 8–10-stufige Skala mit CSS-Variablen oder Tailwind-`text-*`-Presets würde die Datei-Größe im Bundle nicht spürbar reduzieren, aber die visuelle Kohärenz sofort verbessern.
3. **`.t2-kicker` hat zwei widersprüchliche Rollen.** In 36 Dateien ist es mal ein Karten-Titel (semantisch H2, sichtbar 11px Caps), mal ein Metadaten-Label unter einer großen Zahl. Der aktuelle Overview-Refactor hat die Rolle „Karten-Titel" bereits weggenommen — überall sonst gilt sie weiter. Das ist die größte Konsistenz-Baustelle.
4. **Ampel-Semantik ist gebrochen.** Das Domain-Modell (`actionBoard.ts`) kennt `red` und `amber`. Das UI übersetzt `amber` mal als echtes Amber (`bg-amber-500/10`), mal als Akzent-Violett (`bg-matchup`, in `Tour2ActionList.tsx:56`). Bevor Farben verändert werden, muss diese Übersetzung an genau einer Stelle festgelegt werden.
5. **Rot ist ein Ton, aber vier Stufen.** `red-500`, `red-600`, `red-700`, `red-800` werden je nach Datei ausgewählt, ohne erkennbare Regel. Dasselbe gilt für die 20 Grau-Töne aus `neutral-*` und `--t2-muted/faint/line/ink` parallel. Redesign-Blocker: ohne kanonische Palette wird jede Änderung an einer Stelle die andere aufreißen.
6. **8 Hex-Werte doppeln existierende CSS-Variablen.** `#4b3bf3`, `#0a0a0a`, `#3b2cd9`, `#f3f3f1`, `#6b6b6b`, `#9a9a9a` und Varianten von Weiß erscheinen sowohl als `--t2-*`-Referenz als auch als hartkodierter Hex-Wert. Ein Suchen-Ersetzen-Pass würde ~15 Fundstellen zusammenführen.
7. **`tour2.css` ist auf 686 Zeilen mit 98 selbstgeschriebenen Klassen gewachsen.** Mehrere davon (`.t2-tag`, `.t2-badge`, `.t2-media`, `.t2-kpi-card`, `.t2-season-chip`) haben nur ein einziges Anwendungs-Vorkommen oder gar keines — toter Code, der beim Redesign als „echtes Muster" fehldeutbar ist.
8. **Kennzahl-Kachel gibt es sechsmal per Copy-Paste.** In HomeView existierte ein `<Kpi>`-Local-Widget; überall sonst (PointsView, FinanceView, PipelineView, CostsView, SeasonHealthBar) ist die gleiche Struktur inline nachgebaut. Eine gemeinsame `<Metric>`-Komponente würde ~150 Codezeilen sparen und Rot/Amber-Nuancen einheitlich machen.
9. **Loading-Zustände sind Text-Fallbacks, keine Skeleton-Muster.** 18 Views zeigen ein 14px-Muted-„Lade …" — inhaltlich korrekt, aber optisch flackernd. Für ein Redesign, das sich „ruhig" anfühlen soll, ist das ein sichtbarer Bruch.
10. **Vier Redirect-Wrapper (`/tour2/browse`, `/tour2/tournaments`, `/tour2/pipeline`, `/tour2/wildcards`, `/tour2/points`, `/tour2/map`, `/tour2/planner`, `/tour2/setup`, `/tour2/finance`) plus mindestens vier weiter existierende Views** (`FinanceView`, `WildcardsView`, `PipelineView`, `TourMapView`) sind aktuell nicht mehr aktiv verlinkt, laufen aber weiter im Bundle. Vor einem Redesign sollte klar sein, was davon Legacy und was Zukunft ist.
11. **Zwei `select("*")`-Fundstellen** (`src/lib/auth.tsx:87` für `profiles`, `src/lib/tour.ts:35` für `tour_profiles`) verstoßen gegen die eigene Repository-Regel und laden ungefragt alle Spalten in den Client. Datenschutz-Blocker, gehört mit ins Redesign-Ticket.
12. **`DayGlance` ist orphaned.** Datei existiert (`components/home/DayGlance.tsx`, 75 Zeilen), Daten-Loader (Slot-Meetings, Tour-Events) laufen in HomeView weiter — die Karte selbst wird aber nicht mehr gerendert. Das ist Bundle-Ballast plus ein toter Datenaufruf pro Seiten-Load.
13. **`.t2-cta` ist ein echter, konsistent verwendeter Primärknopf** — mit 32 Nutzungen der einzige klar geformte Baustein neben `.t2-input`. Redesign-Chance: hier auf ihn aufbauen, statt zwölf neue Knopf-Varianten zu erfinden.
14. **Instrument Sans ausschließlich für /tour2** ist eine bewusste Design-Aussage; sie sollte im Redesign nicht versehentlich verlorengehen. Zwei Fontinstanzen (DM Sans für den Rest, Instrument für /tour2) haben minimale Performance-Kosten und stiften die Wiedererkennung.
15. **Der zweite hartkodierte Sichttext ist ein Bug in Wartestellung.** `PlannerMap.tsx:65` schreibt `"START"` als String in einen Leaflet-Marker — kein i18n. Wird bei einer DE-Sprache-Umschaltung nicht ausgewechselt und ist im aktuellen Aufbau leicht zu übersehen.

---

*Bestandsaufnahme erstellt zum Redesign-Vorbereitungsschritt. Keine Änderungen
an bestehenden Dateien; einzige neue Datei ist dieser Report.*

---

## Zuordnung Etappe 1

Angehängt am 2026-08-28 während Etappe 1 des Redesigns. Bezugspunkt sind die
in `src/app/tour2/tour2.css` neu definierten drei Schichten. Werte, die keinem
Bedeutungs-Token sicher zugeordnet werden können, stehen als „**offen**" — sie
bleiben in dieser Etappe unverändert und werden im Bericht als offene Reste
genannt.

### Hex-Werte (JSX + CSS)

| Alt (Hex) | Fundstellen | Neuer Token | Begründung |
|---|---:|---|---|
| `#fff` / `#ffffff` als Text/Bg auf Akzent-Fläche | ~14 | `var(--t2-on-accent)` | Weiß bleibt Weiß, aber semantisch gebunden |
| `#fff` / `#ffffff` als Karten-/Chrome-Fläche | ~6 | `var(--t2-surface)` | Karten-Weiß |
| `#4b3bf3` | 5 | `var(--t2-accent)` | Akzent-Duplikat auflösen |
| `#3b2cd9` | 1 | `var(--t2-accent-hover)` (Alias auf `--t2-raw-accent-hover`) | Dark-Violet-Hover-Duplikat |
| `#0a0a0a` | 2 | `var(--t2-text)` | Ink-Duplikat (Wert wandert leicht auf `#171512`) |
| `#f3f3f1` | 1 | `var(--t2-surface-muted)` | Surface-Duplikat (Wert wandert auf `#F1F0EC`) |
| `#6b6b6b` | 1 | `var(--t2-text-soft)` | Muted-Duplikat |
| `#9a9a9a` | 1 | `var(--t2-text-faint)` | Faint-Duplikat |
| `#888` | 1 | `var(--t2-text-faint)` | Kurzform, semantisch identisch |
| `#e7e5e4` | 1 | **offen** | Donut-Rest-Segment; kein passendes Text/Surface-Token |
| `#d6d3d1`, `#a8a29e`, `#78716c` | je 1 | **offen** | Donut-Segment-Farbverlauf (Grau-Stufen); keine passenden semantischen Tokens |

### rgba-Werte (JSX + CSS)

| Alt (rgba) | Fundstellen | Neuer Token | Begründung |
|---|---:|---|---|
| `rgba(10,10,10,0.09)` (Alt-`--t2-line`) | Alt-Var | `var(--t2-line)` (jetzt `rgba(23,21,18,0.09)`) | Grundton wärmer |
| `rgba(10,10,10,0.16)` (Alt-`--t2-line-strong`) | Alt-Var | `var(--t2-line-strong)` (jetzt `rgba(23,21,18,0.16)`) | wärmer |
| `rgba(10,10,10,0.04)` | 3 (in Card-Shadows) | entfernt (Karten ohne Schatten) | Schritt 6 |
| `rgba(10,10,10,0.05)` | 1 (Card-Hover-Shadow) | `var(--t2-shadow-hover)` (warmer Grundton) | Referenz |
| `rgba(10,10,10,0.12)` / `0.22` | 2 (Card-Shadows) | `var(--t2-shadow)` / `-hover` | Referenz |
| `rgba(10,10,10,0.16)` | in `--t2-line-strong` | siehe oben | Referenz |
| `rgba(10,10,10,0.25)` (Rail-Drawer) | 1 | `var(--t2-shadow-drawer)` | Überlager-Schatten |
| `rgba(10,10,10,0.4)` (Rail-Scrim) | 1 | `rgba(23,21,18,0.4)` | Overlay bewusst als Rohwert (Alpha ist stärker als „line-strong") |
| `rgba(10,10,10,0.92)` (Dock-Bg) | 1 | `rgba(23,21,18,0.92)` | Dunkles Chrome, warmer Ton |
| `rgba(0,0,0,0.05)` | 2 (Range-Slider-Thumb-Shadow, globals.css) | **nicht /tour2** | außerhalb Scope |
| `rgba(0,0,0,0.6)` (Dock-Shadow) | 1 | `var(--t2-shadow-overlay)` | Referenz |
| `rgba(0,0,0,0.18)`, `0.25`, `0.3`, `0.06` | 4 (Ganz-Zwecke: Slider, Marker) | **offen** | überwiegend in Leaflet-Markern (`PlannerMap.tsx` inline HTML) |
| `rgba(75,59,243,0.55)` (CTA-Hover-Halo) | 1 | bleibt (Rohwert) | Akzent-Glow, keine benannte Bedeutung |
| `rgba(75,59,243,0.10)` (Alt-`--t2-accent-soft`) | Alt-Var | `var(--t2-accent-soft)` | erhöht von 8% → 10% (kaum sichtbar) |
| `rgba(255,255,255, X)` — 12 Alphas | 12 | bleiben (Rohwerte) | komponieren gegen den Akzent-Rail-Hintergrund; keine Bedeutungs-Tokens nötig |

### Tailwind-Farbklassen

| Alt (Tailwind) | Fundstellen | Neuer Token | Begründung |
|---|---:|---|---|
| `text-amber-600` / `-700` / `-800` | 4 + 17 + 9 | `text-[var(--t2-warn)]` | Warn-Text |
| `bg-amber-500/10`, `bg-amber-500/[0.14]` | mehrere | `bg-[var(--t2-warn-surface)]` | Warn-Fläche |
| `bg-amber-50`, `-100`, `-500`, `-600` | 8 + 1 + 7 + 2 | `bg-[var(--t2-warn-surface)]` (soft) bzw. `bg-[var(--t2-warn)]` (solid) | Warn-Flächen |
| `ring-amber-200`, `ring-amber-500`, `ring-amber-500/30` | 2 + 1 + 1 | `ring-[var(--t2-warn)]` | Warn-Ring |
| `text-red-500` / `-600` / `-700` / `-800` | 8 + 4 + 6 + 1 | `text-[var(--t2-danger)]` | Danger-Text |
| `bg-red-50` | 1 | `bg-[var(--t2-danger-surface)]` | Danger-Fläche soft |
| `bg-red-500` / `-600` / `-700` | 1 + 2 + 1 | `bg-[var(--t2-danger)]` | Danger-Fläche solid |
| `border-red-200`, `border-red-600` | 1 + 1 | `border-[var(--t2-danger)]` | Danger-Rahmen |
| `bg-rose-500`, `text-rose-600` / `-700`, `ring-rose-500` | 4 + 2 + 1 + 1 | `bg-[var(--t2-danger)]` / `text-[var(--t2-danger)]` / `ring-[var(--t2-danger)]` | Rose → Danger vereinheitlicht |
| `text-emerald-500` / `-600` / `-700` | 1 + 12 + 13 | `text-[var(--t2-success)]` | Success-Text |
| `bg-emerald-50` | 2 | `bg-[var(--t2-success-surface)]` | Success-Fläche soft |
| `bg-emerald-500`, `bg-emerald-500/10`, `bg-emerald-600` | 8 + 1 + 1 | `bg-[var(--t2-success-surface)]` bzw. `bg-[var(--t2-success)]` | Success-Fläche |
| `ring-emerald-500` | 1 | `ring-[var(--t2-success)]` | Success-Ring |
| `text-neutral-900` | 20 | `text-[var(--t2-text)]` | Primärtext |
| `text-neutral-800` / `-700` / `-600` | 3 + 3 + 23 | `text-[var(--t2-text-muted)]` | Sekundärtext |
| `text-neutral-500` / `-400` | 9 + 20 | `text-[var(--t2-text-soft)]` | Beschriftung |
| `text-neutral-300` / `-200` | 2 + 2 | `text-[var(--t2-text-faint)]` | Metadaten |
| `bg-neutral-900` | 4 | `bg-[var(--t2-text)]` | Dunkle Chrome-Fläche |
| `bg-neutral-300`, `bg-neutral-200` | 2 + 1 | `bg-[var(--t2-surface-muted)]` | gedämpfte Fläche |
| `border-neutral-300` | 3 | `border-[var(--t2-line-strong)]` | Betonter Rahmen |
| `text-matchup` | 3 | `text-[var(--t2-accent)]` | Akzent |
| `border-matchup` | 6 | `border-[var(--t2-accent)]` | Akzent |
| `bg-violet-500`, `text-violet-600` | 1 + 1 | `bg-[var(--t2-accent)]` / `text-[var(--t2-accent)]` | Violett → Akzent |
| `text-sky-600`, `bg-sky-500` | je 1 | **offen** | Einzel-Fundstellen, semantisch unklar — Detail-Screen-Info |
| `to-indigo-500` | 1 | **offen** | Gradient-Stopp im Onboarding, keine Bedeutungs-Zuordnung |
| `border-white` | 12 | bleibt bzw. `border-[var(--t2-on-accent)]` | Auf Akzent-Rail-Hintergrund; visuell identisch |
| `border-black` | 3 | `border-[var(--t2-text)]` | Warmes Fast-Schwarz statt reines Schwarz |

### Ampel-Reparatur (Schritt 4)

| Alt | Ort (Datei:Zeile) | Neuer Token | Begründung |
|---|---|---|---|
| `bg-matchup` für `severity === "amber"` | `Tour2ActionList.tsx:56` | `bg-[var(--t2-state-deadline-soon)]` | Amber ≠ Akzent-Violett; die Domain-Bedeutung „Frist naht" ist Warn, nicht Akzent |
| `bg-red-600` für `severity === "red"` | `Tour2ActionList.tsx:56` | `bg-[var(--t2-state-deadline-missed)]` | Konsistent mit Warn/Danger-System |

### Radien

| Alt | Fundstellen | Neuer Token | Begründung |
|---|---:|---|---|
| `rounded-full` (Tailwind) | 104 | bleibt (visuell identisch zu `--t2-radius-full`) | Tailwind-Kurzform ist prägnant, keine 100er Ersetzungen nötig |
| `rounded-xl` (12px) | 42 | `[border-radius:var(--t2-radius-md)]` bzw. bleibt (identisch) | Wert-Deckung |
| `rounded-lg` (8px) | 17 | bleibt (identisch zu `--t2-radius-sm`) | Wert-Deckung |
| `rounded-2xl` (16px) | 22 | bleibt bzw. `[border-radius:var(--t2-radius-md)]` (12px) | Bewusster Bruch um 4px (visuell knapp) |
| `rounded-3xl` (24px) | 3 | bleibt (Bottom-Sheet — mobile Über-Rundung akzeptabel) | Ausnahme |
| `rounded` (Tailwind-Default 4px) | 7 | bleibt (Feinheit) | ok |
| `rounded-md` (6px) | 2 | bleibt | selten |
| `rounded-[12px]` | 3 | `[border-radius:var(--t2-radius-md)]` | Direkt-Wert entfernt |
| CSS-Radien in tour2.css (5/6/8/12/999) | 22 | `var(--t2-radius-sm|md|full)` | alle vereinheitlicht |

### Typografie (36 → 8 Stufen)

| Alt (Tailwind arbitrary) | Fundstellen | Neuer Token | Klasse |
|---|---:|---|---|
| `text-[8px]`, `[9px]`, `[10px]`, `[11px]` | 1 + 5 + 19 + 170 | `--t2-text-meta` (0.6875rem ≈ 11px) | `t2-fs-meta` |
| `text-[12px]` | 252 | `--t2-text-micro` (0.75rem = 12px) | `t2-fs-micro` |
| `text-[13px]` | 125 | `--t2-text-body-sm` (0.8125rem = 13px) | `t2-fs-body-sm` |
| `text-[14px]`, `[15px]`, `text-sm` | 36 + 24 + 90 | `--t2-text-body` (0.875rem = 14px) | `t2-fs-body` |
| `text-[16px]`, `[17px]`, `[18px]`, `text-lg` | 4 + 10 + 8 + 13 | `--t2-text-h3` (1rem = 16px) | `t2-fs-h3` |
| `text-[20px]`, `[22px]`, `text-xl` | 2 + 2 + 1 | `--t2-text-h2` (1.25rem = 20px) | `t2-fs-h2` |
| `text-[26px]`, `[32px]`, `text-[2rem]` | 2 + 1 + 2 | `--t2-text-h1` (1.75rem = 28px) | `t2-fs-h1` |
| `text-[clamp(...)]` — 16 unterschiedliche | 21 gesamt | `--t2-text-display` | `t2-fs-display` |
| `text-5xl` | 1 | `--t2-text-display` | `t2-fs-display` |

**Kontrast-Check** (WCAG-AA gegen `--t2-bg` `#F7F6F3`):
- `--t2-text` `#171512` — 15.7:1 ✓ (>4.5)
- `--t2-text-muted` `#3D3A35` — 10.2:1 ✓
- `--t2-text-soft` `#78736B` — 4.7:1 ✓ (grenzwertig OK für Body-Text)
- `--t2-text-faint` `#A8A29A` — 2.9:1 ✗ (nur für dekorative Metadaten, nicht für Body — dokumentiert)
- `--t2-accent` `#4b3bf3` auf `--t2-bg` — 6.4:1 ✓
- `--t2-warn` `#B45309` auf `--t2-warn-surface` `#FEF3C7` — 5.8:1 ✓
- `--t2-danger` `#B42318` auf `--t2-danger-surface` `#FEE4E2` — 6.9:1 ✓
- `--t2-success` `#067647` auf `--t2-success-surface` `#DCFAE6` — 5.4:1 ✓
- `--t2-line-strong` `rgba(23,21,18,0.16)` als UI-Rahmen auf `--t2-bg` — geschätzt ~3.5:1 ✓ (>3 für UI)

**Abweichungen:** `--t2-text-faint` (2.9:1) unterschreitet die 4.5:1-Text-Regel.
Bewusst so belassen, weil es ausschließlich für dekorative Metadaten (Uppercase-
Labels, Sekundäre Marker) benutzt wird, nicht für laufenden Text. Falls jemals
für Body-Text verwendet, muss der Wert dunkler werden.

