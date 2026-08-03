-- ============================================================================
--  Matchup Web — Belegfotos (Storage) für web.tour_expenses
--  Schema: web + storage
-- ----------------------------------------------------------------------------
--  Legt einen PRIVATEN Storage-Bucket für Belegfotos an, sichert ihn über
--  Pfad-basierte Policies (Ordner je Nutzer), ergänzt web.tour_expenses um EIN
--  nullable Feld für den Belegpfad und räumt die Datei beim Löschen der Zeile
--  automatisch mit weg. web.tour_expenses wird NICHT umgebaut.
--
--  WARUM PRIVAT + SIGNIERTE LINKS (nicht öffentlich):
--  Auf einem Kassenbon stehen Ort, Datum, Uhrzeit und oft die letzten Stellen der
--  Kartennummer. RLS schützt nur Tabellenzeilen, NICHT Dateien: ein öffentlicher
--  Bucket liefert jedem mit der URL das Bild — ohne Login, dauerhaft. Deshalb ist
--  der Bucket privat (public=false); es gibt KEINE öffentliche Datei-URL. Der
--  Zugriff läuft ausschließlich über zeitlich begrenzte, signierte Links
--  (createSignedUrl), die die App unter der Nutzer-Session erzeugt — die SELECT-
--  Policy unten erlaubt das Signieren nur dem Eigentümer, und ein geleakter Link
--  läuft ab, gewährt also keinen dauerhaften Zugriff.
--
--  Rollback siehe Kommentarblock am Dateiende.
-- ============================================================================

-- 1) Privater Bucket ---------------------------------------------------------
--    Grenze 10 MB je Datei; nur Bilder + PDF (keine beliebigen Dateitypen).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'tour-receipts',
  'tour-receipts',
  false,                                   -- PRIVAT — niemals public
  10485760,                                -- 10 MB
  array['image/jpeg','image/png','image/webp','image/heic','image/heif','application/pdf']
)
on conflict (id) do nothing;               -- idempotent

-- 2) Zugriffsregeln auf storage.objects --------------------------------------
--    Zugehörigkeit ergibt sich AUS DEM PFAD: erster Ordner = auth.uid().
--    Erwarteter Pfad:  <user_id>/<zufallsname>.<ext>
--    So ist ein Beleg strukturell dem Nutzer zugeordnet, ohne Extra-Tabelle.
--    (RLS auf storage.objects ist von Supabase bereits aktiv.)

-- Hochladen: nur in den EIGENEN Ordner.
drop policy if exists tour_receipts_insert_own on storage.objects;
create policy tour_receipts_insert_own on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'tour-receipts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Lesen/Signieren: nur eigene Belege. Diese Policy beschränkt createSignedUrl
-- unter der Nutzer-Session auf den Eigentümer.
drop policy if exists tour_receipts_select_own on storage.objects;
create policy tour_receipts_select_own on storage.objects
  for select to authenticated
  using (
    bucket_id = 'tour-receipts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Löschen: nur eigene Belege.
drop policy if exists tour_receipts_delete_own on storage.objects;
create policy tour_receipts_delete_own on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'tour-receipts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Überschreiben (Re-Upload auf denselben Pfad): nur eigene.
drop policy if exists tour_receipts_update_own on storage.objects;
create policy tour_receipts_update_own on storage.objects
  for update to authenticated
  using (
    bucket_id = 'tour-receipts'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'tour-receipts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ----------------------------------------------------------------------------
--  BEWUSST NICHT AKTIV — Agent-Leserecht auf Belegfotos.
--  Die bestehende Agent-Policy auf web.tour_expenses gibt Team-Agenten Leserecht
--  auf die ZEILE (Betrag, Händler, Kategorie). Das Bon-FOTO ist eine andere
--  Datenschutzstufe (exakter Ort, Uhrzeit, letzte Kartenstellen, fremde Positionen).
--  Deshalb bekommen Agenten KEIN Storage-Leserecht — Belegfotos bleiben
--  eigentümer-only. Nur aktivieren, wenn Parität ausdrücklich gewünscht ist:
--
--  create policy tour_receipts_agent_read on storage.objects
--    for select to authenticated
--    using (
--      bucket_id = 'tour-receipts'
--      and exists (
--        select 1 from web.tour_team tt
--        where tt.player_id::text = (storage.foldername(name))[1]
--          and tt.member_user_id = auth.uid()
--          and tt.status = 'active' and tt.role = 'agent'
--      )
--    );
-- ----------------------------------------------------------------------------

-- 3) Verknüpfung: eine nullable Spalte an web.tour_expenses ------------------
--    NULL = kein Beleg. Kein FK (Storage-Pfad, keine Tabellenreferenz), kein
--    Default. Von /app unangetastet: alle Konsumenten nutzen explizite
--    Spaltenlisten (kein select *), Inserts listen Felder explizit → die neue
--    Spalte bleibt für /app unsichtbar und bricht nichts.
alter table web.tour_expenses add column if not exists receipt_path text;
comment on column web.tour_expenses.receipt_path is
  'Pfad des Belegfotos im privaten Bucket tour-receipts (<user_id>/<name>). NULL = kein Beleg. Zugriff nur über signierte Links.';

-- 4) Aufräumen verwaister Dateien — NICHT per DB-Trigger möglich ------------
--    URSPRÜNGLICH war hier ein AFTER-DELETE-Trigger geplant, der die Belegdatei
--    beim Löschen der Zeile mit entfernt. DAS GEHT AUF DIESEM SUPABASE NICHT:
--    ein direktes `delete from storage.objects` per SQL wird plattformseitig
--    blockiert ("Direct deletion from storage tables is not allowed. Use the
--    Storage API instead.", Fehlercode 42501) — auch aus einer SECURITY-DEFINER-
--    Funktion. Ein solcher Trigger würde sogar das Löschen der Ausgaben-Zeile
--    abbrechen und damit /tour UND /app brechen. Er wurde daher bewusst NICHT
--    angelegt (bei einem Testlauf entfernt).
--
--    Aufräumen muss über die STORAGE-API laufen (nicht über SQL):
--      - Client: beim Löschen einer Ausgabe in /tour zusätzlich
--        supabase.storage.from('tour-receipts').remove([receipt_path]).
--      - Rest (z. B. /app-Löschungen, die den Beleg nicht kennen): über einen
--        späteren Aufräum-Lauf (Storage-API), der Objekte ohne passende
--        tour_expenses-Zeile entfernt.
--    Der genaue Weg wird mit der Datenschicht entschieden.

-- 5) PostgREST-Schema-Cache neu laden ---------------------------------------
notify pgrst, 'reload schema';

-- ============================================================================
--  ROLLBACK — hebt die Migration auf. Reihenfolge: Spalte, Policies, Bucket.
--  HINWEIS: Der Bucket lässt sich nur löschen, wenn er LEER ist (sonst schlägt
--  das delete fehl) — vorher ggf. Objekte über die Storage-API entfernen.
-- ----------------------------------------------------------------------------
-- alter table web.tour_expenses drop column if exists receipt_path;
--
-- drop policy if exists tour_receipts_update_own on storage.objects;
-- drop policy if exists tour_receipts_delete_own on storage.objects;
-- drop policy if exists tour_receipts_select_own on storage.objects;
-- drop policy if exists tour_receipts_insert_own on storage.objects;
--
-- delete from storage.buckets where id = 'tour-receipts';   -- nur wenn leer
--
-- notify pgrst, 'reload schema';
-- ============================================================================
