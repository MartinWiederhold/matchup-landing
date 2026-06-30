"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Row = {
  id: string;
  action: "unmatch" | "block";
  reason: string | null;
  created_at: string;
};

export default function AdminDissolutionsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Nicht eingeloggt");
      const res = await fetch("/api/admin/dissolutions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `Fehler (${res.status})`);
      setRows(json.entries as Row[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const unmatch = rows.filter((r) => r.action === "unmatch").length;
    const block = rows.filter((r) => r.action === "block").length;
    const withReason = rows.filter((r) => r.reason?.trim()).length;
    return { unmatch, block, withReason, total: rows.length };
  }, [rows]);

  return (
    <div className="p-6 sm:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight">Match-Auflösungen</h1>
        <p className="text-sm text-neutral-400">
          Warum und wie oft Matches aufgelöst oder Nutzer blockiert werden.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Gesamt" value={stats.total} />
        <Stat label="Aufgelöst" value={stats.unmatch} />
        <Stat label="Blockiert" value={stats.block} />
        <Stat label="Mit Grund" value={stats.withReason} />
      </div>

      {loading ? (
        <p className="text-sm text-neutral-400">Lädt…</p>
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-neutral-400">Noch keine Auflösungen.</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-neutral-200">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-3">Aktion</th>
                <th className="px-4 py-3">Grund</th>
                <th className="px-4 py-3">Datum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        r.action === "block"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-neutral-200 text-neutral-700"
                      }`}
                    >
                      {r.action === "block" ? "Blockiert" : "Aufgelöst"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-neutral-700">{r.reason || "—"}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-neutral-600">
                    {new Date(r.created_at).toLocaleString("de-CH", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-neutral-200 p-4">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-neutral-500">{label}</p>
    </div>
  );
}
