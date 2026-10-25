"use client";

import { useState, useRef } from "react";
import {
  Bold,
  Italic,
  Heading2,
  List,
  CheckSquare,
  Code,
  Eye,
  Edit3,
  Columns,
  Sparkles,
  Users,
  Check,
  Plus,
} from "lucide-react";

interface NotebookEditorProps {
  initialContent?: string;
  onContentChange?: (content: string) => void;
  readOnly?: boolean;
}

export function NotebookEditor({
  initialContent = "",
  onContentChange,
  readOnly = false,
}: NotebookEditorProps) {
  const [content, setContent] = useState(
    initialContent ||
      `# CSE 2221 · Recursion review\n\n## Questions to work through\n- What makes a good base case?\n- Trace a recursive call using a small example.\n\n## Next up\nCompare recursive and iterative solutions together.\n\n## Code Snippet Under Discussion\n\`\`\`java\npublic static void reverseQueue(Queue<Integer> q) {\n    if (q.length() == 0) {\n        return; // Base case: empty queue is already reversed\n    }\n    int front = q.dequeue();\n    reverseQueue(q); // Recursive leap of faith\n    q.enqueue(front); // Restore at back\n}\n\`\`\`\n\n## Questions for Dr. Bucci\n- Why doesn't the Java Virtual Machine perform tail-call optimization?`
  );

  const [viewMode, setViewMode] = useState<"edit" | "split" | "preview">("edit");
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving">("saved");
  const [quickNote, setQuickNote] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const updateContent = (newText: string) => {
    setContent(newText);
    setSaveStatus("saving");
    if (onContentChange) onContentChange(newText);
    setTimeout(() => setSaveStatus("saved"), 400);
  };

  const insertFormatting = (prefix: string, suffix = "") => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.substring(start, end);

    const replacement = prefix + (selected || "text") + suffix;
    const newContent = content.substring(0, start) + replacement + content.substring(end);
    updateContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + replacement.length - suffix.length);
    }, 0);
  };

  const handleAddQuickNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickNote.trim()) return;
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const snippet = `\n\n### 📝 Note (${time}):\n${quickNote.trim()}`;
    updateContent(content + snippet);
    setQuickNote("");
  };

  const simulatePartnerTyping = () => {
    setIsPartnerTyping(true);
    setTimeout(() => {
      const partnerSnippet = `\n\n### 💡 Partner Note from Jordan Lee (Thompson Floor 3):\n> "Tested \`reverseQueue\` on a queue \`<1, 2, 3>\`. Call stack depth is 3 frames. Restoring elements on return unwinds as 3, then 2, then 1. Clean $O(N)$ auxiliary stack space!"`;
      updateContent(content + partnerSnippet);
      setIsPartnerTyping(false);
    }, 1200);
  };

  return (
    <div className="flex flex-col border border-stone-200/90 rounded-2xl bg-white/95 backdrop-blur-md overflow-hidden shadow-2xs">
      {/* Collaborator Presence & Status Bar */}
      <div className="bg-[#faf9f5] px-3.5 py-2 border-b border-stone-200 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-stone-600 flex items-center gap-1">
            <Users size={13} className="text-scarlet" /> Active:
          </span>
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full bg-red-100 text-scarlet text-[10px] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-scarlet" /> Alex (You)
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full bg-stone-100 text-scarlet-deep text-[10px] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-scarlet" /> Jordan
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full bg-amber-100 text-amber-800 text-[10px] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600" /> Sam
            </span>
          </div>
          {isPartnerTyping && (
            <span className="text-[10px] text-amber-700 italic flex items-center gap-1 animate-pulse">
              <Sparkles size={11} /> Jordan is typing…
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-stone-400 font-mono flex items-center gap-1">
            <Check size={11} className="text-scarlet" /> {saveStatus === "saving" ? "Saving..." : "Saved"}
          </span>

          <button
            type="button"
            onClick={simulatePartnerTyping}
            disabled={isPartnerTyping || readOnly}
            title="Simulate peer collaboration for demo judges"
            className="px-2 py-0.5 text-[10px] font-medium rounded bg-white border border-stone-300 text-stone-700 hover:bg-stone-50 cursor-pointer disabled:opacity-50 transition-colors"
          >
            Simulate Peer Typing
          </button>
        </div>
      </div>

      {/* Quick Add Note Form (Apple Style) */}
      {!readOnly && (
        <form
          onSubmit={handleAddQuickNote}
          className="flex items-center gap-1.5 px-3 py-2 bg-[#fdfcf9] border-b border-stone-200"
        >
          <input
            type="text"
            value={quickNote}
            onChange={(e) => setQuickNote(e.target.value)}
            placeholder="Quick add: Type your own personal note or question…"
            className="flex-1 px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-scarlet"
          />
          <button
            type="submit"
            disabled={!quickNote.trim()}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-scarlet-dark hover:bg-scarlet-deep text-white cursor-pointer disabled:opacity-40 transition-colors shrink-0 shadow-2xs"
          >
            <Plus size={13} />
            <span>Add Note</span>
          </button>
        </form>
      )}

      {/* Formatting Toolbar */}
      {!readOnly && (
        <div className="bg-white px-3 py-1.5 border-b border-stone-200 flex flex-wrap items-center justify-between gap-1 text-stone-600">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => insertFormatting("## ", "\n")}
              className="p-1.5 rounded hover:bg-stone-100 text-stone-700 cursor-pointer"
              title="Heading 2"
              aria-label="Add heading"
            >
              <Heading2 size={15} />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting("**", "**")}
              className="p-1.5 rounded hover:bg-stone-100 text-stone-700 cursor-pointer"
              title="Bold"
              aria-label="Make bold"
            >
              <Bold size={15} />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting("*", "*")}
              className="p-1.5 rounded hover:bg-stone-100 text-stone-700 cursor-pointer"
              title="Italic"
              aria-label="Make italic"
            >
              <Italic size={15} />
            </button>
            <span className="w-px h-4 bg-stone-200 mx-1" />
            <button
              type="button"
              onClick={() => insertFormatting("- ", "\n")}
              className="p-1.5 rounded hover:bg-stone-100 text-stone-700 cursor-pointer"
              title="Bullet List"
              aria-label="Add bullet list"
            >
              <List size={15} />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting("- [ ] ", "\n")}
              className="p-1.5 rounded hover:bg-stone-100 text-stone-700 cursor-pointer"
              title="Checklist Item"
              aria-label="Add checklist item"
            >
              <CheckSquare size={15} />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting("```java\n", "\n```")}
              className="p-1.5 rounded hover:bg-stone-100 text-stone-700 cursor-pointer"
              title="Java Code Block"
              aria-label="Add code block"
            >
              <Code size={15} />
            </button>
          </div>

          {/* View Mode Switches */}
          <div className="flex items-center gap-1 bg-stone-100 p-0.5 rounded-md border border-stone-200">
            <button
              type="button"
              onClick={() => setViewMode("edit")}
              className={`p-1 rounded text-xs cursor-pointer flex items-center gap-1 ${
                viewMode === "edit" ? "bg-white text-stone-900 font-semibold shadow-2xs" : "text-stone-500"
              }`}
              title="Edit View"
            >
              <Edit3 size={13} />
              <span className="hidden sm:inline text-[10px]">Edit</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("split")}
              className={`p-1 rounded text-xs cursor-pointer flex items-center gap-1 ${
                viewMode === "split" ? "bg-white text-stone-900 font-semibold shadow-2xs" : "text-stone-500"
              }`}
              title="Split View"
            >
              <Columns size={13} />
              <span className="hidden sm:inline text-[10px]">Split</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("preview")}
              className={`p-1 rounded text-xs cursor-pointer flex items-center gap-1 ${
                viewMode === "preview" ? "bg-white text-stone-900 font-semibold shadow-2xs" : "text-stone-500"
              }`}
              title="Preview View"
            >
              <Eye size={13} />
              <span className="hidden sm:inline text-[10px]">Preview</span>
            </button>
          </div>
        </div>
      )}

      {/* Editor Body */}
      <div className={`grid ${viewMode === "split" ? "grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-stone-200" : "grid-cols-1"} min-h-[200px]`}>
        {/* Textarea */}
        {(viewMode === "edit" || viewMode === "split") && (
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => updateContent(e.target.value)}
            disabled={readOnly}
            aria-label="Collective Markdown Group Notes"
            placeholder="Write shared notes, questions, code, or formulas here…"
            className="w-full h-full min-h-[200px] p-3 text-xs font-mono leading-relaxed bg-[#fdfcf9] text-stone-800 resize-none focus:outline-none"
          />
        )}

        {/* Live Formatted Markdown Preview */}
        {(viewMode === "preview" || viewMode === "split") && (
          <div className="w-full h-full min-h-[200px] p-3 bg-white overflow-y-auto text-xs leading-relaxed text-stone-800 space-y-3">
            <div className="prose prose-stone max-w-none text-xs">
              {content.split("\n").map((line, idx) => {
                if (line.startsWith("# ")) {
                  return (
                    <h1 key={idx} className="text-base font-bold text-stone-900 mt-2 mb-1 border-b border-stone-200 pb-1">
                      {line.replace("# ", "")}
                    </h1>
                  );
                }
                if (line.startsWith("## ")) {
                  return (
                    <h2 key={idx} className="text-sm font-bold text-scarlet mt-3 mb-1">
                      {line.replace("## ", "")}
                    </h2>
                  );
                }
                if (line.startsWith("### ")) {
                  return (
                    <h3 key={idx} className="text-xs font-bold text-stone-800 mt-2 mb-1">
                      {line.replace("### ", "")}
                    </h3>
                  );
                }
                if (line.startsWith("- [x] ")) {
                  return (
                    <div key={idx} className="flex items-center gap-1.5 text-stone-500 line-through">
                      <CheckSquare size={13} className="text-scarlet" />
                      <span>{line.replace("- [x] ", "")}</span>
                    </div>
                  );
                }
                if (line.startsWith("- [ ] ")) {
                  return (
                    <div key={idx} className="flex items-center gap-1.5 text-stone-800">
                      <div className="w-3 h-3 rounded-xs border border-stone-400" />
                      <span>{line.replace("- [ ] ", "")}</span>
                    </div>
                  );
                }
                if (line.startsWith("- ")) {
                  return (
                    <div key={idx} className="flex items-start gap-1.5 ml-2 text-stone-700">
                      <span className="text-scarlet">•</span>
                      <span>{line.replace("- ", "")}</span>
                    </div>
                  );
                }
                if (line.startsWith("> ")) {
                  return (
                    <blockquote key={idx} className="border-l-2 border-scarlet pl-2.5 py-0.5 my-1 bg-stone-100 text-stone-700 italic">
                      {line.replace("> ", "")}
                    </blockquote>
                  );
                }
                if (line.startsWith("```")) {
                  return (
                    <div key={idx} className="text-[10px] text-stone-400 font-mono">
                      {line}
                    </div>
                  );
                }
                if (line.trim() === "") {
                  return <div key={idx} className="h-1" />;
                }
                return (
                  <p key={idx} className="text-xs text-stone-700">
                    {line}
                  </p>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer stats */}
      <div className="bg-[#faf9f5] px-3.5 py-1.5 border-t border-stone-200 flex items-center justify-between text-[10px] text-stone-400">
        <span>Markdown formatted · Live synchronizing with group</span>
        <span>{content.length} characters · {content.split(/\s+/).filter(Boolean).length} words</span>
      </div>
    </div>
  );
}
