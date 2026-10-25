import { z } from "zod";

export const finderRequestSchema = z.object({
  messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().trim().min(1).max(2000) }).strict()).min(1).max(10),
}).strict().refine(({ messages }) => messages.at(-1)?.role === "user"
  && messages.reduce((sum, message) => sum + message.content.length, 0) <= 12000, "End with a user prompt and keep the conversation under 12000 characters.");

export const generatedMatchesSchema = z.object({
  reply: z.string().trim().min(1).max(2000),
  matches: z.array(z.object({ sessionId: z.string().min(1).max(100), reason: z.string().trim().min(1).max(500) }).strict()).max(3),
}).strict();

const finderGroupSchema = z.object({
  id: z.string(), title: z.string(), description: z.string(), courseCode: z.string(), libraryName: z.literal("Thompson Library"),
  floor: z.string(), totalSeats: z.number().int().positive(), availableSeats: z.number().int().nonnegative(),
  requiresApproval: z.boolean(), topics: z.array(z.string()),
}).strict();

export const finderResponseSchema = z.object({
  reply: z.string(), matches: z.array(z.object({ sessionId: z.string(), reason: z.string(), group: finderGroupSchema }).strict()).max(3),
  source: z.enum(["gemini", "basic"]), dataSource: z.enum(["database", "cached"]), asOf: z.string().optional(), notice: z.string().optional(),
}).strict();
