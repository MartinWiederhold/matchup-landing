"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { timeAgo } from "@/lib/utils/formatters";
import type { SupportTicket } from "@/lib/types";
import { useAppNav } from "../appNav";
import { FullLoading, EmptyState, SubViewHeader } from "../shared/ui";

const STATUS_LABEL: Record<string, string> = {
  open: "Offen",
  answered: "Beantwortet",
  in_progress: "In Bearbeitung",
  closed: "Geschlossen",
};

export default function Support() {
  const { profile, openSubView } = useAppNav();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("support_tickets")
      .select("*")
      .eq("user_id", profile.id)
      .order("updated_at", { ascending: false });
    setTickets((data as SupportTicket[]) ?? []);
    setLoading(false);
  }, [profile.id]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="flex h-full flex-col">
      <SubViewHeader title="Support" />
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <FullLoading />
        ) : tickets.length === 0 ? (
          <EmptyState
            icon="🎫"
            title="Keine Tickets"
            message="Erstelle ein Ticket, wenn du Hilfe brauchst."
          />
        ) : (
          <ul className="space-y-3">
            {tickets.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() =>
                    openSubView({ type: "ticket-chat", ticketId: t.id })
                  }
                  className="block w-full rounded-2xl bg-zinc-900 p-4 text-left"
                >
                  <p className="font-semibold">{t.subject}</p>
                  <p className="mt-1 text-xs text-zinc-400">
                    Status: {STATUS_LABEL[t.status] ?? t.status} ·{" "}
                    {timeAgo(t.updated_at)}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="shrink-0 border-t border-zinc-800 p-4">
        <button
          type="button"
          onClick={() => openSubView({ type: "create-ticket" })}
          className="w-full rounded-full bg-matchup py-3 text-sm font-bold text-white"
        >
          + Neues Ticket erstellen
        </button>
      </div>
    </div>
  );
}
