// ============================================================
//  PROFILE
// ============================================================
export interface Profile {
  id: string; // = auth.users.id (UUID)
  display_name: string;
  first_name: string;
  username: string | null; // unique, Migration 016
  age: number; // CHECK >= 18
  gender: "male" | "female";
  height_cm: number | null; // 140–220
  city: string | null;
  country: string; // default 'CH'
  country_name: string | null;
  place_id: string | null;
  latitude: number | null;
  longitude: number | null;
  search_radius_km: number; // default 25
  club_id: string | null; // FK → clubs.id
  club_name_manual: string | null;
  mode: "play" | "tour"; // Dual-Mode: Hobby (play) vs. Wettkampf/Profi (tour), default 'play'
  sports: Sport[]; // PostgreSQL array, CHECK length >= 1
  skill_level: SkillLevel;
  official_rating: string | null;
  match_score?: number; // MatchScore (Elo), default 1000 — Migration game_results
  matches_rated?: number; // Anzahl gewerteter Matches (Kalibrierung)
  goals: string[]; // PostgreSQL array
  bio: string | null; // max 300 chars
  profile_image: string | null; // URL zu avatars-Bucket
  additional_images: string[]; // bis zu 5 weitere URLs (Galerie)
  visibility_gender: string[]; // ['male'], ['female'], ['male','female']
  visibility_age_min: number; // default 18
  visibility_age_max: number; // default 99
  is_paused: boolean; // default false
  is_verified: boolean; // default false
  is_banned: boolean; // default false
  is_seed: boolean; // default false, Migration 021
  // pause_reason liegt in web.profiles_private (owner-lesbar) und wird im AuthProvider
  // ins eigene profile-Objekt gemergt (AppGuard zeigt dem pausierten Nutzer den Grund).
  pause_reason: string | null;
  // report_count/banned_at/daily_likes_* liegen in web.profiles_moderation (SERVICE-ONLY,
  // Sicherheitsaudit 2026-08) — nicht Teil des client-lesbaren Profils, siehe ProfileModeration.
  push_matches: boolean; // default true
  push_messages: boolean; // default true
  push_reminders: boolean; // default true
  push_community: boolean; // default true
  public_posts: boolean; // default true, Migration 018
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
  last_active: string; // ISO timestamp
  _distance?: number; // client-seitiges Hilfsfeld (Discover-Sortierung)
}

/**
 * Sensible Profilfelder, aus `profiles` in `web.profiles_private` ausgelagert
 * (Sicherheitsaudit 2026-08): RLS ist zeilen-, nicht spaltenweise — diese Felder
 * darf NUR der Eigner (bzw. server-seitig service_role) lesen, nicht jeder
 * Eingeloggte. Push/Fingerprint werden v. a. von der Mobile-App geschrieben.
 */
export interface ProfilePrivate {
  user_id: string; // = profiles.id
  fcm_token: string | null;
  device_fingerprint: string | null;
  apple_id: string | null;
  google_id: string | null;
  latitude: number | null;
  longitude: number | null;
  pause_reason: string | null; // owner-lesbar: der pausierte Nutzer muss den Grund erfahren
}

/**
 * Moderations-/Statusfelder (web.profiles_moderation): SERVICE-ONLY (Sicherheitsaudit
 * 2026-08). Weder Fremde NOCH der Eigner lesen sie — wer die eigene Meldezahl sähe,
 * könnte auf den Melder schließen. Zugriff nur server-seitig (service_role), Admin über
 * die verifyAdmin-Route /api/admin/moderation.
 */
export interface ProfileModeration {
  user_id: string; // = profiles.id
  report_count: number;
  banned_at: string | null;
  daily_likes_count: number;
  daily_likes_reset: string | null;
}

export type Sport = "tennis" | "padel" | "pickleball";
export type SkillLevel =
  | "beginner"
  | "intermediate"
  | "advanced"
  | "competitive";

// ============================================================
//  CLUB
// ============================================================
export interface Club {
  id: string;
  name: string;
  city: string | null;
  canton: string | null;
  state: string | null;
  country: string; // default 'CH'
  latitude: number | null;
  longitude: number | null;
  address: string | null; // z.B. "Schaanerstrasse 42, 9490 Vaduz"
}

// ============================================================
//  LIKE
// ============================================================
export interface Like {
  id: string;
  from_user_id: string; // FK → profiles.id, CHECK != to_user_id
  to_user_id: string; // FK → profiles.id
  created_at: string;
  from_user?: Profile;
}

// ============================================================
//  SKIP
// ============================================================
export interface Skip {
  id: string;
  user_id: string;
  skipped_user_id: string;
  skipped_at: string; // 14-Tage-Fenster
}

// ============================================================
//  MATCH
// ============================================================
export interface AppMatch {
  id: string;
  user1_id: string; // sortierte ID (kleinere UUID)
  user2_id: string; // sortierte ID (grössere UUID)
  is_active: boolean; // default true, false = unmatched
  game_event_id: string | null; // Migration 010
  created_at: string;
  updated_at: string;
  // Joined fields (client-seitig):
  user1?: Profile;
  user2?: Profile;
  last_message?: Message | null;
}

// ============================================================
//  MESSAGE (1:1 Chat)
// ============================================================
export interface Message {
  id: string;
  match_id: string; // FK → matches.id
  sender_id: string; // FK → profiles.id
  content: string;
  is_read: boolean; // default false
  delivered_at: string | null; // Migration 007
  read_at: string | null; // Migration 007
  client_message_id: string | null; // Dedup-Key
  created_at: string;
}

// ============================================================
//  GROUP
// ============================================================
export interface Group {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null; // nullable, Migration 024
  sport: Sport;
  max_members: number;
  is_open: boolean; // Migration 011
  latitude: number | null;
  longitude: number | null;
  club_id: string | null;
  created_by: string; // FK → profiles.id
  created_at: string;
  // Joined:
  member_count?: number;
  my_role?: GroupRole | null;
}

export type GroupRole = "owner" | "admin" | "member";

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: GroupRole;
  joined_at: string;
  // Joined:
  profile?: Profile;
}

export interface GroupMessage {
  id: string;
  group_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  // Joined:
  sender?: Profile;
}

// ============================================================
//  COMMUNITY
// ============================================================
export interface CommunityPost {
  id: string;
  club_id: string | null; // null = global, Migration 017
  author_id: string;
  content: string;
  image_url: string | null; // optionales Foto
  likes_count: number; // Migration 016, Trigger-maintained (= Gesamt-Reaktionen)
  comments_count: number; // Migration 016
  created_at: string;
  // Joined:
  author?: Profile;
  is_liked_by_me?: boolean;
  my_reaction?: string | null; // eigene Emoji-Reaktion
  reactions?: Record<string, number>; // Emoji → Anzahl
}

export interface CommunityComment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
  // Joined:
  author?: Profile;
}

export interface CommunityLike {
  id: string;
  post_id: string;
  user_id: string;
  reaction: string; // Emoji (Default 'like')
  created_at: string;
}

export interface Follower {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

// ============================================================
//  GAME EVENT
// ============================================================
export type GameType = "singles" | "doubles";
export type GameStatus = "planned" | "confirmed" | "cancelled" | "completed";
export type ParticipantStatus =
  | "invited"
  | "requested"
  | "accepted"
  | "declined"
  | "cancelled";

export interface GameEvent {
  id: string;
  created_by: string;
  sport: Sport;
  game_type: GameType;
  date_time: string; // ISO timestamp
  location: string;
  court_number: string | null; // Migration 025
  court_booked: boolean;
  description: string | null; // Migration 010
  max_participants: number | null; // Migration 010
  is_open: boolean; // Migration 010
  status: GameStatus;
  skill_range: string | null; // Migration 025
  visibility_gender: string[] | null;
  visibility_age_min: number | null;
  visibility_age_max: number | null;
  visibility_skill_levels: string[] | null;
  club_id: string | null; // Migration 013
  match_id: string | null;
  group_id: string | null;
  created_at: string;
  // Joined:
  creator?: Profile;
  participants?: GameParticipant[];
}

export interface GameParticipant {
  id: string;
  game_event_id: string;
  user_id: string;
  status: ParticipantStatus;
  requested_at: string | null;
  confirmed_at: string | null;
  created_at: string;
  // Joined:
  profile?: Profile;
}

// ============================================================
//  MODERATION
// ============================================================
export interface Report {
  id: string;
  reporter_id: string;
  reported_user_id: string | null;
  reported_post_id: string | null;
  reported_message_id: string | null;
  reason: string;
  status: "pending" | "reviewed" | "actioned" | "dismissed";
  admin_note: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface Block {
  id: string;
  blocker_id: string;
  blocked_id: string;
  created_at: string;
}

export interface Warning {
  id: string;
  user_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

// ============================================================
//  SUPPORT
// ============================================================
export type TicketStatus = "open" | "answered" | "in_progress" | "closed";

export interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  status: TicketStatus;
  created_at: string;
  updated_at: string;
}

export interface SupportMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_type: "user" | "admin";
  content: string;
  created_at: string;
}

// ============================================================
//  GAMIFICATION
// ============================================================
export interface PlayerStats {
  id: string;
  user_id: string;
  total_matches: number;
  wins: number;
  losses: number;
  current_streak: number;
  longest_streak: number;
  xp_points: number;
  level: number;
  favorite_day: string | null;
  favorite_time: string | null;
  favorite_court: string | null;
  different_partners: number;
  tennis_matches: number;
  padel_matches: number;
  updated_at: string;
}

export interface Achievement {
  id: string;
  user_id: string;
  achievement_key: string;
  unlocked_at: string;
}

// Achievement-Definitionen (client-seitig):
export const ACHIEVEMENT_DEFS: Record<
  string,
  { label: string; description: string; icon: string }
> = {
  first_serve: {
    label: "First Serve",
    description: "Erstes Match gespielt",
    icon: "🎾",
  },
  match_machine: {
    label: "Match Machine",
    description: "50 Matches gespielt",
    icon: "⚡",
  },
  century: { label: "Century", description: "100 Matches gespielt", icon: "💯" },
  padel_pioneer: {
    label: "Padel Pioneer",
    description: "Erstes Padel-Match",
    icon: "🏸",
  },
  social_butterfly: {
    label: "Social Butterfly",
    description: "10 verschiedene Partner",
    icon: "🦋",
  },
  streak_master: {
    label: "Streak Master",
    description: "7-Tage-Streak erreicht",
    icon: "🔥",
  },
  win_streak_3: {
    label: "Winning Streak",
    description: "3-Tage-Streak mit Siegen",
    icon: "🏆",
  },
};

// ============================================================
//  ONBOARDING STATE (client-seitig)
// ============================================================
export interface OnboardingState {
  step: number; // 1–12
  language: "de" | "en";
  sports: Sport[];
  city: string;
  latitude: number | null;
  longitude: number | null;
  country: string;
  club_id: string | null;
  club_name: string | null;
  first_name: string;
  last_name: string; // Pflicht im Tour-Modus (Nachname)
  age: number | null;
  birthdate: string; // ISO yyyy-mm-dd (für /map-Übernahme)
  gender: "male" | "female" | null;
  skill_level: SkillLevel | null;
  official_rating: string;
  // Weltweite Tennis-Rankings (optional) — werden ins /map-Profil übernommen.
  atp: number | null;
  wta: number | null;
  itf: number | null; // ITF World Tennis Number (WTN)
  utr: number | null;
  height_cm: number | null;
  goals: string[];
  photos: File[]; // lokale File-Objekte vor Upload
  photo_urls: string[]; // nach Upload: Public-URLs
  bio: string;
  visibility_gender: string[];
  visibility_age_min: number;
  visibility_age_max: number;
  // Dual-Mode Fork + Tour-Pfad
  onb_mode: "play" | "tour" | null;
  circuit: Circuit | null;
  tour_ranking: number | null;
  tour_points: number | null;
  passports: string[]; // Nationalitäten (Pässe)
  tax_residence: string;
  esta_status: string | null; // 'ESTA' | 'B-1' | 'P-1' | 'None'
  esta_date: string; // ISO yyyy-mm-dd (Ablauf)
  team: TeamMember[];
  season_budget: number | null; // Saisonbudget (optional)
  calendar_connected: boolean;
}

// ============================================================
//  EVENT (öffentliche Community-Events / Turniere / Spieltreffs)
// ============================================================
export interface EventItem {
  id: string;
  created_by: string | null;
  creator_name: string | null;
  sport: Sport;
  title: string;
  short_description: string;
  description: string | null;
  image_url: string | null;
  location: string;
  latitude: number | null;
  longitude: number | null;
  event_date: string | null; // ISO timestamp
  max_participants: number;
  participants_count?: number; // öffentliche Zählung (Spalte, per Trigger gepflegt)
  status: string;
  created_at: string;
  // Eingebettet / clientseitig (nur eigene Zeile dank RLS):
  participants?: { id: string; user_id: string }[];
  _distance?: number;
}

// ── Eigener Turnier-Datenstamm (web.tour_tournaments / web.tour_tournament_claims) ──
// Passend zu supabase/web_tour_tournaments.sql. Nur Typen — keine Queries hier.

/** Aufgelöster Turnierstamm, eine Zeile je Turnier (web.tour_tournaments). */
export interface TourTournament {
  id: string;
  source_ref: string; // stabile, quellenübergreifende ID (z. B. "itf:m-itf-tun-2025-032") — NOT NULL, UNIQUE
  tournament_monday: string; // date (ISO yyyy-mm-dd) — Bezugspunkt für alle Fristen
  series: "itf_wtt" | "challenger";
  category: string | null; // M15/M25/Challenger NN — frei (kein starrer CHECK)
  category_recognized: boolean; // generiert: liegt category im bekannten Katalog?
  name: string | null; // bei ITF oft leer
  city: string | null;
  country: string | null; // ISO 3166-1 alpha-2
  latitude: number | null;
  longitude: number | null;
  surface: "clay" | "hard" | "grass" | "carpet" | null;
  indoor: boolean | null; // true=Halle, false=Freiluft, null=unbekannt
  // numeric-Spalte: PostgREST liefert numeric als String → hier ehrlich als string.
  // Die Umwandlung in number passiert später an der Abfragestelle, nicht im Typ.
  prize_money: string | null;
  prize_currency: string | null; // ISO 4217
  website: string | null;
  status: "planned" | "confirmed" | "cancelled" | "moved";
  valid_from: string; // ISO timestamp
  valid_to: string | null; // null = aktiv (Soft-Delete)
  created_at: string;
  updated_at: string;
}

/** Einzelbehauptung je Feld + Quelle (web.tour_tournament_claims). Nur service_role sichtbar. */
export interface TourTournamentClaim {
  id: string;
  tournament_id: string; // FK → tour_tournaments.id
  field_name: string; // Feld des Stamms, z. B. "city", "surface", "category"
  field_value: string; // Wert immer als Text (feldübergreifend serialisiert)
  source: string; // Quellbezeichner, z. B. "wikipedia_itf_2026_q1"
  source_url: string | null;
  observed_at: string; // ISO timestamp — Erfassungszeitpunkt
  // numeric-Spalte: PostgREST liefert numeric als String → hier ehrlich als string
  // (number wäre eine Lüge im Typ). Coercion später an der Abfragestelle.
  confidence: string; // 0..1
  created_at: string;
}

/** Ein Saisonplan-Eintrag (web.tour_season_plan): Nutzer nimmt ein Turnier aus
 *  web.tour_tournaments auf. RLS: nur eigene Zeilen. Getrennt von web.tour_plan. */
// Entry-Lebenszyklus (eine Achse): geplant → gemeldet → Hauptfeld|Quali|Alternate →
// zurückgezogen. confirmed|cancelled sind LEGACY (altes /tour/season) und werden nicht
// mehr neu vergeben. Selbstauskunft des Spielers aus IPIN/PlayerZone (kein Live-Abruf).
export type TourEntryStatus =
  | "planned" | "entered" | "main_draw" | "qualifying" | "alternate" | "withdrawn"
  | "confirmed" | "cancelled";

// Entscheidung des Spielers je Turnier (Wochen-Pipeline): spielen|warten|Ausweichturnier|offen.
export type TourDecision = "play" | "wait" | "fallback" | "open";

export interface TourSeasonPlanEntry {
  id: string;
  user_id: string; // FK → profiles.id (Eigentümer)
  tournament_id: string; // FK → tour_tournaments.id (on delete restrict)
  status: TourEntryStatus;
  decision: TourDecision; // Vorgabe 'open'
  // Nachrücker-Position (1..999), NUR bei status='alternate' gesetzt. Aktueller Wert;
  // der Verlauf liegt in web.tour_entry_events (TourEntryEvent).
  alternate_position: number | null;
  fee_paid: boolean; // Meldegebühr bezahlt (Selbstauskunft)
  note: string | null; // freie Notiz des Nutzers
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

/** Eine vom Spieler festgehaltene Beobachtung (append-only Verlauf, web.tour_entry_events). */
export interface TourEntryEvent {
  id: string;
  user_id: string; // FK → profiles.id (Eigentümer)
  plan_id: string; // FK → tour_season_plan.id (on delete cascade)
  observed_at: string; // ISO-Datum (YYYY-MM-DD): „Stand vom"
  status: TourEntryStatus;
  alternate_position: number | null;
  note: string | null;
  created_at: string; // ISO timestamp
}

/** Kostensätze eines Nutzers (web.tour_cost_rates): Eingabe für src/domain/tour/costs.ts.
 *  Beträge in ganzzahligen Minor Units (Cent) — integer kommt via PostgREST als number
 *  (anders als numeric, das als string käme). NULL = „unbekannt", nicht null Euro.
 *  RLS: nur eigene Zeile; höchstens ein Satz je Nutzer (user_id ist PK). */
export interface TourCostRates {
  user_id: string; // FK → profiles.id (PK, 1:1)
  arrival_minor: number | null; // Anreise zu neuem Ort, in Cent
  per_night_minor: number | null; // pro Übernachtung, in Cent
  food_per_day_minor: number | null; // Verpflegung pro Tag, in Cent
  coach_per_week_minor: number | null; // optional: Coach-Anteil pro Woche, in Cent
  currency: string | null; // ISO 4217; gesetzt, sobald ein Betrag gesetzt ist (CHECK)
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

/** Ein tatsächlicher Aufenthalt (web.tour_stays): Eingabe für src/domain/tour/schengen.ts.
 *  NUR confirmed=true zählt in die 90/180-Rechnung. exit_date NULL = offener Aufenthalt
 *  (bis zum Stichtag gezählt). RLS: nur eigene Zeilen. */
export interface TourStay {
  id: string;
  user_id: string; // FK → profiles.id (Eigentümer)
  country: string; // ISO 3166-1 alpha-2
  entry_date: string; // ISO date (Einreisetag, zählt voll)
  exit_date: string | null; // ISO date (Ausreisetag, zählt voll) oder null = offen
  confirmed: boolean; // true erst nach bewusster Bestätigung; Vorschläge sind false
  source_ref: string | null; // Herkunftsschlüssel eines Saisonplan-Vorschlags (Idempotenz), null = manuell
  note: string | null;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

/** Normierte Einreise-Klasse (web.tour_visa_requirements.requirement_class).
 *  'admission_refused' ist KEINE Visumsart, sondern eine Einreisesperre — eigene Klasse:
 *  der Optimierer schlägt solche Länder nicht vor, die Anzeige nennt kein Antrag. */
export type VisaRequirementClass =
  | "visa_free"
  | "evisa"
  | "visa_on_arrival"
  | "eta"
  | "visa_required"
  | "admission_refused";

/** Eine Zeile des nationalitätsabhängigen Visa-Bestands (web.tour_visa_requirements):
 *  je (Nationalität × Zielland) eine normierte Klasse aus Wikipedia. Referenz, KEINE
 *  amtliche Auskunft. RLS: authenticated liest, service_role schreibt. */
export interface TourVisaRequirement {
  id: string;
  nationality: string; // ISO 3166-1 alpha-2 (Staatsbürgerschaft)
  destination: string; // ISO 3166-1 alpha-2 (Zielland)
  requirement_class: VisaRequirementClass;
  allowed_stay_days: number | null; // erlaubte Aufenthaltsdauer in Tagen; NULL = nicht angegeben
  source_url: string; // Quelllink (die Wikipedia-Seite)
  source_revised_at: string | null; // ISO timestamp: wann die Seite zuletzt geändert wurde
  imported_at: string; // ISO timestamp: wann wir importiert haben
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

/** Art eines eigenen Reisedokuments. ESTA und eTA getrennt (Nutzersicht), obwohl der
 *  Bestand beide grob als requirement_class 'eta' führt. */
export type TravelDocKind = "esta" | "eta" | "schengen_visa" | "national_visa" | "other";
/** Besitzstand eines Reisedokuments: habe ich · beantragt · nicht vorhanden. */
export type TravelDocStatus = "have" | "applied" | "none";

/** Ein eigenes Reisedokument des Spielers (web.tour_travel_document, owner-only).
 *  scope = ISO-3166-1 alpha-2 Zielland ODER 'SCHENGEN' (Raum); deckt der Bereich das
 *  Turnierland, gilt das Dokument. KEINE Dokumentnummer — dieselbe Regel wie beim Pass. */
export interface TourTravelDocument {
  id: string;
  user_id: string;
  kind: TravelDocKind;
  scope: string | null; // ISO2 oder 'SCHENGEN'; null nur bei kind='other'
  valid_until: string | null; // ISO-Datum „gültig bis"; null bei beantragt/nicht vorhanden
  status: TravelDocStatus;
  lead_weeks: number | null; // Nutzerangabe: Vorlaufzeit des Antrags in Wochen (für die Warnung)
  note: string | null; // Freitext für „sonstiges"; KEINE Nummer
  created_at: string;
  updated_at: string;
}

// Filter-State für Discover
export interface FilterState {
  sports: Sport[];
  gender: "male" | "female" | null;
  ageMin: number;
  ageMax: number;
  radius: number;
  skillLevels: SkillLevel[];
  clubId: string | null;
  clubName: string | null;
}

export const defaultFilters: FilterState = {
  sports: [],
  gender: null,
  ageMin: 18,
  ageMax: 60,
  radius: 201, // 201 = weltweit (kein Distanz-Limit) — Nutzer sehen von Anfang an andere; Filtern jederzeit möglich
  skillLevels: [],
  clubId: null,
  clubName: null,
};

/** Wettkampf-/Tour-Profil (1:1 zum User) — Tabelle web.tour_profiles. */
export type Circuit = "atp" | "challenger" | "itf" | "wta";
export interface TeamMember {
  role: string; // coach | physio | agent | hitting_partner | sc
  name: string;
  email?: string | null;
}
export interface TourProfile {
  user_id: string;
  circuit: Circuit | null;
  ranking: number | null;
  points: number | null;
  passports: string[];
  tax_residence: string | null;
  esta_status: string | null;
  esta_expiry: string | null; // ISO yyyy-mm-dd
  last_event_date: string | null; // ISO — letztes Turnier vor der Verletzung (für Protected Ranking)
  injury_months: number | null; // Dauer der Verletzungspause in Monaten
  team: TeamMember[];
  season_budget: number | null; // Saisonbudget (optional)
  circuits: string[]; // verfolgte Circuits (pro/itf/national_ch/juniors/seniors/utr/padel)
  age_category: string | null; // Open | U12 … | 35+ …
  calendar_connected: boolean;
  created_at?: string;
  updated_at?: string;
}

// ── Schläger-Katalog (web.rackets / web.racket_claims) ──────────────────────
// Passend zu supabase/web_rackets.sql. Nur Typen — keine Queries hier.
// ACHSEN-BEFUND: Die 7 Testwerte (puissance … stabilite) sind eine ANDERE
// Taxonomie als die Finder-Achsen in src/domain/equipment/racket.ts, auf denen
// scoreV1 rechnet. Keine 1:1-Zuordnung → dieser Katalog liefert zunächst nur
// Anzeigedaten, keine Finder-Eingaben. Eine Brücke wäre ein späterer Schritt.
// PostgREST: integer kommt als number, numeric als string (deshalb unten getrennt).

/** Aufgelöster Schläger-Stamm, eine Zeile je Shop-Produkt (web.rackets).
 *  Name bewusst „CatalogRacket" — grenzt den Shop-Katalog vom Finder-Domänentyp
 *  `Racket` in src/domain/equipment/racket.ts ab (andere Taxonomie, s. o.). */
export interface CatalogRacket {
  id: string;
  shop_product_id: number; // PrestaShop id_product — NOT NULL, UNIQUE (integer → number)
  name: string | null;
  brand: string | null;
  sku: string | null;
  // 7 Testwerte 0–100 (integer → number). NULL = im Shop nicht gepflegt.
  puissance: number | null; // Power
  controle: number | null; // Kontrolle
  confort: number | null; // Komfort
  prise_deffet: number | null; // Spin (Prise d'effet)
  tolerance: number | null; // Toleranz
  maniabilite: number | null; // Handling
  stabilite: number | null; // Stabilität
  // Gesamtscore — numeric-Spalte → PostgREST liefert String. Coercion an der Abfragestelle.
  score: string | null;
  price_minor: number | null; // Preis in Cent (integer → number). NULL = unbekannt.
  price_currency: string | null; // ISO 4217; gesetzt, sobald price_minor gesetzt ist (CHECK)
  // Technik — ALLE nullable, NULL = „nicht gepflegt". integer → number, numeric → string.
  weight_g: number | null; // Gewicht unbesaitet, Gramm
  balance_cm: string | null; // Balance, cm (numeric)
  head_size_sqcm: number | null; // Kopfgröße, cm² (Tamis)
  string_pattern: string | null; // Besaitungsbild, z. B. "16x19"
  stiffness_ra: number | null; // Steifigkeit, RA (Rigidité)
  inertia: string | null; // Inertie (numeric)
  profile: string | null; // Profil, z. B. "23/26/21 mm"
  twistweight: string | null; // Twistweight (numeric)
  length_cm: string | null; // Länge, cm (numeric)
  recoil_weight: string | null; // Recoil Weight (numeric)
  plow_through: string | null; // Plow-Through (numeric)
  product_url: string | null; // kanonische Produktseiten-Adresse
  valid_from: string; // ISO timestamp
  valid_to: string | null; // null = aktiv (Soft-Delete)
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

/** Einzelbehauptung je Feld + Quelle (web.racket_claims). Nur service_role sichtbar. */
export interface CatalogRacketClaim {
  id: string;
  racket_id: string; // FK → rackets.id
  field_name: string; // Feld des Stamms, z. B. "puissance", "weight_g"
  field_value: string; // Wert immer als Text (feldübergreifend serialisiert)
  source: string; // Quellbezeichner, z. B. "extreme-tennis:24005"
  source_url: string | null;
  observed_at: string; // ISO timestamp — Erfassungszeitpunkt
  // numeric-Spalte → PostgREST liefert String. Coercion später an der Abfragestelle.
  confidence: string; // 0..1
  created_at: string;
}
