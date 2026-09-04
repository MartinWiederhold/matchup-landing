"use client";

import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n";
import { loadShareToken, setShareToken } from "@/lib/tourShare";

/**
 * Read-only Freigabe der Saison als Link (für Coach/Team). Erzeugt/erneuert/löscht den
 * unratbaren Token in tour_profiles.season_share_token. Öffentliche Ansicht: /plan/[token].
 */
export default function ShareSeasonCard({ userId }: { userId: string }) {
  const t = useT();
  const [token, setToken] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
    loadShareToken(userId).then((tk) => { setToken(tk); setLoaded(true); }).catch(() => setLoaded(true));
  }, [userId]);

  const url = token ? `${origin}/plan/${token}` : "";

  async function save(tk: string | null) {
    setBusy(true);
    try { await setShareToken(userId, tk); setToken(tk); } finally { setBusy(false); }
  }
  async function copy() {
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* ignore */ }
  }

  return (
    <section className="t2-panel mt-6">
      <p className="t2-fs-body font-bold">{t("tour.shareTitle")}</p>
      <p className="mt-1 t2-fs-body-sm text-[var(--t2-muted)]">{t("tour.shareLead")}</p>

      {!loaded ? null : !token ? (
        <button type="button" disabled={busy} onClick={() => save(crypto.randomUUID())} className="t2-cta mt-3 disabled:opacity-50">
          {t("tour.shareEnable")}
        </button>
      ) : (
        <div className="mt-3 space-y-2.5">
          <div className="flex items-center gap-2">
            <input readOnly value={url} onFocus={(e) => e.currentTarget.select()} className="t2-input min-w-0 flex-1" />
            <button type="button" onClick={copy} className="t2-cta shrink-0">{copied ? t("tour.shareCopied") : t("tour.shareCopy")}</button>
          </div>
          <div className="flex items-center gap-4">
            <button type="button" disabled={busy} onClick={() => { if (confirm(t("tour.shareRegenConfirm"))) void save(crypto.randomUUID()); }} className="t2-fs-micro font-semibold text-[var(--t2-muted)] hover:text-[var(--t2-ink)] disabled:opacity-50">
              {t("tour.shareRegen")}
            </button>
            <button type="button" disabled={busy} onClick={() => { if (confirm(t("tour.shareDisableConfirm"))) void save(null); }} className="t2-fs-micro font-semibold text-[var(--t2-danger)] disabled:opacity-50">
              {t("tour.shareDisable")}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
