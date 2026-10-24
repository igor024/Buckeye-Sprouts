import { z } from "zod";
import { sessionsDiscoveryService } from "@/features/sessions-discovery/services";
import { locationCheckInService } from "@/features/location-checkin/services";
import type { ApiError, RoomBookingRequest } from "@/types/contracts";

export const runtime = "nodejs";
const schema: z.ZodType<RoomBookingRequest> = z.object({
  sessionId: z.uuid(),
  libraryName: z.string().min(1).max(120),
  roomId: z.string().min(1).max(100),
  startsAt: z.iso.datetime(),
  endsAt: z.iso.datetime(),
}).strict().refine((input) => Date.parse(input.endsAt) > Date.parse(input.startsAt), { message: "endsAt must be after startsAt" });
const headers = { "Cache-Control": "no-store", "X-Scaffold-Source": "mock" };

/** Booking webhook seam; no external reservation is made. */
export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: { code: "INVALID_REQUEST", message: "Expected a session UUID, libraryName, roomId, and ordered ISO UTC startsAt/endsAt." } } satisfies ApiError, { status: 400, headers });
  const detail = await sessionsDiscoveryService.getSession(parsed.data.sessionId);
  if (!detail) return Response.json({ error: { code: "NOT_FOUND", message: "Session not found." } } satisfies ApiError, { status: 404, headers });
  if (detail.access !== "host") return Response.json({ error: { code: "FORBIDDEN", message: "Only the host may book a room." } } satisfies ApiError, { status: 403, headers });
  // TODO Workstream 3: auth, provider credentials, signed webhook, and idempotency.
  return Response.json(await locationCheckInService.bookRoom(parsed.data), { status: 501, headers });
}
