import type { ProfilePreview, SharedNotebook } from "@/types/contracts";
import { CollectiveGroupNotebook } from "./CollectiveGroupNotebook";

interface NotebookPanelProps {
  notebook: SharedNotebook | null;
  locked?: boolean;
  sessionId?: string;
  courseCode?: string;
  className?: string;
  memberCount?: number;
  floorLevel?: string;
  currentUser?: ProfilePreview | null;
  onStartNewNote?: () => void;
  onNotebookContentChange?: (content: string) => void;
}

export function NotebookPanel({
  notebook,
  locked = false,
  sessionId,
  courseCode,
  className,
  memberCount,
  floorLevel,
  currentUser,
  onStartNewNote,
  onNotebookContentChange,
}: NotebookPanelProps) {
  return (
    <CollectiveGroupNotebook
      notebook={notebook}
      locked={locked}
      sessionId={sessionId}
      courseCode={courseCode || "CSE 2221"}
      className={className}
      memberCount={memberCount}
      floorLevel={floorLevel}
      currentUser={currentUser}
      onStartNewNote={onStartNewNote}
      onNotebookContentChange={onNotebookContentChange}
    />
  );
}

export { CollectiveGroupNotebook };
