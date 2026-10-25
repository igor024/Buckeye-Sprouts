"use client";

import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent, ReactNode } from "react";
import { BookOpen, MapPin, Plus, RotateCw, Search, Star, Users, X } from "lucide-react";
import {
  MOCK_NOTEBOOKS,
  MOCK_PROFILES,
  THOMPSON_EAST_ENTRANCE_TABLES,
  type ProfilePreview,
  type SessionPreview,
  type SharedNotebook,
  type ThompsonTable,
  type DemoReaderLocation,
  type DemoStudyGroup,
  type DemoCreateGroupInput,
} from "@/types/contracts";
import { CurrentGroupPanel, GroupJoinManager } from "@/features/location-checkin/components/GroupJoinManager";
import { createDemoGroupId, createDemoGroupState, demoGroupReducer } from "@/features/location-checkin/group-demo";
import { GroupRoster, ProfileAvatar } from "@/app/components/GroupRoster";
import { NotebookPanel } from "@/features/notebook-ai/components/NotebookPanel";
import { IntegratedCampusMap } from "@/features/campus-map/components/IntegratedCampusMap";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import {
  fetchGroupsDirectFromSupabase,
  saveNotebookToSupabase,
  endSessionInSupabase,
  createSessionInSupabase,
} from "@/lib/map-service";

type MapTab = "groups" | "join" | "notes" | "me";

export function ThompsonMap({
  sessions: _sessions,
  initialGroups = [],
  profile,
  profilePanel,
  locationPanel: _locationPanel,
}: {
  sessions: SessionPreview[];
  initialGroups?: DemoStudyGroup[];
  profile: ProfilePreview | null;
  profilePanel: ReactNode;
  locationPanel?: ReactNode;
}) {
  const [tab, setTab] = useState<MapTab>("groups");
  const [tabActivations, setTabActivations] = useState<Record<MapTab, number>>({ groups: 0, join: 0, notes: 0, me: 0 });
  const [expanded, setExpanded] = useState(false);
  const [groupSheetHidden, setGroupSheetHidden] = useState(false);
  const [groupQuery, setGroupQuery] = useState("");
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [closingTable, setClosingTable] = useState(false);
  const [libraryFocusRequest, setLibraryFocusRequest] = useState(0);
  const [groupState, dispatchGroup] = useReducer(
    demoGroupReducer,
    initialGroups,
    createDemoGroupState
  );
  const [readerLocation, setReaderLocation] = useState<DemoReaderLocation | null>(null);
  const activeGroup = groupState.groups.find((group) => group.id === groupState.activeGroupId) ?? null;
  const viewer: ProfilePreview = profile ?? MOCK_PROFILES[0];
  const tables: ThompsonTable[] = useMemo(() => {
    return THOMPSON_EAST_ENTRANCE_TABLES.map((table) => {
      const group = groupState.groups.find((item) => item.tableId === table.id);
      return {
        ...table,
        groupId: group ? group.id : undefined,
        status: group
          ? (group.inviteOnly || (group.members && group.members.length >= 3) ? "very-busy" : "busy")
          : "empty",
        showInSearch: Boolean(group),
      };
    });
  }, [groupState.groups]);
  const [draftNotebookContent, setDraftNotebookContent] = useState(MOCK_NOTEBOOKS[0]?.content ?? "");
  const notebookContent = activeGroup?.notebookContent ?? draftNotebookContent;

  const setNotebookContent = (content: string) => {
    if (activeGroup) {
      dispatchGroup({ type: "notebook", content });
      saveNotebookToSupabase(activeGroup.id, content, viewer.id);
    } else {
      setDraftNotebookContent(content);
    }
  };

  const showSheet = tab !== "join" || activeGroup !== null;
  const sheetStart = useRef<number | null>(null);
  const tabBarStart = useRef<{ pointerId: number; y: number } | null>(null);
  const sheetDragged = useRef(false);
  const tabBarDragged = useRef(false);
  const tableCloseButton = useRef<HTMLButtonElement>(null);
  const tableTrigger = useRef<HTMLElement | null>(null);
  const tableCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshNotice, setRefreshNotice] = useState<string | null>(null);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refreshDatabaseData = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      let live = await fetchGroupsDirectFromSupabase();
      if (!live || live.length === 0) {
        const res = await fetch("/api/map/groups");
        if (res.ok) {
          const data = await res.json();
          if (data.groups) live = data.groups;
        }
      }
      if (live) {
        dispatchGroup({ type: "sync-from-db", groups: live });
        setRefreshNotice(`Refreshed ${live.length} study groups from database`);
      } else {
        setRefreshNotice("Synced with database");
      }
    } catch (err) {
      console.warn("Refresh failed:", err);
      setRefreshNotice("Unable to refresh database data");
    } finally {
      setIsRefreshing(false);
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      refreshTimer.current = setTimeout(() => {
        setRefreshNotice(null);
      }, 2500);
    }
  };

  useEffect(() => () => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
  }, []);

  // Directly query Supabase from the browser and subscribe to realtime table updates
  useEffect(() => {
    fetchGroupsDirectFromSupabase().then((live) => {
      if (live) {
        dispatchGroup({ type: "sync-from-db", groups: live });
      }
    });

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const channel = supabase
      .channel("supabase-realtime-thompson-map")
      .on("postgres_changes", { event: "*", schema: "public", table: "study_sessions" }, () => {
        fetchGroupsDirectFromSupabase().then((live) => {
          if (live) dispatchGroup({ type: "sync-from-db", groups: live });
        });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "session_private_details" }, () => {
        fetchGroupsDirectFromSupabase().then((live) => {
          if (live) dispatchGroup({ type: "sync-from-db", groups: live });
        });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "shared_notebooks" }, () => {
        fetchGroupsDirectFromSupabase().then((live) => {
          if (live) dispatchGroup({ type: "sync-from-db", groups: live });
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const closeTable = () => {
    if (tableCloseTimer.current !== null) return;
    setClosingTable(true);
    const delay = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 160;
    tableCloseTimer.current = setTimeout(() => {
      setSelectedTableId(null);
      setClosingTable(false);
      tableCloseTimer.current = null;
    }, delay);
  };

  useEffect(() => () => {
    if (tableCloseTimer.current !== null) clearTimeout(tableCloseTimer.current);
  }, []);

  const visibleGroups = useMemo(() => {
    const normalizedQuery = groupQuery.trim().toLocaleLowerCase();
    return groupState.groups
      .filter((group) => {
        if (!normalizedQuery) return true;
        return (
          group.courseCode.toLocaleLowerCase().includes(normalizedQuery) ||
          group.name.toLocaleLowerCase().includes(normalizedQuery) ||
          group.topic.toLocaleLowerCase().includes(normalizedQuery)
        );
      })
      .map((group) => {
        const table = tables.find((t) => t.id === group.tableId) ?? {
          id: group.tableId,
          label: `Table ${group.tableId}`,
          status: "busy" as const,
          x: 50,
          y: 50,
          width: 5,
          height: 5,
          groupId: group.id,
          showInSearch: true,
        };
        return { table, group };
      });
  }, [groupQuery, tables, groupState.groups]);

  const selectedTable = tables.find((table) => table.id === selectedTableId) ?? null;
  const selectedGroup = selectedTable?.groupId
    ? groupState.groups.find((group) => group.id === selectedTable.groupId) ?? null
    : null;

  const currentNotebook: SharedNotebook = {
    sessionId: activeGroup?.id ?? "local-draft-notebook",
    content: notebookContent,
    lastUpdatedBy: profile?.id ?? MOCK_PROFILES[0].id,
    aiSummary: "A local catch-up is generated from this group’s current shared notes.",
    aiSuggestions: ["Review the next concept together."],
    updatedAt: new Date(0).toISOString(),
  };

  useEffect(() => {
    const expandNotesForNewNote = () => {
      if (tab === "notes") setExpanded(true);
    };
    window.addEventListener("buckeye:open-new-note", expandNotesForNewNote);
    return () => window.removeEventListener("buckeye:open-new-note", expandNotesForNewNote);
  }, [tab]);

  useEffect(() => { setExpanded(false); }, [activeGroup?.id]);

  useEffect(() => {
    if (!selectedTable) return;
    tableCloseButton.current?.focus();
    const opener = tableTrigger.current;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeTable();
      if (event.key === "Tab") {
        const controls = document.querySelectorAll<HTMLElement>('.group-info-dialog button, .group-info-dialog [tabindex="0"]');
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
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

  const activateTab = (nextTab: MapTab) => {
    setTabActivations((counts) => ({ ...counts, [nextTab]: counts[nextTab] + 1 }));
    if (nextTab === "groups") openGroupSearch();
    else selectTab(nextTab);
  };

  const tabIcon = (iconTab: MapTab, icon: ReactNode) => (
    <span key={tabActivations[iconTab]} className={`map-tab-icon${tabActivations[iconTab] > 0 ? " is-bouncing" : ""}`} aria-hidden="true">{icon}</span>
  );

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
    if (!showSheet) { tabBarStart.current = null; return; }
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
        visibleTables={groupQuery.trim() && tab === "groups" ? tables.filter((table) => {
          const group = groupState.groups.find((item) => item.id === table.groupId);
          return group?.courseCode.toLowerCase().includes(groupQuery.trim().toLowerCase());
        }) : tables}
        visibleSpots={[]}
        selectedSpot={null}
        showRoute={false}
        selectedTableId={selectedTableId}
        onSelectTable={openTable}
        onSelectSpot={() => undefined}
        onReaderLocationChange={setReaderLocation}
        onRefresh={refreshDatabaseData}
        isRefreshing={isRefreshing}
      />

      {refreshNotice && (
        <div className="integrated-refresh-status" role="status" aria-live="polite">
          <RotateCw size={13} className="text-emerald-700" />
          <span>{refreshNotice}</span>
        </div>
      )}

      {showSheet && <section id="map-info-sheet" inert={groupSheetHidden && tab === "groups"} className={`map-info-sheet${expanded ? " sheet-expanded" : ""}${tab === "groups" ? " group-search-sheet" : ""}${tab === "join" && activeGroup ? " current-group-sheet" : ""}${tab === "notes" ? " notes-sheet" : ""}${groupSheetHidden && tab === "groups" ? " group-sheet-hidden" : ""}`} aria-label={tab === "groups" ? "Study group search" : tab === "join" ? "Join or manage a study group" : tab === "notes" ? "Shared notebook" : "Your study profile"}>
        <button type="button" className="sheet-swipe-handle" onPointerDown={beginSheetSwipe} onPointerUp={endSheetSwipe} onPointerCancel={() => { sheetStart.current = null; }} aria-expanded={expanded} aria-controls="map-sheet-content" aria-label={expanded ? "Collapse panel" : "Expand panel"} onClick={() => { if (sheetDragged.current) { sheetDragged.current = false; return; } setExpanded((value) => !value); }}>
          <span />
        </button>
        <div className="sheet-heading">
          <div className="min-w-0 flex-1 pr-1.5">
            <div className="sheet-brand-line"><img className="sheet-brand-logo" src="/brand/logo.png" width="28" height="28" alt="Buckeye Sprouts logo" /><p className="sheet-eyebrow">OHIO STATE · THOMPSON LIBRARY · LEVEL 1</p></div>
            <h1 className="paper-title truncate">{tab === "groups" ? "Group Search" : tab === "join" ? "Your Group" : tab === "notes" ? "Shared Notes" : "Your Study Profile"}</h1>
          </div>
          <div className="sheet-header-actions">
            <button
              type="button"
              className={`sheet-refresh-button${isRefreshing ? " is-refreshing" : ""}`}
              onClick={refreshDatabaseData}
              disabled={isRefreshing}
              title="Refresh table colors & groups from database"
              aria-label="Refresh table colors and group details from database"
            >
              <RotateCw size={14} className={isRefreshing ? "animate-spin" : ""} />
              <span>{isRefreshing ? "Updating…" : "Refresh"}</span>
            </button>
            {tab === "join" && activeGroup && <button
                type="button"
                className="group-leave-button"
                onClick={() => {
                  if (activeGroup) {
                    fetch("/api/map/groups", {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ action: "leave", sessionId: activeGroup.id, profileId: viewer.id, tableId: activeGroup.tableId }),
                    })
                      .then((r) => r.json())
                      .then((data) => {
                        if (data?.groups) dispatchGroup({ type: "sync-from-db", groups: data.groups });
                      })
                      .catch(() => {});
                  }
                  dispatchGroup({ type: "leave", profileId: viewer.id });
                }}
              >
                Leave group
              </button>}
            {tab === "notes" && <>
              <button type="button" className="notes-carmen-trigger" onClick={() => window.dispatchEvent(new CustomEvent("buckeye:open-carmen-ai"))} aria-label="Open Carmen study suggestions" title="Carmen study suggestions"><Star size={18} className="fill-amber-300" /></button>
              <button type="button" className="notes-new-button" onClick={() => { setExpanded(true); window.dispatchEvent(new CustomEvent("buckeye:open-new-note")); }} aria-label="Create a new group note" title="New note"><Plus size={18} /></button>
            </>}
          </div>
        </div>
        <div id="map-sheet-content" className="map-sheet-content">
          {tab === "groups" && <>
            <label className="map-search group-search-field"><Search size={19} aria-hidden="true" /><input type="search" value={groupQuery} onChange={(event) => setGroupQuery(event.target.value)} placeholder="Search courses, e.g. CSE 2221" aria-label="Search study groups by course number" /></label>
            <ul className="map-group-list" aria-label="Study groups on Thompson Library Level 1">
              {visibleGroups.map(({ table, group }) => <li key={group.id}><button className="map-group-row" type="button" onClick={(event) => openTable(table, event.currentTarget)}>
                <ProfileAvatar profile={group.host} /><span className="group-row-copy"><strong>{group.name}</strong><small>{group.courseCode} · {group.topic}</small><span className="group-table-label"><MapPin size={12} aria-hidden="true" />{table.label}</span></span>
              </button></li>)}
            </ul>
            {visibleGroups.length === 0 && <p className="map-hint group-no-results" role="status">No study groups match “{groupQuery}”. Try a course number such as CSE 2221 or MATH 1151.</p>}
          </>}
          {tab === "join" && activeGroup && <CurrentGroupPanel
            group={activeGroup} table={tables.find((table) => table.id === activeGroup.tableId)!} profileId={viewer.id} notice={groupState.notice}
            onInvite={(profileId) => dispatchGroup({ type: "invite", profileId, hostId: viewer.id })}
            onGpsLeave={() => {
              if (activeGroup) {
                fetch("/api/map/groups", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ action: "leave", sessionId: activeGroup.id, profileId: viewer.id, tableId: activeGroup.tableId }),
                })
                  .then((r) => r.json())
                  .then((data) => {
                    if (data?.groups) dispatchGroup({ type: "sync-from-db", groups: data.groups });
                  })
                  .catch(() => {});
              }
              dispatchGroup({ type: "leave", profileId: viewer.id, gps: true });
            }}
            onEnd={() => {
              endSessionInSupabase(activeGroup.id, activeGroup.tableId);
              dispatchGroup({ type: "end", hostId: viewer.id });
            }}
          />}
          {tab === "notes" && <div className="map-feature-panel"><NotebookPanel notebook={currentNotebook} sessionId={currentNotebook.sessionId} courseCode={activeGroup?.courseCode ?? "CSE 2221"} memberCount={activeGroup ? activeGroup.members.length + 1 : undefined} currentUser={viewer} floorLevel="Level 1" onStartNewNote={() => setExpanded(true)} onNotebookContentChange={setNotebookContent} /></div>}
          {tab === "me" && <div className="map-feature-panel">{profile ? <><div className="map-user-greeting">Hi, {profile.name.split(" ")[0]}</div>{profilePanel}</> : <p className="map-hint">Your study profile is not available.</p>}</div>}
        </div>
      </section>}

      <GroupJoinManager visible={tab === "join"} profile={viewer} groups={groupState.groups} activeGroup={activeGroup} tables={tables} readerLocation={readerLocation} notice={groupState.notice}
        onStart={() => dispatchGroup({ type: "clear-notice" })}
        onJoin={(groupId) => {
          fetch("/api/map/groups", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "join", sessionId: groupId, profileId: viewer.id }),
          })
            .then((r) => r.json())
            .then((data) => {
              if (data?.groups) dispatchGroup({ type: "sync-from-db", groups: data.groups });
            })
            .catch(() => {});
          dispatchGroup({ type: "join", groupId, profile: viewer, now: Date.now() });
        }}
        onCreate={async (input) => {
          const localId = createDemoGroupId();
          dispatchGroup({ type: "create", input, profile: viewer, id: localId, now: Date.now() });
          try {
            const res = await createSessionInSupabase(input, viewer);
            if (res?.groups) {
              dispatchGroup({ type: "sync-from-db", groups: res.groups });
            }
          } catch (err) {
            console.warn("Could not save session to Supabase immediately:", err);
          }
        }}
      />

      <nav className="map-service-tabs" aria-label="Map app navigation">
        <button className={tab === "groups" ? "active" : ""} aria-current={tab === "groups" ? "page" : undefined} aria-expanded={tab === "groups" && !groupSheetHidden} aria-controls="map-info-sheet" type="button" onClick={() => activateTab("groups")}>{tabIcon("groups", <Users size={24} />)}<span>Groups</span></button>
        <button className={tab === "join" ? "active" : ""} aria-current={tab === "join" ? "page" : undefined} type="button" onClick={() => activateTab("join")} aria-label="New group or manage your current group">{tabIcon("join", <Plus size={25} />)}<span>New</span></button>
        <button className={tab === "notes" ? "active" : ""} aria-current={tab === "notes" ? "page" : undefined} type="button" onClick={() => activateTab("notes")}>{tabIcon("notes", <BookOpen size={24} />)}<span>Notes</span></button>
        <button className={tab === "me" ? "active" : ""} aria-current={tab === "me" ? "page" : undefined} type="button" onClick={() => activateTab("me")}>{tabIcon("me", <span className="service-avatar">{profile?.name.slice(0, 1) || "?"}</span>)}<span>Me</span></button>
      </nav>

      {selectedTable && <div className={`group-info-backdrop${closingTable ? " is-closing" : ""}`} role="presentation" onClick={closeTable}>
        <section className="group-info-dialog" role="dialog" aria-modal="true" aria-labelledby="group-info-title" aria-describedby="group-info-status" onClick={(event) => event.stopPropagation()}>
          {selectedGroup ? <>
            <img className="group-info-notebook-art" src="/illustrations/notebook2.png" width="1066" height="1439" alt="" aria-hidden="true" />
            <div className="group-info-notebook-content">
              <div className="group-info-heading group-info-notebook-heading">
                <p className="group-info-eyebrow">{selectedTable.label} · {selectedTable.status === "very-busy" ? "VERY BUSY" : "BUSY"}</p>
                <h2 id="group-info-title">{selectedGroup.name}</h2>
                <p id="group-info-status">{selectedGroup.courseCode} · {selectedGroup.topic}</p>
              </div>
              <GroupRoster group={selectedGroup} variant="notebook" />
            </div>
            <button ref={tableCloseButton} type="button" className="group-info-notebook-close" onClick={closeTable} aria-label="Close group popup" />
          </> : <>
            <button ref={tableCloseButton} type="button" className="group-info-close" onClick={closeTable} aria-label="Close table information"><X size={20} /></button>
            <div className="group-info-heading">
              <p className="group-info-eyebrow">{selectedTable.label} · EMPTY</p>
              <h2 id="group-info-title">Available table</h2>
              <p id="group-info-status">No study group is at this table right now.</p>
            </div>
          </>}
        </section>
      </div>}
    </div>
  );
}
