-- Zürcher Besaitungs-Shops für die Discover-Kategorie „Stringer" (web.service_providers).
-- Reale Geschäfte (keine Privatpersonen, kein Personenfoto → Bild = Favicon). Koordinaten
-- via Nominatim aus der echten Geschäftsadresse. Idempotent über NOT EXISTS(name, city).
-- Quelle: source='directory' (echte Verzeichnis-Einträge), CHF/Schweiz.

insert into web.service_providers (name, category, city, country, latitude, longitude, sports, website, image_url, source)
select v.name, 'stringer', v.city, 'CH', v.latitude, v.longitude, array['tennis']::text[], v.website, v.image_url, 'directory'
from (values
  -- String Your Racket – Herrengütlistrasse 31, 8304 Wallisellen (Agglomeration Zürich)
  ('String Your Racket', 'Wallisellen', 47.4207941, 8.5837855,
   'https://www.stringyourracket.ch', 'https://icons.duckduckgo.com/ip3/www.stringyourracket.ch.ico'),
  -- Och Sport – Bahnhofstrasse 56, 8001 Zürich (Besaitungs-/Spezialservice)
  ('Och Sport', 'Zürich', 47.3731094, 8.5385473,
   'https://www.ochsport.ch', 'https://icons.duckduckgo.com/ip3/www.ochsport.ch.ico')
) as v(name, city, latitude, longitude, website, image_url)
where not exists (
  select 1 from web.service_providers s where s.name = v.name and s.city = v.city
);

notify pgrst, 'reload schema';
