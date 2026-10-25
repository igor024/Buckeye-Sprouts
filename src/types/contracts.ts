/**
 * SINGLE SOURCE OF TRUTH. Coordinate changes here before editing shared shapes.
 * Dates are ISO 8601 strings; geographic coordinates use WGS84 decimal degrees.
 * Illustration x/y positions are normalized percentages, not geographic coordinates.
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

/** A normalized position within local illustrative map artwork (0–100 on each axis). */
export interface IllustrativeMapPosition {
  x: number;
  y: number;
}

/** Positions/sizes in the campus SVG's 430 × 940 drawing coordinate space. */
export interface CampusMapArtPoint {
  x: number;
  y: number;
}

export interface CampusMapViewport {
  width: number;
  height: number;
}

/** A simulated reader resolves an illustrative table, never a physical NFC tag. */
export interface DemoReaderLocation {
  tableId: string;
  point: CampusMapArtPoint;
  source: "device" | "demo";
  usedFallback: boolean;
}

export interface CampusMapBuilding extends CampusMapArtPoint {
  w: number;
  h: number;
  turn: number;
}

export type CampusMapLandmarkIcon = "stadium" | "union" | "oval" | "library" | "lake" | "building";

export interface CampusMapLandmark extends CampusMapArtPoint {
  name: string;
  icon: CampusMapLandmarkIcon;
}

export interface CampusMapView {
  /** Scale 1 is the full campus drawing; larger values zoom in. */
  scale: number;
  /** Screen-pixel translation applied to the centered map camera. */
  x: number;
  y: number;
}

export const CAMPUS_MAP_ARTWORK_SIZE = { width: 430, height: 940 } as const;
export const CAMPUS_MAP_GEO_BOUNDS = { north: 40.012, south: 39.985, west: -83.027, east: -83.001 } as const;
export const CAMPUS_MAP_DEMO_LOCATION: CampusMapArtPoint = { x: 274, y: 420 };
export const CAMPUS_MAP_ZOOM_LIMITS = {
  minScale: 1,
  maxScale: 3.6,
  focusScale: 1.7,
  /** Keep at least this much of Thompson's floor-plan area visible while its plan is open. */
  minThompsonVisibleArea: 0.5,
} as const;

export const CAMPUS_MAP_BUILDINGS = [
  { x: 84, y: 95, w: 78, h: 37, turn: -3 }, { x: 195, y: 85, w: 74, h: 42, turn: 2 },
  { x: 64, y: 211, w: 49, h: 31, turn: 2 }, { x: 139, y: 217, w: 62, h: 37, turn: -2 },
  { x: 229, y: 207, w: 56, h: 32, turn: 2 }, { x: 318, y: 190, w: 43, h: 47, turn: -3 },
  { x: 54, y: 286, w: 63, h: 39, turn: -2 }, { x: 139, y: 292, w: 57, h: 42, turn: 3 },
  { x: 228, y: 288, w: 67, h: 38, turn: -2 }, { x: 320, y: 282, w: 49, h: 42, turn: 1 },
  { x: 72, y: 457, w: 58, h: 36, turn: 3 }, { x: 151, y: 470, w: 57, h: 33, turn: -3 },
  { x: 288, y: 462, w: 58, h: 38, turn: 2 }, { x: 55, y: 565, w: 53, h: 41, turn: -2 },
  { x: 146, y: 575, w: 61, h: 33, turn: 2 }, { x: 287, y: 557, w: 58, h: 39, turn: -2 },
  { x: 61, y: 651, w: 50, h: 36, turn: 2 }, { x: 139, y: 658, w: 60, h: 39, turn: -1 },
  { x: 219, y: 647, w: 62, h: 33, turn: 2 }, { x: 315, y: 654, w: 50, h: 42, turn: -3 },
  { x: 70, y: 774, w: 69, h: 42, turn: 1 }, { x: 167, y: 783, w: 61, h: 38, turn: -2 },
  { x: 256, y: 779, w: 66, h: 43, turn: 2 }, { x: 117, y: 865, w: 66, h: 36, turn: 2 },
  { x: 230, y: 858, w: 78, h: 40, turn: -2 },
] as const satisfies readonly CampusMapBuilding[];

export const CAMPUS_MAP_LANDMARKS = [
  { name: "Ohio Stadium", x: 119, y: 163, icon: "stadium" },
  { name: "Ohio Union", x: 299, y: 281, icon: "union" },
  { name: "The Oval", x: 169, y: 380, icon: "oval" },
  { name: "Thompson Library", x: 273, y: 411, icon: "library" },
  { name: "Mirror Lake", x: 247, y: 505, icon: "lake" },
  { name: "18th Avenue Library", x: 84, y: 523, icon: "library" },
  { name: "Student Activities Center", x: 307, y: 639, icon: "building" },
  { name: "RPAC", x: 296, y: 754, icon: "building" },
] as const satisfies readonly CampusMapLandmark[];

export interface CampusMapSpot extends IllustrativeMapPosition {
  id: string;
  label: string;
  detail: string;
  kind: "study" | "amenity" | "service" | "entrance";
}

/** Safe profile previews only; never include a full UserProfile in map discovery UI. */
export interface StudyGroupMapPin extends IllustrativeMapPosition {
  id: string;
  name: string;
  courseCode: string;
  topic: string;
  tableLabel: string;
  host: ProfilePreview;
  members: ProfilePreview[];
}

/** A group associated with a clickable Thompson Level 1 table. */
export interface ThompsonTableGroup {
  id: string;
  name: string;
  courseCode: string;
  topic: string;
  host: ProfilePreview;
  members: ProfilePreview[];
  inviteOnly?: boolean;
  invitedProfileIds?: string[];
}

/** Frontend-only membership, invitations and notes for the table-reader demo. */
export interface DemoStudyGroup extends ThompsonTableGroup {
  tableId: string;
  inviteOnly: boolean;
  invitedProfileIds: string[];
  joinedAtByProfileId: Record<string, number>;
  notebookContent: string;
}

export interface DemoGroupState {
  groups: DemoStudyGroup[];
  activeGroupId: string | null;
  notice: string;
}

export interface DemoCreateGroupInput {
  tableId: string;
  name: string;
  courseCode: string;
  inviteOnly: boolean;
}

export const DEMO_READER_DELAY_MS = 3000;
export const DEMO_GROUP_COURSES = [
  { code: "CSE 2221", name: "Software I" },
  { code: "CSE 2231", name: "Software II" },
  { code: "MATH 1151", name: "Calculus I" },
  { code: "MATH 1172", name: "Engineering Math" },
  { code: "ENGR 1181", name: "Fundamentals of Engineering" },
] as const;

/** User-facing occupancy states for the colored Thompson table controls. */
export type ThompsonTableStatus = "empty" | "busy" | "very-busy";

/** Decorative map characters: green tables have none, yellow one, orange two. */
export const THOMPSON_TABLE_SPROUT_COUNTS: Readonly<Record<ThompsonTableStatus, number>> = {
  empty: 0,
  busy: 1,
  "very-busy": 2,
};

/** Uniform character height in floor-plan SVG units, independent of table size. */
export const THOMPSON_TABLE_SPROUT_HEIGHT = 20;

/** A colored table in the supplied Thompson Level 1 SVG. */
export interface ThompsonTable extends IllustrativeMapPosition {
  id: string;
  label: string;
  status: ThompsonTableStatus;
  width: number;
  height: number;
  groupId?: ThompsonTableGroup["id"];
  /** Only the named Jordan and Sam fixtures appear as Group Search rows. */
  showInSearch?: boolean;
}

export interface IndoorLibraryPlan {
  name: string;
  level: string;
  image: string;
  sourceSize: { width: number; height: number };
  campusPosition: IllustrativeMapPosition;
  mapOverlayWidthRatio: number;
  mapOverlayMaxWidth: number;
  spots: readonly CampusMapSpot[];
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

const toProfilePreview = (profile: UserProfile): ProfilePreview => ({
  id: profile.id,
  name: profile.name,
  avatarUrl: profile.avatarUrl,
  major: profile.major,
  currentCourses: profile.currentCourses,
  bio: profile.bio,
});

/** Frontend-only Thompson Level 1 demo groups shared with map and search UI. */
export const MOCK_STUDY_GROUP_PINS: StudyGroupMapPin[] = [
  {
    id: "jordan-cse-2221",
    name: "Jordan's Group",
    courseCode: "CSE 2221",
    topic: "Recursion and software components",
    tableLabel: "Table 145-1",
    x: 27,
    y: 29,
    host: toProfilePreview(MOCK_PROFILES[1]),
    members: [toProfilePreview(MOCK_PROFILES[2])],
  },
  {
    id: "sam-math-1151",
    name: "Sam's Group",
    courseCode: "MATH 1151",
    topic: "Limits and derivatives",
    tableLabel: "Table 140-1",
    x: 68,
    y: 49,
    host: toProfilePreview(MOCK_PROFILES[2]),
    members: [toProfilePreview(MOCK_PROFILES[1])],
  },
];

const THOMPSON_PLAN_SVG_SIZE = { width: 533, height: 775 } as const;
const TABLE_RECT_SIZE = { width: 21.7436, height: 20.3846 } as const;
const TABLE_105_RECT_SIZE = { width: 25.0435, height: 23.4783 } as const;

function tableFromSvgRect(
  id: string,
  label: string,
  status: ThompsonTableStatus,
  x: number,
  y: number,
  width: number,
  height: number,
): ThompsonTable {
  const groupId = status === "empty"
    ? undefined
    : id === "145-1"
      ? "jordan-cse-2221"
      : id === "140-1"
        ? "sam-math-1151"
        : `thompson-table-${id}`;

  return {
    id,
    label,
    status,
    x: (x + width / 2) / THOMPSON_PLAN_SVG_SIZE.width * 100,
    y: (y + height / 2) / THOMPSON_PLAN_SVG_SIZE.height * 100,
    width: width / THOMPSON_PLAN_SVG_SIZE.width * 100,
    height: height / THOMPSON_PLAN_SVG_SIZE.height * 100,
    ...(groupId ? { groupId } : {}),
    ...((id === "145-1" || id === "140-1") ? { showInSearch: true } : {}),
  };
}

/** Every colored table in the supplied Thompson Level 1 SVG. */
export const THOMPSON_EAST_ENTRANCE_TABLES: readonly ThompsonTable[] = [
  tableFromSvgRect("150b-1", "Table 150B-1", "busy", 479.1, 126.931, TABLE_RECT_SIZE.width, TABLE_RECT_SIZE.height),
  tableFromSvgRect("150b-2", "Table 150B-2", "very-busy", 505.844, 126.931, TABLE_RECT_SIZE.width, TABLE_RECT_SIZE.height),
  tableFromSvgRect("150a-1", "Table 150A-1", "empty", 452.1, 177.315, TABLE_RECT_SIZE.width, TABLE_RECT_SIZE.height),
  tableFromSvgRect("150a-2", "Table 150A-2", "empty", 478.844, 177.315, TABLE_RECT_SIZE.width, TABLE_RECT_SIZE.height),
  tableFromSvgRect("150a-3", "Table 150A-3", "very-busy", 505.587, 177.315, TABLE_RECT_SIZE.width, TABLE_RECT_SIZE.height),
  tableFromSvgRect("150a-4", "Table 150A-4", "empty", 452.1, 227.7, TABLE_RECT_SIZE.width, TABLE_RECT_SIZE.height),
  tableFromSvgRect("150a-5", "Table 150A-5", "very-busy", 478.844, 227.7, TABLE_RECT_SIZE.width, TABLE_RECT_SIZE.height),
  tableFromSvgRect("150a-6", "Table 150A-6", "very-busy", 505.587, 227.7, TABLE_RECT_SIZE.width, TABLE_RECT_SIZE.height),

  tableFromSvgRect("110-1", "Table 110-1", "busy", 119.1, 448.931, 32, 66),
  tableFromSvgRect("110-2", "Table 110-2", "very-busy", 162.1, 448.931, 32, 66),
  tableFromSvgRect("110-3", "Table 110-3", "empty", 119.1, 525.931, 32, 45),
  tableFromSvgRect("110-4", "Table 110-4", "very-busy", 162.1, 525.931, 32, 45),

  tableFromSvgRect("140-1", "Table 140-1", "busy", 334.1, 135.931, TABLE_RECT_SIZE.width, TABLE_RECT_SIZE.height),
  tableFromSvgRect("140-2", "Table 140-2", "very-busy", 360.844, 135.931, TABLE_RECT_SIZE.width, TABLE_RECT_SIZE.height),
  tableFromSvgRect("140-3", "Table 140-3", "busy", 387.587, 135.931, TABLE_RECT_SIZE.width, TABLE_RECT_SIZE.height),
  tableFromSvgRect("140-4", "Table 140-4", "very-busy", 414.331, 135.931, TABLE_RECT_SIZE.width, TABLE_RECT_SIZE.height),
  tableFromSvgRect("140-5", "Table 140-5", "empty", 334.1, 161.315, TABLE_RECT_SIZE.width, TABLE_RECT_SIZE.height),
  tableFromSvgRect("140-6", "Table 140-6", "very-busy", 360.844, 161.315, TABLE_RECT_SIZE.width, TABLE_RECT_SIZE.height),
  tableFromSvgRect("140-7", "Table 140-7", "empty", 387.587, 161.315, TABLE_RECT_SIZE.width, TABLE_RECT_SIZE.height),
  tableFromSvgRect("140-8", "Table 140-8", "very-busy", 414.331, 161.315, TABLE_RECT_SIZE.width, TABLE_RECT_SIZE.height),
  tableFromSvgRect("140-9", "Table 140-9", "busy", 334.1, 217.931, TABLE_RECT_SIZE.width, TABLE_RECT_SIZE.height),
  tableFromSvgRect("140-10", "Table 140-10", "very-busy", 360.844, 217.931, TABLE_RECT_SIZE.width, TABLE_RECT_SIZE.height),
  tableFromSvgRect("140-11", "Table 140-11", "busy", 387.587, 217.931, TABLE_RECT_SIZE.width, TABLE_RECT_SIZE.height),
  tableFromSvgRect("140-12", "Table 140-12", "very-busy", 414.331, 217.931, TABLE_RECT_SIZE.width, TABLE_RECT_SIZE.height),
  tableFromSvgRect("140-13", "Table 140-13", "empty", 334.1, 243.315, TABLE_RECT_SIZE.width, TABLE_RECT_SIZE.height),
  tableFromSvgRect("140-14", "Table 140-14", "very-busy", 360.844, 243.315, TABLE_RECT_SIZE.width, TABLE_RECT_SIZE.height),
  tableFromSvgRect("140-15", "Table 140-15", "empty", 387.587, 243.315, TABLE_RECT_SIZE.width, TABLE_RECT_SIZE.height),
  tableFromSvgRect("140-16", "Table 140-16", "very-busy", 414.331, 243.315, TABLE_RECT_SIZE.width, TABLE_RECT_SIZE.height),

  tableFromSvgRect("145-1", "Table 145-1", "busy", 95.1, 135.931, TABLE_RECT_SIZE.width, TABLE_RECT_SIZE.height),
  tableFromSvgRect("145-2", "Table 145-2", "very-busy", 121.844, 135.931, TABLE_RECT_SIZE.width, TABLE_RECT_SIZE.height),
  tableFromSvgRect("145-3", "Table 145-3", "busy", 148.587, 135.931, TABLE_RECT_SIZE.width, TABLE_RECT_SIZE.height),
  tableFromSvgRect("145-4", "Table 145-4", "very-busy", 175.331, 135.931, TABLE_RECT_SIZE.width, TABLE_RECT_SIZE.height),
  tableFromSvgRect("145-5", "Table 145-5", "empty", 95.1, 161.315, TABLE_RECT_SIZE.width, TABLE_RECT_SIZE.height),
  tableFromSvgRect("145-6", "Table 145-6", "very-busy", 121.844, 161.315, TABLE_RECT_SIZE.width, TABLE_RECT_SIZE.height),
  tableFromSvgRect("145-7", "Table 145-7", "empty", 148.587, 161.315, TABLE_RECT_SIZE.width, TABLE_RECT_SIZE.height),
  tableFromSvgRect("145-8", "Table 145-8", "very-busy", 175.331, 161.315, TABLE_RECT_SIZE.width, TABLE_RECT_SIZE.height),
  tableFromSvgRect("145-9", "Table 145-9", "busy", 95.1, 217.931, TABLE_RECT_SIZE.width, TABLE_RECT_SIZE.height),
  tableFromSvgRect("145-10", "Table 145-10", "very-busy", 121.844, 217.931, TABLE_RECT_SIZE.width, TABLE_RECT_SIZE.height),
  tableFromSvgRect("145-11", "Table 145-11", "busy", 148.587, 217.931, TABLE_RECT_SIZE.width, TABLE_RECT_SIZE.height),
  tableFromSvgRect("145-12", "Table 145-12", "very-busy", 175.331, 217.931, TABLE_RECT_SIZE.width, TABLE_RECT_SIZE.height),
  tableFromSvgRect("145-13", "Table 145-13", "empty", 95.1, 243.315, TABLE_RECT_SIZE.width, TABLE_RECT_SIZE.height),
  tableFromSvgRect("145-14", "Table 145-14", "very-busy", 121.844, 243.315, TABLE_RECT_SIZE.width, TABLE_RECT_SIZE.height),
  tableFromSvgRect("145-15", "Table 145-15", "empty", 148.587, 243.315, TABLE_RECT_SIZE.width, TABLE_RECT_SIZE.height),
  tableFromSvgRect("145-16", "Table 145-16", "very-busy", 175.331, 243.315, TABLE_RECT_SIZE.width, TABLE_RECT_SIZE.height),

  tableFromSvgRect("165-1", "Table 165-1", "busy", 125.1, 17.9305, TABLE_RECT_SIZE.width, TABLE_RECT_SIZE.height),
  tableFromSvgRect("165-2", "Table 165-2", "very-busy", 151.844, 17.9305, TABLE_RECT_SIZE.width, TABLE_RECT_SIZE.height),
  tableFromSvgRect("165-3", "Table 165-3", "busy", 178.587, 17.9305, TABLE_RECT_SIZE.width, TABLE_RECT_SIZE.height),
  tableFromSvgRect("165-4", "Table 165-4", "very-busy", 205.331, 17.9305, TABLE_RECT_SIZE.width, TABLE_RECT_SIZE.height),
  tableFromSvgRect("165-5", "Table 165-5", "empty", 125.1, 67.3151, TABLE_RECT_SIZE.width, TABLE_RECT_SIZE.height),
  tableFromSvgRect("165-6", "Table 165-6", "very-busy", 151.844, 67.3151, TABLE_RECT_SIZE.width, TABLE_RECT_SIZE.height),
  tableFromSvgRect("165-7", "Table 165-7", "empty", 178.587, 67.3151, TABLE_RECT_SIZE.width, TABLE_RECT_SIZE.height),
  tableFromSvgRect("165-8", "Table 165-8", "very-busy", 205.331, 67.3151, TABLE_RECT_SIZE.width, TABLE_RECT_SIZE.height),
  tableFromSvgRect("165-9", "Table 165-9", "busy", 205.1, 42.9305, TABLE_RECT_SIZE.width, TABLE_RECT_SIZE.height),
  tableFromSvgRect("165-10", "Table 165-10", "empty", 111.1, 42.9305, TABLE_RECT_SIZE.width, TABLE_RECT_SIZE.height),

  tableFromSvgRect("160-1", "Table 160-1", "busy", 385.3304, 17.9305, TABLE_RECT_SIZE.width, TABLE_RECT_SIZE.height),
  tableFromSvgRect("160-2", "Table 160-2", "very-busy", 358.5874, 17.9305, TABLE_RECT_SIZE.width, TABLE_RECT_SIZE.height),
  tableFromSvgRect("160-3", "Table 160-3", "busy", 331.8434, 17.9305, TABLE_RECT_SIZE.width, TABLE_RECT_SIZE.height),
  tableFromSvgRect("160-4", "Table 160-4", "very-busy", 305.1004, 17.9305, TABLE_RECT_SIZE.width, TABLE_RECT_SIZE.height),
  tableFromSvgRect("160-5", "Table 160-5", "empty", 385.3304, 67.3151, TABLE_RECT_SIZE.width, TABLE_RECT_SIZE.height),
  tableFromSvgRect("160-6", "Table 160-6", "very-busy", 358.5874, 67.3151, TABLE_RECT_SIZE.width, TABLE_RECT_SIZE.height),
  tableFromSvgRect("160-7", "Table 160-7", "empty", 331.8434, 67.3151, TABLE_RECT_SIZE.width, TABLE_RECT_SIZE.height),
  tableFromSvgRect("160-8", "Table 160-8", "very-busy", 305.1004, 67.3151, TABLE_RECT_SIZE.width, TABLE_RECT_SIZE.height),
  tableFromSvgRect("160-9", "Table 160-9", "busy", 305.3304, 42.9305, TABLE_RECT_SIZE.width, TABLE_RECT_SIZE.height),
  tableFromSvgRect("160-10", "Table 160-10", "empty", 399.3304, 42.9305, TABLE_RECT_SIZE.width, TABLE_RECT_SIZE.height),

  tableFromSvgRect("105-1", "Table 105-1", "empty", 16.1, 633.931, TABLE_105_RECT_SIZE.width, TABLE_105_RECT_SIZE.height),
  tableFromSvgRect("105-2", "Table 105-2", "very-busy", 50.1435, 633.931, TABLE_105_RECT_SIZE.width, TABLE_105_RECT_SIZE.height),
  tableFromSvgRect("105-3", "Table 105-3", "very-busy", 84.1865, 633.931, TABLE_105_RECT_SIZE.width, TABLE_105_RECT_SIZE.height),
  tableFromSvgRect("105-4", "Table 105-4", "empty", 118.2305, 633.931, TABLE_105_RECT_SIZE.width, TABLE_105_RECT_SIZE.height),
  tableFromSvgRect("105-5", "Table 105-5", "busy", 16.1, 698.409, TABLE_105_RECT_SIZE.width, TABLE_105_RECT_SIZE.height),
  tableFromSvgRect("105-6", "Table 105-6", "very-busy", 50.1435, 698.409, TABLE_105_RECT_SIZE.width, TABLE_105_RECT_SIZE.height),
  tableFromSvgRect("105-7", "Table 105-7", "very-busy", 84.1865, 698.409, TABLE_105_RECT_SIZE.width, TABLE_105_RECT_SIZE.height),
  tableFromSvgRect("105-8", "Table 105-8", "busy", 118.2305, 698.409, TABLE_105_RECT_SIZE.width, TABLE_105_RECT_SIZE.height),
] as const;

const TABLE_GROUP_TOPICS = [
  { courseCode: "CSE 2221", topic: "Recursion and software components" },
  { courseCode: "MATH 1151", topic: "Limits and derivatives" },
  { courseCode: "CSE 2321", topic: "Graph traversal practice" },
  { courseCode: "ENGR 1181", topic: "MATLAB lab prep" },
] as const;

function toTableGroup(group: StudyGroupMapPin): ThompsonTableGroup {
  return { id: group.id, name: group.name, courseCode: group.courseCode, topic: group.topic, host: group.host, members: group.members, inviteOnly: group.id === "sam-math-1151", invitedProfileIds: [] };
}

function createDemoTableGroup(table: ThompsonTable, index: number): ThompsonTableGroup {
  const host = toProfilePreview(MOCK_PROFILES[index % MOCK_PROFILES.length]);
  const members = MOCK_PROFILES.filter((profile) => profile.id !== host.id).map(toProfilePreview);
  const topic = TABLE_GROUP_TOPICS[index % TABLE_GROUP_TOPICS.length];
  return { id: table.groupId!, name: `${host.name.split(" ")[0]}'s Group`, courseCode: topic.courseCode, topic: topic.topic, host, members };
}

/** Details shown when a non-empty Thompson table is selected. */
export const MOCK_THOMPSON_TABLE_GROUPS: readonly ThompsonTableGroup[] = THOMPSON_EAST_ENTRANCE_TABLES
  .filter((table) => table.groupId)
  .map((table, index) => {
    if (table.groupId === MOCK_STUDY_GROUP_PINS[0].id) return toTableGroup(MOCK_STUDY_GROUP_PINS[0]);
    if (table.groupId === MOCK_STUDY_GROUP_PINS[1].id) return toTableGroup(MOCK_STUDY_GROUP_PINS[1]);
    return createDemoTableGroup(table, index);
  });

export const MOCK_DEMO_STUDY_GROUPS: readonly DemoStudyGroup[] = MOCK_THOMPSON_TABLE_GROUPS.map((group) => ({
  ...group,
  tableId: THOMPSON_EAST_ENTRANCE_TABLES.find((table) => table.groupId === group.id)!.id,
  inviteOnly: group.inviteOnly ?? false,
  invitedProfileIds: [...(group.invitedProfileIds ?? [])],
  joinedAtByProfileId: Object.fromEntries([group.host, ...group.members].map((member, index) => [member.id, index + 1])),
  notebookContent: `## ${group.courseCode} study notes\n[note] ${group.host.name} · Shared\n${group.topic}.`,
}));

/** Local floor plan artwork and its illustrative, normalized room positions. */
export const THOMPSON_EAST_ENTRANCE_PLAN = {
  name: "Thompson Library",
  level: "Oval / East Entrance",
  image: "/maps/floor-1-map.svg",
  sourceSize: { width: 533, height: 775 },
  campusPosition: { x: 278 / CAMPUS_MAP_ARTWORK_SIZE.width * 100, y: 410 / CAMPUS_MAP_ARTWORK_SIZE.height * 100 },
  mapOverlayWidthRatio: 0.34,
  mapOverlayMaxWidth: 140,
  spots: [
    { id: "165", label: "165", detail: "Multipurpose room", kind: "study", x: 34, y: 8 },
    { id: "160", label: "160", detail: "Classroom", kind: "study", x: 65, y: 8 },
    { id: "155ac", label: "155A–C", detail: "Library room", kind: "service", x: 8, y: 18 },
    { id: "149", label: "149", detail: "Library room", kind: "study", x: 9, y: 27 },
    { id: "145", label: "145", detail: "Media study space", kind: "study", x: 26, y: 28 },
    { id: "140", label: "140", detail: "Study space", kind: "study", x: 66, y: 28 },
    { id: "150b", label: "150B", detail: "Classrooms", kind: "study", x: 88, y: 21 },
    { id: "150a", label: "150A", detail: "Classrooms", kind: "study", x: 88, y: 26 },
    { id: "125", label: "125", detail: "Gallery", kind: "amenity", x: 27, y: 48 },
    { id: "120", label: "120", detail: "Study space", kind: "study", x: 67, y: 49 },
    { id: "119af", label: "119A–F", detail: "Library rooms", kind: "service", x: 8, y: 53 },
    { id: "122", label: "122", detail: "Library room", kind: "study", x: 88, y: 51 },
    { id: "116", label: "116", detail: "Business office", kind: "service", x: 88, y: 61 },
    { id: "110", label: "110", detail: "Study space", kind: "study", x: 68, y: 64 },
    { id: "atrium", label: "East Atrium", detail: "Main circulation area", kind: "amenity", x: 48, y: 59 },
    { id: "105", label: "105", detail: "Special Collections Reading Room", kind: "study", x: 18, y: 86 },
    { id: "104ad", label: "104A–D", detail: "Library rooms", kind: "service", x: 86, y: 86 },
    { id: "desk", label: "Circulation Desk", detail: "Help and library services", kind: "service", x: 61, y: 77 },
    { id: "elevator", label: "Elevator", detail: "Floors 1–11", kind: "amenity", x: 71, y: 70 },
    { id: "east-entrance", label: "East Entrance", detail: "Oval access · wheelchair access", kind: "entrance", x: 48, y: 97 },
  ] satisfies CampusMapSpot[],
} as const satisfies IndoorLibraryPlan;

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
