# Prompt-Vorlagen für Claude Code

> Diese Vorlagen liegen auch im Projekt-Wissen. Im Claude-Projekt reicht meist ein `PROMPT: …` —
> dann wird automatisch die passende Vorlage gefüllt. Hier für den Fall, dass du direkt loslegen willst.
> Platzhalter in `<spitzen Klammern>` ersetzen.

---

## 1 · Feature bauen

```
## Aufgabe
<Ein Satz: was soll danach möglich sein>

## Kontext
- Repo: ~/matchup-web, Branch feature/matchup-webapp
- Betroffener Bereich: <z. B. Play-Modus, Discover-Tab / Tour-Modus, ExpensesView / Marketing /beratung>
- Relevante Dateien: <Pfade>
- Als Vorlage nehmen: <Datei, die etwas Vergleichbares schon richtig macht>

## Vorgehen
1. Lies zuerst die genannten Dateien und melde in einem Satz, was du vorfindest.
2. Zeig mir kurz deinen Plan (Dateien + Reihenfolge), bevor du schreibst.
3. Umsetzen.

## Anforderungen
- <prüfbarer Punkt>
- Alle neuen UI-Texte über i18n in src/lib/i18n/messages/*, DE **und** EN
- Sprache: "Verbinden", kein Dating-Vokabular
- Falls DB-Zugriff: Schema `web`, explizite Spaltenliste, kein select *

## Nicht tun
- Keine neuen Dependencies ohne Rückfrage
- Keine Änderungen außerhalb der genannten Dateien
- Keine DB-Spalten oder Env-Variablen erfinden — im Zweifel fragen

## Verifikation
npx tsc --noEmit && npx next build && npx vitest run

## Fertig wenn
- <was ich im Browser sehen/klicken kann>
```

---

## 2 · Fehler beheben

```
## Fehlerbild
Was ich sehe: <Beschreibung>
Wo: <URL/Route/Tab>
Wann: <Schritte zum Reproduzieren>
Fehlermeldung: <Konsole/Terminal, wörtlich>

## Aufgabe
Ursache finden und beheben. Kein Workaround, der das Symptom versteckt.

## Vorgehen
1. Nenne mir zuerst 2–3 mögliche Ursachen, geordnet nach Wahrscheinlichkeit.
2. Prüfe sie der Reihe nach im Code und sag, welche es ist.
3. Erst dann fixen — so klein wie möglich.

## Anforderungen
- Änderung so eng wie möglich halten
- Falls die Ursache in reiner Logik liegt (src/domain/**): Regressionstest ergänzen

## Verifikation
npx tsc --noEmit && npx next build && npx vitest run
Danach: den Reproduktionsweg oben noch einmal durchgehen und bestätigen.
```

---

## 3 · Security / Härtung

```
## Aufgabe
<z. B. Alle select * auf profiles durch explizite Spaltenlisten ersetzen>

## Warum
<Risiko in einem Satz>

## Vorgehen — ZWEI DURCHGÄNGE, nicht vermischen
Durchgang 1: Nur suchen. Liste mir alle betroffenen Stellen mit Datei + Zeile auf. Nichts ändern.
Durchgang 2 (erst nach meinem OK): Änderungen umsetzen.

## Anforderungen
- Kein Verhalten der App verändern, nur die Datenmenge/Berechtigung einschränken
- RLS-Policies nicht aufweichen
- Keine Secrets ins Client-Bundle, kein neues NEXT_PUBLIC_*

## Verifikation
npx tsc --noEmit && npx next build && npx vitest run
Zusätzlich: <konkreter manueller Check, z. B. "Discover lädt weiterhin Profile">
```

---

## 4 · Datenbank / Migration

```
## Aufgabe
<z. B. Tabelle web.shared_stays anlegen für geteilte Unterkünfte>

## Rahmenbedingungen
- Schema ist `web`, nicht public
- RLS muss aktiv sein, Policies gehören in dieselbe Migration
- Helper-Funktionen: SECURITY DEFINER mit fixem search_path
- Neue SQL-Datei unter supabase/ ablegen, nicht nur ad hoc ausführen

## Vorgehen
1. Zeig mir zuerst NUR das SQL (DDL + RLS + Policies + ggf. Trigger) — noch nichts ausführen.
2. Nach meinem OK: Datei anlegen, ausführen, danach `notify pgrst, 'reload schema';`
3. Anschließend TypeScript-Typen in src/lib/types.ts ergänzen.

## Anforderungen
- Rollback-SQL mitliefern
- Kein Zugriff für anon, außer ich sage es ausdrücklich
- Spaltennamen im Stil der bestehenden Tabellen

## Fertig wenn
- Tabelle existiert, RLS aktiv, Policies greifen, Typen ergänzt, Rollback dokumentiert
```

---

## 5 · Refactor / Aufräumen

```
## Aufgabe
<z. B. Doppelte Logo-Logik zwischen Home-Tab und Map zusammenführen>

## Wichtig
Das Verhalten darf sich NICHT ändern. Reines Umstrukturieren.

## Vorgehen
1. Zeig mir zuerst, welche Stellen betroffen sind und wie die gemeinsame Lösung aussehen soll.
2. Nach OK umsetzen, in einem Rutsch, ohne Zwischenzustände die nicht bauen.

## Anforderungen
- Keine Verhaltensänderung, keine neuen Features nebenbei
- Keine Umformatierung von Dateien, die inhaltlich nicht betroffen sind
- Falls Logik nach src/domain/** wandert: Tests mitziehen

## Verifikation
npx tsc --noEmit && npx next build && npx vitest run
```

---

## 6 · Review vor dem Deploy

```
## Aufgabe
Prüfe meine Änderungen, bevor ich deployen.

## Vorgehen
1. `git diff` und `git status` ansehen.
2. Bewerte nach: (a) Fehler/Bugs, (b) Sicherheit, (c) Verstöße gegen CLAUDE.md, (d) vergessene EN-Übersetzungen, (e) vergessene Tests.
3. Ordne jeden Fund nach Hoch/Mittel/Niedrig.
4. Nichts ändern ohne Rückfrage.

## Zusätzlich prüfen
- Kein Secret, kein Service-Role-Key, kein Token im Diff
- Kein neues NEXT_PUBLIC_* mit sensiblem Inhalt
- Kein select * auf profiles
- Neue Texte in DE und EN vorhanden
- COMPETE_EARLY_ACCESS_OPEN steht weiterhin auf false

## Abschluss
npx tsc --noEmit && npx next build && npx vitest run — Ergebnis berichten.
```

---

## Kleine Kniffe

- **Zu groß geraten?** → „Mach nur Schritt 1 und halt dann an."
- **Claude wird abenteuerlich?** → „Halte dich exakt an das bestehende Muster in `<Datei>`. Keine eigenen Ideen."
- **Unklar, ob etwas existiert?** → „Prüfe zuerst, ob `<X>` existiert. Wenn nein, melde dich, statt es anzulegen."
- **Kontext voll?** → `/clear` und mit einem frischen, vollständigen Prompt neu starten. Halbvolle Sessions produzieren die schlechtesten Ergebnisse.
