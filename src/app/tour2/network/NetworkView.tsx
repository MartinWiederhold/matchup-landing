"use client";

/**
 * Fläche Netzwerk: Präsenz, Trainingsslots, Dienstleister, Wildcards.
 * Kein Anbieterbild, kein Verified-Abzeichen. Leerzustand benennt den dünnen Bestand.
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useT, useLocale } from "@/lib/i18n";
import { loadSeason, type SeasonEntry } from "@/lib/tourSeason";
import { loadTourPresence, contactHref, type TourPresence } from "@/lib/tourPresence";
import { loadTournamentSlots, type TrainingSlot } from "@/lib/tourTrainingSlots";
import { loadProvidersNearCoords, type ProviderNear } from "@/lib/services";
import { loadWildcardContacts } from "@/lib/tourWildcards";
import TourLoginCard from "@/app/tour2/components/TourLoginCard";
import Tour2Area, { T2Kpi, T2AsideBlock } from "@/app/tour2/components/Tour2Area";
import TrainingSlots from "@/app/tour2/components/planner/TrainingSlots";
import WildcardsView from "@/app/tour2/wildcards/WildcardsView";
import { t2markArea } from "@/app/tour2/t2mark";
import { tour2PlannerTournamentHref } from "@/app/tour2/components/t2Action";

const PROVIDER_RADIUS_KM = 50;
const MAX_WEEKS = 16;

type PresenceRow = TourPresence & { city: string; tournamentId: string };
type SlotWeek = { id: string; city: string; monday: string; slots: TrainingSlot[] };

export default function NetworkView() {
  const { user, loading: authLoading } = useAuth();
  const t = useT();
  const { locale } = useLocale();
  const loc = locale === "en" ? "en-GB" : "de-DE";

  const [state, setState] = useState<"loading" | "error" | "done">("loading");
  const [season, setSeason] = useState<SeasonEntry[]>([]);
  const [people, setPeople] = useState<PresenceRow[]>([]);
  const [weeks, setWeeks] = useState<SlotWeek[]>([]);
  const [providers, setProviders] = useState<ProviderNear[] | null>(null);
  const [provCity, setProvCity] = useState<string | null>(null);
  const [requests, setRequests] = useState(0);
  const [nowMs] = useState(() => Date.now());
  const todayISO = new Date(nowMs).toISOString().slice(0, 10);

  useEffect(() => {
    if (authLoading || !user) return;
    let alive = true;
    (async () => {
      try {
        const [s, wcs] = await Promise.all([loadSeason(), loadWildcardContacts(user.id)]);
        if (!alive) return;
        setSeason(s);
        setRequests(wcs.filter((c) => c.requested_on || c.outcome).length);
        const upcoming = [...s.filter((x) => !x.tournamentInactive)]
          .sort((a, b) => a.tournament.tournament_monday.localeCompare(b.tournament.tournament_monday))
          .filter((x) => x.tournament.tournament_monday >= todayISO)
          .slice(0, MAX_WEEKS);
        const [presLists, slotLists] = await Promise.all([
          Promise.all(upcoming.map((x) => loadTourPresence(x.tournament.id))),
          Promise.all(upcoming.map((x) => loadTournamentSlots(x.tournament.id))),
        ]);
        if (!alive) return;
        const rows: PresenceRow[] = [];
        upcoming.forEach((x, i) => {
          for (const p of presLists[i]) {
            if (p.user_id === user.id) continue;
            rows.push({ ...p, city: x.tournament.city || x.tournament.name || "—", tournamentId: x.tournament.id });
          }
        });
        setPeople(rows);
        setWeeks(upcoming.map((x, i) => ({
          id: x.tournament.id,
          city: x.tournament.city || x.tournament.name || "—",
          monday: x.tournament.tournament_monday,
          slots: slotLists[i].slots,
        })));
        const withCoords = upcoming.find((x) => x.tournament.latitude != null && x.tournament.longitude != null);
        if (withCoords) {
          setProvCity(withCoords.tournament.city || withCoords.tournament.name || "—");
          const near = await loadProvidersNearCoords(withCoords.tournament.latitude as number, withCoords.tournament.longitude as number, PROVIDER_RADIUS_KM);
          if (alive) setProviders(near);
        } else {
          setProvCity(null);
          setProviders([]);
        }
        if (alive) { setState("done"); t2markArea("network"); }
      } catch {
        if (alive) setState("error");
      }
    })();
    return () => { alive = false; };
  }, [authLoading, user, todayISO]);

  const fmtDate = (iso: string) => new Intl.DateTimeFormat(loc, { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(iso + "T00:00:00Z"));
  const countryName = (c: string | null) => (c && !t(`tour.country.${c}`).startsWith("tour.country.") ? t(`tour.country.${c}`) : (c ?? ""));

  const uniqueOnTour = useMemo(() => new Set(people.map((p) => p.user_id)).size, [people]);
  const lookingN = people.filter((p) => p.looking || p.looking_room).length;
  const slotTotal = weeks.reduce((n, w) => n + w.slots.length, 0);
  const nextWeek = weeks[0] ?? null;

  if (authLoading || (user && state === "loading")) {
    return <p className="px-4 py-16 t2-fs-body text-[var(--t2-muted)]">{t("tour.loading")}</p>;
  }
  if (!user) return <TourLoginCard />;
  if (state === "error") return <p className="px-4 py-16 t2-fs-body text-[var(--t2-muted)]">{t("tour.loadError")}</p>;

  const kpis = (
    <>
      <T2Kpi label={t("tour.t2netPeople")}>{uniqueOnTour}</T2Kpi>
      <T2Kpi label={t("tour.t2netOnTour")}>{uniqueOnTour}</T2Kpi>
      <T2Kpi label={t("tour.t2netLooking")}>{lookingN}</T2Kpi>
      <T2Kpi label={t("tour.t2netRequests")}>{requests}</T2Kpi>
    </>
  );

  const aside = (
    <T2AsideBlock title={t("tour.t2netSlots")}>
      <p className="t2-fs-body font-semibold tabular-nums">{slotTotal}</p>
      {weeks.filter((w) => w.slots.length > 0).map((w) => (
        <p key={w.id} className="mt-1 t2-fs-micro text-[var(--t2-muted)]">
          <Link href={tour2PlannerTournamentHref(w.id)} className="font-semibold text-[var(--t2-accent)]">{w.city}</Link>
          {" · "}{w.slots.length}
        </p>
      ))}
    </T2AsideBlock>
  );

  return (
    <Tour2Area title={t("tour.t2navNetwork")} lead={t("tour.t2netLead")} kpis={kpis} aside={aside}>
      <section className="t2-dash-card">
        <h2 className="t2-kicker">{t("tour.t2netPresence")}</h2>
        {people.length === 0 ? (
          <p className="mt-4 t2-fs-body text-[var(--t2-muted)]">{t("tour.t2netPresenceEmpty")}</p>
        ) : (
          <ul className="mt-4 divide-y divide-[var(--t2-line)] border-y border-[var(--t2-line)]">
            {people.map((p) => {
              const href = p.contact ? contactHref(p.contact) : null;
              return (
                <li key={`${p.tournamentId}-${p.user_id}`} className="flex items-baseline justify-between gap-3 py-3">
                  <span>
                    <span className="block t2-fs-body font-semibold">{p.name || t("tour.fieldMissing")}</span>
                    <span className="mt-0.5 block t2-fs-micro text-[var(--t2-muted)]">
                      {[p.city, p.nationality ? countryName(p.nationality) : null, p.rank_label, p.looking ? t("tour.wsSeekPartner") : null, p.looking_room ? t("tour.wsSeekRoom") : null].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                  {href && (
                    <a href={href} className="shrink-0 t2-fs-body-sm font-semibold text-[var(--t2-accent)]">{t("tour.t2netContact")}</a>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="mt-4 t2-dash-card">
        <h2 className="t2-kicker">{t("tour.t2netSlots")}</h2>
        {!nextWeek ? (
          <p className="mt-4 t2-fs-body text-[var(--t2-muted)]">{t("tour.t2netSlotsEmpty")}</p>
        ) : (
          <div className="mt-2">
            <p className="t2-fs-body-sm text-[var(--t2-muted)]">{nextWeek.city} · {fmtDate(nextWeek.monday)}</p>
            <TrainingSlots tournamentId={nextWeek.id} tournamentMonday={nextWeek.monday} viewerId={user.id} viewerContact={null} nowMs={nowMs} />
          </div>
        )}
      </section>

      <section className="mt-4 t2-dash-card">
        <h2 className="t2-kicker">{t("tour.t2netProv")}</h2>
        {!provCity ? (
          <p className="mt-4 t2-fs-body text-[var(--t2-muted)]">{t("tour.t2netProvEmptyNone")}</p>
        ) : !providers || providers.length === 0 ? (
          <p className="mt-4 t2-fs-body text-[var(--t2-muted)]">{t("tour.t2netProvEmpty", { city: provCity })}</p>
        ) : (
          <ul className="mt-4 divide-y divide-[var(--t2-line)] border-y border-[var(--t2-line)]">
            {providers.map((p) => (
              <li key={p.id} className="py-3">
                <p className="t2-fs-body font-semibold">{p.name}</p>
                <p className="mt-0.5 t2-fs-micro text-[var(--t2-muted)]">
                  {t(`services.cat_${p.category}`)}
                  {p.city ? ` · ${p.city}` : ""}
                  {` · ${Math.round(p.distance_km)} km`}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-4 t2-dash-card">
        <WildcardsView skipMark />
      </section>
    </Tour2Area>
  );
}
