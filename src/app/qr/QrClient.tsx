"use client";

import { useCallback, useEffect, useState } from "react";

type Stats = { total: number; today: number; week: number };

export default function QrClient() {
  const [tab, setTab] = useState<"qr" | "stats">("qr");
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const scanUrl = origin ? `${origin}/api/qr/scan` : "";
  const qrImg = scanUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=400x400&margin=10&qzone=1&data=${encodeURIComponent(scanUrl)}`
    : "";

  return (
    <div className="min-h-dvh bg-neutral-50 text-neutral-900">
      <div className="mx-auto max-w-lg px-4 py-8">
        <h1 className="text-2xl font-bold tracking-tight">Matchup QR</h1>
        <p className="mt-1 text-sm text-neutral-500">
          QR-Code zur Webapp – mit Scan-Statistik.
        </p>

        {/* Tabs */}
        <div className="mt-6 flex gap-1 rounded-full bg-neutral-200/70 p-1">
          {([
            ["qr", "QR-Code"],
            ["stats", "Analytics"],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`flex-1 rounded-full py-2 text-sm font-semibold transition-colors ${
                tab === key ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {tab === "qr" ? (
            <QrTab qrImg={qrImg} scanUrl={scanUrl} />
          ) : (
            <StatsTab />
          )}
        </div>
      </div>
    </div>
  );
}

function QrTab({ qrImg, scanUrl }: { qrImg: string; scanUrl: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 text-center shadow-sm">
      <div className="mx-auto flex h-64 w-64 items-center justify-center overflow-hidden rounded-2xl border border-neutral-100 bg-white">
        {qrImg ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qrImg} alt="QR-Code zur Matchup Webapp" className="h-full w-full object-contain" />
        ) : (
          <span className="text-sm text-neutral-400">lädt…</span>
        )}
      </div>

      <p className="mt-5 text-sm font-semibold">Scannen öffnet die Webapp</p>
      <p className="mt-1 break-all text-xs text-neutral-400">{scanUrl}</p>

      <div className="mt-5 flex gap-2">
        <a
          href={qrImg}
          download="matchup-qr.png"
          target="_blank"
          rel="noreferrer"
          className="flex flex-1 items-center justify-center rounded-full bg-matchup py-3 text-sm font-bold text-white hover:bg-matchup-hover"
        >
          QR herunterladen
        </a>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard?.writeText(scanUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="flex flex-1 items-center justify-center rounded-full border border-neutral-300 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
        >
          {copied ? "Kopiert ✓" : "Link kopieren"}
        </button>
      </div>
    </div>
  );
}

function StatsTab() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [resetOpen, setResetOpen] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/qr", { cache: "no-store" });
      setStats(await r.json());
    } catch {
      setStats(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function doReset() {
    setBusy(true);
    setMsg("");
    try {
      const r = await fetch("/api/qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      if (r.ok) {
        setResetOpen(false);
        setCode("");
        setMsg("Scans zurückgesetzt.");
        await load();
      } else {
        const d = await r.json().catch(() => ({}));
        setMsg(d.error || "Fehler beim Zurücksetzen.");
      }
    } catch {
      setMsg("Netzwerkfehler.");
    }
    setBusy(false);
  }

  const cards: { label: string; value: number }[] = [
    { label: "Gesamt", value: stats?.total ?? 0 },
    { label: "Heute", value: stats?.today ?? 0 },
    { label: "7 Tage", value: stats?.week ?? 0 },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-neutral-200 bg-white p-4 text-center shadow-sm">
            <div className="text-3xl font-extrabold tracking-tight text-matchup">
              {loading ? "–" : c.value}
            </div>
            <div className="mt-1 text-xs font-medium text-neutral-500">{c.label}</div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={load}
        className="w-full rounded-full border border-neutral-300 py-2.5 text-sm font-semibold text-neutral-600 hover:bg-white"
      >
        Aktualisieren
      </button>

      {msg && <p className="text-center text-sm text-neutral-600">{msg}</p>}

      <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold">Scans zurücksetzen</p>
        <p className="mt-1 text-xs text-neutral-500">
          Setzt den Zähler auf 0. Zur Bestätigung Code eingeben.
        </p>

        {!resetOpen ? (
          <button
            type="button"
            onClick={() => {
              setResetOpen(true);
              setMsg("");
            }}
            className="mt-3 w-full rounded-full border border-red-200 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"
          >
            Scans zurücksetzen
          </button>
        ) : (
          <div className="mt-3 space-y-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              inputMode="numeric"
              placeholder="Bestätigungscode"
              className="h-11 w-full rounded-full border border-neutral-300 px-4 text-center text-sm tracking-widest outline-none focus:border-matchup"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setResetOpen(false);
                  setCode("");
                }}
                className="flex-1 rounded-full border border-neutral-300 py-2.5 text-sm font-semibold text-neutral-600"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={doReset}
                disabled={busy || !code}
                className="flex-1 rounded-full bg-red-600 py-2.5 text-sm font-bold text-white disabled:opacity-50"
              >
                {busy ? "…" : "Bestätigen"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
