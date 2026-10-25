import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import ts from "typescript";
import { SAMPLE_ACCOUNTS, SAMPLE_ACCOUNT_PASSWORD } from "./sample-accounts.mjs";
import { seedSampleAccounts } from "./seed-sample-accounts.mjs";

const root = fileURLToPath(new URL("../../../", import.meta.url));
function load(relative) {
  const module = { exports: {} };
  const compiled = ts.transpileModule(readFileSync(path.join(root, relative), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  new Function("require", "module", "exports", compiled)((name) => {
    if (name === "../sample-accounts.mjs") return { SAMPLE_ACCOUNTS };
    if (name.startsWith("@/")) return load(`src/${name.slice(2)}.ts`);
    throw new Error(`Unexpected dependency ${name}`);
  }, module, module.exports);
  return module.exports;
}
const { profileFromAuthUser, resolveAuthenticatedProfile } = load("src/features/auth-profiles/lib/auth-profile.ts");
const { createDemoGroupState, demoGroupReducer } = load("src/features/location-checkin/group-demo.ts");
const { repairSampleIdentity } = load("src/features/auth-profiles/lib/sample-profile-repair.ts");

function fakeAdmin({ users = [], fail = null } = {}) {
  const records = structuredClone(users);
  const calls = [];
  const profiles = new Map();
  return {
    calls, records, profiles,
    auth: { admin: {
      async listUsers({ page, perPage }) {
        calls.push({ action: "list", page });
        return { data: { users: records.slice((page - 1) * perPage, page * perPage) }, error: fail === "list" ? { message: "offline" } : null };
      },
      async createUser(attributes) {
        calls.push({ action: "create", attributes });
        if (fail === "create") return { data: {}, error: { message: "cannot create user" } };
        const user = { id: `real-user-${records.length}`, ...attributes };
        records.push(user);
        return { data: { user }, error: null };
      },
      async updateUserById(id, attributes) {
        calls.push({ action: "update", id, attributes });
        const user = records.find((record) => record.id === id);
        Object.assign(user, attributes);
        return { data: { user }, error: null };
      },
    } },
    from(table) {
      assert.equal(table, "profiles");
      return { async upsert(profile, options) {
        assert.deepEqual(options, { onConflict: "id" });
        profiles.set(profile.id, profile);
        return { error: fail === "profile" ? { message: "cannot save profile" } : null };
      } };
    },
  };
}

test("three sample identities have distinct emails and one shared login password", () => {
  assert.equal(SAMPLE_ACCOUNTS.length, 3);
  assert.equal(new Set(SAMPLE_ACCOUNTS.map((account) => account.email)).size, 3);
  assert.deepEqual(SAMPLE_ACCOUNTS.map((account) => account.name), ["Alex Rabochii", "Jordan Lee", "Sam Patel"]);
  assert.ok(SAMPLE_ACCOUNT_PASSWORD.length >= 8);
});

test("setup creates confirmed auth users and matching profiles using real returned UUIDs", async () => {
  const admin = fakeAdmin();
  const result = await seedSampleAccounts(admin);
  assert.equal(result.length, 3);
  for (let i = 0; i < SAMPLE_ACCOUNTS.length; i++) {
    const account = SAMPLE_ACCOUNTS[i];
    assert.equal(result[i].email, account.email);
    assert.equal(result[i].action, "created");
    const user = admin.records.find((record) => record.id === result[i].id);
    assert.equal(user.password, SAMPLE_ACCOUNT_PASSWORD);
    assert.equal(user.email_confirm, true);
    assert.equal(user.user_metadata.sample_account, true);
    assert.equal(admin.profiles.get(user.id).name, account.name);
    assert.deepEqual(admin.profiles.get(user.id).current_courses, account.currentCourses);
  }
});

test("setup repairs existing samples without replacing UUIDs or changing unrelated accounts", async () => {
  const unrelated = { id: "other-id", email: "other@osu.edu", password: "private", user_metadata: { name: "Another Student" } };
  const admin = fakeAdmin({ users: [
    { id: "existing-alex", email: SAMPLE_ACCOUNTS[0].email, password: "old", user_metadata: { custom: "keep" } },
    unrelated,
  ] });
  const first = await seedSampleAccounts(admin);
  assert.equal(first[0].id, "existing-alex");
  assert.equal(first[0].action, "repaired");
  assert.equal(admin.records[0].password, SAMPLE_ACCOUNT_PASSWORD);
  assert.equal(admin.records[0].user_metadata.custom, "keep");
  assert.deepEqual(admin.records.find((record) => record.id === "other-id"), unrelated);
  const second = await seedSampleAccounts(admin);
  assert.deepEqual(second.map((account) => account.id), first.map((account) => account.id));
  assert.equal(admin.calls.filter((call) => call.action === "create").length, 2);
});

test("setup paginates existing users and reports auth/profile errors instead of claiming success", async () => {
  const users = Array.from({ length: 100 }, (_, i) => ({ id: `other-${i}`, email: `other-${i}@osu.edu` }));
  users.push({ id: "last-page-alex", email: SAMPLE_ACCOUNTS[0].email });
  const admin = fakeAdmin({ users });
  assert.equal((await seedSampleAccounts(admin))[0].id, "last-page-alex");
  assert.deepEqual(admin.calls.filter((call) => call.action === "list").map((call) => call.page), [1, 2]);
  for (const fail of ["list", "create", "profile"]) await assert.rejects(seedSampleAccounts(fakeAdmin({ fail })));
});

test("offline profile fallback preserves authenticated identity and validates metadata", () => {
  const user = {
    id: "real-jordan-id", email: SAMPLE_ACCOUNTS[1].email,
    user_metadata: { name: "Jordan Lee", major: "Mathematics", current_courses: ["MATH 1151", 42] },
  };
  assert.deepEqual(profileFromAuthUser(user), {
    id: "real-jordan-id", name: "Jordan Lee", major: "Mathematics", avatarUrl: "", currentCourses: ["MATH 1151"], bio: "",
  });
  assert.equal(profileFromAuthUser({ ...user, user_metadata: {} }).name, "Jordan Lee");
});

test("existing Alex metadata displays the renamed profile without changing its login identity", () => {
  const profile = profileFromAuthUser({ id: "existing-alex", email: SAMPLE_ACCOUNTS[0].email, user_metadata: { name: "Alex Morgan" } });
  assert.equal(profile.id, "existing-alex");
  assert.equal(profile.name, "Alex Rabochii");
});

test("authenticated sample email overrides stale Ethan metadata and database names in the BuckID roster", () => {
  const user = { id: "44444444-4444-4444-8444-444444444444", email: "ALEX.MORGAN@OSU.EDU", user_metadata: { name: "Ethan Dong" } };
  const fallback = profileFromAuthUser(user);
  assert.equal(fallback.name, "Alex Rabochii");
  const viewer = resolveAuthenticatedProfile(user, { ...fallback, name: "Ethan Dong", bio: "Keep the loaded biography" });
  assert.equal(viewer.id, user.id);
  assert.equal(viewer.name, "Alex Rabochii");
  assert.equal(viewer.bio, SAMPLE_ACCOUNTS[0].bio);
  assert.equal(viewer.major, SAMPLE_ACCOUNTS[0].major);
  let state = demoGroupReducer(createDemoGroupState([]), { type: "prepare-buckid-demo" });
  const group = state.groups[0];
  assert.notEqual(group.host.id, viewer.id);
  state = demoGroupReducer(state, { type: "join", groupId: group.id, profile: viewer, now: 100 });
  assert.equal(state.groups[0].host.name, "Ethan Dong");
  assert.deepEqual(state.groups[0].members.map((profile) => profile.name), ["Alex Rabochii"]);
  assert.equal(state.groups[0].members[0].id, user.id);
});

test("profile resolution rejects a different user's row and preserves ordinary editable profiles", () => {
  const user = { id: "ordinary-user", email: "student@osu.edu", user_metadata: { name: "Original Name" } };
  const fallback = profileFromAuthUser(user);
  assert.deepEqual(resolveAuthenticatedProfile(user, { ...fallback, id: "somebody-else", name: "Ethan Dong" }), fallback);
  assert.equal(resolveAuthenticatedProfile(user, { ...fallback, name: "Updated Name" }).name, "Updated Name");
});

function repairClient(fail = null) {
  const writes = [];
  return { writes,
    from(table) { assert.equal(table, "profiles"); return { async upsert(profile, options) {
      writes.push({ kind: "profile", profile, options });
      return { error: fail === "profile" ? { message: "Profile write failed" } : null };
    } }; },
    auth: { async updateUser(attributes) {
      writes.push({ kind: "metadata", attributes });
      return { error: fail === "metadata" ? { message: "Metadata write failed" } : null };
    } },
  };
}

test("sample repair fixes stored account details and Auth metadata using the authenticated UUID", async () => {
  const user = { id: "real-alex", email: SAMPLE_ACCOUNTS[0].email, user_metadata: { name: "Ethan Dong", bio: "Ethan's biography", custom: "keep" } };
  const wrong = { id: user.id, name: "Ethan Dong", major: "Wrong major", avatarUrl: "/ethan.png", currentCourses: ["OTHER 1000"], bio: "Ethan's biography" };
  const client = repairClient();
  assert.equal(await repairSampleIdentity(client, user, wrong), true);
  assert.deepEqual(client.writes[0].profile, {
    id: user.id, name: SAMPLE_ACCOUNTS[0].name, avatar_url: "", major: SAMPLE_ACCOUNTS[0].major,
    current_courses: SAMPLE_ACCOUNTS[0].currentCourses, bio: SAMPLE_ACCOUNTS[0].bio,
  });
  assert.equal(client.writes[1].attributes.data.name, SAMPLE_ACCOUNTS[0].name);
  assert.equal(client.writes[1].attributes.data.bio, SAMPLE_ACCOUNTS[0].bio);
  assert.equal(client.writes[1].attributes.data.custom, "keep");
  assert.equal("password" in client.writes[1].attributes, false);
  const clean = profileFromAuthUser({ ...user, user_metadata: client.writes[1].attributes.data });
  assert.equal(await repairSampleIdentity(client, { ...user, user_metadata: client.writes[1].attributes.data }, clean), false);
  assert.equal(client.writes.length, 2, "Successful repair is idempotent");
});

test("repair leaves ordinary accounts alone, targets only the signed-in sample, and reports write failures", async () => {
  const ordinary = { id: "another-person", email: "someone@osu.edu", user_metadata: { name: "Ethan Dong" } };
  const client = repairClient();
  assert.equal(await repairSampleIdentity(client, ordinary, null), false);
  assert.equal(client.writes.length, 0);
  const user = { ...ordinary, id: "real-alex", email: SAMPLE_ACCOUNTS[0].email };
  await repairSampleIdentity(client, user, { ...profileFromAuthUser(user), id: "wrong-person" });
  assert.equal(client.writes[0].profile.id, user.id);
  for (const failure of ["profile", "metadata"]) await assert.rejects(repairSampleIdentity(repairClient(failure), user, null));
  let current = true;
  const switched = repairClient();
  const originalFrom = switched.from.bind(switched);
  switched.from = (table) => { const query = originalFrom(table); return { async upsert(...args) { const result = await query.upsert(...args); current = false; return result; } }; };
  await repairSampleIdentity(switched, user, null, () => current);
  assert.equal(switched.writes.length, 1, "An account switch cancels metadata repair for the old session");
});

test("switching sample accounts clears local group access without checking out the previous member", () => {
  const state = createDemoGroupState();
  state.activeGroupId = state.groups[0].id;
  const snapshot = structuredClone(state.groups);
  const switched = demoGroupReducer(state, { type: "change-viewer" });
  assert.equal(switched.activeGroupId, null);
  assert.deepEqual(switched.groups, snapshot);
  assert.notEqual(state.activeGroupId, null);
});
