"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useT } from "@/lib/i18n";

type Status = "checking" | "ready" | "invalid" | "done";

export default function ResetPassword() {
  const t = useT();
  const [status, setStatus] = useState<Status>("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Der Reset-Link erzeugt eine (temporäre) Recovery-Session. supabase-js liest
  // das Token automatisch aus der URL. Sobald eine Session da ist → Formular.
  useEffect(() => {
    let settled = false;
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        settled = true;
        setStatus("ready");
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        settled = true;
        setStatus("ready");
      }
    });
    // Falls nach kurzer Zeit keine Session da ist → Link ungültig/abgelaufen.
    const timer = window.setTimeout(() => {
      if (!settled) setStatus("invalid");
    }, 2500);
    return () => {
      sub.subscription.unsubscribe();
      window.clearTimeout(timer);
    };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError(t("auth.errPasswordTooShort"));
      return;
    }
    if (password !== confirm) {
      setError(t("auth.resetMismatch"));
      return;
    }
    setError("");
    setSaving(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    setStatus("done");
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-black px-6 py-12 text-white">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="text-3xl font-bold tracking-[0.2em]">MATCHUP</span>
        </div>

        {status === "checking" && (
          <p className="text-center text-sm text-zinc-400">{t("auth.resetChecking")}</p>
        )}

        {status === "invalid" && (
          <div className="text-center">
            <p className="text-sm text-amber-300">{t("auth.resetInvalid")}</p>
            <a
              href="/app"
              className="mt-6 inline-block rounded-full bg-matchup px-6 py-3 text-sm font-bold text-white"
            >
              {t("auth.resetToLogin")}
            </a>
          </div>
        )}

        {status === "done" && (
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-matchup text-2xl">
              ✓
            </div>
            <p className="mt-5 text-sm text-zinc-300">{t("auth.resetDone")}</p>
            <a
              href="/app"
              className="mt-6 inline-block rounded-full bg-matchup px-6 py-3 text-sm font-bold text-white"
            >
              {t("auth.resetToLogin")}
            </a>
          </div>
        )}

        {status === "ready" && (
          <>
            <h1 className="text-center text-2xl font-bold tracking-tight">
              {t("auth.resetTitle")}
            </h1>
            <p className="mt-2 text-center text-sm text-zinc-400">
              {t("auth.resetSubtitle")}
            </p>
            <form onSubmit={submit} className="mt-6 space-y-3">
              <input
                type="password"
                autoComplete="new-password"
                placeholder={t("auth.resetNewPassword")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl bg-zinc-800 px-4 py-3.5 text-base outline-none ring-1 ring-transparent focus:ring-matchup"
              />
              <input
                type="password"
                autoComplete="new-password"
                placeholder={t("auth.resetConfirmPassword")}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full rounded-xl bg-zinc-800 px-4 py-3.5 text-base outline-none ring-1 ring-transparent focus:ring-matchup"
              />
              {error && (
                <div className="rounded-xl bg-zinc-800 px-4 py-3 text-sm text-amber-300">
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-full bg-matchup py-3.5 text-sm font-bold tracking-wide text-white transition-colors hover:bg-matchup-hover disabled:opacity-60"
              >
                {saving ? t("auth.resetSaving") : t("auth.resetSubmit")}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
