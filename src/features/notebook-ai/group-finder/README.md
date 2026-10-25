# Gemini group finder

Open **Groups > Ask AI** to describe a course, topic or seat requirement. The conversation supports follow-up questions, and **View group** rechecks availability before opening the existing map details. It never joins or reserves a seat. **New chat** clears the conversation; closing the popup retains it until reload.

## Configuration

Add to `.env.local` and your deployment's server environment, then restart or redeploy:

```dotenv
GEMINI_API_KEY=your_google_ai_studio_key
GEMINI_MODEL=gemini-3.5-flash-lite
```

Only `GEMINI_API_KEY` is required. `GEMINI_MODEL` overrides the default model ID. Keep both server-side, with no `NEXT_PUBLIC_` prefix. Existing Supabase URL/public-key/service-role settings provide database access; no new migration or dependency is required. Use a Google AI Studio Gemini API key, not a Vertex AI service-account JSON file.

The implementation uses Google's [generateContent REST API](https://ai.google.dev/api/generate-content), [structured JSON output](https://ai.google.dev/gemini-api/docs/generate-content/structured-output), and the stable [Gemini 3.5 Flash-Lite model](https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite).

## Data access and responses

`POST /api/ai/find-groups` accepts `{ messages: [{ role: "user" | "assistant", content: "..." }] }`. The final message must be from the user. Limits are 10 messages, 2,000 characters per message, and 12,000 characters total. The client keeps the latest bounded conversation window and omits leading assistant messages.

Each request reads active Thompson Library sessions anchored to registered Level 1 tables and counts distinct active check-ins. Full groups are excluded. Only session IDs, descriptions, courses, public topic tags, floor/library, seat counts and approval flags reach Gemini. The database query deliberately excludes private details, notebooks and student profiles. Check-in identities are counted on the server and never sent to Gemini or returned by this endpoint. There are no database writes, model tools, arbitrary SQL or browser-visible API keys.

The response contains `reply`, up to three hydrated `matches`, `source: "gemini" | "basic"`, `dataSource: "database" | "cached"`, and an optional database snapshot timestamp/notice. Model recommendations are schema-validated and restricted to the current catalog's IDs. Student prompts and group text are treated as untrusted data; unavailable attributes such as noise levels and schedules must not be invented.

`GET /api/ai/find-groups?sessionId=...` checks that a recommendation is still open, without calling Gemini. A group that filled or disappeared returns 409. Live availability checks never bypass invitations or membership rules.

## Fallback and verification

Missing keys, rejected keys, quota errors, timeouts and invalid output produce clearly labeled **Basic matching** against the fresh catalog. Database or network failures let the client match its existing map groups with a **Cached map data** label. Empty cached data produces an empty state, not invented recommendations. Requests are cancelled when closing/resetting the conversation; Gemini requests have a 20-second timeout.

Run the feature tests with:

```powershell
node --test src/features/notebook-ai/group-finder/group-finder.test.mjs
npm.cmd run build
```

After setting a real key, ask for a course with an open group, refine with a seat or invitation preference, confirm the response is labeled **Gemini / Live groups**, then open the recommendation. Repeat without the key to verify the labeled basic fallback. Live verification requires network access to both Supabase and Google.
