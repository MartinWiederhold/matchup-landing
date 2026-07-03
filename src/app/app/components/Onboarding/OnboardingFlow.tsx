"use client";

import { useReducer, useRef, useState, type ComponentType } from "react";
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
import WheelPicker from "../shared/WheelPicker";

const AGES = Array.from({ length: 99 - 18 + 1 }, (_, i) => 18 + i);
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
import {
  onboardingReducer,
  initialOnboardingState,
  isStepValid,
  TOTAL_STEPS,
} from "./onboardingReducer";

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

const RATINGS_CH = ["R1", "R2", "R3", "R4", "R5", "R6", "R7", "R8", "R9", "N1", "N2", "N3", "N4"];
const RATINGS_DE = Array.from({ length: 23 }, (_, i) => `LK ${i + 1}`);

type NominatimResult = {
  display_name: string;
  lat: string;
  lon: string;
  address?: { country_code?: string };
};

export default function OnboardingFlow() {
  const { user, refreshProfile } = useAuth();
  const t = useT();
  const [state, dispatch] = useReducer(
    onboardingReducer,
    initialOnboardingState,
  );
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

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
        sports: state.sports,
        skill_level: state.skill_level!,
        official_rating: state.official_rating || null,
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

  const valid = isStepValid(state);
  const isLast = state.step === TOTAL_STEPS;

  function handleNext() {
    if (!valid) return;
    if (isLast) completeOnboarding();
    else dispatch({ type: "NEXT_STEP" });
  }

  const ratingOptions =
    state.country === "CH"
      ? RATINGS_CH
      : state.country === "DE"
        ? RATINGS_DE
        : null;

  return (
    <div className="flex min-h-dvh flex-col bg-black text-white">
      {/* Progress + Header */}
      <div className="px-5 pt-5">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full rounded-full bg-matchup transition-all duration-300"
            style={{ width: `${(state.step / TOTAL_STEPS) * 100}%` }}
          />
        </div>
        <div className="mt-3 flex items-center justify-between text-sm">
          {state.step > 1 ? (
            <button
              type="button"
              onClick={() => dispatch({ type: "PREV_STEP" })}
              className="text-zinc-400 hover:text-white"
            >
              ← {t("onboarding.back")}
            </button>
          ) : (
            <span />
          )}
          <span className="text-zinc-500">
            {t("onboarding.stepOf", { current: state.step, total: TOTAL_STEPS })}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-8">
        {/* Step 1 — Welcome */}
        {state.step === 1 && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <span className="matchup-wordmark text-4xl font-bold tracking-[0.2em]">
              MATCHUP
            </span>
            <div className="mt-4 flex justify-center gap-4 text-white/80">
              <TennisIcon size={30} />
              <PadelIcon size={30} />
              <PickleballIcon size={30} />
            </div>
            <h1 className="mt-8 text-3xl font-bold">
              {t("onboarding.welcomeTitle")}
            </h1>
            <p className="mt-4 max-w-xs text-zinc-400">
              {t("onboarding.welcomeSubtitle")}
            </p>
          </div>
        )}

        {/* Step 2 — Language */}
        {state.step === 2 && (
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
        {state.step === 3 && (
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
        {state.step === 4 && (
          <Step
            title={t("onboarding.locationTitle")}
            subtitle={t("onboarding.locationSubtitle")}
          >
            <input
              value={locQuery}
              onChange={(e) => searchLocation(e.target.value)}
              placeholder={t("onboarding.locationPlaceholder")}
              className="w-full rounded-xl bg-zinc-800 px-4 py-3.5 text-sm outline-none focus:ring-1 focus:ring-matchup"
            />
            <button
              type="button"
              onClick={useCurrentLocation}
              className="w-full rounded-xl border border-zinc-700 px-4 py-3 text-sm text-zinc-300"
            >
              <MapPinIcon size={16} className="mr-1.5 inline-block align-[-3px]" />
              {t("onboarding.useCurrentLocation")}
            </button>
            {locLoading && <p className="text-sm text-zinc-500">{t("onboarding.searching")}</p>}
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
                className="block w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-left text-sm text-zinc-300"
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
        {state.step === 5 && (
          <Step
            title={t("onboarding.clubTitle")}
            subtitle={t("onboarding.clubSubtitle")}
          >
            <p className="-mt-1 rounded-lg bg-zinc-900 px-3 py-2 text-xs text-zinc-400">
              {t("onboarding.clubHint")}
            </p>

            {!showAddClub ? (
              <>
                <input
                  value={clubQuery}
                  onChange={(e) => handleClubSearch(e.target.value)}
                  placeholder={t("onboarding.searchClubOrCity")}
                  className="w-full rounded-xl bg-zinc-800 px-4 py-3.5 text-sm outline-none focus:ring-1 focus:ring-matchup"
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
                        <span className="rounded-full bg-zinc-700 px-1.5 py-0.5 text-[10px] text-zinc-300">
                          {t("onboarding.mapBadge")}
                        </span>
                      )}
                    </span>
                    {(c.address || c.city) && (
                      <span className="mt-0.5 block text-xs text-zinc-400">
                        {c.address || c.city}
                      </span>
                    )}
                  </SelectRow>
                ))}
                {clubSearching && (
                  <p className="text-sm text-zinc-500">{t("onboarding.searchingWorldwide")}</p>
                )}
                {savingClub && (
                  <p className="text-sm text-matchup">{t("onboarding.clubBeingAdded")}</p>
                )}
                {!clubSearching &&
                  clubQuery.trim().length >= 2 &&
                  clubResults.length === 0 && (
                    <p className="text-sm text-zinc-500">{t("onboarding.noClubFound")}</p>
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
                <p className="text-sm text-zinc-400">
                  {t("onboarding.addClubHint")}
                </p>
                <input
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  placeholder={t("onboarding.clubNamePlaceholder")}
                  className="w-full rounded-xl bg-zinc-800 px-4 py-3.5 text-sm outline-none focus:ring-1 focus:ring-matchup"
                />
                <input
                  value={addCity}
                  onChange={(e) => setAddCity(e.target.value)}
                  placeholder={t("onboarding.cityPlaceholder")}
                  className="w-full rounded-xl bg-zinc-800 px-4 py-3.5 text-sm outline-none focus:ring-1 focus:ring-matchup"
                />
                {clubMsg && <p className="text-sm text-amber-400">{clubMsg}</p>}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddClub(false);
                      setClubMsg(null);
                    }}
                    className="flex-1 rounded-full border border-zinc-700 py-3 text-sm"
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
              className="text-sm text-zinc-500 underline"
            >
              {t("onboarding.skip")}
            </button>
          </Step>
        )}

        {/* Step 6 — Name */}
        {state.step === 6 && (
          <Step
            title={t("onboarding.nameTitle")}
            subtitle={t("onboarding.nameSubtitle")}
          >
            <input
              autoFocus
              value={state.first_name}
              onChange={(e) =>
                dispatch({ type: "SET_NAME", payload: e.target.value })
              }
              placeholder={t("onboarding.namePlaceholder")}
              className="w-full rounded-xl bg-zinc-800 px-4 py-3.5 text-sm outline-none focus:ring-1 focus:ring-matchup"
            />
            {state.first_name.length > 0 && state.first_name.trim().length < 2 && (
              <p className="text-sm text-amber-400">{t("onboarding.nameTooShort")}</p>
            )}
          </Step>
        )}

        {/* Step 7 — Age */}
        {state.step === 7 && (
          <Step title={t("onboarding.ageTitle")}>
            <input
              type="number"
              min={18}
              max={100}
              value={state.age ?? ""}
              onChange={(e) =>
                dispatch({ type: "SET_AGE", payload: Number(e.target.value) })
              }
              placeholder={t("onboarding.agePlaceholder")}
              className="w-full rounded-xl bg-zinc-800 px-4 py-3.5 text-center text-2xl font-bold outline-none focus:ring-1 focus:ring-matchup"
            />
            {state.age !== null && (state.age < 18 || state.age > 100) && (
              <p className="text-sm text-amber-400">
                {t("onboarding.ageMin")}
              </p>
            )}
          </Step>
        )}

        {/* Step 8 — Gender */}
        {state.step === 8 && (
          <Step title={t("onboarding.genderTitle")}>
            {[
              { v: "male" as const, label: t("onboarding.genderMale") },
              { v: "female" as const, label: t("onboarding.genderFemale") },
            ].map((o) => (
              <SelectRow
                key={o.v}
                selected={state.gender === o.v}
                onClick={() => dispatch({ type: "SET_GENDER", payload: o.v })}
              >
                {o.label}
              </SelectRow>
            ))}
          </Step>
        )}

        {/* Step 9 — Skill + Rating */}
        {state.step === 9 && (
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
                <span className="block text-xs text-zinc-400">{t(s.descKey)}</span>
              </SelectRow>
            ))}
            {state.skill_level && (
              <div className="pt-4">
                <p className="mb-2 text-sm text-zinc-400">
                  {t("onboarding.ratingQuestion")}
                </p>
                {ratingOptions ? (
                  <select
                    value={state.official_rating}
                    onChange={(e) =>
                      dispatch({ type: "SET_RATING", payload: e.target.value })
                    }
                    className="w-full rounded-xl bg-zinc-800 px-4 py-3.5 text-sm outline-none focus:ring-1 focus:ring-matchup"
                  >
                    <option value="">{t("onboarding.noRating")}</option>
                    {ratingOptions.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    value={state.official_rating}
                    onChange={(e) =>
                      dispatch({ type: "SET_RATING", payload: e.target.value })
                    }
                    placeholder={t("onboarding.ratingPlaceholder")}
                    className="w-full rounded-xl bg-zinc-800 px-4 py-3.5 text-sm outline-none focus:ring-1 focus:ring-matchup"
                  />
                )}
              </div>
            )}
          </Step>
        )}

        {/* Step 10 — Height */}
        {state.step === 10 && (
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
              className="text-sm text-zinc-500 underline"
            >
              {t("onboarding.skip")}
            </button>
          </Step>
        )}

        {/* Step 11 — Goals */}
        {state.step === 11 && (
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

        {/* Step 12 — Photos + Bio + Visibility */}
        {state.step === 12 && (
          <Step title={t("onboarding.profileTitle")} subtitle={t("onboarding.profileSubtitle")}>
            {/* Photos */}
            <p className="text-sm font-semibold">{t("onboarding.yourPhotos")}</p>
            <p className="-mt-2 text-xs text-zinc-500">
              {t("onboarding.photosHint")}
            </p>
            <div className="grid grid-cols-4 gap-2">
              {[0, 1, 2, 3].map((i) => {
                const photo = state.photos[i];
                return (
                  <div
                    key={i}
                    className="relative aspect-square overflow-hidden rounded-xl bg-zinc-800"
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
                      <label className="flex h-full w-full cursor-pointer items-center justify-center text-2xl text-zinc-500">
                        +
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) dispatch({ type: "ADD_PHOTO", payload: f });
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
              className="w-full rounded-xl bg-zinc-800 px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-matchup"
            />
            <p className="-mt-2 text-right text-xs text-zinc-500">
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
              <div className="mt-2 flex items-stretch gap-3">
                <div className="flex-1">
                  <p className="mb-1 text-center text-xs text-zinc-500">{t("onboarding.from")}</p>
                  <WheelPicker
                    fade="rgb(0 0 0)"
                    values={AGES}
                    value={state.visibility_age_min}
                    onChange={(v) =>
                      dispatch({
                        type: "SET_VISIBILITY",
                        payload: {
                          gender: state.visibility_gender,
                          ageMin: v,
                          ageMax: Math.max(state.visibility_age_max, v),
                        },
                      })
                    }
                  />
                </div>
                <div className="flex-1">
                  <p className="mb-1 text-center text-xs text-zinc-500">{t("onboarding.to")}</p>
                  <WheelPicker
                    fade="rgb(0 0 0)"
                    values={AGES}
                    value={state.visibility_age_max}
                    onChange={(v) =>
                      dispatch({
                        type: "SET_VISIBILITY",
                        payload: {
                          gender: state.visibility_gender,
                          ageMin: Math.min(state.visibility_age_min, v),
                          ageMax: v,
                        },
                      })
                    }
                  />
                </div>
              </div>
            </div>

            {submitError && (
              <div className="rounded-xl bg-amber-500/15 px-4 py-3 text-sm text-amber-300">
                {submitError}
              </div>
            )}
          </Step>
        )}
      </div>

      {/* Bottom button */}
      <div className="border-t border-zinc-800 p-5">
        <button
          type="button"
          onClick={handleNext}
          disabled={!valid || submitting}
          className={`w-full rounded-full py-3.5 text-sm font-bold tracking-wide transition-colors ${
            valid && !submitting
              ? "bg-matchup text-white hover:bg-matchup-hover"
              : "cursor-not-allowed bg-zinc-800 text-zinc-500"
          }`}
        >
          {submitting
            ? t("onboarding.creatingProfile")
            : isLast
              ? t("onboarding.createProfile")
              : t("onboarding.next")}
        </button>
      </div>
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
      {subtitle && <p className="-mt-2 text-sm text-zinc-400">{subtitle}</p>}
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
          ? "bg-zinc-800 ring-2 ring-matchup"
          : "bg-zinc-800 ring-1 ring-zinc-700 hover:ring-zinc-600"
      }`}
    >
      {children}
    </button>
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
          ? "bg-matchup/20 text-white ring-2 ring-matchup"
          : "bg-zinc-800 text-zinc-300 ring-1 ring-zinc-700"
      }`}
    >
      {children}
    </button>
  );
}
