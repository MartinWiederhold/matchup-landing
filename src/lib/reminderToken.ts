/**
 * Signierter Abmelde-Token für Fristen-Erinnerungen (stateless, HMAC-SHA256 über die
 * user_id mit CRON_SECRET). `crypto` ist schon in Nutzung (news/sync) — keine Dependency.
 * Der Token taugt NUR zum Abschalten (der Endpoint setzt fest enabled=false); Einschalten
 * geht ausschließlich im eingeloggten App-Schalter (RLS-geschützt).
 */
import { createHmac, timingSafeEqual } from "crypto";

export function reminderSig(userId: string): string | null {
  const secret = process.env.CRON_SECRET;
  if (!secret) return null;
  return createHmac("sha256", secret).update(userId).digest("hex");
}

export function reminderSigValid(userId: string, sig: string): boolean {
  const expected = reminderSig(userId);
  if (!expected || !sig || sig.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}
