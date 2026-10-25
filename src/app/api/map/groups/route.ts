import { fetchLiveMapGroups } from "@/lib/server-groups";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { isSupabaseConfigured } from "@/lib/supabase";
import { syncStudySessionSeats } from "@/lib/session-seats";

export const runtime = "nodejs";

const noStoreHeaders = { "Cache-Control": "no-store" };

export async function GET() {
  try {
    const groups = await fetchLiveMapGroups();
    return Response.json(groups, {
      status: 200,
      headers: noStoreHeaders,
    });
  } catch (error) {
    console.error("[ApiMapGroups] Error:", error);
    return Response.json({ error: "Failed to fetch map groups" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tableId, name, courseCode, inviteOnly, hostProfile } = body;

    if (!tableId || !courseCode) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!isSupabaseConfigured) {
      return Response.json({ error: "Supabase is not configured" }, { status: 503 });
    }

    const admin = getSupabaseAdminClient();
    if (!admin) {
      return Response.json({ error: "Database client unavailable" }, { status: 500 });
    }

    // 1. Resolve or ensure a valid host profile in public.profiles
    let hostId: string | null = null;
    if (hostProfile?.id) {
      const { data: existing } = await admin
        .from("profiles")
        .select("id")
        .eq("id", hostProfile.id)
        .maybeSingle();
      if (existing?.id) {
        hostId = existing.id;
      }
    }

    if (!hostId && hostProfile?.name) {
      const { data: byName } = await admin
        .from("profiles")
        .select("id")
        .ilike("name", hostProfile.name)
        .maybeSingle();
      if (byName?.id) {
        hostId = byName.id;
      }
    }

    if (!hostId) {
      const { data: firstProfile } = await admin.from("profiles").select("id").limit(1).maybeSingle();
      hostId = firstProfile?.id || "3f962e3e-6507-4df4-b806-9eaba48c8443";
    }

    // Close any previous active sessions at this table to avoid stale overlap
    await admin
      .from("study_sessions")
      .update({ status: "closed" })
      .eq("table_id", tableId)
      .eq("status", "active");

    // 2. Insert study session
    const { data: sessionRow, error: sErr } = await admin
      .from("study_sessions")
      .insert({
        host_id: hostId,
        title: name || `${hostProfile?.name || "Buckeye"}'s Group`,
        subtitle: `${courseCode} Study Session`,
        course_code: courseCode,
        library_name: "Thompson Library",
        floor: "Level 1",
        zone: `Table ${tableId}`,
        table_id: tableId,
        total_seats: 5,
        available_seats: 4,
        requires_approval: Boolean(inviteOnly),
        status: "active",
        ai_topic_tags: [courseCode, "Thompson Library", "Level 1"],
      })
      .select()
      .single();

    if (sErr || !sessionRow) {
      console.error("[ApiMapGroups] Session insert error:", sErr);
      return Response.json({ error: "Failed to create session in database", details: sErr?.message }, { status: 500 });
    }

    // 3. Upsert session_private_details
    await admin.from("session_private_details").upsert({
      session_id: sessionRow.id,
      table_id: tableId,
      surroundings_photo_path: "",
      gps_lat: 40.0001,
      gps_lng: -83.0146,
    });

    // 4. Update room_ids anchor
    await admin.from("room_ids").upsert({
      id: tableId,
      library_name: "Thompson Library",
      active_session_id: sessionRow.id,
    });

    // 5. Insert shared_notebooks
    const initialNote = `## ${courseCode} Study Notes\n[note] ${hostProfile?.name || "Host"} · Shared\nNew study session started at ${tableId}.`;
    await admin.from("shared_notebooks").upsert({
      session_id: sessionRow.id,
      content: initialNote,
      last_updated_by: hostId,
      ai_summary: `New study session started for ${courseCode} at ${tableId}.`,
      ai_suggestions: ["Review key topics", "Solve example problem together"],
      updated_at: new Date().toISOString(),
    });

    // 6. Record host active check-in at the table
    await admin.from("check_ins").upsert({
      session_id: sessionRow.id,
      user_id: hostId,
      method: "table_qr",
      checked_in_at: new Date().toISOString(),
      checked_out_at: null,
    });

    const groups = await fetchLiveMapGroups();
    return Response.json({ success: true, sessionId: sessionRow.id, groups }, { status: 201 });
  } catch (error) {
    console.error("[ApiMapGroups] POST error:", error);
    return Response.json({ error: "Failed to create group" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { action, sessionId, content, profileId, tableId } = body;

    const admin = getSupabaseAdminClient();
    if (!admin) {
      return Response.json({ error: "Database client unavailable" }, { status: 500 });
    }

    if (action === "refresh") {
      await syncStudySessionSeats(admin);
      const groups = await fetchLiveMapGroups();
      return Response.json({ success: true, groups }, { headers: noStoreHeaders });
    }

    // Resolve profileId to valid database profile if mock ID was provided
    let resolvedProfileId = profileId;
    if (profileId) {
      const { data: pCheck } = await admin.from("profiles").select("id").eq("id", profileId).maybeSingle();
      if (!pCheck?.id) {
        const { data: firstP } = await admin.from("profiles").select("id").limit(1).maybeSingle();
        resolvedProfileId = firstP?.id || "3f962e3e-6507-4df4-b806-9eaba48c8443";
      }
    }

    if (action === "notebook" && sessionId && typeof content === "string") {
      await admin.from("shared_notebooks").upsert({
        session_id: sessionId,
        content,
        last_updated_by: resolvedProfileId || undefined,
        updated_at: new Date().toISOString(),
      });
      return Response.json({ success: true });
    }

    if (action === "end" && sessionId) {
      await admin.from("study_sessions").update({ status: "closed" }).eq("id", sessionId);
      await admin.from("check_ins").update({ checked_out_at: new Date().toISOString() }).eq("session_id", sessionId).is("checked_out_at", null);
      if (tableId) {
        await admin.from("room_ids").update({ active_session_id: null }).eq("id", tableId);
      }
      const groups = await fetchLiveMapGroups();
      return Response.json({ success: true, groups });
    }

    if (action === "join" && sessionId && resolvedProfileId) {
      // 1. Record approved join request
      await admin.from("join_requests").upsert({
        session_id: sessionId,
        requester_id: resolvedProfileId,
        status: "approved",
        requested_at: new Date().toISOString(),
      });

      // 2. Record active check-in at the table
      await admin.from("check_ins").upsert({
        session_id: sessionId,
        user_id: resolvedProfileId,
        method: "buck_id",
        checked_in_at: new Date().toISOString(),
        checked_out_at: null,
      });

      const groups = await fetchLiveMapGroups();
      return Response.json({ success: true, groups });
    }

    if (action === "leave" && sessionId && resolvedProfileId) {
      // 1. Check out from table
      await admin
        .from("check_ins")
        .update({ checked_out_at: new Date().toISOString() })
        .eq("session_id", sessionId)
        .eq("user_id", resolvedProfileId)
        .is("checked_out_at", null);

      // 2. Update join request
      await admin
        .from("join_requests")
        .update({ status: "cancelled" })
        .eq("session_id", sessionId)
        .eq("requester_id", resolvedProfileId);

      // 3. Handle host succession if the person leaving was the host
      const { data: session } = await admin
        .from("study_sessions")
        .select("host_id, table_id")
        .eq("id", sessionId)
        .maybeSingle();

      if (session && session.host_id === resolvedProfileId) {
        const { data: remainingCheckins } = await admin
          .from("check_ins")
          .select("user_id")
          .eq("session_id", sessionId)
          .is("checked_out_at", null)
          .order("checked_in_at", { ascending: true })
          .limit(1);

        if (remainingCheckins && remainingCheckins.length > 0) {
          await admin
            .from("study_sessions")
            .update({ host_id: remainingCheckins[0].user_id })
            .eq("id", sessionId);
        } else {
          await admin.from("study_sessions").update({ status: "closed" }).eq("id", sessionId);
          if (session.table_id || tableId) {
            await admin.from("room_ids").update({ active_session_id: null }).eq("id", session.table_id || tableId);
          }
        }
      }

      const groups = await fetchLiveMapGroups();
      return Response.json({ success: true, groups });
    }

    return Response.json({ error: "Unsupported action" }, { status: 400 });
  } catch (error) {
    console.error("[ApiMapGroups] PATCH error:", error);
    return Response.json({ error: "Failed to update group" }, { status: 500 });
  }
}
