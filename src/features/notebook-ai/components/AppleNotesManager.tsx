"use client";

import { useEffect, useState } from "react";
import {
  Trash2,
  Plus,
  ChevronRight,
  Code2,
  BookOpen,
  AlertTriangle,
  HelpCircle,
} from "lucide-react";

export interface GroupNote {
  id: string;
  title: string;
  content: string;
  authorName: string;
  category: "concept" | "code" | "gotcha" | "question";
  createdAt: string;
}

interface AppleNotesManagerProps {
  onNoteAdded?: (note: GroupNote) => void;
  notebookContent?: string;
  onNotebookContentChange?: (content: string) => void;
  onStartNewNote?: () => void;
}

type FilterCategory = "all" | GroupNote["category"];

function parseNotebook(content: string): GroupNote[] {
  if (!content.trim()) return [];
  const sections = content.split(/(?=^## )/m).filter(Boolean);
  return sections.map((section, index) => {
    const [heading = "Study note", ...body] = section.split("\n");
    const text = body.join("\n").trim();
    const meta = text.match(/^\[(concept|code|gotcha|question)\] (.*?) · (.*?)\n/);
    return {
      id: `shared-${index}-${heading}`,
      title: heading.replace(/^##\s*/, "").trim() || "Study note",
      content: meta ? text.slice(meta[0].length) : text,
      category: (meta?.[1] as GroupNote["category"]) || "concept",
      authorName: meta?.[2] || "Group",
      createdAt: meta?.[3] || "Shared",
    };
  });
}

function serializeNotebook(notes: GroupNote[]) {
  return notes.map((note) => `## ${note.title}\n[${note.category}] ${note.authorName} · ${note.createdAt}\n${note.content}`).join("\n\n");
}

export function AppleNotesManager({ onNoteAdded, notebookContent = "", onNotebookContentChange, onStartNewNote }: AppleNotesManagerProps) {
  const [notes, setNotes] = useState<GroupNote[]>(() => parseNotebook(notebookContent));
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>("all");
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState<GroupNote["category"]>("concept");
  const [activeNote, setActiveNote] = useState<GroupNote | null>(null);

  // Listen to the top-bar Plus (+) button event from the Shared notebook navigation header
  useEffect(() => {
    const handleOpenNewNote = () => {
      onStartNewNote?.();
      setIsComposerOpen(true);
    };
    window.addEventListener("buckeye:open-new-note", handleOpenNewNote);
    return () => window.removeEventListener("buckeye:open-new-note", handleOpenNewNote);
  }, [onStartNewNote]);

  useEffect(() => setNotes(parseNotebook(notebookContent)), [notebookContent]);

  const handleCreateNote = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newContent.trim()) return;

    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const created: GroupNote = {
      id: `note-${Date.now()}`,
      title: newTitle.trim() || `Study Note (${time})`,
      content: newContent.trim(),
      authorName: "You",
      category: newCategory,
      createdAt: time,
    };

    const updated = [created, ...notes];
    setNotes(updated);
    onNotebookContentChange?.(serializeNotebook(updated));
    setNewTitle("");
    setNewContent("");
    setIsComposerOpen(false);
    if (onNoteAdded) onNoteAdded(created);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = notes.filter((n) => n.id !== id);
    setNotes(updated);
    onNotebookContentChange?.(serializeNotebook(updated));
    if (activeNote?.id === id) setActiveNote(null);
  };

  const getCategoryBadge = (category: GroupNote["category"]) => {
    switch (category) {
      case "code":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/80">
            <Code2 size={10} />
            <span>Code</span>
          </span>
        );
      case "gotcha":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/80">
            <AlertTriangle size={10} />
            <span>Exam Trap</span>
          </span>
        );
      case "question":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/80">
            <HelpCircle size={10} />
            <span>Question</span>
          </span>
        );
      case "concept":
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#a51c30] bg-red-50 px-2 py-0.5 rounded-full border border-red-200/80">
            <BookOpen size={10} />
            <span>Concept</span>
          </span>
        );
    }
  };

  const filteredNotes = selectedCategory === "all"
    ? notes
    : notes.filter((n) => n.category === selectedCategory);

  return (
    <div className="space-y-2.5">
      {/* iOS Segmented Header / Category Filter */}
      <div className="flex items-center justify-between gap-2 px-0.5">
        <div className="flex items-center gap-1 bg-stone-100/90 p-1 rounded-xl border border-stone-200/70 overflow-x-auto text-xs">
          <button
            type="button"
            onClick={() => setSelectedCategory("all")}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
              selectedCategory === "all"
                ? "bg-white text-stone-900 shadow-2xs"
                : "text-stone-500 hover:text-stone-800"
            }`}
          >
            All ({notes.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory("concept")}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
              selectedCategory === "concept"
                ? "bg-white text-[#a51c30] shadow-2xs"
                : "text-stone-500 hover:text-stone-800"
            }`}
          >
            Concepts
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory("code")}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
              selectedCategory === "code"
                ? "bg-white text-emerald-800 shadow-2xs"
                : "text-stone-500 hover:text-stone-800"
            }`}
          >
            Code
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory("gotcha")}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
              selectedCategory === "gotcha"
                ? "bg-white text-amber-800 shadow-2xs"
                : "text-stone-500 hover:text-stone-800"
            }`}
          >
            Traps
          </button>
        </div>

        <button
          type="button"
          onClick={() => { onStartNewNote?.(); setIsComposerOpen(true); }}
          className="text-xs font-semibold text-[#2d4b3c] hover:text-[#1a3327] inline-flex items-center gap-1 cursor-pointer shrink-0 py-1 px-1.5"
        >
          <Plus size={14} />
          <span>New Note</span>
        </button>
      </div>

      {/* Apple Notes Inset Grouped Card */}
      <div className="rounded-2xl border border-stone-200/70 bg-white/95 backdrop-blur-md shadow-xs divide-y divide-stone-100 overflow-hidden">
        {filteredNotes.length === 0 ? (
          <div className="p-6 text-center text-xs text-stone-400">
            No notes in this category yet. Tap <strong>+</strong> in the bar above to add one.
          </div>
        ) : (
          filteredNotes.map((note) => {
            // Strip code fence for clean snippet preview
            const snippet = note.content
              .replace(/```[a-z]*\n?/g, "")
              .replace(/\n/g, " ")
              .trim();

            return (
              <div
                key={note.id}
                onClick={() => setActiveNote(note)}
                className="group px-4 py-3 hover:bg-stone-50/70 active:bg-stone-100/70 cursor-pointer transition-colors"
              >
                {/* Line 1: Title and Category badge */}
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <h4 className="text-sm font-semibold text-stone-900 truncate tracking-tight">
                    {note.title}
                  </h4>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {getCategoryBadge(note.category)}
                    <button
                      type="button"
                      onClick={(e) => handleDelete(note.id, e)}
                      className="opacity-0 group-hover:opacity-100 text-stone-300 hover:text-red-600 p-0.5 rounded cursor-pointer transition-opacity"
                      aria-label="Delete note"
                      title="Delete note"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                {/* Line 2: Timestamp and Content snippet (Signature Apple Notes list format) */}
                <div className="flex items-baseline gap-2 text-xs">
                  <span className="text-stone-400 font-normal shrink-0">{note.createdAt}</span>
                  <span className="text-stone-500 font-normal truncate">{snippet}</span>
                </div>

                {/* Line 3: Author footnote */}
                <div className="flex items-center justify-between mt-1 pt-0.5 text-[10px] text-stone-400">
                  <span>By {note.authorName}</span>
                  <span className="text-emerald-800 font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                    View <ChevronRight size={11} />
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* iOS FORM SHEET: NEW NOTE COMPOSER MODAL (NO FLOATING BUTTON) */}
      {isComposerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-900/35 backdrop-blur-xs transition-opacity"
          onClick={() => setIsComposerOpen(false)}
        >
          <div
            className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl bg-white border border-stone-200 shadow-2xl p-4 sm:p-5 space-y-3 max-h-[88vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* iOS Grabber Pill */}
            <div className="w-10 h-1 rounded-full bg-stone-300 mx-auto -mt-1 mb-2" />

            {/* iOS Navigation Header */}
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <button
                type="button"
                onClick={() => setIsComposerOpen(false)}
                className="text-sm font-normal text-stone-500 hover:text-stone-800 cursor-pointer"
              >
                Cancel
              </button>
              <h3 className="text-sm font-semibold text-stone-900">New Note</h3>
              <button
                type="button"
                onClick={handleCreateNote}
                disabled={!newContent.trim()}
                className="text-sm font-semibold text-[#a51c30] hover:text-red-800 cursor-pointer disabled:opacity-40 transition-opacity"
              >
                Done
              </button>
            </div>

            <form onSubmit={handleCreateNote} className="space-y-3">
              {/* Category Segmented Control */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                {(["concept", "gotcha", "code", "question"] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setNewCategory(cat)}
                    className={`px-3 py-1 rounded-full text-[11px] font-semibold capitalize cursor-pointer transition-colors ${
                      newCategory === cat
                        ? "bg-stone-900 text-white shadow-2xs"
                        : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                    }`}
                  >
                    {cat === "gotcha" ? "Exam Trap" : cat}
                  </button>
                ))}
              </div>

              {/* Title Input (Apple Notes Large Headline) */}
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Title (e.g., Base Case Trace)..."
                className="w-full px-0 py-1 bg-transparent border-none text-base font-bold text-stone-900 placeholder:text-stone-300 focus:outline-none focus:ring-0"
              />

              {/* Content Textarea (Clean Apple Canvas) */}
              <textarea
                required
                rows={6}
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Start typing your study notes, code examples, or exam tips…"
                className="w-full px-0 py-1 bg-transparent border-none text-sm text-stone-800 leading-relaxed placeholder:text-stone-300 focus:outline-none focus:ring-0 resize-none font-sans"
              />

              <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-stone-400">
                <span>Markdown & code blocks supported</span>
                <span className="font-mono text-[11px]">OSU CSE 2221</span>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* iOS SHEET: NOTE DETAIL VIEW MODAL */}
      {activeNote && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-900/35 backdrop-blur-xs transition-opacity"
          onClick={() => setActiveNote(null)}
        >
          <div
            className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl bg-white border border-stone-200 shadow-2xl p-4 sm:p-5 space-y-3.5 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* iOS Grabber */}
            <div className="w-10 h-1 rounded-full bg-stone-300 mx-auto -mt-1 mb-2" />

            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div className="flex items-center gap-2">
                {getCategoryBadge(activeNote.category)}
                <span className="text-xs text-stone-400 font-mono">{activeNote.createdAt}</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveNote(null)}
                className="text-sm font-semibold text-[#a51c30] hover:text-red-800 cursor-pointer"
              >
                Done
              </button>
            </div>

            <h3 className="text-base font-bold text-stone-900">{activeNote.title}</h3>

            {/* Note Body with optional code highlighting */}
            {activeNote.category === "code" ? (
              <div className="bg-stone-900 text-emerald-400 p-3 rounded-xl font-mono text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed border border-stone-800">
                {activeNote.content.replace(/```[a-z]*\n?/g, "")}
              </div>
            ) : (
              <p className="text-sm text-stone-700 whitespace-pre-wrap font-sans leading-relaxed">
                {activeNote.content}
              </p>
            )}

            <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-stone-400">
              <span>Author: {activeNote.authorName}</span>
              <span className="font-mono text-[10px]">Thompson Floor 3</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
