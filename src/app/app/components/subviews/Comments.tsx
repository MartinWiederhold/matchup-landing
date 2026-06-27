"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { timeAgo } from "@/lib/utils/formatters";
import type { CommunityComment, CommunityPost } from "@/lib/types";
import { useAppNav } from "../appNav";
import Avatar from "../shared/Avatar";
import { SendIcon } from "../shared/icons";
import { SubViewHeader } from "../shared/ui";

export default function Comments({ postId }: { postId: string }) {
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

  return (
    <div className="flex h-full flex-col">
      <SubViewHeader title={`Kommentare (${comments.length})`} />
      <div className="flex-1 overflow-y-auto">
        {post && (
          <div className="border-b border-zinc-800 p-4">
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
            <p className="mt-2 whitespace-pre-wrap text-sm">{post.content}</p>
          </div>
        )}
        <ul className="divide-y divide-zinc-800">
          {comments.map((c) => (
            <li key={c.id} className="flex gap-2.5 p-4">
              <Avatar
                src={c.author?.profile_image}
                alt={c.author?.first_name}
                size="sm"
              />
              <div>
                <p className="text-sm">
                  <span className="font-semibold">{c.author?.first_name}</span>{" "}
                  <span className="text-xs text-zinc-500">
                    · {timeAgo(c.created_at)}
                  </span>
                </p>
                <p className="text-sm text-zinc-300">{c.content}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex shrink-0 items-center gap-2 border-t border-zinc-800 p-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Kommentar schreiben…"
          className="flex-1 rounded-full bg-zinc-800 px-4 py-2.5 text-sm outline-none"
        />
        <button
          type="button"
          onClick={send}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-matchup"
          aria-label="Senden"
        >
          <SendIcon size={18} className="text-white" />
        </button>
      </div>
    </div>
  );
}
