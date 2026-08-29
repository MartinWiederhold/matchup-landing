-- Physiotherapie Region Zürich — aus OpenStreetMap (ODbL), reale Orte mit Koordinaten.
-- Idempotent über NOT EXISTS(name + gerundete Koordinaten). source='directory', Schweiz.
insert into web.service_providers (name, category, city, country, latitude, longitude, sports, source)
select v.name, 'physio', v.city, 'CH', v.lat, v.lng, array['tennis']::text[], 'directory'
from (values
  ('Physiotherapie Kreuzplatz GmbH','Zürich',47.364846,8.553602),
  ('PhysioZüriWest','Zürich',47.389553,8.494941),
  ('Physiotherapie Wiedikon','Zürich',47.368889,8.508778),
  ('Rehab - Physiotherapie','Zürich',47.409563,8.53828),
  ('Physiotherapie Dübendorf','Zürich',47.39657,8.62073),
  ('Therapiezentrum HandinHand','Zürich',47.37776,8.51105),
  ('Physiotherapie Hillenaar & Franconi','Oberengstringen',47.406868,8.463169),
  ('Massage-Praxis & Rückentherapie','Zürich',47.413938,8.558273),
  ('Physio Zentrum','Zürich',47.410053,8.5968),
  ('Physiotherapie Birmensdorf','Birmensdorf ZH',47.354073,8.437519),
  ('Physiotherapie Hilde Berkelmans','Zürich',47.390464,8.540203),
  ('ValeVita','Zürich',47.410979,8.591066)
) as v(name, city, lat, lng)
where not exists (select 1 from web.service_providers s where s.name=v.name and round(s.latitude::numeric,4)=round(v.lat::numeric,4));

notify pgrst, 'reload schema';
