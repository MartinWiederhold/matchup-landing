"use client";

import { supabase } from "@/lib/supabase";

/* ============================================================
   Types
   ============================================================ */

export type Profile = {
  id: string;
  first_name?: string | null;
  display_name?: string | null;
  age?: number | null;
  gender?: string | null;
  sports?: string[] | null;
  skill_level?: string | null;
  bio?: string | null;
  profile_image?: string | null;
  additional_images?: string[] | null;
  is_seed?: boolean | null;
  is_paused?: boolean | null;
  is_banned?: boolean | null;
  banned_at?: string | null;
  pause_reason?: string | null;
  created_at?: string | null;
  city?: string | null;
  country?: string | null;
};

export type ReportRow = {
  id: string;
  reporter_id?: string | null;
  reported_user_id?: string | null;
  reason?: string | null;
  status?: string | null;
  created_at?: string | null;
};

export type TicketRow = {
  id: string;
  user_id?: string | null;
  subject?: string | null;
  category?: string | null;
  status?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type SupportMessage = {
  id: string;
  ticket_id?: string | null;
  sender_id?: string | null;
  sender_type?: string | null;
  message?: string | null;
  body?: string | null;
  created_at?: string | null;
};

/* ============================================================
   Helpers
   ============================================================ */

export function displayName(p?: Profile | null): string {
  if (!p) return "—";
  return p.display_name || p.first_name || "—";
}

export function formatDate(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("de-CH");
}

export function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("de-CH", { dateStyle: "short", timeStyle: "short" });
}

/**
 * Fetch profiles by id and return a Map<id, Profile>.
 * Replaces PostgREST embedded selects (which can fail in the `web`
 * schema due to missing foreign keys).
 */
export async function fetchProfilesMap(
  ids: (string | null | undefined)[],
): Promise<Map<string, Profile>> {
  const unique = Array.from(
    new Set(ids.filter((x): x is string => !!x)),
  );
  const map = new Map<string, Profile>();
  if (unique.length === 0) return map;
  try {
    const { data } = await supabase
      .from("profiles")
      .select(
        "id, first_name, display_name, profile_image, additional_images, age, gender, sports, skill_level, bio, is_seed, is_paused, is_banned, created_at, city, country",
      )
      .in("id", unique);
    for (const row of (data || []) as Profile[]) {
      map.set(row.id, row);
    }
  } catch (e) {
    console.error("fetchProfilesMap failed:", e);
  }
  return map;
}

/* ============================================================
   Status badges
   ============================================================ */

export function ReportStatusBadge({ status }: { status?: string | null }) {
  const styles: Record<string, string> = {
    pending: "bg-orange-100 text-orange-600",
    reviewed: "bg-blue-100 text-blue-700",
    actioned: "bg-green-100 text-green-700",
    dismissed: "bg-neutral-100 text-neutral-500",
  };
  const labels: Record<string, string> = {
    pending: "Offen",
    reviewed: "Geprüft",
    actioned: "Erledigt",
    dismissed: "Verworfen",
  };
  const key = status || "pending";
  return (
    <span
      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
        styles[key] || styles.pending
      }`}
    >
      {labels[key] || key}
    </span>
  );
}

export function TicketStatusBadge({ status }: { status?: string | null }) {
  const styles: Record<string, string> = {
    open: "bg-green-100 text-green-700",
    in_progress: "bg-orange-100 text-orange-600",
    answered: "bg-orange-100 text-orange-600",
    resolved: "bg-blue-100 text-blue-700",
    closed: "bg-neutral-100 text-neutral-500",
  };
  const labels: Record<string, string> = {
    open: "Offen",
    in_progress: "In Bearbeitung",
    answered: "In Bearbeitung",
    resolved: "Gelöst",
    closed: "Geschlossen",
  };
  const key = status || "open";
  return (
    <span
      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
        styles[key] || styles.open
      }`}
    >
      {labels[key] || key}
    </span>
  );
}

export function AccountStatusBadge({ profile }: { profile: Profile }) {
  if (profile.is_banned) {
    return (
      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-600">
        Gesperrt
      </span>
    );
  }
  if (profile.is_paused) {
    return (
      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-orange-100 text-orange-600">
        Pausiert
      </span>
    );
  }
  return (
    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700">
      Aktiv
    </span>
  );
}

export function categoryLabel(category?: string | null): string {
  if (!category) return "—";
  return (
    (
      {
        bug: "Bug",
        feature: "Feature",
        account: "Account",
        other: "Sonstiges",
      } as Record<string, string>
    )[category] || category
  );
}

/* ============================================================
   Small UI bits
   ============================================================ */

export function Toast({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="fixed top-4 right-4 bg-matchup text-white px-4 py-2 rounded-xl text-sm font-medium z-50 shadow-lg">
      {message}
    </div>
  );
}

export function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
