-- ============================================================================
--  web.service_providers: Telefon-Feld für redaktionelle/eigene Anbieter-Einträge
-- ----------------------------------------------------------------------------
--  Eine nullable Spalte, kein Default. Grants unverändert (Spalte erbt die
--  Tabellen-Grants). Angezeigt als tel:-Link in /tour + /map neben Website/E-Mail.
--  Redaktionelle Einträge tragen source='editorial' (kein CHECK auf source nötig)
--  und created_by=NULL (Martin ist nicht der Anbieter).
-- ============================================================================

alter table web.service_providers add column if not exists phone text;
comment on column web.service_providers.phone is 'Telefonnummer des Anbieters (optional), als tel:-Link angezeigt.';

notify pgrst, 'reload schema';

-- Rollback:
--   alter table web.service_providers drop column if exists phone;
--   notify pgrst, 'reload schema';
