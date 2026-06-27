"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { sportIcon, sportLabel } from "@/lib/utils/formatters";
import type { Group, GroupMember, GroupMessage } from "@/lib/types";
import { useAppNav } from "../appNav";
import Avatar from "../shared/Avatar";
import { FullLoading, SubViewHeader } from "../shared/ui";

export default function GroupDetail({ groupId }: { groupId: string }) {
  const { profile, closeSubView } = useAppNav();
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [tab, setTab] = useState<"chat" | "members">("chat");
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const { data: g } = await supabase
      .from("groups")
      .select("*")
      .eq("id", groupId)
      .maybeSingle();
    setGroup(g as Group | null);
    const { data: mem } = await supabase
      .from("group_members")
      .select("*, profile:profiles(*)")
      .eq("group_id", groupId);
    setMembers((mem as GroupMember[]) ?? []);
    const { data: msgs } = await supabase
      .from("group_messages")
      .select("*, sender:profiles(*)")
      .eq("group_id", groupId)
      .order("created_at", { ascending: true });
    setMessages((msgs as GroupMessage[]) ?? []);
  }, [groupId]);

  useEffect(() => {
    load();
    const channel = supabase
      .channel(`group:${groupId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "group_messages",
          filter: `group_id=eq.${groupId}`,
        },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [load, groupId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView();
  }, [messages, tab]);

  async function send() {
    if (!text.trim()) return;
    const content = text.trim();
    setText("");
    await supabase
      .from("group_messages")
      .insert({ group_id: groupId, sender_id: profile.id, content });
  }

  async function leave() {
    if (!window.confirm("Gruppe verlassen?")) return;
    await supabase
      .from("group_members")
      .delete()
      .eq("group_id", groupId)
      .eq("user_id", profile.id);
    closeSubView();
  }

  if (!group) return <FullLoading />;

  return (
    <div className="flex h-full flex-col">
      <SubViewHeader
        title={group.name}
        rightActions={
          <button type="button" onClick={leave} className="text-xs text-red-400">
            Verlassen
          </button>
        }
      />
      <div className="shrink-0 border-b border-zinc-800 px-4 py-2 text-xs text-zinc-400">
        {sportIcon(group.sport)} {sportLabel(group.sport)} · {members.length}{" "}
        Mitglieder
      </div>

      <div className="flex shrink-0 border-b border-zinc-800">
        {(["chat", "members"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex-1 border-b-2 py-2.5 text-sm font-semibold ${
              tab === t ? "border-matchup text-white" : "border-transparent text-zinc-500"
            }`}
          >
            {t === "chat" ? "Chat" : "Mitglieder"}
          </button>
        ))}
      </div>

      {tab === "chat" ? (
        <>
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((m) => {
              const mine = m.sender_id === profile.id;
              return (
                <div key={m.id} className={mine ? "text-right" : ""}>
                  {!mine && (
                    <p className="mb-0.5 text-xs text-zinc-500">
                      {m.sender?.first_name}
                    </p>
                  )}
                  <div
                    className={`inline-block max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                      mine ? "bg-matchup text-white" : "bg-zinc-800"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
          <div className="flex shrink-0 items-center gap-2 border-t border-zinc-800 p-3">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Nachricht…"
              className="flex-1 rounded-full bg-zinc-800 px-4 py-2.5 text-sm outline-none"
            />
            <button
              type="button"
              onClick={send}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-matchup"
              aria-label="Senden"
            >
              ➤
            </button>
          </div>
        </>
      ) : (
        <ul className="flex-1 divide-y divide-zinc-800 overflow-y-auto">
          {members.map((m) => (
            <li key={m.id} className="flex items-center gap-3 p-4">
              <Avatar
                src={m.profile?.profile_image}
                alt={m.profile?.first_name}
                size="md"
              />
              <span className="flex-1 font-semibold">{m.profile?.first_name}</span>
              <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs capitalize text-zinc-300">
                {m.role}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
