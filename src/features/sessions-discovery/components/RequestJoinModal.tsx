"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Info,
  LockKeyhole,
  MapPin,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import type { SessionPreview } from "@/types/contracts";

const QUICK_GREETINGS = [
  "Working on homework",
  "Exam & midterm review",
  "Working on practice problems",
  "Quiet study buddy",
];

interface RequestJoinModalProps {
  session: SessionPreview | null;
  onClose: () => void;
  onRequestSubmitted?: (sessionId: string) => void;
}

export function RequestJoinModal({
  session,
  onClose,
  onRequestSubmitted,
}: RequestJoinModalProps) {
  const [selectedGreeting, setSelectedGreeting] = useState<string>("");
  const [customNote, setCustomNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Auth detection
  const [currentUser, setCurrentUser] = useState<{ id: string; email?: string; name?: string } | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    setErrorMsg(null);
    setSuccess(false);
    setSelectedGreeting("");
    setCustomNote("");

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (url && key) {
      try {
        const supabase = createClient(url, key);
        supabase.auth.getSession().then(({ data: { session: authSession } }) => {
          if (authSession?.user) {
            setCurrentUser({
              id: authSession.user.id,
              email: authSession.user.email,
              name: authSession.user.user_metadata?.name || authSession.user.email?.split("@")[0] || "Buckeye Student",
            });
            setAccessToken(authSession.access_token);
          } else {
            setCurrentUser(null);
            setAccessToken(null);
          }
        });
      } catch (err) {
        console.warn("Could not check session token:", err);
      }
    }
  }, [session]);

  if (!session) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    const note = selectedGreeting || customNote.trim() || undefined;

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      } else {
        headers["x-demo-mode"] = "true";
      }

      const res = await fetch(`/api/sessions/${session.id}/join`, {
        method: "POST",
        headers,
        body: JSON.stringify({ note }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || "Could not submit join request.");
      }

      setSuccess(true);
      if (onRequestSubmitted) {
        onRequestSubmitted(session.id);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to request seat.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="panel max-w-md w-full shadow-2xl border-stone-200 p-6 sm:p-7 relative bg-white"
        role="dialog"
        aria-labelledby="join-modal-title"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-stone-400 hover:text-stone-700 p-1.5 rounded-lg transition"
          aria-label="Close dialog"
        >
          <X size={20} />
        </button>

        {/* Header Badge */}
        <div className="flex items-center gap-2 mb-1">
          <span className="p-1.5 bg-red-100 text-red-800 rounded-lg">
            <UserPlus size={18} />
          </span>
          <p className="eyebrow">BUCKEYESTUDY · SEAT REQUEST</p>
        </div>

        <h2 className="text-xl font-bold tracking-tight text-stone-900 mt-1" id="join-modal-title">
          Request to Sit at Table
        </h2>

        {/* Target Session Cardlet */}
        <div className="my-4 p-3.5 bg-stone-50 rounded-xl border border-stone-200">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="course-label">{session.courseCode}</span>
            <span className="text-xs font-semibold text-scarlet-deep bg-stone-100 border border-stone-300 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Users size={12} className="text-scarlet" />
              {session.availableSeats} of {session.totalSeats} seats open
            </span>
          </div>

          <h3 className="font-semibold text-sm text-stone-900 mt-1">{session.title}</h3>
          <p className="text-xs text-stone-500 mt-1 flex items-center gap-1.5">
            <MapPin size={13} className="text-red-800 shrink-0" />
            {session.libraryName}
            {session.floor ? ` · ${session.floor}` : ""}
          </p>
        </div>

        {/* Success View */}
        {success ? (
          <div className="space-y-4 pt-1 text-center">
            <div className="w-12 h-12 rounded-full bg-stone-200 text-scarlet-dark flex items-center justify-center mx-auto">
              <CheckCircle2 size={28} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-stone-900">Request Sent!</h3>
              <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                The host has been notified. As soon as they tap &ldquo;Approve&rdquo;, exact table details and surroundings photos will unlock for you.
              </p>
            </div>
            <div className="pt-2 flex flex-col gap-2">
              <Link
                href={`/session/${session.id}`}
                className="button-primary w-full inline-flex items-center justify-center gap-2 py-2.5 text-xs font-semibold"
              >
                <span>Go to Session Room</span>
                <ArrowRight size={14} />
              </Link>
              <button
                type="button"
                onClick={onClose}
                className="text-xs text-stone-500 hover:text-stone-800 py-1"
              >
                Back to Discovery
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Requester Identity */}
            <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 truncate">
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    currentUser ? "bg-scarlet" : "bg-amber-400"
                  }`}
                />
                {currentUser ? (
                  <span className="text-stone-800 truncate">
                    Requesting as <strong>{currentUser.name}</strong>{" "}
                    <span className="text-scarlet-dark font-medium">(Live DB)</span>
                  </span>
                ) : (
                  <span className="text-stone-600 truncate">
                    Requesting as <strong>Sam Patel</strong> (Demo Mode)
                  </span>
                )}
              </div>
            </div>

            {/* Quick Greeting Chips */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                Note for the Host (Optional)
              </label>
              <div className="flex flex-wrap gap-1 mb-2">
                {QUICK_GREETINGS.map((greeting) => {
                  const isSelected = selectedGreeting === greeting;
                  return (
                    <button
                      type="button"
                      key={greeting}
                      onClick={() => setSelectedGreeting(isSelected ? "" : greeting)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                        isSelected
                          ? "bg-red-800 text-white border-red-800 font-medium shadow-xs"
                          : "bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200"
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
                  className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 focus:outline-hidden focus:ring-1 focus:ring-red-800 bg-white"
                />
              )}
            </div>

            {/* Privacy Explanation */}
            <div className="p-3 bg-red-50/60 rounded-xl border border-red-100 text-[11px] text-stone-600 flex items-start gap-2">
              <ShieldCheck size={16} className="text-red-800 shrink-0 mt-0.5" />
              <span>
                To ensure psychological safety and avoid awkward table searches, the exact table anchor ID is shared once approved by the host.
              </span>
            </div>

            {errorMsg && (
              <div className="p-2.5 bg-red-50 text-red-800 border border-red-200 rounded-xl text-xs flex items-center gap-2">
                <Info size={14} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="button-primary inline-flex items-center gap-2 py-2.5 px-5 text-xs font-semibold cursor-pointer shadow-xs hover:shadow-md transition disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin inline-block size-3 border-2 border-white border-t-transparent rounded-full" />
                    <span>Sending…</span>
                  </>
                ) : (
                  <>
                    <UserPlus size={14} />
                    <span>Send Join Request</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
