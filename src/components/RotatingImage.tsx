"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

/**
 * Zeigt mehrere Bilder abwechselnd mit sanftem Crossfade (object-cover, fill).
 * Der Eltern-Container muss `relative` sein.
 */
export default function RotatingImage({
  images,
  alt,
  intervalMs = 3500,
  sizes,
}: {
  images: string[];
  alt: string;
  intervalMs?: number;
  sizes?: string;
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (images.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(
      () => setIndex((i) => (i + 1) % images.length),
      intervalMs,
    );
    return () => window.clearInterval(id);
  }, [images.length, intervalMs]);

  return (
    <>
      {images.map((src, i) => (
        <Image
          key={src}
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={i === 0}
          className={`object-cover transition-opacity duration-1000 ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
    </>
  );
}
