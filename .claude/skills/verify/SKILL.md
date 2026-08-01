---
name: verify
description: Führt die komplette Verifikationskette für Matchup aus — Typprüfung, Build, Tests — und berichtet das Ergebnis. Nutze das nach jeder Änderung und vor jedem Commit.
---

# Verifikation

Führe der Reihe nach aus und berichte nach jedem Schritt kurz das Ergebnis:

```bash
export PATH="$HOME/.nvm/versions/node/v24.5.0/bin:/opt/homebrew/bin:$PATH"
npx tsc --noEmit
npx next build
npx vitest run
```

## Regeln

- Bricht ein Schritt ab: **stoppe**, zeig mir die Fehlermeldung, nenne die wahrscheinliche Ursache, schlage den kleinstmöglichen Fix vor. Erst nach meinem OK ändern, dann von vorn beginnen.
- Fasse nichts an, was mit dem Fehler nichts zu tun hat.
- Vitest muss grün sein (mindestens 13 Tests in `src/domain/**`). Tests niemals überspringen, deaktivieren oder anpassen, damit sie grün werden — außer die Logikänderung war beabsichtigt und ich habe es gesagt.

## Zusatzprüfung (immer mitmachen)

Prüfe die geänderten Dateien auf:
- Secrets, Keys, Tokens im Code oder in Kommentaren
- neue `NEXT_PUBLIC_*`-Variablen mit sensiblem Inhalt
- `select("*")` oder `select()` ohne Spaltenliste auf `profiles`
- neue UI-Texte, die nur auf Deutsch existieren (EN fehlt in `src/lib/i18n/messages/*`)
- `COMPETE_EARLY_ACCESS_OPEN` — muss `false` sein

## Abschluss

Gib eine Zeile aus: `✅ tsc | ✅ build | ✅ tests | <Anzahl> Zusatzfunde`
