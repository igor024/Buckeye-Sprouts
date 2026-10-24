# BuckeyeStudy — Multi-Agent System Architecture & Directives (`AGENTS.md`)
**HackOHIO 2026 Project Architecture**  
**Project:** BuckeyeStudy (Real-Time Library Seat Finder, BuckID/QR Check-In & AI Study Notebook)

---

## 0. HackOHIO 2026 Open Track Rubric (MANDATORY BEFORE CODING)

All agents **MUST** evaluate every implementation decision against the official HackOHIO Open Track Judging Rubric before writing any code:

```
┌─────────────────────────────────┬─────────────────────────────────┬─────────────────────────────────┐
│           CURIOSITY             │          CONNECTIONS            │         CREATING VALUE          │
├─────────────────────────────────┼─────────────────────────────────┼─────────────────────────────────┤
│ • Innovation                    │ • Communication                 │ • Impact                        │
│ • Curiosity                     │ • Project Breadth & Complexity  │ • Growth Mindset (Navigating    │
│                                 │                                 │   Challenges)                   │
└─────────────────────────────────┴─────────────────────────────────┴─────────────────────────────────┘
```

### Rubric Directives for Agents:
1. **Curiosity (Innovation & Curiosity):**
   - Push beyond standard CRUD apps. Emphasize physical-to-digital hardware integration (1D BuckID barcode scanner, Table QR, GPS Haversine geofence calculation, and ambient cross-session intelligence).
2. **Connections (Communication & Project Breadth):**
   - Provide clean, intuitive UI with Scarlet & Gray branding.
   - **Crucial for Judging:** Every physical hardware feature (GPS, camera barcode scan, room booking) MUST provide a 1-click **"Simulate / Test Mode"** toggle in the UI so judges can experience the full flow in seconds without physical cards or walking.
   - Maintain seamless end-to-end integration across all 4 workstreams.
3. **Creating Value (Impact & Growth Mindset / Navigating Challenges):**
   - Address the authentic campus problem: finding study spots during exam crunches, preventing seat-hogging, and fostering peer study groups.
   - Demonstrate resilience through graceful fallbacks: offline PWA caching with `/offline` vault, local in-memory fallback state, and deterministic mock adapters.

*Detailed rubric breakdown available in [`HACKATHON_RUBRIC.md`](./HACKATHON_RUBRIC.md).*

---

## 1. System Overview & Multi-Agent Operating Model

This repository is built using a **Contract-First, Feature-Sliced Architecture**. Multiple autonomous agents (or parallel developers) work simultaneously on isolated domains without colliding on files or altering core contracts without consensus.

```
                  ┌──────────────────────────────────────────────┐
                  │          Lead Orchestrator Agent             │
                  │  (Repo Scaffold, Contracts, Core Layouts)    │
                  └──────────────────────┬───────────────────────┘
                                         │
                 ┌───────────────────────┼───────────────────────┐
                 │                       │                       │
                 ▼                       ▼                       ▼
    ┌─────────────────────────┐ ┌──────────────────┐ ┌─────────────────────────┐
    │  Agent 1 (WS1): Auth,   │ │ Agent 2 (WS2):   │ │  Agent 3 (WS3): QR,     │
    │  Profiles & Join Gate   │ │ Sessions, Photo  │ │  BuckID & Geofencing    │
    │  [src/features/auth...] │ │ Feed & Booking   │ │  [src/features/loc...]  │
    └─────────────────────────┘ └──────────────────┘ └─────────────────────────┘
                                         │
                                         ▼
                               ┌───────────────────┐
                               │ Agent 4 (WS4):    │
                               │ Notebook & AI     │
                               │ [src/features/ai] │
                               └───────────────────┘
```

### Global Ground Rules for All Agents
0. **Mandatory Rubric Consideration:** Before writing code, review how your feature satisfies **Curiosity** (innovation), **Connections** (communication & demo simulator toggles), and **Creating Value** (real student impact & resilient fallbacks).
1. **Contract Immutability:** Never modify `src/types/contracts.ts` directly unless explicitly prompted. If a field is missing, propose a backward-compatible optional field.
2. **Strict File Isolation:** You may only create, modify, or delete files inside your designated feature directory or API route.
3. **Mock-First Fallback:** Supabase or external APIs might have missing environment variables during hackathon evaluations. Every feature must gracefully fall back to in-memory local state or deterministic mock fixtures.
4. **Demo Readiness:** Every feature with physical constraints (GPS, camera barcode scanning, university booking SSO) must expose an explicit, judge-friendly "Simulate / Test Mode" UI toggle.

---

## 2. Directory Ownership Matrix

| Agent ID | Workstream Name | File Boundary (Strict Ownership) | Shared Read-Only Dependencies |
| :--- | :--- | :--- | :--- |
| **Lead Agent** | Core Architecture | `src/types/`, `src/lib/`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/session/[id]/page.tsx` | All |
| **Agent 1** | Auth, Profiles & Privacy Gate | `src/features/auth-profiles/**` | `src/types/contracts.ts`, `src/lib/supabase.ts` |
| **Agent 2** | Discovery, Feed & Room Booking | `src/features/sessions-discovery/**`, `src/app/api/sessions/**`, `src/app/api/rooms/**` | `src/types/contracts.ts`, `src/lib/supabase.ts` |
| **Agent 3** | Check-In (BuckID/QR) & Geofencing | `src/features/location-checkin/**` | `src/types/contracts.ts`, `src/lib/supabase.ts` |
| **Agent 4** | Real-Time Notebook & AI Suite | `src/features/notebook-ai/**`, `src/app/api/ai/**` | `src/types/contracts.ts`, `src/lib/ai-client.ts` |

---

## 3. Shared Source of Truth (`src/types/contracts.ts`)

All agents must adhere strictly to these types:

```typescript
export type LibraryVenue = 
  | 'Thompson Library' 
  | '18th Avenue Library' 
  | 'Prior Health Sciences Library' 
  | 'Kearns Hall' 
  | 'Other';

export interface UserProfile {
  id: string;
  name: string;
  buckIdBarcodeHash: string;
  avatarUrl: string;
  major: string;
  rank: 'Freshman' | 'Sophomore' | 'Junior' | 'Senior' | 'Graduate';
  currentCourses: string[];
  bio: string;
}

export interface StudySession {
  id: string;
  hostId: string;
  title: string;
  subtitle: string;
  courseCode: string; // e.g., "CSE 2221", "MATH 1151"
  libraryName: LibraryVenue;
  floorLevel: string;  // e.g., "Floor 3 - Quiet Stacks", "Ground Floor Café"
  tableId: string;    // e.g., "TH-304-B" (Hidden until approved)
  totalSeats: number;
  availableSeats: number;
  surroundingsPhotoUrl?: string; // Hidden until approved
  requiresApproval: boolean;
  status: 'active' | 'scheduled' | 'closed';
  scheduledTime?: string; // ISO string for future sessions
  gpsCoordinates: {
    lat: number;
    lng: number;
    radiusMeters: number; // Defaults to 120m geofence around library
  };
  aiTopicTags: string[];
  createdAt: string;
}

export interface JoinRequest {
  id: string;
  sessionId: string;
  requesterProfile: UserProfile;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
}

export interface SharedNotebook {
  sessionId: string;
  content: string; // Markdown formatted
  lastUpdatedBy: string;
  aiSummary: string;
  aiSuggestedTopics: string[];
  lastSummaryTimestamp: string;
}

export interface CheckInPayload {
  method: 'table_qr' | 'buck_id';
  rawIdentifier: string;
  tableId: string;
  libraryName: LibraryVenue;
  coordinates: { lat: number; lng: number };
}
```

---

## 4. Agent Workstream Prompts & Specifications

### Agent 1: Profiles, Auth & Privacy Gate
* **Directory:** `src/features/auth-profiles/`
* **Objective:** Implement user identity and the host approval workflow that protects table locations and surroundings photos.
* **Key Tasks:**
  1. `UserProfileCard.tsx`: Compact card showing user avatar, major, current enrolled courses, and verification status.
  2. `JoinApprovalGate.tsx`: Wrapper for non-members viewing a study session.
     - If `requiresApproval === true` and the viewer is not in the approved list:
       - Mask/blur `tableId` and `surroundingsPhotoUrl`.
       - Render a prominent "Request to Sit Here" button sending a `JoinRequest`.
  3. `HostApprovalDrawer.tsx`: Host-facing real-time notifications panel. Shows incoming `JoinRequest` items with "Approve" and "Decline" buttons. Approving updates the request state and decrements `session.availableSeats` by 1.
  4. Provide mock user data for demo testing (e.g., "Brutus Buckeye", "Carmen Ohio").

---

### Agent 2: Discovery Feed, Surroundings Photo & Preemptive Room Booking
* **Directory:** `src/features/sessions-discovery/`, `src/app/api/sessions/` & `src/app/api/rooms/`
* **Objective:** Allow hosts to post new sessions with visual navigation aids and allow students to filter sessions or preemptively auto-book study rooms.
* **Key Tasks:**
  1. `CreateSessionModal.tsx`:
     - Inputs for title, custom subtitle, course code picker (badges for OSU courses: CSE 1223, CSE 2221, MATH 1151, ENGR 1181), seat counter (`+`/`-`), and floor selector.
     - Surroundings Photo capture: Web camera snapshot or file upload showing the crowd density and visual landmarks.
  2. `SessionFeed.tsx`: Grid view with multi-faceted filtering:
     - Course Code filter.
     - Library Venue dropdown (Thompson, 18th Ave, etc.).
     - "Seats Available Now" toggle (`availableSeats > 0`).
     - AI Topic Tag pills (e.g., `#MidtermReview`, `#Recursion`).
  3. `PreemptiveScheduler.tsx` & `/api/rooms/book/route.ts`:
     - Allow students to propose a future study group time (e.g., "Tonight at 8:00 PM").
     - Automated booking trigger: When `joinedCount >= 3` or when the host clicks "Book Study Room", trigger `/api/rooms/book` to run the booking simulation/scraper for OSU library study rooms and attach the assigned room number to the card.

---

### Agent 3: Location Check-In (BuckID/QR) & Geofenced Auto-Checkout
* **Directory:** `src/features/location-checkin/`
* **Objective:** Implement physical table check-in and automated departure tracking using device APIs.
* **Key Tasks:**
  1. `CheckInScanner.tsx`:
     - **Table QR Mode:** Scans standard QR codes containing JSON: `{ libraryName: 'Thompson Library', tableId: 'TH-201-A' }`.
     - **BuckID Mode:** Reads the 1D Barcode (Codabar / Code 128 format printed on the reverse side of all Ohio State BuckIDs) via the HTML5 Barcode Detection API or `html5-qrcode`. If using Web NFC on mobile, read the card serial number.
     - **Demo Simulator:** Include a one-click "Simulate Thompson Table 412 Check-In" button for desktop judges without physical barcodes.
  2. `GeofenceMonitor.tsx`:
     - Track host position via `navigator.geolocation.watchPosition`.
     - Calculate distance to the library using the Haversine formula:
       $$d = 2r \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta \varphi}{2}\right) + \cos(\varphi_1)\cos(\varphi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)}\right)$$
     - If the host moves $> 150\text{ m}$ away from the library for 2 consecutive cycles, show an alert and automatically trigger `session.status = 'closed'` to free the table for other Buckeyes.
     - **Judge Demo Mode:** Add a toggle button: `"Simulate Walking Out to High St (Trigger Auto-Close)"`.

---

### Agent 4: Collaborative Notebook & AI Intelligence Suite
* **Directory:** `src/features/notebook-ai/` & `src/app/api/ai/`
* **Objective:** Provide a real-time markdown editor tied to the study session with on-demand AI summarization, ambient study matching, and inline tutoring.
* **Key Tasks:**
  1. `CollaborativeNotebook.tsx`:
     - Shared markdown editor (textarea or Tiptap/CodeMirror). Unlocks immediately when approved or table check-in occurs.
  2. `CatchMeUpBanner.tsx` + `src/app/api/ai/summarize/route.ts`:
     - When a new student arrives and sits down, an AI banner generates a 3-bullet "Catch Me Up" summary of whatever the active group has written in the notebook over the session.
  3. `InlineAiTutor.tsx` + `src/app/api/ai/feedback/route.ts`:
     - Floating assistant widget. Allows members to click "Analyze Our Notes" to receive:
       - Conceptual errors spotted.
       - Recommended practice problems based on the course code.
  4. `AmbientGroupMatcher.tsx`:
     - Scans notebooks across all open sessions on the same library floor, runs lightweight topic extraction, and tags sessions with topics (e.g., "Currently solving Dijkstra's Algorithm"). Displays a "Topics studied near you" discovery banner.

---

## 5. Integration Verification Protocol

Before finishing a workstream or pushing code, run the following verification checklist:

1. **Compilation Check:**
   ```bash
   npm run build
   ```
   Must compile with zero TypeScript errors. No `any` type overrides on shared contracts.

2. **Isolated Unit Check:**
   - Agent 1: Can approve/deny mock requests without errors.
   - Agent 2: Can create a session with a mock surroundings photo and filter the feed.
   - Agent 3: Table QR mock scan and Geofence exit toggle correctly mutate session status.
   - Agent 4: AI "Catch Me Up" returns a coherent summary using Vercel AI SDK or mock fallback.

3. **Fallback Resiliency:**
   Disconnect internet/invalidate API keys. The app must remain operable in "Mock Demo Mode" without crashing.

4. **HackOHIO Rubric Compliance:**
   - **Curiosity:** Feature incorporates innovative functionality (hardware integration, geofencing, ambient AI, photo verification).
   - **Connections:** UI is polished with Scarlet/Gray tokens and includes 1-click judge simulation toggles.
   - **Creating Value:** Directly addresses student library pain points and remains resilient under network/hardware failures.
