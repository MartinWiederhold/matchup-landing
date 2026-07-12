"use client";

/* eslint-disable @next/next/no-img-element */
import { useRef, useState } from "react";
import { useT } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { compressImage } from "@/lib/utils/imageCompress";
import { useAppNav } from "../appNav";

/**
 * Post-Composer als helles Bottom-Sheet (Design wie /app/mockup2 Home):
 * „Abbrechen · Neuer Post · Teilen", Avatar + „Was gibt's Neues?", Foto-Button.
 * Schreibt in web.community_posts. Wird von Home + Community-Feed genutzt.
 */
export default function PostComposer({
  open,
  onClose,
  onPosted,
}: {
  open: boolean;
  onClose: () => void;
  onPosted?: () => void;
}) {
  const t = useT();
  const { profile } = useAppNav();
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [scope, setScope] = useState<"global" | "club">("global");
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  async function pickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const blob = await compressImage(file);
      const path = `${profile.id}/posts/${Date.now()}.jpg`;
      const { error } = await supabase.storage.from("web-avatars").upload(path, blob, { contentType: "image/jpeg" });
      if (!error) setImageUrl(supabase.storage.from("web-avatars").getPublicUrl(path).data.publicUrl);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function reset() {
    setContent("");
    setImageUrl(null);
    setScope("global");
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
    if (!error) {
      reset();
      onPosted?.();
      onClose();
    }
  }

  const canPost = (content.trim().length > 0 || !!imageUrl) && !saving && !uploading;

  return (
    <div className="fixed inset-0 z-[80] mx-auto flex max-w-[430px] items-end bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full rounded-t-[28px] border-t border-black/10 bg-white p-5 pb-[max(2rem,env(safe-area-inset-bottom))]" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <button type="button" onClick={onClose} className="text-sm font-medium text-neutral-500">{t("common.cancel")}</button>
          <span className="text-sm font-bold text-neutral-900">{t("community.newPostTitle")}</span>
          <button type="button" onClick={submit} disabled={!canPost} className="rounded-full bg-matchup px-4 py-1.5 text-sm font-bold text-white disabled:opacity-40">
            {saving ? t("community.posting") : t("community.share")}
          </button>
        </div>

        <div className="flex items-start gap-3">
          {profile.profile_image ? (
            <img src={profile.profile_image} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
          ) : (
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-sm font-bold text-neutral-500">{(profile.first_name?.[0] ?? "?").toUpperCase()}</span>
          )}
          <textarea
            autoFocus
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={1000}
            placeholder={t("community.postPlaceholder")}
            rows={3}
            className="min-h-[80px] flex-1 resize-none bg-transparent text-[16px] text-neutral-900 outline-none placeholder:text-neutral-400"
          />
        </div>

        {imageUrl && (
          <div className="relative mt-3">
            <img src={imageUrl} alt="" className="max-h-[300px] w-full rounded-2xl object-cover" />
            <button type="button" onClick={() => setImageUrl(null)} className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
            </button>
          </div>
        )}

        {profile.club_id && (
          <div className="mt-3 flex rounded-full bg-black/[0.05] p-1">
            {(["global", "club"] as const).map((s) => (
              <button key={s} type="button" onClick={() => setScope(s)} className={`flex-1 rounded-full py-1.5 text-[13px] font-semibold ${scope === s ? "bg-matchup text-white" : "text-neutral-500"}`}>
                {s === "global" ? t("community.postToGlobal") : t("community.postToClub")}
              </button>
            ))}
          </div>
        )}

        <div className="mt-4 flex items-center gap-3 border-t border-black/10 pt-4">
          <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="flex items-center gap-2 rounded-full bg-black/[0.05] px-3.5 py-2 text-sm font-semibold text-neutral-900 disabled:opacity-50">
            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] text-matchup" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M3 5h18v14H3zM3 15l5-5 4 4 3-3 6 6" /></svg>
            {uploading ? t("community.posting") : t("community.photo")}
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={pickImage} className="hidden" />
        </div>
      </div>
    </div>
  );
}
