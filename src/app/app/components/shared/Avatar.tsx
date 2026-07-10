"use client";

const SIZES = {
  sm: "h-8 w-8",
  md: "h-12 w-12",
  lg: "h-16 w-16",
  xl: "h-28 w-28",
} as const;

export default function Avatar({
  src,
  alt = "",
  size = "md",
  online,
}: {
  src: string | null | undefined;
  alt?: string;
  size?: keyof typeof SIZES;
  online?: boolean;
}) {
  return (
    <span className={`relative inline-block shrink-0 ${SIZES[size]}`}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          className="h-full w-full rounded-full object-cover"
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center rounded-full bg-neutral-200 text-neutral-500">
          {alt ? alt[0]?.toUpperCase() : "?"}
        </span>
      )}
      {online && (
        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-black bg-green-500" />
      )}
    </span>
  );
}
