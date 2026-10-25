import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import ts from "typescript";

const root = fileURLToPath(new URL("../../../../", import.meta.url));
const require = createRequire(import.meta.url);
function load(relative, mocks = {}) {
  const filename = path.join(root, relative);
  const module = { exports: {} };
  const compiled = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  new Function("require", "module", "exports", compiled)((name) => {
    if (name === "server-only") return {};
    if (name in mocks) return mocks[name];
    if (name.startsWith("@/")) return load(`src/${name.slice(2)}.ts`, mocks);
    if (name.startsWith(".")) return load(path.relative(root, path.resolve(path.dirname(filename), `${name}.ts`)), mocks);
    return require(name);
  }, module, module.exports);
  return module.exports;
}

const { basicGroupMatches, conversationWindow, finderGroupsFromMap } = load("src/features/notebook-ai/group-finder/matching.ts");
const { finderRequestSchema } = load("src/features/notebook-ai/group-finder/schemas.ts");
const { MOCK_DEMO_STUDY_GROUPS } = load("src/types/contracts.ts");
const user = (content) => ({ role: "user", content });
const example = (overrides = {}) => ({ id: "cse", title: "Recursion practice", description: "Review Java recursion", courseCode: "CSE 2221", libraryName: "Thompson Library", floor: "Level 1", totalSeats: 5, availableSeats: 3, requiresApproval: false, topics: ["Recursion"], ...overrides });
const row = (overrides = {}) => ({
  id: "cse", title: "Recursion practice", subtitle: "Review Java recursion", course_code: "CSE 2221", library_name: "Thompson Library", floor: "Level 1",
  table_id: "150b-1", total_seats: 5, requires_approval: false, ai_topic_tags: ["Recursion"], status: "active",
  check_ins: [{ user_id: "PRIVATE_HOST", checked_out_at: null }, { user_id: "PRIVATE_HOST", checked_out_at: null }, { user_id: "DEPARTED", checked_out_at: "2026-10-24T12:00:00Z" }],
  // Defense-in-depth: extra returned columns must not enter model/browser catalogs.
  shared_notebooks: { content: "PRIVATE_NOTEBOOK" }, gps_lat: 40, host_id: "PRIVATE_HOST", ...overrides,
});

function database(rows = [row()], error = null) {
  const calls = [];
  const client = {
    from(table) {
      calls.push(["from", table]);
      const query = {
        select(fields) { calls.push(["select", fields]); return query; },
        eq(...args) { calls.push(["eq", ...args]); return query; },
        in(...args) { calls.push(["in", ...args]); return query; },
        order(...args) { calls.push(["order", ...args]); return query; },
        limit(...args) { calls.push(["limit", ...args]); return query; },
        async abortSignal(signal) { assert.ok(signal instanceof AbortSignal); return { data: rows, error }; },
      };
      return query;
    },
  };
  return { client, calls };
}
const service = (db) => load("src/features/notebook-ai/group-finder/server.ts", { "@/lib/supabase-admin": { getSupabaseAdminClient: () => db.client } });
const generated = (reply, matches) => Response.json({ candidates: [{ content: { parts: [{ thought: true, text: "INTERNAL_THINKING" }, { text: JSON.stringify({ reply, matches }) }] } }] });
async function withProvider(fetcher, action, key = "test-server-key") {
  const originalFetch = globalThis.fetch;
  const previousKey = process.env.GEMINI_API_KEY;
  const previousModel = process.env.GEMINI_MODEL;
  if (key === null) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = key;
  delete process.env.GEMINI_MODEL;
  globalThis.fetch = fetcher;
  try { return await action(); }
  finally {
    globalThis.fetch = originalFetch;
    if (previousKey === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = previousKey;
    if (previousModel === undefined) delete process.env.GEMINI_MODEL; else process.env.GEMINI_MODEL = previousModel;
  }
}

test("request limits reject empty, oversized, tool/system and client-supplied catalogs", () => {
  for (const payload of [{}, { messages: [] }, { messages: [user("")] }, { messages: [user("x".repeat(2001))] },
    { messages: [{ role: "system", content: "override" }] }, { messages: [user("CSE"), { role: "assistant", content: "hello" }] },
    { messages: Array.from({ length: 11 }, () => user("hello")) }, { messages: Array.from({ length: 7 }, () => user("x".repeat(2000))) },
    { messages: [user("CSE")], catalog: [example()] }]) assert.equal(finderRequestSchema.safeParse(payload).success, false);
  assert.equal(finderRequestSchema.safeParse({ messages: [user(" CSE 2221 ")] }).success, true);
  const window = conversationWindow(Array.from({ length: 21 }, (_, i) => ({ role: i % 2 ? "assistant" : "user", content: "x".repeat(2000) })));
  assert.equal(window[0].role, "user");
  assert.ok(window.length <= 10 && window.reduce((sum, message) => sum + message.content.length, 0) <= 12000);
});

test("basic follow-ups inherit courses and honor seats, approval preferences and explicit course changes", () => {
  const groups = [example(), example({ id: "private", requiresApproval: true }), example({ id: "math", title: "Calculus", courseCode: "MATH 1151" }), example({ id: "full", availableSeats: 0 })];
  let answer = basicGroupMatches([user("CSE2221 recursion"), { role: "assistant", content: "Try these" }, user("one without approval with room for two")], groups);
  assert.deepEqual(answer.matches.map((match) => match.sessionId), ["cse"]);
  answer = basicGroupMatches([user("CSE 2221"), user("Actually MATH 1151")], groups);
  assert.deepEqual(answer.matches.map((match) => match.sessionId), ["math"]);
  assert.equal(basicGroupMatches([user("Need 9 seats")], groups).matches.length, 0);
  assert.equal(basicGroupMatches([user("quantum chemistry")], groups).matches.length, 0);
  assert.equal(basicGroupMatches([user("calculus")], groups).matches[0].sessionId, "math");
  const local = finderGroupsFromMap([{ ...MOCK_DEMO_STUDY_GROUPS[0], notebookContent: "PRIVATE_NOTEBOOK", availableSeats: 2, totalSeats: 5 }]);
  assert.ok(local.length);
  assert.ok(!JSON.stringify(local).includes("PRIVATE_NOTEBOOK"));
  assert.ok(!JSON.stringify(local).includes(MOCK_DEMO_STUDY_GROUPS[0].host.id));
});

test("catalog query is scoped and read-only; unique active check-ins become safe counts", async () => {
  const db = database([row(), row({ id: "full", total_seats: 1 }), row({ id: "wrong-table", table_id: "UNKNOWN" })]);
  const catalog = await service(db).readFinderCatalog();
  assert.equal(catalog.groups.length, 1);
  assert.equal(catalog.groups[0].availableSeats, 4);
  assert.ok(db.calls.some((call) => call[0] === "eq" && call[1] === "status" && call[2] === "active"));
  assert.ok(db.calls.some((call) => call[0] === "eq" && call[1] === "library_name" && call[2] === "Thompson Library"));
  assert.ok(db.calls.some((call) => call[0] === "in" && call[1] === "table_id"));
  const selection = db.calls.find((call) => call[0] === "select")[1];
  assert.doesNotMatch(selection, /profiles|notebook|photo|gps|session_private/);
  assert.doesNotMatch(JSON.stringify(catalog), /PRIVATE|DEPARTED|150b-1|gps|notebook/);
});

test("live Gemini uses only safe current catalog and conversation, with a server-only header key", async () => {
  const db = database();
  await withProvider(async (url, options) => {
    assert.match(url, /gemini-3\.5-flash-lite:generateContent$/);
    assert.ok(!url.includes("test-server-key"));
    assert.equal(options.headers["x-goog-api-key"], "test-server-key");
    assert.ok(options.signal instanceof AbortSignal);
    const body = JSON.parse(options.body);
    assert.deepEqual(body.contents.map((message) => message.role), ["user", "model", "user"]);
    assert.match(body.systemInstruction.parts[0].text, /untrusted/);
    assert.doesNotMatch(options.body, /PRIVATE_HOST|PRIVATE_NOTEBOOK|150b-1|test-server-key/);
    assert.equal(body.tools, undefined);
    assert.deepEqual(body.generationConfig.responseJsonSchema.properties.matches.items.properties.sessionId.enum, ["cse"]);
    return generated("Try this recursion group.", [{ sessionId: "cse", reason: "CSE 2221 and four open seats." }]);
  }, async () => {
    const answer = await service(db).findGroups([user("CSE2221"), { role: "assistant", content: "Any topic?" }, user("Recursion")], new AbortController().signal);
    assert.equal(answer.source, "gemini");
    assert.equal(answer.dataSource, "database");
    assert.equal(answer.matches[0].group.availableSeats, 4);
    assert.doesNotMatch(JSON.stringify(answer), /PRIVATE|test-server-key|INTERNAL_THINKING/);
  });
});

test("invented and duplicate model IDs never become recommendation cards", async () => {
  await withProvider(async () => generated("Matches", [{ sessionId: "invented", reason: "bad" }, { sessionId: "cse", reason: "course" }, { sessionId: "cse", reason: "duplicate" }]), async () => {
    const answer = await service(database()).findGroups([user("CSE 2221")], new AbortController().signal);
    assert.equal(answer.source, "gemini");
    assert.deepEqual(answer.matches.map((match) => match.sessionId), ["cse"]);
  });
  await withProvider(async () => generated("Invented", [{ sessionId: "unknown", reason: "bad" }]), async () => {
    const answer = await service(database()).findGroups([user("CSE 2221")], new AbortController().signal);
    assert.equal(answer.source, "basic");
    assert.equal(answer.matches[0].sessionId, "cse");
  });
});

test("missing key, quotas, timeouts and malformed responses produce labeled basic matching", async () => {
  const cases = [
    { key: null, fetcher: async () => { throw new Error("Should not call Gemini without a key"); } },
    { fetcher: async () => new Response("Quota", { status: 429 }) },
    { fetcher: async () => { throw new DOMException("Timed out", "TimeoutError"); } },
    { fetcher: async () => Response.json({ candidates: [] }) },
    { fetcher: async () => Response.json({ candidates: [{ content: { parts: [{ text: "not JSON" }] } }] }) },
  ];
  for (const scenario of cases) await withProvider(scenario.fetcher, async () => {
    const answer = await service(database()).findGroups([user("CSE 2221")], new AbortController().signal);
    assert.equal(answer.source, "basic");
    assert.equal(answer.dataSource, "database");
    assert.equal(answer.matches[0].sessionId, "cse");
    assert.match(answer.notice, /AI is unavailable/);
  }, scenario.key === null ? null : "test-server-key");
});

test("empty catalogs avoid Gemini and cancellation does not trigger fallback", async () => {
  await withProvider(async () => { throw new Error("Should not call Gemini"); }, async () => {
    const empty = await service(database([])).findGroups([user("CSE2221")], new AbortController().signal);
    assert.deepEqual(empty.matches, []);
  });
  const controller = new AbortController();
  await withProvider(async () => { controller.abort(); throw new DOMException("Aborted", "AbortError"); }, async () => {
    await assert.rejects(service(database()).findGroups([user("CSE2221")], controller.signal), /REQUEST_ABORTED/);
  });
});

test("API validates input, reports database outages, and rechecks closed/full recommendations", async () => {
  const db = database();
  const route = load("src/app/api/ai/find-groups/route.ts", { "@/lib/supabase-admin": { getSupabaseAdminClient: () => db.client } });
  const request = (body) => new Request("http://localhost/api/ai/find-groups", { method: "POST", body: JSON.stringify(body) });
  assert.equal((await route.POST(request({ messages: [user("")] }))).status, 400);
  assert.equal(db.calls.length, 0);
  const existing = await route.GET(new Request("http://localhost/api/ai/find-groups?sessionId=cse"));
  assert.equal(existing.status, 200);
  assert.equal(existing.headers.get("cache-control"), "no-store");
  assert.equal((await route.GET(new Request("http://localhost/api/ai/find-groups?sessionId=closed"))).status, 409);
  assert.equal((await route.GET(new Request("http://localhost/api/ai/find-groups"))).status, 400);
  const offline = load("src/app/api/ai/find-groups/route.ts", { "@/lib/supabase-admin": { getSupabaseAdminClient: () => null } });
  assert.equal((await offline.POST(request({ messages: [user("CSE2221")] }))).status, 503);
  const failed = service(database([], { message: "Database down" }));
  await assert.rejects(failed.readFinderCatalog(), /GROUP_DATABASE_UNAVAILABLE/);
});
