import "server-only";
import { getMockSessionAccess, isSupabaseConfigured, mockStore, mockViewerId, toSessionPreview } from "@/lib/supabase";
import {
  type CreateSessionInput,
  type SessionsDiscoveryService,
  type StudySession,
  type SessionFilters,
  type SessionPreview,
  type SessionDetail,
} from "@/types/contracts";
import { createSessionSchema } from "./create-session-schema";
import { fetchDbSessionDetail, fetchDbSessions, getSupabaseAdminClient, insertDbSession } from "./db";

export class SessionInputValidationError extends Error {
  constructor() {
    super("Session details are invalid or contain unsupported fields.");
    this.name = "SessionInputValidationError";
  }
}

export class SessionCreationUnavailableError extends Error {
  readonly reason: "demo_disabled" | "missing_identity" | "persistence_unavailable";

  constructor(reason: "demo_disabled" | "missing_identity" | "persistence_unavailable") {
    super(
      reason === "demo_disabled"
        ? "Demo session creation is disabled."
        : reason === "missing_identity"
          ? "Verified server identity is unavailable."
          : "Session persistence is unavailable."
    );
    this.name = "SessionCreationUnavailableError";
    this.reason = reason;
  }
}

let demoSessionCounter = 1;

function nextDemoSessionId() {
  while (
    mockStore.sessions.some(
      (session) => session.id === `00000000-0000-4000-8000-${String(demoSessionCounter).padStart(12, "0")}`
    )
  ) {
    demoSessionCounter += 1;
  }
  const id = `00000000-0000-4000-8000-${String(demoSessionCounter).padStart(12, "0")}`;
  demoSessionCounter += 1;
  return id;
}

export interface ExtendedSessionsDiscoveryService extends SessionsDiscoveryService {
  createSession(input: CreateSessionInput, verifiedHostId?: string): Promise<SessionPreview>;
  getSession(sessionId: string, viewerId?: string | null): Promise<SessionDetail | null>;
}

/**
 * Workstream 2: Discovery and Creation service backed by real Supabase
 * database and auth, with deterministic mock fallback for offline and demo modes.
 */
export const sessionsDiscoveryService: ExtendedSessionsDiscoveryService = {
  async listSessions(filters: SessionFilters = {}) {
    // 1. If Supabase is configured, fetch live sessions from the database
    let dbSessions: SessionPreview[] = [];
    if (isSupabaseConfigured) {
      const live = await fetchDbSessions(filters);
      if (live) {
        dbSessions = live;
      }
    }

    // 2. Fetch mock sessions that match filters and aren't superseded by DB sessions
    const mockSessions = mockStore.sessions
      .filter((session) => !dbSessions.some((db) => db.id === session.id))
      .filter((session) => !filters.courseCode || session.courseCode === filters.courseCode)
      .filter((session) => !filters.libraryName || session.libraryName === filters.libraryName)
      .filter((session) => (filters.status ? session.status === filters.status : session.status !== "closed"))
      .map(toSessionPreview);

    // Live database sessions take priority at the top, followed by mock seed sessions
    return [...dbSessions, ...mockSessions];
  },

  async getSession(sessionId: string, viewerId?: string | null) {
    // 1. Try fetching from Supabase database first
    if (isSupabaseConfigured) {
      const dbDetail = await fetchDbSessionDetail(sessionId, viewerId);
      if (dbDetail) {
        return dbDetail;
      }
    }

    // 2. Fall back to process-local mock fixtures
    const session = mockStore.sessions.find((item) => item.id === sessionId);
    if (!session) return null;

    const access = getMockSessionAccess(sessionId);
    return {
      session: toSessionPreview(session),
      access,
      location:
        access === "locked"
          ? null
          : structuredClone({
              tableId: session.tableId,
              surroundingsPhotoUrl: session.surroundingsPhotoUrl,
              gpsCoordinates: session.gpsCoordinates,
            }),
    };
  },

  async createSession(input: CreateSessionInput, verifiedHostId?: string) {
    const parsed = createSessionSchema.safeParse(input);
    if (!parsed.success) {
      throw new SessionInputValidationError();
    }

    // Path A: Authenticated user with real Supabase database
    if (isSupabaseConfigured && verifiedHostId && verifiedHostId !== "demo") {
      try {
        return await insertDbSession(parsed.data, verifiedHostId);
      } catch (err) {
        console.error("[SessionsDiscovery] Failed to persist session in Supabase:", err);
        throw new SessionCreationUnavailableError("persistence_unavailable");
      }
    }

    // Path B: Demo / offline mode
    const isDemoAllowed =
      !isSupabaseConfigured ||
      process.env.BUCKEYSTUDY_DEMO_MODE === "true" ||
      verifiedHostId === "demo";

    if (!isDemoAllowed && !verifiedHostId) {
      throw new SessionCreationUnavailableError("missing_identity");
    }

    const hostId = verifiedHostId && verifiedHostId !== "demo" ? verifiedHostId : mockViewerId;
    const session: StudySession = {
      ...structuredClone(parsed.data),
      id: nextDemoSessionId(),
      hostId,
      aiTopicTags: [parsed.data.courseCode, "Ohio State Study"],
      createdAt: new Date().toISOString(),
    };

    mockStore.sessions.unshift(session);
    return toSessionPreview(session);
  },

  async closeSession(sessionId: string) {
    // 1. Close in Supabase database if present
    if (isSupabaseConfigured) {
      const client = getSupabaseAdminClient();
      if (client) {
        await client.from("study_sessions").update({ status: "closed" }).eq("id", sessionId);
      }
    }

    // 2. Close in local mock store if present
    const mockSession = mockStore.sessions.find((s) => s.id === sessionId);
    if (mockSession) {
      mockSession.status = "closed";
    }
  },

  async uploadSurroundingsPhoto(sessionId: string, file: File) {
    if (!isSupabaseConfigured) {
      return { storagePath: `surroundings/demo-${sessionId}.jpg` };
    }
    const client = getSupabaseAdminClient();
    if (!client) {
      throw new Error("Storage client is unavailable.");
    }
    const storagePath = `surroundings/${sessionId}-${Date.now()}.jpg`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error } = await client.storage.from("surroundings").upload(storagePath, buffer, {
      contentType: file.type || "image/jpeg",
      upsert: true,
    });
    if (error) {
      console.warn("[SessionsDiscovery] Photo upload error:", error.message);
      return { storagePath: "" };
    }
    return { storagePath };
  },
};
