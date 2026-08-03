-- ============================================================================
--  Matchup Web — Tatsächliche Aufenthalte eines Nutzers (Schengen-90/180)
--  Schema: web
-- ----------------------------------------------------------------------------
--  Neue Tabelle web.tour_stays. Liefert die Eingabe für src/domain/tour/schengen.ts
--  (Stay: country ISO-alpha-2, entry, exit|null). Ein Aufenthalt ohne exit_date
--  ist OFFEN (läuft noch) — der Rechner zählt ihn bis zum Stichtag.
--
--  TRENNUNG bestätigt/vorgeschlagen (Kern der Ehrlichkeit): Die App schlägt
--  Aufenthalte aus dem Saisonplan vor (confirmed = false). NUR BESTÄTIGTE
--  Aufenthalte dürfen in die 90/180-Rechnung eingehen. Deshalb hat confirmed
--  bewusst KEINEN Default true: eine unbestätigte Vermutung als Restkontingent
--  zu rechnen führt zurück zur systematischen Unterschätzung (BACKLOG MU-018) —
--  bei einer Regel, deren Verletzung eine Einreisesperre nach sich zieht.
--
--  Überlappungen bewusst NICHT hart gesperrt: der Rechner dedupliziert Tage,
--  eine harte EXCLUDE-Constraint bräuchte die Extension btree_gist (nicht aktiv)
--  und würde legitime Wiedereinreisen ablehnen. Überschneidungen werden in der
--  App als weiche Warnung behandelt, nicht als DB-Fehler.
--
--  Rollback siehe Kommentarblock am Dateiende.
-- ============================================================================

-- 1) Tabelle ----------------------------------------------------------------
create table if not exists web.tour_stays (
  id           uuid primary key default gen_random_uuid(),

  -- Nutzer (wie tour_season_plan: FK auf web.profiles(id)); Konto gelöscht → weg.
  user_id      uuid not null references web.profiles(id) on delete cascade,

  -- Land als ISO-3166-1-alpha-2 (Großbuchstaben) — passt zu tour_tournaments.country.
  country      char(2) not null check (country ~ '^[A-Z]{2}$'),

  -- Einreisetag (zählt voll).
  entry_date   date not null,
  -- Ausreisetag (zählt voll) ODER NULL = offener, laufender Aufenthalt.
  exit_date    date,

  -- Bestätigt vs. nur vorgeschlagen. KEIN Default true (siehe Kopf): Bestätigung
  -- ist eine bewusste Nutzerhandlung. Vorschläge starten als false.
  confirmed    boolean not null default false,

  -- Herkunft eines abgeleiteten Vorschlags: stabiler Schlüssel aus dem Saisonplan
  -- (z. B. 'season:TN:2026-08-03'), damit die App einen bereits erzeugten Vorschlag
  -- wiedererkennt und nicht doppelt anlegt. NULL = manuell erfasst.
  source_ref   text,

  note         text,

  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  -- Ausreise nie vor Einreise (erlaubt NULL = offen). Als CHECK, nicht nur in der App.
  constraint tour_stays_dates_chk check (exit_date is null or exit_date >= entry_date)
);

comment on table web.tour_stays is
  'Tatsächliche Aufenthalte je Nutzer für den Schengen-90/180-Rechner. NUR confirmed=true zählt in die Rechnung. RLS: nur eigene Zeilen.';
comment on column web.tour_stays.exit_date is
  'Ausreisetag (zählt voll) oder NULL = offener Aufenthalt; der Rechner zählt dann bis zum Stichtag.';
comment on column web.tour_stays.confirmed is
  'true erst nach bewusster Bestätigung. Kein Default true — unbestätigte Vorschläge dürfen nicht in die 90/180-Rechnung eingehen (MU-018).';
comment on column web.tour_stays.source_ref is
  'Stabiler Herkunftsschlüssel eines Saisonplan-Vorschlags (Idempotenz), NULL = manuell.';

-- 2) Idempotenz der Vorschläge ----------------------------------------------
--    Ein aus dem Plan abgeleiteter Vorschlag existiert je Nutzer nur EINMAL.
--    Partiell (nur wenn source_ref gesetzt), damit manuelle Aufenthalte (NULL)
--    beliebig oft erlaubt sind.
create unique index if not exists uq_web_stays_source
  on web.tour_stays (user_id, source_ref) where source_ref is not null;

-- 3) Index auf Nutzer + Einreisedatum ---------------------------------------
--    Deckt „meine Aufenthalte, chronologisch" (der häufigste Zugriff des Rechners).
create index if not exists idx_web_stays_user_entry
  on web.tour_stays (user_id, entry_date);

-- 4) updated_at automatisch pflegen -----------------------------------------
--    Wiederverwendung der bestehenden web.set_updated_at_tour() (aus
--    web_tour_tournaments.sql) — KEINE zweite Trigger-Funktion, eine Wahrheit.
drop trigger if exists trg_web_stays_updated_at on web.tour_stays;
create trigger trg_web_stays_updated_at before update on web.tour_stays
  for each row execute function web.set_updated_at_tour();

-- 5) RLS + Policy -----------------------------------------------------------
alter table web.tour_stays enable row level security;

-- Muster 1:1 aus web.tour_season_plan: EINE Policy für ALLE Befehle, USING und
-- WITH CHECK je auth.uid() = user_id. anon hat keine auth.uid() → sieht/ändert nichts.
drop policy if exists tour_stays_own on web.tour_stays;
create policy tour_stays_own on web.tour_stays
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 6) Rechte -----------------------------------------------------------------
grant select, insert, update, delete on web.tour_stays to authenticated;
revoke all on web.tour_stays from anon;   -- anon bekommt nichts

-- 7) PostgREST-Schema-Cache neu laden ---------------------------------------
notify pgrst, 'reload schema';

-- ============================================================================
--  ROLLBACK — hebt die Migration vollständig auf. web.set_updated_at_tour()
--  und andere Tabellen bleiben unberührt.
-- ----------------------------------------------------------------------------
-- drop policy if exists tour_stays_own on web.tour_stays;
-- drop trigger if exists trg_web_stays_updated_at on web.tour_stays;
-- drop index if exists web.idx_web_stays_user_entry;
-- drop index if exists web.uq_web_stays_source;
-- drop table if exists web.tour_stays;
-- notify pgrst, 'reload schema';
-- ============================================================================
