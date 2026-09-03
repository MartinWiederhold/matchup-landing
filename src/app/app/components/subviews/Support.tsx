"use client";

import { useCallback, useEffect, useState } from "react";
import { useT } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { timeAgo } from "@/lib/utils/formatters";
import type { SupportTicket } from "@/lib/types";
import { useAppNav } from "../appNav";
import { FullLoading, EmptyState, SubViewHeader } from "../shared/ui";
import { TicketIcon } from "../shared/icons";

export default function Support() {
  const t = useT();
  const { profile, openSubView } = useAppNav();
  const STATUS_LABEL: Record<string, string> = {
    open: t("support.statusOpen"),
    answered: t("support.statusAnswered"),
    in_progress: t("support.statusInProgress"),
    closed: t("support.statusClosed"),
  };
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
      <SubViewHeader title={t("support.title")} />
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <FullLoading />
        ) : tickets.length === 0 ? (
          <EmptyState
            icon={<TicketIcon size={44} />}
            title={t("support.noTicketsTitle")}
            message={t("support.noTicketsMessage")}
          />
        ) : (
          <ul className="space-y-3">
            {tickets.map((ticket) => (
              <li key={ticket.id}>
                <button
                  type="button"
                  onClick={() =>
                    openSubView({ type: "ticket-chat", ticketId: ticket.id })
                  }
                  className="block w-full rounded-2xl bg-zinc-900 p-4 text-left"
                >
                  <p className="font-semibold">{ticket.subject}</p>
                  <p className="mt-1 text-xs text-zinc-400">
                    {t("support.statusLabel", {
                      status: STATUS_LABEL[ticket.status] ?? ticket.status,
                      time: timeAgo(ticket.updated_at),
                    })}
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
          {t("support.newTicket")}
        </button>
      </div>
    </div>
  );
}
