# Current Product Direction: Buckeye Sprouts Frontend

This section is the current user-approved source of truth for the Buckeye Sprouts prototype. It narrows the older architecture notes below to frontend UI/UX and in-memory/mock state flows only. Do not add backend databases, unrequested architecture, or features that have not been specified. Retain existing integrations unless a user-approved phase explicitly changes them.

## Product context

- **App name:** Buckeye Sprouts. Existing code may still say BuckeyeStudy; the UI name is to be updated as work is approved.
- **Core concept:** Students publish where they are sitting in a library and what course they are studying so classmates can find and join them.
- **Hackathon needs:** A functional, polished prototype for communication, breadth, and impact. Physical BuckID/NFC and live GPS behaviors must have clear frontend simulation controls so judges can demonstrate those flows without hardware.
- **Current visual foundation:** Follow the existing `src/app/AGENTS.md` phone-first, calm, map-first style. Do not invent or redesign layouts beyond the specifications and decisions the user approves.

## Scope and check-in protocol

1. Work on frontend presentation and mock state only. Do not implement backend services, databases, or unrelated architecture.
2. Do not improvise features, behavior, data, or layout. If a required detail is ambiguous, stop before implementing that detail and ask the user.
3. Work in the numbered phases below, one phase at a time. Do not begin a later phase until the user explicitly approves the preceding phase.
4. **Phase 0:** Update this document, audit the current frontend against all four phases, report what exists and what is missing/deviates, ask blocking clarification questions, and stop for the user's response. Do not modify application code in Phase 0.
5. After each implementation phase, show the phase result, verify it against its listed requirements, ask about any unresolved edge cases, and wait for explicit approval before proceeding.
6. Treat examples as examples. Do not turn them into additional product requirements without user approval.
7. Put new shared domain/map types and mock fixture data in `src/types/contracts.ts` before consuming them from feature components. Feature files should import the canonical contract types and fixtures rather than duplicate those shapes or demo profiles. Keep rendering and interaction logic in the owning feature.

## Phase 1 — Map View and Group Search

- Replace the current Groups-tab session rows with map-based Group Search.
- Show the Thompson Library East Entrance / Oval floor plan (Level 1) as part of the same pannable and zoomable campus map surface, with nearby campus streets/landmarks still visible. Auto-zoom to Thompson when Group Search opens.
- Use the provided Level 1 SVG so the plan stays vector-sharp. Keep zoom and map-pan bounds in `src/types/contracts.ts`: scale 1.0 minimum, 3.6 absolute maximum, and a viewport-aware cap while the plan is open so at least 50% of its area remains visible. Do not expose blank space past the campus drawing. Align the plan and location/group/room markers through the same `xMidYMid slice` artwork projection; render clickable controls in an unscaled marker layer so text and icons remain crisp at every zoom.
- While Group Search is active, keep the course search and all matching clickable group rows in the bottom sheet. Dragging the sheet down tucks it beneath the bottom navigation and fades it out; dragging up from the bottom navigation reveals and expands it. Clicking Groups while it is selected toggles the sheet closed; clicking it again reopens the sheet.
- Keep the Group Search sheet and bottom navigation mostly transparent so the campus and embedded floor plan remain visible beneath them. Keep future UI layered over the map similarly translucent.
- Keep the map canvas mounted as a persistent layer while switching bottom-navigation pages. Tab changes must not reset its camera, pan/zoom, floor-plan visibility, location, or selection; change map state only through direct user map interactions.
- Support pinch-to-zoom on the map, respecting the existing zoom and pan bounds.
- Keep the map's visible location control fixed at 15 × 15 CSS pixels and icon-only, with an accessible name and a transparent hit area for touch.
- Add a class/course-number search field (for example, `CSE 2221`) and filter the visible group pins as the query changes.
- Use local demo groups on this floor, such as Jordan's group at Table X for CSE 2221 and Sam's group at Table Y for MATH 1151. Keep them frontend-only and use the Alex, Jordan, and Sam demo profiles.
- Show table states as **empty**, **busy**, or **very busy**. There are no full tables; users may still join a group at a very busy table.
- Selecting a group row or map pin opens an information pop-up with:
  - an `X` close button at the top-left;
  - the group name as its heading;
  - a study-status subheading containing course number and custom topic/subtitle;
  - one scrolling profile list containing the host first (profile image and name), followed by the other joined members' profile images and names. The host row is not sticky; it scrolls with every member row.
- Do not show available seat counts or table photos in this pop-up; the user selected neither.
- Existing demo avatar URLs are empty; show initials as the profile-image fallback.
- At the end of Phase 1, show and verify only this phase's Map View / Group Search experience, then wait for approval.

## Phase 2 — Group Join/Create, State 1 (not in a group)

- The bottom-navigation tab for joining/creating a group initially shows only one primary action: `Tap BuckID Reader` (or an equivalent visual scan trigger).
- Activating it shows a clear scanning/loading state that simulates a BuckID/NFC or QR table-reader interaction.
- Provide a small development/demo toggle to exercise both location outcomes:
  - **Existing group:** Show `Join [Host Name]'s Group?`, the same group heading, course/topic study status, and scrolling host-first participant list as Phase 1, plus a confirmation action to join.
  - **No existing group:** Show `Create Group?` and the sequential inputs/actions below.
- A very busy table does not block joining; do not present a full-table state or reject a join solely because of group busyness.
- The create flow must include:
  1. Group name defaulting to `[Profile-Name]'s Group`; focusing the input selects all default text for easy replacement.
  2. Searchable study-status/course selection.
  3. An `Invite only` on/off toggle.
  4. A `Create` confirmation that moves the mock UI into Phase 3 / State 2.
- At the end of Phase 2, demonstrate State 1, selected default text, and both outcomes; wait for approval.

## Phase 3 — Current Group, State 2 (in a group)

- Replace the join/create tab content with a draggable current-group sheet over the map:
  - collapsed: cover only the lower part of the screen and leave the map visible;
  - expanded by swiping up: cover the full screen over the map.
- Place a **red `Leave group` button in the top-right** of the group tab.
- On host departure, if members remain, transfer host status to the earliest-joined remaining member. If no members remain, close the group posting.
- Automatically leave when the user moves more than **150 m** from the group location; provide a discreet `Simulate Walking Away (GPS Trigger)` action for this mock geofence flow.
- Include an editable shared Group Notebook and an AI Summary / Catch-Up section that summarizes its current mock notes for incoming members.
- Clean up the Notes tab presentation within the existing phone-first visual style. Whenever the user starts a new-note action, expand the Notes UI fully to make room for note entry.
- Reuse the existing notebook components and connect them to the current group's frontend mock state; do not rebuild the notebook UI from scratch.
- In the current-group view, provide the requested polished Carmen study-suggestion chatbot behind a circular star button. Use mock Carmen/course data only and make the simulated source clear; do not connect to Carmen Canvas.
- At the end of Phase 3, demonstrate sheet dragging, the leave control, host succession, GPS simulation, and notebook/catch-up UI; wait for approval.

### Existing notebook implementation status

- `NotebookPanel` currently mounts `CollectiveGroupNotebook` in the Notes tab. Its `notebook` prop is passed as `null` from the home page, and the visible notes/catch-up panels are not yet connected to the selected group's notebook state.
- `AppleNotesManager`, `CatchMeUpBanner`, and `CarmenAiChatbot` provide reusable UI. The current catch-up copy is fixed demo text; the chatbot uses scripted Carmen-style replies and currently opens from a star pill in the Notes heading rather than the circular star control required in the current-group view.
- `NotebookEditor`, `PadletBoard`, `GroupAgendaChecklist`, `StickyUnitTaskPadlet`, `IndividualAiRecommendations`, and `AmbientTopicBanner` also exist. Treat these as existing prototype pieces, not completed Phase 3 requirements unless they are needed to satisfy the approved notebook/catch-up behavior.
- Connect editable notes and catch-up to the active group's frontend-only mock state before marking the Phase 3 notebook requirement complete. Keep any optional AI endpoints and persistence behavior within the approved frontend/mock scope.

## Phase 4 — Invite-only host, State 3

- Only when the current user is the host of an invite-only group, show a host invite search within the current-group view.
- The host must be able to search a student by profile ID or name and grant an invitation to join.
- Do not show this control for other roles or non-invite-only groups.
- At the end of Phase 4, show and verify the role/visibility behavior and ask about any remaining edge cases.

## Phase gates and unresolved choices

- Never continue beyond the current phase on the assumption that elapsed time or a preview implies approval.
- Confirmed for Phase 1: replace the current Groups tab, embed and auto-zoom to the Thompson East Entrance Level 1 plan on the campus map, seed local dummy groups using Alex/Jordan/Sam, keep all clickable group rows visible in the sheet, support drag and selected-tab toggle to hide it plus bottom-bar drag to expand it, make map overlays mostly transparent, use a fixed 15 × 15 px visual location control with a transparent touch hit area, and omit both seat count and table photo. The host appears first but scrolls with the other profiles. Do not ask these resolved questions again.
- Confirmed table and geofence behavior: tables use empty/busy/very busy states only; users may join at very busy tables; mock GPS auto-leave triggers beyond 150 m from the group location.
- Keep all mock interactions local to the frontend. Do not claim that simulated scan, membership, GPS, invite, notebook, or AI actions are backed by live services.

---
# BuckeyeStudy — Multi-Agent System Architecture & Directives (`AGENTS.md`)

**HackOHIO 2026 Project Architecture & Maximum Score Directives**  
**Project:** BuckeyeStudy (Real-Time Library Seat Finder, BuckID/QR Check-In & AI Study Notebook)

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
  2. **The Reinvention:** BuckeyeStudy shifts library study space from static room reservations to a decentralized, real-time peer network powered by:
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

4. **HackOHIO Rubric Compliance:**
   - **Curiosity:** Feature incorporates innovative functionality (hardware integration, geofencing, ambient AI, photo verification).
   - **Connections:** UI is polished with Scarlet/Gray tokens and includes 1-click judge simulation toggles.
   - **Creating Value:** Directly addresses student library pain points and remains resilient under network/hardware failures.
   - **Navigating Challenges:** Document hardware and location limitations with resilient local demo fallbacks.


<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
