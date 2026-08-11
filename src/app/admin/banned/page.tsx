"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { adminAction, fetchModeration, type ModerationRow } from "@/lib/adminAction";
import {
  type Profile,
  displayName,
  formatDate,
  Toast,
} from "@/components/admin/shared";

export default function BannedPage() {
  const router = useRouter();
  const [users, setUsers] = useState<Profile[]>([]);
  const [mod, setMod] = useState<Map<string, ModerationRow>>(new Map());
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .or("is_paused.eq.true,is_banned.eq.true")
        .order("created_at", { ascending: false });
      const list = (data || []) as Profile[];
      setUsers(list);
      // banned_at/pause_reason liegen server-only → über die verifyAdmin-Route.
      setMod(await fetchModeration(list.map((u) => u.id)));
    } catch (e) {
      console.error("Banned load failed:", e);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  async function unban(u: Profile, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Sperre/Pausierung wirklich aufheben?")) return;
    setBusyId(u.id);
    try {
      await adminAction("unbanUser", { id: u.id });
      showToast("Sperre aufgehoben");
      await load();
    } catch (err) {
      alert("Fehler: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="p-8">
      <Toast message={toast} />
      <h2 className="text-xl font-bold tracking-tight mb-6">
        Gesperrte &amp; Pausierte User
      </h2>

      <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden">
        {loading ? (
          <p className="p-6 text-sm text-neutral-400 text-center">Laden...</p>
        ) : users.length === 0 ? (
          <p className="p-6 text-sm text-neutral-400 text-center">
            Keine gesperrten User
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left">
                <Th>User</Th>
                <Th>Status</Th>
                <Th>Grund</Th>
                <Th>Datum</Th>
                <Th>Aktion</Th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr
                  key={u.id}
                  onClick={() => router.push(`/admin/users/${u.id}`)}
                  className="border-b border-neutral-200 last:border-0 hover:bg-neutral-50 cursor-pointer"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {u.profile_image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={u.profile_image}
                          className="w-8 h-8 rounded-full object-cover"
                          alt=""
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-neutral-100" />
                      )}
                      <span className="font-medium">{displayName(u)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        u.is_banned
                          ? "bg-red-100 text-red-600"
                          : "bg-orange-100 text-orange-600"
                      }`}
                    >
                      {u.is_banned ? "Gesperrt" : "Pausiert"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {mod.get(u.id)?.pause_reason || "—"}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {mod.get(u.id)?.banned_at ? formatDate(mod.get(u.id)!.banned_at!) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={(e) => unban(u, e)}
                      disabled={busyId === u.id}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold bg-black text-white hover:bg-neutral-800 disabled:opacity-60 transition-colors"
                    >
                      {busyId === u.id ? "..." : "Aufheben"}
                    </button>
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
