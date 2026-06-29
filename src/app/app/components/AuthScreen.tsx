"use client";

import { useState } from "react";
import { useAuth, translateError } from "@/lib/auth";
import { useT } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import {
  TennisIcon,
  PadelIcon,
  PickleballIcon,
  EyeIcon,
  EyeOffIcon,
  AppleIcon,
  GoogleIcon,
} from "./shared/icons";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const t = useT();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  function validate(): string | null {
    if (mode === "login") {
      if (!email.trim() || !password) return t("auth.errMissingCredentials");
      return null;
    }
    if (!EMAIL_RE.test(email)) return t("auth.errInvalidEmail");
    if (password.length < 8)
      return t("auth.errPasswordTooShort");
    if (password !== confirmPassword) return t("auth.errPasswordsMismatch");
    if (!agreedToTerms)
      return t("auth.errTermsRequired");
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setIsLoading(true);
    const { error } =
      mode === "login"
        ? await signIn(email, password)
        : await signUp(email, password);
    setIsLoading(false);
    if (error) setError(translateError(error));
  }

  async function handleOAuth(provider: "apple" | "google") {
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/app` },
    });
    if (error) setError(translateError(error.message));
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-black px-6 py-12 text-white">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <span className="matchup-wordmark text-3xl font-bold tracking-[0.2em]">
            MATCHUP
          </span>
          <div className="mt-3 flex justify-center gap-3 text-white/80" aria-hidden="true">
            <TennisIcon size={26} />
            <PadelIcon size={26} />
            <PickleballIcon size={26} />
          </div>
        </div>

        {/* Tab-Toggle */}
        <div className="mb-6 flex rounded-full bg-zinc-800 p-1">
          {(["login", "register"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m);
                setError(null);
              }}
              className={`flex-1 rounded-full py-2.5 text-sm font-semibold transition-colors ${
                mode === m ? "bg-matchup text-white" : "text-zinc-400"
              }`}
            >
              {m === "login" ? t("auth.login") : t("auth.register")}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder={t("auth.emailPlaceholder")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl bg-zinc-800 px-4 py-3.5 text-sm outline-none ring-1 ring-transparent focus:ring-matchup"
          />

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              placeholder={t("auth.passwordPlaceholder")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl bg-zinc-800 px-4 py-3.5 pr-12 text-sm outline-none ring-1 ring-transparent focus:ring-matchup"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400"
              aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
            >
              {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
            </button>
          </div>

          {mode === "register" && (
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder={t("auth.confirmPasswordPlaceholder")}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-xl bg-zinc-800 px-4 py-3.5 text-sm outline-none ring-1 ring-transparent focus:ring-matchup"
            />
          )}

          {mode === "register" && (
            <label className="flex items-start gap-2.5 py-1 text-xs text-zinc-400">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-matchup"
              />
              <span>
                {t("auth.termsPrefix")}{" "}
                <a href="/agb" className="underline">
                  {t("auth.terms")}
                </a>{" "}
                {t("auth.termsAnd")}{" "}
                <a href="/datenschutz" className="underline">
                  {t("auth.privacy")}
                </a>
                .
              </span>
            </label>
          )}

          {error && (
            <div className="rounded-xl bg-red-500/15 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-full bg-matchup py-3.5 text-sm font-bold tracking-wide text-white transition-colors hover:bg-matchup-hover disabled:opacity-60"
          >
            {isLoading
              ? t("auth.pleaseWait")
              : mode === "login"
                ? t("auth.loginUpper")
                : t("auth.registerUpper")}
          </button>
        </form>

        {mode === "login" && (
          <button
            type="button"
            className="mx-auto mt-4 block text-sm text-zinc-400 underline underline-offset-2"
            onClick={async () => {
              if (!EMAIL_RE.test(email)) {
                setError(t("auth.errEmailFirst"));
                return;
              }
              await supabase.auth.resetPasswordForEmail(email);
              setError(t("auth.resetSent"));
            }}
          >
            {t("auth.forgotPassword")}
          </button>
        )}

        {/* Divider */}
        <div className="my-6 flex items-center gap-3 text-xs text-zinc-500">
          <div className="h-px flex-1 bg-zinc-800" />
          {t("auth.or")}
          <div className="h-px flex-1 bg-zinc-800" />
        </div>

        {/* Social */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => handleOAuth("apple")}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-white py-3.5 text-sm font-semibold text-black"
          >
            <AppleIcon size={18} /> {t("auth.signInApple")}
          </button>
          <button
            type="button"
            onClick={() => handleOAuth("google")}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-zinc-800 py-3.5 text-sm font-semibold text-white"
          >
            <GoogleIcon size={18} /> {t("auth.signInGoogle")}
          </button>
        </div>
      </div>
    </div>
  );
}
