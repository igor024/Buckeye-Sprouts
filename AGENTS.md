# Current Product Direction: Buckeye Sprouts Frontend

This section is the current user-approved source of truth for the Buckeye Sprouts prototype. It narrows the older architecture notes below to frontend UI/UX and in-memory/mock state flows only. Do not add backend databases, unrequested architecture, or features that have not been specified. Retain existing integrations unless a user-approved phase explicitly changes them.

## Product context

- **App name:** Buckeye Sprouts. Existing code may still say BuckeyeStudy; the UI name is to be updated as work is approved.
- **Core concept:** Students publish where they are sitting in a library and what course they are studying so classmates can find and join them.
- **Hackathon needs:** A functional, polished prototype for communication, breadth, and impact. Physical BuckID/NFC and live GPS behaviors must have clear frontend simulation controls so judges can demonstrate those flows without hardware.
- **Current visual foundation:** Follow the existing `src/app/AGENTS.md` phone-first, calm, map-first style. Do not invent or redesign layouts beyond the specifications and decisions the user approves.
- **Latest approved UI overrides:** Use solid grid-paper surfaces, squiggle dividers beneath tab/note titles, no frosted glass, and matched panel/navigation widths with a 12px gap. These decisions supersede older translucent-glass and overlapping-navigation instructions.

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
- Use solid grid-paper sheets and bottom navigation, following the latest approved UI overrides. Keep the surrounding map visible through placement and sheet sizing.
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

- Selecting Group while not in a group shows only a standalone `Tap BuckID Reader` action over the persistent map; do not open a sliding sheet in this state.
- Activating it opens an animated, explicitly simulated reader popup for three seconds. Do not implement NFC, barcode or camera scanning. Disable repeated activation and cancel pending scans when closed or when switching tabs.
- Resolve the nearest Thompson Level 1 table from the displayed location using the same unzoomed floor-plan projection as the map. If location is unavailable or outside the campus drawing, use and visibly label the existing Thompson demo location. Do not request GPS automatically.
- Resolve these outcomes from shared local table/group state, rather than an outcome toggle:
  - **Existing group:** Show a grid-paper `Join [Host Name]'s Group?` popup, the same group heading, course/topic study status, and scrolling host-first participant list as Phase 1, plus explicit confirmation to join. Invite-only groups require an invitation; a simulated tap does not bypass it.
  - **No existing group:** Show a grid-paper `Create Group?` popup with sequential steps: name, searchable course selection, then Invite only and Create. Create at the resolved table, never a hardcoded table.
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
  - expanded by swiping up: fill the available screen above navigation, retaining the 12px gap.
- Place a **red `Leave group` button in the top-right** of the group tab.
- Keep the bottom-bar Group label unchanged. Once joined, selecting it opens current-group details without scanning again. Leaving returns to the standalone reader action.
- Keep membership, host succession, invitations, occupancy and notebook content synchronized across Group Search, Group, Notes and map popups in frontend state only.
- On host departure, if members remain, transfer host status to the earliest-joined remaining member. If no members remain, close the group posting.
- Automatically leave when the user moves more than **150 m** from the group location; provide a discreet `Simulate Walking Away (GPS Trigger)` action for this mock geofence flow.
- Include an editable shared Group Notebook and an AI Summary / Catch-Up section that summarizes its current mock notes for incoming members.
- Clean up the Notes tab presentation within the existing phone-first visual style. Whenever the user starts a new-note action, expand the Notes UI fully to make room for note entry.
- Reuse the existing notebook components and connect them to the current group's frontend mock state; do not rebuild the notebook UI from scratch.
- In the current-group view, provide the requested polished Carmen study-suggestion chatbot behind a circular star button. Use mock Carmen/course data only and make the simulated source clear; do not connect to Carmen Canvas.
- At the end of Phase 3, demonstrate sheet dragging, the leave control, host succession, GPS simulation, and notebook/catch-up UI; wait for approval.

### Existing notebook implementation status

- `NotebookPanel` mounts `CollectiveGroupNotebook` in Notes and the current-group view. Both use the active group's local notebook state, course and participant count.
- `AppleNotesManager` has one note type with no category selector or badges. `CatchMeUpBanner` summarizes the current mock notes; `CarmenAiChatbot` uses scripted course replies and opens from a circular star in the current-group heading.
- `NotebookEditor`, `PadletBoard`, `GroupAgendaChecklist`, `StickyUnitTaskPadlet`, `IndividualAiRecommendations`, and `AmbientTopicBanner` also exist. Treat these as existing prototype pieces, not completed Phase 3 requirements unless they are needed to satisfy the approved notebook/catch-up behavior.
- Editable notes and catch-up now consume the active group's frontend-only mock state through the existing notebook components. Preserve that connection. Keep any optional AI endpoints and persistence behavior within the approved frontend/mock scope.

## Phase 4 — Invite-only host, State 3

- Only when the current user is the host of an invite-only group, show a host invite search within the current-group view.
- The host must be able to search a student by profile ID or name and grant an invitation to join.
- Grant an invitation separately from membership: the invited student still confirms joining at the simulated reader.
- Do not show this control for other roles or non-invite-only groups.
- At the end of Phase 4, show and verify the role/visibility behavior and ask about any remaining edge cases.

## Phase gates and unresolved choices

- Never continue beyond the current phase on the assumption that elapsed time or a preview implies approval.
- Confirmed for Phase 1: replace the current Groups tab, embed and auto-zoom to the Thompson East Entrance Level 1 plan on the campus map, seed local dummy groups using Alex/Jordan/Sam, keep all clickable group rows visible in the sheet, support drag and selected-tab toggle to hide it plus bottom-bar drag to expand it, use the latest solid grid-paper surfaces, use a fixed 15 × 15 px visual location control with a transparent touch hit area, and omit both seat count and table photo. The host appears first but scrolls with the other profiles. Do not ask these resolved questions again.
- Confirmed table and geofence behavior: tables use empty/busy/very busy states only; users may join at very busy tables; mock GPS auto-leave triggers beyond 150 m from the group location.
- Keep all mock interactions local to the frontend. Do not claim that simulated scan, membership, GPS, invite, notebook, or AI actions are backed by live services.

## Implementation handoff — 2026-10-24

This records the implemented prototype and prior verification, not approval of a new phase or proof that every phase requirement is complete. The user authorized the reader/group implementation plan and then requested this documentation update. Preserve the implemented flows while waiting for further direction; do not restart Phase 0 solely because a new session begins.

### Approved presentation decisions

- Preserve the phone-first, iOS-inspired campus-map composition. The local reference is `reference/image.webp`; prefer the reference directory over an expired Discord attachment URL.
- Notes has one note type, with no category selector or category badges. Do not restore the removed legacy note categories or their terminology.
- Use subtle sage grid-paper backgrounds and squiggle dividers beneath tab and note titles. These dividers implement the requested scratched-out title treatment. Do not reintroduce frosted glass or backdrop blur.
- All tab sheets and bottom navigation share `--map-panel-width: min(588px, calc(100% - 32px))`. Keep their edges aligned across tabs rather than tuning widths independently.
- Navigation and panels/dialogs retain a 12px gap through the shared safe-area-aware CSS variables (`--app-panel-bottom`, `--app-popup-bottom`). Keep long content internally scrollable and the root map viewport fixed.
- Reader, note-editor and Carmen dialogs use body portals so sheet transforms and clipping do not interfere with positioning. Preserve keyboard focus handling, Escape/close controls and reduced-motion support.

### Code ownership and shared state

- `src/types/contracts.ts` owns shared map/domain types and fixtures, including `DemoStudyGroup`, `DemoGroupState`, `DemoCreateGroupInput`, `DemoReaderLocation`, `CampusMapViewport`, `MOCK_DEMO_STUDY_GROUPS`, `DEMO_GROUP_COURSES` and the 3000ms reader delay. Import these rather than copying profiles or group shapes into features.
- `src/features/campus-map/components/ThompsonMap.tsx` owns the shared group reducer and composes the persistent map, search, Group, Notes and popups. Table occupancy and visible group data derive from this state. Preserve map mounting/camera state across tab changes.
- `src/features/location-checkin/group-demo.ts` owns pure local join/create/leave/invite/notebook/end-session transitions. It clones fixtures so interactions cannot mutate the canonical seed data.
- `src/features/campus-map/map-geometry.ts` owns `artworkPointToViewport`, `getPlanGeometry` and `resolveDemoReaderLocation`. `IntegratedCampusMap` uses these same helpers and reports reader location to the shell.
- `src/features/location-checkin/components/GroupJoinManager.tsx` owns the reader animation and sequential dialogs; its exported `CurrentGroupPanel` renders the active group and host invitation controls.
- `src/app/components/GroupRoster.tsx` is the common host-first scrolling roster for discovery and reader/current-group details. Empty avatar URLs fall back to initials.

### Reader and membership behavior to preserve

- A user without an active group sees only the standalone `Tap BuckID Reader` action on Group. It opens a clearly simulated three-second popup; it never accesses NFC, barcode or camera APIs.
- Cancel the pending timer when the dialog closes, the tab changes or the component unmounts; prevent repeated activation. Reduced motion suppresses animation without shortening the three-second simulation.
- Resolve the nearest table from the latest displayed location using the shared unzoomed floor-plan projection. Camera pan/zoom must not change which table is nearest. Missing, invalid or out-of-artwork coordinates use the visibly labeled Thompson demo location. GPS remains an explicit user action.
- The projection depends on viewport dimensions because the embedded plan has a responsive width cap. Do not replace it with raw latitude/longitude distance or compare coordinates from different spaces.
- An existing posting opens an explicit join confirmation, not automatic membership. Invite-only access is enforced in the reducer as well as the UI. Very busy tables remain joinable.
- An empty table opens name, searchable course, then privacy/Create steps. The default name is selected on focus and click only while it still equals the profile-based default. Require a selected course; create at the resolved table.
- New group IDs retain the `local-` prefix. Use `createDemoGroupId()`, whose fallback supports ordinary HTTP/LAN previews where `crypto.randomUUID` may be unavailable.
- Joining/creating opens the draggable current-group sheet; selecting Group again shows details without scanning. Keep the Group navigation label and top-right red `Leave group` control.
- Invitations are grants, not membership. Only an invite-only host can search the canonical demo profiles by name/ID and invite them. Confirmation at the reader still adds the member and consumes the invitation.
- Host departure transfers ownership to the earliest-joined remaining member; ordinary member departure preserves the host. The last member leaving closes the posting even if unused invitations remain. Remaining groups retain their notebook content.
- The GPS departure control currently simulates moving over 150m and dispatches the same leave transition. Do not describe this as a verified automatic live geofence; actual distance-based automatic departure remains a separate requirement to audit before claiming Phase 3 complete.
- State is in memory and resets on reload. No cross-device membership, invitation delivery or durable group notebook persistence is provided by this flow.

### Notebook and Carmen integration

- Reuse `NotebookPanel` / `CollectiveGroupNotebook` in Group and Notes. Both consume the active group's notebook content, course, viewer, Level 1 and actual participant count; pre-group notes have a separate local draft.
- Starting a new note expands the owning sheet. Catch-up reflects current mock notes; edits made in Group must be visible in Notes and vice versa.
- The circular star in the current-group heading opens Carmen. Its banner, reminders and scripted suggestions use the active group's course, with an honest fallback when mock data is absent. Do not reuse CSE recursion replies for unrelated courses.
- Carmen is explicitly simulated and uses existing mock course/profile data. Do not connect Canvas or add new AI/backend services as part of maintenance on this flow.

### Verification and development lessons

- Use `npm.cmd` in this Windows PowerShell environment; `npm.ps1` is blocked by execution policy. Existing dependencies are sufficient; no browser test framework was added.
- Relevant checks: `node scripts/check-group-demo.mjs`, `npm.cmd run typecheck`, `npm.cmd run build`, and `git diff --check`. These passed for the implementation before this documentation-only update.
- The group check covers nearest-table projection at multiple viewport sizes, fallback location, valid table/course creation, invitation gating, invitation versus membership, duplicate joins, host succession, group closure, notebook retention, very-busy joins, fixture immutability and ID generation without crypto support.
- Prior browser checks verified three-second timing, cancellation/tab switching, no NFC access or automatic GPS request, both reader outcomes, selected default name, course filtering, invite visibility, synchronized notes/search/map details, Carmen course context, leave/GPS simulation and persistent map state.
- Responsive checks covered 320×568, 375×667, 390×844, 473×1024 and 1440×900, plus short viewports, safe-area insets and reduced motion. Check panel/navigation clearance again when changing heights, portals or safe-area variables.
- Browser screenshots, `results.json` and the ad hoc CDP script are under ignored `out/reader-review/`; these are local review artifacts, not committed tests. The script uses a configured local preview port, which may need updating. Do not assume an old preview server still exists or serves the latest build.
- If using headless Chrome for local checks, launch a dedicated profile under ignored `out/`, use an unused debugging port and close only that browser afterward. Do not reuse an unrelated existing debugging service. In this environment `--disable-gpu` was needed for reliable CDP touch events; reconnecting CDP may reset viewport emulation.
- Keep browser profiles and screenshots outside `.next/`, which production builds replace. Do not stop unrelated processes just to reclaim a preview port.
- Restricted-network builds may log an existing SessionsDB `fetch failed` message and still succeed through the mock fallback. Distinguish that known fallback from a new build failure; do not add database work to silence it.
- Existing staged work may belong to the user. Preserve index state and unrelated changes; do not commit or reset them without instruction.

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
