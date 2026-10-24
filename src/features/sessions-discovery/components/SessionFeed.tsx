import Link from "next/link";
import { ArrowUpRight, CalendarClock, LockKeyhole, MapPin, Plus, Users } from "lucide-react";
import type { SessionPreview } from "@/types/contracts";

export function SessionFeed({ sessions }: { sessions: SessionPreview[] }) {
  return (
    <section aria-labelledby="feed-title">
      <div className="flex flex-wrap gap-4 items-center justify-between mb-5"><div><p className="eyebrow">FIND YOUR PEOPLE</p><h2 className="text-xl font-semibold mt-2" id="feed-title">A good place to start</h2></div><button className="button-primary" disabled><Plus size={16} />Post a session</button></div>
      <div className="flex flex-wrap gap-2 mb-5" aria-label="Course filters (coming soon)"><span className="tag tag-scarlet">All courses</span>{["CSE 2221", "MATH 1151"].map((course) => <button className="tag" disabled key={course}>{course}</button>)}</div>
      <div className="grid gap-4">
        {sessions.map((session) => <article className="panel session-card" key={session.id}>
          <div className="flex justify-between items-center gap-3"><span className="course-label">{session.courseCode}</span><span className={`status ${session.status === "active" ? "status-active" : ""}`}><span className="size-1.5 rounded-full bg-current" />{session.status === "active" ? "Studying now" : "Scheduled"}</span></div>
          <h3 className="text-xl font-semibold mt-5 tracking-tight">{session.title}</h3>
          <p className="text-sm text-stone-500 leading-6 mt-2">{session.subtitle}</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-stone-600 mt-5"><span className="inline-flex items-center gap-2"><MapPin size={15} />{session.libraryName}</span><span className="inline-flex items-center gap-2"><Users size={15} />{session.availableSeats} of {session.totalSeats} seats open</span></div>
          <p className="text-xs text-stone-500 mt-2">{session.floor} · {session.zone}</p>
          {session.scheduledFor && <p className="text-xs text-stone-500 flex gap-2 mt-3"><CalendarClock size={14} />{new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(session.scheduledFor))} ET</p>}
          <div className="flex flex-wrap gap-2 mt-5">{session.aiTopicTags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div>
          <div className="border-t border-stone-100 mt-5 pt-4 flex flex-wrap items-center justify-between gap-3"><span className="text-xs text-stone-500 inline-flex items-center gap-1.5"><LockKeyhole size={13} />{session.requiresApproval ? "Host approval required" : "Join to reveal location"}</span><Link className="text-sm font-semibold text-red-800 inline-flex items-center gap-2 hover:underline" href={`/session/${session.id}`}>View session<ArrowUpRight size={16} /></Link></div>
        </article>)}
        {sessions.length === 0 && <div className="panel muted">No sessions match these courses yet.</div>}
      </div>
      <p className="stub-note">Seeded sessions · posting, filtering, scheduling, and uploads are ready for implementation.</p>
    </section>
  );
}
