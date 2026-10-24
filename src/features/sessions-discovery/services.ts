import "server-only";
import { getMockSessionAccess, mockStore, mockViewerId, toSessionPreview } from "@/lib/supabase";
import { FeatureNotImplementedError, type CreateSessionInput, type SessionsDiscoveryService, type StudySession } from "@/types/contracts";
import { createSessionSchema } from "./create-session-schema";

export class SessionInputValidationError extends Error {
  constructor() {
    super("Session details are invalid or contain unsupported fields.");
    this.name = "SessionInputValidationError";
  }
}

export class SessionCreationUnavailableError extends Error {
  constructor(readonly reason: "demo_disabled" | "missing_identity" | "persistence_unavailable") {
    super(reason === "demo_disabled"
      ? "Demo session creation is disabled."
      : reason === "missing_identity"
        ? "Verified server identity is unavailable."
        : "Session persistence is unavailable.");
    this.name = "SessionCreationUnavailableError";
  }
}

let demoSessionCounter = 1;

function nextDemoSessionId() {
  // Stable, UUID-shaped ids make the mock flow repeatable across fresh processes.
  while (mockStore.sessions.some((session) => session.id === `00000000-0000-4000-8000-${String(demoSessionCounter).padStart(12, "0")}`)) {
    demoSessionCounter += 1;
  }
  const id = `00000000-0000-4000-8000-${String(demoSessionCounter).padStart(12, "0")}`;
  demoSessionCounter += 1;
  return id;
}

/** Workstream 2 owns this adapter. Do not return raw StudySession objects to the feed. */
export const sessionsDiscoveryService: SessionsDiscoveryService = {
  async listSessions(filters = {}) {
    return mockStore.sessions
      .filter((session) => !filters.courseCode || session.courseCode === filters.courseCode)
      .filter((session) => !filters.libraryName || session.libraryName === filters.libraryName)
      .filter((session) => filters.status ? session.status === filters.status : session.status !== "closed")
      .map(toSessionPreview);
  },
  async getSession(sessionId) {
    const session = mockStore.sessions.find((item) => item.id === sessionId);
    if (!session) return null;
    const access = getMockSessionAccess(sessionId);
    return {
      session: toSessionPreview(session),
      access,
      location: access === "locked" ? null : structuredClone({
        tableId: session.tableId,
        surroundingsPhotoUrl: session.surroundingsPhotoUrl,
        gpsCoordinates: session.gpsCoordinates,
      }),
    };
  },
  async createSession(input: CreateSessionInput) {
    // Any Supabase configuration opts out of the in-memory demo adapter. This
    // scaffold has no verified server identity or authenticated write path.
    if (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      throw new SessionCreationUnavailableError("missing_identity");
    }
    if (process.env.BUCKEYSTUDY_DEMO_MODE !== "true") {
      throw new SessionCreationUnavailableError("demo_disabled");
    }

    const parsed = createSessionSchema.safeParse(input);
    if (!parsed.success) throw new SessionInputValidationError();

    const session: StudySession = {
      ...structuredClone(parsed.data),
      id: nextDemoSessionId(),
      hostId: mockViewerId,
      aiTopicTags: [],
      createdAt: new Date().toISOString(),
    };
    mockStore.sessions.push(session);
    return toSessionPreview(session);
  },
  async closeSession() { throw new FeatureNotImplementedError("closeSession"); },
  async uploadSurroundingsPhoto() { throw new FeatureNotImplementedError("uploadSurroundingsPhoto"); },
};
