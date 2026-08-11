-- ============================================================================
-- Discover ohne Rohkoordinaten — Distanz serverseitig (Sicherheitsaudit 2026-08)
-- ============================================================================
-- profiles.latitude/longitude sind heute für JEDEN Eingeloggten lesbar (RLS
-- select=true) → exakte Wohnkoordinaten aller Nutzer abgreifbar. Discover
-- braucht aber NUR die Entfernung (Radius-Filter + Sort-Tiebreaker + Anzeige),
-- KEINE Koordinaten, und plottet fremde Nutzer auf keiner Karte.
-- Lösung: lat/lng nach web.profiles_private (owner+service), Distanz über eine
-- SECURITY-DEFINER-RPC, die NUR km zurückgibt.
-- ============================================================================

-- ── Phase 1: lat/lng in profiles_private aufnehmen + backfillen ──────────────
alter table web.profiles_private
  add column if not exists latitude  double precision,
  add column if not exists longitude double precision;

update web.profiles_private pp
   set latitude = p.latitude, longitude = p.longitude
  from web.profiles p
 where p.id = pp.user_id;

-- ── Distanz-RPC ─────────────────────────────────────────────────────────────
-- SECURITY DEFINER + fixer search_path (Projektkonvention; hier zwingend, weil
-- die Funktion die owner-only-RLS von profiles_private bewusst umgeht, um die
-- Distanz zu rechnen). Der Aufrufer sieht NIE fremde Koordinaten.
--
-- RÜCKGABETYP: (id uuid, distance_km double precision) — KEINE Koordinaten.
-- lat/lng von me/pp erscheinen ausschließlich im Haversine-Ausdruck, NIE in der
-- SELECT-Liste. (Bewusst geprüft: sonst wären sie ein stiller Nebenprodukt-Leak.)
--
-- AKZEPTIERTES RESTRISIKO (bewusst, nicht übersehen): Ein Aufrufer kann diese
-- Funktion mit beliebigen SICHTBAREN Profil-IDs aufrufen und deren ENTFERNUNG
-- erfahren — NICHT den Ort. Das ist dem Nähe-Matching inhärent (eine Distanz ist
-- ein Kreis, kein Punkt) und deutlich enger als der Status quo, in dem jeder
-- Eingeloggte via `select latitude,longitude from profiles` die EXAKTEN
-- Koordinaten aller lesen kann. Wer das später verschärfen will: die Feed-
-- Ausschlüsse (Blocks/Matches/Skips) müssten in die RPC — bewusst NICHT getan,
-- weil das die betrachterabhängige Rangfolge nach SQL zöge (Risiko ohne Gewinn).
create or replace function web.candidate_distances(p_ids uuid[])
returns table (id uuid, distance_km double precision)
language sql
stable
security definer
set search_path = web, public
as $$
  with me as (
    select latitude as lat, longitude as lng
    from web.profiles_private
    where user_id = auth.uid()
  )
  select p.id,
         -- Haversine, R=6371, auf 1 Dezimale gerundet — identisch zu haversineKm()
         -- im Client. least(1, …) schützt asin vor Float-Überlauf (> 1 → NaN).
         round(
           (2 * 6371 * asin(least(1.0, sqrt(
             power(sin(radians(pp.latitude - me.lat) / 2), 2) +
             cos(radians(me.lat)) * cos(radians(pp.latitude)) *
             power(sin(radians(pp.longitude - me.lng) / 2), 2)
           ))))::numeric, 1
         )::double precision as distance_km
  from me
  join web.profiles_private pp on pp.user_id = any (p_ids)
  join web.profiles p          on p.id = pp.user_id
  where me.lat is not null and me.lng is not null          -- Aufrufer ohne Koordinaten → leere Rückgabe
    and pp.latitude is not null and pp.longitude is not null -- Kandidat ohne Koordinaten → nicht enthalten
    and p.is_paused = false and p.is_banned = false;         -- nur sichtbare Profile (kein Distanz-Probing Gesperrter)
$$;

revoke all on function web.candidate_distances(uuid[]) from public, anon;
grant execute on function web.candidate_distances(uuid[]) to authenticated;

notify pgrst, 'reload schema';

-- ── Phase 2: lat/lng aus web.profiles entfernen ─────────────────────────────
-- Angewendet 2026-08-11, NACH der Code-Umstellung (AuthProvider merged eigene
-- lat/lng aus profiles_private; EditProfile/Onboarding/tourPlanner nutzen
-- profiles_private; Discover×3 + FullProfile nutzen die RPC; kein profiles.lat/
-- lng-Zugriff mehr). Mobile-App-Hinweis wie bei web_profiles_private.sql: falls
-- die App lat/lng nach profiles schreibt, dort ebenfalls umstellen.
alter table web.profiles drop column latitude, drop column longitude;
notify pgrst, 'reload schema';

-- ── Rollback ────────────────────────────────────────────────────────────────
--   drop function if exists web.candidate_distances(uuid[]);
--   alter table web.profiles_private drop column latitude, drop column longitude;
--   (falls Phase 2 lief: Spalten in profiles zurück + aus profiles_private zurückschreiben)
