import type { Metadata } from "next";
import {
  Card, Stat, StatusBadge, TournamentRow, RouteStop, DeadlineRow,
  EmptyState, Skeleton, Money, Distance, Callout, FilterBar, DataTable,
} from "@/app/tour2/components/ui";
import DrawerDemo from "./DrawerDemo";

/**
 * Interne Übersichts-Seite für den UI-Baukasten von Etappe 2a.
 * Zeigt alle 14 Bausteine mit allen Zuständen, dazu die Farbtokens und die
 * acht Schriftgrößen als Musterzeilen. Rein zur Beurteilung — die produktiven
 * Bereiche greifen erst in Etappe 2b auf diese Bausteine zu.
 *
 * Bewusst statisch: keine DB-Abfrage, keine i18n — dies ist ein Werkzeug.
 */
export const metadata: Metadata = {
  title: "UI",
  robots: { index: false, follow: false },
};

// ── Farb-Tokens (Bedeutungs- und Zustands-Ebene) ─────────────────────────
const COLOR_TOKENS: { name: string; note: string }[] = [
  { name: "--t2-bg",              note: "Seitenhintergrund" },
  { name: "--t2-surface",         note: "Karten" },
  { name: "--t2-surface-muted",   note: "Gedämpfte Fläche" },
  { name: "--t2-line",            note: "Standard-Rahmen" },
  { name: "--t2-line-strong",     note: "Betonter Rahmen" },
  { name: "--t2-text",            note: "Haupttext" },
  { name: "--t2-text-muted",      note: "Sekundär" },
  { name: "--t2-text-soft",       note: "Beschriftungen" },
  { name: "--t2-text-faint",      note: "Metadaten (AA-tauglich)" },
  { name: "--t2-accent",          note: "Akzent · Handlung · Fokus" },
  { name: "--t2-accent-soft",     note: "Akzent-Fläche 10%" },
  { name: "--t2-warn",            note: "Frist naht (Text)" },
  { name: "--t2-warn-surface",    note: "Frist naht (Fläche)" },
  { name: "--t2-danger",          note: "Frist verpasst / Fehler (Text)" },
  { name: "--t2-danger-surface",  note: "Danger-Fläche" },
  { name: "--t2-success",         note: "Erledigt / OK (Text)" },
  { name: "--t2-success-surface", note: "Success-Fläche" },
  { name: "--t2-info",            note: "Neutrale Info (Text)" },
  { name: "--t2-info-surface",    note: "Info-Fläche" },
  { name: "--t2-chart-1",         note: "Diagramm — Hauptdatenreihe" },
  { name: "--t2-chart-2",         note: "Diagramm — 2" },
  { name: "--t2-chart-3",         note: "Diagramm — 3" },
  { name: "--t2-chart-4",         note: "Diagramm — 4" },
  { name: "--t2-chart-5",         note: "Diagramm — Rest/Untergrund" },
];

const STATE_TOKENS: { name: string; note: string }[] = [
  { name: "--t2-state-deadline-open",   note: "Frist offen (neutral)" },
  { name: "--t2-state-deadline-soon",   note: "Frist naht (warn)" },
  { name: "--t2-state-deadline-missed", note: "Frist verpasst (danger)" },
  { name: "--t2-state-stop-past",       note: "Vergangener Stop" },
  { name: "--t2-state-stop-current",    note: "Aktueller Stop (accent)" },
  { name: "--t2-state-stop-planned",    note: "Geplanter Stop" },
  { name: "--t2-state-done",            note: "Erledigt (success)" },
];

const TYPE_STEPS: { name: string; className: string; sample: string }[] = [
  { name: "display",  className: "t2-fs-display",  sample: "1'234" },
  { name: "h1",       className: "t2-fs-h1",       sample: "Saison 2026" },
  { name: "h2",       className: "t2-fs-h2",       sample: "Nächste Aktion" },
  { name: "h3",       className: "t2-fs-h3",       sample: "Abschnitt" },
  { name: "body",     className: "t2-fs-body",     sample: "Standard-Textzeile, Fließtext." },
  { name: "body-sm",  className: "t2-fs-body-sm",  sample: "Kleinere Textzeile für Kontext." },
  { name: "micro",    className: "t2-fs-micro",    sample: "Sehr kleiner Hilfstext." },
  { name: "meta",     className: "t2-fs-meta t2-label", sample: "Meta-Label" },
];

// ── Beispieldaten für Bausteine ──────────────────────────────────────────
const nowMs = Date.parse("2026-08-28T09:00:00Z");
const day = (iso: string) => Date.parse(iso + "T00:00:00Z");

const SAMPLE_ROWS = [
  { id: "a", date: "10. Sep",  category: "Challenger 75", city: "Porto",   country: "Portugal", surface: "Sand",       km: 1245.4, prize: 150000 },
  { id: "b", date: "17. Sep",  category: "ITF M25",       city: "Adana",   country: "Türkei",   surface: "Hard",       km: 285.2,  prize: 25000 },
  { id: "c", date: "24. Sep",  category: "ATP 500",       city: "Wien",    country: "Österreich", surface: "Hard (i)", km: 34.7,   prize: 2500000 },
];

export default function UIOverviewPage() {
  return (
    <div className="t2-overview mx-auto max-w-[1120px] space-y-10">
      <header>
        <h1 className="t2-fs-h1 font-semibold tracking-[-0.02em] text-[var(--t2-text)]">UI-Baukasten</h1>
        <p className="mt-2 t2-fs-body text-[var(--t2-text-muted)]">
          Etappe 2a — 14 Bausteine, drei Token-Schichten, acht Schriftgrößen. Bewertung, bevor Etappe 2b sie in die bestehenden Bereiche einsetzt.
        </p>
      </header>

      {/* ── Farb-Tokens ────────────────────────────────────────── */}
      <section>
        <h2 className="t2-fs-h2 font-semibold text-[var(--t2-text)]">Farb-Tokens</h2>
        <p className="mt-2 t2-fs-body-sm text-[var(--t2-text-muted)]">
          Nur diese Namen kommen im Code vor. Rohwerte (`--t2-raw-*`) sind Debug-Anker.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {COLOR_TOKENS.map((c) => (
            <div key={c.name} className="flex items-center gap-3 rounded-[var(--t2-radius-md)] border border-[var(--t2-line)] bg-[var(--t2-surface)] p-3">
              <span className="h-10 w-10 shrink-0 rounded-[var(--t2-radius-sm)] border border-[var(--t2-line)]" style={{ background: `var(${c.name})` }} />
              <span className="min-w-0">
                <code className="block truncate t2-fs-body-sm font-semibold text-[var(--t2-text)]">{c.name}</code>
                <span className="block truncate t2-fs-micro text-[var(--t2-text-soft)]">{c.note}</span>
              </span>
            </div>
          ))}
        </div>
        <h3 className="t2-fs-h3 mt-6 font-semibold text-[var(--t2-text)]">Zustands-Tokens</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {STATE_TOKENS.map((c) => (
            <div key={c.name} className="flex items-center gap-3 rounded-[var(--t2-radius-md)] border border-[var(--t2-line)] bg-[var(--t2-surface)] p-3">
              <span className="h-6 w-6 shrink-0 rounded-full" style={{ background: `var(${c.name})` }} />
              <span className="min-w-0">
                <code className="block truncate t2-fs-body-sm font-semibold text-[var(--t2-text)]">{c.name}</code>
                <span className="block truncate t2-fs-micro text-[var(--t2-text-soft)]">{c.note}</span>
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Schriftgrößen ─────────────────────────────────────── */}
      <section>
        <h2 className="t2-fs-h2 font-semibold text-[var(--t2-text)]">Schriftgrößen</h2>
        <div className="mt-4 divide-y divide-[var(--t2-line)] rounded-[var(--t2-radius-md)] border border-[var(--t2-line)] bg-[var(--t2-surface)]">
          {TYPE_STEPS.map((s) => (
            <div key={s.name} className="grid grid-cols-[7rem_1fr] items-baseline gap-4 px-4 py-3">
              <code className="t2-fs-micro text-[var(--t2-text-soft)]">{s.name}</code>
              <span className={s.className}>{s.sample}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── 1. Stat ───────────────────────────────────────────── */}
      <BausteinBlock name="Stat" beschreibung="Kennzahl mit Beschriftung; Größen hero und normal, optional Delta.">
        <div className="grid gap-4 md:grid-cols-3">
          <Card><Stat size="hero" label="Ranking" value="#1200" /></Card>
          <Card><Stat label="Geplante Turniere" value="12" /></Card>
          <Card><Stat label="Punkte diese Woche" value="145" delta={{ kind: "up", text: "↑ +8" }} note="Gegenüber Vorwoche." /></Card>
        </div>
      </BausteinBlock>

      {/* ── 2. Card ───────────────────────────────────────────── */}
      <BausteinBlock name="Card" beschreibung="Container mit Rahmen (kein Schatten), optional Titel + Kopfzeilen-Aktion.">
        <div className="grid gap-4 md:grid-cols-2">
          <Card title="Ohne Aktion"><p className="t2-fs-body text-[var(--t2-text-muted)]">Inhalt der Karte.</p></Card>
          <Card title="Mit Aktion" action={<a href="#" className="t2-fs-body-sm font-semibold text-[var(--t2-accent)]">Mehr →</a>}>
            <p className="t2-fs-body text-[var(--t2-text-muted)]">Rechts oben eine Text-Aktion.</p>
          </Card>
        </div>
      </BausteinBlock>

      {/* ── 3. StatusBadge ────────────────────────────────────── */}
      <BausteinBlock name="StatusBadge" beschreibung="Fünf Zustände: offen, knapp, verpasst, erledigt, info.">
        <div className="flex flex-wrap gap-2">
          <StatusBadge kind="open">offen</StatusBadge>
          <StatusBadge kind="soon">knapp · in 3 Tagen</StatusBadge>
          <StatusBadge kind="missed">verpasst</StatusBadge>
          <StatusBadge kind="done">erledigt</StatusBadge>
          <StatusBadge kind="info">info</StatusBadge>
        </div>
      </BausteinBlock>

      {/* ── 4. TournamentRow ──────────────────────────────────── */}
      <BausteinBlock name="TournamentRow" beschreibung="Anklickbare Zeile für Listen und Suchergebnisse.">
        <Card>
          {SAMPLE_ROWS.map((r) => (
            <TournamentRow
              key={r.id}
              href="#"
              date={r.date}
              category={r.category}
              city={r.city}
              countryLabel={r.country}
              surface={r.surface}
              right={<Distance km={r.km} />}
            />
          ))}
        </Card>
      </BausteinBlock>

      {/* ── 5. RouteStop ──────────────────────────────────────── */}
      <BausteinBlock name="RouteStop" beschreibung="Ein Halt in der Saison-Route. Vier Zustände.">
        <div className="flex flex-wrap gap-3">
          <RouteStop href="#" date="18. Aug" category="ITF M25" city="Adana"     countryLabel="TR" state="past" />
          <RouteStop href="#" date="25. Aug" category="Challenger 75" city="Porto"    countryLabel="PT" state="current" />
          <RouteStop href="#" date="1. Sep"  category="Challenger 100" city="Genoa"   countryLabel="IT" state="planned" />
          <RouteStop href="#" date="8. Sep"  category="ITF M15" city="Le Neubourg"    countryLabel="FR" state="missed" />
        </div>
      </BausteinBlock>

      {/* ── 6. DeadlineRow ────────────────────────────────────── */}
      <BausteinBlock name="DeadlineRow" beschreibung="Fristzeile mit Countdown-Pille. Nutzt deadlineCountdown.">
        <Card>
          <DeadlineRow href="#" what="Meldeschluss" tournamentName="Adana"
            deadlineMs={nowMs + 3 * 86_400_000} asOfMs={nowMs}
            labels={{ past: "verpasst", today: "heute", future: (d) => `in ${d} Tagen` }} />
          <DeadlineRow href="#" what="Meldeschluss" tournamentName="Porto"
            deadlineMs={nowMs + 14 * 86_400_000} asOfMs={nowMs}
            labels={{ past: "verpasst", today: "heute", future: (d) => `in ${d} Tagen` }} />
          <DeadlineRow href="#" what="Meldeschluss" tournamentName="Le Neubourg"
            deadlineMs={nowMs - 2 * 86_400_000} asOfMs={nowMs}
            labels={{ past: "verpasst", today: "heute", future: (d) => `in ${d} Tagen` }} />
        </Card>
      </BausteinBlock>

      {/* ── 7. EmptyState ─────────────────────────────────────── */}
      <BausteinBlock name="EmptyState" beschreibung="Ruhiger Hinweis wenn eine Liste noch nichts enthält.">
        <Card>
          <EmptyState
            icon="🎾"
            title="Noch keine Turniere in der Saison"
            hint="Nutze den Finder, um passende Turniere in deine Saison zu übernehmen."
            action={<a href="#" className="t2-fs-body-sm font-semibold text-[var(--t2-accent)]">Zum Finder →</a>}
          />
        </Card>
      </BausteinBlock>

      {/* ── 8. Skeleton ───────────────────────────────────────── */}
      <BausteinBlock name="Skeleton" beschreibung="Statischer Platzhalter (kein Zucken).">
        <Card>
          <div className="space-y-2">
            <Skeleton width="12rem" height="1.25rem" />
            <Skeleton width="18rem" height="1rem" />
            <Skeleton width="8rem" height="1rem" />
          </div>
        </Card>
      </BausteinBlock>

      {/* ── 9. Money ──────────────────────────────────────────── */}
      <BausteinBlock name="Money" beschreibung="Betrag mit Währung, tabellarische Ziffern. Formatierung in der Domain-Schicht.">
        <Card>
          <ul className="space-y-1 t2-fs-body text-[var(--t2-text)]">
            <li>Preisgeld ITF M25 · <Money amountMinor={2500000} currency="USD" locale="en-US" /></li>
            <li>Saisonbudget · <Money amountMinor={1500000} currency="EUR" locale="de-CH" /></li>
            <li>Meldegebühr · <Money amountMinor={4500} currency="CHF" locale="de-CH" /></li>
          </ul>
        </Card>
      </BausteinBlock>

      {/* ── 10. Distance ──────────────────────────────────────── */}
      <BausteinBlock name="Distance" beschreibung="Kilometer, einheitlich gerundet. Formatierung in der Domain-Schicht.">
        <Card>
          <ul className="space-y-1 t2-fs-body text-[var(--t2-text)]">
            <li>Zürich → Adana · <Distance km={2154} locale="de-CH" /></li>
            <li>Como → Genoa · <Distance km={135.4} locale="de-CH" /></li>
            <li>Zürich → Basel · <Distance km={4.2} locale="de-CH" /></li>
          </ul>
        </Card>
      </BausteinBlock>

      {/* ── 11. Callout ───────────────────────────────────────── */}
      <BausteinBlock name="Callout" beschreibung="Vier Tonarten: info, warn, danger, success.">
        <div className="grid gap-3 md:grid-cols-2">
          <Callout tone="info" title="Info">Passkontrolle in dieser Region kann länger dauern.</Callout>
          <Callout tone="warn" title="Achtung">Anreise sehr knapp — 2 Nächte Puffer empfohlen.</Callout>
          <Callout tone="danger" title="Fehler">Meldeschluss verstrichen — keine Nachmeldung möglich.</Callout>
          <Callout tone="success" title="Erledigt">Meldung bestätigt.</Callout>
        </div>
      </BausteinBlock>

      {/* ── 12. FilterBar ─────────────────────────────────────── */}
      <BausteinBlock name="FilterBar" beschreibung="Nur die Hülle mit Überlauf-Scrolling. Fertige Filter kommen vom Aufrufer.">
        <Card>
          <FilterBar ariaLabel="Beispiel-Filter">
            {["Alle", "ITF", "Challenger", "ATP", "WTA", "Sand", "Hart", "Indoor", "Nordafrika", "Südeuropa", "Naher Osten"].map((f) => (
              <button
                key={f}
                type="button"
                className="shrink-0 rounded-full border border-[var(--t2-line-strong)] bg-[var(--t2-surface)] px-3 py-1.5 t2-fs-body-sm text-[var(--t2-text)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--t2-accent)]"
              >
                {f}
              </button>
            ))}
          </FilterBar>
        </Card>
      </BausteinBlock>

      {/* ── 13. Drawer ────────────────────────────────────────── */}
      <BausteinBlock name="Drawer" beschreibung="Fährt rechts (Desktop) bzw. unten (Handy) ein. Escape + Klick daneben schließen. Fokus bleibt gefangen.">
        <Card>
          <DrawerDemo />
        </Card>
      </BausteinBlock>

      {/* ── 14. DataTable ─────────────────────────────────────── */}
      <BausteinBlock name="DataTable" beschreibung="Sortierbare Kopfzeile, Karten-Umbruch auf dem Handy, Leerzustand.">
        <Card>
          <DataTable
            ariaLabel="Turniere"
            columns={[
              { key: "date",     header: "Datum",   render: (r) => r.date,     sortable: true, compareBy: (r) => r.date },
              { key: "city",     header: "Ort",     render: (r) => r.city,     sortable: true, compareBy: (r) => r.city },
              { key: "category", header: "Kategorie", render: (r) => r.category, sortable: true, compareBy: (r) => r.category ?? "" },
              { key: "distance", header: "Distanz", align: "right", render: (r) => <Distance km={r.km} />, sortable: true, compareBy: (r) => r.km },
              { key: "prize",    header: "Preisgeld", align: "right", render: (r) => <Money amountMinor={r.prize * 100} currency="USD" locale="en-US" />, sortable: true, compareBy: (r) => r.prize },
            ]}
            rows={SAMPLE_ROWS}
            keyOf={(r) => r.id}
          />
        </Card>
      </BausteinBlock>
    </div>
  );
}

// Rahmen für jeden Baustein-Abschnitt der Übersichtsseite — Titel + Untertitel + Inhalt.
function BausteinBlock({ name, beschreibung, children }: { name: string; beschreibung: string; children: React.ReactNode }) {
  return (
    <section>
      <header className="mb-3">
        <h2 className="t2-fs-h2 font-semibold text-[var(--t2-text)]">{name}</h2>
        <p className="mt-1 t2-fs-body-sm text-[var(--t2-text-muted)]">{beschreibung}</p>
      </header>
      {children}
    </section>
  );
}
