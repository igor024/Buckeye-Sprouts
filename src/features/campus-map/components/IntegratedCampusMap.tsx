"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BookOpen, Crosshair, LocateFixed, MapPin, Minus, Plus, Users, X } from "lucide-react";
import { createPortal } from "react-dom";
import {
  CAMPUS_MAP_ARTWORK_SIZE,
  CAMPUS_MAP_BUILDINGS,
  CAMPUS_MAP_DEMO_LOCATION,
  CAMPUS_MAP_GEO_BOUNDS,
  CAMPUS_MAP_LANDMARKS,
  CAMPUS_MAP_ZOOM_LIMITS,
  MOCK_STUDY_GROUP_PINS,
  THOMPSON_EAST_ENTRANCE_PLAN,
  type CampusMapView,
  type Coordinates,
  type CampusMapSpot,
  type StudyGroupMapPin,
} from "@/types/contracts";
import "../integrated-campus-map.css";

type Point = { x: number; y: number };
type ViewportSize = { width: number; height: number };

// The same minimum fraction on each axis guarantees the configured visible area.
const MIN_VISIBLE_AXIS_FRACTION = Math.sqrt(CAMPUS_MAP_ZOOM_LIMITS.minThompsonVisibleArea);

/** Match the nested campus SVG's xMidYMid slice mapping for every viewport size. */
function artworkPointToViewport(point: Point, viewport: ViewportSize): Point {
  const artworkScale = Math.max(
    viewport.width / CAMPUS_MAP_ARTWORK_SIZE.width,
    viewport.height / CAMPUS_MAP_ARTWORK_SIZE.height,
  );
  const renderedWidth = CAMPUS_MAP_ARTWORK_SIZE.width * artworkScale;
  const renderedHeight = CAMPUS_MAP_ARTWORK_SIZE.height * artworkScale;
  return {
    x: (viewport.width - renderedWidth) / 2 + point.x * artworkScale,
    y: (viewport.height - renderedHeight) / 2 + point.y * artworkScale,
  };
}

function getPlanGeometry(viewport: ViewportSize) {
  const width = Math.min(
    viewport.width * THOMPSON_EAST_ENTRANCE_PLAN.mapOverlayWidthRatio,
    THOMPSON_EAST_ENTRANCE_PLAN.mapOverlayMaxWidth,
  );
  const height = width * THOMPSON_EAST_ENTRANCE_PLAN.sourceSize.height / THOMPSON_EAST_ENTRANCE_PLAN.sourceSize.width;
  const center = artworkPointToViewport({
    x: CAMPUS_MAP_ARTWORK_SIZE.width * THOMPSON_EAST_ENTRANCE_PLAN.campusPosition.x / 100,
    y: CAMPUS_MAP_ARTWORK_SIZE.height * THOMPSON_EAST_ENTRANCE_PLAN.campusPosition.y / 100,
  }, viewport);
  return { width, height, center, left: center.x - width / 2, top: center.y - height / 2 };
}

function mapPointToScreen(point: Point, view: CampusMapView, viewport: ViewportSize): Point {
  return {
    x: viewport.width / 2 + view.x + (point.x - viewport.width / 2) * view.scale,
    y: viewport.height / 2 + view.y + (point.y - viewport.height / 2) * view.scale,
  };
}

function planPointToScreen(position: { x: number; y: number }, view: CampusMapView, viewport: ViewportSize): Point {
  const plan = getPlanGeometry(viewport);
  return mapPointToScreen({
    x: plan.left + plan.width * position.x / 100,
    y: plan.top + plan.height * position.y / 100,
  }, view, viewport);
}

function maximumMapScale(viewport: ViewportSize, keepThompsonVisible: boolean): number {
  if (!keepThompsonVisible || viewport.width <= 0 || viewport.height <= 0) return CAMPUS_MAP_ZOOM_LIMITS.maxScale;
  const plan = getPlanGeometry(viewport);
  return Math.max(CAMPUS_MAP_ZOOM_LIMITS.minScale, Math.min(
    CAMPUS_MAP_ZOOM_LIMITS.maxScale,
    viewport.width / (plan.width * MIN_VISIBLE_AXIS_FRACTION),
    viewport.height / (plan.height * MIN_VISIBLE_AXIS_FRACTION),
  ));
}

function clampMapView(view: CampusMapView, viewport: ViewportSize, keepThompsonVisible: boolean): CampusMapView {
  if (viewport.width <= 0 || viewport.height <= 0) return view;
  const scale = Math.min(maximumMapScale(viewport, keepThompsonVisible), Math.max(CAMPUS_MAP_ZOOM_LIMITS.minScale, view.scale));
  const maxPanX = (scale - 1) * viewport.width / 2;
  const maxPanY = (scale - 1) * viewport.height / 2;
  let minX = -maxPanX;
  let maxX = maxPanX;
  let minY = -maxPanY;
  let maxY = maxPanY;

  if (keepThompsonVisible) {
    const plan = getPlanGeometry(viewport);
    const halfWidth = viewport.width / 2;
    const halfHeight = viewport.height / 2;
    const planScreenCenterX = halfWidth + (plan.center.x - halfWidth) * scale;
    const planScreenCenterY = halfHeight + (plan.center.y - halfHeight) * scale;
    const planScreenWidth = plan.width * scale;
    const planScreenHeight = plan.height * scale;
    const minimumVisibleWidth = planScreenWidth * MIN_VISIBLE_AXIS_FRACTION;
    const minimumVisibleHeight = planScreenHeight * MIN_VISIBLE_AXIS_FRACTION;
    const visibleMinX = minimumVisibleWidth - (planScreenCenterX + planScreenWidth / 2);
    const visibleMaxX = viewport.width - minimumVisibleWidth - (planScreenCenterX - planScreenWidth / 2);
    const visibleMinY = minimumVisibleHeight - (planScreenCenterY + planScreenHeight / 2);
    const visibleMaxY = viewport.height - minimumVisibleHeight - (planScreenCenterY - planScreenHeight / 2);
    const boundedMinX = Math.max(minX, visibleMinX);
    const boundedMaxX = Math.min(maxX, visibleMaxX);
    const boundedMinY = Math.max(minY, visibleMinY);
    const boundedMaxY = Math.min(maxY, visibleMaxY);
    if (boundedMinX <= boundedMaxX) { minX = boundedMinX; maxX = boundedMaxX; }
    if (boundedMinY <= boundedMaxY) { minY = boundedMinY; maxY = boundedMaxY; }
  }

  return {
    scale,
    x: Math.min(maxX, Math.max(minX, view.x)),
    y: Math.min(maxY, Math.max(minY, view.y)),
  };
}

function coordinatesToPoint({ lat, lng }: Coordinates): Point {
  return {
    x: ((lng - CAMPUS_MAP_GEO_BOUNDS.west) / (CAMPUS_MAP_GEO_BOUNDS.east - CAMPUS_MAP_GEO_BOUNDS.west)) * CAMPUS_MAP_ARTWORK_SIZE.width,
    y: ((CAMPUS_MAP_GEO_BOUNDS.north - lat) / (CAMPUS_MAP_GEO_BOUNDS.north - CAMPUS_MAP_GEO_BOUNDS.south)) * CAMPUS_MAP_ARTWORK_SIZE.height,
  };
}

export function IntegratedCampusMap({
  onOpenFloorPlan,
  showLibraryPlan,
  libraryFocusRequest,
  visibleGroups,
  visibleSpots,
  selectedSpot,
  showRoute,
  selectedGroupId,
  onSelectGroup,
  onSelectSpot,
}: {
  onOpenFloorPlan: () => void;
  showLibraryPlan: boolean;
  libraryFocusRequest: number;
  visibleGroups: StudyGroupMapPin[];
  visibleSpots: CampusMapSpot[];
  selectedSpot: CampusMapSpot | null;
  showRoute: boolean;
  selectedGroupId: string | null;
  onSelectGroup: (group: StudyGroupMapPin, trigger: HTMLElement) => void;
  onSelectSpot: (spot: CampusMapSpot) => void;
}) {
  const [view, setView] = useState<CampusMapView>({ scale: CAMPUS_MAP_ZOOM_LIMITS.minScale, x: 0, y: 0 });
  const [viewportSize, setViewportSize] = useState<ViewportSize>({ width: 0, height: 0 });
  const viewportRef = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, Point>());
  const locationWatch = useRef<number | null>(null);
  const centeredOnLocation = useRef(false);
  const [locationState, setLocationState] = useState<"idle" | "locating" | "live" | "demo" | "error">("idle");
  const [locationMessage, setLocationMessage] = useState("");
  const [userPoint, setUserPoint] = useState<Point | null>(null);
  const [showDisclosure, setShowDisclosure] = useState(false);
  const libraryPlanCentered = useRef(false);
  const libraryFocusHandled = useRef<number | null>(null);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const measure = () => {
      const rect = viewport.getBoundingClientRect();
      setViewportSize((current) => current.width === rect.width && current.height === rect.height
        ? current
        : { width: rect.width, height: rect.height });
    };
    measure();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    observer?.observe(viewport);
    window.addEventListener("resize", measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  useEffect(() => () => {
    if (locationWatch.current !== null) navigator.geolocation?.clearWatch(locationWatch.current);
  }, []);

  useEffect(() => {
    if (!showLibraryPlan) {
      libraryPlanCentered.current = false;
      libraryFocusHandled.current = null;
      return;
    }
    if (!viewportSize.width || !viewportSize.height) return;
    if (libraryPlanCentered.current && libraryFocusHandled.current === libraryFocusRequest) return;
    libraryPlanCentered.current = true;
    libraryFocusHandled.current = libraryFocusRequest;
    const { width, height } = viewportSize;
    const scale = Math.min(CAMPUS_MAP_ZOOM_LIMITS.focusScale, maximumMapScale(viewportSize, true));
    const mapCenter = { x: width / 2, y: height / 2 };
    const libraryPoint = getPlanGeometry(viewportSize).center;
    const targetPoint = { x: width / 2, y: height * 0.29 };
    setView(clampMapView({
      scale,
      x: targetPoint.x - mapCenter.x - (libraryPoint.x - mapCenter.x) * scale,
      y: targetPoint.y - mapCenter.y - (libraryPoint.y - mapCenter.y) * scale,
    }, viewportSize, true));
  }, [showLibraryPlan, libraryFocusRequest, viewportSize]);

  useEffect(() => {
    if (!viewportSize.width || !viewportSize.height) return;
    setView((current) => {
      const bounded = clampMapView(current, viewportSize, showLibraryPlan);
      return current.scale === bounded.scale && current.x === bounded.x && current.y === bounded.y ? current : bounded;
    });
  }, [viewportSize, showLibraryPlan]);

  const stopLocationWatch = useCallback(() => {
    if (locationWatch.current !== null) navigator.geolocation?.clearWatch(locationWatch.current);
    locationWatch.current = null;
    centeredOnLocation.current = false;
  }, []);

  const changeZoom = (factor: number) => setView((current) => clampMapView({
    ...current,
    scale: Math.min(maximumMapScale(viewportSize, showLibraryPlan), Math.max(CAMPUS_MAP_ZOOM_LIMITS.minScale, current.scale * factor)),
  }, viewportSize, showLibraryPlan));
  const resetMap = () => setView(clampMapView({ scale: CAMPUS_MAP_ZOOM_LIMITS.minScale, x: 0, y: 0 }, viewportSize, showLibraryPlan));

  const onMapPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("button")) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
  };

  const onMapPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const previous = pointers.current.get(event.pointerId);
    if (!previous) return;
    const priorPoints = [...pointers.current.values()];
    const currentPoint = { x: event.clientX, y: event.clientY };
    pointers.current.set(event.pointerId, currentPoint);
    const currentPoints = [...pointers.current.values()];
    if (priorPoints.length === 1) {
      setView((current) => clampMapView({
        ...current,
        x: current.x + currentPoint.x - previous.x,
        y: current.y + currentPoint.y - previous.y,
      }, viewportSize, showLibraryPlan));
      return;
    }
    if (priorPoints.length >= 2) {
      const [oldA, oldB] = priorPoints;
      const [newA, newB] = currentPoints;
      const oldDistance = Math.hypot(oldA.x - oldB.x, oldA.y - oldB.y);
      const newDistance = Math.hypot(newA.x - newB.x, newA.y - newB.y);
      if (!oldDistance) return;
      const ratio = newDistance / oldDistance;
      const oldCenter = { x: (oldA.x + oldB.x) / 2, y: (oldA.y + oldB.y) / 2 };
      const newCenter = { x: (newA.x + newB.x) / 2, y: (newA.y + newB.y) / 2 };
      setView((current) => {
        const scale = Math.min(maximumMapScale(viewportSize, showLibraryPlan), Math.max(CAMPUS_MAP_ZOOM_LIMITS.minScale, current.scale * ratio));
        const boundedRatio = scale / current.scale;
        const center = { x: viewportSize.width / 2, y: viewportSize.height / 2 };
        return clampMapView({
          scale,
          x: newCenter.x - center.x - (oldCenter.x - center.x - current.x) * boundedRatio,
          y: newCenter.y - center.y - (oldCenter.y - center.y - current.y) * boundedRatio,
        }, viewportSize, showLibraryPlan);
      });
    }
  };

  const onMapPointerUp = (event: React.PointerEvent<HTMLDivElement>) => pointers.current.delete(event.pointerId);

  const showPosition = useCallback((position: Coordinates) => {
    const point = coordinatesToPoint(position);
    setUserPoint(point);
    if (!centeredOnLocation.current) {
      const insideIllustration = point.x >= 0 && point.x <= CAMPUS_MAP_ARTWORK_SIZE.width && point.y >= 0 && point.y <= CAMPUS_MAP_ARTWORK_SIZE.height;
      if (insideIllustration && viewportSize.width && viewportSize.height) {
        const viewportPoint = artworkPointToViewport(point, viewportSize);
        setView((current) => clampMapView({
          ...current,
          x: -(viewportPoint.x - viewportSize.width / 2) * current.scale,
          y: viewportSize.height * (0.38 - 0.5) - (viewportPoint.y - viewportSize.height / 2) * current.scale,
        }, viewportSize, showLibraryPlan));
      }
      centeredOnLocation.current = true;
    }
  }, [showLibraryPlan, viewportSize]);

  const simulateLocation = () => {
    stopLocationWatch();
    setUserPoint(CAMPUS_MAP_DEMO_LOCATION);
    setLocationState("demo");
    setLocationMessage("Demo location shown near Thompson Library.");
    setView((current) => clampMapView({ ...current, x: 0, y: 0 }, viewportSize, showLibraryPlan));
  };

  const requestLocation = () => {
    setShowDisclosure(false);
    setLocationMessage("");
    centeredOnLocation.current = false;
    if (!navigator.geolocation) {
      setLocationState("error");
      setLocationMessage("This browser does not support device location.");
      return;
    }
    setLocationState("locating");
    locationWatch.current = navigator.geolocation.watchPosition(
      ({ coords }) => {
        const point = coordinatesToPoint({ lat: coords.latitude, lng: coords.longitude });
        setLocationState("live");
        setLocationMessage(point.x < 0 || point.x > CAMPUS_MAP_ARTWORK_SIZE.width || point.y < 0 || point.y > CAMPUS_MAP_ARTWORK_SIZE.height
          ? "Your location is outside this illustrated campus view. It stays on this device."
          : "Your approximate position is shown on this device.");
        showPosition({ lat: coords.latitude, lng: coords.longitude });
      },
      (error) => {
        stopLocationWatch();
        setLocationState("error");
        setLocationMessage(error.code === error.PERMISSION_DENIED
          ? "Location access was declined. You can allow it in your browser settings and try again."
          : "Your device location is unavailable right now. Try again in a moment.");
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 },
    );
  };

  const mapSize = viewportSize.width > 0 && viewportSize.height > 0
    ? viewportSize
    : { width: CAMPUS_MAP_ARTWORK_SIZE.width, height: CAMPUS_MAP_ARTWORK_SIZE.height };
  const viewBox = {
    x: mapSize.width / 2 - (mapSize.width / 2 + view.x) / view.scale,
    y: mapSize.height / 2 - (mapSize.height / 2 + view.y) / view.scale,
    width: mapSize.width / view.scale,
    height: mapSize.height / view.scale,
  };
  const planGeometry = getPlanGeometry(mapSize);
  const markerStyle = (worldPoint: Point) => {
    const screenPoint = mapPointToScreen(artworkPointToViewport(worldPoint, mapSize), view, mapSize);
    return { left: `${Math.round(screenPoint.x)}px`, top: `${Math.round(screenPoint.y)}px` };
  };
  const planMarkerStyle = (position: { x: number; y: number }) => {
    const screenPoint = planPointToScreen(position, view, mapSize);
    return { left: `${Math.round(screenPoint.x)}px`, top: `${Math.round(screenPoint.y)}px` };
  };
  const maxScale = maximumMapScale(mapSize, showLibraryPlan);

  return (
    <div className="integrated-campus-map" aria-label="Illustrated Ohio State campus map with Thompson Library">
      <div
        className="integrated-map-viewport"
        ref={viewportRef}
        role="region"
        aria-label="Interactive campus map. Drag to pan, pinch or double tap to zoom."
        onPointerDown={onMapPointerDown}
        onPointerMove={onMapPointerMove}
        onPointerUp={onMapPointerUp}
        onPointerCancel={onMapPointerUp}
        onDoubleClick={(event) => { event.preventDefault(); changeZoom(1.45); }}
        onWheel={(event) => { event.preventDefault(); changeZoom(event.deltaY < 0 ? 1.1 : 0.9); }}
      >
        <svg
          className="integrated-map-surface"
          viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
          preserveAspectRatio="none"
          role="img"
          aria-label="Illustrated Ohio State campus map with Thompson Library"
        >
          <svg className="integrated-map-art" x="0" y="0" width={mapSize.width} height={mapSize.height} viewBox={`0 0 ${CAMPUS_MAP_ARTWORK_SIZE.width} ${CAMPUS_MAP_ARTWORK_SIZE.height}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <rect width={CAMPUS_MAP_ARTWORK_SIZE.width} height={CAMPUS_MAP_ARTWORK_SIZE.height} fill="#edf0e8" />
            <path d="M0 210 73 193 97 238 49 289 0 276Z M0 484 51 460 90 503 72 564 0 579Z M338 346 430 315 430 413 367 438 326 401Z M0 724 61 694 109 741 73 807 0 798Z M341 837 430 802 430 940 337 940Z" fill="#dce8d4" />
            <path d="M31 0V940 M396 0V940 M0 176H430 M0 835H430 M153 176C157 246 182 293 215 347S252 426 241 487M303 350C277 412 278 476 306 533S337 631 315 714" fill="none" stroke="#fff" strokeWidth="18" />
            <path d="M31 0V940 M396 0V940 M0 176H430 M0 835H430 M153 176C157 246 182 293 215 347S252 426 241 487M303 350C277 412 278 476 306 533S337 631 315 714" fill="none" stroke="#dce1d8" strokeWidth="1.4" />
            <path d="M115 338C151 312 209 311 245 331 263 342 270 366 256 386 239 409 194 418 158 404 124 391 99 364 115 338Z" fill="#dbe8d2" />
            <path d="M217 472c10-15 19-18 29-10l13 15-5 21-19 8-18-11Z" fill="#cfe1dc" />
            <path d="M267 357 306 365 311 405 298 430 260 425 250 397Z" fill="#e6e0d4" stroke="#d5d0c6" strokeWidth="1.5" />
            {CAMPUS_MAP_BUILDINGS.map((building, index) => <g key={index} transform={`rotate(${building.turn} ${building.x + building.w / 2} ${building.y + building.h / 2})`}>
              <rect x={building.x} y={building.y + 3} width={building.w} height={building.h} rx="3" fill="#d6d3ca" opacity=".55" />
              <rect x={building.x} y={building.y} width={building.w} height={building.h} rx="3" fill={index % 3 === 0 ? "#e4e0d6" : "#e9e6dd"} stroke="#d5d1c8" strokeWidth="1.4" />
              <path d={`M${building.x + 7} ${building.y + 6}h${Math.round(building.w * .47)}v${Math.round(building.h * .42)}h-${Math.round(building.w * .47)}Z`} fill="#eeece5" opacity=".8" />
              <path d={`M${building.x + building.w - 3} ${building.y + 7}v${building.h - 14}`} stroke="#d0ccc2" strokeWidth="1" />
            </g>)}
            <path d="M77 125 151 121 161 169 120 181 76 160Z" fill="#d6d2c8" stroke="#c9c4ba" strokeWidth="2" />
            <path d="m80 128 34 0v43l-35-11ZM116 128h32l8 36-40 7Z" fill="#ece9e0" />
            <text x="116" y="112" className="campus-label campus-label-major" textAnchor="middle">OHIO STADIUM</text>
            <text x="407" y="235" className="campus-label campus-label-road" textAnchor="middle" transform="rotate(-90 407 235)">HIGH STREET</text>
            <text x="407" y="703" className="campus-label campus-label-road" textAnchor="middle" transform="rotate(-90 407 703)">HIGH STREET</text>
            <text x="73" y="59" className="campus-label campus-label-road" textAnchor="middle">17TH AVE</text>
            <text x="77" y="275" className="campus-label campus-label-muted" textAnchor="middle">KNOWLTON</text>
            <text x="195" y="372" className="campus-label campus-label-muted" textAnchor="middle">THE OVAL</text>
            <text x="247" y="533" className="campus-label campus-label-water" textAnchor="middle">MIRROR LAKE</text>
            <text x="122" y="550" className="campus-label campus-label-muted" textAnchor="middle">18TH AVENUE LIBRARY</text>
            <text x="334" y="737" className="campus-label campus-label-muted" textAnchor="middle">RPAC</text>
            <text x="278" y="313" className="campus-label campus-label-muted" textAnchor="middle">OHIO UNION</text>
            <text x="308" y="619" className="campus-label campus-label-muted" textAnchor="middle">STUDENT ACTIVITIES</text>
            <text x="20" y="865" className="campus-label campus-label-road" textAnchor="middle" transform="rotate(-90 20 865)">CAMPUS</text>
            <text x="356" y="890" className="campus-label campus-label-muted" textAnchor="middle">SOUTH CAMPUS</text>
            <circle cx="278" cy="410" r="31" fill="#4b786047" />
            <path d="M267 390h24l9 13-5 31-16 11-17-12-5-27Z" fill="#b9aa8e" stroke="#fff" strokeWidth="3" />
            <path d="m267 394 18-2-5 13-17 2Z" fill="#d6cab2" />
            <path d="M263 414h29M266 420h25M270 426h17" stroke="#a7977c" strokeWidth="2" />
            <circle cx="280" cy="451" r="3" fill="#a51c30" />
            <text x="280" y="456" className="campus-label campus-label-library" textAnchor="middle">THOMPSON</text>
          </svg>
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
          {!showLibraryPlan && CAMPUS_MAP_LANDMARKS.filter((landmark) => landmark.name === "Thompson Library").map((landmark) => (
            <button
              key={landmark.name}
              type="button"
              className="integrated-library-marker"
              style={markerStyle(landmark)}
              onClick={onOpenFloorPlan}
              aria-label="Open Thompson Library floor plan"
            >
              <span className="integrated-marker-icon"><BookOpen size={15} /></span><span>Thompson Library</span>
            </button>
          ))}
          {showLibraryPlan && visibleGroups.map((group) => (
            <button
              key={group.id}
              type="button"
              className={`study-group-pin embedded-group-pin${selectedGroupId === group.id ? " selected" : ""}`}
              style={planMarkerStyle(group)}
              onClick={(event) => onSelectGroup(group, event.currentTarget)}
              aria-label={`${group.name}, studying ${group.courseCode}, at ${group.tableLabel}`}
              title={`${group.name} · ${group.courseCode} · ${group.tableLabel}`}
            >
              <span className="study-group-pin-icon"><Users size={16} /></span>
              <span className="study-group-pin-label">{group.tableLabel}</span>
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
          {userPoint && <span
            className={`integrated-user-location${locationState === "demo" ? " is-demo" : ""}`}
            style={markerStyle(userPoint)}
            aria-label={locationState === "demo" ? "Simulated location" : "Approximate device location"}
          />}
        </div>
      </div>

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
          <button type="button" aria-label="Zoom in" disabled={view.scale >= maxScale} onClick={() => changeZoom(1.25)}><Plus size={18} /></button>
          <button type="button" aria-label="Zoom out" disabled={view.scale <= CAMPUS_MAP_ZOOM_LIMITS.minScale} onClick={() => changeZoom(.8)}><Minus size={18} /></button>
        </div>
        <button type="button" className="integrated-recenter" aria-label="Recenter campus map" onClick={resetMap}><LocateFixed size={17} /></button>
        <button type="button" className="integrated-demo-location" onClick={simulateLocation}>Simulate location</button>
      </div>

      {locationMessage && <div className={`integrated-location-status status-${locationState}`} role="status"><span />{locationMessage}</div>}
      <div className="integrated-map-note">Illustrated campus map · locations are approximate</div>

      {showDisclosure && createPortal(<div className="location-disclosure-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowDisclosure(false); }}>
        <section className="location-disclosure" role="dialog" aria-modal="true" aria-labelledby="location-disclosure-title">
          <button className="location-disclosure-close" type="button" aria-label="Close location information" onClick={() => setShowDisclosure(false)}><X size={18} /></button>
          <span className="location-disclosure-icon"><Crosshair size={23} /></span>
          <h2 id="location-disclosure-title">Show your location?</h2>
          <p>Your browser will ask for location access. Your approximate position appears on this campus illustration and stays on this device. Buckeye Sprouts does not save your coordinates.</p>
          <button className="location-disclosure-confirm" type="button" onClick={requestLocation}>Continue</button>
          <button className="location-disclosure-cancel" type="button" onClick={() => setShowDisclosure(false)}>Not now</button>
        </section>
      </div>, document.body)}
    </div>
  );
}
