import { fetchLiveMapGroups } from "@/lib/server-groups";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { isSupabaseConfigured } from "@/lib/supabase";

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

    // 1. Resolve or ensure host profile
    let hostId = hostProfile?.id;
    if (!hostId) {
      const { data: firstProfile } = await admin.from("profiles").select("id").limit(1).single();
      hostId = firstProfile?.id || "1f7dab3a-5d22-4ccb-ad42-633546fd7afb";
    }

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
      return Response.json({ error: "Failed to create session in database" }, { status: 500 });
    }

    // 3. Insert session_private_details
    await admin.from("session_private_details").insert({
      session_id: sessionRow.id,
      table_id: tableId,
      surroundings_photo_path: "",
      gps_lat: 40.0001,
      gps_lng: -83.0146,
    });

    // 4. Update room_ids
    await admin.from("room_ids").update({ active_session_id: sessionRow.id }).eq("id", tableId);

    // 5. Insert shared_notebooks
    const initialNote = `## ${courseCode} Study Notes\n[note] ${hostProfile?.name || "Host"} · Shared\nNew study session started at ${tableId}.`;
    await admin.from("shared_notebooks").insert({
      session_id: sessionRow.id,
      content: initialNote,
      last_updated_by: hostId,
      ai_summary: `New study session started for ${courseCode} at ${tableId}.`,
      ai_suggestions: ["Review key topics", "Solve example problem together"],
      updated_at: new Date().toISOString(),
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

    if (action === "notebook" && sessionId && typeof content === "string") {
      await admin.from("shared_notebooks").upsert({
        session_id: sessionId,
        content,
        last_updated_by: profileId || undefined,
        updated_at: new Date().toISOString(),
      });
      return Response.json({ success: true });
    }

    if (action === "end" && sessionId) {
      await admin.from("study_sessions").update({ status: "closed" }).eq("id", sessionId);
      if (tableId) {
        await admin.from("room_ids").update({ active_session_id: null }).eq("id", tableId);
      }
      return Response.json({ success: true });
    }

    if (action === "join" && sessionId && profileId) {
      await admin.from("join_requests").upsert({
        session_id: sessionId,
        requester_id: profileId,
        status: "approved",
        requested_at: new Date().toISOString(),
      });
      return Response.json({ success: true });
    }

    return Response.json({ error: "Unsupported action" }, { status: 400 });
  } catch (error) {
    console.error("[ApiMapGroups] PATCH error:", error);
    return Response.json({ error: "Failed to update group" }, { status: 500 });
  }
}
