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
  if (process.env.NODE_ENV === "development" && query.dev === "1") {
    const [{ DevEditor }, { readDevEditor }] = await Promise.all([
      import("@/lib/DevEditor"), import("@/lib/dev-editor-actions"),
    ]);
    return <DevEditor initialData={await readDevEditor()} />;
  }
  const initialReaderTableId = query.tab === "join" ? normalizeQrTableId(query.table) : null;
  const [profile, sessions, liveGroups] = await Promise.all([
    authProfilesService.getCurrentProfile(),
    sessionsDiscoveryService.listSessions(),
    fetchLiveMapGroups(),
  ]);

  return (
    <main id="main" className="home-app">
      {process.env.NODE_ENV === "development" && <a href="/?dev=1" className="button-secondary" style={{ position: "fixed", top: 10, right: 10, zIndex: 10000 }}>Dev editor</a>}
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
