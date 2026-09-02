// Explizite Spaltenliste für profiles-Reads statt select("*") (Sicherheitsaudit 09/2026).
// Sensible Felder liegen ausschließlich in web.profiles_private (owner-only). Wird je eine
// sensible Spalte auf web.profiles hinzugefügt, taucht sie hier bewusst NICHT auf und leakt
// so nicht automatisch an Betrachter (z. B. Fremdprofil in FullProfile). Neue harmlose
// Spalte → hier ergänzen.
export const PROFILE_COLUMNS =
  "id, display_name, first_name, age, gender, height_cm, city, country, country_name, place_id, search_radius_km, club_id, club_name_manual, sports, skill_level, official_rating, goals, bio, profile_image, additional_images, visibility_gender, visibility_age_min, visibility_age_max, is_paused, pause_requires_photo, is_verified, is_banned, push_matches, push_messages, push_reminders, push_community, created_at, updated_at, last_active, username, public_posts, is_seed, match_score, matches_rated, mode, email_on_request";
