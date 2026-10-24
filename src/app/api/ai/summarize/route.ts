import { z } from "zod";
import { sessionsDiscoveryService } from "@/features/sessions-discovery/services";
import { notebookAIService } from "@/features/notebook-ai/services";
import { aiConfig, summarizeWithModel } from "@/lib/ai-client";
import type { AISummarizeRequest, ApiError } from "@/types/contracts";

export const runtime = "nodejs";
const schema: z.ZodType<AISummarizeRequest> = z.object({
  sessionId: z.uuid(),
  mode: z.enum(["catch_me_up", "ambient"]),
}).strict();
const headers = { "Cache-Control": "no-store", "X-Scaffold-Source": "mock" };

/** Summarize route: uses live OpenAI model when configured; falls back to deterministic mock fixture. */
export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: { code: "INVALID_REQUEST", message: "Expected a session UUID and mode: catch_me_up | ambient." } } satisfies ApiError, { status: 400, headers });
  const detail = await sessionsDiscoveryService.getSession(parsed.data.sessionId);
  if (!detail) return Response.json({ error: { code: "NOT_FOUND", message: "Session not found." } } satisfies ApiError, { status: 404, headers });
  if (detail.access === "locked") return Response.json({ error: { code: "FORBIDDEN", message: "Approved membership is required." } } satisfies ApiError, { status: 403, headers });

  if (aiConfig.configured && parsed.data.mode === "catch_me_up") {
    try {
      const notebook = await notebookAIService.getNotebook(parsed.data.sessionId);
      if (notebook?.content) {
        const liveResult = await summarizeWithModel(notebook.content);
        if (liveResult?.text) {
          return Response.json({
            sessionId: parsed.data.sessionId,
            summary: liveResult.text,
            topicTags: detail.session.aiTopicTags || [],
            source: "ai",
          }, { headers: { ...headers, "X-Scaffold-Source": "ai" } });
        }
      }
    } catch {
      // Fallback to mock adapter
    }
  }

  return Response.json(await notebookAIService.summarize(parsed.data), { headers });
}
