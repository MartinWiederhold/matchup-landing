"use client";

import { useCallback, useEffect, useState } from "react";
import { useT } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { timeAgo } from "@/lib/utils/formatters";
import type { CommunityPost } from "@/lib/types";
import { useAppNav } from "../appNav";
import Avatar from "../shared/Avatar";
import { MegaphoneIcon, PlusIcon, MessageIcon } from "../shared/icons";
import { FullLoading, EmptyState } from "../shared/ui";
import PostComposer from "../shared/PostComposer";

const REACTIONS = ["👍", "🎾", "🔥", "😂", "❤️", "👏"];
// Alt-Likes (reaction = 'like') als Daumen darstellen.
const normalize = (r: string) => (r === "like" ? "👍" : r);

export default function CommunityFeed() {
  const t = useT();
  const { profile, openSubView } = useAppNav();
  const [mode, setMode] = useState<"global" | "club">("global");
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [pickerFor, setPickerFor] = useState<string | null>(null);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from("community_posts")
      .select("*, author:profiles!community_posts_author_id_fkey(*)")
      .order("created_at", { ascending: false })
      .limit(50);
    q = mode === "club" ? q.eq("club_id", profile.club_id) : q.is("club_id", null);
    const { data } = await q;
    const rows = (data as CommunityPost[]) ?? [];

    const ids = rows.map((p) => p.id);
    if (ids.length) {
      const { data: reacts } = await supabase
        .from("community_likes")
        .select("post_id, user_id, reaction")
        .in("post_id", ids);
      const map = new Map<string, { counts: Record<string, number>; mine: string | null }>();
      ids.forEach((id) => map.set(id, { counts: {}, mine: null }));
      (reacts ?? []).forEach((r: { post_id: string; user_id: string; reaction: string }) => {
        const e = normalize(r.reaction);
        const entry = map.get(r.post_id);
        if (!entry) return;
        entry.counts[e] = (entry.counts[e] ?? 0) + 1;
        if (r.user_id === profile.id) entry.mine = e;
      });
      rows.forEach((p) => {
        const entry = map.get(p.id);
        p.reactions = entry?.counts ?? {};
        p.my_reaction = entry?.mine ?? null;
      });
    }
    setPosts(rows);
    setLoading(false);
  }, [profile.id, profile.club_id, mode]);

  useEffect(() => {
    load();
  }, [load]);

  function patch(id: string, fn: (p: CommunityPost) => CommunityPost) {
    setPosts((ps) => ps.map((p) => (p.id === id ? fn(p) : p)));
  }

  async function react(post: CommunityPost, emoji: string) {
    setPickerFor(null);
    const prev = post.my_reaction ?? null;
    if (prev === emoji) {
      // gleiche Reaktion → entfernen
      patch(post.id, (p) => {
        const counts = { ...p.reactions };
        counts[emoji] = Math.max(0, (counts[emoji] ?? 1) - 1);
        if (!counts[emoji]) delete counts[emoji];
        return { ...p, reactions: counts, my_reaction: null, likes_count: Math.max(0, p.likes_count - 1) };
      });
      await supabase
        .from("community_likes")
        .delete()
        .eq("post_id", post.id)
        .eq("user_id", profile.id);
    } else {
      patch(post.id, (p) => {
        const counts = { ...p.reactions };
        if (prev) counts[prev] = Math.max(0, (counts[prev] ?? 1) - 1);
        if (prev && !counts[prev]) delete counts[prev];
        counts[emoji] = (counts[emoji] ?? 0) + 1;
        return {
          ...p,
          reactions: counts,
          my_reaction: emoji,
          likes_count: p.likes_count + (prev ? 0 : 1),
        };
      });
      await supabase
        .from("community_likes")
        .upsert(
          { post_id: post.id, user_id: profile.id, reaction: emoji },
          { onConflict: "post_id,user_id" },
        );
    }
  }

  async function deletePost(post: CommunityPost) {
    setMenuFor(null);
    if (!window.confirm(t("community.deletePostConfirm"))) return;
    setPosts((ps) => ps.filter((p) => p.id !== post.id));
    await supabase.from("community_posts").delete().eq("id", post.id);
  }

  async function reportPost(post: CommunityPost) {
    setMenuFor(null);
    const reason = window.prompt(t("community.reportPrompt"));
    if (!reason) return;
    await supabase.from("reports").insert({
      reporter_id: profile.id,
      reported_user_id: post.author_id,
      reported_post_id: post.id,
      reason,
      status: "pending",
    });
    window.alert(t("community.reportThanks"));
  }

  if (loading) return <FullLoading />;

  return (
    <div className="relative flex flex-col">
      {/* Club / Global */}
      {profile.club_id && (
        <div className="flex shrink-0 gap-2 p-3">
          {(["global", "club"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`flex-1 rounded-full py-2 text-sm font-semibold ${
                mode === m ? "bg-matchup text-white" : "bg-neutral-100 text-neutral-500"
              }`}
            >
              {m === "global" ? t("community.scopeGlobal") : t("community.scopeClub")}
            </button>
          ))}
        </div>
      )}

      <div className="pb-24">
        {posts.length === 0 ? (
          <EmptyState
            icon={<MegaphoneIcon size={44} />}
            title={t("community.emptyTitle")}
            message={t("community.emptyMessage")}
          />
        ) : (
          <ul className="divide-y divide-black/[0.06]">
            {posts.map((post) => {
              const mine = post.author_id === profile.id;
              const emojis = Object.keys(post.reactions ?? {});
              return (
                <li key={post.id} className="p-4">
                  <div className="flex items-center gap-2.5">
                    <Avatar src={post.author?.profile_image} alt={post.author?.first_name} size="sm" />
                    <span className="text-sm font-semibold">
                      {post.author?.first_name ?? t("community.unknownPlayer")}
                    </span>
                    <span className="text-xs text-neutral-400">· {timeAgo(post.created_at)}</span>

                    {/* 3-Punkte-Menü */}
                    <div className="relative ml-auto">
                      <button
                        type="button"
                        onClick={() => setMenuFor((v) => (v === post.id ? null : post.id))}
                        aria-label={t("community.postMenu")}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 hover:bg-black/[0.05]"
                      >
                        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                          <circle cx="12" cy="5" r="1.6" />
                          <circle cx="12" cy="12" r="1.6" />
                          <circle cx="12" cy="19" r="1.6" />
                        </svg>
                      </button>
                      {menuFor === post.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setMenuFor(null)} />
                          <div className="absolute right-0 top-9 z-20 w-44 overflow-hidden rounded-xl bg-white p-1 shadow-xl ring-1 ring-black/10">
                            {mine ? (
                              <button
                                type="button"
                                onClick={() => deletePost(post)}
                                className="block w-full rounded-lg px-3 py-2.5 text-left text-sm text-amber-600 hover:bg-neutral-50"
                              >
                                {t("community.deletePost")}
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => reportPost(post)}
                                className="block w-full rounded-lg px-3 py-2.5 text-left text-sm text-neutral-700 hover:bg-neutral-50"
                              >
                                {t("community.reportPost")}
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {post.content && (
                    <p className="mt-3 whitespace-pre-wrap text-sm">{post.content}</p>
                  )}

                  {post.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={post.image_url}
                      alt=""
                      className="mt-3 max-h-96 w-full rounded-2xl object-cover"
                    />
                  )}

                  {/* Reaktions-Chips */}
                  {emojis.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {emojis.map((e) => (
                        <button
                          key={e}
                          type="button"
                          onClick={() => react(post, e)}
                          className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
                            post.my_reaction === e
                              ? "bg-matchup/10 text-matchup ring-1 ring-matchup/60"
                              : "bg-neutral-100 text-neutral-600"
                          }`}
                        >
                          <span>{e}</span>
                          {post.reactions?.[e]}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Aktionen */}
                  <div className="relative mt-3 flex items-center gap-4 text-sm text-neutral-500">
                    <button
                      type="button"
                      onClick={() => setPickerFor((v) => (v === post.id ? null : post.id))}
                      className={`flex items-center gap-1.5 ${post.my_reaction ? "text-matchup" : ""}`}
                    >
                      <span className="text-base">{post.my_reaction ?? "🙂"}</span>
                      {t("community.react")}
                    </button>
                    <button
                      type="button"
                      onClick={() => openSubView({ type: "comments", postId: post.id })}
                      className="flex items-center gap-1.5"
                    >
                      <MessageIcon size={15} /> {post.comments_count}
                    </button>

                    {/* Emoji-Palette */}
                    {pickerFor === post.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setPickerFor(null)} />
                        <div className="absolute bottom-8 left-0 z-20 flex gap-1 rounded-full bg-white p-1.5 shadow-xl ring-1 ring-black/10">
                          {REACTIONS.map((e) => (
                            <button
                              key={e}
                              type="button"
                              onClick={() => react(post, e)}
                              className={`flex h-9 w-9 items-center justify-center rounded-full text-xl transition-transform hover:scale-125 ${
                                post.my_reaction === e ? "bg-matchup/25" : ""
                              }`}
                            >
                              {e}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <button
        type="button"
        onClick={() => setComposerOpen(true)}
        className="absolute bottom-4 right-4 flex h-14 w-14 items-center justify-center rounded-full bg-matchup text-white shadow-lg"
        aria-label={t("community.createPostAria")}
      >
        <PlusIcon size={26} />
      </button>

      <PostComposer open={composerOpen} onClose={() => setComposerOpen(false)} onPosted={load} />
    </div>
  );
}
