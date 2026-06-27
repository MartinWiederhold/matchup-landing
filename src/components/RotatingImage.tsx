"use client";

import { useSyncExternalStore } from "react";
import Image from "next/image";

/**
 * Gemeinsamer Takt für ALLE RotatingImages → alle Kacheln wechseln synchron
 * und gemächlich (ein einziger Timer statt mehrerer unabhängiger).
 */
const INTERVAL_MS = 6000;
let tick = 0;
const listeners = new Set<() => void>();
let started = false;

function ensureTicker() {
  if (started || typeof window === "undefined") return;
  started = true;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  window.setInterval(() => {
    tick += 1;
    listeners.forEach((l) => l());
  }, INTERVAL_MS);
}

function subscribe(cb: () => void) {
  ensureTicker();
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}
const getSnapshot = () => tick;
const getServerSnapshot = () => 0;

/** Ein Bild: entweder nur die URL oder URL + object-position (z.B. "top"). */
export type RotatingImg = string | { src: string; position?: string };

/**
 * Zeigt mehrere Bilder mit sanftem Crossfade (object-cover, fill).
 * Der Eltern-Container muss `relative` sein.
 */
export default function RotatingImage({
  images,
  alt,
  sizes,
}: {
  images: RotatingImg[];
  alt: string;
  sizes?: string;
}) {
  const t = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const index = images.length ? t % images.length : 0;

  return (
    <>
      {images.map((img, i) => {
        const src = typeof img === "string" ? img : img.src;
        const position = typeof img === "string" ? undefined : img.position;
        return (
          <Image
            key={src}
            src={src}
            alt={alt}
            fill
            sizes={sizes}
            priority={i === 0}
            style={position ? { objectPosition: position } : undefined}
            className={`object-cover transition-opacity duration-[1200ms] ease-in-out ${
              i === index ? "opacity-100" : "opacity-0"
            }`}
          />
        );
      })}
    </>
  );
}
