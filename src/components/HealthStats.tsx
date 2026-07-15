import { getT } from "@/lib/i18n/server";

export default async function HealthStats() {
  const t = await getT();
  const stats = [
    { value: "3", unit: "", label: t("landing.statSports") },
    { value: "10.000", unit: "+", label: t("landing.statClubs") },
    { value: "50", unit: "+", label: t("landing.statCountries") },
  ];

  return (
    <section id="warum" className="bg-black px-4 py-24 text-white sm:px-6 lg:px-12">
      <div className="mx-auto max-w-5xl text-center">
        <h2 className="text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
          {t("landing.statsTitleA")}
          {/* Mobil: fester Umbruch → „… Community" / „of players". Desktop: eine Zeile. */}
          <br className="sm:hidden" />
          <span className="hidden sm:inline"> </span>
          {t("landing.statsTitleB")}
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-white/70 sm:text-lg">
          {t("landing.statsSubtitle")}
        </p>

        <div className="mt-16 grid gap-10 sm:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center">
              <div className="flex items-baseline text-matchup">
                <span className="text-6xl font-bold tracking-tight sm:text-7xl">
                  {stat.value}
                </span>
                <span className="ml-1 text-2xl font-semibold">{stat.unit}</span>
              </div>
              <p className="mt-3 whitespace-nowrap text-sm text-white/70">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
