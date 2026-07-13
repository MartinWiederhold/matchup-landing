import type { OnboardingState, Sport, SkillLevel, Circuit, TeamMember } from "@/lib/types";

export const initialOnboardingState: OnboardingState = {
  step: 1,
  language: "de",
  sports: [],
  city: "",
  latitude: null,
  longitude: null,
  country: "CH",
  club_id: null,
  club_name: null,
  first_name: "",
  last_name: "",
  age: null,
  birthdate: "",
  gender: null,
  skill_level: null,
  official_rating: "",
  atp: null,
  wta: null,
  itf: null,
  utr: null,
  height_cm: null,
  goals: [],
  photos: [],
  photo_urls: [],
  bio: "",
  visibility_gender: ["male", "female"],
  visibility_age_min: 18,
  visibility_age_max: 99,
  onb_mode: null,
  circuit: null,
  tour_ranking: null,
  tour_points: null,
  passports: [],
  tax_residence: "",
  esta_status: null,
  esta_date: "",
  team: [],
  season_budget: null,
  calendar_connected: false,
};

/** Step-IDs in Reihenfolge. Gemeinsam bis zur Gabelung, dann je nach Modus. */
export type StepId =
  | "welcome" | "language" | "sports" | "location" | "services" | "club" | "identity" | "fork"
  | "skill" | "height" | "goals" | "photos"
  | "circuit" | "ranking" | "budget" | "passport" | "team" | "calendar";

// Fork (Play/Tour) kommt FRÜH — direkt nach Welcome + Sprache. Danach sammeln
// beide Pfade die für das Profil nötigen Daten (Sport/Ort/Club/Identität, DB-Pflicht)
// plus ihre modus-spezifischen Schritte.
const PRE: StepId[] = ["welcome", "language", "fork"];
const PLAY: StepId[] = ["sports", "location", "club", "identity", "skill", "height", "goals", "photos"];
// Tour: kein Sport-Schritt (Tour = Tennis, automatisch gesetzt), kein Club- und
// kein Services-Schritt (Services gibt's in der App; leerer Screen wirkt schlecht).
const TOUR: StepId[] = ["location", "identity", "circuit", "ranking", "budget", "passport", "team", "calendar", "photos"];

/** Sichtbare Schritte je nach gewähltem Modus. */
export function visibleSteps(state: OnboardingState): StepId[] {
  if (state.onb_mode === "play") return [...PRE, ...PLAY];
  if (state.onb_mode === "tour") return [...PRE, ...TOUR];
  return PRE; // vor der Gabelung endet es beim Fork
}

export function currentStepId(state: OnboardingState): StepId {
  const steps = visibleSteps(state);
  return steps[Math.min(state.step, steps.length) - 1];
}

export function totalSteps(state: OnboardingState): number {
  return visibleSteps(state).length;
}

/** Alter aus ISO-Geburtsdatum (yyyy-mm-dd). null wenn ungültig. */
export function ageFromBirthdate(iso: string): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  let a = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) a--;
  return a;
}

export type Action =
  | { type: "SET_LANGUAGE"; payload: "de" | "en" }
  | { type: "SET_SPORTS"; payload: Sport[] }
  | {
      type: "SET_LOCATION";
      payload: { city: string; lat: number; lng: number; country: string };
    }
  | { type: "SET_CLUB"; payload: { id: string | null; name: string | null } }
  | { type: "SET_NAME"; payload: string }
  | { type: "SET_LASTNAME"; payload: string }
  | { type: "SET_AGE"; payload: number }
  | { type: "SET_BIRTHDATE"; payload: string }
  | { type: "SET_RANKINGS"; payload: Partial<Pick<OnboardingState, "atp" | "wta" | "itf" | "utr">> }
  | { type: "SET_GENDER"; payload: "male" | "female" }
  | { type: "SET_SKILL"; payload: SkillLevel }
  | { type: "SET_RATING"; payload: string }
  | { type: "SET_HEIGHT"; payload: number | null }
  | { type: "SET_GOALS"; payload: string[] }
  | { type: "ADD_PHOTO"; payload: File }
  | { type: "REMOVE_PHOTO"; payload: number }
  | { type: "REORDER_PHOTOS"; payload: File[] }
  | { type: "SET_BIO"; payload: string }
  | {
      type: "SET_VISIBILITY";
      payload: { gender: string[]; ageMin: number; ageMax: number };
    }
  | { type: "SET_MODE"; payload: "play" | "tour" }
  | { type: "SET_CIRCUIT"; payload: Circuit }
  | { type: "SET_TOUR_RANKING"; payload: number | null }
  | { type: "SET_TOUR_POINTS"; payload: number | null }
  | { type: "SET_PASSPORTS"; payload: string[] }
  | { type: "SET_TAX_RESIDENCE"; payload: string }
  | { type: "SET_ESTA"; payload: { status?: string | null; date?: string } }
  | { type: "SET_TEAM"; payload: TeamMember[] }
  | { type: "SET_BUDGET"; payload: number | null }
  | { type: "SET_CALENDAR"; payload: boolean }
  | { type: "NEXT_STEP" }
  | { type: "PREV_STEP" };

export function onboardingReducer(
  state: OnboardingState,
  action: Action,
): OnboardingState {
  switch (action.type) {
    case "SET_LANGUAGE":
      return { ...state, language: action.payload };
    case "SET_SPORTS":
      return { ...state, sports: action.payload };
    case "SET_LOCATION":
      return {
        ...state,
        city: action.payload.city,
        latitude: action.payload.lat,
        longitude: action.payload.lng,
        country: action.payload.country,
      };
    case "SET_CLUB":
      return {
        ...state,
        club_id: action.payload.id,
        club_name: action.payload.name,
      };
    case "SET_NAME":
      return { ...state, first_name: action.payload };
    case "SET_LASTNAME":
      return { ...state, last_name: action.payload };
    case "SET_AGE":
      return { ...state, age: action.payload };
    case "SET_BIRTHDATE":
      return { ...state, birthdate: action.payload, age: ageFromBirthdate(action.payload) };
    case "SET_RANKINGS":
      return { ...state, ...action.payload };
    case "SET_GENDER":
      return { ...state, gender: action.payload };
    case "SET_SKILL":
      return { ...state, skill_level: action.payload };
    case "SET_RATING":
      return { ...state, official_rating: action.payload };
    case "SET_HEIGHT":
      return { ...state, height_cm: action.payload };
    case "SET_GOALS":
      return { ...state, goals: action.payload };
    case "ADD_PHOTO":
      return { ...state, photos: [...state.photos, action.payload].slice(0, 4) };
    case "REMOVE_PHOTO":
      return {
        ...state,
        photos: state.photos.filter((_, i) => i !== action.payload),
      };
    case "REORDER_PHOTOS":
      return { ...state, photos: action.payload };
    case "SET_BIO":
      return { ...state, bio: action.payload };
    case "SET_VISIBILITY":
      return {
        ...state,
        visibility_gender: action.payload.gender,
        visibility_age_min: action.payload.ageMin,
        visibility_age_max: action.payload.ageMax,
      };
    case "SET_MODE":
      // Tour = nur Tennis → Sport automatisch setzen (kein Sport-Schritt im Tour-Pfad).
      return { ...state, onb_mode: action.payload, sports: action.payload === "tour" ? ["tennis"] : state.sports };
    case "SET_CIRCUIT":
      return { ...state, circuit: action.payload };
    case "SET_TOUR_RANKING":
      return { ...state, tour_ranking: action.payload };
    case "SET_TOUR_POINTS":
      return { ...state, tour_points: action.payload };
    case "SET_PASSPORTS":
      return { ...state, passports: action.payload };
    case "SET_TAX_RESIDENCE":
      return { ...state, tax_residence: action.payload };
    case "SET_ESTA":
      return {
        ...state,
        esta_status: action.payload.status !== undefined ? action.payload.status : state.esta_status,
        esta_date: action.payload.date !== undefined ? action.payload.date : state.esta_date,
      };
    case "SET_TEAM":
      return { ...state, team: action.payload };
    case "SET_BUDGET":
      return { ...state, season_budget: action.payload };
    case "SET_CALENDAR":
      return { ...state, calendar_connected: action.payload };
    case "NEXT_STEP":
      return { ...state, step: Math.min(totalSteps(state), state.step + 1) };
    case "PREV_STEP":
      return { ...state, step: Math.max(1, state.step - 1) };
    default:
      return state;
  }
}

/** Validierung pro Schritt — bestimmt, ob der Weiter-Button aktiv ist. */
export function isStepValid(state: OnboardingState): boolean {
  switch (currentStepId(state)) {
    case "welcome":
      return true;
    case "language":
      return state.language === "de" || state.language === "en";
    case "sports":
      return state.sports.length >= 1;
    case "location":
      return (
        state.latitude !== null &&
        state.longitude !== null &&
        state.city.trim().length > 0
      );
    case "services":
      return true; // reine Discovery — überspringbar
    case "club":
      return true; // Club optional (bleibt im Play-Pfad erhalten)
    case "identity":
      return (
        state.first_name.trim().length >= 2 &&
        state.age !== null && state.age >= 18 && state.age <= 100 &&
        state.gender !== null &&
        // Tour: Nachname Pflicht.
        (state.onb_mode !== "tour" || state.last_name.trim().length >= 2)
      );
    case "fork":
      return state.onb_mode !== null;
    // Play
    case "skill":
      return state.skill_level !== null;
    case "height":
      return true; // optional
    case "goals":
      return state.goals.length >= 1;
    // Tour
    case "circuit":
      // Pro-Circuit ODER nationale Klassierung genügt.
      return state.circuit !== null || state.official_rating.trim().length > 0;
    case "ranking":
      return true; // optional — Ranking/Punkte können später ergänzt werden
    case "budget":
      return true; // optional — später im Profil möglich
    case "passport":
      return true; // optional — später im Profil möglich
    case "team":
      return true; // optional
    case "calendar":
      return true; // optional (Skip erlaubt)
    // Gemeinsam am Ende
    case "photos":
      return state.photos.length >= 1;
    default:
      return false;
  }
}
