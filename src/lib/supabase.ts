import { createClient } from "@supabase/supabase-js";

// Fallbacks halten den Build am Leben, falls .env.local fehlt. Mit einem
// Platzhalter-Anon-Key schlagen nur Laufzeit-Requests fehl (in der UI behandelt),
// nicht der Build.
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "https://dqeroewcdclgxujhubht.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "anon-key-placeholder";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  // Die Web-App arbeitet vollständig im isolierten Schema "web" — die echte
  // App (Schema "public") bleibt dadurch komplett unberührt.
  db: { schema: "web" },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

/** true, wenn ein echter Anon-Key konfiguriert ist (nicht der Platzhalter). */
export const isSupabaseConfigured =
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== "anon-key-placeholder";
