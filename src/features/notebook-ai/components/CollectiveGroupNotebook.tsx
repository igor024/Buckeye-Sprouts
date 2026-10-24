"use client";

import { useEffect, useState } from "react";
import type { CollectiveGroupNotebookProps } from "../types";
import { StickyUnitTaskPadlet } from "./StickyUnitTaskPadlet";
import { CatchMeUpBanner } from "./CatchMeUpBanner";
import { AppleNotesManager } from "./AppleNotesManager";
import { IndividualAiRecommendations } from "./IndividualAiRecommendations";
import { CarmenAiChatbot } from "./CarmenAiChatbot";
import { MOCK_CARMEN_STUDENTS } from "../mock-carmen-data";

export function CollectiveGroupNotebook({
  sessionId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  notebook,
  locked = false,
  currentUser,
  courseCode = "CSE 2221",
  libraryName = "Thompson Library",
  floorLevel = "Floor 3",
  variant = "full",
  className = "",
}: CollectiveGroupNotebookProps) {
  const [currentStudentId, setCurrentStudentId] = useState<string>(
    currentUser?.id || "11111111-1111-4111-8111-111111111111"
  );
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    const handleOpenCarmenAi = () => setIsChatOpen(true);
    window.addEventListener("buckeye:open-carmen-ai", handleOpenCarmenAi);
    return () => window.removeEventListener("buckeye:open-carmen-ai", handleOpenCarmenAi);
  }, []);

  const activeStudentProfile =
    MOCK_CARMEN_STUDENTS[currentStudentId] ||
    MOCK_CARMEN_STUDENTS["11111111-1111-4111-8111-111111111111"];

  return (
    <div className={`relative flex flex-col gap-3 w-full max-w-full overflow-hidden text-stone-800 pb-20 ${className}`}>
      {/* Calm Status Bar (No Leave Group Option) */}
      <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-stone-200/50">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span className="text-xs font-semibold text-stone-700 truncate">
            {courseCode} · {libraryName} {floorLevel}
          </span>
        </div>
        <span className="text-[10px] font-medium text-stone-500 bg-stone-100/90 px-2 py-0.5 rounded-full border border-stone-200/60 shrink-0">
          3 Buckeyes active
        </span>
      </div>

      {/* 1. STICKY PADS AT TOP: Google Tasks-style Checkboxes + Dynamic AI Readiness Engine */}
      <StickyUnitTaskPadlet courseCode={courseCode} />

      {/* 2. SHARED GROUP NOTES FEED (Apple Notes iOS Inset Grouped Style) */}
      <AppleNotesManager />

      {/* 3. Compact Catch Me Up AI Briefing Accordion */}
      <CatchMeUpBanner
        courseCode={courseCode}
        studentName={activeStudentProfile.name.split(" ")[0]}
      />

      {/* 4. Compact Individualized CarmenCanvas Focus Accordion */}
      <IndividualAiRecommendations
        currentStudentId={currentStudentId}
        onSelectStudent={(id) => setCurrentStudentId(id)}
      />

      {/* 5. Carmen AI Modal Assistant (No floating star button) */}
      <CarmenAiChatbot
        studentProfile={activeStudentProfile}
        courseCode={courseCode}
        isOpenExternal={isChatOpen}
        onToggleExternal={() => setIsChatOpen(!isChatOpen)}
      />
    </div>
  );
}
