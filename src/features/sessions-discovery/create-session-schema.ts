import { z } from "zod";
import type { CreateSessionInput } from "@/types/contracts";

/** The shared contract permits any string; creation accepts documented venues only. */
const venues = [
  "Thompson Library",
  "18th Avenue Library",
  "Prior Health Sciences Library",
  "Kearns Hall",
  "Other",
] as const;

const coordinatesSchema = z.object({
  lat: z.number().finite().min(-90).max(90),
  lng: z.number().finite().min(-180).max(180),
}).strict();

export const createSessionSchema: z.ZodType<CreateSessionInput> = z.object({
  title: z.string().trim().min(3).max(80),
  subtitle: z.string().trim().max(180),
  courseCode: z.string().trim().min(2).max(24),
  libraryName: z.enum(venues),
  tableId: z.string().trim().min(1).max(80),
  floor: z.string().trim().min(1).max(80).optional(),
  zone: z.string().trim().min(1).max(80).optional(),
  totalSeats: z.number().int().min(1).max(20),
  availableSeats: z.number().int().min(0).max(20),
  surroundingsPhotoUrl: z.string().max(2048).refine((value) => {
    if (value === "") return true;
    try {
      const url = new URL(value);
      return (url.protocol === "http:" || url.protocol === "https:") && !url.username && !url.password;
    } catch {
      return false;
    }
  }),
  requiresApproval: z.boolean(),
  status: z.enum(["active", "scheduled"]),
  scheduledFor: z.iso.datetime({ offset: true }).optional(),
  gpsCoordinates: coordinatesSchema,
}).strict().superRefine((input, context) => {
  if (input.availableSeats > input.totalSeats) {
    context.addIssue({ code: "custom", path: ["availableSeats"], message: "Available seats cannot exceed total seats." });
  }
  if (input.status === "scheduled") {
    if (!input.scheduledFor || Date.parse(input.scheduledFor) <= Date.now()) {
      context.addIssue({ code: "custom", path: ["scheduledFor"], message: "Scheduled sessions must have a future start time." });
    }
  } else if (input.scheduledFor !== undefined) {
    context.addIssue({ code: "custom", path: ["scheduledFor"], message: "Active sessions cannot include a scheduled start time." });
  }
});
