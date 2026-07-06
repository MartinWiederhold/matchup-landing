export interface Venue {
  id: string;
  slug: string;
  name: string;
  sports: string[];
  category: string; // club | public | private | hotel
  lat: number | null;
  lng: number | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  country: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
  cover_url: string | null;
  images: string[];
  description: string | null;
  courts_indoor: number | null;
  courts_outdoor: number | null;
  surfaces: string[];
  floodlight: boolean | null;
  member_count: number | null;
  founded: number | null;
  booking_url: string | null;
  booking_provider: string | null;
  guest_access: boolean | null;
  guest_fee: string | null;
  membership_fee: string | null;
  court_price: string | null;
  amenities: string[];
  opening_hours: Record<string, string> | null;
  season: string | null;
  verified: boolean;
  status: string;
}

export const VENUE_SELECT =
  "id,slug,name,sports,category,lat,lng,address,city,postal_code,country,website,phone,email,logo_url,cover_url,images,description,courts_indoor,courts_outdoor,surfaces,floodlight,member_count,founded,booking_url,booking_provider,guest_access,guest_fee,membership_fee,court_price,amenities,opening_hours,season,verified,status";

export const SPORT_COLOR: Record<string, string> = {
  tennis: "#4b3bf3",
  padel: "#10b981",
  pickleball: "#f59e0b",
};
export const SPORT_LABEL: Record<string, string> = {
  tennis: "Tennis",
  padel: "Padel",
  pickleball: "Pickleball",
};
export const CAT_LABEL: Record<string, string> = {
  club: "Club",
  public: "Öffentlich",
  private: "Privat",
  hotel: "Hotel",
};
export const WEEKDAYS: { key: string; label: string }[] = [
  { key: "mon", label: "Mo" },
  { key: "tue", label: "Di" },
  { key: "wed", label: "Mi" },
  { key: "thu", label: "Do" },
  { key: "fri", label: "Fr" },
  { key: "sat", label: "Sa" },
  { key: "sun", label: "So" },
];

export function initials(name: string): string {
  return name
    .replace(/[^A-Za-zÀ-ÿ0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0]!.toUpperCase())
    .slice(0, 2)
    .join("");
}

export function primarySport(v: Venue): string {
  return v.sports[0] ?? "tennis";
}
