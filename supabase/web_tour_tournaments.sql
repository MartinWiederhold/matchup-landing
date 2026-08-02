-- ============================================================================
--  Matchup Web — Eigener Turnier-Datenstamm mit feldgenauer Herkunft (Provenance)
--  Schema: web
-- ----------------------------------------------------------------------------
--  Legt ZWEI neue Tabellen an, unabhängig von der bestehenden web.tournaments
--  (die vom ATP-Sync aus src/lib/tournaments.ts befüllt wird und hier NICHT
--   angefasst wird):
--    A) web.tour_tournaments        — aufgelöster Stamm, 1 Zeile je Turnier
--    B) web.tour_tournament_claims  — Einzelbehauptungen je Feld + Quelle
--  Widersprüchliche Quellenangaben werden als getrennte Claims aufbewahrt, nie
--  stillschweigend überschrieben. Löschen = Soft-Delete via valid_to.
--  Rollback siehe Kommentarblock am Dateiende.
-- ============================================================================

-- 0) Extensions -------------------------------------------------------------
--    gen_random_uuid() aus pgcrypto (aktiv) bzw. ab PG13 eingebaut.
--    pg_trgm ist im Projekt NICHT aktiv → der Trigram-Index unten ist bewusst
--    auskommentiert. Aktivierung (create extension) nur nach ausdrücklicher Freigabe.

-- 1) Tabelle A: aufgelöster Turnierstamm ------------------------------------
create table if not exists web.tour_tournaments (
  id                uuid primary key default gen_random_uuid(),

  -- NATÜRLICHER SCHLÜSSEL — Idempotenz beim Mehrfachimport, cluster-sicher.
  -- Stabile, quellenübergreifende Turnier-ID, namespaced:
  --   ITF:        'itf:m-itf-tun-2025-032'   (Code aus der Draws-URL)
  --   Challenger: 'atp:2025-open-nouvelle-caledonie'  (eigene Turnierseite/ATP-ID)
  --
  -- WARUM NICHT (Woche + Ort + Kategorie)?  BELEG aus den echten Wikipedia-Daten:
  -- In Cluster-Orten (Monastir, Antalya, Sharm) laufen mehrere gleichkategorige
  -- Turniere parallel. Monastir 2025 z. B. zwei M15 — 'm-itf-tun-2025-032' und
  -- 'm-itf-tun-2025-040' — die sich NUR über den ITF-Code unterscheiden. Ein
  -- Schlüssel aus Woche/Ort/Kategorie würde solche Turniere fälschlich verschmelzen.
  -- Deshalb: NICHT vereinfachen. source_ref ist der einzige zulässige Dedup-Anker.
  source_ref        text not null,

  -- Bezugspunkt für ALLE Fristen: Montag der Turnierwoche.
  tournament_monday date not null,

  -- Serie: CHECK (nicht ENUM) — leichter erweiterbar, passt zum Bestandsstil.
  series            text not null check (series in ('itf_wtt','challenger')),

  -- Kategorie: KEIN starrer Werte-CHECK (frühere Jahre haben Challenger 80/90/110).
  -- Unbekannte Werte werden ERFASST, nicht abgelehnt; das generierte Flag
  -- category_recognized markiert, ob der Wert zum bekannten Katalog gehört.
  category          text,
  category_recognized boolean generated always as (
    category is not null and category in (
      'M15','M25',
      'Challenger 50','Challenger 75','Challenger 80','Challenger 90',
      'Challenger 100','Challenger 110','Challenger 125','Challenger 175'
    )
  ) stored,

  -- Turniername: bei ITF oft leer → nullable.
  name              text,

  -- Ort + Land (ISO 3166-1 alpha-2) + Koordinaten (alle nullable).
  city              text,
  country           char(2) check (country is null or country ~ '^[A-Z]{2}$'),
  latitude          double precision,
  longitude         double precision,

  -- Belag + Halle/Freiluft (indoor: true=Halle, false=Freiluft, null=unbekannt).
  surface           text check (surface is null or surface in ('clay','hard','grass','carpet')),
  indoor            boolean,

  -- Preisgeld mit Währung (ISO 4217), beide nullable.
  prize_money       numeric check (prize_money is null or prize_money >= 0),
  prize_currency    char(3) check (prize_currency is null or prize_currency ~ '^[A-Z]{3}$'),

  -- Offizielle Website (nullable).
  website           text,

  -- Status im Lebenszyklus — englische Codes (Übersetzung später via i18n).
  status            text not null default 'planned'
                      check (status in ('planned','confirmed','cancelled','moved')),

  -- Soft-Delete / Gültigkeit: valid_to IS NULL = aktiv. Nie hart löschen.
  valid_from        timestamptz not null default now(),
  valid_to          timestamptz,
  check (valid_to is null or valid_to >= valid_from),

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  -- Idempotenz-Anker: ein Turnier existiert genau einmal je stabiler ID.
  constraint tour_tournaments_source_ref_uniq unique (source_ref)
);

comment on table web.tour_tournaments is
  'Aufgelöster Turnier-Datenstamm (ITF/Challenger). Idempotenz über source_ref. Soft-Delete via valid_to.';

-- 2) Tabelle B: Einzelbehauptungen je Feld und Quelle -----------------------
create table if not exists web.tour_tournament_claims (
  id             uuid primary key default gen_random_uuid(),

  tournament_id  uuid not null references web.tour_tournaments(id) on delete cascade,

  -- Feldname des Stamms (freier Text → neue Felder ohne Schemaänderung).
  field_name     text not null,
  -- Wert immer als Text (feldübergreifend; Datum/Zahl/Bool serialisiert).
  field_value    text not null,

  -- Herkunft: Quellbezeichner + Quell-URL + Erfassungszeitpunkt.
  source         text not null,               -- z. B. 'wikipedia_itf_2026_q1'
  source_url     text,
  observed_at    timestamptz not null default now(),

  -- Vertrauen der Quelle für dieses Feld (0..1).
  confidence     numeric not null check (confidence >= 0 and confidence <= 1),

  created_at     timestamptz not null default now(),

  -- Idempotenz: derselbe Wert desselben Feldes aus derselben Quelle nur EINMAL.
  -- Ein ABWEICHENDER Wert derselben Quelle = NEUE Zeile (Widersprüche bleiben erhalten).
  constraint tour_claims_uniq unique (tournament_id, field_name, source, field_value)
);

comment on table web.tour_tournament_claims is
  'Feldgenaue Herkunft: je Turnierfeld + Quelle eine Behauptung. Nur service_role lesbar/schreibbar.';

-- 3) Indizes ----------------------------------------------------------------
create index if not exists idx_web_tt_monday   on web.tour_tournaments(tournament_monday);
create index if not exists idx_web_tt_country  on web.tour_tournaments(country);
create index if not exists idx_web_tt_series   on web.tour_tournaments(series);
-- Nur aktive Turniere (häufigster Filter):
create index if not exists idx_web_tt_active
  on web.tour_tournaments(tournament_monday) where valid_to is null;
-- NICHT-eindeutiger Lookup für Matching/Fuzzy-Kandidaten (bewusst KEIN UNIQUE —
-- nicht cluster-sicher, siehe Monastir-Kommentar an source_ref):
create index if not exists idx_web_tt_natlookup
  on web.tour_tournaments(series, tournament_monday, country, city, category);

create index if not exists idx_web_ttc_tournament on web.tour_tournament_claims(tournament_id);
create index if not exists idx_web_ttc_field      on web.tour_tournament_claims(tournament_id, field_name);
create index if not exists idx_web_ttc_source     on web.tour_tournament_claims(source);

-- Namens-Ähnlichkeit (Fuzzy-Match). ERFORDERT pg_trgm — aktuell NICHT aktiv.
-- Bewusst AUSKOMMENTIERT; erst nach Freigabe:
--   create extension if not exists pg_trgm with schema extensions;
--   create index if not exists idx_web_tt_name_trgm
--     on web.tour_tournaments using gin (name extensions.gin_trgm_ops);

-- 4) updated_at automatisch pflegen (Trigger) -------------------------------
--    SECURITY DEFINER (Konvention). Benanntes Dollar-Quote $tour$ zur Eindeutigkeit.
create or replace function web.set_updated_at_tour() returns trigger
  language plpgsql security definer set search_path = web as $tour$
begin
  new.updated_at := now();
  return new;
end
$tour$;
drop trigger if exists trg_web_tt_updated_at on web.tour_tournaments;
create trigger trg_web_tt_updated_at before update on web.tour_tournaments
  for each row execute function web.set_updated_at_tour();

-- 5) RLS + Policies ---------------------------------------------------------
alter table web.tour_tournaments       enable row level security;
alter table web.tour_tournament_claims enable row level security;

-- A) tour_tournaments: öffentliche Fakten → für authenticated LESBAR, KEIN anon
--    (Datenstamm noch im Aufbau/ungefiltert; restriktiver Default, später öffenbar).
--    Keine Schreib-Policies → Schreiben nur service_role (umgeht RLS).
drop policy if exists web_tt_auth_read on web.tour_tournaments;
create policy web_tt_auth_read on web.tour_tournaments
  for select to authenticated using (true);

-- B) tour_tournament_claims: interne Pipeline-Daten → NICHT für Endnutzer.
--    Bewusst KEINE Policy (anon/authenticated sehen nichts); nur service_role (umgeht RLS).

-- 6) Rechte -----------------------------------------------------------------
grant select on web.tour_tournaments to authenticated;              -- anon bekommt nichts
grant select, insert, update, delete on web.tour_tournaments        to service_role;
grant select, insert, update, delete on web.tour_tournament_claims  to service_role;
revoke all on web.tour_tournament_claims from anon, authenticated;   -- Gürtel & Hosenträger

-- 7) PostgREST-Schema-Cache neu laden ---------------------------------------
notify pgrst, 'reload schema';

-- ============================================================================
--  ROLLBACK — hebt die Migration vollständig auf. Reihenfolge: Claims zuerst
--  (FK-Kaskade), dann Stamm; Trigger/Funktion separat. web.tournaments bleibt.
--  (Bei Bedarf den folgenden Block auskommentieren/ausführen.)
-- ----------------------------------------------------------------------------
-- drop trigger if exists trg_web_tt_updated_at on web.tour_tournaments;
-- drop function if exists web.set_updated_at_tour();
--
-- drop policy if exists web_tt_auth_read on web.tour_tournaments;
--
-- drop index if exists web.idx_web_ttc_source;
-- drop index if exists web.idx_web_ttc_field;
-- drop index if exists web.idx_web_ttc_tournament;
-- drop index if exists web.idx_web_tt_natlookup;
-- drop index if exists web.idx_web_tt_active;
-- drop index if exists web.idx_web_tt_series;
-- drop index if exists web.idx_web_tt_country;
-- drop index if exists web.idx_web_tt_monday;
-- -- drop index if exists web.idx_web_tt_name_trgm;  -- nur falls Trigram-Index angelegt wurde
--
-- drop table if exists web.tour_tournament_claims;  -- zuerst (FK auf Stamm)
-- drop table if exists web.tour_tournaments;
--
-- notify pgrst, 'reload schema';
-- ============================================================================
