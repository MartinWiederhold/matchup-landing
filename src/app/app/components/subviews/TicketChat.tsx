"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { SupportMessage } from "@/lib/types";
import { useAppNav } from "../appNav";
import { SubViewHeader } from "../shared/ui";
import { SendIcon } from "../shared/icons";

export default function TicketChat({ ticketId }: { ticketId: string }) {
  const { profile } = useAppNav();
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("support_messages")
      .select("*")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });
    setMessages((data as SupportMessage[]) ?? []);
  }, [ticketId]);

  useEffect(() => {
    load();
    const channel = supabase
      .channel(`ticket:${ticketId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "web",
          table: "support_messages",
          filter: `ticket_id=eq.${ticketId}`,
        },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [load, ticketId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView();
  }, [messages]);

  async function send() {
    if (!text.trim()) return;
    const content = text.trim();
    setText("");
    await supabase.from("support_messages").insert({
      ticket_id: ticketId,
      sender_id: profile.id,
      sender_type: "user",
      content,
    });
  }

  return (
    <div className="flex h-full flex-col">
      <SubViewHeader title="Support-Ticket" />
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((m) => {
          const isUser = m.sender_type === "user";
          return (
            <div key={m.id} className={isUser ? "text-right" : ""}>
              {!isUser && (
                <span className="mb-1 inline-block rounded-full bg-matchup px-2 py-0.5 text-[10px] font-bold">
                  Support
                </span>
              )}
              <div
                className={`inline-block max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                  isUser ? "bg-matchup text-white" : "bg-zinc-800"
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
          <SendIcon size={18} className="text-white" />
        </button>
      </div>
    </div>
  );
}
