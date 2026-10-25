"use client";

import { useEffect, useState } from "react";
import {
  CalendarClock,
  Camera,
  CheckCircle2,
  Database,
  Info,
  MapPin,
  Plus,
  ShieldCheck,
  Sparkles,
  Users,
  X,
  Zap,
} from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import type { CreateSessionInput, SessionPreview } from "@/types/contracts";

const OSU_VENUES = [
  "Thompson Library",
  "18th Avenue Library",
  "Prior Health Sciences Library",
  "Kearns Hall",
  "Other",
] as const;

const VENUE_COORDINATES: Record<string, { lat: number; lng: number }> = {
  "Thompson Library": { lat: 40.0001, lng: -83.0146 },
  "18th Avenue Library": { lat: 40.0025, lng: -83.0092 },
  "Prior Health Sciences Library": { lat: 39.9962, lng: -83.0175 },
  "Kearns Hall": { lat: 40.0031, lng: -83.0163 },
  Other: { lat: 40.0001, lng: -83.0146 },
};

const POPULAR_COURSES = ["CSE 2221", "CSE 1223", "MATH 1151", "ENGR 1181", "STAT 3470", "CHEM 1210"];

interface CreateSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSessionCreated: (session: SessionPreview) => void;
}

export function CreateSessionModal({ isOpen, onClose, onSessionCreated }: CreateSessionModalProps) {
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [courseCode, setCourseCode] = useState("CSE 2221");
  const [customCourse, setCustomCourse] = useState("");
  const [libraryName, setLibraryName] = useState<(typeof OSU_VENUES)[number]>("Thompson Library");
  const [floor, setFloor] = useState("Floor 3");
  const [zone, setZone] = useState("Quiet Stacks - East Wing");
  const [tableId, setTableId] = useState("TH-304-B");
  const [totalSeats, setTotalSeats] = useState(5);
  const [availableSeats, setAvailableSeats] = useState(4);
  const [status, setStatus] = useState<"active" | "scheduled">("active");
  const [scheduledFor, setScheduledFor] = useState("");
  const [surroundingsPhotoUrl, setSurroundingsPhotoUrl] = useState("");
  const [requiresApproval, setRequiresApproval] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Auth detection via browser Supabase client
  const [currentUser, setCurrentUser] = useState<{ id: string; email?: string; name?: string } | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg(null);
    setSuccessMsg(null);

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (url && key) {
      try {
        const supabase = createClient(url, key);
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session?.user) {
            setCurrentUser({
              id: session.user.id,
              email: session.user.email,
              name: session.user.user_metadata?.name || session.user.email?.split("@")[0] || "Buckeye Student",
            });
            setAccessToken(session.access_token);
          } else {
            setCurrentUser(null);
            setAccessToken(null);
          }
        });
      } catch (err) {
        console.warn("Could not check supabase session in modal:", err);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePreFillJudgeDemo = () => {
    setTitle("CSE 2221 Midterm 2 Deep Dive");
    setSubtitle("Working through past exams 2022-2024: recursion trees, queues, and formal verification.");
    setCourseCode("CSE 2221");
    setLibraryName("Thompson Library");
    setFloor("Floor 3");
    setZone("Tower Quiet Stacks");
    setTableId("TH-412-East");
    setTotalSeats(6);
    setAvailableSeats(4);
    setStatus("active");
    setScheduledFor("");
    setSurroundingsPhotoUrl("https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=800&q=80");
    setRequiresApproval(true);
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const activeCourse = courseCode === "CUSTOM" ? customCourse.trim() : courseCode;
    if (!activeCourse) {
      setErrorMsg("Please specify a course code.");
      setIsLoading(false);
      return;
    }

    if (availableSeats > totalSeats) {
      setErrorMsg("Available seats cannot exceed total seats.");
      setIsLoading(false);
      return;
    }

    const coords = VENUE_COORDINATES[libraryName] || { lat: 40.0001, lng: -83.0146 };

    const payload: CreateSessionInput = {
      title: title.trim(),
      subtitle: subtitle.trim(),
      courseCode: activeCourse,
      libraryName,
      tableId: tableId.trim(),
      floor: floor.trim() || undefined,
      zone: zone.trim() || undefined,
      totalSeats: Number(totalSeats),
      availableSeats: Number(availableSeats),
      surroundingsPhotoUrl: surroundingsPhotoUrl.trim(),
      requiresApproval,
      status,
      scheduledFor: status === "scheduled" && scheduledFor ? new Date(scheduledFor).toISOString() : undefined,
      gpsCoordinates: coords,
    };

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      } else {
        headers["x-demo-mode"] = "true";
      }

      const res = await fetch("/api/sessions", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error?.message || "Failed to create study session.");
      }

      setSuccessMsg(
        accessToken
          ? "🎉 Session published to live Supabase database!"
          : "✨ Session created in local demo mode!"
      );

      setTimeout(() => {
        onSessionCreated(data as SessionPreview);
        onClose();
      }, 700);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="panel max-w-xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border-stone-200 p-6 sm:p-7 relative bg-white"
        role="dialog"
        aria-labelledby="modal-title"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-stone-400 hover:text-stone-700 p-1.5 rounded-lg transition"
          aria-label="Close dialog"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <span className="p-1.5 bg-red-100 text-red-800 rounded-lg">
            <Plus size={18} />
          </span>
          <p className="eyebrow">BUCKEYE SPROUTS · PEER NETWORK</p>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-stone-900" id="modal-title">
          Post a Study Session
        </h2>
        <p className="text-xs text-stone-500 mt-1">
          Anchor your table to Ohio State libraries and invite Buckeyes to collaborate.
        </p>

        {/* Live DB / Auth Status Pill */}
        <div className="my-4 p-3 rounded-xl bg-stone-50 border border-stone-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${currentUser ? "bg-scarlet animate-pulse" : "bg-amber-400"}`}
            />
            {currentUser ? (
              <span className="text-stone-700">
                Logged in as <strong className="text-stone-900">{currentUser.name}</strong>{" "}
                <span className="text-scarlet-dark font-semibold">(Live Supabase DB)</span>
              </span>
            ) : (
              <span className="text-stone-600">
                Not signed in · <span className="font-semibold text-amber-800">Demo mode active</span>
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handlePreFillJudgeDemo}
            className="inline-flex items-center gap-1.5 text-red-800 hover:text-red-900 font-semibold text-xs py-1 px-2.5 bg-red-50 hover:bg-red-100 rounded-lg transition border border-red-200"
            title="Pre-populate with Thompson Library Floor 3 CSE 2221 demo data"
          >
            <Zap size={13} className="fill-current text-amber-500" />
            <span>⚡ 1-Click Judge Fill</span>
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 mb-4 text-xs bg-red-50 text-red-800 border border-red-200 rounded-xl flex items-center gap-2">
            <Info size={15} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 mb-4 text-xs bg-stone-100 text-scarlet-deep border border-stone-300 rounded-xl flex items-center gap-2 font-medium">
            <CheckCircle2 size={16} className="shrink-0 text-scarlet" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1" htmlFor="session-title">
              Session Title *
            </label>
            <input
              id="session-title"
              type="text"
              required
              minLength={3}
              maxLength={80}
              placeholder="e.g. Midterm 2 Problem Set & Recursion"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-hidden focus:ring-2 focus:ring-red-800/30 focus:border-red-800 transition"
            />
          </div>

          {/* Subtitle / Description */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1" htmlFor="session-subtitle">
              Goal / Description
            </label>
            <input
              id="session-subtitle"
              type="text"
              maxLength={180}
              placeholder="e.g. Working through past exams, sharing notes and practice problems"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className="w-full text-sm px-3.5 py-2 rounded-xl border border-stone-200 focus:outline-hidden focus:ring-2 focus:ring-red-800/30 focus:border-red-800 transition"
            />
          </div>

          {/* Course Badges */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Course Code *
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {POPULAR_COURSES.map((course) => (
                <button
                  type="button"
                  key={course}
                  onClick={() => setCourseCode(course)}
                  className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition ${
                    courseCode === course
                      ? "bg-red-800 text-white border-red-800 shadow-xs"
                      : "bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200"
                  }`}
                >
                  {course}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCourseCode("CUSTOM")}
                className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition ${
                  courseCode === "CUSTOM"
                    ? "bg-red-800 text-white border-red-800 shadow-xs"
                    : "bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200"
                }`}
              >
                + Custom
              </button>
            </div>
            {courseCode === "CUSTOM" && (
              <input
                type="text"
                required
                maxLength={24}
                placeholder="Enter course (e.g. PHYSICS 1250)"
                value={customCourse}
                onChange={(e) => setCustomCourse(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-xl border border-stone-200 focus:outline-hidden focus:ring-2 focus:ring-red-800/30 focus:border-red-800 transition"
              />
            )}
          </div>

          {/* Venue & Floor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1" htmlFor="library-venue">
                Library Venue *
              </label>
              <select
                id="library-venue"
                value={libraryName}
                onChange={(e) => setLibraryName(e.target.value as (typeof OSU_VENUES)[number])}
                className="w-full text-sm px-3 py-2 rounded-xl border border-stone-200 focus:outline-hidden focus:ring-2 focus:ring-red-800/30 focus:border-red-800 bg-white transition"
              >
                {OSU_VENUES.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1" htmlFor="floor-level">
                Floor / Level
              </label>
              <input
                id="floor-level"
                type="text"
                placeholder="e.g. Floor 3"
                value={floor}
                onChange={(e) => setFloor(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-xl border border-stone-200 focus:outline-hidden focus:ring-2 focus:ring-red-800/30 focus:border-red-800 transition"
              />
            </div>
          </div>

          {/* Table ID & Zone (Private until approved) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-stone-50/80 rounded-xl border border-dashed border-stone-300">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <label className="text-xs font-semibold text-stone-800" htmlFor="table-id">
                  Table Anchor ID *
                </label>
                <span className="text-[10px] text-stone-500 bg-stone-200/80 px-1.5 py-0.5 rounded">
                  Private
                </span>
              </div>
              <input
                id="table-id"
                type="text"
                required
                placeholder="e.g. TH-304-B"
                value={tableId}
                onChange={(e) => setTableId(e.target.value)}
                className="w-full text-sm px-3 py-1.5 rounded-lg border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-red-800/30 bg-white transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-800 mb-1" htmlFor="zone-label">
                Discovery Zone (Public)
              </label>
              <input
                id="zone-label"
                type="text"
                placeholder="e.g. East study area"
                value={zone}
                onChange={(e) => setZone(e.target.value)}
                className="w-full text-sm px-3 py-1.5 rounded-lg border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-red-800/30 bg-white transition"
              />
            </div>
          </div>

          {/* Seat Counters */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Total Seats: <strong className="text-stone-900">{totalSeats}</strong>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTotalSeats(Math.max(1, totalSeats - 1))}
                  className="w-8 h-8 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 flex items-center justify-center font-bold text-stone-600 transition"
                >
                  -
                </button>
                <span className="text-sm font-semibold w-6 text-center">{totalSeats}</span>
                <button
                  type="button"
                  onClick={() => setTotalSeats(Math.min(20, totalSeats + 1))}
                  className="w-8 h-8 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 flex items-center justify-center font-bold text-stone-600 transition"
                >
                  +
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Available Open Seats: <strong className="text-stone-900">{availableSeats}</strong>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAvailableSeats(Math.max(0, availableSeats - 1))}
                  className="w-8 h-8 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 flex items-center justify-center font-bold text-stone-600 transition"
                >
                  -
                </button>
                <span className="text-sm font-semibold w-6 text-center">{availableSeats}</span>
                <button
                  type="button"
                  onClick={() => setAvailableSeats(Math.min(totalSeats, availableSeats + 1))}
                  className="w-8 h-8 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 flex items-center justify-center font-bold text-stone-600 transition"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Status: Active Now vs Scheduled */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-stone-700">Timing</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setStatus("active")}
                className={`py-2 px-3 text-xs font-semibold rounded-xl border flex items-center justify-center gap-1.5 transition ${
                  status === "active"
                    ? "bg-red-800 text-white border-red-800 shadow-xs"
                    : "bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-scarlet" />
                Studying Now
              </button>
              <button
                type="button"
                onClick={() => setStatus("scheduled")}
                className={`py-2 px-3 text-xs font-semibold rounded-xl border flex items-center justify-center gap-1.5 transition ${
                  status === "scheduled"
                    ? "bg-red-800 text-white border-red-800 shadow-xs"
                    : "bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200"
                }`}
              >
                <CalendarClock size={14} />
                Schedule Later
              </button>
            </div>
            {status === "scheduled" && (
              <div className="mt-2">
                <input
                  type="datetime-local"
                  required
                  value={scheduledFor}
                  onChange={(e) => setScheduledFor(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-red-800/30"
                />
              </div>
            )}
          </div>

          {/* Privacy & Approval Toggle */}
          <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-200">
            <div className="pr-3">
              <span className="text-xs font-semibold text-stone-900 flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-red-800" />
                Require Host Approval
              </span>
              <p className="text-[11px] text-stone-500 mt-0.5">
                Exact table number and crowd photos remain masked until you approve join requests.
              </p>
            </div>
            <input
              type="checkbox"
              id="require-approval"
              checked={requiresApproval}
              onChange={(e) => setRequiresApproval(e.target.checked)}
              className="size-4 accent-red-800 rounded cursor-pointer shrink-0"
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-2 bg-red-800 hover:bg-red-700 text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-xs transition disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <span className="animate-spin inline-block size-3 border-2 border-white border-t-transparent rounded-full" />
                  <span>Publishing…</span>
                </>
              ) : (
                <>
                  <Database size={14} />
                  <span>{currentUser ? "Publish to Live Database" : "Post Session (Demo)"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
