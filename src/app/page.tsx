import { ArrowDownRight, Sparkles } from "lucide-react";
import { ProfileCard } from "@/features/auth-profiles/components/ProfileCard";
import { authProfilesService } from "@/features/auth-profiles/services";
import { SessionFeed } from "@/features/sessions-discovery/components/SessionFeed";
import { sessionsDiscoveryService } from "@/features/sessions-discovery/services";
import { LocationStatus } from "@/features/location-checkin/components/LocationStatus";
import { NotebookPanel } from "@/features/notebook-ai/components/NotebookPanel";

// Keep composition here. Feature logic and styles belong to the owning folder.
export default async function DashboardPage() {
  const [profile, sessions] = await Promise.all([
    authProfilesService.getCurrentProfile(),
    sessionsDiscoveryService.listSessions(),
  ]);

  return (
    <main id="main" className="site-width pt-9 sm:pt-12">
      <section className="hero mb-9">
        <div className="relative z-10"><p className="eyebrow">GOOD COMPANY. GREAT STUDY SESSIONS.</p><h1 className="hero-title">Your next breakthrough<br />starts <span>together.</span></h1><p className="text-stone-600 text-sm sm:text-base leading-7 mt-5 max-w-lg">Find a seat, meet your people, and make sense of the hard stuff. There&apos;s a study group for that.</p><a href="#feed" className="inline-flex items-center gap-2 text-sm font-semibold text-red-800 mt-6 hover:underline">Explore study sessions <ArrowDownRight size={17} /></a></div>
        <div className="hero-note hidden md:block"><span className="text-3xl" aria-hidden="true">✳</span><p className="font-semibold text-xl leading-7 mt-3">A little less solo.<br />A lot more &ldquo;got it.&rdquo;</p><p className="text-xs mt-5 text-stone-500">{sessions.length} example groups around campus</p></div>
      </section>
      <div className="demo-notice mb-7"><Sparkles size={16} className="shrink-0" /><p>Scaffold preview: you&apos;re viewing Alex&apos;s synthetic profile. All feature services use local fixtures; disabled controls mark upcoming work.</p></div>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        <aside className="md:col-span-4 xl:col-span-3 grid gap-6"><ProfileCard profile={profile} /><LocationStatus /></aside>
        <div id="feed" className="md:col-span-8 xl:col-span-5 scroll-mt-6"><SessionFeed sessions={sessions} /></div>
        <aside className="md:col-span-12 xl:col-span-4"><NotebookPanel notebook={null} /></aside>
      </div>
    </main>
  );
}
