import { CartProvider } from "@/components/shop/cart";
import CartUI from "@/components/shop/CartUI";

// Umschließt /shop UND /shop/setup/alcaraz mit EINEM geteilten Warenkorb-Context.
// Der Sticky-Button + Drawer (CartUI) liegen hier, damit beide Seiten denselben
// Korb bedienen und sehen. Reine Demo (In-Memory) — siehe cart.tsx.
export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      {children}
      <CartUI />
    </CartProvider>
  );
}
