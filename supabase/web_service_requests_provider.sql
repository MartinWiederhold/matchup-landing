-- ============================================================================
-- service_requests: Anbieter (mit Konto) darf Anfragen an SEINE Einträge sehen
-- ============================================================================
-- Bisher hatte service_requests NUR eine Eigentümer-Policy (user_id = auth.uid()
-- = der Anfragende). Der ANBIETER hatte keinen Lesepfad → Anfragen wurden
-- gespeichert, aber niemand erfuhr davon (kein Trigger, keine Mail, keine
-- Admin-Ansicht). Diese Policy zeigt einem Anbieter die Anfragen an seine
-- eigenen Listings (service_providers.created_by = auth.uid()) und erlaubt ihm,
-- den Status zu ändern (confirmed/declined/done).
--
-- ACHTUNG — die 77 importierten Directory-Anbieter haben created_by = NULL
-- (kein Konto dahinter): für die matcht diese Policy NIE. Das ist korrekt — an
-- kontolose Einträge kann keine In-App-Anfrage zugestellt werden. Die App bietet
-- dort ohnehin Direktkontakt (Website/E-Mail) statt der In-App-Anfrage an; der
-- In-App-Request-Weg gilt nur für Self-Listings (created_by gesetzt).

create policy service_requests_provider_read on web.service_requests
  for select to authenticated
  using (exists (
    select 1 from web.service_providers sp
    where sp.id = service_requests.provider_id and sp.created_by = auth.uid()));

create policy service_requests_provider_update on web.service_requests
  for update to authenticated
  using (exists (
    select 1 from web.service_providers sp
    where sp.id = service_requests.provider_id and sp.created_by = auth.uid()));

notify pgrst, 'reload schema';

-- Rollback:
--   drop policy service_requests_provider_read on web.service_requests;
--   drop policy service_requests_provider_update on web.service_requests;
