-- ============================================================================
--  Matchup Web — Admin: Profil komplett löschen
--  Privilegierte Funktion, die einen Nutzer samt aller abhängigen Daten in
--  korrekter FK-Reihenfolge entfernt. NUR per service_role aufrufbar (Server).
--  EINMAL im SQL-Editor / via Management-API ausführen.
-- ============================================================================
create or replace function web.admin_delete_user(target uuid)
returns void language plpgsql security definer set search_path = web as $$
begin
  -- Chat-Nachrichten aller Matches des Users (beide Seiten), dann Matches
  delete from web.messages where match_id in (
    select id from web.matches where user1_id = target or user2_id = target
  );
  delete from web.messages where sender_id = target;
  delete from web.matches where user1_id = target or user2_id = target;

  -- Likes / Skips / Blocks
  delete from web.likes where from_user_id = target or to_user_id = target;
  delete from web.skips where user_id = target or skipped_user_id = target;
  delete from web.blocks where blocker_id = target or blocked_id = target;

  -- Spiele (game_events) + Teilnehmer
  delete from web.game_participants where user_id = target;
  delete from web.game_participants where game_event_id in (
    select id from web.game_events where created_by = target
  );
  delete from web.game_events where created_by = target;

  -- Community-Events + Teilnehmer
  delete from web.event_participants where user_id = target;
  delete from web.event_participants where event_id in (
    select id from web.events where created_by = target
  );
  delete from web.events where created_by = target;

  -- Community: Reaktionen auf eigene Posts, eigene Reaktionen, dann Posts
  delete from web.community_likes where post_id in (
    select id from web.community_posts where author_id = target
  );
  delete from web.community_comments where post_id in (
    select id from web.community_posts where author_id = target
  );
  delete from web.community_likes where user_id = target;
  delete from web.community_comments where author_id = target;
  delete from web.community_posts where author_id = target;

  -- Gruppen: Inhalte eigener Gruppen, Mitgliedschaften/Nachrichten, dann Gruppen
  delete from web.group_messages where group_id in (
    select id from web.groups where created_by = target
  );
  delete from web.group_members where group_id in (
    select id from web.groups where created_by = target
  );
  delete from web.group_messages where sender_id = target;
  delete from web.group_members where user_id = target;
  delete from web.groups where created_by = target;

  -- Reports / Warnings
  delete from web.reports where reporter_id = target or reported_user_id = target;
  delete from web.warnings where user_id = target;

  -- Support
  delete from web.support_messages where sender_id = target;
  delete from web.support_messages where ticket_id in (
    select id from web.support_tickets where user_id = target
  );
  delete from web.support_tickets where user_id = target;

  -- Statistiken
  delete from web.player_stats where user_id = target;
  delete from web.achievements where user_id = target;

  -- Profil zuletzt
  delete from web.profiles where id = target;
end $$;

revoke all on function web.admin_delete_user(uuid) from public;
revoke all on function web.admin_delete_user(uuid) from anon;
revoke all on function web.admin_delete_user(uuid) from authenticated;
grant execute on function web.admin_delete_user(uuid) to service_role;

notify pgrst, 'reload schema';
