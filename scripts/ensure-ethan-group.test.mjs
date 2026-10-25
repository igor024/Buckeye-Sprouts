import assert from "node:assert/strict";
import { test } from "node:test";
import { ensureEthanGroup, syncEthanGroup } from "./ensure-ethan-group.mjs";

test("startup reset commits all database changes together", async () => {
  const statements = [];
  await ensureEthanGroup({ query: async (sql) => { statements.push(sql); } });
  assert.equal(statements[0], "BEGIN");
  assert.equal(statements.length, 3);
  assert.equal(statements.at(-1), "COMMIT");
});

test("a database failure rolls back instead of leaving a partially reset group", async () => {
  const statements = [];
  const failure = new Error("Reset failed");
  await assert.rejects(ensureEthanGroup({ query: async (sql) => {
    statements.push(sql);
    if (statements.length === 2) throw failure;
  } }), (error) => error === failure);
  assert.equal(statements.at(-1), "ROLLBACK");
  assert.ok(!statements.includes("COMMIT"));
});

test("explicit mock mode never connects to or resets the live database", async () => {
  const original = process.env.BUCKEYESPROUTS_DEMO_MODE;
  try {
    process.env.BUCKEYESPROUTS_DEMO_MODE = "true";
    await syncEthanGroup();
  } finally {
    if (original === undefined) delete process.env.BUCKEYESPROUTS_DEMO_MODE;
    else process.env.BUCKEYESPROUTS_DEMO_MODE = original;
  }
});
