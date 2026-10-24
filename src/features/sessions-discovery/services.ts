import "server-only";
import { getMockSessionAccess, mockStore, toSessionPreview } from "@/lib/supabase";
import { FeatureNotImplementedError, type SessionsDiscoveryService } from "@/types/contracts";

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
  async createSession() { throw new FeatureNotImplementedError("createSession"); },
  async closeSession() { throw new FeatureNotImplementedError("closeSession"); },
  async uploadSurroundingsPhoto() { throw new FeatureNotImplementedError("uploadSurroundingsPhoto"); },
};
