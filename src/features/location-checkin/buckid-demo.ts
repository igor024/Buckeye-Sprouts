import type { ProfilePreview } from "@/types/contracts";
import { initialGroupSeats, type StudyGroupWithSeats } from "@/lib/group-seats";

export const BUCKID_DEMO_TABLE_ID = "110-1";
export const BUCKID_DEMO_GROUP_ID = "local-buckid-demo-110-1";
export const BUCKID_DEMO_HOST_ID = "local-buckid-host-ethan-dong";

/** Each simulated tap starts with one seated host; joining adds the current viewer. */
export function createBuckIdDemoGroup(): StudyGroupWithSeats {
  const host: ProfilePreview = {
    id: BUCKID_DEMO_HOST_ID,
    name: "Ethan Dong",
    avatarUrl: "",
    major: "Computer Science & Engineering",
    currentCourses: ["CSE 2221"],
    bio: "Reviewing recursion. Pull up a chair!",
  };
  return {
    ...initialGroupSeats(),
    id: BUCKID_DEMO_GROUP_ID,
    tableId: BUCKID_DEMO_TABLE_ID,
    name: "Ethan's Group",
    courseCode: "CSE 2221",
    topic: "Recursion and software components",
    host,
    members: [],
    inviteOnly: false,
    invitedProfileIds: [],
    joinedAtByProfileId: { [host.id]: 1 },
    notebookContent: "## CSE 2221 study notes\n[note] Ethan Dong · Shared\nRecursion and software components.",
  };
}
