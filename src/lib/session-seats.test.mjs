import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";

function loadModule(url, dependencies = {}) {
  const module = { exports: {} };
  const compiled = ts.transpileModule(readFileSync(url, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  new Function("require", "module", "exports", compiled)((name) => {
    if (name === "server-only") return {};
    if (name in dependencies) return dependencies[name];
    throw new Error(`Unexpected dependency: ${name}`);
  }, module, module.exports);
  return module.exports;
}

const { syncStudySessionSeats } = loadModule(new URL("./session-seats.ts", import.meta.url));
const active = (user_id) => ({ user_id, checked_out_at: null });

function database(rows, { readError = null, writeError = null } = {}) {
  const writes = [];
  const ranges = [];
  const client = {
    from(table) {
      assert.equal(table, "study_sessions");
      return {
        select() {
          return {
            is(column, value) {
              assert.equal(column, "check_ins.checked_out_at");
              assert.equal(value, null);
              return this;
            },
            order(column) { assert.equal(column, "id"); return this; },
            async range(start, end) {
              ranges.push([start, end]);
              return { data: structuredClone(rows.slice(start, end + 1)), error: readError };
            },
          };
        },
        update(values) {
          return {
            eq(column, id) {
              assert.equal(column, "id");
              return {
                select() {
                  return {
                    async single() {
                      if (!writeError) {
                        Object.assign(rows.find((row) => row.id === id), values);
                        writes.push({ id, ...values });
                      }
                      return { error: writeError };
                    },
                  };
                },
              };
            },
          };
        },
      };
    },
  };
  return { client, writes, ranges };
}

test("refresh persists active occupancy, excludes checkout history, and restores seats on departure", async () => {
  const rows = [{
    id: "session", total_seats: 5, available_seats: 5,
    check_ins: [active("host"), active("student"), active("student"), { user_id: "departed", checked_out_at: "2026-10-24" }],
  }];
  const db = database(rows);
  await syncStudySessionSeats(db.client);
  assert.deepEqual(db.writes, [{ id: "session", total_seats: 5, available_seats: 3 }]);
  await syncStudySessionSeats(db.client);
  assert.equal(db.writes.length, 1, "Repeated refresh must be idempotent");
  rows[0].check_ins = [];
  await syncStudySessionSeats(db.client);
  assert.equal(rows[0].total_seats, 5);
  assert.equal(rows[0].available_seats, 5);
});

test("refresh repairs overcapacity and processes every page, including sessions without check-ins", async () => {
  const rows = Array.from({ length: 201 }, (_, i) => ({
    id: String(i), total_seats: 2, available_seats: 0, check_ins: [],
  }));
  rows[0].check_ins = [active("host"), active("student"), active("third")];
  const db = database(rows);
  await syncStudySessionSeats(db.client);
  assert.deepEqual(db.ranges, [[0, 199], [200, 399]]);
  assert.equal(db.writes.length, 201);
  assert.equal(rows[0].total_seats, 3);
  assert.equal(rows[0].available_seats, 0);
  assert.equal(rows[200].available_seats, 2);
});

test("refresh propagates database read and write failures", async () => {
  const rows = [{ id: "session", total_seats: 5, available_seats: 0, check_ins: [] }];
  await assert.rejects(syncStudySessionSeats(database(rows, { readError: { message: "offline" } }).client), /offline/);
  await assert.rejects(syncStudySessionSeats(database(rows, { writeError: { message: "permission denied" } }).client), /permission denied/);
});

test("refresh API waits for seat persistence before returning groups and reports failed sync", async () => {
  const calls = [];
  let failSync = false;
  const route = loadModule(new URL("../app/api/map/groups/route.ts", import.meta.url), {
    "@/lib/server-groups": { fetchLiveMapGroups: async () => { calls.push("fetch"); return []; } },
    "@/lib/supabase-admin": { getSupabaseAdminClient: () => ({}) },
    "@/lib/supabase": { isSupabaseConfigured: true },
    "@/lib/group-seats": loadModule(new URL("./group-seats.ts", import.meta.url)),
    "@/lib/session-seats": { syncStudySessionSeats: async () => {
      await Promise.resolve();
      if (failSync) throw new Error("sync failed");
      calls.push("sync");
    } },
  });
  const request = () => new Request("http://localhost/api/map/groups", {
    method: "PATCH", body: JSON.stringify({ action: "refresh" }),
  });
  const response = await route.PATCH(request());
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(await response.json(), { success: true, groups: [] });
  assert.deepEqual(calls, ["sync", "fetch"]);
  failSync = true;
  const originalError = console.error;
  try {
    console.error = () => {};
    assert.equal((await route.PATCH(request())).status, 500);
  } finally {
    console.error = originalError;
  }
  assert.deepEqual(calls, ["sync", "fetch"], "A failed sync must not report fresh groups");
});
