-- Auto-generiert aus OpenStreetMap (Overpass, ODbL) — Tennis/Padel/Pickleball Schweiz.
-- Dedupe: Slug + ~50m gegen Bestand, Einzel-Court-Rauschen gefiltert, Geschwister gemerged.
insert into web.venues (slug,name,sports,category,lat,lng,address,city,country,website,phone,verified,status) values
('centre-sportif-des-cherpines-2','Centre sportif des Cherpines',array['tennis']::text[],'club',46.1733237,6.1030791,null,'Onex','Schweiz',null,null,false,'active'),
('tennis-squash-center','Tennis & Squash Center',array['tennis']::text[],'club',47.3821551,9.6684537,null,'Diepoldsau','Schweiz',null,null,false,'active'),
('centre-fairplay','Centre FairPlay',array['tennis']::text[],'club',46.4898033,6.7671208,'Route du Verney 9','Puidoux','Schweiz',null,null,false,'active')
on conflict (slug) do nothing;

notify pgrst, 'reload schema';
