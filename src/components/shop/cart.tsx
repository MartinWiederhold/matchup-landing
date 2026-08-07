"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

/* ──────────────────────────────────────────────────────────────────────────
   Geteilter Warenkorb-Zustand (Demo).
   Früher lag der Korb als useState IN ShopExperience.tsx. Damit auch die
   Alcaraz-Setup-Seite hineinlegen kann, wandert er hierher in einen Context,
   der im Shop-Layout (src/app/(marketing)/shop/layout.tsx) montiert wird —
   so teilen sich /shop und /shop/setup/alcaraz EINEN Korb.

   BEWUSST eine Demo: nur In-Memory. Kein localStorage, keine DB. Beim harten
   Neuladen leer. Beim Wechsel zwischen den Shop-Seiten (Client-Navigation)
   bleibt er erhalten, weil das Layout — und damit der Provider — bestehen bleibt.
   ────────────────────────────────────────────────────────────────────────── */

export type Cat = "tennis" | "padel" | "pickleball" | "gear" | "apparel";

// Eine Korbzeile trägt ihre eigenen Daten — so kann jede Seite hinzufügen,
// ohne ein zentrales Produktregister. price = null → kein Festpreis (fließt
// NICHT in die Summe; im Drawer als „auf Anfrage").
export type CartLine = {
  id: string;          // quellenübergreifend eindeutig, z. B. "shop-2" | "alcaraz-racket"
  brand: string;
  name: string;
  price: number | null;
  cat: Cat;
  image?: string;      // optionaler expliziter Bildpfad (sonst Kategorie-Platzhalter)
};

type Entry = { line: CartLine; qty: number };

type CartCtx = {
  items: Entry[];
  count: number;
  total: number;            // Summe der Zeilen MIT Festpreis
  hasUnpriced: boolean;     // mind. eine Zeile ohne Festpreis
  open: boolean;
  setOpen: (v: boolean) => void;
  add: (line: CartLine) => void;
  remove: (id: string) => void;
};

const Ctx = createContext<CartCtx | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Entry[]>([]);
  const [open, setOpen] = useState(false);

  // Hinzufügen: gleiche id → Menge +1 (wie bisher). Öffnet den Drawer.
  const add = useCallback((line: CartLine) => {
    setItems((prev) => {
      const ex = prev.find((e) => e.line.id === line.id);
      return ex
        ? prev.map((e) => (e.line.id === line.id ? { ...e, qty: e.qty + 1 } : e))
        : [...prev, { line, qty: 1 }];
    });
    setOpen(true);
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((e) => e.line.id !== id));
  }, []);

  const value = useMemo<CartCtx>(() => {
    const count = items.reduce((s, e) => s + e.qty, 0);
    const total = items.reduce((s, e) => s + (e.line.price ?? 0) * e.qty, 0);
    const hasUnpriced = items.some((e) => e.line.price == null);
    return { items, count, total, hasUnpriced, open, setOpen, add, remove };
  }, [items, open, add, remove]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart(): CartCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
