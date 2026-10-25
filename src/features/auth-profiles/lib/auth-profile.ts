import type { User } from "@supabase/supabase-js";
import type { ProfilePreview } from "@/types/contracts";
import { profileDisplayName } from "@/lib/profile-display-name";
import { SAMPLE_ACCOUNTS } from "../sample-accounts.mjs";

function sampleAccount(user: User) {
  return SAMPLE_ACCOUNTS.find((account) => account.email === user.email?.trim().toLowerCase());
}

export function sampleProfileForAuthUser(user: User): ProfilePreview | null {
  const account = sampleAccount(user);
  return account ? {
    id: user.id, name: account.name, avatarUrl: "", major: account.major,
    currentCourses: [...account.currentCourses], bio: account.bio,
  } : null;
}

/** Keep the authenticated UUID and identity available while the profile store is offline. */
export function profileFromAuthUser(user: User): ProfilePreview {
  const metadata: Record<string, unknown> = user.user_metadata;
  const text = (key: string) => typeof metadata[key] === "string" ? metadata[key] : "";
  const sample = sampleProfileForAuthUser(user);
  if (sample && profileDisplayName(text("name")) !== sample.name) return sample;
  return {
    id: user.id,
    name: sampleAccount(user)?.name ?? profileDisplayName(text("name") || user.email?.split("@")[0] || "Buckeye Student"),
    avatarUrl: text("avatar_url"),
    major: text("major") || "Undeclared",
    currentCourses: Array.isArray(metadata.current_courses)
      ? metadata.current_courses.filter((course): course is string => typeof course === "string")
      : [],
    bio: text("bio"),
  };
}

/** Sample identities come from authenticated email, never stale demo profile names. */
export function resolveAuthenticatedProfile(user: User, storedProfile: ProfilePreview | null): ProfilePreview {
  if (!storedProfile || storedProfile.id !== user.id) return profileFromAuthUser(user);
  const sample = sampleProfileForAuthUser(user);
  if (sample && profileDisplayName(storedProfile.name) !== sample.name) return sample;
  return { ...storedProfile, name: sampleAccount(user)?.name ?? profileDisplayName(storedProfile.name) };
}
