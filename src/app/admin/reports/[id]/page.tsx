"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  type Profile,
  type ReportRow,
  fetchProfilesMap,
  displayName,
  formatDate,
  AccountStatusBadge,
  ReportStatusBadge,
  Toast,
} from "@/components/admin/shared";
import { ArrowLeftIcon } from "@/components/admin/icons";

type EnrichedReport = ReportRow & { reporter?: Profile };

export default function ReportDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const [report, setReport] = useState<ReportRow | null>(null);
  const [reporter, setReporter] = useState<Profile | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [allReports, setAllReports] = useState<EnrichedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: r } = await supabase
        .from("reports")
        .select("*")
        .eq("id", id)
        .single();
      if (!r) {
        router.push("/admin/reports");
        return;
      }
      const row = r as ReportRow;
      setReport(row);

      const [{ data: reported }, { data: rep }] = await Promise.all([
        row.reported_user_id
          ? supabase
              .from("profiles")
              .select("*")
              .eq("id", row.reported_user_id)
              .single()
          : Promise.resolve({ data: null }),
        row.reporter_id
          ? supabase
              .from("profiles")
              .select("id, first_name, display_name")
              .eq("id", row.reporter_id)
              .single()
          : Promise.resolve({ data: null }),
      ]);
      setProfile((reported as Profile) || null);
      setReporter((rep as Profile) || null);

      // All reports against the same user.
      const { data: reports } = await supabase
        .from("reports")
        .select("*")
        .eq("reported_user_id", row.reported_user_id || "")
        .order("created_at", { ascending: false });
      const reportRows = (reports || []) as ReportRow[];
      const reporterMap = await fetchProfilesMap(
        reportRows.map((x) => x.reporter_id),
      );
      setAllReports(
        reportRows.map((x) => ({
          ...x,
          reporter: x.reporter_id ? reporterMap.get(x.reporter_id) : undefined,
        })),
      );
    } catch (e) {
      console.error("ReportDetail load failed:", e);
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    load();
  }, [load]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  async function updateReportStatus(status: string) {
    setBusy(true);
    try {
      const { error } = await supabase
        .from("reports")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
      showToast("Status aktualisiert");
      await load();
    } catch (e) {
      alert("Fehler: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="p-8 text-neutral-400">Laden...</div>;
  if (!report) return null;

  return (
    <div className="p-8">
      <Toast message={toast} />

      <button
        onClick={() => router.push("/admin/reports")}
        className="text-sm text-neutral-400 hover:text-black mb-4 flex items-center gap-1.5"
      >
        <ArrowLeftIcon size={16} /> Zurück zu Reports
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider mb-3">
            Meldung
          </h3>
          <div className="bg-white border border-neutral-200 rounded-2xl p-4 text-sm space-y-2">
            <Row label="Status" value={<ReportStatusBadge status={report.status} />} />
            <Row label="Datum" value={formatDate(report.created_at)} />
            <Row label="Grund" value={report.reason || "—"} />
            <Row label="Melder" value={displayName(reporter)} />
            <Row
              label="Gemeldet"
              value={
                profile ? (
                  <Link
                    href={`/admin/users/${profile.id}`}
                    className="text-matchup hover:underline font-medium"
                  >
                    {displayName(profile)}
                  </Link>
                ) : (
                  "—"
                )
              }
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider">
              Gemeldeter User
            </h3>
            {profile && <AccountStatusBadge profile={profile} />}
          </div>
          {profile ? (
            <>
              <div className="bg-white border border-neutral-200 rounded-2xl p-4 mb-4 text-sm space-y-2">
                <Row label="Name" value={displayName(profile)} />
                <Row label="Alter" value={profile.age} />
                <Row label="Geschlecht" value={profile.gender} />
                <Row label="Sport" value={(profile.sports || []).join(", ")} />
                <Row label="Bio" value={profile.bio} />
              </div>
              <Link
                href={`/admin/users/${profile.id}`}
                className="inline-block w-full text-center py-3 rounded-2xl text-sm font-semibold bg-black text-white hover:bg-neutral-800 transition-colors"
              >
                Zum Profil &amp; Aktionen
              </Link>
            </>
          ) : (
            <p className="text-sm text-neutral-400">
              Gemeldeter User nicht gefunden.
            </p>
          )}

          <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider mt-6 mb-3">
            Report-Status setzen
          </h3>
          <div className="flex flex-wrap gap-2">
            <StatusBtn
              label="Geprüft"
              active={report.status === "reviewed"}
              disabled={busy}
              onClick={() => updateReportStatus("reviewed")}
            />
            <StatusBtn
              label="Erledigt"
              active={report.status === "actioned"}
              disabled={busy}
              onClick={() => updateReportStatus("actioned")}
            />
            <StatusBtn
              label="Verworfen"
              active={report.status === "dismissed"}
              disabled={busy}
              onClick={() => updateReportStatus("dismissed")}
            />
          </div>
        </div>
      </div>

      {profile && (
        <div className="mt-8">
          <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider mb-3">
            Alle Reports gegen {displayName(profile)} ({allReports.length})
          </h3>
          <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-left">
                  <Th>Datum</Th>
                  <Th>Melder</Th>
                  <Th>Grund</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {allReports.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-neutral-200 last:border-0"
                  >
                    <td className="px-4 py-3 text-neutral-600">
                      {formatDate(r.created_at)}
                    </td>
                    <td className="px-4 py-3">{displayName(r.reporter)}</td>
                    <td className="px-4 py-3 text-neutral-600">
                      {r.reason || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <ReportStatusBadge status={r.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value?: React.ReactNode;
}) {
  return (
    <div className="flex">
      <span className="w-28 text-neutral-400 shrink-0">{label}</span>
      <span className="text-black">{value || "—"}</span>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-xs font-semibold text-neutral-400">
      {children}
    </th>
  );
}

function StatusBtn({
  label,
  active,
  disabled,
  onClick,
}: {
  label: string;
  active: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || active}
      className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors disabled:opacity-60 ${
        active
          ? "bg-black text-white border-black"
          : "bg-white text-black border-neutral-200 hover:bg-neutral-50"
      }`}
    >
      {label}
    </button>
  );
}
