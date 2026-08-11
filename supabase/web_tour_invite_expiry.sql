-- ============================================================================
-- MU-027 — Einladungslinks: Ablaufdatum + Entwertung nach Annahme
-- ============================================================================
-- invite_token in tour_team hatte kein Ablaufdatum; /app?team=<token> ist login-los
-- erreichbar und der erste eingeloggte Nutzer band ihn — dauerhaft. Fix:
--   • Ablauffeld invite_expires_at (Erzeugung: now()+7 Tage).
--   • accept-invite lehnt abgelaufene / nicht-pending / bereits entwertete Tokens ab
--     und setzt invite_token nach Annahme auf NULL (nicht wiederverwendbar).
--   • Spieler sieht künftig „Link erzeugt am …" + Status offen/abgelaufen/aktiv
--     (TourProfileEdit; die Zeilen liest der Spieler schon via RLS „tour_team player").
-- Additive Schema-Änderung (nur ADD COLUMN) → kein Deploy-Fenster-Risiko. Reihenfolge:
-- SQL anwenden, dann Code deployen (Code liest/schreibt das neue Feld).

alter table web.tour_team add column if not exists invite_expires_at timestamptz;

-- invite_token war NOT NULL — deshalb konnte accept-invite den Token bislang nicht auf
-- null setzen (Update schlug still fehl → keine Entwertung, MU-027-Lücke). Ein
-- angenommener Invite hat legitim KEINEN offenen Token → NOT NULL entfernen.
alter table web.tour_team alter column invite_token drop not null;

-- Bestand (aktuell 0 Zeilen → No-op, aber idempotent): offene Tokens bekommen ein
-- Ablaufdatum relativ zur Erzeugung.
update web.tour_team
   set invite_expires_at = created_at + interval '7 days'
 where invite_token is not null and invite_expires_at is null;

notify pgrst, 'reload schema';

-- ── Rollback ────────────────────────────────────────────────────────────────
--   alter table web.tour_team drop column invite_expires_at;
