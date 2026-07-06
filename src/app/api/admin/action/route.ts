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

      case "deleteEvent": {
        const id = String(body.id);
        // Bild aus dem Bucket entfernen (best effort), falls eigenes Upload.
        const { data: ev } = await svc
          .from("events")
          .select("image_url")
          .eq("id", id)
          .maybeSingle();
        const url = ev?.image_url as string | undefined;
        if (url && url.includes("/storage/v1/object/public/")) {
          const parts = url.split("/storage/v1/object/public/");
          const slash = parts[1].indexOf("/");
          const bucket = parts[1].substring(0, slash);
          const path = parts[1].substring(slash + 1);
          await svc.storage.from(bucket).remove([path]);
        }
        const { error } = await svc.from("events").delete().eq("id", id);
        if (error) throw error;
        return NextResponse.json({ ok: true });
      }

      case "updateEvent": {
        const id = String(body.id);
        const patch = (body.patch || {}) as Record<string, unknown>;
        const allowed = [
          "title",
          "short_description",
          "description",
          "location",
          "sport",
          "event_date",
          "max_participants",
          "status",
          "image_url",
        ];
        const update: Record<string, unknown> = {};
        for (const k of allowed) if (k in patch) update[k] = patch[k];
        if (Object.keys(update).length === 0) {
          return NextResponse.json({ error: "Nichts zu ändern" }, { status: 400 });
        }
        const { error } = await svc.from("events").update(update).eq("id", id);
        if (error) throw error;
        return NextResponse.json({ ok: true });
      }

      case "deleteUser": {
        const id = String(body.id);
        if (id === admin.id) {
          return NextResponse.json(
            { error: "Eigenes Admin-Konto kann nicht gelöscht werden." },
            { status: 400 },
          );
        }
        // 1) Bilder aus dem Bucket entfernen (best effort)
        const { data: prof } = await svc
          .from("profiles")
          .select("profile_image, additional_images")
          .eq("id", id)
          .maybeSingle();
        const urls = [
          prof?.profile_image as string | undefined,
          ...(((prof?.additional_images as string[]) || []) ?? []),
        ].filter(Boolean) as string[];
        const paths = urls
          .filter((u) => u.includes("/storage/v1/object/public/web-avatars/"))
          .map((u) => u.split("/storage/v1/object/public/web-avatars/")[1]);
        if (paths.length) await svc.storage.from("web-avatars").remove(paths);

        // 2) Alle DB-Daten in korrekter Reihenfolge löschen (privilegierte RPC)
        const { error: rpcErr } = await svc.rpc("admin_delete_user", { target: id });
        if (rpcErr) throw rpcErr;

        // 3) Auth-Konto löschen, damit kein Login mehr möglich ist (best effort)
        await svc.auth.admin.deleteUser(id).catch(() => {});

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

      case "saveVenue": {
        const id = body.id ? String(body.id) : null;
        const patch = (body.patch ?? {}) as Record<string, unknown>;
        patch.updated_at = new Date().toISOString();
        if (id) {
          const { error } = await svc.from("venues").update(patch).eq("id", id);
          if (error) throw error;
          return NextResponse.json({ ok: true, id });
        }
        const { data, error } = await svc
          .from("venues")
          .insert({ ...patch, source: "admin" })
          .select("id")
          .single();
        if (error) throw error;
        return NextResponse.json({ ok: true, id: (data as { id: string }).id });
      }

      case "deleteVenue": {
        const id = String(body.id);
        const { error } = await svc.from("venues").delete().eq("id", id);
        if (error) throw error;
        return NextResponse.json({ ok: true });
      }

      default:
        return NextResponse.json({ error: "Unbekannte Aktion" }, { status: 400 });
    }
  } catch (e) {
    // Supabase/Postgrest-Fehler sind keine Error-Instanzen, haben aber .message.
    const msg =
      e instanceof Error
        ? e.message
        : (e as { message?: string; details?: string })?.message ||
          (e as { details?: string })?.details ||
          "Serverfehler";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
