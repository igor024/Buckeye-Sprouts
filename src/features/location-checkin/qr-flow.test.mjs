import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import ts from "typescript";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const cache = new Map();
function load(relative, dependencies = {}) {
  const filename = path.join(root, relative);
  if (cache.has(filename)) return cache.get(filename);
  const module = { exports: {} };
  const compiled = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  new Function("require", "module", "exports", compiled)((name) => {
    if (name in dependencies) return dependencies[name];
    if (name.startsWith("@/")) return load(`src/${name.slice(2)}.ts`);
    throw new Error(`Unexpected dependency: ${name}`);
  }, module, module.exports);
  cache.set(filename, module.exports);
  return module.exports;
}

const { normalizeQrTableId, tableGroupHref, parseTableQrPayload } = load("src/lib/table-qr.ts");
const { THOMPSON_EAST_ENTRANCE_TABLES } = load("src/types/contracts.ts");
const { runQrCamera } = load("src/features/location-checkin/qr-camera.ts");
const flush = () => new Promise(setImmediate);
function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

test("every floor-plan table resolves from printed URLs, aliases and legacy JSON", () => {
  for (const { id } of THOMPSON_EAST_ENTRANCE_TABLES) {
    assert.equal(normalizeQrTableId(` ${id.toUpperCase()} `), id);
    assert.equal(parseTableQrPayload(`http://localhost:3000/table/${id}`), id);
    assert.equal(parseTableQrPayload(`https://another-deployment.test/qr/${id.toUpperCase()}/?source=print#anchor`), id);
    assert.equal(parseTableQrPayload(`/table/${id}`), id);
    assert.equal(parseTableQrPayload(JSON.stringify({ tableId: id, libraryName: "Thompson Library" })), id);
    assert.equal(tableGroupHref(id), `/?tab=join&table=${id}`);
  }
  assert.equal(parseTableQrPayload("https://example.test/table/%31%35%30b-1"), "150b-1");
});

test("invalid codes cannot select an invented table or external navigation target", () => {
  for (const raw of ["", "150b-1", "https://example.test", "https://example.test/session/150b-1", "/table/no-such-table", "/qr/999-1", "/table/150b-1/extra", "/table/%", "javascript:alert(1)", "file:///table/150b-1", '{"tableId":42}', '{"tableId":"150b-1","libraryName":"Other"}', "{invalid}"]) {
    assert.equal(parseTableQrPayload(raw), null, raw);
  }
  for (const raw of [null, undefined, [], 42, "999-1"]) assert.equal(normalizeQrTableId(raw), null);
});

test("both QR routes redirect to the Group tab and unknown tables return not found", async () => {
  const navigation = {
    redirect(destination) { throw { kind: "redirect", destination }; },
    notFound() { throw { kind: "notFound" }; },
  };
  for (const route of ["table", "qr"]) {
    const { default: page } = load(`src/app/${route}/[tableId]/page.tsx`, { "next/navigation": navigation });
    await assert.rejects(page({ params: Promise.resolve({ tableId: "150B-1" }) }),
      (error) => error.kind === "redirect" && error.destination === "/?tab=join&table=150b-1");
    await assert.rejects(page({ params: Promise.resolve({ tableId: "unknown" }) }),
      (error) => error.kind === "notFound");
  }
});

function cameraHarness({ factoryGate, startGate, stopGate, startError, stopError } = {}) {
  const events = [];
  let decode;
  const camera = {
    async start(callback) { events.push("start"); decode = callback; if (startGate) await startGate.promise; if (startError) throw startError; },
    async stop() { events.push("stop"); if (stopGate) await stopGate.promise; if (stopError) throw stopError; },
    clear() { events.push("clear"); },
  };
  const reader = runQrCamera(async () => { events.push("load"); if (factoryGate) await factoryGate.promise; return camera; }, {
    parse: parseTableQrPayload,
    onReady: () => events.push("ready"),
    onScan: (id) => events.push(`scan:${id}`),
    onInvalid: () => events.push("invalid"),
    onError: (error) => events.push(`error:${error.message}`),
  });
  return { events, reader, decode: (text) => decode(text) };
}

test("live decoding retries invalid codes, ignores duplicates, and releases camera before navigation", async () => {
  const stopGate = deferred();
  const { events, reader, decode } = cameraHarness({ stopGate });
  await flush();
  decode("/table/invalid");
  assert.deepEqual(events, ["load", "start", "ready", "invalid"]);
  decode("/table/150b-1");
  decode("/table/150a-1");
  await flush();
  assert.deepEqual(events.slice(-1), ["stop"]);
  stopGate.resolve();
  await flush();
  assert.deepEqual(events.slice(-3), ["stop", "clear", "scan:150b-1"]);
  await reader.stop();
  assert.equal(events.filter((event) => event === "stop").length, 1);
});

test("closing before import avoids startup; closing during import prevents camera access", async () => {
  const immediate = cameraHarness();
  await immediate.reader.stop();
  assert.deepEqual(immediate.events, []);
  const factoryGate = deferred();
  const delayed = cameraHarness({ factoryGate });
  await flush();
  const stopped = delayed.reader.stop();
  factoryGate.resolve();
  await stopped;
  assert.deepEqual(delayed.events, ["load", "stop", "clear"]);
});

test("closing during permission request releases late camera streams without navigating", async () => {
  const startGate = deferred();
  const { events, reader, decode } = cameraHarness({ startGate });
  await flush();
  const stopped = reader.stop();
  decode("/table/150b-1");
  startGate.resolve();
  await stopped;
  assert.deepEqual(events, ["load", "start", "stop", "clear"]);
});

test("closing during shutdown suppresses a pending successful navigation", async () => {
  const stopGate = deferred();
  const { events, reader, decode } = cameraHarness({ stopGate });
  await flush();
  decode("/qr/150b-1");
  const stopped = reader.stop();
  stopGate.resolve();
  await stopped;
  await flush();
  assert.ok(!events.some((event) => event.startsWith("scan:")));
});

test("startup and shutdown failures clear camera resources and report errors", async () => {
  const failedStart = cameraHarness({ startError: new Error("permission denied") });
  await flush();
  assert.deepEqual(failedStart.events, ["load", "start", "stop", "clear", "error:permission denied"]);
  const failedStop = cameraHarness({ stopError: new Error("stop failed") });
  await flush();
  failedStop.decode("/table/150b-1");
  await flush();
  assert.deepEqual(failedStop.events.slice(-3), ["stop", "clear", "error:stop failed"]);
});
