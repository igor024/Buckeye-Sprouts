export interface FinderMessage {
  role: "user" | "assistant";
  content: string;
}

/** Discovery data only. No identities, private table anchors, photos or notebooks. */
export interface FinderGroup {
  id: string;
  title: string;
  description: string;
  courseCode: string;
  libraryName: string;
  floor: string;
  totalSeats: number;
  availableSeats: number;
  requiresApproval: boolean;
  topics: string[];
}

export interface FinderMatch {
  sessionId: string;
  reason: string;
  group: FinderGroup;
}

export interface FinderResponse {
  reply: string;
  matches: FinderMatch[];
  source: "gemini" | "basic";
  dataSource: "database" | "cached";
  asOf?: string;
  notice?: string;
}
