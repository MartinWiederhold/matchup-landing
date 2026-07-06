"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { adminAction } from "@/lib/adminAction";
import { compressImage } from "@/lib/utils/imageCompress";
import { Toast } from "@/components/admin/shared";
import {
  type Venue,
  VENUE_SELECT,
  SPORT_LABEL,
  CAT_LABEL,
  WEEKDAYS,
} from "@/lib/venuesDb";

const SPORTS = ["tennis", "padel", "pickleball"];
const CATEGORIES = ["club", "public", "private", "hotel"];
const SURFACES = ["Sand", "Hartplatz", "Teppich", "Rasen", "Padel", "Pickleball"];
const AMENITIES: { key: string; label: string }[] = [
  { key: "restaurant", label: "Restaurant / Bar" },
  { key: "showers", label: "Duschen" },
  { key: "parking", label: "Parkplatz" },
  { key: "proshop", label: "Pro-Shop" },
  { key: "ballmachine", label: "Ballmaschine" },
  { key: "coaching", label: "Trainer / Schule" },
  { key: "wallball", label: "Trainingswand" },
  { key: "transit", label: "ÖV-Anbindung" },
];

type Form = Partial<Venue>;

export default function AdminVenuesPage() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Venue | null>(null);
  const [toast, setToast] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("venues")
      .select(VENUE_SELECT)
      .order("name");
    setVenues((data as Venue[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function showToast(m: string) {
    setToast(m);
    setTimeout(() => setToast(""), 3000);
  }

  const filtered = venues.filter(
    (v) =>
      v.name.toLowerCase().includes(q.toLowerCase()) ||
      (v.city ?? "").toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Clubs / Karte ({venues.length})</h1>
        <a
          href="/map"
          target="_blank"
          className="rounded-full bg-neutral-200 px-4 py-2 text-sm font-semibold"
        >
          Karte ansehen →
        </a>
      </div>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Suchen…"
        className="mb-4 h-10 w-full max-w-md rounded-full border border-neutral-300 px-4 text-sm outline-none focus:border-black"
      />

      {loading ? (
        <p className="text-sm text-neutral-500">Lädt…</p>
      ) : (
        <div className="grid gap-2">
          {filtered.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setEditing(v)}
              className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-3 text-left hover:border-black"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-100 text-[10px] font-bold">
                {v.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={v.logo_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  v.name.slice(0, 2).toUpperCase()
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{v.name}</span>
                <span className="block text-xs text-neutral-400">
                  {v.sports.map((s) => SPORT_LABEL[s] ?? s).join(", ")} ·{" "}
                  {CAT_LABEL[v.category] ?? v.category}
                  {v.city ? ` · ${v.city}` : ""}
                  {v.verified ? " · ✓" : ""}
                </span>
              </span>
              <span className="text-neutral-400">›</span>
            </button>
          ))}
        </div>
      )}

      {editing && (
        <EditModal
          venue={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            showToast("Gespeichert");
            load();
          }}
        />
      )}

      {toast && <Toast message={toast} />}
    </div>
  );
}

function EditModal({
  venue,
  onClose,
  onSaved,
}: {
  venue: Venue;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [f, setF] = useState<Form>({ ...venue });
  const [hours, setHours] = useState<Record<string, string>>(
    venue.opening_hours ?? {},
  );
  const [saving, setSaving] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  function set<K extends keyof Form>(k: K, v: Form[K]) {
    setF((p) => ({ ...p, [k]: v }));
  }
  function toggleArr(k: "sports" | "surfaces" | "amenities", val: string) {
    const arr = (f[k] as string[] | undefined) ?? [];
    set(k, (arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]) as never);
  }

  async function upload(file: File, kind: "logo" | "cover") {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const uid = session?.user.id;
    if (!uid) return;
    const blob = await compressImage(file);
    const path = `${uid}/venues/${kind}-${Date.now()}.jpg`;
    const { error } = await supabase.storage
      .from("web-avatars")
      .upload(path, blob, { contentType: "image/jpeg" });
    if (!error) {
      const url = supabase.storage.from("web-avatars").getPublicUrl(path).data.publicUrl;
      set(kind === "logo" ? "logo_url" : "cover_url", url);
    }
  }

  async function save() {
    setSaving(true);
    const patch: Record<string, unknown> = {
      name: f.name,
      sports: f.sports ?? [],
      category: f.category,
      status: f.status ?? "active",
      address: f.address || null,
      postal_code: f.postal_code || null,
      city: f.city || null,
      lat: f.lat ?? null,
      lng: f.lng ?? null,
      website: f.website || null,
      phone: f.phone || null,
      email: f.email || null,
      logo_url: f.logo_url || null,
      cover_url: f.cover_url || null,
      description: f.description || null,
      courts_indoor: f.courts_indoor ?? null,
      courts_outdoor: f.courts_outdoor ?? null,
      surfaces: f.surfaces ?? [],
      floodlight: f.floodlight ?? null,
      member_count: f.member_count ?? null,
      founded: f.founded ?? null,
      booking_url: f.booking_url || null,
      guest_access: f.guest_access ?? null,
      guest_fee: f.guest_fee || null,
      court_price: f.court_price || null,
      membership_fee: f.membership_fee || null,
      season: f.season || null,
      amenities: f.amenities ?? [],
      opening_hours: Object.fromEntries(
        Object.entries(hours).filter(([, v]) => v.trim()),
      ),
      verified: f.verified ?? false,
    };
    try {
      await adminAction("saveVenue", { id: venue.id, patch });
      onSaved();
    } catch (e) {
      alert("Fehler: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="my-6 w-full max-w-2xl space-y-5 rounded-2xl bg-white p-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">{venue.name}</h2>
          <button type="button" onClick={onClose} className="text-neutral-400">
            ✕
          </button>
        </div>

        <Section title="Basis">
          <Field label="Name">
            <Input value={f.name ?? ""} onChange={(v) => set("name", v)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Sportarten</Label>
              <Chips items={SPORTS} selected={f.sports ?? []} onToggle={(v) => toggleArr("sports", v)} labels={SPORT_LABEL} />
            </div>
            <div>
              <Label>Typ</Label>
              <Select value={f.category ?? "club"} onChange={(v) => set("category", v)} options={CATEGORIES} labels={CAT_LABEL} />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Check label="Verifiziert" checked={!!f.verified} onChange={(b) => set("verified", b)} />
            <Check label="Sichtbar" checked={(f.status ?? "active") === "active"} onChange={(b) => set("status", (b ? "active" : "hidden") as never)} />
          </div>
        </Section>

        <Section title="Medien">
          <div className="flex gap-4">
            <div>
              <Label>Logo</Label>
              <button type="button" onClick={() => logoRef.current?.click()} className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-dashed border-neutral-300 text-xs text-neutral-400">
                {f.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={f.logo_url} alt="" className="h-full w-full object-cover" />
                ) : "Logo"}
              </button>
              <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], "logo")} />
            </div>
            <div className="flex-1">
              <Label>Titelbild</Label>
              <button type="button" onClick={() => coverRef.current?.click()} className="flex h-16 w-full items-center justify-center overflow-hidden rounded-xl border border-dashed border-neutral-300 text-xs text-neutral-400">
                {f.cover_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={f.cover_url} alt="" className="h-full w-full object-cover" />
                ) : "Titelbild"}
              </button>
              <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], "cover")} />
            </div>
          </div>
        </Section>

        <Section title="Standort & Kontakt">
          <Field label="Adresse"><Input value={f.address ?? ""} onChange={(v) => set("address", v)} /></Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="PLZ"><Input value={f.postal_code ?? ""} onChange={(v) => set("postal_code", v)} /></Field>
            <Field label="Stadt"><Input value={f.city ?? ""} onChange={(v) => set("city", v)} /></Field>
            <Field label="Website"><Input value={f.website ?? ""} onChange={(v) => set("website", v)} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Telefon"><Input value={f.phone ?? ""} onChange={(v) => set("phone", v)} /></Field>
            <Field label="E-Mail"><Input value={f.email ?? ""} onChange={(v) => set("email", v)} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Lat"><Input value={String(f.lat ?? "")} onChange={(v) => set("lat", v ? Number(v) : null)} /></Field>
            <Field label="Lng"><Input value={String(f.lng ?? "")} onChange={(v) => set("lng", v ? Number(v) : null)} /></Field>
          </div>
        </Section>

        <Section title="Plätze">
          <div className="grid grid-cols-3 gap-3">
            <Field label="Indoor"><Input value={String(f.courts_indoor ?? "")} onChange={(v) => set("courts_indoor", v ? Number(v) : null)} /></Field>
            <Field label="Outdoor"><Input value={String(f.courts_outdoor ?? "")} onChange={(v) => set("courts_outdoor", v ? Number(v) : null)} /></Field>
            <div>
              <Label>Flutlicht</Label>
              <Select value={f.floodlight == null ? "" : f.floodlight ? "ja" : "nein"} onChange={(v) => set("floodlight", v === "" ? null : v === "ja")} options={["", "ja", "nein"]} labels={{ "": "—", ja: "Ja", nein: "Nein" }} />
            </div>
          </div>
          <div>
            <Label>Belag</Label>
            <Chips items={SURFACES} selected={f.surfaces ?? []} onToggle={(v) => toggleArr("surfaces", v)} />
          </div>
        </Section>

        <Section title="Infos">
          <div className="grid grid-cols-3 gap-3">
            <Field label="Mitglieder"><Input value={String(f.member_count ?? "")} onChange={(v) => set("member_count", v ? Number(v) : null)} /></Field>
            <Field label="Gegründet"><Input value={String(f.founded ?? "")} onChange={(v) => set("founded", v ? Number(v) : null)} /></Field>
            <Field label="Saison"><Input value={f.season ?? ""} onChange={(v) => set("season", v)} placeholder="Ganzjährig" /></Field>
          </div>
          <Field label="Beschreibung">
            <textarea value={f.description ?? ""} onChange={(e) => set("description", e.target.value)} rows={3} className="w-full rounded-lg border border-neutral-300 p-2.5 text-sm outline-none focus:border-black" />
          </Field>
        </Section>

        <Section title="Buchung & Preise">
          <Field label="Buchungs-Link"><Input value={f.booking_url ?? ""} onChange={(v) => set("booking_url", v)} placeholder="https://…" /></Field>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Gäste</Label>
              <Select value={f.guest_access == null ? "" : f.guest_access ? "ja" : "nein"} onChange={(v) => set("guest_access", v === "" ? null : v === "ja")} options={["", "ja", "nein"]} labels={{ "": "—", ja: "Willkommen", nein: "Nur Mitglieder" }} />
            </div>
            <Field label="Gastgebühr"><Input value={f.guest_fee ?? ""} onChange={(v) => set("guest_fee", v)} placeholder="CHF 30/h" /></Field>
            <Field label="Platzmiete"><Input value={f.court_price ?? ""} onChange={(v) => set("court_price", v)} placeholder="CHF 40/h" /></Field>
          </div>
          <Field label="Mitgliedschaft"><Input value={f.membership_fee ?? ""} onChange={(v) => set("membership_fee", v)} placeholder="CHF 600/Jahr" /></Field>
        </Section>

        <Section title="Ausstattung">
          <Chips items={AMENITIES.map((a) => a.key)} selected={f.amenities ?? []} onToggle={(v) => toggleArr("amenities", v)} labels={Object.fromEntries(AMENITIES.map((a) => [a.key, a.label]))} />
        </Section>

        <Section title="Öffnungszeiten">
          <div className="grid grid-cols-1 gap-2">
            {WEEKDAYS.map((d) => (
              <div key={d.key} className="flex items-center gap-3">
                <span className="w-8 text-sm font-semibold text-neutral-500">{d.label}</span>
                <input
                  value={hours[d.key] ?? ""}
                  onChange={(e) => setHours((h) => ({ ...h, [d.key]: e.target.value }))}
                  placeholder="08:00–22:00"
                  className="h-9 flex-1 rounded-lg border border-neutral-300 px-3 text-sm outline-none focus:border-black"
                />
              </div>
            ))}
          </div>
        </Section>

        <div className="sticky bottom-0 -mx-6 -mb-6 flex gap-3 border-t border-neutral-200 bg-white px-6 py-4">
          <button type="button" onClick={onClose} className="flex-1 rounded-full border border-neutral-300 py-3 text-sm font-semibold">
            Abbrechen
          </button>
          <button type="button" onClick={save} disabled={saving} className="flex-1 rounded-full bg-black py-3 text-sm font-bold text-white disabled:opacity-50">
            {saving ? "Speichert…" : "Speichern"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* Bausteine */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-bold uppercase tracking-wide text-neutral-400">{title}</h3>
      {children}
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <Label>{label}</Label>
      {children}
    </label>
  );
}
function Label({ children }: { children: React.ReactNode }) {
  return <span className="mb-1 block text-xs font-semibold text-neutral-500">{children}</span>;
}
function Input({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="h-9 w-full rounded-lg border border-neutral-300 px-3 text-sm outline-none focus:border-black" />
  );
}
function Select({ value, onChange, options, labels }: { value: string; onChange: (v: string) => void; options: string[]; labels?: Record<string, string> }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="h-9 w-full rounded-lg border border-neutral-300 px-2 text-sm outline-none focus:border-black">
      {options.map((o) => (
        <option key={o} value={o}>{labels?.[o] ?? o}</option>
      ))}
    </select>
  );
}
function Chips({ items, selected, onToggle, labels }: { items: string[]; selected: string[]; onToggle: (v: string) => void; labels?: Record<string, string> }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((it) => (
        <button key={it} type="button" onClick={() => onToggle(it)} className={`rounded-full px-3 py-1 text-xs font-semibold ${selected.includes(it) ? "bg-black text-white" : "bg-neutral-100 text-neutral-600"}`}>
          {labels?.[it] ?? it}
        </button>
      ))}
    </div>
  );
}
function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (b: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-black" />
      {label}
    </label>
  );
}
