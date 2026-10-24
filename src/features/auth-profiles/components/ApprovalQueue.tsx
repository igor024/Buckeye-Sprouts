"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, UserRoundCheck, X } from "lucide-react";
import type { JoinRequestPreview } from "@/types/contracts";
import { reviewDemoJoinAction } from "../actions";

export function ApprovalQueue({ requests: initialRequests, isHost }: { requests: JoinRequestPreview[]; isHost: boolean }) {
  const router = useRouter();
  const [requests, setRequests] = useState(initialRequests);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const pending = isHost ? requests.filter((request) => request.status === "pending") : [];

  useEffect(() => { setRequests(initialRequests); }, [initialRequests]);

  async function review(request: JoinRequestPreview, decision: "approved" | "rejected") {
    if (!isHost || busyId) return;
    setBusyId(request.id);
    setError("");
    setMessage("");
    try {
      const updated = await reviewDemoJoinAction(request.id, decision);
      setRequests((current) => current.map((item) => item.id === updated.id ? updated : item));
      setMessage(`${request.requesterProfile.name}'s demo request ${decision === "approved" ? "approved; one seat reserved" : "declined; no seat reserved"}.`);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not review this request.");
    } finally { setBusyId(null); }
  }

  return (
    <section className="panel" aria-labelledby="approval-title">
      <div className="panel-heading"><UserRoundCheck size={18} /><h2 id="approval-title">Join requests</h2>{isHost && <span className="tag ml-auto" aria-label={`${pending.length} pending requests`}>{pending.length}</span>}</div>
      {!isHost ? <p className="muted mt-4">Only the host can review requests.</p> : <>
        <p className="text-xs text-stone-500 mt-3">Demo approvals reserve a synthetic seat. Table details become available only through the session access service.</p>
        {pending.length === 0 ? <p className="muted mt-4">Your approval queue is clear.</p> : pending.map((request) => (
          <div className="mt-5 border-t border-stone-200 pt-4" key={request.id}>
            <h3 className="font-semibold text-sm">{request.requesterProfile.name}</h3>
            <p className="text-xs text-stone-500 mt-1">{request.requesterProfile.major}</p>
            <p className="text-sm text-stone-600 leading-6 mt-3">{request.requesterProfile.bio}</p>
            <div className="flex gap-2 mt-4">
              <button type="button" disabled={!!busyId} onClick={() => review(request, "approved")} className="button-primary flex-1" aria-label={`Approve ${request.requesterProfile.name}`}><Check size={15} />{busyId === request.id ? "Saving…" : "Approve"}</button>
              <button type="button" disabled={!!busyId} onClick={() => review(request, "rejected")} className="button-secondary" aria-label={`Decline ${request.requesterProfile.name}`}><X size={15} />Decline</button>
            </div>
          </div>
        ))}
      </>}
      {error && <p className="text-sm text-red-800 mt-3" role="alert">{error}</p>}
      {message && <p className="text-sm text-green-800 mt-3" role="status">{message}</p>}
    </section>
  );
}
