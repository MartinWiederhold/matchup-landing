-- ============================================================================
-- Teil 1b — Moderations-/Statusfelder aus web.profiles auslagern
-- ============================================================================
-- profiles.SELECT = true → jeder Eingeloggte konnte report_count, banned_at,
-- pause_reason, daily_likes_* aller Nutzer lesen. „Wer wie oft gemeldet wurde"
-- ist eine Aussage über eine Person, die sie selbst nicht kennen darf: Wer die
-- eigene Meldezahl sieht, kann ableiten, wer ihn gemeldet hat — bei einer App,
-- in der man sich mit Fremden zum Spielen verabredet, ein Sicherheitsproblem.
--
-- Zwei Sichtbarkeits-Stufen:
--   • pause_reason → nach web.profiles_private (OWNER + service). Wer pausiert
--     wurde, MUSS den Grund erfahren (AppGuard).
--   • report_count, banned_at, daily_likes_count, daily_likes_reset → nach
--     web.profiles_moderation, SERVICE-ONLY. Nicht mal der Eigner liest sie.
--     Admin liest sie über eine verifyAdmin-Server-Route (service_role).
--
-- is_banned / is_paused BLEIBEN in profiles (Discover braucht sie zum Ausblenden).
-- daily_likes_* sind faktisch tot (kein Code, kein Likes-Trigger) — wandern
-- trotzdem mit in die service-only-Stufe.

-- ── Phase 1a: pause_reason → profiles_private (owner-lesbar) ─────────────────
alter table web.profiles_private add column if not exists pause_reason text;
update web.profiles_private pp set pause_reason = p.pause_reason
  from web.profiles p where p.id = pp.user_id;
-- (Grant auf profiles_private besteht schon: select/insert/update an authenticated.)

-- ── Phase 1b: report_count/banned_at/daily_likes → profiles_moderation ───────
create table if not exists web.profiles_moderation (
  user_id            uuid primary key references web.profiles(id) on delete cascade,
  report_count       integer default 0,
  banned_at          timestamptz,
  daily_likes_count  integer default 0,
  daily_likes_reset  timestamptz
);
alter table web.profiles_moderation enable row level security;
-- KEINE Policy für authenticated/anon → für normale Nutzer komplett dicht
-- (auch der Eigner liest NICHT). service_role umgeht RLS.
-- GRANTs NUR an service_role — KEIN authenticated/anon (sonst wäre report_count
-- doch owner-lesbar). Ohne diesen Grant „permission denied" (Lehre aus Teil 1a).
grant select, insert, update on web.profiles_moderation to service_role;

update web.profiles_moderation pm set
    report_count = p.report_count, banned_at = p.banned_at,
    daily_likes_count = p.daily_likes_count, daily_likes_reset = p.daily_likes_reset
  from web.profiles p where p.id = pm.user_id;
-- Backfill der Zeilen für den Bestand (Trigger legt sie künftig automatisch an):
insert into web.profiles_moderation (user_id, report_count, banned_at, daily_likes_count, daily_likes_reset)
  select id, report_count, banned_at, daily_likes_count, daily_likes_reset from web.profiles
  on conflict (user_id) do nothing;

-- ── Auto-Create-Trigger erweitern: auch profiles_moderation anlegen ──────────
create or replace function web.create_profiles_private_row()
returns trigger language plpgsql security definer set search_path = web, public as $$
begin
  insert into web.profiles_private (user_id) values (new.id) on conflict (user_id) do nothing;
  insert into web.profiles_moderation (user_id) values (new.id) on conflict (user_id) do nothing;
  return new;
end $$;

-- ── Guard-Trigger anpassen: banned_at/report_count sind nicht mehr in profiles ─
-- (Sonst brechen die Trigger beim nächsten profiles-Insert/Update: NEW.banned_at
--  existiert nicht mehr.) is_verified/is_banned/is_seed/match_score/matches_rated
-- bleiben eingefroren wie bisher.
create or replace function web.guard_profile_cols()
returns trigger language plpgsql as $$
begin
  if current_user in ('authenticated','anon') then
    if tg_op = 'UPDATE' then
      new.is_verified   := old.is_verified;
      new.is_banned     := old.is_banned;
      new.match_score   := old.match_score;
      new.matches_rated := old.matches_rated;
      new.is_seed       := old.is_seed;
    else
      new.is_verified   := false;
      new.is_banned     := false;
      new.match_score   := coalesce(new.match_score, 1000);
      new.matches_rated := 0;
      new.is_seed       := false;
    end if;
  end if;
  return new;
end $$;

create or replace function web.protect_profile_privileged()
returns trigger language plpgsql security definer set search_path to 'web' as $$
declare jrole text;
begin
  jrole := coalesce(current_setting('request.jwt.claims', true)::jsonb->>'role', '');
  if jrole = 'service_role' then return new; end if;
  if tg_op = 'INSERT' then
    new.is_verified := false;
    new.is_banned   := false;
    new.is_seed     := false;
  else
    new.is_verified := old.is_verified;
    new.is_banned   := old.is_banned;
    new.is_seed     := old.is_seed;
  end if;
  return new;
end $$;

notify pgrst, 'reload schema';

-- ── Phase 2: Spalten aus web.profiles entfernen ─────────────────────────────
-- Angewendet 2026-08-11, NACH dem Code-Deploy (6d4e9ab): AuthProvider merged
-- pause_reason; AppGuard/Admin-Action-Route/Admin-Lese-Route umgestellt; kein
-- profiles-Zugriff mehr auf diese Felder (Code zuerst, dann Drop — CLAUDE.md).
alter table web.profiles
  drop column report_count, drop column banned_at, drop column pause_reason,
  drop column daily_likes_count, drop column daily_likes_reset;
notify pgrst, 'reload schema';

-- ── Rollback ────────────────────────────────────────────────────────────────
--   Spalten in profiles zurück (add column …) + aus profiles_private/-moderation
--   zurückschreiben; Guard-Trigger wieder mit banned_at/report_count-Zeilen;
--   drop table web.profiles_moderation; alter table profiles_private drop column pause_reason.
