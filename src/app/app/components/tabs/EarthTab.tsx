"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useT, useLocale } from "@/lib/i18n";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Zugangscode → schaltet die Weltkarte frei (wie beim Shop-/Tour-Waitlist).
const SECRET_CODE = "50805080";

type Status = "idle" | "loading" | "success" | "already" | "error";

/**
 * Earth-/Weltkarte-Tab: noch nicht freigeschaltet → Vollbild-Waitlist (Design wie
 * das WaitlistModal, aber als Screen). Code 50805080 statt E-Mail → freischalten
 * (localStorage) und weiter zur echten /map.
 */
export default function EarthTab() {
  const t = useT();
  const { locale } = useLocale();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [err, setErr] = useState("");
  const [count, setCount] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem("mu_earth_unlocked") === "1") {
        window.location.href = "/map";
        return;
      }
    } catch { /* ignore */ }
    supabase.rpc("waitlist_count").then(({ data }) => {
      if (typeof data === "number") setCount(data);
    });
  }, []);

  const shareUrl = typeof window !== "undefined" ? window.location.origin : "https://matchup-app.com";
  const feature = t("app.earthFeature");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const raw = email.trim();
    if (raw === SECRET_CODE) {
      try { localStorage.setItem("mu_earth_unlocked", "1"); } catch { /* ignore */ }
      window.location.href = "/map";
      return;
    }
    const em = raw.toLowerCase();
    if (!EMAIL_RE.test(em)) { setErr(t("waitlist.emailInvalid")); setStatus("error"); return; }
    setStatus("loading");
    setErr("");
    const { error } = await supabase.from("waitlist").insert({ email: em, feature: "Earth", locale });
    if (error) {
      if (error.code === "23505") { setStatus("already"); return; }
      setErr(t("waitlist.errorGeneric"));
      setStatus("error");
      return;
    }
    const { data } = await supabase.rpc("waitlist_count");
    if (typeof data === "number") setCount(data);
    setStatus("success");
  }

  function copyLink() {
    navigator.clipboard?.writeText(shareUrl).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    });
  }

  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(t("waitlist.shareMessage", { url: shareUrl }))}`;
  const done = status === "success" || status === "already";

  return (
    <div className="relative -mb-28 flex min-h-[100dvh] flex-col justify-center overflow-hidden bg-neutral-950 px-6 pb-36 pt-12 text-white">
      {/* Pink-Glow */}
      <div className="pointer-events-none absolute -top-16 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-pink-500/40 blur-3xl" />

      <div className="relative mx-auto w-full max-w-md">
        {!done ? (
          <>
            <span className="inline-flex items-center rounded-full border border-pink-400/60 bg-pink-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-pink-300">
              {feature}
            </span>
            <h2 className="mt-4 text-2xl font-bold leading-tight tracking-tight">{t("waitlist.title")}</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/70">{t("waitlist.subtitle", { feature })}</p>

            <ul className="mt-5 space-y-2.5">
              {[t("waitlist.benefit1"), t("waitlist.benefit2")].map((b) => (
                <li key={b} className="flex items-center gap-2.5 text-sm text-white/85">
                  <svg className="h-4 w-4 shrink-0 text-pink-400" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M3 8.5l3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {b}
                </li>
              ))}
            </ul>

            <form onSubmit={submit} className="mt-6">
              <input
                type="text"
                inputMode="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("waitlist.emailPlaceholder")}
                className="w-full rounded-full border border-white/15 bg-white/5 px-5 py-3.5 text-base text-white outline-none transition-colors placeholder:text-white/40 focus:border-pink-400"
              />
              {status === "error" && <p className="mt-2 px-1 text-xs text-red-400">{err}</p>}
              <button
                type="submit"
                disabled={status === "loading"}
                className="mt-3 w-full rounded-full bg-pink-500 px-6 py-3.5 text-sm font-bold tracking-wide text-white shadow-[0_10px_30px_-8px_rgba(236,72,153,0.8)] transition-colors hover:bg-pink-400 disabled:opacity-60"
              >
                {status === "loading" ? t("waitlist.submitting") : t("waitlist.cta")}
              </button>
            </form>

            <p className="mt-3 text-center text-xs text-white/45">
              {count != null && count >= 25 ? t("waitlist.socialMany", { count }) : t("waitlist.socialFew")}
            </p>
            <p className="mt-1 text-center text-[11px] text-white/30">{t("waitlist.privacy")}</p>
          </>
        ) : (
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-pink-500/15 text-3xl ring-1 ring-pink-400/40">🎾</div>
            <h2 className="mt-4 text-2xl font-bold tracking-tight">
              {status === "already" ? t("waitlist.alreadyTitle") : t("waitlist.successTitle")}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/70">
              {status === "already" ? t("waitlist.alreadyText") : t("waitlist.successText")}
            </p>
            <div className="mt-6 space-y-2.5">
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 py-3.5 text-sm font-bold text-white transition-opacity hover:opacity-90">
                {t("waitlist.shareWhatsapp")}
              </a>
              <button type="button" onClick={copyLink} className="w-full rounded-full border border-white/15 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/10">
                {copied ? t("waitlist.copied") : t("waitlist.copyLink")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
