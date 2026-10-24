import { createSessionSchema } from "@/features/sessions-discovery/create-session-schema";
import { SessionCreationUnavailableError, SessionInputValidationError, sessionsDiscoveryService } from "@/features/sessions-discovery/services";

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

/** Creates a process-local demo session. Persistent creation needs auth and an atomic DB write path. */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = createSessionSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("INVALID_REQUEST", "Session details are invalid or contain unsupported fields.", 400);
  }

  try {
    const preview = await sessionsDiscoveryService.createSession(parsed.data);
    return Response.json(preview, {
      status: 201,
      headers: {
        ...noStoreHeaders,
        "X-Scaffold-Source": "mock",
        "X-BuckeyeStudy-Persistence": "ephemeral",
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
        : errorResponse("DEMO_MODE_DISABLED", "Session creation requires BUCKEYSTUDY_DEMO_MODE=true.", 403);
    }
    return errorResponse("SESSION_CREATION_FAILED", "Session creation failed.", 500);
  }
}
