"use client";

import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import { useT, useLocale } from "@/lib/i18n";
import {
  loadDocuments, uploadDocument, removeDocument, signedDocumentUrl,
  DOC_KINDS, DOC_MAX_BYTES, DOC_ACCEPT_MIME,
} from "@/lib/tourTournamentDocuments";
import type { TourTournamentDocument, TourTournamentDocumentKind } from "@/lib/types";

/**
 * Turnier-Ordner im „Unterlagen"-Reiter: je Art (Fact Sheet, Bestätigung, Auslosung, Visum,
 * Flug, Hotel, Transport, Versicherung, Sonstiges) die eigenen Dateien. Privat — Öffnen läuft
 * über kurzlebige signierte Links, nie über eine öffentliche URL. Löschen entfernt ZUERST die
 * Datei (Storage-API), dann die Zeile (siehe tourTournamentDocuments.ts, MU-017).
 */
export default function TournamentDocuments({ tournamentId, viewerId }: { tournamentId: string; viewerId: string }) {
  const t = useT();
  const { locale } = useLocale();
  const [docs, setDocs] = useState<TourTournamentDocument[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const pendingKind = useRef<TourTournamentDocumentKind>("other");

  const reload = useCallback(async () => { setDocs(await loadDocuments(viewerId, tournamentId)); }, [viewerId, tournamentId]);
  useEffect(() => { let a = true; reload().catch(() => { /* still */ }); return () => { a = false; void a; }; }, [reload]);

  const fmtDay = (iso: string) => new Intl.DateTimeFormat(locale, { day: "2-digit", month: "2-digit", year: "2-digit" }).format(new Date(iso));
  const kindLabel = (k: string) => t(`tour.docKind_${k}`);

  const pick = (kind: TourTournamentDocumentKind) => { setErr(null); pendingKind.current = kind; fileRef.current?.click(); };
  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // erlaubt erneute Auswahl derselben Datei
    if (!file) return;
    if (!DOC_ACCEPT_MIME.includes(file.type)) { setErr(t("tour.docBadType")); return; }
    if (file.size > DOC_MAX_BYTES) { setErr(t("tour.docTooBig")); return; }
    setBusy(true);
    try { await uploadDocument(viewerId, tournamentId, pendingKind.current, null, file); await reload(); }
    catch { setErr(t("tour.docUploadFailed")); }
    finally { setBusy(false); }
  };
  const open = async (d: TourTournamentDocument) => {
    try { window.open(await signedDocumentUrl(d.storage_path), "_blank", "noopener"); }
    catch { setErr(t("tour.docOpenFailed")); }
  };
  const del = async (d: TourTournamentDocument) => {
    setBusy(true);
    try { await removeDocument(d); await reload(); }
    catch { setErr(t("tour.docDeleteFailed")); }
    finally { setBusy(false); }
  };

  return (
    <section className="mt-1">
      <p className="t2-kicker">{t("tour.docTitle")}</p>
      <p className="mt-1 t2-fs-micro text-[var(--t2-muted)]">{t("tour.docIntro")}</p>
      {err && <p className="mt-2 t2-fs-micro font-semibold text-[var(--t2-danger)]">{err}</p>}
      <input ref={fileRef} type="file" accept={DOC_ACCEPT_MIME.join(",")} onChange={onFile} className="hidden" />

      <div className="mt-3 space-y-1.5">
        {DOC_KINDS.map((k) => {
          const files = docs.filter((d) => d.kind === k);
          return (
            <div key={k} className="flex items-start gap-2 rounded-xl border border-[var(--t2-line)] px-2.5 py-2">
              <span className="w-20 shrink-0 pt-0.5 t2-fs-micro font-semibold text-[var(--t2-muted)]">{kindLabel(k)}</span>
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
                {files.length === 0 && <span className="t2-fs-micro text-[var(--t2-faint)]">—</span>}
                {files.map((d) => (
                  <span key={d.id} className="inline-flex items-center gap-1 rounded-full bg-[var(--t2-surface)] py-0.5 pl-2.5 pr-1 t2-fs-meta font-semibold text-[var(--t2-ink)]">
                    <button type="button" onClick={() => open(d)} className="max-w-[10rem] truncate hover:text-[var(--t2-accent)]">{d.label || fmtDay(d.created_at)}</button>
                    <button type="button" onClick={() => del(d)} disabled={busy} aria-label={t("tour.docRemove")} className="text-[var(--t2-faint)] hover:text-[var(--t2-danger)] disabled:opacity-50">✕</button>
                  </span>
                ))}
              </div>
              <button type="button" onClick={() => pick(k)} disabled={busy} aria-label={t("tour.docAdd")} className="shrink-0 rounded-full bg-[var(--t2-accent)] px-2.5 py-1 t2-fs-micro font-bold leading-none text-[var(--t2-on-accent)] hover:bg-[var(--t2-accent)]-hover disabled:opacity-50">＋</button>
            </div>
          );
        })}
      </div>
      <p className="mt-2 t2-fs-meta leading-relaxed text-[var(--t2-faint)]">{t("tour.docNote")}</p>
    </section>
  );
}
