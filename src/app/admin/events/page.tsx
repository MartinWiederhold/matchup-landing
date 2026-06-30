"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { adminAction } from "@/lib/adminAction";
import { Toast } from "@/components/admin/shared";
import type { EventItem } from "@/lib/types";

type Row = EventItem & { participants?: { id: string }[] };

const SPORTS = ["tennis", "padel", "pickleball"];

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Row | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("events")
      .select("*, participants:event_participants(id)")
      .order("event_date", { ascending: true });
    setEvents((data as Row[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function showToast(m: string) {
    setToast(m);
    setTimeout(() => setToast(""), 3000);
  }

  async function remove(ev: Row) {
    if (!confirm(`Event „${ev.title}" wirklich löschen?`)) return;
    setBusyId(ev.id);
    try {
      await adminAction("deleteEvent", { id: ev.id });
      showToast("Event gelöscht");
      await load();
    } catch (e) {
      alert("Fehler: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setBusyId(null);
    }
  }

  async function saveEdit(patch: Record<string, unknown>) {
    if (!editing) return;
    setBusyId(editing.id);
    try {
      await adminAction("updateEvent", { id: editing.id, patch });
      showToast("Event aktualisiert");
      setEditing(null);
      await load();
    } catch (e) {
      alert("Fehler: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="p-6 sm:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight">Events</h1>
        <p className="text-sm text-neutral-400">
          Alle Community-Events — bearbeiten oder entfernen.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-neutral-400">Lädt…</p>
      ) : events.length === 0 ? (
        <p className="text-sm text-neutral-400">Noch keine Events.</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-neutral-200">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-3">Event</th>
                <th className="px-4 py-3">Sport</th>
                <th className="px-4 py-3">Datum</th>
                <th className="px-4 py-3">Teilnehmer</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Aktion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {events.map((ev) => (
                <tr key={ev.id} className="align-middle">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                        {ev.image_url && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={ev.image_url} alt="" className="h-full w-full object-cover" />
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{ev.title}</p>
                        <p className="truncate text-xs text-neutral-400">
                          {ev.location}
                          {ev.creator_name ? ` · ${ev.creator_name}` : ""}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 capitalize">{ev.sport}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-neutral-600">
                    {ev.event_date
                      ? new Date(ev.event_date).toLocaleDateString("de-CH", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {ev.participants?.length ?? 0}/{ev.max_participants}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        ev.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-neutral-200 text-neutral-600"
                      }`}
                    >
                      {ev.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditing(ev)}
                        disabled={busyId === ev.id}
                        className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-semibold hover:bg-neutral-50 disabled:opacity-50"
                      >
                        Bearbeiten
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(ev)}
                        disabled={busyId === ev.id}
                        className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50"
                      >
                        Löschen
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <EditModal
          event={editing}
          busy={busyId === editing.id}
          onClose={() => setEditing(null)}
          onSave={saveEdit}
        />
      )}

      {toast && <Toast message={toast} />}
    </div>
  );
}

function EditModal({
  event,
  busy,
  onClose,
  onSave,
}: {
  event: Row;
  busy: boolean;
  onClose: () => void;
  onSave: (patch: Record<string, unknown>) => void;
}) {
  const [title, setTitle] = useState(event.title);
  const [shortDesc, setShortDesc] = useState(event.short_description);
  const [desc, setDesc] = useState(event.description ?? "");
  const [location, setLocation] = useState(event.location);
  const [sport, setSport] = useState(event.sport);
  const [dateLocal, setDateLocal] = useState(toLocalInput(event.event_date));
  const [maxP, setMaxP] = useState(event.max_participants);
  const [status, setStatus] = useState(event.status);
  const [imageUrl, setImageUrl] = useState(event.image_url ?? "");
  const [uploading, setUploading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      // Storage-RLS verlangt: erster Ordner = eigene User-ID (auth.uid()).
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Nicht eingeloggt");
      const blob = await resizeToJpeg(file, 1200);
      const path = `${user.id}/events/${event.id}-${Date.now()}.jpg`;
      const { error } = await supabase.storage
        .from("web-avatars")
        .upload(path, blob, { contentType: "image/jpeg", upsert: true });
      if (error) throw error;
      const url = supabase.storage.from("web-avatars").getPublicUrl(path).data
        .publicUrl;
      setImageUrl(url);
    } catch (err) {
      alert("Upload-Fehler: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function submit() {
    onSave({
      title: title.trim(),
      short_description: shortDesc.trim(),
      description: desc.trim() || null,
      location: location.trim(),
      sport,
      event_date: dateLocal ? new Date(dateLocal).toISOString() : null,
      max_participants: Number(maxP),
      status,
      image_url: imageUrl || null,
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight">Event bearbeiten</h2>
          <button type="button" onClick={onClose} className="text-neutral-400">
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <L label="Titelbild">
            <div className="flex items-center gap-4">
              <span className="h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                {imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imageUrl} alt="" className="h-full w-full object-cover" />
                )}
              </span>
              <div className="flex flex-col gap-2">
                <label className="cursor-pointer rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-semibold hover:bg-neutral-50">
                  {uploading ? "Lädt hoch…" : imageUrl ? "Bild ersetzen" : "Bild hochladen"}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFile}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
                {imageUrl && (
                  <button
                    type="button"
                    onClick={() => setImageUrl("")}
                    className="text-xs font-semibold text-red-600 hover:underline"
                  >
                    Bild entfernen
                  </button>
                )}
              </div>
            </div>
          </L>
          <L label="Titel">
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={inp} />
          </L>
          <L label="Kurzbeschreibung">
            <input value={shortDesc} onChange={(e) => setShortDesc(e.target.value)} className={inp} />
          </L>
          <L label="Beschreibung">
            <textarea rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} className={inp} />
          </L>
          <div className="grid grid-cols-2 gap-3">
            <L label="Ort">
              <input value={location} onChange={(e) => setLocation(e.target.value)} className={inp} />
            </L>
            <L label="Sport">
              <select value={sport} onChange={(e) => setSport(e.target.value as Row["sport"])} className={inp}>
                {SPORTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </L>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <L label="Datum & Zeit">
              <input
                type="datetime-local"
                value={dateLocal}
                onChange={(e) => setDateLocal(e.target.value)}
                className={inp}
              />
            </L>
            <L label="Max. Teilnehmer">
              <input
                type="number"
                min={1}
                value={maxP}
                onChange={(e) => setMaxP(Number(e.target.value))}
                className={inp}
              />
            </L>
          </div>
          <L label="Status">
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={inp}>
              <option value="active">active</option>
              <option value="hidden">hidden</option>
              <option value="cancelled">cancelled</option>
            </select>
          </L>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-neutral-200 px-5 py-2.5 text-sm font-semibold hover:bg-neutral-50"
          >
            Abbrechen
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={busy}
            className="rounded-full bg-black px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {busy ? "Speichern…" : "Speichern"}
          </button>
        </div>
      </div>
    </div>
  );
}

function resizeToJpeg(file: File, maxW: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      const scale = Math.min(1, maxW / img.width);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas nicht verfügbar"));
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("Konvertierung fehlgeschlagen"))),
        "image/jpeg",
        0.85,
      );
    };
    img.onerror = () => reject(new Error("Bild konnte nicht geladen werden"));
    img.src = URL.createObjectURL(file);
  });
}

const inp =
  "w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-black";

function L({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
        {label}
      </span>
      {children}
    </label>
  );
}
