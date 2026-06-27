export default function MatchupLogo({
  className = "text-2xl",
}: {
  className?: string;
}) {
  return (
    <span
      className={`matchup-wordmark inline-flex items-center leading-none ${className}`}
      aria-label="MATCHUP"
    >
      MATCHUP
    </span>
  );
}
