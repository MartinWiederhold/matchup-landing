"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useAuth, translateError } from "@/lib/auth";
import { useT } from "@/lib/i18n";

/** Anmeldemaske für /tour2. Hell, Matchup-CTA. */
export default function TourLoginCard() {
  const { signIn } = useAuth();
  const t = useT();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy || !email.trim() || !password) return;
    setBusy(true);
    setError(null);
    const { error } = await signIn(email.trim(), password);
    if (error) { setError(translateError(error)); setBusy(false); }
  }

  return (
    <div className="flex h-[100dvh] flex-col items-center justify-center bg-[var(--t2-paper)] px-6 text-[var(--t2-ink)]">
      <div className="w-full max-w-sm">
        <p className="t2-kicker">Matchup Tour</p>
        <h2 className="t2-display mt-3 text-[2.2rem]">{t("tour.loginRequiredTitle")}</h2>
        <p className="mt-2 text-sm text-[var(--t2-muted)]">{t("tour.loginFormLead")}</p>
        <form onSubmit={submit} className="mt-6 space-y-2.5">
          <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("tour.loginEmail")} className="t2-input" />
          <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t("tour.loginPassword")} className="t2-input" />
          {error && <p className="text-[12px] font-semibold">{error}</p>}
          <button type="submit" disabled={busy || !email.trim() || !password} className="t2-cta mt-2 w-full disabled:opacity-50">
            {busy ? t("tour.loginBusy") : t("tour.loginSubmit")}
          </button>
        </form>
        <div className="mt-4 flex items-center justify-between text-[12px]">
          <Link href="/reset-password" className="font-semibold text-neutral-500 hover:text-neutral-900">{t("tour.loginForgot")}</Link>
          <Link href="/app" className="font-semibold text-matchup hover:underline">{t("tour.loginToApp")}</Link>
        </div>
      </div>
    </div>
  );
}
