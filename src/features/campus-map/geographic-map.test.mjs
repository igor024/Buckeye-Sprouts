import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";

// Exercise pure geometry without requiring Next's browser runtime.
const require = createRequire(import.meta.url);
function load(url) {
  const module = { exports: {} };
  const js = ts.transpileModule(readFileSync(url, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  new Function("require", "module", "exports", js)((name) => name === "@/types/contracts"
    ? load(new URL("../../types/contracts.ts", import.meta.url)) : require(name), module, module.exports);
  return module.exports;
}
const geo = load(new URL("./geographic-map.ts", import.meta.url));
const contracts = load(new URL("../../types/contracts.ts", import.meta.url));
const near = (a, b, tolerance = 1e-7) => assert.ok(Math.abs(a - b) < tolerance, `${a} != ${b}`);

// Projection round trips and floor aspect ratio must not depend on viewport or zoom.
const center = geo.unproject(geo.project(geo.THOMPSON_CENTER));
near(center.lat, geo.THOMPSON_CENTER.lat);
near(center.lng, geo.THOMPSON_CENTER.lng);
const floorCenter = geo.floorPointToCoordinates({ x: 50, y: 50 });
near(floorCenter.lat, center.lat);
near(floorCenter.lng, center.lng);
const nw = geo.project(geo.FLOOR_PLAN_BOUNDS.northWest);
const se = geo.project(geo.FLOOR_PLAN_BOUNDS.southEast);
near((nw.y - se.y) / (se.x - nw.x), 775 / 533);
const areaNW = geo.project(geo.NEIGHBORHOOD_BOUNDS.northWest);
const areaSE = geo.project(geo.NEIGHBORHOOD_BOUNDS.southEast);
const groundScale = Math.cos(center.lat * Math.PI / 180);
near((areaSE.x - areaNW.x) * groundScale, 600);
near((areaNW.y - areaSE.y) * groundScale, 600);

for (const table of contracts.THOMPSON_EAST_ENTRANCE_TABLES) {
  const position = geo.floorPointToCoordinates(table);
  assert.ok(geo.containsCoordinate(geo.FLOOR_PLAN_BOUNDS, position));
  const reader = geo.resolveGeographicReaderLocation(position, "device");
  assert.equal(reader.tableId, table.id);
  assert.equal(reader.usedFallback, false);
}
for (const position of [null, { lat: 0, lng: 0 }, { lat: NaN, lng: 0 }, geo.NEIGHBORHOOD_BOUNDS.northWest]) {
  const reader = geo.resolveGeographicReaderLocation(position, "device");
  assert.equal(reader.source, "demo");
  assert.equal(reader.usedFallback, true);
  assert.equal(reader.tableId, "110-1");
}
assert.equal(geo.resolveGeographicReaderLocation(center, "demo").source, "demo");
console.log("Geographic map checks passed: projection, 600 m bounds, schematic aspect ratio, every table anchor, and explicit GPS/demo fallbacks.");

const { createCampusVectorStyle } = load(new URL("./vector-map-style.ts", import.meta.url));
const baseStyle = {
  version: 8,
  sources: { campus: { type: "vector", url: "https://example.com/vector" }, shaded: { type: "raster", tiles: [] } },
  layers: [
    { id: "background", type: "background", paint: { "background-color": "white" } },
    ...["park", "landcover_wood", "building", "water"].map((id) => ({ id, type: "fill", source: "campus", paint: { "fill-color": "black" } })),
    { id: "street-label", type: "symbol", source: "campus", layout: { "text-field": "Main St" } },
    { id: "satellite", type: "raster", source: "shaded" },
    { id: "towers", type: "fill-extrusion", source: "campus" },
  ],
};
const originalStyle = JSON.stringify(baseStyle);
const vectorStyle = createCampusVectorStyle(baseStyle);
assert.equal(JSON.stringify(baseStyle), originalStyle, "Palette overrides must not mutate the provider style");
assert.equal(vectorStyle.layers.find((layer) => layer.id === "background").paint["background-color"], "#edf0e8");
assert.equal(vectorStyle.layers.find((layer) => layer.id === "park").paint["fill-color"], "#a9c68e");
assert.equal(vectorStyle.layers.find((layer) => layer.id === "building").paint["fill-outline-color"], "#9a8c78");
assert.ok(vectorStyle.layers.some((layer) => layer.id === "street-label"));
assert.ok(!vectorStyle.layers.some((layer) => ["raster", "fill-extrusion"].includes(layer.type)));
assert.equal(vectorStyle.sources.shaded, undefined);
assert.throws(() => createCampusVectorStyle({ version: 7, sources: {}, layers: [] }));
console.log("Vector style checks passed: flat palette, retained vector labels, no raster/3D layers, immutable input, and invalid-style handling.");
