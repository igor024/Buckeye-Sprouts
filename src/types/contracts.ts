/**
 * SINGLE SOURCE OF TRUTH. Coordinate changes here before editing shared shapes.
 * Dates are ISO 8601 strings; coordinates use WGS84 decimal degrees.
 * Full domain objects are internal. Public surfaces use the safe projections below.
 */
export interface UserProfile {
  id: string;
  name: string;
  buckIdHash: string;
  avatarUrl: string;
  major: string;
  currentCourses: string[];
  bio: string;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface StudySession {
  id: string;
  hostId: string;
  title: string;
  subtitle: string;
  courseCode: string;
  libraryName: string;
  tableId: string;
  totalSeats: number;
  availableSeats: number;
  surroundingsPhotoUrl: string;
  requiresApproval: boolean;
  status: "scheduled" | "active" | "closed";
  scheduledFor?: string;
  gpsCoordinates: Coordinates;
  aiTopicTags: string[];
  createdAt: string;
  /** Broad discovery location; exact table and GPS remain private. */
  floor?: string;
  zone?: string;
}

export interface JoinRequest {
  id: string;
  sessionId: string;
  requesterProfile: UserProfile;
  status: "pending" | "approved" | "rejected";
  requestedAt: string;
}

export interface SharedNotebook {
  sessionId: string;
  content: string;
  lastUpdatedBy: string;
  aiSummary: string;
  aiSuggestions: string[];
  updatedAt: string;
}

export interface CheckInPayload {
  method: "table_qr" | "buck_id";
  rawCode: string;
  tableId: string;
  libraryName: string;
  gps: Coordinates;
}

/** Never send BuckID hashes to profile cards or join-request queues. */
export type ProfilePreview = Omit<UserProfile, "buckIdHash">;
/** Never spread StudySession onto a public response or client component. */
export type SessionPreview = Omit<
  StudySession,
  "tableId" | "surroundingsPhotoUrl" | "gpsCoordinates"
>;
export type JoinRequestPreview = Omit<JoinRequest, "requesterProfile"> & {
  requesterProfile: ProfilePreview;
};

export interface SessionDetail {
  session: SessionPreview;
  location: Pick<StudySession, "tableId" | "surroundingsPhotoUrl" | "gpsCoordinates"> | null;
  access: "host" | "member" | "locked";
}

export interface SessionFilters {
  courseCode?: string;
  libraryName?: string;
  status?: StudySession["status"];
}

export type CreateSessionInput = Omit<StudySession, "id" | "hostId" | "createdAt" | "aiTopicTags">;
export type UpdateProfileInput = Pick<UserProfile, "name" | "avatarUrl" | "major" | "currentCourses" | "bio">;
export type Unsubscribe = () => void;

export interface AuthProfilesService {
  getCurrentProfile(): Promise<ProfilePreview | null>;
  getProfile(userId: string): Promise<ProfilePreview | null>;
  updateProfile(input: UpdateProfileInput): Promise<ProfilePreview>;
  verifyBuckId(rawCode: string): Promise<ProfilePreview>;
  requestJoin(sessionId: string): Promise<JoinRequestPreview>;
  listJoinRequests(sessionId: string): Promise<JoinRequestPreview[]>;
  reviewJoinRequest(requestId: string, decision: "approved" | "rejected"): Promise<JoinRequestPreview>;
}

export interface SessionsDiscoveryService {
  listSessions(filters?: SessionFilters): Promise<SessionPreview[]>;
  getSession(sessionId: string): Promise<SessionDetail | null>;
  createSession(input: CreateSessionInput): Promise<SessionPreview>;
  closeSession(sessionId: string): Promise<void>;
  uploadSurroundingsPhoto(sessionId: string, file: File): Promise<{ storagePath: string }>;
}

export interface LibraryGeofence {
  libraryName: string;
  center: Coordinates;
  radiusMeters: number;
}

export interface CheckInReceipt {
  id: string;
  sessionId: string;
  userId: string;
  method: CheckInPayload["method"];
  checkedInAt: string;
  checkedOutAt?: string;
}

export interface RoomBookingRequest {
  sessionId: string;
  libraryName: string;
  roomId: string;
  startsAt: string;
  endsAt: string;
}

export interface RoomBookingResponse {
  status: "stub" | "confirmed" | "unavailable";
  bookingId: string | null;
  message: string;
}

export interface LocationCheckInService {
  getCheckIn(sessionId: string): Promise<CheckInReceipt | null>;
  getGeofence(libraryName: string): Promise<LibraryGeofence | null>;
  checkIn(sessionId: string, payload: CheckInPayload): Promise<CheckInReceipt>;
  checkOut(sessionId: string): Promise<void>;
  /** Browser-only; implementation must clear the GPS watch on unsubscribe. */
  watchHostGeofence(sessionId: string, onExit: () => void): Unsubscribe;
  bookRoom(input: RoomBookingRequest): Promise<RoomBookingResponse>;
}

export interface NotebookPresence {
  userId: string;
  name: string;
  joinedAt: string;
}

/** Revision-based conflict handling is left to the notebook workstream. */
export interface NotebookEvent {
  type: "notebook.updated" | "presence.synced";
  sessionId: string;
  notebook?: SharedNotebook;
  members?: NotebookPresence[];
}

export interface AISummarizeRequest {
  sessionId: string;
  mode: "catch_me_up" | "ambient";
}

export interface AISummarizeResponse {
  sessionId: string;
  summary: string;
  topicTags: string[];
  source: "mock" | "ai";
}

export interface AIFeedbackRequest {
  sessionId: string;
  question: string;
  selection?: string;
}

/** POST /api/ai/feedback returns UTF-8 text/plain chunks. */
export interface NotebookAIService {
  getNotebook(sessionId: string): Promise<SharedNotebook | null>;
  saveNotebook(sessionId: string, content: string): Promise<SharedNotebook>;
  subscribe(sessionId: string, onEvent: (event: NotebookEvent) => void): Promise<Unsubscribe>;
  summarize(input: AISummarizeRequest): Promise<AISummarizeResponse>;
  streamFeedback(input: AIFeedbackRequest, signal?: AbortSignal): Promise<ReadableStream<Uint8Array>>;
}

export interface ApiError {
  error: { code: "INVALID_REQUEST" | "NOT_FOUND" | "FORBIDDEN" | "NOT_IMPLEMENTED"; message: string };
}

export class FeatureNotImplementedError extends Error {
  constructor(operation: string) {
    super(`${operation} is a scaffold stub. Implement it inside its owning feature folder.`);
    this.name = "FeatureNotImplementedError";
  }
}

// Synthetic fixtures only: never put a real BuckID, its raw scan, or its hash here.
export const MOCK_PROFILES: UserProfile[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    name: "Alex Morgan",
    buckIdHash: "demo-hash-alex-not-a-real-identity",
    avatarUrl: "",
    major: "Computer Science & Engineering",
    currentCourses: ["CSE 2221", "MATH 1151"],
    bio: "Working through software components, one coffee at a time.",
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    name: "Jordan Lee",
    buckIdHash: "demo-hash-jordan-not-a-real-identity",
    avatarUrl: "",
    major: "Mathematics",
    currentCourses: ["MATH 1151", "STAT 3470"],
    bio: "Happy to trade calculus explanations for a fresh perspective.",
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    name: "Sam Patel",
    buckIdHash: "demo-hash-sam-not-a-real-identity",
    avatarUrl: "",
    major: "Computer Science & Engineering",
    currentCourses: ["CSE 2221", "CSE 2321"],
    bio: "Looking for a small group to review recursion together.",
  },
];

export const MOCK_SESSIONS: StudySession[] = [
  {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    hostId: MOCK_PROFILES[0].id,
    title: "Let's untangle recursion",
    subtitle: "Components, practice problems, and a little moral support.",
    courseCode: "CSE 2221",
    libraryName: "Thompson Library",
    tableId: "THO-3-E12",
    floor: "Floor 3",
    zone: "East study area",
    totalSeats: 5,
    availableSeats: 3,
    surroundingsPhotoUrl: "",
    requiresApproval: true,
    status: "active",
    gpsCoordinates: { lat: 40.0001, lng: -83.0146 },
    aiTopicTags: ["Recursion", "Java", "Software components"],
    createdAt: "2026-10-24T14:00:00.000Z",
  },
  {
    id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    hostId: MOCK_PROFILES[1].id,
    title: "Calculus, together",
    subtitle: "A low-pressure review of limits and derivatives.",
    courseCode: "MATH 1151",
    libraryName: "18th Avenue Library",
    tableId: "18AV-2-N04",
    floor: "Floor 2",
    zone: "Collaborative zone",
    totalSeats: 4,
    availableSeats: 2,
    surroundingsPhotoUrl: "",
    requiresApproval: true,
    status: "scheduled",
    scheduledFor: "2026-10-24T19:00:00.000Z",
    gpsCoordinates: { lat: 40.0025, lng: -83.0092 },
    aiTopicTags: ["Limits", "Derivatives"],
    createdAt: "2026-10-24T13:00:00.000Z",
  },
];

export const MOCK_JOIN_REQUESTS: JoinRequest[] = [
  {
    id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    sessionId: MOCK_SESSIONS[0].id,
    requesterProfile: MOCK_PROFILES[2],
    status: "pending",
    requestedAt: "2026-10-24T14:15:00.000Z",
  },
];

export const MOCK_NOTEBOOKS: SharedNotebook[] = [
  {
    sessionId: MOCK_SESSIONS[0].id,
    content: "# CSE 2221 · Recursion review\n\n## Questions to work through\n- What makes a good base case?\n- Trace a recursive call using a small example.\n\n## Next up\nCompare recursive and iterative solutions together.",
    lastUpdatedBy: MOCK_PROFILES[0].id,
    aiSummary: "The group is reviewing base cases and tracing recursive calls in Java.",
    aiSuggestions: ["Try tracing a three-element example.", "Explain why the base case terminates."],
    updatedAt: "2026-10-24T14:20:00.000Z",
  },
];

export const MOCK_GEOFENCES: LibraryGeofence[] = [
  { libraryName: "Thompson Library", center: { lat: 40.0001, lng: -83.0146 }, radiusMeters: 100 },
  { libraryName: "18th Avenue Library", center: { lat: 40.0025, lng: -83.0092 }, radiusMeters: 85 },
];

export const MOCK_CHECK_INS: CheckInReceipt[] = [
  {
    id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
    sessionId: MOCK_SESSIONS[0].id,
    userId: MOCK_PROFILES[0].id,
    method: "table_qr",
    checkedInAt: "2026-10-24T14:00:00.000Z",
  },
];
