-- ============================================================================
-- MU-036: matches-Insert erzwingt eine belegte Verbindung (+ Turnier-Präsenz)
-- ============================================================================
-- Bisher ließ web_matches_ins jeden Match zu, sofern der Erzeuger selbst
-- Teilnehmer ist (auth.uid() in (user1_id,user2_id)) — OHNE gegenseitiges Like.
-- Über die API konnte man so jedem eine Unterhaltung aufdrängen (MU-036). Ab hier
-- verlangt der INSERT zusätzlich eine belegte Verbindung: gegenseitiges Like ODER
-- beidseitige Turnier-Präsenz mit Absicht.
--
-- NUR INSERT (WITH CHECK): Bestehende matches-Zeilen werden NIE neu geprüft — kein
-- rückwirkender Effekt. Laufende Unterhaltungen bleiben unangetastet.
--
-- Audit der heutigen Entstehungswege (Code, nicht Konvention): einziger Insert-Pfad
-- ist ensureMatch() (src/lib/matchmaking.ts). Alle vier Aufrufer (LikesTab,
-- BrowsePeople, FullProfile, SelectProfileBrowse) erzeugen NUR bei bereits
-- vorhandenem Gegen-Like → immer gegenseitiges Like. Zweig (1) deckt das zu 100 %.

create or replace function web.may_match(a uuid, b uuid)
returns boolean
language sql
security definer            -- muss likes/player_presence trotz RLS sehen (wie is_my_match)
set search_path = web
stable
as $$
  select
    -- (1) Gegenseitiges Like: beide Richtungen in web.likes vorhanden.
    (
      exists (select 1 from web.likes l where l.from_user_id = a and l.to_user_id = b)
      and
      exists (select 1 from web.likes l where l.from_user_id = b and l.to_user_id = a)
    )

    -- (2) BEWUSST KEIN Spiel-Event-Zweig. game_event_id wird im Code nirgends
    --     geschrieben (0 Zeilen), und alle vier ensureMatch-Aufrufer prüfen ein
    --     Gegen-Like. Eine Regel für eine Funktion, die es nicht gibt, wäre eine
    --     offene Tür ohne Zweck. Kommt die Spiel-Funktion, wird HIER bewusst
    --     entschieden — je nachdem, ob Spiele privat oder öffentlich sind — und
    --     may_match gezielt um einen game_participants-Zweig erweitert.

    -- (3) Turnier-Präsenz mit BEIDSEITIGER Absicht: beide beim selben Turnier
    --     eingetragen, jeder mit looking ODER looking_room. Ein still
    --     Eingetragener (beide false) ist nicht ansprechbar.
    or exists (
      select 1
      from web.player_presence pa
      join web.player_presence pb on pb.tournament_id = pa.tournament_id
      where pa.user_id = a and pb.user_id = b
        and (pa.looking or pa.looking_room)
        and (pb.looking or pb.looking_room)
    );
$$;

grant execute on function web.may_match(uuid, uuid) to authenticated;

-- Policy verengen — NUR INSERT. select/update/delete bleiben unverändert.
drop policy if exists web_matches_ins on web.matches;
create policy web_matches_ins on web.matches for insert to authenticated
  with check (
    auth.uid() in (user1_id, user2_id)
    and web.may_match(user1_id, user2_id)
  );

-- Bestandsdauer (bewusst): Ist die Verbindung einmal legitim entstanden, bleibt die
-- Unterhaltung bestehen — auch wenn einer das Turnier verlässt oder ein Like zurücknimmt.
-- may_match wird NUR beim Anlegen geprüft, nie erneut. Ein Chat, der verschwindet, wäre
-- schlimmer als einer, der bleibt.

notify pgrst, 'reload schema';

-- Rollback:
--   drop policy if exists web_matches_ins on web.matches;
--   create policy web_matches_ins on web.matches for insert to authenticated
--     with check (auth.uid() in (user1_id, user2_id));
--   drop function if exists web.may_match(uuid, uuid);
