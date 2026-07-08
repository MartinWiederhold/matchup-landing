"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { adminAction } from "@/lib/adminAction";
import { Toast } from "@/components/admin/shared";
import { TIER_META, type Tournament } from "@/lib/tournaments";
import { cutoffFor } from "@/lib/player";

type Row = {
  id: string;
  name: string;
  city: string | null;
  tier: Tournament["tier"];
  start_date: string | null;
  cut_direct: number | null;
  cut_quali: number | null;
  cut_source: string | null;
};

export default function AdminCutoffsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [edits, setEdits] = useState<Record<string, { direct: string; quali: string }>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("tournaments")
      .select("id,name,city,tier,start_date,cut_direct,cut_quali,cut_source")
      .eq("status", "active")
      .order("start_date");
    setRows((data as Row[]) ?? []);
    setLoading(false);
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  function showToast(m: string) {
    setToast(m);
    setTimeout(() => setToast(""), 3000);
  }

  const val = (r: Row, k: "direct" | "quali") =>
    edits[r.id]?.[k] ?? (k === "direct" ? r.cut_direct : r.cut_quali)?.toString() ?? "";
  const setVal = (id: string, k: "direct" | "quali", v: string) =>
    setEdits((e) => ({ ...e, [id]: { direct: e[id]?.direct ?? "", quali: e[id]?.quali ?? "", [k]: v } }));

  async function save(r: Row) {
    setBusy(r.id);
    try {
      const direct = val(r, "direct").trim();
      const quali = val(r, "quali").trim();
      await adminAction("saveCutoff", { id: r.id, cutDirect: direct || null, cutQuali: quali || null });
      const cd = direct ? parseInt(direct, 10) : null;
      const cq = quali ? parseInt(quali, 10) : null;
      setRows((rs) => rs.map((x) => (x.id === r.id ? { ...x, cut_direct: cd, cut_quali: cq, cut_source: cd != null ? "official" : null } : x)));
      setEdits((e) => { const n = { ...e }; delete n[r.id]; return n; });
      showToast("Cut-Off gespeichert");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Fehler");
    } finally {
      setBusy(null);
    }
  }

  async function reset(r: Row) {
    setBusy(r.id);
    try {
      await adminAction("saveCutoff", { id: r.id, cutDirect: null, cutQuali: null });
      setRows((rs) => rs.map((x) => (x.id === r.id ? { ...x, cut_direct: null, cut_quali: null, cut_source: null } : x)));
      setEdits((e) => { const n = { ...e }; delete n[r.id]; return n; });
      showToast("Auf Richtwert zurückgesetzt");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Fehler");
    } finally {
      setBusy(null);
    }
  }

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) => r.name.toLowerCase().includes(s) || (r.city ?? "").toLowerCase().includes(s));
  }, [rows, q]);

  const officialCount = rows.filter((r) => r.cut_source === "official").length;

  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-6">
      <h1 className="text-xl font-bold tracking-tight">Turnier-Cut-Offs</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Offizielle Cut-Offs aus der Meldeliste eintragen (Hauptfeld / Quali). Gesetzt = die Teilnahme-Ampel im /map
        nutzt diese Werte und beschriftet sie „offiziell". Leer = kalibrierter Richtwert. {officialCount} von {rows.length} offiziell.
      </p>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Turnier oder Stadt suchen …"
        className="mt-4 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-matchup"
      />

      {loading ? (
        <p className="mt-6 text-sm text-neutral-400">Lädt …</p>
      ) : (
        <div className="mt-4 space-y-2">
          {filtered.map((r) => {
            const meta = TIER_META[r.tier];
            const rich = cutoffFor({ tier: r.tier } as Tournament); // Richtwert als Platzhalter
            const official = r.cut_source === "official";
            const dirty = !!edits[r.id];
            return (
              <div key={r.id} className="rounded-xl border border-neutral-200 bg-white p-3">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="rounded-md px-1.5 py-0.5 text-[10px] font-bold text-white" style={{ background: meta.color }}>{meta.short}</span>
                  <span className="text-sm font-semibold">{r.name}</span>
                  <span className="text-xs text-neutral-400">
                    {r.city ?? ""}{r.start_date ? ` · ${r.start_date}` : ""}
                  </span>
                  <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${official ? "bg-emerald-50 text-emerald-600" : "bg-neutral-100 text-neutral-500"}`}>
                    {official ? "offiziell" : "Richtwert"}
                  </span>
                </div>
                <div className="mt-2.5 flex flex-wrap items-end gap-3">
                  <label className="block">
                    <span className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-neutral-400">Hauptfeld-Cut</span>
                    <input inputMode="numeric" value={val(r, "direct")} onChange={(e) => setVal(r.id, "direct", e.target.value)}
                      placeholder={`~${rich.direct}`} className="w-24 rounded-lg border border-neutral-200 bg-neutral-50 px-2 py-1 text-sm outline-none focus:border-matchup" />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-neutral-400">Quali-Cut</span>
                    <input inputMode="numeric" value={val(r, "quali")} onChange={(e) => setVal(r.id, "quali", e.target.value)}
                      placeholder={`~${rich.quali}`} className="w-24 rounded-lg border border-neutral-200 bg-neutral-50 px-2 py-1 text-sm outline-none focus:border-matchup" />
                  </label>
                  <button type="button" onClick={() => save(r)} disabled={busy === r.id || !dirty}
                    className="rounded-full bg-matchup px-4 py-1.5 text-xs font-bold text-white transition hover:bg-matchup-hover disabled:opacity-40">
                    {busy === r.id ? "…" : "Speichern"}
                  </button>
                  {official && (
                    <button type="button" onClick={() => reset(r)} disabled={busy === r.id}
                      className="rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-semibold text-neutral-500 hover:bg-neutral-200 disabled:opacity-40">
                      Auf Richtwert
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && <p className="text-sm text-neutral-400">Kein Turnier gefunden.</p>}
        </div>
      )}
      {toast && <Toast message={toast} />}
    </div>
  );
}
