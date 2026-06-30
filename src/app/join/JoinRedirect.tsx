"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Leitet menschliche Besucher zur Startseite; Crawler lesen nur die Metadaten. */
export default function JoinRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/");
  }, [router]);
  return (
    <div className="flex min-h-dvh items-center justify-center bg-black text-white">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-matchup" />
    </div>
  );
}
