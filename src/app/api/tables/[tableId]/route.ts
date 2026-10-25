import { sessionsDiscoveryService } from "@/features/sessions-discovery/services";
import { parseTableLocation } from "@/features/sessions-discovery/table-ids";

export const runtime = "nodejs";

const noStoreHeaders = { "Cache-Control": "no-store" };

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tableId: string }> }
) {
  const { tableId } = await params;
  const decodedTableId = decodeURIComponent(tableId).trim();

  const { searchParams } = new URL(request.url);
  const libraryName = searchParams.get("library") || "Thompson Library";

  const location = parseTableLocation(decodedTableId, libraryName);
  const activeMatch = await sessionsDiscoveryService.getActiveSessionByTable(
    decodedTableId,
    libraryName
  );

  return Response.json(
    {
      tableId: decodedTableId,
      location,
      hasActiveSession: Boolean(activeMatch),
      sessionId: activeMatch?.sessionId || null,
      hostName: activeMatch?.hostName || null,
      session: activeMatch?.session || null,
    },
    {
      status: 200,
      headers: noStoreHeaders,
    }
  );
}
