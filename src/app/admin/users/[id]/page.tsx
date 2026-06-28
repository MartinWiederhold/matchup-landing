"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  type Profile,
  type ReportRow,
  fetchProfilesMap,
  displayName,
  formatDate,
  formatDateTime,
  AccountStatusBadge,
  ReportStatusBadge,
  Toast,
} from "@/components/admin/shared";
import { ArrowLeftIcon } from "@/components/admin/icons";

type EnrichedReport = ReportRow & { reporter?: Profile };

export default function UserDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [reports, setReports] = useState<EnrichedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: p }, { data: r }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", id).single(),
        supabase
          .from("reports")
          .select("*")
          .eq("reported_user_id", id)
          .order("created_at", { ascending: false }),
      ]);
      setProfile((p as Profile) || null);
      const reportRows = (r || []) as ReportRow[];
      const reporterMap = await fetchProfilesMap(
        reportRows.map((row) => row.reporter_id),
      );
      setReports(
        reportRows.map((row) => ({
          ...row,
          reporter: row.reporter_id
            ? reporterMap.get(row.reporter_id)
            : undefined,
        })),
      );
    } catch (e) {
      console.error("UserDetail load failed:", e);
      setProfile(null);
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  async function togglePause() {
    if (!profile) return;
    const next = !profile.is_paused;
    if (next && !confirm("Profil wirklich pausieren?")) return;
    if (!next && !confirm("Pausierung aufheben?")) return;
    setBusy(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .update({ is_paused: next, pause_reason: null })
        .eq("id", id)
        .select("id, is_paused");
      if (error) throw error;
      if (!data || data.length === 0)
        throw new Error("Update blockiert (0 Zeilen geändert).");
      showToast(next ? "Profil pausiert" : "Pausierung aufgehoben");
      await load();
    } catch (e) {
      alert("Fehler: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setBusy(false);
    }
  }

  async function toggleBan() {
    if (!profile) return;
    const next = !profile.is_banned;
    if (next && !confirm("Account wirklich sperren?")) return;
    if (!next && !confirm("Sperre aufheben?")) return;
    setBusy(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .update({
          is_banned: next,
          banned_at: next ? new Date().toISOString() : null,
        })
        .eq("id", id)
        .select("id, is_banned");
      if (error) throw error;
      if (!data || data.length === 0)
        throw new Error("Update blockiert (0 Zeilen geändert).");
      showToast(next ? "Account gesperrt" : "Sperre aufgehoben");
      await load();
    } catch (e) {
      alert("Fehler: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setBusy(false);
    }
  }

  async function deleteImage(imageUrl: string) {
    if (!profile) return;
    if (!confirm("Bild wirklich löschen?")) return;
    try {
      const urlParts = imageUrl.split("/storage/v1/object/public/");
      if (urlParts.length === 2) {
        const pathWithBucket = urlParts[1];
        const slashIndex = pathWithBucket.indexOf("/");
        const bucket = pathWithBucket.substring(0, slashIndex);
        const path = pathWithBucket.substring(slashIndex + 1);
        await supabase.storage.from(bucket).remove([path]);
      }
    } catch (e) {
      console.error("Storage delete error:", e);
    }

    const urls = (profile.additional_images || []).filter(
      (u) => u !== imageUrl,
    );
    const update: Partial<Profile> = { additional_images: urls };
    if (profile.profile_image === imageUrl) {
      update.profile_image = urls.length > 0 ? urls[0] : null;
    }
    try {
      await supabase.from("profiles").update(update).eq("id", id);
      showToast("Bild gelöscht");
      await load();
    } catch (e) {
      alert("Fehler: " + (e instanceof Error ? e.message : String(e)));
    }
  }

  if (loading) return <div className="p-8 text-neutral-400">Laden...</div>;
  if (!profile)
    return <div className="p-8 text-neutral-400">User nicht gefunden</div>;

  const images = [...(profile.additional_images || [])];
  if (profile.profile_image && !images.includes(profile.profile_image)) {
    images.unshift(profile.profile_image);
  }

  return (
    <div className="p-8">
      <Toast message={toast} />

      <button
        onClick={() => router.back()}
        className="text-sm text-neutral-400 hover:text-black mb-4 flex items-center gap-1.5"
      >
        <ArrowLeftIcon size={16} /> Zurück
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider mb-3">
            Profilbilder
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {images.length === 0 ? (
              <p className="text-sm text-neutral-400 col-span-2">Keine Bilder</p>
            ) : (
              images.map((url, i) => (
                <div key={i} className="relative group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    className="w-full aspect-square object-cover rounded-2xl border border-neutral-200"
                    alt=""
                  />
                  <button
                    onClick={() => deleteImage(url)}
                    className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Löschen
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider">
              Profil-Infos
            </h3>
            <AccountStatusBadge profile={profile} />
          </div>
          <div className="bg-white border border-neutral-200 rounded-2xl p-4 mb-4 text-sm space-y-2">
            <Row label="Name" value={displayName(profile)} />
            <Row label="Alter" value={profile.age} />
            <Row label="Geschlecht" value={profile.gender} />
            <Row label="Sport" value={(profile.sports || []).join(", ")} />
            <Row label="Spielstärke" value={profile.skill_level} />
            <Row
              label="Ort"
              value={[profile.city, profile.country]
                .filter(Boolean)
                .join(", ")}
            />
            <Row label="Bio" value={profile.bio} />
            {profile.pause_reason && (
              <Row label="Pausegrund" value={profile.pause_reason} />
            )}
            {profile.banned_at && (
              <Row
                label="Gesperrt am"
                value={formatDateTime(profile.banned_at)}
              />
            )}
          </div>

          <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider mb-3">
            Aktionen
          </h3>
          <div className="space-y-3">
            <button
              onClick={togglePause}
              disabled={busy}
              className={`w-full py-3 rounded-2xl text-sm font-semibold transition-colors disabled:opacity-60 ${
                profile.is_paused
                  ? "bg-white text-orange-600 border border-orange-500 hover:bg-orange-50"
                  : "bg-orange-500 text-white hover:bg-orange-600"
              }`}
            >
              {profile.is_paused ? "Pausierung aufheben" : "Profil pausieren"}
            </button>

            <button
              onClick={toggleBan}
              disabled={busy}
              className={`w-full py-3 rounded-2xl text-sm font-semibold transition-colors disabled:opacity-60 ${
                profile.is_banned
                  ? "bg-white text-red-600 border border-red-500 hover:bg-red-50"
                  : "bg-red-500 text-white hover:bg-red-600"
              }`}
            >
              {profile.is_banned ? "Sperre aufheben" : "Account sperren"}
            </button>
          </div>
        </div>
      </div>

      {reports.length > 0 && (
        <div className="mt-8">
          <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider mb-3">
            Reports ({reports.length})
          </h3>
          <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-left">
                  <Th>Datum</Th>
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
                      {formatDate(r.created_at)}
                    </td>
                    <td className="px-4 py-3">{displayName(r.reporter)}</td>
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
          </div>
        </div>
      )}
    </div>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div className="flex">
      <span className="w-28 text-neutral-400 shrink-0">{label}</span>
      <span className="text-black">{value || "—"}</span>
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
