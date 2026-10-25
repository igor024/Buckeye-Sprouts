import { locationCheckInService } from "@/features/location-checkin/services";
import { getSupabaseAdminClient } from "@/features/sessions-discovery/db";
import { isSupabaseConfigured, mockViewerId } from "@/lib/supabase";
import type { CheckInPayload } from "@/types/contracts";

export const runtime = "nodejs";

const noStoreHeaders = { "Cache-Control": "no-store" };

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params;
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "").trim();

  let userId = mockViewerId;
  if (token && isSupabaseConfigured) {
    const admin = getSupabaseAdminClient();
    if (admin) {
      const { data } = await admin.auth.getUser(token);
      if (data?.user) {
        userId = data.user.id;
      }
    }
  }

  const checkIn = await locationCheckInService.getCheckIn(sessionId);
  return Response.json({ checkIn }, { headers: noStoreHeaders });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params;
  const body = (await request.json().catch(() => null)) as Partial<CheckInPayload> | null;

  if (!body || !body.method) {
    return Response.json(
      { error: { code: "INVALID_REQUEST", message: "Check-in method and payload are required." } },
      { status: 400, headers: noStoreHeaders }
    );
  }

  const payload: CheckInPayload = {
    method: body.method === "buck_id" ? "buck_id" : "table_qr",
    rawCode: body.rawCode || "QR-TH-201-A",
    tableId: body.tableId || "TH-201-A",
    libraryName: body.libraryName || "Thompson Library",
    gps: body.gps || { lat: 40.0001, lng: -83.0146 },
  };

  try {
    const receipt = await locationCheckInService.checkIn(sessionId, payload);
    return Response.json({ receipt, success: true }, { status: 201, headers: noStoreHeaders });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to record check-in.";
    return Response.json({ error: { code: "CHECKIN_FAILED", message } }, { status: 500, headers: noStoreHeaders });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params;
  await locationCheckInService.checkOut(sessionId);
  return Response.json({ success: true, message: "Checked out successfully." }, { headers: noStoreHeaders });
}
