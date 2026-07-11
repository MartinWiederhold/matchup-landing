"use client";

import { useEffect, useReducer, useRef, useState, type ComponentType } from "react";
import { useAuth } from "@/lib/auth";
import { useT } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { compressImage } from "@/lib/utils/imageCompress";
import {
  searchClubs as searchClubsApi,
  searchClubsLive,
  saveClubCandidate,
  addClub,
  countryName,
  type ClubCandidate,
} from "@/lib/clubs";
import type { Sport, SkillLevel } from "@/lib/types";
import {
  SportIcon,
  TennisIcon,
  PadelIcon,
  PickleballIcon,
  MapPinIcon,
  CheckIcon,
  TargetIcon,
  TrophyIcon,
  UsersIcon,
  ActivityIcon,
  CalendarIcon,
} from "../shared/icons";
import AvatarCropper from "../shared/AvatarCropper";
import {
  onboardingReducer,
  initialOnboardingState,
  isStepValid,
  currentStepId,
  totalSteps,
} from "./onboardingReducer";
import { saveTourProfile } from "@/lib/tour";

const SPORTS: { value: Sport; labelKey: string }[] = [
  { value: "tennis", labelKey: "onboarding.sportTennis" },
  { value: "padel", labelKey: "onboarding.sportPadel" },
  { value: "pickleball", labelKey: "onboarding.sportPickleball" },
];

const SKILLS: {
  value: SkillLevel;
  labelKey: string;
  descKey: string;
  dot: string;
}[] = [
  { value: "beginner", labelKey: "onboarding.skillBeginner", descKey: "onboarding.skillBeginnerDesc", dot: "bg-green-500" },
  { value: "intermediate", labelKey: "onboarding.skillIntermediate", descKey: "onboarding.skillIntermediateDesc", dot: "bg-yellow-500" },
  { value: "advanced", labelKey: "onboarding.skillAdvanced", descKey: "onboarding.skillAdvancedDesc", dot: "bg-orange-500" },
  { value: "competitive", labelKey: "onboarding.skillCompetitive", descKey: "onboarding.skillCompetitiveDesc", dot: "bg-amber-500" },
];

const GOALS: {
  value: string;
  labelKey: string;
  Icon: ComponentType<{ size?: number; className?: string }>;
}[] = [
  { value: "fun", labelKey: "onboarding.goalFun", Icon: TargetIcon },
  { value: "competitive", labelKey: "onboarding.goalCompetitive", Icon: TrophyIcon },
  { value: "training", labelKey: "onboarding.goalTraining", Icon: TennisIcon },
  { value: "social", labelKey: "onboarding.goalSocial", Icon: UsersIcon },
  { value: "fitness", labelKey: "onboarding.goalFitness", Icon: ActivityIcon },
  { value: "regular", labelKey: "onboarding.goalRegular", Icon: CalendarIcon },
];

const RATINGS_DE = Array.from({ length: 23 }, (_, i) => `LK ${i + 1}`);

// Länder-Auswahl für das nationale Tennis-Ranking.
const RANK_COUNTRIES: { code: string; name: string }[] = [
  { code: "CH", name: "Schweiz" },
  { code: "DE", name: "Deutschland" },
  { code: "AT", name: "Österreich" },
  { code: "US", name: "USA" },
  { code: "FR", name: "Frankreich" },
  { code: "GB", name: "Grossbritannien" },
  { code: "ES", name: "Spanien" },
  { code: "IT", name: "Italien" },
  { code: "OTHER", name: "Anderes / International" },
];

// Nationales Ranking-System je Land (Richtwerte). options = Auswahl, sonst Freitext.
function nationalRankSystem(code: string): { label: string; options?: string[]; placeholder?: string } {
  switch (code) {
    case "DE": return { label: "LK (Leistungsklasse)", options: RATINGS_DE };
    case "CH": return { label: "Swiss Tennis (R/N)", options: ["R9", "R8", "R7", "R6", "R5", "R4", "R3", "R2", "R1", "N4", "N3", "N2", "N1"] };
    case "AT": return { label: "ITN (Österreich)", options: Array.from({ length: 10 }, (_, i) => `ITN ${10 - i}`) };
    case "US": return { label: "NTRP", options: ["1.0", "1.5", "2.0", "2.5", "3.0", "3.5", "4.0", "4.5", "5.0", "5.5", "6.0", "6.5", "7.0"] };
    case "FR": return { label: "Classement FFT", placeholder: "z. B. 30/1, 15, 5/6, -30" };
    case "ES": return { label: "RFET", placeholder: "z. B. 1.ª categoría" };
    case "IT": return { label: "FIT", placeholder: "z. B. 2.6, 3.1, 4.NC" };
    case "GB": return { label: "LTA", placeholder: "z. B. WTN 12" };
    default: return { label: "Nationales Ranking", placeholder: "Frei eintragen" };
  }
}

type NominatimResult = {
  display_name: string;
  lat: string;
  lon: string;
  address?: { country_code?: string };
};

export default function OnboardingFlow() {
  const { user, refreshProfile } = useAuth();
  const t = useT();
  // Fortschritt aus sessionStorage wiederherstellen → ein (versehentlicher) Remount
  // wirft den Nutzer nicht mehr auf Schritt 1 zurück. Fotos (File[]) sind nicht
  // serialisierbar und werden bewusst nicht persistiert.
  const [state, dispatch] = useReducer(
    onboardingReducer,
    initialOnboardingState,
    (init) => {
      if (typeof window === "undefined") return init;
      try {
        const raw = window.sessionStorage.getItem("mu_onboarding");
        if (raw) return { ...init, ...JSON.parse(raw), photos: [] };
      } catch {
        /* ignore */
      }
      return init;
    },
  );
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  // Foto, das gerade im Kreis-Cropper justiert wird (vor ADD_PHOTO).
  const [cropFile, setCropFile] = useState<File | null>(null);

  // Fortschritt bei jeder Änderung sichern (ohne File-Objekte).
  useEffect(() => {
    try {
      window.sessionStorage.setItem(
        "mu_onboarding",
        JSON.stringify({ ...state, photos: [] }),
      );
    } catch {
      /* ignore */
    }
  }, [state]);

  // Location
  const [locQuery, setLocQuery] = useState("");
  const [locResults, setLocResults] = useState<NominatimResult[]>([]);
  const [locLoading, setLocLoading] = useState(false);

  // Clubs
  const [clubQuery, setClubQuery] = useState("");
  const [clubResults, setClubResults] = useState<ClubCandidate[]>([]);
  const [clubSearching, setClubSearching] = useState(false);
  const [savingClub, setSavingClub] = useState(false);
  const clubReq = useRef(0); // verwirft veraltete Suchantworten
  const clubTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [showAddClub, setShowAddClub] = useState(false);
  const [addName, setAddName] = useState("");
  const [addCity, setAddCity] = useState("");
  const [addingClub, setAddingClub] = useState(false);
  const [clubMsg, setClubMsg] = useState<string | null>(null);

  // Ranking-Schritt
  const [rankCountry, setRankCountry] = useState(state.country);
  const [ratingNote, setRatingNote] = useState("");
  const [rankInfo, setRankInfo] = useState(false);
  const numOrNull = (v: string) => (v.trim() === "" ? null : Number(v));

  async function searchLocation(q: string) {
    setLocQuery(q);
    if (q.trim().length < 3) {
      setLocResults([]);
      return;
    }
    setLocLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=5`,
      );
      setLocResults(await res.json());
    } catch {
      setLocResults([]);
    } finally {
      setLocLoading(false);
    }
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
        );
        const data = await res.json();
        const city =
          data.address?.city ||
          data.address?.town ||
          data.address?.village ||
          t("onboarding.myLocation");
        dispatch({
          type: "SET_LOCATION",
          payload: {
            city,
            lat: latitude,
            lng: longitude,
            country: (data.address?.country_code || "ch").toUpperCase(),
          },
        });
      } catch {
        dispatch({
          type: "SET_LOCATION",
          payload: {
            city: t("onboarding.myLocation"),
            lat: latitude,
            lng: longitude,
            country: "CH",
          },
        });
      }
    });
  }

  function handleClubSearch(q: string) {
    setClubQuery(q);
    const token = ++clubReq.current;
    if (q.trim().length < 2) {
      setClubResults([]);
      setClubSearching(false);
      return;
    }
    // 1) Eigene DB sofort (schnell)
    searchClubsApi(q, state.country).then((db) => {
      if (token === clubReq.current) setClubResults(db);
    });
    // 2) OSM weltweit live, leicht verzögert + dazu mergen
    setClubSearching(true);
    clearTimeout(clubTimer.current);
    clubTimer.current = setTimeout(async () => {
      const live = await searchClubsLive(q, {
        lat: state.latitude,
        lng: state.longitude,
      });
      if (token !== clubReq.current) return; // veraltet
      setClubSearching(false);
      setClubResults((prev) => {
        const key = (c: ClubCandidate) =>
          `${c.name}|${c.city ?? ""}`.toLowerCase();
        const seen = new Set(prev.map(key));
        return [...prev, ...live.filter((c) => !seen.has(key(c)))].slice(0, 18);
      });
    }, 450);
  }

  async function selectClub(c: ClubCandidate) {
    // OSM-Treffer (noch ohne DB-Id) zuerst dauerhaft übernehmen
    if (c._osm || !c.id) {
      setSavingClub(true);
      const saved = await saveClubCandidate(c);
      setSavingClub(false);
      if (!saved) return;
      dispatch({ type: "SET_CLUB", payload: { id: saved.id, name: saved.name } });
      setClubQuery(saved.name);
      setClubResults([]);
      return;
    }
    dispatch({ type: "SET_CLUB", payload: { id: c.id, name: c.name } });
  }

  async function handleAddClub() {
    setAddingClub(true);
    setClubMsg(null);
    const res = await addClub(addName, addCity);
    setAddingClub(false);
    if (res.status === "added") {
      dispatch({
        type: "SET_CLUB",
        payload: { id: res.club.id, name: res.club.name },
      });
      setShowAddClub(false);
      setClubQuery(res.club.name);
      setClubResults([res.club]);
    } else if (res.status === "not_found") {
      setClubMsg(t("onboarding.clubNotVerified"));
    } else {
      setClubMsg(t("onboarding.clubError"));
    }
  }

  function toggleArray<T>(arr: T[], value: T): T[] {
    return arr.includes(value)
      ? arr.filter((v) => v !== value)
      : [...arr, value];
  }

  async function completeOnboarding() {
    if (!user) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const photoUrls: string[] = [];
      for (const photo of state.photos) {
        const compressed = await compressImage(photo);
        const path = `${user.id}/avatar_${Date.now()}_${photoUrls.length}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from("web-avatars")
          .upload(path, compressed, { contentType: "image/jpeg" });
        if (uploadError) throw uploadError;
        const {
          data: { publicUrl },
        } = supabase.storage.from("web-avatars").getPublicUrl(path);
        photoUrls.push(publicUrl);
      }

      const { error: insertError } = await supabase.from("profiles").insert({
        id: user.id,
        display_name: state.first_name,
        first_name: state.first_name,
        age: state.age!,
        gender: state.gender!,
        mode: state.onb_mode ?? "play",
        sports: state.sports.length ? state.sports : ["tennis"],
        skill_level: state.skill_level ?? "competitive",
        official_rating: [state.official_rating, ratingNote.trim()].filter(Boolean).join(" · ") || null,
        height_cm: state.height_cm,
        city: state.city,
        country: state.country,
        country_name: countryName(state.country),
        latitude: state.latitude,
        longitude: state.longitude,
        club_id: state.club_id,
        club_name_manual: state.club_id ? null : state.club_name,
        goals: state.goals,
        bio: state.bio || null,
        profile_image: photoUrls[0],
        additional_images: photoUrls.slice(1),
        visibility_gender: state.visibility_gender,
        visibility_age_min: state.visibility_age_min,
        visibility_age_max: state.visibility_age_max,
        search_radius_km: 25,
      });
      if (insertError) throw insertError;

      // Tour-Profil anlegen, wenn Tour-Pfad gewählt wurde (best effort).
      if (state.onb_mode === "tour") {
        try {
          await saveTourProfile(user.id, {
            circuit: state.circuit,
            ranking: state.tour_ranking,
            points: state.tour_points,
            passports: state.passports.filter((p) => p.trim()),
            tax_residence: state.tax_residence || null,
            esta_status: state.esta_status,
            esta_expiry: state.esta_date || null,
            team: state.team,
            calendar_connected: state.calendar_connected,
          });
        } catch {
          /* Tour-Profil ist best-effort */
        }
      }

      // Onboarding abgeschlossen → gespeicherten Fortschritt verwerfen.
      try { window.sessionStorage.removeItem("mu_onboarding"); } catch { /* ignore */ }

      // /map-Profil (player_profiles) vorbefüllen: Geburtsdatum + Rankings werden
      // dort für die Turniersuche wiederverwendet → nicht erneut eingeben.
      try {
        await supabase.from("player_profiles").upsert(
          {
            user_id: user.id,
            data: {
              firstName: state.first_name,
              nationality: state.country,
              homeCity: state.city,
              birthdate: state.birthdate,
              gender: state.gender === "female" ? "w" : "m",
              atp: state.atp,
              wta: state.wta,
              itf: state.itf,
              utr: state.utr,
            },
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" },
        );
      } catch {
        /* /map-Vorbefüllung ist best-effort */
      }

      // Willkommens-Mail (fire-and-forget — blockiert das Onboarding nie).
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.access_token) {
          void fetch("/api/welcome-email", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ firstName: state.first_name }),
          }).catch(() => {});
        }
      } catch {
        /* Mail ist optional */
      }

      await refreshProfile();
    } catch (err) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: unknown }).message)
          : t("onboarding.unknownError");
      setSubmitError(t("onboarding.profileCreateError", { msg }));
      setSubmitting(false);
    }
  }

  const cur = currentStepId(state);
  const total = totalSteps(state);
  const valid = isStepValid(state);
  const isLast = state.step === total;

  function handleNext() {
    if (!valid) return;
    if (isLast) completeOnboarding();
    else dispatch({ type: "NEXT_STEP" });
  }

  return (
    <div className="flex min-h-dvh flex-col bg-white text-neutral-900">
      {/* Progress + Header */}
      <div className="px-5 pt-5">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/[0.04]">
          <div
            className="h-full rounded-full bg-matchup transition-all duration-300"
            style={{ width: `${(state.step / total) * 100}%` }}
          />
        </div>
        <div className="mt-3 flex items-center justify-between text-sm">
          {state.step > 1 ? (
            <button
              type="button"
              onClick={() => dispatch({ type: "PREV_STEP" })}
              className="text-neutral-500"
            >
              ← {t("onboarding.back")}
            </button>
          ) : (
            <span />
          )}
          <span className="text-neutral-400">
            {t("onboarding.stepOf", { current: state.step, total })}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-8">
        {/* Step 1 — Welcome */}
        {cur === "welcome" && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <span className="text-4xl font-extrabold tracking-[0.2em] text-matchup">
              MATCHUP
            </span>
            <div className="mt-4 flex justify-center gap-4 text-neutral-500">
              <TennisIcon size={30} />
              <PadelIcon size={30} />
              <PickleballIcon size={30} />
            </div>
            <h1 className="mt-8 text-3xl font-bold">
              {t("onboarding.welcomeTitle")}
            </h1>
            <p className="mt-4 max-w-xs text-neutral-500">
              {t("onboarding.welcomeSubtitle")}
            </p>
          </div>
        )}

        {/* Step 2 — Language */}
        {cur === "language" && (
          <Step title={t("onboarding.languageTitle")}>
            {[
              { v: "de" as const, label: t("onboarding.languageDe") },
              { v: "en" as const, label: t("onboarding.languageEn") },
            ].map((o) => (
              <SelectRow
                key={o.v}
                selected={state.language === o.v}
                onClick={() => dispatch({ type: "SET_LANGUAGE", payload: o.v })}
              >
                {o.label}
              </SelectRow>
            ))}
          </Step>
        )}

        {/* Step 3 — Sports */}
        {cur === "sports" && (
          <Step
            title={t("onboarding.sportsTitle")}
            subtitle={t("onboarding.sportsSubtitle")}
          >
            <div className="flex flex-wrap gap-3">
              {SPORTS.map((s) => (
                <Chip
                  key={s.value}
                  selected={state.sports.includes(s.value)}
                  onClick={() =>
                    dispatch({
                      type: "SET_SPORTS",
                      payload: toggleArray(state.sports, s.value),
                    })
                  }
                >
                  <SportIcon sport={s.value} size={16} className="mr-1 inline-block align-[-3px]" />
                  {t(s.labelKey)}
                </Chip>
              ))}
            </div>
          </Step>
        )}

        {/* Step 4 — Location */}
        {cur === "location" && (
          <Step
            title={t("onboarding.locationTitle")}
            subtitle={t("onboarding.locationSubtitle")}
          >
            <input
              value={locQuery}
              onChange={(e) => searchLocation(e.target.value)}
              placeholder={t("onboarding.locationPlaceholder")}
              className="w-full rounded-xl bg-black/[0.04] px-4 py-3.5 text-sm outline-none focus:ring-1 focus:ring-matchup"
            />
            <button
              type="button"
              onClick={useCurrentLocation}
              className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm text-neutral-600"
            >
              <MapPinIcon size={16} className="mr-1.5 inline-block align-[-3px]" />
              {t("onboarding.useCurrentLocation")}
            </button>
            {locLoading && <p className="text-sm text-neutral-400">{t("onboarding.searching")}</p>}
            {locResults.map((r, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  dispatch({
                    type: "SET_LOCATION",
                    payload: {
                      city: r.display_name.split(",")[0],
                      lat: parseFloat(r.lat),
                      lng: parseFloat(r.lon),
                      country: (r.address?.country_code || "ch").toUpperCase(),
                    },
                  });
                  setLocResults([]);
                  setLocQuery(r.display_name.split(",")[0]);
                }}
                className="block w-full rounded-lg bg-black/[0.035] px-4 py-2.5 text-left text-sm text-neutral-600"
              >
                {r.display_name}
              </button>
            ))}
            {state.latitude !== null && (
              <div className="rounded-xl bg-matchup/15 px-4 py-3 text-sm text-matchup">
                <CheckIcon size={16} className="mr-1 inline-block align-[-3px]" />
                {state.city}
              </div>
            )}
          </Step>
        )}

        {/* Step 5 — Club */}
        {cur === "club" && (
          <Step
            title={t("onboarding.clubTitle")}
            subtitle={t("onboarding.clubSubtitle")}
          >
            <p className="-mt-1 rounded-lg bg-black/[0.035] px-3 py-2 text-xs text-neutral-500">
              {t("onboarding.clubHint")}
            </p>

            {!showAddClub ? (
              <>
                <input
                  value={clubQuery}
                  onChange={(e) => handleClubSearch(e.target.value)}
                  placeholder={t("onboarding.searchClubOrCity")}
                  className="w-full rounded-xl bg-black/[0.04] px-4 py-3.5 text-sm outline-none focus:ring-1 focus:ring-matchup"
                />
                {clubResults.map((c, i) => (
                  <SelectRow
                    key={c.id || `osm-${c.latitude}-${c.longitude}-${i}`}
                    selected={!!c.id && state.club_id === c.id}
                    onClick={() => selectClub(c)}
                  >
                    <span className="flex items-center gap-2">
                      <span className="block font-medium">{c.name}</span>
                      {c._osm && (
                        <span className="rounded-full bg-neutral-200 px-1.5 py-0.5 text-[10px] text-neutral-600">
                          {t("onboarding.mapBadge")}
                        </span>
                      )}
                    </span>
                    {(c.address || c.city) && (
                      <span className="mt-0.5 block text-xs text-neutral-500">
                        {c.address || c.city}
                      </span>
                    )}
                  </SelectRow>
                ))}
                {clubSearching && (
                  <p className="text-sm text-neutral-400">{t("onboarding.searchingWorldwide")}</p>
                )}
                {savingClub && (
                  <p className="text-sm text-matchup">{t("onboarding.clubBeingAdded")}</p>
                )}
                {!clubSearching &&
                  clubQuery.trim().length >= 2 &&
                  clubResults.length === 0 && (
                    <p className="text-sm text-neutral-400">{t("onboarding.noClubFound")}</p>
                  )}
                <button
                  type="button"
                  onClick={() => {
                    setShowAddClub(true);
                    setAddName(clubQuery);
                    setAddCity(state.city);
                    setClubMsg(null);
                  }}
                  className="text-sm text-matchup underline"
                >
                  {t("onboarding.clubNotListed")}
                </button>
              </>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-neutral-500">
                  {t("onboarding.addClubHint")}
                </p>
                <input
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  placeholder={t("onboarding.clubNamePlaceholder")}
                  className="w-full rounded-xl bg-black/[0.04] px-4 py-3.5 text-sm outline-none focus:ring-1 focus:ring-matchup"
                />
                <input
                  value={addCity}
                  onChange={(e) => setAddCity(e.target.value)}
                  placeholder={t("onboarding.cityPlaceholder")}
                  className="w-full rounded-xl bg-black/[0.04] px-4 py-3.5 text-sm outline-none focus:ring-1 focus:ring-matchup"
                />
                {clubMsg && <p className="text-sm text-amber-600">{clubMsg}</p>}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddClub(false);
                      setClubMsg(null);
                    }}
                    className="flex-1 rounded-full border border-neutral-300 py-3 text-sm"
                  >
                    {t("onboarding.back")}
                  </button>
                  <button
                    type="button"
                    disabled={
                      addingClub ||
                      addName.trim().length < 2 ||
                      addCity.trim().length < 2
                    }
                    onClick={handleAddClub}
                    className="flex-1 rounded-full bg-matchup py-3 text-sm font-bold text-white disabled:opacity-50"
                  >
                    {addingClub ? t("onboarding.checking") : t("onboarding.addClub")}
                  </button>
                </div>
              </div>
            )}

            {state.club_id && (
              <div className="flex items-center gap-2 rounded-xl bg-matchup/15 px-4 py-3 text-sm text-matchup">
                <CheckIcon size={16} />{" "}
                {t("onboarding.clubSelected", { name: state.club_name ?? "" })}
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                dispatch({ type: "SET_CLUB", payload: { id: null, name: null } });
                dispatch({ type: "NEXT_STEP" });
              }}
              className="text-sm text-neutral-400 underline"
            >
              {t("onboarding.skip")}
            </button>
          </Step>
        )}

        {/* Step 6 — Name */}
        {/* Step 6 — Name + Alter + Geschlecht */}
        {cur === "identity" && (
          <Step title={t("onboarding.aboutYouTitle")} subtitle={t("onboarding.aboutYouSubtitle")}>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-neutral-400">{t("onboarding.fieldName")}</label>
            <input
              value={state.first_name}
              onChange={(e) => dispatch({ type: "SET_NAME", payload: e.target.value })}
              placeholder={t("onboarding.namePlaceholder")}
              className="w-full rounded-xl bg-black/[0.04] px-4 py-3.5 text-sm outline-none focus:ring-1 focus:ring-matchup"
            />
            {state.first_name.length > 0 && state.first_name.trim().length < 2 && (
              <p className="mt-1 text-sm text-amber-600">{t("onboarding.nameTooShort")}</p>
            )}

            <div className="mt-6">
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-[11px] font-bold uppercase tracking-wide text-neutral-400">{t("onboarding.fieldBirthdate")}</label>
                {state.age != null && <span className="text-sm font-bold text-matchup">{t("onboarding.ageYears", { age: state.age })}</span>}
              </div>
              <input
                type="date"
                value={state.birthdate}
                max={new Date(Date.now() - 18 * 365.25 * 86400000).toISOString().slice(0, 10)}
                min="1930-01-01"
                onChange={(e) => dispatch({ type: "SET_BIRTHDATE", payload: e.target.value })}
                className="w-full rounded-xl bg-black/[0.04] px-4 py-3.5 text-sm text-neutral-900 outline-none focus:ring-1 focus:ring-matchup"
              />
              {state.birthdate && state.age != null && state.age < 18 && (
                <p className="mt-1 text-sm text-amber-600">{t("onboarding.ageMin")}</p>
              )}
            </div>

            <div className="mt-6">
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-neutral-400">{t("onboarding.fieldGender")}</label>
              <div className="flex gap-2">
                {[
                  { v: "male" as const, label: t("onboarding.genderMale") },
                  { v: "female" as const, label: t("onboarding.genderFemale") },
                ].map((o) => (
                  <button
                    key={o.v}
                    type="button"
                    onClick={() => dispatch({ type: "SET_GENDER", payload: o.v })}
                    className={`flex-1 rounded-full py-3 text-sm font-semibold transition-colors ${state.gender === o.v ? "bg-matchup text-white" : "bg-black/[0.05] text-neutral-600"}`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          </Step>
        )}

        {/* Fork — Play vs. Tour */}
        {cur === "fork" && (
          <Step title={t("onboarding.forkTitle")} subtitle={t("onboarding.forkSubtitle")}>
            <SelectRow selected={state.onb_mode === "play"} onClick={() => dispatch({ type: "SET_MODE", payload: "play" })}>
              <span className="block font-semibold">{t("onboarding.forkPlay")}</span>
              <span className="block text-xs text-neutral-500">{t("onboarding.forkPlayDesc")}</span>
            </SelectRow>
            <SelectRow selected={state.onb_mode === "tour"} onClick={() => dispatch({ type: "SET_MODE", payload: "tour" })}>
              <span className="block font-semibold">{t("onboarding.forkTour")}</span>
              <span className="block text-xs text-neutral-500">{t("onboarding.forkTourDesc")}</span>
            </SelectRow>
            <p className="mt-3 rounded-xl bg-black/[0.035] px-4 py-3 text-xs text-neutral-500">{t("onboarding.forkSwitchHint")}</p>
          </Step>
        )}

        {/* Tour — Circuit */}
        {cur === "circuit" && (
          <Step title={t("onboarding.circuitTitle")} subtitle={t("onboarding.circuitSubtitle")}>
            {([
              { value: "atp", label: "ATP Tour", desc: "Masters 1000, ATP 500, ATP 250" },
              { value: "challenger", label: "ATP Challenger", desc: "Challenger 50, 75, 100, 125, 175" },
              { value: "itf", label: "ITF World Tennis Tour", desc: "M15, M25 und höher" },
              { value: "wta", label: "WTA Tour", desc: "WTA 1000, 500, 250, 125" },
            ] as const).map((c) => (
              <SelectRow key={c.value} selected={state.circuit === c.value} onClick={() => dispatch({ type: "SET_CIRCUIT", payload: c.value })}>
                <span className="block font-semibold">{c.label}</span>
                <span className="block text-xs text-neutral-500">{c.desc}</span>
              </SelectRow>
            ))}
          </Step>
        )}

        {/* Tour — Ranking + Punkte */}
        {cur === "ranking" && (
          <Step title={t("onboarding.tourRankingTitle")} subtitle={t("onboarding.tourRankingSubtitle")}>
            <p className="text-sm font-semibold">{t("onboarding.tourRankingLabel")}</p>
            <input
              type="number"
              inputMode="numeric"
              value={state.tour_ranking ?? ""}
              onChange={(e) => dispatch({ type: "SET_TOUR_RANKING", payload: numOrNull(e.target.value) })}
              placeholder="127"
              className="w-full rounded-xl bg-black/[0.04] px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-matchup"
            />
            <p className="pt-2 text-sm font-semibold">{t("onboarding.tourPointsLabel")}</p>
            <input
              type="number"
              inputMode="numeric"
              value={state.tour_points ?? ""}
              onChange={(e) => dispatch({ type: "SET_TOUR_POINTS", payload: numOrNull(e.target.value) })}
              placeholder="485"
              className="w-full rounded-xl bg-black/[0.04] px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-matchup"
            />
            <p className="mt-2 rounded-xl bg-matchup/10 px-4 py-3 text-xs text-matchup">{t("onboarding.tourRankingHint")}</p>
          </Step>
        )}

        {/* Tour — Pässe + Steuerresidenz + ESTA */}
        {cur === "passport" && (
          <Step title={t("onboarding.passportTitle")} subtitle={t("onboarding.passportSubtitle")}>
            <p className="text-sm font-semibold">{t("onboarding.passportPrimary")}</p>
            <input
              value={state.passports[0] ?? ""}
              onChange={(e) => dispatch({ type: "SET_PASSPORTS", payload: [e.target.value, state.passports[1] ?? ""] })}
              placeholder={t("onboarding.passportPlaceholder")}
              className="w-full rounded-xl bg-black/[0.04] px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-matchup"
            />
            <p className="pt-2 text-sm font-semibold">{t("onboarding.passportSecond")}</p>
            <input
              value={state.passports[1] ?? ""}
              onChange={(e) => dispatch({ type: "SET_PASSPORTS", payload: [state.passports[0] ?? "", e.target.value] })}
              placeholder={t("onboarding.passportAdd")}
              className="w-full rounded-xl bg-black/[0.04] px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-matchup"
            />
            <p className="pt-2 text-sm font-semibold">{t("onboarding.taxResidence")}</p>
            <input
              value={state.tax_residence}
              onChange={(e) => dispatch({ type: "SET_TAX_RESIDENCE", payload: e.target.value })}
              placeholder={t("onboarding.taxPlaceholder")}
              className="w-full rounded-xl bg-black/[0.04] px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-matchup"
            />
            <p className="pt-2 text-sm font-semibold">{t("onboarding.usAuth")}</p>
            <div className="flex flex-wrap gap-2">
              {["ESTA", "B-1", "P-1", "None"].map((o) => (
                <Chip key={o} selected={state.esta_status === o} onClick={() => dispatch({ type: "SET_ESTA", payload: { status: o } })}>
                  {o === "None" ? t("onboarding.usNone") : o}
                </Chip>
              ))}
            </div>
            {state.esta_status && state.esta_status !== "None" && (
              <>
                <p className="pt-3 text-sm font-semibold">{t("onboarding.usExpiry")}</p>
                <input
                  type="date"
                  value={state.esta_date}
                  onChange={(e) => dispatch({ type: "SET_ESTA", payload: { date: e.target.value } })}
                  className="w-full rounded-xl bg-black/[0.04] px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-matchup"
                />
              </>
            )}
          </Step>
        )}

        {/* Tour — Team */}
        {cur === "team" && (
          <Step title={t("onboarding.teamTitle")} subtitle={t("onboarding.teamSubtitle")}>
            {([
              { role: "coach", label: t("onboarding.roleCoach") },
              { role: "physio", label: t("onboarding.rolePhysio") },
              { role: "agent", label: t("onboarding.roleAgent") },
              { role: "hitting_partner", label: t("onboarding.roleHitting") },
            ] as const).map((r) => {
              const val = state.team.find((m) => m.role === r.role)?.name ?? "";
              return (
                <div key={r.role} className="mb-2">
                  <p className="mb-1 text-sm font-semibold">{r.label}</p>
                  <input
                    value={val}
                    onChange={(e) => {
                      const others = state.team.filter((m) => m.role !== r.role);
                      const name = e.target.value;
                      dispatch({ type: "SET_TEAM", payload: name.trim() ? [...others, { role: r.role, name }] : others });
                    }}
                    placeholder={t("onboarding.teamNamePlaceholder")}
                    className="w-full rounded-xl bg-black/[0.04] px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-matchup"
                  />
                </div>
              );
            })}
            <p className="mt-2 text-xs text-neutral-400">{t("onboarding.teamOptional")}</p>
          </Step>
        )}

        {/* Tour — Kalender */}
        {cur === "calendar" && (
          <Step title={t("onboarding.calendarTitle")} subtitle={t("onboarding.calendarSubtitle")}>
            <SelectRow selected={state.calendar_connected} onClick={() => dispatch({ type: "SET_CALENDAR", payload: true })}>
              <span className="block font-semibold">Google Calendar</span>
              <span className="block text-xs text-neutral-500">{t("onboarding.calendarGoogleDesc")}</span>
            </SelectRow>
            <SelectRow selected={false} onClick={() => dispatch({ type: "SET_CALENDAR", payload: true })}>
              <span className="block font-semibold">Apple Calendar</span>
              <span className="block text-xs text-neutral-500">{t("onboarding.calendarAppleDesc")}</span>
            </SelectRow>
            <SelectRow selected={!state.calendar_connected} onClick={() => dispatch({ type: "SET_CALENDAR", payload: false })}>
              <span className="block font-semibold">{t("onboarding.calendarSkip")}</span>
              <span className="block text-xs text-neutral-500">{t("onboarding.calendarSkipDesc")}</span>
            </SelectRow>
          </Step>
        )}

        {/* Step 7 — Skill + Rating */}
        {cur === "skill" && (
          <Step title={t("onboarding.skillTitle")}>
            {SKILLS.map((s) => (
              <SelectRow
                key={s.value}
                selected={state.skill_level === s.value}
                onClick={() => dispatch({ type: "SET_SKILL", payload: s.value })}
              >
                <span className="block font-semibold">
                  <span className={`mr-2 inline-block h-2.5 w-2.5 rounded-full ${s.dot}`} />
                  {t(s.labelKey)}
                </span>
                <span className="block text-xs text-neutral-500">{t(s.descKey)}</span>
              </SelectRow>
            ))}
            {state.skill_level && (() => {
              const nat = nationalRankSystem(rankCountry);
              return (
              <div className="space-y-4 pt-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-neutral-900">{t("onboarding.rankingTitle")}</p>
                  <button type="button" onClick={() => setRankInfo(true)} className="flex items-center gap-1 text-xs font-semibold text-matchup">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
                    {t("onboarding.rankingInfo")}
                  </button>
                </div>
                <p className="text-xs text-neutral-500">{t("onboarding.rankingSub")}</p>

                {/* Land */}
                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-neutral-400">{t("onboarding.rankingCountry")}</label>
                  <select value={rankCountry} onChange={(e) => setRankCountry(e.target.value)} className="w-full rounded-xl bg-black/[0.04] px-4 py-3.5 text-sm text-neutral-900 outline-none focus:ring-1 focus:ring-matchup">
                    {RANK_COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
                  </select>
                </div>

                {/* Nationales System */}
                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-neutral-400">{nat.label}</label>
                  {nat.options ? (
                    <select value={state.official_rating} onChange={(e) => dispatch({ type: "SET_RATING", payload: e.target.value })} className="w-full rounded-xl bg-black/[0.04] px-4 py-3.5 text-sm text-neutral-900 outline-none focus:ring-1 focus:ring-matchup">
                      <option value="">{t("onboarding.noRating")}</option>
                      {nat.options.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  ) : (
                    <input value={state.official_rating} onChange={(e) => dispatch({ type: "SET_RATING", payload: e.target.value })} placeholder={nat.placeholder} className="w-full rounded-xl bg-black/[0.04] px-4 py-3.5 text-sm text-neutral-900 outline-none focus:ring-1 focus:ring-matchup placeholder:text-neutral-400" />
                  )}
                </div>

                {/* Weltweite Rankings */}
                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-neutral-400">{t("onboarding.rankingWorld")}</label>
                  <div className="grid grid-cols-2 gap-2">
                    {([["atp", "ATP"], ["wta", "WTA"], ["itf", "ITF WTN"], ["utr", "UTR"]] as const).map(([k, label]) => (
                      <div key={k} className="relative">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-neutral-400">{label}</span>
                        <input
                          inputMode="decimal"
                          value={state[k] ?? ""}
                          onChange={(e) => dispatch({ type: "SET_RANKINGS", payload: { [k]: numOrNull(e.target.value) } })}
                          placeholder="–"
                          className="w-full rounded-xl bg-black/[0.04] py-3 pl-[64px] pr-3 text-right text-sm text-neutral-900 outline-none focus:ring-1 focus:ring-matchup placeholder:text-neutral-300"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Freitext */}
                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-neutral-400">{t("onboarding.rankingNote")}</label>
                  <input value={ratingNote} onChange={(e) => setRatingNote(e.target.value)} placeholder={t("onboarding.rankingNotePlaceholder")} className="w-full rounded-xl bg-black/[0.04] px-4 py-3.5 text-sm text-neutral-900 outline-none focus:ring-1 focus:ring-matchup placeholder:text-neutral-400" />
                </div>
              </div>
              );
            })()}
          </Step>
        )}

        {/* Step 8 — Height */}
        {cur === "height" && (
          <Step
            title={t("onboarding.heightTitle")}
            subtitle={t("onboarding.heightSubtitle")}
          >
            <div className="text-center text-2xl font-bold text-matchup">
              {state.height_cm ?? 178} cm
            </div>
            <input
              type="range"
              min={140}
              max={220}
              value={state.height_cm ?? 178}
              onChange={(e) =>
                dispatch({ type: "SET_HEIGHT", payload: Number(e.target.value) })
              }
              className="w-full accent-matchup"
            />
            <button
              type="button"
              onClick={() => dispatch({ type: "NEXT_STEP" })}
              className="text-sm text-neutral-400 underline"
            >
              {t("onboarding.skip")}
            </button>
          </Step>
        )}

        {/* Step 9 — Goals */}
        {cur === "goals" && (
          <Step
            title={t("onboarding.goalsTitle")}
            subtitle={t("onboarding.goalsSubtitle")}
          >
            <div className="grid grid-cols-2 gap-3">
              {GOALS.map((g) => (
                <Chip
                  key={g.value}
                  selected={state.goals.includes(g.value)}
                  onClick={() =>
                    dispatch({
                      type: "SET_GOALS",
                      payload: toggleArray(state.goals, g.value),
                    })
                  }
                >
                  <g.Icon size={16} className="mr-1 inline-block align-[-3px]" />
                  {t(g.labelKey)}
                </Chip>
              ))}
            </div>
          </Step>
        )}

        {/* Step 10 — Photos + Bio + Visibility */}
        {cur === "photos" && (
          <Step title={t("onboarding.profileTitle")} subtitle={t("onboarding.profileSubtitle")}>
            {/* Photos */}
            <p className="text-sm font-semibold">{t("onboarding.yourPhotos")}</p>
            <p className="-mt-2 text-xs text-neutral-400">
              {t("onboarding.photosHint")}
            </p>
            <div className="grid grid-cols-4 gap-2">
              {[0, 1, 2, 3].map((i) => {
                const photo = state.photos[i];
                return (
                  <div
                    key={i}
                    className="relative aspect-square overflow-hidden rounded-xl bg-black/[0.04]"
                  >
                    {photo ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={URL.createObjectURL(photo)}
                          alt={t("onboarding.photoAlt", { n: i + 1 })}
                          className="h-full w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            dispatch({ type: "REMOVE_PHOTO", payload: i })
                          }
                          className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-xs"
                        >
                          ×
                        </button>
                      </>
                    ) : (
                      <label className="flex h-full w-full cursor-pointer items-center justify-center text-2xl text-neutral-400">
                        +
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            e.target.value = "";
                            if (f) setCropFile(f);
                          }}
                        />
                      </label>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bio */}
            <p className="pt-4 text-sm font-semibold">{t("onboarding.aboutYou")}</p>
            <textarea
              maxLength={300}
              rows={4}
              value={state.bio}
              onChange={(e) =>
                dispatch({ type: "SET_BIO", payload: e.target.value })
              }
              placeholder={t("onboarding.bioPlaceholder")}
              className="w-full rounded-xl bg-black/[0.04] px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-matchup"
            />
            <p className="-mt-2 text-right text-xs text-neutral-400">
              {state.bio.length}/300
            </p>

            {/* Visibility */}
            <p className="pt-4 text-sm font-semibold">{t("onboarding.whoCanFindYou")}</p>
            <div className="flex gap-3">
              {[
                { v: "male", label: t("onboarding.visibilityMale") },
                { v: "female", label: t("onboarding.visibilityFemale") },
              ].map((o) => (
                <Chip
                  key={o.v}
                  selected={state.visibility_gender.includes(o.v)}
                  onClick={() =>
                    dispatch({
                      type: "SET_VISIBILITY",
                      payload: {
                        gender: toggleArray(state.visibility_gender, o.v),
                        ageMin: state.visibility_age_min,
                        ageMax: state.visibility_age_max,
                      },
                    })
                  }
                >
                  {o.label}
                </Chip>
              ))}
            </div>
            <div>
              <p className="pt-4 text-sm font-semibold">
                {t("onboarding.ageRange", {
                  min: state.visibility_age_min,
                  max: state.visibility_age_max,
                })}
              </p>
              <div className="mt-3">
                <AgeRangeSlider
                  lo={state.visibility_age_min}
                  hi={state.visibility_age_max}
                  onChange={(lo, hi) =>
                    dispatch({
                      type: "SET_VISIBILITY",
                      payload: { gender: state.visibility_gender, ageMin: lo, ageMax: hi },
                    })
                  }
                />
              </div>
            </div>

            {submitError && (
              <div className="rounded-xl bg-amber-500/10 px-4 py-3 text-sm text-amber-600">
                {submitError}
              </div>
            )}
          </Step>
        )}
      </div>

      {/* Bottom button */}
      <div className="border-t border-black/10 p-5">
        <button
          type="button"
          onClick={handleNext}
          disabled={!valid || submitting}
          className={`w-full rounded-full py-3.5 text-sm font-bold tracking-wide transition-colors ${
            valid && !submitting
              ? "bg-matchup text-white hover:bg-matchup-hover"
              : "cursor-not-allowed bg-black/[0.06] text-neutral-400"
          }`}
        >
          {submitting
            ? t("onboarding.creatingProfile")
            : isLast
              ? t("onboarding.createProfile")
              : t("onboarding.next")}
        </button>
      </div>

      {/* Ranking-Übersicht (Info) */}
      {rankInfo && (
        <div className="fixed inset-0 z-50 mx-auto flex max-w-[430px] items-end justify-center bg-black/40 backdrop-blur-sm" onClick={() => setRankInfo(false)}>
          <div className="w-full rounded-t-[28px] bg-white p-5 pb-8" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-base font-bold text-neutral-900">{t("onboarding.rankingInfoTitle")}</span>
              <button type="button" onClick={() => setRankInfo(false)} className="text-sm font-medium text-neutral-500">{t("onboarding.close")}</button>
            </div>
            <div className="max-h-[60vh] space-y-3 overflow-y-auto text-sm text-neutral-600">
              {[
                ["ATP / WTA", t("onboarding.infoAtp")],
                ["ITF WTN", t("onboarding.infoWtn")],
                ["UTR", t("onboarding.infoUtr")],
                ["LK (DE)", t("onboarding.infoLk")],
                ["R/N (CH)", t("onboarding.infoRn")],
                ["NTRP (US)", t("onboarding.infoNtrp")],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl bg-black/[0.035] p-3">
                  <p className="text-[13px] font-bold text-neutral-900">{k}</p>
                  <p className="mt-0.5 text-[13px] leading-snug text-neutral-500">{v}</p>
                </div>
              ))}
              <p className="pt-1 text-[11px] leading-relaxed text-neutral-400">{t("onboarding.rankingMapHint")}</p>
            </div>
          </div>
        </div>
      )}

      {cropFile && (
        <AvatarCropper
          file={cropFile}
          onCancel={() => setCropFile(null)}
          onConfirm={(blob) => {
            const f = new File([blob], "avatar.jpg", { type: "image/jpeg" });
            dispatch({ type: "ADD_PHOTO", payload: f });
            setCropFile(null);
          }}
        />
      )}
    </div>
  );
}

/* ---------- kleine UI-Helfer ---------- */

function Step({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-md space-y-4">
      <h2 className="text-2xl font-bold">{title}</h2>
      {subtitle && <p className="-mt-2 text-sm text-neutral-500">{subtitle}</p>}
      <div className="space-y-3 pt-2">{children}</div>
    </div>
  );
}

function SelectRow({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`block w-full rounded-xl px-4 py-3.5 text-left text-sm transition-colors ${
        selected
          ? "bg-black/[0.04] ring-2 ring-matchup"
          : "bg-black/[0.04] ring-1 ring-black/10 hover:ring-black/20"
      }`}
    >
      {children}
    </button>
  );
}

const SLIDER_THUMB =
  "pointer-events-none absolute inset-x-0 top-0 h-6 w-full appearance-none bg-transparent " +
  "[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-matchup [&::-webkit-slider-thumb]:shadow " +
  "[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-matchup";

/** Einzel-Slider mit gefülltem Lila-Balken. */
function LilaSlider({ min, max, value, onChange }: { min: number; max: number; value: number; onChange: (v: number) => void }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="relative h-6">
      <div className="absolute top-1/2 h-1.5 w-full -translate-y-1/2 rounded-full bg-black/10" />
      <div className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-matchup" style={{ width: `${pct}%` }} />
      <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} className={SLIDER_THUMB} />
    </div>
  );
}

/** Ein Slider mit zwei Griffen (Von/Bis) — gefüllter Balken in Matchup-Lila. */
function AgeRangeSlider({ lo, hi, onChange }: { lo: number; hi: number; onChange: (lo: number, hi: number) => void }) {
  const MIN = 18, MAX = 99;
  const pct = (v: number) => ((v - MIN) / (MAX - MIN)) * 100;
  const thumb =
    "pointer-events-none absolute inset-x-0 top-0 h-6 w-full appearance-none bg-transparent " +
    "[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-matchup [&::-webkit-slider-thumb]:shadow " +
    "[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-matchup";
  return (
    <div>
      <div className="relative h-6">
        <div className="absolute top-1/2 h-1.5 w-full -translate-y-1/2 rounded-full bg-black/10" />
        <div className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-matchup" style={{ left: `${pct(lo)}%`, right: `${100 - pct(hi)}%` }} />
        <input type="range" min={MIN} max={MAX} value={lo} onChange={(e) => onChange(Math.min(Number(e.target.value), hi), hi)} className={`${thumb} z-30`} />
        <input type="range" min={MIN} max={MAX} value={hi} onChange={(e) => onChange(lo, Math.max(Number(e.target.value), lo))} className={`${thumb} z-20`} />
      </div>
      <div className="mt-1 flex justify-between text-xs font-bold text-matchup">
        <span>{lo}</span>
        <span>{hi}</span>
      </div>
    </div>
  );
}

function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-5 py-2.5 text-sm font-medium transition-colors ${
        selected
          ? "bg-matchup text-white"
          : "bg-black/[0.05] text-neutral-600 ring-1 ring-black/10"
      }`}
    >
      {children}
    </button>
  );
}
