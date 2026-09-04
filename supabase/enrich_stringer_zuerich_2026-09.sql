-- Stringer-Anreicherung Raum Zürich (verifizierte, publizierte Daten mit Quellen; 09/2026).
-- Bereits auf Prod angewandt (Mgmt-API). Nur Gesichertes; kein publizierter Preis → NULL.
-- Kontakt nur setzen wenn leer (coalesce). source='editorial' schützt vor OSM-Directory-Sync.

update web.service_providers set
  price_from=29.95, currency='CHF', price_unit='stringing',
  phone=coalesce(phone,'0800 022 022'),
  website=coalesce(website,'https://www.ochsnersport.ch/de-ch/bespannungsservice'),
  contact_email=coalesce(contact_email,'service@ochsnersport.ch'),
  source='editorial', updated_at=now()
where category='stringer' and name='Ochsner Sport';

update web.service_providers set
  phone=coalesce(phone,'+41 44 215 21 21'),
  website=coalesce(website,'https://www.ochsport.ch/dienstleistungen/spezialservices/'),
  contact_email=coalesce(contact_email,'info@ochsport.ch'),
  source='editorial', updated_at=now()
where category='stringer' and name='Och Sport';

update web.service_providers set
  website=coalesce(website,'https://www.decathlon.ch/de/lp/c/cordage'), source='editorial', updated_at=now()
where category='stringer' and name in ('Decathlon','Decathlon Zürich');
update web.service_providers set phone=coalesce(phone,'+41 44 741 20 30'), updated_at=now()
where category='stringer' and name='Decathlon Zürich';

update web.service_providers set
  price_from=50, currency='CHF', price_unit='stringing',
  phone=coalesce(phone,'+41 44 830 58 16'),
  bio=coalesce(bio,'Bespannung ab CHF 50 (Arbeit inkl. Material).'),
  source='editorial', updated_at=now()
where category='stringer' and name in ('Tennis Factory','Tennis Factory Wallisellen');

update web.service_providers set
  phone=coalesce(phone,'+41 79 122 91 50'),
  contact_email=coalesce(contact_email,'info@stringyourracket.ch'),
  source='editorial', updated_at=now()
where category='stringer' and name='String Your Racket';

update web.service_providers set
  price_from=25, currency='CHF', price_unit='stringing',
  phone=coalesce(phone,'+41 44 743 77 27'),
  source='editorial', updated_at=now()
where category='stringer' and name='Tennis-Point Store Zürich';

update web.service_providers set
  phone=coalesce(phone,'+41 44 492 35 31'),
  website=coalesce(website,'https://www.intersport.ch/pages/bespannungsservice'),
  contact_email=coalesce(contact_email,'kontakt@voitsport.ch'),
  source='editorial', updated_at=now()
where category='stringer' and name='Intersport';

update web.service_providers set phone=coalesce(phone,'+41 76 696 40 94'), source='editorial', updated_at=now()
where category='stringer' and name='InsideOut Racket-Restringing';
update web.service_providers set phone=coalesce(phone,'+41 78 646 09 20'), source='editorial', updated_at=now()
where category='stringer' and name like 'TenString%';
update web.service_providers set phone=coalesce(phone,'+41 78 899 89 15'), source='editorial', updated_at=now()
where category='stringer' and name='Smash Tennistraining Zürich';

-- Nicht-Stringer entfernt: Radical Sports (Ski/Snowboard), Ochsner Hockey Pro Shop (Hockey)
delete from web.service_providers where category='stringer' and name in ('Radical Sports','Ochsner Hockey Pro Shop Zürich');
