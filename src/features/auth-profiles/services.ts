import "server-only";
import { getMockSessionAccess, mockStore, mockViewerId, toProfilePreview } from "@/lib/supabase";
import { FeatureNotImplementedError, type AuthProfilesService, type JoinRequestPreview } from "@/types/contracts";

/** Workstream 1 owns this adapter. Reads use fixtures; mutations are intentional stubs. */
export const authProfilesService: AuthProfilesService = {
  async getCurrentProfile() {
    const profile = mockStore.profiles.find((item) => item.id === mockViewerId);
    return profile ? toProfilePreview(profile) : null;
  },
  async getProfile(userId) {
    const profile = mockStore.profiles.find((item) => item.id === userId);
    return profile ? toProfilePreview(profile) : null;
  },
  async listJoinRequests(sessionId) {
    if (getMockSessionAccess(sessionId) !== "host") return [];
    return mockStore.joinRequests
      .filter((request) => request.sessionId === sessionId)
      .map((request): JoinRequestPreview => ({
        ...structuredClone(request),
        requesterProfile: toProfilePreview(request.requesterProfile),
      }));
  },
  async updateProfile() { throw new FeatureNotImplementedError("updateProfile"); },
  async verifyBuckId() { throw new FeatureNotImplementedError("verifyBuckId"); },
  async requestJoin() { throw new FeatureNotImplementedError("requestJoin"); },
  async reviewJoinRequest() { throw new FeatureNotImplementedError("reviewJoinRequest"); },
};
