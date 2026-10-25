import type { User } from "@supabase/supabase-js";
import type { ProfilePreview } from "@/types/contracts";
import { profileDisplayName } from "@/lib/profile-display-name";

/** Keep the authenticated UUID and identity available while the profile store is offline. */
export function profileFromAuthUser(user: User): ProfilePreview {
  const metadata: Record<string, unknown> = user.user_metadata;
  const text = (key: string) => typeof metadata[key] === "string" ? metadata[key] : "";
  return {
    id: user.id,
    name: profileDisplayName(text("name") || user.email?.split("@")[0] || "Buckeye Student"),
    avatarUrl: text("avatar_url"),
    major: text("major") || "Undeclared",
    currentCourses: Array.isArray(metadata.current_courses)
      ? metadata.current_courses.filter((course): course is string => typeof course === "string")
      : [],
    bio: text("bio"),
  };
}
