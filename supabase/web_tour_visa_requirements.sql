-- ============================================================================
--  Matchup Web — Nationalitätsabhängiger Visa-Bestand (Warnung im Saisonplaner)
--  Schema: web
-- ----------------------------------------------------------------------------
--  Neue Tabelle web.tour_visa_requirements. Ordnet je (Nationalität × Zielland)
--  eine NORMIERTE Einreise-Klasse zu — Datengrundlage für zwei Dinge:
--    A) eine nationalitätsabhängige Warnung im Tour-Modus (Anzeige) und
--    B) den Optimierer, der Länder mit Einreisesperre gar nicht erst vorschlägt.
--
--  Steht BEWUSST NEBEN src/lib/visa.ts (dem zielland-basierten Regime-Mapper) —
--  visa.ts wird NICHT angefasst. Ob/wie das alte Modul abgelöst wird, ist eine
--  spätere Entscheidung.
--
--  Muster 1:1 aus web_tour_tournaments.sql: öffentliche Referenzfakten →
--  für `authenticated` LESBAR, Schreiben nur `service_role` (umgeht RLS),
--  `anon` bekommt nichts.
--
--  QUELLE: Wikipedia „Visa requirements for X citizens" (CC BY-SA), maschinell
--  über die MediaWiki-API gelesen (kein HTML-Scraping). KEINE amtliche Auskunft.
--  Deshalb sind Herkunft und Frische strukturell mitgeführt (source_url,
--  source_revised_at, imported_at) und werden in der Anzeige IMMER sichtbar.
--
--  BEWUSST NICHT erfasst: die Freitext-„Notes", „(conditional)"-Zusätze,
--  Gebühren, Wartezeiten. Nur die vier Kernangaben + Datierung. Eine halb
--  verstandene Sonderbedingung ist schlimmer als keine.
--
--  Rollback siehe Kommentarblock am Dateiende.
-- ============================================================================

-- 1) Tabelle ----------------------------------------------------------------
create table if not exists web.tour_visa_requirements (
  id                 uuid primary key default gen_random_uuid(),

  -- Staatsbürgerschaft und Zielland, beide ISO 3166-1 alpha-2 (wie
  -- web.tour_tournaments.country, wie tour_profiles.passports[]).
  nationality        char(2) not null check (nationality ~ '^[A-Z]{2}$'),
  destination        char(2) not null check (destination ~ '^[A-Z]{2}$'),

  -- KLASSE — normiert. 'admission_refused' ist KEINE Visumsart, sondern eine
  -- Einreisesperre und deshalb eine EIGENE Klasse: ein betroffener Spieler
  -- braucht keinen Antragslink, sondern die klare Aussage, dass das Turnier
  -- für ihn nicht infrage kommt — und der Optimierer soll das Land nicht
  -- vorschlagen. Werte-CHECK (kein ENUM), leichter erweiterbar, Bestandsstil.
  requirement_class  text not null check (requirement_class in (
    'visa_free',         -- Freizügigkeit + „visa not required" (data-sort-value 1/2)
    'evisa',             -- eVisa
    'visa_on_arrival',   -- Visa on arrival
    'eta',               -- eTA/ESTA-artige elektronische Reisegenehmigung
    'visa_required',     -- Visum vorab nötig
    'admission_refused'  -- Einreise verweigert / Sperre → eigene Klasse
  )),

  -- Aufenthaltsdauer in Tagen. NULLABLE = „nicht angegeben" (Ehrlichkeitsregel
  -- wie tour_cost_rates): nicht parsebar/leer ⇒ NULL, NICHT 0 und nichts erfunden.
  allowed_stay_days  smallint check (allowed_stay_days is null or allowed_stay_days >= 0),

  -- HERKUNFT + DATIERBARKEIT: Visabestimmungen ändern sich politisch, ein Nutzer
  -- muss sehen können, wie alt die Angabe ist.
  source_url         text not null,                        -- Quelllink (die Wikipedia-Seite)
  source_revised_at  timestamptz,                          -- wann die Seite zuletzt geändert wurde (API-Revisionsstempel)
  imported_at        timestamptz not null default now(),   -- wann wir importiert haben

  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),

  -- Idempotenz: genau EINE Zeile je (Nationalität, Zielland). Re-Import = Upsert.
  constraint tour_visa_req_uniq unique (nationality, destination),
  -- Für das eigene Land stellt sich die Visumsfrage nicht.
  constraint tour_visa_req_not_self check (nationality <> destination)
);

comment on table web.tour_visa_requirements is
  'Nationalitätsabhängiger Visa-Bestand (Nationalität × Zielland → Klasse) aus Wikipedia. Referenz, keine amtliche Auskunft. RLS: authenticated liest, service_role schreibt.';
comment on column web.tour_visa_requirements.requirement_class is
  'Normierte Einreise-Klasse. admission_refused = Einreisesperre (eigene Klasse, kein Visum): Optimierer schlägt das Land nicht vor, Anzeige nennt kein Antrag, sondern „kommt nicht infrage".';
comment on column web.tour_visa_requirements.allowed_stay_days is
  'Erlaubte Aufenthaltsdauer in Tagen. NULL = nicht angegeben (kein Default, nichts erfunden).';
comment on column web.tour_visa_requirements.source_revised_at is
  'Letzter Revisionsstempel der Quellseite. Frische-Anker für die Anzeige „Stand: … zuletzt geändert".';

-- 2) updated_at automatisch pflegen -----------------------------------------
--    Wiederverwendung der bestehenden web.set_updated_at_tour() (aus
--    web_tour_tournaments.sql) — KEINE zweite Trigger-Funktion, eine Wahrheit.
drop trigger if exists trg_web_tvr_updated_at on web.tour_visa_requirements;
create trigger trg_web_tvr_updated_at before update on web.tour_visa_requirements
  for each row execute function web.set_updated_at_tour();

-- 3) Indizes ----------------------------------------------------------------
--    Häufigster Zugriff: „alle Zeilen für DIESE Nationalität" (Warnung + Sperr-Set).
--    Der Unique (nationality, destination) bedient nationality-Prefix-Lookups
--    bereits; ein Punkt-Lookup auf ein Zielland ist selten → nur destination extra.
create index if not exists idx_web_tvr_destination on web.tour_visa_requirements(destination);

-- 4) RLS + Policy -----------------------------------------------------------
alter table web.tour_visa_requirements enable row level security;

--    Öffentliche Referenzfakten → für authenticated LESBAR (die Warnung läuft
--    im eingeloggten Tour-Modus). KEINE Schreib-Policy → Schreiben nur service_role.
drop policy if exists web_tvr_auth_read on web.tour_visa_requirements;
create policy web_tvr_auth_read on web.tour_visa_requirements
  for select to authenticated using (true);

-- 5) Rechte -----------------------------------------------------------------
grant select on web.tour_visa_requirements to authenticated;                 -- anon bekommt nichts
grant select, insert, update, delete on web.tour_visa_requirements to service_role;
revoke all on web.tour_visa_requirements from anon;                          -- Gürtel & Hosenträger

-- 6) PostgREST-Schema-Cache neu laden ---------------------------------------
notify pgrst, 'reload schema';

-- ============================================================================
--  ROLLBACK — hebt die Migration vollständig auf. web.set_updated_at_tour()
--  bleibt unberührt (gehört web_tour_tournaments.sql).
--  (Bei Bedarf den folgenden Block auskommentieren/ausführen.)
-- ----------------------------------------------------------------------------
-- drop policy if exists web_tvr_auth_read on web.tour_visa_requirements;
-- drop trigger if exists trg_web_tvr_updated_at on web.tour_visa_requirements;
-- drop index if exists web.idx_web_tvr_destination;
-- drop table if exists web.tour_visa_requirements;
-- notify pgrst, 'reload schema';
-- ============================================================================
