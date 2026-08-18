/**
 * Datenschicht für den Turnier-Ordner (web.tour_tournament_document + Bucket tour-documents).
 *
 * EIGENE DATEI, nur Anon-Client (RLS wirkt, nie der Service-Client). Muster wie tourExpenses.ts:
 * privater Bucket, Zufallsdateiname (kein Klarname), Zugriff nur über kurzlebige signierte Links.
 *
 * MU-017 — Waisen von vornherein vermeiden (kein DB-Trigger möglich, Supabase blockt das):
 *  - Löschen: Datei ZUERST über die Storage-API entfernen, dann die Zeile (lauter Abbruch).
 *  - Upload: schlägt das Insert der Metazeile fehl, wird die eben hochgeladene Datei wieder
 *    entfernt (Kompensation) — so entsteht kein verwaistes Objekt.
 *  - Diese Tabelle fasst NUR /tour an; es gibt keinen /app-Löschpfad wie bei Belegen.
 */
import { supabase } from "@/lib/supabase";
import type { TourTournamentDocument, TourTournamentDocumentKind } from "@/lib/types";

const BUCKET = "tour-documents";
const COLUMNS = "id, user_id, tournament_id, kind, label, storage_path, mime, size_bytes, created_at, updated_at";

/** Erlaubte Dateiarten + Grenze — MUSS zur Bucket-Konfiguration passen (10 MB, Bilder + PDF). */
export const DOC_MAX_BYTES = 10 * 1024 * 1024;
export const DOC_ACCEPT_MIME = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", "application/pdf"];
export const DOC_KINDS: TourTournamentDocumentKind[] = ["fact_sheet", "confirmation", "draw", "visa", "flight", "hotel", "transport", "insurance", "other"];

/** Alle Dateien eines Turnier-Ordners (owner-only via RLS). */
export async function loadDocuments(userId: string, tournamentId: string): Promise<TourTournamentDocument[]> {
  const { data, error } = await supabase
    .from("tour_tournament_document")
    .select(COLUMNS)
    .eq("user_id", userId)
    .eq("tournament_id", tournamentId)
    .order("kind", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as TourTournamentDocument[] | null) ?? [];
}

/**
 * Datei in den EIGENEN Ordner hochladen: <uid>/<tournamentId>/<zufall>.<ext>. Dateiname
 * zufällig (der Originalname könnte Klarnamen enthalten). Danach die Metazeile anlegen;
 * scheitert das, wird die Datei wieder entfernt (Kompensation gegen Waisen).
 */
export async function uploadDocument(
  userId: string, tournamentId: string, kind: TourTournamentDocumentKind, label: string | null, file: File,
): Promise<void> {
  const ext = (file.name.split(".").pop() || "").toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
  const path = `${userId}/${tournamentId}/${crypto.randomUUID()}.${ext}`;
  const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type || undefined, upsert: false });
  if (upErr) throw upErr;
  const { error: insErr } = await supabase.from("tour_tournament_document").insert({
    user_id: userId, tournament_id: tournamentId, kind, label, storage_path: path, mime: file.type || null, size_bytes: file.size,
  });
  if (insErr) {
    // Kompensation: verwaiste Datei wieder entfernen, dann laut abbrechen.
    await supabase.storage.from(BUCKET).remove([path]).catch(() => { /* best effort */ });
    throw insErr;
  }
}

/** Kurzlebiger signierter Link (privat, nie öffentlich). 300 s — überlebt ein Neuladen. */
export async function signedDocumentUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 300);
  if (error || !data?.signedUrl) throw error ?? new Error("sign_failed");
  return data.signedUrl;
}

/**
 * Datei löschen. MU-017: ZUERST die Datei über die Storage-API entfernen, dann die Zeile.
 * Schlägt das Storage-Löschen fehl, brechen wir LAUT ab (Zeile bleibt) — kein stiller Waise.
 */
export async function removeDocument(doc: TourTournamentDocument): Promise<void> {
  const { error: sErr } = await supabase.storage.from(BUCKET).remove([doc.storage_path]);
  if (sErr) throw new Error("doc_delete_failed");
  const { error } = await supabase.from("tour_tournament_document").delete().eq("id", doc.id);
  if (error) throw error;
}
