# Study Session Discovery and Creation Backend Plan

## Scope

Build a backend that lets an eventual frontend call an HTTP endpoint to create a study session and persist it. Keep this slice within session discovery and creation. Do not prescribe or implement a frontend. Discovery should use the same backend/service boundary and return safe session previews.

## Current state and constraints

- `src/types/contracts.ts` defines `StudySession` and `CreateSessionInput` (a session without server-assigned `id`, `hostId`, `createdAt`, or `aiTopicTags`). `SessionPreview` omits `tableId`, `surroundingsPhotoUrl`, and `gpsCoordinates`. In this actual contract, `libraryName` is a `string`; the AGENTS.md example contract describes a `LibraryVenue` union, so agree on an allowlist/compatibility approach without silently editing the shared type.
- `src/features/sessions-discovery/services.ts` has list/get backed by a process-local mock store; `createSession` currently throws `FeatureNotImplementedError`.
- `src/lib/supabase.ts` uses an anonymous Supabase client when configured and otherwise falls back to mock state. That state is process-local and is not reliable across serverless instances.
- The foundation migration separates public `study_sessions` data from restricted `session_private_details` (table ID, photo path, GPS), enables RLS, and deliberately grants no writes or policies pending validation and transactional RPCs.
- There is no implemented authentication flow. `mockViewerId` is currently used. The environment example includes only the public Supabase URL and anon key, not a service-role key.
- The rooms API route demonstrates the repository's Zod request validation and typed `ApiError` response style; it is not the session-creation endpoint.
- `AGENTS.md` assigns discovery services to `src/features/sessions-discovery/**`, API ownership currently names `src/app/api/rooms/**`, and treats shared contracts as immutable absent explicit coordination.

## Implementation sequence

1. **Set the API contract and ownership.** Add `POST /api/sessions` at `src/app/api/sessions/route.ts` as the button-callable create endpoint, and assign that route to Workstream 2 alongside `src/features/sessions-discovery/**`. The current ownership matrix names only `/api/rooms/**`, so coordinate that ownership update before implementation. Keep `GET /api/sessions` as a follow-up only if the frontend needs HTTP discovery; the existing server-rendered feed can continue using the service. Keep persistence and mapping in the discovery service and route handlers thin. Leave `src/types/contracts.ts` unchanged unless a backward-compatible addition is explicitly agreed.

2. **Define the create request and response.** Accept the established `CreateSessionInput` shape (`title`, `subtitle`, `courseCode`, `libraryName`, `tableId`, `totalSeats`, `availableSeats`, `surroundingsPhotoUrl`, `requiresApproval`, `status`, optional `scheduledFor`, `gpsCoordinates`, and optional `floor`/`zone`) and validate it at the HTTP boundary with Zod: required strings, a venue allowlist agreed from the documented campus venues (the shared type currently allows any string), bounded positive seat counts, valid status and schedule semantics, coordinate ranges/radius, and bounded text. Require `scheduledFor` for scheduled sessions and validate the schedule rule with the product owner. Reject server-owned fields (`id`, `hostId`, `createdAt`, `aiTopicTags`) rather than trusting client values. The service generates these values. Return `201 Created` with the created safe `SessionPreview`; use stable `ApiError` responses for malformed input (`400`), missing identity (`401`), denied writes (`403`), and persistence failures (`5xx`). Never include `tableId`, photo path/URL, or GPS in discovery responses.

3. **Set identity and privacy rules before enabling writes.** In configured/persistent mode, derive `hostId` from verified Supabase Auth on the server; never accept it from the request body. The current `mockViewerId` is not authentication. For the no-credentials demo path, use only an explicitly enabled deterministic demo identity and clearly identify the result as ephemeral mock data; do not imply that it was stored in the database. If Supabase is configured but auth or a write is denied, return an error instead of silently switching to mock success. Do not expose or use a service-role key in browser code. Define authorization for private detail reads separately from public listing.

4. **Persist public and private fields safely.** Map public metadata to `study_sessions` and table ID, photo storage path, and GPS coordinates to `session_private_details`. Create both records atomically through a database transaction/RPC (or another proven atomic mechanism); a partial session must not appear in discovery if private-detail insertion fails. Add only the minimum required insert/select grants and RLS policies after deciding the identity model. The migration currently has no write path, so the anonymous client cannot safely create persisted rows as configured today. Avoid a service-role bypass until ownership, input validation, and authorization are specified.

5. **Implement the service and resilient fallback.** Replace `createSession`'s not-implemented error with a service method that enforces mapping invariants, generates server-owned fields, writes through the selected persistence adapter, and returns a `SessionPreview`. Keep deterministic mock creation/listing when Supabase is not configured and demo mode is explicitly enabled; identify that response as mock/ephemeral (for example, a documented response header). A successful response in persistent mode means both rows committed to Supabase. If Supabase is configured and a database/auth/RLS operation fails, return an error; never silently report mock data as durable success. Mock state remains process-local and may disappear across restarts or instances.

6. **Add the HTTP route and discovery integration.** Implement the agreed thin route with JSON parsing, validation, typed errors, and appropriate status codes (for example, 201 on creation, 400 for invalid input, 401/403 for identity/authorization failures, and a safe 5xx for persistence failures). Route `GET` discovery through the service and ensure only `SessionPreview` data leaves the public listing. Existing server-rendered feed loading can continue to call the service; no UI changes are in scope.

7. **Integrate room booking later as a separate operation.** Session creation should not pretend a room has been booked. Keep `/api/rooms/book` and its simulation distinct from creating a session; if later linked, define an explicit booking state/response contract and handle booking failure without losing the created session.

## Decisions the implementation must resolve

- Who owns `src/app/api/sessions/**`, since the current ownership matrix only assigns the rooms API route?
- What verified identity is available for `hostId`, and what is the accepted demo-only behavior before auth exists?
- What minimal RLS policies or transactional RPC authorize atomic writes to both tables while protecting private details?
- Is the foundation migration intentionally a read-only scaffold, and should write grants/RPC be added in a coordinated migration?
- Which exact create fields should be required, optional, defaulted, or rejected, without breaking the shared contract?
- Should callers be told when the service used ephemeral mock persistence, and what API error/result shape communicates that?

## Rubric fit

- **Curiosity:** A real create-and-discover path connects study sessions to campus places, with private table/GPS data separated for later physical check-in integration.
- **Connections:** A stable HTTP contract lets an undecided frontend invoke creation from a button. No physical device is required by this backend slice, so simulator UI work is outside scope; preserve deterministic mock behavior for a fast judge demo.
- **Creating Value:** Durable discovery helps students find available study seats. Atomic writes, safe previews, and an explicit mock fallback prevent partial records and keep the demo useful when Supabase configuration is absent.

## Acceptance and validation recommendations

- A valid POST returns `201`, assigns identity/server fields server-side, commits both public and private rows in persistent mode, and returns only a `SessionPreview`.
- Bad JSON, unknown keys, spoofed server-owned fields, invalid venue/status/date/seat/coordinate values, and out-of-range text fail before writes. Unauthenticated or unauthorized requests return stable typed errors and do not write rows.
- Injected private-row/RPC failure rolls back the public row; a configured Supabase write/RLS failure returns an error rather than mock success.
- Discovery/listing returns only safe previews, omits private data and storage paths, and private fields remain unavailable to unapproved viewers under RLS. Check `Cache-Control: no-store` on API responses.
- In explicitly enabled mock mode, create followed by list/get works in the same process, is marked ephemeral/mock, and missing Supabase configuration does not crash the route. Do not treat that check as proof of database persistence.
- There is no dedicated test framework or current session API coverage: `scripts/smoke.mjs` does not exercise session creation, while `check:foundation` validates types/fixtures/source parsing rather than behavior. After implementation is authorized, add focused API/service checks for POST success/errors, create-to-list behavior, safe projections, GET filtering if a GET route is added, and mock fallback. Validate the real transaction and RLS path against a disposable Supabase project after a write migration/RPC exists; run the repository build separately. Confirm shared contracts were not changed without agreement and room booking remains independent.
