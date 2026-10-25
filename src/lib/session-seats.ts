import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Reconcile persisted capacity and availability with physical presence, not join approvals. */
export async function syncStudySessionSeats(client: SupabaseClient): Promise<void> {
  const pageSize = 200;

  for (let offset = 0; ; offset += pageSize) {
    const { data: sessions, error } = await client
      .from("study_sessions")
      .select("id, total_seats, available_seats, check_ins(user_id, checked_out_at)")
      .is("check_ins.checked_out_at", null)
      .order("id")
      .range(offset, offset + pageSize - 1);

    if (error) throw new Error(`Failed to read session check-ins: ${error.message}`);
    if (!sessions) throw new Error("Session check-ins were not returned");

    for (const session of sessions) {
      const occupiedSeats = new Set(
        session.check_ins
          .filter((checkIn) => checkIn.checked_out_at === null)
          .map((checkIn) => checkIn.user_id),
      ).size;
      // Capacity stays fixed on departure. Repair legacy overcapacity without
      // producing negative availability or violating the database constraints.
      const totalSeats = Math.max(session.total_seats, occupiedSeats);
      const availableSeats = totalSeats - occupiedSeats;
      if (session.total_seats === totalSeats && session.available_seats === availableSeats) continue;

      const { error: updateError } = await client
        .from("study_sessions")
        .update({ total_seats: totalSeats, available_seats: availableSeats })
        .eq("id", session.id)
        .select("id")
        .single();

      if (updateError) throw new Error(`Failed to sync session seats: ${updateError.message}`);
    }

    if (sessions.length < pageSize) return;
  }
}
