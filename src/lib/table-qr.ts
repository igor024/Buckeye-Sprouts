import { THOMPSON_EAST_ENTRANCE_TABLES } from "@/types/contracts";

/** Physical anchors must resolve to an actual table in the floor plan. */
export function normalizeQrTableId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  return THOMPSON_EAST_ENTRANCE_TABLES.find((table) => table.id === normalized)?.id ?? null;
}

export function tableGroupHref(value: unknown): string | null {
  const tableId = normalizeQrTableId(value);
  return tableId ? `/?tab=join&table=${encodeURIComponent(tableId)}` : null;
}

/** Read the table anchor, never navigate to an arbitrary scanned hostname. */
export function parseTableQrPayload(raw: string): string | null {
  const text = raw.trim();
  try {
    if (text.startsWith("{")) {
      const payload: unknown = JSON.parse(text);
      if (!payload || typeof payload !== "object" || !("tableId" in payload)) return null;
      if ("libraryName" in payload && payload.libraryName !== "Thompson Library") return null;
      return normalizeQrTableId(payload.tableId);
    }

    if (!/^https?:\/\//i.test(text) && !text.startsWith("/")) return null;
    const url = new URL(text, "https://buckeyesprouts.invalid");
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    const match = url.pathname.match(/^\/(?:table|qr)\/([^/]+)\/?$/i);
    return match ? normalizeQrTableId(decodeURIComponent(match[1])) : null;
  } catch {
    return null;
  }
}
