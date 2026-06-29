"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Entry = {
  id: string;
  email: string;
  feature: string | null;
  locale: string | null;
  created_at: string;
};

export default function AdminWaitlistPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
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
      const res = await fetch("/api/admin/waitlist", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `Fehler (${res.status})`);
      setEntries(json.entries as Entry[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function exportCsv() {
    const rows = [
      ["E-Mail", "Feature", "Sprache", "Datum"],
      ...entries.map((e) => [
        e.email,
        e.feature ?? "",
        e.locale ?? "",
        new Date(e.created_at).toISOString(),
      ]),
    ];
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `waitlist-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-6 sm:p-8">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Waitlist</h1>
          <p className="text-sm text-neutral-400">
            {entries.length} Eintrag{entries.length === 1 ? "" : "e"} — E-Mails der
            Interessenten.
          </p>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          disabled={entries.length === 0}
          className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-semibold hover:bg-neutral-50 disabled:opacity-50"
        >
          CSV exportieren
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-neutral-400">Lädt…</p>
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : entries.length === 0 ? (
        <p className="text-sm text-neutral-400">Noch keine Anmeldungen.</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-neutral-200">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-3">E-Mail</th>
                <th className="px-4 py-3">Feature</th>
                <th className="px-4 py-3">Sprache</th>
                <th className="px-4 py-3">Datum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {entries.map((e) => (
                <tr key={e.id}>
                  <td className="px-4 py-3 font-medium">{e.email}</td>
                  <td className="px-4 py-3 text-neutral-600">{e.feature ?? "—"}</td>
                  <td className="px-4 py-3 uppercase text-neutral-500">
                    {e.locale ?? "—"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-neutral-600">
                    {new Date(e.created_at).toLocaleString("de-CH", {
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
