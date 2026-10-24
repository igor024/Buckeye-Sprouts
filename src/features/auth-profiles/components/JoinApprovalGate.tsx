"use client";

import { useCallback, useEffect, useState } from "react";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import type { JoinRequestPreview, SessionDetail, SessionPreview } from "@/types/contracts";
import { getDemoJoinStatusAction, requestDemoJoinAction } from "../actions";

/** Receives only discovery-safe fields. The route must fetch private details after server-confirmed access. */
export function JoinApprovalGate({ session, access, demoMode = false }: {
  session: SessionPreview;
  access: SessionDetail["access"];
  demoMode?: boolean;
}) {
  const [request, setRequest] = useState<JoinRequestPreview | null>(null);
  const [loading, setLoading] = useState(demoMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const refreshStatus = useCallback(async () => {
    if (!demoMode) return;
    setLoading(true);
    setError("");
    try { setRequest(await getDemoJoinStatusAction(session.id)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not load the demo request."); }
    finally { setLoading(false); }
  }, [demoMode, session.id]);

  useEffect(() => { void refreshStatus(); }, [refreshStatus]);

  async function requestSeat() {
    if (submitting) return;
    setSubmitting(true);
    setError("");
    try { setRequest(await requestDemoJoinAction(session.id)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not request this seat."); }
    finally { setSubmitting(false); }
  }

  const canRequest = session.requiresApproval && session.status !== "closed" && session.availableSeats > 0 && !request;
  return (
    <section className="panel" aria-labelledby={`access-title-${session.id}`}>
      <div className="panel-heading">{access === "locked" ? <LockKeyhole size={18} /> : <ShieldCheck size={18} />}<h2 id={`access-title-${session.id}`}>Table access</h2></div>
      {access === "locked" ? <p className="muted mt-4">Exact table, photo, and GPS details are private until the host approves your request.</p> :
        <p className="muted mt-4">{access === "host" ? "You host this group." : "Your request was approved."} Private table details are fetched through server-confirmed session access.</p>}
      {access === "locked" && !demoMode && session.requiresApproval && <p className="text-xs text-stone-500 mt-3">Sign in to request a seat. Live requests require the authenticated service connection.</p>}
      {demoMode && <div className="mt-4 border-t border-stone-200 pt-4">
        <p className="text-xs font-semibold text-red-800">Test mode · Sam Patel is a synthetic requester</p>
        <p className="text-xs text-stone-500 mt-2">This simulation uses local process memory and does not prove student identity.</p>
        {loading ? <p className="text-xs text-stone-500 mt-3" role="status">Loading demo request…</p> :
          request ? <p className="text-sm mt-3" role="status">Sam&apos;s request is <strong>{request.status}</strong>.</p> :
          <p className="text-xs text-stone-500 mt-3">Sam has not requested this seat.</p>}
        {canRequest && <button type="button" className="button-primary w-full mt-3" onClick={requestSeat} disabled={loading || submitting}>{submitting ? "Requesting…" : "Simulate request to sit here"}</button>}
        {!canRequest && !request && <p className="text-xs text-stone-500 mt-3">{session.requiresApproval ? "No seats are available for new requests." : "This group does not require host approval."}</p>}
        <button type="button" className="button-secondary w-full mt-3" onClick={() => void refreshStatus()} disabled={loading || submitting}>Refresh Sam&apos;s status</button>
      </div>}
      {error && <p className="text-sm text-red-800 mt-3" role="alert">{error}</p>}
    </section>
  );
}
