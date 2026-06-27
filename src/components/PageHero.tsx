export default function PageHero({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <section className="border-b border-neutral-200 bg-neutral-50 px-4 py-20 sm:px-6 lg:px-12 lg:py-28">
      <div className="mx-auto max-w-[1280px]">
        <h1 className="max-w-4xl text-4xl font-bold leading-[1.02] tracking-tight sm:text-6xl">
          {title}
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-neutral-600 sm:text-lg">
          {subtitle}
        </p>
      </div>
    </section>
  );
}
