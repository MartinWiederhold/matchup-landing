"use client";

import { useEffect, useRef, useState } from "react";
import { useT } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import {
  searchClubs,
  searchClubsLive,
  saveClubCandidate,
  type ClubCandidate,
} from "@/lib/clubs";

/**
 * Club-Auswahl mit eigener DB + weltweiter OSM-Live-Suche (wie im Onboarding).
 * Zeigt den aktuell gewählten Club und erlaubt Ändern/Entfernen.
 */
export default function ClubPicker({
  clubId,
  clubName,
  country,
  lat,
  lng,
  onChange,
}: {
  clubId: string | null;
  clubName: string | null;
  country?: string | null;
  lat?: number | null;
  lng?: number | null;
  onChange: (clubId: string | null, clubName: string | null) => void;
}) {
  const t = useT();
  const [selName, setSelName] = useState<string | null>(clubName);
  const [editing, setEditing] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ClubCandidate[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const req = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Name aus der DB auflösen, falls nur eine club_id vorliegt — und dem Formular
  // melden, damit `location` gefüllt ist (sonst bleibt „Erstellen" ausgegraut).
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  useEffect(() => {
    if (clubId && !clubName) {
      supabase
        .from("clubs")
        .select("name")
        .eq("id", clubId)
        .maybeSingle()
        .then(({ data }) => {
          if (data?.name) {
            setSelName(data.name as string);
            onChangeRef.current(clubId, data.name as string);
          }
        });
    }
  }, [clubId, clubName]);

  function search(q: string) {
    setQuery(q);
    const token = ++req.current;
    if (q.trim().length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    searchClubs(q, country).then((db) => {
      if (token === req.current) setResults(db);
    });
    setSearching(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const live = await searchClubsLive(q, { lat, lng });
      if (token !== req.current) return;
      setSearching(false);
      setResults((prev) => {
        const key = (c: ClubCandidate) =>
          `${c.name}|${c.city ?? ""}`.toLowerCase();
        const seen = new Set(prev.map(key));
        return [...prev, ...live.filter((c) => !seen.has(key(c)))].slice(0, 18);
      });
    }, 450);
  }

  async function pick(c: ClubCandidate) {
    let club = c;
    if (c._osm || !c.id) {
      setSaving(true);
      const saved = await saveClubCandidate(c);
      setSaving(false);
      if (!saved) return;
      club = saved as ClubCandidate;
    }
    setSelName(club.name);
    setEditing(false);
    setQuery("");
    setResults([]);
    onChange(club.id, club.name);
  }

  function remove() {
    setSelName(null);
    setEditing(false);
    onChange(null, null);
  }

  if (selName && !editing) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl bg-zinc-800 px-4 py-3">
        <span className="truncate text-sm">{selName}</span>
        <div className="flex shrink-0 gap-3 text-xs font-semibold">
          <button type="button" onClick={() => setEditing(true)} className="text-matchup">
            {t("app.change")}
          </button>
          <button type="button" onClick={remove} className="text-zinc-400">
            {t("app.remove")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <input
        value={query}
        onChange={(e) => search(e.target.value)}
        placeholder={t("app.searchClubOrCity")}
        className="w-full rounded-xl bg-zinc-800 px-4 py-3 text-sm outline-none"
      />
      <div className="mt-1 space-y-1">
        {results.map((c, i) => (
          <button
            key={c.id || `osm-${c.latitude}-${c.longitude}-${i}`}
            type="button"
            onClick={() => pick(c)}
            className="block w-full rounded-lg bg-zinc-800 px-3 py-2 text-left"
          >
            <span className="flex items-center gap-2 text-sm">
              {c.name}
              {c._osm && (
                <span className="rounded-full bg-zinc-700 px-1.5 py-0.5 text-[10px] text-zinc-300">
                  {t("app.mapBadge")}
                </span>
              )}
            </span>
            {(c.address || c.city) && (
              <span className="mt-0.5 block text-xs text-zinc-400">
                {c.address || c.city}
              </span>
            )}
          </button>
        ))}
      </div>
      {searching && <p className="mt-1 text-xs text-zinc-500">{t("app.searchingWorldwide")}</p>}
      {saving && <p className="mt-1 text-xs text-matchup">{t("app.clubBeingAdded")}</p>}
      {selName && (
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="mt-2 text-xs text-zinc-400 underline"
        >
          {t("app.cancel")}
        </button>
      )}
    </div>
  );
}
