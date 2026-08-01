---
name: ship
description: Bringt die aktuellen Änderungen live — Review, Verifikation, Commit, Vercel-Deploy, Live-Check. Nur nutzen, wenn eine Aufgabe wirklich abgeschlossen ist.
---

# Ausliefern

Arbeite diese Schritte der Reihe nach ab. **Nach Schritt 2 und nach Schritt 4 anhalten und auf mein OK warten.**

## Schritt 1 — Review

`git status` und `git diff` ansehen. Berichte:
- welche Dateien geändert wurden und warum
- Funde nach Priorität: Bugs, Sicherheitsrisiken, Verstöße gegen `CLAUDE.md`
- fehlende EN-Übersetzungen
- fehlende Tests für neue Logik in `src/domain/**`

Harte Blocker (Deploy verweigern, wenn eines zutrifft):
- Secret/Key/Token im Diff
- Service-Role-Key außerhalb von `src/lib/adminClient.ts` oder in Client-Code
- neue Tabelle ohne RLS-Policy
- `COMPETE_EARLY_ACCESS_OPEN` steht auf `true`

## Schritt 2 — Verifikation

```bash
export PATH="$HOME/.nvm/versions/node/v24.5.0/bin:/opt/homebrew/bin:$PATH"
npx tsc --noEmit && npx next build && npx vitest run
```
Bei Fehlern: stoppen, berichten, nichts committen.

**→ Hier anhalten. Zusammenfassung zeigen und auf mein OK warten.**

## Schritt 3 — Commit

Auf Branch `feature/matchup-webapp`. Commit-Nachricht auf Deutsch mit Präfix
(`feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`, `security:`).
Nicht pushen, außer ich sage es — und `git push` deployt ohnehin nicht.

## Schritt 4 — Deploy

```bash
/usr/local/bin/vercel --prod --yes
```

**→ Vorher anhalten und fragen: „Soll ich jetzt live deployen?"**

## Schritt 5 — Live-Check

Nach dem Deploy die URL prüfen, mit Gate-Cookie:

```bash
curl -sS -o /dev/null -w "%{http_code}\n" -H "Cookie: mu_gate=$SITE_GATE_TOKEN" https://matchup-app.com/
```

Berichte am Ende:
- Deploy-URL
- was ich im Browser konkret klicken soll (Pfad + erwartetes Verhalten)
- wie ich zurückrolle: im Vercel-Dashboard das vorige Deployment auf Production promoten
