-- ============================================================================
--  Matchup Web — Punktehistorie / Rangprognose (zählende Ergebnisse)
--  Schema: web        ·        ENTWURF — NICHT ANWENDEN vor Freigabe.
-- ----------------------------------------------------------------------------
--  Der Spieler trägt seine ZÄHLENDEN Ergebnisse EINMAL ein (Turnier, Kategorie, Runde,
--  Datum). points.ts rechnet daraus den 52-Wochen-Verfall (inkl. ITF-Verzögerung) —
--  points.ts wird NUR GENUTZT, nicht geändert. ~20 Zeilen je Saison, Handarbeit, aber der
--  einzige BELEGBARE Weg: ATP-Daten sind lizenzpflichtig (Datenrecht = größtes Risiko).
--
--  WARUM EIGENE TABELLE (nicht tour_events):
--   tour_events (kind='match') speist /tour/points und /tour/form, aber die BEWERTUNG hängt
--   dort an tour_tournaments: Kategorie UND Turnierwoche (Montag) kommen aus dem Katalog per
--   uuid-Join. Ein Ergebnis aus der VERGANGENHEIT (M15 im März, vor App-Nutzung) hat KEINEN
--   Planeintrag und ist womöglich GAR NICHT im Katalog — es fällt heute als „unassigned"
--   durch und bleibt unbewertet. Die Historie muss Kategorie + Montag + Runde SELBST tragen,
--   unabhängig vom Katalog. tour_events bleibt unberührt (gehört auch /app).
--
--  WARUM FREIES TURNIERFELD:
--   tour_tournaments enthält keine Turniere vor dem Importzeitraum. Deshalb `tournament_name`
--   als FREITEXT — der Spieler benennt das Turnier selbst, ohne Katalog-FK.
--
--  WAS NICHT GESPEICHERT WIRD: kein Rangplatz. Die Umrechnung Punkte→Rang bräuchte die
--   aktuelle Ranglistenverteilung (kennt nur die ATP). Die App zeigt PUNKTE, nicht Ränge —
--   und sagt es in der Oberfläche.
--
--  KATEGORIE/RUNDE als CODES (wie points.ts sie erwartet), nicht als Anzeigetext — die UI
--   bietet Auswahllisten mit Labels an. CHECK-Constraints spiegeln die belegten Werte aus
--   src/domain/tour/points.ts (PointsCategory + PointsRound); Unbekanntes gäbe es damit nicht.
--
--  Rollback am Dateiende.
-- ============================================================================

create table if not exists web.tour_result_history (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references web.profiles(id) on delete cascade,
  tournament_name   text not null,           -- Freitext (Katalog kennt die Vergangenheit nicht)
  category          text not null,           -- Rechner-Code (m15, m25, challenger_125 …)
  round             text not null,           -- Rechner-Code (W, F, SF, QF, R16, R32, Q, Q2)
  tournament_monday date not null,           -- Montag der Turnierwoche: Anker für Jahrgang UND Verfall
  note              text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  -- Werte gespiegelt aus points.ts (nichts anderes ist bewertbar).
  constraint tour_result_history_category_chk check (category in
    ('challenger_175','challenger_125','challenger_100','challenger_75','challenger_50','m25','m25_h','m15','m15_h')),
  constraint tour_result_history_round_chk check (round in
    ('W','F','SF','QF','R16','R32','Q','Q2'))
);

comment on table web.tour_result_history is
  'Zählende Ergebnisse je Spieler (Selbstauskunft) für die Rangprognose. Kategorie/Runde als points.ts-Codes, tournament_monday = Anker für Jahrgang + 52-Wochen-Verfall. Owner-only. Zeigt PUNKTE, keine Ränge.';

create index if not exists idx_web_trh_user on web.tour_result_history(user_id, tournament_monday);

drop trigger if exists trg_web_trh_updated_at on web.tour_result_history;
create trigger trg_web_trh_updated_at before update on web.tour_result_history
  for each row execute function web.set_updated_at_tour();

alter table web.tour_result_history enable row level security;
drop policy if exists tour_result_history_own on web.tour_result_history;
create policy tour_result_history_own on web.tour_result_history
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update, delete on web.tour_result_history to authenticated;
revoke all on web.tour_result_history from anon;

-- PostgREST-Schema-Cache neu laden.
notify pgrst, 'reload schema';

-- ============================================================================
--  ROLLBACK
-- ----------------------------------------------------------------------------
-- drop policy if exists tour_result_history_own on web.tour_result_history;
-- drop index if exists web.idx_web_trh_user;
-- drop table if exists web.tour_result_history;
-- notify pgrst, 'reload schema';
-- ============================================================================
