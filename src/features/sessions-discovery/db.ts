import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { CreateSessionInput, SessionDetail, SessionFilters, SessionPreview } from "@/types/contracts";

let adminClient: SupabaseClient | null = null;

export function getSupabaseAdminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  if (!adminClient) {
    adminClient = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return adminClient;
}

interface StudySessionRow {
  id: string;
  host_id: string;
  title: string;
  subtitle: string | null;
  course_code: string;
  library_name: string;
  floor: string | null;
  zone: string | null;
  total_seats: number;
  available_seats: number;
  requires_approval: boolean;
  status: "scheduled" | "active" | "closed";
  scheduled_for: string | null;
  ai_topic_tags: string[] | null;
  created_at: string;
}

interface SessionPrivateRow {
  session_id: string;
  table_id: string;
  surroundings_photo_path: string | null;
  gps_lat: number;
  gps_lng: number;
}

export function mapDbSessionToPreview(row: StudySessionRow): SessionPreview {
  return {
    id: row.id,
    hostId: row.host_id,
    title: row.title,
    subtitle: row.subtitle || "",
    courseCode: row.course_code,
    libraryName: row.library_name,
    floor: row.floor || undefined,
    zone: row.zone || undefined,
    totalSeats: row.total_seats,
    availableSeats: row.available_seats,
    requiresApproval: row.requires_approval,
    status: row.status,
    scheduledFor: row.scheduled_for || undefined,
    aiTopicTags: Array.isArray(row.ai_topic_tags) ? row.ai_topic_tags : [],
    createdAt: row.created_at,
  };
}

export async function fetchDbSessions(filters: SessionFilters = {}): Promise<SessionPreview[] | null> {
  const client = getSupabaseAdminClient();
  if (!client) return null;

  try {
    let query = client.from("study_sessions").select("*");

    if (filters.courseCode) {
      query = query.eq("course_code", filters.courseCode);
    }
    if (filters.libraryName) {
      query = query.eq("library_name", filters.libraryName);
    }
    if (filters.status) {
      query = query.eq("status", filters.status);
    } else {
      query = query.neq("status", "closed");
    }

    query = query.order("created_at", { ascending: false });

    const { data, error } = await query;
    if (error) {
      console.warn("[SessionsDB] Error listing sessions:", error.message);
      return null;
    }

    return (data as StudySessionRow[]).map(mapDbSessionToPreview);
  } catch (err) {
    console.warn("[SessionsDB] Failed to query study_sessions:", err);
    return null;
  }
}

export async function fetchDbSessionDetail(sessionId: string, viewerId?: string | null): Promise<SessionDetail | null> {
  const client = getSupabaseAdminClient();
  if (!client) return null;

  try {
    const { data: sessionRow, error } = await client
      .from("study_sessions")
      .select("*")
      .eq("id", sessionId)
      .maybeSingle();

    if (error || !sessionRow) return null;

    const row = sessionRow as StudySessionRow;
    const preview = mapDbSessionToPreview(row);

    // Determine access level
    let access: "host" | "member" | "locked" = "locked";
    if (viewerId) {
      if (row.host_id === viewerId) {
        access = "host";
      } else {
        const { data: joinRow } = await client
          .from("join_requests")
          .select("status")
          .eq("session_id", sessionId)
          .eq("requester_id", viewerId)
          .eq("status", "approved")
          .maybeSingle();

        if (joinRow) {
          access = "member";
        }
      }
    }

    let location = null;
    if (access !== "locked") {
      const { data: privateRow } = await client
        .from("session_private_details")
        .select("table_id, surroundings_photo_path, gps_lat, gps_lng")
        .eq("session_id", sessionId)
        .maybeSingle();

      if (privateRow) {
        const pRow = privateRow as SessionPrivateRow;
        location = {
          tableId: pRow.table_id,
          surroundingsPhotoUrl: pRow.surroundings_photo_path || "",
          gpsCoordinates: {
            lat: pRow.gps_lat,
            lng: pRow.gps_lng,
          },
        };
      }
    }

    return {
      session: preview,
      access,
      location,
    };
  } catch (err) {
    console.warn("[SessionsDB] Failed to get session detail:", err);
    return null;
  }
}

export async function insertDbSession(input: CreateSessionInput, hostId: string): Promise<SessionPreview> {
  const client = getSupabaseAdminClient();
  if (!client) {
    throw new Error("Supabase persistence client is unavailable.");
  }

  // Derive relevant AI tags based on course code and location
  const aiTopicTags = [
    input.courseCode,
    input.libraryName.includes("Thompson") ? "Thompson Stacks" : "18th Ave Study",
    "Midterm Review",
  ];

  // 1. Insert into public.study_sessions
  const { data: sessionRow, error: sessionError } = await client
    .from("study_sessions")
    .insert({
      host_id: hostId,
      title: input.title,
      subtitle: input.subtitle || "",
      course_code: input.courseCode,
      library_name: input.libraryName,
      floor: input.floor || null,
      zone: input.zone || null,
      total_seats: input.totalSeats,
      available_seats: input.availableSeats,
      requires_approval: input.requiresApproval,
      status: input.status,
      scheduled_for: input.scheduledFor || null,
      ai_topic_tags: aiTopicTags,
    })
    .select()
    .single();

  if (sessionError || !sessionRow) {
    console.error("[SessionsDB] Insert session failed:", sessionError);
    throw sessionError || new Error("Failed to insert study session record.");
  }

  const row = sessionRow as StudySessionRow;

  // 2. Insert into public.session_private_details
  const { error: privateError } = await client
    .from("session_private_details")
    .insert({
      session_id: row.id,
      table_id: input.tableId,
      surroundings_photo_path: input.surroundingsPhotoUrl || "",
      gps_lat: input.gpsCoordinates.lat,
      gps_lng: input.gpsCoordinates.lng,
    });

  if (privateError) {
    console.error("[SessionsDB] Private details failed, rolling back session row:", privateError);
    await client.from("study_sessions").delete().eq("id", row.id);
    throw privateError;
  }

  return mapDbSessionToPreview(row);
}
