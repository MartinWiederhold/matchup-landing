"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  type Profile,
  type ReportRow,
  fetchProfilesMap,
  displayName,
  formatDate,
  formatDateTime,
  ReportStatusBadge,
} from "@/components/admin/shared";

type FilterKey = "all" | "pending" | "reviewed" | "actioned" | "dismissed";

type EnrichedReport = ReportRow & {
  reported?: Profile;
  reporter?: Profile;
};

export default function ReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<EnrichedReport[]>([]);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("reports")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (filter !== "all") query = query.eq("status", filter);

      const { data } = await query;
      const rows = (data || []) as ReportRow[];
      const profileMap = await fetchProfilesMap([
        ...rows.map((r) => r.reported_user_id),
        ...rows.map((r) => r.reporter_id),
      ]);
      setReports(
        rows.map((r) => ({
          ...r,
          reported: r.reported_user_id
            ? profileMap.get(r.reported_user_id)
            : undefined,
          reporter: r.reporter_id ? profileMap.get(r.reporter_id) : undefined,
        })),
      );
    } catch (e) {
      console.error("Reports load failed:", e);
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const filters: { key: FilterKey; label: string }[] = [
    { key: "all", label: "Alle" },
    { key: "pending", label: "Offen" },
    { key: "reviewed", label: "Geprüft" },
    { key: "actioned", label: "Erledigt" },
    { key: "dismissed", label: "Verworfen" },
  ];

  return (
    <div className="p-8">
      <h2 className="text-xl font-bold tracking-tight mb-6">Reports</h2>

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
        ) : reports.length === 0 ? (
          <p className="p-6 text-sm text-neutral-400 text-center">
            Keine Reports gefunden
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left">
                <Th>Datum</Th>
                <Th>Gemeldeter User</Th>
                <Th>Melder</Th>
                <Th>Grund</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => router.push(`/admin/reports/${r.id}`)}
                  className="border-b border-neutral-200 last:border-0 hover:bg-neutral-50 cursor-pointer"
                >
                  <td className="px-4 py-3 text-neutral-600">
                    {formatDateTime(r.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {r.reported?.profile_image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={r.reported.profile_image}
                          className="w-7 h-7 rounded-full object-cover"
                          alt=""
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-neutral-100 flex items-center justify-center text-xs text-neutral-400">
                          ?
                        </div>
                      )}
                      <span className="font-medium">
                        {displayName(r.reported)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {displayName(r.reporter)}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {r.reason || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <ReportStatusBadge status={r.status} />
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
