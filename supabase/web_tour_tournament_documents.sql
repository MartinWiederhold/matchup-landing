-- supabase/web_tour_tournament_documents.sql
-- Turnier-Ordner: private Dateiablage je (Nutzer × Turnier). Eigener Bucket tour-documents
-- (Muster tour-receipts: privat, signierte Links, owner-only über den Pfad). Owner-only;
-- Team-Leserecht später (auskommentiert, wie MU-040). KEINE öffentliche Datei-URL.
--
-- VISUM-SCAN vs. tour_travel_document (bewusste Unterscheidung, festgehalten):
-- In web.tour_travel_document vermeiden wir bewusst die Dokument-NUMMER als
-- STRUKTURIERTES, abfragbares Feld (Regel wie beim Pass). Ein Visum-SCAN, den der
-- Nutzer hier selbst hochlädt, ist etwas anderes: seine eigene Kopie, in einem
-- privaten owner-only Bucket, erreichbar nur über kurzlebige signierte Links —
-- dieselbe Datenschutzstufe wie ein Kassenbon mit Kartenstellen. Deshalb ist 'visa'
-- als Art zugelassen.

-- 1) Privater Bucket ---------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'tour-documents', 'tour-documents',
  false,                                    -- PRIVAT — niemals public
  10485760,                                 -- 10 MB
  array['image/jpeg','image/png','image/webp','image/heic','image/heif','application/pdf']
)
on conflict (id) do nothing;                -- idempotent

-- 2) Pfad-basierte Policies auf storage.objects ------------------------------
--    Erwarteter Pfad:  <user_id>/<tournament_id>/<zufallsname>.<ext>
--    Erster Ordner = auth.uid() → strukturelle Eigentümer-Zuordnung. Zweiter Ordner
--    = Turnier (gruppiert je Turnier + macht Waisen eindeutig zuordenbar).
drop policy if exists tour_documents_insert_own on storage.objects;
create policy tour_documents_insert_own on storage.objects
  for insert to authenticated
  with check (bucket_id = 'tour-documents' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists tour_documents_select_own on storage.objects;
create policy tour_documents_select_own on storage.objects
  for select to authenticated
  using (bucket_id = 'tour-documents' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists tour_documents_delete_own on storage.objects;
create policy tour_documents_delete_own on storage.objects
  for delete to authenticated
  using (bucket_id = 'tour-documents' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists tour_documents_update_own on storage.objects;
create policy tour_documents_update_own on storage.objects
  for update to authenticated
  using (bucket_id = 'tour-documents' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'tour-documents' and (storage.foldername(name))[1] = auth.uid()::text);

-- 3) Metadaten-Tabelle -------------------------------------------------------
create table web.tour_tournament_document (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references web.profiles(id)        on delete cascade,
  tournament_id uuid not null references web.tour_tournaments(id) on delete cascade,
  kind          text not null check (kind in
                  ('fact_sheet','confirmation','draw','visa','flight','hotel','transport','insurance','other')),
  label         text check (label is null or char_length(label) <= 120),
  storage_path  text not null,             -- <uid>/<tournament_id>/<name>.<ext> im Bucket tour-documents
  mime          text,
  size_bytes    integer check (size_bytes is null or size_bytes >= 0),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (user_id, storage_path)           -- ein Datensatz je Datei
);

comment on table  web.tour_tournament_document is 'Turnier-Ordner (owner-only). Datei im privaten Bucket tour-documents, Zugriff nur über signierte Links.';
comment on column web.tour_tournament_document.storage_path is 'Pfad im Bucket tour-documents: <user_id>/<tournament_id>/<name>. Beim Löschen der Zeile Datei per Storage-API mitnehmen (MU-017).';

create index tour_tournament_document_user_tt on web.tour_tournament_document (user_id, tournament_id);

create trigger trg_web_ttd_doc_updated_at before update on web.tour_tournament_document
  for each row execute function web.set_updated_at_tour();

alter table web.tour_tournament_document enable row level security;

-- Owner-only (Muster tour_equipment_own). Team-Leserecht später, s. u.
create policy tour_tournament_document_own on web.tour_tournament_document
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

grant select, insert, update, delete on web.tour_tournament_document to authenticated;
revoke all on web.tour_tournament_document from anon;   -- sensibel: kein anon-Grant

-- ----------------------------------------------------------------------------
--  BEWUSST NICHT AKTIV — Team-Leserecht (später, wie MU-040). Zwei Policies nötig:
--  eine auf der ZEILE, eine auf der DATEI (storage.objects). Erst mit Auftrag.
--
--  create policy tour_tournament_document_agent_read on web.tour_tournament_document
--    for select to authenticated using (exists (
--      select 1 from web.tour_team tt where tt.player_id = user_id
--        and tt.member_user_id = auth.uid() and tt.status='active' and tt.role='agent'));
--  create policy tour_documents_agent_read on storage.objects
--    for select to authenticated using (bucket_id='tour-documents' and exists (
--      select 1 from web.tour_team tt where tt.player_id::text = (storage.foldername(name))[1]
--        and tt.member_user_id = auth.uid() and tt.status='active' and tt.role='agent'));
-- ----------------------------------------------------------------------------

notify pgrst, 'reload schema';

-- ============================================================================
--  ROLLBACK (Reihenfolge: Tabelle, Storage-Policies, Bucket).
--  Bucket löscht nur LEER — vorher Objekte per Storage-API entfernen.
-- ----------------------------------------------------------------------------
-- drop table if exists web.tour_tournament_document;
-- drop policy if exists tour_documents_update_own on storage.objects;
-- drop policy if exists tour_documents_delete_own on storage.objects;
-- drop policy if exists tour_documents_select_own on storage.objects;
-- drop policy if exists tour_documents_insert_own on storage.objects;
-- delete from storage.buckets where id = 'tour-documents';   -- nur wenn leer
-- notify pgrst, 'reload schema';
