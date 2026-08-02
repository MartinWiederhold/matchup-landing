import { AuthProvider } from "@/lib/auth";

// /tour nutzt exakt dasselbe Login wie /app: der AuthProvider stellt die
// client-seitige Supabase-Session bereit (useAuth). Kein eigenes Auth-System.
export default function TourLayout({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
