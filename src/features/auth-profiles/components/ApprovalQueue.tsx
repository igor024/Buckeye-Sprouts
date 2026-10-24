import { Check, UserRoundCheck, X } from "lucide-react";
import type { JoinRequestPreview } from "@/types/contracts";

export function ApprovalQueue({ requests, isHost }: { requests: JoinRequestPreview[]; isHost: boolean }) {
  const pending = requests.filter((request) => request.status === "pending");
  return (
    <section className="panel" aria-labelledby="approval-title">
      <div className="panel-heading"><UserRoundCheck size={18} /><h2 id="approval-title">Join requests</h2><span className="tag ml-auto">{pending.length}</span></div>
      {!isHost ? <p className="muted mt-4">Only the host can review requests.</p> : pending.length === 0 ? <p className="muted mt-4">Your approval queue is clear.</p> : pending.map((request) => (
        <div className="mt-5" key={request.id}>
          <h3 className="font-semibold text-sm">{request.requesterProfile.name}</h3>
          <p className="text-xs text-stone-500 mt-1">{request.requesterProfile.major}</p>
          <p className="text-sm text-stone-600 leading-6 mt-3">{request.requesterProfile.bio}</p>
          <div className="flex gap-2 mt-4"><button disabled className="button-primary flex-1"><Check size={15} />Approve</button><button disabled className="button-secondary" aria-label={`Reject ${request.requesterProfile.name}`}><X size={15} /></button></div>
          <p className="stub-note">Approval actions are scaffold stubs.</p>
        </div>
      ))}
    </section>
  );
}
