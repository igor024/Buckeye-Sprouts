# Campus map feature

The campus background uses OpenFreeMap's Positron vector style, rendered with MapLibre GL through its Leaflet adapter. Leaflet remains responsible for the camera and interactions; the vector renderer loads independently in the browser. The style comes from `https://tiles.openfreemap.org/styles/positron` and needs no API key. Visible attribution credits OpenFreeMap, OpenMapTiles, and OpenStreetMap. See https://openfreemap.org/quick_start/.

`vector-map-style.ts` applies a flat campus palette: pale land, stronger green parks, mapped grass lawns, and woods, warm tan buildings with darker outlines, blue water, gray roads and walking paths, and dark labels with light halos. The palette also supplies the map container, boundary mask, and Thompson floor-plan backing through one CSS variable, so the outer frame matches the land color without a white border or card shadow. Interior floor-plan rooms and occupancy colors stay unchanged. Raster imagery, hillshading, and building extrusions are excluded. Geometry and labels are rendered at the current zoom and device pixel ratio through camera zoom 22, so close-ups do not stretch raster pixels. Source geometry has finite geographic detail; closer zooms do not introduce surveyed indoor information.

MapLibre's module worker is emitted as a hashed local asset by Next.js using `new URL('maplibre-gl/dist/maplibre-gl-worker.mjs', import.meta.url)`. Keep renderer imports browser-only. Network failure, unavailable WebGL, and context loss show an error with a retry action while Leaflet and local table controls keep working. Retry rebuilds only the vector layer. External map resources are not service-worker precached.

`geographic-map.ts` defines Thompson's center, verified against OpenStreetMap building way 30172308, and navigation bounds extending 300 meters in each cardinal direction. Leaflet handles drag, pinch, wheel, double-click, keyboard zoom, and the existing controls. A viewport-dependent minimum zoom and maximum bounds restrict navigation; a neutral mask covers boundary overshoot. Recenter returns to the neighborhood view.

The local East Entrance floor SVG stays embedded over Thompson as a schematic 80-meter-wide overlay, preserving its source aspect ratio. Opening the floor plan focuses it above the bottom sheet. The image, table hit targets, sprouts, room pins, indoor route, and GPS marker use the same Web Mercator projection. Existing table data and callbacks remain unchanged. Legacy artwork helpers remain for compatibility but do not drive this map.

Device location is requested after the location disclosure and stays in page memory. Out-of-area positions do not recenter the map. GPS does not verify indoor presence. Outside the schematic floor bounds, the reader explicitly falls back to simulated table 110-1; **Simulate location** uses the same anchor. Permission failure stops the GPS watcher and preserves the demo workflow. The local floor SVG remains a PWA asset for offline use.

## Running the Application

### 1. Install Dependencies
```sh
npm install
```

### 2. Start the Development Server
```sh
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. (On Windows PowerShell, use `npm.cmd` if script execution policy blocks `npm.ps1`).

### 3. Production Build & Start
```sh
npm run build
npm start
```

If Turbopack cannot bind its compilation worker port in the execution environment, build using webpack:
```sh
npm run build -- --webpack
```

## Validation & Testing

Run unit tests and verification checks:

```sh
node src/features/campus-map/geographic-map.test.mjs
node scripts/check-group-demo.mjs
npm run check:foundation
npm run typecheck
npm run build
```
