"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  Trash2,
  Plus,
  ChevronRight,
} from "lucide-react";

export interface GroupNote {
  id: string;
  title: string;
  content: string;
  authorName: string;
  category: "note";
  createdAt: string;
}

interface AppleNotesManagerProps {
  onNoteAdded?: (note: GroupNote) => void;
  notebookContent?: string;
  onNotebookContentChange?: (content: string) => void;
  onStartNewNote?: () => void;
}

function parseNotebook(content: string): GroupNote[] {
  if (!content.trim()) return [];
  const sections = content.split(/(?=^## )/m).filter(Boolean);
  return sections.map((section, index) => {
    const [heading = "Study note", ...body] = section.split("\n");
    const text = body.join("\n").trim();
    const meta = text.match(/^\[(note|concept|code|gotcha|question)\] (.*?) · (.*?)\n/);
    return {
      id: `shared-${index}-${heading}`,
      title: heading.replace(/^##\s*/, "").trim() || "Study note",
      content: meta ? text.slice(meta[0].length) : text,
      category: "note",
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
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
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
      category: "note",
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

  return (
    <div className="notes-manager space-y-2.5">
      <div className="flex items-center justify-end gap-2 px-0.5">
        <button
          type="button"
          onClick={() => { onStartNewNote?.(); setIsComposerOpen(true); }}
          className="text-xs font-semibold text-scarlet-dark hover:text-scarlet-deep inline-flex items-center gap-1 cursor-pointer shrink-0 py-1 px-1.5"
        >
          <Plus size={14} />
          <span>New Note</span>
        </button>
      </div>

      {/* Apple Notes Inset Grouped Card */}
      <div className="rounded-2xl border border-stone-200/70 bg-white shadow-xs divide-y divide-stone-100 overflow-hidden">
        {notes.length === 0 ? (
          <div className="p-6 text-center text-xs text-stone-400">
            No notes yet. Tap <strong>+</strong> in the bar above to add one.
          </div>
        ) : (
          notes.map((note) => {
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
                {/* Note title and delete action */}
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <h4 className="paper-title min-w-0 text-sm font-semibold text-stone-900 truncate tracking-tight">
                    {note.title}
                  </h4>
                  <div className="flex items-center gap-1.5 shrink-0">
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
                  <span className="text-scarlet-deep font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                    View <ChevronRight size={11} />
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* iOS FORM SHEET: NEW NOTE COMPOSER MODAL (NO FLOATING BUTTON) */}
      {isComposerOpen && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          className="app-dialog-backdrop note-dialog-backdrop"
          onClick={() => setIsComposerOpen(false)}
        >
          <div
            className="app-dialog-panel note-dialog-panel space-y-3"
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
              <h3 className="paper-title text-sm font-semibold text-stone-900">New Note</h3>
              <button
                type="button"
                onClick={handleCreateNote}
                disabled={!newContent.trim()}
                className="text-sm font-semibold text-scarlet hover:text-scarlet-dark cursor-pointer disabled:opacity-40 transition-opacity"
              >
                Done
              </button>
            </div>

            <form onSubmit={handleCreateNote} className="space-y-3">
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
        </div>, document.body
      )}

      {/* iOS SHEET: NOTE DETAIL VIEW MODAL */}
      {activeNote && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          className="app-dialog-backdrop note-dialog-backdrop"
          onClick={() => setActiveNote(null)}
        >
          <div
            className="app-dialog-panel note-dialog-panel space-y-3.5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* iOS Grabber */}
            <div className="w-10 h-1 rounded-full bg-stone-300 mx-auto -mt-1 mb-2" />

            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <span className="text-xs text-stone-400 font-mono">{activeNote.createdAt}</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveNote(null)}
                className="text-sm font-semibold text-scarlet hover:text-scarlet-dark cursor-pointer"
              >
                Done
              </button>
            </div>

            <h3 className="paper-title text-base font-bold text-stone-900">{activeNote.title}</h3>

            {/* Note Body with optional code highlighting */}
            {/```[\s\S]*?```/.test(activeNote.content) ? (
              <div className="bg-stone-900 text-stone-200 p-3 rounded-xl font-mono text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed border border-stone-800">
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
        </div>, document.body
      )}
    </div>
  );
}
