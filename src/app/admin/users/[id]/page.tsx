"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { adminAction, adminActionJson, fetchModeration, type ModerationRow } from "@/lib/adminAction";
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
  const [mod, setMod] = useState<ModerationRow | null>(null);
  const [reports, setReports] = useState<EnrichedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [busy, setBusy] = useState(false);
  // „Matchup Team"-Chat mit diesem Nutzer
  type TeamMsg = { id: string; sender_id: string; content: string; created_at: string };
  const [teamMsgs, setTeamMsgs] = useState<TeamMsg[]>([]);
  const [teamId, setTeamId] = useState<string>("");
  const [teamText, setTeamText] = useState("");
  const [teamBusy, setTeamBusy] = useState(false);

  const loadTeamChat = useCallback(async () => {
    try {
      const j = await adminActionJson<{ messages: TeamMsg[]; teamId: string }>("getTeamChat", { id });
      setTeamMsgs(j.messages ?? []);
      setTeamId(j.teamId ?? "");
    } catch {
      /* still */
    }
  }, [id]);

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
      // banned_at/pause_reason liegen server-only → über die verifyAdmin-Route.
      setMod((await fetchModeration([id])).get(id) ?? null);
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
    loadTeamChat();
  }, [load, loadTeamChat]);

  async function sendTeamMsg() {
    const text = teamText.trim();
    if (!text) return;
    setTeamBusy(true);
    try {
      await adminAction("messageUser", { id, text });
      setTeamText("");
      await loadTeamChat();
      showToast("Nachricht gesendet");
    } catch (e) {
      alert("Fehler: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setTeamBusy(false);
    }
  }

  async function removeTeamChat() {
    if (!confirm("Diesen Matchup-Team-Chat entfernen? (Betrifft NUR diese Konversation, keine anderen Chats.)")) return;
    setTeamBusy(true);
    try {
      await adminAction("deleteTeamChat", { id });
      await loadTeamChat();
      showToast("Team-Chat entfernt");
    } catch (e) {
      alert("Fehler: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setTeamBusy(false);
    }
  }

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
      await adminAction("pauseUser", { id, paused: next });
      showToast(next ? "Profil pausiert" : "Pausierung aufgehoben");
      await load();
    } catch (e) {
      alert("Fehler: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setBusy(false);
    }
  }

  async function requirePhoto() {
    if (!profile) return;
    const on = !profile.pause_requires_photo;
    if (on && !confirm("Profil pausieren und ein echtes Foto verlangen? Der Nutzer wird erst nach einem Foto-Upload wieder freigeschaltet.")) return;
    if (!on && !confirm("Foto-Auflage aufheben?")) return;
    setBusy(true);
    try {
      await adminAction("requirePhoto", { id, on });
      showToast(on ? "Foto verlangt (Profil pausiert)" : "Foto-Auflage aufgehoben");
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
      await adminAction("banUser", { id, banned: next });
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
      await adminAction("deleteUserImage", { id, imageUrl });
      showToast("Bild gelöscht");
      await load();
    } catch (e) {
      alert("Fehler: " + (e instanceof Error ? e.message : String(e)));
    }
  }

  async function deleteProfile() {
    if (!profile) return;
    const name = profile.first_name || "dieses Profil";
    if (
      !confirm(
        `${name} UNWIDERRUFLICH löschen?\n\nAlle Daten (Profil, Bilder, Matches, Chats, Likes, Gruppen, Events, Stats) und das Login-Konto werden entfernt. Das kann nicht rückgängig gemacht werden.`,
      )
    )
      return;
    setBusy(true);
    try {
      await adminAction("deleteUser", { id });
      router.push("/admin/users");
    } catch (e) {
      alert("Fehler: " + (e instanceof Error ? e.message : String(e)));
      setBusy(false);
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
            {mod?.pause_reason && (
              <Row label="Pausegrund" value={mod.pause_reason} />
            )}
            {mod?.banned_at && (
              <Row
                label="Gesperrt am"
                value={formatDateTime(mod.banned_at)}
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
              onClick={requirePhoto}
              disabled={busy}
              className={`w-full py-3 rounded-2xl text-sm font-semibold transition-colors disabled:opacity-60 ${
                profile.pause_requires_photo
                  ? "bg-white text-violet-600 border border-violet-500 hover:bg-violet-50"
                  : "bg-violet-500 text-white hover:bg-violet-600"
              }`}
            >
              {profile.pause_requires_photo ? "Foto-Auflage aufheben" : "Echtes Foto verlangen"}
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

            <button
              onClick={deleteProfile}
              disabled={busy}
              className="w-full py-3 rounded-2xl text-sm font-semibold border border-red-600 bg-red-600 text-white transition-colors hover:bg-red-700 disabled:opacity-60"
            >
              Profil komplett löschen
            </button>
            <p className="text-xs text-neutral-400">
              Entfernt Profil, Bilder, Chats, Matches, Gruppen, Events &amp;
              Login-Konto — unwiderruflich.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider">
            Matchup-Team-Chat
          </h3>
          {teamMsgs.length > 0 && (
            <button
              onClick={removeTeamChat}
              disabled={teamBusy}
              className="text-xs font-semibold text-red-500 hover:text-red-600 disabled:opacity-50"
            >
              Chat entfernen
            </button>
          )}
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-4">
          <div className="max-h-64 space-y-2 overflow-y-auto">
            {teamMsgs.length === 0 && (
              <p className="text-sm text-neutral-400">
                Noch keine Nachrichten. Schreib dem Nutzer als „Matchup Team".
              </p>
            )}
            {teamMsgs.map((m) => {
              const fromTeam = m.sender_id === teamId;
              return (
                <div key={m.id} className={`flex ${fromTeam ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-sm ${
                      fromTeam ? "bg-violet-600 text-white" : "bg-neutral-100 text-neutral-800"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex items-end gap-2">
            <textarea
              value={teamText}
              onChange={(e) => setTeamText(e.target.value)}
              rows={2}
              placeholder="Nachricht an den Nutzer …"
              className="flex-1 resize-none rounded-xl border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-violet-500"
            />
            <button
              onClick={sendTeamMsg}
              disabled={teamBusy || !teamText.trim()}
              className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
            >
              {teamBusy ? "…" : "Senden"}
            </button>
          </div>
          <p className="mt-2 text-xs text-neutral-400">
            Erscheint beim Nutzer als normaler Chat von „Matchup Team". Er kann antworten
            (Antworten erscheinen hier). „Chat entfernen" löscht NUR diese Konversation.
          </p>
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
