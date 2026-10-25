import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import ts from "typescript";

const require = createRequire(import.meta.url);
function load(file, mocks = {}) {
  const module = { exports: {} };
  const code = ts.transpileModule(readFileSync(new URL(file, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  new Function("require", "module", "exports", code)((name) => {
    if (name in mocks) return mocks[name];
    return require(name);
  }, module, module.exports);
  return module.exports;
}

test("dev saves update owners, rosters, seats and profiles; production rejects actions", async () => {
  const originalEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "development";
  try {
    const fixtures = load("../types/contracts.ts");
    const mockStore = structuredClone({
      profiles: fixtures.MOCK_PROFILES, sessions: fixtures.MOCK_SESSIONS,
      checkIns: fixtures.MOCK_CHECK_INS, joinRequests: fixtures.MOCK_JOIN_REQUESTS,
    });
    const actions = load("./dev-editor-actions.ts", {
      "@/lib/supabase-admin": { getSupabaseAdminClient: () => null },
      "@/lib/supabase": { mockStore, toProfilePreview: ({ buckIdHash, ...person }) => person },
    });
    const before = await actions.readDevEditor();
    assert.equal(before.mode, "mock");
    assert.ok(before.people.every((p) => !("buckIdHash" in p)));
    const group = before.groups[0];
    const [owner, member, removed] = before.people;
    await actions.saveDevGroup({ id: group.id, hostId: member.id, memberIds: [owner.id, owner.id] }, "mock");
    const after = (await actions.readDevEditor()).groups[0];
    assert.equal(after.hostId, member.id);
    assert.deepEqual(after.memberIds, [owner.id]);
    const active = mockStore.checkIns.filter((r) => r.sessionId === group.id && !r.checkedOutAt);
    assert.deepEqual(new Set(active.map((r) => r.userId)), new Set([owner.id, member.id]));
    assert.equal(mockStore.sessions[0].availableSeats, group.totalSeats - 2);

    mockStore.sessions[0].totalSeats = 1;
    await assert.rejects(actions.saveDevGroup({ id: group.id, hostId: owner.id, memberIds: [member.id] }, "mock"), /1 seats/);
    await assert.rejects(actions.saveDevGroup({ id: group.id, hostId: "99999999-9999-4999-8999-999999999999", memberIds: [] }, "mock"), /Unknown person/);
    await actions.saveDevPerson({ ...owner, name: "Updated student", currentCourses: ["CSE 2221"] }, "mock");
    assert.equal((await actions.readDevEditor()).people[0].name, "Updated student");
    assert.equal(mockStore.joinRequests.find((r) => r.requesterProfile.id === owner.id).requesterProfile.name, "Updated student");

    process.env.NODE_ENV = "production";
    await assert.rejects(actions.readDevEditor(), /disabled outside development/);
    await assert.rejects(actions.saveDevPerson(owner, "mock"), /disabled outside development/);
    await assert.rejects(actions.saveDevGroup({ id: group.id, hostId: removed.id, memberIds: [] }, "mock"), /disabled outside development/);
  } finally {
    if (originalEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalEnv;
  }
});
