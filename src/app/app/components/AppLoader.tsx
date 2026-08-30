"use client";

/**
 * App-weiter Ladezustand: weißer Hintergrund + springender Tennisball.
 * Ersetzt schwarze „Lädt…"-Screens. Respektiert prefers-reduced-motion.
 * `className` überschreibt die Standardhöhe (Default füllt den Bereich).
 */
export default function AppLoader({ label, className }: { label?: string; className?: string }) {
  return (
    <div className={`flex w-full flex-col items-center justify-center gap-5 bg-white ${className ?? "h-full min-h-[60dvh]"}`}>
      <div className="mu-loader" aria-hidden>
        <svg className="mu-loader-ball" width="46" height="46" viewBox="0 0 46 46" fill="none">
          <circle cx="23" cy="23" r="21" fill="#c9f24a" stroke="#a9d92f" strokeWidth="2" />
          <path d="M5 11 A26 26 0 0 1 5 35" fill="none" stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round" />
          <path d="M41 11 A26 26 0 0 0 41 35" fill="none" stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round" />
        </svg>
        <span className="mu-loader-shadow" />
      </div>
      {label && <p className="text-sm font-medium text-neutral-400">{label}</p>}
      <style>{`
        .mu-loader { position: relative; width: 46px; height: 66px; }
        .mu-loader-ball { position: absolute; left: 0; top: 0; animation: mu-bounce .58s cubic-bezier(.5,.03,.5,.97) infinite alternate; }
        .mu-loader-shadow { position: absolute; left: 8px; bottom: 0; width: 30px; height: 7px; border-radius: 50%; background: rgba(0,0,0,.14); animation: mu-shadow .58s cubic-bezier(.5,.03,.5,.97) infinite alternate; }
        @keyframes mu-bounce { from { transform: translateY(0) scaleY(1); } to { transform: translateY(18px) scaleY(.92); } }
        @keyframes mu-shadow { from { transform: scale(.72); opacity: .45; } to { transform: scale(1); opacity: .9; } }
        @media (prefers-reduced-motion: reduce) { .mu-loader-ball, .mu-loader-shadow { animation: none; } }
      `}</style>
    </div>
  );
}
