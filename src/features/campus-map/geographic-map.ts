import {
  CAMPUS_MAP_ARTWORK_SIZE, CAMPUS_MAP_DEMO_LOCATION, CAMPUS_MAP_GEO_BOUNDS,
  THOMPSON_EAST_ENTRANCE_PLAN, THOMPSON_EAST_ENTRANCE_TABLES,
  type Coordinates, type DemoReaderLocation,
} from "@/types/contracts";

// Verified against OSM way 30172308: https://www.openstreetmap.org/way/30172308
// The floor plan is a schematic, not a surveyed building footprint.
export const THOMPSON_CENTER: Coordinates = { lat: 39.9992573, lng: -83.0148821 };
export const NEIGHBORHOOD_RADIUS_METERS = 300;
const EARTH_RADIUS = 6378137;
const radians = Math.PI / 180;

/** Web Mercator meters, shared by Leaflet tiles, the floor image, and hit targets. */
export function project({ lat, lng }: Coordinates) {
  return { x: EARTH_RADIUS * lng * radians, y: EARTH_RADIUS * Math.log(Math.tan(Math.PI / 4 + lat * radians / 2)) };
}
export function unproject({ x, y }: { x: number; y: number }): Coordinates {
  return { lat: (2 * Math.atan(Math.exp(y / EARTH_RADIUS)) - Math.PI / 2) / radians, lng: x / EARTH_RADIUS / radians };
}
function boundsAround(width: number, height: number) {
  const center = project(THOMPSON_CENTER);
  const scale = 1 / Math.cos(THOMPSON_CENTER.lat * radians);
  return {
    northWest: unproject({ x: center.x - width * scale / 2, y: center.y + height * scale / 2 }),
    southEast: unproject({ x: center.x + width * scale / 2, y: center.y - height * scale / 2 }),
  };
}
export const NEIGHBORHOOD_BOUNDS = boundsAround(NEIGHBORHOOD_RADIUS_METERS * 2, NEIGHBORHOOD_RADIUS_METERS * 2);
export const FLOOR_PLAN_BOUNDS = boundsAround(80, 80 * THOMPSON_EAST_ENTRANCE_PLAN.sourceSize.height / THOMPSON_EAST_ENTRANCE_PLAN.sourceSize.width);

export function containsCoordinate(bounds: typeof FLOOR_PLAN_BOUNDS, point: Coordinates) {
  return Number.isFinite(point.lat) && Number.isFinite(point.lng)
    && point.lat <= bounds.northWest.lat && point.lat >= bounds.southEast.lat
    && point.lng >= bounds.northWest.lng && point.lng <= bounds.southEast.lng;
}
export function floorPointToCoordinates(point: { x: number; y: number }): Coordinates {
  const nw = project(FLOOR_PLAN_BOUNDS.northWest);
  const se = project(FLOOR_PLAN_BOUNDS.southEast);
  return unproject({ x: nw.x + (se.x - nw.x) * point.x / 100, y: nw.y + (se.y - nw.y) * point.y / 100 });
}

export const DEMO_READER_POSITION = floorPointToCoordinates(
  THOMPSON_EAST_ENTRANCE_TABLES.find((table) => table.id === "110-1")!,
);

/** Retain the reader's existing DTO; geographic positions never become proof of indoor presence. */
export function resolveGeographicReaderLocation(position: Coordinates | null, source: "device" | "demo"): DemoReaderLocation {
  const defaultTable = THOMPSON_EAST_ENTRANCE_TABLES.find((table) => table.id === "110-1")!;
  if (!position || source === "demo" || !containsCoordinate(FLOOR_PLAN_BOUNDS, position)) {
    return { tableId: defaultTable.id, point: CAMPUS_MAP_DEMO_LOCATION, source: "demo", usedFallback: true };
  }
  const origin = project(position);
  let nearest = defaultTable;
  let nearestDistance = Infinity;
  for (const table of THOMPSON_EAST_ENTRANCE_TABLES) {
    const projected = project(floorPointToCoordinates(table));
    const distance = (projected.x - origin.x) ** 2 + (projected.y - origin.y) ** 2;
    if (distance < nearestDistance) { nearest = table; nearestDistance = distance; }
  }
  return {
    tableId: nearest.id, source: "device", usedFallback: false,
    // Compatibility only: the reader DTO still documents its point as legacy artwork coordinates.
    point: {
      x: (position.lng - CAMPUS_MAP_GEO_BOUNDS.west) / (CAMPUS_MAP_GEO_BOUNDS.east - CAMPUS_MAP_GEO_BOUNDS.west) * CAMPUS_MAP_ARTWORK_SIZE.width,
      y: (CAMPUS_MAP_GEO_BOUNDS.north - position.lat) / (CAMPUS_MAP_GEO_BOUNDS.north - CAMPUS_MAP_GEO_BOUNDS.south) * CAMPUS_MAP_ARTWORK_SIZE.height,
    },
  };
}
