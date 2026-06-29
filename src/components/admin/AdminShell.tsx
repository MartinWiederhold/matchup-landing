"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { Spinner } from "@/components/admin/shared";
import {
  DashboardIcon,
  FlagIcon,
  MessageIcon,
  UsersIcon,
  BanIcon,
  LogoutIcon,
  CalendarIcon,
} from "@/components/admin/icons";

const FALLBACK_ADMIN = "wiederhold.martin@web.de";

function allowedAdmins(): string[] {
  const env = process.env.NEXT_PUBLIC_ADMIN_EMAILS || "";
  const list = env
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (!list.includes(FALLBACK_ADMIN)) list.push(FALLBACK_ADMIN);
  return list;
}

type NavItem = {
  href: string;
  label: string;
  Icon: (props: { size?: number; className?: string }) => React.ReactElement;
};

const navItems: NavItem[] = [
  { href: "/admin", label: "Dashboard", Icon: DashboardIcon },
  { href: "/admin/events", label: "Events", Icon: CalendarIcon },
  { href: "/admin/waitlist", label: "Waitlist", Icon: UsersIcon },
  { href: "/admin/reports", label: "Reports", Icon: FlagIcon },
  { href: "/admin/support", label: "Support", Icon: MessageIcon },
  { href: "/admin/users", label: "Alle User", Icon: UsersIcon },
  { href: "/admin/banned", label: "Gesperrte", Icon: BanIcon },
];

export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  if (loading) return <Spinner />;

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-6">
        <div className="text-center max-w-sm">
          <p className="text-lg font-bold tracking-tight mb-2">
            Supabase nicht konfiguriert
          </p>
          <p className="text-sm text-neutral-500">
            Setze NEXT_PUBLIC_SUPABASE_URL und NEXT_PUBLIC_SUPABASE_ANON_KEY,
            um das Admin-Dashboard zu nutzen.
          </p>
        </div>
      </div>
    );
  }

  if (!session) return <LoginForm />;

  const email = (session.user.email || "").toLowerCase();
  if (!allowedAdmins().includes(email)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-6">
        <div className="text-center">
          <p className="text-lg font-bold tracking-tight mb-2">
            Zugang verweigert
          </p>
          <p className="text-neutral-500 mb-4">
            Dein Account hat keine Admin-Rechte.
          </p>
          <button
            onClick={() => supabase.auth.signOut()}
            className="px-4 py-2 bg-black text-white rounded-xl text-sm font-semibold"
          >
            Abmelden
          </button>
        </div>
      </div>
    );
  }

  return <Shell>{children}</Shell>;
}

function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [pendingCount, setPendingCount] = useState(0);
  const [openTickets, setOpenTickets] = useState(0);

  useEffect(() => {
    let active = true;
    async function loadCounts() {
      try {
        const [reports, tickets] = await Promise.all([
          supabase
            .from("reports")
            .select("*", { count: "exact", head: true })
            .eq("status", "pending"),
          supabase
            .from("support_tickets")
            .select("*", { count: "exact", head: true })
            .eq("status", "open"),
        ]);
        if (!active) return;
        setPendingCount(reports.count || 0);
        setOpenTickets(tickets.count || 0);
      } catch (e) {
        console.error("loadCounts failed:", e);
      }
    }
    loadCounts();
    return () => {
      active = false;
    };
  }, [pathname]);

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname === href || pathname.startsWith(href + "/");
  }

  function badgeFor(href: string) {
    if (href === "/admin/reports" && pendingCount > 0) return pendingCount;
    if (href === "/admin/support" && openTickets > 0) return openTickets;
    return null;
  }

  return (
    <div className="flex min-h-screen bg-white text-black">
      <aside className="w-56 bg-neutral-50 border-r border-neutral-200 flex flex-col shrink-0">
        <div className="p-5 border-b border-neutral-200">
          <h1 className="text-base font-bold tracking-tight">Matchup Admin</h1>
          <p className="text-xs text-neutral-400 mt-0.5">Content Moderation</p>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map(({ href, label, Icon }) => {
            const active = isActive(href);
            const badge = badgeFor(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors ${
                  active
                    ? "bg-black text-white font-semibold"
                    : "text-neutral-600 hover:bg-neutral-100"
                }`}
              >
                <Icon size={18} />
                <span>{label}</span>
                {badge && (
                  <span className="ml-auto bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-neutral-200">
          <button
            onClick={() => supabase.auth.signOut()}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-neutral-500 hover:text-red-600 rounded-xl hover:bg-neutral-100 transition-colors"
          >
            <LogoutIcon size={18} />
            <span>Abmelden</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) setError(error.message);
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white text-black">
      <div className="w-full max-w-sm px-6">
        <h1 className="text-2xl font-bold tracking-tight mb-1">Matchup Admin</h1>
        <p className="text-sm text-neutral-400 mb-8">
          Content Moderation Dashboard
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-black"
              placeholder="admin@matchup.ch"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5">
              Passwort
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-black"
              required
            />
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-matchup hover:bg-matchup-hover text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors"
          >
            {loading ? "Wird angemeldet..." : "Anmelden"}
          </button>
        </form>
      </div>
    </div>
  );
}
