"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LOCALE_COOKIE, type Locale } from "./config";
import { translate, type TFunction } from "./core";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: TFunction;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: React.ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const router = useRouter();

  const setLocale = useCallback(
    (next: Locale) => {
      document.cookie = `${LOCALE_COOKIE}=${next};path=/;max-age=31536000;samesite=lax`;
      document.documentElement.lang = next;
      setLocaleState(next);
      // Server-gerenderte Inhalte (getT) mit neuem Cookie neu laden.
      router.refresh();
    },
    [router],
  );

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale,
      t: (key, vars) => translate(locale, key, vars),
    }),
    [locale, setLocale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

function useLocaleContext(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    // Fallback ausserhalb des Providers (z. B. isolierte Tests) — nutzt Default.
    return {
      locale: "en",
      setLocale: () => {},
      t: (key) => key,
    };
  }
  return ctx;
}

export function useLocale() {
  const { locale, setLocale } = useLocaleContext();
  return { locale, setLocale };
}

export function useT(): TFunction {
  return useLocaleContext().t;
}
