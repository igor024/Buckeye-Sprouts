# Buckeye Sprouts — Multi-Agent System Architecture & Directives (`AGENTS.md`)

**HackOHIO 2026 Project Architecture & Maximum Score Directives**  
**Project:** Buckeye Sprouts (Real-Time Library Seat Finder, BuckID/QR Check-In & AI Study Notebook)

---

## 0. HackOHIO 2026 Rubric Optimization Directives (MANDATORY TARGET: 30/30)

Every agent implementing any feature in this repository **must** optimize their code, user interface, and demo hooks to achieve the maximum score (**5/5 Accomplished**) across all six judging criteria from the official HackOHIO Open Track Rubric.

```
┌─────────────────────────────────┬─────────────────────────────────┬─────────────────────────────────┐
│           CURIOSITY             │          CONNECTIONS            │         CREATING VALUE          │
├─────────────────────────────────┼─────────────────────────────────┼─────────────────────────────────┤
│ 1. Innovation (5/5)             │ 3. Communications (5/5)         │ 5. Impact (5/5)                 │
│ 2. Curiosity (5/5)              │ 4. Breadth & Complexity (5/5)   │ 6. Navigating Challenges (5/5)  │
└─────────────────────────────────┴─────────────────────────────────┴─────────────────────────────────┘
```

### Criterion 1: Innovation (Target: 5/5 — Accomplished)
* **Rubric Standard:** *Based on research and analysis of currently accepted solutions to identify strengths/weaknesses, and explored one or more new or alternative successful solutions.*
* **What Judges Ask:** *"How did your team challenge commonly accepted ideas and what did you do differently in your project?"*
* **Agent Implementation Requirements:**
  1. **Critique Existing Systems:** Document and contrast against existing solutions (e.g., OSU LibCal, GroupMe, Discord). LibCal is static, siloed, does not show real-time seat availability, ignores walk-in table sharing, and causes "ghost bookings."
  2. **The Reinvention:** Buckeye Sprouts shifts library study space from static room reservations to a decentralized, real-time peer network powered by:
     - Optical BuckID / QR table anchors.
     - Surroundings verification photos to assess crowding before walking across campus.
     - Location-gated peer approval to eliminate social anxiety and ensure psychological safety.
  3. **Code Directive:** Keep comparative analysis metrics in code comments and UI tooltips (e.g., displaying "Saved 25 mins of room searching vs. standard reservation portals").

---

### Criterion 2: Curiosity (Target: 5/5 — Accomplished)
* **Rubric Standard:** *Worked together to identify knowledge gaps, asking unique or new questions, and acted on that plan to explore and create project outcomes.*
* **What Judges Ask:** *"Can you share examples of questions your team asked while exploring possibilities? Show us something unique, beautiful, or clever in your project."*
* **Agent Implementation Requirements:**
  1. **Artful Technical Application:** Implement the "Ambient AI Topic Matcher" and the Haversine Geofence departure monitor:
     $$d = 2r \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta \varphi}{2}\right) + \cos(\varphi_1)\cos(\varphi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)}\right)$$
  2. **Non-Obvious Questions Asked & Solved:**
     - *"Why must joining a study group feel socially intimidating?"* $\rightarrow$ Solved via two-way profile inspection + mutual approval before location reveal.
     - *"Why should you start from scratch when joining an active table?"* $\rightarrow$ Solved via the AI "Catch Me Up" live synthesis banner.
     - *"Can an entire library floor passively broadcast what subjects are being studied without invading privacy?"* $\rightarrow$ Solved via ambient semantic topic clustering on shared notebooks.

---

### Criterion 3: Communications (Target: 5/5 — Accomplished)
* **Rubric Standard:** *Communicates idea through a fully functional prototype of essential elements, supplemented by clear diagrams, visual state representations, and intuitive presentation.*
* **What Judges Ask:** *"Can you show me your visual representation and how it explains your concept? What part of your presentation shows off your work best?"*
* **Agent Implementation Requirements:**
  1. **Zero-Friction Judge Simulator (CRITICAL):** Judges will not walk outside or bring spare BuckIDs. **Every** physical component must have a prominent, Scarlet-and-Gray demo control bar:
     - `[ Simulate BuckID Scan ]` (Injects pre-computed OSU 1D barcode data).
     - `[ Simulate Table QR Scan ]` (Locks user to Thompson Floor 3 Table 412).
     - `[ Simulate Walking to High St (180m away) ]` (Triggers GPS auto-checkout and frees table).
     - `[ Simulate 3-Person Quorum ]` (Fires automated room booking trigger).
  2. **Visual Hierarchy:** Clean, responsive UI with Ohio State brand tokens (Scarlet `#BA0C2F`, Gray `#A7B1B7`, Dark Gray `#3F4443`). Include real-time status pills: `Waiting Approval`, `Table Locked`, `Active Geofence`.

---

### Criterion 4: Project Breadth and Complexity (Target: 5/5 — Accomplished)
* **Rubric Standard:** *Synthesize ideas from a wide variety of domains (humanities, engineering, physical sciences, computing) into a non-trivial innovation; demonstrates future scalability (10x growth).*
* **What Judges Ask:** *"How did you use information from different areas to explore new ideas? What was the most complicated piece to build? What changes if this scales 10X?"*
* **Agent Implementation Requirements:**
  1. **Cross-Disciplinary Synthesis:**
     - **Hardware & Optics (Engineering):** HTML5 1D Barcode optics reading the physical Codabar/Code128 format on student IDs + Web NFC reader.
     - **Spatial Mathematics (Science):** Geodesic coordinate tracking and threshold hysteresis to eliminate indoor GPS bounce.
     - **Cognitive & Social Sciences (Humanities):** Peer-assisted learning theory (Vygotsky's Zone of Proximal Development) applied through AI Socratic tutoring, reducing barrier-to-entry for STEM collaborative study.
  2. **10X Scalability Architecture:**
     - Multi-campus schema support (`campusId`: Columbus, Newark, Mansfield, Lima, Marion, Wooster).
     - Headless webhook integration ready to connect to OSU LibCal APIs.
     - Edge-cached state to support 65,000+ active students during exam weeks.

---

### Criterion 5: Impact (Target: 5/5 — Accomplished)
* **Rubric Standard:** *Provides a solution with tangible social, academic, and operational value; addresses well-defined user needs with clear adoption potential and feasibility.*
* **What Judges Ask:** *"What does your project do, or who might it help? What user needs did you keep in mind while working on this? Did you get any feedback from your target audience?"*
* **Agent Implementation Requirements:**
  1. **Authentic Pain Points Addressed:**
     - Eradicates the "lone studier at a 6-person table" inefficiency across Thompson and 18th Ave libraries during midterm and finals crunches.
     - Directly supports high-attrition OSU foundation courses (e.g., CSE 2221/2231, MATH 1151/1172, ENGR 1181) by allowing peers to cluster by course number in real time.
  2. **Measurable Outcomes:** Real-time seat occupancy counters, immediate reduction in idle seat time, and instant group study onboarding.

---

### Criterion 6: Navigating Challenges (Target: 5/5 — Accomplished)
* **Rubric Standard:** *Demonstrates reflection on technical/design barriers, pivots strategically based on failures, and implements alternatives to create a more successful solution.*
* **What Judges Ask:** *"Name one thing that you struggled with or that didn't work at all and how you pivoted. How did you test your ideas and make changes based on results?"*
* **Agent Implementation Requirements:**
  Agents must document in code and deliver the following strategic architectural pivots:
  1. **Challenge 1: BuckID Security Isolation:** OSU's physical NFC chips are encrypted with proprietary university keys inaccessible to standard mobile browsers.  
     $\rightarrow$ **The Pivot:** Pivoted to scanning the optical 1D barcode on the reverse side of the BuckID via camera + fallback Web NFC serial reading, creating an accessible zero-install solution.
  2. **Challenge 2: Indoor GPS Inaccuracy & Drift:** GPS drifts significantly inside multi-story concrete structures like Thompson Stacks.  
     $\rightarrow$ **The Pivot:** Anchored seat location deterministically via physical Table QR codes, using GPS strictly as a coarse-grained geofence departure boundary ($>150\text{ m}$) with a 2-cycle hysteresis filter.
  3. **Challenge 3: Offline & Network Dropouts:** University Wi-Fi frequently drops in basement study stacks.  
     $\rightarrow$ **The Pivot:** Built resilient local state caching and offline fallback mock stores so notebooks never lose user data.

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

310: 4. **HackOHIO Rubric Compliance Checklist:**
311:    - [ ] **Innovation (5/5):** Challenges static booking systems with real-time peer discovery, physical table binding, and crowd visuals.
312:    - [ ] **Curiosity (5/5):** Implements ambient AI discovery and mathematical geofencing to answer novel questions on peer proximity and study anxiety.
313:    - [ ] **Communications (5/5):** Interactive Scarlet & Gray UI with 1-click simulation toggles for judges (GPS, BuckID scan, room booking).
314:    - [ ] **Breadth & Complexity (5/5):** Fuses optics (barcodes), spatial math (Haversine), cognitive science (peer pedagogy), and a 10x multi-campus scalability plan.
315:    - [ ] **Impact (5/5):** Directly addresses library seat hoarding and study group isolation for 65,000+ Ohio State students.
316:    - [ ] **Navigating Challenges (5/5):** Explicitly documents pivots on encrypted NFC hardware, indoor GPS drift, and resilient offline fallbacks.

---

## 6. Complete Database Schema, Data Formats & Frontend Integration Guide

This section is the definitive, authoritative reference for any agent or frontend developer connecting UI components to live database state in Buckeye Sprouts.

---

### 6.1 Database Infrastructure & Environment Variables

Buckeye Sprouts runs on **PostgreSQL hosted via Supabase** with Row-Level Security (RLS) enabled. The application supports dual operational modes:
1. **Persistent Mode (Live Supabase)**: Real PostgreSQL queries and server actions when `.env.local` contains valid Supabase credentials.
2. **Mock Demo Mode (Offline Resilient)**: In-memory fallback stores (`mockStore` in `@/lib/supabase.ts`) when API keys are absent or network requests fail.

#### Environment Variables (`.env.local`)
| Variable | Environment | Scope / Role | Security Directives |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Client & Server | Supabase project API base URL (e.g. `https://<id>.supabase.co`) | Safe to expose in public client bundles. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client & Server | Public anonymous API key | Subject to RLS policies. Grants read access to public map tables (`profiles`, `study_sessions`, `join_requests`, `check_ins`, `shared_notebooks`, `room_ids`, `library_geofences`). |
| `SUPABASE_SERVICE_ROLE_KEY` | Server Only (`server-only`) | Administrative bypass key | **Strictly Server-Only**. Used inside API route handlers (`/api/map/groups`, `/api/sessions`, etc.) for write operations and foreign key resolution. **Never leak to browser bundles.** |
| `POSTGRES_URL` / `POSTGRES_URL_NON_POOLING` | Scripts / Migrations | Direct PostgreSQL connection strings | Used by migration runner scripts (`scripts/apply-*.js`). |
| `BUCKEYESPROUTS_DEMO_MODE` | Server & Scripts | Optional toggle (`"true"`) | Forces local demo fixtures regardless of Supabase configuration. |

#### Client SDK Helpers
- **Browser Client (`@/lib/supabase-browser.ts`)**: `getSupabaseBrowserClient()`  
  Initializes a cached singleton Supabase client using `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Use this for direct browser reads, table lookups, and Supabase Realtime channel subscriptions.
- **Admin Server Client (`@/lib/supabase-admin.ts`)**: `getSupabaseAdminClient()`  
  Initializes a privileged server client using `SUPABASE_SERVICE_ROLE_KEY`. Uses Next.js `server-only` to guarantee zero leakage into client bundles.
- **Configuration Validator (`@/lib/supabase.ts`)**: `isSupabaseConfigured`  
  Boolean flag (`Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)`). Always check this flag before executing client-side Supabase network requests to ensure graceful fallback.

---

### 6.2 Complete Database Tables Catalog & Column Specifications

The database schema comprises **10 relational tables**, **1 storage bucket**, and **3 stored SQL functions**.

#### Table 1: `public.profiles`
Represents student identities. Every profile corresponds to an identity in Supabase `auth.users`.
| Column | Type | Constraints / Defaults | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | `PRIMARY KEY`, references `auth.users(id) ON DELETE CASCADE` | Student UUID. **All foreign keys reference this UUID.** |
| `name` | `text` | `NOT NULL`, `check (char_length(name) between 1 and 120)` | Full student name (e.g., "Alex Morgan", "Sam Patel"). |
| `avatar_url` | `text` | `NOT NULL DEFAULT ''` | URL to student avatar image (empty string falls back to SVG initials badge). |
| `major` | `text` | `NOT NULL DEFAULT ''` | Department / major (e.g., "Computer Science & Engineering"). |
| `current_courses` | `text[]` | `NOT NULL DEFAULT '{}'` | Array of enrolled course codes (e.g., `["CSE 2221", "MATH 1151"]`). |
| `bio` | `text` | `NOT NULL DEFAULT ''` | Brief bio or academic interests. |
| `created_at` | `timestamptz` | `NOT NULL DEFAULT now()` | Registration timestamp. |

#### Table 2: `public.profile_identities`
Internal identity linkage. **Backend only — no browser grants.**
| Column | Type | Constraints / Defaults | Description |
| :--- | :--- | :--- | :--- |
| `user_id` | `uuid` | `PRIMARY KEY`, references `public.profiles(id) ON DELETE CASCADE` | Associated student profile. |
| `buck_id_hash` | `text` | `NOT NULL UNIQUE` | Cryptographic hash of optical 1D barcode scan. Raw scans are never stored. |
| `verified_at` | `timestamptz` | `NOT NULL DEFAULT now()` | Verification timestamp. |

#### Table 3: `public.study_sessions`
Active and scheduled study sessions tied to physical locations.
| Column | Type | Constraints / Defaults | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique study session UUID. |
| `host_id` | `uuid` | `NOT NULL`, references `public.profiles(id)` | Current host of the study session. |
| `title` | `text` | `NOT NULL`, `check (char_length(title) between 1 and 160)` | Display title (e.g., "Recursion & Components Study", "Alex's Group"). |
| `subtitle` | `text` | `NOT NULL DEFAULT ''` | Focus topic or description (e.g., "Working through software components"). |
| `course_code` | `text` | `NOT NULL` | Course code (e.g., "CSE 2221", "MATH 1151", "CSE 2321"). |
| `library_name` | `text` | `NOT NULL` | Building name (e.g., "Thompson Library", "18th Avenue Library"). |
| `floor` | `text` | `NULLABLE` | Library level (e.g., "Level 1", "Floor 3"). |
| `zone` | `text` | `NULLABLE` | Area description or table cluster (e.g., "Table 110-1", "East study area"). |
| `table_id` | `text` | `NULLABLE` (Added in Migration 0008) | **Direct physical table anchor ID** (e.g., "110-1", "140-1", "165-1"). Fast indexed lookup. |
| `total_seats` | `integer` | `NOT NULL DEFAULT 4`, `check (total_seats > 0)` | Table seat capacity. |
| `available_seats` | `integer` | `NOT NULL DEFAULT 3`, `check (available_seats >= 0 and available_seats <= total_seats)` | Open seats remaining. |
| `requires_approval` | `boolean` | `NOT NULL DEFAULT true` | If `true`, joining requires host review (invite-only). If `false`, open table. |
| `status` | `text` | `NOT NULL DEFAULT 'scheduled'`, `check (status in ('scheduled', 'active', 'closed'))` | Live active sessions have `status = 'active'`. |
| `scheduled_for` | `timestamptz` | `NULLABLE` | Future start time if `status = 'scheduled'`. |
| `ai_topic_tags` | `text[]` | `NOT NULL DEFAULT '{}'` | Extracted concepts for ambient topic search. |
| `created_at` | `timestamptz` | `NOT NULL DEFAULT now()` | Session creation timestamp. |

#### Table 4: `public.room_ids`
Physical table and room anchors for interactive SVG floor plans.
| Column | Type | Constraints / Defaults | Description |
| :--- | :--- | :--- | :--- |
| `id` | `text` | `PRIMARY KEY` | Table ID matching SVG rectangles (e.g., "110-1", "140-1", "165-1"). |
| `library_name` | `text` | `NOT NULL DEFAULT 'Thompson Library'` | Associated library facility. |
| `active_session_id` | `uuid` | `NULLABLE`, references `public.study_sessions(id) ON DELETE SET NULL` | Pointer to the active session occupying this table. `NULL` if table is empty. |
| `created_at` | `timestamptz` | `NOT NULL DEFAULT now()` | Registration timestamp. |

#### Table 5: `public.session_private_details`
Protected location coordinates and surroundings photo. Access restricted to approved members.
| Column | Type | Constraints / Defaults | Description |
| :--- | :--- | :--- | :--- |
| `session_id` | `uuid` | `PRIMARY KEY`, references `public.study_sessions(id) ON DELETE CASCADE` | Associated study session. |
| `table_id` | `text` | `NOT NULL` | Anchor table ID. |
| `surroundings_photo_path` | `text` | `NOT NULL DEFAULT ''` | Path inside the `surroundings` Supabase Storage bucket. |
| `gps_lat` | `float8` | `NOT NULL`, `check (gps_lat between -90 and 90)` | WGS84 latitude coordinate. |
| `gps_lng` | `float8` | `NOT NULL`, `check (gps_lng between -180 and 180)` | WGS84 longitude coordinate. |

#### Table 6: `public.join_requests`
Membership requests and approved roster.
| Column | Type | Constraints / Defaults | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique request ID. |
| `session_id` | `uuid` | `NOT NULL`, references `public.study_sessions(id) ON DELETE CASCADE` | Target study session. |
| `requester_id` | `uuid` | `NOT NULL`, references `public.profiles(id) ON DELETE CASCADE` | Student requesting or occupying a seat. |
| `status` | `text` | `NOT NULL DEFAULT 'pending'`, `check (status in ('pending', 'approved', 'rejected', 'cancelled'))` | `'approved'` indicates active membership. |
| `requested_at` | `timestamptz` | `NOT NULL DEFAULT now()` | Request timestamp. |

#### Table 7: `public.check_ins`
Real-time physical table presence tracking (who is physically sitting at each table).
| Column | Type | Constraints / Defaults | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique check-in receipt ID. |
| `session_id` | `uuid` | `NOT NULL`, references `public.study_sessions(id) ON DELETE CASCADE` | Study session attended. |
| `user_id` | `uuid` | `NOT NULL`, references `public.profiles(id) ON DELETE CASCADE` | Student checked in. |
| `method` | `text` | `NOT NULL`, `check (method in ('table_qr', 'buck_id'))` | Optical check-in method used. |
| `checked_in_at` | `timestamptz` | `NOT NULL DEFAULT now()` | Check-in timestamp. |
| `checked_out_at` | `timestamptz` | `NULLABLE`, `check (checked_out_at is null or checked_out_at >= checked_in_at)` | If `null`, student is **currently physically present at the table**. |

#### Table 8: `public.shared_notebooks`
Live collaborative Markdown notes for each session.
| Column | Type | Constraints / Defaults | Description |
| :--- | :--- | :--- | :--- |
| `session_id` | `uuid` | `PRIMARY KEY`, references `public.study_sessions(id) ON DELETE CASCADE` | Associated study session. |
| `content` | `text` | `NOT NULL DEFAULT ''` | Markdown study notes text. |
| `last_updated_by` | `uuid` | `NOT NULL`, references `public.profiles(id)` | Profile UUID of the last editor. |
| `ai_summary` | `text` | `NOT NULL DEFAULT ''` | AI-generated "Catch Me Up" synopsis for arriving students. |
| `ai_suggestions` | `text[]` | `NOT NULL DEFAULT '{}'` | Socratic AI prompt suggestions. |
| `updated_at` | `timestamptz` | `NOT NULL DEFAULT now()` | Timestamp of last note mutation. |
| `revision` | `bigint` | `NOT NULL DEFAULT 0`, `check (revision >= 0)` | Monotonically increasing revision counter. |

#### Table 9: `public.library_geofences`
Geographic boundaries for GPS departure monitoring.
| Column | Type | Constraints / Defaults | Description |
| :--- | :--- | :--- | :--- |
| `library_name` | `text` | `PRIMARY KEY` | Building name (e.g., "Thompson Library", "18th Avenue Library"). |
| `center_lat` | `float8` | `NOT NULL`, `check (center_lat between -90 and 90)` | Center latitude (Thompson: `40.0001`, 18th Ave: `40.0025`). |
| `center_lng` | `float8` | `NOT NULL`, `check (center_lng between -180 and 180)` | Center longitude (Thompson: `-83.0146`, 18th Ave: `-83.0092`). |
| `radius_meters` | `float8` | `NOT NULL`, `check (radius_meters > 0)` | Geofence radius in meters (Thompson: `100`, 18th Ave: `85`). |
| `room_ids` | `text[]` | `DEFAULT '{}'` | Array of room and table IDs within this boundary. |

#### Table 10: `public.room_bookings`
Automated room reservation webhook seam (triggered on 3-person quorum).
| Column | Type | Constraints / Defaults | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique booking record ID. |
| `session_id` | `uuid` | `NOT NULL`, references `public.study_sessions(id) ON DELETE CASCADE` | Associated study session. |
| `library_name` | `text` | `NOT NULL` | Target library facility. |
| `room_id` | `text` | `NOT NULL` | Reserved group study room. |
| `starts_at` | `timestamptz` | `NOT NULL` | Reservation start time. |
| `ends_at` | `timestamptz` | `NOT NULL`, `check (ends_at > starts_at)` | Reservation end time. |
| `status` | `text` | `NOT NULL DEFAULT 'pending'`, `check (status in ('pending', 'confirmed', 'unavailable', 'cancelled'))` | Booking state. |
| `provider_booking_id` | `text` | `UNIQUE`, `NULLABLE` | External OSU LibCal booking confirmation ID. |
| `idempotency_key` | `text` | `NOT NULL UNIQUE` | Webhook idempotency key. |
| `created_at` | `timestamptz` | `NOT NULL DEFAULT now()` | Record creation timestamp. |

#### Storage Buckets
- **Bucket ID:** `surroundings` (`storage.buckets`)
  - **Public:** `false` (Private storage, short-lived signed URLs generated for approved members).
  - **File Size Limit:** 5 MB (`5242880` bytes).
  - **Allowed MIME Types:** `image/jpeg`, `image/png`, `image/webp`.

#### Stored SQL Procedures & Functions
1. `public.lookup_active_session_by_table(p_table_id text, p_library_name text DEFAULT 'Thompson Library')`
   - **Security:** `SECURITY DEFINER set search_path = public`
   - **Permissions:** `GRANT EXECUTE TO anon, authenticated`
   - **Returns:** Table row containing `session_id`, `title`, `subtitle`, `course_code`, `library_name`, `floor`, `zone`, `total_seats`, `available_seats`, `requires_approval`, `status`, `created_at`, `host_name`.
   - **Usage:** Fast physical table QR code scan lookup.
2. `public.is_session_host(target_session_id uuid) -> boolean`
   - Returns `true` if `auth.uid()` matches `study_sessions.host_id`.
3. `public.can_access_session(target_session_id uuid) -> boolean`
   - Returns `true` if user is host or has an approved `join_requests` row.
4. `public.handle_new_user()`
   - Auth trigger that automatically inserts a matching row into `public.profiles` upon `auth.users` creation.

---

### 6.3 Security, Row-Level Security (RLS) & Anon Grants Matrix

| Table | Anon Read (`anon`) | Auth Read (`authenticated`) | Auth Write (`authenticated`) | Service Role Write (`admin`) |
| :--- | :--- | :--- | :--- | :--- |
| `public.profiles` | **YES** (Migration 0007) | **YES** | **YES** (Own row only: `id = auth.uid()`) | **Full Access** |
| `public.profile_identities` | NO | NO | NO (Backend only) | **Full Access** |
| `public.study_sessions` | **YES** (status <> 'closed') | **YES** | **YES** (Host only: `host_id = auth.uid()`) | **Full Access** |
| `public.session_private_details` | **YES** (Migration 0007) | **YES** | **YES** (Host only) | **Full Access** |
| `public.join_requests` | **YES** (Migration 0007) | **YES** | **YES** (Insert own request, Host updates) | **Full Access** |
| `public.check_ins` | **YES** (Migration 0009) | **YES** | **YES** (Own check-in or host) | **Full Access** |
| `public.shared_notebooks` | **YES** (Migration 0007) | **YES** | **YES** (Approved members) | **Full Access** |
| `public.room_ids` | **YES** (Migration 0005) | **YES** | **YES** | **Full Access** |
| `public.library_geofences` | **YES** | **YES** | NO | **Full Access** |
| `public.room_bookings` | NO | **YES** (Host only) | NO | **Full Access** |

> [!IMPORTANT]
> **Anonymous Read Access (Migrations 0007 & 0009):** Frontend client components using `getSupabaseBrowserClient()` can directly read `profiles`, `study_sessions`, `session_private_details`, `join_requests`, `check_ins`, and `shared_notebooks` anonymously without requiring an authenticated session.
> All write mutations should be dispatched through Next.js API routes (`/api/map/groups`, `/api/sessions`, etc.) which utilize the privileged `getSupabaseAdminClient()`.

---

### 6.4 Real-Time Table Occupancy, Presence & Sprout Display Model

Buckeye Sprouts represents physical table occupancy visually on the interactive Thompson Library floor plan using **colored tables and decorative sprout characters**:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          study_sessions (<uuid>)                            │
│  table_id: "140-1"                                                          │
│  host_id: "3f962e3e-..."  ───(Host Profile: Alex Morgan)                    │
└──────────────┬───────────────────────────────────────────────┬──────────────┘
               │                                               │
               ▼                                               ▼
┌───────────────────────────────┐               ┌─────────────────────────────┐
│         join_requests         │               │          check_ins          │
│  session_id: <uuid>           │               │  session_id: <uuid>         │
│  requester_id: "c8e8b31a-..." │               │  user_id: "c8e8b31a-..."    │
│  status: 'approved'           │               │  checked_out_at: NULL       │
│  (Member: Sam Patel)          │               │  (Currently at Table)       │
└───────────────────────────────┘               └─────────────────────────────┘
```

#### Determining Table Occupancy
For any table (e.g., `"140-1"`):
1. **Active Session Anchor:** Find the session where `table_id = "140-1"` and `status = 'active'`. (Or `room_ids.active_session_id`).
2. **The Host:** `study_sessions.host_id` -> resolve from `public.profiles`.
3. **Approved Members:** `join_requests` where `session_id = session.id` and `status = 'approved'` -> resolve from `public.profiles`.
4. **Physically Checked-In Users:** `check_ins` where `session_id = session.id` and `checked_out_at IS NULL` -> resolve from `public.profiles`.
5. **Deduplication Rule:** Combine all unique users from (3) and (4) that are not the host into `group.members`.
6. **Total Occupants:** $N = 1\text{ (Host)} + |\text{Distinct Members}|$.

#### Table Status & Sprout Mapping (`THOMPSON_TABLE_SPROUT_COUNTS`)
| Occupant Count ($N$) | Status (`ThompsonTableStatus`) | Table Color | Decorative Sprouts | Description |
| :---: | :---: | :---: | :---: | :--- |
| **0** (No active session) | `"empty"` | Green (`#22c55e`) | **0 Sprouts** | Table is vacant and available to be claimed. |
| **1** (Host only) | `"busy"` | Yellow (`#eab308`) | **1 Sprout** | 1 student studying; open for peers to join. |
| **2 or more** | `"very-busy"` | Orange (`#f97316`) | **2 Sprouts** | Active collaborative group studying together. |

---

### 6.5 Standardized TypeScript Contracts & Field Mapping

All frontend components communicate using standard contracts defined in `src/types/contracts.ts`:

#### Contract 1: `DemoStudyGroup` (The Core Interactive Map Group)
```typescript
export interface DemoStudyGroup {
  id: string;                                  // UUID matching study_sessions.id
  tableId: string;                             // e.g. "110-1", "140-1", "165-1"
  name: string;                                // study_sessions.title
  courseCode: string;                          // study_sessions.course_code (e.g. "CSE 2221")
  topic: string;                               // study_sessions.subtitle
  host: ProfilePreview;                        // Host profile object
  members: ProfilePreview[];                   // All distinct occupants currently at table
  inviteOnly: boolean;                         // study_sessions.requires_approval
  invitedProfileIds: string[];                 // Array of invited student UUIDs
  joinedAtByProfileId: Record<string, number>; // Timestamps by profile UUID
  notebookContent: string;                     // shared_notebooks.content markdown string
}
```

#### Contract 2: `ProfilePreview` (Safe Student Profile)
```typescript
export interface ProfilePreview {
  id: string;                                  // UUID matching public.profiles.id
  name: string;                                // Student name (e.g. "Alex Morgan")
  avatarUrl: string;                           // Photo URL or "" for initials
  major: string;                               // Department (e.g. "Computer Science & Engineering")
  currentCourses: string[];                    // Array of course strings (e.g. ["CSE 2221"])
  bio: string;                                 // Short bio
}
```

#### Contract 3: `ThompsonTable` (Map SVG Geometry Anchor)
```typescript
export interface ThompsonTable {
  id: string;                                  // "110-1", "140-1", etc.
  label: string;                               // "Table 110-1"
  status: "empty" | "busy" | "very-busy";      // Dynamic occupancy color state
  x: number;                                   // Center X percentage (0-100) on floor plan SVG
  y: number;                                   // Center Y percentage (0-100) on floor plan SVG
  width: number;                               // Width percentage (0-100)
  height: number;                              // Height percentage (0-100)
  groupId?: string;                            // Points to DemoStudyGroup.id if occupied
  showInSearch?: boolean;                      // True if group matches search query
}
```

#### Complete Database-to-Contract Transformation Logic (`mapDbSessionToDemoGroup`)
Found in `@/lib/map-service.ts` and `@/lib/server-groups.ts`:
```typescript
export function mapDbSessionToDemoGroup(row: any): DemoStudyGroup {
  // 1. Resolve host profile
  const hostProfile: ProfilePreview = row.profiles ? {
    id: row.profiles.id,
    name: row.profiles.name,
    avatarUrl: row.profiles.avatar_url || "",
    major: row.profiles.major || "Computer Science & Engineering",
    currentCourses: row.profiles.current_courses || [row.course_code],
    bio: row.profiles.bio || "",
  } : {
    id: row.host_id,
    name: "Study Host",
    avatarUrl: "",
    major: "Computer Science & Engineering",
    currentCourses: [row.course_code],
    bio: "",
  };

  // 2. Resolve table ID from direct column or private details
  const pRow = Array.isArray(row.session_private_details) ? row.session_private_details[0] : row.session_private_details;
  const tableId = row.table_id || pRow?.table_id || "165-1";

  // 3. Resolve shared notebook content
  const nbRow = Array.isArray(row.shared_notebooks) ? row.shared_notebooks[0] : row.shared_notebooks;
  const notebookContent = nbRow?.content || `## ${row.course_code} study notes\n[note] ${hostProfile.name} · Shared\n${row.subtitle || row.title}.`;

  // 4. Merge and deduplicate members from approved join_requests and active check_ins
  const members: ProfilePreview[] = [];
  const seenIds = new Set<string>([hostProfile.id]);

  if (Array.isArray(row.join_requests)) {
    for (const req of row.join_requests) {
      if (req.status === "approved" && req.profiles && !seenIds.has(req.profiles.id)) {
        seenIds.add(req.profiles.id);
        members.push({
          id: req.profiles.id,
          name: req.profiles.name,
          avatarUrl: req.profiles.avatar_url || "",
          major: req.profiles.major || "Buckeye Student",
          currentCourses: req.profiles.current_courses || [row.course_code],
          bio: req.profiles.bio || "",
        });
      }
    }
  }

  if (Array.isArray(row.check_ins)) {
    for (const checkin of row.check_ins) {
      if (!checkin.checked_out_at && checkin.profiles && !seenIds.has(checkin.profiles.id)) {
        seenIds.add(checkin.profiles.id);
        members.push({
          id: checkin.profiles.id,
          name: checkin.profiles.name,
          avatarUrl: checkin.profiles.avatar_url || "",
          major: checkin.profiles.major || "Buckeye Student",
          currentCourses: checkin.profiles.current_courses || [row.course_code],
          bio: checkin.profiles.bio || "",
        });
      }
    }
  }

  return {
    id: row.id,
    tableId,
    name: row.title,
    courseCode: row.course_code,
    topic: row.subtitle || (Array.isArray(row.ai_topic_tags) && row.ai_topic_tags[0] ? row.ai_topic_tags.join(", ") : "Study Session"),
    host: hostProfile,
    members,
    inviteOnly: Boolean(row.requires_approval),
    invitedProfileIds: [],
    joinedAtByProfileId: {
      [hostProfile.id]: new Date(row.created_at || Date.now()).getTime(),
      ...Object.fromEntries(members.map((m, idx) => [m.id, new Date(row.created_at || Date.now()).getTime() + idx + 1])),
    },
    notebookContent,
  };
}
```

---

### 6.6 Complete Next.js API Routes Reference

#### 1. `/api/map/groups`
Handles the interactive floor plan study group lifecycle.
- **`GET /api/map/groups`**
  - **Description:** Returns all active `DemoStudyGroup[]` populated with profiles, approved members, active check-ins, and notebooks.
  - **Headers:** `Cache-Control: no-store`
  - **Response (200):** `DemoStudyGroup[]`
- **`POST /api/map/groups`**
  - **Description:** Creates a new study session at a table, records host check-in, initializes the notebook, and updates `room_ids`.
  - **Request Body:**
    ```json
    {
      "tableId": "140-2",
      "name": "CSE 2221 Recursion Review",
      "courseCode": "CSE 2221",
      "inviteOnly": false,
      "hostProfile": { "id": "11111111-...", "name": "Alex Morgan" }
    }
    ```
  - **Response (201):**
    ```json
    { "success": true, "sessionId": "<uuid>", "groups": [...] }
    ```
- **`PATCH /api/map/groups`**
  - **Description:** Executes session state transitions.
  - **Action `join`:**
    ```json
    { "action": "join", "sessionId": "<uuid>", "profileId": "<uuid>" }
    ```
    Inserts approved `join_requests` row and active `check_ins` row (`checked_out_at: null`).
  - **Action `leave`:**
    ```json
    { "action": "leave", "sessionId": "<uuid>", "profileId": "<uuid>", "tableId": "140-2" }
    ```
    Sets `checked_out_at = now()`, marks `join_requests` as `cancelled`. If the leaving user was the host, migrates host status to the next oldest checked-in member or closes the session if empty.
  - **Action `notebook`:**
    ```json
    { "action": "notebook", "sessionId": "<uuid>", "content": "# Notes...", "profileId": "<uuid>" }
    ```
    Upserts `shared_notebooks.content` and timestamp.
  - **Action `end`:**
    ```json
    { "action": "end", "sessionId": "<uuid>", "tableId": "140-2" }
    ```
    Marks session as `closed`, checks out all occupants, and clears `room_ids.active_session_id`.

#### 2. `/api/tables/[tableId]`
- **`GET /api/tables/[tableId]?library=Thompson+Library`**
  - **Description:** Physical table QR scan resolution endpoint. Calls `lookup_active_session_by_table` RPC.
  - **Response (200):**
    ```json
    {
      "tableId": "140-1",
      "location": { "libraryName": "Thompson Library", "floor": "Level 1", "tableNumber": "140-1" },
      "hasActiveSession": true,
      "sessionId": "<uuid>",
      "hostName": "Sam Patel",
      "session": { "id": "<uuid>", "title": "Sam's Group", "courseCode": "MATH 1151" }
    }
    ```

#### 3. `/api/sessions`
- **`GET /api/sessions?courseCode=CSE+2221&libraryName=Thompson+Library&status=active`**
  - Lists sessions matching optional query filters.
- **`POST /api/sessions`**
  - Creates a new session from standard `createSessionSchema` (requires Bearer token or demo header).

#### 4. `/api/sessions/[id]/join`
- **`GET /api/sessions/[id]/join`**: Returns viewer's join status and full host review queue.
- **`POST /api/sessions/[id]/join`**: Submits a join request (`pending` if approval required).
- **`PATCH /api/sessions/[id]/join`**: Host approves or rejects request (`decision: "approved" | "rejected"`).

#### 5. `/api/sessions/[id]/check-in`
- **`GET /api/sessions/[id]/check-in`**: Returns current user's active check-in receipt.
- **`POST /api/sessions/[id]/check-in`**: Records optical table QR or BuckID check-in.
- **`DELETE /api/sessions/[id]/check-in`**: Checks out user from the table.

#### 6. `/api/rooms/book`
- **`POST /api/rooms/book`**: Initiates group study room reservation when 3-person quorum is reached.

#### 7. `/api/ai/summarize`
- **`POST /api/ai/summarize`**: Generates "Catch Me Up" study synthesis or ambient topic tags.

#### 8. `/api/ai/feedback`
- **`POST /api/ai/feedback`**: Streams Socratic tutoring feedback over a raw UTF-8 `ReadableStream`.

---

### 6.7 Frontend Connection Recipes & React State Architecture

#### Recipe 1: Reading Live Table Groups from Client Components
```typescript
import { fetchGroupsDirectFromSupabase } from "@/lib/map-service";

// Inside a React component or refresh handler:
async function loadGroups() {
  // Option A: Direct Supabase client query (fastest, client-side cached)
  let groups = await fetchGroupsDirectFromSupabase();

  // Option B: Fallback to Next.js API route
  if (!groups || groups.length === 0) {
    const res = await fetch("/api/map/groups");
    if (res.ok) {
      const data = await res.json();
      groups = Array.isArray(data) ? data : data.groups;
    }
  }

  // Update component state or dispatch to reducer:
  dispatchGroup({ type: "sync-from-db", groups });
}
```

#### Recipe 2: Subscribing to Realtime Database Mutations
```typescript
import { useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export function useRealtimeTableSync(onUpdate: () => void) {
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    // Listen for changes to study_sessions, check_ins, and notebooks
    const channel = supabase
      .channel("live-table-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "study_sessions" }, () => onUpdate())
      .on("postgres_changes", { event: "*", schema: "public", table: "check_ins" }, () => onUpdate())
      .on("postgres_changes", { event: "*", schema: "public", table: "join_requests" }, () => onUpdate())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onUpdate]);
}
```

#### Recipe 3: Creating a Group at a Table
```typescript
import { createSessionInSupabase } from "@/lib/map-service";

const newGroupInput = {
  tableId: "140-2",
  name: "Calculus Study Circle",
  courseCode: "MATH 1151",
  inviteOnly: false,
};

// Calls POST /api/map/groups:
const response = await createSessionInSupabase(newGroupInput, currentProfile);
if (response.success) {
  console.log("Created session UUID:", response.sessionId);
  // Syncs the updated group list directly from database:
  dispatchGroup({ type: "sync-from-db", groups: response.groups });
}
```

#### Recipe 4: Joining a Table / Study Session
```typescript
// Calls PATCH /api/map/groups with action="join":
const res = await fetch("/api/map/groups", {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    action: "join",
    sessionId: targetSessionId,
    profileId: currentProfile.id,
  }),
});
const data = await res.json();
if (data.success && data.groups) {
  dispatchGroup({ type: "sync-from-db", groups: data.groups });
}
```

#### Recipe 5: Leaving a Table
```typescript
// Calls PATCH /api/map/groups with action="leave":
await fetch("/api/map/groups", {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    action: "leave",
    sessionId: activeGroup.id,
    profileId: currentProfile.id,
    tableId: activeGroup.tableId,
  }),
});
dispatchGroup({ type: "leave", profileId: currentProfile.id });
```

---

### 6.8 Known Pitfalls & Solutions for Frontend Agents

1. **Mock Profile IDs vs Supabase Foreign Keys**:
   - `MOCK_PROFILES[0].id` is `"11111111-1111-4111-8111-111111111111"`.
   - In Supabase, foreign keys on `study_sessions`, `join_requests`, and `check_ins` point to `public.profiles(id)` which references `auth.users(id)`.
   - **Solution**: The API route `/api/map/groups` automatically resolves any mock UUID or student name to a valid database profile (e.g. Alex Morgan -> `3f962e3e-6507-4df4-b806-9eaba48c8443`). When building new API routes or server actions, always resolve caller profile IDs via `.eq("id", profileId).maybeSingle()` and fallback to `profiles.select("id").limit(1)`.

2. **Supabase Row-Level Security (RLS) on Check-Ins**:
   - Migration 0009 grants `SELECT ON public.check_ins TO anon;`. If querying `check_ins` from the browser, always filter for `checked_out_at IS NULL` to obtain active occupants.

3. **Table ID Naming Conventions**:
   - All Level 1 Thompson tables follow the format `"<cluster>-<index>"`, such as `"110-1"`, `"140-1"`, `"165-1"`, `"150b-1"`, etc. Always match table IDs exactly when querying or updating `room_ids` or `study_sessions.table_id`.

4. **SSR vs CSR Hydration**:
   - In `DashboardPage` (`src/app/page.tsx`), `fetchLiveMapGroups()` is called server-side and passed into `<ThompsonMap initialGroups={liveGroups} />`. Client-side components should initialize their reducer with `initialGroups` to prevent layout shift or visual flickering.
