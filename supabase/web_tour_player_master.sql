-- ============================================================================
--  Matchup Web — Spielerstammdaten (Player Master, AUSGEWÄHLTE Felder)
--  Schema: web        ·        ENTWURF — NICHT ANWENDEN vor Freigabe.
-- ----------------------------------------------------------------------------
--  Der Bericht listet ~30 Felder im „Player Master". Wir speichern BEWUSST NUR die,
--  aus denen die App etwas MACHT (eine Warnung, eine Auskunft) — nicht mehr.
--
--  WAS WIR NICHT SPEICHERN — und warum (der Kern der Entscheidung):
--    Passnummer, Bankverbindung, Steuerkennung, medizinische Angaben, Allergien,
--    Vertragsdaten. Die App rechnet mit KEINEM dieser Werte. Sie könnte sie nur
--    verlieren. „Pass läuft am 3. März ab" ist eine nützliche Erinnerung — die NUMMER
--    dazu ist ein Risiko ohne Gegenwert. Der Bericht warnt selbst davor, so etwas in
--    eine breit zugängliche Tabelle zu legen. Wer die Nummer braucht, hat sie im
--    Portemonnaie; wer die Steuerkennung braucht, hat sie beim Steuerberater.
--    → Diese Felder kommen NICHT, auch nicht „für später".
--    (Ausnahme, die KEINE ist: die Versicherungs-Policennummer ist ausdrücklich
--     gewünscht — sie identifiziert den Vertrag, nicht die Person, und liegt owner-only.)
--
--  AUFTEILUNG NACH EMPFINDLICHKEIT (das eigentliche Architektur-Thema):
--    A) DOKUMENTE & ABLAUF → Spalten auf tour_profiles (owner-only). Dort liegen bereits
--       passports[] (Staatsangehörigkeiten für den Visa-Bestand) und esta_status/
--       esta_expiry — dieselbe owner-only-Empfindlichkeit und dieselbe „Ablauf"-Familie.
--       Pass- und Versicherungs-Ablauf gehören daneben, damit die Warn-Logik EINE Zeile
--       liest. tour_profiles ist bereits owner-only (Policy „tour own write") — KEIN
--       Team-Leserecht, wie profiles_private. Neue Spalten brauchen keine neue Policy.
--    B) TEAM-TEILBARES → EIGENE Tabellen, GETRENNT nach Publikum. Ausrüstung darf ein
--       Besaiter sehen dürfen, der Notfallkontakt eher der Coach. Zwei verschiedene
--       Rollen → zwei Tabellen, damit ein späteres Leserecht je Tabelle sauber und
--       rollenscharf gesetzt werden kann (kein „alles oder nichts"). Läge das in
--       tour_profiles, wäre es owner-only für immer — die Trennung ermöglicht das Teilen.
--
--  WICHTIG: HEUTE sind AUCH die Team-Tabellen (B) owner-only. Ein Team-Leserecht
--    (Besaiter → Ausrüstung, Coach → Notfallkontakt) ist eine EIGENE, bewusste
--    Entscheidung: Die Rolle „stringer"/Besaiter existiert in tour_team noch nicht
--    (heute nur coach/physio/agent/hitting_partner), und der Notfallkontakt sind fremde
--    Personendaten (wie MU-035). Deshalb hier NICHT vorgegriffen — die Struktur macht es
--    nur SPÄTER als Ein-Policy-Änderung möglich. → Backlog.
--
--  SECHS-MONATS-REGEL (Restgültigkeit des Passes) — FAUSTREGEL, nicht belegt:
--    Viele Länder verlangen 6 Monate Restgültigkeit über die Einreise hinaus. Unser
--    Visa-Bestand (tour_visa_requirements) führt requirement_class + allowed_stay_days,
--    aber KEIN Passgültigkeits-Feld je Zielland. Wir können die 6 Monate also NICHT
--    belegen. Die Warnung dazu ist eine FAUSTREGEL und wird in der UI genau so
--    gekennzeichnet („Faustregel — beim Konsulat prüfen"), analog zum Visa-Disclaimer.
--
--  Rollback am Dateiende.
-- ============================================================================


-- ============================================================================
--  A) tour_profiles — Dokument- & Ablauf-Felder (owner-only, bestehende Policy)
-- ----------------------------------------------------------------------------
--  Nur LAND + ABLAUF je Pass (keine Nummer). Versicherung: Anbieter, Policennummer,
--  Ablauf, international ja/nein. Plus die reinen Kennungen (IPIN/World Tennis Number,
--  ATP-ID) — nur die Kennung, KEIN Zugang/Passwort.
-- ============================================================================
alter table web.tour_profiles
  add column if not exists passport_country       text,    -- Pass 1: Ausstellerland (ISO-3166-1 alpha-2)
  add column if not exists passport_expiry         date,    -- Pass 1: Ablaufdatum → Ablaufwarnung + 6-Monats-Faustregel
  add column if not exists passport2_country       text,    -- Pass 2 (Doppelstaatler): Land — relevant für die Einreise (tourVisaRequirements)
  add column if not exists passport2_expiry        date,    -- Pass 2: Ablaufdatum
  add column if not exists insurance_provider      text,    -- Versicherung: Anbieter
  add column if not exists insurance_policy_no     text,    -- Versicherung: Policennummer (identifiziert den Vertrag, owner-only)
  add column if not exists insurance_expiry        date,    -- Versicherung: Ablauf → Ablaufwarnung
  add column if not exists insurance_international  boolean, -- Versicherung: international gültig? (sonst Warnhinweis bei Auslandsreise)
  add column if not exists ipin_id                 text,    -- IPIN / World Tennis Number — nur die Kennung
  add column if not exists atp_id                  text;    -- ATP-ID — nur die Kennung

comment on column web.tour_profiles.passport_country      is 'Pass 1: Ausstellerland (ISO2). Nur Land + Ablauf, KEINE Passnummer.';
comment on column web.tour_profiles.passport_expiry        is 'Pass 1: Ablaufdatum. Quelle der Pass-Ablaufwarnung + 6-Monats-Faustregel.';
comment on column web.tour_profiles.passport2_country      is 'Pass 2 (Doppelstaatler): Ausstellerland (ISO2), für die Einreise relevant.';
comment on column web.tour_profiles.passport2_expiry       is 'Pass 2: Ablaufdatum.';
comment on column web.tour_profiles.insurance_provider     is 'Versicherung: Anbieter.';
comment on column web.tour_profiles.insurance_policy_no    is 'Versicherung: Policennummer (Vertrags-Kennung, owner-only). KEINE Bankdaten.';
comment on column web.tour_profiles.insurance_expiry       is 'Versicherung: Ablaufdatum. Quelle der Versicherungs-Ablaufwarnung.';
comment on column web.tour_profiles.insurance_international is 'Versicherung international gültig? Falsch → Hinweis bei Auslandsreise.';
comment on column web.tour_profiles.ipin_id                is 'IPIN / World Tennis Number — nur die Kennung, kein Zugang.';
comment on column web.tour_profiles.atp_id                 is 'ATP-ID — nur die Kennung, kein Zugang.';

-- KEINE neue Policy nötig: tour_profiles ist bereits owner-only (Policy „tour own write",
-- ALL, auth.uid() = user_id) und trägt für authenticated bereits select/insert/update/delete.


-- ============================================================================
--  B1) web.tour_equipment — Ausrüstung (owner-only; künftig Besaiter-Leserecht)
-- ----------------------------------------------------------------------------
--  Der Besatier vor Ort weiß, was zu tun ist: Schläger, Saite, Spannung längs/quer,
--  Griffgröße. EINE Zeile je Spieler (user_id = PK). HEUTE owner-only — ein späteres
--  Leserecht für die Rolle „stringer" wäre eine EIGENE Policy (Rolle existiert noch nicht).
-- ============================================================================
create table if not exists web.tour_equipment (
  user_id        uuid primary key references web.profiles(id) on delete cascade,
  racket         text,             -- Schlägermodell
  string_model   text,             -- Saite
  tension_main   numeric(4,1),     -- Spannung längs (kg oder lbs — Einheit in der UI)
  tension_cross  numeric(4,1),     -- Spannung quer
  grip_size      text,             -- Griffgröße (z. B. L2, 4 3/8)
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

comment on table web.tour_equipment is
  'Ausrüstung je Spieler (Schläger/Saite/Spannung/Griff). Owner-only; NICHT empfindlich — künftig für die Rolle Besaiter freigebbar (eigene Policy).';

drop trigger if exists trg_web_tour_equipment_updated_at on web.tour_equipment;
create trigger trg_web_tour_equipment_updated_at before update on web.tour_equipment
  for each row execute function web.set_updated_at_tour();

alter table web.tour_equipment enable row level security;
drop policy if exists tour_equipment_own on web.tour_equipment;
create policy tour_equipment_own on web.tour_equipment
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update, delete on web.tour_equipment to authenticated;
revoke all on web.tour_equipment from anon;


-- ============================================================================
--  B2) web.tour_emergency_contact — Notfallkontakt (owner-only; künftig Coach-Leserecht)
-- ----------------------------------------------------------------------------
--  Name, Beziehung, Telefon. EINE Zeile je Spieler. Das sind fremde Personendaten
--  (der Kontakt ist eine dritte Person, vgl. MU-035) → HEUTE owner-only. Ein späteres
--  Leserecht für die Rolle „coach" bliebe eine BEWUSSTE Entscheidung, keine Vorgabe.
-- ============================================================================
create table if not exists web.tour_emergency_contact (
  user_id       uuid primary key references web.profiles(id) on delete cascade,
  contact_name  text,   -- Name des Notfallkontakts
  relationship  text,   -- Beziehung (z. B. Mutter, Partnerin, Trainer)
  phone         text,   -- Telefonnummer
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table web.tour_emergency_contact is
  'Notfallkontakt je Spieler (Name/Beziehung/Telefon). Fremde Personendaten (MU-035) → owner-only; künftig für die Rolle Coach freigebbar (eigene Policy).';

drop trigger if exists trg_web_tour_emergency_updated_at on web.tour_emergency_contact;
create trigger trg_web_tour_emergency_updated_at before update on web.tour_emergency_contact
  for each row execute function web.set_updated_at_tour();

alter table web.tour_emergency_contact enable row level security;
drop policy if exists tour_emergency_contact_own on web.tour_emergency_contact;
create policy tour_emergency_contact_own on web.tour_emergency_contact
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update, delete on web.tour_emergency_contact to authenticated;
revoke all on web.tour_emergency_contact from anon;


-- PostgREST-Schema-Cache neu laden.
notify pgrst, 'reload schema';

-- ============================================================================
--  ROLLBACK — hebt beide Tabellen + die tour_profiles-Spalten auf.
-- ----------------------------------------------------------------------------
-- drop policy if exists tour_emergency_contact_own on web.tour_emergency_contact;
-- drop table if exists web.tour_emergency_contact;
-- drop policy if exists tour_equipment_own on web.tour_equipment;
-- drop table if exists web.tour_equipment;
-- alter table web.tour_profiles
--   drop column if exists passport_country,      drop column if exists passport_expiry,
--   drop column if exists passport2_country,     drop column if exists passport2_expiry,
--   drop column if exists insurance_provider,    drop column if exists insurance_policy_no,
--   drop column if exists insurance_expiry,      drop column if exists insurance_international,
--   drop column if exists ipin_id,               drop column if exists atp_id;
-- notify pgrst, 'reload schema';
-- ============================================================================
