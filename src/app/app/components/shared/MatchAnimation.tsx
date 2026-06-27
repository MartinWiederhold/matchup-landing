"use client";

import type { Profile } from "@/lib/types";
import Avatar from "./Avatar";

export default function MatchAnimation({
  me,
  other,
  onMessage,
  onContinue,
}: {
  me: Profile;
  other: Profile;
  onMessage: () => void;
  onContinue: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/95 px-8 text-center">
      <div className="mb-8 flex items-center gap-4">
        <span className="animate-[slideInLeft_0.5s_ease]">
          <Avatar src={me.profile_image} alt={me.first_name} size="xl" />
        </span>
        <span className="animate-[slideInRight_0.5s_ease]">
          <Avatar src={other.profile_image} alt={other.first_name} size="xl" />
        </span>
      </div>
      <h2 className="text-3xl font-bold text-matchup">IT&apos;S A MATCH!</h2>
      <p className="mt-3 max-w-xs text-sm text-zinc-300">
        Du und {other.first_name} habt euch gegenseitig geliked!
      </p>
      <div className="mt-8 w-full max-w-xs space-y-3">
        <button
          type="button"
          onClick={onMessage}
          className="w-full rounded-full bg-matchup py-3.5 text-sm font-bold text-white hover:bg-matchup-hover"
        >
          Nachricht senden
        </button>
        <button
          type="button"
          onClick={onContinue}
          className="w-full rounded-full border border-zinc-700 py-3.5 text-sm font-semibold text-white"
        >
          Weiter entdecken
        </button>
      </div>
    </div>
  );
}
