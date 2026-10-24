# BuckeyeStudy

A Next.js App Router + TypeScript foundation for an Ohio State study group finder.
This handoff intentionally contains read-only feature previews, deterministic mock
services, shared contracts, and API stubs. It does not implement the four features.

## Run locally

Requires Node.js 20.9+ and npm. In Windows PowerShell, use `npm.cmd` if script policy
blocks the `npm.ps1` wrapper.

```sh
npm install
npm run dev
```

Open http://localhost:3000. No environment variables are required. Optionally copy
`.env.example` to `.env.local`. The optional Supabase client is created when both
public variables are set; **feature adapters remain mocks even when configured**.
Replace each adapter within its own workstream when ready. Never use a service-role
key in a `NEXT_PUBLIC_` variable.

```sh
npm run check:foundation
npm run typecheck
npm run build
npm start
# In another terminal, with the server running:
npm run smoke
```

`smoke` checks dashboard/session rendering, locked-session privacy, unknown-session
404s, API validation, mock AI streaming, and the 501 room-booking stub. Set
`SMOKE_BASE_URL` to check a different local port. No external services are called.

`check:foundation` verifies shared contract types, source syntax, feature import
boundaries, and fixture references. It cannot replace a full-project build. In a
restricted offline environment, it can use an existing compiler by passing its
absolute `typescript.js` path as an argument.

## Progressive Web App (PWA)

BuckeyeStudy is configured as a standalone Progressive Web App designed for resilient campus use in low-connectivity areas (e.g., Thompson quiet stacks or 18th Avenue basement):

- **Web App Manifest**: Configured via `src/app/manifest.ts` and `public/manifest.json` with Ohio State scarlet branding (`#ba0c2f`), maskable icons, and quick-action shortcuts.
- **Service Worker (`public/sw.js`)**: Provides asset caching, smart network-first navigation with offline fallback, and notification listeners for room booking updates.
- **Offline Vault (`/offline`)**: Dedicated offline fallback page featuring an emergency offline BuckID barcode pass and a local persistent scratchpad.
- **Installation & Testing UI (`PwaManager.tsx`)**: Exposes native PWA install triggers for Chrome/Edge/iOS and a judge-friendly **"Simulate Offline"** button to evaluate offline behavior without disabling device network adapters.

## Deploy to GitHub Pages

This repository is configured for automated static export deployment to GitHub Pages via GitHub Actions (`.github/workflows/deploy.yml`):

1. On GitHub, navigate to **Settings** > **Pages** for your repository (`igor024/hackohio2026`).
2. Under **Build and deployment** > **Source**, select **GitHub Actions**.
3. Push changes to `main`. The workflow automatically runs foundation checks, type checks, builds the static export (`output: export` with repository `basePath`), and deploys to `https://igor024.github.io/hackohio2026/`.
4. *Note on static hosting:* GitHub Pages serves static files (HTML/JS/CSS/PWA assets). Serverless POST route handlers (`/api/ai/*`, `/api/rooms/book`) require an active Node server (or full-stack host like Vercel). For static deployment, client services continue to use built-in mock fixtures.



## Shared boundaries

`src/types/contracts.ts` is the single source of truth for domain models, safe view
models, service interfaces, API shapes, and synthetic Ohio State fixtures. Each
feature exports one service object explicitly typed to its shared interface.
Service adapters currently run on the server; browser components should receive
safe DTO props and call authenticated API/server action boundaries in future work.

`src/lib/supabase.ts` is server-only and exports the optional client, a cloned in-memory mock store,
safe projection helpers, and a fixed **synthetic** viewer (Alex Morgan). This viewer
is a fixture, not authentication. Server processes and browsers do not share mock
memory; hot reload/restart resets it. Do not expose the raw store to client bundles.
For direct browser Realtime/Auth, add a browser client module inside its owning
feature with public environment variables; never import the server mock store.
Read methods return copies. Mutation and realtime methods throw the shared
`FeatureNotImplementedError`; booking returns an explicit `stub` response.

`src/lib/ai-client.ts` is server-only. It configures the Vercel AI SDK provider and
exports optional summarization/streaming helpers. Without `OPENAI_API_KEY`, they
return null. API routes intentionally return deterministic mock output regardless
of credentials. Add real auth, membership verification, and rate limiting before
wiring a live model. Do not submit private notes from unrelated nearby sessions;
ambient discovery should expose only consented topic tags.

## Parallel workstreams

| Owner | Exclusive feature folder | Owned integration endpoints | Start here |
| --- | --- | --- | --- |
| 1 · Profiles and approval | `src/features/auth-profiles/` | Add auth endpoints inside a new namespace | `ProfileCard`, `ApprovalQueue`, `AuthProfilesService` |
| 2 · Session discovery | `src/features/sessions-discovery/` | Add session endpoints inside a new namespace | `SessionFeed`, `SessionsDiscoveryService` |
| 3 · Location and booking | `src/features/location-checkin/` | `src/app/api/rooms/book/route.ts` | `LocationStatus`, `LocationCheckInService` |
| 4 · Notebook and AI | `src/features/notebook-ai/` | `src/app/api/ai/**` | `NotebookPanel`, `NotebookAIService` |

The integrator owns shared contracts, libraries, configuration, lockfile, global
styles, app layout, and page composition. Feature developers should add components,
client hooks, local CSS modules, and helpers only inside their assigned folder and
owned route namespace. Coordinate changes to shared interfaces before editing them.
Add future migrations as separate timestamped files; do not edit the foundation
migration in parallel. Coordinate new package dependencies through the integrator.

Do not import another feature's components or services from a feature folder.
Compose features in `src/app/`. Keep current component props stable to avoid page
edits. Implementations can split the current adapters into browser/server modules
within their feature folder without modifying shared contracts.

## Database and privacy

Apply `supabase/migrations/202610240001_foundation.sql` to a fresh **Supabase** project
using the Supabase CLI (`supabase db push` after linking) or SQL editor. The migration
depends on Supabase Auth, Storage, and Realtime schemas; it is not applied by npm.
Synthetic user/session fixtures live only in TypeScript, so no fake Auth accounts
are inserted. Library geofences are illustrative campus coordinates, not surveyed
boundaries. Confirm real boundaries before implementing automatic checkout.

The database uses snake_case; service adapters map rows to camelCase contracts.
Join-request reads join `profiles` into `requesterProfile`; approved requests grant
membership, and the host is always a member. Identity hashes live in a separate
backend-only table. Public session rows omit exact tables, photo paths, and GPS.
Those fields live in an RLS-protected table. Storage uses a private `surroundings`
bucket; authorize first, then generate short-lived signed photo URLs.

The migration grants **read access only** to application tables. Workstream writes
must add validated policies/RPCs in their own migrations. Approval must atomically
reserve seats and handle concurrent requests; clients must not approve themselves.
The notebook snapshot includes a database revision for future conflict handling.
Private Broadcast/Presence channels use `notebook:<session UUID>`. Disable public
Realtime access in the Supabase dashboard before enabling subscriptions; revoke or
disconnect channels when membership is removed. Live collaboration is not wired.

## API handoff

All routes accept JSON, reject unknown fields, use `Cache-Control: no-store`, and
set `X-Scaffold-Source: mock`. Errors use `ApiError`. Identity is the fixed demo
viewer, never a caller-supplied user ID. These are local demo boundaries; replace
them with verified Supabase Auth before production data is connected.

| POST route | Input | Output |
| --- | --- | --- |
| `/api/ai/summarize` | `AISummarizeRequest`: session UUID + `catch_me_up` or `ambient` | `AISummarizeResponse` JSON from saved fixtures |
| `/api/ai/feedback` | `AIFeedbackRequest`: session UUID, question, optional selection | UTF-8 `text/plain` stream; consume with `response.body`, not AI SDK UI/SSE |
| `/api/rooms/book` | `RoomBookingRequest`: session UUID, library, room, ordered ISO UTC timestamps | HTTP 501 + `RoomBookingResponse` with `status: "stub"`; no reservation |

Example host session: `aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa`. Locked session:
`bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb`. Only the former exposes location/notebook
fixtures for the fixed viewer. Missing sessions return 404; inaccessible sessions
return 403 from AI/booking endpoints.

Workstream 3 should lazy-load `html5-qrcode` only in a client component and request
camera/GPS permissions from a user action on HTTPS or localhost. BuckID barcode
input maps to `method: "buck_id"`; NFC is an optional device capability, not a
dependency or an identity trust signal. Do not log/persist raw scans. GPS watchers
must unsubscribe, account for accuracy, and close only the authenticated host's
session. Mobile browsers may suspend background GPS; server-side expiry/heartbeat
is needed for reliable checkout. Room booking needs provider auth, signed webhook
verification, and idempotency before external calls are enabled.
