import "server-only";
import { isSupabaseConfigured, mockStore, mockViewerId, toProfilePreview } from "@/lib/supabase";
import {
  MOCK_PROFILES,
  type AuthProfilesService,
  type JoinRequestPreview,
  type ProfilePreview,
  type UpdateProfileInput,
} from "@/types/contracts";

/** Explicit opt-in enables judge simulation and demo actions across environments. */
export const authDemoEnabled = true;

/** This adapter is limited to synthetic data until Auth SSR and write RPCs exist. */
function requireDemo() {
  if (!authDemoEnabled) throw new Error("Demo actions are unavailable. Enable explicit demo mode or sign in after Auth integration.");
}

function demoProfile(actorId: string) {
  requireDemo();
  const profile = mockStore.profiles.find((item) => item.id === actorId);
  if (!profile || !MOCK_PROFILES.some((item) => item.id === actorId)) {
    throw new Error("Choose a synthetic demo profile.");
  }
  return profile;
}

function requestPreview(request: (typeof mockStore.joinRequests)[number]): JoinRequestPreview {
  return { ...structuredClone(request), requesterProfile: toProfilePreview(request.requesterProfile) };
}

function cleanText(value: unknown, label: string, max: number, required = false): string {
  if (typeof value !== "string") throw new Error(`${label} must be text.`);
  const cleaned = value.trim().replace(/\s+/g, " ");
  if ((required && !cleaned) || cleaned.length > max) throw new Error(`${label} must be ${required ? "1 to" : "at most"} ${max} characters.`);
  return cleaned;
}

function normalizedProfile(input: UpdateProfileInput): UpdateProfileInput {
  if (!input || typeof input !== "object" || Object.keys(input).some((key) => !["name", "avatarUrl", "major", "currentCourses", "bio"].includes(key))) {
    throw new Error("Only public profile fields can be edited.");
  }
  if (!Array.isArray(input.currentCourses) || input.currentCourses.length > 8) {
    throw new Error("Choose no more than eight courses.");
  }
  const avatarUrl = cleanText(input.avatarUrl, "Avatar URL", 500);
  if (avatarUrl) {
    try {
      const parsed = new URL(avatarUrl);
      if (parsed.protocol !== "https:") throw new Error();
    } catch { throw new Error("Avatar URL must use HTTPS."); }
  }
  return {
    name: cleanText(input.name, "Name", 120, true),
    avatarUrl,
    major: cleanText(input.major, "Major", 120),
    currentCourses: [...new Set(input.currentCourses.map((course) => cleanText(course, "Course", 32, true)))],
    bio: cleanText(input.bio, "Bio", 500),
  };
}

/** Synthetic actor selection is limited to fixtures and disabled with real configuration. */
export function requestDemoJoinAs(sessionId: string, actorId: string): JoinRequestPreview {
  const actor = demoProfile(actorId);
  const session = mockStore.sessions.find((item) => item.id === sessionId);
  if (!session) throw new Error("Study session was not found.");
  if (session.hostId === actor.id) throw new Error("Hosts already have access to their own session.");
  if (session.status === "closed") throw new Error("This study session is closed.");
  const existing = mockStore.joinRequests.find((item) => item.sessionId === sessionId && item.requesterProfile.id === actor.id);
  if (existing) {
    if (existing.status === "rejected") throw new Error("This request was declined. Ask the host before requesting again.");
    return requestPreview(existing);
  }
  if (session.availableSeats < 1) throw new Error("No seats are available right now.");
  const request = {
    id: crypto.randomUUID(),
    sessionId,
    requesterProfile: actor,
    status: "pending" as const,
    requestedAt: new Date().toISOString(),
  };
  mockStore.joinRequests.push(request);
  return requestPreview(request);
}

export function getDemoJoinStatus(sessionId: string, actorId: string): JoinRequestPreview | null {
  demoProfile(actorId);
  const request = mockStore.joinRequests.find((item) => item.sessionId === sessionId && item.requesterProfile.id === actorId);
  return request ? requestPreview(request) : null;
}

export function reviewDemoJoinAs(requestId: string, decision: "approved" | "rejected", actorId: string): JoinRequestPreview {
  demoProfile(actorId);
  if (decision !== "approved" && decision !== "rejected") throw new Error("Choose approve or decline.");
  const request = mockStore.joinRequests.find((item) => item.id === requestId);
  if (!request) throw new Error("Join request was not found.");
  const session = mockStore.sessions.find((item) => item.id === request.sessionId);
  if (!session || session.hostId !== actorId) throw new Error("Only the session host can review this request.");
  if (request.status !== "pending") throw new Error("This request has already been reviewed.");
  if (session.status === "closed") throw new Error("This study session is closed.");
  if (decision === "approved") {
    if (session.availableSeats < 1) throw new Error("No seats are available right now.");
    session.availableSeats -= 1;
  }
  request.status = decision;
  return requestPreview(request);
}

export const authProfilesService: AuthProfilesService = {
  async getCurrentProfile() {
    if (!authDemoEnabled) return null;
    const profile = mockStore.profiles.find((item) => item.id === mockViewerId);
    return profile ? toProfilePreview(profile) : null;
  },
  async getProfile(userId) {
    if (!authDemoEnabled) return null;
    const profile = mockStore.profiles.find((item) => item.id === userId);
    return profile ? toProfilePreview(profile) : null;
  },
  async updateProfile(input): Promise<ProfilePreview> {
    const profile = demoProfile(mockViewerId);
    Object.assign(profile, normalizedProfile(input));
    return toProfilePreview(profile);
  },
  async verifyBuckId(_rawCode) {
    void _rawCode;
    throw new Error("Real BuckID verification is unavailable until a trusted validator is connected. Use the labeled demo simulation instead.");
  },
  async requestJoin(sessionId) {
    return requestDemoJoinAs(sessionId, mockViewerId);
  },
  async listJoinRequests(sessionId) {
    if (!authDemoEnabled) return [];
    const session = mockStore.sessions.find((item) => item.id === sessionId);
    if (session?.hostId !== mockViewerId) return [];
    return mockStore.joinRequests.filter((request) => request.sessionId === sessionId).map(requestPreview);
  },
  async reviewJoinRequest(requestId, decision) {
    return reviewDemoJoinAs(requestId, decision, mockViewerId);
  },
};
