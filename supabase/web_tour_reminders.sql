-- ============================================================================
--  Matchup Web — Fristen-Erinnerungen per E-Mail (Tour)
--  Schema: web        ·        ENTWURF — NICHT ANWENDEN vor Freigabe.
-- ----------------------------------------------------------------------------
--  Ein täglicher/stündlicher Lauf prüft die ITF-Meldefristen der Turniere in der
--  EIGENEN Saison und schickt vier Erinnerungen (ITF-Regelwerk, aus deadlines.ts):
--    Meldeschluss −72h · Meldeschluss −24h · Rückzugsfrist −48h · Rückzugsfrist −12h
--  Challenger-Fristen sind UNBEKANNT (MU-014) → es wird NICHTS geraten und NICHTS
--  verschickt. deadlines.ts bleibt unberührt.
--
--  Zwei Tabellen:
--   A) tour_reminder_settings — Nutzer-Einstellung (an/aus + E-Mail-Sprache). Owner-only.
--   B) tour_reminder_log       — Merkliste des DIENSTES (wer/Turnier/Zeitpunkt/wann
--                                 verschickt). Verhindert doppelte Mails per UNIQUE.
--                                 Schreibt NUR der Dienst (service_role), nie der Nutzer.
--
--  Versand über SendGrid-REST wie in src/app/api/welcome-email (kein neues Paket).
--  Cron-Muster wie /api/news/sync (CRON_SECRET). Rollback am Dateiende.
-- ============================================================================


-- ============================================================================
--  A) web.tour_reminder_settings — die Einstellung gehört dem NUTZER
-- ----------------------------------------------------------------------------
--  Eine Zeile je Nutzer. Vorgabe: enabled=true (Erinnerungen an) — es geht um die
--  EIGENEN, selbst geplanten Turniere (erwarteter Service), UND jede Mail trägt einen
--  Abmelde-Link. locale steuert die Mail-Sprache (die UI-Sprache ist ein Cookie und
--  serverseitig nicht sichtbar → hier persistiert; Default 'de').
-- ============================================================================
create table if not exists web.tour_reminder_settings (
  user_id     uuid primary key references web.profiles(id) on delete cascade,
  enabled     boolean not null default true,
  locale      text    not null default 'de' check (locale in ('de','en')),
  updated_at  timestamptz not null default now()
);

comment on table web.tour_reminder_settings is
  'Nutzer-Einstellung für Fristen-Erinnerungen (an/aus + Mail-Sprache). Owner-only. Fehlende Zeile = Vorgabe enabled=true, locale de.';

-- updated_at automatisch (vorhandene Trigger-Funktion wiederverwenden — eine Wahrheit).
drop trigger if exists trg_web_trs_updated_at on web.tour_reminder_settings;
create trigger trg_web_trs_updated_at before update on web.tour_reminder_settings
  for each row execute function web.set_updated_at_tour();

-- RLS: nur die eigene Zeile lesen/schreiben (Muster 1:1 aus tour_season_plan).
alter table web.tour_reminder_settings enable row level security;
drop policy if exists tour_reminder_settings_own on web.tour_reminder_settings;
create policy tour_reminder_settings_own on web.tour_reminder_settings
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update on web.tour_reminder_settings to authenticated;
revoke all on web.tour_reminder_settings from anon;


-- ============================================================================
--  B) web.tour_reminder_log — Merkliste des DIENSTES (Dedup)
-- ----------------------------------------------------------------------------
--  Ein Eintrag = „diese Erinnerung wurde verschickt". UNIQUE(user_id, tournament_id,
--  kind) macht jede Erinnerung EINMALIG — auch bei Doppel-/Retry-Läufen. Bewusst an
--  tournament_id (nicht plan_id) gebunden: entfernt+neu-aufgenommen soll NICHT erneut
--  senden (dieselbe Turnier-Edition, dieselbe Frist).
-- ============================================================================
create table if not exists web.tour_reminder_log (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references web.profiles(id) on delete cascade,
  tournament_id uuid not null references web.tour_tournaments(id) on delete cascade,
  -- Vier Zeitpunkte nach ITF-Regelwerk (aus deadlines.ts abgeleitet):
  kind          text not null
                  check (kind in ('entry_72h','entry_24h','withdrawal_48h','withdrawal_12h')),
  sent_at       timestamptz not null default now(),
  constraint tour_reminder_log_uniq unique (user_id, tournament_id, kind)
);

comment on table web.tour_reminder_log is
  'Merkliste des Erinnerungs-Dienstes: wer/Turnier/Zeitpunkt/wann verschickt. UNIQUE verhindert doppelte Mails. Schreibt nur service_role.';

-- Gegenrichtung „welche Erinnerungen hat dieses Turnier ausgelöst" — selten, aber billig.
create index if not exists idx_web_trl_tournament on web.tour_reminder_log(tournament_id);

-- RLS: der Nutzer darf die EIGENE Historie LESEN (Transparenz), aber NICHT schreiben.
-- Kein insert/update/delete-Grant für authenticated → nur service_role (Dienst) schreibt
-- (bypassed RLS). So kann niemand die Merkliste manipulieren, um Mails zu erzwingen/blocken.
alter table web.tour_reminder_log enable row level security;
drop policy if exists tour_reminder_log_own_read on web.tour_reminder_log;
create policy tour_reminder_log_own_read on web.tour_reminder_log
  for select
  using (auth.uid() = user_id);

grant select on web.tour_reminder_log to authenticated;  -- nur lesen
revoke insert, update, delete on web.tour_reminder_log from authenticated;
revoke all on web.tour_reminder_log from anon;


-- PostgREST-Schema-Cache neu laden.
notify pgrst, 'reload schema';


-- ============================================================================
--  ROLLBACK — hebt die Migration vollständig auf (deadlines.ts, tour_season_plan,
--  tour_tournaments, set_updated_at_tour bleiben unberührt).
-- ----------------------------------------------------------------------------
-- drop policy if exists tour_reminder_log_own_read on web.tour_reminder_log;
-- drop index if exists web.idx_web_trl_tournament;
-- drop table if exists web.tour_reminder_log;
-- drop policy if exists tour_reminder_settings_own on web.tour_reminder_settings;
-- drop trigger if exists trg_web_trs_updated_at on web.tour_reminder_settings;
-- drop table if exists web.tour_reminder_settings;
-- notify pgrst, 'reload schema';
-- ============================================================================
