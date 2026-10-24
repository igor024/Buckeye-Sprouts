import "server-only";
import { getMockSessionAccess, mockStore, mockViewerId } from "@/lib/supabase";
import type { NotebookAIService, SharedNotebook } from "@/types/contracts";

/** Workstream 4 owns this adapter and the two AI routes. */
export const notebookAIService: NotebookAIService = {
  async getNotebook(sessionId) {
    if (getMockSessionAccess(sessionId) === "locked") return null;
    const notebook = mockStore.notebooks.find((item) => item.sessionId === sessionId);
    return notebook ? structuredClone(notebook) : null;
  },

  async saveNotebook(sessionId, content) {
    if (getMockSessionAccess(sessionId) === "locked") {
      throw new Error("Session membership required to save notebook.");
    }
    let notebook = mockStore.notebooks.find((item) => item.sessionId === sessionId);
    const now = new Date().toISOString();

    if (!notebook) {
      notebook = {
        sessionId,
        content,
        lastUpdatedBy: mockViewerId,
        aiSummary: "The group is actively reviewing recursion and software components.",
        aiSuggestions: ["Verify base case logic", "Trace recursive call stack"],
        updatedAt: now,
      };
      mockStore.notebooks.push(notebook);
    } else {
      notebook.content = content;
      notebook.lastUpdatedBy = mockViewerId;
      notebook.updatedAt = now;
    }

    return structuredClone(notebook);
  },

  async summarize(input) {
    if (getMockSessionAccess(input.sessionId) === "locked") {
      throw new Error("Session membership required.");
    }
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
    if (getMockSessionAccess(input.sessionId) === "locked") {
      throw new Error("Session membership required.");
    }
    const chunks = [
      "Demo tutor (Carmen AI Assistant): ",
      "Reviewing your notes and CarmenCanvas course competencies. ",
      "When working with recursion, always identify the simplest base case first. ",
      "For instance, does your base case terminate when n <= 0 or when the queue is empty? ",
      "Try tracing a 3-element test case to verify call stack unwinding.",
    ];
    const encoder = new TextEncoder();
    return new ReadableStream<Uint8Array>({
      pull(controller) {
        const chunk = chunks.shift();
        if (chunk === undefined) controller.close();
        else controller.enqueue(encoder.encode(chunk));
      },
    });
  },

  async subscribe(_sessionId, _onEvent) {
    return () => {};
  },
};
