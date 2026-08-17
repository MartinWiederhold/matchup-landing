-- ============================================================================
--  Matchup Web — Trainingsslots + Antworten (Vor Ort)
--  Schema: web
-- ----------------------------------------------------------------------------
--  Ein Spieler bietet Trainings-Zeitfenster an (Tag der Turnierwoche + Zeitblock). Andere
--  sehen fremde Slots und melden sich; der Eigentümer sagt zu/ab. Bewusst NICHT über den
--  Chat: RLS may_match verlangt beidseitige Präsenz+Absicht — wer sich auf einen Slot meldet,
--  hat die vielleicht nicht. Deshalb eine eigene Antwort-Tabelle mit Status (pending→
--  accepted/declined), unabhängig von may_match.
--
--  „Slots gehören zum Turnier, nicht zur Präsenzzeile": player_presence ist EINE Zeile je
--  Spieler+Turnier — Slots sind MEHRERE → eigene Tabelle. Slot als KONKRETES Datum (Wochentag
--  der Turnierwoche = tournament_monday + Offset) → „vergangen" = slot_date < heute, ganz ohne
--  Status-Feld; die Anzeige blendet Vergangenes aus. (Ein Aufräum-Cron wäre optional, Backlog.)
--
--  Sichtbarkeit: Slots lesen alle Eingeloggten (zum Finden), schreiben nur der Eigentümer.
--  Antworten sieht nur der Anfrager (seine) und der Slot-Eigentümer (die zu seinen Slots).
--
--  Rollback am Dateiende.
-- ============================================================================

-- ── A) Slots ─────────────────────────────────────────────────────────────────
create table if not exists web.tour_training_slot (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references web.profiles(id) on delete cascade,
  tournament_id  uuid not null references web.tour_tournaments(id) on delete cascade,
  slot_date      date not null,   -- konkreter Tag der Turnierwoche (→ „vergangen" = < heute)
  time_block     text not null check (time_block in ('early','morning','noon','afternoon','evening')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint tour_training_slot_uniq unique (user_id, tournament_id, slot_date, time_block)
);

comment on table web.tour_training_slot is
  'Trainings-Zeitfenster je Spieler+Turnier (Datum + Zeitblock). Alle Eingeloggten lesen, Eigentümer schreibt. Vergangen = slot_date < heute (Anzeige-Filter).';

create index if not exists idx_web_tts_tournament on web.tour_training_slot(tournament_id, slot_date);
drop trigger if exists trg_web_tts_updated_at on web.tour_training_slot;
create trigger trg_web_tts_updated_at before update on web.tour_training_slot
  for each row execute function web.set_updated_at_tour();

alter table web.tour_training_slot enable row level security;
drop policy if exists tour_training_slot_all  on web.tour_training_slot;
drop policy if exists tour_training_slot_read on web.tour_training_slot;
create policy tour_training_slot_all  on web.tour_training_slot for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);          -- Eigentümer schreibt
create policy tour_training_slot_read on web.tour_training_slot for select
  using (true);                                                            -- alle Eingeloggten lesen
grant select, insert, update, delete on web.tour_training_slot to authenticated;
revoke all on web.tour_training_slot from anon;

-- Helfer: Bin ich Eigentümer dieses Slots? (Muster is_my_match — SECURITY DEFINER, fixer
-- search_path; für die Antwort-Policies, ohne die Slot-RLS zu umgehen. NACH Tabelle A, da
-- eine language-sql-Funktion die referenzierte Tabelle bei der Erstellung braucht.)
create or replace function web.is_my_training_slot(sid uuid) returns boolean
  language sql security definer set search_path = web, pg_temp stable as $$
    select exists (select 1 from web.tour_training_slot s where s.id = sid and s.user_id = auth.uid());
  $$;

-- ── B) Antworten (sich melden; Status) ───────────────────────────────────────
create table if not exists web.tour_training_slot_response (
  id           uuid primary key default gen_random_uuid(),
  slot_id      uuid not null references web.tour_training_slot(id) on delete cascade,
  responder_id uuid not null references web.profiles(id) on delete cascade,
  status       text not null default 'pending' check (status in ('pending','accepted','declined')),
  contact      text,   -- optionaler Kontakt des Anfragers (Draht nach der Zusage)
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint tour_training_slot_response_uniq unique (slot_id, responder_id)
);

comment on table web.tour_training_slot_response is
  'Antwort auf einen fremden Trainingsslot (pending→accepted/declined). Umgeht may_match bewusst. Anfrager sieht seine, Slot-Eigentümer die zu seinen Slots.';

create index if not exists idx_web_ttsr_slot on web.tour_training_slot_response(slot_id);
drop trigger if exists trg_web_ttsr_updated_at on web.tour_training_slot_response;
create trigger trg_web_ttsr_updated_at before update on web.tour_training_slot_response
  for each row execute function web.set_updated_at_tour();

alter table web.tour_training_slot_response enable row level security;
drop policy if exists ttsr_insert on web.tour_training_slot_response;
drop policy if exists ttsr_select on web.tour_training_slot_response;
drop policy if exists ttsr_update on web.tour_training_slot_response;
drop policy if exists ttsr_delete on web.tour_training_slot_response;
-- Melden: nur als man selbst UND nicht auf den eigenen Slot.
create policy ttsr_insert on web.tour_training_slot_response for insert
  with check (responder_id = auth.uid() and not web.is_my_training_slot(slot_id));
-- Sehen: der Anfrager seine eigenen, der Slot-Eigentümer die zu seinen Slots.
create policy ttsr_select on web.tour_training_slot_response for select
  using (responder_id = auth.uid() or web.is_my_training_slot(slot_id));
-- Zu-/Absagen: nur der Slot-Eigentümer.
create policy ttsr_update on web.tour_training_slot_response for update
  using (web.is_my_training_slot(slot_id)) with check (web.is_my_training_slot(slot_id));
-- Zurückziehen (Anfrager) bzw. entfernen (Eigentümer).
create policy ttsr_delete on web.tour_training_slot_response for delete
  using (responder_id = auth.uid() or web.is_my_training_slot(slot_id));
grant select, insert, update, delete on web.tour_training_slot_response to authenticated;
revoke all on web.tour_training_slot_response from anon;

notify pgrst, 'reload schema';

-- ============================================================================
--  ROLLBACK
-- ----------------------------------------------------------------------------
-- drop policy if exists ttsr_insert on web.tour_training_slot_response;
-- drop policy if exists ttsr_select on web.tour_training_slot_response;
-- drop policy if exists ttsr_update on web.tour_training_slot_response;
-- drop policy if exists ttsr_delete on web.tour_training_slot_response;
-- drop table if exists web.tour_training_slot_response;
-- drop policy if exists tour_training_slot_all  on web.tour_training_slot;
-- drop policy if exists tour_training_slot_read on web.tour_training_slot;
-- drop table if exists web.tour_training_slot;
-- drop function if exists web.is_my_training_slot(uuid);
-- notify pgrst, 'reload schema';
-- ============================================================================
