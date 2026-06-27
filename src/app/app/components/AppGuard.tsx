"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import AuthScreen from "./AuthScreen";
import OnboardingFlow from "./Onboarding/OnboardingFlow";
import AppShell from "./AppShell";
import type { Warning } from "@/lib/types";

function Spinner() {
  return (
    <div className="flex h-dvh items-center justify-center bg-black">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-matchup" />
    </div>
  );
}

function CenteredMessage({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex h-dvh flex-col items-center justify-center bg-black px-8 text-center text-white">
      <h1 className="text-2xl font-bold">{title}</h1>
      {subtitle && <p className="mt-3 max-w-xs text-sm text-zinc-400">{subtitle}</p>}
      {children}
    </div>
  );
}

export default function AppGuard() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const [warning, setWarning] = useState<Warning | null>(null);

  // Presence-Heartbeat (alle 60s) + Warnungen prüfen
  useEffect(() => {
    if (!profile) return;
    const beat = () =>
      supabase
        .from("profiles")
        .update({ last_active: new Date().toISOString() })
        .eq("id", profile.id);
    beat();
    const interval = window.setInterval(beat, 60_000);

    supabase
      .from("warnings")
      .select("*")
      .eq("user_id", profile.id)
      .eq("is_read", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => data && setWarning(data as Warning));

    return () => window.clearInterval(interval);
  }, [profile]);

  if (!isSupabaseConfigured) {
    return (
      <CenteredMessage
        title="Supabase nicht konfiguriert"
        subtitle="Trage NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local ein, um die App zu nutzen."
      >
        <Link
          href="/"
          className="mt-8 rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white hover:bg-white hover:text-black"
        >
          Zurück zur Startseite
        </Link>
      </CenteredMessage>
    );
  }

  if (loading) return <Spinner />;
  if (!user) return <AuthScreen />;
  if (!profile) return <OnboardingFlow />;

  if (profile.is_banned) {
    return (
      <CenteredMessage
        title="Dein Konto wurde gesperrt."
        subtitle="Bei Fragen wende dich an den Support: hello@matchup.ch"
      />
    );
  }

  if (profile.is_paused) {
    return (
      <CenteredMessage
        title="Dein Konto ist pausiert."
        subtitle={profile.pause_reason ?? undefined}
      >
        <button
          type="button"
          onClick={async () => {
            await supabase
              .from("profiles")
              .update({ is_paused: false, pause_reason: null })
              .eq("id", profile.id);
            await refreshProfile();
          }}
          className="mt-8 rounded-full bg-matchup px-6 py-3 text-sm font-bold text-white hover:bg-matchup-hover"
        >
          Konto reaktivieren
        </button>
      </CenteredMessage>
    );
  }

  return (
    <>
      {warning && (
        <div className="fixed inset-x-0 top-0 z-50 mx-auto max-w-[430px] bg-yellow-900 px-4 py-3 text-sm text-yellow-100">
          <div className="flex items-start justify-between gap-3">
            <span>⚠️ {warning.message}</span>
            <button
              type="button"
              onClick={async () => {
                await supabase
                  .from("warnings")
                  .update({ is_read: true })
                  .eq("id", warning.id);
                setWarning(null);
              }}
              className="shrink-0 font-bold"
            >
              ×
            </button>
          </div>
        </div>
      )}
      <AppShell profile={profile} />
    </>
  );
}
