"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { RotateCw, Send, Sparkles, X } from "lucide-react";
import { GroupFinderMascot } from "./GroupFinderMascot";
import type { DemoStudyGroup } from "@/types/contracts";
import { basicGroupMatches, conversationWindow, finderGroupsFromMap } from "../group-finder/matching";
import { finderResponseSchema } from "../group-finder/schemas";
import type { FinderMatch, FinderMessage, FinderResponse } from "../group-finder/types";
import "../group-finder/group-finder.css";

interface ChatTurn extends FinderMessage { result?: FinderResponse }
interface Props {
  isOpen: boolean;
  onClose: () => void;
  groups: readonly DemoStudyGroup[];
  onViewGroup: (sessionId: string, trigger: HTMLElement, signal: AbortSignal, allowCached: boolean) => Promise<string | null>;
}

export function GroupFinderDialog({ isOpen, onClose, groups, onViewGroup }: Props) {
  const titleId = useId();
  const panel = useRef<HTMLElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const transcript = useRef<HTMLDivElement>(null);
  const request = useRef<AbortController | null>(null);
  const selection = useRef<AbortController | null>(null);
  const close = useRef(onClose);
  close.current = onClose;
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [viewing, setViewing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialog = panel.current;
    input.current?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); close.current(); }
      if (event.key !== "Tab") return;
      const controls = dialog?.querySelectorAll<HTMLElement>('button:not(:disabled), textarea:not(:disabled), a[href]');
      if (!controls?.length) return;
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("keydown", handleKey);
      request.current?.abort(); selection.current?.abort();
      request.current = null; selection.current = null;
      setBusy(false); setViewing(null);
      if (opener?.isConnected && (dialog?.contains(document.activeElement) || document.activeElement === document.body)) opener.focus();
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && transcript.current) transcript.current.scrollTop = transcript.current.scrollHeight;
  }, [isOpen, turns, busy]);

  async function sendPrompt(text = draft, retry = false) {
    if (request.current || selection.current) return;
    const nextTurns: ChatTurn[] = retry
      ? (turns.at(-1)?.role === "assistant" ? turns.slice(0, -1) : [...turns])
      : [...turns, { role: "user", content: text.trim() }];
    if (!nextTurns.length || nextTurns.at(-1)?.role !== "user" || !nextTurns.at(-1)?.content.trim()) return;
    const messages = conversationWindow(nextTurns.map(({ role, content }) => ({ role, content })));
    const controller = new AbortController();
    request.current = controller;
    setTurns(nextTurns); setDraft(""); setBusy(true); setError(null);
    try {
      let result: FinderResponse;
      try {
        const response = await fetch("/api/ai/find-groups", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages }),
          signal: controller.signal, cache: "no-store",
        });
        if (!response.ok) throw new Error("Group search unavailable");
        result = finderResponseSchema.parse(await response.json());
      } catch {
        if (controller.signal.aborted) return;
        result = {
          ...basicGroupMatches(messages, finderGroupsFromMap(groups)), source: "basic", dataSource: "cached",
          notice: "Live search is unavailable. These basic matches use cached map data; availability may have changed.",
        };
      }
      if (!controller.signal.aborted) setTurns([...nextTurns, { role: "assistant", content: result.reply, result }]);
    } finally {
      if (request.current === controller) { request.current = null; setBusy(false); input.current?.focus(); }
    }
  }

  async function viewGroup(match: FinderMatch, result: FinderResponse, trigger: HTMLElement) {
    if (request.current || selection.current) return;
    const controller = new AbortController();
    selection.current = controller; setViewing(match.sessionId); setError(null);
    try {
      let verified = false;
      try {
        const response = await fetch(`/api/ai/find-groups?sessionId=${encodeURIComponent(match.sessionId)}`, { cache: "no-store", signal: controller.signal });
        if (response.status === 409) {
          setError("This group is no longer open or its last seat has been taken. Try another search.");
          return;
        }
        verified = response.ok;
      } catch { if (controller.signal.aborted) return; }
      if (!verified && result.dataSource !== "cached") { setError("Couldn't verify current availability. Please retry."); return; }
      const message = await onViewGroup(match.sessionId, trigger, controller.signal, result.dataSource === "cached" && !verified);
      if (controller.signal.aborted) return;
      if (message) setError(message);
      else close.current();
    } catch {
      if (!controller.signal.aborted) setError("Couldn't open that group. Please retry or refresh the map.");
    } finally {
      if (selection.current === controller) { selection.current = null; setViewing(null); }
    }
  }

  function newChat() {
    request.current?.abort(); selection.current?.abort(); request.current = null; selection.current = null;
    setTurns([]); setDraft(""); setBusy(false); setViewing(null); setError(null); input.current?.focus();
  }

  if (!isOpen) return null;
  return createPortal(<div className="app-dialog-backdrop finder-backdrop" onClick={onClose}>
    <section ref={panel} className="app-dialog-panel finder-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId} onClick={(event) => event.stopPropagation()}>
      <header className="finder-heading">
        <div><p className="finder-eyebrow"><Sparkles size={14} aria-hidden="true" /> THOMPSON · LEVEL 1</p><h2 id={titleId}>Find your study group</h2></div>
        <button type="button" className="finder-icon-button" aria-label="Close group finder" onClick={onClose}><X size={20} /></button>
      </header>
      <div className="finder-toolbar"><p>Tell me your course, topic, or how many seats you need.</p><button type="button" onClick={newChat}>New chat</button></div>
      <div ref={transcript} className="finder-transcript" role="log" aria-label="Group finder conversation" aria-live="polite">
        {!turns.length && <div className="finder-welcome">
          <div className="finder-welcome-intro"><GroupFinderMascot variant="welcome" /><div><span className="finder-welcome-label">Your Buckeye Sprouts study assistant</span><p>What would help you study today?</p></div></div>
          {['CSE 2221 recursion', 'Calculus with room for two', 'Open groups with 3 seats'].map((example) => <button type="button" key={example} onClick={() => void sendPrompt(example)}>{example}</button>)}
        </div>}
        {turns.map((turn, index) => <div key={index} className={`finder-turn finder-turn-${turn.role}`}>
          <p className="finder-speaker">{turn.role === "assistant" && <GroupFinderMascot variant="avatar" />}{turn.role === "user" ? "You" : turn.result?.source === "gemini" ? "Gemini" : "Basic matching"}
            {turn.result && <span className="finder-source">{turn.result.dataSource === "database" ? "Live groups" : "Cached map data"}</span>}
          </p>
          <p className="finder-message">{turn.content}</p>
          {turn.result?.notice && <p className="finder-notice">{turn.result.notice}</p>}
          {turn.result?.matches.map((match) => <article className="finder-match" key={match.sessionId}>
            <span className="finder-course">{match.group.courseCode}</span><h3>{match.group.title}</h3><p>{match.reason}</p>
            <p className="finder-match-meta">{match.group.availableSeats} of {match.group.totalSeats} seats open · {match.group.requiresApproval ? "Invitation / approval required" : "Open group"}</p>
            <button type="button" disabled={busy || viewing !== null} onClick={(event) => void viewGroup(match, turn.result!, event.currentTarget)}>{viewing === match.sessionId ? "Checking availability…" : "View group"}</button>
          </article>)}
          {turn.result?.asOf && <p className="finder-timestamp">Availability checked at {new Date(turn.result.asOf).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}.</p>}
          {index === turns.length - 1 && turn.result?.source === "basic" && <button type="button" className="finder-retry" disabled={busy || viewing !== null} onClick={() => void sendPrompt("", true)}><RotateCw size={14} /> Retry AI</button>}
        </div>)}
        {busy && <p className="finder-pending" role="status"><Sparkles size={16} /> Finding open study groups…</p>}
      </div>
      {error && <p className="finder-error" role="alert">{error}</p>}
      {!busy && turns.at(-1)?.role === "user" && <button type="button" className="finder-retry" onClick={() => void sendPrompt("", true)}>Retry search</button>}
      <form className="finder-composer" onSubmit={(event) => { event.preventDefault(); void sendPrompt(); }}>
        <label className="sr-only" htmlFor={`${titleId}-prompt`}>Describe the study group you need</label>
        <textarea ref={input} id={`${titleId}-prompt`} value={draft} maxLength={2000} rows={2} placeholder="Describe your ideal study group…"
          onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); void sendPrompt(); }
          }} />
        <button type="submit" disabled={busy || viewing !== null || !draft.trim()} aria-label="Send group finder prompt"><Send size={19} /></button>
      </form>
    </section>
  </div>, document.body);
}
