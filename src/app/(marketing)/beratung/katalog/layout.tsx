import { AuthProvider } from "@/lib/auth";

// Der Katalog ist login-pflichtig (web.rackets nur für authenticated lesbar) und
// nutzt useAuth(). Der (marketing)-Baum stellt KEINEN AuthProvider bereit —
// deshalb hier einer, nur für diese Route (wie /app und /tour). Der bestehende
// Finder unter /beratung braucht ihn nicht und bleibt unberührt.
export default function KatalogLayout({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
