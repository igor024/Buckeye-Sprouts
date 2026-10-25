import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import ts from "typescript";

const root = fileURLToPath(new URL("../../", import.meta.url));
function load(relative, mocks = {}) {
  const module = { exports: {} };
  const compiled = ts.transpileModule(readFileSync(path.join(root, relative), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  new Function("require", "module", "exports", compiled)((name) => {
    if (name === "server-only") return {};
    if (name in mocks) return mocks[name];
    if (name.startsWith("@/")) return load(`src/${name.slice(2)}.ts`, mocks);
    throw new Error(`Unexpected dependency ${name}`);
  }, module, module.exports);
  return module.exports;
}
const { initialGroupSeats, groupSeatCounts, groupTableStatus, sessionGroupSeats } = load("src/lib/group-seats.ts");
const { MOCK_PROFILES, THOMPSON_EAST_ENTRANCE_TABLES } = load("src/types/contracts.ts");
const { createDemoGroupState, demoGroupReducer: reduce, canJoinDemoGroup } = load("src/features/location-checkin/group-demo.ts");
const [host, student, third] = MOCK_PROFILES;
const group = (overrides = {}) => ({
  id: "group", tableId: "150b-1", host, members: [], name: "Study", courseCode: "CSE 2221", topic: "Review",
  inviteOnly: false, invitedProfileIds: [], joinedAtByProfileId: { [host.id]: 1 }, notebookContent: "", ...overrides,
});

test("orange means occupied capacity, independent of invitations or a fixed member threshold", () => {
  assert.equal(groupTableStatus(null), "empty");
  assert.equal(groupTableStatus(group({ inviteOnly: true })), "busy");
  assert.equal(groupTableStatus(group({ totalSeats: 8, occupiedSeats: 4 })), "busy");
  assert.equal(groupTableStatus(group({ totalSeats: 3, occupiedSeats: 3 })), "very-busy");
  assert.equal(groupTableStatus(group({ totalSeats: 3, occupiedSeats: 4 })), "very-busy");
  assert.equal(groupTableStatus(group({ totalSeats: 1, occupiedSeats: 1 })), "very-busy");
  assert.equal(groupTableStatus(group({ totalSeats: 3, availableSeats: 0 })), "very-busy");
  assert.deepEqual(groupSeatCounts(group({ members: [host, student, student] })), { totalSeats: 5, occupiedSeats: 2, availableSeats: 3 });
});

test("optional openings count the host once and reject invalid API inputs", () => {
  assert.deepEqual(initialGroupSeats(), { totalSeats: 5, availableSeats: 4, occupiedSeats: 1 });
  assert.deepEqual(initialGroupSeats(0), { totalSeats: 1, availableSeats: 0, occupiedSeats: 1 });
  assert.deepEqual(initialGroupSeats(2), { totalSeats: 3, availableSeats: 2, occupiedSeats: 1 });
  assert.equal(initialGroupSeats(19).totalSeats, 20);
  for (const input of [-1, 0.5, 20, NaN, Infinity, null, "2", "", true]) assert.throws(() => initialGroupSeats(input), RangeError);
});

test("check-in occupancy ignores checkout history, duplicates, and unavailable profile joins", async () => {
  const row = {
    id: "session", host_id: host.id, title: "Live", course_code: "CSE 2221", table_id: "150b-1",
    total_seats: 3, available_seats: 0, created_at: "2026-10-24T12:00:00Z",
    check_ins: [
      { user_id: host.id, checked_out_at: null },
      { user_id: student.id, checked_out_at: null },
      { user_id: student.id, checked_out_at: null },
      { user_id: third.id, checked_out_at: "2026-10-24T13:00:00Z" },
    ],
    join_requests: [{ status: "approved", profiles: { id: third.id, name: third.name } }],
  };
  assert.deepEqual(sessionGroupSeats(row), { totalSeats: 3, occupiedSeats: 2, availableSeats: 1 });
  const { mapDbSessionToDemoGroup } = load("src/lib/map-service.ts", {
    "@/lib/supabase-browser": { getSupabaseBrowserClient: () => null },
  });
  assert.equal(groupTableStatus(mapDbSessionToDemoGroup(row)), "busy");
  const { fetchLiveMapGroups } = load("src/lib/server-groups.ts", {
    "@/lib/supabase": { isSupabaseConfigured: true },
    "@/lib/supabase-admin": { getSupabaseAdminClient: () => ({ from: () => ({ select: () => ({ eq: () => ({ order: async () => ({ data: [row], error: null }) }) }) }) }) },
  });
  const [serverGroup] = await fetchLiveMapGroups();
  assert.equal(groupSeatCounts(serverGroup).availableSeats, 1);
  assert.equal(groupTableStatus(serverGroup), "busy");
});

test("browser map uses server occupancy rather than an authenticated user's restricted check-in rows", async () => {
  const full = group({ totalSeats: 3, occupiedSeats: 3, availableSeats: 0 });
  const { fetchGroupsDirectFromSupabase } = load("src/lib/map-service.ts", {
    "@/lib/supabase-browser": { getSupabaseBrowserClient: () => ({ from() { throw new Error("Restricted browser rows must not override server counts"); } }) },
  });
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (url, options) => {
      assert.equal(url, "/api/map/groups");
      assert.equal(options.cache, "no-store");
      return Response.json([full]);
    };
    const [result] = await fetchGroupsDirectFromSupabase();
    assert.equal(groupTableStatus(result), "very-busy");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("local creation, joins and departures keep occupancy and colors in sync", () => {
  const table = THOMPSON_EAST_ENTRANCE_TABLES.find((table) => table.id === "150a-1");
  let state = createDemoGroupState([]);
  state = reduce(state, { type: "create", id: "new", now: 1, profile: host,
    input: { tableId: table.id, name: "Small group", courseCode: "CSE 2221", inviteOnly: false, availableSeats: 1 } });
  assert.deepEqual(groupSeatCounts(state.groups[0]), { totalSeats: 2, occupiedSeats: 1, availableSeats: 1 });
  assert.equal(groupTableStatus(state.groups[0]), "busy");
  state = reduce({ ...state, activeGroupId: null }, { type: "join", groupId: "new", profile: student, now: 2 });
  assert.equal(groupTableStatus(state.groups[0]), "very-busy");
  assert.equal(canJoinDemoGroup(state.groups[0], third.id), false);
  assert.equal(canJoinDemoGroup(state.groups[0], student.id), true);
  const refused = reduce({ ...state, activeGroupId: null }, { type: "join", groupId: "new", profile: third, now: 3 });
  assert.equal(refused.groups[0].members.length, 1);
  assert.match(refused.notice, /full/);
  state = reduce(state, { type: "leave", profileId: student.id });
  assert.equal(groupTableStatus(state.groups[0]), "busy");
  assert.equal(groupSeatCounts(state.groups[0]).availableSeats, 1);
});

function apiDatabase({ capacity = 2, occupants = [] } = {}) {
  const writes = [];
  const admin = {
    from(table) {
      let operation = "select", attributes;
      const query = {
        select() { return query; }, eq() { return query; }, ilike() { return query; }, limit() { return query; },
        is(column, value) { assert.equal(column, "checked_out_at"); assert.equal(value, null); return query; },
        update(values) { operation = "update"; attributes = values; return query; },
        insert(values) { operation = "insert"; attributes = values; return query; },
        upsert(values) { operation = "upsert"; attributes = values; return query; },
        async maybeSingle() { return { data: table === "profiles" ? { id: student.id } : { total_seats: capacity, status: "active" }, error: null }; },
        async single() { writes.push({ table, operation, attributes }); return { data: { id: "created-session" }, error: null }; },
        then(resolve, reject) {
          if (operation !== "select") writes.push({ table, operation, attributes });
          return Promise.resolve({ data: table === "check_ins" ? occupants.map((user_id) => ({ user_id })) : null, error: null }).then(resolve, reject);
        },
      };
      return query;
    },
  };
  return { admin, writes };
}
function api(db) {
  return load("src/app/api/map/groups/route.ts", {
    "@/lib/server-groups": { fetchLiveMapGroups: async () => [] },
    "@/lib/supabase-admin": { getSupabaseAdminClient: () => db.admin },
    "@/lib/supabase": { isSupabaseConfigured: true },
    "@/lib/session-seats": { syncStudySessionSeats: async () => {} },
  });
}
const request = (method, body) => new Request("http://localhost/api/map/groups", { method, body: JSON.stringify(body) });

test("creation API persists default/custom openings and rejects invalid values before any writes", async () => {
  for (const [availableSeats, total, open] of [[undefined, 5, 4], [0, 1, 0], [2, 3, 2], [19, 20, 19]]) {
    const db = apiDatabase();
    const response = await api(db).POST(request("POST", { tableId: "150a-1", courseCode: "CSE 2221", hostProfile: student, availableSeats }));
    assert.equal(response.status, 201);
    const session = db.writes.find((write) => write.operation === "insert" && write.table === "study_sessions").attributes;
    assert.equal(session.total_seats, total);
    assert.equal(session.available_seats, open);
  }
  for (const availableSeats of [-1, 1.5, 20, "2", null]) {
    const db = apiDatabase();
    assert.equal((await api(db).POST(request("POST", { tableId: "150a-1", courseCode: "CSE 2221", availableSeats }))).status, 400);
    assert.deepEqual(db.writes, []);
  }
});

test("join API rejects a full table, preserves existing check-ins and accepts the final opening", async () => {
  const full = apiDatabase({ capacity: 1, occupants: [host.id] });
  assert.equal((await api(full).PATCH(request("PATCH", { action: "join", sessionId: "session", profileId: student.id }))).status, 409);
  assert.deepEqual(full.writes, []);
  const alreadyPresent = apiDatabase({ capacity: 1, occupants: [student.id] });
  assert.equal((await api(alreadyPresent).PATCH(request("PATCH", { action: "join", sessionId: "session", profileId: student.id }))).status, 200);
  assert.deepEqual(alreadyPresent.writes, []);
  const opening = apiDatabase({ capacity: 2, occupants: [host.id, host.id] });
  assert.equal((await api(opening).PATCH(request("PATCH", { action: "join", sessionId: "session", profileId: student.id }))).status, 200);
  assert.ok(opening.writes.some((write) => write.table === "check_ins" && write.operation === "upsert"));
});
