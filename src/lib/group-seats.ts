import type { DemoCreateGroupInput, DemoStudyGroup, ThompsonTable } from "@/types/contracts";

export const DEFAULT_AVAILABLE_SEATS = 4;
export const MAX_AVAILABLE_SEATS = 19;

// Optional extensions keep existing feature contracts and mock fixtures compatible.
export interface GroupCreationInput extends DemoCreateGroupInput {
  availableSeats?: number;
}

export interface StudyGroupWithSeats extends DemoStudyGroup {
  totalSeats?: number;
  availableSeats?: number;
  occupiedSeats?: number;
}

function isSeatCount(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

export function initialGroupSeats(value: unknown = DEFAULT_AVAILABLE_SEATS) {
  if (!isSeatCount(value) || value > MAX_AVAILABLE_SEATS) {
    throw new RangeError(`Available seats must be a whole number from 0 to ${MAX_AVAILABLE_SEATS}.`);
  }
  // The host occupies one seat, so an advertised opening survives check-in refresh.
  return { totalSeats: value + 1, availableSeats: value, occupiedSeats: 1 };
}

export function groupSeatCounts(group: StudyGroupWithSeats) {
  const totalSeats = isSeatCount(group.totalSeats) && group.totalSeats > 0
    ? group.totalSeats : DEFAULT_AVAILABLE_SEATS + 1;
  const occupiedSeats = isSeatCount(group.occupiedSeats) ? group.occupiedSeats
    : isSeatCount(group.availableSeats) && group.availableSeats <= totalSeats ? totalSeats - group.availableSeats
      : new Set([group.host.id, ...group.members.map((member) => member.id)]).size;
  return { totalSeats, occupiedSeats, availableSeats: Math.max(0, totalSeats - occupiedSeats) };
}

export function groupTableStatus(group: StudyGroupWithSeats | null | undefined): ThompsonTable["status"] {
  if (!group) return "empty";
  const seats = groupSeatCounts(group);
  return seats.occupiedSeats >= seats.totalSeats ? "very-busy" : "busy";
}

export function sessionGroupSeats(row: {
  total_seats?: number;
  available_seats?: number;
  check_ins?: { user_id: string; checked_out_at?: string | null }[];
}) {
  const totalSeats = isSeatCount(row.total_seats) && row.total_seats > 0
    ? row.total_seats : DEFAULT_AVAILABLE_SEATS + 1;
  const occupiedSeats = Array.isArray(row.check_ins)
    ? new Set(row.check_ins.filter((receipt) => receipt.checked_out_at == null).map((receipt) => receipt.user_id)).size
    : isSeatCount(row.available_seats) && row.available_seats <= totalSeats ? totalSeats - row.available_seats : 1;
  return { totalSeats, occupiedSeats, availableSeats: Math.max(0, totalSeats - occupiedSeats) };
}
