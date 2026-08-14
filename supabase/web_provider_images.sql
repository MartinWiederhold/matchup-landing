-- ============================================================================
--  Matchup Web — Anbieter-Fotos (Storage) für web.service_providers.image_url
--  Schema: storage
-- ----------------------------------------------------------------------------
--  Legt einen ÖFFENTLICHEN Storage-Bucket für selbst hochgeladene Anbieter-Fotos
--  an und sichert das SCHREIBEN über pfad-basierte Policies (Ordner je Nutzer).
--  KEINE Tabellenänderung: web.service_providers.image_url existiert bereits.
--
--  WARUM ÖFFENTLICH (anders als tour-receipts, die PRIVAT sind):
--  Ein Beleg ist sensibel (Ort/Zeit/Kartenstellen) → privat + signierte Links.
--  Ein Anbieter-Foto ist das Gegenteil: der Anbieter trägt sich SELBST ein und
--  will auf der Karte gesehen werden. Wer sich listet, willigt in die Anzeige
--  seines Fotos ein — genau das schließt die MU-035-Lücke: ein Bild liegt nur
--  vor, wenn es der Eigentümer selbst hochgeladen hat. Öffentlicher Bucket =
--  direkte Anzeige über <img src=image_url> ohne signierte Links.
--
--  MU-035: Die App schreibt image_url NUR bei Selbst-Einträgen (source='self',
--  created_by = auth.uid()). Die 77 Directory-Einträge (fremde Hotlinks/Favicons)
--  bleiben davon unberührt; deren Anzeige regelt MU-035 separat.

-- 1) Öffentlicher Bucket ------------------------------------------------------
--    Grenze 5 MB; nur Bildformate.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'provider-images',
  'provider-images',
  true,                                    -- ÖFFENTLICH — Foto wird auf der Karte gezeigt
  5242880,                                 -- 5 MB
  array['image/jpeg','image/png','image/webp','image/heic','image/heif']
)
on conflict (id) do nothing;               -- idempotent

-- 2) Zugriffsregeln auf storage.objects --------------------------------------
--    Zugehörigkeit ergibt sich AUS DEM PFAD: erster Ordner = auth.uid().
--    Erwarteter Pfad:  <user_id>/<zufallsname>.<ext>
--    Lesen ist öffentlich (public bucket); geschrieben wird nur im eigenen Ordner.

-- Lesen: öffentlich (jeder darf Anbieter-Fotos sehen — sie sind zur Anzeige da).
drop policy if exists provider_images_select_public on storage.objects;
create policy provider_images_select_public on storage.objects
  for select to public
  using (bucket_id = 'provider-images');

-- Hochladen: nur in den EIGENEN Ordner.
drop policy if exists provider_images_insert_own on storage.objects;
create policy provider_images_insert_own on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'provider-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Überschreiben (Re-Upload auf denselben Pfad): nur eigene.
drop policy if exists provider_images_update_own on storage.objects;
create policy provider_images_update_own on storage.objects
  for update to authenticated
  using (
    bucket_id = 'provider-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'provider-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Löschen: nur eigene.
drop policy if exists provider_images_delete_own on storage.objects;
create policy provider_images_delete_own on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'provider-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- 3) Aufräumen verwaister Dateien — über die Storage-API, NICHT per DB-Trigger.
--    Wie bei tour-receipts blockiert die Plattform direktes DELETE auf
--    storage.objects per SQL. Beim Löschen/Ersetzen eines Eintrags entfernt der
--    Client die alte Datei via supabase.storage.from('provider-images').remove([...]).

notify pgrst, 'reload schema';

-- ============================================================================
--  ROLLBACK (Bucket nur löschbar, wenn leer):
-- ----------------------------------------------------------------------------
-- drop policy if exists provider_images_delete_own on storage.objects;
-- drop policy if exists provider_images_update_own on storage.objects;
-- drop policy if exists provider_images_insert_own on storage.objects;
-- drop policy if exists provider_images_select_public on storage.objects;
-- delete from storage.buckets where id = 'provider-images';   -- nur wenn leer
-- notify pgrst, 'reload schema';
-- ============================================================================
