-- ============================================================================
-- Zweig 4: Bestätigte Trainings-Verabredung als belegte Verbindung in may_match
-- ============================================================================
-- Ergänzt web.may_match (zuletzt in web_match_connection.sql / MU-036) um einen
-- vierten Zweig. Bisher: (1) gegenseitiges Like, (3) beidseitige Turnier-Präsenz.
-- Neu: eine ANGENOMMENE Slot-Antwort (web.tour_training_slot_response.status =
-- 'accepted') ist ebenfalls eine belegte, beidseitige Verbindung — der Melder hat
-- diesen Slot angefragt, der Eigentümer hat diesen Melder aktiv angenommen. Zwei
-- gerichtete Willensakte auf dieselbe Person, strenger als die implizite Präsenz.
--
-- Zweck: Nach der Zusage will man absprechen, wo man sich trifft. Bisher nur übers
-- Kontaktfeld, also außerhalb der App. Zweig 4 macht dafür den Tour-Chat auf.
--
-- Die INSERT-Policy web_matches_ins bleibt UNVERÄNDERT — sie ruft may_match ohnehin
-- auf. Nur die Funktion wird per CREATE OR REPLACE neu geschrieben.

create or replace function web.may_match(a uuid, b uuid)
returns boolean
language sql
security definer            -- muss likes/player_presence/slots trotz RLS sehen (wie is_my_match)
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
    )

    -- (4) BESTÄTIGTE Trainings-Verabredung: eine ANGENOMMENE Slot-Antwort verbindet
    --     Slot-Eigentümer (s.user_id) und Melder (r.responder_id). NUR 'accepted' —
    --     ein 'pending' ist einseitig (nur der Melder hat geklickt) und öffnet
    --     NICHTS; sonst könnte jeder jeden Slot-Eigentümer durch bloßes Melden
    --     anschreiben. 'accepted' erfordert zwingend den Willensakt des Eigentümers.
    --     Symmetrisch: gilt egal, wer a und wer b ist.
    or exists (
      select 1
      from web.tour_training_slot_response r
      join web.tour_training_slot s on s.id = r.slot_id
      where r.status = 'accepted'
        and ( (s.user_id = a and r.responder_id = b)
           or (s.user_id = b and r.responder_id = a) )
    );
$$;

grant execute on function web.may_match(uuid, uuid) to authenticated;

-- Bestandsdauer (bewusst, wie bei Zweig 1/3): Ist die Verbindung einmal legitim
-- entstanden, bleibt die Unterhaltung bestehen — auch wenn der Eigentümer die Zusage
-- später zurückzieht, die Antwort auf 'declined' setzt oder den Slot löscht.
-- may_match wird NUR beim Anlegen des Matches geprüft (web_matches_ins, WITH CHECK),
-- nie erneut. Das ist KEIN Versehen: Zweig 4 verhält sich exakt wie Zweig 3
-- (verlässt einer das Turnier, bleibt der Chat). Ein Chat, der verschwindet, wäre
-- schlimmer als einer, der bleibt.

notify pgrst, 'reload schema';

-- Rollback (stellt den Stand aus web_match_connection.sql / MU-036 wieder her —
-- Funktion ohne Zweig 4):
--   create or replace function web.may_match(a uuid, b uuid)
--   returns boolean language sql security definer set search_path = web stable as $$
--     select
--       ( exists (select 1 from web.likes l where l.from_user_id = a and l.to_user_id = b)
--         and exists (select 1 from web.likes l where l.from_user_id = b and l.to_user_id = a) )
--       or exists (
--         select 1 from web.player_presence pa
--         join web.player_presence pb on pb.tournament_id = pa.tournament_id
--         where pa.user_id = a and pb.user_id = b
--           and (pa.looking or pa.looking_room) and (pb.looking or pb.looking_room) );
--   $$;
--   notify pgrst, 'reload schema';
