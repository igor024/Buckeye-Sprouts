import "server-only";
import { createClient } from "@supabase/supabase-js";
import {
  MOCK_CHECK_INS,
  MOCK_GEOFENCES,
  MOCK_JOIN_REQUESTS,
  MOCK_NOTEBOOKS,
  MOCK_PROFILES,
  MOCK_SESSIONS,
  type ProfilePreview,
  type SessionPreview,
  type StudySession,
  type UserProfile,
} from "@/types/contracts";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && key);
/** Null means offline development. Never substitute a service-role key here. */
export const supabase = url && key ? createClient(url, key) : null;

export function createMockStore() {
  return structuredClone({
    profiles: MOCK_PROFILES,
    sessions: MOCK_SESSIONS,
    joinRequests: MOCK_JOIN_REQUESTS,
    notebooks: MOCK_NOTEBOOKS,
    geofences: MOCK_GEOFENCES,
    checkIns: MOCK_CHECK_INS,
  });
}

/**
 * Process-local fixtures, not persistence or real auth. Browser and server stores
 * are separate, and serverless instances do not share memory. No raw scans stored.
 * Keep imports of this store inside service adapters, not client components.
 */
export const mockStore = createMockStore();
export const mockViewerId = MOCK_PROFILES[0].id;
export const serviceMode = "mock" as const;

export function toProfilePreview(profile: UserProfile): ProfilePreview {
  const { buckIdHash: _privateHash, ...safe } = profile;
  void _privateHash;
  return structuredClone(safe);
}

export function toSessionPreview(session: StudySession): SessionPreview {
  const { tableId: _table, surroundingsPhotoUrl: _photo, gpsCoordinates: _gps, ...safe } = session;
  void [_table, _photo, _gps];
  return structuredClone(safe);
}

/** Mock identity only. Production adapters must derive identity from Supabase Auth. */
export function getMockSessionAccess(sessionId: string): "host" | "member" | "locked" {
  const session = mockStore.sessions.find((item) => item.id === sessionId);
  if (session?.hostId === mockViewerId) return "host";
  const approved = mockStore.joinRequests.some(
    (request) => request.sessionId === sessionId && request.requesterProfile.id === mockViewerId && request.status === "approved",
  );
  return approved ? "member" : "locked";
}
