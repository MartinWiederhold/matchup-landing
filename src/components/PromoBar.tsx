export default function PromoBar() {
  return (
    <div className="w-full bg-matchup text-white">
      <div className="mx-auto flex h-11 max-w-[1600px] items-center justify-center gap-2.5 whitespace-nowrap px-4 text-[13px] font-medium sm:gap-3 sm:text-base">
        <span className="truncate">
          <span className="sm:hidden">Finde deinen Spielpartner</span>
          <span className="hidden sm:inline">
            Finde deinen Spielpartner für Tennis, Padel &amp; Pickleball
          </span>
        </span>
        <a
          href="/app"
          className="shrink-0 font-semibold underline underline-offset-2 hover:opacity-80"
        >
          Jetzt starten
        </a>
      </div>
    </div>
  );
}
