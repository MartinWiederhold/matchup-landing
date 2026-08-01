---
name: neues-feature
description: Strukturierter Ablauf für ein neues Feature in Matchup — erst orientieren, dann planen, dann bauen, dann verifizieren. Nutze das für alles, was mehr als eine Datei berührt.
argument-hint: [Ticket-ID oder Beschreibung]
---

# Neues Feature: $ARGUMENTS

Halte dich strikt an diese Reihenfolge. Baue nichts, bevor Phase 2 freigegeben ist.

## Phase 1 — Orientieren (kein Code)

1. Suche im Repo nach der Stelle, an der es Ähnliches bereits gibt.
2. Lies die relevanten Dateien.
3. Berichte in maximal 10 Zeilen:
   - Wo das Feature hingehört (Play-Modus / Tour-Modus / Marketing / Admin / domain)
   - Welche Dateien betroffen wären
   - Welches bestehende Muster du kopieren würdest
   - Ob DB-Änderungen nötig sind (falls ja: hier stoppen, `/db-aenderung` nutzen)
   - Ob Next.js-16-Besonderheiten reinspielen — falls ja, vorher `node_modules/next/dist/docs/` konsultieren

## Phase 2 — Plan

Leg einen nummerierten Plan vor: Datei für Datei, in Umsetzungsreihenfolge, mit Risiken.
Nenne, welche i18n-Schlüssel neu dazukommen (DE **und** EN).

**→ Warte auf mein OK.**

## Phase 3 — Bauen

- Nur die geplanten Dateien anfassen.
- Bestehende Muster kopieren, keine neuen Ansätze einführen.
- UI-Texte ausschließlich über i18n, immer DE und EN.
- Sprache: „Verbinden", kein Dating-Vokabular.
- DB-Zugriffe: Schema `web`, explizite Spaltenliste, nie `select *` auf `profiles`.
- Reine Logik nach `src/domain/**` — mit Vitest-Test.
- Keine neuen Dependencies ohne Rückfrage.

## Phase 4 — Verifizieren

```bash
export PATH="$HOME/.nvm/versions/node/v24.5.0/bin:/opt/homebrew/bin:$PATH"
npx tsc --noEmit && npx next build && npx vitest run
```
Fehler selbst beheben, dann erneut prüfen.

## Phase 5 — Bericht

- Was gebaut wurde, welche Dateien
- Was ich im Browser prüfen soll: konkreter Pfad + erwartetes Verhalten
- Was bewusst nicht gemacht wurde
- Ob `BACKLOG.md` aktualisiert werden muss
