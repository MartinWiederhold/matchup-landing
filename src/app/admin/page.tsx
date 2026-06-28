"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  type Profile,
  type ReportRow,
  fetchProfilesMap,
  displayName,
  formatDate,
  ReportStatusBadge,
} from "@/components/admin/shared";

type Stats = {
  pending: number;
  real: number;
  seed: number;
  paused: number;
  banned: number;
  today: number;
};

type EnrichedReport = ReportRow & {
  reported?: Profile;
  reporter?: Profile;
};

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({
    pending: 0,
    real: 0,
    seed: 0,
    paused: 0,
    banned: 0,
    today: 0,
  });
  const [recentReports, setRecentReports] = useState<EnrichedReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const today = new Date().toISOString().split("T")[0];
        const [pending, real, seed, paused, banned, todayCount, reportsRes] =
          await Promise.all([
            supabase
              .from("reports")
              .select("*", { count: "exact", head: true })
              .eq("status", "pending"),
            supabase
              .from("profiles")
              .select("*", { count: "exact", head: true })
              .or("is_seed.is.null,is_seed.eq.false"),
            supabase
              .from("profiles")
              .select("*", { count: "exact", head: true })
              .eq("is_seed", true),
            supabase
              .from("profiles")
              .select("*", { count: "exact", head: true })
              .eq("is_paused", true)
              .or("is_seed.is.null,is_seed.eq.false"),
            supabase
              .from("profiles")
              .select("*", { count: "exact", head: true })
              .eq("is_banned", true)
              .or("is_seed.is.null,is_seed.eq.false"),
            supabase
              .from("profiles")
              .select("*", { count: "exact", head: true })
              .gte("created_at", today)
              .or("is_seed.is.null,is_seed.eq.false"),
            supabase
              .from("reports")
              .select("*")
              .order("created_at", { ascending: false })
              .limit(10),
          ]);

        const reports = (reportsRes.data || []) as ReportRow[];
        const profileMap = await fetchProfilesMap([
          ...reports.map((r) => r.reported_user_id),
          ...reports.map((r) => r.reporter_id),
        ]);

        if (!active) return;
        setStats({
          pending: pending.count || 0,
          real: real.count || 0,
          seed: seed.count || 0,
          paused: paused.count || 0,
          banned: banned.count || 0,
          today: todayCount.count || 0,
        });
        setRecentReports(
          reports.map((r) => ({
            ...r,
            reported: r.reported_user_id
              ? profileMap.get(r.reported_user_id)
              : undefined,
            reporter: r.reporter_id
              ? profileMap.get(r.reporter_id)
              : undefined,
          })),
        );
      } catch (e) {
        console.error("Dashboard load failed:", e);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  if (loading) return <div className="p-8 text-neutral-400">Laden...</div>;

  const cards: {
    label: string;
    value: number;
    accent?: boolean;
    danger?: boolean;
    warn?: boolean;
    href?: string;
  }[] = [
    {
      label: "Offene Reports",
      value: stats.pending,
      danger: stats.pending > 0,
      href: "/admin/reports",
    },
    { label: "Echte User", value: stats.real, href: "/admin/users" },
    { label: "Seed Profile", value: stats.seed, href: "/admin/users" },
    { label: "Pausiert", value: stats.paused, warn: stats.paused > 0 },
    { label: "Gesperrt", value: stats.banned, danger: stats.banned > 0 },
    { label: "Neue User heute", value: stats.today, accent: true },
  ];

  return (
    <div className="p-8">
      <h2 className="text-xl font-bold tracking-tight mb-6">Dashboard</h2>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {cards.map((card) => (
          <button
            key={card.label}
            onClick={() => card.href && router.push(card.href)}
            disabled={!card.href}
            className={`text-left bg-white border border-neutral-200 rounded-2xl p-4 ${
              card.href
                ? "cursor-pointer hover:border-black transition-colors"
                : "cursor-default"
            }`}
          >
            <p className="text-xs text-neutral-400 mb-1">{card.label}</p>
            <p
              className={`text-2xl font-bold ${
                card.danger
                  ? "text-red-600"
                  : card.warn
                    ? "text-orange-600"
                    : card.accent
                      ? "text-green-700"
                      : "text-black"
              }`}
            >
              {card.value}
            </p>
          </button>
        ))}
      </div>

      <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider mb-3">
        Letzte Reports
      </h3>
      <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden">
        {recentReports.length === 0 ? (
          <p className="p-6 text-sm text-neutral-400 text-center">
            Keine Reports vorhanden
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
              {recentReports.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => router.push(`/admin/reports/${r.id}`)}
                  className="border-b border-neutral-200 last:border-0 hover:bg-neutral-50 cursor-pointer"
                >
                  <td className="px-4 py-3 text-neutral-600">
                    {formatDate(r.created_at)}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {displayName(r.reported)}
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
