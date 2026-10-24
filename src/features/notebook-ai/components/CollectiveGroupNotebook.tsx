"use client";

import { useEffect, useState } from "react";
import type { CollectiveGroupNotebookProps } from "../types";
import { CatchMeUpBanner } from "./CatchMeUpBanner";
import { AppleNotesManager } from "./AppleNotesManager";
import { CarmenAiChatbot } from "./CarmenAiChatbot";
import { MOCK_CARMEN_STUDENTS } from "../mock-carmen-data";

export function CollectiveGroupNotebook({
  sessionId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  notebook,
  locked = false,
  currentUser,
  memberCount = 3,
  courseCode = "CSE 2221",
  libraryName = "Thompson Library",
  floorLevel = "Floor 3",
  variant = "full",
  className = "",
  onStartNewNote,
  onNotebookContentChange,
}: CollectiveGroupNotebookProps) {
  const currentStudentId = currentUser?.id || "11111111-1111-4111-8111-111111111111";
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [notebookContent, setNotebookContent] = useState(notebook?.content || "");

  useEffect(() => setNotebookContent(notebook?.content || ""), [sessionId, notebook?.content]);

  const updateNotebookContent = (content: string) => {
    setNotebookContent(content);
    onNotebookContentChange?.(content);
  };

  const activeStudentProfile =
    MOCK_CARMEN_STUDENTS[currentStudentId] ||
    MOCK_CARMEN_STUDENTS["11111111-1111-4111-8111-111111111111"];

  return (
    <div className={`relative flex flex-col gap-3 w-full max-w-full overflow-hidden text-stone-800 pb-4 ${className}`}>
      {/* Calm Status Bar (No Leave Group Option) */}
      <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-stone-200/50">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span className="text-xs font-semibold text-stone-700 truncate">
            {courseCode} · {libraryName} {floorLevel}
          </span>
        </div>
        <span className="text-[10px] font-medium text-stone-500 bg-stone-100/90 px-2 py-0.5 rounded-full border border-stone-200/60 shrink-0">
          {memberCount} {memberCount === 1 ? "Buckeye" : "Buckeyes"} active
        </span>
      </div>

      <AppleNotesManager
        notebookContent={notebookContent}
        onNotebookContentChange={updateNotebookContent}
        onStartNewNote={onStartNewNote}
      />
      <CatchMeUpBanner
        courseCode={courseCode}
        studentName={activeStudentProfile.name.split(" ")[0]}
        notebookContent={notebookContent}
      />
      <CarmenAiChatbot
        studentProfile={activeStudentProfile}
        courseCode={courseCode}
        isOpenExternal={isChatOpen}
        onToggleExternal={() => setIsChatOpen(!isChatOpen)}
        notebookContent={notebookContent}
        onInsertToNotebook={(text) => updateNotebookContent(`${notebookContent}\n\n${text}`.trim())}
      />
    </div>
  );
}
