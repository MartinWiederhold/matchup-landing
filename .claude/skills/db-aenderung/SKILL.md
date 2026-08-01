---
name: db-aenderung
description: Sicherer Ablauf für Datenbankänderungen in Supabase (Schema web) — SQL zuerst zeigen, RLS-Policies mitliefern, Rollback bereitstellen, Typen nachziehen. Nutze das für jede neue Tabelle, Spalte, Funktion oder Policy.
argument-hint: [was geändert werden soll]
---

# Datenbankänderung: $ARGUMENTS

## Grundregeln (nicht verhandelbar)

- Schema ist **`web`**, niemals `public`.
- **RLS gehört in dieselbe Migration** wie die Tabelle. Keine Tabelle ohne Policies.
- Standard ist restriktiv: `anon` bekommt keinen Zugriff, außer ich sage es ausdrücklich.
- Helper-Funktionen: `SECURITY DEFINER` mit fixem `search_path`.
- Keine Views — die umgehen RLS.
- Spalten- und Tabellennamen im Stil der bestehenden Tabellen (snake_case, `created_at`/`updated_at`).

## Schritt 1 — Bestandsaufnahme

Sieh dir die passenden Dateien unter `supabase/` an (`web_schema.sql`, `web_events.sql`, `web_security_hardening*.sql`) und die vorhandenen Muster für Policies. Berichte, an welchem bestehenden Muster du dich orientierst.

## Schritt 2 — SQL vorlegen (noch nichts ausführen)

Zeig mir vollständig:
1. DDL (Tabelle/Spalte/Funktion/Trigger)
2. `alter table web.<name> enable row level security;`
3. Alle Policies, je Rolle und Operation einzeln, mit kurzer Erklärung in einem Satz
4. Indizes, wo sinnvoll
5. **Rollback-SQL** in einem eigenen Block

**→ Hier anhalten. Warte auf mein OK.**

## Schritt 3 — Umsetzen

- Neue Datei unter `supabase/` anlegen, sprechender Name.
- Ausführen.
- Danach: `notify pgrst, 'reload schema';`

## Schritt 4 — Anwendungsseite nachziehen

- Typen in `src/lib/types.ts` ergänzen.
- Falls Zugriff über den Anon-Client läuft: prüfen, dass die Policies den erwarteten Fall wirklich erlauben — einmal gegen die echte DB testen.
- Service-Client nur serverseitig (`src/lib/adminClient.ts`).

## Schritt 5 — Bericht

- Was in der DB jetzt existiert
- Welche Policies greifen, in Klartext („Nur Mitglieder der Gruppe dürfen lesen")
- Rollback-Befehl zum Kopieren
- Was in `MATCHUP-WEBAPP-TECHNIK.md` nachgetragen werden muss
