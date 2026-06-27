"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAppNav } from "../appNav";
import { SubViewHeader } from "../shared/ui";

export default function CreateTicket() {
  const { profile, closeSubView, openSubView } = useAppNav();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const valid = subject.trim() && message.trim();

  async function submit() {
    if (!valid) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("support_tickets")
      .insert({ user_id: profile.id, subject: subject.trim(), status: "open" })
      .select("id")
      .maybeSingle();
    if (!error && data) {
      await supabase.from("support_messages").insert({
        ticket_id: data.id,
        sender_id: profile.id,
        sender_type: "user",
        content: message.trim(),
      });
      setSaving(false);
      closeSubView();
      openSubView({ type: "ticket-chat", ticketId: data.id });
      return;
    }
    setSaving(false);
  }

  return (
    <div className="flex h-full flex-col">
      <SubViewHeader title="Neues Ticket" />
      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Betreff"
          className="w-full rounded-xl bg-zinc-800 px-4 py-3 text-sm outline-none"
        />
        <textarea
          rows={6}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Beschreibe dein Anliegen…"
          className="w-full rounded-xl bg-zinc-800 px-4 py-3 text-sm outline-none"
        />
      </div>
      <div className="shrink-0 border-t border-zinc-800 p-5">
        <button
          type="button"
          disabled={!valid || saving}
          onClick={submit}
          className="w-full rounded-full bg-matchup py-3.5 text-sm font-bold text-white disabled:opacity-50"
        >
          {saving ? "Wird gesendet…" : "Ticket erstellen"}
        </button>
      </div>
    </div>
  );
}
