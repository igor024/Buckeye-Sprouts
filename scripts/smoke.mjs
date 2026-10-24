import assert from "node:assert/strict";

const base = process.env.SMOKE_BASE_URL || "http://localhost:3000";
const hostSession = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const lockedSession = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const unknownSession = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
const post = (path, body) => fetch(`${base}${path}`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

const dashboard = await fetch(base);
assert.equal(dashboard.status, 200);
const dashboardHtml = await dashboard.text();
assert.ok(dashboardHtml.includes("BuckeyeStudy") || dashboardHtml.includes("Buckeye Sprouts"));
assert.ok(dashboardHtml.includes("CSE 2221"));
for (const secret of ["THO-3-E12", "18AV-2-N04", "demo-hash-"]) {
  assert.ok(!dashboardHtml.includes(secret), `Public dashboard leaked ${secret}`);
}

const host = await fetch(`${base}/session/${hostSession}`);
assert.equal(host.status, 200);
const hostHtml = await host.text();
assert.ok(hostHtml.includes("THO-3-E12"));
assert.ok(hostHtml.includes("Questions to work through"));
assert.ok(!hostHtml.includes("demo-hash-"));

const locked = await fetch(`${base}/session/${lockedSession}`);
assert.equal(locked.status, 200);
const lockedHtml = await locked.text();
assert.ok(!lockedHtml.includes("18AV-2-N04"));
assert.ok(!lockedHtml.includes("gpsCoordinates"));
assert.ok(!lockedHtml.includes("demo-hash-"));
assert.equal((await fetch(`${base}/session/${unknownSession}`)).status, 404);

for (const path of ["/api/ai/summarize", "/api/ai/feedback", "/api/rooms/book"]) {
  const invalid = await post(path, {});
  assert.equal(invalid.status, 400, path);
  assert.equal((await invalid.json()).error.code, "INVALID_REQUEST");
}

const summarize = await post("/api/ai/summarize", { sessionId: hostSession, mode: "catch_me_up" });
assert.equal(summarize.status, 200);
assert.equal(summarize.headers.get("cache-control"), "no-store");
assert.equal((await summarize.json()).source, "mock");
assert.equal((await post("/api/ai/summarize", { sessionId: hostSession, mode: "ambient" })).status, 200);
assert.equal((await post("/api/ai/summarize", { sessionId: lockedSession, mode: "ambient" })).status, 403);
assert.equal((await post("/api/ai/summarize", { sessionId: unknownSession, mode: "catch_me_up" })).status, 404);

const feedback = await post("/api/ai/feedback", { sessionId: hostSession, question: "Help with recursion?" });
assert.equal(feedback.status, 200);
assert.match(feedback.headers.get("content-type") || "", /text\/plain/);
assert.ok(feedback.body);
assert.match(await feedback.text(), /Demo tutor/);
assert.equal((await post("/api/ai/feedback", { sessionId: lockedSession, question: "Help?" })).status, 403);

const booking = {
  sessionId: hostSession, libraryName: "Thompson Library", roomId: "DEMO-301",
  startsAt: "2026-10-24T19:00:00.000Z", endsAt: "2026-10-24T20:00:00.000Z",
};
const room = await post("/api/rooms/book", booking);
assert.equal(room.status, 501);
assert.equal((await room.json()).status, "stub");
assert.equal((await post("/api/rooms/book", { ...booking, sessionId: lockedSession })).status, 403);
assert.equal((await post("/api/rooms/book", { ...booking, endsAt: booking.startsAt })).status, 400);

console.log("Scaffold smoke checks passed: pages, privacy, validation, AI stream, and booking stub.");
