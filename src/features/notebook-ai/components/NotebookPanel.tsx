import type { SharedNotebook } from "@/types/contracts";
import { CollectiveGroupNotebook } from "./CollectiveGroupNotebook";

interface NotebookPanelProps {
  notebook: SharedNotebook | null;
  locked?: boolean;
  sessionId?: string;
  courseCode?: string;
  className?: string;
  onStartNewNote?: () => void;
  onNotebookContentChange?: (content: string) => void;
}

export function NotebookPanel({
  notebook,
  locked = false,
  sessionId,
  courseCode,
  className,
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
      onStartNewNote={onStartNewNote}
      onNotebookContentChange={onNotebookContentChange}
    />
  );
}

export { CollectiveGroupNotebook };
