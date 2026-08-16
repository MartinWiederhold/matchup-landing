-- ============================================================================
--  Matchup Web — Wildcard-Verwaltung (Kontakte · Anfragen · Verlauf)
--  Schema: web        ·        ENTWURF — NICHT ANWENDEN vor Freigabe.
-- ----------------------------------------------------------------------------
--  Der Spieler pflegt je Turnier den Turnierdirektor-Kontakt (aus dem IPIN-Fact-Sheet,
--  NICHT im Bestand) und den Verlauf der Beziehungspflege/Anfrage. Selbstauskunft wie
--  beim Entry-Status — die App weiß es nicht, sie merkt es sich.
--
--  WO LIEGEN DIE KONTAKTE — nutzergebunden, NICHT gemeinsam:
--   Kontaktdaten von Turnierdirektoren sind personenbezogene Daten DRITTER. Ein
--   gemeinsamer Bestand wäre ein Verzeichnis fremder Personendaten — dieselbe Grenze
--   wie MU-035. Und tour_tournaments ist ein GETEILTER, nur vom Dienst geschriebener
--   Stamm (der Spieler kann dort nicht schreiben). Deshalb: EIGENE Tabelle, an den
--   NUTZER gebunden (jeder pflegt seine eigenen Notizen). Owner-only.
--
--   „Gehört zum Turnier, nicht zur Planzeile": der Kontakt hängt am TURNIER
--   (tour_tournaments), NICHT an tour_season_plan. Entfernt der Spieler das Turnier aus
--   der Saison, bleibt sein Kontakt erhalten.
--
--   BEKANNTE EINSCHRÄNKUNG (bewusst, keine Nachlässigkeit — dokumentiert, falls jemand
--   später fragt): tour_tournaments führt einen Eintrag je AUSGABE und JAHR (source_ref
--   ist jahresspezifisch, z. B. 'itf:m-itf-tun-2025-032'). Es gibt KEINE jahresübergreifende
--   Turnier-Kennung. Der Kontakt hängt damit am Turnier 2026, NICHT am Turnier „überhaupt":
--   wer dasselbe Turnier zwei Jahre spielt, trägt den Direktor ZWEIMAL ein. Der Direktor ist
--   real oft derselbe — das Schema kann es nur nicht ausdrücken. Behoben würde das über eine
--   stabile Turnier-Serien-Kennung → Backlog MU-038 (P3); nützt auch „hier letztes Jahr gut
--   gespielt" und einer späteren Cut-off-Historie. Bis dahin: je Edition, ggf. ein bewusster
--   „aus dem Vorjahr übernehmen"-Kopierschritt.
--
--  AGENT-LESERECHTE — bewusst NICHT (Empfehlung): Anders als bei den Finanzzahlen sind
--   dies fremde Personendaten. Ein Agent könnte Wildcards verhandeln, aber ein pauschales
--   Leserecht auf Kontaktdaten Dritter ist die höhere Datenschutz-Hürde. Owner-only; ein
--   späteres Teilen mit dem Agenten bliebe eine BEWUSSTE Entscheidung, keine Vorgabe.
--
--  Rollback am Dateiende.
-- ============================================================================


-- ============================================================================
--  A) web.tour_wildcard_contact — je (Nutzer, Turnier) EIN Kontakt + aktueller Anfragestand
-- ============================================================================
create table if not exists web.tour_wildcard_contact (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references web.profiles(id) on delete cascade,
  -- Am TURNIER, nicht an der Planzeile (überlebt Saison-Änderungen). uuid-FK, da /tour-only.
  tournament_id  uuid not null references web.tour_tournaments(id) on delete cascade,

  -- Kontakt (Selbstauskunft aus dem IPIN-Fact-Sheet). Alles optional.
  director_name  text,
  email          text,
  phone          text,
  federation     text,   -- Verband/Ausrichter
  note           text,   -- Beziehungs-Notiz (früherer Kontakt, Verbindung vor Ort …)

  -- Aktueller Anfragestand (Schnellanzeige; der VERLAUF liegt in tour_wildcard_events).
  wildcard_type  text check (wildcard_type in ('main','qualifying')),   -- Haupt- oder Quali-WC; null = offen
  requested_on   date,                                                   -- null = noch nicht angefragt
  outcome        text check (outcome in ('pending','granted','declined')), -- null = keine Anfrage/Antwort

  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  constraint tour_wildcard_contact_uniq unique (user_id, tournament_id)
);

comment on table web.tour_wildcard_contact is
  'Wildcard-Kontakt je (Nutzer, Turnier): Turnierdirektor + aktueller Anfragestand. NUTZERGEBUNDEN (fremde Personendaten, MU-035). Owner-only, KEIN Agent-Read.';

drop trigger if exists trg_web_twc_updated_at on web.tour_wildcard_contact;
create trigger trg_web_twc_updated_at before update on web.tour_wildcard_contact
  for each row execute function web.set_updated_at_tour();

create index if not exists idx_web_twc_tournament on web.tour_wildcard_contact(tournament_id);

alter table web.tour_wildcard_contact enable row level security;
drop policy if exists tour_wildcard_contact_own on web.tour_wildcard_contact;
create policy tour_wildcard_contact_own on web.tour_wildcard_contact
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update, delete on web.tour_wildcard_contact to authenticated;
revoke all on web.tour_wildcard_contact from anon;


-- ============================================================================
--  B) web.tour_wildcard_events — append-only Verlauf der Beziehungspflege/Anfrage
-- ----------------------------------------------------------------------------
--  Erste Kontaktaufnahme · Nachfassen · Anfrage · Antwort · Notiz — eine FOLGE, kein
--  Einzelwert (Muster wie tour_entry_events). Man baut früh Kontakt auf, nicht am Freitag.
-- ============================================================================
create table if not exists web.tour_wildcard_events (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references web.profiles(id) on delete cascade,
  contact_id   uuid not null references web.tour_wildcard_contact(id) on delete cascade,
  occurred_on  date not null default current_date,   -- „am …" (Selbstauskunft, editierbar)
  kind         text not null
                 check (kind in ('contacted','follow_up','request','response','note')),
  --   contacted  = erste Kontaktaufnahme
  --   follow_up  = Nachfassen
  --   request    = Wildcard angefragt
  --   response   = Antwort erhalten
  --   note       = sonstige Notiz
  detail       text,
  created_at   timestamptz not null default now()
);

comment on table web.tour_wildcard_events is
  'Append-only Verlauf zu einem Wildcard-Kontakt (Kontakt/Nachfassen/Anfrage/Antwort). Owner-only, nur INSERT/DELETE (keine Änderung).';

create index if not exists idx_web_twe_contact on web.tour_wildcard_events(contact_id, occurred_on);

-- RLS: nur der Eigentümer. INSERT zusätzlich nur auf EIGENE Kontakte (exists-Prüfung gegen
-- tour_wildcard_contact, die selbst per RLS auf eigene Zeilen begrenzt ist).
alter table web.tour_wildcard_events enable row level security;
drop policy if exists tour_wildcard_events_own on web.tour_wildcard_events;
create policy tour_wildcard_events_own on web.tour_wildcard_events
  for all
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (select 1 from web.tour_wildcard_contact c where c.id = contact_id and c.user_id = auth.uid())
  );

-- Append-only: select/insert/delete, KEIN update (ein Fehleintrag wird gelöscht + neu erfasst).
grant select, insert, delete on web.tour_wildcard_events to authenticated;
revoke all on web.tour_wildcard_events from anon;


-- PostgREST-Schema-Cache neu laden.
notify pgrst, 'reload schema';

-- ============================================================================
--  ROLLBACK — hebt beide Tabellen auf (tour_tournaments/tour_season_plan unberührt).
-- ----------------------------------------------------------------------------
-- drop policy if exists tour_wildcard_events_own on web.tour_wildcard_events;
-- drop index if exists web.idx_web_twe_contact;
-- drop table if exists web.tour_wildcard_events;
-- drop policy if exists tour_wildcard_contact_own on web.tour_wildcard_contact;
-- drop trigger if exists trg_web_twc_updated_at on web.tour_wildcard_contact;
-- drop index if exists web.idx_web_twc_tournament;
-- drop table if exists web.tour_wildcard_contact;
-- notify pgrst, 'reload schema';
-- ============================================================================
