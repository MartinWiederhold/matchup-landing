"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n";
import TourMatchesTab from "./TourMatchesTab";
import TourChatTab from "./TourChatTab";

/**
 * Compete-Tab 2 („Inbox") — legt die frueheren Slots Matches und Team-Chat in
 * EINEM Tab zusammen. Oben ein Segment-Switcher im Play-Stil, darunter der
 * jeweilige Bereich (bestehende Komponenten unveraendert wiederverwendet).
 */
export default function CompeteInbox() {
  const t = useT();
  const [sub, setSub] = useState<"results" | "team">("results");

  return (
    <div>
      <div className="px-4 pt-[max(8px,env(safe-area-inset-top))]">
        <div className="flex gap-1.5 rounded-full bg-black/[0.05] p-1">
          {(["results", "team"] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setSub(k)}
              className={`flex-1 rounded-full py-2 text-[13px] font-bold transition-colors ${
                sub === k ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500"
              }`}
            >
              {t(k === "results" ? "mode.inboxResults" : "mode.inboxTeam")}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-1">
        {sub === "results" ? <TourMatchesTab /> : <TourChatTab />}
      </div>
    </div>
  );
}
