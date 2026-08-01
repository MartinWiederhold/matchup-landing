@AGENTS.md

# CLAUDE.md — Matchup Web

Diese Datei wird von Claude Code bei jeder Session automatisch geladen. Sie gilt für alles in diesem Repo.

## Über dieses Projekt

Matchup ist eine mobil-first Web-App für Racket-Sport (Tennis, Padel, Pickleball) mit zwei Modi:
**Play** (Hobby: Partner finden, Matches, Chat, Spiele) und **Tour/Compete** (Wettkampf: Saisonplanung, Weltkarte, Deadlines, Visa, Ausgaben).
Dazu öffentliche Marketing-/SEO-Seiten und eine Beratungsplattform (`/beratung`).

Ausführliche Doku: `MATCHUP-WEBAPP-PRODUKT.md` (Inhalt/Features) und `MATCHUP-WEBAPP-TECHNIK.md` (Stack/Architektur). Offene Aufgaben: `BACKLOG.md`.

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · Tailwind CSS v4 · TypeScript strict ·
Supabase (Postgres, **Schema `web`**) · Leaflet + MapLibre GL · tesseract.js · Vitest · Vercel

## Befehle

```bash
export PATH="$HOME/.nvm/versions/node/v24.5.0/bin:/opt/homebrew/bin:$PATH"

npm run dev                 # lokale Entwicklung
npx tsc --noEmit            # Typprüfung
npx next build              # Build
npx vitest run              # Tests (aktuell 13, müssen grün bleiben)
npm run lint                # ESLint

/usr/local/bin/vercel --prod --yes    # Deploy — git push deployt NICHT
/usr/local/bin/vercel env pull .env.local --environment=production --yes
```

**Vor jedem Deploy immer:** `npx tsc --noEmit && npx next build && npx vitest run`

## Next.js 16 — bitte lesen, nicht raten

Diese Next-Version hat Breaking Changes gegenüber deinen Trainingsdaten.
**Bevor du App-Router-, Routing-, Metadata- oder Caching-Code schreibst: lies die relevante Doku in `node_modules/next/dist/docs/`.** Deprecation-Hinweise ernst nehmen.

Konkrete Fallstricke:
- `params` in dynamischen Routen sind **Promises**: `const { id } = await params;`
- Server Components sind Standard. `"use client"` nur, wenn Interaktivität/Hooks es erfordern.
- Das Root-Layout hängt bereits `— Matchup` an → in `generateMetadata` **kein** eigenes Titel-Suffix.

## Supabase — Regeln

- **Alle Tabellen liegen im Schema `web`**, nicht `public`. Clients setzen `db: { schema: "web" }`.
- Anon-Client: `src/lib/supabase.ts` (Browser + öffentliche Server-Reads).
- Service-Client: `src/lib/adminClient.ts` → `getServiceClient()`. **Nur in API-Routen/Server. Niemals im Client, niemals als `NEXT_PUBLIC_`.**
- **RLS ist auf allen 44 Tabellen aktiv.** Neue Tabelle = RLS aktivieren + Policies im selben Schritt. Keine Views (umgehen RLS).
- Kein `select *` auf `profiles` — explizite Spaltenliste. Sonst gehen `fcm_token`, `device_fingerprint` etc. an alle Eingeloggten.
- Neue DDL kommt als SQL-Datei nach `supabase/`, nicht nur als Ad-hoc-Query. Danach `notify pgrst, 'reload schema';`.
- Helper-Funktionen für Policies: `is_my_match(matchid)`, `is_group_member(gid)`, `is_group_creator`, `is_game_creator`. Immer `SECURITY DEFINER` mit fixem `search_path`.

## Sprache, Texte, Ton

- **Code-Kommentare auf Deutsch.** UI-Texte niemals hart im Code.
- Alle Texte über i18n: `src/lib/i18n/messages/*` — **DE und EN immer zusammen** pflegen.
  Client: `useT()` / `useLocale()`. Server: `getT()`.
  Namespaces: about, app, auth, beratung, common, community, discover, events, findPartner, footer, games, groups, header, landing, matches, mode, onboarding, profile, seo, services, shop, support, tourCal, waitlist.
- **Kein Dating-Vokabular.** Die Aktion heißt „Verbinden", nicht „Like". Discover ist ein Grid, kein Swipe.
- Beratung: keine absoluten Versprechen. Immer Begründung + Datenstand + Confidence.

## Architektur-Leitplanken

- Reine Geschäftslogik → `src/domain/**`. Keine UI, keine DB-Zugriffe, **immer mit Vitest-Test**.
- Scoring-Regeln sind versioniert (`RULES_VERSION`). Logikänderung → Version hochziehen und Tests anpassen.
- Seed-/Demo-Daten sind mit `isDemoData: true` bzw. `is_seed = true` markiert. Nie als echte Daten ausgeben.
- Feature-Flags in `src/lib/feature-flags` steuern die Advice-Ausbaustufen. Nur `advisory_enabled=true`. Flags nicht ohne Auftrag umlegen.
- `COMPETE_EARLY_ACCESS_OPEN` in `src/lib/tour.ts` bleibt bis Launch `false`.

## Gate / Middleware

Die gesamte Seite liegt hinter einem Pre-Launch-Gate (`src/proxy.ts`). Freigeschaltet über Cookie `mu_gate === SITE_GATE_TOKEN`, sonst Rewrite auf `/locked`.
Beim Testen mit `curl` immer `-H "Cookie: mu_gate=<SITE_GATE_TOKEN>"` mitsenden — auch für `.mp4`, denn Videos laufen durch das Gate.
Nicht gegatet: `/locked`, `/api/unlock`, `/api/qr/scan`, `/api/sync`, `/api/news`, `/api/tour`, `/api/prices`, `/api/pois`, `/api/tennis`, `/reset-password`.

## Arbeitsweise, die ich von dir erwarte

1. **Erst lesen, dann ändern.** Vor Änderungen die betroffenen Dateien öffnen und in einem Satz melden, was du vorfindest.
2. **Bei größeren Aufgaben zuerst einen Plan** (Plan-Mode) — Dateien, Reihenfolge, Risiken. Warte auf mein OK.
3. **Bestehende Muster kopieren** statt neue Ansätze einführen. Wenn etwas Ähnliches schon existiert, halte dich daran.
4. **Klein bleiben.** Nur die Dateien anfassen, um die es geht. Keine spontanen Refactors, keine Umformatierung fremder Dateien.
5. **Keine neuen Dependencies** ohne Rückfrage mit Begründung und Alternative.
6. **Nichts erfinden.** Keine DB-Spalten, Funktionen oder Env-Variablen annehmen, die du nicht gesehen hast. Im Zweifel nachfragen.
7. **Nach der Umsetzung:** `npx tsc --noEmit && npx next build && npx vitest run` ausführen und das Ergebnis berichten. Bei Fehlern selbst beheben und erneut prüfen.
8. **Am Ende:** kurze Zusammenfassung — was geändert, welche Dateien, was ich im Browser prüfen soll, was noch offen ist.

## Sicherheit — nicht verhandelbar

- Keine Secrets in Client-Code oder ins Client-Bundle. Kein neues `NEXT_PUBLIC_*` für Sensibles.
- Keine Schlüssel, Tokens oder Passwörter in Commits, Logs oder Kommentaren.
- Änderungen an Auth, RLS, Admin-Rechten oder personenbezogenen Daten **explizit ankündigen**, bevor du sie machst.
- Admin-Zugriff läuft über `verifyAdmin(token)` (Token + E-Mail-Allowlist). Nicht umgehen, nicht aufweichen.
- `admin_delete_user(target uuid)` ist service_role-only. Parametername ist `target`.

## Git

- Arbeitsbranch: `feature/matchup-webapp`. Direkt auf `main` nur nach Ansage.
- Commit-Nachrichten auf Deutsch, Präfix nach Typ: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`, `security:`.
- Ein Commit = eine abgeschlossene Sache. Nicht committen, solange `tsc`/Build/Tests rot sind.
- Das GitHub-Remote heißt `matchup-landing` (`MartinWiederhold/matchup-landing`), der lokale Ordner `matchup-web`. Bei Repo-Suchen immer `matchup-landing` verwenden.

## Umgebung

- Node: `$HOME/.nvm/versions/node/v24.5.0/bin` in den PATH aufnehmen.
- **`UID` ist in zsh reserviert** — in Bash-Skripten anderen Variablennamen verwenden.
- Domain `matchup-app.com` per Alias auf Vercel; **DNS liegt bei Netlify**, nicht bei Vercel.
- Cron (`vercel.json`): `/api/sync/tournaments` täglich 06:00, `/api/news/sync` täglich 05:30.
