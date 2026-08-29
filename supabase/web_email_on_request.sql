-- E-Mail-Benachrichtigung bei neuer Verbindungsanfrage ("Verbinden").
-- Opt-out je Nutzer (Default an); Toggle im Profil → Einstellungen.
-- notified_at auf likes verhindert Doppel-Mails bei erneutem Antippen.
alter table web.profiles add column if not exists email_on_request boolean not null default true;
alter table web.likes    add column if not exists notified_at timestamptz;

notify pgrst, 'reload schema';
