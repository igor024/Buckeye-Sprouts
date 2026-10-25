"use client";

import { useState } from "react";
import { Check, Plus, Sparkles, Brain, Trash2 } from "lucide-react";
import type { UnitTaskItem, AIReadinessAssessment } from "../types";
import { INITIAL_UNIT_TASKS, calculateReadiness } from "../mock-carmen-data";

interface StickyUnitTaskPadletProps {
  courseCode?: string;
  onReadinessChanged?: (assessment: AIReadinessAssessment) => void;
  onTaskToggled?: (task: UnitTaskItem) => void;
}

export function StickyUnitTaskPadlet({
  courseCode = "CSE 2221",
  onReadinessChanged,
  onTaskToggled,
}: StickyUnitTaskPadletProps) {
  const [tasks, setTasks] = useState<UnitTaskItem[]>(INITIAL_UNIT_TASKS);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [assessment, setAssessment] = useState<AIReadinessAssessment>(() =>
    calculateReadiness(INITIAL_UNIT_TASKS)
  );
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const completedCount = tasks.filter((t) => t.completed).length;
  const progressPercent = Math.round((completedCount / tasks.length) * 100);

  const handleToggle = (id: string) => {
    setIsAiThinking(true);

    const updated = tasks.map((t) =>
      t.id === id ? { ...t, completed: !t.completed } : t
    );
    const toggled = updated.find((t) => t.id === id);

    setTasks(updated);
    if (toggled && onTaskToggled) onTaskToggled(toggled);

    setTimeout(() => {
      const newAssessment = calculateReadiness(updated, toggled);
      setAssessment(newAssessment);
      setIsAiThinking(false);
      if (onReadinessChanged) onReadinessChanged(newAssessment);
    }, 550);
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newTask: UnitTaskItem = {
      id: `task-${Date.now()}`,
      title: newTitle.trim(),
      category: "concept",
      completed: false,
      assignedTo: "You",
      weight: 15,
      carmenTopicRef: "Unit Objective",
    };

    const updated = [...tasks, newTask];
    setTasks(updated);
    setNewTitle("");
    setIsAdding(false);

    setIsAiThinking(true);
    setTimeout(() => {
      setAssessment(calculateReadiness(updated));
      setIsAiThinking(false);
    }, 450);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = tasks.filter((t) => t.id !== id);
    setTasks(updated);
    setAssessment(calculateReadiness(updated));
  };

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-stone-200/70 p-3.5 shadow-2xs space-y-2.5">
      {/* Minimal Header & Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-stone-900 text-xs">Unit 3 Mastery</span>
            <span className="text-[10px] text-stone-400 font-mono">
              ({completedCount}/{tasks.length})
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold text-stone-500 uppercase">Readiness:</span>
            <span className="text-xs font-bold font-mono text-scarlet-deep bg-stone-100 px-2 py-0.5 rounded-full border border-stone-300">
              {assessment.readinessScore}% · {assessment.statusLabel}
            </span>
          </div>
        </div>

        {/* Thin Apple/Google style progress bar */}
        <div className="w-full h-1.5 rounded-full bg-stone-100 overflow-hidden">
          <div
            className="h-full bg-scarlet rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* AI Thinking / Reaction Pill (Clean & Uncluttered) */}
      <div className="rounded-xl px-2.5 py-1.5 bg-amber-50/70 border border-amber-200/60 text-xs transition-all">
        {isAiThinking ? (
          <div className="flex items-center gap-1.5 text-amber-900 font-medium text-[11px]">
            <Sparkles size={13} className="text-amber-600 animate-spin" />
            <span>Carmen AI is calculating group readiness…</span>
          </div>
        ) : (
          <div className="text-[11px] text-stone-700 leading-snug">
            <span className="font-semibold text-amber-900">✨ Carmen AI: </span>
            {assessment.aiResponse}
          </div>
        )}
      </div>

      {/* Google Tasks Checkbox List */}
      <div className="space-y-1 pt-0.5">
        {tasks.map((task) => (
          <div
            key={task.id}
            onClick={() => handleToggle(task.id)}
            className="group flex items-center justify-between gap-2.5 px-2 py-1.5 rounded-xl hover:bg-stone-50 cursor-pointer transition-colors"
          >
            {/* Google Tasks Round Ring Checkbox */}
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggle(task.id);
                }}
                className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                  task.completed
                    ? "bg-scarlet border-scarlet text-white"
                    : "border-stone-300 hover:border-scarlet bg-white"
                }`}
                aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
              >
                {task.completed && <Check size={11} strokeWidth={3} />}
              </button>

              <span
                className={`text-xs leading-snug truncate transition-all ${
                  task.completed ? "line-through text-stone-400" : "text-stone-800"
                }`}
              >
                {task.title}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[10px] text-stone-400 font-mono hidden sm:inline">
                +{task.weight}%
              </span>
              <button
                type="button"
                onClick={(e) => handleDelete(task.id, e)}
                className="opacity-0 group-hover:opacity-100 text-stone-300 hover:text-red-600 p-0.5 rounded cursor-pointer transition-opacity"
                aria-label="Delete task"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        ))}

        {/* Inline Add Task Form */}
        {isAdding ? (
          <form onSubmit={handleAddTask} className="flex items-center gap-1.5 pt-1">
            <input
              type="text"
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="New study task…"
              className="flex-1 px-2.5 py-1 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-scarlet"
            />
            <button
              type="submit"
              className="px-2.5 py-1 text-xs font-semibold bg-scarlet-dark text-white rounded-lg cursor-pointer"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-2 py-1 text-xs text-stone-500 hover:text-stone-800 cursor-pointer"
            >
              Cancel
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1.5 px-2 py-1 text-[11px] text-stone-500 hover:text-scarlet-dark font-medium cursor-pointer transition-colors"
          >
            <Plus size={13} />
            <span>Add a study objective</span>
          </button>
        )}
      </div>
    </div>
  );
}
