"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useT } from "@/lib/i18n";
import { useAppNav } from "../appNav";
import { SubViewHeader } from "../shared/ui";

export default function GameReview({ gameId }: { gameId: string }) {
  const t = useT();
  const { profile, closeSubView } = useAppNav();
  const [rating, setRating] = useState(0);
  const [good, setGood] = useState("");
  const [bad, setBad] = useState("");
  const [workOn, setWorkOn] = useState("");
  const [saving, setSaving] = useState(false);

  const valid = rating > 0 || good.trim() || bad.trim() || workOn.trim();

  async function save() {
    if (!valid || saving) return;
    setSaving(true);
    const { error } = await supabase.from("game_reviews").insert({
      user_id: profile.id,
      game_event_id: gameId,
      rating: rating || null,
      what_good: good.trim() || null,
      what_bad: bad.trim() || null,
      work_on: workOn.trim() || null,
    });
    setSaving(false);
    if (!error) closeSubView();
  }

  return (
    <div className="flex h-full flex-col">
      <SubViewHeader title={t("games.reviewTitle")} />
      <div className="flex-1 space-y-6 overflow-y-auto p-5">
        <p className="text-sm text-zinc-400">{t("games.reviewIntro")}</p>

        <div>
          <p className="mb-2 text-sm font-semibold text-zinc-300">
            {t("games.reviewRating")}
          </p>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                aria-label={`${n}`}
                className={`flex h-11 w-11 items-center justify-center rounded-full text-lg transition-colors ${
                  n <= rating
                    ? "bg-matchup text-white"
                    : "bg-zinc-800 text-zinc-500"
                }`}
              >
                ★
              </button>
            ))}
          </div>
        </div>

        <ReviewField
          label={t("games.reviewGood")}
          placeholder={t("games.reviewGoodPlaceholder")}
          value={good}
          onChange={setGood}
          accent="border-l-emerald-400"
        />
        <ReviewField
          label={t("games.reviewBad")}
          placeholder={t("games.reviewBadPlaceholder")}
          value={bad}
          onChange={setBad}
          accent="border-l-amber-400"
        />
        <ReviewField
          label={t("games.reviewWorkOn")}
          placeholder={t("games.reviewWorkOnPlaceholder")}
          value={workOn}
          onChange={setWorkOn}
          accent="border-l-sky-400"
        />
      </div>

      <div className="shrink-0 border-t border-zinc-800 p-5">
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
