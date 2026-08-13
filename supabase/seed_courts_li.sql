-- Auto-generiert aus OpenStreetMap (Overpass, ODbL) — Tennis/Padel/Pickleball Liechtenstein.
-- Dedupe: Slug + ~50m gegen Bestand, Einzel-Court-Rauschen gefiltert, Geschwister gemerged.
insert into web.venues (slug,name,sports,category,lat,lng,address,city,country,website,phone,verified,status) values
('privatplatz-des-furstenhauses','Privatplatz des Fürstenhauses',array['tennis']::text[],'club',47.1370954,9.5247637,null,'Vaduz','Liechtenstein',null,null,false,'active'),
('tennisclub-balzers','Tennisclub Balzers',array['tennis']::text[],'club',47.0749765,9.4969487,null,'Balzers','Liechtenstein',null,null,false,'active'),
('tennishalle-schaan','Tennishalle Schaan',array['tennis']::text[],'club',47.1740066,9.5130586,'Im alten Riet 100','Schaan','Liechtenstein',null,null,false,'active'),
('tennisclub-dux','Tennisclub Dux',array['tennis']::text[],'club',47.1677234,9.5272274,null,'Schaan','Liechtenstein',null,null,false,'active')
on conflict (slug) do nothing;

notify pgrst, 'reload schema';
