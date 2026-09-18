-- Seed-Profil Lara: Padel, Frau, 28, 165 cm, Zürich.
-- Fotos: Pexels aksioart 39360752 / 39360758 / 39360750 → /seed/pa5.jpg, pa5b.jpg, pa5c.jpg
-- Kein Auth-User. is_seed=true. Idempotent über feste UUID.
-- JWT service_role, sonst setzt trg_protect_profile is_seed auf false.

do $$
begin
  perform set_config('request.jwt.claims', '{"role":"service_role"}', true);
  insert into web.profiles (
    id, display_name, first_name, age, gender, height_cm, city, country, country_name,
    sports, skill_level, goals, bio, profile_image, additional_images,
    is_seed, is_paused, is_banned, mode, last_active
  ) values (
    '2c9f4a18-6e7b-4d21-a8c3-91f05e4b7d62',
    'Lara', 'Lara', 28, 'female', 165, 'Zürich', 'CH', 'Schweiz',
    array['padel']::text[], 'intermediate',
    array['fun','regular','social']::text[],
    'Padel nach der Arbeit, am liebsten Doppel. Suche regelmaessige Mitspielerinnen und Mitspieler in Zuerich.',
    'https://matchup-app.com/seed/pa5.jpg',
    array['https://matchup-app.com/seed/pa5b.jpg', 'https://matchup-app.com/seed/pa5c.jpg']::text[],
    true, false, false, 'play', now()
  )
  on conflict (id) do update set
    age = excluded.age,
    gender = excluded.gender,
    height_cm = excluded.height_cm,
    sports = excluded.sports,
    profile_image = excluded.profile_image,
    additional_images = excluded.additional_images,
    is_seed = true,
    last_active = now();
end $$;

update web.profiles_private
set latitude = 47.3769, longitude = 8.5417
where user_id = '2c9f4a18-6e7b-4d21-a8c3-91f05e4b7d62';
