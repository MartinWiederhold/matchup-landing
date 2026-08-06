-- ============================================================================
--  Matchup Web — Schläger-Katalog aus extreme-tennis.fr mit feldgenauer Herkunft
--  Schema: web
-- ----------------------------------------------------------------------------
--  Legt ZWEI neue Tabellen an, unabhängig vom bestehenden Beratungs-Seed
--  (src/data/seed/rackets.ts, 11 Einträge) — der wird hier NICHT angefasst,
--  umbenannt oder migriert:
--    A) web.rackets        — aufgelöster Schläger-Stamm, 1 Zeile je Produkt
--    B) web.racket_claims  — Einzelbehauptungen je Feld + Quelle (Provenance)
--  Widersprüchliche Quellenangaben bleiben als getrennte Claims erhalten, nie
--  stillschweigend überschrieben. Löschen = Soft-Delete via valid_to.
--  Stilvorlage: web_tour_tournaments.sql / web_tour_cost_rates.sql.
--  Rollback siehe Kommentarblock am Dateiende.
-- ----------------------------------------------------------------------------
--  ACHSEN-BEFUND (wichtig, nicht verwechseln):
--  Die SIEBEN Shop-Testwerte hier (puissance, controle, confort, prise_deffet,
--  tolerance, maniabilite, stabilite) sind eine ANDERE Taxonomie als die sieben
--  Achsen in src/domain/equipment/racket.ts (power, control, spin, comfort,
--  stability, maneuverability, forgiveness), auf denen scoreV1 rechnet.
--  Es gibt KEINE 1:1-Zuordnung (z. B. „forgiveness" ≠ „tolérance"; „inertie",
--  „twistweight", „recoil_weight", „plow_through" fehlen im Finder-Modell ganz).
--  Dieser Katalog liefert deshalb ZUNÄCHST NUR ANZEIGEDATEN, KEINE Finder-
--  Eingaben. Eine Brücke (Shop-Werte → Finder-Achsen) wäre ein eigener,
--  SPÄTERER Schritt (Mapping-Schicht) — bewusst nicht Teil dieser Migration.
-- ============================================================================

-- 0) Extensions -------------------------------------------------------------
--    gen_random_uuid() ist ab PG13 eingebaut bzw. via pgcrypto (aktiv) vorhanden.

-- 1) Tabelle A: aufgelöster Schläger-Stamm ----------------------------------
create table if not exists web.rackets (
  id                uuid primary key default gen_random_uuid(),

  -- IDENTITÄT ----------------------------------------------------------------
  -- NATÜRLICHER SCHLÜSSEL / Idempotenz-Anker: die PrestaShop-Produkt-ID
  -- (id_product, z. B. 24005). STABIL, weil:
  --   * interner Primärschlüssel des Shops — ändert sich NICHT bei Preis-,
  --     Bestands- oder Namensänderungen,
  --   * steckt fest in der kanonischen URL (/fr/raquette-de-tennis/{id}-…),
  --   * überlebt die 301-Weiterleitung auf die markenspezifischen Pfade.
  -- Deshalb der zulässige Dedup-Anker: ein zweiter Importlauf trifft dieselbe
  -- Zeile und dupliziert nicht.
  -- Sollte SPÄTER eine zweite Quelle (anderer Shop) dazukommen, wäre die ID
  -- nicht mehr global eindeutig → dann den Unique-Key auf (source, shop_product_id)
  -- erweitern. Solange nur EINE Quelle: die ID allein genügt.
  shop_product_id   integer not null,
  name              text,            -- Produktname (nullable, defensiv)
  brand             text,            -- Marke (Head, Wilson, Yonex …)
  sku               text,            -- SKU/MPN aus JSON-LD (nullable)

  -- SIEBEN TESTWERTE (Skala 0–100, aus xcompareHookData.currentProduct.features)
  -- Nullable: NULL = im Shop nicht gepflegt (nicht 0).
  -- ANDERE Taxonomie als die Finder-Achsen — siehe Achsen-Befund im Kopf.
  puissance         integer check (puissance    is null or puissance    between 0 and 100), -- Power
  controle          integer check (controle     is null or controle     between 0 and 100), -- Kontrolle
  confort           integer check (confort      is null or confort      between 0 and 100), -- Komfort
  prise_deffet      integer check (prise_deffet is null or prise_deffet between 0 and 100), -- Spin (Prise d'effet)
  tolerance         integer check (tolerance    is null or tolerance    between 0 and 100), -- Toleranz
  maniabilite       integer check (maniabilite  is null or maniabilite  between 0 and 100), -- Handling
  stabilite         integer check (stabilite    is null or stabilite    between 0 and 100), -- Stabilität

  -- GESAMTSCORE (aus currentProduct.score, z. B. 69.7). Nullable.
  score             numeric check (score is null or score between 0 and 100),

  -- PREIS: ganzzahlige Minor Units (Cent) — exakt wie web_tour_cost_rates.sql.
  -- 233,90 € (fr-Format, Komma) → 23390. NULL = kein Preis bekannt.
  price_minor       integer check (price_minor is null or price_minor >= 0),
  price_currency    char(3) check (price_currency is null or price_currency ~ '^[A-Z]{3}$'),
  -- Integrität: Betrag ohne Währung ist bedeutungslos (Money = amount + currency).
  constraint rackets_currency_needed check (
    price_currency is not null or price_minor is null
  ),

  -- TECHNIK (aus der data-sheet-Liste). ALLE NULLABLE — Datenblatt ist lückenhaft
  -- gepflegt (bei manchen Schlägern fehlen z. B. Gewicht/Balance). NULL bedeutet
  -- durchgängig „nicht gepflegt", nicht „null".
  weight_g          integer check (weight_g is null or weight_g > 0),   -- Gewicht unbesaitet, Gramm
  balance_cm        numeric,        -- Balance, cm (Quelleneinheit, z. B. 32)
  head_size_sqcm    integer check (head_size_sqcm is null or head_size_sqcm > 0), -- Kopfgröße, cm² (Tamis)
  string_pattern    text,           -- Besaitungsbild (Plan de cordage, z. B. "16x19")
  stiffness_ra      integer check (stiffness_ra is null or stiffness_ra >= 0),   -- Steifigkeit, RA (Rigidité)
  inertia           numeric,        -- Inertie (Swingweight)
  profile           text,           -- Profil, z. B. "23/26/21 mm" (Mehrwert → Text)
  twistweight       numeric,        -- Twistweight
  length_cm         numeric,        -- Länge, cm (Longueur, z. B. 70 / 68,5)
  recoil_weight     numeric,        -- Recoil Weight
  plow_through      numeric,        -- Plow-Through

  -- HERKUNFT/ZEITSTEMPEL -----------------------------------------------------
  product_url       text,           -- kanonische Produktseiten-Adresse

  -- Soft-Delete / Gültigkeit (Produkt ausgelistet → valid_to setzen, nie hart löschen).
  valid_from        timestamptz not null default now(),
  valid_to          timestamptz,
  check (valid_to is null or valid_to >= valid_from),

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  -- Idempotenz-Anker: ein Shop-Produkt existiert genau einmal.
  constraint rackets_shop_product_id_uniq unique (shop_product_id)
);

comment on table web.rackets is
  'Schläger-Katalog aus extreme-tennis.fr. Idempotenz über shop_product_id (PrestaShop id_product). Technikfelder nullable = nicht gepflegt. Soft-Delete via valid_to. Getrennt vom Beratungs-Seed src/data/seed/rackets.ts; die 7 Testwerte sind eine ANDERE Taxonomie als die Finder-Achsen (nur Anzeigedaten).';
comment on column web.rackets.shop_product_id is 'PrestaShop id_product — stabiler natürlicher Schlüssel/Dedup-Anker.';
comment on column web.rackets.prise_deffet is 'Testwert „Prise d''effet" (Spin), 0–100. NULL = nicht gepflegt.';
comment on column web.rackets.price_minor is 'Preis in Minor Units (Cent), z. B. 23390 = 233,90 €. NULL = unbekannt.';
comment on column web.rackets.balance_cm is 'Balance in cm (Quelleneinheit). NULL = nicht gepflegt.';

-- 2) Tabelle B: Einzelbehauptungen je Feld und Quelle -----------------------
create table if not exists web.racket_claims (
  id             uuid primary key default gen_random_uuid(),

  racket_id      uuid not null references web.rackets(id) on delete cascade,

  -- Feldname des Stamms (freier Text → neue Felder ohne Schemaänderung).
  field_name     text not null,
  -- Wert immer als Text (feldübergreifend; Zahl/Bool serialisiert).
  field_value    text not null,

  -- Herkunft: Quellbezeichner + Quell-URL + Erfassungszeitpunkt.
  source         text not null,               -- z. B. 'extreme-tennis:24005'
  source_url     text,                         -- kanonische Produktseite
  observed_at    timestamptz not null default now(),

  -- Vertrauen der Quelle für dieses Feld (0..1). Vgl. wikipedia-import.mjs.
  confidence     numeric not null check (confidence >= 0 and confidence <= 1),

  created_at     timestamptz not null default now(),

  -- Idempotenz: derselbe Wert desselben Feldes aus derselben Quelle nur EINMAL.
  -- Ein ABWEICHENDER Wert derselben Quelle = NEUE Zeile (Widersprüche bleiben erhalten).
  constraint racket_claims_uniq unique (racket_id, field_name, source, field_value)
);

comment on table web.racket_claims is
  'Feldgenaue Herkunft: je Schlägerfeld + Quelle eine Behauptung. Nur service_role lesbar/schreibbar.';

-- 3) Indizes ----------------------------------------------------------------
create index if not exists idx_web_rackets_brand on web.rackets(brand);   -- gefordert
create index if not exists idx_web_rackets_score on web.rackets(score);   -- gefordert
-- Nur aktive Schläger (häufigster Filter):
create index if not exists idx_web_rackets_active
  on web.rackets(brand) where valid_to is null;

create index if not exists idx_web_rc_racket on web.racket_claims(racket_id);
create index if not exists idx_web_rc_field  on web.racket_claims(racket_id, field_name);
create index if not exists idx_web_rc_source on web.racket_claims(source);

-- 4) updated_at automatisch pflegen (Trigger) -------------------------------
--    Eigene Funktion (nicht die des Turnier-Stamms wiederverwenden, sauber getrennt).
--    SECURITY DEFINER mit fixem search_path (Projektkonvention).
create or replace function web.set_updated_at_racket() returns trigger
  language plpgsql security definer set search_path = web as $rk$
begin
  new.updated_at := now();
  return new;
end
$rk$;
drop trigger if exists trg_web_rackets_updated_at on web.rackets;
create trigger trg_web_rackets_updated_at before update on web.rackets
  for each row execute function web.set_updated_at_racket();

-- 5) RLS + Policies ---------------------------------------------------------
alter table web.rackets       enable row level security;
alter table web.racket_claims enable row level security;

-- A) rackets: Produktinfo → für authenticated LESBAR, KEIN anon (restriktiver
--    Default, Katalog noch im Aufbau; Gate liegt ohnehin davor). Nur aktive Zeilen.
--    Zum Launch für anon öffnen = zusätzliche Policy + grant … to anon.
--    Keine Schreib-Policies → Schreiben nur service_role (umgeht RLS).
drop policy if exists web_rackets_auth_read on web.rackets;
create policy web_rackets_auth_read on web.rackets
  for select to authenticated using (valid_to is null);

-- B) racket_claims: interne Pipeline-Daten → NICHT für Endnutzer.
--    Bewusst KEINE Policy (anon/authenticated sehen nichts); nur service_role.

-- 6) Rechte -----------------------------------------------------------------
grant select on web.rackets to authenticated;                    -- anon bekommt nichts
grant select, insert, update, delete on web.rackets        to service_role;
grant select, insert, update, delete on web.racket_claims  to service_role;
revoke all on web.racket_claims from anon, authenticated;         -- Gürtel & Hosenträger

-- 7) PostgREST-Schema-Cache neu laden ---------------------------------------
notify pgrst, 'reload schema';

-- ============================================================================
--  ROLLBACK — hebt die Migration vollständig auf. Reihenfolge: Claims zuerst
--  (FK-Kaskade), dann Stamm; Trigger/Funktion separat. Der Beratungs-Seed
--  (src/data/seed/rackets.ts) ist hiervon nicht berührt.
-- ----------------------------------------------------------------------------
-- drop trigger if exists trg_web_rackets_updated_at on web.rackets;
-- drop function if exists web.set_updated_at_racket();
--
-- drop policy if exists web_rackets_auth_read on web.rackets;
--
-- drop index if exists web.idx_web_rc_source;
-- drop index if exists web.idx_web_rc_field;
-- drop index if exists web.idx_web_rc_racket;
-- drop index if exists web.idx_web_rackets_active;
-- drop index if exists web.idx_web_rackets_score;
-- drop index if exists web.idx_web_rackets_brand;
--
-- drop table if exists web.racket_claims;  -- zuerst (FK auf Stamm)
-- drop table if exists web.rackets;
--
-- notify pgrst, 'reload schema';
-- ============================================================================
