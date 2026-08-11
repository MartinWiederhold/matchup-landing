-- ============================================================================
-- player_presence: zweite Absicht "sucht Mitbewohner" (Zimmer teilen)
-- ============================================================================
-- player_presence ist das bestehende OPT-IN-Präsenzmodell ("Wer ist hier?"):
-- man trägt sich freiwillig ein (RLS: insert own, select für alle Eingeloggten)
-- und wählt selbst, welchen Kontakt man preisgibt. Neben "sucht Partner"
-- (looking) kommt "sucht Mitbewohner" (looking_room) dazu.
--
-- WARUM als Opt-in-Flag und NICHT aus tour_season_plan abgeleitet:
--   Ein Saisonplan ist ein VOLLSTÄNDIGER VORWÄRTS-REISEPLAN. Wer ihn lesen
--   dürfte, wüsste, wo eine Person in acht Wochen schläft — künftiger Standort
--   + Zeitpunkt für jeden Eingeloggten. Das ist ein Stalking-/Sicherheitsrisiko
--   und Wettkampf-Intelligence. Deshalb bleibt tour_season_plan owner-only
--   (RLS: auth.uid() = user_id, ALL). Die Mitbewohner-Suche entsteht aus
--   FREIWILLIGER Eintragung, nicht aus dem privaten Plan.

comment on column web.player_presence.looking is 'Opt-in: sucht Trainingspartner';

alter table web.player_presence add column if not exists looking_room boolean not null default false;

comment on column web.player_presence.looking_room is
  'Opt-in: sucht Mitbewohner (Zimmer teilen). BEWUSST hier und NICHT aus tour_season_plan abgeleitet: ein Saisonplan ist ein vollstaendiger Vorwaerts-Reiseplan — wer ihn lesen duerfte, wuesste, wo eine Person in acht Wochen schlaeft (Stalking-/Sicherheitsrisiko). Mitbewohner-Suche bleibt freiwillig + Opt-in; tour_season_plan bleibt owner-only.';

notify pgrst, 'reload schema';

-- Rollback:
--   alter table web.player_presence drop column looking_room;
