-- Paket 4: „Matchup Team"-Systemkonto für Admin→Nutzer-Nachrichten.
-- Rein additiv, feste UUID, idempotent. is_seed=true → erscheint NICHT im Discover.
-- profiles.id hat keinen FK auf auth.users → kein Auth-User nötig (kann sich nie einloggen).
insert into web.profiles
  (id, display_name, first_name, age, gender, city, country, country_name,
   sports, skill_level, goals, profile_image, username, is_seed, is_paused, is_banned, mode)
values
  ('11111111-1111-4111-8111-111111111111', 'Matchup Team', 'Matchup Team', 30, 'male',
   'Zürich', 'CH', 'Schweiz', array['tennis']::text[], 'intermediate', array[]::text[],
   'https://matchup-app.com/icon-192.png', 'matchup_team', true, false, false, 'play')
on conflict (id) do nothing;
