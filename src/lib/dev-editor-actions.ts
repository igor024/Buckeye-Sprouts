"use server";

import { z } from "zod";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { mockStore, toProfilePreview } from "@/lib/supabase";

function requireDev() {
  if (process.env.NODE_ENV !== "development") throw new Error("Dev editor is disabled outside development.");
}

const personSchema = z.object({
  id: z.string().uuid(), name: z.string().trim().min(1).max(120),
  major: z.string().max(200), bio: z.string().max(2000),
  currentCourses: z.array(z.string().trim().min(1).max(50)).max(30),
});
const groupSchema = z.object({
  id: z.string().uuid(), hostId: z.string().uuid(), memberIds: z.array(z.string().uuid()).max(100),
});

export async function readDevEditor() {
  requireDev();
  const client = process.env.BUCKEYESPROUTS_DEMO_MODE === "true" ? null : getSupabaseAdminClient();
  if (client) {
    const [people, sessions] = await Promise.all([
      client.from("profiles").select("id, name, major, bio, current_courses").order("name"),
      client.from("study_sessions").select("id, title, host_id, table_id, total_seats, join_requests(requester_id, status), check_ins(user_id, checked_out_at)").neq("status", "closed").order("created_at", { ascending: false }),
    ]);
    if (!people.error && !sessions.error) return {
      mode: "live" as const,
      people: (people.data ?? []).map((p) => ({ id: p.id as string, name: p.name as string, major: p.major as string, bio: p.bio as string, currentCourses: p.current_courses as string[] })),
      groups: (sessions.data ?? []).map((s) => ({
        id: s.id as string, title: s.title as string, hostId: s.host_id as string,
        tableId: s.table_id as string | null, totalSeats: s.total_seats as number,
        memberIds: [...new Set([
          ...s.join_requests.filter((r) => r.status === "approved").map((r) => r.requester_id as string),
          ...s.check_ins.filter((r) => !r.checked_out_at).map((r) => r.user_id as string),
        ])].filter((id) => id !== s.host_id),
      })),
    };
  }
  // Offline edits use the same process-local fixtures as the feature services.
  return {
    mode: "mock" as const,
    people: mockStore.profiles.map((p) => {
      const { id, name, major, bio, currentCourses } = toProfilePreview(p);
      return { id, name, major, bio, currentCourses };
    }),
    groups: mockStore.sessions.filter((s) => s.status !== "closed").map((s) => ({
      id: s.id, title: s.title, hostId: s.hostId, tableId: s.tableId, totalSeats: s.totalSeats,
      memberIds: [...new Set([
        ...mockStore.joinRequests.filter((r) => r.sessionId === s.id && r.status === "approved").map((r) => r.requesterProfile.id),
        ...mockStore.checkIns.filter((r) => r.sessionId === s.id && !r.checkedOutAt).map((r) => r.userId),
      ])].filter((id) => id !== s.hostId),
    })),
  };
}

export async function saveDevPerson(input: z.infer<typeof personSchema>, mode: "live" | "mock") {
  requireDev();
  const person = personSchema.parse(input);
  if (mode === "mock") {
    const existing = mockStore.profiles.find((p) => p.id === person.id);
    if (!existing) throw new Error("Person not found.");
    Object.assign(existing, person);
    for (const request of mockStore.joinRequests) {
      if (request.requesterProfile.id === person.id) Object.assign(request.requesterProfile, person);
    }
  } else {
    const client = getSupabaseAdminClient();
    if (!client) throw new Error("Database unavailable.");
    const { error } = await client.from("profiles").update({
      name: person.name, major: person.major, bio: person.bio, current_courses: person.currentCourses,
    }).eq("id", person.id).select("id").single();
    if (error) throw new Error(error.message);
  }
}

export async function saveDevGroup(input: z.infer<typeof groupSchema>, mode: "live" | "mock") {
  requireDev();
  const group = groupSchema.parse(input);
  const data = await readDevEditor();
  if (data.mode !== mode) throw new Error("Data source changed. Reload the editor before saving.");
  const existing = data.groups.find((g) => g.id === group.id);
  if (!existing) throw new Error("Group not found.");
  const occupants = [...new Set([group.hostId, ...group.memberIds])];
  if (occupants.length > existing.totalSeats) throw new Error(`This group has ${existing.totalSeats} seats including its owner.`);
  if (occupants.some((id) => !data.people.some((p) => p.id === id))) throw new Error("Unknown person selected.");
  const now = new Date().toISOString();
  if (mode === "mock") {
    const session = mockStore.sessions.find((s) => s.id === group.id)!;
    session.hostId = group.hostId;
    session.availableSeats = session.totalSeats - occupants.length;
    mockStore.joinRequests = mockStore.joinRequests.filter((r) => r.sessionId !== group.id);
    for (const receipt of mockStore.checkIns) {
      if (receipt.sessionId === group.id && !receipt.checkedOutAt) receipt.checkedOutAt = now;
    }
    for (const id of occupants) {
      mockStore.checkIns.push({ id: crypto.randomUUID(), sessionId: group.id, userId: id, method: "table_qr", checkedInAt: now });
      if (id !== group.hostId) mockStore.joinRequests.push({
        id: crypto.randomUUID(), sessionId: group.id,
        requesterProfile: structuredClone(mockStore.profiles.find((p) => p.id === id)!), status: "approved", requestedAt: now,
      });
    }
    return;
  }
  const client = getSupabaseAdminClient();
  if (!client) throw new Error("Database unavailable.");
  // Preserve check-in history; only end receipts for people removed from the roster.
  const { data: receipts, error: readError } = await client.from("check_ins").select("id, user_id").eq("session_id", group.id).is("checked_out_at", null);
  if (readError) throw new Error(readError.message);
  const removed = (receipts ?? []).filter((r) => !occupants.includes(r.user_id)).map((r) => r.id);
  if (removed.length) {
    const { error } = await client.from("check_ins").update({ checked_out_at: now }).in("id", removed);
    if (error) throw new Error(error.message);
  }
  const additions = occupants.filter((id) => !(receipts ?? []).some((r) => r.user_id === id));
  if (additions.length) {
    const { error } = await client.from("check_ins").insert(additions.map((id) => ({ session_id: group.id, user_id: id, method: "table_qr", checked_in_at: now })));
    if (error) throw new Error(error.message);
  }
  const removedMembers = existing.memberIds.filter((id) => !occupants.includes(id));
  if (removedMembers.length) {
    const { error } = await client.from("join_requests").update({ status: "cancelled" }).eq("session_id", group.id).in("requester_id", removedMembers);
    if (error) throw new Error(error.message);
  }
  const { error: joinError } = await client.from("join_requests").upsert(occupants.map((id) => ({
    session_id: group.id, requester_id: id, status: "approved", requested_at: now,
  })), { onConflict: "session_id,requester_id" });
  if (joinError) throw new Error(joinError.message);
  const { error } = await client.from("study_sessions").update({ host_id: group.hostId, available_seats: existing.totalSeats - occupants.length }).eq("id", group.id).select("id").single();
  if (error) throw new Error(error.message);
}
