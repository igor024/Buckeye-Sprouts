import type { ProfilePreview, ThompsonTableGroup } from "@/types/contracts";

export function ProfileAvatar({ profile }: { profile: ProfilePreview }) {
  const initials = profile.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toLocaleUpperCase();
  return <span className="group-profile-avatar">{profile.avatarUrl ? <img src={profile.avatarUrl} alt="" /> : <span aria-hidden="true">{initials}</span>}</span>;
}

export function GroupRoster({ group, variant = "standard" }: { group: ThompsonTableGroup; variant?: "standard" | "notebook" }) {
  return <ul className={`group-profile-list${variant === "notebook" ? " group-profile-list-notebook" : ""}`} tabIndex={0} aria-label="Group host and members">
    {[group.host, ...group.members].map((profile, index) => <li key={profile.id} className="group-profile-row">
      <ProfileAvatar profile={profile} /><span className="group-profile-name">{profile.name}</span>
      <span className="group-profile-role">{index === 0 ? "Host" : "Member"}</span>
    </li>)}
  </ul>;
}
