import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { getServiceClient } from "@/lib/adminClient";
import { getT } from "@/lib/i18n/server";
import { formatEventDate, sportLabel } from "@/lib/utils/formatters";
import EventDetailJoin from "@/components/events/EventDetailJoin";
import type { EventItem } from "@/lib/types";

/** Lädt ein aktives Event by id (per React-cache dedupliziert für Metadata + Page). */
const loadEvent = cache(async (id: string): Promise<EventItem | null> => {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const svc = getServiceClient();
  const { data } = await svc
    .from("events")
    .select("*")
    .eq("id", id)
    .eq("status", "active")
    .maybeSingle();
  return (data as EventItem) ?? null;
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const event = await loadEvent(id);
  const t = await getT();
  if (!event) return { title: t("seo.eventsTitle") };
  const desc = event.short_description || event.description || t("seo.eventsDescription");
  return {
    title: event.title,
    description: desc,
    alternates: { canonical: `/events/${event.id}` },
    openGraph: {
      url: `/events/${event.id}`,
      title: event.title,
      description: desc,
      images: [event.image_url || "/og-v6.jpg"],
    },
  };
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await loadEvent(id);
  if (!event) notFound();
  const t = await getT();

  return (
    <main className="mx-auto max-w-[820px] px-4 py-10 sm:px-6 sm:py-16">
      <Link
        href="/events"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-500 transition-colors hover:text-black"
      >
        ← {t("events.backToAll")}
      </Link>

      <div className="relative mt-6 aspect-[16/9] overflow-hidden rounded-3xl bg-neutral-100">
        {event.image_url && (
          <Image
            src={event.image_url}
            alt={event.title}
            fill
            priority
            sizes="(max-width: 820px) 100vw, 820px"
            className="object-cover"
          />
        )}
        <span className="absolute left-4 top-4 inline-flex rounded-full bg-black/70 px-3 py-1.5 text-xs font-bold text-white backdrop-blur">
          {sportLabel(event.sport)}
        </span>
      </div>

      <h1 className="mt-7 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
        {event.title}
      </h1>
      {event.creator_name && (
        <p className="mt-2 text-sm text-neutral-500">
          {t("events.by", { name: event.creator_name })}
        </p>
      )}

      <ul className="mt-6 space-y-2 text-sm text-neutral-700">
        {event.event_date && (
          <li className="flex items-center gap-2">
            <span aria-hidden>📅</span> {formatEventDate(event.event_date)}
          </li>
        )}
        <li className="flex items-center gap-2">
          <span aria-hidden>📍</span> {event.location}
        </li>
      </ul>

      {event.description && (
        <p className="mt-6 whitespace-pre-line text-[15px] leading-relaxed text-neutral-600">
          {event.description}
        </p>
      )}

      <EventDetailJoin
        eventId={event.id}
        maxParticipants={event.max_participants}
        initialCount={event.participants_count ?? 0}
      />
    </main>
  );
}
