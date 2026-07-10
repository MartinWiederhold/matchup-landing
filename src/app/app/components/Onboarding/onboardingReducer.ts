import type { OnboardingState, Sport, SkillLevel } from "@/lib/types";

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
};

export const TOTAL_STEPS = 10;

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
    case "NEXT_STEP":
      return { ...state, step: Math.min(TOTAL_STEPS, state.step + 1) };
    case "PREV_STEP":
      return { ...state, step: Math.max(1, state.step - 1) };
    default:
      return state;
  }
}

/** Validierung pro Schritt — bestimmt, ob der Weiter-Button aktiv ist. */
export function isStepValid(state: OnboardingState): boolean {
  switch (state.step) {
    case 1:
      return true; // Willkommen
    case 2:
      return state.language === "de" || state.language === "en";
    case 3:
      return state.sports.length >= 1;
    case 4:
      return (
        state.latitude !== null &&
        state.longitude !== null &&
        state.city.trim().length > 0
      );
    case 5:
      return true; // Club optional
    case 6:
      // Name + Alter + Geschlecht auf einer Seite
      return (
        state.first_name.trim().length >= 2 &&
        state.age !== null && state.age >= 18 && state.age <= 100 &&
        state.gender !== null
      );
    case 7:
      return state.skill_level !== null;
    case 8:
      return true; // Grösse optional
    case 9:
      return state.goals.length >= 1;
    case 10:
      return state.photos.length >= 1;
    default:
      return false;
  }
}
