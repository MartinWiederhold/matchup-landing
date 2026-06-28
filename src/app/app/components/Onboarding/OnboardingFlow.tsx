"use client";

import { useReducer, useState, type ComponentType } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { compressImage } from "@/lib/utils/imageCompress";
import {
  searchClubs as searchClubsApi,
  addClub,
  SUPPORTED_COUNTRY_NAMES,
  countryName,
} from "@/lib/clubs";
import type { Sport, SkillLevel, Club } from "@/lib/types";
import AgeRangeSlider from "../shared/AgeRangeSlider";
import {
  SportIcon,
  TennisIcon,
  PadelIcon,
  PickleballIcon,
  MapPinIcon,
  CheckIcon,
  TargetIcon,
  TrophyIcon,
  DumbbellIcon,
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

const SPORTS: { value: Sport; label: string }[] = [
  { value: "tennis", label: "Tennis" },
  { value: "padel", label: "Padel" },
  { value: "pickleball", label: "Pickleball" },
];

const SKILLS: { value: SkillLevel; label: string; desc: string; dot: string }[] =
  [
    { value: "beginner", label: "Anfänger", desc: "Ich lerne gerade die Basics", dot: "bg-green-500" },
    { value: "intermediate", label: "Fortgeschritten", desc: "Ich spiele regelmässig", dot: "bg-yellow-500" },
    { value: "advanced", label: "Advanced", desc: "Ich beherrsche die meisten Techniken", dot: "bg-orange-500" },
    { value: "competitive", label: "Wettkampf", desc: "Ich spiele Turniere", dot: "bg-red-500" },
  ];

const GOALS: {
  value: string;
  label: string;
  Icon: ComponentType<{ size?: number; className?: string }>;
}[] = [
  { value: "fun", label: "Spass", Icon: TargetIcon },
  { value: "competitive", label: "Wettkampf", Icon: TrophyIcon },
  { value: "training", label: "Training", Icon: DumbbellIcon },
  { value: "social", label: "Neue Leute", Icon: UsersIcon },
  { value: "fitness", label: "Fitness", Icon: ActivityIcon },
  { value: "regular", label: "Regelmässig", Icon: CalendarIcon },
];

const RATINGS_CH = ["R1", "R2", "R3", "R4", "R5", "R6", "R7", "R8", "R9", "N1", "N2", "N3", "N4"];
const RATINGS_DE = Array.from({ length: 23 }, (_, i) => `LK ${i + 1}`);

type NominatimResult = { display_name: string; lat: string; lon: string };

export default function OnboardingFlow() {
  const { user, refreshProfile } = useAuth();
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
  const [clubResults, setClubResults] = useState<Club[]>([]);
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
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5`,
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
          "Mein Standort";
        dispatch({
          type: "SET_LOCATION",
          payload: { city, lat: latitude, lng: longitude, country: "CH" },
        });
      } catch {
        dispatch({
          type: "SET_LOCATION",
          payload: {
            city: "Mein Standort",
            lat: latitude,
            lng: longitude,
            country: "CH",
          },
        });
      }
    });
  }

  async function handleClubSearch(q: string) {
    setClubQuery(q);
    setClubResults(await searchClubsApi(q));
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
    } else if (res.status === "unsupported_country") {
      setClubMsg(
        `${countryName(res.country)} ist noch nicht verfügbar — coming soon. Aktuell: ${Object.values(
          SUPPORTED_COUNTRY_NAMES,
        ).join(" & ")}.`,
      );
    } else if (res.status === "not_found") {
      setClubMsg(
        "Diesen Club konnten wir nicht verifizieren. Bitte prüfe Name und Stadt.",
      );
    } else {
      setClubMsg("Etwas ist schiefgelaufen. Bitte versuche es erneut.");
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
        country_name: state.country === "CH" ? "Schweiz" : state.country,
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
          : "Unbekannter Fehler";
      setSubmitError(`Profil konnte nicht erstellt werden: ${msg}`);
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
              ← Zurück
            </button>
          ) : (
            <span />
          )}
          <span className="text-zinc-500">
            {state.step} / {TOTAL_STEPS}
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
              Finde deinen perfekten Spielpartner
            </h1>
            <p className="mt-4 max-w-xs text-zinc-400">
              Matche mit Tennis-, Padel- und Pickleball-Spielern in deiner Nähe.
            </p>
          </div>
        )}

        {/* Step 2 — Language */}
        {state.step === 2 && (
          <Step title="Wähle deine Sprache">
            {[
              { v: "de" as const, label: "🇩🇪  Deutsch" },
              { v: "en" as const, label: "🇬🇧  English" },
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
            title="Welchen Sport spielst du?"
            subtitle="Wähle mindestens eine Sportart."
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
                  {s.label}
                </Chip>
              ))}
            </div>
          </Step>
        )}

        {/* Step 4 — Location */}
        {state.step === 4 && (
          <Step
            title="Wo spielst du?"
            subtitle="Wir zeigen dir Spieler in deiner Nähe."
          >
            <input
              value={locQuery}
              onChange={(e) => searchLocation(e.target.value)}
              placeholder="Stadt oder PLZ eingeben"
              className="w-full rounded-xl bg-zinc-800 px-4 py-3.5 text-sm outline-none focus:ring-1 focus:ring-matchup"
            />
            <button
              type="button"
              onClick={useCurrentLocation}
              className="w-full rounded-xl border border-zinc-700 px-4 py-3 text-sm text-zinc-300"
            >
              <MapPinIcon size={16} className="mr-1.5 inline-block align-[-3px]" />
              Aktuellen Standort verwenden
            </button>
            {locLoading && <p className="text-sm text-zinc-500">Suche…</p>}
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
                      country: "CH",
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
            title="Spielst du in einem Club?"
            subtitle="Optional — so findest du zuerst Spieler aus deinem Club."
          >
            <p className="-mt-1 rounded-lg bg-zinc-900 px-3 py-2 text-xs text-zinc-400">
              Aktuell verfügbar:{" "}
              {Object.values(SUPPORTED_COUNTRY_NAMES).join(" & ")}. Weitere
              Länder folgen bald.
            </p>

            {!showAddClub ? (
              <>
                <input
                  value={clubQuery}
                  onChange={(e) => handleClubSearch(e.target.value)}
                  placeholder="Club oder Stadt suchen…"
                  className="w-full rounded-xl bg-zinc-800 px-4 py-3.5 text-sm outline-none focus:ring-1 focus:ring-matchup"
                />
                {clubResults.map((c) => (
                  <SelectRow
                    key={c.id}
                    selected={state.club_id === c.id}
                    onClick={() =>
                      dispatch({
                        type: "SET_CLUB",
                        payload: { id: c.id, name: c.name },
                      })
                    }
                  >
                    <span className="font-medium">{c.name}</span>
                    {c.city ? (
                      <span className="text-zinc-400"> · {c.city}</span>
                    ) : null}
                  </SelectRow>
                ))}
                {clubQuery.trim().length >= 2 && clubResults.length === 0 && (
                  <p className="text-sm text-zinc-500">Kein Club gefunden.</p>
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
                  Mein Club ist nicht dabei — hinzufügen
                </button>
              </>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-zinc-400">
                  Wir prüfen automatisch, ob es den Club gibt, und nehmen ihn
                  auf.
                </p>
                <input
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  placeholder="Club-Name"
                  className="w-full rounded-xl bg-zinc-800 px-4 py-3.5 text-sm outline-none focus:ring-1 focus:ring-matchup"
                />
                <input
                  value={addCity}
                  onChange={(e) => setAddCity(e.target.value)}
                  placeholder="Stadt / Ort"
                  className="w-full rounded-xl bg-zinc-800 px-4 py-3.5 text-sm outline-none focus:ring-1 focus:ring-matchup"
                />
                {clubMsg && <p className="text-sm text-red-400">{clubMsg}</p>}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddClub(false);
                      setClubMsg(null);
                    }}
                    className="flex-1 rounded-full border border-zinc-700 py-3 text-sm"
                  >
                    Zurück
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
                    {addingClub ? "Prüfe…" : "Hinzufügen"}
                  </button>
                </div>
              </div>
            )}

            {state.club_id && (
              <div className="flex items-center gap-2 rounded-xl bg-matchup/15 px-4 py-3 text-sm text-matchup">
                <CheckIcon size={16} /> {state.club_name} ausgewählt
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
              Überspringen
            </button>
          </Step>
        )}

        {/* Step 6 — Name */}
        {state.step === 6 && (
          <Step
            title="Wie heisst du?"
            subtitle="Dein Vorname wird anderen Spielern angezeigt."
          >
            <input
              autoFocus
              value={state.first_name}
              onChange={(e) =>
                dispatch({ type: "SET_NAME", payload: e.target.value })
              }
              placeholder="Vorname"
              className="w-full rounded-xl bg-zinc-800 px-4 py-3.5 text-sm outline-none focus:ring-1 focus:ring-matchup"
            />
            {state.first_name.length > 0 && state.first_name.trim().length < 2 && (
              <p className="text-sm text-red-400">Mindestens 2 Zeichen</p>
            )}
          </Step>
        )}

        {/* Step 7 — Age */}
        {state.step === 7 && (
          <Step title="Wie alt bist du?">
            <input
              type="number"
              min={18}
              max={100}
              value={state.age ?? ""}
              onChange={(e) =>
                dispatch({ type: "SET_AGE", payload: Number(e.target.value) })
              }
              placeholder="25"
              className="w-full rounded-xl bg-zinc-800 px-4 py-3.5 text-center text-2xl font-bold outline-none focus:ring-1 focus:ring-matchup"
            />
            {state.age !== null && (state.age < 18 || state.age > 100) && (
              <p className="text-sm text-red-400">
                Du musst mindestens 18 Jahre alt sein.
              </p>
            )}
          </Step>
        )}

        {/* Step 8 — Gender */}
        {state.step === 8 && (
          <Step title="Dein Geschlecht">
            {[
              { v: "male" as const, label: "♂ Männlich" },
              { v: "female" as const, label: "♀ Weiblich" },
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
          <Step title="Dein Spielniveau">
            {SKILLS.map((s) => (
              <SelectRow
                key={s.value}
                selected={state.skill_level === s.value}
                onClick={() => dispatch({ type: "SET_SKILL", payload: s.value })}
              >
                <span className="block font-semibold">
                  <span className={`mr-2 inline-block h-2.5 w-2.5 rounded-full ${s.dot}`} />
                  {s.label}
                </span>
                <span className="block text-xs text-zinc-400">{s.desc}</span>
              </SelectRow>
            ))}
            {state.skill_level && (
              <div className="pt-4">
                <p className="mb-2 text-sm text-zinc-400">
                  Hast du ein offizielles Rating? (optional)
                </p>
                {ratingOptions ? (
                  <select
                    value={state.official_rating}
                    onChange={(e) =>
                      dispatch({ type: "SET_RATING", payload: e.target.value })
                    }
                    className="w-full rounded-xl bg-zinc-800 px-4 py-3.5 text-sm outline-none focus:ring-1 focus:ring-matchup"
                  >
                    <option value="">Kein Rating</option>
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
                    placeholder="z.B. 4.0 NTRP, UTR 8.5"
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
            title="Wie gross bist du?"
            subtitle="Optional — wird auf deinem Profil angezeigt."
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
              Überspringen
            </button>
          </Step>
        )}

        {/* Step 11 — Goals */}
        {state.step === 11 && (
          <Step
            title="Was suchst du?"
            subtitle="Wähle mindestens ein Ziel."
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
                  {g.label}
                </Chip>
              ))}
            </div>
          </Step>
        )}

        {/* Step 12 — Photos + Bio + Visibility */}
        {state.step === 12 && (
          <Step title="Dein Profil" subtitle="Fast geschafft!">
            {/* Photos */}
            <p className="text-sm font-semibold">Deine Fotos</p>
            <p className="-mt-2 text-xs text-zinc-500">
              Mindestens 1, bis zu 4 Fotos.
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
                          alt={`Foto ${i + 1}`}
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
            <p className="pt-4 text-sm font-semibold">Über dich</p>
            <textarea
              maxLength={300}
              rows={4}
              value={state.bio}
              onChange={(e) =>
                dispatch({ type: "SET_BIO", payload: e.target.value })
              }
              placeholder="Erzähle etwas über dich…"
              className="w-full rounded-xl bg-zinc-800 px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-matchup"
            />
            <p className="-mt-2 text-right text-xs text-zinc-500">
              {state.bio.length}/300
            </p>

            {/* Visibility */}
            <p className="pt-4 text-sm font-semibold">Wer soll dich finden?</p>
            <div className="flex gap-3">
              {[
                { v: "male", label: "Männer" },
                { v: "female", label: "Frauen" },
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
            <AgeRangeSlider
              valueMin={state.visibility_age_min}
              valueMax={state.visibility_age_max}
              onChange={(ageMin, ageMax) =>
                dispatch({
                  type: "SET_VISIBILITY",
                  payload: {
                    gender: state.visibility_gender,
                    ageMin,
                    ageMax,
                  },
                })
              }
            />

            {submitError && (
              <div className="rounded-xl bg-red-500/15 px-4 py-3 text-sm text-red-300">
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
            ? "Profil wird erstellt…"
            : isLast
              ? "Profil erstellen"
              : "Weiter"}
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
