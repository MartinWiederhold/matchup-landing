-- MU-050: series-CHECK um 'wta' erweitern (WTA-Haupttour 125–1000).
--
-- Grund: scripts/wta-import.mjs schreibt die WTA-Haupttour (Serie 'wta'). Bisher ließ
-- tour_tournaments_series_check nur itf_wtt/challenger/itf_juniors zu.
-- Additiv (Allowlist wächst) — keine bestehende Zeile wird ungültig, keine Migration.

alter table web.tour_tournaments drop constraint tour_tournaments_series_check;
alter table web.tour_tournaments add constraint tour_tournaments_series_check
  check (series = any (array['itf_wtt'::text, 'challenger'::text, 'itf_juniors'::text, 'wta'::text]));

notify pgrst, 'reload schema';

-- ROLLBACK (nur ohne wta-Zeilen möglich):
--   delete from web.tour_tournaments where series = 'wta';  -- ACHTUNG: entfernt importierte WTA
--   alter table web.tour_tournaments drop constraint tour_tournaments_series_check;
--   alter table web.tour_tournaments add constraint tour_tournaments_series_check
--     check (series = any (array['itf_wtt'::text, 'challenger'::text, 'itf_juniors'::text]));
--   notify pgrst, 'reload schema';
