import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { ProfilePreview } from "@/types/contracts";
import { resolveAuthenticatedProfile, sampleProfileForAuthUser } from "@/features/auth-profiles/lib/auth-profile";

/** Repair only the signed-in sample's own records; never reset passwords or other users. */
export async function repairSampleIdentity(client: SupabaseClient, user: User, storedProfile: ProfilePreview | null, isCurrentUser = () => true) {
  const sample = sampleProfileForAuthUser(user);
  if (!sample || !isCurrentUser()) return false;
  const profile = resolveAuthenticatedProfile(user, storedProfile);
  const repairProfile = !storedProfile || storedProfile.id !== user.id || storedProfile.name !== sample.name;
  const repairMetadata = user.user_metadata.name !== sample.name;
  if (repairProfile) {
    const { error } = await client.from("profiles").upsert({
      id: user.id, name: profile.name, avatar_url: profile.avatarUrl,
      major: profile.major, current_courses: profile.currentCourses, bio: profile.bio,
    }, { onConflict: "id" });
    if (error) throw new Error(`Cannot repair sample profile: ${error.message}`);
  }
  if (!isCurrentUser()) return repairProfile;
  if (repairMetadata) {
    const { error } = await client.auth.updateUser({ data: {
      ...user.user_metadata, name: profile.name, avatar_url: profile.avatarUrl,
      major: profile.major, current_courses: profile.currentCourses, bio: profile.bio,
    } });
    if (error) throw new Error(`Cannot repair sample metadata: ${error.message}`);
  }
  return repairProfile || repairMetadata;
}
