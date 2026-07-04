"use client";

import { useRef, useState } from "react";
import { useT } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { compressImage } from "@/lib/utils/imageCompress";
import { useAppNav } from "../appNav";
import { SubViewHeader } from "../shared/ui";

export default function CreatePost() {
  const t = useT();
  const { profile, closeSubView } = useAppNav();
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [scope, setScope] = useState<"global" | "club">("global");
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function pickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const blob = await compressImage(file);
      const path = `${profile.id}/posts/${Date.now()}.jpg`;
      const { error } = await supabase.storage
        .from("web-avatars")
        .upload(path, blob, { contentType: "image/jpeg" });
      if (!error) {
        setImageUrl(supabase.storage.from("web-avatars").getPublicUrl(path).data.publicUrl);
      }
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function submit() {
    if ((!content.trim() && !imageUrl) || saving) return;
    setSaving(true);
    const { error } = await supabase.from("community_posts").insert({
      author_id: profile.id,
      content: content.trim(),
      image_url: imageUrl,
      club_id: scope === "club" ? profile.club_id : null,
    });
    setSaving(false);
    if (!error) closeSubView();
  }

  const canPost = (content.trim().length > 0 || !!imageUrl) && !saving && !uploading;

  return (
    <div className="flex h-full flex-col">
      <SubViewHeader title={t("community.newPostTitle")} />
      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        <textarea
          rows={5}
          maxLength={1000}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t("community.postPlaceholder")}
          className="w-full rounded-xl bg-zinc-800 px-4 py-3 text-base outline-none"
        />
        <p className="-mt-2 text-right text-xs text-zinc-500">{content.length}/1000</p>

        {/* Foto */}
        {imageUrl ? (
          <div className="relative overflow-hidden rounded-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="" className="max-h-80 w-full object-cover" />
            <button
              type="button"
              onClick={() => setImageUrl(null)}
              className="absolute right-2 top-2 rounded-full bg-black/60 px-3 py-1.5 text-xs font-semibold text-white"
            >
              {t("community.removePhoto")}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-700 py-4 text-sm font-semibold text-zinc-300 disabled:opacity-50"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
            {uploading ? t("community.posting") : t("community.addPhoto")}
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={pickImage}
          className="hidden"
        />

        {/* Sichtbarkeit (nur mit Club) */}
        {profile.club_id && (
          <div className="flex rounded-full bg-zinc-800 p-1">
            {(["global", "club"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setScope(s)}
                className={`flex-1 rounded-full py-2 text-sm font-semibold transition-colors ${
                  scope === s ? "bg-matchup text-white" : "text-zinc-400"
                }`}
              >
                {s === "global" ? t("community.postToGlobal") : t("community.postToClub")}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-zinc-800 px-5 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          disabled={!canPost}
          onClick={submit}
          className="w-full rounded-full bg-matchup py-3.5 text-sm font-bold text-white disabled:opacity-50"
        >
          {saving ? t("community.posting") : t("community.post")}
        </button>
      </div>
    </div>
  );
}
