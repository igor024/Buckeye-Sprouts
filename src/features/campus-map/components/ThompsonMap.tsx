"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent, ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, MapPin, Plus, Route, Search, Star, Users, X } from "lucide-react";
import {
  MOCK_STUDY_GROUP_PINS,
  THOMPSON_EAST_ENTRANCE_PLAN,
  type CampusMapSpot,
  type ProfilePreview,
  type SessionPreview,
} from "@/types/contracts";
import { IntegratedCampusMap } from "./IntegratedCampusMap";

type MapTab = "groups" | "places" | "notes" | "me";

export function ThompsonMap({
  sessions,
  profile,
  profilePanel,
  locationPanel,
  notebookPanel,
}: {
  sessions: SessionPreview[];
  profile: ProfilePreview | null;
  profilePanel: ReactNode;
  locationPanel: ReactNode;
  notebookPanel: ReactNode;
}) {
  const [tab, setTab] = useState<MapTab>(() => {
    if (typeof window !== "undefined") {
      const param = new URLSearchParams(window.location.search).get("tab");
      if (param === "notes" || param === "places" || param === "groups" || param === "me") return param;
    }
    return "groups";
  });
  const [expanded, setExpanded] = useState(() => {
    if (typeof window !== "undefined") {
      return new URLSearchParams(window.location.search).get("tab") === "notes";
    }
    return false;
  });
  const [floorPlanOpen, setFloorPlanOpen] = useState(true);
  const [groupSheetHidden, setGroupSheetHidden] = useState(false);
  const [query, setQuery] = useState("");
  const [groupQuery, setGroupQuery] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedSpot, setSelectedSpot] = useState<CampusMapSpot | null>(null);
  const [showRoute, setShowRoute] = useState(false);
  const [libraryFocusRequest, setLibraryFocusRequest] = useState(0);
  const sheetStart = useRef<number | null>(null);
  const tabBarStart = useRef<{ pointerId: number; y: number } | null>(null);
  const sheetDragged = useRef(false);
  const tabBarDragged = useRef(false);
  const groupCloseButton = useRef<HTMLButtonElement>(null);
  const groupTrigger = useRef<HTMLElement | null>(null);

  const visibleSpots = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return THOMPSON_EAST_ENTRANCE_PLAN.spots.filter((spot) =>
      !normalizedQuery || `${spot.label} ${spot.detail}`.toLocaleLowerCase().includes(normalizedQuery),
    );
  }, [query]);

  const visibleGroups = useMemo(() => {
    const normalizedQuery = groupQuery.trim().toLocaleLowerCase();
    return MOCK_STUDY_GROUP_PINS.filter((group) =>
      !normalizedQuery || group.courseCode.toLocaleLowerCase().includes(normalizedQuery),
    );
  }, [groupQuery]);
  const showLibraryPlan = tab === "groups" || (tab === "places" && floorPlanOpen);
  const groupsOnMap = tab === "groups" ? visibleGroups : [];
  const spotsOnMap = tab === "places" && floorPlanOpen ? visibleSpots : [];
  const selectedGroup = MOCK_STUDY_GROUP_PINS.find((group) => group.id === selectedGroupId) ?? null;

  useEffect(() => {
    if (typeof window !== "undefined") {
      const param = new URLSearchParams(window.location.search).get("tab");
      if (param === "notes") {
        setTab("notes");
        setExpanded(true);
        setGroupSheetHidden(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!selectedGroup) return;
    groupCloseButton.current?.focus();
    const opener = groupTrigger.current;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedGroupId(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.removeEventListener("keydown", closeOnEscape);
      opener?.focus();
    };
  }, [selectedGroup]);

  const openFloorPlan = () => {
    setTab("places");
    setFloorPlanOpen(true);
    setExpanded(true);
    setGroupSheetHidden(false);
  };

  const openGroupSearch = () => {
    if (tab === "groups" && !groupSheetHidden) {
      setGroupSheetHidden(true);
      setExpanded(false);
      return;
    }
    setTab("groups");
    setFloorPlanOpen(true);
    setLibraryFocusRequest((request) => request + 1);
    setExpanded(false);
    setGroupSheetHidden(false);
    setSelectedSpot(null);
    setShowRoute(false);
  };

  const openGroup = (groupId: string, trigger: HTMLElement) => {
    groupTrigger.current = trigger;
    setSelectedGroupId(groupId);
  };

  const selectSpot = (spot: CampusMapSpot) => {
    setSelectedSpot(spot);
    setFloorPlanOpen(true);
    setShowRoute(false);
    setTab("places");
    setExpanded(true);
    setGroupSheetHidden(false);
  };

  const closeFloorPlan = () => {
    setFloorPlanOpen(false);
    setSelectedSpot(null);
    setShowRoute(false);
    setExpanded(false);
  };

  const beginSheetSwipe = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    sheetDragged.current = false;
    sheetStart.current = event.clientY;
  };
  const endSheetSwipe = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (sheetStart.current !== null) {
      const delta = event.clientY - sheetStart.current;
      if (delta < -35) { setGroupSheetHidden(false); setExpanded(true); sheetDragged.current = true; }
      if (delta > 35) {
        if (tab === "groups") {
          setGroupSheetHidden(true);
        } else if (floorPlanOpen && delta > 100) {
          closeFloorPlan();
        }
        setExpanded(false);
        sheetDragged.current = true;
      }
    }
    sheetStart.current = null;
  };

  const beginTabBarGesture = (event: ReactPointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest(".map-service-tabs")) {
      tabBarStart.current = { pointerId: event.pointerId, y: event.clientY };
      tabBarDragged.current = false;
    }
  };
  const endTabBarGesture = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = tabBarStart.current;
    if (!start || start.pointerId !== event.pointerId) return;
    const delta = event.clientY - start.y;
    if (tab === "groups" && delta < -35) {
      setGroupSheetHidden(false);
      setExpanded(true);
      tabBarDragged.current = true;
    } else if (tab === "groups" && delta > 35) {
      setGroupSheetHidden(true);
      setExpanded(false);
      tabBarDragged.current = true;
    }
    tabBarStart.current = null;
  };
  const guardTabBarClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (!tabBarDragged.current) return;
    event.preventDefault();
    event.stopPropagation();
    tabBarDragged.current = false;
  };

  return (
    <div className="thompson-map-app" onPointerDownCapture={beginTabBarGesture} onPointerUpCapture={endTabBarGesture} onPointerCancelCapture={() => { tabBarStart.current = null; }} onClickCapture={guardTabBarClick}>
      <IntegratedCampusMap
        onOpenFloorPlan={openFloorPlan}
        showLibraryPlan={showLibraryPlan}
        libraryFocusRequest={libraryFocusRequest}
        visibleGroups={groupsOnMap}
        visibleSpots={spotsOnMap}
        selectedSpot={selectedSpot}
        showRoute={showRoute}
        selectedGroupId={selectedGroupId}
        onSelectGroup={(group, trigger) => openGroup(group.id, trigger)}
        onSelectSpot={selectSpot}
      />

      <header className="map-service-header">
        <Link href="/" className="map-back" aria-label="Buckeye Sprouts home"><ArrowLeft size={18} /></Link>
        <div className="map-service-title"><strong>Buckeye Sprouts</strong><span>Ohio State · Columbus campus</span></div>
        <span className="map-level-badge integrated-campus-badge">OSU</span>
      </header>

      {!showLibraryPlan && <button type="button" className="integrated-library-shortcut" onClick={openFloorPlan}>
        <BookOpen size={16} /><span>Thompson Library</span><span className="integrated-shortcut-detail">Floor plan</span>
      </button>}

      <section className={`map-info-sheet${expanded ? " sheet-expanded" : ""}${tab === "groups" ? " group-search-sheet" : ""}${groupSheetHidden && tab === "groups" ? " group-sheet-hidden" : ""}`} aria-label={tab === "groups" ? "Study group search and Thompson Library map" : "Campus places and navigation"}>
        <button type="button" className="sheet-swipe-handle" onPointerDown={beginSheetSwipe} onPointerUp={endSheetSwipe} onPointerCancel={endSheetSwipe} aria-label={expanded ? "Collapse map panel" : "Expand map panel"} onClick={() => { if (sheetDragged.current) { sheetDragged.current = false; return; } setExpanded((value) => !value); }}>
          <span />
        </button>
        <div className="sheet-heading">
          <div className="min-w-0 flex-1 pr-1.5"><p className="sheet-eyebrow">OHIO STATE · {showLibraryPlan ? "THOMPSON LIBRARY · LEVEL 1" : "CAMPUS MAP"}</p><h1 className="truncate">{tab === "places" ? (selectedSpot?.label || (floorPlanOpen ? "Thompson Library" : "Explore campus")) : tab === "groups" ? "Group Search" : tab === "notes" ? "Shared notebook" : "Your study profile"}</h1></div>
          {floorPlanOpen && tab === "places" && <button className="clear-selection" type="button" aria-label="Close library floor plan" onClick={closeFloorPlan}><X size={18} /></button>}
          {selectedSpot && tab === "places" && !floorPlanOpen && <button className="clear-selection" type="button" aria-label="Clear selected place" onClick={() => setSelectedSpot(null)}><X size={18} /></button>}
          {tab === "notes" && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent("buckeye:open-carmen-ai"))}
                aria-label="Open Carmen AI"
                title="Carmen AI Assistant"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-red-50 hover:bg-red-100 text-[#a51c30] border border-red-200/80 shadow-2xs transition-all active:scale-95 cursor-pointer"
              >
                <Star size={13} className="fill-amber-400 text-amber-500" />
                <span>Carmen AI</span>
              </button>
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent("buckeye:open-new-note"))}
                aria-label="New Note"
                title="New Note"
                className="w-8 h-8 rounded-full bg-[#2d4b3c] hover:bg-[#20392d] text-white flex items-center justify-center shadow-2xs transition-all active:scale-95 cursor-pointer"
              >
                <Plus size={18} strokeWidth={2.5} />
              </button>
            </div>
          )}
        </div>
        <div className="map-sheet-content">
          {tab === "groups" && <>
            <label className="map-search group-search-field"><Search size={18} /><input value={groupQuery} onChange={(event) => setGroupQuery(event.target.value)} placeholder="Search by course number (e.g., CSE 2221)" aria-label="Search study groups by course number" /></label>
            <div className="map-group-list" role="list" aria-label="Study groups on Thompson Library Level 1">
              {visibleGroups.map((group) => <button className="map-group-row" type="button" key={group.id} onClick={(event) => openGroup(group.id, event.currentTarget)}>
                <span className="group-icon"><Users size={19} /></span><span className="group-row-copy"><strong>{group.name}</strong><small>{group.courseCode} · {group.topic}</small></span><span className="group-table-label"><MapPin size={13} />{group.tableLabel}</span>
              </button>)}
            </div>
            {visibleGroups.length === 0 && <p className="map-hint group-no-results">No study groups match “{groupQuery}”. Try a course number such as CSE 2221 or MATH 1151.</p>}
          </>}
          {tab === "places" && <>
            <label className="map-search"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search Thompson rooms and spaces" aria-label="Search Thompson Library rooms" /></label>
            {selectedSpot && <div className="selected-place"><span className={`place-symbol place-${selectedSpot.kind}`}><MapPin size={19} /></span><div><strong>{selectedSpot.label}</strong><p>{selectedSpot.detail} · {THOMPSON_EAST_ENTRANCE_PLAN.level}{showRoute ? " · Approximate East Entrance route" : ""}</p></div><button type="button" className={showRoute ? "route-active" : ""} onClick={() => setShowRoute((active) => !active)} aria-label={showRoute ? "Hide illustrative route" : "Show approximate route from East Entrance"} title="Approximate route across the East Atrium"><Route size={17} /></button></div>}
            {!floorPlanOpen && <p className="map-hint">Pan around campus, or open Thompson Library to search its rooms and services.</p>}
            <div className="spot-list">{visibleSpots.slice(0, floorPlanOpen || query.trim() ? 24 : 6).map((spot) => <button key={spot.id} className="spot-row" type="button" onClick={() => selectSpot(spot)}><span className={`spot-dot dot-${spot.kind}`} /><span><strong>{spot.label}</strong><small>{spot.detail}</small></span><MapPin size={15} /></button>)}</div>
            {visibleSpots.length === 0 && <p className="map-hint">No Thompson rooms match “{query}”.</p>}
          </>}
          {tab === "notes" && <div className="map-feature-panel">{notebookPanel}</div>}
          {tab === "me" && <div className="map-feature-panel">{profile ? <><div className="map-user-greeting">Hi, {profile.name.split(" ")[0]}</div>{profilePanel}{locationPanel}</> : <p className="map-hint">Your study profile is not available.</p>}</div>}
        </div>
      </section>

      <nav className="map-service-tabs" aria-label="Map app navigation">
        <span className="map-tabs-grabber" aria-hidden="true" />
        <button className={tab === "groups" ? "active" : ""} type="button" onClick={openGroupSearch}><Users size={20} /><span>Groups</span></button>
        <button className={tab === "places" ? "active" : ""} type="button" onClick={() => { setTab("places"); setGroupSheetHidden(false); setExpanded(false); }}><MapPin size={20} /><span>Places</span></button>
        <button className={tab === "notes" ? "active" : ""} type="button" onClick={() => { setTab("notes"); setFloorPlanOpen(false); setGroupSheetHidden(false); setExpanded(false); }}><BookOpen size={20} /><span>Notes</span></button>
        <button className={tab === "me" ? "active" : ""} type="button" onClick={() => { setTab("me"); setFloorPlanOpen(false); setGroupSheetHidden(false); setExpanded(false); }}><span className="service-avatar">{profile?.name.slice(0, 1) || "?"}</span><span>Me</span></button>
      </nav>

      {selectedGroup && <div className="group-info-backdrop" role="presentation" onClick={() => setSelectedGroupId(null)}>
        <section className="group-info-dialog" role="dialog" aria-modal="true" aria-labelledby="group-info-title" aria-describedby="group-info-status" onClick={(event) => event.stopPropagation()}>
          <button ref={groupCloseButton} type="button" className="group-info-close" onClick={() => setSelectedGroupId(null)} aria-label="Close group information"><X size={20} /></button>
          <div className="group-info-heading"><p className="group-info-eyebrow">STUDY GROUP</p><h2 id="group-info-title">{selectedGroup.name}</h2><p id="group-info-status">{selectedGroup.courseCode} · {selectedGroup.topic}</p></div>
          <ul className="group-profile-list" aria-label="Group host and members">
            <li className="group-profile-row"><ProfileAvatar profile={selectedGroup.host} /><span className="group-profile-name">{selectedGroup.host.name}</span><span className="group-profile-role">Host</span></li>
            {selectedGroup.members.map((member) => <li key={member.id} className="group-profile-row"><ProfileAvatar profile={member} /><span className="group-profile-name">{member.name}</span><span className="group-profile-role">Member</span></li>)}
          </ul>
        </section>
      </div>}
    </div>
  );
}

function ProfileAvatar({ profile }: { profile: ProfilePreview }) {
  const initials = profile.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toLocaleUpperCase();
  return <span className="group-profile-avatar">{profile.avatarUrl ? <img src={profile.avatarUrl} alt="" /> : <span aria-hidden="true">{initials}</span>}</span>;
}
