import "server-only";
import { getMockSessionAccess, mockStore } from "@/lib/supabase";
import { FeatureNotImplementedError, type NotebookAIService } from "@/types/contracts";

/** Workstream 4 owns this adapter and the two AI routes. No live subscriptions yet. */
export const notebookAIService: NotebookAIService = {
  async getNotebook(sessionId) {
    if (getMockSessionAccess(sessionId) === "locked") return null;
    const notebook = mockStore.notebooks.find((item) => item.sessionId === sessionId);
    return notebook ? structuredClone(notebook) : null;
  },
  async summarize(input) {
    if (getMockSessionAccess(input.sessionId) === "locked") throw new Error("Session membership required.");
    const notebook = mockStore.notebooks.find((item) => item.sessionId === input.sessionId);
    const session = mockStore.sessions.find((item) => item.id === input.sessionId);
    return {
      sessionId: input.sessionId,
      summary: notebook?.aiSummary || "No notebook notes yet.",
      topicTags: [...(session?.aiTopicTags || [])],
      source: "mock",
    };
  },
  async streamFeedback(input) {
    if (getMockSessionAccess(input.sessionId) === "locked") throw new Error("Session membership required.");
    const chunks = ["Demo tutor: ", "start with a small example. ", "What is the base case, and why does it terminate?"];
    const encoder = new TextEncoder();
    return new ReadableStream<Uint8Array>({
      pull(controller) {
        const chunk = chunks.shift();
        if (chunk === undefined) controller.close();
        else controller.enqueue(encoder.encode(chunk));
      },
    });
  },
  async saveNotebook() { throw new FeatureNotImplementedError("saveNotebook"); },
  async subscribe() { throw new FeatureNotImplementedError("subscribe"); },
};
