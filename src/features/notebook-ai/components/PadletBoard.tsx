"use client";

import { useState } from "react";
import { Plus, ThumbsUp, Trash2, Sparkles, Filter, Share2, Check } from "lucide-react";
import type { PadletCard } from "../types";
import { INITIAL_PADLET_CARDS } from "../mock-carmen-data";

interface PadletBoardProps {
  currentStudentName?: string;
  onSyncToMarkdown?: (cardsText: string) => void;
}

export function PadletBoard({
  currentStudentName = "Alex Rabochii",
  onSyncToMarkdown,
}: PadletBoardProps) {
  const [cards, setCards] = useState<PadletCard[]>(INITIAL_PADLET_CARDS);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState<PadletCard["category"]>("concept");
  const [newColor, setNewColor] = useState<PadletCard["color"]>("scarlet");
  const [synced, setSynced] = useState(false);

  const handleVote = (id: string) => {
    setCards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, votes: c.votes + 1 } : c))
    );
  };

  const handleDelete = (id: string) => {
    setCards((prev) => prev.filter((c) => c.id !== id));
  };

  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const newCard: PadletCard = {
      id: `card-${Date.now()}`,
      category: newCategory,
      title: newTitle.trim(),
      content: newContent.trim(),
      authorName: currentStudentName,
      authorId: "11111111-1111-4111-8111-111111111111",
      createdAt: "Just now",
      votes: 1,
      color: newColor,
    };

    setCards((prev) => [newCard, ...prev]);
    setNewTitle("");
    setNewContent("");
    setIsAdding(false);
  };

  const handleExport = () => {
    const markdown = cards
      .map(
        (c) =>
          `### [${c.category.toUpperCase()}] ${c.title}\n*By ${c.authorName} (${c.createdAt})*\n\n${c.content}\n`
      )
      .join("\n---\n\n");

    if (onSyncToMarkdown) {
      onSyncToMarkdown(markdown);
      setSynced(true);
      setTimeout(() => setSynced(false), 2000);
    }
  };

  const filteredCards =
    filterCategory === "all"
      ? cards
      : cards.filter((c) => c.category === filterCategory);

  const getColorClasses = (color: PadletCard["color"]) => {
    switch (color) {
      case "scarlet":
        return "bg-red-50/80 border-red-200 text-red-950";
      case "amber":
        return "bg-amber-50/80 border-amber-200 text-amber-950";
      case "sage":
        return "bg-stone-100 border-stone-300 text-stone-900";
      case "slate":
        return "bg-slate-50/80 border-slate-200 text-slate-950";
      case "cream":
      default:
        return "bg-[#faf8f4] border-stone-200 text-stone-900";
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-[#faf9f5] p-2.5 rounded-xl border border-stone-200">
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          <span className="text-[11px] font-semibold text-stone-500 mr-1 flex items-center gap-1">
            <Filter size={12} /> Filter:
          </span>
          {["all", "concept", "gotcha", "code", "question"].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setFilterCategory(cat)}
              className={`px-2 py-0.5 rounded-md text-[11px] font-medium capitalize cursor-pointer transition-colors ${
                filterCategory === cat
                  ? "bg-scarlet text-white"
                  : "bg-white text-stone-600 hover:bg-stone-100 border border-stone-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {onSyncToMarkdown && (
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-white border border-stone-300 text-stone-700 hover:bg-stone-50 cursor-pointer transition-colors"
            >
              {synced ? (
                <>
                  <Check size={12} className="text-scarlet" /> Synced to Notes
                </>
              ) : (
                <>
                  <Share2 size={12} className="text-stone-500" /> Sync to Markdown
                </>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsAdding(!isAdding)}
            className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-lg bg-scarlet hover:bg-scarlet-dark text-white cursor-pointer shadow-2xs transition-colors"
          >
            <Plus size={14} />
            <span>Add Sticky Card</span>
          </button>
        </div>
      </div>

      {/* Add New Sticky Card Form */}
      {isAdding && (
        <form
          onSubmit={handleAddCard}
          className="rounded-xl border border-red-200 bg-red-50/50 p-4 space-y-3 shadow-xs"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-scarlet uppercase tracking-wider flex items-center gap-1">
              <Sparkles size={13} /> New Group Sticky Card
            </h4>
            <span className="text-[10px] text-stone-500">Visible to all session members</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="text"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Card Title (e.g. Base Case Trap)"
              className="px-3 py-1.5 rounded-lg bg-white border border-stone-300 text-xs focus:ring-1 focus:ring-red-800"
            />
            <div className="flex items-center gap-2">
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as PadletCard["category"])}
                className="flex-1 px-2.5 py-1.5 rounded-lg bg-white border border-stone-300 text-xs text-stone-700"
              >
                <option value="concept">💡 Concept</option>
                <option value="gotcha">⚠️ Exam Gotcha</option>
                <option value="code">📝 Code Snippet</option>
                <option value="question">❓ Question</option>
              </select>
              <select
                value={newColor}
                onChange={(e) => setNewColor(e.target.value as PadletCard["color"])}
                className="px-2.5 py-1.5 rounded-lg bg-white border border-stone-300 text-xs text-stone-700"
              >
                <option value="scarlet">Scarlet</option>
                <option value="amber">Amber</option>
                <option value="sage">Sage</option>
                <option value="slate">Slate</option>
                <option value="cream">Cream</option>
              </select>
            </div>
          </div>

          <textarea
            required
            rows={3}
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="Write card text, formulas, or short notes…"
            className="w-full px-3 py-2 rounded-lg bg-white border border-stone-300 text-xs focus:ring-1 focus:ring-red-800"
          />

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1 text-xs text-stone-600 hover:text-stone-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3.5 py-1 text-xs font-semibold rounded-lg bg-scarlet text-white cursor-pointer hover:bg-scarlet-dark"
            >
              Post Card
            </button>
          </div>
        </form>
      )}

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {filteredCards.map((card) => (
          <div
            key={card.id}
            className={`rounded-xl border p-4 shadow-2xs flex flex-col justify-between transition-all hover:shadow-xs ${getColorClasses(
              card.color
            )}`}
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/70 border border-stone-200/50">
                  {card.category}
                </span>
                <span className="text-[10px] text-stone-500 font-medium">{card.createdAt}</span>
              </div>

              <h4 className="text-xs font-bold tracking-tight mb-1.5">{card.title}</h4>
              <p className="text-xs leading-relaxed whitespace-pre-wrap font-sans opacity-90">
                {card.content}
              </p>
            </div>

            <div className="mt-4 pt-2.5 border-t border-stone-200/60 flex items-center justify-between text-[11px]">
              <span className="text-stone-500 text-[10px]">By {card.authorName}</span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleVote(card.id)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/80 hover:bg-white text-stone-700 cursor-pointer border border-stone-200/50 shadow-2xs"
                  aria-label="Upvote note"
                >
                  <ThumbsUp size={11} className="text-scarlet" />
                  <span className="text-[10px] font-semibold">{card.votes}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(card.id)}
                  className="p-1 rounded text-stone-400 hover:text-red-700 cursor-pointer"
                  aria-label="Delete card"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
