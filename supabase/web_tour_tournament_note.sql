-- ============================================================================
--  Matchup Web — Fact-Sheet-Notizen des Spielers je Turnier
--  Schema: web
-- ----------------------------------------------------------------------------
--  Der Spieler trägt ein, was er im offiziellen Fact Sheet liest: Meldegebühr,
--  Trainingsplätze (Ort/Zeiten), Teilnahmebedingungen (Rangbereich/Altersgrenzen),
--  offizielles Hotel. Das sind EIGENE NOTIZEN (Selbstauskunft), KEINE amtlichen oder
--  Bestandsdaten — „Meldegebühr 40 €" aus dem Fact Sheet ist etwas anderes als eine
--  Angabe aus web.tour_tournaments. Die UI kennzeichnet das entsprechend.
--
--  WO: eigene Tabelle, owner-only — wie tour_wildcard_contact.
--   - Die Angaben gehören zum TURNIER (tournament_id), nicht zur Planzeile → sie überleben
--     Saison-Änderungen. tour_tournaments schreibt nur der Dienst, also NICHT dorthin.
--   - Der TURNIERDIREKTOR bleibt GETRENNT in tour_wildcard_contact (Wildcard-Beziehung mit
--     Anfragestand + append-only Verlauf, eigene Seite). Hier bewusst KEIN Direktor-Feld,
--     um Dubletten zu vermeiden; der Übersicht-Reiter zeigt den Direktor read-only von dort.
--
--  BEKANNTE EINSCHRÄNKUNG (wie bei den Wildcards, MU-038): tour_tournaments führt einen
--   Eintrag je AUSGABE/Jahr, es gibt keine jahresübergreifende Turnier-Kennung. Die Notiz
--   hängt damit am Turnier 2026, nicht am Turnier „überhaupt".
--
--  Rollback am Dateiende.
-- ============================================================================

create table if not exists web.tour_tournament_note (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references web.profiles(id) on delete cascade,
  tournament_id   uuid not null references web.tour_tournaments(id) on delete cascade,
  fee_amount      numeric,   -- Meldegebühr (Hauptwährung, Selbstauskunft) — KEIN Bestandswert
  fee_currency    text,      -- 3-stellig (EUR, USD …)
  training_courts text,      -- Trainingsplätze: Ort + Zeiten (Freitext)
  conditions      text,      -- Teilnahmebedingungen: Rangbereich, Altersgrenzen (Freitext)
  official_hotel  text,      -- offizielles Hotel (Freitext)
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint tour_tournament_note_uniq unique (user_id, tournament_id)
);

comment on table web.tour_tournament_note is
  'Eigene Notizen des Spielers aus dem Fact Sheet je (Nutzer, Turnier): Gebühr/Plätze/Bedingungen/Hotel. KEINE amtlichen/Bestandsdaten. Owner-only. Turnierdirektor liegt getrennt in tour_wildcard_contact.';

drop trigger if exists trg_web_ttn_updated_at on web.tour_tournament_note;
create trigger trg_web_ttn_updated_at before update on web.tour_tournament_note
  for each row execute function web.set_updated_at_tour();

create index if not exists idx_web_ttn_tournament on web.tour_tournament_note(tournament_id);

alter table web.tour_tournament_note enable row level security;
drop policy if exists tour_tournament_note_own on web.tour_tournament_note;
create policy tour_tournament_note_own on web.tour_tournament_note
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update, delete on web.tour_tournament_note to authenticated;
revoke all on web.tour_tournament_note from anon;

notify pgrst, 'reload schema';

-- ============================================================================
--  ROLLBACK
-- ----------------------------------------------------------------------------
-- drop policy if exists tour_tournament_note_own on web.tour_tournament_note;
-- drop trigger if exists trg_web_ttn_updated_at on web.tour_tournament_note;
-- drop index if exists web.idx_web_ttn_tournament;
-- drop table if exists web.tour_tournament_note;
-- notify pgrst, 'reload schema';
-- ============================================================================
