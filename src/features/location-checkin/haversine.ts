import type { Coordinates, LibraryGeofence } from "@/types/contracts";

/**
 * Standard Mean Earth Radius in meters (WGS84 spherical approximation).
 */
export const EARTH_RADIUS_METERS = 6371000;

/**
 * Coarse geofence departure threshold (meters).
 * If a host moves farther than this distance from the library anchor,
 * the departure sequence begins.
 */
export const DEPARTURE_THRESHOLD_METERS = 150;

/**
 * Consecutive measurement cycles required before triggering auto-checkout.
 * This hysteresis filter prevents concrete indoor GPS drift / bounce from
 * inadvertently closing an active session.
 */
export const HYSTERESIS_CYCLES_REQUIRED = 2;

/**
 * Known Ohio State library geofence coordinates and default radiuses.
 */
export const CAMPUS_LIBRARY_GEOFENCES: Record<string, LibraryGeofence> = {
  "Thompson Library": {
    libraryName: "Thompson Library",
    center: { lat: 40.0001, lng: -83.0146 },
    radiusMeters: 100,
  },
  "18th Avenue Library": {
    libraryName: "18th Avenue Library",
    center: { lat: 40.0025, lng: -83.0092 },
    radiusMeters: 85,
  },
  "Prior Health Sciences Library": {
    libraryName: "Prior Health Sciences Library",
    center: { lat: 39.9961, lng: -83.0165 },
    radiusMeters: 90,
  },
  "Kearns Hall": {
    libraryName: "Kearns Hall",
    center: { lat: 40.0038, lng: -83.0152 },
    radiusMeters: 75,
  },
};

/**
 * Simulation coordinates for High Street departure (~560m east of Thompson Library).
 * Used by judges and testing tools to simulate leaving campus.
 */
export const HIGH_STREET_SIMULATION_COORDINATES: Coordinates = {
  lat: 40.0001,
  lng: -83.008,
};

/**
 * Calculates geodesic surface distance between two WGS84 coordinates using the Haversine formula:
 *
 *   d = 2r * arcsin( sqrt( sin^2(Δφ / 2) + cos(φ1) * cos(φ2) * sin^2(Δλ / 2) ) )
 *
 * @param coord1 Origin coordinate { lat, lng }
 * @param coord2 Destination coordinate { lat, lng }
 * @returns Geodesic distance in meters (rounded to one decimal place)
 */
export function haversineDistance(coord1: Coordinates, coord2: Coordinates): number {
  const toRadians = (deg: number) => (deg * Math.PI) / 180;

  const phi1 = toRadians(coord1.lat);
  const phi2 = toRadians(coord2.lat);
  const deltaPhi = toRadians(coord2.lat - coord1.lat);
  const deltaLambda = toRadians(coord2.lng - coord1.lng);

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceMeters = EARTH_RADIUS_METERS * c;

  return Math.round(distanceMeters * 10) / 10;
}

/**
 * Resolves a library geofence by name, falling back to Thompson Library coordinates.
 */
export function resolveLibraryGeofence(libraryName: string): LibraryGeofence {
  return (
    CAMPUS_LIBRARY_GEOFENCES[libraryName] || {
      libraryName,
      center: { lat: 40.0001, lng: -83.0146 },
      radiusMeters: 100,
    }
  );
}

/**
 * Determines whether a distance is outside the departure threshold boundary.
 */
export function isOutsideDepartureBoundary(
  distanceMeters: number,
  threshold = DEPARTURE_THRESHOLD_METERS
): boolean {
  return distanceMeters > threshold;
}
