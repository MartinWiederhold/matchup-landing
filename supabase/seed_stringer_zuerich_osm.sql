-- Stringer/Besaitung Region Zürich — aus OpenStreetMap (ODbL), reale Orte mit Koordinaten.
-- Idempotent über NOT EXISTS(name + gerundete Koordinaten). source='directory', Schweiz.
insert into web.service_providers (name, category, city, country, latitude, longitude, sports, source)
select v.name, 'stringer', v.city, 'CH', v.lat, v.lng, array['tennis']::text[], 'directory'
from (values
  ('Radical Sports','Zürich',47.335396,8.530208),
  ('Ochsner Sport','Zürich',47.409946,8.54365),
  ('Ochsner Sport','Zürich',47.375932,8.539074),
  ('Decathlon','Zürich',47.373306,8.532935),
  ('Ochsner Sport','Zürich',47.41493,8.62085),
  ('Decathlon','Dietlikon',47.412602,8.620164),
  ('Yonex','Zürich',47.381989,8.49602),
  ('Ochsner Sport','Zürich',47.377749,8.534393),
  ('Ochsner Sport','Zürich',47.375254,8.536249),
  ('Ochsner Sport','Zürich',47.385945,8.499236),
  ('Ochsner Sport','Zürich',47.357621,8.522673),
  ('Ochsner Sport','Wallisellen',47.408043,8.594395),
  ('Decathlon','Zürich',47.386395,8.499459),
  ('Ochsner Sport','Zürich',47.444087,8.464949),
  ('Decathlon','Zürich',47.378229,8.536059),
  ('Intersport','Zürich',47.41882,8.631021),
  ('Smash Sport Tennisartikel','Zürich',47.420639,8.681707),
  ('Ochsner Sport','Zürich',47.382692,8.667366),
  ('Ochsner Sport','Zürich',47.449689,8.562423),
  ('Ochsner Hockey Pro Shop Zürich','Zürich',47.39602,8.480434),
  ('Decathlon','Zürich',47.374688,8.538947),
  ('Tennis Factory','Wallisellen',47.410706,8.591954)
) as v(name, city, lat, lng)
where not exists (select 1 from web.service_providers s where s.name=v.name and round(s.latitude::numeric,4)=round(v.lat::numeric,4));

notify pgrst, 'reload schema';
