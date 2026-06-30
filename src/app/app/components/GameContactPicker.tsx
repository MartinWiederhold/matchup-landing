"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useT } from "@/lib/i18n";
import Avatar from "./shared/Avatar";

type Contact = {
  id: string;
  first_name: string;
  profile_image: string | null;
  freq: number;
};

export default function GameContactPicker({
  meId,
  selected,
  onChange,
}: {
  meId: string;
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const t = useT();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: m } = await supabase
        .from("matches")
        .select("user1_id, user2_id")
        .or(`user1_id.eq.${meId},user2_id.eq.${meId}`);
      const ids = [
        ...new Set(
          (m ?? []).map((x: { user1_id: string; user2_id: string }) =>
            x.user1_id === meId ? x.user2_id : x.user1_id,
          ),
        ),
      ];
      if (!ids.length) {
        if (active) {
          setContacts([]);
          setLoading(false);
        }
        return;
      }
      const [{ data: profs }, { data: myGP }] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, first_name, profile_image")
          .in("id", ids),
        supabase.from("game_participants").select("game_event_id").eq("user_id", meId),
      ]);
      const myGames = (myGP ?? []).map(
        (r: { game_event_id: string }) => r.game_event_id,
      );
      const freq: Record<string, number> = {};
      if (myGames.length) {
        const { data: co } = await supabase
          .from("game_participants")
          .select("user_id, game_event_id")
          .in("game_event_id", myGames);
        (co ?? []).forEach((r: { user_id: string }) => {
          if (r.user_id !== meId) freq[r.user_id] = (freq[r.user_id] ?? 0) + 1;
        });
      }
      const list: Contact[] = (
        (profs as { id: string; first_name: string; profile_image: string | null }[]) ??
        []
      ).map((p) => ({ ...p, freq: freq[p.id] ?? 0 }));
      list.sort(
        (a, b) => b.freq - a.freq || a.first_name.localeCompare(b.first_name),
      );
      if (active) {
        setContacts(list);
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [meId]);

  const filtered = useMemo(
    () =>
      contacts.filter((c) =>
        c.first_name.toLowerCase().includes(q.trim().toLowerCase()),
      ),
    [contacts, q],
  );

  function toggle(id: string) {
    onChange(
      selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id],
    );
  }

  if (loading) {
    return <p className="text-sm text-zinc-500">{t("common.loading")}</p>;
  }
  if (contacts.length === 0) {
    return <p className="text-sm text-zinc-500">{t("games.noContacts")}</p>;
  }

  const selectedContacts = contacts.filter((c) => selected.includes(c.id));

  return (
    <div className="space-y-3">
      {/* Ausgewählte als Kreis-Avatare */}
      {selectedContacts.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {selectedContacts.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => toggle(c.id)}
              className="flex w-14 flex-col items-center gap-1"
            >
              <span className="relative">
                <Avatar src={c.profile_image} alt={c.first_name} size="md" />
                <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-matchup text-xs text-white ring-2 ring-black">
                  ×
                </span>
              </span>
              <span className="w-full truncate text-center text-[11px] text-zinc-300">
                {c.first_name}
              </span>
            </button>
          ))}
        </div>
      )}

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t("games.searchContacts")}
        className="w-full rounded-xl bg-zinc-800 px-4 py-2.5 text-sm outline-none"
      />

      <div className="max-h-64 space-y-1 overflow-y-auto">
        {filtered.map((c) => {
          const on = selected.includes(c.id);
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => toggle(c.id)}
              className={`flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors ${
                on ? "bg-matchup/15 ring-1 ring-matchup" : "hover:bg-zinc-800/60"
              }`}
            >
              <Avatar src={c.profile_image} alt={c.first_name} size="sm" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">
                  {c.first_name}
                </span>
                {c.freq > 0 && (
                  <span className="block text-[11px] text-zinc-400">
                    {t("games.playedTogether", { count: c.freq })}
                  </span>
                )}
              </span>
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                  on ? "bg-matchup text-white" : "ring-1 ring-zinc-600 text-transparent"
                }`}
              >
                ✓
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
