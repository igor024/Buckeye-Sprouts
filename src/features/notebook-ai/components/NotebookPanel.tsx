import type { SharedNotebook } from "@/types/contracts";
import { CollectiveGroupNotebook } from "./CollectiveGroupNotebook";

interface NotebookPanelProps {
  notebook: SharedNotebook | null;
  locked?: boolean;
  sessionId?: string;
  courseCode?: string;
  className?: string;
}

export function NotebookPanel({
  notebook,
  locked = false,
  sessionId,
  courseCode,
  className,
}: NotebookPanelProps) {
  return (
    <CollectiveGroupNotebook
      notebook={notebook}
      locked={locked}
      sessionId={sessionId}
      courseCode={courseCode || "CSE 2221"}
      className={className}
    />
  );
}

export { CollectiveGroupNotebook };
