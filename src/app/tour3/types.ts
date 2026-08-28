/**
 * Gemeinsame Typen für die /tour3-Komponenten. Bewusst dupliziert vom
 * /tour2-Typenset — /tour3 soll unabhängig lesbar bleiben, damit die
 * Entscheidung „Prototyp behalten oder verwerfen" ohne Verstrickungen
 * getroffen werden kann.
 */

export type StopState = "past" | "current" | "planned" | "missed";

export type SeasonStopT3 = {
  id: string;
  city: string;
  countryCode: string | null;
  countryLabel: string | null;
  category: string | null;
  monday: string;             // ISO-Datum (Montag der Turnierwoche)
  surface: string | null;
  latitude: number | null;
  longitude: number | null;
  state: StopState;
};
