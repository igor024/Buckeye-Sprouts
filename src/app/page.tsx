import { ProfileCard } from "@/features/auth-profiles/components/ProfileCard";
import { authProfilesService } from "@/features/auth-profiles/services";
import { sessionsDiscoveryService } from "@/features/sessions-discovery/services";
import { ThompsonMap } from "@/app/components/ThompsonMap";
import { fetchLiveMapGroups } from "@/lib/server-groups";
import { normalizeQrTableId } from "@/lib/table-qr";

export const dynamic = "force-dynamic";

export default async function DashboardPage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const initialReaderTableId = query.tab === "join" ? normalizeQrTableId(query.table) : null;
  const [profile, sessions, liveGroups] = await Promise.all([
    authProfilesService.getCurrentProfile(),
    sessionsDiscoveryService.listSessions(),
    fetchLiveMapGroups(),
  ]);

  return (
    <main id="main" className="home-app">
      <ThompsonMap
        sessions={sessions}
        initialGroups={liveGroups}
        initialReaderTableId={initialReaderTableId}
        initialTab={query.tab === "join" ? "join" : "groups"}
        profile={profile}
        profilePanel={<ProfileCard profile={profile} />}
      />
    </main>
  );
}
