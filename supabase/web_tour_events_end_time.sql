-- Endzeit für echte „Von–bis"-Zeitblöcke im neuen Wochenkalender (/tour/calendar).
-- Additiv, nullable: bestehende Termine bleiben gültig (null = keine Endzeit → Standarddauer
-- in der UI). RLS + GRANTs der Tabelle greifen unverändert (Spalten erben Tabellen-Grants).
alter table web.tour_events add column if not exists end_time time;

comment on column web.tour_events.end_time is 'Endzeit (Wanduhr ohne Zeitzone, wie event_time). null = keine Endzeit gesetzt.';

notify pgrst, 'reload schema';
