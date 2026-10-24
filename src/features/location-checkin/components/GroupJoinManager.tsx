"use client";

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, Nfc, Search, X } from "lucide-react";
import { GroupRoster } from "@/app/components/GroupRoster";
import { DEMO_GROUP_COURSES, DEMO_READER_DELAY_MS, MOCK_PROFILES, type DemoCreateGroupInput, type DemoReaderLocation, type DemoStudyGroup, type ProfilePreview, type ThompsonTable } from "@/types/contracts";
import { canJoinDemoGroup } from "../group-demo";

function ReaderDialog({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const field = panel.current?.querySelector<HTMLInputElement>("input");
    if (field) {
      field.focus();
      if (field.dataset.selectDefault === "true") field.select();
    } else panel.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close.current();
      if (event.key !== "Tab") return;
      const items = panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), [tabindex="0"]');
      if (!items?.length) return;
      const first = items[0], last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => { document.removeEventListener("keydown", onKeyDown); if (opener?.isConnected) opener.focus(); };
  }, []);
  return createPortal(<div className="app-dialog-backdrop reader-dialog-backdrop" onClick={onClose}>
    <div ref={panel} className="app-dialog-panel reader-dialog-panel" role="dialog" aria-modal="true" aria-labelledby={titleId} onClick={(event) => event.stopPropagation()}>
      <button type="button" className="reader-close" aria-label="Close reader popup" onClick={onClose}><X size={20} /></button>
      <h2 id={titleId} className="paper-title">{title}</h2>{children}
    </div>
  </div>, document.body);
}

interface GroupJoinManagerProps {
  visible: boolean; profile: ProfilePreview; groups: DemoStudyGroup[];
  activeGroup: DemoStudyGroup | null; tables: readonly ThompsonTable[];
  readerLocation: DemoReaderLocation | null; notice: string;
  onStart: () => void; onJoin: (id: string) => void; onCreate: (input: DemoCreateGroupInput) => void;
}

/** No sheet is opened until a reader result has been explicitly confirmed. */
export function GroupJoinManager({ visible, profile, groups, activeGroup, tables, readerLocation, notice, onStart, onJoin, onCreate }: GroupJoinManagerProps) {
  const [stage, setStage] = useState<"idle" | "scanning" | "existing" | "create">("idle");
  const [target, setTarget] = useState<DemoReaderLocation | null>(null);
  const [step, setStep] = useState(0);
  const [name, setName] = useState(`${profile.name}'s Group`);
  const [query, setQuery] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [inviteOnly, setInviteOnly] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef({ readerLocation, groups });
  latest.current = { readerLocation, groups };
  const cancel = useCallback(() => {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null; setStage("idle"); setTarget(null);
  }, []);
  useEffect(() => { if (!visible || activeGroup) cancel(); }, [visible, activeGroup, cancel]);
  useEffect(() => () => { if (timer.current !== null) clearTimeout(timer.current); }, []);
  function scan() {
    if (timer.current !== null || stage !== "idle" || !readerLocation) return;
    onStart(); setStage("scanning");
    timer.current = setTimeout(() => {
      timer.current = null;
      const location = latest.current.readerLocation;
      if (!location) { setStage("idle"); return; }
      setTarget(location); setName(`${profile.name}'s Group`); setQuery(""); setCourseCode(""); setInviteOnly(false); setStep(0);
      setStage(latest.current.groups.some((group) => group.tableId === location.tableId) ? "existing" : "create");
    }, DEMO_READER_DELAY_MS);
  }
  if (!visible || activeGroup) return null;
  const table = tables.find((item) => item.id === target?.tableId);
  const group = groups.find((item) => item.tableId === target?.tableId);
  const allowed = group ? canJoinDemoGroup(group, profile.id) : false;
  const courses = DEMO_GROUP_COURSES.filter((course) => `${course.code} ${course.name}`.toLowerCase().includes(query.trim().toLowerCase()));
  const sourceText = target?.source === "device" ? "Approximate device location" : target?.usedFallback ? "Using demo location near Thompson Library" : "Simulated map location";
  return <>
    {stage === "idle" && <div className="reader-entry">
      {notice && <p role="status" className="reader-notice">{notice}</p>}
      <button type="button" className="reader-tap-button" disabled={!readerLocation} onClick={scan}><Nfc size={24} aria-hidden="true" />Tap BuckID Reader</button>
    </div>}
    {stage !== "idle" && <ReaderDialog key={stage} title={stage === "scanning" ? "Simulating a reader tap…" : stage === "existing" ? `Join ${group?.host.name.split(" ")[0] ?? "the host"}'s Group?` : "Create Group?"} onClose={cancel}>
      {stage === "scanning" ? <div className="reader-scanning" role="status" aria-live="polite">
        <div className="reader-animation" aria-hidden="true"><span /><span /><span /><Nfc size={42} /></div>
        <p>Finding your table…</p><p className="reader-caption">Three-second demo · no NFC data is read.</p>
        <div className="reader-progress" role="progressbar" aria-label="Three-second reader simulation"><span /></div>
        <button type="button" className="reader-secondary" onClick={cancel}>Cancel</button>
      </div> : <>
        <p className="reader-caption reader-location">{sourceText} · {table?.label}</p>
        {stage === "existing" && (group ? <>
          <h3 className="reader-group-name">{group.name}</h3><p className="reader-study-status">{group.courseCode} · {group.topic}</p>
          <p className="reader-caption">{table?.status === "very-busy" ? "Very busy" : "Busy"} · {group.inviteOnly ? "Invite only" : "Open group"}</p>
          <GroupRoster group={group} />
          {!allowed && <p role="status" className="reader-invitation-required">An invitation from the host is required before you can join.</p>}
          <button type="button" className="reader-primary" disabled={!allowed} onClick={() => onJoin(group.id)}>Join group</button>
        </> : <p>This group is no longer posted. Close this popup and tap the reader again.</p>)}
        {stage === "create" && <form className="reader-create-form" onSubmit={(event) => {
          event.preventDefault();
          if (step < 2) { if ((step === 0 && name.trim()) || (step === 1 && courseCode)) setStep(step + 1); }
          else if (target && name.trim() && courseCode) onCreate({ tableId: target.tableId, name, courseCode, inviteOnly });
        }}>
          <p className="reader-caption">Step {step + 1} of 3</p>
          {step === 0 && <label className="reader-field">Group name
            <input value={name} data-select-default={name === `${profile.name}'s Group`}
              onChange={(event) => setName(event.target.value)}
              onFocus={(event) => { if (name === `${profile.name}'s Group`) event.currentTarget.select(); }}
              onClick={(event) => { if (name === `${profile.name}'s Group`) event.currentTarget.select(); }} />
          </label>}
          {step === 1 && <>
            <label className="reader-field">Study status / course<span className="reader-course-search"><Search size={18} aria-hidden="true" /><input autoFocus type="search" placeholder="Search courses" value={query} onChange={(event) => { setQuery(event.target.value); setCourseCode(""); }} /></span></label>
            <div className="reader-course-options" aria-label="Study courses">{courses.map((course) => <button type="button" key={course.code} aria-pressed={courseCode === course.code} onClick={() => setCourseCode(course.code)}><strong>{course.code}</strong><span>{course.name}</span></button>)}{!courses.length && <p role="status" className="reader-caption">No courses match your search.</p>}</div>
          </>}
          {step === 2 && <><p className="reader-create-summary"><strong>{name}</strong><span>{courseCode} · {table?.label}</span></p><label className="reader-invite-toggle"><span>Invite only</span><input type="checkbox" checked={inviteOnly} onChange={(event) => setInviteOnly(event.target.checked)} /></label></>}
          <div className="reader-form-actions">{step > 0 && <button type="button" className="reader-secondary" onClick={() => setStep(step - 1)}><ArrowLeft size={16} />Back</button>}<button type="submit" className="reader-primary" disabled={step === 0 ? !name.trim() : !courseCode}>{step === 2 ? "Create" : "Next"}</button></div>
        </form>}
      </>}
    </ReaderDialog>}
  </>;
}

export function CurrentGroupPanel({ group, table, profileId, notice, onInvite, onGpsLeave, onEnd, children }: {
  group: DemoStudyGroup; table: ThompsonTable; profileId: string; notice: string;
  onInvite: (profileId: string) => void; onGpsLeave: () => void; onEnd: () => void; children: ReactNode;
}) {
  const [search, setSearch] = useState("");
  const members = [group.host, ...group.members];
  const candidates = search.trim() ? MOCK_PROFILES.filter((profile) => `${profile.name} ${profile.id}`.toLowerCase().includes(search.trim().toLowerCase()) && !members.some((member) => member.id === profile.id)) : [];
  return <section className="current-group-details" aria-label="Current study group">
    {notice && <p role="status" className="reader-notice">{notice}</p>}
    <h2 className="paper-title reader-group-name">{group.name}</h2><p className="reader-study-status">{group.courseCode} · {group.topic}</p>
    <p className="reader-caption">{table.label} · {table.status === "very-busy" ? "Very busy" : "Busy"} · {group.inviteOnly ? "Invite only" : "Open group"}</p>
    <GroupRoster group={group} />
    {group.host.id === profileId && group.inviteOnly && <section className="current-group-invites" aria-label="Host invitations">
      <label className="reader-field">Invite a student<input type="search" placeholder="Search by name or profile ID" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
      {candidates.map((profile) => <div className="reader-invite-result" key={profile.id}><span>{profile.name}</span><button type="button" className="reader-secondary" disabled={group.invitedProfileIds.includes(profile.id)} onClick={() => onInvite(profile.id)}>{group.invitedProfileIds.includes(profile.id) ? "Invited" : "Invite"}</button></div>)}
      {search.trim() && !candidates.length && <p className="reader-caption">No other demo students match that name or profile ID.</p>}
      <p className="reader-caption">Local demo invitations · students join after confirmation.</p>
    </section>}
    <div className="current-group-notebook"><h3 className="paper-title">Shared Group Notebook</h3>{children}</div>
    <button type="button" className="reader-secondary group-gps-trigger" onClick={onGpsLeave}>Simulate Walking Away (GPS Trigger)</button>
    {group.host.id === profileId && <button type="button" className="reader-secondary group-end-session" onClick={onEnd}>End session</button>}
  </section>;
}
