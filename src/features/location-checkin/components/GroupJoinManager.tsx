"use client";

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, Nfc, QrCode, Search, X } from "lucide-react";
import { GroupRoster } from "@/app/components/GroupRoster";
import { DEMO_GROUP_COURSES, DEMO_READER_DELAY_MS, MOCK_PROFILES, type DemoReaderLocation, type DemoStudyGroup, type ProfilePreview, type ThompsonTable } from "@/types/contracts";
import { DEFAULT_AVAILABLE_SEATS, MAX_AVAILABLE_SEATS, groupSeatCounts, type GroupCreationInput } from "@/lib/group-seats";
import { canJoinDemoGroup } from "../group-demo";
import { BUCKID_DEMO_TABLE_ID } from "../buckid-demo";
import { TableQrCamera } from "./TableQrCamera";

const BUCKID_READER_DELAY_MS = 1000;

type ReaderTarget = Omit<DemoReaderLocation, "source"> & { source: DemoReaderLocation["source"] | "qr" };

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
      const items = panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), [tabindex="0"]');
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
  readerHandle?: ReactNode;
  linkedTableId?: string | null; onTableLinkOpened?: () => void;
  onStart: (method: "nfc" | "qr") => void; onJoin: (id: string) => Promise<string | null>; onCreate: (input: GroupCreationInput) => void;
}

/** A table scan joins eligible groups directly; unavailable tables explain why. */
export function GroupJoinManager({ visible, profile, groups, activeGroup, tables, readerLocation, notice, readerHandle, linkedTableId, onTableLinkOpened, onStart, onJoin, onCreate }: GroupJoinManagerProps) {
  const [stage, setStage] = useState<"idle" | "scanning" | "existing" | "create">("idle");
  const [scanMethod, setScanMethod] = useState<"nfc" | "qr">("qr");
  const [target, setTarget] = useState<ReaderTarget | null>(null);
  const [step, setStep] = useState(0);
  const [name, setName] = useState(`${profile.name}'s Group`);
  const [query, setQuery] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [inviteOnly, setInviteOnly] = useState(false);
  const [availableSeatsInput, setAvailableSeatsInput] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const joinAttempt = useRef<{ groupId: string } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef({ readerLocation, groups, tables, onJoin });
  latest.current = { readerLocation, groups, tables, onJoin };
  const openedLink = useRef<string | null>(null);
  const openLocation = useCallback((location: ReaderTarget) => {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
    setTarget(location); setName(`${profile.name}'s Group`); setQuery(""); setCourseCode(""); setInviteOnly(false); setStep(0);
    setAvailableSeatsInput("");
    joinAttempt.current = null; setJoinError(null);
    setStage(latest.current.groups.some((group) => group.tableId === location.tableId) ? "existing" : "create");
  }, [profile.name]);
  const cancel = useCallback(() => {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null; setStage("idle"); setTarget(null);
    joinAttempt.current = null; setJoinError(null);
  }, []);
  useEffect(() => { if (!visible || activeGroup) cancel(); }, [visible, activeGroup, cancel]);
  useEffect(() => () => { if (timer.current !== null) clearTimeout(timer.current); }, []);

  useEffect(() => {
    if (!linkedTableId) { openedLink.current = null; return; }
    if (!visible || openedLink.current === linkedTableId) return;
    const table = latest.current.tables.find((item) => item.id === linkedTableId);
    if (!table) return;
    openedLink.current = linkedTableId;
    if (!activeGroup) {
      setScanMethod("qr");
      openLocation({ tableId: table.id, point: { x: table.x, y: table.y }, source: "qr", usedFallback: false });
    }
    onTableLinkOpened?.();
  }, [linkedTableId, visible, activeGroup, openLocation, onTableLinkOpened]);

  // Resolve against current data if a group appears or disappears while the form is open.
  useEffect(() => {
    if (!visible || activeGroup || !target || stage === "idle" || stage === "scanning") return;
    const exists = groups.some((group) => group.tableId === target.tableId);
    setStage(exists ? "existing" : "create");
  }, [visible, activeGroup, groups, target, stage]);

  function startScan(method: "nfc" | "qr") {
    if (timer.current !== null || stage !== "idle" || (method === "nfc" && !readerLocation)) return;
    setScanMethod(method);
    onStart(method);
    setStage("scanning");
    if (method === "qr") return;
    timer.current = setTimeout(() => {
      timer.current = null;
      const location = latest.current.readerLocation;
      if (!location) { setStage("idle"); return; }
      openLocation({ ...location, tableId: BUCKID_DEMO_TABLE_ID, source: "demo", usedFallback: true });
    }, method === "nfc" ? BUCKID_READER_DELAY_MS : DEMO_READER_DELAY_MS);
  }

  const table = tables.find((item) => item.id === target?.tableId);
  const group = groups.find((item) => item.tableId === target?.tableId);
  const allowed = group ? canJoinDemoGroup(group, profile.id) : false;
  useEffect(() => {
    if (!visible || activeGroup || stage !== "existing" || !group || !allowed || joinError || joinAttempt.current) return;
    const attempt = { groupId: group.id };
    joinAttempt.current = attempt;
    void (async () => {
      let message: string | null;
      try { message = await latest.current.onJoin(group.id); }
      catch { message = "Couldn't join this group. Please retry."; }
      if (joinAttempt.current === attempt && message) setJoinError(message);
    })();
  }, [visible, activeGroup, stage, group, allowed, joinError]);

  if (!visible || activeGroup) return null;
  const seats = group ? groupSeatCounts(group) : null;
  const availableSeats = availableSeatsInput === "" ? undefined : Number(availableSeatsInput);
  const validSeats = availableSeats === undefined || (Number.isSafeInteger(availableSeats) && availableSeats >= 0 && availableSeats <= MAX_AVAILABLE_SEATS);
  const courses = DEMO_GROUP_COURSES.filter((course) => `${course.code} ${course.name}`.toLowerCase().includes(query.trim().toLowerCase()));
  const sourceText = scanMethod === "qr"
    ? "Scanned Table QR Anchor"
    : target?.source === "device"
      ? "Approximate device location"
      : target?.usedFallback
        ? "Using demo location near Thompson Library"
        : "Simulated map location";

  return <>
    {stage === "idle" && <div id="group-reader-panel" className="reader-entry">
      {readerHandle}
      {notice && <p role="status" className="reader-notice">{notice}</p>}
      <button
        type="button"
        className="reader-qr-button"
        onClick={() => startScan("qr")}
      >
        <QrCode size={24} aria-hidden="true" />
        Scan QR Code
      </button>
      <button
        type="button"
        className="reader-tap-button"
        disabled={!readerLocation}
        onClick={() => startScan("nfc")}
      >
        <Nfc size={24} aria-hidden="true" />
        Tap BuckID Reader
      </button>
    </div>}
    {stage !== "idle" && <ReaderDialog
      key={stage}
      title={
        stage === "scanning"
          ? (scanMethod === "qr" ? "Scan Table QR Code" : "Tap your BuckID")
          : stage === "existing"
            ? joinError ? "Unable to join group" : allowed ? "Joining group…" : "Group unavailable"
            : "Create Group?"
      }
      onClose={cancel}
    >
      {stage === "scanning" ? <div className="reader-scanning">
        {scanMethod === "qr" ? <TableQrCamera /> : <>
        <div className="reader-animation" aria-hidden="true">
          <span />
          <span />
          <span />
          <Nfc size={42} />
        </div>
        <p role="status">Finding your table…</p>
        <div className="reader-progress" role="progressbar" aria-label="BuckID reader progress">
          <span style={{ animationDuration: `${scanMethod === "nfc" ? BUCKID_READER_DELAY_MS : DEMO_READER_DELAY_MS}ms` }} />
        </div>
        </>}
        <button type="button" className="reader-secondary" onClick={cancel}>Cancel</button>
      </div> : <>
        <p className="reader-caption reader-location">{stage === "create" ? "Thompson Library · Level 1" : sourceText} · {table?.label}</p>
        {stage === "existing" && (group ? <>
          <h3 className="reader-group-name">{group.name}</h3><p className="reader-study-status">{group.courseCode} · {group.topic}</p>
          <p className="reader-caption">{table?.status === "very-busy" ? "Full" : "Seats available"} · {seats?.availableSeats} of {seats?.totalSeats} seats available · {group.inviteOnly ? "Invite only" : "Open group"}</p>
          <GroupRoster group={group} />
          {!allowed && <p role="status" className="reader-invitation-required">{seats?.availableSeats === 0 ? "This table is full. Try another study group." : "An invitation from the host is required before you can join."}</p>}
          {allowed && !joinError && <p role="status" className="reader-caption">Joining your study group…</p>}
          {joinError && <><p role="alert" className="reader-invitation-required">{joinError}</p><button type="button" className="reader-primary" disabled={!allowed} onClick={() => { joinAttempt.current = null; setJoinError(null); }}>Retry join</button></>}
        </> : <p>This group is no longer posted. Close this popup and tap the reader again.</p>)}
        {stage === "create" && <form className="reader-create-form" onSubmit={(event) => {
          event.preventDefault();
          if (step < 2) { if ((step === 0 && name.trim()) || (step === 1 && courseCode)) setStep(step + 1); }
          else if (target && name.trim() && courseCode && validSeats) onCreate({ tableId: target.tableId, name, courseCode, inviteOnly, ...(availableSeats === undefined ? {} : { availableSeats }) });
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
          {step === 2 && <><p className="reader-create-summary"><strong>{name}</strong><span>{courseCode} · {table?.label}</span></p>
            <label className="reader-field" htmlFor="group-available-seats">Available seats (optional)
              <input id="group-available-seats" type="number" inputMode="numeric" min={0} max={MAX_AVAILABLE_SEATS} step={1}
                placeholder={String(DEFAULT_AVAILABLE_SEATS)} value={availableSeatsInput} onChange={(event) => setAvailableSeatsInput(event.target.value)}
                aria-describedby="group-available-seats-help" aria-invalid={!validSeats} />
            </label>
            <p id="group-available-seats-help" className="reader-caption">Open seats besides you. Leave blank for {DEFAULT_AVAILABLE_SEATS}.</p>
            {!validSeats && <p role="alert" className="reader-invitation-required">Enter a whole number from 0 to {MAX_AVAILABLE_SEATS}.</p>}
            <label className="reader-invite-toggle"><span>Invite only</span><input type="checkbox" checked={inviteOnly} onChange={(event) => setInviteOnly(event.target.checked)} /></label></>}
          <div className="reader-form-actions">{step > 0 && <button type="button" className="reader-secondary" onClick={() => setStep(step - 1)}><ArrowLeft size={16} />Back</button>}<button type="submit" className="reader-primary" disabled={step === 0 ? !name.trim() : !courseCode || (step === 2 && !validSeats)}>{step === 2 ? "Create" : "Next"}</button></div>
        </form>}
      </>}
    </ReaderDialog>}
  </>;
}

export function CurrentGroupPanel({ group, table, profileId, notice, onInvite, onGpsLeave, onEnd, children }: {
  group: DemoStudyGroup; table: ThompsonTable; profileId: string; notice: string;
  onInvite: (profileId: string) => void; onGpsLeave: () => void; onEnd: () => void; children?: ReactNode;
}) {
  const [search, setSearch] = useState("");
  const seats = groupSeatCounts(group);
  const members = [group.host, ...group.members];
  const candidates = search.trim() ? MOCK_PROFILES.filter((profile) => `${profile.name} ${profile.id}`.toLowerCase().includes(search.trim().toLowerCase()) && !members.some((member) => member.id === profile.id)) : [];
  return <section className="current-group-details" aria-label="Current study group">
    {notice && <p role="status" className="reader-notice">{notice}</p>}
    <p className="reader-study-status">{group.courseCode} · {group.topic}</p>
    <p className="reader-caption">{table.label} · {table.status === "very-busy" ? "Full" : "Seats available"} · {seats.availableSeats} of {seats.totalSeats} seats available · {group.inviteOnly ? "Invite only" : "Open group"}</p>
    <GroupRoster group={group} />
    {group.host.id === profileId && group.inviteOnly && <section className="current-group-invites" aria-label="Host invitations">
      <label className="reader-field">Invite a student<input type="search" placeholder="Search by name or profile ID" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
      {candidates.map((profile) => <div className="reader-invite-result" key={profile.id}><span>{profile.name}</span><button type="button" className="reader-secondary" disabled={group.invitedProfileIds.includes(profile.id)} onClick={() => onInvite(profile.id)}>{group.invitedProfileIds.includes(profile.id) ? "Invited" : "Invite"}</button></div>)}
      {search.trim() && !candidates.length && <p className="reader-caption">No other demo students match that name or profile ID.</p>}
      <p className="reader-caption">Local demo invitations · invited students join when they scan the table.</p>
    </section>}
    {children && <div className="current-group-notebook"><h3 className="paper-title">Shared Group Notebook</h3>{children}</div>}
    <button type="button" className="reader-secondary group-gps-trigger" onClick={onGpsLeave}>Simulate Walking Away (GPS Trigger)</button>
    {group.host.id === profileId && <button type="button" className="reader-secondary group-end-session" onClick={onEnd}>End session</button>}
  </section>;
}
