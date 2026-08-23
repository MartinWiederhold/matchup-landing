"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useAuth, translateError } from "@/lib/auth";
import { useT } from "@/lib/i18n";

/**
 * Schlanke Anmeldemaske für /tour. Eigene Komponente (AuthScreen liegt unter /app und
 * bleibt tabu), nutzt aber DIESELBE Supabase-Anmeldung über useAuth().signIn → die Sitzung
 * bleibt geteilt: nach dem Login setzt onAuthStateChange den user, und SeasonWorkspace
 * rendert die Arbeitsfläche. Kein Weiterleiten mehr nach /app (das wirkte wie eine Sackgasse).
 */
export default function TourLoginCard() {
  const { signIn } = useAuth();
  const t = useT();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const inp = "w-full rounded-xl border border-black/15 bg-white px-3.5 py-2.5 text-[14px] text-neutral-900 placeholder:text-neutral-400 focus:border-black/30 focus:outline-none";

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy || !email.trim() || !password) return;
    setBusy(true);
    setError(null);
    const { error } = await signIn(email.trim(), password);
    // Erfolg braucht kein Weiterleiten: onAuthStateChange → user gesetzt → Fläche rendert.
    if (error) { setError(translateError(error)); setBusy(false); }
  }

  return (
    <div className="flex h-[100dvh] flex-col items-center justify-center bg-white px-6">
      <div className="w-full max-w-sm">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-matchup">Matchup Tour</p>
        <h2 className="mt-1 text-xl font-extrabold text-neutral-900">{t("tour.loginRequiredTitle")}</h2>
        <p className="mt-1 text-sm text-neutral-500">{t("tour.loginFormLead")}</p>
        <form onSubmit={submit} className="mt-4 space-y-2.5">
          <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("tour.loginEmail")} className={inp} />
          <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t("tour.loginPassword")} className={inp} />
          {error && <p className="text-[12px] font-semibold text-red-600">{error}</p>}
          <button type="submit" disabled={busy || !email.trim() || !password} className="w-full rounded-full bg-matchup px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-matchup-hover disabled:opacity-50">
            {busy ? t("tour.loginBusy") : t("tour.loginSubmit")}
          </button>
        </form>
        <div className="mt-3 flex items-center justify-between text-[12px]">
          <Link href="/reset-password" className="font-semibold text-neutral-500 hover:text-neutral-800">{t("tour.loginForgot")}</Link>
          <Link href="/app" className="font-semibold text-matchup hover:underline">{t("tour.loginToApp")}</Link>
        </div>
      </div>
    </div>
  );
}
