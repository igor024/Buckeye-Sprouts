"use server";

import { revalidatePath } from "next/cache";
import type { CheckInPayload, CheckInReceipt } from "@/types/contracts";
import {
  closeSessionOnDeparture,
  locationCheckInService,
  reopenSessionForDemo,
} from "./services";
import { resolveLibraryGeofence } from "./haversine";

export async function checkInAction(
  sessionId: string,
  payload: CheckInPayload
): Promise<CheckInReceipt> {
  const receipt = await locationCheckInService.checkIn(sessionId, payload);
  revalidatePath(`/session/${sessionId}`);
  return receipt;
}

export async function checkOutAction(sessionId: string): Promise<void> {
  await locationCheckInService.checkOut(sessionId);
  revalidatePath(`/session/${sessionId}`);
}

export async function simulateCheckInAction(
  sessionId: string,
  method: "table_qr" | "buck_id" = "table_qr",
  customTableId?: string
): Promise<CheckInReceipt> {
  const geofence = resolveLibraryGeofence("Thompson Library");
  const payload: CheckInPayload = {
    method,
    rawCode:
      method === "table_qr"
        ? JSON.stringify({ libraryName: "Thompson Library", tableId: customTableId || "TH-412" })
        : "OSU-BUCKID-128-482910",
    tableId: customTableId || (method === "table_qr" ? "TH-412" : "TH-201-A"),
    libraryName: "Thompson Library",
    gps: geofence.center,
  };

  const receipt = await locationCheckInService.checkIn(sessionId, payload);
  revalidatePath(`/session/${sessionId}`);
  return receipt;
}

export async function autoCloseSessionOnDepartureAction(
  sessionId: string
): Promise<{ success: boolean; message: string }> {
  await closeSessionOnDeparture(sessionId);
  revalidatePath(`/session/${sessionId}`);
  revalidatePath("/");
  return {
    success: true,
    message: "Session auto-closed due to host geofence departure. Table is now freed for other Buckeyes.",
  };
}

export async function resetSessionLocationDemoAction(
  sessionId: string
): Promise<{ success: boolean; message: string }> {
  await reopenSessionForDemo(sessionId);
  revalidatePath(`/session/${sessionId}`);
  revalidatePath("/");
  return {
    success: true,
    message: "Session reopened and geofence state reset to library origin.",
  };
}
