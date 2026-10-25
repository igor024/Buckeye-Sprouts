"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { BookOpen, Crosshair, LocateFixed, Minus, Plus, RotateCw, X } from "lucide-react";
import { createPortal } from "react-dom";
import type { Map as LeafletMap } from "leaflet";
import {
  THOMPSON_EAST_ENTRANCE_PLAN, THOMPSON_TABLE_SPROUT_COUNTS, THOMPSON_TABLE_SPROUT_HEIGHT,
  type Coordinates, type CampusMapSpot, type ThompsonTable, type DemoReaderLocation,
} from "@/types/contracts";
import {
  THOMPSON_CENTER, NEIGHBORHOOD_BOUNDS, FLOOR_PLAN_BOUNDS,
  floorPointToCoordinates, containsCoordinate, resolveGeographicReaderLocation, DEMO_READER_POSITION,
} from "../geographic-map";
import { VECTOR_STYLE_URL, createCampusVectorStyle, CAMPUS_MAP_PALETTE } from "../vector-map-style";
import "leaflet/dist/leaflet.css";
import "maplibre-gl/dist/maplibre-gl.css";
import "../integrated-campus-map.css";

function tableStatusLabel(table: ThompsonTable): string {
  if (table.status === "empty") return `${table.label}: empty and available`;
  if (table.status === "very-busy") return `${table.label}: very busy; people can still join`;
  return `${table.label}: busy with a study group`;
}

export function IntegratedCampusMap({
  onOpenFloorPlan,
  showLibraryPlan,
  libraryFocusRequest,
  visibleTables,
  visibleSpots,
  selectedSpot,
  showRoute,
  selectedTableId,
  onSelectTable,
  onSelectSpot,
  onReaderLocationChange,
  onRefresh,
  isRefreshing = false,
}: {
  onOpenFloorPlan: () => void;
  showLibraryPlan: boolean;
  libraryFocusRequest: number;
  visibleTables: readonly ThompsonTable[];
  visibleSpots: CampusMapSpot[];
  selectedSpot: CampusMapSpot | null;
  showRoute: boolean;
  selectedTableId: string | null;
  onSelectTable: (table: ThompsonTable, trigger: HTMLElement) => void;
  onSelectSpot: (spot: CampusMapSpot) => void;
  onReaderLocationChange?: (location: DemoReaderLocation) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [backgroundAttempt, setBackgroundAttempt] = useState(0);
  const [tileState, setTileState] = useState<"loading" | "ready" | "error">("loading");
  const [, redraw] = useState(0);
  const [viewportSize, setViewportSize] = useState({ width: 430, height: 940 });
  const locationWatch = useRef<number | null>(null);
  const centeredOnLocation = useRef(false);
  const [locationState, setLocationState] = useState<"idle" | "locating" | "live" | "demo" | "error">("idle");
  const [locationMessage, setLocationMessage] = useState("");
  const [userPosition, setUserPosition] = useState<Coordinates | null>(null);
  const [showDisclosure, setShowDisclosure] = useState(false);

  useEffect(() => {
    let disposed = false;
    let cleanup: (() => void) | undefined;
    import("leaflet").then((L) => {
      if (disposed || !viewportRef.current) return;
      const bounds = L.latLngBounds(
        [NEIGHBORHOOD_BOUNDS.southEast.lat, NEIGHBORHOOD_BOUNDS.northWest.lng],
        [NEIGHBORHOOD_BOUNDS.northWest.lat, NEIGHBORHOOD_BOUNDS.southEast.lng],
      );
      const map = L.map(viewportRef.current, {
        zoomControl: false, attributionControl: false, maxBounds: bounds, maxBoundsViscosity: 1,
        maxZoom: 22, zoomSnap: 0, zoomDelta: 0.5, zoomAnimation: false,
        fadeAnimation: false, markerZoomAnimation: false,
      });
      mapRef.current = map;
      const sync = () => {
        const size = map.getSize();
        setViewportSize({ width: size.x, height: size.y });
        redraw((revision) => revision + 1);
      };
      const resize = () => {
        map.invalidateSize({ pan: false });
        const minimum = map.getBoundsZoom(bounds, true);
        map.setMinZoom(minimum);
        if (map.getZoom() < minimum) map.setZoom(minimum, { animate: false });
        map.panInsideBounds(bounds, { animate: false });
        sync();
      };
      map.setView([THOMPSON_CENTER.lat, THOMPSON_CENTER.lng], map.getBoundsZoom(bounds, true));
      map.setMinZoom(map.getZoom());
      map.on("move zoom resize", sync);
      const observer = new ResizeObserver(resize);
      observer.observe(viewportRef.current);
      sync();
      setMapReady(true);
      cleanup = () => { observer.disconnect(); map.remove(); mapRef.current = null; };
    }).catch(() => { if (!disposed) setMapError(true); });
    return () => { disposed = true; cleanup?.(); };
  }, []);

  // Keep the vector renderer independent: GPS, Leaflet, and local tables work without WebGL/network.
  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;
    let disposed = false;
    let failed = false;
    let layer: ReturnType<typeof import("@maplibre/maplibre-gl-leaflet").maplibreGL> | null = null;
    const abort = new AbortController();
    setTileState("loading");
    const timeout = setTimeout(() => {
      failed = true;
      abort.abort();
      if (!disposed) setTileState("error");
    }, 20000);
    const fail = () => {
      failed = true;
      clearTimeout(timeout);
      if (!disposed) setTileState("error");
    };
    const load = async () => {
      try {
        const [renderer, adapter, response] = await Promise.all([
          import("maplibre-gl"), import("@maplibre/maplibre-gl-leaflet"),
          fetch(VECTOR_STYLE_URL, { signal: abort.signal }),
        ]);
        if (!response.ok) throw new Error("Vector style unavailable");
        const style = createCampusVectorStyle(await response.json());
        if (disposed || abort.signal.aborted) return;
        const probe = document.createElement("canvas").getContext("webgl2");
        if (!probe) throw new Error("WebGL is unavailable");
        probe.getExtension("WEBGL_lose_context")?.loseContext();
        // Next emits this module worker as a versioned local asset in either bundler mode.
        renderer.setWorkerUrl(new URL("maplibre-gl/dist/maplibre-gl-worker.mjs", import.meta.url).toString());
        layer = adapter.maplibreGL({ style, interactive: false, attributionControl: false,
          bearing: 0, pitch: 0, maxZoom: 22, renderWorldCopies: false,
        });
        layer.addTo(map);
        const vectorMap = layer.getMaplibreMap();
        vectorMap.on("error", fail);
        vectorMap.on("webglcontextlost", fail);
        vectorMap.on("idle", () => {
          if (!disposed && !failed && vectorMap.areTilesLoaded()) {
            clearTimeout(timeout);
            setTileState("ready");
          }
        });
      } catch {
        if (!disposed) fail();
      }
    };
    void load();
    return () => {
      disposed = true;
      clearTimeout(timeout);
      abort.abort();
      if (layer && map.hasLayer(layer)) {
        // A WebGL constructor failure can leave the adapter partially attached.
        try { map.removeLayer(layer); } catch { layer.getContainer()?.remove(); }
      }
    };
  }, [mapReady, backgroundAttempt]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map || !showLibraryPlan) return;
    map.fitBounds([
      [FLOOR_PLAN_BOUNDS.southEast.lat, FLOOR_PLAN_BOUNDS.northWest.lng],
      [FLOOR_PLAN_BOUNDS.northWest.lat, FLOOR_PLAN_BOUNDS.southEast.lng],
    ], {
      paddingTopLeft: [24, 44], paddingBottomRight: [24, viewportSize.height * 0.62 + 16],
      maxZoom: 22, animate: false,
    });
  }, [mapReady, showLibraryPlan, libraryFocusRequest, viewportSize.width, viewportSize.height]);

  const stopLocationWatch = useCallback(() => {
    if (locationWatch.current !== null) navigator.geolocation?.clearWatch(locationWatch.current);
    locationWatch.current = null;
    centeredOnLocation.current = false;
  }, []);
  useEffect(() => stopLocationWatch, [stopLocationWatch]);

  const changeZoom = (delta: number) => {
    const map = mapRef.current;
    if (map) map.setZoom(Math.min(map.getMaxZoom(), Math.max(map.getMinZoom(), map.getZoom() + delta)));
  };
  const resetMap = () => {
    const map = mapRef.current;
    if (map) map.setView([THOMPSON_CENTER.lat, THOMPSON_CENTER.lng], map.getMinZoom(), { animate: false });
  };
  const simulateLocation = () => {
    stopLocationWatch();
    setUserPosition(DEMO_READER_POSITION);
    setLocationState("demo");
    setLocationMessage("Demo location at Thompson Library. Reader uses simulated table 110-1.");
  };
  const requestLocation = () => {
    setShowDisclosure(false);
    stopLocationWatch();
    setUserPosition(null);
    if (!navigator.geolocation) {
      setLocationState("error");
      setLocationMessage("This browser does not support device location. Reader uses a demo table.");
      return;
    }
    setLocationState("locating");
    setLocationMessage("Finding your location…");
    locationWatch.current = navigator.geolocation.watchPosition(
      ({ coords }) => {
        const position = { lat: coords.latitude, lng: coords.longitude };
        const inside = containsCoordinate(NEIGHBORHOOD_BOUNDS, position);
        setLocationState("live");
        setUserPosition(position);
        setLocationMessage(!inside
          ? "Your location is outside the 300 m map area. Reader uses a demo table."
          : !containsCoordinate(FLOOR_PLAN_BOUNDS, position)
            ? "Approximate location shown on this device. Outside Thompson; reader uses a demo table."
            : "Approximate location shown on this device. Indoor table selection is a simulation.");
        if (inside && !centeredOnLocation.current) {
          mapRef.current?.panTo([position.lat, position.lng], { animate: false });
          centeredOnLocation.current = true;
        }
      },
      (error) => {
        stopLocationWatch();
        setUserPosition(null);
        setLocationState("error");
        setLocationMessage(error.code === error.PERMISSION_DENIED
          ? "Location access was declined. Reader uses a demo table."
          : "Device location is unavailable. Reader uses a demo table.");
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 },
    );
  };
  useEffect(() => {
    onReaderLocationChange?.(resolveGeographicReaderLocation(userPosition, locationState === "live" ? "device" : "demo"));
  }, [userPosition, locationState, onReaderLocationChange]);

  const map = mapRef.current;
  const screenPoint = (position: Coordinates) => {
    if (!mapReady || !map) return { x: viewportSize.width / 2, y: viewportSize.height * 0.29 };
    return map.latLngToContainerPoint([position.lat, position.lng]);
  };
  const nw = screenPoint(FLOOR_PLAN_BOUNDS.northWest);
  const se = screenPoint(FLOOR_PLAN_BOUNDS.southEast);
  const planGeometry = { left: nw.x, top: nw.y, width: se.x - nw.x, height: se.y - nw.y };
  const markerStyle = (position: Coordinates) => {
    const point = screenPoint(position);
    return { left: `${point.x}px`, top: `${point.y}px` };
  };
  const planMarkerStyle = (point: { x: number; y: number }) => markerStyle(floorPointToCoordinates(point));
  const tableStyle = (table: ThompsonTable) => ({
    ...planMarkerStyle(table),
    width: `${planGeometry.width * table.width / 100}px`,
    height: `${planGeometry.height * table.height / 100}px`,
    "--table-sprout-height": `${planGeometry.height * THOMPSON_TABLE_SPROUT_HEIGHT / THOMPSON_EAST_ENTRANCE_PLAN.sourceSize.height}px`,
  });
  const mapSize = viewportSize;
  const areaNW = screenPoint(NEIGHBORHOOD_BOUNDS.northWest);
  const areaSE = screenPoint(NEIGHBORHOOD_BOUNDS.southEast);

  return (
    <div className="integrated-campus-map" style={{ "--campus-map-background": CAMPUS_MAP_PALETTE.background } as CSSProperties} aria-label="Ohio State campus map with Thompson Library">
      <div className="integrated-map-viewport" ref={viewportRef} role="region"
        aria-label="Vector campus map within 300 meters of Thompson Library. Drag to pan, pinch or double tap to zoom." />
      {mapReady && <div className="integrated-geographic-overlays" style={{ clipPath: `inset(${Math.max(0, areaNW.y)}px ${Math.max(0, mapSize.width - areaSE.x)}px ${Math.max(0, mapSize.height - areaSE.y)}px ${Math.max(0, areaNW.x)}px)` }}>
        <svg className="integrated-map-surface" viewBox={`0 0 ${mapSize.width} ${mapSize.height}`} preserveAspectRatio="none" aria-label="Thompson Library floor plan">
          {showLibraryPlan && <>
            <rect
              className="integrated-library-plan-frame"
              x={planGeometry.left}
              y={planGeometry.top}
              width={planGeometry.width}
              height={planGeometry.height}
              rx="4"
            />
            <image
              className="integrated-library-plan-image"
              href={THOMPSON_EAST_ENTRANCE_PLAN.image}
              x={planGeometry.left}
              y={planGeometry.top}
              width={planGeometry.width}
              height={planGeometry.height}
              preserveAspectRatio="none"
              role="img"
              aria-label="Thompson Library East Entrance floor plan"
            />
          </>}
        </svg>
        <div className="integrated-map-marker-layer" role="group" aria-label="Map markers">
          {!showLibraryPlan && <button type="button" className="integrated-library-marker"
            style={markerStyle(THOMPSON_CENTER)} onClick={onOpenFloorPlan} aria-label="Open Thompson Library floor plan">
            <span className="integrated-marker-icon"><BookOpen size={15} /></span><span>Thompson Library</span>
          </button>}
          {showLibraryPlan && visibleTables.map((table) => (
            <button
              key={table.id}
              type="button"
              className={`integrated-table-control table-status-${table.status}${selectedTableId === table.id ? " selected" : ""}`}
              style={tableStyle(table)}
              onClick={(event) => onSelectTable(table, event.currentTarget)}
              aria-label={tableStatusLabel(table)}
              title={tableStatusLabel(table)}
            >
              {table.groupId && table.status !== "empty" && <span className="integrated-table-sprouts" aria-hidden="true">
                {Array.from({ length: THOMPSON_TABLE_SPROUT_COUNTS[table.status] }, (_, index) => <img key={index} src="/illustrations/sproutman.png" width="919" height="1711" alt="" draggable={false} />)}
              </span>}
            </button>
          ))}
          {showLibraryPlan && visibleSpots.map((spot) => (
            <button
              key={spot.id}
              type="button"
              className="integrated-plan-dot"
              style={planMarkerStyle(spot)}
              onClick={() => onSelectSpot(spot)}
              aria-label={`${spot.label}: ${spot.detail}`}
              title={`${spot.label} · ${spot.detail}`}
            />
          ))}
          {showLibraryPlan && selectedSpot && showRoute && (() => {
            const start = planMarkerStyle({ x: 48, y: 97 });
            const atrium = planMarkerStyle({ x: 48, y: 59 });
            const destination = planMarkerStyle(selectedSpot);
            return <svg className="integrated-plan-route" viewBox={`0 0 ${mapSize.width} ${mapSize.height}`} aria-hidden="true">
              <polyline points={`${Number.parseFloat(start.left)} ${Number.parseFloat(start.top)}, ${Number.parseFloat(atrium.left)} ${Number.parseFloat(atrium.top)}, ${Number.parseFloat(destination.left)} ${Number.parseFloat(destination.top)}`} />
            </svg>;
          })()}
          {userPosition && containsCoordinate(NEIGHBORHOOD_BOUNDS, userPosition) && <span
            className={`integrated-user-location${locationState === "demo" ? " is-demo" : ""}`}
            style={markerStyle(userPosition)}
            aria-label={locationState === "demo" ? "Simulated location" : "Approximate device location"}
          />}
        </div>
      </div>}
      {mapReady && <svg className="integrated-map-boundary-mask" viewBox={`0 0 ${mapSize.width} ${mapSize.height}`} preserveAspectRatio="none" aria-hidden="true">
        <path fillRule="evenodd" d={`M0 0H${mapSize.width}V${mapSize.height}H0Z M${areaNW.x} ${areaNW.y}V${areaSE.y}H${areaSE.x}V${areaNW.y}Z`} />
      </svg>}
      <div className="integrated-map-attribution"><a href="https://openfreemap.org/" target="_blank" rel="noreferrer">OpenFreeMap</a> · © <a href="https://openmaptiles.org/" target="_blank" rel="noreferrer">OpenMapTiles</a> · <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a></div>
      {(tileState !== "ready" || mapError) && <div className="integrated-tile-status" role="status">
        {mapError ? "Map could not start. Reload to retry." : tileState === "error" ? <>Map background unavailable. Library tables still work. <button type="button" onClick={() => setBackgroundAttempt((attempt) => attempt + 1)}>Retry map</button></> : "Loading campus map…"}
      </div>}

      <div className="integrated-map-actions" aria-label="Location and map controls">
        <button
          type="button"
          className="integrated-location-button"
          aria-label={locationState === "live" ? "Update location" : locationState === "locating" ? "Finding your location" : "My location"}
          title={locationState === "live" ? "Update location" : locationState === "locating" ? "Finding your location" : "My location"}
          onClick={() => setShowDisclosure(true)}
        >
          <Crosshair size={15} />
        </button>
        <div className="integrated-map-zoom" aria-label="Map zoom controls">
          <button type="button" aria-label="Zoom in" disabled={!mapReady || (map?.getZoom() ?? 0) >= (map?.getMaxZoom() ?? 22)} onClick={() => changeZoom(.5)}><Plus size={18} /></button>
          <button type="button" aria-label="Zoom out" disabled={!mapReady || (map?.getZoom() ?? 0) <= (map?.getMinZoom() ?? 0)} onClick={() => changeZoom(-.5)}><Minus size={18} /></button>
        </div>
        <button type="button" className="integrated-recenter" aria-label="Recenter campus map" onClick={resetMap}><LocateFixed size={17} /></button>
        {onRefresh && (
          <button
            type="button"
            className={`integrated-refresh-button${isRefreshing ? " is-refreshing" : ""}`}
            onClick={onRefresh}
            disabled={isRefreshing}
            aria-label="Refresh table colors and group details from database"
            title="Refresh database data"
          >
            <RotateCw size={14} className={isRefreshing ? "animate-spin" : ""} />
            <span>{isRefreshing ? "Updating…" : "Refresh"}</span>
          </button>
        )}
        <button type="button" className="integrated-demo-location" onClick={simulateLocation}>Simulate location</button>
      </div>

      {locationMessage && <div className={`integrated-location-status status-${locationState}`} role="status"><span />{locationMessage}</div>}

      {showDisclosure && createPortal(<div className="location-disclosure-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowDisclosure(false); }}>
        <section className="location-disclosure" role="dialog" aria-modal="true" aria-labelledby="location-disclosure-title">
          <button className="location-disclosure-close" type="button" aria-label="Close location information" onClick={() => setShowDisclosure(false)}><X size={18} /></button>
          <span className="location-disclosure-icon"><Crosshair size={23} /></span>
          <h2 id="location-disclosure-title">Show your location?</h2>
          <p>Your browser will ask for location access. Your approximate position appears on this campus map and stays on this device. Buckeye Sprouts does not save your coordinates.</p>
          <button className="location-disclosure-confirm" type="button" onClick={requestLocation}>Continue</button>
          <button className="location-disclosure-cancel" type="button" onClick={() => setShowDisclosure(false)}>Not now</button>
        </section>
      </div>, document.body)}
    </div>
  );
}
