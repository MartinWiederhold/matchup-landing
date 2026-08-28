"use client";

import { useMemo, useState, type ReactNode } from "react";

/**
 * Datentabelle — Kopfzeile mit sortierbaren Spalten, Zeilen mit tabellarischen
 * Ziffern, sichtbarer Leerzustand. Auf dem Handy fällt die Tabelle in eine
 * Karten-Ansicht zurück (jede Zeile eine Karte), damit nichts abgeschnitten
 * wird. Sortier-Logik ist rein UI-lokal — persistiert nichts.
 *
 * NICHT für sehr lange Listen (>200 Zeilen ungefiltert) — dort braucht es
 * Virtualisierung, das ist ein anderer Baustein.
 */
export type DataTableColumn<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  sortable?: boolean;
  compareBy?: (row: T) => string | number;
  align?: "left" | "right";
  className?: string;
};

export type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  rows: T[];
  keyOf: (row: T) => string;
  empty?: ReactNode;
  ariaLabel?: string;
};

export function DataTable<T>({ columns, rows, keyOf, empty, ariaLabel }: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const sorted = useMemo(() => {
    if (!sortKey) return rows;
    const col = columns.find((c) => c.key === sortKey);
    if (!col?.compareBy) return rows;
    const cmp = col.compareBy;
    const dir = sortDir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const A = cmp(a), B = cmp(b);
      if (A < B) return -1 * dir;
      if (A > B) return 1 * dir;
      return 0;
    });
  }, [rows, columns, sortKey, sortDir]);

  const toggle = (key: string) => {
    if (sortKey !== key) { setSortKey(key); setSortDir("asc"); return; }
    setSortDir((d) => (d === "asc" ? "desc" : "asc"));
  };

  if (rows.length === 0) {
    return <div className="py-6">{empty ?? <p className="t2-fs-body-sm text-[var(--t2-text-soft)]">Keine Einträge.</p>}</div>;
  }

  return (
    <div>
      {/* Tabelle ab md */}
      <table className="hidden w-full border-collapse md:table" aria-label={ariaLabel}>
        <thead>
          <tr className="border-b border-[var(--t2-line)] bg-[var(--t2-surface-muted)]">
            {columns.map((c) => (
              <th
                key={c.key}
                scope="col"
                className={`t2-label px-3 py-2 text-left ${c.align === "right" ? "text-right" : ""} ${c.className ?? ""}`}
              >
                {c.sortable && c.compareBy ? (
                  <button
                    type="button"
                    onClick={() => toggle(c.key)}
                    className="inline-flex items-center gap-1 uppercase outline-none focus-visible:ring-2 focus-visible:ring-[var(--t2-accent)] focus-visible:rounded-[var(--t2-radius-sm)]"
                    aria-sort={sortKey === c.key ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
                  >
                    {c.header}
                    <span aria-hidden className="t2-fs-meta text-[var(--t2-text-faint)]">
                      {sortKey === c.key ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
                    </span>
                  </button>
                ) : c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr key={keyOf(row)} className="border-b border-[var(--t2-line)]">
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={`px-3 py-2 t2-fs-body-sm text-[var(--t2-text)] tabular-nums ${c.align === "right" ? "text-right" : ""} ${c.className ?? ""}`}
                >
                  {c.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Karten-Fallback auf mobile */}
      <ul className="space-y-2 md:hidden">
        {sorted.map((row) => (
          <li key={keyOf(row)} className="rounded-[var(--t2-radius-md)] border border-[var(--t2-line)] bg-[var(--t2-surface)] p-3">
            {columns.map((c) => (
              <div key={c.key} className="flex items-baseline justify-between gap-3 py-1">
                <span className="t2-label">{c.header}</span>
                <span className="t2-fs-body-sm tabular-nums text-[var(--t2-text)]">{c.render(row)}</span>
              </div>
            ))}
          </li>
        ))}
      </ul>
    </div>
  );
}
