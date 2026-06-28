-- ============================================================================
--  Matchup Web — Events (öffentliche Community-Events / Turniere / Spieltreffs)
-- ============================================================================
--  EINMAL im Supabase SQL-Editor ausführen (Dashboard → SQL Editor → Run).
--  Legt zwei NEUE Tabellen im isolierten Schema "web" an. Lässt "public"
--  (die echte App) komplett unberührt. Bilder liegen im bestehenden Bucket
--  "web-avatars" (Pfad events/…), daher kein neuer Bucket nötig.
-- ============================================================================

-- 1) Tabellen ---------------------------------------------------------------
create table if not exists web.events (
  id                uuid primary key default gen_random_uuid(),
  created_by        uuid references web.profiles(id) on delete set null,
  creator_name      text,
  sport             text not null check (sport in ('tennis','padel','pickleball')),
  title             text not null,
  short_description text not null,
  description       text,
  image_url         text,
  location          text not null,
  latitude          double precision,
  longitude         double precision,
  event_date        timestamptz,
  max_participants  int not null default 20 check (max_participants > 0),
  status            text not null default 'active',
  created_at        timestamptz default now()
);

create table if not exists web.event_participants (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references web.events(id) on delete cascade,
  user_id     uuid not null references web.profiles(id) on delete cascade,
  created_at  timestamptz default now(),
  unique (event_id, user_id)
);

create index if not exists idx_web_events_date on web.events(event_date);
create index if not exists idx_web_ep_event on web.event_participants(event_id);

-- 2) RLS + Policies ---------------------------------------------------------
alter table web.events enable row level security;
alter table web.event_participants enable row level security;

drop policy if exists web_events_anon_read   on web.events;
drop policy if exists web_events_auth_read    on web.events;
drop policy if exists web_events_auth_insert  on web.events;
drop policy if exists web_events_auth_update  on web.events;
drop policy if exists web_events_auth_delete  on web.events;
create policy web_events_anon_read   on web.events for select to anon          using (true);
create policy web_events_auth_read   on web.events for select to authenticated using (true);
create policy web_events_auth_insert on web.events for insert to authenticated with check (created_by = auth.uid());
create policy web_events_auth_update on web.events for update to authenticated using (created_by = auth.uid());
create policy web_events_auth_delete on web.events for delete to authenticated using (created_by = auth.uid());

drop policy if exists web_ep_anon_read   on web.event_participants;
drop policy if exists web_ep_auth_read    on web.event_participants;
drop policy if exists web_ep_auth_insert  on web.event_participants;
drop policy if exists web_ep_auth_delete  on web.event_participants;
create policy web_ep_anon_read   on web.event_participants for select to anon          using (true);
create policy web_ep_auth_read   on web.event_participants for select to authenticated using (true);
create policy web_ep_auth_insert on web.event_participants for insert to authenticated with check (user_id = auth.uid());
create policy web_ep_auth_delete on web.event_participants for delete to authenticated using (user_id = auth.uid());

-- 3) Rechte -----------------------------------------------------------------
grant select on web.events, web.event_participants to anon;
grant select, insert, update, delete on web.events, web.event_participants to authenticated;

-- 4) Foreign Keys für PostgREST-Embeds --------------------------------------
do $$
begin
  if not exists (select 1 from information_schema.table_constraints
     where constraint_schema='web' and constraint_name='events_created_by_fkey') then
    alter table web.events add constraint events_created_by_fkey
      foreign key (created_by) references web.profiles(id) on delete set null;
  end if;
  if not exists (select 1 from information_schema.table_constraints
     where constraint_schema='web' and constraint_name='event_participants_event_id_fkey') then
    alter table web.event_participants add constraint event_participants_event_id_fkey
      foreign key (event_id) references web.events(id) on delete cascade;
  end if;
  if not exists (select 1 from information_schema.table_constraints
     where constraint_schema='web' and constraint_name='event_participants_user_id_fkey') then
    alter table web.event_participants add constraint event_participants_user_id_fkey
      foreign key (user_id) references web.profiles(id) on delete cascade;
  end if;
end $$;

-- 5) Kapazität hart erzwingen (Trigger) -------------------------------------
--    Verhindert das Beitreten, sobald max_participants erreicht ist —
--    auch bei gleichzeitigen Anfragen.
create or replace function web.enforce_event_capacity() returns trigger
  language plpgsql security definer set search_path=web as $$
declare cap int; cnt int;
begin
  select max_participants into cap from web.events where id = new.event_id;
  select count(*) into cnt from web.event_participants where event_id = new.event_id;
  if cnt >= cap then
    raise exception 'Event ist bereits ausgebucht';
  end if;
  return new;
end $$;
drop trigger if exists trg_web_event_capacity on web.event_participants;
create trigger trg_web_event_capacity before insert on web.event_participants
  for each row execute function web.enforce_event_capacity();

-- 6) Konto-Löschung erweitern -----------------------------------------------
create or replace function web.delete_my_account()
returns void language plpgsql security definer set search_path = web as $$
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
  delete from web.event_participants where user_id = auth.uid();
  delete from web.events where created_by = auth.uid();
  delete from web.reports where reporter_id = auth.uid();
  delete from web.warnings where user_id = auth.uid();
  delete from web.support_messages where sender_id = auth.uid();
  delete from web.support_tickets where user_id = auth.uid();
  delete from web.player_stats where user_id = auth.uid();
  delete from web.achievements where user_id = auth.uid();
  delete from web.profiles where id = auth.uid();
end $$;

-- 7) Beispiel-Events (Seed) — nur einfügen, wenn noch keine existieren ------
insert into web.events
  (creator_name, sport, title, short_description, description, image_url, location, latitude, longitude, event_date, max_participants)
select * from (values
  ('Matchup','padel','Summer Smash — Zürich',
   'Padel-Turnier für alle Level. Mixed-Teams, DJ und Afterparty.',
   'Das grosse Padel-Turnier des Sommers. Gespielt wird in Mixed-Teams über den ganzen Tag, abends gibt es DJ, Drinks und eine Afterparty. Anmeldung als Team oder einzeln — wir matchen dich. Alle Level willkommen.',
   '/events/event-1.jpg','Padel Zone Zürich',47.3769,8.5417,timestamptz '2026-07-12 10:00+02',32),
  ('Matchup','tennis','Matchup Mixednight — Bern',
   'Tennis Mixed-Doubles Abend. Zufällige Paarungen, lockere Atmosphäre.',
   'Ein entspannter Abend für Tennis-Doppel in zufälligen Mixed-Paarungen. Jede Runde neue Partner, am Ende kleines Ranking und Apéro. Ideal um neue Leute kennenzulernen.',
   '/events/event-2.jpg','TC Bern-Neufeld',46.9480,7.4474,timestamptz '2026-07-19 18:00+02',24),
  ('Matchup','pickleball','Pickleball Open — Basel',
   'Das erste Schweizer Pickleball Open. Einsteiger bis Fortgeschrittene.',
   'Das allererste Schweizer Pickleball Open. Gespielt wird in zwei Kategorien (Einsteiger & Fortgeschrittene) im Round-Robin-Format. Leihschläger vor Ort verfügbar.',
   '/events/event-1.jpg','Sportcenter St. Jakob, Basel',47.5417,7.6206,timestamptz '2026-07-26 09:00+02',48),
  ('Matchup','tennis','Community Day — Luzern',
   'Offener Spieltag für die gesamte Matchup-Community. Alle Sportarten.',
   'Ein offener Spieltag für die ganze Community. Tennis, Padel und Pickleball auf allen Plätzen, dazu Grill, Musik und Mini-Turniere für Spontane. Bring Freunde mit.',
   '/events/event-2.jpg','Sportanlage Allmend, Luzern',47.0379,8.3000,timestamptz '2026-08-09 11:00+02',60)
) as v
where not exists (select 1 from web.events);

notify pgrst, 'reload schema';
-- Fertig.
