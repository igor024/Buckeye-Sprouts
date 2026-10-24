# BuckeyeStudy Auth and Profiles Implementation Plan

Planning document for the `auth` branch. Before any implementation begins, confirm the checked-out branch is exactly `auth`; keep all auth work on that branch and do not switch to or commit work on another branch. This file describes work to do; it does not claim that any of the planned implementation or validation has been completed.

## Scope and architecture

The project architecture is defined in `AGENTS.md`. Auth, profiles, privacy gating, and host approval belong to Agent 1 / Workstream 1, strictly under `src/features/auth-profiles/**`. Agent 1 may read shared contracts and shared adapters, but must not edit `src/types/contracts.ts`, `src/lib/supabase.ts`, or any migration. Core/shared files, database migrations, `src/lib/**`, app routes, and other workstreams are outside the auth feature's ownership. The Lead owns and coordinates any optional contract additions, new migration, transactional RPC, RLS policy, or Storage policy required by this plan; Agent 1 should submit a concrete proposal and wait for that coordination before integrating against it.

The rubric goals for this work are:

- **Curiosity:** connect identity and verified student status to the physical BuckID check-in experience while keeping the verification boundary trustworthy.
- **Connections:** provide a clear Scarlet and Gray profile, privacy, and approval flow; include an obvious one-click simulation path for demo verification.
- **Creating Value:** let students find and join study groups without exposing precise table locations prematurely, and preserve a useful deterministic demo when Supabase or credentials are unavailable.

## Current repository state

- `src/features/auth-profiles/services.ts` is server-only. Profile reads and host-only request listing currently use fixtures from `src/lib/supabase.ts`; `updateProfile`, `verifyBuckId`, `requestJoin`, and `reviewJoinRequest` throw `FeatureNotImplementedError`.
- `src/features/auth-profiles/components/ProfileCard.tsx` renders the preview profile, a generic privacy notice, and a disabled edit button. It has no verification status or working edit/verification flow.
- `src/features/auth-profiles/components/ApprovalQueue.tsx` filters pending requests, but approve and reject buttons are disabled and marked as scaffold stubs.
- `src/lib/supabase.ts` creates a server-only Supabase client from `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`, or selects process-local mock fixtures when unconfigured. `toProfilePreview` strips `buckIdHash`; the mock identity is explicitly not real auth. The module warns that process memory is not shared or persistent.
- `src/types/contracts.ts` is the shared source of truth. It has `UserProfile.buckIdHash`, a safe `ProfilePreview`, `AuthProfilesService` operations, join request types, and session access types. It currently lacks an explicit `verifiedAt`/verification-status field and a raw scan is accepted as a service method argument. Do not send the hash or raw scan to client components. Any shape change must be proposed as a backward-compatible optional contract change and approved by the lead.
- `supabase/migrations/202610240001_foundation.sql` is the existing Supabase foundation migration. It defines `profiles`, backend-only `profile_identities`, discovery-safe `study_sessions`, private session details, `join_requests`, and other application tables; it enables RLS and grants reads only. It intentionally does not grant production writes or implement the transactional approval RPC. It includes private surroundings storage and approved-member reads, but no Storage upload policy.
- `src/app/session/[id]/page.tsx` and `src/app/page.tsx` are core integration surfaces owned by the lead. Coordinate auth state, request actions, and location reveal integration there; do not edit them from the auth workstream.

## Phased implementation

### Phase 1 — Start a local Supabase database

1. Install and start Docker Desktop, then install the Supabase CLI using the supported method for the developer's OS. From the repository root, initialize Supabase only if the existing `supabase/` project configuration is missing; preserve the existing migration and do not generate a competing schema.
2. Start the local stack with `supabase start`. Record the local API URL, anon key, and database connection details printed by the CLI. Create a local `.env.local` from those values, using at least:

   ```dotenv
   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<local Supabase anon key>
   ```

   Never place a service-role key in a `NEXT_PUBLIC_*` variable or browser bundle. Any future server-only service credential must use a non-public environment variable and remain confined to a trusted server boundary.
3. Apply the already-present migration with `supabase db reset` (which recreates the local database and applies migrations). Use `supabase migration list` to confirm `202610240001_foundation.sql` is applied. Do not rerun or edit schema manually in a way that diverges from migrations.
4. Seed only synthetic accounts and fixtures. Prefer a new, separately reviewed seed script or Supabase seed file coordinated with the lead; do not add raw BuckID data, real student identifiers, or production identities. Ensure the seed creates matching `auth.users` and `public.profiles` rows if testing real local sign-in. The current SQL migration seeds library geofences, not auth users or sample profiles.
5. Restart the Next.js dev server after changing `.env.local`. Verify the local URL/key are the CLI's local values and that absent variables still select the existing mock mode. Keep `.env.local` out of version control.

### Phase 2 — Define identity and profile lifecycle

1. Decide and document the real sign-in/sign-up mechanism before implementation: choose the configured Supabase Auth flow (for example, email magic link/password or an approved OAuth provider) based on provider availability and product needs. Do not imply OSU SSO or institutional identity verification unless it is actually configured and validated. Implement sign-up/sign-in, email/OAuth callback handling as applicable, and sign-out through Supabase Auth.
2. Bootstrap the authenticated identity from the server-validated Supabase session for the initial render and refresh/rotate session tokens through the framework's supported SSR cookie integration. Keep browser session handling aligned with the server session; do not trust a client-provided user ID or stale profile state. On sign-out, clear the Supabase session/cookies and return the UI to the unauthenticated state.
3. Treat missing, expired, revoked, or invalid sessions as unauthenticated: reject protected reads/writes, clear stale UI state, and direct the user back to sign-in with a recoverable message. Never fall back to a mock identity when a real configured session expires or fails; reserve mock identity for an explicitly selected demo mode. Derive the acting user exclusively from the verified Supabase Auth session on the server. Never accept a caller-supplied `userId` as authority for profile ownership or host privileges.
4. Add the auth feature's server-side adapter operations in `src/features/auth-profiles/services.ts`: get the current authenticated user's profile, read only fields appropriate for the viewer, and update allowed profile fields. Validate and normalize input server-side, reject edits to identity/verification or ownership fields, and return `ProfilePreview` only.
5. Create the profile row on first sign-in using the Auth UUID as `profiles.id`; account deletion should cascade according to the existing foreign keys. Handle missing/incomplete profile fields with an onboarding state, not fabricated verified identity.
6. Implement profile editing in `ProfileCard.tsx` or a component within the owned directory. Show a meaningful verified/unverified state only after the Lead has coordinated an approved contract representation. Do not label a demo profile as institutionally verified.

### Phase 3 — Add secure BuckID verification

1. Agree with the lead and Workstream 3 on the payload boundary. `CheckInPayload.rawCode` (named `rawIdentifier` in the AGENTS.md architecture snapshot) is sensitive scanner input; it must be submitted only to an authenticated server endpoint/service and must never be persisted, logged, returned, placed in browser storage, or included in analytics/errors.
2. Implement verification behind a trusted server-only operation. Normalize scanner input in memory, validate expected barcode format and length, and verify it against a trusted, authorized source or a deliberately provisioned allowlist/credential. A syntactically plausible arbitrary barcode is not proof of Ohio State identity. If no trusted verification source is available, present verification as unavailable/demo-only and do not mark the account verified.
3. Store only a keyed HMAC or equivalent keyed digest in `profile_identities.buck_id_hash`. Compute it server-side after validation using a dedicated secret such as `BUCKID_HMAC_KEY` stored only in a server-only environment variable (never `NEXT_PUBLIC_*`, source control, browser config, or client bundle). Provision a distinct random development key for local use through an ignored `.env.local` or local secret manager; provision production secrets through the deployment secret manager, with rotation and access limited to the verification service. Do not reuse Supabase anon/service-role keys as the HMAC key. Do not use an unsalted plain hash for a low-entropy or enumerable identifier. Do not put a digest in the client. Consider a uniqueness conflict, account recovery/rebinding, rate limits, replay resistance, and retention policy before enabling production verification.
4. Ensure the raw scanned code exists only in transient request memory while verification runs: never persist it, log it, include it in error/trace/analytics payloads, echo it in a response, or put it in browser storage. Return only a generic success/failure and the safe profile preview. Scrub or avoid request-body logging in middleware and observability tooling.
5. Keep camera/BuckID scanning in the location workstream. Auth owns the verification result and profile trust state; the lead coordinates any necessary endpoint or contract change. Add a conspicuous one-click **Simulate / Test Mode** path that uses synthetic fixtures only, is visibly labeled as simulated, and cannot create a production-verified status.

### Phase 4 — Requests, approvals, and seat capacity

1. Implement `requestJoin(sessionId)` using the authenticated user's identity, rejecting self-requests, duplicate requests, closed sessions, and sessions already at capacity. The existing unique constraint on `(session_id, requester_id)` supplies a database backstop; define whether a previously rejected request can be resubmitted and implement that rule consistently.
2. Implement `listJoinRequests(sessionId)` so only the session host can see requester previews. Keep `buck_id_hash`, raw scan data, and private session location out of the queue payload.
3. Implement `reviewJoinRequest(requestId, decision)` through a database transaction/RPC coordinated with the lead, because the current migration explicitly withholds writes and notes the missing atomic approval operation. The transaction must lock or conditionally update the session/request, confirm the caller is the host, require a pending request and non-closed session, and on approval require available seats > 0. In the same transaction, change the request to approved and decrement `available_seats` exactly once. Rejecting changes request state without decrementing seats. Repeated decisions must be idempotent or return a clear conflict; concurrent approvals must never overbook. Ensure seat count cannot become negative and never exceeds `total_seats`.
4. Wire enabled controls and pending/empty/loading/error/success states in `ApprovalQueue.tsx`. Refresh or subscribe to the queue only through an authorized server/data path. Communicate approval to the requester and reveal private location only after server-confirmed membership.
5. Coordinate with Workstream 2 on session creation, public discovery fields, and `available_seats`, and with Workstream 3 on check-in membership. The host is implicitly allowed by `can_access_session`; approved requests are the existing membership source of truth.

### Phase 5 — Database security and policy completion

1. The Lead owns migration and database policy work. Agent 1 must not edit `supabase/migrations/202610240001_foundation.sql` or add a migration. Submit a policy/RPC requirements proposal to the Lead. The Lead should review current grants/RLS and implement approved changes in a new migration; existing policies intentionally cover reads only. Never edit an already-applied migration as a shortcut.
2. Add narrowly scoped profile policies: authenticated users may update their own editable profile fields only; clients must not insert/update `profile_identities`, change a verification digest, or read identity rows. Keep `profile_identities` on trusted service-role/server-only access. Add explicit profile visibility rules matching the intended join-request and discovery experience instead of assuming all authenticated profile fields can be read by everyone.
3. Add policies/RPC-only writes for join requests. Requesters may create a request for themselves under allowed session/capacity conditions and read their own status; only the host may review requests. Prevent direct client updates to `status`, `requester_id`, or seat counts. Prefer RPC validation for race-sensitive rules and revoke direct table writes that bypass it.
4. Preserve the separation of public `study_sessions` from `session_private_details`. Only hosts and approved members may fetch exact table/GPS and obtain a short-lived signed photo URL. Verify anonymous discovery, locked-session access, requester access, approved-member access, and host access independently.
5. Complete private Storage policies: host-only upload to a path bound to the host's session, size/type limits, no public bucket access, and approved-member-only reads through the existing relationship. Avoid permitting arbitrary object names or cross-session overwrites.
6. Check policies for `check_ins`, `shared_notebooks`, `room_bookings`, and Realtime as adjacent integrations. Auth must not create broader grants to unblock other workstreams; coordinate each owner. Do not expose service-role credentials to the browser.

### Phase 6 — UI and end-to-end integration

1. Add sign-in/sign-out and profile onboarding entry points to the existing app surfaces through lead coordination. Respect the `ProfilePreview` boundary in client props and keep Supabase Auth session handling server-aware.
2. Replace the disabled edit and approval controls with pending/error/success states, accessible labels, keyboard support, and clear privacy explanations. Present the join button only when the viewer can request access; render exact location/photo only after server-confirmed host/member access.
3. Provide an explicit demo mode with synthetic users and requests. Include one-click verification simulation, request submission, and host approve/decline so judges can complete the physical-to-digital scenario quickly. Label simulated verification and never conflate it with real BuckID validation.
4. Preserve mock-first resilience. Extend deterministic mock behavior only within `src/features/auth-profiles/**`; clearly show demo state and do not assume browser and server in-memory stores are shared or persistent. If local Supabase is unavailable, retain a coherent demo, while production-auth failures must not silently authenticate as another user.
5. Coordinate Scarlet/Gray styling and location reveal behavior with the core app and other workstreams; do not cross their file boundaries.

## Acceptance criteria

- Local setup instructions reproducibly start Supabase and apply the existing foundation migration; reset/seed uses synthetic data and leaves no secret in source control.
- Real profile operations derive identity from Supabase Auth, validate allowed updates, and return safe previews. Unauthenticated or cross-user profile mutations fail.
- Raw BuckID values never reach persistent storage, logs, client props, or telemetry. A real verified state requires trusted validation; the demo path is visibly simulated and isolated.
- A requester sees only their request status; only the host can see and act on the host queue. Locked users cannot obtain table, GPS, or photo details.
- Approval reserves one seat atomically, rejection reserves none, repeated actions cannot double-decrement, and simultaneous approvals cannot exceed capacity.
- RLS and Storage checks cover anonymous, requester, approved member, host, and unrelated authenticated user cases. Direct table writes cannot bypass approval/capacity rules.
- Profile edit, request, approval, rejection, and simulator flows expose usable loading and error states and work with the deterministic offline/mock fallback.
- Integration is reviewed with Workstreams 2 and 3 and the lead; shared contract changes are proposed and approved before implementation.
- Validation after implementation should include the repository's `npm run typecheck`, `npm run check:foundation`, and `npm run build`, plus local Supabase policy/RPC scenarios and demo fallback walkthrough. These are planned checks and have not been run for this document.

## Coordination proposals and contract gaps

- Keep the existing contract immutable during the auth implementation unless the lead approves a small backward-compatible addition for profile verification state/timestamp and any session host/member authorization detail needed by the UI.
- Reconcile naming drift before touching shared payloads: AGENTS.md describes `buckIdBarcodeHash`, `rawIdentifier`, `coordinates`, `floorLevel`, and `scheduledTime`; current `contracts.ts` uses `buckIdHash`, `rawCode`, `gps`, optional `floor`, and `scheduledFor`.
- The migration's `profiles` table has no `rank`, while the AGENTS.md snapshot mentions it; the current checked-in contract also omits `rank`. Avoid adding it as part of auth without a product/schema agreement.
- The service contract currently accepts `rawCode` in `verifyBuckId` and does not expose a verification-state field. Keep any raw input server-only and propose a safer service boundary/optional profile field with the lead and Workstream 3.
- The migration makes profile reads authenticated-wide, while the approval queue displays bio and major. Confirm the privacy requirement, then narrow profile RLS or return a deliberately limited requester preview where needed.
- The existing migration says join requests should reserve capacity atomically, but contains no approval RPC and grants no auth writes. A new migration and coordinated server adapter are prerequisites for real persistence.

## Assumptions and risks

- The checked-out `auth` branch contains the scaffold state summarized above; confirm branch and working-tree state before implementation begins, and keep all subsequent auth work on `auth`.
- Local Supabase CLI and Docker are developer prerequisites; exact installation steps vary by OS. The migration targets Supabase services and is not a plain PostgreSQL schema script.
- No OSU identity provider or authoritative BuckID verification service is currently evidenced in the scaffold. Until one is approved and provisioned, real verification must remain unavailable or explicitly simulated.
- A plain hash of a barcode can be guessed offline; keyed digests and strict server boundaries reduce that risk but still require careful secret management and policy review.
- `src/lib/supabase.ts` currently reads only public URL/anon-key variables and is a shared, lead-owned file. Database admin operations and service-role use require a separately coordinated server-only adapter; never silently expand this shared client.
- In-memory fixtures are not durable and can differ across browser/server processes or serverless instances. They support judge demos only, not production authorization, audit, or capacity guarantees.
