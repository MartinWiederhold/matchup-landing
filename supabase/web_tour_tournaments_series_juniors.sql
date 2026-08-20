-- MU-043 Schritt 1: series-CHECK um 'itf_juniors' erweitern.
--
-- Grund: Der ITF-Kalender-Import (scripts/itf-import.mjs) kann die World-Tennis-Tour-
-- Junioren (Circuit JT, ~395 Turniere) erst schreiben, wenn 'itf_juniors' als Serie
-- erlaubt ist. Bisher liess tour_tournaments_series_check nur 'itf_wtt' und 'challenger'
-- zu und blockierte damit jeden Junioren-Upsert.
--
-- Die Erweiterung ist ADDITIV (Allowlist wächst) — keine bestehende Zeile wird ungültig,
-- keine Datenmigration nötig. RLS/Policies/Grants der Tabelle bleiben unverändert; 'series'
-- ist nur ein Spaltenwert.

alter table web.tour_tournaments drop constraint tour_tournaments_series_check;
alter table web.tour_tournaments add constraint tour_tournaments_series_check
  check (series = any (array['itf_wtt'::text, 'challenger'::text, 'itf_juniors'::text]));

notify pgrst, 'reload schema';

-- ─────────────────────────────────────────────────────────────────────────────
-- ROLLBACK (zum Kopieren):
-- Achtung: Der engere CHECK schlägt fehl, solange itf_juniors-Zeilen existieren.
-- Vorher ggf. (ENTFERNT importierte Junioren!):
--   delete from web.tour_tournaments where series = 'itf_juniors';
--
-- alter table web.tour_tournaments drop constraint tour_tournaments_series_check;
-- alter table web.tour_tournaments add constraint tour_tournaments_series_check
--   check (series = any (array['itf_wtt'::text, 'challenger'::text]));
-- notify pgrst, 'reload schema';
-- ─────────────────────────────────────────────────────────────────────────────
