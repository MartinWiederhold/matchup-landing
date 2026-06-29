"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { useAppNav } from "../appNav";
import { SubViewHeader } from "../shared/ui";

export default function CreatePost() {
  const t = useT();
  const { profile, closeSubView } = useAppNav();
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!content.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("community_posts").insert({
      author_id: profile.id,
      content: content.trim(),
      club_id: null,
    });
    setSaving(false);
    if (!error) closeSubView();
  }

  return (
    <div className="flex h-full flex-col">
      <SubViewHeader title={t("community.newPostTitle")} />
      <div className="flex-1 p-5">
        <textarea
          autoFocus
          rows={6}
          maxLength={1000}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t("community.postPlaceholder")}
          className="w-full rounded-xl bg-zinc-800 px-4 py-3 text-sm outline-none"
        />
        <p className="mt-1 text-right text-xs text-zinc-500">
          {content.length}/1000
        </p>
      </div>
      <div className="shrink-0 border-t border-zinc-800 p-5">
        <button
          type="button"
          disabled={!content.trim() || saving}
          onClick={submit}
          className="w-full rounded-full bg-matchup py-3.5 text-sm font-bold text-white disabled:opacity-50"
        >
          {saving ? t("community.posting") : t("community.post")}
        </button>
      </div>
    </div>
  );
}
