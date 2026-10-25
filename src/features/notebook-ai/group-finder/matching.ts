import { DEMO_GROUP_COURSES, THOMPSON_EAST_ENTRANCE_TABLES, type DemoStudyGroup } from "@/types/contracts";
import { groupSeatCounts } from "@/lib/group-seats";
import type { FinderGroup, FinderMessage, FinderResponse } from "./types";

const tableIds = new Set(THOMPSON_EAST_ENTRANCE_TABLES.map((table) => table.id));
const normalize = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const stopWords = new Set("a an the i me my we us our want need find help group groups study studying with for of to in on at please looking that is are has have and or it one two three four people seats seat open only without approval invitation".split(" "));

export function conversationWindow(messages: FinderMessage[]): FinderMessage[] {
  const result = messages.slice(-10);
  while (result.length && (result.reduce((sum, message) => sum + message.content.length, 0) > 12000 || result[0].role === "assistant")) result.shift();
  return result;
}

export function finderGroupsFromMap(groups: readonly DemoStudyGroup[]): FinderGroup[] {
  return groups.filter((group) => tableIds.has(group.tableId)).map((group) => {
    const seats = groupSeatCounts(group);
    return {
      id: group.id, title: group.name, description: group.topic, courseCode: group.courseCode,
      libraryName: "Thompson Library", floor: "Level 1", totalSeats: seats.totalSeats,
      availableSeats: seats.availableSeats, requiresApproval: group.inviteOnly, topics: [],
    };
  }).filter((group) => group.availableSeats > 0);
}

/** A transparent fallback, never labeled as a Gemini response. */
export function basicGroupMatches(messages: FinderMessage[], groups: readonly FinderGroup[]): Pick<FinderResponse, "reply" | "matches"> {
  const userMessages = messages.filter((message) => message.role === "user").map((message) => message.content);
  const latest = userMessages.at(-1) ?? "";
  // Latest explicit course replaces earlier courses, while short follow-ups inherit context.
  const courseContext = [...userMessages].reverse().find((text) => /\b[a-z]{2,6}\s*\d{4}\b/i.test(text)) ?? "";
  const courses = [...courseContext.matchAll(/\b([a-z]{2,6})\s*(\d{4})\b/gi)].map((match) => normalize(`${match[1]} ${match[2]}`));
  const context = userMessages.slice(-3).join(" ").toLowerCase();
  const openOnly = /\b(?:open groups?|without (?:an? )?(?:invitation|approval)|no (?:invitation|approval)|not invite.only)\b/.test(context);
  const seatMatch = [...context.matchAll(/\b(?:room for|seats? for|for)\s+(\d+|one|two|three|four|five|six)|\b(\d+)\s+(?:open |available )?seats?\b/g)].at(-1);
  const numberWords: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6 };
  const requestedSeats = seatMatch ? numberWords[seatMatch[1]] ?? Number(seatMatch[1] ?? seatMatch[2]) : 1;
  const terms = [...new Set(normalize(latest).split(" ").filter((term) => term.length > 1 && !stopWords.has(term)))];
  const olderTerms = normalize(userMessages.slice(-3, -1).join(" ")).split(" ").filter((term) => term.length > 1 && !stopWords.has(term));
  const matches = groups.filter((group) => group.availableSeats >= requestedSeats && group.availableSeats > 0
    && (!openOnly || !group.requiresApproval) && (!courses.length || courses.includes(normalize(group.courseCode))))
    .map((group) => {
      const courseName = DEMO_GROUP_COURSES.find((course) => normalize(course.code) === normalize(group.courseCode))?.name ?? "";
      const haystack = normalize([group.title, group.description, group.courseCode, courseName, ...group.topics].join(" "));
      const score = terms.reduce((sum, term) => sum + (haystack.includes(term) ? 4 : 0), 0)
        + olderTerms.reduce((sum, term) => sum + (haystack.includes(term) ? 1 : 0), 0);
      return { group, score };
    })
    .filter(({ score }) => score > 0 || courses.length > 0 || openOnly || requestedSeats > 1)
    .sort((a, b) => b.score - a.score || b.group.availableSeats - a.group.availableSeats || a.group.id.localeCompare(b.group.id))
    .slice(0, 3)
    .map(({ group }) => ({ sessionId: group.id, group, reason: `${group.courseCode} · ${group.availableSeats} open seat${group.availableSeats === 1 ? "" : "s"}${group.requiresApproval ? "; host approval or an invitation is needed" : "; open group"}.` }));
  return {
    reply: !groups.length ? "There are no active groups with open seats on Thompson Level 1 right now. Try refreshing the map later."
      : matches.length ? "These groups match your course, topic, or seat preferences. I can narrow the search if you tell me more."
        : "I couldn't find an open group matching those details. Try a course number, a topic, or the number of seats you need. Details such as noise level and schedules may not be recorded.",
    matches,
  };
}
