-- Coach-/Team-Freigabe: read-only Link zur Saison. Unratbarer Token in tour_profiles;
-- der Nutzer erzeugt/erneuert/löscht ihn selbst (RLS: tour_profiles ALL where user_id=auth.uid()).
-- Die öffentliche Ansicht liest per Service-Client NUR nicht-sensible Saison-/Budget-Daten
-- (Turniere + Budget + Vorname) — keine Pässe/Dokumente/Koordinaten/Finanzdetails.
alter table web.tour_profiles add column if not exists season_share_token uuid;
notify pgrst, 'reload schema';
