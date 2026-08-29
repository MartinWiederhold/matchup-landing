-- Padel-Plätze Region Zürich — aus OpenStreetMap (ODbL). Benannte Center + reale
-- (in OSM unbenannte) Padel-Plätze, nach Ort benannt. Idempotent über slug.
insert into web.venues (slug, name, sports, category, lat, lng, city, country, status, verified)
values
  ('pdl-padel-center-zurich','PDL Padel Center',array['padel']::text[],'club',47.401835,8.446298,'Zürich','CH','active',false),
  ('padel-zurich-zurich','Padel Zürich',array['padel']::text[],'public',47.413725,8.439367,'Zürich','CH','active',false),
  ('padel-zurich-zurich-2','Padel Zürich',array['padel']::text[],'public',47.413692,8.439598,'Zürich','CH','active',false),
  ('padel-zurich-zurich-3','Padel Zürich',array['padel']::text[],'public',47.413856,8.43962,'Zürich','CH','active',false),
  ('padel-zurich-zurich-4','Padel Zürich',array['padel']::text[],'public',47.292833,8.541862,'Zürich','CH','active',false),
  ('padel-zurich-zurich-5','Padel Zürich',array['padel']::text[],'public',47.292787,8.541638,'Zürich','CH','active',false),
  ('padel-zurich-zurich-6','Padel Zürich',array['padel']::text[],'public',47.40024,8.457937,'Zürich','CH','active',false),
  ('padel-zurich-zurich-7','Padel Zürich',array['padel']::text[],'public',47.400188,8.45816,'Zürich','CH','active',false),
  ('padel-zurich-zurich-8','Padel Zürich',array['padel']::text[],'public',47.368343,8.572056,'Zürich','CH','active',false)
on conflict (slug) do nothing;

notify pgrst, 'reload schema';
