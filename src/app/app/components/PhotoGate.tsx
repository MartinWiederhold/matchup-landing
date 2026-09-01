"use client";

import { useRef, useState } from "react";
import { useT } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import AvatarCropper from "./shared/AvatarCropper";

/**
 * Ganzseitige Foto-Sperre: der Nutzer kommt erst weiter, wenn er ein Profilbild
 * hochlädt. Wird genutzt in AppGuard (Profil ohne profile_image) und bei der
 * Foto-Moderation (Admin pausiert „echtes Foto verlangen"). Nach erfolgreichem
 * Upload läuft onUploaded (z. B. Profil neu laden bzw. Pause aufheben).
 */
export default function PhotoGate({
  userId,
  title,
  subtitle,
  onUploaded,
}: {
  userId: string;
  title: string;
  subtitle?: string;
  onUploaded: () => Promise<void> | void;
}) {
  const t = useT();
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  async function handleCropped(blob: Blob) {
    setCropFile(null);
    setBusy(true);
    try {
      // Pfad muss mit der eigenen uid beginnen (Storage-RLS: nur eigener Ordner).
      const path = `${userId}/avatar_${Date.now()}_0.jpg`;
      const { error } = await supabase.storage
        .from("web-avatars")
        .upload(path, blob, { contentType: "image/jpeg" });
      if (!error) {
        const { data: { publicUrl } } = supabase.storage.from("web-avatars").getPublicUrl(path);
        await supabase.from("profiles").update({ profile_image: publicUrl }).eq("id", userId);
        await onUploaded();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex h-dvh flex-col items-center justify-center bg-black px-8 text-center text-white">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white/10">
        <svg viewBox="0 0 24 24" className="h-9 w-9 text-white" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 8.5A2.5 2.5 0 0 1 5.5 6h1.2a1 1 0 0 0 .8-.4l.9-1.2A1 1 0 0 1 9.2 4h5.6a1 1 0 0 1 .8.4l.9 1.2a1 1 0 0 0 .8.4h1.2A2.5 2.5 0 0 1 21 8.5v8A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5z" />
          <circle cx="12" cy="12.5" r="3.2" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold leading-tight">{title}</h1>
      {subtitle && <p className="mt-3 max-w-xs text-sm text-zinc-400">{subtitle}</p>}

      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) setCropFile(f);
        }}
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => fileInput.current?.click()}
        className="mt-8 rounded-full bg-matchup px-8 py-3 text-sm font-bold text-white hover:bg-matchup-hover disabled:opacity-50"
      >
        {busy ? t("app.photoUploading") : t("app.uploadPhoto")}
      </button>

      {cropFile && (
        <AvatarCropper file={cropFile} onCancel={() => setCropFile(null)} onConfirm={handleCropped} />
      )}
    </div>
  );
}
