import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cache = new Map();
function load(relative) {
  const filename = path.resolve(root, relative);
  if (cache.has(filename)) return cache.get(filename);
  const module = { exports: {} };
  cache.set(filename, module.exports);
  const js = ts.transpileModule(readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const localRequire = (specifier) => specifier.startsWith("@/") ? load(`src/${specifier.slice(2)}.ts`) : require(specifier);
  new Function("require", "module", "exports", js)(localRequire, module, module.exports);
  return module.exports;
}
const c = load("src/types/contracts.ts");
const { createDemoGroupId, createDemoGroupState, demoGroupReducer: reduce, canJoinDemoGroup } = load("src/features/location-checkin/group-demo.ts");
const { resolveDemoReaderLocation, getPlanGeometry } = load("src/features/campus-map/map-geometry.ts");
const baseline = JSON.stringify(c.MOCK_DEMO_STUDY_GROUPS);
const cryptoDescriptor = Object.getOwnPropertyDescriptor(globalThis, "crypto");
try {
  Object.defineProperty(globalThis, "crypto", { configurable: true, value: undefined });
  const id = createDemoGroupId();
  assert.ok(id.startsWith("local-"));
  assert.notEqual(createDemoGroupId(), id, "A demo can create groups without secure-context UUID support");
} finally {
  if (cryptoDescriptor) Object.defineProperty(globalThis, "crypto", cryptoDescriptor);
  else delete globalThis.crypto;
}
const [alex, jordan, sam] = c.MOCK_PROFILES;
const empty = c.THOMPSON_EAST_ENTRANCE_TABLES.find(t => t.status === "empty");
let state = createDemoGroupState();
assert.equal(state.activeGroupId, null);
const input = { tableId: empty.id, name: "Local review", courseCode: "CSE 2221", inviteOnly: true };
state = reduce(state, { type: "create", input, profile: alex, id: "local-test", now: 100 });
let group = state.groups.find(g => g.id === "local-test");
assert.equal(group.tableId, empty.id);
assert.equal(group.host.id, alex.id);
assert.equal(group.members.length, 0);
assert.equal(canJoinDemoGroup(group, jordan.id), false);
const asVisitor = { ...state, activeGroupId: null };
assert.equal(reduce(asVisitor, { type: "join", groupId: group.id, profile: jordan, now: 200 }).activeGroupId, null);
state = reduce(state, { type: "invite", profileId: jordan.id, hostId: alex.id });
group = state.groups.find(g => g.id === "local-test");
assert.equal(group.members.length, 0, "Invitation alone must not grant membership");
assert.ok(canJoinDemoGroup(group, jordan.id));
state = reduce({ ...state, activeGroupId: null }, { type: "join", groupId: group.id, profile: jordan, now: 200 });
assert.equal(state.groups.find(g => g.id === group.id).members.length, 1);
state = reduce(state, { type: "join", groupId: group.id, profile: jordan, now: 300 });
assert.equal(state.groups.find(g => g.id === group.id).members.length, 1, "Repeated joins cannot duplicate a member");
const notes = "## Shared note\n[note] Alex · Today\nKeep these notes after leaving.";
state = reduce(state, { type: "notebook", content: notes });
state = reduce(state, { type: "leave", profileId: alex.id });
group = state.groups.find(g => g.id === group.id);
assert.equal(group.host.id, jordan.id, "Earliest remaining member succeeds the host");
assert.equal(group.notebookContent, notes);
state = reduce({ ...state, activeGroupId: group.id }, { type: "leave", profileId: jordan.id, gps: true });
assert.ok(!state.groups.some(g => g.id === group.id));
assert.match(state.notice, /150 m/);

// Leaving as an ordinary member preserves the host and its posting.
let open = createDemoGroupState();
const existing = open.groups.find(g => !g.inviteOnly && g.host.id !== alex.id);
open = reduce(open, { type: "join", groupId: existing.id, profile: alex, now: 1000 });
open = reduce(open, { type: "leave", profileId: alex.id });
assert.equal(open.groups.find(g => g.id === existing.id).host.id, existing.host.id);
const veryBusy = c.THOMPSON_EAST_ENTRANCE_TABLES.find(t => t.status === "very-busy");
const busyGroup = createDemoGroupState().groups.find(g => g.tableId === veryBusy.id);
assert.equal(reduce(createDemoGroupState(), { type: "join", groupId: busyGroup.id, profile: sam, now: 500 }).activeGroupId, busyGroup.id);

// Table selection matches each table's drawn center across viewport sizes.
for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 1440, height: 900 }]) {
  const plan = getPlanGeometry(viewport);
  const scale = Math.max(viewport.width / c.CAMPUS_MAP_ARTWORK_SIZE.width, viewport.height / c.CAMPUS_MAP_ARTWORK_SIZE.height);
  for (const table of c.THOMPSON_EAST_ENTRANCE_TABLES) {
    const point = {
      x: (plan.left + plan.width * table.x / 100 - (viewport.width - c.CAMPUS_MAP_ARTWORK_SIZE.width * scale) / 2) / scale,
      y: (plan.top + plan.height * table.y / 100 - (viewport.height - c.CAMPUS_MAP_ARTWORK_SIZE.height * scale) / 2) / scale,
    };
    assert.equal(resolveDemoReaderLocation(point, "device", viewport).tableId, table.id);
  }
  const fallback = resolveDemoReaderLocation(null, "device", viewport);
  assert.equal(fallback.source, "demo"); assert.equal(fallback.usedFallback, true);
  assert.equal(fallback.tableId, resolveDemoReaderLocation(c.CAMPUS_MAP_DEMO_LOCATION, "demo", viewport).tableId);
  assert.equal(resolveDemoReaderLocation({ x: -100, y: 0 }, "device", viewport).usedFallback, true);
}
assert.equal(JSON.stringify(c.MOCK_DEMO_STUDY_GROUPS), baseline, "Shared fixtures must stay immutable");
console.log("Group demo checks passed: nearest-table projection, fallback, confirmed membership, invitations, host succession, closure, notebook retention, very busy tables and immutable fixtures.");
