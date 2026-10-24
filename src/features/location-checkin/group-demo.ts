import {
  DEMO_GROUP_COURSES, MOCK_DEMO_STUDY_GROUPS, THOMPSON_EAST_ENTRANCE_TABLES,
  type DemoCreateGroupInput, type DemoGroupState, type DemoStudyGroup, type ProfilePreview,
} from "@/types/contracts";

export type Action =
  | { type: "join"; groupId: string; profile: ProfilePreview; now: number }
  | { type: "create"; input: DemoCreateGroupInput; profile: ProfilePreview; id: string; now: number }
  | { type: "leave"; profileId: string; gps?: boolean }
  | { type: "notebook"; content: string }
  | { type: "invite"; profileId: string; hostId: string }
  | { type: "end"; hostId: string }
  | { type: "clear-notice" }
  | { type: "sync-from-db"; groups: DemoStudyGroup[] };

export function createDemoGroupState(initialGroups?: DemoStudyGroup[]): DemoGroupState {
  if (initialGroups && initialGroups.length > 0) {
    const dbTableIds = new Set(initialGroups.map((g) => g.tableId));
    const combined = [
      ...initialGroups.map((group) => ({
        ...group,
        members: [...group.members],
        invitedProfileIds: [...group.invitedProfileIds],
        joinedAtByProfileId: { ...group.joinedAtByProfileId },
      })),
      ...MOCK_DEMO_STUDY_GROUPS.filter((g) => !dbTableIds.has(g.tableId)).map((group) => ({
        ...group,
        members: [...group.members],
        invitedProfileIds: [...group.invitedProfileIds],
        joinedAtByProfileId: { ...group.joinedAtByProfileId },
      })),
    ];
    return { groups: combined, activeGroupId: null, notice: "" };
  }
  return {
    groups: MOCK_DEMO_STUDY_GROUPS.map((group) => ({
      ...group,
      members: [...group.members],
      invitedProfileIds: [...group.invitedProfileIds],
      joinedAtByProfileId: { ...group.joinedAtByProfileId },
    })),
    activeGroupId: null,
    notice: "",
  };
}

/** The mock reader must also work in a phone's ordinary HTTP/LAN preview. */
export function createDemoGroupId() {
  return `local-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;
}

export function canJoinDemoGroup(group: DemoStudyGroup, profileId: string) {
  return !group.inviteOnly || group.host.id === profileId || group.members.some((member) => member.id === profileId) || group.invitedProfileIds.includes(profileId);
}

export function demoGroupReducer(state: DemoGroupState, action: Action): DemoGroupState {
  if (action.type === "clear-notice") return { ...state, notice: "" };
  if (action.type === "sync-from-db") {
    const dbTableIds = new Set(action.groups.map((g) => g.tableId));
    const merged = [
      ...action.groups.map((g) => ({
        ...g,
        members: [...g.members],
        invitedProfileIds: [...(g.invitedProfileIds || [])],
        joinedAtByProfileId: { ...g.joinedAtByProfileId },
      })),
      ...state.groups.filter((g) => !dbTableIds.has(g.tableId)),
    ];
    return { ...state, groups: merged };
  }
  if (action.type === "join") {
    const group = state.groups.find((item) => item.id === action.groupId);
    if (state.activeGroupId || !group) return state;
    if (!canJoinDemoGroup(group, action.profile.id)) return { ...state, notice: "An invitation is required to join this group." };
    const alreadyJoined = [group.host, ...group.members].some((member) => member.id === action.profile.id);
    return { ...state, activeGroupId: group.id, notice: "", groups: state.groups.map((item) => item.id !== group.id || alreadyJoined ? item : {
      ...item, members: [...item.members, action.profile], joinedAtByProfileId: { ...item.joinedAtByProfileId, [action.profile.id]: action.now },
      invitedProfileIds: item.invitedProfileIds.filter((id) => id !== action.profile.id),
    }) };
  }
  if (action.type === "create") {
    if (state.activeGroupId || state.groups.some((group) => group.tableId === action.input.tableId)) return state;
    if (!THOMPSON_EAST_ENTRANCE_TABLES.some((table) => table.id === action.input.tableId)
      || !DEMO_GROUP_COURSES.some((course) => course.code === action.input.courseCode)) return state;
    const group: DemoStudyGroup = {
      id: action.id, tableId: action.input.tableId, name: action.input.name.trim() || `${action.profile.name}'s Group`,
      courseCode: action.input.courseCode, topic: "New study session", host: action.profile, members: [],
      inviteOnly: action.input.inviteOnly, invitedProfileIds: [], joinedAtByProfileId: { [action.profile.id]: action.now }, notebookContent: "",
    };
    return { ...state, groups: [...state.groups, group], activeGroupId: group.id, notice: "" };
  }
  const active = state.groups.find((group) => group.id === state.activeGroupId);
  if (!active) return state;
  if (action.type === "end") return active.host.id === action.hostId ? { ...state, groups: state.groups.filter((group) => group.id !== active.id), activeGroupId: null, notice: "The group session ended in this demo." } : state;
  if (action.type === "notebook") return { ...state, groups: state.groups.map((group) => group.id === active.id ? { ...group, notebookContent: action.content } : group) };
  if (action.type === "invite") {
    if (active.host.id !== action.hostId || !active.inviteOnly) return state;
    if ([active.host, ...active.members].some((profile) => profile.id === action.profileId)) return { ...state, notice: "That student is already in this group." };
    if (active.invitedProfileIds.includes(action.profileId)) return { ...state, notice: "That student already has an invitation." };
    return { ...state, notice: "Invitation granted in this local demo. They can confirm joining at the reader.", groups: state.groups.map((group) => group.id === active.id ? { ...group, invitedProfileIds: [...group.invitedProfileIds, action.profileId] } : group) };
  }
  const remaining = [active.host, ...active.members].filter((profile) => profile.id !== action.profileId)
    .sort((a, b) => active.joinedAtByProfileId[a.id] - active.joinedAtByProfileId[b.id]);
  const prefix = action.gps ? "GPS simulation: moved over 150 m away. " : "";
  if (!remaining.length) return { ...state, activeGroupId: null, groups: state.groups.filter((group) => group.id !== active.id), notice: `${prefix}You left the group. Its posting closed because no members remain.` };
  const host = active.host.id === action.profileId ? remaining[0] : active.host;
  return { ...state, activeGroupId: null, notice: `${prefix}You left the group.${host.id !== active.host.id ? ` ${host.name} is now the host.` : ""}`, groups: state.groups.map((group) => group.id === active.id ? {
    ...group, host, members: remaining.filter((profile) => profile.id !== host.id),
    joinedAtByProfileId: Object.fromEntries(remaining.map((profile) => [profile.id, active.joinedAtByProfileId[profile.id]])),
  } : group) };
}
