"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Row = {
  id: string;
  name: string;
  category: string;
  city: string | null;
  country: string | null;
  website: string | null;
  contact_email: string | null;
  phone: string | null;
  price_from: number | null;
  price_unit: string | null;
  currency: string | null;
  languages: string[] | null;
  latitude: number | null;
  longitude: number | null;
  source: string;
  created_by: string | null;
};

const CATS: { v: string; label: string }[] = [
  { v: "coach", label: "Coach" },
  { v: "physio", label: "Physio" },
  { v: "stringer", label: "Besaiter" },
  { v: "sc", label: "Athletik" },
  { v: "mental", label: "Mental" },
  { v: "nutrition", label: "Ernährung" },
  { v: "hitting", label: "Hitting Partner" },
  { v: "tour_companion", label: "Tour-Begleitung" },
];
const UNITS: { v: string; label: string }[] = [
  { v: "hour", label: "/ Std." },
  { v: "session", label: "/ Session" },
  { v: "stringing", label: "/ Bespannung" },
  { v: "week", label: "/ Woche" },
  { v: "year", label: "/ Jahr" },
];

const EMPTY = {
  name: "", category: "coach", city: "", country: "CH", website: "", contact_email: "",
  phone: "", price_from: "", price_unit: "hour", currency: "CHF", languages: "",
};

export default function AdminProvidersPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY });

  async function authFetch(url: string, init?: RequestInit) {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) throw new Error("Nicht eingeloggt");
    return fetch(url, { ...init, headers: { ...(init?.headers ?? {}), Authorization: `Bearer ${token}`, "Content-Type": "application/json" } });
  }

  const load = useCallback(async (query: string) => {
    setLoading(true); setError("");
    try {
      const res = await authFetch(`/api/admin/providers?q=${encodeURIComponent(query)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `Fehler (${res.status})`);
      setRows(json.rows as Row[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(""); }, [load]);

  function resetForm() { setForm({ ...EMPTY }); setEditId(null); }

  function editRow(r: Row) {
    setEditId(r.id);
    setForm({
      name: r.name, category: r.category, city: r.city ?? "", country: r.country ?? "",
      website: r.website ?? "", contact_email: r.contact_email ?? "", phone: r.phone ?? "",
      price_from: r.price_from != null ? String(r.price_from) : "", price_unit: r.price_unit ?? "hour",
      currency: r.currency ?? "CHF", languages: (r.languages ?? []).join(", "),
    });
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function save() {
    setBusy(true); setError(""); setWarning("");
    try {
      const payload = {
        ...form,
        languages: form.languages.split(",").map((s) => s.trim()).filter(Boolean),
        ...(editId ? { id: editId } : {}),
      };
      const res = await authFetch("/api/admin/providers", { method: editId ? "PATCH" : "POST", body: JSON.stringify(payload) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `Fehler (${res.status})`);
      if (json.warning) setWarning(json.warning);
      resetForm();
      await load(q);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function del(id: string) {
    if (!window.confirm("Diesen Eintrag löschen?")) return;
    setBusy(true); setError("");
    try {
      const res = await authFetch(`/api/admin/providers?id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `Fehler (${res.status})`);
      await load(q);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const inp = "w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500";
  const lab = "mb-1 block text-[11px] font-bold uppercase tracking-wide text-neutral-400";
  const valid = form.name.trim().length >= 2 && form.city.trim().length >= 2 && form.country.trim().length >= 2;

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="text-xl font-bold text-neutral-900">Anbieter{editId ? " · bearbeiten" : " · neu"}</h1>
      <p className="mt-1 text-[13px] text-neutral-500">Redaktionelle Einträge (source=&laquo;editorial&raquo;, ohne created_by). Koordinaten werden aus Stadt + Land automatisch ermittelt. Kein Bild.</p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="col-span-2"><label className={lab}>Name</label><input className={inp} value={form.name} onChange={set("name")} /></div>
        <div><label className={lab}>Kategorie</label><select className={inp} value={form.category} onChange={set("category")}>{CATS.map((c) => <option key={c.v} value={c.v}>{c.label}</option>)}</select></div>
        <div><label className={lab}>Sprachen (kommagetrennt)</label><input className={inp} value={form.languages} onChange={set("languages")} placeholder="DE, EN, FR" /></div>
        <div><label className={lab}>Stadt</label><input className={inp} value={form.city} onChange={set("city")} placeholder="Zürich" /></div>
        <div><label className={lab}>Land (ISO, z. B. CH)</label><input className={inp} value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value.toUpperCase() }))} placeholder="CH" maxLength={2} /></div>
        <div><label className={lab}>Website</label><input className={inp} value={form.website} onChange={set("website")} placeholder="https://…" /></div>
        <div><label className={lab}>E-Mail</label><input className={inp} value={form.contact_email} onChange={set("contact_email")} placeholder="kontakt@…" /></div>
        <div><label className={lab}>Telefon</label><input className={inp} value={form.phone} onChange={set("phone")} placeholder="+41 …" /></div>
        <div className="grid grid-cols-3 gap-2">
          <div><label className={lab}>Preis ab</label><input className={inp} value={form.price_from} onChange={(e) => setForm((f) => ({ ...f, price_from: e.target.value.replace(/[^0-9]/g, "") }))} inputMode="numeric" /></div>
          <div><label className={lab}>Einheit</label><select className={inp} value={form.price_unit} onChange={set("price_unit")}>{UNITS.map((u) => <option key={u.v} value={u.v}>{u.label}</option>)}</select></div>
          <div><label className={lab}>Währung</label><input className={inp} value={form.currency} onChange={set("currency")} maxLength={4} /></div>
        </div>
      </div>

      {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-[13px] font-semibold text-red-600">{error}</p>}
      {warning && <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-[13px] font-semibold text-amber-700">{warning}</p>}

      <div className="mt-4 flex gap-2">
        <button type="button" onClick={save} disabled={!valid || busy} className="rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-40">{busy ? "…" : editId ? "Speichern" : "Anlegen"}</button>
        {editId && <button type="button" onClick={resetForm} disabled={busy} className="rounded-full border border-neutral-300 px-5 py-2.5 text-sm font-semibold text-neutral-600">Abbrechen</button>}
      </div>

      <div className="mt-8">
        <div className="flex items-center gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load(q)} placeholder="Suchen (Name / Stadt) …" className={`${inp} max-w-xs`} />
          <button type="button" onClick={() => load(q)} className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-600">Suchen</button>
        </div>
        {loading ? (
          <p className="mt-4 text-sm text-neutral-400">Lädt …</p>
        ) : (
          <div className="mt-3 divide-y divide-neutral-100 rounded-xl border border-neutral-200">
            {rows.length === 0 && <p className="p-4 text-sm text-neutral-400">Keine Einträge.</p>}
            {rows.map((r) => (
              <div key={r.id} className="flex items-center gap-3 px-3 py-2.5">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold text-neutral-900">{r.name}</span>
                  <span className="block truncate text-[11px] text-neutral-500">
                    {CATS.find((c) => c.v === r.category)?.label ?? r.category}
                    {r.city ? ` · ${r.city}` : ""}{r.country ? ` (${r.country})` : ""}
                    {r.latitude == null ? " · ⚠ ohne Koordinaten" : ""}
                    {` · ${r.source}`}
                  </span>
                </span>
                {r.source === "editorial" ? (
                  <>
                    <button type="button" onClick={() => editRow(r)} className="shrink-0 text-[12px] font-bold text-neutral-700">Bearbeiten</button>
                    <button type="button" onClick={() => del(r.id)} className="shrink-0 text-[12px] font-bold text-red-500">Löschen</button>
                  </>
                ) : (
                  <span className="shrink-0 text-[11px] text-neutral-400">nur lesbar</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
