"use client";

import { useState } from "react";
import { CheckSquare, Square, Plus, Trash2, Clock, User, Award } from "lucide-react";
import type { AgendaItem } from "../types";
import { INITIAL_AGENDA_ITEMS } from "../mock-carmen-data";

interface GroupAgendaChecklistProps {
  currentStudentName?: string;
  onItemCompleted?: (item: AgendaItem) => void;
}

export function GroupAgendaChecklist({
  currentStudentName = "Alex Morgan",
  onItemCompleted,
}: GroupAgendaChecklistProps) {
  const [items, setItems] = useState<AgendaItem[]>(INITIAL_AGENDA_ITEMS);
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newAssigned, setNewAssigned] = useState("Alex Morgan");
  const [newMinutes, setNewMinutes] = useState(20);

  const toggleItem = (id: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, completed: !item.completed };
          if (updated.completed && onItemCompleted) onItemCompleted(updated);
          return updated;
        }
        return item;
      })
    );
  };

  const deleteItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newItem: AgendaItem = {
      id: `agenda-${Date.now()}`,
      title: newTitle.trim(),
      completed: false,
      assignedToName: newAssigned,
      estimatedMinutes: newMinutes,
      addedByName: currentStudentName,
    };

    setItems((prev) => [...prev, newItem]);
    setNewTitle("");
    setIsAdding(false);
  };

  const completedCount = items.filter((i) => i.completed).length;
  const progressPercent = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;
  const totalMinutes = items.reduce((acc, curr) => acc + (curr.estimatedMinutes || 15), 0);

  return (
    <div className="space-y-4">
      {/* Progress Card */}
      <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-red-100 text-[#a51c30]">
              <Award size={16} />
            </span>
            <div>
              <h3 className="text-xs font-bold text-stone-900">Study Session Roadmap & Agenda</h3>
              <p className="text-[11px] text-stone-500">
                {completedCount} of {items.length} group milestones completed · ~{totalMinutes} mins total
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-[#a51c30] font-mono">{progressPercent}% Ready</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 rounded-full bg-stone-100 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-[#a51c30] transition-all duration-500 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Add Item Form */}
      {isAdding ? (
        <form
          onSubmit={handleAddItem}
          className="rounded-xl border border-stone-300 bg-[#faf9f5] p-3.5 space-y-3 shadow-2xs"
        >
          <h4 className="text-xs font-bold text-stone-800">Add Session Study Objective</h4>
          <input
            type="text"
            required
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Objective (e.g. Trace reverseQueue on call stack)"
            className="w-full px-3 py-1.5 rounded-lg bg-white border border-stone-300 text-xs focus:ring-1 focus:ring-red-800"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div>
              <label className="block text-[10px] text-stone-500 mb-1">Assigned Member</label>
              <select
                value={newAssigned}
                onChange={(e) => setNewAssigned(e.target.value)}
                className="w-full px-2 py-1.5 rounded-lg bg-white border border-stone-300 text-xs"
              >
                <option value="Alex Morgan">Alex Morgan</option>
                <option value="Jordan Lee">Jordan Lee</option>
                <option value="Sam Patel">Sam Patel</option>
                <option value="All Members">All Members</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-stone-500 mb-1">Estimated Time (mins)</label>
              <input
                type="number"
                min={5}
                max={120}
                value={newMinutes}
                onChange={(e) => setNewMinutes(Number(e.target.value))}
                className="w-full px-2 py-1.5 rounded-lg bg-white border border-stone-300 text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1 text-xs text-stone-600 hover:text-stone-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1 text-xs font-semibold rounded-lg bg-[#a51c30] text-white cursor-pointer hover:bg-red-800"
            >
              Add Objective
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className="w-full py-2 border border-dashed border-stone-300 rounded-xl text-stone-600 hover:text-[#a51c30] hover:border-red-300 hover:bg-red-50/30 flex items-center justify-center gap-1.5 text-xs font-medium cursor-pointer transition-colors"
        >
          <Plus size={14} /> Add Agenda Item
        </button>
      )}

      {/* Checklist items */}
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className={`rounded-xl border p-3 flex items-start justify-between gap-3 transition-colors ${
              item.completed
                ? "bg-stone-50/70 border-stone-200 text-stone-400"
                : "bg-white border-stone-200 text-stone-800 hover:border-stone-300"
            }`}
          >
            <div className="flex items-start gap-2.5 flex-1 min-w-0">
              <button
                type="button"
                onClick={() => toggleItem(item.id)}
                className="mt-0.5 text-stone-400 hover:text-[#a51c30] cursor-pointer shrink-0"
                aria-label={item.completed ? "Mark incomplete" : "Mark complete"}
              >
                {item.completed ? (
                  <CheckSquare size={16} className="text-emerald-600" />
                ) : (
                  <Square size={16} />
                )}
              </button>

              <div className="flex-1 min-w-0">
                <p
                  className={`text-xs font-medium leading-snug ${
                    item.completed ? "line-through text-stone-500" : "text-stone-900"
                  }`}
                >
                  {item.title}
                </p>

                <div className="flex items-center gap-2 mt-1 text-[10px] text-stone-400">
                  {item.assignedToName && (
                    <span className="flex items-center gap-1 text-stone-500 font-medium">
                      <User size={10} /> {item.assignedToName}
                    </span>
                  )}
                  {item.estimatedMinutes && (
                    <span className="flex items-center gap-1 font-mono">
                      <Clock size={10} /> ~{item.estimatedMinutes}m
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => deleteItem(item.id)}
              className="text-stone-300 hover:text-red-700 p-1 cursor-pointer"
              aria-label="Delete objective"
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
