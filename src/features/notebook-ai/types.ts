import type { ProfilePreview, SharedNotebook } from "@/types/contracts";

export interface CarmenAssignment {
  id: string;
  title: string;
  dueDate: string;
  points: number;
  submitted: boolean;
  score?: string;
}

export interface CarmenCourse {
  courseId: string;
  courseCode: string;
  courseName: string;
  instructor: string;
  currentGrade: string;
  nextAssignment: CarmenAssignment;
  flaggedTopic: string;
  recentQuizInsight: string;
}

export interface IndividualStudyRecommendation {
  id: string;
  topic: string;
  priority: "high" | "medium" | "low";
  reason: string;
  actionItem: string;
  carmenCourseCode: string;
  sourceContext: string;
}

export interface StudentCarmenProfile {
  studentId: string;
  name: string;
  buckeyeIdDisplay: string;
  avatarUrl?: string;
  major: string;
  syncStatus: "connected" | "syncing" | "offline";
  lastSynced: string;
  courses: CarmenCourse[];
  individualRecommendations: IndividualStudyRecommendation[];
}

export interface PadletCard {
  id: string;
  category: "concept" | "question" | "gotcha" | "code";
  title: string;
  content: string;
  authorName: string;
  authorId: string;
  createdAt: string;
  votes: number;
  color: "cream" | "scarlet" | "amber" | "sage" | "slate";
}

export interface AgendaItem {
  id: string;
  title: string;
  completed: boolean;
  assignedToName?: string;
  estimatedMinutes?: number;
  addedByName: string;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "carmen_ai" | "system";
  text: string;
  timestamp: string;
  carmenSourceBadge?: string;
  suggestedAction?: {
    label: string;
    payloadText: string;
  };
}

export interface CatchMeUpSummary {
  coveredPoints: string[];
  currentFocus: string;
  keyTakeaway: string;
  generatedAt: string;
}

export interface UnitTaskItem {
  id: string;
  title: string;
  category: "concept" | "code" | "gotcha" | "practice";
  completed: boolean;
  assignedTo: string;
  weight: number;
  carmenTopicRef: string;
  color?: "cream" | "sage" | "amber" | "scarlet";
}

export interface AIReadinessAssessment {
  readinessScore: number;
  statusLabel: "Needs Practice" | "Developing" | "Proficient" | "Exam Ready";
  aiResponse: string;
  recommendedNextAction: string;
  lastUpdatedMilestone?: string;
}

export interface CollectiveGroupNotebookProps {
  sessionId?: string;
  notebook?: SharedNotebook | null;
  locked?: boolean;
  currentUser?: ProfilePreview | null;
  courseCode?: string;
  libraryName?: string;
  floorLevel?: string;
  variant?: "full" | "tab" | "card";
  onLeaveGroup?: () => void;
  onStartNewNote?: () => void;
  onNotebookContentChange?: (content: string) => void;
  className?: string;
}
