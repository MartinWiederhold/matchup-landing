# Arbeits-Workflow — Matchup

## Der Kreislauf

```
1. PLANEN      Claude-Projekt (claude.ai)   →  "PROMPT: MU-002 …"  →  fertiger Prompt
2. BAUEN       Claude Code (VS Code)        →  Prompt einfügen, Plan bestätigen, bauen lassen
3. PRÜFEN      tsc → build → vitest → Browser mit Gate-Code 50805080
4. SICHERN     git commit auf feature/matchup-webapp
5. AUSLIEFERN  vercel --prod --yes   → Live-Check
6. NACHFÜHREN  BACKLOG.md aktualisieren, ins Projekt-Wissen neu hochladen
```

## Eine Session in Claude Code

1. **Neue Session, sauberer Kontext.** Bei jedem neuen Ticket `/clear`. Alte Sessions weiterschleppen macht die Ergebnisse messbar schlechter.
2. **Prompt einfügen** (der aus dem Claude-Projekt).
3. **Plan-Mode nutzen** bei allem, was mehr als zwei Dateien berührt: Shift+Tab schaltet um. Erst Plan lesen, dann freigeben.
4. **Mitlesen, nicht blind bestätigen.** Wenn Claude Code eine Datei anfasst, die im Prompt nicht stand → stoppen und fragen warum.
5. **Verifikation läuft im Prompt mit.** Wenn nicht: selbst anstoßen.
6. **Abschlussbericht einfordern:** was geändert, welche Dateien, was du klicken sollst.

## Nützliche Befehle in Claude Code

| Befehl | Wofür |
|---|---|
| `/clear` | Kontext leeren — vor jedem neuen Ticket |
| `/memory` | Zeigt/bearbeitet die geladene `CLAUDE.md` |
| `/init` | Erzeugt eine `CLAUDE.md` (bei uns schon vorhanden — nicht überschreiben lassen) |
| `/model` | Modell wechseln (Sonnet zum Bauen, Opus für Kniffliges) |
| `/review` | Code-Review anfordern |
| `/compact` | Lange Session eindampfen, wenn `/clear` zu radikal wäre |
| `/verify` `/ship` `/neues-feature` `/db-aenderung` | Unsere eigenen Skills (siehe `.claude/skills/`) |

## Eigene Skills und Befehle

- Projekt-Skills liegen unter `.claude/skills/<name>/SKILL.md` und werden mit `/<name>` aufgerufen. Sie sind eingecheckt, gelten also für jeden, der im Repo arbeitet.
- `.claude/commands/*.md` funktioniert weiterhin, Skills sind aber der empfohlene Weg. Gibt es beides mit gleichem Namen, gewinnt der Skill.
- Wenn dir etwas gut gelungen ist und du es wiederholen willst: sag Claude Code „Mach daraus einen Skill". Genau das ist der Hebel aus dem Video (Hack 15).

## Definition of Done

Ein Ticket ist fertig, wenn **alle** Punkte stimmen:

- [ ] `npx tsc --noEmit` läuft durch
- [ ] `npx next build` läuft durch
- [ ] `npx vitest run` grün (13+ Tests)
- [ ] Im Browser geprüft — lokal **und** nach dem Deploy auf matchup-app.com
- [ ] Neue Texte in DE **und** EN vorhanden
- [ ] Kein Secret, kein Key, kein Token im Diff
- [ ] Kein neues `select *` auf `profiles`
- [ ] `COMPETE_EARLY_ACCESS_OPEN` steht weiterhin auf `false`
- [ ] Commit gemacht, Ticket in `BACKLOG.md` auf `erledigt`
- [ ] Bei Änderungen an Architektur/DB: `MATCHUP-WEBAPP-TECHNIK.md` nachgeführt

## Git

- Arbeitsbranch `feature/matchup-webapp`, `main` nur nach Ansage.
- Commit-Präfixe: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`, `security:`
- Nie committen, solange Build oder Tests rot sind.
- Vor riskanten Umbauten: `git commit` als Sicherungspunkt — dann ist `git reset --hard HEAD` die Notbremse.

## Wenn etwas schiefgeht

| Situation | Reaktion |
|---|---|
| Claude Code hat zu viel geändert | `git diff` ansehen, `git checkout -- <datei>` für einzelne Dateien |
| Alles kaputt, nichts committet | `git reset --hard HEAD` |
| Live ist kaputt | Im Vercel-Dashboard auf das vorige Deployment zurückrollen (Promote to Production) |
| Build läuft lokal, aber nicht auf Vercel | Env-Variablen abgleichen: `vercel env pull .env.local --environment=production --yes` |
| Seite zeigt nur den Lock-Screen | Gate-Cookie fehlt — Code `50805080` eingeben, bei `curl` den Cookie mitsenden |

## Modellwahl

- **Opus** — Architekturentscheidungen, Security-Reviews, große Prompts formulieren, Priorisierung. Standard im Claude-Projekt.
- **Sonnet** — das Bauen in Claude Code. Schnell und für 90 % der Umsetzung stark genug.
- **Haiku** — Massenarbeit: viele Dateien durchsuchen, Übersetzungen abgleichen, Listen erstellen.

## Rhythmus, der sich bewährt

- **Ein Ticket pro Session.** Nicht drei Dinge gleichzeitig.
- **Erst prüfen, dann deployen.** Nie deployen, weil es „eigentlich passt".
- **Nach jedem Sprint** `BACKLOG.md` und die beiden großen Doku-Dateien aktualisieren und im Claude-Projekt neu hochladen. Veraltetes Projekt-Wissen ist die häufigste Ursache für schlechte Prompts.
- **Sprachmodus nutzen** (Mikrofon), wenn du eine Idee schnell in Worte bringen willst — für das Beschreiben von Wünschen ist Sprechen dreimal schneller als Tippen, und das Aufräumen übernimmt das Projekt.
