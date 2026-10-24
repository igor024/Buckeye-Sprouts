"use server";

import { revalidatePath } from "next/cache";
import { MOCK_PROFILES, type UpdateProfileInput } from "@/types/contracts";
import { authDemoEnabled, authProfilesService, getDemoJoinStatus, requestDemoJoinAs, simulateDemoJoinAs } from "./services";

const demoRequesterId = MOCK_PROFILES[2].id;

export async function updateDemoProfileAction(input: UpdateProfileInput) {
  const profile = await authProfilesService.updateProfile(input);
  revalidatePath("/");
  return profile;
}

export async function requestDemoJoinAction(sessionId: string) {
  const request = await requestDemoJoinAs(sessionId, demoRequesterId);
  revalidatePath(`/session/${sessionId}`);
  return request;
}

export async function simulateIncomingJoinAction(sessionId: string, actorIndex = 1) {
  const request = await simulateDemoJoinAs(sessionId, actorIndex);
  revalidatePath(`/session/${sessionId}`);
  return request;
}

export async function getDemoJoinStatusAction(sessionId: string) {
  return await getDemoJoinStatus(sessionId, demoRequesterId);
}

export async function reviewDemoJoinAction(requestId: string, decision: "approved" | "rejected") {
  const request = await authProfilesService.reviewJoinRequest(requestId, decision);
  revalidatePath(`/session/${request.sessionId}`);
  revalidatePath("/");
  return request;
}

export async function isAuthDemoAvailableAction() {
  return authDemoEnabled;
}
