// ============================================================
//  PROFILE
// ============================================================
export interface Profile {
  id: string; // = auth.users.id (UUID)
  apple_id: string | null;
  google_id: string | null;
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
  sports: Sport[]; // PostgreSQL array, CHECK length >= 1
  skill_level: SkillLevel;
  official_rating: string | null;
  match_score?: number; // MatchScore (Elo), default 1000 — Migration game_results
  matches_rated?: number; // Anzahl gewerteter Matches (Kalibrierung)
  goals: string[]; // PostgreSQL array
  bio: string | null; // max 300 chars
  profile_image: string | null; // URL zu avatars-Bucket
  additional_images: string[]; // bis zu 3 weitere URLs
  visibility_gender: string[]; // ['male'], ['female'], ['male','female']
  visibility_age_min: number; // default 18
  visibility_age_max: number; // default 99
  is_paused: boolean; // default false
  is_verified: boolean; // default false
  is_banned: boolean; // default false
  is_seed: boolean; // default false, Migration 021
  report_count: number; // default 0
  pause_reason: string | null;
  banned_at: string | null; // ISO timestamp
  daily_likes_count: number; // default 0
  daily_likes_reset: string | null; // ISO timestamp
  device_fingerprint: string | null;
  push_matches: boolean; // default true
  push_messages: boolean; // default true
  push_reminders: boolean; // default true
  push_community: boolean; // default true
  public_posts: boolean; // default true, Migration 018
  fcm_token: string | null;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
  last_active: string; // ISO timestamp
  _distance?: number; // client-seitiges Hilfsfeld (Discover-Sortierung)
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
  likes_count: number; // Migration 016, Trigger-maintained
  comments_count: number; // Migration 016
  created_at: string;
  // Joined:
  author?: Profile;
  is_liked_by_me?: boolean;
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
  age: number | null;
  gender: "male" | "female" | null;
  skill_level: SkillLevel | null;
  official_rating: string;
  height_cm: number | null;
  goals: string[];
  photos: File[]; // lokale File-Objekte vor Upload
  photo_urls: string[]; // nach Upload: Public-URLs
  bio: string;
  visibility_gender: string[];
  visibility_age_min: number;
  visibility_age_max: number;
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
  status: string;
  created_at: string;
  // Eingebettet / clientseitig:
  participants?: { id: string; user_id: string }[];
  _distance?: number;
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
