-- ============================================================================
-- MU-026 — Team-Lesepolicies rollenbasiert statt nur status='active'
-- ============================================================================
-- Die drei „team read"-Policies prüften nur status='active', KEINE Rolle. Ein als
-- Hitting Partner eingeladenes Mitglied konnte damit Pässe, Steuersitz, ESTA-Status
-- und Saisonbudget des Spielers lesen (tour_profiles) sowie alle Events/Chat.
--
-- Zuschnitt (bestätigt): siehe Tabelle im Chat.
--   • tour_profiles: Team-Leserecht KOMPLETT entfernen. RLS ist zeilen-, nicht
--     spaltenweise — jede Team-Policy gäbe die GANZE Zeile frei (inkl. Pässe/ESTA),
--     egal welche Rolle. Und die Mitglieder-UI (TourPlayerView) liest ohnehin KEIN
--     tour_profiles-Feld. Braucht der Agent später das Budget → eigener enger Kanal.
--   • tour_events (Kalender) + tour_messages (Team-Chat): weiter lesbar, aber an eine
--     ANERKANNTE Rolle gebunden (Muster wie die bestehende tour_expenses-Policy mit
--     role='agent'). Keine Rollen-Differenzierung: alle vier Rollen nutzen Kalender
--     und Chat; der Guard wehrt nur unbekannte/leere Rollen ab.
-- Keine Code-Änderung nötig, keine GRANTs (bestehende Tabellen, nur Policies).

-- 1) tour_profiles: Team-Leserecht entfernen. Eigner behält Zugriff via "tour own write".
drop policy if exists "tour_profiles team read" on web.tour_profiles;

-- 2) tour_events: Team-Lesen nur für anerkannte, aktive Rollen.
drop policy if exists "tour_events team read" on web.tour_events;
create policy "tour_events team read" on web.tour_events
  for select to public
  using (exists (
    select 1 from web.tour_team tt
    where tt.player_id = tour_events.user_id
      and tt.member_user_id = auth.uid()
      and tt.status = 'active'
      and tt.role in ('coach','physio','agent','hitting_partner')));

-- 3) tour_messages: geteilter Team-Chat — Owner oder anerkanntes aktives Mitglied.
drop policy if exists "tour_messages read" on web.tour_messages;
create policy "tour_messages read" on web.tour_messages
  for select to public
  using (auth.uid() = team_owner or exists (
    select 1 from web.tour_team tt
    where tt.player_id = tour_messages.team_owner
      and tt.member_user_id = auth.uid()
      and tt.status = 'active'
      and tt.role in ('coach','physio','agent','hitting_partner')));

drop policy if exists "tour_messages write" on web.tour_messages;
create policy "tour_messages write" on web.tour_messages
  for insert to public
  with check (sender_id = auth.uid() and (auth.uid() = team_owner or exists (
    select 1 from web.tour_team tt
    where tt.player_id = tour_messages.team_owner
      and tt.member_user_id = auth.uid()
      and tt.status = 'active'
      and tt.role in ('coach','physio','agent','hitting_partner'))));

notify pgrst, 'reload schema';

-- ── Rollback ────────────────────────────────────────────────────────────────
-- Originalpolicies (status-only, ohne Rolle) wiederherstellen:
--   create policy "tour_profiles team read" on web.tour_profiles for select to public
--     using (exists (select 1 from web.tour_team tt where tt.player_id=tour_profiles.user_id
--       and tt.member_user_id=auth.uid() and tt.status='active'));
--   … analog tour_events / tour_messages ohne den role-Filter.
