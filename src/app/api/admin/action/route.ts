import { NextResponse } from "next/server";
import { getServiceClient, verifyAdmin, bearerToken } from "@/lib/adminClient";

/**
 * Gesicherter Endpoint für alle schreibenden Admin-Aktionen.
 * Der Aufrufer muss ein gültiges Bearer-Token einer Admin-Session mitschicken;
 * die eigentliche Mutation läuft serverseitig mit service_role (web-Schema).
 */
export async function POST(request: Request) {
  const admin = await verifyAdmin(bearerToken(request));
  if (!admin) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });
  }

  const action = String(body.action || "");
  const svc = getServiceClient();

  try {
    switch (action) {
      case "pauseUser": {
        const id = String(body.id);
        const paused = Boolean(body.paused);
        const { error } = await svc
          .from("profiles")
          .update({ is_paused: paused, pause_reason: null })
          .eq("id", id);
        if (error) throw error;
        return NextResponse.json({ ok: true });
      }

      case "banUser": {
        const id = String(body.id);
        const banned = Boolean(body.banned);
        const { error } = await svc
          .from("profiles")
          .update({
            is_banned: banned,
            banned_at: banned ? new Date().toISOString() : null,
          })
          .eq("id", id);
        if (error) throw error;
        return NextResponse.json({ ok: true });
      }

      case "unbanUser": {
        const id = String(body.id);
        const { error } = await svc
          .from("profiles")
          .update({
            is_banned: false,
            is_paused: false,
            banned_at: null,
            pause_reason: null,
          })
          .eq("id", id);
        if (error) throw error;
        return NextResponse.json({ ok: true });
      }

      case "deleteUserImage": {
        const id = String(body.id);
        const imageUrl = String(body.imageUrl);
        // Storage-Objekt entfernen (best effort)
        const parts = imageUrl.split("/storage/v1/object/public/");
        if (parts.length === 2) {
          const slash = parts[1].indexOf("/");
          const bucket = parts[1].substring(0, slash);
          const path = parts[1].substring(slash + 1);
          await svc.storage.from(bucket).remove([path]);
        }
        const { data: prof } = await svc
          .from("profiles")
          .select("additional_images, profile_image")
          .eq("id", id)
          .single();
        const urls = ((prof?.additional_images as string[]) || []).filter(
          (u) => u !== imageUrl,
        );
        const update: Record<string, unknown> = { additional_images: urls };
        if (prof?.profile_image === imageUrl) {
          update.profile_image = urls.length > 0 ? urls[0] : null;
        }
        const { error } = await svc.from("profiles").update(update).eq("id", id);
        if (error) throw error;
        return NextResponse.json({ ok: true });
      }

      case "reportStatus": {
        const id = String(body.id);
        const status = String(body.status);
        const { error } = await svc
          .from("reports")
          .update({ status })
          .eq("id", id);
        if (error) throw error;
        return NextResponse.json({ ok: true });
      }

      case "ticketStatus": {
        const id = String(body.id);
        const status = String(body.status);
        const { error } = await svc
          .from("support_tickets")
          .update({ status })
          .eq("id", id);
        if (error) throw error;
        return NextResponse.json({ ok: true });
      }

      case "ticketReply": {
        const id = String(body.id);
        const message = String(body.message || "").trim();
        if (!message) {
          return NextResponse.json({ error: "Leere Nachricht" }, { status: 400 });
        }
        const { error: insErr } = await svc.from("support_messages").insert({
          ticket_id: id,
          sender_type: "admin",
          sender_id: admin.id,
          message,
        });
        if (insErr) throw insErr;
        await svc
          .from("support_tickets")
          .update({ status: "in_progress" })
          .eq("id", id);
        return NextResponse.json({ ok: true });
      }

      default:
        return NextResponse.json({ error: "Unbekannte Aktion" }, { status: 400 });
    }
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Serverfehler" },
      { status: 500 },
    );
  }
}
