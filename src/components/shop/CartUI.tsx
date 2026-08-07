"use client";

import { useT } from "@/lib/i18n";
import { useCart } from "./cart";
import { ProductVisual } from "./productVisual";

/* ──────────────────────────────────────────────────────────────────────────
   Sticky-Warenkorb-Button + Drawer. Markup 1:1 aus ShopExperience.tsx
   übernommen, liest jetzt aus dem geteilten Cart-Context. Wird im Shop-Layout
   gerendert, damit /shop UND /shop/setup/alcaraz denselben Korb bedienen.
   „Zur Kasse" bleibt der Demo-Hinweis (Alert) — kein echter Checkout.
   ────────────────────────────────────────────────────────────────────────── */

export default function CartUI() {
  const t = useT();
  const { items, count, total, hasUnpriced, open, setOpen, remove } = useCart();

  return (
    <>
      {/* Mini-Warenkorb-Trigger (sticky) */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-105"
      >
        {t("shop.cart")}
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[11px] font-bold text-black">
          {count}
        </span>
      </button>

      {/* Overlay */}
      <div
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-[60] bg-black/35 transition-opacity ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Drawer */}
      <aside
        className={`fixed bottom-0 right-0 top-0 z-[61] flex w-full max-w-[400px] flex-col bg-white transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
          <h3 className="text-lg font-bold tracking-tight">{t("shop.cartTitle", { count })}</h3>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 text-sm transition-colors hover:bg-neutral-100"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6">
          {items.length === 0 ? (
            <p className="py-16 text-center text-sm text-neutral-400">{t("shop.cartEmpty")}</p>
          ) : (
            items.map((e) => (
              <div key={e.line.id} className="flex items-center gap-4 border-b border-neutral-100 py-4">
                <div className="h-20 w-16 flex-shrink-0 overflow-hidden rounded">
                  <ProductVisual cat={e.line.cat} brand={e.line.brand} name={e.line.name} src={e.line.image} dense />
                </div>
                <div className="flex-1">
                  <div className="text-[10px] uppercase tracking-[0.06em] text-neutral-500">{e.line.brand}</div>
                  <div className="my-0.5 text-[13px] font-medium">
                    {e.line.name}
                    {e.qty > 1 && ` (${e.qty}×)`}
                  </div>
                  <div className="text-sm font-semibold">
                    {e.line.price == null ? t("shop.priceOnRequest") : `${e.line.price * e.qty} €`}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => remove(e.line.id)}
                  className="text-neutral-400 transition-colors hover:text-black"
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-neutral-200 px-6 py-5">
            <div className="mb-1 flex justify-between text-[15px]">
              <span>{t("shop.cartSum")}</span>
              <span className="font-bold">{total} €</span>
            </div>
            {hasUnpriced && (
              <p className="mb-3 text-[11px] leading-relaxed text-neutral-400">{t("shop.cartUnpricedNote")}</p>
            )}
            <button
              type="button"
              onClick={() => alert(t("shop.checkoutAlert"))}
              className="h-12 w-full rounded-full bg-black text-sm font-medium text-white transition-colors hover:bg-neutral-800"
            >
              {t("shop.checkout")}
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
