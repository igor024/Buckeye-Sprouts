import "server-only";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { DemoStudyGroup, ProfilePreview } from "@/types/contracts";
import { sessionGroupSeats } from "@/lib/group-seats";
import { profileDisplayName } from "@/lib/profile-display-name";

export async function fetchLiveMapGroups(): Promise<DemoStudyGroup[]> {
  if (!isSupabaseConfigured) {
    return [];
  }

  const client = getSupabaseAdminClient();
  if (!client) return [];

  try {
    const { data, error } = await client
      .from("study_sessions")
      .select(`
        *,
        session_private_details (
          table_id,
          surroundings_photo_path,
          gps_lat,
          gps_lng
        ),
        profiles (
          id,
          name,
          avatar_url,
          major,
          current_courses,
          bio
        ),
        shared_notebooks (
          content,
          ai_summary,
          ai_suggestions,
          updated_at
        ),
        join_requests (
          requester_id,
          status,
          profiles (
            id,
            name,
            avatar_url,
            major,
            current_courses,
            bio
          )
        ),
        check_ins (
          user_id,
          method,
          checked_in_at,
          checked_out_at,
          profiles (
            id,
            name,
            avatar_url,
            major,
            current_courses,
            bio
          )
        )
      `)
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("[MapGroups] Error fetching study_sessions:", error.message);
      return [];
    }

    if (!data) return [];

    return data.map((row: any) => {
      const hostProfile: ProfilePreview = row.profiles ? {
        id: row.profiles.id,
        name: profileDisplayName(row.profiles.name),
        avatarUrl: row.profiles.avatar_url || "",
        major: row.profiles.major || "Computer Science & Engineering",
        currentCourses: row.profiles.current_courses || [row.course_code],
        bio: row.profiles.bio || "",
      } : {
        id: row.host_id,
        name: "Study Host",
        avatarUrl: "",
        major: "Computer Science & Engineering",
        currentCourses: [row.course_code],
        bio: "",
      };

      const pRow = Array.isArray(row.session_private_details)
        ? row.session_private_details[0]
        : row.session_private_details;
      const tableId = row.table_id || pRow?.table_id || "165-1";

      const nbRow = Array.isArray(row.shared_notebooks)
        ? row.shared_notebooks[0]
        : row.shared_notebooks;
      const notebookContent = nbRow?.content || `## ${row.course_code} study notes\n[note] ${hostProfile.name} · Shared\n${row.subtitle || row.title}.`;

      const members: ProfilePreview[] = [];
      const seenIds = new Set<string>([hostProfile.id]);

      // 1. Members from approved join_requests
      if (Array.isArray(row.join_requests)) {
        for (const req of row.join_requests) {
          if (req.status === "approved" && req.profiles && !seenIds.has(req.profiles.id)) {
            seenIds.add(req.profiles.id);
            members.push({
              id: req.profiles.id,
              name: profileDisplayName(req.profiles.name),
              avatarUrl: req.profiles.avatar_url || "",
              major: req.profiles.major || "Buckeye Student",
              currentCourses: req.profiles.current_courses || [row.course_code],
              bio: req.profiles.bio || "",
            });
          }
        }
      }

      // 2. Active members currently checked in at the table
      if (Array.isArray(row.check_ins)) {
        for (const checkin of row.check_ins) {
          if (!checkin.checked_out_at && checkin.profiles && !seenIds.has(checkin.profiles.id)) {
            seenIds.add(checkin.profiles.id);
            members.push({
              id: checkin.profiles.id,
              name: profileDisplayName(checkin.profiles.name),
              avatarUrl: checkin.profiles.avatar_url || "",
              major: checkin.profiles.major || "Buckeye Student",
              currentCourses: checkin.profiles.current_courses || [row.course_code],
              bio: checkin.profiles.bio || "",
            });
          }
        }
      }

      return {
        ...sessionGroupSeats(row),
        id: row.id,
        tableId,
        name: row.title,
        courseCode: row.course_code,
        topic: row.subtitle || (Array.isArray(row.ai_topic_tags) && row.ai_topic_tags[0] ? row.ai_topic_tags.join(", ") : "Study Session"),
        host: hostProfile,
        members,
        inviteOnly: Boolean(row.requires_approval),
        invitedProfileIds: [],
        joinedAtByProfileId: {
          [hostProfile.id]: new Date(row.created_at || Date.now()).getTime(),
          ...Object.fromEntries(members.map((m, idx) => [m.id, new Date(row.created_at || Date.now()).getTime() + idx + 1])),
        },
        notebookContent,
      };
    });
  } catch (err) {
    console.warn("[MapGroups] Exception fetching study groups from Supabase:", err);
    return [];
  }
}
