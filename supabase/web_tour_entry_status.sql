-- ============================================================================
--  Matchup Web — Entry-Status je Turnier (Management-Baustein 1)
--  Schema: web        ·        ENTWURF — NICHT ANWENDEN vor Freigabe.
-- ----------------------------------------------------------------------------
--  Der Spieler hält fest, wo er bei einem Turnier steht: gemeldet · Hauptfeld ·
--  Qualifikation · Alternate (mit Position) · zurückgezogen. Diese Angaben stehen
--  im IPIN-/ATP-PlayerZone-System und sind NICHT abrufbar — die App weiß es nicht,
--  sie MERKT sich, was der Spieler dort sieht, und rechnet damit. Es werden BEWUSST
--  KEINE Cut-off-/Acceptance-Werte modelliert (die kennt niemand außer IPIN).
--
--  Zwei Teile:
--   A) web.tour_season_plan ERWEITERN — Status-Vokabular (additiv), Alternate-
--      Position, Meldegebühr-Flag. Bricht Optimierer/„Füllen" NICHT: die schreiben
--      nur INSERT mit dem unveränderten Default 'planned'.
--   B) NEUE Tabelle web.tour_entry_events — append-only Verlauf der beobachteten
--      Zustände (v. a. der Alternate-Position über die Tage). Erst der Verlauf zeigt
--      „wie schnell bewegt sich die Liste".
--
--  RLS: beide owner-only (auth.uid() = user_id), Policy-Muster 1:1 aus
--  web.tour_season_plan. Rollback am Dateiende.
-- ============================================================================


-- ============================================================================
--  TEIL A — web.tour_season_plan erweitern
-- ============================================================================

-- A1) Status-Vokabular ADDITIV erweitern. Der Bestand bleibt gültig (alle Zeilen =
--     'planned'), der Default bleibt 'planned'. Die Alt-Codes 'confirmed'/'cancelled'
--     bleiben im CHECK (das ältere /tour/season vergibt sie über sein Dropdown) — die
--     neue /tour-Oberfläche schreibt die PRÄZISEN Codes. Ein Entry ist EINE Lebens-
--     zyklus-Achse: planned → entered → main_draw|qualifying|alternate → withdrawn.
alter table web.tour_season_plan drop constraint if exists tour_season_plan_status_check;
alter table web.tour_season_plan add constraint tour_season_plan_status_check
  check (status in (
    'planned',                 -- geplant (Default; Optimierer/„Füllen")
    'entered',                 -- gemeldet (Meldung abgegeben, Liste noch offen)
    'main_draw',               -- Hauptfeld (direkt angenommen)
    'qualifying',              -- Qualifikation (Quali-Feld)
    'alternate',               -- Alternate/Nachrücker — Position in alternate_position
    'withdrawn',               -- zurückgezogen
    'confirmed', 'cancelled'   -- LEGACY (altes /tour/season) — nicht mehr neu vergeben
  ));

-- A2) Alternate-Position — eine ZAHL, kein Status. Gehört als eigene Spalte an die
--     Planzeile (aktueller Wert; der Verlauf liegt in Teil B). Nur sinnvoll, wenn
--     status = 'alternate' → ein Cross-Check erzwingt die Konsistenz.
alter table web.tour_season_plan add column if not exists alternate_position smallint;
alter table web.tour_season_plan drop constraint if exists tour_season_plan_altpos_range;
alter table web.tour_season_plan add constraint tour_season_plan_altpos_range
  check (alternate_position is null or alternate_position between 1 and 999);
alter table web.tour_season_plan drop constraint if exists tour_season_plan_altpos_only_alternate;
alter table web.tour_season_plan add constraint tour_season_plan_altpos_only_alternate
  check (alternate_position is null or status = 'alternate');

-- A3) Meldegebühr bezahlt — schlichtes Flag (unbezahlt = Startplatz verfällt, echter
--     Management-Wert). BEWUSST KEIN „Bestätigung gespeichert"-Flag: als bloßes Ja/Nein
--     wertlos, als Datei-Upload ein eigenes Feature — die Notiz (note) trägt das bei Bedarf.
alter table web.tour_season_plan add column if not exists fee_paid boolean not null default false;

comment on column web.tour_season_plan.status is
  'Entry-Lebenszyklus: planned|entered|main_draw|qualifying|alternate|withdrawn (+ legacy confirmed|cancelled).';
comment on column web.tour_season_plan.alternate_position is
  'Nachrücker-Position (1..999), NUR bei status=alternate. Aktueller Wert; Verlauf in web.tour_entry_events.';
comment on column web.tour_season_plan.fee_paid is
  'Meldegebühr bezahlt (Selbstauskunft des Spielers).';


-- ============================================================================
--  TEIL B — web.tour_entry_events (append-only Verlauf)
-- ----------------------------------------------------------------------------
--  Ein Eintrag = EINE Beobachtung, die der Spieler festhält: „Stand vom TT.MM.: ich
--  war Alternate #7". Aus aufeinanderfolgenden Beobachtungen ergibt sich die
--  Geschwindigkeit der Liste (Plätze/Tag) — das eigentliche Entscheidungssignal.
-- ============================================================================
create table if not exists web.tour_entry_events (
  id                 uuid primary key default gen_random_uuid(),

  -- Eigentümer. Konto gelöscht → eigener Verlauf verschwindet mit (cascade).
  user_id            uuid not null references web.profiles(id) on delete cascade,

  -- Der Saisoneintrag, zu dem die Beobachtung gehört. Eintrag entfernt → Verlauf weg.
  plan_id            uuid not null references web.tour_season_plan(id) on delete cascade,

  -- „Stand vom" — der Tag, an dem der Spieler dies im IPIN sah. Ein Datum genügt
  -- (die Liste bewegt sich tage-, nicht minutenweise). Default: heute, editierbar.
  observed_at        date not null default current_date,

  -- Beobachteter Zustand (gleiches Vokabular wie die Planzeile).
  status             text not null
                       check (status in ('planned','entered','main_draw','qualifying','alternate','withdrawn','confirmed','cancelled')),

  -- Position zum Beobachtungszeitpunkt (nur bei status=alternate).
  alternate_position smallint,

  -- Optionale Bemerkung zur Beobachtung (z. B. „nach 2 Absagen hochgerückt").
  note               text,

  created_at         timestamptz not null default now(),

  constraint tour_entry_events_altpos_range
    check (alternate_position is null or alternate_position between 1 and 999),
  constraint tour_entry_events_altpos_only_alternate
    check (alternate_position is null or status = 'alternate')
);

comment on table web.tour_entry_events is
  'Append-only Verlauf der vom Spieler beobachteten Entry-Zustände je Saisoneintrag (v. a. Alternate-Position über die Zeit). Quelle: Selbstauskunft aus IPIN/PlayerZone — kein Live-Abruf.';

-- Verlauf je Eintrag chronologisch lesen.
create index if not exists idx_web_tee_plan_observed on web.tour_entry_events(plan_id, observed_at);

-- RLS: nur der Eigentümer liest/schreibt. INSERT zusätzlich nur gegen EIGENE
-- Saisoneinträge — die exists-Prüfung läuft gegen web.tour_season_plan, die selbst
-- per RLS auf die eigenen Zeilen begrenzt ist (kein Fremd-plan_id unterschiebbar).
alter table web.tour_entry_events enable row level security;
drop policy if exists tour_entry_events_own on web.tour_entry_events;
create policy tour_entry_events_own on web.tour_entry_events
  for all
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (select 1 from web.tour_season_plan p where p.id = plan_id and p.user_id = auth.uid())
  );

-- Append-only: select/insert/delete, KEIN update (Log bleibt unveränderlich; ein
-- Fehleintrag wird gelöscht und neu erfasst). anon bekommt NICHTS.
grant select, insert, delete on web.tour_entry_events to authenticated;
revoke all on web.tour_entry_events from anon;


-- PostgREST-Schema-Cache neu laden.
notify pgrst, 'reload schema';


-- ============================================================================
--  ROLLBACK — hebt die Migration vollständig auf. web.tour_season_plan-Bestand
--  bleibt unberührt. ACHTUNG: der 4-Werte-CHECK unten schlägt fehl, falls Zeilen
--  bereits einen neuen Status-Code tragen — solche Zeilen VORHER zurückmigrieren
--  (confirmed←main_draw/entered, cancelled←withdrawn). Direkt nach dem Anwenden
--  (alles noch 'planned') ist der Rollback gefahrlos.
-- ----------------------------------------------------------------------------
-- drop policy if exists tour_entry_events_own on web.tour_entry_events;
-- drop index if exists web.idx_web_tee_plan_observed;
-- drop table if exists web.tour_entry_events;
-- alter table web.tour_season_plan drop column if exists fee_paid;
-- alter table web.tour_season_plan drop constraint if exists tour_season_plan_altpos_only_alternate;
-- alter table web.tour_season_plan drop constraint if exists tour_season_plan_altpos_range;
-- alter table web.tour_season_plan drop column if exists alternate_position;
-- alter table web.tour_season_plan drop constraint if exists tour_season_plan_status_check;
-- alter table web.tour_season_plan add constraint tour_season_plan_status_check
--   check (status in ('planned','entered','confirmed','cancelled'));
-- notify pgrst, 'reload schema';
-- ============================================================================
