import { ProfileCard } from "@/features/auth-profiles/components/ProfileCard";
import { authProfilesService } from "@/features/auth-profiles/services";
import { LocationStatus } from "@/features/location-checkin/components/LocationStatus";
import { sessionsDiscoveryService } from "@/features/sessions-discovery/services";
import { ThompsonMap } from "@/features/campus-map/components/ThompsonMap";

export default async function DashboardPage() {
  const [profile, sessions] = await Promise.all([
    authProfilesService.getCurrentProfile(),
    sessionsDiscoveryService.listSessions(),
  ]);

  return (
    <main id="main" className="home-app">
      <ThompsonMap
        sessions={sessions}
        profile={profile}
        profilePanel={<ProfileCard profile={profile} />}
        locationPanel={<LocationStatus />}
      />
    </main>
  );
}
