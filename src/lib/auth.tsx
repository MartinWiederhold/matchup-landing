"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import type { Profile } from "./types";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initiale Session
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) loadProfile(session.user.id);
        else setLoading(false);
      })
      .catch(() => setLoading(false));

    // Auth-State-Listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // TOKEN_REFRESHED feuert u. a. beim Tab-Fokus / Tastatur-Öffnen. Dabei nur
      // die Session aktualisieren — NICHT user/profile neu setzen. Sonst rendert
      // AppGuard kurz einen anderen Branch und mountet z. B. das Onboarding neu
      // (Fortschritt springt auf Schritt 1 zurück).
      if (event === "TOKEN_REFRESHED") {
        setSession(session);
        return;
      }
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) loadProfile(session.user.id);
      else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function loadProfile(userId: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error || !data) {
      setProfile(null);
      setLoading(false);
      return;
    }
    // Eigene Koordinaten liegen jetzt in web.profiles_private (nicht mehr fremd
    // lesbar). Hier in das profile-Objekt mergen, damit alle EIGEN-Koordinaten-
    // Stellen (EditProfile-Vorschau, CreateGame/ClubPicker, Kartenzentrierung)
    // unverändert `profile.latitude/longitude` nutzen können.
    const { data: priv } = await supabase
      .from("profiles_private")
      .select("latitude, longitude")
      .eq("user_id", userId)
      .maybeSingle();

    setProfile({
      ...(data as Profile),
      latitude: priv?.latitude ?? null,
      longitude: priv?.longitude ?? null,
    });
    setLoading(false);
  }

  async function refreshProfile() {
    if (user) await loadProfile(user.id);
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error?.message ?? null };
  }

  async function signUp(email: string, password: string) {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error?.message ?? null };
  }

  async function signOut() {
    // FCM-Token löschen — liegt jetzt in web.profiles_private (Sicherheitsaudit 2026-08).
    // update statt upsert: die Zeile existiert für Bestandsnutzer; fehlt sie (neuer
    // Web-Nutzer ohne Push-Token), ist das Nullen ohnehin ein No-op.
    if (profile) {
      await supabase
        .from("profiles_private")
        .update({ fcm_token: null })
        .eq("user_id", profile.id);
    }
    await supabase.auth.signOut();
    setProfile(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        signIn,
        signUp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

/** Supabase-Fehlermeldungen ins Deutsche übersetzen. */
export function translateError(msg: string): string {
  if (msg.includes("Invalid login")) return "Email oder Passwort falsch.";
  if (msg.includes("already registered"))
    return "Diese Email ist bereits registriert.";
  if (msg.includes("Password should be"))
    return "Passwort muss mindestens 8 Zeichen lang sein.";
  if (msg.includes("rate limit"))
    return "Zu viele Versuche. Bitte warte einen Moment.";
  return "Ein Fehler ist aufgetreten. Bitte versuche es erneut.";
}
