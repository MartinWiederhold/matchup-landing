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

  const inp = "w-full border border-black/15 bg-white px-3.5 py-2.5 text-[14px] text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none";

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy || !email.trim() || !password) return;
    setBusy(true);
    setError(null);
    const { error } = await signIn(email.trim(), password);
    if (error) { setError(translateError(error)); setBusy(false); }
  }

  return (
    <div className="flex h-[100dvh] flex-col items-center justify-center bg-white px-6 text-neutral-900">
      <div className="w-full max-w-sm">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-matchup">Matchup Tour</p>
        <h2 className="mt-2 text-[28px] font-semibold tracking-[-0.04em]">{t("tour.loginRequiredTitle")}</h2>
        <p className="mt-2 text-sm text-neutral-500">{t("tour.loginFormLead")}</p>
        <form onSubmit={submit} className="mt-6 space-y-2.5">
          <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("tour.loginEmail")} className={inp} />
          <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t("tour.loginPassword")} className={inp} />
          {error && <p className="text-[12px] font-semibold text-neutral-900">{error}</p>}
          <button type="submit" disabled={busy || !email.trim() || !password} className="w-full rounded-full bg-matchup px-6 py-3 text-sm font-bold text-white hover:bg-matchup-hover disabled:opacity-50">
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
