"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useT } from "@/lib/i18n";
import { loadSeasonPlanRows, loadTournamentsByIds } from "@/lib/tourSeason";
import {
  loadWildcardContacts,
  loadWildcardEvents,
  upsertWildcardContact,
  logWildcardEvent,
  deleteWildcardEvent,
  type TourWildcardContact,
  type TourWildcardEvent,
  type WildcardType,
  type WildcardOutcome,
  type WildcardEventKind,
} from "@/lib/tourWildcards";
import { t2markArea } from "@/app/tour2/t2mark";

const EVENT_KINDS: WildcardEventKind[] = ["contacted", "follow_up", "request", "response", "note"];
const OUTCOMES: WildcardOutcome[] = ["pending", "granted", "declined"];

type TourItem = { id: string; name: string; monday: string };

/**
 * Wildcard-Verwaltung: je Saison-Turnier eine Karte mit dem Turnierdirektor-Kontakt
 * (Selbstauskunft aus dem IPIN-Fact-Sheet), dem aktuellen Anfragestand und dem append-only
 * Verlauf der Beziehungspflege. Nutzergebunden, owner-only (fremde Personendaten, MU-035).
 * Karten sind eingeklappt und zeigen im Kopf den Anfragestand — so bleibt die Saison scanbar.
 */
export default function WildcardsView({ skipMark = false }: { skipMark?: boolean }) {
  const { user, loading: authLoading } = useAuth();
  const t = useT();

  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [tours, setTours] = useState<TourItem[]>([]);
  const [contactByTour, setContactByTour] = useState<Map<string, TourWildcardContact>>(new Map());
  const [eventsByContact, setEventsByContact] = useState<Map<string, TourWildcardEvent[]>>(new Map());

  const reload = useCallback(async () => {
    if (!user) return;
    const [plans, contacts, events] = await Promise.all([
      loadSeasonPlanRows(),
      loadWildcardContacts(user.id),
      loadWildcardEvents(user.id),
    ]);
    const ids = [...new Set(plans.map((p) => p.tournament_id))];
    const tt = await loadTournamentsByIds(ids);
    const byId = new Map(tt.map((x) => [x.id, x]));
    const list: TourItem[] = ids.map((id) => {
      const x = byId.get(id);
      const name = x ? (x.city ? `${x.city}${x.country ? ", " + x.country : ""}` : x.name ?? id) : id;
      return { id, name, monday: x?.tournament_monday ?? "" };
    });
    list.sort((a, b) => a.monday.localeCompare(b.monday) || a.name.localeCompare(b.name));
    setTours(list);
    setContactByTour(new Map(contacts.map((c) => [c.tournament_id, c])));
    const evMap = new Map<string, TourWildcardEvent[]>();
    for (const e of events) {
      const arr = evMap.get(e.contact_id) ?? [];
      arr.push(e);
      evMap.set(e.contact_id, arr);
    }
    setEventsByContact(evMap);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    reload()
      .then(() => { if (alive) { setStatus("ready"); if (!skipMark) t2markArea("network"); } })
      .catch(() => { if (alive) setStatus("error"); });
    return () => { alive = false; };
  }, [user, reload, skipMark]);

  if (authLoading) return <p className="mt-6 t2-fs-body text-[var(--t2-muted)]">{t("tour.t2authChecking")}</p>;
  if (!user) {
    return (
      <div className="mt-8 t2-panel bg-[var(--t2-surface)] p-6 text-center">
        <p className="t2-fs-body text-[var(--t2-muted)]">{t("tour.loginRequiredText")}</p>
        <Link href="/app" className="mt-3 t2-cta">{t("tour.loginCta")}</Link>
      </div>
    );
  }
  if (status === "loading") return <p className="mt-6 t2-fs-body text-[var(--t2-muted)]">{t("tour.t2dataLoading")}</p>;
  if (status === "error") return <p className="mt-6 t2-fs-body text-[var(--t2-muted)]">{t("tour.loadError")}</p>;

  return (
    <div className="mt-8 space-y-4">
      <p className="rounded-xl bg-[var(--t2-surface)] px-4 py-3 t2-fs-body-sm leading-relaxed text-[var(--t2-muted)]">{t("tour.wcHint")}</p>
      {tours.length === 0 ? (
        <p className="rounded-xl bg-[var(--t2-surface)] px-4 py-4 t2-fs-body text-[var(--t2-muted)]">{t("tour.wcEmpty")}</p>
      ) : (
        <div className="space-y-3">
          {tours.map((tour) => {
            const contact = contactByTour.get(tour.id) ?? null;
            const events = contact ? eventsByContact.get(contact.id) ?? [] : [];
            return <WildcardCard key={tour.id} userId={user.id} tour={tour} contact={contact} events={events} onChange={reload} t={t} />;
          })}
        </div>
      )}
    </div>
  );
}

/** Eine Turnier-Karte: Kopf mit Anfragestand + eingeklappter Kontakt-Editor + Verlauf. */
function WildcardCard({
  userId,
  tour,
  contact,
  events,
  onChange,
  t,
}: {
  userId: string;
  tour: TourItem;
  contact: TourWildcardContact | null;
  events: TourWildcardEvent[];
  onChange: () => Promise<void>;
  t: ReturnType<typeof useT>;
}) {
  const [open, setOpen] = useState(false);
  const [dir, setDir] = useState(contact?.director_name ?? "");
  const [email, setEmail] = useState(contact?.email ?? "");
  const [phone, setPhone] = useState(contact?.phone ?? "");
  const [fed, setFed] = useState(contact?.federation ?? "");
  const [note, setNote] = useState(contact?.note ?? "");
  const [type, setType] = useState<WildcardType | "">(contact?.wildcard_type ?? "");
  const [reqOn, setReqOn] = useState(contact?.requested_on ?? "");
  const [outcome, setOutcome] = useState<WildcardOutcome | "">(contact?.outcome ?? "");
  const [contactId, setContactId] = useState<string | null>(contact?.id ?? null);
  const [saving, setSaving] = useState(false);

  // Verlauf-Formular.
  const [evKind, setEvKind] = useState<WildcardEventKind>("contacted");
  const [evDate, setEvDate] = useState("");
  const [evDetail, setEvDetail] = useState("");

  const nn = (s: string) => (s.trim() === "" ? null : s.trim());
  const inp = "t2-input";
  const lbl = "mb-1 block t2-fs-micro font-semibold text-[var(--t2-muted)]";

  const requested = contact != null && (contact.requested_on != null || contact.outcome != null);

  const save = async () => {
    setSaving(true);
    try {
      const id = await upsertWildcardContact(userId, tour.id, {
        director_name: nn(dir),
        email: nn(email),
        phone: nn(phone),
        federation: nn(fed),
        note: nn(note),
        wildcard_type: type === "" ? null : type,
        requested_on: reqOn || null,
        outcome: outcome === "" ? null : outcome,
      });
      setContactId(id);
      await onChange();
    } finally {
      setSaving(false);
    }
  };

  const addEvent = async () => {
    if (!contactId) return;
    await logWildcardEvent(userId, contactId, { kind: evKind, occurredOn: evDate || undefined, detail: nn(evDetail) });
    setEvDetail("");
    await onChange();
  };
  const delEvent = async (id: string) => { await deleteWildcardEvent(id); await onChange(); };

  return (
    <div className="t2-panel">
      {/* Kopf: Turniername + Anfragestand + Auf-/Zuklappen. */}
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left">
        <span className="min-w-0 truncate t2-fs-body font-bold text-[var(--t2-ink)]">{tour.name}</span>
        <span className="flex shrink-0 items-center gap-2">
          {contact?.wildcard_type && (
            <span className="rounded-full bg-[var(--t2-surface)] px-2 py-0.5 t2-fs-meta font-semibold text-[var(--t2-muted)]">{t(`tour.wcType_${contact.wildcard_type}`)}</span>
          )}
          {contact?.outcome ? (
            <span className={`rounded-full px-2 py-0.5 t2-fs-meta font-bold ${outcomeClass(contact.outcome)}`}>{t(`tour.wcOutcome_${contact.outcome}`)}</span>
          ) : (
            <span className={`rounded-full px-2 py-0.5 t2-fs-meta font-semibold ${requested ? "bg-[var(--t2-warn-surface)] text-[var(--t2-warn)]" : "bg-[var(--t2-surface)] text-[var(--t2-faint)]"}`}>
              {requested ? t("tour.wcStatusRequested") : t("tour.wcStatusNotRequested")}
            </span>
          )}
          <span className="text-[var(--t2-faint)]">{open ? "−" : "+"}</span>
        </span>
      </button>

      {open && (
        <div className="border-t border-[var(--t2-line)] px-4 py-4">
          {/* Kontakt-Felder. */}
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="block"><span className={lbl}>{t("tour.wcDirector")}</span><input value={dir} onChange={(e) => setDir(e.target.value)} className={inp} /></label>
            <label className="block"><span className={lbl}>{t("tour.wcFederation")}</span><input value={fed} onChange={(e) => setFed(e.target.value)} className={inp} /></label>
            <label className="block"><span className={lbl}>{t("tour.wcEmailField")}</span><input value={email} onChange={(e) => setEmail(e.target.value)} inputMode="email" className={inp} /></label>
            <label className="block"><span className={lbl}>{t("tour.wcPhone")}</span><input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" className={inp} /></label>
          </div>
          <label className="mt-2 block"><span className={lbl}>{t("tour.wcRelationNote")}</span><textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className={inp} /></label>

          {/* Anfragestand. */}
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            <label className="block"><span className={lbl}>{t("tour.wcType")}</span>
              <select value={type} onChange={(e) => setType(e.target.value as WildcardType | "")} className={inp}>
                <option value="">{t("tour.wcTypeNone")}</option>
                <option value="main">{t("tour.wcType_main")}</option>
                <option value="qualifying">{t("tour.wcType_qualifying")}</option>
              </select>
            </label>
            <label className="block"><span className={lbl}>{t("tour.wcRequestedOn")}</span><input type="date" value={reqOn} onChange={(e) => setReqOn(e.target.value)} className={inp} /></label>
            <label className="block"><span className={lbl}>{t("tour.wcOutcome")}</span>
              <select value={outcome} onChange={(e) => setOutcome(e.target.value as WildcardOutcome | "")} className={inp}>
                <option value="">{t("tour.wcOutcomeNone")}</option>
                {OUTCOMES.map((o) => <option key={o} value={o}>{t(`tour.wcOutcome_${o}`)}</option>)}
              </select>
            </label>
          </div>
          <button type="button" onClick={save} disabled={saving} className="t2-cta mt-3 disabled:opacity-50">
            {t("tour.wcSaveContact")}
          </button>

          {/* Verlauf — erst nach dem ersten Speichern (Events hängen am Kontakt). */}
          <div className="mt-5 border-t border-[var(--t2-line)] pt-4">
            <h3 className="t2-section-title">{t("tour.wcTimeline")}</h3>
            {!contactId ? (
              <p className="mt-2 t2-fs-micro text-[var(--t2-faint)]">{t("tour.wcSaveContactFirst")}</p>
            ) : (
              <>
                {events.length === 0 ? (
                  <p className="mt-2 t2-fs-micro text-[var(--t2-faint)]">{t("tour.wcTimelineEmpty")}</p>
                ) : (
                  <ul className="mt-2 space-y-1.5">
                    {events.map((ev) => (
                      <li key={ev.id} className="flex items-start justify-between gap-2 t2-fs-body-sm">
                        <span className="min-w-0 text-[var(--t2-ink)]">
                          <span className="tabular-nums text-[var(--t2-faint)]">{ev.occurred_on}</span>{" · "}
                          <span className="font-semibold">{t(`tour.wcEvent_${ev.kind}`)}</span>
                          {ev.detail ? <span className="text-[var(--t2-muted)]"> — {ev.detail}</span> : null}
                        </span>
                        <button type="button" onClick={() => delEvent(ev.id)} aria-label={t("tour.wcDeleteEvent")} className="shrink-0 text-[var(--t2-faint)] transition-colors hover:text-[var(--t2-danger)]">✕</button>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Ereignis anhängen. */}
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  <label className="block"><span className={lbl}>{t("tour.wcEventKind")}</span>
                    <select value={evKind} onChange={(e) => setEvKind(e.target.value as WildcardEventKind)} className={inp}>
                      {EVENT_KINDS.map((k) => <option key={k} value={k}>{t(`tour.wcEvent_${k}`)}</option>)}
                    </select>
                  </label>
                  <label className="block"><span className={lbl}>{t("tour.wcEventDate")}</span><input type="date" value={evDate} onChange={(e) => setEvDate(e.target.value)} className={inp} /></label>
                  <label className="block"><span className={lbl}>{t("tour.wcEventDetail")}</span><input value={evDetail} onChange={(e) => setEvDetail(e.target.value)} className={inp} /></label>
                </div>
                <button type="button" onClick={addEvent} className="t2-cta mt-2">
                  {t("tour.wcAddEventBtn")}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function outcomeClass(o: WildcardOutcome): string {
  if (o === "granted") return "bg-[var(--t2-success-surface)] text-[var(--t2-success)]";
  if (o === "declined") return "bg-[var(--t2-danger-surface)] text-[var(--t2-danger)]";
  return "bg-[var(--t2-warn-surface)] text-[var(--t2-warn)]"; // pending
}
