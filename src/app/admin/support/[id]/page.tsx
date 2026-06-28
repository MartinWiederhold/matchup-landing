"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { adminAction } from "@/lib/adminAction";
import {
  type Profile,
  type TicketRow,
  type SupportMessage,
  fetchProfilesMap,
  displayName,
  formatDateTime,
  categoryLabel,
  TicketStatusBadge,
} from "@/components/admin/shared";
import { ArrowLeftIcon } from "@/components/admin/icons";

export default function SupportDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const [ticket, setTicket] = useState<TicketRow | null>(null);
  const [user, setUser] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: t }, { data: msgs }] = await Promise.all([
        supabase.from("support_tickets").select("*").eq("id", id).single(),
        supabase
          .from("support_messages")
          .select("*")
          .eq("ticket_id", id)
          .order("created_at", { ascending: true }),
      ]);
      const row = (t as TicketRow) || null;
      setTicket(row);
      setMessages((msgs || []) as SupportMessage[]);
      if (row?.user_id) {
        const map = await fetchProfilesMap([row.user_id]);
        setUser(map.get(row.user_id) || null);
      } else {
        setUser(null);
      }
    } catch (e) {
      console.error("Support detail load failed:", e);
      setTicket(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  function messageText(m: SupportMessage) {
    return m.message || m.body || "";
  }

  function isAdminMessage(m: SupportMessage) {
    return m.sender_type === "admin";
  }

  async function sendReply() {
    const text = reply.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      await adminAction("ticketReply", { id, message: text });
      setReply("");
      await load();
    } catch (e) {
      alert(
        "Fehler beim Senden: " +
          (e instanceof Error ? e.message : String(e)),
      );
    } finally {
      setSending(false);
    }
  }

  async function setStatus(nextStatus: string) {
    if (!ticket || nextStatus === ticket.status) return;
    setBusy(true);
    try {
      await adminAction("ticketStatus", { id, status: nextStatus });
      await load();
    } catch (e) {
      alert(
        "Status konnte nicht geändert werden: " +
          (e instanceof Error ? e.message : String(e)),
      );
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="p-8 text-neutral-400">Laden...</div>;
  if (!ticket)
    return <div className="p-8 text-neutral-400">Ticket nicht gefunden.</div>;

  const closed = ticket.status === "closed";

  return (
    <div className="p-8 max-w-3xl">
      <button
        onClick={() => router.push("/admin/support")}
        className="text-sm text-neutral-400 hover:text-black mb-4 flex items-center gap-1.5"
      >
        <ArrowLeftIcon size={16} /> Zurück
      </button>

      <div className="bg-white border border-neutral-200 rounded-2xl p-5 mb-6">
        <div className="flex items-center gap-4 mb-4">
          {user?.profile_image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.profile_image}
              className="w-12 h-12 rounded-full object-cover"
              alt=""
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400">
              ?
            </div>
          )}
          <div className="flex-1">
            <p className="font-semibold">{displayName(user)}</p>
            {user?.id && (
              <p className="text-xs text-neutral-400 font-mono">
                {user.id.slice(0, 8)}
              </p>
            )}
          </div>
          <TicketStatusBadge status={ticket.status} />
        </div>
        <div className="flex items-baseline gap-3 flex-wrap">
          <h2 className="text-lg font-bold tracking-tight">
            {ticket.subject || "—"}
          </h2>
          {ticket.category && (
            <span className="text-xs text-neutral-400">
              · {categoryLabel(ticket.category)}
            </span>
          )}
        </div>
        <p className="text-xs text-neutral-400 mt-1">
          Erstellt: {formatDateTime(ticket.created_at)}
        </p>
        <div className="mt-4 flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-neutral-600 mr-1">
            Status:
          </span>
          <StatusBtn
            label="Offen"
            color="#22C55E"
            active={ticket.status === "open"}
            disabled={busy}
            onClick={() => setStatus("open")}
          />
          <StatusBtn
            label="Gelöst"
            color="#3b82f6"
            active={ticket.status === "resolved"}
            disabled={busy}
            onClick={() => setStatus("resolved")}
          />
          <StatusBtn
            label="Geschlossen"
            color="#999999"
            active={ticket.status === "closed"}
            disabled={busy}
            onClick={() => setStatus("closed")}
          />
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden mb-4">
        <div className="p-5 space-y-3">
          {messages.length === 0 ? (
            <p className="text-sm text-neutral-400 text-center py-4">
              Keine Nachrichten.
            </p>
          ) : (
            messages.map((m) => {
              const admin = isAdminMessage(m);
              return (
                <div
                  key={m.id}
                  className={`flex ${admin ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap ${
                      admin
                        ? "bg-black text-white rounded-br-md"
                        : "bg-neutral-100 text-black rounded-bl-md"
                    }`}
                  >
                    {messageText(m)}
                    <div
                      className={`text-[10px] mt-1 ${
                        admin ? "text-white/60" : "text-neutral-400"
                      }`}
                    >
                      {formatDateTime(m.created_at)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {!closed ? (
        <div className="bg-white border border-neutral-200 rounded-2xl p-4">
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Antwort schreiben..."
            rows={4}
            className="w-full text-sm border border-neutral-200 rounded-xl p-3 focus:outline-none focus:border-black resize-none"
          />
          <div className="flex justify-end items-center mt-3">
            <button
              onClick={sendReply}
              disabled={sending || !reply.trim()}
              className="px-4 py-2 bg-matchup hover:bg-matchup-hover text-white text-sm font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {sending ? "Sende..." : "Antworten"}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-neutral-50 rounded-2xl p-4 text-center text-sm text-neutral-400">
          Dieses Ticket ist geschlossen.
        </div>
      )}
    </div>
  );
}

function StatusBtn({
  label,
  color,
  active,
  disabled,
  onClick,
}: {
  label: string;
  color: string;
  active: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || active}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors disabled:opacity-60 ${
        active
          ? "bg-black text-white border-black"
          : "bg-white text-black border-neutral-200 hover:bg-neutral-50"
      }`}
    >
      <span
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </button>
  );
}
