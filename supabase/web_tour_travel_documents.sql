-- supabase/web_tour_travel_documents.sql
-- Eigene Reisedokumente des Spielers: ESTA/eTA/Schengen-Visum/nat. Visum/sonstiges.
-- Owner-only wie web.tour_equipment. KEINE Dokumentnummer — dieselbe Regel wie beim Pass.
-- Zuordnung zum Turnier über den Geltungsbereich (Land ODER Schengen-Raum), nicht über die Art.

create table web.tour_travel_document (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references web.profiles(id) on delete cascade,
  kind        text not null check (kind in ('esta','eta','schengen_visa','national_visa','other')),
  -- Geltungsbereich: ISO-3166-1 alpha-2 Zielland ODER 'SCHENGEN' (Raum). Pflicht außer bei 'other'.
  scope       text check (scope ~ '^[A-Z]{2}$' or scope = 'SCHENGEN'),
  valid_until date,                                   -- „Gültig bis"; null bei beantragt/nicht vorhanden
  status      text not null default 'have' check (status in ('have','applied','none')),
  lead_weeks  smallint check (lead_weeks is null or (lead_weeks >= 0 and lead_weeks <= 104)), -- Nutzerangabe (Vorlaufzeit)
  note        text check (note is null or char_length(note) <= 200),  -- Freitext für „sonstiges" — KEINE Nummer
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint tour_travel_document_scope_required check (kind = 'other' or scope is not null),
  unique (user_id, kind, scope)                       -- ein Dokument je Art+Bereich; sauberes Upsert
);

comment on table  web.tour_travel_document is 'Eigene Reisedokumente (owner-only). KEINE Dokumentnummer speichern.';
comment on column web.tour_travel_document.scope is 'ISO2-Zielland oder ''SCHENGEN''. Deckt der Bereich das Turnierland, gilt das Dokument.';

create index tour_travel_document_user on web.tour_travel_document (user_id);

create trigger trg_web_ttd_updated_at before update on web.tour_travel_document
  for each row execute function web.set_updated_at_tour();

alter table web.tour_travel_document enable row level security;

-- Owner-only: jeder sieht/schreibt nur die eigenen Dokumente (Muster tour_equipment_own).
create policy tour_travel_document_own on web.tour_travel_document
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

grant select, insert, update, delete on web.tour_travel_document to authenticated;
revoke all on web.tour_travel_document from anon;   -- sensibel: kein anon-Grant

notify pgrst, 'reload schema';

-- Rollback:
--   drop table if exists web.tour_travel_document;
