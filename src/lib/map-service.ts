import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { DemoCreateGroupInput, DemoStudyGroup, ProfilePreview } from "@/types/contracts";

export function mapDbSessionToDemoGroup(row: any): DemoStudyGroup {
  const hostProfile: ProfilePreview = row.profiles ? {
    id: row.profiles.id,
    name: row.profiles.name,
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
  const tableId = pRow?.table_id || "165-1";

  const nbRow = Array.isArray(row.shared_notebooks)
    ? row.shared_notebooks[0]
    : row.shared_notebooks;
  const notebookContent = nbRow?.content || `## ${row.course_code} study notes\n[note] ${hostProfile.name} · Shared\n${row.subtitle || row.title}.`;

  const members: ProfilePreview[] = [];
  if (Array.isArray(row.join_requests)) {
    for (const req of row.join_requests) {
      if (req.status === "approved" && req.profiles && req.profiles.id !== hostProfile.id) {
        members.push({
          id: req.profiles.id,
          name: req.profiles.name,
          avatarUrl: req.profiles.avatar_url || "",
          major: req.profiles.major || "Buckeye Student",
          currentCourses: req.profiles.current_courses || [row.course_code],
          bio: req.profiles.bio || "",
        });
      }
    }
  }

  return {
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
}

/** Directly queries Supabase database from the browser */
export async function fetchGroupsDirectFromSupabase(): Promise<DemoStudyGroup[] | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
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
        )
      `)
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (error || !data) {
      console.warn("[ClientSupabase] Direct query warning:", error?.message);
      return null;
    }

    return data.map(mapDbSessionToDemoGroup);
  } catch (err) {
    console.warn("[ClientSupabase] Exception in direct query:", err);
    return null;
  }
}

/** Saves notebook edits directly to Supabase */
export async function saveNotebookToSupabase(sessionId: string, content: string, profileId?: string) {
  const supabase = getSupabaseBrowserClient();
  if (supabase) {
    try {
      await supabase.from("shared_notebooks").upsert({
        session_id: sessionId,
        content,
        last_updated_by: profileId || undefined,
        updated_at: new Date().toISOString(),
      });
    } catch {}
  }

  fetch("/api/map/groups", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "notebook", sessionId, content, profileId }),
  }).catch(() => {});
}

/** Closes study session in Supabase */
export async function endSessionInSupabase(sessionId: string, tableId?: string) {
  const supabase = getSupabaseBrowserClient();
  if (supabase) {
    try {
      await supabase.from("study_sessions").update({ status: "closed" }).eq("id", sessionId);
      if (tableId) {
        await supabase.from("room_ids").update({ active_session_id: null }).eq("id", tableId);
      }
    } catch {}
  }

  fetch("/api/map/groups", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "end", sessionId, tableId }),
  }).catch(() => {});
}

/** Creates a study session at a table in Supabase */
export async function createSessionInSupabase(input: DemoCreateGroupInput, profile: ProfilePreview) {
  const res = await fetch("/api/map/groups", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tableId: input.tableId,
      name: input.name,
      courseCode: input.courseCode,
      inviteOnly: input.inviteOnly,
      hostProfile: profile,
    }),
  });
  return res.json();
}
