"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent, ReactNode } from "react";
import { BookOpen, MapPin, Plus, Search, Star, Users, X } from "lucide-react";
import {
  MOCK_NOTEBOOKS,
  MOCK_PROFILES,
  MOCK_THOMPSON_TABLE_GROUPS,
  THOMPSON_EAST_ENTRANCE_TABLES,
  type ProfilePreview,
  type SessionPreview,
  type SharedNotebook,
  type ThompsonTable,
} from "@/types/contracts";
import { GroupJoinManager } from "@/features/location-checkin/components/GroupJoinManager";
import { NotebookPanel } from "@/features/notebook-ai/components/NotebookPanel";
import { CarmenAiChatbot } from "@/features/notebook-ai/components/CarmenAiChatbot";
import { MOCK_CARMEN_STUDENTS } from "@/features/notebook-ai/mock-carmen-data";
import { IntegratedCampusMap } from "./IntegratedCampusMap";

type MapTab = "groups" | "join" | "notes" | "me";

export function ThompsonMap({
  sessions: _sessions,
  profile,
  profilePanel,
  locationPanel,
}: {
  sessions: SessionPreview[];
  profile: ProfilePreview | null;
  profilePanel: ReactNode;
  locationPanel: ReactNode;
}) {
  const [tab, setTab] = useState<MapTab>("groups");
  const [expanded, setExpanded] = useState(false);
  const [groupSheetHidden, setGroupSheetHidden] = useState(false);
  const [groupQuery, setGroupQuery] = useState("");
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [libraryFocusRequest, setLibraryFocusRequest] = useState(0);
  const [joinStage, setJoinStage] = useState("idle");
  const [carmenOpen, setCarmenOpen] = useState(false);
  const [notebookContent, setNotebookContent] = useState(MOCK_NOTEBOOKS[0]?.content ?? "");
  const sheetStart = useRef<number | null>(null);
  const tabBarStart = useRef<{ pointerId: number; y: number } | null>(null);
  const sheetDragged = useRef(false);
  const tabBarDragged = useRef(false);
  const tableCloseButton = useRef<HTMLButtonElement>(null);
  const tableTrigger = useRef<HTMLElement | null>(null);

  const visibleGroups = useMemo(() => {
    const normalizedQuery = groupQuery.trim().toLocaleLowerCase();
    return THOMPSON_EAST_ENTRANCE_TABLES
      .filter((table) => table.showInSearch && table.groupId)
      .flatMap((table) => {
        const group = MOCK_THOMPSON_TABLE_GROUPS.find((item) => item.id === table.groupId);
        return group ? [{ table, group }] : [];
      })
      .filter(({ group }) => !normalizedQuery || group.courseCode.toLocaleLowerCase().includes(normalizedQuery));
  }, [groupQuery]);
  const selectedTable = THOMPSON_EAST_ENTRANCE_TABLES.find((table) => table.id === selectedTableId) ?? null;
  const selectedGroup = selectedTable?.groupId
    ? MOCK_THOMPSON_TABLE_GROUPS.find((group) => group.id === selectedTable.groupId) ?? null
    : null;
  const currentNotebook: SharedNotebook = {
    sessionId: "local-current-group",
    content: notebookContent,
    lastUpdatedBy: profile?.id ?? MOCK_PROFILES[0].id,
    aiSummary: "A local catch-up is generated from this group’s current shared notes.",
    aiSuggestions: ["Review the next concept together."],
    updatedAt: new Date(0).toISOString(),
  };
  const currentStudent = MOCK_CARMEN_STUDENTS[profile?.id ?? MOCK_PROFILES[0].id]
    ?? MOCK_CARMEN_STUDENTS[MOCK_PROFILES[0].id];

  useEffect(() => {
    const expandNotesForNewNote = () => {
      if (tab === "notes") setExpanded(true);
    };
    window.addEventListener("buckeye:open-new-note", expandNotesForNewNote);
    return () => window.removeEventListener("buckeye:open-new-note", expandNotesForNewNote);
  }, [tab]);

  useEffect(() => {
    if (!selectedTable) return;
    tableCloseButton.current?.focus();
    const opener = tableTrigger.current;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedTableId(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.removeEventListener("keydown", closeOnEscape);
      opener?.focus();
    };
  }, [selectedTable]);

  const openGroupSearch = () => {
    if (tab === "groups" && !groupSheetHidden) {
      setGroupSheetHidden(true);
      setExpanded(false);
      return;
    }
    setTab("groups");
    setExpanded(false);
    setGroupSheetHidden(false);
  };

  const openTable = (table: ThompsonTable, trigger: HTMLElement) => {
    tableTrigger.current = trigger;
    setSelectedTableId(table.id);
  };

  const selectTab = (nextTab: MapTab) => {
    setTab(nextTab);
    setGroupSheetHidden(false);
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
      if (delta < -35) {
        setGroupSheetHidden(false);
        setExpanded(true);
        sheetDragged.current = true;
      }
      if (delta > 35) {
        if (tab === "groups") setGroupSheetHidden(true);
        else setExpanded(false);
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
    if (delta < -35) {
      setGroupSheetHidden(false);
      setExpanded(true);
      tabBarDragged.current = true;
    } else if (delta > 35) {
      if (tab === "groups") setGroupSheetHidden(true);
      else setExpanded(false);
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
        onOpenFloorPlan={() => setLibraryFocusRequest((request) => request + 1)}
        showLibraryPlan
        libraryFocusRequest={libraryFocusRequest}
        visibleTables={THOMPSON_EAST_ENTRANCE_TABLES}
        visibleSpots={[]}
        selectedSpot={null}
        showRoute={false}
        selectedTableId={selectedTableId}
        onSelectTable={openTable}
        onSelectSpot={() => undefined}
      />

      <section className={`map-info-sheet${expanded ? " sheet-expanded" : ""}${tab === "groups" ? " group-search-sheet" : ""}${tab === "join" && joinStage === "current" ? " current-group-sheet" : ""}${groupSheetHidden && tab === "groups" ? " group-sheet-hidden" : ""}`} aria-label={tab === "groups" ? "Study group search" : tab === "join" ? "Join or manage a study group" : tab === "notes" ? "Shared notebook" : "Your study profile"}>
        <button type="button" className="sheet-swipe-handle" onPointerDown={beginSheetSwipe} onPointerUp={endSheetSwipe} onPointerCancel={endSheetSwipe} aria-label={expanded ? "Collapse panel" : "Expand panel"} onClick={() => { if (sheetDragged.current) { sheetDragged.current = false; return; } setExpanded((value) => !value); }}>
          <span />
        </button>
        <div className="sheet-heading">
          <div className="min-w-0 flex-1 pr-1.5">
            <p className="sheet-eyebrow">OHIO STATE · THOMPSON LIBRARY · LEVEL 1</p>
            <h1 className="truncate">{tab === "groups" ? "Group Search" : tab === "join" ? "Your Group" : tab === "notes" ? "Shared Notes" : "Your Study Profile"}</h1>
          </div>
          {tab === "join" && joinStage === "current" && (
            <button type="button" className="group-carmen-trigger" onClick={() => setCarmenOpen(true)} aria-label="Open Carmen study suggestions" title="Carmen study suggestions">
              <Star size={18} className="fill-amber-300" />
            </button>
          )}
          {tab === "notes" && <button type="button" className="notes-new-button" onClick={() => { setExpanded(true); window.dispatchEvent(new CustomEvent("buckeye:open-new-note")); }} aria-label="Create a new group note" title="New note"><Plus size={18} /></button>}
        </div>
        <div className="map-sheet-content">
          {tab === "groups" && <>
            <label className="map-search group-search-field"><Search size={18} /><input value={groupQuery} onChange={(event) => setGroupQuery(event.target.value)} placeholder="Search by course number (e.g., CSE 2221)" aria-label="Search study groups by course number" /></label>
            <div className="map-group-list" role="list" aria-label="Study groups on Thompson Library Level 1">
              {visibleGroups.map(({ table, group }) => <button className="map-group-row" type="button" key={group.id} onClick={(event) => openTable(table, event.currentTarget)}>
                <span className="group-icon"><Users size={19} /></span><span className="group-row-copy"><strong>{group.name}</strong><small>{group.courseCode} · {group.topic}</small></span><span className="group-table-label"><MapPin size={13} />{table.label}</span>
              </button>)}
            </div>
            {visibleGroups.length === 0 && <p className="map-hint group-no-results">No study groups match “{groupQuery}”. Try a course number such as CSE 2221 or MATH 1151.</p>}
          </>}
          <div hidden={tab !== "join"}>
            <GroupJoinManager currentUserId={profile?.id} currentUserName={profile?.name || "Alex Morgan"} notebookContent={notebookContent} onNotebookContentChange={setNotebookContent} onStageChange={(stage) => { setJoinStage(stage); if (stage === "existing" || stage === "create") setExpanded(true); if (stage === "current") setExpanded(false); }} />
          </div>
          {tab === "notes" && <div className="map-feature-panel"><NotebookPanel notebook={currentNotebook} sessionId={currentNotebook.sessionId} courseCode="CSE 2221" onStartNewNote={() => setExpanded(true)} onNotebookContentChange={setNotebookContent} /></div>}
          {tab === "me" && <div className="map-feature-panel">{profile ? <><div className="map-user-greeting">Hi, {profile.name.split(" ")[0]}</div>{profilePanel}{locationPanel}</> : <p className="map-hint">Your study profile is not available.</p>}</div>}
        </div>
      </section>

      <nav className="map-service-tabs" aria-label="Map app navigation">
        <span className="map-tabs-grabber" aria-hidden="true" />
        <button className={tab === "groups" ? "active" : ""} type="button" onClick={openGroupSearch}><Users size={20} /><span>Groups</span></button>
        <button className={tab === "join" ? "active" : ""} type="button" onClick={() => selectTab("join")} aria-label="Join or manage a group"><Plus size={21} /><span>Group</span></button>
        <button className={tab === "notes" ? "active" : ""} type="button" onClick={() => selectTab("notes")}><BookOpen size={20} /><span>Notes</span></button>
        <button className={tab === "me" ? "active" : ""} type="button" onClick={() => selectTab("me")}><span className="service-avatar">{profile?.name.slice(0, 1) || "?"}</span><span>Me</span></button>
      </nav>

      {tab === "join" && joinStage === "current" && currentStudent && <CarmenAiChatbot studentProfile={currentStudent} courseCode="CSE 2221" notebookContent={notebookContent} isOpenExternal={carmenOpen} onToggleExternal={() => setCarmenOpen((open) => !open)} onInsertToNotebook={(text) => setNotebookContent((content) => `${content}\n\n${text}`.trim())} />}

      {selectedTable && <div className="group-info-backdrop" role="presentation" onClick={() => setSelectedTableId(null)}>
        <section className="group-info-dialog" role="dialog" aria-modal="true" aria-labelledby="group-info-title" aria-describedby="group-info-status" onClick={(event) => event.stopPropagation()}>
          <button ref={tableCloseButton} type="button" className="group-info-close" onClick={() => setSelectedTableId(null)} aria-label="Close table information"><X size={20} /></button>
          <div className="group-info-heading">
            <p className="group-info-eyebrow">{selectedTable.label} · {selectedTable.status === "empty" ? "EMPTY" : selectedTable.status === "very-busy" ? "VERY BUSY" : "BUSY"}</p>
            <h2 id="group-info-title">{selectedGroup ? selectedGroup.name : "Available table"}</h2>
            <p id="group-info-status">{selectedGroup ? `${selectedGroup.courseCode} · ${selectedGroup.topic}` : "No study group is at this table right now."}</p>
          </div>
          {selectedGroup && <ul className="group-profile-list" aria-label="Group host and members">
            <li className="group-profile-row"><ProfileAvatar profile={selectedGroup.host} /><span className="group-profile-name">{selectedGroup.host.name}</span><span className="group-profile-role">Host</span></li>
            {selectedGroup.members.map((member) => <li key={member.id} className="group-profile-row"><ProfileAvatar profile={member} /><span className="group-profile-name">{member.name}</span><span className="group-profile-role">Member</span></li>)}
          </ul>}
        </section>
      </div>}
    </div>
  );
}

function ProfileAvatar({ profile }: { profile: ProfilePreview }) {
  const initials = profile.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toLocaleUpperCase();
  return <span className="group-profile-avatar">{profile.avatarUrl ? <img src={profile.avatarUrl} alt="" /> : <span aria-hidden="true">{initials}</span>}</span>;
}
