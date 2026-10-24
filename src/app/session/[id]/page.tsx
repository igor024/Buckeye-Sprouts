import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, LockKeyhole, Users } from "lucide-react";
import { ApprovalQueue } from "@/features/auth-profiles/components/ApprovalQueue";
import { JoinApprovalGate } from "@/features/auth-profiles/components/JoinApprovalGate";
import { authDemoEnabled, authProfilesService } from "@/features/auth-profiles/services";
import { sessionsDiscoveryService } from "@/features/sessions-discovery/services";
import { LocationStatus } from "@/features/location-checkin/components/LocationStatus";
import { locationCheckInService } from "@/features/location-checkin/services";
import { NotebookPanel } from "@/features/notebook-ai/components/NotebookPanel";
import { notebookAIService } from "@/features/notebook-ai/services";

export async function generateStaticParams() {
  const sessions = await sessionsDiscoveryService.listSessions();
  return sessions.map((session) => ({ id: session.id }));
}

export default async function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await sessionsDiscoveryService.getSession(id);
  if (!detail) notFound();
  const [requests, checkIn, notebook] = await Promise.all([
    authProfilesService.listJoinRequests(id),
    locationCheckInService.getCheckIn(id),
    notebookAIService.getNotebook(id),
  ]);

  return (
    <main id="main" className="site-width pt-9">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-red-800"><ArrowLeft size={15} />Back to discovery</Link>
      <div className="flex flex-wrap items-start justify-between gap-5 mt-7 mb-8"><div><p className="eyebrow">{detail.session.courseCode} · {detail.session.libraryName}</p><h1 className="text-3xl sm:text-4xl tracking-tight font-semibold mt-3">{detail.session.title}</h1><p className="muted mt-3">{detail.session.subtitle}</p></div><span className="tag inline-flex items-center gap-2"><Users size={14} />{detail.session.availableSeats} seats open</span></div>
      <div className="demo-notice mb-7"><LockKeyhole size={16} className="shrink-0" /><p>{detail.access === "host" ? "Host preview with a synthetic identity. Review actions, GPS, and live editing are not connected." : "Table details, surroundings photos, and notebook content stay hidden until membership is approved."}</p></div>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        <aside className="md:col-span-4 xl:col-span-3"><LocationStatus detail={detail} checkIn={checkIn} /></aside>
        <div className="md:col-span-8 xl:col-span-6"><NotebookPanel notebook={notebook} locked={detail.access === "locked"} /></div>
        <aside className="md:col-span-12 xl:col-span-3 grid gap-6">
          <JoinApprovalGate session={detail.session} access={detail.access} demoMode={authDemoEnabled} />
          <ApprovalQueue requests={requests} isHost={detail.access === "host"} />
        </aside>
      </div>
    </main>
  );
}
