import {
  CAMPUS_MAP_ARTWORK_SIZE, CAMPUS_MAP_DEMO_LOCATION, THOMPSON_EAST_ENTRANCE_PLAN,
  THOMPSON_EAST_ENTRANCE_TABLES,
  type CampusMapArtPoint, type CampusMapViewport, type DemoReaderLocation,
} from "@/types/contracts";

export function artworkPointToViewport(point: CampusMapArtPoint, viewport: CampusMapViewport): CampusMapArtPoint {
  const scale = Math.max(viewport.width / CAMPUS_MAP_ARTWORK_SIZE.width, viewport.height / CAMPUS_MAP_ARTWORK_SIZE.height);
  return {
    x: (viewport.width - CAMPUS_MAP_ARTWORK_SIZE.width * scale) / 2 + point.x * scale,
    y: (viewport.height - CAMPUS_MAP_ARTWORK_SIZE.height * scale) / 2 + point.y * scale,
  };
}

export function getPlanGeometry(viewport: CampusMapViewport) {
  const width = Math.min(viewport.width * THOMPSON_EAST_ENTRANCE_PLAN.mapOverlayWidthRatio, THOMPSON_EAST_ENTRANCE_PLAN.mapOverlayMaxWidth);
  const height = width * THOMPSON_EAST_ENTRANCE_PLAN.sourceSize.height / THOMPSON_EAST_ENTRANCE_PLAN.sourceSize.width;
  const center = artworkPointToViewport({
    x: CAMPUS_MAP_ARTWORK_SIZE.width * THOMPSON_EAST_ENTRANCE_PLAN.campusPosition.x / 100,
    y: CAMPUS_MAP_ARTWORK_SIZE.height * THOMPSON_EAST_ENTRANCE_PLAN.campusPosition.y / 100,
  }, viewport);
  return { width, height, center, left: center.x - width / 2, top: center.y - height / 2 };
}

/** Compare in the same unzoomed projection used to draw the user and tables. */
export function resolveDemoReaderLocation(point: CampusMapArtPoint | null, source: "device" | "demo", viewport: CampusMapViewport): DemoReaderLocation {
  const usable = point !== null && Number.isFinite(point.x) && Number.isFinite(point.y)
    && point.x >= 0 && point.x <= CAMPUS_MAP_ARTWORK_SIZE.width && point.y >= 0 && point.y <= CAMPUS_MAP_ARTWORK_SIZE.height;
  const origin = usable ? point : CAMPUS_MAP_DEMO_LOCATION;
  const user = artworkPointToViewport(origin, viewport);
  const plan = getPlanGeometry(viewport);
  let nearest = THOMPSON_EAST_ENTRANCE_TABLES[0];
  let distance = Infinity;
  for (const table of THOMPSON_EAST_ENTRANCE_TABLES) {
    const squared = (plan.left + plan.width * table.x / 100 - user.x) ** 2
      + (plan.top + plan.height * table.y / 100 - user.y) ** 2;
    if (squared < distance) { nearest = table; distance = squared; }
  }
  return { tableId: nearest.id, point: origin, source: usable ? source : "demo", usedFallback: !usable };
}
