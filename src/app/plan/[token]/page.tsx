import type { Metadata } from "next";
import { getServiceClient } from "@/lib/adminClient";
import { getT } from "@/lib/i18n/server";

// Öffentliche, read-only Saison-Freigabe für Coaches/Team. Kein Login, keine tour2-Shell.
// Auth über den unratbaren Token in der URL; NUR nicht-sensible Saison-/Budget-Daten.
export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false } };

type PlanRow = { tournament_id: string | null };
type TT = {
  id: string; name: string | null; city: string | null; country: string | null;
  tournament_monday: string; category: string | null; surface: string | null;
};

function fmtDate(iso: string, locale: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  try { return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "de-DE", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(Date.UTC(y, m - 1, d))); }
  catch { return iso; }
}

export default async function SharedPlanPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const t = await getT();
  const svc = getServiceClient();

  const { data: prof } = await svc
    .from("tour_profiles")
    .select("user_id, season_budget")
    .eq("season_share_token", token)
    .maybeSingle();

  const shell = (children: React.ReactNode) => (
    <main className="mx-auto min-h-[100dvh] max-w-2xl bg-white px-5 py-10 text-neutral-900 sm:px-8">{children}</main>
  );

  if (!prof) {
    return shell(
      <div className="py-20 text-center">
        <h1 className="text-2xl font-bold">{t("tour.shareNotFound")}</h1>
        <p className="mt-2 text-sm text-neutral-500">{t("tour.shareNotFoundSub")}</p>
      </div>,
    );
  }

  const uid = (prof as { user_id: string }).user_id;
  const budget = (prof as { season_budget: number | null }).season_budget;
  const [{ data: me }, { data: plan }] = await Promise.all([
    svc.from("profiles").select("first_name, display_name").eq("id", uid).maybeSingle(),
    svc.from("tour_season_plan").select("tournament_id").eq("user_id", uid),
  ]);
  const ids = ((plan as PlanRow[]) ?? []).map((r) => r.tournament_id).filter((x): x is string => !!x);
  const { data: tours } = ids.length
    ? await svc.from("tour_tournaments").select("id, name, city, country, tournament_monday, category, surface").in("id", ids)
    : { data: [] as TT[] };
  const byId = new Map(((tours as TT[]) ?? []).map((tt) => [tt.id, tt]));
  const stops = ids
    .map((id) => byId.get(id))
    .filter((x): x is TT => !!x)
    .sort((a, b) => a.tournament_monday.localeCompare(b.tournament_monday));

  const name = (me as { first_name: string | null; display_name: string | null } | null)?.first_name
    ?? (me as { display_name: string | null } | null)?.display_name
    ?? "—";
  const locale = "de";
  const surfaceLabel = (s: string | null) => {
    if (!s) return "";
    const l = t(`tour.surface_${s}`);
    return l.startsWith("tour.") ? s : l;
  };

  return shell(
    <>
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-matchup">Matchup Tour</p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight">{t("tour.shareViewTitle", { name })}</h1>
      <p className="mt-1 text-sm text-neutral-500">{t("tour.shareViewSub")}</p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-neutral-200 p-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-neutral-400">{t("tour.shareTournaments")}</p>
          <p className="mt-1 text-2xl font-extrabold tabular-nums">{stops.length}</p>
        </div>
        <div className="rounded-2xl border border-neutral-200 p-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-neutral-400">{t("tour.shareBudget")}</p>
          <p className="mt-1 text-2xl font-extrabold tabular-nums">{budget != null ? `${budget.toLocaleString(locale)} €` : "—"}</p>
        </div>
      </div>

      <div className="mt-6 divide-y divide-neutral-100 rounded-2xl border border-neutral-200">
        {stops.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-neutral-400">{t("tour.shareEmpty")}</p>
        ) : (
          stops.map((s) => (
            <div key={s.id} className="flex items-center gap-3 px-4 py-3">
              <div className="w-24 shrink-0 text-[13px] font-semibold text-neutral-500 tabular-nums">{fmtDate(s.tournament_monday, locale)}</div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-semibold">{s.name ?? "—"}</p>
                <p className="truncate text-xs text-neutral-400">
                  {[s.city, s.country].filter(Boolean).join(", ")}
                  {s.category ? ` · ${s.category}` : ""}
                  {s.surface ? ` · ${surfaceLabel(s.surface)}` : ""}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <p className="mt-6 text-center text-[11px] text-neutral-400">{t("tour.shareFooter")}</p>
    </>,
  );
}
