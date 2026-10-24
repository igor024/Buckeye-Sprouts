"use client";

import { useState } from "react";
import { Sparkles, Clock, CheckCircle2, RefreshCw, ChevronDown, ChevronUp, UserPlus } from "lucide-react";

interface CatchMeUpBannerProps {
  courseCode?: string;
  studentName?: string;
  notebookContent?: string;
  onRefresh?: () => void;
}

export function CatchMeUpBanner({
  courseCode = "CSE 2221",
  studentName = "Alex",
  notebookContent = "",
  onRefresh,
}: CatchMeUpBannerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSimulatedLateJoin, setIsSimulatedLateJoin] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (onRefresh) onRefresh();
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  const toggleSimulateLateJoin = () => {
    setIsSimulatedLateJoin((prev) => !prev);
    setIsExpanded(true);
  };

  return (
    <div className="rounded-2xl border border-stone-200/80 bg-white/70 backdrop-blur-md p-2.5 transition-all shadow-2xs">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-left flex-1 min-w-0 cursor-pointer"
        >
          <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-800 flex items-center justify-center shrink-0">
            <Sparkles size={13} className="text-amber-700" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-stone-800">Catch-Me-Up AI Briefing</span>
              <span className="text-[10px] text-stone-400 font-mono hidden xs:inline">
                · {isExpanded ? "Hide" : "Tap to review"}
              </span>
            </div>
          </div>
        </button>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={toggleSimulateLateJoin}
            className="text-[10px] font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 hover:bg-amber-100 cursor-pointer transition-colors"
          >
            {isSimulatedLateJoin ? "Reset" : "Late Arrival Demo"}
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded-md text-stone-400 hover:text-stone-700 cursor-pointer"
            aria-label={isExpanded ? "Collapse briefing" : "Expand briefing"}
          >
            {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-3.5 pt-3 border-t border-amber-200/60 space-y-2.5 text-xs text-stone-800">
          {isSimulatedLateJoin && (
            <div className="bg-white/80 border border-amber-300 rounded-lg p-2.5 mb-2 text-stone-700 flex items-center justify-between">
              <span className="text-[11px]">
                👋 Welcome, <strong>{studentName}</strong>! You joined 42 minutes into this session. Here is your fast catch-up:
              </span>
              <span className="text-[10px] text-stone-500 font-mono flex items-center gap-1">
                <Clock size={11} /> 42m elapsed
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            <div className="bg-white/90 rounded-lg p-3 border border-amber-100 shadow-2xs">
              <div className="flex items-center gap-1.5 font-semibold text-amber-950 mb-1 text-[11px]">
                <CheckCircle2 size={13} className="text-emerald-600" />
                1. What Was Covered
              </div>
              <p className="text-[11px] text-stone-600 leading-relaxed">
                Reviewed recursion call stack structure and why omitting a base case causes a StackOverflowError. Jordan and Alex worked through recursive factorial tracing.
              </p>
            </div>

            <div className="bg-white/90 rounded-lg p-3 border border-amber-100 shadow-2xs">
              <div className="flex items-center gap-1.5 font-semibold text-amber-950 mb-1 text-[11px]">
                <Sparkles size={13} className="text-amber-600" />
                2. Key Consensus & Rules
              </div>
              <p className="text-[11px] text-stone-600 leading-relaxed">
                Golden rule established: Always test boundary condition (e.g. <code className="bg-amber-50 px-1 py-0.5 rounded text-amber-900 font-mono text-[10px]">n == 0</code>) before reducing parameters to avoid infinite recursion loops.
              </p>
            </div>

            <div className="bg-white/90 rounded-lg p-3 border border-amber-100 shadow-2xs">
              <div className="flex items-center gap-1.5 font-semibold text-amber-950 mb-1 text-[11px]">
                <Clock size={13} className="text-red-700" />
                3. Currently Working On
              </div>
              <p className="text-[11px] text-stone-600 leading-relaxed">
                Writing the <code className="bg-amber-50 px-1 py-0.5 rounded text-amber-900 font-mono text-[10px]">reverseQueue()</code> method for Carmen Homework 6 without using temporary arrays or loops.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
