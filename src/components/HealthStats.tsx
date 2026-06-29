const STATS = [
  { value: "3", unit: "", label: "Sportarten — Tennis, Padel & Pickleball" },
  { value: "10.000", unit: "+", label: "Clubs weltweit auf der Karte" },
  { value: "50", unit: "+", label: "Länder weltweit vernetzt" },
];

export default function HealthStats() {
  return (
    <section id="warum" className="bg-black px-4 py-24 text-white sm:px-6 lg:px-12">
      <div className="mx-auto max-w-5xl text-center">
        <h2 className="text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
          Eine wachsende Community von Spielern
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-white/70 sm:text-lg">
          Ob Anfänger oder Wettkampfspieler — auf Matchup findest du Partner auf
          deinem Level, in deiner Sportart und in deiner Nähe.
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
