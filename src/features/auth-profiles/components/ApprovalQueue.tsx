"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  BookOpen,
  Check,
  CheckCircle2,
  Clock,
  Crown,
  GraduationCap,
  RefreshCw,
  Sparkles,
  UserCheck,
  UserRoundCheck,
  Users,
  X,
  XCircle,
} from "lucide-react";
import type { JoinRequestPreview, SessionPreview } from "@/types/contracts";
import { useAuth } from "../context/AuthContext";
import { reviewDemoJoinAction, simulateIncomingJoinAction } from "../actions";

export interface ApprovalQueueProps {
  requests: JoinRequestPreview[];
  isHost?: boolean;
  session?: SessionPreview;
  sessionId?: string;
}

export function ApprovalQueue({
  requests: initialRequests,
  isHost: isHostProp = false,
  session,
  sessionId: explicitSessionId,
}: ApprovalQueueProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [, startTransition] = useTransition();

  const targetSessionId = explicitSessionId || session?.id || initialRequests[0]?.sessionId || "";

  // Dynamic host determination: SSR host, client Supabase user match, or Judge simulator override
  const isRealHost = Boolean(user?.id && session?.hostId && user.id === session.hostId);
  const [demoHostOverride, setDemoHostOverride] = useState(false);
  const effectiveHost = isHostProp || isRealHost || demoHostOverride;

  const [requests, setRequests] = useState<JoinRequestPreview[]>(initialRequests);
  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "all">("pending");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Keep internal list synchronized if prop updates
  useEffect(() => {
    setRequests(initialRequests);
  }, [initialRequests]);

  const pendingList = requests.filter((r) => r.status === "pending");
  const approvedList = requests.filter((r) => r.status === "approved");
  const displayedRequests =
    activeTab === "pending"
      ? pendingList
      : activeTab === "approved"
        ? approvedList
        : requests;

  // Refresh queue from server/database
  async function handleRefreshQueue() {
    if (!targetSessionId || refreshing) return;
    setRefreshing(true);
    setError(null);
    try {
      const res = await fetch(`/api/sessions/${targetSessionId}/join`);
      if (!res.ok) throw new Error("Failed to refresh requests.");
      const data = await res.json();
      if (Array.isArray(data.requests)) {
        setRequests(data.requests);
        setMessage("Queue updated with latest requests.");
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not refresh queue.");
    } finally {
      setRefreshing(false);
    }
  }

  // Host reviews a request: approve or decline
  async function review(request: JoinRequestPreview, decision: "approved" | "rejected") {
    if (!effectiveHost || busyId) return;
    setBusyId(request.id);
    setError(null);
    setMessage(null);

    try {
      const updated = await reviewDemoJoinAction(request.id, decision);
      setRequests((current) =>
        current.map((item) => (item.id === updated.id ? updated : item))
      );

      if (decision === "approved") {
        setMessage(
          `🎉 Approved ${request.requesterProfile.name}! One seat reserved; table anchor and live notebook unlocked.`
        );
      } else {
        setMessage(
          `Declined request from ${request.requesterProfile.name}. Table capacity unchanged.`
        );
      }

      startTransition(() => {
        router.refresh();
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not review this request.");
    } finally {
      setBusyId(null);
    }
  }

  // Judge simulation: inject an incoming join request to test the host approval flow
  async function handleSimulateIncoming() {
    if (!targetSessionId || simulating) return;
    setSimulating(true);
    setError(null);
    setMessage(null);

    try {
      const simulated = await simulateIncomingJoinAction(targetSessionId, requests.length + 1);
      setRequests((current) => [
        simulated,
        ...current.filter((item) => item.id !== simulated.id),
      ]);
      setActiveTab("pending");
      setMessage(
        `⚡ Simulated incoming request from ${simulated.requesterProfile.name} (${simulated.requesterProfile.major})!`
      );
      startTransition(() => {
        router.refresh();
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not simulate request.");
    } finally {
      setSimulating(false);
    }
  }

  return (
    <section className="panel" aria-labelledby="approval-title">
      {/* Panel Header */}
      <div className="panel-heading flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UserRoundCheck size={18} className="text-red-800" />
          <h2 id="approval-title" className="font-semibold text-base">
            Host Approval Queue
          </h2>
        </div>
        {effectiveHost && (
          <span
            className="tag tag-scarlet font-semibold inline-flex items-center gap-1"
            aria-label={`${pendingList.length} pending requests`}
          >
            <Clock size={11} />
            <span>{pendingList.length} Pending</span>
          </span>
        )}
      </div>

      {/* Non-host view: explain privacy & offer Judge Demo switch */}
      {!effectiveHost ? (
        <div className="mt-4 space-y-3.5">
          <p className="text-xs text-stone-600 leading-relaxed">
            Seat requests are managed privately by the study group host to ensure psychological safety and prevent overcrowded tables.
          </p>

          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-600">
            <p className="font-semibold text-stone-800 flex items-center gap-1.5">
              <UserCheck size={14} className="text-stone-700" />
              Private Host Access
            </p>
            <p className="mt-1 text-[11px] text-stone-500">
              Sign in with the host account to review incoming studier requests in real time.
            </p>
          </div>

          {/* Frictionless Judge Simulator Toggle */}
          <button
            type="button"
            onClick={() => setDemoHostOverride(true)}
            className="w-full py-2.5 px-3 rounded-xl border border-red-800/80 bg-red-50/70 hover:bg-red-50 text-red-900 text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer shadow-xs hover:shadow-md"
            title="Enable judge demo mode to test host approval actions without signing in"
          >
            <Crown size={14} className="text-red-800" />
            <span>👑 Judge Mode: Evaluate as Session Host</span>
          </button>
        </div>
      ) : (
        /* Host Approval Management Interface */
        <div className="mt-4 space-y-4">
          {/* Judge Mode Notice Banner (if enabled via override) */}
          {demoHostOverride && !isRealHost && !isHostProp && (
            <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 truncate">
                <Crown size={13} className="text-amber-700 shrink-0" />
                <span className="truncate">
                  <strong>Judge Mode Active:</strong> You have host review permissions.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setDemoHostOverride(false)}
                className="text-[11px] underline text-amber-800 hover:text-amber-950 shrink-0 font-medium cursor-pointer"
              >
                Exit
              </button>
            </div>
          )}

          {/* Seat Capacity Status Banner */}
          {session && (
            <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200 text-xs flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-stone-700">
                <Users size={14} className="text-stone-500" />
                <span>Table Availability:</span>
              </div>
              <span
                className={`font-semibold ${
                  session.availableSeats > 0 ? "text-emerald-700" : "text-red-700"
                }`}
              >
                {session.availableSeats} of {session.totalSeats} seats open
              </span>
            </div>
          )}

          {/* Queue Filter Tabs & Action Bar */}
          <div className="flex items-center justify-between gap-2 border-b border-stone-200 pb-2">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveTab("pending")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  activeTab === "pending"
                    ? "bg-red-800 text-white"
                    : "text-stone-600 hover:bg-stone-100"
                }`}
              >
                Pending ({pendingList.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("approved")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  activeTab === "approved"
                    ? "bg-red-800 text-white"
                    : "text-stone-600 hover:bg-stone-100"
                }`}
              >
                Approved ({approvedList.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  activeTab === "all"
                    ? "bg-red-800 text-white"
                    : "text-stone-600 hover:bg-stone-100"
                }`}
              >
                All ({requests.length})
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleRefreshQueue}
                disabled={refreshing}
                className="p-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-100 transition cursor-pointer disabled:opacity-50"
                title="Refresh requests queue"
                aria-label="Refresh requests queue"
              >
                <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
              </button>
            </div>
          </div>

          {/* Quick Simulation Bar for Hackathon Judges */}
          <div className="flex items-center justify-between gap-2 p-2 bg-red-50/50 rounded-xl border border-red-200/50 text-[11px]">
            <span className="text-red-900 font-medium flex items-center gap-1">
              <Sparkles size={12} className="text-red-800" />
              Judge Testing Hook:
            </span>
            <button
              type="button"
              onClick={handleSimulateIncoming}
              disabled={simulating}
              className="px-2 py-0.5 rounded-md bg-white border border-red-300 text-red-800 hover:bg-red-50 font-semibold cursor-pointer transition disabled:opacity-50 inline-flex items-center gap-1"
            >
              {simulating ? "Injecting…" : "+ Simulate Incoming Request"}
            </button>
          </div>

          {/* Feedback Messages */}
          {error && (
            <div
              className="p-2.5 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-center gap-2"
              role="alert"
            >
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {message && (
            <div
              className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2"
              role="status"
            >
              <CheckCircle2 size={15} className="shrink-0 text-emerald-600" />
              <span>{message}</span>
            </div>
          )}

          {/* Empty State */}
          {displayedRequests.length === 0 && (
            <div className="py-6 px-4 text-center border border-dashed border-stone-200 rounded-xl bg-stone-50/50">
              <UserRoundCheck size={28} className="mx-auto text-stone-400 mb-2" />
              <p className="text-xs font-semibold text-stone-700">
                {activeTab === "pending"
                  ? "Approval queue is clear"
                  : activeTab === "approved"
                    ? "No approved studiers yet"
                    : "No join requests recorded"}
              </p>
              <p className="text-[11px] text-stone-500 mt-1 max-w-xs mx-auto">
                {activeTab === "pending"
                  ? "When Buckeyes nearby request a seat at your table, they will appear here with their major and course load."
                  : "Approved studiers will have table details and notebook collaboration unlocked."}
              </p>
              {activeTab === "pending" && (
                <button
                  type="button"
                  onClick={handleSimulateIncoming}
                  disabled={simulating}
                  className="mt-3 button-secondary text-xs inline-flex items-center gap-1.5 py-1.5 px-3 cursor-pointer"
                >
                  <Sparkles size={12} className="text-red-800" />
                  <span>Simulate a Test Request</span>
                </button>
              )}
            </div>
          )}

          {/* Requester Cards List */}
          <div className="space-y-3">
            {displayedRequests.map((request) => {
              const isPending = request.status === "pending";
              const isApproved = request.status === "approved";
              const isDeclined = request.status === "rejected";
              const isCurrentBusy = busyId === request.id;

              // Check if requester is taking the same course as this session
              const matchesCourse =
                session?.courseCode &&
                request.requesterProfile.currentCourses?.includes(session.courseCode);

              // Get initials for avatar
              const initials = request.requesterProfile.name
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")
                .toUpperCase();

              return (
                <div
                  key={request.id}
                  className={`p-3.5 rounded-xl border transition ${
                    isPending
                      ? "bg-white border-stone-200 shadow-xs hover:border-red-300"
                      : isApproved
                        ? "bg-emerald-50/40 border-emerald-200/80"
                        : "bg-stone-50 border-stone-200 opacity-75"
                  }`}
                >
                  {/* Card Header: Avatar, Name, Rank, Status Pill */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-[#a51c30] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                        {initials || "OS"}
                      </div>
                      <div>
                        <h3 className="font-semibold text-xs text-stone-900 leading-tight">
                          {request.requesterProfile.name}
                        </h3>
                        <p className="text-[11px] text-stone-500 mt-0.5 flex items-center gap-1">
                          <GraduationCap size={12} className="text-stone-400" />
                          <span>{request.requesterProfile.major || "Undergraduate"}</span>
                        </p>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1 shrink-0 ${
                        isApproved
                          ? "bg-emerald-100 text-emerald-800"
                          : isDeclined
                            ? "bg-stone-200 text-stone-700"
                            : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {isApproved ? (
                        <>
                          <CheckCircle2 size={11} />
                          <span>Approved</span>
                        </>
                      ) : isDeclined ? (
                        <>
                          <XCircle size={11} />
                          <span>Declined</span>
                        </>
                      ) : (
                        <>
                          <Clock size={11} />
                          <span>Pending</span>
                        </>
                      )}
                    </span>
                  </div>

                  {/* Course Tags & Alignment Indicator */}
                  <div className="mt-2.5 flex flex-wrap gap-1 items-center">
                    {matchesCourse && (
                      <span className="tag tag-scarlet font-semibold inline-flex items-center gap-1 text-[10px]">
                        <BookOpen size={10} />
                        <span>Enrolled in {session?.courseCode}</span>
                      </span>
                    )}
                    {request.requesterProfile.currentCourses
                      ?.filter((c) => c !== session?.courseCode)
                      .slice(0, 3)
                      .map((course) => (
                        <span
                          key={course}
                          className="tag font-mono text-[10px] bg-stone-100 text-stone-600"
                        >
                          {course}
                        </span>
                      ))}
                  </div>

                  {/* Bio / Message Note from Student */}
                  {request.requesterProfile.bio && (
                    <p className="text-xs text-stone-600 leading-relaxed mt-2.5 p-2 bg-stone-50 rounded-lg border border-stone-100 italic">
                      &ldquo;{request.requesterProfile.bio}&rdquo;
                    </p>
                  )}

                  {/* Action Buttons for Pending Requests */}
                  {isPending && (
                    <div className="flex items-center gap-2 mt-3.5 pt-3 border-t border-stone-100">
                      <button
                        type="button"
                        disabled={!!busyId}
                        onClick={() => review(request, "approved")}
                        className="button-primary flex-1 text-xs py-2 inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-xs hover:shadow-md transition"
                        aria-label={`Approve ${request.requesterProfile.name}`}
                      >
                        {isCurrentBusy ? (
                          <>
                            <span className="animate-spin inline-block size-3 border-2 border-white border-t-transparent rounded-full" />
                            <span>Reserving Seat…</span>
                          </>
                        ) : (
                          <>
                            <Check size={14} />
                            <span>Approve (Reserve 1 Seat)</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        disabled={!!busyId}
                        onClick={() => review(request, "rejected")}
                        className="button-secondary text-xs py-2 px-3 inline-flex items-center justify-center gap-1 cursor-pointer hover:bg-stone-100 transition"
                        aria-label={`Decline ${request.requesterProfile.name}`}
                      >
                        <X size={14} />
                        <span>Decline</span>
                      </button>
                    </div>
                  )}

                  {/* Approved Confirmation Pill */}
                  {isApproved && (
                    <div className="mt-2.5 text-[11px] text-emerald-800 flex items-center gap-1.5 font-medium">
                      <CheckCircle2 size={13} className="text-emerald-600" />
                      <span>Seat confirmed. Table coordinates & notebook unlocked.</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
