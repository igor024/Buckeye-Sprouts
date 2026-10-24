import { GraduationCap, ShieldCheck, UserRound } from "lucide-react";
import type { ProfilePreview } from "@/types/contracts";

export function ProfileCard({ profile }: { profile: ProfilePreview | null }) {
  return (
    <section className="panel" aria-labelledby="profile-title">
      <div className="panel-heading"><UserRound size={18} /><h2 id="profile-title">Your study profile</h2></div>
      {profile ? <>
        <div className="flex items-center gap-3 mt-5">
          <div className="avatar" aria-hidden="true">{profile.name.split(" ").map((part) => part[0]).join("")}</div>
          <div><h3 className="font-semibold">{profile.name}</h3><p className="text-xs text-stone-500 mt-1">Demo profile · Ohio State</p></div>
        </div>
        <p className="flex gap-2 text-sm mt-5 text-stone-600"><GraduationCap size={17} className="shrink-0" />{profile.major}</p>
        <p className="text-sm text-stone-500 leading-6 mt-3">{profile.bio}</p>
        <div className="flex flex-wrap gap-2 mt-4">{profile.currentCourses.map((course) => <span className="tag" key={course}>{course}</span>)}</div>
      </> : <p className="muted mt-4">Sign in to create your profile.</p>}
      <div className="notice mt-5"><ShieldCheck size={17} className="shrink-0" /><p>Hosts review your profile before sharing a table location.</p></div>
      <button className="button-secondary w-full mt-4" disabled>Edit profile · coming soon</button>
    </section>
  );
}
