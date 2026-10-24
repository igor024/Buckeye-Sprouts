import { z } from "zod";
import { sessionsDiscoveryService } from "@/features/sessions-discovery/services";
import { notebookAIService } from "@/features/notebook-ai/services";
import { aiConfig, streamTutorWithModel } from "@/lib/ai-client";
import type { AIFeedbackRequest, ApiError } from "@/types/contracts";

export const runtime = "nodejs";
const schema: z.ZodType<AIFeedbackRequest> = z.object({
  sessionId: z.uuid(),
  question: z.string().trim().min(1).max(2000),
  selection: z.string().max(10000).optional(),
}).strict();
const headers = { "Cache-Control": "no-store", "X-Scaffold-Source": "mock" };

/** Feedback route: streams live model responses when configured; falls back to mock chunks. */
export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: { code: "INVALID_REQUEST", message: "Expected sessionId, a nonempty question (max 2000 chars), and optional selection (max 10000 chars)." } } satisfies ApiError, { status: 400, headers });
  const detail = await sessionsDiscoveryService.getSession(parsed.data.sessionId);
  if (!detail) return Response.json({ error: { code: "NOT_FOUND", message: "Session not found." } } satisfies ApiError, { status: 404, headers });
  if (detail.access === "locked") return Response.json({ error: { code: "FORBIDDEN", message: "Approved membership is required." } } satisfies ApiError, { status: 403, headers });

  if (aiConfig.configured) {
    try {
      const prompt = `Student Question: ${parsed.data.question}\n\nGroup Notebook Selection:\n${parsed.data.selection || "(No selection)"}`;
      const streamResult = streamTutorWithModel(prompt, request.signal);
      if (streamResult) {
        return streamResult.toTextStreamResponse({
          headers: { ...headers, "Content-Type": "text/plain; charset=utf-8", "X-Scaffold-Source": "ai" },
        });
      }
    } catch {
      // Fallback to mock stream
    }
  }

  return new Response(await notebookAIService.streamFeedback(parsed.data, request.signal), {
    headers: { ...headers, "Content-Type": "text/plain; charset=utf-8" },
  });
}
