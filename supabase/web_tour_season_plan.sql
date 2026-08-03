-- ============================================================================
--  Matchup Web — Saisonplan: Nutzer ↔ web.tour_tournaments
--  Schema: web
-- ----------------------------------------------------------------------------
--  Neue Tabelle web.tour_season_plan. Ein Eintrag = „Nutzer nimmt ein Turnier
--  aus dem eigenen Datenstamm web.tour_tournaments in seine Saison auf".
--
--  ABGRENZUNG: Die bestehende web.tour_plan (Verknüpfung auf den Seed-Katalog
--  web.tournaments, /app-Compete) wird NICHT angefasst. Dies ist die neue,
--  /tour-eigene Verknüpfung auf den aufgelösten Stamm web.tour_tournaments.
--
--  SICHERHEITSKERN: persönliche Saisonpläne. RLS erzwingt, dass ein Nutzer
--  AUSSCHLIESSLICH seine eigenen Zeilen sieht/ändert — Policy-Muster 1:1 aus
--  web.tour_plan („tour_plan own": auth.uid() = user_id für USING und CHECK).
--  Rollback siehe Kommentarblock am Dateiende.
-- ============================================================================

-- 1) Tabelle ----------------------------------------------------------------
create table if not exists web.tour_season_plan (
  id             uuid primary key default gen_random_uuid(),

  -- Nutzer (wie web.tour_plan: FK auf web.profiles(id)). Konto gelöscht →
  -- eigener Saisonplan verschwindet mit (cascade).
  user_id        uuid not null references web.profiles(id) on delete cascade,

  -- Turnier aus dem eigenen Datenstamm.
  -- FK-Löschverhalten: RESTRICT. BEGRÜNDUNG: web.tour_tournaments löscht NIE hart,
  -- sondern setzt valid_to (Soft-Delete). Ein echtes DELETE ist damit ein
  -- Ausnahme-/Wartungsfall — und darf dann NICHT still die persönlichen Pläne
  -- der Nutzer mitreißen (das täte CASCADE). RESTRICT lässt einen solchen
  -- Hart-Löschversuch LAUT scheitern statt Nutzerdaten zu vernichten, und lenkt
  -- bewusst auf den Soft-Delete-Pfad. Inaktive Turniere (valid_to gesetzt) blendet
  -- die App beim Anzeigen über „valid_to is null" aus, ohne die Zeile anzufassen.
  tournament_id  uuid not null references web.tour_tournaments(id) on delete restrict,

  -- Status der NUTZER-Beziehung zum Turnier (nicht der Turnier-Lebenszyklus).
  -- Englische Codes im Stil von tour_tournaments.status:
  --   planned   = geplant
  --   entered   = gemeldet   (Meldung/Entry abgegeben)
  --   confirmed = bestätigt  (Startplatz bestätigt)
  --   cancelled = abgesagt   (zurückgezogen/gestrichen)
  status         text not null default 'planned'
                   check (status in ('planned','entered','confirmed','cancelled')),

  -- Freie Notiz des Nutzers (optional).
  note           text,

  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  -- Eindeutigkeit: derselbe Nutzer nimmt dasselbe Turnier nur EINMAL auf.
  constraint tour_season_plan_user_tournament_uniq unique (user_id, tournament_id)
);

comment on table web.tour_season_plan is
  'Persönlicher Saisonplan: Nutzer ↔ web.tour_tournaments, mit Status + Notiz. RLS: nur eigene Zeilen. Getrennt von web.tour_plan (Seed-Katalog).';
comment on column web.tour_season_plan.status is
  'planned|entered|confirmed|cancelled = geplant|gemeldet|bestätigt|abgesagt.';
comment on column web.tour_season_plan.tournament_id is
  'FK auf web.tour_tournaments(id), on delete restrict — Stamm nutzt Soft-Delete (valid_to).';

-- 2) updated_at automatisch pflegen -----------------------------------------
--    Wiederverwendung der bestehenden web.set_updated_at_tour() aus
--    web_tour_tournaments.sql (garantiert vorhanden: der FK oben verlangt die
--    dortige Tabelle). KEINE zweite Trigger-Funktion — eine Wahrheit.
drop trigger if exists trg_web_tsp_updated_at on web.tour_season_plan;
create trigger trg_web_tsp_updated_at before update on web.tour_season_plan
  for each row execute function web.set_updated_at_tour();

-- 3) Indizes ----------------------------------------------------------------
--    user_id ist bereits durch UNIQUE(user_id, tournament_id) als FÜHRENDE Spalte
--    indiziert — „meine Saison"-Lookups laufen darüber, kein separater Index nötig.
--    Für die Gegenrichtung (FK-Prüfung / „wer plant dieses Turnier") ein Index
--    auf tournament_id:
create index if not exists idx_web_tsp_tournament on web.tour_season_plan(tournament_id);

-- 4) RLS + Policy -----------------------------------------------------------
alter table web.tour_season_plan enable row level security;

-- Muster 1:1 aus web.tour_plan: EINE Policy für ALLE Befehle, USING und WITH CHECK
-- je auth.uid() = user_id. anon hat keine auth.uid() → sieht/ändert nichts.
drop policy if exists tour_season_plan_own on web.tour_season_plan;
create policy tour_season_plan_own on web.tour_season_plan
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 5) Rechte -----------------------------------------------------------------
grant select, insert, update, delete on web.tour_season_plan to authenticated;
revoke all on web.tour_season_plan from anon;   -- anon bekommt nichts

-- 6) PostgREST-Schema-Cache neu laden ---------------------------------------
notify pgrst, 'reload schema';

-- ============================================================================
--  ROLLBACK — hebt die Migration vollständig auf. web.tour_plan,
--  web.tour_tournaments und web.set_updated_at_tour() bleiben unberührt.
--  (Bei Bedarf den folgenden Block auskommentieren/ausführen.)
-- ----------------------------------------------------------------------------
-- drop policy if exists tour_season_plan_own on web.tour_season_plan;
-- drop trigger if exists trg_web_tsp_updated_at on web.tour_season_plan;
-- drop index if exists web.idx_web_tsp_tournament;
-- drop table if exists web.tour_season_plan;
-- notify pgrst, 'reload schema';
-- ============================================================================
