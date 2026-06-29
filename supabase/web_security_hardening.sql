-- ============================================================================
--  Matchup Web — Security-Härtung der RLS (kritische Tabellen)
--  Vorher: web_authenticated_all (for all to authenticated using(true)) auf
--  ALLEN Tabellen → jeder Eingeloggte konnte ALLE Profile ändern (sich selbst
--  verifizieren/entsperren, fremde bearbeiten) und ALLE privaten Chats lesen.
--  service_role (Server/Admin) umgeht RLS und bleibt voll funktionsfähig.
-- ============================================================================

-- ── PROFILES ────────────────────────────────────────────────────────────────
-- Lesen für Eingeloggte (Discover/Embeds), Schreiben nur am EIGENEN Profil.
drop policy if exists web_authenticated_all on web.profiles;
drop policy if exists web_profiles_select on web.profiles;
drop policy if exists web_profiles_insert on web.profiles;
drop policy if exists web_profiles_update on web.profiles;
drop policy if exists web_profiles_delete on web.profiles;
create policy web_profiles_select on web.profiles for select to authenticated using (true);
create policy web_profiles_insert on web.profiles for insert to authenticated with check (id = auth.uid());
create policy web_profiles_update on web.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy web_profiles_delete on web.profiles for delete to authenticated using (id = auth.uid());

-- Privilegierte Spalten kann ein Nutzer NICHT selbst setzen (kein Self-Verify/
-- Self-Unban, kein Fälschen von report_count). service_role (Admin) darf alles.
create or replace function web.protect_profile_privileged() returns trigger
language plpgsql security definer set search_path = web as $$
declare jrole text;
begin
  jrole := coalesce(current_setting('request.jwt.claims', true)::jsonb->>'role', '');
  if jrole = 'service_role' then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.is_verified  := false;
    new.is_banned    := false;
    new.is_seed      := false;
    new.banned_at    := null;
    new.report_count := 0;
  else
    new.is_verified  := old.is_verified;
    new.is_banned    := old.is_banned;
    new.is_seed      := old.is_seed;
    new.banned_at    := old.banned_at;
    new.report_count := old.report_count;
  end if;
  return new;
end $$;
drop trigger if exists trg_protect_profile on web.profiles;
create trigger trg_protect_profile before insert or update on web.profiles
  for each row execute function web.protect_profile_privileged();

-- ── MESSAGES ────────────────────────────────────────────────────────────────
-- Private Chats: nur die beiden Teilnehmer des Matches dürfen sehen/schreiben.
create or replace function web.is_my_match(m uuid)
returns boolean language sql security definer set search_path = web stable as $$
  select exists(
    select 1 from web.matches
    where id = m and (user1_id = auth.uid() or user2_id = auth.uid())
  );
$$;
grant execute on function web.is_my_match(uuid) to authenticated;

drop policy if exists web_authenticated_all on web.messages;
drop policy if exists web_messages_select on web.messages;
drop policy if exists web_messages_insert on web.messages;
drop policy if exists web_messages_update on web.messages;
drop policy if exists web_messages_delete on web.messages;
create policy web_messages_select on web.messages for select to authenticated using (web.is_my_match(match_id));
create policy web_messages_insert on web.messages for insert to authenticated with check (sender_id = auth.uid() and web.is_my_match(match_id));
create policy web_messages_update on web.messages for update to authenticated using (web.is_my_match(match_id));
create policy web_messages_delete on web.messages for delete to authenticated using (sender_id = auth.uid());

notify pgrst, 'reload schema';
