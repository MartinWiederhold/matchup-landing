-- ============================================================================
--  Matchup Web — Kostensätze eines Nutzers für den Saison-Kostenrechner
--  Schema: web
-- ----------------------------------------------------------------------------
--  Neue Tabelle web.tour_cost_rates. Liefert die Eingaben für
--  src/domain/tour/costs.ts (CostParams): Anreise, Übernachtung, Verpflegung/Tag,
--  optional Coach-Anteil/Woche — je Nutzer genau EIN Satz Werte.
--
--  EINHEIT: ganzzahlige Minor Units (Cent), exakt wie costs.ts rechnet — keine
--  Umrechnung an der Grenze, keine Fließkommazahlen.
--
--  EHRLICHKEITSREGEL (strukturell, nicht nur in der App): alle Beträge sind
--  NULLABLE. NULL bedeutet „unbekannt" — NICHT „null Euro". Fehlt ein Pflichtsatz,
--  weist costs.ts den Posten als unbekannt aus, statt eine Summe zu erfinden.
--  KEINE DB-Defaults: der Vorschlagswert lebt in der Anwendung und muss dort als
--  Vorschlag erkennbar sein; ein Default hier wäre später nicht von einer echten
--  Nutzereingabe zu unterscheiden.
--
--  tour_profiles wird NICHT angefasst (bewusst eigene Tabelle, siehe Empfehlung).
--  Rollback siehe Kommentarblock am Dateiende.
-- ============================================================================

-- 1) Tabelle ----------------------------------------------------------------
create table if not exists web.tour_cost_rates (
  -- Ein Satz Werte je Nutzer → user_id ist der Primärschlüssel (1:1, wie tour_profiles).
  user_id            uuid primary key references web.profiles(id) on delete cascade,

  -- Beträge in ganzzahligen Minor Units (Cent). Alle NULLABLE = „unbekannt".
  -- CHECK verbietet negative Werte (aber erlaubt NULL und 0).
  arrival_minor        integer check (arrival_minor        is null or arrival_minor        >= 0), -- Anreise zu einem NEUEN Ort
  per_night_minor      integer check (per_night_minor      is null or per_night_minor      >= 0), -- pro Übernachtung
  food_per_day_minor   integer check (food_per_day_minor   is null or food_per_day_minor   >= 0), -- Verpflegung pro Tag
  coach_per_week_minor integer check (coach_per_week_minor is null or coach_per_week_minor >= 0), -- optional: Coach-Anteil pro Woche

  -- Währung, in der diese Sätze gelten (ISO 4217). Nullable, solange nichts gesetzt ist.
  currency           char(3) check (currency is null or currency ~ '^[A-Z]{3}$'),

  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),

  -- Integrität: Ein Betrag ohne Währung ist bedeutungslos (Money = amount + currency).
  -- Sobald IRGENDEIN Betrag gesetzt ist, muss auch die Währung gesetzt sein.
  constraint tour_cost_rates_currency_needed check (
    currency is not null
    or (arrival_minor is null and per_night_minor is null
        and food_per_day_minor is null and coach_per_week_minor is null)
  )
);

comment on table web.tour_cost_rates is
  'Kostensätze je Nutzer (CostParams für src/domain/tour/costs.ts). Minor Units (Cent). NULL = unbekannt, kein Default. RLS: nur eigene Zeile.';
comment on column web.tour_cost_rates.arrival_minor is 'Anreise zu neuem Ort, in Cent. NULL = unbekannt.';
comment on column web.tour_cost_rates.coach_per_week_minor is 'Optionaler Coach-Anteil pro Woche, in Cent. NULL = kein Coach-Posten.';

-- 2) updated_at automatisch pflegen -----------------------------------------
--    Wiederverwendung der bestehenden web.set_updated_at_tour() (aus
--    web_tour_tournaments.sql) — KEINE zweite Trigger-Funktion, eine Wahrheit.
drop trigger if exists trg_web_tcr_updated_at on web.tour_cost_rates;
create trigger trg_web_tcr_updated_at before update on web.tour_cost_rates
  for each row execute function web.set_updated_at_tour();

-- 3) RLS + Policy -----------------------------------------------------------
alter table web.tour_cost_rates enable row level security;

-- Muster 1:1 aus web.tour_season_plan: EINE Policy für ALLE Befehle, USING und
-- WITH CHECK je auth.uid() = user_id. anon hat keine auth.uid() → sieht/ändert nichts.
drop policy if exists tour_cost_rates_own on web.tour_cost_rates;
create policy tour_cost_rates_own on web.tour_cost_rates
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 4) Rechte -----------------------------------------------------------------
grant select, insert, update, delete on web.tour_cost_rates to authenticated;
revoke all on web.tour_cost_rates from anon;   -- anon bekommt nichts

--    Kein zusätzlicher Index: Alle Zugriffe laufen über user_id, das der
--    Primärschlüssel bereits indiziert.

-- 5) PostgREST-Schema-Cache neu laden ---------------------------------------
notify pgrst, 'reload schema';

-- ============================================================================
--  ROLLBACK — hebt die Migration vollständig auf. web.tour_profiles und
--  web.set_updated_at_tour() bleiben unberührt.
--  (Bei Bedarf den folgenden Block auskommentieren/ausführen.)
-- ----------------------------------------------------------------------------
-- drop policy if exists tour_cost_rates_own on web.tour_cost_rates;
-- drop trigger if exists trg_web_tcr_updated_at on web.tour_cost_rates;
-- drop table if exists web.tour_cost_rates;
-- notify pgrst, 'reload schema';
-- ============================================================================
