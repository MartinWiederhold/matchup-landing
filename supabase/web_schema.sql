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

-- 6) Foreign Keys -----------------------------------------------------------
-- LIKE … INCLUDING ALL kopiert KEINE Foreign Keys. PostgREST braucht sie aber
-- für eingebettete Queries (z.B. matches → profiles). Hier nachziehen.
do $$
declare r record;
begin
  for r in select * from (values
    ('profiles','club_id','clubs','id'),
    ('likes','from_user_id','profiles','id'),
    ('likes','to_user_id','profiles','id'),
    ('skips','user_id','profiles','id'),
    ('skips','skipped_user_id','profiles','id'),
    ('matches','user1_id','profiles','id'),
    ('matches','user2_id','profiles','id'),
    ('messages','match_id','matches','id'),
    ('messages','sender_id','profiles','id'),
    ('groups','created_by','profiles','id'),
    ('group_members','group_id','groups','id'),
    ('group_members','user_id','profiles','id'),
    ('group_messages','group_id','groups','id'),
    ('group_messages','sender_id','profiles','id'),
    ('community_posts','author_id','profiles','id'),
    ('community_comments','post_id','community_posts','id'),
    ('community_comments','author_id','profiles','id'),
    ('community_likes','post_id','community_posts','id'),
    ('community_likes','user_id','profiles','id'),
    ('game_events','created_by','profiles','id'),
    ('game_participants','game_event_id','game_events','id'),
    ('game_participants','user_id','profiles','id'),
    ('reports','reporter_id','profiles','id'),
    ('warnings','user_id','profiles','id'),
    ('support_tickets','user_id','profiles','id'),
    ('support_messages','ticket_id','support_tickets','id'),
    ('support_messages','sender_id','profiles','id'),
    ('blocks','blocker_id','profiles','id'),
    ('blocks','blocked_id','profiles','id'),
    ('achievements','user_id','profiles','id'),
    ('player_stats','user_id','profiles','id')
  ) as t(tbl,col,rtbl,rcol)
  loop
    if not exists (select 1 from information_schema.table_constraints
       where constraint_schema='web' and constraint_name = r.tbl||'_'||r.col||'_fkey') then
      begin
        execute format('alter table web.%I add constraint %I foreign key (%I) references web.%I(%I)',
          r.tbl, r.tbl||'_'||r.col||'_fkey', r.col, r.rtbl, r.rcol);
      exception when others then null;
      end;
    end if;
  end loop;
end $$;
notify pgrst, 'reload schema';

-- 7) Trigger für Community-Zähler ------------------------------------------
-- LIKE kopiert keine Trigger. likes_count/comments_count sonst nicht gepflegt.
create or replace function web.bump_post_likes() returns trigger
  language plpgsql security definer set search_path=web as $$
begin
  if tg_op='INSERT' then
    update web.community_posts set likes_count = coalesce(likes_count,0) + 1 where id = new.post_id;
  elsif tg_op='DELETE' then
    update web.community_posts set likes_count = greatest(0, coalesce(likes_count,0) - 1) where id = old.post_id;
  end if;
  return null;
end $$;
drop trigger if exists trg_web_post_likes on web.community_likes;
create trigger trg_web_post_likes after insert or delete on web.community_likes
  for each row execute function web.bump_post_likes();

create or replace function web.bump_post_comments() returns trigger
  language plpgsql security definer set search_path=web as $$
begin
  if tg_op='INSERT' then
    update web.community_posts set comments_count = coalesce(comments_count,0) + 1 where id = new.post_id;
  elsif tg_op='DELETE' then
    update web.community_posts set comments_count = greatest(0, coalesce(comments_count,0) - 1) where id = old.post_id;
  end if;
  return null;
end $$;
drop trigger if exists trg_web_post_comments on web.community_comments;
create trigger trg_web_post_comments after insert or delete on web.community_comments
  for each row execute function web.bump_post_comments();

-- Fertig. Nicht vergessen: "web" unter Settings → API → Exposed schemas ergänzen.
