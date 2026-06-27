# MATCHUP WEBAPP — Vollständiger Implementierungsplan

> **Dieses Dokument ist die einzige Quelle der Wahrheit.**
> Claude Code soll es von oben nach unten abarbeiten.
> Jede Phase muss vollständig abgeschlossen sein, bevor die nächste beginnt.
> Erstellt: 27.06.2026

---

## PHASE 0 — Projekt analysieren & verstehen

### Step 0.1 — Bestehende Projektstruktur lesen

```bash
# Führe zuerst aus:
find . -type f -name "*.tsx" -o -name "*.ts" -o -name "*.jsx" -o -name "*.js" | head -80
cat package.json
```

Ziel: Verstehe ob es ein Next.js App-Router (`app/`) oder Pages-Router (`pages/`) Projekt ist. Identifiziere:

- [ ] Router-Typ (App-Router vs Pages-Router)
- [ ] CSS-Framework (Tailwind? CSS Modules? Styled Components?)
- [ ] Komponentenstruktur (wo liegen Header, Footer, Layout?)
- [ ] Vorhandene Seiten und ihre Pfade
- [ ] Bestehende Farb-Variablen / Theme-Tokens (in `tailwind.config`, `globals.css` oder Theme-Datei)

### Step 0.2 — Design-Tokens extrahieren

Öffne `tailwind.config.ts` (oder `.js`) und `globals.css`. Notiere dir:

- **Primärfarbe** (vermutlich Whoop-Grün `#44D62C` oder ähnlich)
- **Hintergrundfarbe** (vermutlich `#000000` oder `#0a0a0a`)
- **Card-Hintergrund** (vermutlich `#1a1a1a` oder `#111`)
- **Textfarbe** (vermutlich `#ffffff`)
- **Sekundärtextfarbe** (vermutlich `#a1a1a1` oder `#888`)
- **Border-Farbe** (vermutlich `#2a2a2a` oder `#333`)
- **Font-Family** (vermutlich eine System- oder Google-Font)
- **Border-Radius-Werte** (vermutlich `rounded-2xl` = 16px, `rounded-full`)

Diese Werte werden 1:1 in der Webapp wiederverwendet. Erfinde KEINE neuen Farben.

### Step 0.3 — Header-Komponente identifizieren

```bash
grep -rl "Testmonat\|Join\|nav\|Nav\|Header\|header" --include="*.tsx" --include="*.jsx" .
```

Finde die Datei, die die Hauptnavigation enthält. Merke dir:
- Dateipfad
- Komponentenname
- Alle bestehenden Navigationslinks (Text + href)
- Den CTA-Button (Text + href + CSS-Klassen)
- Ob ein Mobile-Burger-Menü existiert und wo dessen Links definiert sind

### Step 0.4 — Alle Text-tragenden Komponenten identifizieren

```bash
grep -rn "Kenne deinen\|Know your\|WHOOP\|whoop\|Testmonat\|recovery\|Recovery\|strain\|Strain\|sleep\|Sleep" --include="*.tsx" --include="*.jsx" .
```

Liste jede Datei auf, die Whoop-spezifischen Text enthält. Für jede Datei:
- Dateipfad
- Zeilennummern mit Text
- Kontext (Hero? Feature-Block? Footer? CTA?)

---

## PHASE 1 — Header-Navigation ändern (NUR Text + Links)

### Step 1.1 — Desktop-Navigation

Öffne die identifizierte Header-Datei. Suche das Array oder die JSX-Elemente der Navigationslinks.

**Vorher (Beispiel — exakte Struktur variiert):**
```tsx
const links = [
  { label: "Produkt", href: "/product" },
  { label: "Mitgliedschaft", href: "/membership" },
  { label: "Wissenschaft", href: "/science" },
]
```

**Nachher (exakte neue Werte):**
```tsx
const links = [
  { label: "Find a Partner", href: "/find-a-partner" },
  { label: "Shop", href: "/shop" },
  { label: "Beratung", href: "/beratung" },
  { label: "Events", href: "/events" },
]
```

**Regeln:**
- Ändere NUR die `label`- und `href`-Werte
- Füge KEINEN neuen Link zum Array hinzu falls es vorher 4 waren und jetzt auch 4 sind
- Falls vorher nur 3 Links waren, füge den 4. hinzu mit exakt der gleichen Objekt-Struktur
- Ändere KEINE CSS-Klassen, KEINE Tailwind-Klassen, KEIN Spacing

### Step 1.2 — CTA-Button im Header

Suche den Button/Link ganz rechts im Header (der bisherige „Testmonat starten" o.ä.).

**Nachher:**
- Text: `App`
- href: `/app`
- Alle CSS-Klassen bleiben identisch (Farbe, Padding, Border-Radius, Hover-Effekt)

### Step 1.3 — Mobile-Menü (Burger/Drawer)

Falls ein Mobile-Menü existiert (suche nach `menuOpen`, `isOpen`, `drawer`, `burger`, `hamburger`, `mobile-menu`):

- Finde die Mobile-Links (oft ein separates Array oder JSX-Block)
- Ersetze mit exakt denselben Labels und hrefs wie in Step 1.1 + 1.2
- Ändere KEINE Animationen, KEIN Overlay, KEINE Schliessen-Logik

### Step 1.4 — Logo-Text (falls vorhanden)

Falls der Header ein Text-Logo „WHOOP" enthält:
- Ersetze durch `MATCHUP`
- Gleiche CSS-Klassen (font-weight, letter-spacing, text-transform)

### Step 1.5 — Verifizierung

```
Checklist:
[ ] Desktop: 4 Nav-Links + 1 CTA-Button sichtbar
[ ] Mobile: Burger-Menü zeigt gleiche 5 Links
[ ] Kein CSS wurde geändert
[ ] Kein Layout wurde geändert
[ ] Alle Links zeigen auf korrekte Routen
[ ] Logo-Text ist "MATCHUP" (falls Text-Logo)
```

---

## PHASE 2 — Textinhalte auf bestehenden Seiten ersetzen

### Step 2.1 — Startseite Hero-Section

Finde die Hero-Komponente (typisch: grosses Bild/Video, grosse Headline, Subtext, CTA).

**Suche nach Elementen (in dieser Reihenfolge):**

1. **Haupt-Headline** (das grösste `<h1>` oder Element mit der grössten Schriftgrösse)
   - Finde den exakten bestehenden String
   - Ersetze durch: `Finde deinen perfekten Spielpartner.`
   - Ändere NICHTS an: Tag (`h1`), Klassen, Font-Size, Font-Weight, Color, Margin, Padding

2. **Sub-Headline / Beschreibungstext** (typisch ein `<p>` unter der Headline)
   - Ersetze durch: `Matchup verbindet dich mit Tennis-, Padel- und Pickleball-Spielern in deiner Nähe. Matche, chatte und spiele — alles in einer App.`

3. **Primärer CTA-Button** (der auffälligste Button)
   - Text: `Jetzt Partner finden`
   - href: `/app`

4. **Sekundärer CTA/Link** (falls vorhanden, z.B. „Mehr erfahren")
   - Text: `So funktioniert's`
   - href: `/find-a-partner`

5. **Hintergrundbild/Video:** NICHT ändern. Falls ein `alt`-Text existiert, ersetze durch: `Spieler beim Tennis auf dem Platz`

### Step 2.2 — Feature-Blöcke auf der Startseite

Die Startseite hat typischerweise 3–6 abwechselnde Bild-Text-Sektionen. Identifiziere jede einzelne.

**Für jeden Feature-Block gilt:**
- Ändere NUR den Text (Überschrift + Beschreibung + ggf. Button-Text)
- Ändere KEIN Bild, KEINE Reihenfolge, KEIN Layout
- Falls ein Block einen CTA-Button hat: Text + href ändern, sonst nichts

**Block 1 (der erste Feature-Block nach dem Hero):**
```
Überschrift: "Entdecke Spieler um dich herum"
Text:        "Swipe durch Profile von verifizierten Spielern. Filtere nach
              Sportart, Skill-Level, Alter und Entfernung. Bei gegenseitigem
              Like entsteht ein Match — und ihr könnt sofort chatten."
Button:      "Partner entdecken" → href="/app"
```

**Block 2:**
```
Überschrift: "Organisiere Spiele in Sekunden"
Text:        "Erstelle ein Match, wähle Ort und Zeit, lade Mitspieler ein
              oder tritt offenen Spielen bei. Singles oder Doubles, spontan
              oder geplant — alles an einem Ort."
Button:      "Spiel erstellen" → href="/app"
```

**Block 3:**
```
Überschrift: "Deine Sport-Community"
Text:        "Gründe Gruppen, tausche dich im Feed aus und vernetze dich mit
              Gleichgesinnten. Von Club-Gruppen bis zu lokalen Spieltreffs —
              Matchup bringt Spieler zusammen."
Button:      "Community entdecken" → href="/app"
```

**Block 4 (falls vorhanden):**
```
Überschrift: "Verfolge deinen Fortschritt"
Text:        "Sammle XP, steige im Level auf, halte deinen Streak und schalte
              Achievements frei. Detaillierte Wochen-Statistiken zeigen dir,
              wie aktiv du bist."
Button:      (keiner nötig — falls einer da ist: "Jetzt starten" → href="/app")
```

**Block 5 (falls vorhanden):**
```
Überschrift: "Sicher und verifiziert"
Text:        "Jedes Profil wird geprüft. Melde unangemessenes Verhalten,
              blockiere Nutzer und vertraue auf automatische Moderation.
              Deine Daten gehören dir."
Button:      (keiner nötig)
```

**Falls mehr oder weniger Blöcke existieren:**
- Bei mehr: Weitere Blöcke mit sinnvollen Matchup-Texten füllen (z.B. „Events & Turniere", „Für jeden Level")
- Bei weniger: Nur die vorhandenen Blöcke füllen, keine neuen erstellen

### Step 2.3 — Statistiken/Zahlen-Sektion (falls vorhanden)

Whoop-Seiten haben oft eine Sektion mit grossen Zahlen. Falls vorhanden:

```
Zahl 1: "3 Sportarten"    → Untertitel: "Tennis, Padel & Pickleball"
Zahl 2: "50+ Clubs"       → Untertitel: "In der Schweiz vernetzt"
Zahl 3: "1000+ Spieler"   → Untertitel: "Aktive Community"
```

### Step 2.4 — Testimonials/Zitate-Sektion (falls vorhanden)

Falls es eine Sektion mit Kundenstimmen gibt:

```
Zitat 1: "Seit ich Matchup nutze, spiele ich dreimal pro Woche. Die App hat mir geholfen, Spielpartner auf meinem Level zu finden." — Anna, Zürich
Zitat 2: "Padel-Partner in meiner Nähe zu finden war unmöglich. Mit Matchup hatte ich nach 2 Tagen mein erstes Match." — Marco, Bern
Zitat 3: "Die Gruppen-Funktion ist genial. Unser Donnerstag-Tennis hat sich verdoppelt." — Lisa, Basel
```

### Step 2.5 — Newsletter/CTA-Banner-Sektion (falls vorhanden)

```
Überschrift: "Bereit für dein nächstes Match?"
Text:        "Erstelle dein Profil in unter 3 Minuten und finde Spielpartner in deiner Nähe."
Button:      "Kostenlos starten" → href="/app"
```

### Step 2.6 — Footer

Finde die Footer-Komponente.

**Spalte 1 — Produkt/Navigation:**
```
Überschrift: "Matchup"
Links:
  - "Find a Partner" → /find-a-partner
  - "Shop" → /shop
  - "Beratung" → /beratung
  - "Events" → /events
  - "App" → /app
```

**Spalte 2 — Rechtliches:**
```
Überschrift: "Rechtliches"
Links:
  - "Datenschutz" → /datenschutz (oder bestehender Link)
  - "AGB" → /agb (oder bestehender Link)
  - "Impressum" → /impressum (oder bestehender Link)
```

**Spalte 3 — Support:**
```
Überschrift: "Support"
Links:
  - "Hilfe & FAQ" → /faq (oder #)
  - "Kontakt" → /kontakt (oder mailto:hello@matchup.ch)
  - "Feedback" → # (Platzhalter)
```

**Copyright-Zeile:**
```
© 2026 Matchup. Alle Rechte vorbehalten.
```

**Social-Media-Links:** Text/aria-labels anpassen (z.B. „Matchup auf Instagram"), hrefs können `#` bleiben.

### Step 2.7 — Meta-Tags & SEO

Finde die `<Head>` / `metadata` / `layout.tsx`-Datei.

```tsx
// App-Router:
export const metadata = {
  title: 'Matchup — Finde deinen Spielpartner für Tennis, Padel & Pickleball',
  description: 'Matchup verbindet Spieler für Tennis, Padel und Pickleball. Matche, chatte und organisiere Spiele in deiner Nähe.',
}

// Pages-Router:
<Head>
  <title>Matchup — Finde deinen Spielpartner für Tennis, Padel & Pickleball</title>
  <meta name="description" content="Matchup verbindet Spieler für Tennis, Padel und Pickleball. Matche, chatte und organisiere Spiele in deiner Nähe." />
</Head>
```

### Step 2.8 — Verifizierung Phase 2

```
Checklist:
[ ] Hero-Headline geändert
[ ] Hero-Subtext geändert
[ ] Hero-CTA geändert (Text + href)
[ ] Jeder Feature-Block hat neuen Text
[ ] Feature-Block-Buttons haben neue Texte + hrefs
[ ] Footer komplett umgetextet (3 Spalten + Copyright)
[ ] Meta-Tags aktualisiert
[ ] KEIN CSS wurde geändert
[ ] KEIN Layout wurde geändert
[ ] KEIN Bild wurde geändert oder entfernt
[ ] Seite läuft ohne Fehler im Browser
```

---

## PHASE 3 — Neue Unterseiten erstellen

### Step 3.1 — Seiten-Template identifizieren

Bevor du neue Seiten erstellst, finde die bestehende Seitenstruktur. Jede bestehende Unterseite (z.B. `/product`, `/membership`) verwendet vermutlich:
- Das gleiche Layout (Header + Footer)
- Die gleichen Sektions-Komponenten (Hero, Feature-Block, CTA-Banner)
- Die gleichen CSS-Klassen

Kopiere die Struktur einer bestehenden Unterseite als Template.

### Step 3.2 — `/find-a-partner` erstellen

Erstelle die Datei: `app/find-a-partner/page.tsx` (App-Router) oder `pages/find-a-partner.tsx` (Pages-Router)

**Seitenstruktur (nutze bestehende Komponenten/Klassen):**

```
Sektion 1 — Page-Hero (kleinerer Hero als Startseite):
  Überschrift (h1): "So findest du deinen Spielpartner"
  Untertext (p):    "In drei einfachen Schritten zum perfekten Match."

Sektion 2 — 3-Schritte-Erklärung (nutze Feature-Block-Struktur):

  Schritt 1:
    Nummer/Label:  "01"
    Überschrift:   "Erstelle dein Profil"
    Text:          "Wähle deine Sportarten (Tennis, Padel, Pickleball), gib dein
                    Skill-Level an, lade bis zu 4 Fotos hoch und sag uns, was du
                    suchst — ob lockeres Spielen oder Wettkampf."
    (Bild: bestehendes Bild beibehalten oder Platzhalter)

  Schritt 2:
    Nummer/Label:  "02"
    Überschrift:   "Entdecke & Matche"
    Text:          "Swipe durch passende Spieler in deiner Nähe. Filtere nach
                    Distanz, Sportart, Alter und Können. Findest du jemanden
                    interessant? Like das Profil. Liked die Person zurück,
                    entsteht ein Match."

  Schritt 3:
    Nummer/Label:  "03"
    Überschrift:   "Chatte & Spiele"
    Text:          "Schreibe deinem Match direkt in der App. Organisiert gemeinsam
                    ein Spiel, bucht einen Platz und trefft euch auf dem Court.
                    Oder tretet offenen Spielen anderer Spieler bei."

Sektion 3 — CTA-Banner:
  Überschrift: "Bereit?"
  Text:        "Erstelle jetzt dein Profil und finde deinen ersten Spielpartner."
  Button:      "Jetzt starten" → href="/app"
```

### Step 3.3 — `/shop` erstellen

```
Sektion 1 — Page-Hero:
  Überschrift (h1): "Matchup Shop"
  Untertext (p):    "Ausrüstung und Accessoires für Tennis, Padel und Pickleball."

Sektion 2 — Coming-Soon-Block (zentriert):
  Icon/Grafik:  Bestehende Icon-Komponente oder Emoji 🎾
  Überschrift:  "Bald verfügbar"
  Text:         "Wir arbeiten an einer kuratierten Auswahl an Schlägern, Schuhen
                 und Zubehör. Lass dich benachrichtigen, wenn es losgeht."
  Input + Button: Email-Input (Platzhalter, ohne Backend-Logik) +
                  Button "Benachrichtigen" (onClick zeigt Toast "Danke! Wir melden uns.")
```

### Step 3.4 — `/beratung` erstellen

```
Sektion 1 — Page-Hero:
  Überschrift (h1): "Persönliche Beratung"
  Untertext (p):    "Von der Sportauswahl bis zum perfekten Schläger — wir helfen dir weiter."

Sektion 2 — 3 Beratungsblöcke (Feature-Block-Struktur):

  Block 1:
    Überschrift:  "Welcher Sport passt zu dir?"
    Text:         "Tennis, Padel oder Pickleball — jede Sportart hat ihren eigenen Reiz.
                   Wir helfen dir herauszufinden, welche am besten zu deinem Spielstil,
                   deiner Fitness und deinen Zielen passt."

  Block 2:
    Überschrift:  "Der richtige Schläger"
    Text:         "Gewicht, Balance, Bespannung, Griffstärke — die Wahl des richtigen
                   Schlägers macht den Unterschied. Basierend auf deinem Level und
                   Spielstil geben wir individuelle Empfehlungen."

  Block 3:
    Überschrift:  "Training & Coaching"
    Text:         "Finde Coaches, Trainingsgruppen und Kursangebote in deiner Nähe.
                   Ob Anfänger-Kurs oder Intensiv-Training — wir verbinden dich
                   mit den richtigen Leuten."

Sektion 3 — CTA-Banner:
  Überschrift: "Beratung gewünscht?"
  Text:        "Schreib uns und wir helfen dir persönlich weiter."
  Button:      "Kontakt aufnehmen" → href="mailto:hello@matchup.ch"
```

### Step 3.5 — `/events` erstellen

```
Sektion 1 — Page-Hero:
  Überschrift (h1): "Events & Turniere"
  Untertext (p):    "Entdecke lokale Turniere, Social-Play-Events und Community-Treffen."

Sektion 2 — Event-Cards (nutze bestehende Card-Komponente oder Feature-Block):

  Event 1:
    Datum-Badge:   "12. Jul 2026"
    Überschrift:   "Summer Smash — Zürich"
    Beschreibung:  "Padel-Turnier für alle Level. Mixed-Teams, DJ und Afterparty."
    Ort:           "📍 Padel Zone Zürich"
    Button:        "Mehr erfahren" → href="#" (Platzhalter)

  Event 2:
    Datum-Badge:   "19. Jul 2026"
    Überschrift:   "Matchup Mixednight — Bern"
    Beschreibung:  "Tennis Mixed-Doubles Abend. Zufällige Paarungen, lockere Atmosphäre."
    Ort:           "📍 TC Bern-Neufeld"
    Button:        "Mehr erfahren" → href="#"

  Event 3:
    Datum-Badge:   "26. Jul 2026"
    Überschrift:   "Pickleball Open — Basel"
    Beschreibung:  "Das erste Schweizer Pickleball Open. Einsteiger bis Fortgeschrittene."
    Ort:           "📍 Sportcenter St. Jakob, Basel"
    Button:        "Mehr erfahren" → href="#"

  Event 4:
    Datum-Badge:   "09. Aug 2026"
    Überschrift:   "Community Day — Luzern"
    Beschreibung:  "Offener Spieltag für die gesamte Matchup-Community. Alle Sportarten."
    Ort:           "📍 Sportanlage Allmend, Luzern"
    Button:        "Mehr erfahren" → href="#"

Sektion 3 — CTA-Banner:
  Überschrift: "Eigenes Event planen?"
  Text:        "In der Matchup App kannst du Spiele und Turniere selbst organisieren."
  Button:      "App öffnen" → href="/app"
```

### Step 3.6 — Verifizierung Phase 3

```
Checklist:
[ ] /find-a-partner lädt und zeigt 3-Schritte-Erklärung
[ ] /shop lädt und zeigt Coming-Soon
[ ] /beratung lädt und zeigt 3 Beratungsblöcke
[ ] /events lädt und zeigt 4 Event-Cards
[ ] Alle Seiten nutzen das gleiche Layout (Header + Footer)
[ ] Alle Seiten nutzen bestehende CSS-Klassen/Komponenten
[ ] Keine neuen Styles erfunden
[ ] Header-Links funktionieren zu allen neuen Seiten
```

---

## PHASE 4 — Supabase-Integration vorbereiten

### Step 4.1 — Paket installieren

```bash
npm install @supabase/supabase-js
```

### Step 4.2 — Supabase-Client erstellen

Erstelle `lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})
```

### Step 4.3 — Environment-Variablen

Erstelle `.env.local` (wird NICHT committet — in `.gitignore` eintragen):

```
NEXT_PUBLIC_SUPABASE_URL=https://dqeroewcdclgxujhubht.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=HIER_ANON_KEY_EINTRAGEN
```

**Wichtig:** Den Anon-Key muss der Entwickler manuell aus dem Supabase-Dashboard kopieren. Schreibe einen Kommentar in die Datei:

```
# Den Anon-Key findest du unter:
# https://supabase.com/dashboard/project/dqeroewcdclgxujhubht/settings/api
# → "Project API keys" → "anon / public"
```

### Step 4.4 — TypeScript-Typen definieren

Erstelle `lib/types.ts` — diese Typen bilden das exakte Datenbankschema ab:

```typescript
// ============================================================
//  PROFILE
// ============================================================
export interface Profile {
  id: string                          // = auth.users.id (UUID)
  apple_id: string | null
  google_id: string | null
  display_name: string
  first_name: string
  username: string | null             // unique, Migration 016
  age: number                         // CHECK >= 18
  gender: 'male' | 'female'
  height_cm: number | null            // 140–220
  city: string | null
  country: string                     // default 'CH'
  country_name: string | null
  place_id: string | null
  latitude: number | null
  longitude: number | null
  search_radius_km: number            // default 25
  club_id: string | null              // FK → clubs.id
  club_name_manual: string | null
  sports: Sport[]                     // PostgreSQL array, CHECK length >= 1
  skill_level: SkillLevel
  official_rating: string | null
  goals: string[]                     // PostgreSQL array
  bio: string | null                  // max 300 chars
  profile_image: string | null        // URL zu avatars-Bucket
  additional_images: string[]         // bis zu 3 weitere URLs
  visibility_gender: string[]         // ['male'], ['female'], ['male','female']
  visibility_age_min: number          // default 18
  visibility_age_max: number          // default 99
  is_paused: boolean                  // default false
  is_verified: boolean                // default false
  is_banned: boolean                  // default false
  is_seed: boolean                    // default false, Migration 021
  report_count: number                // default 0
  pause_reason: string | null
  banned_at: string | null            // ISO timestamp
  daily_likes_count: number           // default 0
  daily_likes_reset: string | null    // ISO timestamp
  device_fingerprint: string | null
  push_matches: boolean               // default true
  push_messages: boolean               // default true
  push_reminders: boolean              // default true
  push_community: boolean              // default true
  public_posts: boolean               // default true, Migration 018
  fcm_token: string | null
  created_at: string                  // ISO timestamp
  updated_at: string                  // ISO timestamp
  last_active: string                 // ISO timestamp
}

export type Sport = 'tennis' | 'padel' | 'pickleball'
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'competitive'

// ============================================================
//  CLUB
// ============================================================
export interface Club {
  id: string
  name: string
  city: string | null
  canton: string | null
  state: string | null
  country: string                     // default 'CH'
  latitude: number | null
  longitude: number | null
}

// ============================================================
//  LIKE
// ============================================================
export interface Like {
  id: string
  from_user_id: string                // FK → profiles.id, CHECK != to_user_id
  to_user_id: string                  // FK → profiles.id
  created_at: string
}

// ============================================================
//  SKIP
// ============================================================
export interface Skip {
  id: string
  user_id: string
  skipped_user_id: string
  skipped_at: string                  // 14-Tage-Fenster
}

// ============================================================
//  MATCH
// ============================================================
export interface AppMatch {
  id: string
  user1_id: string                    // sortierte ID (kleinere UUID)
  user2_id: string                    // sortierte ID (grössere UUID)
  is_active: boolean                  // default true, false = unmatched
  game_event_id: string | null        // Migration 010
  created_at: string
  updated_at: string
  // Joined fields (client-seitig):
  user1?: Profile
  user2?: Profile
  last_message?: Message
}

// ============================================================
//  MESSAGE (1:1 Chat)
// ============================================================
export interface Message {
  id: string
  match_id: string                    // FK → matches.id
  sender_id: string                   // FK → profiles.id
  content: string
  is_read: boolean                    // default false
  delivered_at: string | null         // Migration 007
  read_at: string | null              // Migration 007
  client_message_id: string | null    // Dedup-Key
  created_at: string
}

// ============================================================
//  GROUP
// ============================================================
export interface Group {
  id: string
  name: string
  description: string | null
  image_url: string | null            // nullable, Migration 024
  sport: Sport
  max_members: number
  is_open: boolean                    // Migration 011
  latitude: number | null
  longitude: number | null
  club_id: string | null
  created_by: string                  // FK → profiles.id
  created_at: string
  // Joined:
  member_count?: number
  my_role?: GroupRole | null
}

export type GroupRole = 'owner' | 'admin' | 'member'

export interface GroupMember {
  id: string
  group_id: string
  user_id: string
  role: GroupRole
  joined_at: string
  // Joined:
  profile?: Profile
}

export interface GroupMessage {
  id: string
  group_id: string
  sender_id: string
  content: string
  created_at: string
  // Joined:
  sender?: Profile
}

// ============================================================
//  COMMUNITY
// ============================================================
export interface CommunityPost {
  id: string
  club_id: string | null              // null = global, Migration 017
  author_id: string
  content: string
  likes_count: number                 // Migration 016, Trigger-maintained
  comments_count: number              // Migration 016
  created_at: string
  // Joined:
  author?: Profile
  is_liked_by_me?: boolean
}

export interface CommunityComment {
  id: string
  post_id: string
  author_id: string
  content: string
  created_at: string
  // Joined:
  author?: Profile
}

export interface CommunityLike {
  id: string
  post_id: string
  user_id: string
  created_at: string
}

export interface Follower {
  id: string
  follower_id: string
  following_id: string
  created_at: string
}

// ============================================================
//  GAME EVENT
// ============================================================
export type GameType = 'singles' | 'doubles'
export type GameStatus = 'planned' | 'confirmed' | 'cancelled' | 'completed'
export type ParticipantStatus = 'invited' | 'requested' | 'accepted' | 'declined' | 'cancelled'

export interface GameEvent {
  id: string
  created_by: string
  sport: Sport
  game_type: GameType
  date_time: string                   // ISO timestamp
  location: string
  court_number: string | null         // Migration 025
  court_booked: boolean
  description: string | null          // Migration 010
  max_participants: number | null     // Migration 010
  is_open: boolean                    // Migration 010
  status: GameStatus
  skill_range: string | null          // Migration 025
  visibility_gender: string[] | null
  visibility_age_min: number | null
  visibility_age_max: number | null
  visibility_skill_levels: string[] | null
  club_id: string | null              // Migration 013
  match_id: string | null
  group_id: string | null
  created_at: string
  // Joined:
  creator?: Profile
  participants?: GameParticipant[]
}

export interface GameParticipant {
  id: string
  game_event_id: string
  user_id: string
  status: ParticipantStatus
  requested_at: string | null
  confirmed_at: string | null
  created_at: string
  // Joined:
  profile?: Profile
}

// ============================================================
//  MODERATION
// ============================================================
export interface Report {
  id: string
  reporter_id: string
  reported_user_id: string | null
  reported_post_id: string | null
  reported_message_id: string | null
  reason: string
  status: 'pending' | 'reviewed' | 'actioned' | 'dismissed'
  admin_note: string | null
  reviewed_at: string | null
  created_at: string
}

export interface Block {
  id: string
  blocker_id: string
  blocked_id: string
  created_at: string
}

export interface Warning {
  id: string
  user_id: string
  message: string
  is_read: boolean
  created_at: string
}

// ============================================================
//  SUPPORT
// ============================================================
export type TicketStatus = 'open' | 'answered' | 'in_progress' | 'closed'

export interface SupportTicket {
  id: string
  user_id: string
  subject: string
  status: TicketStatus
  created_at: string
  updated_at: string
}

export interface SupportMessage {
  id: string
  ticket_id: string
  sender_id: string
  sender_type: 'user' | 'admin'
  content: string
  created_at: string
}

// ============================================================
//  GAMIFICATION
// ============================================================
export interface PlayerStats {
  id: string
  user_id: string
  total_matches: number
  wins: number
  losses: number
  current_streak: number
  longest_streak: number
  xp_points: number
  level: number
  favorite_day: string | null
  favorite_time: string | null
  favorite_court: string | null
  different_partners: number
  tennis_matches: number
  padel_matches: number
  updated_at: string
}

export interface Achievement {
  id: string
  user_id: string
  achievement_key: string
  unlocked_at: string
}

// Achievement-Definitionen (client-seitig):
export const ACHIEVEMENT_DEFS: Record<string, { label: string; description: string; icon: string }> = {
  first_serve:      { label: 'First Serve',      description: 'Erstes Match gespielt',       icon: '🎾' },
  match_machine:    { label: 'Match Machine',     description: '50 Matches gespielt',         icon: '⚡' },
  century:          { label: 'Century',           description: '100 Matches gespielt',        icon: '💯' },
  padel_pioneer:    { label: 'Padel Pioneer',     description: 'Erstes Padel-Match',          icon: '🏸' },
  social_butterfly: { label: 'Social Butterfly',  description: '10 verschiedene Partner',     icon: '🦋' },
  streak_master:    { label: 'Streak Master',     description: '7-Tage-Streak erreicht',      icon: '🔥' },
  win_streak_3:     { label: 'Winning Streak',    description: '3-Tage-Streak mit Siegen',    icon: '🏆' },
}

// ============================================================
//  ONBOARDING STATE (client-seitig)
// ============================================================
export interface OnboardingState {
  step: number                         // 1–12
  language: 'de' | 'en'
  sports: Sport[]
  city: string
  latitude: number | null
  longitude: number | null
  country: string
  club_id: string | null
  club_name: string | null
  first_name: string
  age: number | null
  gender: 'male' | 'female' | null
  skill_level: SkillLevel | null
  official_rating: string
  height_cm: number | null
  goals: string[]
  photos: File[]                       // lokale File-Objekte vor Upload
  photo_urls: string[]                 // nach Upload: Public-URLs
  bio: string
  visibility_gender: string[]
  visibility_age_min: number
  visibility_age_max: number
}
```

### Step 4.5 — Utility-Funktionen

Erstelle `lib/utils/haversine.ts`:

```typescript
/**
 * Berechnet die Distanz zwischen zwei Koordinaten in Kilometern.
 * Gleiche Formel wie die DB-Funktion calculate_distance_km().
 */
export function haversineKm(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371 // Erdradius in km
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Math.round(R * c * 10) / 10 // 1 Dezimalstelle
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180)
}
```

Erstelle `lib/utils/imageCompress.ts`:

```typescript
/**
 * Komprimiert ein Bild client-seitig via Canvas.
 * Zielgrösse: längste Seite max 1600px, JPEG Q 0.9.
 * Falls > 2.5 MB: Fallback Q 0.85, dann Q 0.80.
 * Gleiche Pipeline wie die Flutter-App.
 */
export async function compressImage(file: File): Promise<Blob> {
  const img = await loadImage(file)
  const MAX_DIM = 1600
  const MAX_BYTES = 2.5 * 1024 * 1024

  let { width, height } = img
  if (width > MAX_DIM || height > MAX_DIM) {
    const ratio = Math.min(MAX_DIM / width, MAX_DIM / height)
    width = Math.round(width * ratio)
    height = Math.round(height * ratio)
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0, width, height)

  for (const quality of [0.9, 0.85, 0.8]) {
    const blob = await canvasToBlob(canvas, 'image/jpeg', quality)
    if (blob.size <= MAX_BYTES || quality === 0.8) return blob
  }

  return canvasToBlob(canvas, 'image/jpeg', 0.8) // Fallback
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error('Canvas toBlob failed')),
      type, quality
    )
  })
}
```

Erstelle `lib/utils/formatters.ts`:

```typescript
/**
 * Formatiert einen ISO-Timestamp relativ ("vor 2 Min.", "vor 3 Std.", "Gestern", etc.)
 */
export function timeAgo(isoString: string): string {
  const now = Date.now()
  const then = new Date(isoString).getTime()
  const diffMs = now - then
  const diffMin = Math.floor(diffMs / 60000)
  const diffHrs = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return 'Jetzt'
  if (diffMin < 60) return `vor ${diffMin} Min.`
  if (diffHrs < 24) return `vor ${diffHrs} Std.`
  if (diffDays < 7) return `vor ${diffDays} T.`
  return new Date(isoString).toLocaleDateString('de-CH', { day: 'numeric', month: 'short' })
}

/**
 * Formatiert Distanz: "0.3 km", "12 km", "142 km"
 */
export function formatDistance(km: number): string {
  if (km < 1) return `${(km).toFixed(1)} km`
  return `${Math.round(km)} km`
}

/**
 * Formatiert Datum für Events: "Sa, 28. Juni 2026 · 10:00"
 */
export function formatEventDate(isoString: string): string {
  const d = new Date(isoString)
  const day = d.toLocaleDateString('de-CH', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })
  const time = d.toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })
  return `${day} · ${time}`
}

/**
 * Prüft ob ein User online ist (last_active < 2 Minuten)
 */
export function isOnline(lastActive: string | null): boolean {
  if (!lastActive) return false
  return Date.now() - new Date(lastActive).getTime() < 2 * 60 * 1000
}

/**
 * Skill-Level auf Deutsch
 */
export function skillLabel(level: string): string {
  const map: Record<string, string> = {
    beginner: 'Anfänger',
    intermediate: 'Fortgeschritten',
    advanced: 'Advanced',
    competitive: 'Wettkampf',
  }
  return map[level] || level
}

/**
 * Sport-Icon
 */
export function sportIcon(sport: string): string {
  const map: Record<string, string> = {
    tennis: '🎾',
    padel: '🏸',
    pickleball: '🏓',
  }
  return map[sport] || '🎾'
}
```

---

## PHASE 5 — Auth-System

### Step 5.1 — Auth-Context erstellen

Erstelle `lib/auth.tsx`:

```typescript
'use client'
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import type { Profile } from './types'

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  // Session laden + Listener
  useEffect(() => {
    // Initiale Session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) loadProfile(session.user.id)
      else setLoading(false)
    })

    // Auth-State-Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) loadProfile(session.user.id)
        else { setProfile(null); setLoading(false) }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function loadProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    setProfile(error ? null : data)
    setLoading(false)
  }

  async function refreshProfile() {
    if (user) await loadProfile(user.id)
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  }

  async function signUp(email: string, password: string) {
    const { error } = await supabase.auth.signUp({ email, password })
    return { error: error?.message ?? null }
  }

  async function signOut() {
    // FCM-Token löschen
    if (profile) {
      await supabase.from('profiles').update({ fcm_token: null }).eq('id', profile.id)
    }
    await supabase.auth.signOut()
    setProfile(null)
  }

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signIn, signUp, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
```

### Step 5.2 — Auth-Screen Komponente

Erstelle `app/app/components/AuthScreen.tsx`:

**Visueller Aufbau (Mobile-First, Dark-Theme):**

```
┌──────────────────────────────────────────┐
│                                          │
│            MATCHUP                       │  ← Logo/Wortmarke, zentriert
│            🎾                            │  ← Sport-Icon
│                                          │
│   ┌──────────────────────────────────┐   │
│   │  Einloggen    |   Registrieren   │   │  ← Tab-Toggle, Akzentfarbe aktiv
│   └──────────────────────────────────┘   │
│                                          │
│   ┌──────────────────────────────────┐   │
│   │  📧 Email                        │   │  ← Input: bg-zinc-800, rounded-xl
│   └──────────────────────────────────┘   │
│                                          │
│   ┌──────────────────────────────────┐   │
│   │  🔒 Passwort                     │   │  ← Input: type=password, Eye-Toggle
│   └──────────────────────────────────┘   │
│                                          │
│   (nur bei Registrierung:)               │
│   ┌──────────────────────────────────┐   │
│   │  🔒 Passwort bestätigen          │   │
│   └──────────────────────────────────┘   │
│                                          │
│   ☑ Ich akzeptiere die AGB und           │  ← nur bei Registrierung
│     Datenschutzrichtlinie                │
│                                          │
│   ┌──────────────────────────────────┐   │
│   │         EINLOGGEN                │   │  ← Button: Akzentfarbe, rounded-full
│   └──────────────────────────────────┘   │
│                                          │
│   Passwort vergessen?                    │  ← Link, text-sm, unterstrichen
│                                          │
│   ── oder ──                             │  ← Divider mit Text
│                                          │
│   ┌──────────────────────────────────┐   │
│   │  🍎 Mit Apple anmelden           │   │  ← Button: bg-white, text-black
│   └──────────────────────────────────┘   │
│   ┌──────────────────────────────────┐   │
│   │  G  Mit Google anmelden          │   │  ← Button: bg-zinc-800
│   └──────────────────────────────────┘   │
│                                          │
└──────────────────────────────────────────┘
```

**State:**
```typescript
const [mode, setMode] = useState<'login' | 'register'>('login')
const [email, setEmail] = useState('')
const [password, setPassword] = useState('')
const [confirmPassword, setConfirmPassword] = useState('')
const [agreedToTerms, setAgreedToTerms] = useState(false)
const [showPassword, setShowPassword] = useState(false)
const [error, setError] = useState<string | null>(null)
const [isLoading, setIsLoading] = useState(false)
```

**Validierung:**
- Login: email nicht leer, password nicht leer
- Register: email gültig (regex), password >= 8 Zeichen, confirmPassword === password, agreedToTerms === true
- Bei Fehler: rotes Banner unter den Inputs mit Fehlertext

**Fehler-Mapping (deutsch):**
```typescript
function translateError(msg: string): string {
  if (msg.includes('Invalid login')) return 'Email oder Passwort falsch.'
  if (msg.includes('already registered')) return 'Diese Email ist bereits registriert.'
  if (msg.includes('Password should be')) return 'Passwort muss mindestens 8 Zeichen lang sein.'
  if (msg.includes('rate limit')) return 'Zu viele Versuche. Bitte warte einen Moment.'
  return 'Ein Fehler ist aufgetreten. Bitte versuche es erneut.'
}
```

---

## PHASE 6 — Onboarding-Flow (12 Schritte)

### Step 6.1 — Onboarding-Container

Erstelle `app/app/components/Onboarding/OnboardingFlow.tsx`:

**Layout jedes Schritts:**
```
┌─────────────────────────────────┐
│  ■■■■■■■■□□□□□□□□□□□□□□□□□□□□  │  ← Progress-Bar (step/12 * 100%)
│                                 │     Farbe: Akzentfarbe, bg: zinc-800
│  ← Zurück              3 / 12  │  ← Header: Zurück-Pfeil + Step-Counter
├─────────────────────────────────┤
│                                 │
│         Step-Content            │  ← Scrollbar, flex-1
│                                 │
├─────────────────────────────────┤
│  ┌─────────────────────────┐    │
│  │       WEITER             │    │  ← Fixed Bottom-Button
│  └─────────────────────────┘    │     Disabled wenn Validierung fehlschlägt
│  (opt.: "Überspringen" Link)    │     Grau wenn disabled, Akzentfarbe wenn aktiv
└─────────────────────────────────┘
```

**State-Management:**
```typescript
const [state, dispatch] = useReducer(onboardingReducer, initialOnboardingState)

// Reducer-Actions:
type Action =
  | { type: 'SET_LANGUAGE'; payload: 'de' | 'en' }
  | { type: 'SET_SPORTS'; payload: Sport[] }
  | { type: 'SET_LOCATION'; payload: { city: string; lat: number; lng: number; country: string } }
  | { type: 'SET_CLUB'; payload: { id: string | null; name: string | null } }
  | { type: 'SET_NAME'; payload: string }
  | { type: 'SET_AGE'; payload: number }
  | { type: 'SET_GENDER'; payload: 'male' | 'female' }
  | { type: 'SET_SKILL'; payload: SkillLevel }
  | { type: 'SET_RATING'; payload: string }
  | { type: 'SET_HEIGHT'; payload: number | null }
  | { type: 'SET_GOALS'; payload: string[] }
  | { type: 'ADD_PHOTO'; payload: File }
  | { type: 'REMOVE_PHOTO'; payload: number }       // index
  | { type: 'REORDER_PHOTOS'; payload: File[] }
  | { type: 'SET_BIO'; payload: string }
  | { type: 'SET_VISIBILITY'; payload: { gender: string[]; ageMin: number; ageMax: number } }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
```

### Step 6.2 — Jeder Onboarding-Schritt im Detail

#### Schritt 1: Willkommen (`WelcomeStep.tsx`)

```
┌─────────────────────────────────┐
│                                 │
│         MATCHUP                 │  ← Grosse Wortmarke, zentriert
│         🎾 🏸 🏓                │
│                                 │
│   Finde deinen perfekten        │  ← Headline
│   Spielpartner                  │
│                                 │
│   Matche mit Tennis-, Padel-    │  ← Subtext
│   und Pickleball-Spielern       │
│   in deiner Nähe.               │
│                                 │
│   ┌─────────────────────────┐   │
│   │       LOS GEHT'S        │   │  ← Primär-Button
│   └─────────────────────────┘   │
│                                 │
│   Mit der Registrierung         │  ← Klein, grau, zentriert
│   akzeptierst du unsere AGB     │
│   und Datenschutzrichtlinie.    │
│                                 │
└─────────────────────────────────┘
```

Kein Zurück-Button (erster Schritt). Button geht zu Schritt 2.

#### Schritt 2: Sprache (`LanguageStep.tsx`)

```
  Überschrift: "Wähle deine Sprache"

  ┌─────────────────────────────┐
  │  🇩🇪  Deutsch                │  ← Selektierbar, bg-zinc-800
  └─────────────────────────────┘     Bei Auswahl: Border Akzentfarbe
  ┌─────────────────────────────┐
  │  🇬🇧  English                │
  └─────────────────────────────┘

  Validierung: Eine Option muss gewählt sein
  Weiter-Button: aktiv wenn Sprache gewählt
```

#### Schritt 3: Sportarten (`SportStep.tsx`)

```
  Überschrift: "Welchen Sport spielst du?"
  Untertext:   "Wähle mindestens eine Sportart."

  ┌────────┐ ┌────────┐ ┌────────────┐
  │🎾Tennis│ │🏸Padel │ │🏓Pickleball│   ← Chips, Multi-Select
  └────────┘ └────────┘ └────────────┘
  Ausgewählt: Akzentfarbe Border + leichter Akzent-Hintergrund
  Nicht ausgewählt: bg-zinc-800, border-zinc-700

  Validierung: sports.length >= 1
```

#### Schritt 4: Standort (`LocationStep.tsx`)

```
  Überschrift: "Wo spielst du?"
  Untertext:   "Wir zeigen dir Spieler in deiner Nähe."

  ┌──────────────────────────────┐
  │  🔍 Stadt oder PLZ eingeben   │  ← Suchfeld mit Autocomplete
  └──────────────────────────────┘

  ┌──────────────────────────────┐
  │  📍 Aktuellen Standort       │  ← Button: browser geolocation API
  │     verwenden                 │     navigator.geolocation.getCurrentPosition()
  └──────────────────────────────┘

  Nach Auswahl:
  ┌──────────────────────────────┐
  │  ✓ Zürich, Schweiz           │  ← Bestätigung mit Häkchen
  └──────────────────────────────┘

  Geocoding: Nominatim API (kostenlos, kein Key):
  fetch(`https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=5`)

  Validierung: latitude + longitude + city müssen gesetzt sein
```

#### Schritt 5: Club (`ClubStep.tsx`)

```
  Überschrift: "Spielst du in einem Club?"
  Untertext:   "Optional — hilft dir, Clubmitglieder zu finden."

  ┌──────────────────────────────┐
  │  🔍 Club suchen...            │  ← Suchfeld
  └──────────────────────────────┘

  Suchergebnisse (live aus Supabase):
  ┌──────────────────────────────┐
  │  TC Zürich · Zürich, ZH      │
  │  TC Seefeld · Zürich, ZH     │
  │  Padel Zone Zürich · Zürich  │
  └──────────────────────────────┘

  ┌──────────────────────────────┐
  │  Mein Club ist nicht dabei    │  ← Link → Freitext-Input für club_name_manual
  └──────────────────────────────┘

  ┌──────────────────────────────┐
  │  Überspringen                 │  ← Grauer Link, setzt club_id = null
  └──────────────────────────────┘

  Supabase-Query:
  supabase.from('clubs').select('*').ilike('name', `%${query}%`).limit(10)
```

#### Schritt 6: Name (`NameStep.tsx`)

```
  Überschrift: "Wie heisst du?"
  Untertext:   "Dein Vorname wird anderen Spielern angezeigt."

  ┌──────────────────────────────┐
  │  Vorname                      │  ← Input, autofocus
  └──────────────────────────────┘

  Validierung: first_name.trim().length >= 2
  Fehlertext (unter Input, rot): "Mindestens 2 Zeichen"
```

#### Schritt 7: Alter (`AgeStep.tsx`)

```
  Überschrift: "Wie alt bist du?"

  ┌──────────────────────────────┐
  │         ▲                     │
  │        25                     │  ← Scroll-Picker oder Number-Input
  │         ▼                     │     Bereich: 18–100
  └──────────────────────────────┘

  Oder einfacher: Input type="number" mit min=18, max=100

  Validierung: age >= 18 && age <= 100
```

#### Schritt 8: Geschlecht (`GenderStep.tsx`)

```
  Überschrift: "Dein Geschlecht"

  ┌─────────────────────────────┐
  │  ♂ Männlich                  │  ← Selektierbar
  └─────────────────────────────┘
  ┌─────────────────────────────┐
  │  ♀ Weiblich                  │
  └─────────────────────────────┘

  Validierung: gender !== null
```

#### Schritt 9: Skill-Level + Rating (`SkillStep.tsx`)

```
  Überschrift: "Dein Spielniveau"

  ┌─────────────────────────────┐
  │  🟢 Anfänger                 │  ← skill_level = 'beginner'
  │  Ich lerne gerade die Basics │
  └─────────────────────────────┘
  ┌─────────────────────────────┐
  │  🟡 Fortgeschritten          │  ← 'intermediate'
  │  Ich spiele regelmässig      │
  └─────────────────────────────┘
  ┌─────────────────────────────┐
  │  🟠 Advanced                 │  ← 'advanced'
  │  Ich beherrsche die meisten  │
  │  Techniken                   │
  └─────────────────────────────┘
  ┌─────────────────────────────┐
  │  🔴 Wettkampf                │  ← 'competitive'
  │  Ich spiele Turniere         │
  └─────────────────────────────┘

  --- Nach Auswahl: ---

  "Hast du ein offizielles Rating?" (optional)

  ┌──────────────────────────────┐
  │  Dropdown oder Freitext       │  ← Je nach country:
  └──────────────────────────────┘     CH → Dropdown: R1–R9, N1–N4
                                       DE → Dropdown: LK 1–23
                                       Andere → Freitext ("z.B. 4.0 NTRP, UTR 8.5")

  "Überspringen" Link vorhanden

  Validierung: skill_level !== null (Rating optional)
```

#### Schritt 10: Grösse (`HeightStep.tsx`)

```
  Überschrift: "Wie gross bist du?"
  Untertext:   "Optional — wird auf deinem Profil angezeigt."

  ┌──────────────────────────────┐
  │  [====●==============] 178cm  │  ← Slider: 140–220 cm
  └──────────────────────────────┘

  Toggle: cm / ft (Umrechnung client-seitig)

  "Überspringen" Link prominent sichtbar
  Validierung: keine (überspringbar)
```

#### Schritt 11: Ziele (`GoalsStep.tsx`)

```
  Überschrift: "Was suchst du?"
  Untertext:   "Wähle mindestens ein Ziel."

  ┌──────────────┐ ┌────────────────┐
  │ 🎯 Spass      │ │ 🏆 Wettkampf   │   ← 6 Chips, Multi-Select
  └──────────────┘ └────────────────┘
  ┌──────────────┐ ┌────────────────┐
  │ 💪 Training   │ │ 👋 Neue Leute  │
  └──────────────┘ └────────────────┘
  ┌──────────────┐ ┌────────────────┐
  │ 🏃 Fitness    │ │ 📅 Regelmässig │
  └──────────────┘ └────────────────┘

  Die 6 Goals als String-Werte:
  ['fun', 'competitive', 'training', 'social', 'fitness', 'regular']

  Validierung: goals.length >= 1
```

#### Schritt 12: Fotos + Bio + Sichtbarkeit (`ProfileSetupStep.tsx`)

Dieser Schritt hat 3 Sub-Sektionen auf einer scrollbaren Seite:

```
  === Sub-Sektion A: Fotos ===
  Überschrift: "Deine Fotos"
  Untertext:   "Mindestens 1, bis zu 4 Fotos."

  ┌────┐ ┌────┐ ┌────┐ ┌────┐
  │ +  │ │ +  │ │ +  │ │ +  │   ← 4 Slots, quadratisch
  └────┘ └────┘ └────┘ └────┘     Erster Slot = Hauptbild
  Slot mit Bild zeigt X-Button zum Entfernen
  Leerer Slot zeigt "+"-Icon
  Tap auf leeren Slot → <input type="file" accept="image/*">

  === Sub-Sektion B: Bio ===
  Überschrift: "Über dich"
  Untertext:   "Max. 300 Zeichen"

  ┌──────────────────────────────┐
  │  Erzähle etwas über dich...   │  ← Textarea, 4 Zeilen
  │                               │     Zeichenzähler rechts unten: "42/300"
  └──────────────────────────────┘

  === Sub-Sektion C: Sichtbarkeit ===
  Überschrift: "Wer soll dich finden?"

  Geschlecht:
  ┌────────┐ ┌──────────┐
  │ Männer │ │  Frauen  │   ← Multi-Select (default: beide)
  └────────┘ └──────────┘

  Alter:
  ┌──────────────────────────────┐
  │  18 [====●════════●====] 99  │  ← Dual-Range-Slider
  └──────────────────────────────┘

  Validierung: photos.length >= 1
```

### Step 6.3 — Onboarding-Abschluss (Profil speichern)

Nach Schritt 12 → „Profil erstellen"-Button:

```typescript
async function completeOnboarding() {
  setIsSubmitting(true)

  try {
    // 1. Fotos komprimieren + hochladen
    const photoUrls: string[] = []
    for (const photo of state.photos) {
      const compressed = await compressImage(photo)
      const path = `${user.id}/avatar_${Date.now()}_${photoUrls.length}.jpg`
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, compressed, { contentType: 'image/jpeg' })
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(path)
      photoUrls.push(publicUrl)
    }

    // 2. Profil in DB erstellen
    const { error: insertError } = await supabase.from('profiles').insert({
      id: user.id,
      display_name: state.first_name,
      first_name: state.first_name,
      age: state.age!,
      gender: state.gender!,
      sports: state.sports,
      skill_level: state.skill_level!,
      official_rating: state.official_rating || null,
      height_cm: state.height_cm,
      city: state.city,
      country: state.country,
      latitude: state.latitude,
      longitude: state.longitude,
      club_id: state.club_id,
      goals: state.goals,
      bio: state.bio || null,
      profile_image: photoUrls[0],
      additional_images: photoUrls.slice(1),
      visibility_gender: state.visibility_gender,
      visibility_age_min: state.visibility_age_min,
      visibility_age_max: state.visibility_age_max,
      search_radius_km: 25,
    })
    if (insertError) throw insertError

    // 3. Profil neu laden + zur App weiterleiten
    await refreshProfile()
  } catch (err) {
    setError('Profil konnte nicht erstellt werden. Bitte versuche es erneut.')
    setIsSubmitting(false)
  }
}
```

---

## PHASE 7 — App-Shell & Tab-Navigation

### Step 7.1 — App-Layout

Erstelle `app/app/layout.tsx`:

```typescript
// Wraps /app und alle Sub-Routes in AuthProvider
// Prüft: eingeloggt? → Profil vorhanden? → Status ok?
export default function AppLayout({ children }) {
  return (
    <AuthProvider>
      <AppGuard>{children}</AppGuard>
    </AuthProvider>
  )
}
```

### Step 7.2 — App-Guard Logik

Erstelle `app/app/components/AppGuard.tsx`:

```
Entscheidungsbaum:

loading === true?
  └→ Fullscreen-Spinner (Akzentfarbe, bg-black)

user === null?
  └→ <AuthScreen />

profile === null?
  └→ <OnboardingFlow />

profile.is_banned === true?
  └→ <BannedScreen />
      Text: "Dein Konto wurde gesperrt."
      Subtext: "Bei Fragen wende dich an den Support: hello@matchup.ch"
      Kein Navigations-Zugang

profile.is_paused === true?
  └→ <PausedScreen />
      Text: "Dein Konto ist pausiert."
      Subtext: profile.pause_reason (falls vorhanden)
      Button: "Konto reaktivieren" → supabase.from('profiles').update({ is_paused: false, pause_reason: null }).eq('id', profile.id)

Alles ok?
  └→ <AppShell /> (Tab-Navigation + Inhalt)
  └→ Starte Presence-Heartbeat (useEffect, setInterval 60s)
  └→ Prüfe ungelesene Warnungen (warnings-Tabelle)
```

### Step 7.3 — AppShell mit Bottom-Tab-Bar

Erstelle `app/app/components/AppShell.tsx`:

```
┌───────────────────────────────────────┐
│  max-w-[430px] mx-auto h-dvh         │  ← Zentriert auf Desktop
│  flex flex-col bg-black               │
├───────────────────────────────────────┤
│                                       │
│    <ActiveTabContent />               │  ← flex-1, overflow-y-auto
│                                       │
├───────────────────────────────────────┤
│  ┌─────┬─────┬─────┬─────┬─────┐     │
│  │  🔍 │  ❤️  │  💬 │  🎮 │  👤 │     │  ← Bottom-Tab-Bar
│  │Entd.│Likes│Match│Spiel│Profil│     │     h-[72px] pb-safe (für iPhone)
│  └─────┴─────┴─────┴─────┴─────┘     │     fixed bottom-0
└───────────────────────────────────────┘
```

**Tab-Bar Details:**
- Container: `fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-md border-t border-zinc-800`
- Inner: `max-w-[430px] mx-auto flex justify-around items-center h-[72px] pb-[env(safe-area-inset-bottom)]`
- Jeder Tab: `flex flex-col items-center gap-1 pt-2`
- Icon: 24x24, Outline wenn inaktiv (zinc-500), Filled wenn aktiv (Akzentfarbe)
- Label: `text-[10px]`, zinc-500 wenn inaktiv, Akzentfarbe wenn aktiv
- Transition: `transition-colors duration-200`

**Icons (verwende SVG oder Lucide-React wenn bereits im Projekt):**
```
Tab 1 — Entdecken:  Compass/Search Icon
Tab 2 — Likes:      Heart Icon          + Unread-Badge (roter Punkt)
Tab 3 — Matches:    MessageCircle Icon   + Unread-Badge (Zahl)
Tab 4 — Spiele:     Calendar/Trophy Icon
Tab 5 — Profil:     User Icon
```

**Unread-Badges:**
```typescript
// Likes-Badge: Anzahl ungelesener Likes
const [likeCount, setLikeCount] = useState(0)
useEffect(() => {
  supabase
    .from('likes')
    .select('id', { count: 'exact', head: true })
    .eq('to_user_id', profile.id)
    // Nur Likes anzeigen, die noch nicht zu einem Match geführt haben
    .then(({ count }) => setLikeCount(count ?? 0))
}, [activeTab])

// Messages-Badge: Anzahl ungelesener Nachrichten
const [unreadCount, setUnreadCount] = useState(0)
useEffect(() => {
  supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('is_read', false)
    .neq('sender_id', profile.id)
    // Nur in aktiven Matches
    .then(({ count }) => setUnreadCount(count ?? 0))
}, [activeTab])
```

**Badge-Darstellung:**
```
Roter Punkt:  absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full
Zahl-Badge:   absolute -top-1 -right-2 min-w-[18px] h-[18px] bg-red-500 rounded-full
              text-[10px] text-white font-bold flex items-center justify-center
              Pulsierend: animate-pulse
```

**State:**
```typescript
const [activeTab, setActiveTab] = useState<'discover' | 'likes' | 'matches' | 'games' | 'profile'>('discover')
// Sub-Views (z.B. Chat-Detail) werden als Overlay/Stack über den Tab gelegt:
const [subView, setSubView] = useState<SubViewState | null>(null)

type SubViewState =
  | { type: 'chat'; matchId: string }
  | { type: 'full-profile'; userId: string; viewOnly?: boolean }
  | { type: 'edit-profile' }
  | { type: 'settings' }
  | { type: 'group-detail'; groupId: string }
  | { type: 'group-chat'; groupId: string }
  | { type: 'create-group' }
  | { type: 'game-detail'; gameId: string }
  | { type: 'create-game' }
  | { type: 'game-requests'; gameId: string }
  | { type: 'comments'; postId: string }
  | { type: 'support' }
  | { type: 'ticket-chat'; ticketId: string }
  | { type: 'create-ticket' }
  | { type: 'blocked-users' }
```

Wenn `subView !== null` → zeige die Sub-View als Fullscreen-Overlay (slide-in von rechts, `translate-x` Animation) mit Zurück-Button. Tab-Bar wird ausgeblendet.

---

## PHASE 8 — Tab-Inhalte im Detail

### Step 8.1 — Tab 1: Discover (`DiscoverTab.tsx`)

#### 8.1.1 — Header

```
┌───────────────────────────────────────┐
│  ☰ Filter    ENTDECKEN     🔍  ◫ / ▣ │
└───────────────────────────────────────┘
```

- Links: Filter-Button (öffnet FilterSheet)
- Mitte: „ENTDECKEN" (font-bold, tracking-wide)
- Rechts: Such-Icon (togglet Suchleiste) + View-Toggle (Card ↔ Grid)

**State:**
```typescript
const [viewMode, setViewMode] = useState<'card' | 'grid'>('card')
const [showSearch, setShowSearch] = useState(false)
const [showFilter, setShowFilter] = useState(false)
const [candidates, setCandidates] = useState<Profile[]>([])
const [currentIndex, setCurrentIndex] = useState(0)
const [isLoading, setIsLoading] = useState(true)
const [filters, setFilters] = useState<FilterState>(defaultFilters)
```

#### 8.1.2 — Discover-Query (exakt wie Flutter-App)

```typescript
async function loadCandidates() {
  setIsLoading(true)

  // Phase 1: Ausschluss-Listen laden
  const [blocksRes, likesRes, matchesRes, skipsRes] = await Promise.all([
    supabase.from('blocks').select('blocked_id, blocker_id')
      .or(`blocker_id.eq.${profile.id},blocked_id.eq.${profile.id}`),
    supabase.from('likes').select('to_user_id')
      .eq('from_user_id', profile.id)
      .gte('created_at', new Date(Date.now() - 14 * 86400000).toISOString()),
    supabase.from('matches').select('user1_id, user2_id')
      .or(`user1_id.eq.${profile.id},user2_id.eq.${profile.id}`),
    supabase.from('skips').select('skipped_user_id')
      .eq('user_id', profile.id)
      .gte('skipped_at', new Date(Date.now() - 14 * 86400000).toISOString()),
  ])

  const excludeIds = new Set<string>([profile.id])
  blocksRes.data?.forEach(b => { excludeIds.add(b.blocked_id); excludeIds.add(b.blocker_id) })
  likesRes.data?.forEach(l => excludeIds.add(l.to_user_id))
  matchesRes.data?.forEach(m => {
    excludeIds.add(m.user1_id === profile.id ? m.user2_id : m.user1_id)
  })
  skipsRes.data?.forEach(s => excludeIds.add(s.skipped_user_id))

  // Phase 2: Kandidaten laden
  let query = supabase
    .from('profiles')
    .select('*')
    .eq('is_paused', false)
    .eq('is_banned', false)
    .eq('is_seed', false)
    .order('last_active', { ascending: false })
    .limit(200)

  const { data: rawCandidates } = await query

  // Phase 3: Client-seitige Filterung
  const filtered = (rawCandidates ?? []).filter(c => {
    if (excludeIds.has(c.id)) return false

    // Sichtbarkeit: Ziel muss mein Geschlecht akzeptieren
    if (!c.visibility_gender?.includes(profile.gender)) return false
    // Sichtbarkeit: Mein Alter muss in deren Range liegen
    if (profile.age < (c.visibility_age_min ?? 18)) return false
    if (profile.age > (c.visibility_age_max ?? 99)) return false

    // Gemeinsame Sportart
    const commonSports = c.sports?.filter(s => profile.sports?.includes(s))
    if (!commonSports?.length) return false

    // User-Filter
    if (filters.sports.length && !filters.sports.some(s => c.sports?.includes(s))) return false
    if (filters.gender && c.gender !== filters.gender) return false
    if (filters.skillLevels.length && !filters.skillLevels.includes(c.skill_level)) return false
    if (c.age < filters.ageMin || c.age > filters.ageMax) return false
    if (filters.clubId && c.club_id !== filters.clubId) return false

    // Distanz
    if (filters.radius < 201 && profile.latitude && profile.longitude && c.latitude && c.longitude) {
      const dist = haversineKm(profile.latitude, profile.longitude, c.latitude, c.longitude)
      if (dist > filters.radius) return false
      c._distance = dist  // Temporäres Feld für Sortierung
    }

    return true
  })

  // Phase 4: Sortierung
  filtered.sort((a, b) => {
    // Gleicher Club zuerst
    if (a.club_id === profile.club_id && b.club_id !== profile.club_id) return -1
    if (b.club_id === profile.club_id && a.club_id !== profile.club_id) return 1
    // Ähnlicher Skill
    const skillOrder = ['beginner', 'intermediate', 'advanced', 'competitive']
    const mySkillIdx = skillOrder.indexOf(profile.skill_level)
    const diffA = Math.abs(skillOrder.indexOf(a.skill_level) - mySkillIdx)
    const diffB = Math.abs(skillOrder.indexOf(b.skill_level) - mySkillIdx)
    if (diffA !== diffB) return diffA - diffB
    // Distanz
    if ((a as any)._distance !== undefined && (b as any)._distance !== undefined) {
      return (a as any)._distance - (b as any)._distance
    }
    // Zuletzt aktiv
    return new Date(b.last_active).getTime() - new Date(a.last_active).getTime()
  })

  // Phase 5: Pagination (client-seitig, 20 pro "Seite")
  setCandidates(filtered.slice(0, 20))
  setCurrentIndex(0)
  setIsLoading(false)
}
```

#### 8.1.3 — Card-View (Swipe)

Erstelle `ProfileCard.tsx`:

```
┌──────────────────────────────────────┐
│                                      │
│     [Profilbild, volle Breite,       │
│      aspect-ratio 3/4,              │
│      object-cover, rounded-2xl]      │
│                                      │
│     ┌─ Gradient-Overlay (unten) ───┐ │
│     │  Max, 25                     │ │  ← Name + Alter, text-xl font-bold
│     │  🎾 Tennis · Advanced        │ │  ← Sport + Skill, text-sm
│     │  📍 3.2 km · TC Zürich      │ │  ← Distanz + Club, text-sm text-zinc-400
│     │  ✓ Verifiziert               │ │  ← Badge (nur wenn is_verified)
│     └──────────────────────────────┘ │
│                                      │
│   ┌────────┐            ┌────────┐   │
│   │   ✕    │            │   ♥    │   │  ← Skip-Button (zinc-800) + Like-Button (Akzent)
│   │  Skip  │            │  Like  │   │     rounded-full, w-16 h-16
│   └────────┘            └────────┘   │     Scale-Animation beim Tap
│                                      │
└──────────────────────────────────────┘
```

**Swipe-Mechanik (Touch-Events):**
```typescript
// Einfache Swipe-Detection mit onTouchStart/Move/End:
const [touchStart, setTouchStart] = useState(0)
const [translateX, setTranslateX] = useState(0)
const [isDragging, setIsDragging] = useState(false)

onTouchStart: setTouchStart(e.touches[0].clientX); setIsDragging(true)
onTouchMove:  setTranslateX(e.touches[0].clientX - touchStart)
onTouchEnd:   if (translateX > 100) → Like
              if (translateX < -100) → Skip
              else → snap back (setTranslateX(0))
              setIsDragging(false)

// Visuelles Feedback beim Swipen:
// translateX > 0: grüner Overlay-Tint + "LIKE" Text einblenden
// translateX < 0: roter Overlay-Tint + "SKIP" Text einblenden
// style={{ transform: `translateX(${translateX}px) rotate(${translateX * 0.05}deg)` }}
```

**Like-Aktion:**
```typescript
async function handleLike(targetId: string) {
  // Optimistisch nächste Karte zeigen
  setCurrentIndex(i => i + 1)

  // Like speichern
  await supabase.from('likes').upsert({
    from_user_id: profile.id,
    to_user_id: targetId,
  }, { onConflict: 'from_user_id,to_user_id' })

  // Daily-Limit prüfen (Konten < 24h: max 20)
  await supabase.rpc('increment_daily_likes', { user_id: profile.id })

  // Mutual-Check
  const { data: reverse } = await supabase
    .from('likes')
    .select('id')
    .eq('from_user_id', targetId)
    .eq('to_user_id', profile.id)
    .maybeSingle()

  if (reverse) {
    // MATCH! Animation zeigen
    setMatchAnimation({ myProfile: profile, otherProfile: candidates[currentIndex - 1] })
  }

  // Edge-Function notify-like wird durch DB-Trigger ausgelöst

  // Nachladen wenn fast am Ende
  if (currentIndex >= candidates.length - 3) {
    loadMoreCandidates()
  }
}

async function handleSkip(targetId: string) {
  setCurrentIndex(i => i + 1)
  await supabase.from('skips').insert({
    user_id: profile.id,
    skipped_user_id: targetId,
  })
}
```

#### 8.1.4 — Grid-View

```
┌──────────────┐ ┌──────────────┐
│ [Bild 1:1]   │ │ [Bild 1:1]   │   ← 2 Spalten, gap-3
│ Max, 25      │ │ Lisa, 28     │
│ 🎾 Advanced  │ │ 🏸 Inter.    │
│ 📍 3.2 km    │ │ 📍 5 km      │
│ [♥ Like]     │ │ [♥ Like]     │   ← Kleiner Like-Button
└──────────────┘ └──────────────┘
┌──────────────┐ ┌──────────────┐
│   ...        │ │   ...        │   ← Infinite Scroll
└──────────────┘ └──────────────┘
```

Tap auf Kachel → `setSubView({ type: 'full-profile', userId: candidate.id })`

#### 8.1.5 — Filter-Sheet (`FilterSheet.tsx`)

```
┌──────────────────────────────────────┐
│  ×                    Filter         │  ← Header mit Schliessen-X
├──────────────────────────────────────┤
│                                      │
│  Sportart                            │
│  ┌────────┐ ┌────────┐ ┌──────────┐ │
│  │ Tennis  │ │ Padel  │ │Pickleball│ │  ← Multi-Select Chips
│  └────────┘ └────────┘ └──────────┘ │
│                                      │
│  Geschlecht                          │
│  ┌──────┐ ┌──────────┐ ┌──────────┐ │
│  │ Alle │ │ Männlich │ │ Weiblich │ │  ← Single-Select
│  └──────┘ └──────────┘ └──────────┘ │
│                                      │
│  Alter                               │
│  18 [======●══════●======] 60        │  ← Dual-Range-Slider
│                                      │
│  Umkreis                             │
│  [======●════════════════] 25 km     │  ← Single Slider, 5–200+
│  (201+ = "Weltweit")                 │
│                                      │
│  Skill-Level                         │
│  ┌──────────┐ ┌────────────────┐     │
│  │ Anfänger │ │ Fortgeschritten│     │  ← Multi-Select
│  └──────────┘ └────────────────┘     │
│  ┌──────────┐ ┌────────────────┐     │
│  │ Advanced │ │ Wettkampf      │     │
│  └──────────┘ └────────────────┘     │
│                                      │
│  Club                                │
│  ┌──────────────────────────────┐    │
│  │ 🔍 Club suchen...            │    │  ← Suchfeld → Supabase clubs
│  └──────────────────────────────┘    │
│                                      │
├──────────────────────────────────────┤
│  ┌────────────┐  ┌────────────────┐  │
│  │ Zurücksetzen│  │ Filter anwenden│  │  ← 2 Buttons
│  │  (outline) │  │   (primär)     │  │
│  └────────────┘  └────────────────┘  │
└──────────────────────────────────────┘
```

Erscheint als Bottom-Sheet (slide-up von unten, mit Backdrop-Blur-Overlay).

#### 8.1.6 — Match-Animation (`MatchAnimation.tsx`)

```
┌──────────────────────────────────────┐
│  Fullscreen-Overlay, bg-black/95     │
│  z-50, fixed inset-0                 │
│                                      │
│  🎊 CSS Konfetti-Animation 🎊        │  ← Partikel-Effekt (CSS keyframes)
│                                      │
│      [Avatar A]  [Avatar B]          │  ← Gleiten von links/rechts ein
│         ←          →                 │     scale-Animation, rounded-full
│                                      │
│     IT'S A MATCH! 🎾                 │  ← text-3xl, font-bold, Akzentfarbe
│                                      │
│  Du und Max habt euch gegenseitig    │
│  geliked!                            │
│                                      │
│  ┌──────────────────────────────┐    │
│  │    Nachricht senden          │    │  ← Primär-Button → Chat
│  └──────────────────────────────┘    │
│  ┌──────────────────────────────┐    │
│  │    Weiter entdecken          │    │  ← Sekundär-Button → Overlay schliesst
│  └──────────────────────────────┘    │
│                                      │
└──────────────────────────────────────┘
```

#### 8.1.7 — Full-Profile-View (`FullProfile.tsx`)

```
┌──────────────────────────────────────┐
│  ← Zurück                    ⚑ ⊘    │  ← Zurück + Report + Block Icons
├──────────────────────────────────────┤
│                                      │
│  [Bild-Karussell, swipebar]          │  ← Dot-Indicator unten
│  ● ○ ○ ○                            │     profile_image + additional_images
│                                      │
│  Max, 25                             │  ← Name + Alter
│  📍 Zürich · 3.2 km                  │  ← Ort + Distanz
│  ✓ Verifiziert                       │
│                                      │
│  ── Über mich ──                     │
│  "Spiele seit 10 Jahren Tennis.      │
│   Suche regelmässige Spielpartner."  │
│                                      │
│  ── Details ──                       │
│  🎾 Tennis, Padel                    │
│  📊 Advanced                         │
│  🏅 R5 (Swiss Rating)               │
│  📏 178 cm                           │
│  🎯 Spass, Training, Regelmässig     │
│  🏟️ TC Zürich                       │
│                                      │
│  ── Statistiken ──                   │  ← Aus player_stats
│  🏆 42 Matches · 🔥 7-Tage-Streak   │
│  ⭐ Level 5 · 1250 XP               │
│                                      │
├──────────────────────────────────────┤
│  ┌────────┐            ┌────────┐   │
│  │  Skip  │            │  Like  │   │  ← Nur wenn NICHT viewOnly
│  └────────┘            └────────┘   │
└──────────────────────────────────────┘
```

Wenn `viewOnly === true` (z.B. aus Chat-Header): Keine Like/Skip-Buttons, nur Ansicht.

---

### Step 8.2 — Tab 2: Likes (`LikesTab.tsx`)

```
┌──────────────────────────────────────┐
│          LIKES (3)                    │  ← Header mit Anzahl
├──────────────────────────────────────┤
│                                      │
│  ┌──────────────────────────────┐    │
│  │ [Avatar]  Anna, 26           │    │
│  │           🎾 Tennis · Inter. │    │  ← Jede Zeile: Avatar + Info
│  │           📍 5 km            │    │
│  │  [Profil ansehen]            │    │  ← Text-Link → FullProfile
│  │  [♥ Like]  [✕ Ablehnen]     │    │  ← 2 Buttons
│  └──────────────────────────────┘    │
│                                      │
│  ┌──────────────────────────────┐    │
│  │ [Avatar]  Marco, 31          │    │
│  │           🏸 Padel · Adv.    │    │
│  │           📍 12 km           │    │
│  │  [Profil ansehen]            │    │
│  │  [♥ Like]  [✕ Ablehnen]     │    │
│  └──────────────────────────────┘    │
│                                      │
│  (Pull-to-Refresh)                   │
│                                      │
│  === Empty State ===                 │
│  (wenn keine Likes vorhanden:)       │
│  Illustration/Icon: 💤              │
│  "Noch keine Likes"                 │
│  "Vervollständige dein Profil und    │
│   werde sichtbar."                   │
│  [Entdecken] → wechselt zu Tab 1    │
└──────────────────────────────────────┘
```

**Query:**
```typescript
const { data: likes } = await supabase
  .from('likes')
  .select('*, from_user:profiles!likes_from_user_id_fkey(*)')
  .eq('to_user_id', profile.id)
  .order('created_at', { ascending: false })

// Filtere: bereits gematchte raus
const unmatched = likes?.filter(like => {
  // Prüfe ob schon ein Match existiert
  return !matches.some(m =>
    (m.user1_id === like.from_user_id || m.user2_id === like.from_user_id)
  )
})
```

**Like-zurück-Aktion:** Gleiche Logik wie Discovery-Like → Match-Animation zeigen.
**Ablehnen-Aktion:** Einfach aus der Liste entfernen (kein DB-Write, Like bleibt bestehen, User taucht nicht mehr in der Liste auf → client-seitig filtern via dismissed-State).

---

### Step 8.3 — Tab 3: Matches (`MatchesTab.tsx`)

#### 8.3.1 — Unter-Tab-Navigation

```
┌──────────────────────────────────────┐
│  [Matches]  |  [Gruppen]  |  [Feed] │  ← 3 Tabs oben
├──────────────────────────────────────┤
│       <ActiveSubTab />               │
└──────────────────────────────────────┘
```

Styling: Aktiver Tab hat Akzentfarbe Border-Bottom (2px), Inactive: zinc-500 Text.

#### 8.3.2 — Matches-Liste (`MatchesList.tsx`)

```
┌──────────────────────────────────────┐
│  ┌──────────────────────────────┐    │
│  │ [Avatar ●]  Anna              │    │  ← ● = Online-Indikator (grün)
│  │  "Hey, spielst du morgen?"    │    │  ← Letzte Nachricht (truncated)
│  │                    vor 2 Min. │    │  ← Zeitstempel, text-xs, zinc-500
│  │  ● (ungelesen)               │    │  ← Blauer/roter Punkt wenn unread
│  └──────────────────────────────┘    │
│  ─────────────────────────────────   │  ← Divider (zinc-800)
│  ┌──────────────────────────────┐    │
│  │ [Avatar]  Marco               │    │
│  │  "Super, bis dann!"          │    │
│  │                     Gestern  │    │
│  └──────────────────────────────┘    │
│                                      │
│  Swipe links → [Unmatch] Button      │  ← Rot, mit Bestätigungs-Dialog
│                                      │
│  === Empty State ===                 │
│  "Noch keine Matches"               │
│  "Like Spieler im Discover-Tab!"    │
│  [Entdecken] → Tab 1                │
└──────────────────────────────────────┘
```

**Query:**
```typescript
const { data: matches } = await supabase
  .from('matches')
  .select(`
    *,
    user1:profiles!matches_user1_id_fkey(id, display_name, profile_image, last_active),
    user2:profiles!matches_user2_id_fkey(id, display_name, profile_image, last_active)
  `)
  .or(`user1_id.eq.${profile.id},user2_id.eq.${profile.id}`)
  .eq('is_active', true)
  .order('updated_at', { ascending: false })

// Für jedes Match: letzte Nachricht laden
for (const match of matches) {
  const { data: lastMsg } = await supabase
    .from('messages')
    .select('content, sender_id, created_at, is_read')
    .eq('match_id', match.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  match.last_message = lastMsg
}
```

**Realtime-Subscription (für neue Matches + Nachrichten):**
```typescript
supabase
  .channel(`all-messages:${profile.id}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
  }, (payload) => {
    // Match-Liste aktualisieren (neue Nachricht → nach oben sortieren)
    updateMatchWithNewMessage(payload.new)
  })
  .subscribe()
```

**Unmatch:**
```typescript
async function unmatch(matchId: string) {
  // Bestätigungs-Dialog: "Match wirklich auflösen? Der Chat wird gelöscht."
  if (!confirmed) return
  await supabase.from('matches').update({ is_active: false }).eq('id', matchId)
  // Match aus Liste entfernen
}
```

#### 8.3.3 — Chat-Detail (`ChatDetail.tsx`)

```
┌──────────────────────────────────────┐
│  ← Zurück  [Avatar] Anna  ● Online  │  ← Header: Tap auf Name → FullProfile
├──────────────────────────────────────┤
│                                      │
│  ┌───────────────────┐               │
│  │ Hey, spielst du   │  10:42        │  ← Nachricht vom Gegenüber
│  │ morgen Tennis?    │               │     bg-zinc-800, rounded-2xl
│  └───────────────────┘               │     rounded-tl-sm (Ecke oben links)
│                                      │
│               ┌───────────────────┐  │
│      10:43    │ Ja klar! Wann     │  │  ← Eigene Nachricht
│               │ passt dir?        │  │     bg-[Akzentfarbe], text-black
│               │              ✓✓   │  │     rounded-2xl, rounded-tr-sm
│               └───────────────────┘  │     ✓✓ = gelesen (Akzentfarbe)
│                                      │     ✓ = zugestellt (zinc-400)
│  ┌───────────────────┐               │
│  │ 14 Uhr?           │  10:44        │
│  └───────────────────┘               │
│                                      │
│  ···                                 │  ← Tipp-Indikator (3 animierte Punkte)
│                                      │     Nur sichtbar wenn Gegenüber tippt
│                                      │
├──────────────────────────────────────┤
│  ┌────────────────────────────┐ [➤]  │  ← Input + Send-Button
│  │ Nachricht schreiben...     │      │     Input: bg-zinc-800, rounded-full
│  └────────────────────────────┘      │     Send: Akzentfarbe, rounded-full
│                                      │     Send nur sichtbar wenn Input nicht leer
└──────────────────────────────────────┘
```

**Nachrichten laden:**
```typescript
const { data: messages } = await supabase
  .from('messages')
  .select('*')
  .eq('match_id', matchId)
  .order('created_at', { ascending: true })
```

**Realtime-Subscription:**
```typescript
const channel = supabase
  .channel(`messages:${matchId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `match_id=eq.${matchId}`,
  }, (payload) => {
    const newMsg = payload.new as Message
    // Dedup: prüfe ob client_message_id schon in der Liste ist
    setMessages(prev => {
      if (prev.some(m => m.client_message_id === newMsg.client_message_id)) return prev
      return [...prev, newMsg]
    })
    // Wenn Nachricht vom Gegenüber → als gelesen markieren
    if (newMsg.sender_id !== profile.id) {
      markAsRead()
    }
  })
  .subscribe()
```

**Nachricht senden (optimistisch):**
```typescript
async function sendMessage() {
  if (!inputText.trim()) return
  const clientId = crypto.randomUUID()
  const optimistic: Message = {
    id: clientId,
    match_id: matchId,
    sender_id: profile.id,
    content: inputText.trim(),
    is_read: false,
    client_message_id: clientId,
    created_at: new Date().toISOString(),
    delivered_at: null,
    read_at: null,
  }
  setMessages(prev => [...prev, optimistic])
  setInputText('')
  // Scroll ans Ende
  scrollToBottom()

  await supabase.from('messages').insert({
    match_id: matchId,
    sender_id: profile.id,
    content: optimistic.content,
    client_message_id: clientId,
  })
}
```

**Lesebestätigung:**
```typescript
async function markAsRead() {
  await supabase
    .from('messages')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('match_id', matchId)
    .neq('sender_id', profile.id)
    .is('read_at', null)
}
// Rufe markAsRead() auf wenn Chat geöffnet wird + bei jeder neuen Nachricht vom Gegenüber
```

**Tipp-Indikator:**
Nutze Supabase Realtime Broadcast (kein DB-Write):
```typescript
// Beim Tippen (debounced, alle 3 Sekunden max):
channel.send({ type: 'broadcast', event: 'typing', payload: { userId: profile.id } })

// Empfangen:
channel.on('broadcast', { event: 'typing' }, ({ payload }) => {
  if (payload.userId !== profile.id) {
    setIsPartnerTyping(true)
    clearTimeout(typingTimeout)
    typingTimeout = setTimeout(() => setIsPartnerTyping(false), 3000)
  }
})
```

**Scroll-Verhalten:**
- Beim Laden: sofort ans Ende scrollen (`scrollIntoView({ behavior: 'instant' })`)
- Bei neuer Nachricht: smooth scrollen wenn User am Ende ist, sonst „Neue Nachricht ↓"-Badge zeigen
- `useRef` auf ein unsichtbares Element am Ende der Liste

#### 8.3.4 — Gruppen (`GroupsList.tsx`)

```
┌──────────────────────────────────────┐
│  [Alle Gruppen] | [Meine Gruppen]   │  ← Toggle
│  ┌──────────────────────────────┐    │
│  │ 🔍 Gruppe suchen...          │    │  ← ILIKE-Suche
│  └──────────────────────────────┘    │
│  ┌────────┐ ┌────────┐ ┌──────────┐ │
│  │ Alle   │ │ Tennis │ │  Padel   │ │  ← Sport-Filter Chips
│  └────────┘ └────────┘ └──────────┘ │
├──────────────────────────────────────┤
│  ┌──────────────────────────────┐    │
│  │ [Gruppenbild]                │    │
│  │ Zürich Padel Crew            │    │
│  │ 🏸 Padel · 12/20 Mitglieder │    │
│  │ Wir spielen jeden Mittwoch   │    │
│  │ [Beitreten]                  │    │  ← Oder "Mitglied ✓" wenn schon drin
│  └──────────────────────────────┘    │
│                                      │
│  [+ Gruppe erstellen]                │  ← FAB unten rechts, Akzentfarbe
└──────────────────────────────────────┘
```

**Query:**
```typescript
// Alle Gruppen
let query = supabase
  .from('groups')
  .select('*, members:group_members(count)')
  .order('created_at', { ascending: false })
if (sportFilter) query = query.eq('sport', sportFilter)
if (searchQuery) query = query.ilike('name', `%${searchQuery}%`)

// Meine Gruppen
const { data: myGroups } = await supabase
  .from('group_members')
  .select('*, group:groups(*)')
  .eq('user_id', profile.id)
```

**Gruppe erstellen (`CreateGroup.tsx`):**
```
Felder:
  - Name (Pflicht, min. 3 Zeichen)
  - Beschreibung (optional, max 500 Zeichen)
  - Sportart (Pflicht: Tennis/Padel/Pickleball)
  - Max. Mitglieder (Zahleneingabe, default 20)
  - Offen/Geschlossen (Toggle)
  - Gruppenbild (optional, Upload → gallery/groups/{groupId}/...)
```

**Gruppen-Detail (`GroupDetail.tsx`):**
```
Header: Gruppenbild + Name + Sport + Mitglieder-Count
Tabs: "Chat" | "Mitglieder"
  Chat: Gleiche Chat-UI wie 1:1 (aber mit Sender-Name über jeder Nachricht)
  Mitglieder: Liste mit Avatar + Name + Rolle-Badge (Owner/Admin/Member)
              Owner kann: Mitglieder entfernen, Rollen ändern
              Admin kann: Mitglieder entfernen
Actions (je nach Rolle):
  Member: "Gruppe verlassen"
  Admin: "Gruppe verlassen" + Mitglieder verwalten
  Owner: "Gruppe bearbeiten" + "Gruppe löschen" + Mitglieder verwalten
```

#### 8.3.5 — Community Feed (`CommunityFeed.tsx`)

```
┌──────────────────────────────────────┐
│  COMMUNITY                    [+]    │  ← Header + Post-erstellen-Button
├──────────────────────────────────────┤
│  ┌──────────────────────────────┐    │
│  │ [Avatar] max_tennis · 2h     │    │  ← Author + Zeitstempel
│  │                              │    │
│  │ Hatte heute ein super Padel- │    │  ← Post-Content
│  │ Match in Zürich! Wer ist     │    │
│  │ nächste Woche dabei? 🏸      │    │
│  │                              │    │
│  │ ❤️ 12    💬 3                 │    │  ← Like-Count + Comment-Count
│  │ [❤️ Like]  [💬 Kommentieren]  │    │  ← Action-Buttons
│  └──────────────────────────────┘    │
│  ─────────────────────────────────   │
│  ┌──────────────────────────────┐    │
│  │ [Avatar] lisa_padel · 5h     │    │
│  │ Suche Doppelpartner für ...  │    │
│  │ ❤️ 5    💬 1                  │    │
│  │ [❤️ Like]  [💬 Kommentieren]  │    │
│  └──────────────────────────────┘    │
└──────────────────────────────────────┘
```

**Post erstellen (`CreatePost.tsx`):**
```
┌──────────────────────────────────────┐
│  ×            Neuer Post             │
├──────────────────────────────────────┤
│  ┌──────────────────────────────┐    │
│  │ Was gibt's Neues?             │    │  ← Textarea, autofocus
│  │                               │    │     Max 1000 Zeichen
│  └──────────────────────────────┘    │
│                                      │
│  ┌──────────────────────────────┐    │
│  │        POSTEN                 │    │  ← Primär-Button, disabled wenn leer
│  └──────────────────────────────┘    │
└──────────────────────────────────────┘
```

**Kommentare (`Comments.tsx`):**
```
┌──────────────────────────────────────┐
│  ← Zurück     Kommentare (3)         │
├──────────────────────────────────────┤
│  [Original-Post oben, nicht editbar] │
│  ─────────────────────────────────   │
│  [Avatar] anna · vor 1h              │
│  "Bin dabei! Dienstag?"              │
│  ─────────────────────────────────   │
│  [Avatar] marco · vor 30min          │
│  "Ich auch, Platz gebucht!"          │
├──────────────────────────────────────┤
│  [Kommentar schreiben...    ] [➤]    │
└──────────────────────────────────────┘
```

---

### Step 8.4 — Tab 4: Games (`GamesTab.tsx`)

```
┌──────────────────────────────────────┐
│  [Meine Spiele] | [Offene Spiele]   │  ← Toggle
├──────────────────────────────────────┤
│                                      │
│  ┌──────────────────────────────┐    │
│  │ 🎾 Tennis Singles             │    │
│  │ 📅 Sa, 28. Juni 2026 · 10:00│    │  ← formatEventDate()
│  │ 📍 TC Zürich, Platz 3        │    │
│  │ 👥 1/2 Teilnehmer            │    │  ← Slots: grüne Kreise gefüllt, graue leer
│  │    [Avatar] [  ?  ]          │    │
│  │ ⏱️ In 2 Tagen                │    │  ← Countdown
│  │ Status: Geplant              │    │
│  │ [Details]                     │    │
│  └──────────────────────────────┘    │
│                                      │
│  [+ Spiel erstellen]                 │  ← FAB, Akzentfarbe
└──────────────────────────────────────┘
```

**Meine Spiele Query:**
```typescript
const { data: myGames } = await supabase
  .from('game_events')
  .select(`
    *,
    creator:profiles!game_events_created_by_fkey(display_name, profile_image),
    participants:game_participants(
      *,
      profile:profiles(display_name, profile_image)
    )
  `)
  .or(`created_by.eq.${profile.id},participants.user_id.eq.${profile.id}`)
  .gte('date_time', new Date().toISOString())
  .order('date_time', { ascending: true })
```

**Offene Spiele Query:**
```typescript
const { data: openGames } = await supabase
  .from('game_events')
  .select(`*, creator:profiles!game_events_created_by_fkey(*),
    participants:game_participants(*, profile:profiles(*))`)
  .eq('is_open', true)
  .eq('status', 'planned')
  .neq('created_by', profile.id)
  .gte('date_time', new Date().toISOString())
  .order('date_time', { ascending: true })
```

**Spiel erstellen (`CreateGame.tsx`):**

```
┌──────────────────────────────────────┐
│  ← Zurück     Spiel erstellen       │
├──────────────────────────────────────┤
│                                      │
│  Sportart *                          │
│  ┌────────┐ ┌────────┐ ┌──────────┐ │
│  │ Tennis │ │ Padel  │ │Pickleball│ │
│  └────────┘ └────────┘ └──────────┘ │
│                                      │
│  Spieltyp *                          │
│  ┌──────────┐  ┌──────────┐         │
│  │ Singles  │  │ Doubles  │         │
│  └──────────┘  └──────────┘         │
│                                      │
│  Datum *                             │
│  ┌──────────────────────────────┐    │
│  │ 📅 Datum wählen               │    │  ← Native date picker
│  └──────────────────────────────┘    │
│                                      │
│  Uhrzeit *                           │
│  ┌──────────────────────────────┐    │
│  │ ⏰ Uhrzeit wählen             │    │  ← Native time picker
│  └──────────────────────────────┘    │
│                                      │
│  Ort *                               │
│  ┌──────────────────────────────┐    │
│  │ 🔍 Ort suchen...              │    │  ← Freitext (z.B. "TC Zürich")
│  └──────────────────────────────┘    │
│                                      │
│  Platznummer                         │
│  ┌──────────────────────────────┐    │
│  │ z.B. Platz 3                  │    │  ← Optional
│  └──────────────────────────────┘    │
│                                      │
│  Beschreibung                        │
│  ┌──────────────────────────────┐    │
│  │ z.B. "Lockeres Spiel, alle   │    │  ← Optional, Textarea
│  │  Level willkommen"            │    │
│  └──────────────────────────────┘    │
│                                      │
│  Max. Teilnehmer                     │
│  ┌──────────────────────────────┐    │
│  │ 2    [- / +]                  │    │  ← Number-Stepper
│  └──────────────────────────────┘    │
│                                      │
│  ┌──────────────────────────────┐    │
│  │ 🔓 Offen für alle        [●] │    │  ← Toggle
│  └──────────────────────────────┘    │
│  ┌──────────────────────────────┐    │
│  │ 🏟️ Platz gebucht          [○] │    │  ← Toggle
│  └──────────────────────────────┘    │
│                                      │
│  ┌──────────────────────────────┐    │
│  │       SPIEL ERSTELLEN         │    │  ← Primär-Button
│  └──────────────────────────────┘    │
└──────────────────────────────────────┘
```

**Spiel-Detail (`GameDetail.tsx`):**
```
Header: Sport-Icon + Spieltyp + Status-Badge
Infos: Datum/Zeit, Ort, Platz, Beschreibung, Platz-gebucht-Status
Teilnehmer: Avatar-Reihe + freie Slots + Status-Badge pro Teilnehmer
Karte: (optional) Leaflet-Map oder statisches Bild
Aktionen:
  - Ersteller: "Bearbeiten", "Absagen", "Anfragen verwalten"
  - Anderer: "Beitreten" (→ status requested) / "Verlassen"
```

**Game-Requests (`GameRequests.tsx`):**
```
Liste aller Anfragen (status = 'requested'):
  [Avatar] Name, Skill-Level
  [✓ Annehmen] [✕ Ablehnen]

Annehmen → update participants.status = 'accepted'
Ablehnen → update participants.status = 'declined'
```

---

### Step 8.5 — Tab 5: Profil (`ProfileTab.tsx`)

```
┌──────────────────────────────────────┐
│                                      │
│        [Grosses Profilbild]          │
│         rund, w-28 h-28             │
│                                      │
│        Max, 28                       │  ← text-2xl font-bold
│        📍 Zürich                     │  ← text-zinc-400
│        🎾 Tennis · Advanced          │
│        ✓ Verifiziert                 │
│                                      │
├──────────────────────────────────────┤
│                                      │
│  ── Über mich ──                     │
│  "Spiele seit 10 Jahren Tennis..."   │
│                                      │
│  ── Sportarten ──                    │
│  ┌────────┐ ┌────────┐              │
│  │🎾Tennis│ │🏸Padel │              │  ← Sport-Chips
│  └────────┘ └────────┘              │
│                                      │
│  ── Statistiken ──                   │
│  ┌──────────────────────────────┐    │
│  │ 🏆 Matches    42             │    │
│  │ 🔥 Streak     7 Tage        │    │
│  │ ⭐ Level      5              │    │
│  │ 💎 XP         1250           │    │
│  │ 👥 Partner    12             │    │
│  └──────────────────────────────┘    │
│                                      │
│  ── Wochen-Chart ──                  │  ← Letzte 8 Wochen
│  ┌──────────────────────────────┐    │
│  │  ▊                            │    │     Einfaches Bar-Chart
│  │  ▊  ▊     ▊                   │    │     (div-basiert oder recharts)
│  │  ▊  ▊  ▊  ▊  ▊               │    │     Farbe nach Sport
│  │  ▊  ▊  ▊  ▊  ▊  ▊  ▊  ▊     │    │
│  │ W1 W2 W3 W4 W5 W6 W7 W8     │    │
│  └──────────────────────────────┘    │
│                                      │
│  ── Achievements ──                  │
│  🎾 First Serve  🦋 Social But...   │  ← Freigeschaltete Badges
│  ⚡ Match Machine                    │
│                                      │
│  ── Fotos ──                         │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐        │
│  │ 📷 │ │ 📷 │ │ 📷 │ │ 📷 │        │  ← Alle Profilbilder
│  └────┘ └────┘ └────┘ └────┘        │
│                                      │
│  ┌──────────────────────────────┐    │
│  │     Profil bearbeiten         │    │  ← Button → EditProfile SubView
│  └──────────────────────────────┘    │
│  ┌──────────────────────────────┐    │
│  │     Einstellungen ⚙️          │    │  ← Button → Settings SubView
│  └──────────────────────────────┘    │
│                                      │
└──────────────────────────────────────┘
```

**Profil bearbeiten (`EditProfile.tsx`):**
```
Alle Onboarding-Felder als bearbeitbare Form:
  - Fotos (Drag & Drop Reihenfolge, Hinzufügen, Entfernen)
  - Vorname
  - Bio
  - Sportarten
  - Skill-Level + Rating
  - Standort
  - Suchradius (Slider)
  - Grösse
  - Club
  - Ziele
  - Sichtbarkeit (Geschlecht + Altersrange)

  [Speichern] Button → supabase.from('profiles').update({...}).eq('id', profile.id)
  [Abbrechen] → zurück ohne Speichern
```

**Einstellungen (`Settings.tsx`):**

```
┌──────────────────────────────────────┐
│  ← Zurück     Einstellungen         │
├──────────────────────────────────────┤
│                                      │
│  ── Benachrichtigungen ──            │
│  Matches              [●]           │  ← Toggle → push_matches
│  Nachrichten           [●]           │  ← Toggle → push_messages
│  Erinnerungen          [●]           │  ← Toggle → push_reminders
│  Community             [○]           │  ← Toggle → push_community
│                                      │
│  ── Konto ──                         │
│  Sprache              Deutsch  [>]   │  ← Tap → Sprachwahl
│  Blockierte Nutzer            [>]    │  ← Tap → BlockedUsers SubView
│                                      │
│  ── Rechtliches ──                   │
│  Datenschutzrichtlinie        [>]    │  ← Link (extern)
│  AGB                          [>]    │  ← Link (extern)
│                                      │
│  ── Support ──                       │
│  Hilfe & Support              [>]    │  ← Tap → Support SubView
│                                      │
│  ── Gefahrenzone ──                  │
│  ┌──────────────────────────────┐    │
│  │  Konto pausieren              │    │  ← Orange Button
│  └──────────────────────────────┘    │
│  "Dein Profil wird unsichtbar,       │
│   aber deine Daten bleiben erhalten."│
│                                      │
│  ┌──────────────────────────────┐    │
│  │  Ausloggen                    │    │  ← Outline Button
│  └──────────────────────────────┘    │
│                                      │
│  ┌──────────────────────────────┐    │
│  │  Konto löschen                │    │  ← Roter Button
│  └──────────────────────────────┘    │
│  "Alle deine Daten werden            │
│   unwiderruflich gelöscht."          │
│                                      │
└──────────────────────────────────────┘
```

**Konto löschen:**
```typescript
async function deleteAccount() {
  // Dialog 1: "Bist du sicher? Diese Aktion kann nicht rückgängig gemacht werden."
  // Dialog 2: "Tippe DELETE ein, um zu bestätigen." → Input-Feld
  if (confirmText !== 'DELETE') return

  // 1. Storage-Dateien löschen (client-seitig, da RPC keinen Storage-Zugriff hat)
  const { data: files } = await supabase.storage.from('avatars').list(profile.id)
  if (files) {
    const paths = files.map(f => `${profile.id}/${f.name}`)
    await supabase.storage.from('avatars').remove(paths)
  }
  // Legacy-Buckets bereinigen
  for (const bucket of ['profile-images', 'images']) {
    const { data: legacyFiles } = await supabase.storage.from(bucket).list(profile.id)
    if (legacyFiles?.length) {
      await supabase.storage.from(bucket).remove(legacyFiles.map(f => `${profile.id}/${f.name}`))
    }
  }

  // 2. Kaskadierende DB-Löschung via RPC
  await supabase.rpc('delete_my_account')

  // 3. Auth-User löschen (optional, Supabase Auth delete via Admin API nötig)
  await supabase.auth.signOut()
}
```

**Support (`TicketList.tsx`):**
```
┌──────────────────────────────────────┐
│  ← Zurück     Support               │
├──────────────────────────────────────┤
│                                      │
│  ┌──────────────────────────────┐    │
│  │ Login-Probleme                │    │
│  │ Status: ● Beantwortet        │    │  ← Grün/Orange/Rot je nach Status
│  │ Letzte Aktivität: vor 2h     │    │
│  └──────────────────────────────┘    │
│                                      │
│  ┌──────────────────────────────┐    │
│  │ Bug beim Foto-Upload          │    │
│  │ Status: ◐ In Bearbeitung     │    │
│  │ Letzte Aktivität: Gestern    │    │
│  └──────────────────────────────┘    │
│                                      │
│  [+ Neues Ticket erstellen]          │  ← Button
└──────────────────────────────────────┘
```

**Ticket-Chat (`TicketChat.tsx`):**
Gleiche Chat-UI wie 1:1, aber:
- Eigene Nachrichten: `sender_type: 'user'`
- Admin-Nachrichten: `sender_type: 'admin'`, mit "Support"-Badge
- Keine Tipp-Indikator, keine Lesebestätigung

---

## PHASE 9 — Shared Components

### Step 9.1 — Komponenten-Liste

Jede Shared-Komponente lebt in `app/app/components/shared/`:

| Datei | Props | Zweck |
|-------|-------|-------|
| `Avatar.tsx` | `src: string, size: 'sm'│'md'│'lg'│'xl', online?: boolean` | Rundes Bild mit opt. Online-Punkt |
| `Badge.tsx` | `text: string, variant: 'sport'│'skill'│'status'│'count'` | Pill-Badge für Tags |
| `SportIcon.tsx` | `sport: Sport, size?: number` | Emoji oder SVG pro Sport |
| `Modal.tsx` | `open: boolean, onClose: () => void, title?: string, children` | Dark-Theme Bottom-Sheet |
| `ConfirmDialog.tsx` | `open, title, message, confirmText, onConfirm, onCancel, variant?: 'danger'` | Bestätigungs-Dialog |
| `EmptyState.tsx` | `icon: string, title: string, message: string, actionLabel?, onAction?` | Leer-Zustand mit opt. Button |
| `LoadingSpinner.tsx` | `size?: 'sm'│'md'│'lg'` | Spinner in Akzentfarbe |
| `Toast.tsx` | `message: string, type: 'success'│'error'│'info'` | Slide-down-Benachrichtigung |
| `ImageUploader.tsx` | `images: File[], onChange, max: number` | Foto-Slots mit +/× |
| `DualRangeSlider.tsx` | `min, max, valueMin, valueMax, onChange` | Dual-Thumb-Slider |
| `ChipSelect.tsx` | `options: {value, label, icon?}[], selected: string[], onChange, multi: boolean` | Wiederverwendbare Chips |
| `TabBar.tsx` | `tabs: {key, label}[], active: string, onChange` | Horizontale Tab-Navigation |
| `SearchInput.tsx` | `value, onChange, placeholder` | Suchfeld mit Icon + Clear-Button |
| `SubViewHeader.tsx` | `title: string, onBack: () => void, rightActions?: ReactNode` | Header für Sub-Views |

### Step 9.2 — Avatar-Sizes

```
sm:  w-8 h-8     (32px)  — Chat-Nachrichten, kleine Listen
md:  w-12 h-12   (48px)  — Match-Liste, Likes-Liste, Gruppen-Mitglieder
lg:  w-16 h-16   (64px)  — Discover-Grid, Gruppen-Cards
xl:  w-28 h-28   (112px) — Profil-Header, Match-Animation
```

Online-Punkt: `absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-black`

---

## PHASE 10 — Hooks

Erstelle für jeden Daten-Bereich einen Custom-Hook in `lib/hooks/`:

| Hook | Zweck | Wichtigste Returns |
|------|-------|--------------------|
| `useAuth()` | Auth-Context (Phase 5) | user, profile, signIn, signOut, ... |
| `useDiscover()` | Discover-Logik | candidates, filters, loadMore, sendLike, sendSkip |
| `useLikes()` | Erhaltene Likes | likes, likeBack, dismiss, refresh |
| `useMatches()` | Match-Liste + Unread | matches, unreadTotal, unmatch, refresh |
| `useChat(matchId)` | Chat für ein Match | messages, sendMessage, markAsRead, isPartnerTyping |
| `useGroups()` | Gruppen-Liste | groups, myGroups, join, leave, create, search |
| `useGroupChat(groupId)` | Gruppen-Chat | messages, sendMessage |
| `useCommunity()` | Community-Feed | posts, likePost, createPost, loadMore |
| `useGames()` | Spiele | myGames, openGames, createGame, joinGame |
| `useProfile()` | Eigenes Profil | profile, updateProfile, uploadPhoto |
| `usePresence()` | Heartbeat | startHeartbeat, stopHeartbeat |
| `useSupport()` | Tickets | tickets, createTicket, sendMessage |
| `useModeration()` | Warnungen + Status | warnings, markRead, reportUser, blockUser |

---

## PHASE 11 — Edge Cases & Error States

### Für JEDE View gilt:

1. **Loading-State:** `<LoadingSpinner />` zentriert auf schwarzem Hintergrund
2. **Error-State:** Roter Text + „Erneut versuchen"-Button
3. **Empty-State:** `<EmptyState />` mit passender Nachricht + CTA
4. **Offline-State:** Banner oben: „Keine Internetverbindung" (bg-yellow-900, text-yellow-200)
5. **Session-Expired:** Auth-Listener fängt ab → redirect zu AuthScreen

### Spezifische Edge Cases:

- **Discover leer:** „Keine weiteren Spieler gefunden. Erweitere deinen Suchradius oder ändere die Filter."
- **Like-Limit erreicht:** Toast: „Du hast dein tägliches Like-Limit erreicht. Versuche es morgen wieder." (nur für Konten < 24h)
- **Match aufgelöst während Chat offen:** Banner im Chat: „Dieses Match wurde aufgelöst."
- **Profil pausiert/gebannt während Nutzung:** Sofort redirect zu PausedScreen/BannedScreen
- **Gruppe voll:** „Beitreten"-Button disabled, Text: „Gruppe ist voll (20/20)"
- **Spiel in der Vergangenheit:** Nicht in „Offene Spiele" anzeigen
- **Doppelter Like:** Upsert verhindert Fehler, UI zeigt nichts Ungewöhnliches
- **Bild-Upload fehlgeschlagen:** Toast: „Bild konnte nicht hochgeladen werden" + Retry-Option
- **Realtime-Verbindung verloren:** Automatischer Reconnect (Supabase Client handled das)

---

## PHASE 12 — Abschluss-Checkliste

```
=== BESTEHENDE SEITE ===
[ ] Phase 0 abgeschlossen: Projektstruktur verstanden
[ ] Phase 1 abgeschlossen: Header-Nav geändert (5 Links, kein CSS)
[ ] Phase 2 abgeschlossen: Alle Texte ersetzt (Hero, Features, Footer, Meta)
[ ] Phase 3 abgeschlossen: 4 neue Seiten erstellt (/find-a-partner, /shop, /beratung, /events)
[ ] Kein CSS wurde geändert
[ ] Kein Layout wurde geändert
[ ] Kein Bild wurde geändert

=== WEBAPP ===
[ ] Phase 4: Supabase-Client + Typen + Utils erstellt
[ ] Phase 5: Auth-System funktioniert (Login, Register, Session)
[ ] Phase 6: Onboarding-Flow (12 Schritte) funktioniert vollständig
[ ] Phase 7: App-Shell mit Tab-Bar und Sub-View-Navigation
[ ] Phase 8.1: Discover (Card + Grid + Filter + Like + Skip + Match-Animation)
[ ] Phase 8.2: Likes (Liste + Like-zurück + Match-Animation)
[ ] Phase 8.3: Matches (Liste + Chat mit Realtime + Gruppen + Community)
[ ] Phase 8.4: Games (Meine + Offene + Erstellen + Detail + Anfragen)
[ ] Phase 8.5: Profil (Anzeige + Bearbeiten + Stats + Achievements + Einstellungen + Support)
[ ] Phase 9: Alle Shared-Components erstellt
[ ] Phase 10: Alle Hooks erstellt
[ ] Phase 11: Loading/Error/Empty States in jeder View
[ ] Presence-Heartbeat läuft (60s)
[ ] Realtime-Chat funktioniert
[ ] Report & Block auf jedem fremden Profil
[ ] Admin-Warnungen werden angezeigt
[ ] Konto-Status-Check bei App-Start
[ ] Mobile-First (max-w-[430px])
[ ] Dark-Theme durchgängig
[ ] Touch-Targets >= 44px
[ ] Alle Texte deutsch
[ ] .env.local in .gitignore
```

---

*Dieser Plan deckt die gesamte Implementierung ab. Arbeite Phase für Phase ab.
Committe nach jeder abgeschlossenen Phase.
Teste nach jeder Phase im Browser.*
