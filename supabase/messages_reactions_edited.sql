-- Chat-Verbesserungen (Play): Reaktionen + Bearbeitungs-Zeitstempel auf web.messages.
-- Reaktionen werden schlank als jsonb { "<user_id>": "<emoji>" } auf der Nachricht selbst
-- gespeichert — im 1:1-Chat reichen zwei mögliche Reaktoren, daher keine eigene Tabelle,
-- kein zweiter Realtime-Kanal, keine zusätzlichen Grants. Die bestehende UPDATE-Policy
-- (web.is_my_match(match_id)) erlaubt beiden Match-Mitgliedern das Setzen einer Reaktion.
-- Bearbeiten/Löschen: DELETE-Policy (sender_id = auth.uid()) besteht bereits; edited_at
-- markiert eine nachträglich geänderte eigene Nachricht ("bearbeitet").
alter table web.messages add column if not exists reactions jsonb not null default '{}'::jsonb;
alter table web.messages add column if not exists edited_at timestamptz;

notify pgrst, 'reload schema';
