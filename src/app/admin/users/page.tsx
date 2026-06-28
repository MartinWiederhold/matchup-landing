"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  type Profile,
  type ReportRow,
  displayName,
  formatDate,
  AccountStatusBadge,
} from "@/components/admin/shared";

type SeedTab = "real" | "seed";
type FilterKey = "all" | "active" | "paused" | "banned";

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<Profile[]>([]);
  const [reportCounts, setReportCounts] = useState<Map<string, number>>(
    new Map(),
  );
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [seedTab, setSeedTab] = useState<SeedTab>("real");
  const [counts, setCounts] = useState({ real: 0, seed: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function loadCounts() {
      try {
        const [real, seed] = await Promise.all([
          supabase
            .from("profiles")
            .select("*", { count: "exact", head: true })
            .or("is_seed.is.null,is_seed.eq.false"),
          supabase
            .from("profiles")
            .select("*", { count: "exact", head: true })
            .eq("is_seed", true),
        ]);
        if (!active) return;
        setCounts({ real: real.count || 0, seed: seed.count || 0 });
      } catch (e) {
        console.error("loadCounts failed:", e);
      }
    }
    loadCounts();
    return () => {
      active = false;
    };
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      if (seedTab === "real")
        query = query.or("is_seed.is.null,is_seed.eq.false");
      else query = query.eq("is_seed", true);

      if (filter === "paused") query = query.eq("is_paused", true);
      if (filter === "banned") query = query.eq("is_banned", true);
      if (filter === "active")
        query = query.eq("is_paused", false).eq("is_banned", false);

      const { data } = await query;
      const rows = (data || []) as Profile[];
      setUsers(rows);

      // Fetch report counts for these users (no embedded select).
      const ids = rows.map((u) => u.id);
      const map = new Map<string, number>();
      if (ids.length > 0) {
        const { data: reportRows } = await supabase
          .from("reports")
          .select("reported_user_id")
          .in("reported_user_id", ids);
        for (const r of (reportRows || []) as ReportRow[]) {
          if (!r.reported_user_id) continue;
          map.set(
            r.reported_user_id,
            (map.get(r.reported_user_id) || 0) + 1,
          );
        }
      }
      setReportCounts(map);
    } catch (e) {
      console.error("Users load failed:", e);
      setUsers([]);
      setReportCounts(new Map());
    } finally {
      setLoading(false);
    }
  }, [seedTab, filter]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = search.trim()
    ? users.filter((u) =>
        displayName(u).toLowerCase().includes(search.toLowerCase()),
      )
    : users;

  const filters: { key: FilterKey; label: string }[] = [
    { key: "all", label: "Alle" },
    { key: "active", label: "Aktiv" },
    { key: "paused", label: "Pausiert" },
    { key: "banned", label: "Gesperrt" },
  ];

  const seedTabs: { key: SeedTab; label: string }[] = [
    { key: "real", label: `Echte User (${counts.real})` },
    { key: "seed", label: `Seed Profile (${counts.seed})` },
  ];

  return (
    <div className="p-8">
      <h2 className="text-xl font-bold tracking-tight mb-6">Alle User</h2>

      <div className="flex gap-1 mb-5 border-b border-neutral-200">
        {seedTabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setSeedTab(t.key)}
            className={`px-4 py-2 text-sm font-semibold transition-colors -mb-px border-b-2 ${
              seedTab === t.key
                ? "border-black text-black"
                : "border-transparent text-neutral-400 hover:text-black"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Name suchen..."
          className="px-3 py-2 border border-neutral-200 rounded-xl text-sm w-64 focus:outline-none focus:border-black"
        />
        <div className="flex gap-2">
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
      </div>

      <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden">
        {loading ? (
          <p className="p-6 text-sm text-neutral-400 text-center">Laden...</p>
        ) : filtered.length === 0 ? (
          <p className="p-6 text-sm text-neutral-400 text-center">
            Keine User gefunden
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left">
                <Th>User</Th>
                <Th>Alter</Th>
                <Th>Geschlecht</Th>
                <Th>Sport</Th>
                <Th>Registriert</Th>
                <Th>Reports</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const reportCount = reportCounts.get(u.id) || 0;
                const images = (u.additional_images || []).slice(0, 3);
                return (
                  <tr
                    key={u.id}
                    onClick={() => router.push(`/admin/users/${u.id}`)}
                    className="border-b border-neutral-200 last:border-0 hover:bg-neutral-50 cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1 shrink-0">
                          {u.profile_image ? (
                            <Thumb url={u.profile_image} />
                          ) : null}
                          {images.map((url, i) => (
                            <Thumb key={i} url={url} />
                          ))}
                          {!u.profile_image && images.length === 0 && (
                            <div className="w-12 h-12 rounded-lg bg-neutral-100 flex items-center justify-center text-xs text-neutral-400">
                              ?
                            </div>
                          )}
                        </div>
                        <span className="font-medium">{displayName(u)}</span>
                        {u.is_seed && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-400 tracking-wider">
                            SEED
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {u.age || "—"}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {u.gender || "—"}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {(u.sports || []).join(", ") || "—"}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {formatDate(u.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      {reportCount > 0 ? (
                        <span className="bg-red-100 text-red-600 text-xs font-bold px-1.5 py-0.5 rounded-full">
                          {reportCount}
                        </span>
                      ) : (
                        "0"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <AccountStatusBadge profile={u} />
                    </td>
                  </tr>
                );
              })}
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

function Thumb({ url }: { url: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={url}
      className="w-12 h-12 rounded-lg object-cover border border-neutral-200"
      alt=""
    />
  );
}
