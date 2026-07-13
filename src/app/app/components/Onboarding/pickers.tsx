"use client";

import { useMemo, useState } from "react";

/** Länderliste (EN/DE + Flagge). Kein Anspruch auf Vollständigkeit jedes Mikrostaats,
 *  deckt aber alle gängigen Nationalitäten ab. */
export const COUNTRIES: { en: string; de: string; flag: string }[] = [
  { en: "Switzerland", de: "Schweiz", flag: "🇨🇭" }, { en: "Germany", de: "Deutschland", flag: "🇩🇪" },
  { en: "Austria", de: "Österreich", flag: "🇦🇹" }, { en: "France", de: "Frankreich", flag: "🇫🇷" },
  { en: "Italy", de: "Italien", flag: "🇮🇹" }, { en: "Spain", de: "Spanien", flag: "🇪🇸" },
  { en: "Portugal", de: "Portugal", flag: "🇵🇹" }, { en: "United Kingdom", de: "Vereinigtes Königreich", flag: "🇬🇧" },
  { en: "Ireland", de: "Irland", flag: "🇮🇪" }, { en: "Netherlands", de: "Niederlande", flag: "🇳🇱" },
  { en: "Belgium", de: "Belgien", flag: "🇧🇪" }, { en: "Luxembourg", de: "Luxemburg", flag: "🇱🇺" },
  { en: "Denmark", de: "Dänemark", flag: "🇩🇰" }, { en: "Sweden", de: "Schweden", flag: "🇸🇪" },
  { en: "Norway", de: "Norwegen", flag: "🇳🇴" }, { en: "Finland", de: "Finnland", flag: "🇫🇮" },
  { en: "Iceland", de: "Island", flag: "🇮🇸" }, { en: "Poland", de: "Polen", flag: "🇵🇱" },
  { en: "Czechia", de: "Tschechien", flag: "🇨🇿" }, { en: "Slovakia", de: "Slowakei", flag: "🇸🇰" },
  { en: "Hungary", de: "Ungarn", flag: "🇭🇺" }, { en: "Slovenia", de: "Slowenien", flag: "🇸🇮" },
  { en: "Croatia", de: "Kroatien", flag: "🇭🇷" }, { en: "Serbia", de: "Serbien", flag: "🇷🇸" },
  { en: "Bosnia and Herzegovina", de: "Bosnien und Herzegowina", flag: "🇧🇦" }, { en: "Montenegro", de: "Montenegro", flag: "🇲🇪" },
  { en: "North Macedonia", de: "Nordmazedonien", flag: "🇲🇰" }, { en: "Albania", de: "Albanien", flag: "🇦🇱" },
  { en: "Greece", de: "Griechenland", flag: "🇬🇷" }, { en: "Bulgaria", de: "Bulgarien", flag: "🇧🇬" },
  { en: "Romania", de: "Rumänien", flag: "🇷🇴" }, { en: "Moldova", de: "Moldau", flag: "🇲🇩" },
  { en: "Ukraine", de: "Ukraine", flag: "🇺🇦" }, { en: "Belarus", de: "Belarus", flag: "🇧🇾" },
  { en: "Russia", de: "Russland", flag: "🇷🇺" }, { en: "Lithuania", de: "Litauen", flag: "🇱🇹" },
  { en: "Latvia", de: "Lettland", flag: "🇱🇻" }, { en: "Estonia", de: "Estland", flag: "🇪🇪" },
  { en: "Turkey", de: "Türkei", flag: "🇹🇷" }, { en: "Cyprus", de: "Zypern", flag: "🇨🇾" },
  { en: "Malta", de: "Malta", flag: "🇲🇹" }, { en: "Monaco", de: "Monaco", flag: "🇲🇨" },
  { en: "Liechtenstein", de: "Liechtenstein", flag: "🇱🇮" }, { en: "Andorra", de: "Andorra", flag: "🇦🇩" },
  { en: "United States", de: "USA", flag: "🇺🇸" }, { en: "Canada", de: "Kanada", flag: "🇨🇦" },
  { en: "Mexico", de: "Mexiko", flag: "🇲🇽" }, { en: "Brazil", de: "Brasilien", flag: "🇧🇷" },
  { en: "Argentina", de: "Argentinien", flag: "🇦🇷" }, { en: "Chile", de: "Chile", flag: "🇨🇱" },
  { en: "Colombia", de: "Kolumbien", flag: "🇨🇴" }, { en: "Peru", de: "Peru", flag: "🇵🇪" },
  { en: "Uruguay", de: "Uruguay", flag: "🇺🇾" }, { en: "Ecuador", de: "Ecuador", flag: "🇪🇨" },
  { en: "Venezuela", de: "Venezuela", flag: "🇻🇪" }, { en: "Bolivia", de: "Bolivien", flag: "🇧🇴" },
  { en: "Paraguay", de: "Paraguay", flag: "🇵🇾" },
  { en: "Australia", de: "Australien", flag: "🇦🇺" }, { en: "New Zealand", de: "Neuseeland", flag: "🇳🇿" },
  { en: "Japan", de: "Japan", flag: "🇯🇵" }, { en: "China", de: "China", flag: "🇨🇳" },
  { en: "South Korea", de: "Südkorea", flag: "🇰🇷" }, { en: "India", de: "Indien", flag: "🇮🇳" },
  { en: "Thailand", de: "Thailand", flag: "🇹🇭" }, { en: "Vietnam", de: "Vietnam", flag: "🇻🇳" },
  { en: "Indonesia", de: "Indonesien", flag: "🇮🇩" }, { en: "Philippines", de: "Philippinen", flag: "🇵🇭" },
  { en: "Malaysia", de: "Malaysia", flag: "🇲🇾" }, { en: "Singapore", de: "Singapur", flag: "🇸🇬" },
  { en: "Hong Kong", de: "Hongkong", flag: "🇭🇰" }, { en: "Taiwan", de: "Taiwan", flag: "🇹🇼" },
  { en: "Kazakhstan", de: "Kasachstan", flag: "🇰🇿" }, { en: "Israel", de: "Israel", flag: "🇮🇱" },
  { en: "United Arab Emirates", de: "Vereinigte Arabische Emirate", flag: "🇦🇪" }, { en: "Qatar", de: "Katar", flag: "🇶🇦" },
  { en: "Saudi Arabia", de: "Saudi-Arabien", flag: "🇸🇦" }, { en: "Lebanon", de: "Libanon", flag: "🇱🇧" },
  { en: "Egypt", de: "Ägypten", flag: "🇪🇬" }, { en: "Morocco", de: "Marokko", flag: "🇲🇦" },
  { en: "Tunisia", de: "Tunesien", flag: "🇹🇳" }, { en: "Algeria", de: "Algerien", flag: "🇩🇿" },
  { en: "South Africa", de: "Südafrika", flag: "🇿🇦" }, { en: "Nigeria", de: "Nigeria", flag: "🇳🇬" },
  { en: "Kenya", de: "Kenia", flag: "🇰🇪" }, { en: "Georgia", de: "Georgien", flag: "🇬🇪" },
];

function localName(c: { en: string; de: string }, locale: string) {
  return locale === "de" ? c.de : c.en;
}

/** Länder-Dropdown mit Suche. Speichert den (lokalisierten) Ländernamen als String. */
export function CountrySelect({ value, onChange, placeholder, locale = "de" }: {
  value: string; onChange: (v: string) => void; placeholder: string; locale?: string;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const qq = q.trim().toLowerCase();
    const sorted = [...COUNTRIES].sort((a, b) => localName(a, locale).localeCompare(localName(b, locale)));
    if (!qq) return sorted;
    return sorted.filter((c) => c.en.toLowerCase().includes(qq) || c.de.toLowerCase().includes(qq));
  }, [q, locale]);
  const sel = COUNTRIES.find((c) => c.en === value || c.de === value);

  return (
    <>
      <button type="button" onClick={() => { setOpen(true); setQ(""); }} className="flex w-full items-center justify-between rounded-xl bg-black/[0.04] px-4 py-3 text-sm text-neutral-900">
        <span className={value ? "" : "text-neutral-400"}>{sel ? `${sel.flag} ${localName(sel, locale)}` : (value || placeholder)}</span>
        <svg viewBox="0 0 24 24" className="h-4 w-4 text-neutral-400" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
      </button>
      {open && (
        <div className="fixed inset-0 z-[60] mx-auto flex max-w-[430px] items-end bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="max-h-[72vh] w-full overflow-hidden rounded-t-[24px] bg-white" onClick={(e) => e.stopPropagation()}>
            <div className="border-b border-black/10 p-3">
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} className="w-full rounded-xl bg-black/[0.05] px-4 py-2.5 text-sm outline-none" />
            </div>
            <div className="max-h-[58vh] overflow-y-auto p-2">
              {list.map((c) => (
                <button key={c.en} type="button" onClick={() => { onChange(localName(c, locale)); setOpen(false); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm hover:bg-black/[0.04]">
                  <span className="text-lg">{c.flag}</span> {localName(c, locale)}
                </button>
              ))}
              {list.length === 0 && <p className="p-4 text-center text-sm text-neutral-400">—</p>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/** Einfache Geburtsdatum-Eingabe per Tastatur: TT.MM.JJJJ, Punkte automatisch. */
export function DobInput({ value, onChange, locale = "de" }: {
  value: string; onChange: (iso: string) => void; locale?: string;
}) {
  // ISO (yyyy-mm-dd) → Anzeige (dd.mm.yyyy)
  const initial = (() => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || "");
    return m ? `${m[3]}.${m[2]}.${m[1]}` : "";
  })();
  const [text, setText] = useState(initial);

  function handle(raw: string) {
    const digits = raw.replace(/\D/g, "").slice(0, 8);
    let out = digits;
    if (digits.length >= 5) out = `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4)}`;
    else if (digits.length >= 3) out = `${digits.slice(0, 2)}.${digits.slice(2)}`;
    setText(out);
    if (digits.length === 8) {
      const d = +digits.slice(0, 2), mo = +digits.slice(2, 4), y = +digits.slice(4);
      const dt = new Date(y, mo - 1, d);
      const valid = dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === d && y >= 1920 && y <= new Date().getFullYear();
      onChange(valid ? `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}` : "");
    } else {
      onChange("");
    }
  }

  return (
    <input
      value={text}
      onChange={(e) => handle(e.target.value)}
      inputMode="numeric"
      autoComplete="bday"
      placeholder={locale === "de" ? "TT.MM.JJJJ" : "DD.MM.YYYY"}
      className="w-full rounded-xl bg-black/[0.04] px-4 py-3.5 text-sm text-neutral-900 outline-none focus:ring-1 focus:ring-matchup"
    />
  );
}

/** Moderner Geburtsdatum-Picker: Tag / Monat / Jahr als Dropdowns. */
export function DobPicker({ value, onChange, locale = "de" }: {
  value: string; onChange: (iso: string) => void; locale?: string;
}) {
  const [y, m, d] = value ? value.split("-") : ["", "", ""];
  const now = new Date().getFullYear();
  const years = Array.from({ length: 90 }, (_, i) => now - 13 - i); // ab 13 J. abwärts
  const months = locale === "de"
    ? ["Jan", "Feb", "März", "Apr", "Mai", "Juni", "Juli", "Aug", "Sept", "Okt", "Nov", "Dez"]
    : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  function set(part: "d" | "m" | "y", val: string) {
    const nd = part === "d" ? val : d;
    const nm = part === "m" ? val : m;
    const ny = part === "y" ? val : y;
    if (nd && nm && ny) onChange(`${ny}-${String(nm).padStart(2, "0")}-${String(nd).padStart(2, "0")}`);
  }
  const cls = "flex-1 rounded-xl bg-black/[0.04] px-3 py-3.5 text-sm text-neutral-900 outline-none focus:ring-1 focus:ring-matchup";

  return (
    <div className="flex gap-2">
      <select value={d ? String(Number(d)) : ""} onChange={(e) => set("d", e.target.value)} className={cls}>
        <option value="" disabled>{locale === "de" ? "Tag" : "Day"}</option>
        {days.map((dd) => <option key={dd} value={dd}>{dd}</option>)}
      </select>
      <select value={m ? String(Number(m)) : ""} onChange={(e) => set("m", e.target.value)} className={`${cls} flex-[1.4]`}>
        <option value="" disabled>{locale === "de" ? "Monat" : "Month"}</option>
        {months.map((name, i) => <option key={i} value={i + 1}>{name}</option>)}
      </select>
      <select value={y || ""} onChange={(e) => set("y", e.target.value)} className={cls}>
        <option value="" disabled>{locale === "de" ? "Jahr" : "Year"}</option>
        {years.map((yy) => <option key={yy} value={yy}>{yy}</option>)}
      </select>
    </div>
  );
}
