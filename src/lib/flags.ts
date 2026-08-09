/**
 * Laender-Name -> Flaggen-Emoji fuer den Tour-Modus. Deckt die gaengigen Tennis-Nationen
 * (ATP/Challenger/ITF-Kalender) in deutscher + englischer Schreibweise ab.
 */
function norm(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z]/g, "");
}

const ISO: Record<string, string> = {};
const add = (code: string, ...names: string[]) => names.forEach((n) => { ISO[norm(n)] = code; });

add("CH", "schweiz", "switzerland", "suisse");
add("AT", "oesterreich", "osterreich", "austria");
add("DE", "deutschland", "germany");
add("FR", "frankreich", "france");
add("IT", "italien", "italy", "italia");
add("ES", "spanien", "spain", "espana");
add("HR", "kroatien", "croatia", "hrvatska");
add("NL", "niederlande", "netherlands");
add("PT", "portugal");
add("SE", "schweden", "sweden");
add("BE", "belgien", "belgium");
add("GR", "griechenland", "greece");
add("HU", "ungarn", "hungary");
add("PL", "polen", "poland");
add("CZ", "tschechien", "czechia", "czechrepublic");
add("DK", "daenemark", "danemark", "denmark");
add("FI", "finnland", "finland");
add("NO", "norwegen", "norway");
add("RO", "rumaenien", "rumanien", "romania");
add("BG", "bulgarien", "bulgaria");
add("MC", "monaco");
add("GB", "unitedkingdom", "grossbritannien", "greatbritain", "uk", "england");
add("US", "usa", "unitedstates", "vereinigtestaaten");
add("CA", "kanada", "canada");
add("AU", "australien", "australia");
add("JP", "japan");
add("CN", "china");
add("KR", "suedkorea", "southkorea", "korea");
add("IN", "indien", "india");
add("MX", "mexiko", "mexico");
add("BR", "brasilien", "brazil");
add("AR", "argentinien", "argentina");
add("CL", "chile");
add("CO", "kolumbien", "colombia");
add("TR", "tuerkei", "turkey", "turkiye");
add("TN", "tunesien", "tunisia");
add("EG", "aegypten", "egypt");
add("MA", "marokko", "morocco");
add("ZA", "suedafrika", "southafrica");
add("AE", "uae", "unitedarabemirates");
add("QA", "katar", "qatar");
add("SA", "saudiarabien", "saudiarabia");
add("RS", "serbien", "serbia");
add("SK", "slowakei", "slovakia");
add("SI", "slowenien", "slovenia");
add("NZ", "neuseeland", "newzealand");
add("TH", "thailand");
add("KZ", "kasachstan", "kazakhstan");

function isoToFlag(code: string): string {
  return code.replace(/./g, (c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65));
}

export function flagEmoji(country: string | null | undefined): string {
  if (!country) return "\u{1F3BE}";
  const iso = ISO[norm(country)];
  return iso ? isoToFlag(iso) : "\u{1F3BE}";
}

/** Ländername (DE/EN, wie im Turnier-Datenstamm) → ISO-3166-1 alpha-2, oder null.
 *  Nutzt dieselbe Namens-Map wie flagEmoji. */
export function isoFromCountry(country: string | null | undefined): string | null {
  if (!country) return null;
  return ISO[norm(country)] ?? null;
}
