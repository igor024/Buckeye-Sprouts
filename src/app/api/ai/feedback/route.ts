import { z } from "zod";
import { sessionsDiscoveryService } from "@/features/sessions-discovery/services";
import { notebookAIService } from "@/features/notebook-ai/services";
import type { AIFeedbackRequest, ApiError } from "@/types/contracts";

export const runtime = "nodejs";
const schema: z.ZodType<AIFeedbackRequest> = z.object({
  sessionId: z.uuid(),
  question: z.string().trim().min(1).max(2000),
  selection: z.string().max(10000).optional(),
}).strict();
const headers = { "Cache-Control": "no-store", "X-Scaffold-Source": "mock" };

/** Stub: UTF-8 text streaming contract; not SSE or the AI SDK UI message protocol. */
export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: { code: "INVALID_REQUEST", message: "Expected sessionId, a nonempty question (max 2000 chars), and optional selection (max 10000 chars)." } } satisfies ApiError, { status: 400, headers });
  const detail = await sessionsDiscoveryService.getSession(parsed.data.sessionId);
  if (!detail) return Response.json({ error: { code: "NOT_FOUND", message: "Session not found." } } satisfies ApiError, { status: 404, headers });
  if (detail.access === "locked") return Response.json({ error: { code: "FORBIDDEN", message: "Approved membership is required." } } satisfies ApiError, { status: 403, headers });

  // TODO Workstream 4: streamTutorWithModel(...).toTextStreamResponse() after real auth.
  return new Response(await notebookAIService.streamFeedback(parsed.data, request.signal), {
    headers: { ...headers, "Content-Type": "text/plain; charset=utf-8" },
  });
}
