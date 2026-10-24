import "server-only";
import { getMockSessionAccess, mockStore, mockViewerId } from "@/lib/supabase";
import { FeatureNotImplementedError, type LocationCheckInService } from "@/types/contracts";

/** Workstream 3: extract browser device APIs to a client module before implementing. */
export const locationCheckInService: LocationCheckInService = {
  async getCheckIn(sessionId) {
    if (getMockSessionAccess(sessionId) === "locked") return null;
    const receipt = mockStore.checkIns.find((item) => item.sessionId === sessionId && item.userId === mockViewerId);
    return receipt ? structuredClone(receipt) : null;
  },
  async getGeofence(libraryName) {
    const geofence = mockStore.geofences.find((item) => item.libraryName === libraryName);
    return geofence ? structuredClone(geofence) : null;
  },
  async checkIn() { throw new FeatureNotImplementedError("checkIn"); },
  async checkOut() { throw new FeatureNotImplementedError("checkOut"); },
  watchHostGeofence() { throw new FeatureNotImplementedError("watchHostGeofence"); },
  async bookRoom() {
    return { status: "stub", bookingId: null, message: "Room booking provider is not connected. No reservation was made." };
  },
};
