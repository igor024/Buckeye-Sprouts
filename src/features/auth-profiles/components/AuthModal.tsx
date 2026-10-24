"use client";

import { useState, useEffect, type FormEvent } from "react";
import {
  GraduationCap,
  Lock,
  Mail,
  User,
  X,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Database,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const POPULAR_COURSES = [
  "CSE 2221",
  "CSE 2231",
  "MATH 1151",
  "MATH 1172",
  "ENGR 1181",
  "PHYSICS 1250",
];

export function AuthModal() {
  const { isModalOpen, closeModal, signIn, signUp, isConfigured } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  // Form inputs
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [major, setMajor] = useState("Computer Science & Engineering");
  const [selectedCourses, setSelectedCourses] = useState<string[]>(["CSE 2221"]);
  const [bio, setBio] = useState("");

  // Status
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isModalOpen) {
        closeModal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen, closeModal]);

  if (!isModalOpen) return null;

  const toggleCourse = (code: string) => {
    setSelectedCourses((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const handleQuickDemoFill = () => {
    setEmail("alex.morgan@osu.edu");
    setPassword("Password123!");
    setError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setInfoMessage(null);

    try {
      if (mode === "signin") {
        const res = await signIn(email, password);
        if (res.error) {
          setError(res.error);
        }
      } else {
        const res = await signUp({
          email,
          password,
          name: name.trim() || email.split("@")[0],
          major,
          currentCourses: selectedCourses,
          bio: bio.trim(),
        });

        if (res.error) {
          setError(res.error);
        } else if (res.emailConfirmationNeeded) {
          setInfoMessage(
            "Account created! Please check your email inbox to confirm your address before signing in."
          );
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar */}
        <div className="bg-red-800 text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-red-900/60 rounded-xl">
              <GraduationCap size={20} />
            </span>
            <div>
              <h2 id="auth-modal-title" className="text-base font-bold tracking-tight">
                Buckeye<span className="text-red-200">Study</span> Sign In
              </h2>
              <p className="text-[11px] text-red-100 flex items-center gap-1.5 mt-0.5">
                <Database size={11} /> Real Supabase Database (Vercel)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeModal}
            className="text-red-200 hover:text-white p-1 rounded-lg transition"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-stone-200 bg-stone-50">
          <button
            type="button"
            onClick={() => {
              setMode("signin");
              setError(null);
            }}
            className={`flex-1 py-3 text-xs font-semibold text-center transition border-b-2 ${
              mode === "signin"
                ? "border-red-800 text-red-800 bg-white"
                : "border-transparent text-stone-500 hover:text-stone-800"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setError(null);
            }}
            className={`flex-1 py-3 text-xs font-semibold text-center transition border-b-2 ${
              mode === "signup"
                ? "border-red-800 text-red-800 bg-white"
                : "border-transparent text-stone-500 hover:text-stone-800"
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Quick Demo Pre-fill for Hackathon Judges */}
          {mode === "signin" && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-900">
              <div className="flex items-center gap-2">
                <Sparkles size={15} className="text-amber-700 shrink-0" />
                <span className="text-[11px]">Judge Quick-Fill (Verified student in DB)</span>
              </div>
              <button
                type="button"
                onClick={handleQuickDemoFill}
                className="bg-amber-200/80 hover:bg-amber-300 text-amber-950 font-bold px-2.5 py-1 rounded-md text-[10px] transition"
              >
                Fill Alex&apos;s Credentials
              </button>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs flex items-start gap-2.5"
            >
              <AlertCircle size={15} className="shrink-0 mt-0.5 text-red-700" />
              <span>{error}</span>
            </div>
          )}

          {infoMessage && (
            <div
              role="status"
              className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-2.5"
            >
              <CheckCircle2 size={15} className="shrink-0 mt-0.5 text-emerald-700" />
              <span>{infoMessage}</span>
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1" htmlFor="auth-email">
              Ohio State Email
            </label>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                id="auth-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name.#@osu.edu"
                className="input w-full pl-9 text-xs"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1" htmlFor="auth-password">
              Password
            </label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                id="auth-password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input w-full pl-9 text-xs"
              />
            </div>
          </div>

          {/* Additional fields for Sign Up */}
          {mode === "signup" && (
            <>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1" htmlFor="auth-name">
                  Full Name
                </label>
                <div className="relative">
                  <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    id="auth-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Brutus Buckeye"
                    className="input w-full pl-9 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1" htmlFor="auth-major">
                  Major
                </label>
                <select
                  id="auth-major"
                  value={major}
                  onChange={(e) => setMajor(e.target.value)}
                  className="input w-full text-xs"
                >
                  <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                  <option value="Electrical & Computer Engineering">Electrical & Computer Engineering</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                  <option value="Biomedical Science">Biomedical Science</option>
                  <option value="Finance & Business (Fisher)">Finance & Business (Fisher)</option>
                  <option value="Data Analytics">Data Analytics</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Current Courses
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_COURSES.map((code) => {
                    const selected = selectedCourses.includes(code);
                    return (
                      <button
                        key={code}
                        type="button"
                        onClick={() => toggleCourse(code)}
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded-md border transition ${
                          selected
                            ? "bg-red-800 text-white border-red-800"
                            : "bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100"
                        }`}
                      >
                        {code}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1" htmlFor="auth-bio">
                  Short Study Bio (Optional)
                </label>
                <input
                  id="auth-bio"
                  type="text"
                  maxLength={160}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Looking for midterm study groups in Thompson"
                  className="input w-full text-xs"
                />
              </div>
            </>
          )}

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={busy || !isConfigured}
              className="button-primary w-full py-2.5 text-xs font-bold justify-center"
            >
              {busy ? (
                "Connecting to Supabase…"
              ) : mode === "signin" ? (
                <>
                  Sign In <ArrowRight size={14} />
                </>
              ) : (
                "Create BuckeyeStudy Account"
              )}
            </button>
          </div>

          <p className="text-[10px] text-center text-stone-400 mt-2">
            Uses your live Supabase project configured via Vercel integration.
          </p>
        </form>
      </div>
    </div>
  );
}
