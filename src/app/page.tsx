import { ProfileCard } from "@/features/auth-profiles/components/ProfileCard";
import { authProfilesService } from "@/features/auth-profiles/services";
import { LocationStatus } from "@/features/location-checkin/components/LocationStatus";
import { sessionsDiscoveryService } from "@/features/sessions-discovery/services";
import { ThompsonMap } from "@/app/components/ThompsonMap";
import { fetchLiveMapGroups } from "@/lib/server-groups";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
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
        profile={profile}
        profilePanel={<ProfileCard profile={profile} />}
        locationPanel={<LocationStatus />}
      />
    </main>
  );
}
