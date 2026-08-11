-- ============================================================================
-- web.profiles_private — sensible Profilfelder aus web.profiles auslagern
-- ============================================================================
-- Problem (Sicherheitsaudit 2026-08): web.profiles hat eine SELECT-Policy
-- `true` für authenticated → JEDER eingeloggte Nutzer liest ALLE Profile inkl.
-- fcm_token und device_fingerprint. Seit dem Entfernen des Vorstart-Gates ist
-- das real ausnutzbar (eine Registrierung genügt). RLS ist zeilen-, nicht
-- spaltenweise — deshalb wandern die rein sensiblen, im Web NIE gelesenen
-- Felder in eine eigene Tabelle mit strenger RLS, statt profiles zuzusperren.
--
-- Teil 1a (diese Datei): fcm_token, device_fingerprint, apple_id, google_id.
-- Alle vier sind in web.profiles aktuell komplett NULL (0/28) und werden vom
-- Web-Code nie gelesen; fcm_token wird dort nur beim Logout auf null gesetzt.
--
-- !!! WICHTIG — CROSS-REPO / MOBILE-APP !!!
-- Die native Matchup-App (eigenes Repo, hier NICHT sichtbar) schreibt
-- fcm_token (Firebase-Push-Registrierung) und evtl. device_fingerprint
-- MÖGLICHERWEISE weiterhin direkt nach web.profiles. Nach dem DROP (Phase 2)
-- würde das STILL brechen (Spalte weg → Insert/Update-Fehler oder Datenverlust
-- des Push-Tokens → keine Push-Nachrichten mehr). Vor dem Ausrollen von Phase 2
-- die Mobile-App auf web.profiles_private umstellen. Bis dahin bleiben die
-- Spalten in profiles bestehen (Phase 1 ist rückwärtskompatibel).
-- ============================================================================

-- ── Phase 1: Tabelle + RLS + Backfill (rückwärtskompatibel, KEIN DROP) ──────
create table if not exists web.profiles_private (
  user_id            uuid primary key references web.profiles(id) on delete cascade,
  fcm_token          text,
  device_fingerprint text,
  apple_id           text,
  google_id          text
);

alter table web.profiles_private enable row level security;

-- Eigner liest/schreibt nur die EIGENE Zeile. service_role (Server/Push) umgeht
-- RLS ohnehin und bleibt damit der einzige übergreifende Zugriff.
drop policy if exists profiles_private_owner on web.profiles_private;
create policy profiles_private_owner on web.profiles_private
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- WICHTIG: Tabellen-GRANTs für authenticated. Ohne diese greift die RLS-Policy gar
-- nicht — PostgREST liefert „permission denied for table". Die RLS beschränkt dann
-- auf die eigene Zeile. anon bekommt KEINEN Zugriff (profiles_private ist nie
-- öffentlich). NICHT vergessen (war der stille Breaker beim ersten Anlauf).
grant select, insert, update on web.profiles_private to authenticated;

-- Bestand übernehmen (Werte aktuell alle null, aber vollständig & idempotent).
insert into web.profiles_private (user_id, fcm_token, device_fingerprint, apple_id, google_id)
  select id, fcm_token, device_fingerprint, apple_id, google_id from web.profiles
  on conflict (user_id) do nothing;

-- Jede neue profiles-Zeile bekommt automatisch eine profiles_private-Zeile, damit
-- die Invariante „1:1" immer gilt (Onboarding-Insert, fcm-Null beim Logout, lat/lng-
-- Merge im AuthProvider verlassen sich darauf). SECURITY DEFINER + fixer search_path.
create or replace function web.create_profiles_private_row()
returns trigger language plpgsql security definer set search_path = web, public as $$
begin
  insert into web.profiles_private (user_id) values (new.id) on conflict (user_id) do nothing;
  return new;
end $$;
drop trigger if exists trg_profiles_private_autocreate on web.profiles;
create trigger trg_profiles_private_autocreate
  after insert on web.profiles
  for each row execute function web.create_profiles_private_row();

notify pgrst, 'reload schema';

-- ── Phase 2: Spalten aus web.profiles entfernen ─────────────────────────────
-- Angewendet 2026-08-10, NACHDEM der Web-Code umgestellt war (auth.tsx schreibt
-- fcm_token nach profiles_private; keine Web-Referenz mehr auf die vier Spalten).
-- ACHTUNG: Die Mobile-App (siehe Warnung oben) ist hier NICHT verifizierbar —
-- schreibt sie noch nach web.profiles, bricht das ab jetzt still. Vor breitem
-- Mobile-Release auf web.profiles_private umstellen.
alter table web.profiles
  drop column fcm_token,
  drop column device_fingerprint,
  drop column apple_id,
  drop column google_id;
notify pgrst, 'reload schema';

-- ── Rollback ────────────────────────────────────────────────────────────────
-- Falls Phase 2 schon lief, Spalten zurückholen und Daten zurückschreiben:
--   alter table web.profiles add column fcm_token text, add column device_fingerprint text,
--     add column apple_id text, add column google_id text;
--   update web.profiles p set fcm_token=pp.fcm_token, device_fingerprint=pp.device_fingerprint,
--     apple_id=pp.apple_id, google_id=pp.google_id from web.profiles_private pp where pp.user_id=p.id;
-- Phase 1 zurücknehmen:  drop table web.profiles_private;
