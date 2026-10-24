import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

// Normally resolves the installed devDependency. An optional absolute compiler
// path permits offline checking with an already installed TypeScript compiler.
const require = createRequire(import.meta.url);
const ts = require(process.argv[2] ? path.resolve(process.argv[2]) : "typescript");
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const contractsPath = path.join(root, "src/types/contracts.ts");
const formatHost = {
  getCanonicalFileName: (name) => name,
  getCurrentDirectory: () => root,
  getNewLine: () => "\n",
};
const program = ts.createProgram([contractsPath], {
  strict: true, noEmit: true, target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.ESNext, types: [], skipLibCheck: true,
});
const contractErrors = ts.getPreEmitDiagnostics(program);
assert.equal(contractErrors.length, 0, ts.formatDiagnosticsWithColorAndContext(contractErrors, formatHost));

async function sourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const groups = await Promise.all(entries.map((entry) => {
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? sourceFiles(fullPath) : /\.tsx?$/.test(entry.name) ? [fullPath] : [];
  }));
  return groups.flat();
}

const files = [...await sourceFiles(path.join(root, "src")), path.join(root, "next.config.ts")];
for (const filename of files) {
  const source = await readFile(filename, "utf8");
  const result = ts.transpileModule(source, {
    fileName: filename, reportDiagnostics: true,
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX, isolatedModules: true },
  });
  const errors = (result.diagnostics || []).filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error);
  assert.equal(errors.length, 0, ts.formatDiagnosticsWithColorAndContext(errors, formatHost));

  const owner = path.relative(path.join(root, "src/features"), filename).split(path.sep)[0];
  if (!owner || owner === "..") continue;
  const parsed = ts.createSourceFile(filename, source, ts.ScriptTarget.Latest, true);
  for (const statement of parsed.statements) {
    if (!ts.isImportDeclaration(statement)) continue;
    const specifier = statement.moduleSpecifier.text;
    const resolved = specifier.startsWith("@/") ? path.join(root, "src", specifier.slice(2))
      : specifier.startsWith(".") ? path.resolve(path.dirname(filename), specifier) : null;
    if (!resolved) continue;
    const target = path.relative(path.join(root, "src/features"), resolved).split(path.sep)[0];
    assert.ok(target === ".." || target === owner, `${filename} crosses into feature ${target}`);
  }
}

const fixtureSource = ts.transpileModule(await readFile(contractsPath, "utf8"), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
}).outputText;
const fixtures = await import(`data:text/javascript;base64,${Buffer.from(fixtureSource).toString("base64")}`);
const { MOCK_PROFILES, MOCK_SESSIONS, MOCK_NOTEBOOKS, MOCK_JOIN_REQUESTS, MOCK_CHECK_INS, MOCK_GEOFENCES } = fixtures;
const userIds = new Set(MOCK_PROFILES.map((profile) => profile.id));
const sessionIds = new Set(MOCK_SESSIONS.map((session) => session.id));
const validUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
assert.equal(userIds.size, MOCK_PROFILES.length);
assert.equal(sessionIds.size, MOCK_SESSIONS.length);
for (const id of [...userIds, ...sessionIds]) assert.match(id, validUuid);
for (const session of MOCK_SESSIONS) {
  assert.ok(userIds.has(session.hostId));
  assert.ok(session.availableSeats >= 0 && session.availableSeats <= session.totalSeats);
  assert.ok(Number.isFinite(Date.parse(session.createdAt)));
  assert.ok(session.status !== "scheduled" || Number.isFinite(Date.parse(session.scheduledFor)));
  assert.ok(MOCK_GEOFENCES.some((geofence) => geofence.libraryName === session.libraryName));
}
for (const notebook of MOCK_NOTEBOOKS) {
  assert.ok(sessionIds.has(notebook.sessionId));
  assert.ok(userIds.has(notebook.lastUpdatedBy));
}
for (const request of MOCK_JOIN_REQUESTS) {
  assert.ok(sessionIds.has(request.sessionId));
  assert.ok(userIds.has(request.requesterProfile.id));
}
for (const checkIn of MOCK_CHECK_INS) {
  assert.ok(sessionIds.has(checkIn.sessionId));
  assert.ok(userIds.has(checkIn.userId));
}
console.log(`Foundation checks passed: shared contract types, ${files.length} source files parsed, feature isolation, fixture references.`);
console.log("This check does not replace full-project typecheck, production build, database migration, or HTTP smoke checks.");
