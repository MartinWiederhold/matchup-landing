-- ============================================================================
--  Matchup Web — zusätzliche Einnahmen je Turnier (Turnier-Bilanz)
--  Schema: web        ·        ENTWURF — NICHT ANWENDEN vor Freigabe.
-- ----------------------------------------------------------------------------
--  Die Bilanz stellt Ausgaben (web.tour_expenses) gegen Einnahmen. Das Preisgeld
--  liegt bereits in web.tour_prize (mit /app geteilt). Die weiteren Einnahmen aus
--  dem Bericht — Sponsorenanteil, Verbandsunterstützung, Vereinszuschuss, Bonus —
--  fehlen. Sie kommen in eine EIGENE Tabelle web.tour_income (NICHT als Spalten an
--  tour_prize).
--
--  WARUM eigene Tabelle statt tour_prize erweitern:
--   1) tour_prize ist EINE Zeile je (user, tournament) = DAS Preisgeld (Upsert).
--      Die neuen Posten sind je EIGENE Einnahmen mit eigenem Betrag UND eigener
--      Währung, oft MEHRERE (z. B. zwei Sponsoren) — das ist ein Zeile-je-Eintrag-
--      Modell wie tour_expenses (Kategorie), nicht ein paar starre Extra-Spalten.
--   2) tour_prize wird von /app gelesen/geschrieben — additiv bleiben heißt: NICHT
--      umbauen. Das Preisgeld bleibt dort autoritativ; tour_income hält nur die
--      Zusatz-Einnahmen. Die Bilanz = tour_prize + tour_income − tour_expenses, je Währung.
--
--  KONVENTIONEN (1:1 wie tour_expenses/tour_prize, damit nichts driftet):
--   - amount ist `numeric` in HAUPTWÄHRUNG (49.50, NICHT Cent).
--   - tournament_id ist `text` (Diskriminator: uuid = /tour, Slug = /app), NULLbar
--     (auch nicht-turnierbezogene Einnahmen möglich).
--   - Währung je Zeile; NIE währungsübergreifend addieren (Projektregel, in der App).
--
--  RLS: „own" (Eigentümer) PLUS „agent read" — exakt wie tour_expenses/tour_prize:
--  ein aktiver Agent (web.tour_team) darf die Einnahmen seines Spielers LESEN, sonst
--  wäre die Einnahmenseite der Bilanz für Agenten unsichtbar, obwohl Ausgaben/Preisgeld
--  es sind. Rollback am Dateiende.
-- ============================================================================

create table if not exists web.tour_income (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references web.profiles(id) on delete cascade,

  -- Gleicher Diskriminator wie tour_expenses: uuid (/tour) ODER Slug (/app), NULLbar.
  tournament_id text,

  -- Art der Einnahme. KEIN 'prize' (das liegt in tour_prize).
  kind          text not null
                  check (kind in ('sponsor','federation','club','bonus','other')),
  --   sponsor    = Sponsorenanteil
  --   federation = Verbandsunterstützung
  --   club       = Vereinszuschuss
  --   bonus      = Bonus
  --   other      = sonstige Einnahme

  amount        numeric,   -- HAUPTWÄHRUNG (49.50), gleiche Konvention wie tour_expenses/tour_prize
  currency      text,
  received_on   date,
  note          text,

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table web.tour_income is
  'Zusätzliche Einnahmen je Turnier (Sponsor/Verband/Verein/Bonus/sonstige) für die Turnier-Bilanz. Preisgeld liegt getrennt in tour_prize. Beträge in Hauptwährung; Diskriminator tournament_id wie tour_expenses.';

-- updated_at automatisch (vorhandene Funktion wiederverwenden).
drop trigger if exists trg_web_tour_income_updated_at on web.tour_income;
create trigger trg_web_tour_income_updated_at before update on web.tour_income
  for each row execute function web.set_updated_at_tour();

-- „meine Einnahmen" + Gegenrichtung je Turnier.
create index if not exists idx_web_tour_income_user on web.tour_income(user_id);
create index if not exists idx_web_tour_income_tournament on web.tour_income(tournament_id);

-- RLS ----------------------------------------------------------------------
alter table web.tour_income enable row level security;

-- Eigentümer: lesen + schreiben (Muster wie „tour_expenses own").
drop policy if exists "tour_income own" on web.tour_income;
create policy "tour_income own" on web.tour_income
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Agent: NUR lesen (Muster 1:1 aus „tour_expenses agent read").
drop policy if exists "tour_income agent read" on web.tour_income;
create policy "tour_income agent read" on web.tour_income
  for select
  using (exists (
    select 1 from web.tour_team tt
    where tt.player_id = tour_income.user_id
      and tt.member_user_id = auth.uid()
      and tt.status = 'active'
      and tt.role = 'agent'
  ));

grant select, insert, update, delete on web.tour_income to authenticated;
revoke all on web.tour_income from anon;

-- PostgREST-Schema-Cache neu laden.
notify pgrst, 'reload schema';

-- ============================================================================
--  ROLLBACK — hebt die Tabelle auf (tour_expenses/tour_prize/tour_team unberührt).
-- ----------------------------------------------------------------------------
-- drop policy if exists "tour_income agent read" on web.tour_income;
-- drop policy if exists "tour_income own" on web.tour_income;
-- drop trigger if exists trg_web_tour_income_updated_at on web.tour_income;
-- drop index if exists web.idx_web_tour_income_tournament;
-- drop index if exists web.idx_web_tour_income_user;
-- drop table if exists web.tour_income;
-- notify pgrst, 'reload schema';
-- ============================================================================
