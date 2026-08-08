/**
 * Paginiertes Vollladen einer Tabelle über den Supabase-Client.
 *
 * WARUM: Der Client (PostgREST) kappt ein Ergebnis STILL bei 1000 Zeilen. Ein
 * Voll-Read ohne Paginierung liefert dann zu wenige Zeilen — ohne Fehler, ohne
 * Hinweis. Genau diese Falle lag im Saisonplaner (1489 aktive Turniere → 1000).
 * Diese Hilfe holt seitenweise über `.range(from, to)`, bis eine Teilseite
 * kleiner als die Seitengröße ist.
 *
 * WICHTIG: Der Aufrufer MUSS in seiner Query eine DETERMINISTISCHE, totale
 * Sortierung setzen (z. B. zusätzlich `.order("id")` als Tiebreaker) — sonst
 * können Zeilen zwischen Seiten wandern und doppelt/gar nicht erscheinen.
 */
// `data: unknown` in der Callback-Signatur, weil der Supabase-Builder nur die
// GEWÄHLTEN Spalten typisiert (Teil-Zeilentyp) — der Cast auf den Ziel-Zeilentyp
// passiert EINMAL hier, statt an jeder Aufrufstelle. Der Aufrufer setzt <T> und
// bleibt damit getypt.
export async function fetchAllPaged<T>(
  fetchPage: (from: number, to: number) => PromiseLike<{ data: unknown; error: unknown }>,
  pageSize = 1000,
): Promise<T[]> {
  const all: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await fetchPage(from, from + pageSize - 1);
    if (error) throw error;
    const batch = (data as T[] | null) ?? [];
    all.push(...batch);
    if (batch.length < pageSize) break; // letzte Seite erreicht
  }
  return all;
}
