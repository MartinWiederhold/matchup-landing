import PageHero from "@/components/PageHero";

export type LegalSection = { heading: string; body: string[] };

export default function LegalPage({
  title,
  subtitle,
  updated,
  sections,
}: {
  title: string;
  subtitle: string;
  updated: string;
  sections: LegalSection[];
}) {
  return (
    <>
      <PageHero title={title} subtitle={subtitle} />
      <section className="bg-white px-4 py-16 sm:px-6 lg:px-12">
        <div className="mx-auto max-w-[760px]">
          <p className="text-xs text-neutral-400">{updated}</p>
          <div className="mt-8 space-y-10">
            {sections.map((s) => (
              <div key={s.heading}>
                <h2 className="text-xl font-bold tracking-tight">{s.heading}</h2>
                {s.body.map((p, i) => (
                  <p
                    key={i}
                    className="mt-3 text-sm leading-relaxed text-neutral-700 whitespace-pre-line"
                  >
                    {p}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
