"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  CalendarClock,
  Database,
  Filter,
  LockKeyhole,
  MapPin,
  Plus,
  Sparkles,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import type { SessionPreview } from "@/types/contracts";
import { CreateSessionModal } from "./CreateSessionModal";
import { RequestJoinModal } from "./RequestJoinModal";

const ALL_COURSES = ["All courses", "CSE 2221", "MATH 1151", "ENGR 1181", "STAT 3470", "CSE 1223"];
const ALL_LIBRARIES = [
  "All libraries",
  "Thompson Library",
  "18th Avenue Library",
  "Prior Health Sciences Library",
  "Kearns Hall",
];

export function SessionFeed({ sessions: initialSessions }: { sessions: SessionPreview[] }) {
  const [sessions, setSessions] = useState<SessionPreview[]>(initialSessions);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [joiningSession, setJoiningSession] = useState<SessionPreview | null>(null);

  const [selectedCourse, setSelectedCourse] = useState("All courses");
  const [selectedLibrary, setSelectedLibrary] = useState("All libraries");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const handleSessionCreated = (newSession: SessionPreview) => {
    setSessions((prev) => [newSession, ...prev.filter((s) => s.id !== newSession.id)]);
  };

  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      if (selectedCourse !== "All courses" && s.courseCode !== selectedCourse) {
        return false;
      }
      if (selectedLibrary !== "All libraries" && s.libraryName !== selectedLibrary) {
        return false;
      }
      if (availableOnly && s.availableSeats <= 0) {
        return false;
      }
      if (activeTag && !s.aiTopicTags.includes(activeTag)) {
        return false;
      }
      return true;
    });
  }, [sessions, selectedCourse, selectedLibrary, availableOnly, activeTag]);

  return (
    <section aria-labelledby="feed-title">
      {/* Header with Post button */}
      <div className="flex flex-wrap gap-4 items-center justify-between mb-5">
        <div>
          <p className="eyebrow">FIND YOUR PEOPLE · REAL-TIME SEATS</p>
          <h2 className="text-xl font-semibold mt-2 text-stone-900" id="feed-title">
            Active Buckeye Study Groups
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="button-primary inline-flex items-center gap-2 cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98] transition"
        >
          <Plus size={16} />
          <span>Post a session</span>
        </button>
      </div>

      {/* Filter Bar: Course Pills */}
      <div className="flex flex-wrap gap-1.5 mb-3" aria-label="Course filters">
        {ALL_COURSES.map((course) => {
          const isActive = selectedCourse === course;
          return (
            <button
              type="button"
              key={course}
              onClick={() => setSelectedCourse(course)}
              className={`tag cursor-pointer transition ${
                isActive
                  ? "tag-scarlet font-semibold shadow-xs"
                  : "hover:bg-stone-200 text-stone-600 bg-stone-100"
              }`}
            >
              {course}
            </button>
          );
        })}
      </div>

      {/* Secondary Filters: Library Dropdown & Seats Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs">
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-stone-400" />
          <select
            value={selectedLibrary}
            onChange={(e) => setSelectedLibrary(e.target.value)}
            className="bg-white border border-stone-200 rounded-lg px-2.5 py-1 text-stone-700 font-medium cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-red-800"
          >
            {ALL_LIBRARIES.map((lib) => (
              <option key={lib} value={lib}>
                {lib}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setAvailableOnly(!availableOnly)}
            className={`px-2.5 py-1 rounded-lg border font-medium cursor-pointer transition ${
              availableOnly
                ? "bg-red-800 text-white border-red-800 shadow-xs"
                : "bg-white hover:bg-stone-100 text-stone-600 border-stone-200"
            }`}
          >
            Seats open now
          </button>
        </div>

        {activeTag && (
          <div className="inline-flex items-center gap-1.5 bg-red-100/70 text-red-900 px-2 py-0.5 rounded-md font-medium text-[11px]">
            <span>Tag: #{activeTag}</span>
            <button
              type="button"
              onClick={() => setActiveTag(null)}
              className="hover:text-red-950 cursor-pointer"
            >
              <X size={12} />
            </button>
          </div>
        )}
      </div>

      {/* Session Cards Grid */}
      <div className="grid gap-4">
        {filteredSessions.map((session) => {
          const isLiveDb = !session.id.startsWith("00000000") && !session.id.startsWith("aaaaaaaa") && !session.id.startsWith("bbbbbbbb");

          return (
            <article
              className="panel session-card hover:border-red-200/80 transition-all duration-200"
              key={session.id}
            >
              <div className="flex justify-between items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="course-label">{session.courseCode}</span>
                  {isLiveDb ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      <Database size={10} className="text-emerald-600" />
                      Live Supabase DB
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-stone-500 bg-stone-100 border border-stone-200 px-2 py-0.5 rounded-full">
                      Demo Fixture
                    </span>
                  )}
                </div>

                <span
                  className={`status ${
                    session.status === "active" ? "status-active" : ""
                  }`}
                >
                  <span className="size-1.5 rounded-full bg-current" />
                  {session.status === "active" ? "Studying now" : "Scheduled"}
                </span>
              </div>

              <h3 className="text-xl font-semibold mt-4 tracking-tight text-stone-900">
                {session.title}
              </h3>
              {session.subtitle && (
                <p className="text-sm text-stone-600 leading-6 mt-1.5">
                  {session.subtitle}
                </p>
              )}

              <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-stone-600 mt-4">
                <span className="inline-flex items-center gap-2 font-medium">
                  <MapPin size={15} className="text-red-800" />
                  {session.libraryName}
                </span>
                <span className="inline-flex items-center gap-2">
                  <Users size={15} className="text-stone-500" />
                  <strong className={session.availableSeats > 0 ? "text-emerald-700" : "text-stone-700"}>
                    {session.availableSeats}
                  </strong>{" "}
                  of {session.totalSeats} seats open
                </span>
              </div>

              {(session.floor || session.zone) && (
                <p className="text-xs text-stone-500 mt-1.5">
                  {[session.floor, session.zone].filter(Boolean).join(" · ")}
                </p>
              )}

              {session.scheduledFor && (
                <p className="text-xs text-stone-500 flex items-center gap-1.5 mt-2.5">
                  <CalendarClock size={14} className="text-stone-400" />
                  {new Intl.DateTimeFormat("en-US", {
                    timeZone: "America/New_York",
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  }).format(new Date(session.scheduledFor))}{" "}
                  ET
                </p>
              )}

              {/* AI Topic Tags (clickable to filter) */}
              {session.aiTopicTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {session.aiTopicTags.map((tag) => (
                    <button
                      type="button"
                      key={tag}
                      onClick={() => setActiveTag(tag === activeTag ? null : tag)}
                      className={`text-[11px] px-2 py-0.5 rounded-md border transition cursor-pointer ${
                        activeTag === tag
                          ? "bg-red-800 text-white border-red-800"
                          : "bg-stone-100 hover:bg-stone-200 text-stone-700 border-stone-200"
                      }`}
                      title={`Filter by tag #${tag}`}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              )}

              {/* Card Footer with Request Seat & View Session buttons */}
              <div className="border-t border-stone-100 mt-4 pt-3.5 flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-stone-500 inline-flex items-center gap-1.5">
                  <LockKeyhole size={13} className="text-stone-400" />
                  {session.requiresApproval
                    ? "Host approval required"
                    : "Join to reveal table"}
                </span>

                <div className="flex items-center gap-2">
                  {session.status === "active" && session.availableSeats > 0 && (
                    <button
                      type="button"
                      onClick={() => setJoiningSession(session)}
                      className="button-secondary text-xs py-1 px-2.5 inline-flex items-center gap-1.5 cursor-pointer hover:border-red-300 hover:text-red-800 transition"
                      title="Request to sit at this table"
                    >
                      <UserPlus size={13} className="text-red-800" />
                      <span>Request Seat</span>
                    </button>
                  )}

                  <Link
                    className="text-sm font-semibold text-red-800 inline-flex items-center gap-1.5 hover:underline"
                    href={`/session/${session.id}`}
                  >
                    <span>View session</span>
                    <ArrowUpRight size={15} />
                  </Link>
                </div>
              </div>
            </article>
          );
        })}

        {filteredSessions.length === 0 && (
          <div className="panel muted text-center py-8">
            <p className="text-stone-600 font-medium">No study sessions match your current filter.</p>
            <p className="text-xs text-stone-400 mt-1">Be the first to create one for this course or library!</p>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="mt-4 button-primary inline-flex items-center gap-2 cursor-pointer text-xs"
            >
              <Plus size={14} />
              Post this session
            </button>
          </div>
        )}
      </div>

      <p className="stub-note mt-5 flex items-center justify-between">
        <span>Live Supabase Database & Auth connected · Real-time discovery feed</span>
        <button
          type="button"
          onClick={() => {
            setSelectedCourse("All courses");
            setSelectedLibrary("All libraries");
            setAvailableOnly(false);
            setActiveTag(null);
          }}
          className="text-stone-500 hover:text-stone-800 underline text-[11px] cursor-pointer"
        >
          Reset filters
        </button>
      </p>

      {/* Post a Session Modal */}
      <CreateSessionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSessionCreated={handleSessionCreated}
      />

      {/* Request to Join Modal */}
      <RequestJoinModal
        session={joiningSession}
        onClose={() => setJoiningSession(null)}
      />
    </section>
  );
}
