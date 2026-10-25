"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  Compass,
  GraduationCap,
  Info,
  Lock,
  LogIn,
  MapPin,
  QrCode,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Users,
  Zap,
} from "lucide-react";
import { useAuth } from "@/features/auth-profiles/context/AuthContext";
import { parseTableLocation, type TableLocationInfo } from "@/features/sessions-discovery/table-ids";
import type { CreateSessionInput, SessionPreview } from "@/types/contracts";
import { SAMPLE_ACCOUNTS, SAMPLE_ACCOUNT_PASSWORD } from "@/features/auth-profiles/sample-accounts.mjs";

interface TableDataResponse {
  tableId: string;
  location: TableLocationInfo;
  hasActiveSession: boolean;
  sessionId: string | null;
  hostName: string | null;
  session: SessionPreview | null;
}

const POPULAR_COURSES = [
  "CSE 2221",
  "CSE 1223",
  "MATH 1151",
  "ENGR 1181",
  "STAT 3470",
  "CHEM 1210",
];

const SAMPLE_DEMO_TABLES = [
  { id: "150b-1", label: "Table 150b-1 (Active Group)", occupied: true },
  { id: "150a-1", label: "Table 150a-1 (Empty / Open)", occupied: false },
  { id: "110-1", label: "Table 110-1 (Active Group)", occupied: true },
  { id: "140-5", label: "Table 140-5 (Empty / Open)", occupied: false },
];

export function TableRoutingView({ tableId: initialTableId }: { tableId: string }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const { user, profile, isLoading: isAuthLoading, signIn, openModal } = useAuth();

  const [currentTableId, setCurrentTableId] = useState(initialTableId);
  const [tableData, setTableData] = useState<TableDataResponse | null>(null);
  const [isLoadingTable, setIsLoadingTable] = useState(true);
  const [redirectCountdown, setRedirectCountdown] = useState<number | null>(null);

  // Quick Sign In form states
  const [email, setEmail] = useState(SAMPLE_ACCOUNTS[0].email);
  const [password, setPassword] = useState(SAMPLE_ACCOUNT_PASSWORD);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Creation form states (when table has no active study group)
  const [courseCode, setCourseCode] = useState("CSE 2221");
  const [customCourse, setCustomCourse] = useState("");
  const [title, setTitle] = useState("Software I Collaboration & Practice");
  const [subtitle, setSubtitle] = useState("Working through project assignments and review questions.");
  const [totalSeats, setTotalSeats] = useState(4);
  const [availableSeats, setAvailableSeats] = useState(3);
  const [requiresApproval, setRequiresApproval] = useState(true);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const locationInfo = parseTableLocation(currentTableId, "Thompson Library");

  // Fetch table data whenever tableId changes
  useEffect(() => {
    let isCancelled = false;
    setIsLoadingTable(true);
    setRedirectCountdown(null);

    async function loadTable() {
      try {
        const res = await fetch(`/api/tables/${encodeURIComponent(currentTableId)}`);
        if (!res.ok) throw new Error("Failed to load table details");
        const data: TableDataResponse = await res.json();
        if (!isCancelled) {
          setTableData(data);
          setIsLoadingTable(false);

          // If active study group exists, trigger redirect countdown
          if (data.hasActiveSession && data.sessionId) {
            setRedirectCountdown(2);
          }
        }
      } catch (err) {
        if (!isCancelled) {
          console.warn("[TableRouting] Error fetching table status:", err);
          setIsLoadingTable(false);
        }
      }
    }

    loadTable();
    return () => {
      isCancelled = true;
    };
  }, [currentTableId]);

  // Handle countdown for active session redirect
  useEffect(() => {
    if (redirectCountdown === null || redirectCountdown < 0) return;

    if (redirectCountdown === 0 && tableData?.sessionId) {
      startTransition(() => {
        router.replace(`/session/${tableData.sessionId}`);
      });
      return;
    }

    const timer = setTimeout(() => {
      setRedirectCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearTimeout(timer);
  }, [redirectCountdown, tableData?.sessionId, router]);

  // Demo 1-Click Sign-In
  const handleQuickDemoSignIn = async (demoEmail: string, demoName: string) => {
    setIsSigningIn(true);
    setAuthError(null);
    setEmail(demoEmail);
    setPassword(SAMPLE_ACCOUNT_PASSWORD);
    try {
      const res = await signIn(demoEmail, SAMPLE_ACCOUNT_PASSWORD);
      if (res.error) {
        setAuthError(res.error);
        console.warn(`[Demo] Sign in failed for ${demoName}:`, res.error);
      }
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setIsSigningIn(false);
    }
  };

  // Standard Sign-In
  const handleStandardSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsSigningIn(true);
    setAuthError(null);
    try {
      const res = await signIn(email, password);
      if (res.error) {
        setAuthError(res.error);
      }
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setIsSigningIn(false);
    }
  };

  // Create Study Session when table is open
  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingSession(true);
    setCreateError(null);

    const activeCourse = courseCode === "CUSTOM" ? customCourse.trim() : courseCode;
    if (!activeCourse) {
      setCreateError("Please select or enter a course code.");
      setIsCreatingSession(false);
      return;
    }

    const payload: CreateSessionInput = {
      title: title.trim() || `${activeCourse} Study Table`,
      subtitle: subtitle.trim(),
      courseCode: activeCourse,
      libraryName: "Thompson Library",
      tableId: currentTableId,
      floor: locationInfo.floor,
      zone: locationInfo.zone,
      totalSeats: Number(totalSeats),
      availableSeats: Number(availableSeats),
      surroundingsPhotoUrl: "",
      requiresApproval,
      status: "active",
      gpsCoordinates: locationInfo.coordinates,
    };

    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-demo-mode": user ? "false" : "true",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || "Failed to create study group.");
      }

      // Immediately navigate to the newly created session page
      startTransition(() => {
        router.replace(`/session/${data.id}`);
      });
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Could not create study session.");
      setIsCreatingSession(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6">
      {/* Table Anchor Header Banner */}
      <div className="panel bg-gradient-to-br from-white to-stone-50 border-stone-200/80 mb-6 relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
          <QrCode size={120} className="text-red-900" />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-900 border border-red-200">
              <MapPin size={12} />
              {locationInfo.libraryName}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-stone-100 text-stone-700 border border-stone-200">
              <Compass size={12} />
              {locationInfo.floor}
            </span>
          </div>

          <span className="text-xs font-mono font-bold text-stone-500 bg-stone-100 px-2.5 py-1 rounded-md">
            Anchor: {currentTableId}
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
          Table {currentTableId}
        </h1>
        <p className="text-stone-600 text-sm mt-1 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
          {locationInfo.zone} • Scanned via physical QR anchor
        </p>
      </div>

      {/* STATE 1: Authenticating User */}
      {isAuthLoading ? (
        <div className="panel p-8 text-center text-stone-500">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-red-800 border-t-transparent mb-3" />
          <p className="text-sm font-medium">Checking Buckeye credentials...</p>
        </div>
      ) : !user && !profile ? (
        /* Prompt Sign-In Card */
        <div className="panel p-6 sm:p-8 bg-white border-stone-200 mb-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-red-100 text-red-800 grid place-items-center flex-shrink-0">
              <Lock size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-900">Sign in to Continue</h2>
              <p className="text-xs text-stone-500">
                Sign in with your Buckeye account to join the group or host this table.
              </p>
            </div>
          </div>

          {authError && (
            <div className="mb-4 p-3 bg-red-50 text-red-800 border border-red-200 rounded-lg text-xs">
              {authError}
            </div>
          )}

          {/* Quick 1-Click Demo Login Bar */}
          <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl mb-5">
            <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-stone-700">
              <Sparkles size={14} className="text-amber-600" />
              <span>Instant Judge / Demo Access (1-Click)</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={isSigningIn}
                onClick={() => handleQuickDemoSignIn("alex.morgan@osu.edu", "Alex Rabochii")}
                className="button-secondary text-xs py-2 px-3 hover:border-red-800"
              >
                Sign in as Alex Rabochii (CSE)
              </button>
              <button
                type="button"
                disabled={isSigningIn}
                onClick={() => handleQuickDemoSignIn("jordan.lee@osu.edu", "Jordan Lee")}
                className="button-secondary text-xs py-2 px-3 hover:border-red-800"
              >
                Sign in as Jordan Lee (Math)
              </button>
              <button
                type="button"
                disabled={isSigningIn}
                onClick={() => handleQuickDemoSignIn("sam.patel@osu.edu", "Sam Patel")}
                className="button-secondary text-xs py-2 px-3 hover:border-red-800"
              >
                Sign in as Sam Patel (CSE)
              </button>
              <button
                type="button"
                disabled={isSigningIn}
                onClick={() => handleQuickDemoSignIn("brutus.buckeye@osu.edu", "Brutus Buckeye")}
                className="button-secondary text-xs py-2 px-3 hover:border-red-800"
              >
                Sign in as Brutus Buckeye
              </button>
            </div>
          </div>

          {/* Standard Sign-In Form */}
          <form onSubmit={handleStandardSignIn} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                OSU Email / Name.#
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="lastname.#@osu.edu"
                className="w-full input text-sm bg-stone-50 border-stone-300 focus:border-red-800 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full input text-sm bg-stone-50 border-stone-300 focus:border-red-800 rounded-lg"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={openModal}
                className="text-xs text-stone-500 hover:text-red-800 hover:underline"
              >
                Need an account? Register
              </button>
              <button
                type="submit"
                disabled={isSigningIn}
                className="button-primary text-sm py-2.5 px-5 flex items-center gap-2"
              >
                <LogIn size={15} />
                {isSigningIn ? "Signing In..." : "Sign In to Table"}
              </button>
            </div>
          </form>
        </div>
      ) : isLoadingTable ? (
        /* Loading Table Data */
        <div className="panel p-8 text-center text-stone-500">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-red-800 border-t-transparent mb-3" />
          <p className="text-sm font-medium">Checking Table {currentTableId} status...</p>
        </div>
      ) : tableData?.hasActiveSession && tableData.session ? (
        /* SCENARIO A: Active Study Group Found */
        <div className="panel p-6 sm:p-8 bg-white border-emerald-200/90 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              <CheckCircle2 size={13} />
              Active Study Group Found
            </span>
            <span className="tag text-xs font-semibold text-stone-600">
              {tableData.session.availableSeats} open seats
            </span>
          </div>

          <div className="mb-5">
            <span className="course-label mb-2 inline-block font-bold">
              {tableData.session.courseCode}
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-stone-900 mt-1">
              {tableData.session.title}
            </h2>
            <p className="text-stone-600 text-sm mt-1">{tableData.session.subtitle}</p>
          </div>

          <div className="p-3.5 bg-emerald-50/80 border border-emerald-200/70 rounded-xl mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold grid place-items-center text-xs">
                {tableData.hostName?.charAt(0) || "A"}
              </div>
              <div className="text-xs">
                <p className="font-semibold text-emerald-950">
                  Hosted by {tableData.hostName || "Alex Rabochii"}
                </p>
                <p className="text-emerald-700">Currently studying at this table</p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs font-semibold text-emerald-800 flex items-center gap-1">
                <Clock size={12} />
                {redirectCountdown !== null && redirectCountdown > 0
                  ? `Entering in ${redirectCountdown}s...`
                  : "Entering..."}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={() => router.push(`/session/${tableData.sessionId}`)}
              className="button-primary w-full sm:w-auto text-sm py-3 px-6 flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 border-emerald-700"
            >
              <span>Enter Study Group Now</span>
              <ArrowRight size={16} />
            </button>
            <Link
              href="/"
              className="text-xs text-stone-500 hover:text-stone-800 text-center py-2"
            >
              Return to campus overview
            </Link>
          </div>
        </div>
      ) : (
        /* SCENARIO B: Table is Open / Empty -> Study Group Creation Page */
        <div className="panel p-6 sm:p-8 bg-white border-stone-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
              <Sparkles size={13} className="text-amber-700" />
              Table Available • Ready to Host
            </span>
            <span className="text-xs font-semibold text-stone-500">
              Pre-filled from QR Scan
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-stone-900 mb-1">
            Start a Study Group at Table {currentTableId}
          </h2>
          <p className="text-stone-600 text-sm mb-6">
            No active group is at this table right now. Create a session to invite classmates and
            lock in this study spot.
          </p>

          {createError && (
            <div className="mb-5 p-3.5 bg-red-50 text-red-800 border border-red-200 rounded-lg text-xs">
              {createError}
            </div>
          )}

          <form onSubmit={handleCreateSession} className="space-y-5">
            {/* Location (Pre-filled & Highlighted) */}
            <div className="p-4 bg-stone-50 border border-stone-200/90 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  Locked Physical Location
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  <CheckCircle2 size={11} /> Auto-Anchored
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-stone-400 block">Venue:</span>
                  <span className="font-semibold text-stone-800">
                    {locationInfo.libraryName}
                  </span>
                </div>
                <div>
                  <span className="text-stone-400 block">Table ID:</span>
                  <span className="font-mono font-bold text-red-800">
                    {currentTableId}
                  </span>
                </div>
                <div>
                  <span className="text-stone-400 block">Floor:</span>
                  <span className="font-semibold text-stone-800">
                    {locationInfo.floor}
                  </span>
                </div>
                <div>
                  <span className="text-stone-400 block">Area / Zone:</span>
                  <span className="font-semibold text-stone-800">
                    {locationInfo.zone}
                  </span>
                </div>
              </div>
            </div>

            {/* Course Code Selection */}
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-2">
                Course Subject
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2.5">
                {POPULAR_COURSES.map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => {
                      setCourseCode(code);
                      setTitle(`${code} Study & Problem Review`);
                    }}
                    className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all ${
                      courseCode === code
                        ? "bg-red-800 text-white shadow-sm"
                        : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                    }`}
                  >
                    {code}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setCourseCode("CUSTOM")}
                  className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all ${
                    courseCode === "CUSTOM"
                      ? "bg-red-800 text-white shadow-sm"
                      : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                  }`}
                >
                  Other Course
                </button>
              </div>

              {courseCode === "CUSTOM" && (
                <input
                  type="text"
                  required
                  placeholder="e.g. CSE 2321, PHYSICS 1250"
                  value={customCourse}
                  onChange={(e) => setCustomCourse(e.target.value)}
                  className="w-full input text-sm bg-stone-50 border-stone-300 rounded-lg"
                />
              )}
            </div>

            {/* Session Title */}
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">
                Study Group Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What are you working on?"
                className="w-full input text-sm bg-stone-50 border-stone-300 rounded-lg"
              />
            </div>

            {/* Subtitle / Topic Notes */}
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">
                Topic & Notes (Optional)
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="e.g. Preparing for midterm, reviewing lab 4 questions"
                className="w-full input text-sm bg-stone-50 border-stone-300 rounded-lg"
              />
            </div>

            {/* Seat Availability & Privacy */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  Open Seats Available
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAvailableSeats((prev) => Math.max(1, prev - 1))}
                    className="w-8 h-8 rounded border border-stone-300 bg-stone-100 text-stone-700 font-bold hover:bg-stone-200"
                  >
                    -
                  </button>
                  <span className="font-semibold text-stone-800 w-8 text-center">
                    {availableSeats}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setAvailableSeats((prev) => Math.min(totalSeats, prev + 1))
                    }
                    className="w-8 h-8 rounded border border-stone-300 bg-stone-100 text-stone-700 font-bold hover:bg-stone-200"
                  >
                    +
                  </button>
                  <span className="text-xs text-stone-500 ml-1">of {totalSeats} seats</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  Psychological Safety
                </label>
                <label className="flex items-center gap-2 text-xs text-stone-700 cursor-pointer mt-2">
                  <input
                    type="checkbox"
                    checked={requiresApproval}
                    onChange={(e) => setRequiresApproval(e.target.checked)}
                    className="rounded text-red-800 focus:ring-red-800"
                  />
                  <span>Require host approval to join</span>
                </label>
              </div>
            </div>

            <div className="pt-3 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-stone-500">
                You will be set as the study host for Table {currentTableId}.
              </span>

              <button
                type="submit"
                disabled={isCreatingSession}
                className="button-primary w-full sm:w-auto text-sm py-3 px-6 flex items-center justify-center gap-2 bg-red-800 hover:bg-red-900 border-red-800"
              >
                <Zap size={15} />
                {isCreatingSession ? "Publishing Group..." : `Launch Group at Table ${currentTableId}`}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Zero-Friction Judge Simulator Bar */}
      <div className="mt-8 p-4 bg-stone-100/90 border border-stone-200/90 rounded-2xl">
        <div className="flex items-center gap-2 mb-2 text-xs font-bold text-stone-800">
          <QrCode size={15} className="text-red-800" />
          <span>HackOHIO Judge Simulator • Test Other Tables in Seconds</span>
        </div>
        <p className="text-xs text-stone-600 mb-3">
          Simulate scanning different physical QR codes across Thompson Library without moving:
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {SAMPLE_DEMO_TABLES.map((table) => (
            <button
              key={table.id}
              type="button"
              onClick={() => {
                setCurrentTableId(table.id);
                window.history.replaceState(null, "", `/table/${table.id}`);
              }}
              className={`text-xs py-2 px-2.5 rounded-lg border text-left transition-all ${
                currentTableId === table.id
                  ? "bg-red-800 text-white border-red-800 font-bold shadow-sm"
                  : "bg-white text-stone-700 border-stone-300 hover:border-red-800"
              }`}
            >
              <div className="font-mono font-semibold">{table.id}</div>
              <div
                className={`text-[10px] ${
                  currentTableId === table.id
                    ? "text-red-100"
                    : table.occupied
                    ? "text-emerald-700 font-semibold"
                    : "text-amber-700 font-semibold"
                }`}
              >
                {table.occupied ? "• Has Group" : "• Open Table"}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
