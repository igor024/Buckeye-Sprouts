import { authProfilesService, getDemoJoinStatus, requestDemoJoinAs } from "@/features/auth-profiles/services";
import { getSupabaseAdminClient } from "@/features/sessions-discovery/db";
import { isSupabaseConfigured, mockStore } from "@/lib/supabase";
import { MOCK_PROFILES, type JoinRequestPreview } from "@/types/contracts";

export const runtime = "nodejs";

const demoRequesterId = MOCK_PROFILES[2].id;
const noStoreHeaders = { "Cache-Control": "no-store" };

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params;
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "").trim();

  // Fetch all requests for this session (for host queue)
  const allRequests = await authProfilesService.listJoinRequests(sessionId);

  // 1. Authenticated user check for viewer's individual request
  if (token && isSupabaseConfigured) {
    const admin = getSupabaseAdminClient();
    if (admin) {
      const { data: authData } = await admin.auth.getUser(token);
      if (authData?.user) {
        const { data: reqRow } = await admin
          .from("join_requests")
          .select("id, session_id, requester_id, status, requested_at")
          .eq("session_id", sessionId)
          .eq("requester_id", authData.user.id)
          .maybeSingle();

        if (reqRow) {
          const { data: profileRow } = await admin
            .from("profiles")
            .select("id, name, avatar_url, major, current_courses, bio")
            .eq("id", authData.user.id)
            .single();

          return Response.json(
            {
              request: {
                id: reqRow.id,
                sessionId: reqRow.session_id,
                status: reqRow.status,
                requestedAt: reqRow.requested_at,
                requesterProfile: profileRow
                  ? {
                      id: profileRow.id,
                      name: profileRow.name,
                      avatarUrl: profileRow.avatar_url,
                      major: profileRow.major,
                      currentCourses: profileRow.current_courses || [],
                      bio: profileRow.bio,
                    }
                  : {
                      id: authData.user.id,
                      name: "Buckeye Student",
                      avatarUrl: "",
                      major: "Undeclared",
                      currentCourses: [],
                      bio: "",
                    },
              },
              requests: allRequests,
            },
            { headers: noStoreHeaders }
          );
        }
        return Response.json({ request: null, requests: allRequests }, { headers: noStoreHeaders });
      }
    }
  }

  // 2. Demo mode check
  try {
    const demoReq = await getDemoJoinStatus(sessionId, demoRequesterId);
    return Response.json({ request: demoReq, requests: allRequests }, { headers: noStoreHeaders });
  } catch {
    return Response.json({ request: null, requests: allRequests }, { headers: noStoreHeaders });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params;
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "").trim();
  const isDemoHeader = request.headers.get("x-demo-mode") === "true";

  // 1. Authenticated user path (Live Supabase DB)
  if (token && isSupabaseConfigured && !isDemoHeader) {
    const admin = getSupabaseAdminClient();
    if (!admin) {
      return Response.json(
        { error: { code: "PERSISTENCE_ERROR", message: "Database is unavailable." } },
        { status: 503, headers: noStoreHeaders }
      );
    }

    const { data: authData, error: authErr } = await admin.auth.getUser(token);
    if (authErr || !authData?.user) {
      return Response.json(
        { error: { code: "UNAUTHORIZED", message: "Invalid or expired session token." } },
        { status: 401, headers: noStoreHeaders }
      );
    }

    const userId = authData.user.id;

    // Resolve target study session (check Supabase first, then mock store)
    let sessionRow: { id: string; host_id: string; available_seats: number; status: string } | null = null;
    const { data: dbRow } = await admin
      .from("study_sessions")
      .select("id, host_id, available_seats, status")
      .eq("id", sessionId)
      .maybeSingle();

    if (dbRow) {
      sessionRow = dbRow;
    } else {
      const mockSession = mockStore.sessions.find((s) => s.id === sessionId);
      if (mockSession) {
        sessionRow = {
          id: mockSession.id,
          host_id: mockSession.hostId,
          available_seats: mockSession.availableSeats,
          status: mockSession.status,
        };
      }
    }

    if (!sessionRow) {
      return Response.json(
        { error: { code: "NOT_FOUND", message: "Study session was not found." } },
        { status: 404, headers: noStoreHeaders }
      );
    }

    if (sessionRow.host_id === userId) {
      return Response.json(
        { error: { code: "INVALID_REQUEST", message: "Hosts already have access to their own session." } },
        { status: 400, headers: noStoreHeaders }
      );
    }

    if (sessionRow.status === "closed") {
      return Response.json(
        { error: { code: "INVALID_REQUEST", message: "This study session is closed." } },
        { status: 400, headers: noStoreHeaders }
      );
    }

    if (sessionRow.available_seats < 1) {
      return Response.json(
        { error: { code: "NO_SEATS", message: "No seats are available right now." } },
        { status: 400, headers: noStoreHeaders }
      );
    }

    // Check existing request in Supabase
    const { data: existingReq } = await admin
      .from("join_requests")
      .select("*")
      .eq("session_id", sessionId)
      .eq("requester_id", userId)
      .maybeSingle();

    if (existingReq) {
      if (existingReq.status === "rejected") {
        return Response.json(
          { error: { code: "DECLINED", message: "This request was declined by the host." } },
          { status: 400, headers: noStoreHeaders }
        );
      }
      return Response.json({ request: existingReq }, { status: 200, headers: noStoreHeaders });
    }

    // Insert new join request in Supabase
    const { data: newRow, error: insertErr } = await admin
      .from("join_requests")
      .insert({
        session_id: sessionId,
        requester_id: userId,
        status: "pending",
      })
      .select()
      .single();

    if (insertErr || !newRow) {
      console.error("[JoinAPI] Failed to insert join request in DB:", insertErr);
      return Response.json(
        { error: { code: "PERSISTENCE_ERROR", message: "Failed to record join request." } },
        { status: 500, headers: noStoreHeaders }
      );
    }

    // Fetch requester profile for safe preview
    const { data: profileRow } = await admin
      .from("profiles")
      .select("id, name, avatar_url, major, current_courses, bio")
      .eq("id", userId)
      .single();

    const preview: JoinRequestPreview = {
      id: newRow.id,
      sessionId: newRow.session_id,
      status: newRow.status,
      requestedAt: newRow.requested_at,
      requesterProfile: profileRow
        ? {
            id: profileRow.id,
            name: profileRow.name,
            avatarUrl: profileRow.avatar_url,
            major: profileRow.major,
            currentCourses: profileRow.current_courses || [],
            bio: profileRow.bio,
          }
        : {
            id: userId,
            name: "Buckeye Student",
            avatarUrl: "",
            major: "Undeclared",
            currentCourses: [],
            bio: "",
          },
    };

    return Response.json(preview, { status: 201, headers: noStoreHeaders });
  }

  // 2. Demo mode path (fallback for judges and unauthenticated testing)
  try {
    const preview = await requestDemoJoinAs(sessionId, demoRequesterId);
    return Response.json(preview, {
      status: 201,
      headers: {
        ...noStoreHeaders,
        "X-BuckeyeStudy-Persistence": "ephemeral",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not request to join.";
    return Response.json(
      { error: { code: "REQUEST_FAILED", message } },
      { status: 400, headers: noStoreHeaders }
    );
  }
}

/** Reviews an incoming join request: host approves or declines. */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params;
  void sessionId;
  const body = await request.json().catch(() => null);
  const { requestId, decision } = body || {};

  if (!requestId || (decision !== "approved" && decision !== "rejected")) {
    return Response.json(
      { error: { code: "INVALID_REQUEST", message: "requestId and decision ('approved' | 'rejected') are required." } },
      { status: 400, headers: noStoreHeaders }
    );
  }

  try {
    const updated = await authProfilesService.reviewJoinRequest(requestId, decision);
    return Response.json({ request: updated, success: true }, { status: 200, headers: noStoreHeaders });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to review join request.";
    return Response.json(
      { error: { code: "REVIEW_FAILED", message } },
      { status: 400, headers: noStoreHeaders }
    );
  }
}
