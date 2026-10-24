"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  HelpCircle,
  LockKeyhole,
  LogIn,
  RefreshCw,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UserCheck,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";
import type { JoinRequestPreview, SessionDetail, SessionPreview } from "@/types/contracts";
import { useAuth } from "../context/AuthContext";
import { getDemoJoinStatusAction, requestDemoJoinAction } from "../actions";

const QUICK_GREETINGS = [
  "Working on homework",
  "Exam & midterm review",
  "Working on practice problems",
  "Quiet study buddy",
];

interface JoinApprovalGateProps {
  session: SessionPreview;
  access: SessionDetail["access"];
  demoMode?: boolean;
}

export function JoinApprovalGate({ session, access, demoMode = false }: JoinApprovalGateProps) {
  const router = useRouter();
  const { user, profile, openModal, session: authSession } = useAuth();

  const [request, setRequest] = useState<JoinRequestPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedGreeting, setSelectedGreeting] = useState<string>("");
  const [customNote, setCustomNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Check current request status for this session
  const refreshStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Try real Supabase check if logged in
      if (user && authSession?.access_token) {
        const res = await fetch(`/api/sessions/${session.id}/join`, {
          headers: {
            Authorization: `Bearer ${authSession.access_token}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setRequest(data?.request ?? null);
          return;
        }
      }

      // 2. Fall back to demo status check
      const demoReq = await getDemoJoinStatusAction(session.id);
      setRequest(demoReq);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load join request status.");
    } finally {
      setLoading(false);
    }
  }, [user, authSession, session.id]);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  // Submit join request
  async function handleRequestSeat(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError(null);
    setSuccessNotice(null);

    try {
      // Path A: Authenticated user with live database
      if (user && authSession?.access_token) {
        const res = await fetch(`/api/sessions/${session.id}/join`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authSession.access_token}`,
          },
          body: JSON.stringify({
            note: selectedGreeting || customNote.trim() || undefined,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.error?.message || "Failed to send join request.");
        }

        setRequest(data.request || data);
        setSuccessNotice("Join request sent to the host!");
        router.refresh();
        return;
      }

      // Path B: Demo simulation (Sam Patel)
      const demoReq = await requestDemoJoinAction(session.id);
      setRequest(demoReq);
      setSuccessNotice("Demo request submitted as Sam Patel!");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not request this seat.");
    } finally {
      setSubmitting(false);
    }
  }

  const isClosed = session.status === "closed";
  const isFull = session.availableSeats <= 0;
  const canSubmit = !isClosed && !isFull && !request && !loading;

  return (
    <section className="panel" aria-labelledby={`access-title-${session.id}`}>
      {/* Panel Heading */}
      <div className="panel-heading flex items-center justify-between">
        <div className="flex items-center gap-2">
          {access === "locked" ? (
            <LockKeyhole size={18} className="text-amber-600" />
          ) : (
            <ShieldCheck size={18} className="text-emerald-700" />
          )}
          <h2 id={`access-title-${session.id}`} className="font-semibold text-base">
            Table Access
          </h2>
        </div>
        <span
          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
            access === "host"
              ? "bg-red-100 text-red-800"
              : access === "member"
                ? "bg-emerald-100 text-emerald-800"
                : "bg-amber-100 text-amber-800"
          }`}
        >
          {access === "host" ? "You Host" : access === "member" ? "Approved Member" : "Locked"}
        </span>
      </div>

      {/* Access Explanation */}
      {access === "host" && (
        <div className="mt-3 p-3 bg-red-50/70 rounded-xl border border-red-200/60 text-xs text-red-900 leading-relaxed">
          <p className="font-semibold flex items-center gap-1.5">
            <UserCheck size={14} className="text-red-800 shrink-0" />
            You are hosting this study group.
          </p>
          <p className="mt-1 text-red-800/90">
            Your table location and surroundings photo are active. Incoming requests from peers will appear in your queue below.
          </p>
        </div>
      )}

      {access === "member" && (
        <div className="mt-3 p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 leading-relaxed">
          <p className="font-semibold flex items-center gap-1.5">
            <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
            Your request was approved!
          </p>
          <p className="mt-1 text-emerald-800">
            Table anchor and live notebook access are now unlocked for you. Welcome to the group!
          </p>
        </div>
      )}

      {access === "locked" && (
        <div className="mt-3 space-y-4">
          <p className="text-xs text-stone-600 leading-relaxed">
            Exact table anchor (<span className="blur-xs select-none font-mono">TH-304-B</span>), GPS coordinates, and crowd photos remain protected until the host approves your seat.
          </p>

          {/* Seat Capacity Bar */}
          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-medium text-stone-700 flex items-center gap-1.5">
                <Users size={13} className="text-stone-500" />
                Available Seats
              </span>
              <strong className={isFull ? "text-red-700" : "text-emerald-700 font-bold"}>
                {session.availableSeats} of {session.totalSeats} open
              </strong>
            </div>
            <div className="w-full bg-stone-200 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  isFull ? "bg-red-600" : "bg-emerald-600"
                }`}
                style={{
                  width: `${Math.min(100, Math.max(0, ((session.totalSeats - session.availableSeats) / session.totalSeats) * 100))}%`,
                }}
              />
            </div>
          </div>

          {/* Active Request Status Box */}
          {request && (
            <div
              className={`p-3.5 rounded-xl border text-xs transition ${
                request.status === "approved"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                  : request.status === "rejected"
                    ? "bg-stone-50 border-stone-200 text-stone-700"
                    : "bg-amber-50/80 border-amber-200 text-amber-900"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 font-semibold">
                  {request.status === "approved" ? (
                    <CheckCircle2 size={16} className="text-emerald-600" />
                  ) : request.status === "rejected" ? (
                    <XCircle size={16} className="text-stone-500" />
                  ) : (
                    <Clock size={16} className="text-amber-600 animate-spin" />
                  )}
                  <span>
                    Request is{" "}
                    <strong className="capitalize underline underline-offset-2">
                      {request.status}
                    </strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => void refreshStatus()}
                  disabled={loading}
                  className="text-stone-500 hover:text-stone-800 p-1 rounded-md transition"
                  title="Refresh request status"
                >
                  <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
                </button>
              </div>

              <p className="mt-2 text-[11px] leading-relaxed text-stone-600">
                {request.status === "pending" &&
                  "The host has received your request. When they tap 'Approve', your table details will reveal automatically."}
                {request.status === "approved" &&
                  "Host approved your seat! Reload or check table status on the left."}
                {request.status === "rejected" &&
                  "This request was declined. The host may have reached capacity or switched to quiet study."}
              </p>
            </div>
          )}

          {/* Request Submission Form (When not yet requested) */}
          {!request && (
            <form onSubmit={handleRequestSeat} className="space-y-3 pt-1">
              {/* Requester Identity Pill */}
              <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 truncate">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      user ? "bg-emerald-500" : "bg-amber-400"
                    }`}
                  />
                  {user ? (
                    <span className="text-stone-800 truncate">
                      Requesting as <strong>{profile?.name || user.email?.split("@")[0]}</strong>
                    </span>
                  ) : (
                    <span className="text-stone-600 truncate">
                      Requesting as <strong>Sam Patel</strong> (Demo)
                    </span>
                  )}
                </div>
                {!user && (
                  <button
                    type="button"
                    onClick={openModal}
                    className="text-[11px] font-semibold text-red-800 hover:underline shrink-0 inline-flex items-center gap-1"
                  >
                    <LogIn size={11} />
                    <span>Sign In</span>
                  </button>
                )}
              </div>

              {/* Quick Greeting Chips */}
              <div>
                <label className="block text-[11px] font-semibold text-stone-600 mb-1.5">
                  Optional Note to Host
                </label>
                <div className="flex flex-wrap gap-1 mb-2">
                  {QUICK_GREETINGS.map((greeting) => {
                    const isSelected = selectedGreeting === greeting;
                    return (
                      <button
                        type="button"
                        key={greeting}
                        onClick={() => setSelectedGreeting(isSelected ? "" : greeting)}
                        className={`text-[11px] px-2 py-0.5 rounded-md border transition cursor-pointer ${
                          isSelected
                            ? "bg-red-800 text-white border-red-800"
                            : "bg-white hover:bg-stone-100 text-stone-700 border-stone-200"
                        }`}
                      >
                        {greeting}
                      </button>
                    );
                  })}
                </div>
                {!selectedGreeting && (
                  <input
                    type="text"
                    maxLength={100}
                    placeholder="e.g. Can I join for the recursion review?"
                    value={customNote}
                    onChange={(e) => setCustomNote(e.target.value)}
                    className="w-full text-xs px-3 py-1.5 rounded-lg border border-stone-200 focus:outline-hidden focus:ring-1 focus:ring-red-800 bg-white"
                  />
                )}
              </div>

              {/* Submit Button */}
              {canSubmit && (
                <button
                  type="submit"
                  disabled={submitting}
                  className="button-primary w-full inline-flex items-center justify-center gap-2 py-2.5 text-xs font-semibold cursor-pointer shadow-xs hover:shadow-md transition"
                >
                  {submitting ? (
                    <>
                      <span className="animate-spin inline-block size-3 border-2 border-white border-t-transparent rounded-full" />
                      <span>Sending Request…</span>
                    </>
                  ) : (
                    <>
                      <UserPlus size={15} />
                      <span>Request to Sit Here</span>
                    </>
                  )}
                </button>
              )}

              {isFull && !request && (
                <p className="text-xs text-red-800 font-medium text-center p-2 bg-red-50 rounded-lg border border-red-200">
                  This study session is currently at full capacity.
                </p>
              )}

              {isClosed && (
                <p className="text-xs text-stone-500 text-center p-2 bg-stone-100 rounded-lg">
                  This study group is closed.
                </p>
              )}
            </form>
          )}

          {/* Feedback Alerts */}
          {error && (
            <div className="p-2.5 bg-red-50 text-red-800 border border-red-200 rounded-xl text-xs flex items-center gap-2">
              <ShieldAlert size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successNotice && (
            <div className="p-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 size={15} className="shrink-0 text-emerald-600" />
              <span>{successNotice}</span>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
