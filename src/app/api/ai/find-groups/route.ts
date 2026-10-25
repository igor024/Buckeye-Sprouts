import { finderRequestSchema } from "@/features/notebook-ai/group-finder/schemas";
import { findGroups, readFinderCatalog } from "@/features/notebook-ai/group-finder/server";

export const runtime = "nodejs";
const headers = { "Cache-Control": "no-store" };

export async function POST(request: Request) {
  const parsed = finderRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Enter a prompt up to 2000 characters. Conversation history is limited to 10 messages and 12000 characters." }, { status: 400, headers });
  try {
    return Response.json(await findGroups(parsed.data.messages, request.signal), { headers });
  } catch {
    return Response.json({ error: request.signal.aborted ? "Search cancelled." : "Live group data is unavailable. Try again or use cached map matches." }, { status: request.signal.aborted ? 499 : 503, headers });
  }
}

/** Recheck a recommendation without calling Gemini or changing membership. */
export async function GET(request: Request) {
  const sessionId = new URL(request.url).searchParams.get("sessionId");
  if (!sessionId || sessionId.length > 100) return Response.json({ error: "A group ID is required." }, { status: 400, headers });
  try {
    const catalog = await readFinderCatalog(request.signal);
    const group = catalog.groups.find((group) => group.id === sessionId);
    return group ? Response.json({ group, asOf: catalog.asOf }, { headers })
      : Response.json({ error: "This group is no longer open or its last seat has been taken. Try another search." }, { status: 409, headers });
  } catch {
    return Response.json({ error: "Couldn't verify current availability. Please retry." }, { status: 503, headers });
  }
}
