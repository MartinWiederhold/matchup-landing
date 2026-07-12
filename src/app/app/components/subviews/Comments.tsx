"use client";

import { useCallback, useEffect, useState } from "react";
import { useT } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { timeAgo } from "@/lib/utils/formatters";
import type { CommunityComment, CommunityPost } from "@/lib/types";
import { useAppNav } from "../appNav";
import Avatar from "../shared/Avatar";
import { SendIcon } from "../shared/icons";
import { SubViewHeader } from "../shared/ui";

export default function Comments({ postId }: { postId: string }) {
  const t = useT();
  const { profile } = useAppNav();
  const [post, setPost] = useState<CommunityPost | null>(null);
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [text, setText] = useState("");

  const load = useCallback(async () => {
    const { data: p } = await supabase
      .from("community_posts")
      .select("*, author:profiles!community_posts_author_id_fkey(*)")
      .eq("id", postId)
      .maybeSingle();
    setPost(p as CommunityPost | null);
    const { data: c } = await supabase
      .from("community_comments")
      .select("*, author:profiles!community_comments_author_id_fkey(*)")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });
    setComments((c as CommunityComment[]) ?? []);
  }, [postId]);

  useEffect(() => {
    load();
  }, [load]);

  async function send() {
    if (!text.trim()) return;
    const content = text.trim();
    setText("");
    await supabase
      .from("community_comments")
      .insert({ post_id: postId, author_id: profile.id, content });
    load();
  }

  async function deleteComment(id: string) {
    setComments((cs) => cs.filter((c) => c.id !== id));
    await supabase.from("community_comments").delete().eq("id", id);
  }

  return (
    <div className="flex h-full flex-col bg-white text-neutral-900">
      <SubViewHeader light title={t("matches.commentsTitle", { count: comments.length })} />
      <div className="flex-1 overflow-y-auto">
        {post && (
          <div className="border-b border-black/[0.08] p-4">
            <div className="flex items-center gap-2.5">
              <Avatar
                src={post.author?.profile_image}
                alt={post.author?.first_name}
                size="sm"
              />
              <span className="text-sm font-semibold">
                {post.author?.first_name}
              </span>
            </div>
            {post.content && (
              <p className="mt-2 whitespace-pre-wrap text-sm">{post.content}</p>
            )}
            {post.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={post.image_url}
                alt=""
                className="mt-3 max-h-80 w-full rounded-2xl object-cover"
              />
            )}
          </div>
        )}
        <ul className="divide-y divide-black/[0.06]">
          {comments.map((c) => (
            <li key={c.id} className="flex items-start gap-2.5 p-4">
              <Avatar
                src={c.author?.profile_image}
                alt={c.author?.first_name}
                size="sm"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm">
                  <span className="font-semibold">{c.author?.first_name}</span>{" "}
                  <span className="text-xs text-neutral-400">
                    · {timeAgo(c.created_at)}
                  </span>
                </p>
                <p className="text-sm text-neutral-700">{c.content}</p>
              </div>
              {c.author_id === profile.id && (
                <button
                  type="button"
                  onClick={() => deleteComment(c.id)}
                  aria-label={t("community.deleteComment")}
                  className="shrink-0 rounded-full px-2 py-1 text-xs text-neutral-400 hover:text-red-500"
                >
                  ✕
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
      <div className="flex shrink-0 items-center gap-2 border-t border-black/[0.08] px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder={t("matches.commentPlaceholder")}
          className="min-w-0 flex-1 rounded-full bg-black/[0.05] px-4 py-2.5 text-base text-neutral-900 outline-none placeholder:text-neutral-400"
        />
        <button
          type="button"
          onClick={send}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-matchup"
          aria-label={t("common.send")}
        >
          <SendIcon size={18} className="text-white" />
        </button>
      </div>
    </div>
  );
}
