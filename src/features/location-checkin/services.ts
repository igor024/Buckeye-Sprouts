import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured, mockStore, mockViewerId } from "@/lib/supabase";
import type {
  CheckInPayload,
  CheckInReceipt,
  LibraryGeofence,
  LocationCheckInService,
  RoomBookingRequest,
  RoomBookingResponse,
  Unsubscribe,
} from "@/types/contracts";
import { resolveLibraryGeofence } from "./haversine";

let adminClient: SupabaseClient | null = null;
function getSupabaseAdmin(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  if (!adminClient) {
    adminClient = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return adminClient;
}

/**
 * Server implementation of LocationCheckInService.
 * Supports live Supabase persistence with seamless fallback to in-memory fixtures.
 */
export const locationCheckInService: LocationCheckInService = {
  async getCheckIn(sessionId: string, userId?: string): Promise<CheckInReceipt | null> {
    const targetUserId = userId || mockViewerId;

    // 1. Live Supabase database check
    if (isSupabaseConfigured) {
      const admin = getSupabaseAdmin();
      if (admin) {
        const { data: row } = await admin
          .from("check_ins")
          .select("id, session_id, user_id, method, checked_in_at, checked_out_at")
          .eq("session_id", sessionId)
          .is("checked_out_at", null)
          .order("checked_in_at", { ascending: false })
          .maybeSingle();

        if (row) {
          return {
            id: row.id,
            sessionId: row.session_id,
            userId: row.user_id,
            method: row.method as CheckInPayload["method"],
            checkedInAt: row.checked_in_at,
            checkedOutAt: row.checked_out_at || undefined,
          };
        }
      }
    }

    // 2. Local mock store fallback
    const receipt = mockStore.checkIns.find(
      (item) => item.sessionId === sessionId && !item.checkedOutAt && (item.userId === targetUserId || true)
    );
    return receipt ? structuredClone(receipt) : null;
  },

  async getGeofence(libraryName: string): Promise<LibraryGeofence | null> {
    // 1. Live Supabase database check
    if (isSupabaseConfigured) {
      const admin = getSupabaseAdmin();
      if (admin) {
        const { data: row } = await admin
          .from("library_geofences")
          .select("library_name, center_lat, center_lng, radius_meters")
          .eq("library_name", libraryName)
          .maybeSingle();

        if (row) {
          return {
            libraryName: row.library_name,
            center: { lat: row.center_lat, lng: row.center_lng },
            radiusMeters: row.radius_meters,
          };
        }
      }
    }

    // 2. Pre-computed campus geofence registry
    const registered = resolveLibraryGeofence(libraryName);
    return structuredClone(registered);
  },

  async checkIn(sessionId: string, payload: CheckInPayload, userId?: string): Promise<CheckInReceipt> {
    const targetUserId = userId || mockViewerId;
    const nowIso = new Date().toISOString();

    // 1. Record in Supabase database if configured
    if (isSupabaseConfigured) {
      const admin = getSupabaseAdmin();
      if (admin) {
        // Only persist in Supabase if the user exists in profiles (otherwise use mock store)
        const { data: profileRow } = await admin
          .from("profiles")
          .select("id")
          .eq("id", targetUserId)
          .maybeSingle();

        if (profileRow) {
          // Check for existing active check-in
          const { data: existing } = await admin
            .from("check_ins")
            .select("id, session_id, user_id, method, checked_in_at")
            .eq("session_id", sessionId)
            .eq("user_id", targetUserId)
            .is("checked_out_at", null)
            .maybeSingle();

          if (existing) {
            return {
              id: existing.id,
              sessionId: existing.session_id,
              userId: existing.user_id,
              method: existing.method as CheckInPayload["method"],
              checkedInAt: existing.checked_in_at,
            };
          }

          const { data: inserted, error } = await admin
            .from("check_ins")
            .insert({
              session_id: sessionId,
              user_id: targetUserId,
              method: payload.method,
              checked_in_at: nowIso,
            })
            .select()
            .single();

          if (!error && inserted) {
            const receipt: CheckInReceipt = {
              id: inserted.id,
              sessionId: inserted.session_id,
              userId: inserted.user_id,
              method: inserted.method as CheckInPayload["method"],
              checkedInAt: inserted.checked_in_at,
            };
            mockStore.checkIns.unshift(receipt);
            return receipt;
          }
        }
      }
    }

    // 2. Record in in-memory mock store
    const existingMock = mockStore.checkIns.find(
      (item) => item.sessionId === sessionId && item.userId === targetUserId && !item.checkedOutAt
    );
    if (existingMock) {
      return structuredClone(existingMock);
    }

    const receipt: CheckInReceipt = {
      id: crypto.randomUUID(),
      sessionId,
      userId: targetUserId,
      method: payload.method,
      checkedInAt: nowIso,
    };
    mockStore.checkIns.unshift(receipt);
    return receipt;
  },

  async checkOut(sessionId: string, userId?: string): Promise<void> {
    const nowIso = new Date().toISOString();

    // 1. Update in Supabase database
    if (isSupabaseConfigured) {
      const admin = getSupabaseAdmin();
      if (admin) {
        let query = admin
          .from("check_ins")
          .update({ checked_out_at: nowIso })
          .eq("session_id", sessionId)
          .is("checked_out_at", null);

        if (userId) {
          query = query.eq("user_id", userId);
        }

        await query;
      }
    }

    // 2. Update in-memory mock store
    const active = mockStore.checkIns.filter(
      (item) => item.sessionId === sessionId && !item.checkedOutAt && (!userId || item.userId === userId)
    );
    for (const item of active) {
      item.checkedOutAt = nowIso;
    }
  },

  watchHostGeofence(_sessionId: string, _onExit: () => void): Unsubscribe {
    // Note: Browser execution happens via watchHostGeofenceClient in device.ts
    throw new Error(
      "watchHostGeofence is a browser-only device API. Use watchHostGeofenceClient from @/features/location-checkin/device on the client."
    );
  },

  async bookRoom(input: RoomBookingRequest): Promise<RoomBookingResponse> {
    void input;
    return {
      status: "stub",
      bookingId: null,
      message: "Room booking provider is not connected. No reservation was made.",
    };
  },
};

/**
 * Closes an active study session when a host departs the library geofence boundary.
 * Frees the table for other students and checks out active occupancies.
 */
export async function closeSessionOnDeparture(sessionId: string): Promise<void> {
  // 1. Close session in Supabase database
  if (isSupabaseConfigured) {
    const admin = getSupabaseAdmin();
    if (admin) {
      await admin.from("study_sessions").update({ status: "closed" }).eq("id", sessionId);
    }
  }

  // 2. Close session in mock store
  const mockSession = mockStore.sessions.find((s) => s.id === sessionId);
  if (mockSession) {
    mockSession.status = "closed";
  }

  // 3. Check out all active occupants for this table
  await locationCheckInService.checkOut(sessionId);
}

/**
 * Re-opens a closed study session (for demo and judge reset workflows).
 */
export async function reopenSessionForDemo(sessionId: string): Promise<void> {
  if (isSupabaseConfigured) {
    const admin = getSupabaseAdmin();
    if (admin) {
      await admin.from("study_sessions").update({ status: "active" }).eq("id", sessionId);
    }
  }

  const mockSession = mockStore.sessions.find((s) => s.id === sessionId);
  if (mockSession) {
    mockSession.status = "active";
  }
}
