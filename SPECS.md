# Matchup — Specs

> Was wir bauen, für wen, und wann es gut ist.
> Wie gearbeitet wird → `CLAUDE.md`. Was als Nächstes ansteht → `BACKLOG.md`.

## Was es macht

Web-App (mobil-first) für Racket-Sport — Tennis, Padel, Pickleball. Zwei Modi in einer App:

- **Play** — Spielpartner in der Umgebung finden, Matches, Chat, Gruppen, Community, Spiele mit Elo-Wertung.
- **Tour / Compete** — Betriebssystem für eine Turniersaison: Kalender, Deadlines, Weltkarte, Reiseplanung, Visa/Schengen, Ausgaben, Team.

Dazu öffentliche Marketing- und SEO-Seiten sowie eine Beratungsplattform (`/beratung`) mit deterministischer, erklärbarer Schläger- und Saitenempfehlung.

## Für wen

- **Kern (Tour):** Wettkampf- und Profispieler, die eine Turniersaison planen — grob 3.500–4.000 aktive Tour-Spieler weltweit, plus Junioren-Elite auf dem Weg dorthin. Ihr Hauptproblem ist finanziell und logistisch, nicht sportlich.
- **Angrenzend (Play):** ambitionierte Hobbyspieler, die Partner suchen. Trichter nach oben, nicht das Kernversprechen.

**Marketing führt mit Wettkampf.** Der Tour-Modus ist der Burggraben — Logistik, Kosten und Reise sind von keiner konkurrierenden App abgedeckt. Live-Scores und Ratings sind besetzt und werden nicht nachgebaut.

## Haltung

- **Kein Dating-Feel.** Die Aktion heißt „Verbinden", nicht „Like". Discover ist ein Grid, kein Swipe. Ernsthafte Sport-Community.
- **Beratung vor Verkauf.** Keine absoluten Versprechen. Immer Begründung, Datenstand und Confidence — nie „perfekt für dich".
- **Zweisprachig.** Jeder Text existiert auf Deutsch und Englisch.
- **Nichts erfinden.** Demo- und Seed-Daten sind als solche markiert und werden nie als echt ausgegeben.

## Tech-Stack

- Next.js 16 (App Router, Turbopack), React 19, Tailwind CSS v4, TypeScript strict
- Supabase (Postgres, Schema `web`, RLS auf allen Tabellen)
- Leaflet + MapLibre GL (Karten), tesseract.js (Beleg-OCR)
- Vitest, Vercel, SendGrid

Details und Fallstricke: `MATCHUP-WEBAPP-TECHNIK.md`.

## Status

Play und Tour sind vollständig gebaut. Die gesamte Seite liegt hinter einem Pre-Launch-Gate; Tour zusätzlich hinter einem Early-Access-Gate (`COMPETE_EARLY_ACCESS_OPEN=false`).

## Wann etwas „fertig" ist

- Typprüfung, Build und Tests laufen durch (`npx tsc --noEmit && npx next build && npx vitest run`)
- Im Browser geprüft — lokal **und** nach dem Deploy
- Neue Texte in Deutsch **und** Englisch
- Keine Secrets im Diff, keine neue Tabelle ohne RLS-Policy
- Ticket in `BACKLOG.md` auf erledigt gesetzt

## Was wir bewusst nicht bauen

- Eigene Live-Scores oder ein eigenes Rating-System — beides ist am Markt besetzt.
- Eine reine Platzbuchungs-App — überfüllter Markt, kein Alleinstellungsmerkmal.
- Tour-Funktionen im Play-Modus. Die Modus-Trennung bleibt strikt: Turnierlogistik verwirrt Hobbyspieler, Hobby-Signale verwässern die Profi-Community.
