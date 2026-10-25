# HackOHIO 2026 — Official Open Track Judging Rubric & Project Alignment

> **MANDATORY DIRECTIVE FOR ALL AGENTS & DEVELOPERS:**  
> Every agent and developer must read, understand, and evaluate their feature implementation against this rubric **before writing code**. Every feature must clearly demonstrate how it fulfills the 3 core judging criteria below.

---

## The Rubric at a Glance

```
┌─────────────────────────┐  ┌─────────────────────────┐  ┌─────────────────────────┐
│        CURIOSITY        │  │       CONNECTIONS       │  │     CREATING VALUE      │
├─────────────────────────┤  ├─────────────────────────┤  ├─────────────────────────┤
│ • Innovation            │  │ • Communication         │  │ • Impact                │
│ • Curiosity             │  │ • Project Breadth &     │  │ • Growth Mindset        │
│                         │  │   Complexity            │  │   (Navigating           │
│                         │  │                         │  │   Challenges)           │
└─────────────────────────┘  └─────────────────────────┘  └─────────────────────────┘
```

---

## 1. Curiosity

Judges evaluate whether the team pursued novel ideas, pushed technical boundaries, and demonstrated intellectual curiosity.

### Key Pillars:
* **Innovation:** Does the project introduce creative, non-obvious solutions to real student problems rather than building a generic CRUD app?
* **Curiosity:** Did the team explore ambitious technologies, device APIs, and advanced system integrations?

### Buckeye Sprouts Implementation:
* **Physical-to-Digital Bridge:** Instead of relying on manual "I'm sitting here" text updates, Buckeye Sprouts integrates camera-based 1D BuckID barcode scanning (HTML5 Barcode Detection API / Codabar / Code 128) and physical Table QR codes.
* **Geofenced Automated Departure:** Employs the Haversine formula on active `navigator.geolocation` streams to calculate distance from library venues, automatically freeing abandoned tables when a host leaves the perimeter.
* **Ambient Multi-Session Intelligence:** Rather than isolated note-taking, ambient AI monitors active session topics across library floors to surface nearby study clusters.
* **Crowd & Surroundings Verification:** Uses camera captures to provide visual landmark and crowd density proof to prevent "phantom seat" hunting.

---

## 2. Connections

Judges evaluate the clarity of presentation, user experience, team communication, and overall architectural breadth.

### Key Pillars:
* **Communication:** Is the UI/UX intuitive, polished, and immediately understandable to a first-time user or judge? Can the project be demonstrated cleanly within a 3-minute pitch?
* **Project Breadth and Complexity:** Does the project bridge multiple technical disciplines (frontend, backend, hardware/device APIs, real-time collaboration, generative AI, offline PWA)?

### Buckeye Sprouts Implementation:
* **Judge-Ready Demo Simulator:** Every feature constrained by physical reality (GPS walking, physical BuckID cards, camera scanners, university room SSO) includes a clear 1-click **"Simulate / Test Mode"** toggle in the UI for effortless judging presentations.
* **Student-to-Student Connection:** Facilitates safe, privacy-preserving academic connections with host approval drawers, blurred table coordinates for unapproved viewers, verified BuckID badges, and course tagging.
* **Contract-First Architecture:** A 4-workstream feature-sliced architecture (`auth-profiles`, `sessions-discovery`, `location-checkin`, `notebook-ai`) unified by strict TypeScript contracts (`src/types/contracts.ts`).
* **Ohio State Campus Theming:** Consistent, accessible Buckeye branding (`#ba0c2f` Scarlet, `#a7b1b7` Gray), responsive mobile layout, and PWA installation.

---

## 3. Creating Value

Judges evaluate real-world utility, user impact, and the engineering resilience demonstrated when overcoming real-world obstacles.

### Key Pillars:
* **Impact:** Does the application solve an authentic, acute campus problem with measurable value for students?
* **Growth Mindset (Navigating Challenges):** How did the team anticipate, navigate, and overcome technical bottlenecks, edge cases, and failure modes?

### Buckeye Sprouts Implementation:
* **Direct Campus Impact:** Library overcrowding at Thompson and 18th Avenue during midterms/finals is one of the biggest daily pain points at Ohio State. Buckeye Sprouts eliminates 20+ minute wandering searches, optimizes table utilization, and helps students find peer study partners for challenging courses (CSE 2221, MATH 1151, ENGR 1181).
* **Navigating Technical Challenges (Growth Mindset):**
  1. *Challenge — Campus Wi-Fi dead-zones (e.g. Thompson stacks or 18th Ave basement):*  
     **Solution:** Built as an offline-first PWA with Service Worker asset caching, an `/offline` vault, and an emergency offline BuckID pass.
  2. *Challenge — Judging environment constraints (no physical cards or indoor GPS locks):*  
     **Solution:** Built-in deterministic simulation controls allowing judges to test 100% of physical features directly from desktop Chrome.
  3. *Challenge — Privacy and personal safety in public libraries:*  
     **Solution:** Multi-tier privacy gate masking table IDs and surroundings photos until the host explicitly reviews and approves the requester's profile.
  4. *Challenge — API rate limits / offline hackathon presentation:*  
     **Solution:** Full mock-first fallback resiliency across all services (AI streaming and Supabase store) guaranteeing zero crashes if external APIs are unreachable.

---

## Workstream Alignment Matrix

Every agent must ensure their workstream addresses all 3 criteria:

| Agent / Workstream | Curiosity Focus | Connections Focus | Creating Value Focus |
| :--- | :--- | :--- | :--- |
| **Agent 1: Auth, Profiles & Privacy Gate** | Profile trust scoring & verification hashing | Real-time Host Approval Drawer with instantaneous accept/decline feedback | Solves student privacy/safety by masking table locations and surroundings photos |
| **Agent 2: Discovery, Feed & Room Booking** | Preemptive room-booking trigger when group quorum is reached | Visual surroundings photo cards & multi-faceted course filtering | Eliminates wasted campus walking time; automates group study room reservation |
| **Agent 3: Location Check-In & Geofencing** | HTML5 Barcode/Codabar detection for BuckIDs + Haversine geofence calculation | Judge-friendly simulation controls for GPS walking and table QR scan | Stops table-hogging and phantom reservations via auto-checkout |
| **Agent 4: Collaborative Notebook & AI** | Floor-wide ambient group topic matching & inline AI tutoring | Instant "Catch Me Up" 3-bullet onboarding for new arrivals | Accelerates peer learning and collaborative exam preparation |

---

## Pre-Code Verification Checklist for All Agents

Before writing code or marking a task complete, verify:
- [ ] **Curiosity:** Is there a clear, innovative element in your implementation rather than basic boilerplate?
- [ ] **Connections (Demo Readiness):** Does your feature have a visible, 1-click test/simulation trigger so judges can evaluate it immediately without special hardware?
- [ ] **Connections (UI/UX):** Is your UI styled with Scarlet & Gray design tokens and clear visual state indicators?
- [ ] **Creating Value (Impact):** Does your feature directly reduce student friction in finding, joining, or working at a study table?
- [ ] **Creating Value (Growth Mindset & Resiliency):** Does your feature gracefully fall back to local mock data if external APIs or device sensors fail?
