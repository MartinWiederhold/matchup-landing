-- ============================================================================
--  Matchup Web — Entscheidungsfeld je Saison-Turnier (Wochen-Pipeline)
--  Schema: web        ·        ENTWURF — NICHT ANWENDEN vor Freigabe.
-- ----------------------------------------------------------------------------
--  Die Wochen-Pipeline (Kommandozentrale) braucht EIN neues Feld: wie der Spieler
--  sich für dieses Turnier entschieden hat — spielen · warten · Ausweichturnier · offen.
--
--  WOHIN: als Spalte an web.tour_season_plan. Begründung: es ist EIN aktueller
--  Einzelwert JE PLANZEILE (wie status, alternate_position, fee_paid) — keine Historie
--  (dafür gibt es tour_entry_events). Also dieselbe Zeile, dieselbe owner-only-RLS,
--  kein neuer Tisch. Additiv, Default 'open' → Optimierer/„Füllen" (INSERT ohne decision)
--  bleiben unberührt; bestehende Zeilen bekommen 'open'.
--
--  BEWUSST NICHT modelliert: „Wahrscheinlichkeit" (käme aus den Acceptance Lists,
--  nicht abrufbar). Wird nicht geschätzt, nicht erfunden — entfällt.
-- ============================================================================

alter table web.tour_season_plan add column if not exists decision text not null default 'open'
  check (decision in ('play','wait','fallback','open'));
--   play     = spielen
--   wait     = warten (z. B. auf Nachrücken von der Alternate-Liste)
--   fallback = Ausweichturnier
--   open     = offen (Vorgabe)

comment on column web.tour_season_plan.decision is
  'Entscheidung des Spielers je Turnier: play|wait|fallback|open = spielen|warten|Ausweichturnier|offen.';

-- RLS/Policy/Grants von tour_season_plan gelten unverändert (owner-only, authenticated hat
-- bereits select/insert/update/delete) — nichts Neues nötig.

-- PostgREST-Schema-Cache neu laden.
notify pgrst, 'reload schema';

-- ============================================================================
--  ROLLBACK — hebt die Spalte auf (restliche Tabelle unberührt).
-- ----------------------------------------------------------------------------
-- alter table web.tour_season_plan drop column if exists decision;
-- notify pgrst, 'reload schema';
-- ============================================================================
