"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useT } from "@/lib/i18n";
import { useAppNav } from "../appNav";
import { SubViewHeader } from "../shared/ui";
import Avatar from "../shared/Avatar";

type Partner = { id: string; first_name: string | null; display_name: string | null; profile_image: string | null };
type Fb = { again: boolean | null; tags: string[] };
const TAG_KEYS = ["fbTagPunctual", "fbTagRallies", "fbTagFair", "fbTagFriendly", "fbTagLevel"] as const;

export default function GameReview({ gameId }: { gameId: string }) {
  const t = useT();
  const { profile, closeSubView } = useAppNav();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [fb, setFb] = useState<Record<string, Fb>>({});
  const [rating, setRating] = useState(0);
  const [good, setGood] = useState("");
  const [bad, setBad] = useState("");
  const [workOn, setWorkOn] = useState("");
  const [saving, setSaving] = useState(false);

  // Mitspieler des Spiels laden (akzeptierte Teilnehmer + Ersteller, ohne mich selbst)
  useEffect(() => {
    let active = true;
    (async () => {
      const [{ data: ev }, { data: parts }] = await Promise.all([
        supabase.from("game_events").select("created_by").eq("id", gameId).maybeSingle(),
        supabase.from("game_participants").select("user_id").eq("game_event_id", gameId).eq("status", "accepted"),
      ]);
      const ids = new Set<string>();
      if (ev?.created_by) ids.add(ev.created_by as string);
      for (const p of parts ?? []) ids.add((p as { user_id: string }).user_id);
      ids.delete(profile.id);
      if (!ids.size) return;
      const [{ data: profs }, { data: existing }] = await Promise.all([
        supabase.from("profiles").select("id, first_name, display_name, profile_image").in("id", [...ids]),
        supabase.from("game_feedback").select("subject_id, again, tags").eq("reviewer_id", profile.id).eq("game_event_id", gameId),
      ]);
      if (!active) return;
      setPartners((profs as Partner[]) ?? []);
      const pre: Record<string, Fb> = {};
      for (const r of existing ?? []) pre[(r as { subject_id: string }).subject_id] = { again: (r as { again: boolean }).again, tags: (r as { tags: string[] }).tags ?? [] };
      setFb(pre);
    })();
    return () => { active = false; };
  }, [gameId, profile.id]);

  const setAgain = (id: string, v: boolean) => setFb((f) => ({ ...f, [id]: { again: f[id]?.again === v ? null : v, tags: f[id]?.tags ?? [] } }));
  const toggleTag = (id: string, tag: string) =>
    setFb((f) => {
      const cur = f[id] ?? { again: null, tags: [] };
      const tags = cur.tags.includes(tag) ? cur.tags.filter((x) => x !== tag) : [...cur.tags, tag];
      return { ...f, [id]: { ...cur, tags } };
    });

  const anyFb = Object.values(fb).some((x) => x.again !== null || x.tags.length);
  const valid = anyFb || rating > 0 || good.trim() || bad.trim() || workOn.trim();

  async function save() {
    if (!valid || saving) return;
    setSaving(true);
    // 1) privates Partner-Feedback
    const rows = partners
      .filter((p) => fb[p.id] && (fb[p.id].again !== null || fb[p.id].tags.length))
      .map((p) => ({
        reviewer_id: profile.id,
        subject_id: p.id,
        game_event_id: gameId,
        again: fb[p.id].again ?? true,
        tags: fb[p.id].tags,
      }));
    if (rows.length) await supabase.from("game_feedback").upsert(rows, { onConflict: "reviewer_id,subject_id,game_event_id" });
    // 2) private Selbst-Notiz (bestehend)
    if (rating > 0 || good.trim() || bad.trim() || workOn.trim()) {
      await supabase.from("game_reviews").insert({
        user_id: profile.id,
        game_event_id: gameId,
        rating: rating || null,
        what_good: good.trim() || null,
        what_bad: bad.trim() || null,
        work_on: workOn.trim() || null,
      });
    }
    setSaving(false);
    closeSubView();
  }

  return (
    <div className="flex h-full flex-col">
      <SubViewHeader title={t("games.reviewTitle")} />
      <div className="flex-1 space-y-6 overflow-y-auto p-5">
        {/* Partner-Feedback (privat) */}
        {partners.length > 0 && (
          <div>
            <p className="text-sm font-semibold text-zinc-300">{t("games.fbHeading")}</p>
            <p className="mb-3 text-xs text-zinc-500">{t("games.fbIntro")}</p>
            <div className="space-y-3">
              {partners.map((p) => {
                const cur = fb[p.id] ?? { again: null, tags: [] };
                const name = p.display_name || p.first_name || "Spieler";
                return (
                  <div key={p.id} className="rounded-2xl bg-zinc-800/60 p-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar src={p.profile_image} alt={name} size="sm" />
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-zinc-100">{name}</span>
                      <span className="text-xs text-zinc-400">{t("games.fbAgain")}</span>
                      <button
                        type="button"
                        onClick={() => setAgain(p.id, true)}
                        className={`h-9 w-9 rounded-full text-base transition-colors ${cur.again === true ? "bg-emerald-500 text-white" : "bg-zinc-700 text-zinc-300"}`}
                        aria-label={t("games.fbYes")}
                      >
                        👍
                      </button>
                      <button
                        type="button"
                        onClick={() => setAgain(p.id, false)}
                        className={`h-9 w-9 rounded-full text-base transition-colors ${cur.again === false ? "bg-zinc-500 text-white" : "bg-zinc-700 text-zinc-300"}`}
                        aria-label={t("games.fbNo")}
                      >
                        👎
                      </button>
                    </div>
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {TAG_KEYS.map((k) => {
                        const label = t(`games.${k}`);
                        const on = cur.tags.includes(label);
                        return (
                          <button
                            key={k}
                            type="button"
                            onClick={() => toggleTag(p.id, label)}
                            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${on ? "bg-matchup text-white" : "bg-zinc-700 text-zinc-300"}`}
                          >
                            {on ? "✓ " : ""}{label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Selbst-Notiz (privat, unverändert) */}
        <p className="text-sm text-zinc-400">{t("games.reviewIntro")}</p>
        <div>
          <p className="mb-2 text-sm font-semibold text-zinc-300">{t("games.reviewRating")}</p>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                aria-label={`${n}`}
                className={`flex h-11 w-11 items-center justify-center rounded-full text-lg transition-colors ${n <= rating ? "bg-matchup text-white" : "bg-zinc-800 text-zinc-500"}`}
              >
                ★
              </button>
            ))}
          </div>
        </div>

        <ReviewField label={t("games.reviewGood")} placeholder={t("games.reviewGoodPlaceholder")} value={good} onChange={setGood} accent="border-l-emerald-400" />
        <ReviewField label={t("games.reviewBad")} placeholder={t("games.reviewBadPlaceholder")} value={bad} onChange={setBad} accent="border-l-amber-400" />
        <ReviewField label={t("games.reviewWorkOn")} placeholder={t("games.reviewWorkOnPlaceholder")} value={workOn} onChange={setWorkOn} accent="border-l-sky-400" />
      </div>

      <div className="shrink-0 border-t border-zinc-800 px-5 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          disabled={!valid || saving}
          onClick={save}
          className="w-full rounded-full bg-matchup py-3.5 text-sm font-bold text-white disabled:opacity-50"
        >
          {saving ? t("games.reviewSaving") : t("games.reviewSave")}
        </button>
      </div>
    </div>
  );
}

function ReviewField({
  label,
  placeholder,
  value,
  onChange,
  accent,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  accent: string;
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-zinc-300">{label}</p>
      <textarea
        rows={2}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-xl border-l-2 bg-zinc-800 px-4 py-3 text-sm outline-none ${accent}`}
      />
    </div>
  );
}
