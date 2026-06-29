"use client";

import { useCallback, useEffect, useState } from "react";
import { useT } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { timeAgo } from "@/lib/utils/formatters";
import type { CommunityPost } from "@/lib/types";
import { useAppNav } from "../appNav";
import Avatar from "../shared/Avatar";
import { MegaphoneIcon, PlusIcon, HeartIcon, MessageIcon } from "../shared/icons";
import { FullLoading, EmptyState } from "../shared/ui";

export default function CommunityFeed() {
  const t = useT();
  const { profile, openSubView } = useAppNav();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("community_posts")
      .select("*, author:profiles!community_posts_author_id_fkey(*)")
      .order("created_at", { ascending: false })
      .limit(50);

    const rows = (data as CommunityPost[]) ?? [];
    const { data: myLikes } = await supabase
      .from("community_likes")
      .select("post_id")
      .eq("user_id", profile.id);
    const liked = new Set((myLikes ?? []).map((l) => l.post_id));
    rows.forEach((p) => (p.is_liked_by_me = liked.has(p.id)));
    setPosts(rows);
    setLoading(false);
  }, [profile.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleLike(post: CommunityPost) {
    const liked = post.is_liked_by_me;
    setPosts((ps) =>
      ps.map((p) =>
        p.id === post.id
          ? {
              ...p,
              is_liked_by_me: !liked,
              likes_count: p.likes_count + (liked ? -1 : 1),
            }
          : p,
      ),
    );
    if (liked) {
      await supabase
        .from("community_likes")
        .delete()
        .eq("post_id", post.id)
        .eq("user_id", profile.id);
    } else {
      await supabase
        .from("community_likes")
        .insert({ post_id: post.id, user_id: profile.id });
    }
  }

  if (loading) return <FullLoading />;

  return (
    <div className="relative h-full">
      <div className="h-full overflow-y-auto pb-20">
        {posts.length === 0 ? (
          <EmptyState
            icon={<MegaphoneIcon size={44} />}
            title={t("community.emptyTitle")}
            message={t("community.emptyMessage")}
          />
        ) : (
          <ul className="divide-y divide-zinc-800">
            {posts.map((post) => (
              <li key={post.id} className="p-4">
                <div className="flex items-center gap-2.5">
                  <Avatar
                    src={post.author?.profile_image}
                    alt={post.author?.first_name}
                    size="sm"
                  />
                  <span className="text-sm font-semibold">
                    {post.author?.first_name ?? t("community.unknownPlayer")}
                  </span>
                  <span className="text-xs text-zinc-500">
                    · {timeAgo(post.created_at)}
                  </span>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm">{post.content}</p>
                <div className="mt-3 flex gap-4 text-sm text-zinc-400">
                  <button
                    type="button"
                    onClick={() => toggleLike(post)}
                    className={`flex items-center gap-1.5 ${post.is_liked_by_me ? "text-matchup" : ""}`}
                  >
                    <HeartIcon size={15} filled={post.is_liked_by_me} />{" "}
                    {post.likes_count}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      openSubView({ type: "comments", postId: post.id })
                    }
                    className="flex items-center gap-1.5"
                  >
                    <MessageIcon size={15} /> {post.comments_count}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        type="button"
        onClick={() => openSubView({ type: "create-post" })}
        className="absolute bottom-4 right-4 flex h-14 w-14 items-center justify-center rounded-full bg-matchup text-white shadow-lg"
        aria-label={t("community.createPostAria")}
      >
        <PlusIcon size={26} />
      </button>
    </div>
  );
}
