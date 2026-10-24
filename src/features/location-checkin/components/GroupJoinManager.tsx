"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ChevronDown, ChevronUp, MapPin, Search, Shield, Sparkles, Users } from "lucide-react";
import {
  MOCK_PROFILES,
  MOCK_THOMPSON_TABLE_GROUPS,
  THOMPSON_EAST_ENTRANCE_TABLES,
  type ThompsonTableGroup,
} from "@/types/contracts";

type Member = { id: string; name: string; joinedAt: number };
type Group = {
  id: string; name: string; hostId: string; course: string; topic: string;
  inviteOnly: boolean; table: string; members: Member[]; notes: string;
};
type Stage = "idle" | "scanning" | "existing" | "create" | "current";

export type GroupJoinManagerProps = {
  currentUserId?: string;
  currentUserName?: string;
  notebookContent?: string;
  onNotebookContentChange?: (content: string) => void;
  /** Optional callback for a parent shell to synchronize its selected tab. */
  onStageChange?: (stage: Stage) => void;
};

const courses = ["CSE 2221 · Software I", "CSE 2231 · Software II", "MATH 1151 · Calculus I", "MATH 1172 · Engineering Math", "ENGR 1181 · Fundamentals of Engineering"];

function createLocalGroup(group: ThompsonTableGroup, index: number): Group {
  const table = THOMPSON_EAST_ENTRANCE_TABLES.find((item) => item.groupId === group.id);
  return {
    id: group.id,
    name: group.name,
    hostId: group.host.id,
    course: group.courseCode,
    topic: group.topic,
    inviteOnly: group.id === "sam-math-1151",
    table: table?.label ?? "Thompson table",
    members: [group.host, ...group.members].map((member, memberIndex) => ({
      id: member.id,
      name: member.name,
      joinedAt: index * 10 + memberIndex + 1,
    })),
    notes: `## ${group.courseCode} study notes\n[concept] ${group.host.name} · Shared\n${group.topic}.`,
  };
}

const initialGroups: Group[] = ["jordan-cse-2221", "sam-math-1151"]
  .flatMap((groupId) => MOCK_THOMPSON_TABLE_GROUPS.filter((group) => group.id === groupId))
  .map(createLocalGroup);

/** Standalone frontend-only join/create and current-group flow for the Groups tab. */
export function GroupJoinManager({ currentUserId = "viewer", currentUserName = "Alex Morgan", notebookContent, onNotebookContentChange, onStageChange }: GroupJoinManagerProps) {
  const [stage, setStage] = useState<Stage>("idle");
  const [outcome, setOutcome] = useState<"existing" | "empty">("existing");
  const [groups, setGroups] = useState(initialGroups);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [courseQuery, setCourseQuery] = useState("");
  const [course, setCourse] = useState("");
  const [groupName, setGroupName] = useState(`${currentUserName}'s Group`);
  const [inviteOnly, setInviteOnly] = useState(false);
  const [hostSearch, setHostSearch] = useState("");
  const [notice, setNotice] = useState("");
  const active = groups.find((group) => group.id === activeId) ?? null;
  const filteredCourses = useMemo(() => courses.filter((item) => item.toLowerCase().includes(courseQuery.toLowerCase())), [courseQuery]);
  const changeStage = (next: Stage) => { setStage(next); onStageChange?.(next); };

  function scan() {
    changeStage("scanning"); setNotice("");
    window.setTimeout(() => changeStage(outcome === "existing" ? "existing" : "create"), 900);
  }
  function join(group: Group) {
    if (!group.members.some((member) => member.id === currentUserId)) {
      setGroups((items) => items.map((item) => item.id === group.id ? { ...item, members: [...item.members, { id: currentUserId, name: currentUserName, joinedAt: Date.now() }] } : item));
    }
    onNotebookContentChange?.(group.notes);
    setActiveId(group.id); setExpanded(false); changeStage("current");
  }
  function createGroup() {
    const created: Group = { id: `local-${Date.now()}`, name: groupName.trim() || `${currentUserName}'s Group`, hostId: currentUserId, course: course.split(" · ")[0] || "CSE 2221", topic: "New study session", inviteOnly, table: "Table 150A-1", members: [{ id: currentUserId, name: currentUserName, joinedAt: Date.now() }], notes: "## New group note\n[concept] You · Shared\nAdd shared notes here as your group studies." };
    onNotebookContentChange?.(created.notes);
    setGroups((items) => [created, ...items]); setActiveId(created.id); setExpanded(false); setNotice("Group created in this demo."); changeStage("current");
  }
  function leave() {
    if (!active) return;
    const remaining = active.members.filter((member) => member.id !== currentUserId);
    if (remaining.length === 0) {
      setGroups((items) => items.filter((item) => item.id !== active.id));
      setNotice("The group closed because no members remained.");
    } else {
      const earliest = [...remaining].sort((a, b) => a.joinedAt - b.joinedAt)[0];
      setGroups((items) => items.map((item) => item.id === active.id ? { ...item, hostId: earliest.id, members: remaining } : item));
      setNotice(`${earliest.name} is now the host.`);
    }
    setActiveId(null); changeStage("idle");
  }
  function invite() {
    const query = hostSearch.trim();
    if (!active || !query) return;
    const normalizedQuery = query.toLocaleLowerCase();
    const candidate = MOCK_PROFILES.find((profile) =>
      profile.id.toLocaleLowerCase().includes(normalizedQuery)
      || profile.name.toLocaleLowerCase().includes(normalizedQuery),
    );
    if (!candidate) {
      setNotice("No demo student matches that name or profile ID.");
      return;
    }
    if (active.members.some((member) => member.id === candidate.id)) {
      setNotice(`${candidate.name} is already in this group.`);
      return;
    }
    setGroups((items) => items.map((item) => item.id === active.id
      ? { ...item, members: [...item.members, { id: candidate.id, name: candidate.name, joinedAt: Date.now() }] }
      : item));
    setNotice(`Invitation granted to ${candidate.name}; they joined in this demo.`);
    setHostSearch("");
  }
  function endSession() {
    if (!active) return;
    setGroups((items) => items.filter((item) => item.id !== active.id));
    setActiveId(null);
    setNotice("The group session has ended in this demo.");
    changeStage("idle");
  }

  const panel: React.CSSProperties = { color: "#292824", background: "#faf9f5", border: "1px solid rgba(90,83,70,.14)", borderRadius: 24, boxShadow: "0 12px 36px rgba(30,25,15,.12)", padding: 20, maxWidth: 520, margin: "0 auto", fontFamily: "inherit" };
  const primary: React.CSSProperties = { border: 0, borderRadius: 14, background: "#ba0c2f", color: "white", fontWeight: 700, padding: "13px 16px", cursor: "pointer" };
  const secondary: React.CSSProperties = { border: "1px solid #dedbd4", borderRadius: 12, background: "#fffefa", color: "#393832", padding: "10px 12px", cursor: "pointer" };
  const input: React.CSSProperties = { width: "100%", boxSizing: "border-box", border: "1px solid #dedbd4", borderRadius: 12, padding: "12px 13px", background: "#fffefa", color: "#292824", outlineColor: "#ba0c2f" };

  return <section aria-label="Join or manage a study group" style={{ padding: 12, position: "relative", zIndex: 5 }}>
    {notice && <div role="status" style={{ ...panel, padding: "10px 14px", marginBottom: 10, fontSize: 13 }}>{notice}</div>}
    {stage === "idle" && <div style={panel}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}><MapPin size={19} color="#ba0c2f" /><div><strong>Join or start a study group</strong><div style={{ fontSize: 13, color: "#77756e", marginTop: 3 }}>Find your table with a simulated BuckID scan.</div></div></div>
      <button type="button" style={{ ...primary, width: "100%" }} onClick={scan}>Tap BuckID Reader</button>
      <div style={{ borderTop: "1px solid #eeeae3", marginTop: 17, paddingTop: 14, display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}><span style={{ fontSize: 12, color: "#77756e" }}>Demo scan outcome</span><div style={{ display: "flex", gap: 6 }}><button style={{ ...secondary, fontSize: 12 }} onClick={() => setOutcome("existing")}>Existing group</button><button style={{ ...secondary, fontSize: 12 }} onClick={() => setOutcome("empty")}>No group</button></div></div>
      <div style={{ fontSize: 11, color: "#929087", marginTop: 9 }}>Mock reader · no BuckID data is read.</div>
    </div>}
    {stage === "scanning" && <div style={{ ...panel, textAlign: "center", padding: 34 }}><div style={{ margin: "0 auto 14px", width: 48, height: 48, borderRadius: 16, background: "#fff0f2", color: "#ba0c2f", display: "grid", placeItems: "center" }}><span style={{ animation: "none" }}>⌁</span></div><strong>Reading table location…</strong><p style={{ color: "#77756e", fontSize: 13, marginBottom: 0 }}>Simulating a BuckID / table-reader check.</p></div>}
    {stage === "existing" && <div style={panel}>
      <button style={{ ...secondary, border: 0, padding: 4, marginBottom: 8 }} aria-label="Back" onClick={() => changeStage("idle")}><ArrowLeft size={18} /></button>
      {groups[0] && <><div style={{ fontSize: 13, color: "#77756e" }}>Group found at {groups[0].table}</div><h2 style={{ fontSize: 22, margin: "4px 0 2px" }}>Join {groups[0].members.find((member) => member.id === groups[0].hostId)?.name ?? "the host"}'s Group?</h2><div style={{ color: "#655f57", fontSize: 14 }}>{groups[0].name} · {groups[0].course} · {groups[0].topic}</div><People group={groups[0]} />{groups[0].inviteOnly && <div style={{ fontSize: 12, color: "#77756e", margin: "12px 0" }}><Shield size={14} style={{ verticalAlign: "-2px" }} /> Invite-only group</div>}<button style={{ ...primary, width: "100%", marginTop: 16 }} onClick={() => join(groups[0])}>Join group</button><p style={{ fontSize: 11, color: "#929087", margin: "10px 0 0" }}>Table busyness does not prevent joining.</p></>}
      {!groups[0] && <button style={primary} onClick={() => changeStage("create")}>Create a group</button>}
    </div>}
    {stage === "create" && <div style={panel}>
      <button style={{ ...secondary, border: 0, padding: 4, marginBottom: 8 }} aria-label="Back" onClick={() => changeStage("idle")}><ArrowLeft size={18} /></button><h2 style={{ margin: "0 0 16px", fontSize: 22 }}>Create Group?</h2>
      <label style={{ display: "block", fontSize: 13, fontWeight: 650, marginBottom: 7 }}>Group name</label><input style={input} value={groupName} onChange={(event) => setGroupName(event.target.value)} onFocus={(event) => event.currentTarget.select()} />
      <label style={{ display: "block", fontSize: 13, fontWeight: 650, margin: "15px 0 7px" }}>Study status / course</label><div style={{ position: "relative" }}><Search size={16} style={{ position: "absolute", left: 12, top: 13, color: "#858178" }} /><input style={{ ...input, paddingLeft: 36 }} placeholder="Search courses" value={courseQuery} onChange={(event) => setCourseQuery(event.target.value)} /></div><div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>{filteredCourses.map((item) => <button key={item} style={{ ...secondary, fontSize: 12, borderColor: course === item ? "#ba0c2f" : "#dedbd4", background: course === item ? "#fff0f2" : "white" }} onClick={() => { setCourse(item); setCourseQuery(""); }}>{item}</button>)}</div>
      <button type="button" aria-pressed={inviteOnly} onClick={() => setInviteOnly(!inviteOnly)} style={{ border: 0, background: "transparent", display: "flex", alignItems: "center", gap: 10, padding: "16px 0 4px", cursor: "pointer", color: "#393832" }}><span style={{ width: 38, height: 22, borderRadius: 20, background: inviteOnly ? "#ba0c2f" : "#d6d3ce", padding: 3, boxSizing: "border-box", textAlign: inviteOnly ? "right" : "left" }}><span style={{ display: "inline-block", width: 16, height: 16, borderRadius: "50%", background: "white" }} /></span><span style={{ fontSize: 13 }}>Invite only</span></button>
      <button style={{ ...primary, width: "100%", marginTop: 16 }} onClick={createGroup}>Create</button>
    </div>}
    {stage === "current" && active && <div style={{ ...panel, padding: 0, overflow: "hidden", minHeight: expanded ? "min(78vh, 720px)" : undefined, transition: "min-height .25s ease" }}>
      <div style={{ padding: "17px 18px 13px", background: "#faf9f5", borderBottom: "1px solid rgba(90,83,70,.1)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}><div><div style={{ fontSize: 11, color: "#77756e", textTransform: "uppercase", letterSpacing: ".08em" }}>Your study group · {active.table}</div><h2 style={{ margin: "5px 0 3px", fontSize: 21 }}>{active.name}</h2><div style={{ fontSize: 13, color: "#655f57" }}>{active.course} · {active.topic}</div></div><button style={{ ...primary, background: "#b42332", padding: "10px 12px", whiteSpace: "nowrap" }} onClick={leave}>Leave group</button></div>
      <button aria-expanded={expanded} onClick={() => setExpanded(!expanded)} style={{ width: "100%", border: 0, background: "rgba(249,248,245,.8)", padding: 9, color: "#77756e", cursor: "pointer" }}>{expanded ? <><ChevronDown size={16} /> Collapse sheet</> : <><ChevronUp size={16} /> Swipe up for group details</>}</button>
      <div style={{ padding: "8px 18px 18px", maxHeight: expanded ? "calc(78vh - 105px)" : 158, overflowY: "auto" }}><div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 12 }}><Badge>{active.members.length} studying</Badge><Badge>{active.inviteOnly ? "Invite only" : "Open group"}</Badge><Badge>Table busy</Badge></div><People group={active} />
        {active.hostId === currentUserId && active.inviteOnly && <div style={{ marginTop: 17, paddingTop: 15, borderTop: "1px solid #eeeae3" }}><label style={{ display: "block", fontSize: 13, fontWeight: 650, marginBottom: 7 }}>Invite a student</label><div style={{ display: "flex", gap: 8 }}><input style={input} placeholder="Search by name or profile ID" value={hostSearch} onChange={(event) => setHostSearch(event.target.value)} /><button style={primary} onClick={invite}>Invite</button></div><div style={{ fontSize: 11, color: "#929087", marginTop: 5 }}>Host-only control · local demo invitation.</div></div>}
        <div style={{ marginTop: 17, paddingTop: 15, borderTop: "1px solid #eeeae3" }}><div style={{ fontSize: 14, fontWeight: 700 }}>Shared Group Notebook</div><textarea aria-label="Shared Group Notebook" value={notebookContent ?? active.notes} onChange={(event) => { const nextNotes = event.target.value; setGroups((items) => items.map((item) => item.id === active.id ? { ...item, notes: nextNotes } : item)); onNotebookContentChange?.(nextNotes); }} style={{ ...input, minHeight: 76, resize: "vertical", marginTop: 8 }} /><div style={{ display: "flex", gap: 7, alignItems: "center", fontSize: 12, color: "#6c675e", marginTop: 10 }}><Sparkles size={15} color="#ba0c2f" /> Catch up: {(notebookContent ?? active.notes) || "No shared notes yet."}</div></div>
        <button style={{ ...secondary, marginTop: 15, fontSize: 12 }} onClick={() => { leave(); setNotice("GPS simulation: moved over 150 m away. You left the group."); }}>Simulate Walking Away (GPS Trigger)</button>
        {active.hostId === currentUserId && <button style={{ ...secondary, color: "#a51c30", marginTop: 9, fontSize: 12 }} onClick={endSession}>End session</button>}
      </div>
    </div>}
    {stage === "current" && !active && <div style={panel}>This group is no longer active. <button style={secondary} onClick={() => changeStage("idle")}>Back to groups</button></div>}
  </section>;
}

function Badge({ children }: { children: React.ReactNode }) { return <span style={{ borderRadius: 20, padding: "5px 9px", fontSize: 11, background: "rgba(244,241,235,.92)", color: "#615d55" }}>{children}</span>; }
function People({ group }: { group: Group }) {
  const members = [...group.members].sort((a, b) => a.id === group.hostId ? -1 : b.id === group.hostId ? 1 : a.joinedAt - b.joinedAt);
  return <div style={{ marginTop: 14, maxHeight: 150, overflowY: "auto" }}><div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#77756e", marginBottom: 8 }}><Users size={14} /> Members</div>{members.map((member) => <div key={member.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0" }}><div aria-label={`${member.name} profile image`} style={{ width: 34, height: 34, flex: "0 0 34px", display: "grid", placeItems: "center", borderRadius: "50%", color: "#7d1831", background: "#f6e6e9", fontWeight: 700, fontSize: 12 }}>{member.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase()}</div><span style={{ fontSize: 13, fontWeight: 600 }}>{member.name}</span>{member.id === group.hostId && <span style={{ fontSize: 10, color: "#837c70", marginLeft: "auto" }}>Host</span>}</div>)}</div>;
}
