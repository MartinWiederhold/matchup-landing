-- ============================================================================
--  Matchup Web — Security-Härtung Teil 2 (restliche Tabellen)
--  Ersetzt das blanke web_authenticated_all (using(true)) durch Owner-basierte
--  Policies. Lesen bleibt für Eingeloggte offen (App nutzt Embeds/Feeds),
--  Schreiben nur als man selbst — mit Ausnahmen für legitime Verwaltungs-Flows
--  (Spiel-Ersteller verwaltet Teilnehmer, Gruppen-Ersteller verwaltet Mitglieder).
--  service_role (Admin/Server) umgeht RLS weiterhin.
-- ============================================================================

-- ── Helfer: ist der aktuelle Nutzer Ersteller des Spiels/der Gruppe? ─────────
create or replace function web.is_game_creator(geid uuid)
returns boolean language sql security definer set search_path = web stable as $$
  select exists(select 1 from web.game_events where id = geid and created_by = auth.uid());
$$;
grant execute on function web.is_game_creator(uuid) to authenticated;

create or replace function web.is_group_creator(gid uuid)
returns boolean language sql security definer set search_path = web stable as $$
  select exists(select 1 from web.groups where id = gid and created_by = auth.uid());
$$;
grant execute on function web.is_group_creator(uuid) to authenticated;

-- ── Einfache Owner-Tabellen: Lesen offen, Schreiben nur eigene Zeilen ────────
do $$
declare r record;
begin
  for r in select * from (values
    ('likes','from_user_id'),
    ('skips','user_id'),
    ('blocks','blocker_id'),
    ('community_posts','author_id'),
    ('community_comments','author_id'),
    ('community_likes','user_id'),
    ('groups','created_by'),
    ('group_messages','sender_id'),
    ('game_events','created_by'),
    ('support_tickets','user_id'),
    ('player_stats','user_id'),
    ('achievements','user_id')
  ) as t(tbl, col)
  loop
    execute format('drop policy if exists web_authenticated_all on web.%I', r.tbl);
    execute format('drop policy if exists %I on web.%I', r.tbl||'_sel', r.tbl);
    execute format('drop policy if exists %I on web.%I', r.tbl||'_ins', r.tbl);
    execute format('drop policy if exists %I on web.%I', r.tbl||'_upd', r.tbl);
    execute format('drop policy if exists %I on web.%I', r.tbl||'_del', r.tbl);
    execute format('create policy %I on web.%I for select to authenticated using (true)', r.tbl||'_sel', r.tbl);
    execute format('create policy %I on web.%I for insert to authenticated with check (%I = auth.uid())', r.tbl||'_ins', r.tbl, r.col);
    execute format('create policy %I on web.%I for update to authenticated using (%I = auth.uid()) with check (%I = auth.uid())', r.tbl||'_upd', r.tbl, r.col, r.col);
    execute format('create policy %I on web.%I for delete to authenticated using (%I = auth.uid())', r.tbl||'_del', r.tbl, r.col);
  end loop;
end $$;

-- ── reports: einfügen nur als Melder; Lesen offen; kein Client-Update/Delete ─
drop policy if exists web_authenticated_all on web.reports;
drop policy if exists web_reports_sel on web.reports;
drop policy if exists web_reports_ins on web.reports;
create policy web_reports_sel on web.reports for select to authenticated using (true);
create policy web_reports_ins on web.reports for insert to authenticated with check (reporter_id = auth.uid());

-- ── support_messages: einfügen nur als Absender ─────────────────────────────
drop policy if exists web_authenticated_all on web.support_messages;
drop policy if exists web_support_messages_sel on web.support_messages;
drop policy if exists web_support_messages_ins on web.support_messages;
create policy web_support_messages_sel on web.support_messages for select to authenticated using (true);
create policy web_support_messages_ins on web.support_messages for insert to authenticated with check (sender_id = auth.uid());

-- ── warnings: nur eigene als gelesen markieren (kein Insert/Delete für User) ─
drop policy if exists web_authenticated_all on web.warnings;
drop policy if exists web_warnings_sel on web.warnings;
drop policy if exists web_warnings_upd on web.warnings;
create policy web_warnings_sel on web.warnings for select to authenticated using (user_id = auth.uid());
create policy web_warnings_upd on web.warnings for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── matches: nur die beiden Teilnehmer ──────────────────────────────────────
drop policy if exists web_authenticated_all on web.matches;
drop policy if exists web_matches_sel on web.matches;
drop policy if exists web_matches_ins on web.matches;
drop policy if exists web_matches_upd on web.matches;
drop policy if exists web_matches_del on web.matches;
create policy web_matches_sel on web.matches for select to authenticated using (auth.uid() in (user1_id, user2_id));
create policy web_matches_ins on web.matches for insert to authenticated with check (auth.uid() in (user1_id, user2_id));
create policy web_matches_upd on web.matches for update to authenticated using (auth.uid() in (user1_id, user2_id));
create policy web_matches_del on web.matches for delete to authenticated using (auth.uid() in (user1_id, user2_id));

-- ── group_members: beitreten/verlassen selbst; Ersteller darf verwalten ─────
drop policy if exists web_authenticated_all on web.group_members;
drop policy if exists web_group_members_sel on web.group_members;
drop policy if exists web_group_members_ins on web.group_members;
drop policy if exists web_group_members_upd on web.group_members;
drop policy if exists web_group_members_del on web.group_members;
create policy web_group_members_sel on web.group_members for select to authenticated using (true);
create policy web_group_members_ins on web.group_members for insert to authenticated with check (user_id = auth.uid());
create policy web_group_members_upd on web.group_members for update to authenticated using (user_id = auth.uid() or web.is_group_creator(group_id));
create policy web_group_members_del on web.group_members for delete to authenticated using (user_id = auth.uid() or web.is_group_creator(group_id));

-- ── game_participants: beitreten selbst; Ersteller akzeptiert/verwaltet ──────
drop policy if exists web_authenticated_all on web.game_participants;
drop policy if exists web_game_participants_sel on web.game_participants;
drop policy if exists web_game_participants_ins on web.game_participants;
drop policy if exists web_game_participants_upd on web.game_participants;
drop policy if exists web_game_participants_del on web.game_participants;
create policy web_game_participants_sel on web.game_participants for select to authenticated using (true);
create policy web_game_participants_ins on web.game_participants for insert to authenticated with check (user_id = auth.uid());
create policy web_game_participants_upd on web.game_participants for update to authenticated using (user_id = auth.uid() or web.is_game_creator(game_event_id));
create policy web_game_participants_del on web.game_participants for delete to authenticated using (user_id = auth.uid() or web.is_game_creator(game_event_id));

notify pgrst, 'reload schema';
