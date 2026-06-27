const STATS = [
  { value: "91", unit: "Min.", label: "mehr Aktivität pro Woche" },
  { value: "2,3", unit: "Std.", label: "mehr Schlaf pro Woche" },
  { value: "10%", unit: "+", label: "höhere Herzratenvariabilität" },
];

export default function HealthStats() {
  return (
    <section id="warum" className="bg-black px-4 py-24 text-white sm:px-6 lg:px-12">
      <div className="mx-auto max-w-5xl text-center">
        <h2 className="text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
          Trage MATCHUP täglich, verbessere deine Gesundheit
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-white/70 sm:text-lg">
          Tägliches Tragen von MATCHUP steht in Verbindung mit mehr Bewegung,
          besserem Schlaf und einer höheren HRV. Mitglieder erzielen schnellere
          Fortschritte, stärkere Gewohnheiten und bessere Ergebnisse bei all
          ihren Zielen.*
        </p>

        <div className="mt-16 grid gap-10 sm:grid-cols-3">
          {STATS.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center">
              <div className="flex items-baseline text-matchup">
                <span className="text-6xl font-bold tracking-tight sm:text-7xl">
                  {stat.value}
                </span>
                <span className="ml-1 text-2xl font-semibold">{stat.unit}</span>
              </div>
              <p className="mt-3 max-w-[12rem] text-sm text-white/70">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
