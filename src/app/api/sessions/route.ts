import { createSessionSchema } from "@/features/sessions-discovery/create-session-schema";
import { getSupabaseAdminClient } from "@/features/sessions-discovery/db";
import {
  SessionCreationUnavailableError,
  SessionInputValidationError,
  sessionsDiscoveryService,
} from "@/features/sessions-discovery/services";
import { isSupabaseConfigured } from "@/lib/supabase";

export const runtime = "nodejs";

type SessionApiErrorCode =
  | "INVALID_REQUEST"
  | "DEMO_MODE_DISABLED"
  | "MISSING_IDENTITY"
  | "SESSION_PERSISTENCE_UNAVAILABLE"
  | "SESSION_CREATION_FAILED";

type SessionApiError = {
  error: { code: SessionApiErrorCode; message: string };
};

const noStoreHeaders = { "Cache-Control": "no-store" };

function errorResponse(code: SessionApiErrorCode, message: string, status: number) {
  return Response.json({ error: { code, message } } satisfies SessionApiError, {
    status,
    headers: noStoreHeaders,
  });
}

/** Lists active study sessions with optional courseCode and libraryName filters. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const courseCode = searchParams.get("courseCode") || undefined;
  const libraryName = searchParams.get("libraryName") || undefined;
  const status = (searchParams.get("status") as "active" | "scheduled" | "closed") || undefined;

  try {
    const sessions = await sessionsDiscoveryService.listSessions({
      courseCode,
      libraryName,
      status,
    });
    return Response.json(sessions, {
      status: 200,
      headers: noStoreHeaders,
    });
  } catch (error) {
    console.error("[SessionsAPI] GET error:", error);
    return errorResponse("SESSION_CREATION_FAILED", "Failed to retrieve study sessions.", 500);
  }
}

/**
 * Creates a study session backed by real Supabase database and verified auth identity.
 * Falls back to deterministic process-local demo session when in demo mode.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = createSessionSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("INVALID_REQUEST", "Session details are invalid or contain unsupported fields.", 400);
  }

  // 1. Verify caller identity from Authorization Bearer token if provided
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "").trim();
  const isDemoHeader = request.headers.get("x-demo-mode") === "true";

  let verifiedHostId: string | undefined;
  let isRealAuth = false;

  if (token && isSupabaseConfigured) {
    const admin = getSupabaseAdminClient();
    if (admin) {
      const { data, error } = await admin.auth.getUser(token);
      if (!error && data?.user) {
        verifiedHostId = data.user.id;
        isRealAuth = true;

        // Ensure user profile row exists in public.profiles
        const { data: profileRow } = await admin
          .from("profiles")
          .select("id")
          .eq("id", verifiedHostId)
          .maybeSingle();

        if (!profileRow) {
          await admin.from("profiles").insert({
            id: verifiedHostId,
            name: data.user.user_metadata?.name || data.user.email?.split("@")[0] || "Buckeye Studier",
            avatar_url: data.user.user_metadata?.avatar_url || "",
            major: data.user.user_metadata?.major || "Computer Science & Engineering",
            current_courses: data.user.user_metadata?.current_courses || ["CSE 2221"],
            bio: data.user.user_metadata?.bio || "Buckeye studier",
          });
        }
      }
    }
  }

  // 2. Reject unauthenticated requests in persistent mode unless explicit demo mode is active
  const isDemo = isDemoHeader || process.env.BUCKEYSTUDY_DEMO_MODE === "true" || !isSupabaseConfigured;
  if (!verifiedHostId && !isDemo) {
    return errorResponse("MISSING_IDENTITY", "Verified server identity is required to create a session.", 401);
  }

  // 3. Delegate creation to service adapter
  try {
    const preview = await sessionsDiscoveryService.createSession(
      parsed.data,
      verifiedHostId || (isDemo ? "demo" : undefined)
    );
    return Response.json(preview, {
      status: 201,
      headers: {
        ...noStoreHeaders,
        "X-BuckeyeStudy-Persistence": isRealAuth ? "supabase" : "ephemeral",
      },
    });
  } catch (error) {
    if (error instanceof SessionInputValidationError) {
      return errorResponse("INVALID_REQUEST", error.message, 400);
    }
    if (error instanceof SessionCreationUnavailableError) {
      if (error.reason === "missing_identity") {
        return errorResponse("MISSING_IDENTITY", "Verified server identity is required to create a session.", 401);
      }
      return error.reason === "persistence_unavailable"
        ? errorResponse("SESSION_PERSISTENCE_UNAVAILABLE", "Authenticated session persistence is unavailable.", 503)
        : errorResponse("DEMO_MODE_DISABLED", "Session creation requires verified sign in or demo mode.", 403);
    }
    console.error("[SessionsAPI] Unhandled error:", error);
    return errorResponse("SESSION_CREATION_FAILED", "Session creation failed.", 500);
  }
}
