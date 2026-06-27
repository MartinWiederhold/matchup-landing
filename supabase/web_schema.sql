-- ============================================================================
--  Matchup Web — isoliertes Schema "web"
-- ============================================================================
--  Dieses Skript EINMAL im Supabase SQL-Editor ausführen
--  (Dashboard → SQL Editor → New query → einfügen → Run).
--
--  Es lässt die echte App (Schema "public") KOMPLETT unberührt:
--  - legt ein neues Schema "web" an
--  - kopiert die Tabellenstruktur 1:1 aus "public" (LIKE … INCLUDING ALL)
--  - aktiviert RLS + Policies, damit eingeloggte Nutzer arbeiten können
--  - kopiert die Clubs als Referenzdaten
--  - aktiviert Realtime für die Chat-Tabellen
--
--  DANACH im Dashboard noch:
--    Settings → API → "Exposed schemas" → "web" hinzufügen (zu public dazu).
-- ============================================================================

create schema if not exists web;
grant usage on schema web to anon, authenticated, service_role;

-- 1) Tabellenstruktur aus public übernehmen ---------------------------------
do $$
declare
  t text;
  tables text[] := array[
    'profiles','clubs','likes','skips','matches','messages','blocks',
    'groups','group_members','group_messages',
    'community_posts','community_comments','community_likes',
    'game_events','game_participants',
    'reports','warnings','support_tickets','support_messages',
    'player_stats','achievements'
  ];
begin
  foreach t in array tables loop
    if to_regclass('public.' || t) is null then
      raise notice 'public.% existiert nicht – übersprungen', t;
      continue;
    end if;
    execute format(
      'create table if not exists web.%I (like public.%I including all)', t, t
    );
    execute format('alter table web.%I enable row level security', t);
    -- Eingeloggte Nutzer dürfen lesen/schreiben (isoliertes Schema).
    execute format(
      'drop policy if exists web_authenticated_all on web.%I', t
    );
    execute format(
      'create policy web_authenticated_all on web.%I for all to authenticated using (true) with check (true)', t
    );
  end loop;
end $$;

-- 2) Rechte -----------------------------------------------------------------
grant select on all tables in schema web to anon;
grant select, insert, update, delete on all tables in schema web to authenticated;
grant usage, select on all sequences in schema web to authenticated;

-- 3) Clubs als Referenzdaten kopieren ---------------------------------------
insert into web.clubs select * from public.clubs
  on conflict (id) do nothing;
-- Clubs dürfen auch ohne Login gelesen werden:
drop policy if exists web_clubs_anon_read on web.clubs;
create policy web_clubs_anon_read on web.clubs for select to anon using (true);

-- 4) Realtime für Chat-Tabellen aktivieren ----------------------------------
do $$
begin
  begin alter publication supabase_realtime add table web.messages; exception when others then null; end;
  begin alter publication supabase_realtime add table web.group_messages; exception when others then null; end;
  begin alter publication supabase_realtime add table web.support_messages; exception when others then null; end;
end $$;

-- 5) Konto-Löschung (RPC delete_my_account) ---------------------------------
create or replace function web.delete_my_account()
returns void
language plpgsql
security definer
set search_path = web
as $$
begin
  delete from web.likes where from_user_id = auth.uid() or to_user_id = auth.uid();
  delete from web.skips where user_id = auth.uid() or skipped_user_id = auth.uid();
  delete from web.messages where sender_id = auth.uid();
  delete from web.matches where user1_id = auth.uid() or user2_id = auth.uid();
  delete from web.blocks where blocker_id = auth.uid() or blocked_id = auth.uid();
  delete from web.group_members where user_id = auth.uid();
  delete from web.group_messages where sender_id = auth.uid();
  delete from web.community_likes where user_id = auth.uid();
  delete from web.community_comments where author_id = auth.uid();
  delete from web.community_posts where author_id = auth.uid();
  delete from web.game_participants where user_id = auth.uid();
  delete from web.reports where reporter_id = auth.uid();
  delete from web.warnings where user_id = auth.uid();
  delete from web.support_messages where sender_id = auth.uid();
  delete from web.support_tickets where user_id = auth.uid();
  delete from web.player_stats where user_id = auth.uid();
  delete from web.achievements where user_id = auth.uid();
  delete from web.profiles where id = auth.uid();
end $$;

grant execute on function web.delete_my_account() to authenticated;

-- Fertig. Nicht vergessen: "web" unter Settings → API → Exposed schemas ergänzen.
