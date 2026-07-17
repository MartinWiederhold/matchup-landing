"use client";

/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { adminAction } from "@/lib/adminAction";
import { Toast, formatDateTime } from "@/components/admin/shared";

type Author = { first_name: string | null; profile_image: string | null; city: string | null } | null;
type Post = {
  id: string;
  content: string | null;
  image_url: string | null;
  club_id: string | null;
  likes_count: number | null;
  comments_count: number | null;
  created_at: string;
  author_id: string;
  author: Author;
};

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [onlyImages, setOnlyImages] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Nicht eingeloggt");
      const res = await fetch(`/api/admin/posts${onlyImages ? "?withImages=1" : ""}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `Fehler (${res.status})`);
      setPosts(json.posts as Post[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [onlyImages]);

  useEffect(() => { load(); }, [load]);

  function showToast(m: string) {
    setToast(m);
    setTimeout(() => setToast(""), 3000);
  }

  async function remove(p: Post) {
    if (!confirm("Diesen Post wirklich unwiderruflich löschen?")) return;
    setBusyId(p.id);
    try {
      await adminAction("deletePost", { id: p.id });
      setPosts((list) => list.filter((x) => x.id !== p.id));
      showToast("Post gelöscht");
    } catch (e) {
      alert("Fehler: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setBusyId(null);
    }
  }

  const withImage = posts.filter((p) => p.image_url).length;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Community-Posts</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {posts.length} Posts{onlyImages ? "" : ` · ${withImage} mit Bild`}
          </p>
        </div>
        <label className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700">
          <input
            type="checkbox"
            checked={onlyImages}
            onChange={(e) => setOnlyImages(e.target.checked)}
            className="h-4 w-4 accent-[#4b3bf3]"
          />
          Nur mit Bild
        </label>
      </div>

      {loading ? (
        <p className="py-16 text-center text-sm text-neutral-400">Lädt…</p>
      ) : error ? (
        <p className="py-16 text-center text-sm text-red-500">{error}</p>
      ) : posts.length === 0 ? (
        <p className="py-16 text-center text-sm text-neutral-400">Keine Posts vorhanden.</p>
      ) : (
        <ul className="space-y-3">
          {posts.map((p) => (
            <li key={p.id} className="flex gap-4 rounded-2xl border border-neutral-200 bg-white p-4">
              {p.image_url ? (
                <button type="button" onClick={() => setLightbox(p.image_url)} className="shrink-0">
                  <img src={p.image_url} alt="" className="h-24 w-24 rounded-xl object-cover" />
                </button>
              ) : (
                <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-[11px] font-semibold text-neutral-400">
                  kein Bild
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {p.author?.profile_image ? (
                    <img src={p.author.profile_image} alt="" className="h-6 w-6 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-200 text-[10px] font-bold text-neutral-500">
                      {(p.author?.first_name?.[0] ?? "?").toUpperCase()}
                    </span>
                  )}
                  <span className="text-sm font-semibold text-neutral-900">{p.author?.first_name ?? "Unbekannt"}</span>
                  {p.club_id && <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-neutral-500">Club</span>}
                  <span className="ml-auto text-xs text-neutral-400">{formatDateTime(p.created_at)}</span>
                </div>

                {p.content && <p className="mt-2 whitespace-pre-wrap break-words text-sm text-neutral-700 line-clamp-4">{p.content}</p>}

                <div className="mt-2 flex items-center gap-4 text-xs text-neutral-400">
                  <span>♥ {p.likes_count ?? 0}</span>
                  <span>💬 {p.comments_count ?? 0}</span>
                  <button
                    type="button"
                    onClick={() => remove(p)}
                    disabled={busyId === p.id}
                    className="ml-auto rounded-full bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
                  >
                    {busyId === p.id ? "Löscht…" : "Löschen"}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6" onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="" className="max-h-full max-w-full rounded-2xl object-contain" />
        </div>
      )}

      {toast && <Toast message={toast} />}
    </div>
  );
}
