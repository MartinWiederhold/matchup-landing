"use client";

/**
 * Interaktive Insel auf der Event-Detailseite (/events/[id]).
 * Prüft die Session, zeigt Teilnehmerzahl + Beitreten/Verlassen.
 * Dank RLS liest der Nutzer NUR seine eigene Teilnahme-Zeile — die Gesamtzahl
 * kommt serverseitig aus events.participants_count (per Trigger gepflegt).
 */
import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";

export default function EventDetailJoin({
  eventId,
  maxParticipants,
  initialCount,
}: {
  eventId: string;
  maxParticipants: number;
  initialCount: number;
}) {
  const t = useT();
  const [userId, setUserId] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);
  const [count, setCount] = useState(initialCount);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const full = count >= maxParticipants;

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const uid = data.session?.user.id ?? null;
      setUserId(uid);
      if (uid) {
        const { data: mine } = await supabase
          .from("event_participants")
          .select("event_id")
          .eq("event_id", eventId)
          .eq("user_id", uid)
          .maybeSingle();
        setJoined(!!mine);
      }
    });
  }, [eventId]);

  async function join() {
    if (!userId) {
      window.location.href = "/app";
      return;
    }
    setBusy(true);
    setError(null);
    const { error: e } = await supabase
      .from("event_participants")
      .insert({ event_id: eventId, user_id: userId });
    setBusy(false);
    if (e) {
      setError(full ? t("events.joinFull") : t("events.joinFailed"));
      return;
    }
    setJoined(true);
    setCount((c) => c + 1);
  }

  async function leave() {
    if (!userId) return;
    setBusy(true);
    await supabase
      .from("event_participants")
      .delete()
      .eq("event_id", eventId)
      .eq("user_id", userId);
    setBusy(false);
    setJoined(false);
    setCount((c) => Math.max(0, c - 1));
  }

  return (
    <div className="mt-6">
      <p className="text-sm font-medium text-neutral-500">
        {t("events.participants", { count, max: maxParticipants })}
        {full && <span className="font-semibold text-red-500"> · {t("events.full")}</span>}
      </p>

      {error && <p className="mt-3 text-sm font-medium text-red-500">{error}</p>}

      {joined ? (
        <button
          type="button"
          disabled={busy}
          onClick={leave}
          className="mt-4 w-full rounded-full border border-black py-3.5 text-sm font-bold text-black disabled:opacity-50 sm:w-auto sm:px-10"
        >
          {busy ? "…" : t("events.leave")}
        </button>
      ) : (
        <button
          type="button"
          disabled={busy || full}
          onClick={join}
          className="mt-4 w-full rounded-full bg-matchup py-3.5 text-sm font-bold text-white disabled:opacity-50 sm:w-auto sm:px-10"
        >
          {full ? t("events.fullButton") : busy ? "…" : userId ? t("events.join") : t("events.loginToJoin")}
        </button>
      )}
    </div>
  );
}
