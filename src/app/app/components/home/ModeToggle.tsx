"use client";

import { useT } from "@/lib/i18n";

/** Schwarz-weißer Play/Tour-Umschalter (Segmented Pill) für den Home-Header. */
export default function ModeToggle({
  mode,
  onChange,
}: {
  mode: "play" | "tour";
  onChange: (m: "play" | "tour") => void;
}) {
  const t = useT();
  return (
    <div className="flex items-center rounded-full bg-black/[0.06] p-0.5">
      {(["play", "tour"] as const).map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => onChange(m)}
          className={`rounded-full px-3.5 py-1.5 text-[13px] font-bold transition-colors ${
            mode === m ? "bg-black text-white" : "text-neutral-500"
          }`}
        >
          {m === "play" ? t("mode.play") : t("mode.tour")}
        </button>
      ))}
    </div>
  );
}
