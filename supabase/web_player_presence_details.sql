-- ============================================================================
--  Matchup Web — „Vor Ort"-Präsenz: Detailfelder zu den zwei Absichten
--  Schema: web · Tabelle web.player_presence (GETEILT mit /map)
-- ----------------------------------------------------------------------------
--  „Sucht Unterkunft" / „Sucht Trainingspartner" sagten bisher nicht, WAS gesucht wird.
--  Ergänzt werden ausschließlich NULLABLE Spalten — additiv, damit /map unberührt bleibt
--  (dessen Insert setzt sie einfach nicht). Bestehende Spalten `surface` (Belag) und
--  `gender` bleiben und werden weiter genutzt; „welcher Belag" braucht daher keine neue
--  Spalte. RLS/Policies/Grants unverändert (die vorhandenen Policies decken neue Spalten ab).
--
--  Kurzes Formular: die Felder erscheinen in /tour NUR zur angekreuzten Absicht, alles
--  optional. Rollback am Dateiende (Spalten-Drop wäre zweiphasig — erst Code umstellen).
-- ============================================================================

alter table web.player_presence
  add column if not exists room_from     date,     -- Unterkunft: gesucht ab
  add column if not exists room_to       date,     -- Unterkunft: gesucht bis
  add column if not exists room_area     text,     -- Unterkunft: Gegend/Ort in der Turnierstadt
  add column if not exists room_cost     text,     -- Unterkunft: Kostenanteil (Freitext, z. B. „~40 €/Nacht", „50/50")
  add column if not exists room_type     text,     -- Unterkunft: 'room' (Zimmer) | 'apartment' (ganze Wohnung)
  add column if not exists partner_level text,      -- Trainingspartner: Niveau (Selbstauskunft)
  add column if not exists partner_days  text[];    -- Trainingspartner: Wochentage 'mon'..'sun'

-- Nur die neuen Zimmer-Typ-Werte einschränken; NULL bleibt erlaubt (Bestand + „keine Angabe").
alter table web.player_presence
  drop constraint if exists player_presence_room_type_chk;
alter table web.player_presence
  add constraint player_presence_room_type_chk
  check (room_type is null or room_type in ('room', 'apartment'));

comment on column web.player_presence.room_from     is 'Unterkunft: gesucht ab (Selbstauskunft).';
comment on column web.player_presence.room_to       is 'Unterkunft: gesucht bis.';
comment on column web.player_presence.room_area     is 'Unterkunft: Gegend/Ort in der Turnierstadt.';
comment on column web.player_presence.room_cost     is 'Unterkunft: Kostenanteil als Freitext (keine erzwungene Einheit).';
comment on column web.player_presence.room_type     is 'Unterkunft: room = Zimmer, apartment = ganze Wohnung.';
comment on column web.player_presence.partner_level is 'Trainingspartner: Niveau/Selbsteinschätzung.';
comment on column web.player_presence.partner_days  is 'Trainingspartner: Wochentage als Codes mon..sun.';

notify pgrst, 'reload schema';

-- ============================================================================
--  ROLLBACK (Spalten-Drop zweiphasig: erst den Code deployen, der sie nicht liest)
-- ----------------------------------------------------------------------------
-- alter table web.player_presence drop constraint if exists player_presence_room_type_chk;
-- alter table web.player_presence
--   drop column if exists room_from, drop column if exists room_to, drop column if exists room_area,
--   drop column if exists room_cost, drop column if exists room_type,
--   drop column if exists partner_level, drop column if exists partner_days;
-- notify pgrst, 'reload schema';
-- ============================================================================
