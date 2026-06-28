"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  type Profile,
  type TicketRow,
  fetchProfilesMap,
  displayName,
  formatDateTime,
  categoryLabel,
  TicketStatusBadge,
} from "@/components/admin/shared";

type FilterKey = "all" | "open" | "in_progress" | "closed";

type EnrichedTicket = TicketRow & { user?: Profile };

export default function SupportPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<EnrichedTicket[]>([]);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("support_tickets")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      if (filter === "in_progress") {
        query = query.in("status", ["in_progress", "answered"]);
      } else if (filter !== "all") {
        query = query.eq("status", filter);
      }

      const { data } = await query;
      const rows = (data || []) as TicketRow[];
      const userMap = await fetchProfilesMap(rows.map((t) => t.user_id));
      setTickets(
        rows.map((t) => ({
          ...t,
          user: t.user_id ? userMap.get(t.user_id) : undefined,
        })),
      );
    } catch (e) {
      console.error("Support load failed:", e);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const filters: { key: FilterKey; label: string }[] = [
    { key: "all", label: "Alle" },
    { key: "open", label: "Offen" },
    { key: "in_progress", label: "In Bearbeitung" },
    { key: "closed", label: "Geschlossen" },
  ];

  return (
    <div className="p-8">
      <h2 className="text-xl font-bold tracking-tight mb-6">Support</h2>

      <div className="flex flex-wrap gap-2 mb-4">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === f.key
                ? "bg-black text-white"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden">
        {loading ? (
          <p className="p-6 text-sm text-neutral-400 text-center">Laden...</p>
        ) : tickets.length === 0 ? (
          <p className="p-6 text-sm text-neutral-400 text-center">
            Keine Tickets gefunden
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left">
                <Th>Datum</Th>
                <Th>User</Th>
                <Th>Betreff</Th>
                <Th>Kategorie</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr
                  key={t.id}
                  onClick={() => router.push(`/admin/support/${t.id}`)}
                  className="border-b border-neutral-200 last:border-0 hover:bg-neutral-50 cursor-pointer"
                >
                  <td className="px-4 py-3 text-neutral-600">
                    {formatDateTime(t.updated_at || t.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {t.user?.profile_image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={t.user.profile_image}
                          className="w-7 h-7 rounded-full object-cover"
                          alt=""
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-neutral-100 flex items-center justify-center text-xs text-neutral-400">
                          ?
                        </div>
                      )}
                      <span className="font-medium">{displayName(t.user)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium">{t.subject || "—"}</td>
                  <td className="px-4 py-3 text-neutral-600">
                    {categoryLabel(t.category)}
                  </td>
                  <td className="px-4 py-3">
                    <TicketStatusBadge status={t.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-xs font-semibold text-neutral-400">
      {children}
    </th>
  );
}
