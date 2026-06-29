"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n";

export default function ShopNotify() {
  const t = useT();
  const [email, setEmail] = useState("");
  const [toast, setToast] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setEmail("");
    setToast(true);
    window.setTimeout(() => setToast(false), 3000);
  }

  return (
    <div className="relative">
      <form
        onSubmit={handleSubmit}
        className="mx-auto flex max-w-md flex-col gap-3 sm:flex-row"
      >
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("shop.notifyPlaceholder")}
          className="flex-1 rounded-full border border-neutral-300 px-5 py-3.5 text-sm outline-none focus:border-matchup"
        />
        <button
          type="submit"
          className="rounded-full bg-matchup px-7 py-3.5 text-sm font-bold tracking-wide text-white transition-colors hover:bg-matchup-hover"
        >
          {t("shop.notifyButton")}
        </button>
      </form>

      {toast && (
        <div
          role="status"
          className="absolute left-1/2 mt-4 -translate-x-1/2 rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white shadow-lg"
        >
          {t("shop.notifyToast")}
        </div>
      )}
    </div>
  );
}
