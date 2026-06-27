import type { ReactNode } from "react";

type IconProps = {
  size?: number;
  className?: string;
  strokeWidth?: number;
};

function Svg({
  size = 24,
  className = "",
  strokeWidth = 1.7,
  children,
}: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

/* ============================================================
   Sport-Icons — eigene, professionelle Strichzeichnungen
   ============================================================ */

export function TennisIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M5.5 5.4C8 8 8 16 5.5 18.6" />
      <path d="M18.5 5.4C16 8 16 16 18.5 18.6" />
    </Svg>
  );
}

export function PadelIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 2.6a6.4 6.4 0 0 0-2 12.48V19a2 2 0 1 0 4 0v-3.92A6.4 6.4 0 0 0 12 2.6Z" />
      <path d="M12 21v-2" />
      <circle cx="9.6" cy="7.4" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="12" cy="6.5" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="14.4" cy="7.4" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="9.6" cy="10.4" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="12" cy="9.6" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="14.4" cy="10.4" r="0.6" fill="currentColor" stroke="none" />
    </Svg>
  );
}

export function PickleballIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="6.4" y="2.5" width="11.2" height="13" rx="5.6" />
      <path d="M12 15.5V21" />
      <path d="M10.4 18.4h3.2" />
    </Svg>
  );
}

export function SportIcon({ sport, ...props }: IconProps & { sport: string }) {
  if (sport === "padel") return <PadelIcon {...props} />;
  if (sport === "pickleball") return <PickleballIcon {...props} />;
  return <TennisIcon {...props} />;
}

/* ============================================================
   UI-Icons
   ============================================================ */

export function ArrowLeftIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M19 12H5" />
      <path d="M12 19l-7-7 7-7" />
    </Svg>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M9 18l6-6-6-6" />
    </Svg>
  );
}

export function XIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M18 6 6 18" />
      <path d="M6 6l12 12" />
    </Svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M20 6 9 17l-5-5" />
    </Svg>
  );
}

export function CheckCheckIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M18 6 7 17l-3-3" />
      <path d="M22 8l-6 6" />
    </Svg>
  );
}

export function HeartIcon({ filled, ...props }: IconProps & { filled?: boolean }) {
  return (
    <Svg {...props}>
      <path
        d="M12 20s-7-4.5-9.3-9A4.7 4.7 0 0 1 12 6.3 4.7 4.7 0 0 1 21.3 11C19 15.5 12 20 12 20Z"
        fill={filled ? "currentColor" : "none"}
      />
    </Svg>
  );
}

export function MapPinIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M20 10c0 5.4-8 12-8 12s-8-6.6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="2.6" />
    </Svg>
  );
}

export function FilterIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 6h16" />
      <path d="M7 12h10" />
      <path d="M10 18h4" />
    </Svg>
  );
}

export function GridIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </Svg>
  );
}

export function CardsIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="4.5" y="3.5" width="15" height="17" rx="2.5" />
    </Svg>
  );
}

export function SendIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M22 2 11 13" />
      <path d="M22 2 15 22l-4-9-9-4 20-7Z" />
    </Svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </Svg>
  );
}

export function EyeIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </Svg>
  );
}

export function EyeOffIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M10.7 6.7A9.7 9.7 0 0 1 12 6.5c6 0 9.5 6.5 9.5 6.5a16 16 0 0 1-3 3.6" />
      <path d="M6.3 7.8A16 16 0 0 0 2.5 13s3.5 6.5 9.5 6.5a9.3 9.3 0 0 0 4.3-1.1" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
      <path d="M3 3l18 18" />
    </Svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </Svg>
  );
}

export function FlagIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M5 21V4" />
      <path d="M5 4h11l-1.5 3.5L16 11H5" />
    </Svg>
  );
}

export function BanIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M5.6 5.6l12.8 12.8" />
    </Svg>
  );
}

export function StatsIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M5 21V10" />
      <path d="M12 21V4" />
      <path d="M19 21v-8" />
    </Svg>
  );
}

export function MedalIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="14.5" r="5" />
      <path d="M8.5 9 6 3h12l-2.5 6" />
    </Svg>
  );
}

export function RulerIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3" y="8" width="18" height="8" rx="1.5" />
      <path d="M7 8v3M11 8v4M15 8v3M19 8v4" />
    </Svg>
  );
}

export function TargetIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
    </Svg>
  );
}

export function TrophyIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M7 4h10v4a5 5 0 0 1-10 0V4Z" />
      <path d="M7 5H4v2a3 3 0 0 0 3 3M17 5h3v2a3 3 0 0 1-3 3" />
      <path d="M9 20h6M12 13v4" />
    </Svg>
  );
}

export function FlameIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3c.6 3-1.8 4-1.8 6.5a3 3 0 0 0 6 0c0-1-.4-1.8-.4-1.8 2 1.4 3.2 3.5 3.2 5.8a7 7 0 0 1-14 0c0-3.6 2.4-5.6 4-7.2C13.8 6.6 12 4.6 12 3Z" />
    </Svg>
  );
}

export function StarIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.7l5.9-.9L12 3.5Z" />
    </Svg>
  );
}

export function GemIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6 3h12l3 5-9 13L3 8l3-5Z" />
      <path d="M3 8h18M9 3 7.5 8 12 21M15 3l1.5 5L12 21" />
    </Svg>
  );
}

export function UsersIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
      <path d="M16 5.2a3.2 3.2 0 0 1 0 5.6M17 14.5a5.5 5.5 0 0 1 3.5 5.5" />
    </Svg>
  );
}

export function MessageIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M21 11.5a8 8 0 0 1-11.5 7.2L4 20l1.3-4.5A8 8 0 1 1 21 11.5Z" />
    </Svg>
  );
}

export function MegaphoneIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M5 10v3a1 1 0 0 0 1 1h2l8 4V6L8 10H6a1 1 0 0 0-1 0Z" />
      <path d="M18 8a4 4 0 0 1 0 7" />
      <path d="M8 14v4a1.5 1.5 0 0 0 3 0v-2.5" />
    </Svg>
  );
}

export function TicketIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2 2 2 0 0 0 0 4 2 2 0 0 1-2 2H5a2 2 0 0 1-2-2 2 2 0 0 0 0-4Z" />
      <path d="M13 6v2M13 11v2M13 16v2" />
    </Svg>
  );
}

export function InboxIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 13l2-7h12l2 7" />
      <path d="M4 13v5h16v-5h-5a3 3 0 0 1-6 0H4Z" />
    </Svg>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3.5" y="5" width="17" height="16" rx="2.5" />
      <path d="M3.5 9.5h17M8 3v4M16 3v4" />
    </Svg>
  );
}

export function SettingsIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.5v2.5M12 19v2.5M21.5 12H19M5 12H2.5M18.7 5.3l-1.8 1.8M7.1 16.9l-1.8 1.8M18.7 18.7l-1.8-1.8M7.1 7.1 5.3 5.3" />
    </Svg>
  );
}

export function ActivityIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3 12h4l3 8 4-16 3 8h4" />
    </Svg>
  );
}

export function DumbbellIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6.5 6.5v11M3.5 9v6M17.5 6.5v11M20.5 9v6M6.5 12h11" />
    </Svg>
  );
}

export function PauseIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="7" y="5" width="3.2" height="14" rx="1" fill="currentColor" stroke="none" />
      <rect x="13.8" y="5" width="3.2" height="14" rx="1" fill="currentColor" stroke="none" />
    </Svg>
  );
}

export function AppleIcon(props: IconProps) {
  return (
    <Svg {...props} strokeWidth={0}>
      <path
        fill="currentColor"
        d="M16.4 12.8c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.5.9-.7 0-1.8-.8-3-.8-1.5 0-2.9.9-3.7 2.3-1.6 2.8-.4 6.8 1.1 9 .8 1.1 1.6 2.3 2.8 2.2 1.1 0 1.5-.7 2.9-.7 1.3 0 1.7.7 2.9.7 1.2 0 2-1.1 2.7-2.2.5-.7.9-1.5 1.2-2.4-3-.9-3-3.7-3-3.9ZM14.3 6c.6-.8 1-1.8.9-2.9-.9 0-2 .6-2.6 1.4-.6.7-1.1 1.7-1 2.7 1 .1 2-.5 2.7-1.2Z"
      />
    </Svg>
  );
}

export function GoogleIcon(props: IconProps) {
  return (
    <Svg {...props} strokeWidth={0}>
      <path fill="#FFC107" d="M21.8 10H12v4h5.6c-.5 2.4-2.6 4-5.6 4a6 6 0 1 1 3.9-10.5l2.8-2.8A10 10 0 1 0 22 12c0-.7-.1-1.4-.2-2Z" />
      <path fill="#FF3D00" d="m4.3 8 3.3 2.4A6 6 0 0 1 12 8a6 6 0 0 1 3.9 1.5l2.8-2.8A10 10 0 0 0 4.3 8Z" />
      <path fill="#4CAF50" d="M12 22c2.6 0 5-1 6.7-2.6l-3.1-2.6A6 6 0 0 1 6.4 14l-3.3 2.5A10 10 0 0 0 12 22Z" />
      <path fill="#1976D2" d="M21.8 10H12v4h5.6a6 6 0 0 1-2 2.8l3.1 2.6c1.8-1.7 3-4.2 3-7.4 0-.7-.1-1.4-.2-2Z" />
    </Svg>
  );
}
