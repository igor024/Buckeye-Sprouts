import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured, mockStore, mockViewerId, toProfilePreview } from "@/lib/supabase";
import {
  MOCK_PROFILES,
  type AuthProfilesService,
  type JoinRequestPreview,
  type ProfilePreview,
  type StudySession,
  type UpdateProfileInput,
} from "@/types/contracts";

/** Explicit opt-in enables judge simulation and demo actions across environments. */
export const authDemoEnabled = true;

let adminClient: SupabaseClient | null = null;
function getSupabaseAdmin(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  if (!adminClient) {
    adminClient = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return adminClient;
}

/** Resolves a session from in-memory mock store or live Supabase database. */
export async function resolveSession(sessionId: string): Promise<StudySession | null> {
  const local = mockStore.sessions.find((item) => item.id === sessionId);
  if (local) return local;

  if (isSupabaseConfigured) {
    const admin = getSupabaseAdmin();
    if (admin) {
      const { data: dbSession } = await admin
        .from("study_sessions")
        .select("*")
        .eq("id", sessionId)
        .maybeSingle();

      if (dbSession) {
        const session: StudySession = {
          id: dbSession.id,
          hostId: dbSession.host_id,
          title: dbSession.title,
          subtitle: dbSession.subtitle || "",
          courseCode: dbSession.course_code,
          libraryName: dbSession.library_name,
          floor: dbSession.floor || undefined,
          zone: dbSession.zone || undefined,
          tableId: "TABLE-ANCHOR",
          totalSeats: dbSession.total_seats,
          availableSeats: dbSession.available_seats,
          surroundingsPhotoUrl: "",
          requiresApproval: dbSession.requires_approval,
          status: dbSession.status,
          gpsCoordinates: { lat: 40.0001, lng: -83.0146 },
          aiTopicTags: Array.isArray(dbSession.ai_topic_tags) ? dbSession.ai_topic_tags : [],
          createdAt: dbSession.created_at,
        };
        mockStore.sessions.push(session);
        return session;
      }
    }
  }

  return null;
}

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

/** Synthetic actor selection supports both in-memory mock sessions and live database sessions. */
export async function requestDemoJoinAs(sessionId: string, actorId: string): Promise<JoinRequestPreview> {
  const actor = demoProfile(actorId);
  const session = await resolveSession(sessionId);
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

export async function getDemoJoinStatus(sessionId: string, actorId: string): Promise<JoinRequestPreview | null> {
  demoProfile(actorId);
  const request = mockStore.joinRequests.find((item) => item.sessionId === sessionId && item.requesterProfile.id === actorId);
  return request ? requestPreview(request) : null;
}

export async function reviewDemoJoinAs(
  requestId: string,
  decision: "approved" | "rejected",
  _actorId?: string
): Promise<JoinRequestPreview> {
  if (decision !== "approved" && decision !== "rejected") throw new Error("Choose approve or decline.");

  // 1. Check in-memory mock store
  const mockReq = mockStore.joinRequests.find((item) => item.id === requestId);
  if (mockReq) {
    const session = await resolveSession(mockReq.sessionId);
    if (!session) throw new Error("Study session was not found.");
    if (mockReq.status !== "pending") throw new Error("This request has already been reviewed.");
    if (session.status === "closed") throw new Error("This study session is closed.");

    if (decision === "approved") {
      if (session.availableSeats < 1) throw new Error("No seats are available right now.");
      session.availableSeats -= 1;
      if (isSupabaseConfigured) {
        const admin = getSupabaseAdmin();
        if (admin) {
          await admin.from("study_sessions").update({ available_seats: session.availableSeats }).eq("id", session.id);
        }
      }
    }

    mockReq.status = decision;
    return requestPreview(mockReq);
  }

  // 2. Check Supabase database if configured
  if (isSupabaseConfigured) {
    const admin = getSupabaseAdmin();
    if (admin) {
      const { data: dbReq } = await admin
        .from("join_requests")
        .select("id, session_id, requester_id, status, requested_at, profiles(id, name, avatar_url, major, current_courses, bio)")
        .eq("id", requestId)
        .maybeSingle();

      if (dbReq) {
        if (dbReq.status !== "pending") throw new Error("This request has already been reviewed.");
        const session = await resolveSession(dbReq.session_id);
        if (session && session.status === "closed") throw new Error("This study session is closed.");

        if (decision === "approved") {
          if (session && session.availableSeats < 1) throw new Error("No seats are available right now.");
          if (session) {
            session.availableSeats = Math.max(0, session.availableSeats - 1);
            await admin.from("study_sessions").update({ available_seats: session.availableSeats }).eq("id", session.id);
          }
        }

        const { error: updateErr } = await admin
          .from("join_requests")
          .update({ status: decision })
          .eq("id", requestId);

        if (updateErr) {
          console.error("[AuthProfiles] Failed to update join request status in DB:", updateErr);
          throw new Error("Failed to update join request in database.");
        }

        const p = (dbReq as any).profiles;
        return {
          id: dbReq.id,
          sessionId: dbReq.session_id,
          status: decision,
          requestedAt: dbReq.requested_at,
          requesterProfile: {
            id: p?.id || dbReq.requester_id,
            name: p?.name || "Buckeye Student",
            avatarUrl: p?.avatar_url || "",
            major: p?.major || "Undeclared",
            currentCourses: Array.isArray(p?.current_courses) ? p.current_courses : [],
            bio: p?.bio || "",
          },
        };
      }
    }
  }

  throw new Error("Join request was not found.");
}

/** Simulates an incoming join request from a pre-configured mock profile for judging & testing. */
export async function simulateDemoJoinAs(sessionId: string, actorIndex = 1): Promise<JoinRequestPreview> {
  const actor = MOCK_PROFILES[actorIndex % MOCK_PROFILES.length];
  const session = await resolveSession(sessionId);
  if (!session) throw new Error("Study session was not found.");

  const existing = mockStore.joinRequests.find(
    (item) => item.sessionId === sessionId && item.requesterProfile.id === actor.id
  );

  if (existing) {
    existing.status = "pending";
    existing.requestedAt = new Date().toISOString();
    return requestPreview(existing);
  }

  const request = {
    id: crypto.randomUUID(),
    sessionId,
    requesterProfile: actor,
    status: "pending" as const,
    requestedAt: new Date().toISOString(),
  };

  mockStore.joinRequests.unshift(request);
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
    // 1. Fetch from live Supabase join_requests if configured
    let dbRequests: JoinRequestPreview[] = [];
    if (isSupabaseConfigured) {
      const admin = getSupabaseAdmin();
      if (admin) {
        const { data: rows } = await admin
          .from("join_requests")
          .select("id, session_id, status, requested_at, requester_id, profiles(id, name, avatar_url, major, current_courses, bio)")
          .eq("session_id", sessionId);

        if (rows) {
          dbRequests = (rows as any[]).map((r) => ({
            id: r.id,
            sessionId: r.session_id,
            status: r.status,
            requestedAt: r.requested_at,
            requesterProfile: {
              id: r.profiles?.id || r.requester_id,
              name: r.profiles?.name || "Buckeye Student",
              avatarUrl: r.profiles?.avatar_url || "",
              major: r.profiles?.major || "Undeclared",
              currentCourses: r.profiles?.current_courses || [],
              bio: r.profiles?.bio || "",
            },
          }));
        }
      }
    }

    // 2. Fetch from local mock store
    const mockRequests = mockStore.joinRequests
      .filter((request) => request.sessionId === sessionId && !dbRequests.some((d) => d.id === request.id))
      .map(requestPreview);

    return [...dbRequests, ...mockRequests];
  },
  async reviewJoinRequest(requestId, decision) {
    return reviewDemoJoinAs(requestId, decision, mockViewerId);
  },
};
