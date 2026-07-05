"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useT } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { compressImage } from "@/lib/utils/imageCompress";
import { haversineKm } from "@/lib/utils/haversine";
import { formatEventDate, formatDistance, sportLabel } from "@/lib/utils/formatters";
import type { EventItem, Sport } from "@/lib/types";

const SPORTS: Sport[] = ["tennis", "padel", "pickleball"];

/* Statische Beispiele — Fallback, falls die DB (noch) leer ist. */
const FALLBACK: EventItem[] = [
  {
    id: "fallback-1", created_by: null, creator_name: "Matchup", sport: "padel",
    title: "Summer Smash — Zürich",
    short_description: "Padel-Turnier für alle Level. Mixed-Teams, DJ und Afterparty.",
    description: "Das grosse Padel-Turnier des Sommers. Gespielt wird in Mixed-Teams über den ganzen Tag, abends DJ, Drinks und Afterparty.",
    image_url: "/events/event-1.jpg", location: "Padel Zone Zürich",
    latitude: 47.3769, longitude: 8.5417, event_date: "2026-07-12T10:00:00+02:00",
    max_participants: 32, status: "active", created_at: "", participants: [],
  },
  {
    id: "fallback-2", created_by: null, creator_name: "Matchup", sport: "tennis",
    title: "Matchup Mixednight — Bern",
    short_description: "Tennis Mixed-Doubles Abend. Zufällige Paarungen, lockere Atmosphäre.",
    description: "Ein entspannter Abend für Tennis-Doppel in zufälligen Mixed-Paarungen. Jede Runde neue Partner, am Ende kleines Ranking und Apéro.",
    image_url: "/events/event-2.jpg", location: "TC Bern-Neufeld",
    latitude: 46.948, longitude: 7.4474, event_date: "2026-07-19T18:00:00+02:00",
    max_participants: 24, status: "active", created_at: "", participants: [],
  },
  {
    id: "fallback-3", created_by: null, creator_name: "Matchup", sport: "pickleball",
    title: "Pickleball Open — Basel",
    short_description: "Das erste Schweizer Pickleball Open. Einsteiger bis Fortgeschrittene.",
    description: "Das allererste Schweizer Pickleball Open. Round-Robin in zwei Kategorien, Leihschläger vor Ort.",
    image_url: "/events/event-1.jpg", location: "Sportcenter St. Jakob, Basel",
    latitude: 47.5417, longitude: 7.6206, event_date: "2026-07-26T09:00:00+02:00",
    max_participants: 48, status: "active", created_at: "", participants: [],
  },
  {
    id: "fallback-4", created_by: null, creator_name: "Matchup", sport: "tennis",
    title: "Community Day — Luzern",
    short_description: "Offener Spieltag für die gesamte Matchup-Community. Alle Sportarten.",
    description: "Ein offener Spieltag für die ganze Community. Tennis, Padel und Pickleball auf allen Plätzen, dazu Grill, Musik und Mini-Turniere.",
    image_url: "/events/event-2.jpg", location: "Sportanlage Allmend, Luzern",
    latitude: 47.0379, longitude: 8.3, event_date: "2026-08-09T11:00:00+02:00",
    max_participants: 60, status: "active", created_at: "", participants: [],
  },
];

type Coords = { lat: number; lng: number };

export default function EventsExperience() {
  const t = useT();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [creatorName, setCreatorName] = useState<string | null>(null);
  const [coords, setCoords] = useState<Coords | null>(null);
  const [scope, setScope] = useState<"near" | "world">("world");
  const [query, setQuery] = useState("");
  const [detail, setDetail] = useState<EventItem | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [radius, setRadius] = useState(201); // 201 = weltweit
  const [sportFilter, setSportFilter] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("events")
      .select("*, participants:event_participants(id, user_id)")
      .eq("status", "active")
      .order("event_date", { ascending: true });
    const rows = (data as EventItem[]) ?? [];
    setEvents(rows.length ? rows : FALLBACK);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    supabase.auth.getSession().then(async ({ data }) => {
      const uid = data.session?.user.id ?? null;
      setUserId(uid);
      if (uid) {
        const { data: p } = await supabase
          .from("profiles")
          .select("first_name, display_name")
          .eq("id", uid)
          .maybeSingle();
        setCreatorName(
          p?.first_name || p?.display_name || t("events.defaultPlayerName"),
        );
      }
    });
  }, [load, t]);

  function enableNear() {
    // Sofort umschalten → der Umkreis-Regler erscheint direkt (sichtbares Feedback).
    setScope("near");
    if (coords || !navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: false, timeout: 8000 },
    );
  }

  const visible = useMemo(() => {
    let list = events.map((e) => {
      if (coords && e.latitude != null && e.longitude != null) {
        return { ...e, _distance: haversineKm(coords.lat, coords.lng, e.latitude, e.longitude) };
      }
      return e;
    });
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.location.toLowerCase().includes(q) ||
          sportLabel(e.sport).toLowerCase().includes(q),
      );
    }
    if (sportFilter) {
      list = list.filter((e) => e.sport === sportFilter);
    }
    // Umkreis (nur sinnvoll mit Standort): unter 201 km filtern, sonst weltweit.
    if (scope === "near" && coords && radius < 201) {
      list = list.filter((e) => (e._distance ?? 1e9) <= radius);
    }
    if (scope === "near" && coords) {
      list = [...list].sort((a, b) => (a._distance ?? 1e9) - (b._distance ?? 1e9));
    }
    return list;
  }, [events, coords, query, scope, sportFilter, radius]);

  return (
    <section className="bg-white px-4 py-16 sm:px-6 lg:px-12">
      <div className="mx-auto max-w-[1280px]">
        {/* Steuerleiste */}
        <div className="mb-8 space-y-3">
          {/* Toggle — kompakt & zentriert */}
          <div className="flex justify-center">
            <div className="inline-flex rounded-full bg-neutral-100 p-1">
              <button
                type="button"
                onClick={enableNear}
                className={`rounded-full px-4 py-1.5 text-[13px] font-semibold transition-colors ${
                  scope === "near" ? "bg-black text-white" : "text-neutral-600"
                }`}
              >
                {t("events.scopeNear")}
              </button>
              <button
                type="button"
                onClick={() => setScope("world")}
                className={`rounded-full px-4 py-1.5 text-[13px] font-semibold transition-colors ${
                  scope === "world" ? "bg-black text-white" : "text-neutral-600"
                }`}
              >
                {t("events.scopeWorld")}
              </button>
            </div>
          </div>

          {/* Umkreis-Regler — immer sichtbar bei „In der Nähe" (Desktop & Mobile).
              Distanz-Filter greift, sobald ein Standort vorliegt. */}
          {scope === "near" && (
            <div className="mx-auto max-w-2xl space-y-1.5">
              <div className="flex items-center gap-3 rounded-full bg-neutral-100 px-4 py-2.5">
                <span className="shrink-0 text-xs font-bold uppercase tracking-wide text-neutral-500">
                  {t("events.radiusLabel")}
                </span>
                <input
                  type="range"
                  min={5}
                  max={201}
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                  className="min-w-0 flex-1 accent-matchup"
                />
                <span className="w-24 shrink-0 text-right text-sm font-bold text-neutral-900">
                  {radius > 200
                    ? t("events.radiusWorldwide")
                    : t("events.radiusValue", { km: radius })}
                </span>
              </div>
              {locating ? (
                <p className="px-2 text-center text-xs text-neutral-500">{t("events.locating")}</p>
              ) : !coords ? (
                <button
                  type="button"
                  onClick={enableNear}
                  className="mx-auto block px-2 text-center text-xs font-semibold text-matchup underline"
                >
                  {t("events.locationDenied")}
                </button>
              ) : null}
            </div>
          )}

          {/* Suche + Filter + Erstellen */}
          <div className="mx-auto flex max-w-2xl items-center gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("events.searchPlaceholder")}
              className="h-11 min-w-0 flex-1 rounded-full border border-neutral-200 bg-neutral-50 px-5 text-base outline-none focus:border-black"
            />
            <button
              type="button"
              onClick={() => setShowFilter((v) => !v)}
              aria-label={t("events.filterLabel")}
              className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition-colors ${
                showFilter ? "border-black bg-black text-white" : "border-neutral-200 text-neutral-700"
              }`}
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 5h16M7 12h10M10 19h4" />
              </svg>
              {(sportFilter || (scope === "near" && radius < 201)) && (
                <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-matchup ring-2 ring-white" />
              )}
            </button>
            <button
              type="button"
              onClick={() => (userId ? setShowCreate(true) : (window.location.href = "/app"))}
              className="flex h-11 shrink-0 items-center rounded-full bg-matchup px-4 text-sm font-bold text-white transition-colors hover:bg-matchup-hover"
            >
              {t("events.createButton")}
            </button>
          </div>

          {/* Filter-Panel */}
          {showFilter && (
            <div className="mx-auto max-w-2xl space-y-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-neutral-500">
                  {t("events.filterLabel")}
                </p>
                <div className="flex flex-wrap gap-2">
                  {[null, "tennis", "padel", "pickleball"].map((s) => {
                    const active = sportFilter === s;
                    return (
                      <button
                        key={s ?? "all"}
                        type="button"
                        onClick={() => setSportFilter(s)}
                        className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${
                          active
                            ? "bg-black text-white"
                            : "bg-white text-neutral-700 ring-1 ring-neutral-200"
                        }`}
                      >
                        {s ? sportLabel(s as EventItem["sport"]) : t("events.sportAll")}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {scope === "near" && !coords && (
          <p className="mb-6 text-sm text-neutral-500">
            {t("events.locating")}
          </p>
        )}

        {/* Grid */}
        {loading ? (
          <div className="py-24 text-center text-neutral-400">{t("events.loading")}</div>
        ) : visible.length === 0 ? (
          <div className="py-24 text-center text-neutral-400">
            {t("events.empty")}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {visible.map((e) => (
              <EventCard key={e.id} event={e} onOpen={() => setDetail(e)} />
            ))}
          </div>
        )}
      </div>

      {detail && (
        <EventDetailModal
          event={detail}
          userId={userId}
          onClose={() => setDetail(null)}
          onChanged={() => {
            load();
            setDetail(null);
          }}
        />
      )}

      {showCreate && userId && (
        <CreateEventModal
          userId={userId}
          creatorName={creatorName ?? t("events.defaultPlayerName")}
          coords={coords}
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            load();
          }}
        />
      )}
    </section>
  );
}

/* ---------- Karte ---------- */
function EventCard({ event, onOpen }: { event: EventItem; onOpen: () => void }) {
  const t = useT();
  const count = event.participants?.length ?? 0;
  const full = count >= event.max_participants;
  return (
    <article className="flex flex-col overflow-hidden rounded-3xl border border-neutral-200">
      <div className="relative aspect-[16/9] bg-neutral-100">
        {event.image_url && (
          <Image
            src={event.image_url}
            alt={event.title}
            fill
            sizes="(max-width: 640px) 100vw, 50vw"
            className="object-cover"
          />
        )}
        {event.event_date && (
          <span className="absolute left-4 top-4 inline-flex rounded-full bg-matchup px-4 py-1.5 text-xs font-bold tracking-wide text-white">
            {formatEventDate(event.event_date)}
          </span>
        )}
        <span className="absolute right-4 top-4 inline-flex rounded-full bg-black/70 px-3 py-1.5 text-xs font-bold text-white backdrop-blur">
          {sportLabel(event.sport)}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-8">
        <h2 className="text-2xl font-bold tracking-tight">{event.title}</h2>
        <p className="mt-3 flex-1 text-sm leading-relaxed text-neutral-600">
          {event.short_description}
        </p>
        <div className="mt-5 flex items-center gap-4 text-sm font-medium text-neutral-500">
          <span className="inline-flex items-center gap-1.5">
            <PinIcon /> {event.location}
          </span>
          {event._distance != null && (
            <span className="text-matchup">{formatDistance(event._distance)}</span>
          )}
        </div>
        <p className="mt-2 text-sm font-medium text-neutral-500">
          {t("events.participants", { count, max: event.max_participants })}
          {full ? t("events.fullSuffix") : ""}
        </p>
        <button
          type="button"
          onClick={onOpen}
          className="mt-6 inline-block w-fit rounded-full border border-black px-7 py-3 text-sm font-bold tracking-wide text-black transition-colors hover:bg-black hover:text-white"
        >
          {t("events.learnMore")}
        </button>
      </div>
    </article>
  );
}

/* ---------- Detail-Modal ---------- */
function EventDetailModal({
  event,
  userId,
  onClose,
  onChanged,
}: {
  event: EventItem;
  userId: string | null;
  onClose: () => void;
  onChanged: () => void;
}) {
  const t = useT();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const count = event.participants?.length ?? 0;
  const joined = !!userId && (event.participants?.some((p) => p.user_id === userId) ?? false);
  const full = count >= event.max_participants;
  const isSeed = event.id.startsWith("fallback-");

  async function join() {
    if (!userId) {
      window.location.href = "/app";
      return;
    }
    setBusy(true);
    setError(null);
    const { error } = await supabase
      .from("event_participants")
      .insert({ event_id: event.id, user_id: userId });
    setBusy(false);
    if (error) {
      setError(full ? t("events.joinFull") : t("events.joinFailed"));
      return;
    }
    onChanged();
  }
  async function leave() {
    if (!userId) return;
    setBusy(true);
    await supabase
      .from("event_participants")
      .delete()
      .eq("event_id", event.id)
      .eq("user_id", userId);
    setBusy(false);
    onChanged();
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative aspect-[16/9] bg-neutral-100">
          {event.image_url && (
            <Image src={event.image_url} alt={event.title} fill sizes="512px" className="object-cover" />
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label={t("common.close")}
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur"
          >
            ✕
          </button>
          <span className="absolute left-4 top-4 inline-flex rounded-full bg-black/70 px-3 py-1.5 text-xs font-bold text-white backdrop-blur">
            {sportLabel(event.sport)}
          </span>
        </div>

        <div className="p-6 sm:p-8">
          <h2 className="text-2xl font-bold tracking-tight">{event.title}</h2>
          {event.creator_name && (
            <p className="mt-1 text-sm text-neutral-500">{t("events.by", { name: event.creator_name })}</p>
          )}

          <ul className="mt-5 space-y-2 text-sm text-neutral-700">
            {event.event_date && (
              <li className="flex items-center gap-2">
                <CalIcon /> {formatEventDate(event.event_date)}
              </li>
            )}
            <li className="flex items-center gap-2">
              <PinIcon /> {event.location}
              {event._distance != null && (
                <span className="text-matchup">· {formatDistance(event._distance)}</span>
              )}
            </li>
            <li className="flex items-center gap-2">
              <UsersIcon /> {t("events.participants", { count, max: event.max_participants })}
              {full && <span className="font-semibold text-red-500">· {t("events.full")}</span>}
            </li>
          </ul>

          {event.description && (
            <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-neutral-600">
              {event.description}
            </p>
          )}

          {error && <p className="mt-5 text-sm font-medium text-red-500">{error}</p>}

          {isSeed ? (
            <p className="mt-6 rounded-2xl bg-neutral-100 px-5 py-4 text-sm text-neutral-500">
              {t("events.seedNote")}
            </p>
          ) : joined ? (
            <button
              type="button"
              disabled={busy}
              onClick={leave}
              className="mt-6 w-full rounded-full border border-black py-3.5 text-sm font-bold text-black disabled:opacity-50"
            >
              {busy ? "…" : t("events.leave")}
            </button>
          ) : (
            <button
              type="button"
              disabled={busy || full}
              onClick={join}
              className="mt-6 w-full rounded-full bg-matchup py-3.5 text-sm font-bold text-white disabled:opacity-50"
            >
              {full ? t("events.fullButton") : busy ? "…" : userId ? t("events.join") : t("events.loginToJoin")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- Erstellen-Modal ---------- */
function CreateEventModal({
  userId,
  creatorName,
  coords,
  onClose,
  onCreated,
}: {
  userId: string;
  creatorName: string;
  coords: Coords | null;
  onClose: () => void;
  onCreated: () => void;
}) {
  const t = useT();
  const [sport, setSport] = useState<Sport>("tennis");
  const [title, setTitle] = useState("");
  const [shortDesc, setShortDesc] = useState("");
  const [desc, setDesc] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [maxP, setMaxP] = useState(20);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = title.trim() && shortDesc.trim() && location.trim();

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function submit() {
    if (!valid) return;
    setSaving(true);
    setError(null);
    let imageUrl: string | null = null;
    try {
      if (file) {
        const blob = await compressImage(file);
        const path = `${userId}/events/${Date.now()}.jpg`;
        const { error: upErr } = await supabase.storage
          .from("web-avatars")
          .upload(path, blob, { contentType: "image/jpeg" });
        if (upErr) throw upErr;
        imageUrl = supabase.storage.from("web-avatars").getPublicUrl(path).data.publicUrl;
      }
      const event_date =
        date && time ? new Date(`${date}T${time}`).toISOString() : date ? new Date(date).toISOString() : null;
      const { error: insErr } = await supabase.from("events").insert({
        created_by: userId,
        creator_name: creatorName,
        sport,
        title: title.trim(),
        short_description: shortDesc.trim(),
        description: desc.trim() || null,
        image_url: imageUrl,
        location: location.trim(),
        latitude: coords?.lat ?? null,
        longitude: coords?.lng ?? null,
        event_date,
        max_participants: maxP,
        status: "active",
      });
      if (insErr) throw insErr;
      onCreated();
    } catch {
      setError(t("events.createError"));
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-6 sm:rounded-3xl sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight">{t("events.createTitle")}</h2>
          <button type="button" onClick={onClose} aria-label={t("common.close")} className="text-neutral-400">
            ✕
          </button>
        </div>

        <div className="space-y-5">
          <Field label={t("events.fieldCover")}>
            <label className="flex aspect-[16/9] cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 text-sm text-neutral-400">
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt={t("events.coverPreviewAlt")} className="h-full w-full object-cover" />
              ) : (
                t("events.coverUpload")
              )}
              <input type="file" accept="image/*" onChange={onPick} className="hidden" />
            </label>
          </Field>

          <Field label={t("events.fieldSport")}>
            <div className="flex gap-2">
              {SPORTS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSport(s)}
                  className={`flex-1 rounded-xl py-2.5 text-sm font-semibold ${
                    sport === s ? "bg-matchup text-white" : "bg-neutral-100 text-neutral-600"
                  }`}
                >
                  {sportLabel(s)}
                </button>
              ))}
            </div>
          </Field>

          <Field label={t("events.fieldTitle")}>
            <Input value={title} onChange={setTitle} placeholder={t("events.titlePlaceholder")} />
          </Field>
          <Field label={t("events.fieldShortDesc")}>
            <Input value={shortDesc} onChange={setShortDesc} placeholder={t("events.shortDescPlaceholder")} />
          </Field>
          <Field label={t("events.fieldDesc")}>
            <textarea
              rows={4}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder={t("events.descPlaceholder")}
              className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none focus:border-black"
            />
          </Field>
          <Field label={t("events.fieldLocation")}>
            <Input value={location} onChange={setLocation} placeholder={t("events.locationPlaceholder")} />
          </Field>
          <div className="flex gap-3">
            <Field label={t("events.fieldDate")} className="flex-1">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none focus:border-black"
              />
            </Field>
            <Field label={t("events.fieldTime")} className="flex-1">
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none focus:border-black"
              />
            </Field>
          </div>
          <Field label={t("events.fieldMaxParticipants")}>
            <div className="flex items-center gap-4">
              <button type="button" onClick={() => setMaxP((n) => Math.max(2, n - 1))} className="h-10 w-10 rounded-full bg-neutral-100 text-lg">−</button>
              <span className="w-10 text-center text-lg font-bold">{maxP}</span>
              <button type="button" onClick={() => setMaxP((n) => Math.min(500, n + 1))} className="h-10 w-10 rounded-full bg-neutral-100 text-lg">+</button>
            </div>
          </Field>

          {error && <p className="text-sm font-medium text-red-500">{error}</p>}

          <button
            type="button"
            disabled={!valid || saving}
            onClick={submit}
            className="w-full rounded-full bg-matchup py-3.5 text-sm font-bold text-white disabled:opacity-50"
          >
            {saving ? t("events.creating") : t("events.publish")}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- kleine Helfer ---------- */
function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <p className="mb-2 text-sm font-semibold text-neutral-700">{label}</p>
      {children}
    </div>
  );
}
function Input({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none focus:border-black"
    />
  );
}
function PinIcon() {
  return (
    <svg className="h-4 w-4 shrink-0 text-matchup" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
function CalIcon() {
  return (
    <svg className="h-4 w-4 shrink-0 text-matchup" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}
function UsersIcon() {
  return (
    <svg className="h-4 w-4 shrink-0 text-matchup" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
