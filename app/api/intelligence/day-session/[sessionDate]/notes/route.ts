import {
  requireTraderIntelligenceOwnerPageAccess,
  traderIntelligencePrivateJson,
  withTraderIntelligenceOwnerRoute,
} from "@/src/lib/trader-intelligence-v3/auth";
import { SqliteDaySessionJournalRepository } from "@/src/lib/trader-intelligence-day-session-journal";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const modulePath =
  "app/api/intelligence/day-session/[sessionDate]/notes/route.ts";

async function PUTHandler(
  request: Request,
  context: { params: Promise<{ sessionDate: string }> },
): Promise<Response> {
  const owner = await requireTraderIntelligenceOwnerPageAccess(modulePath);
  let body: Record<string, unknown>;
  try {
    const value = await request.json();
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      throw new Error();
    }
    body = value as Record<string, unknown>;
  } catch {
    return traderIntelligencePrivateJson(
      {
        error: {
          code: "ti_v3_day_session_notes_invalid_json",
          message: "The daily notes could not be read.",
        },
      },
      { status: 400 },
    );
  }
  const { sessionDate } = await context.params;
  const repository = new SqliteDaySessionJournalRepository();
  try {
    const note = repository.saveNote(
      {
        userId: owner.identity.ownerId,
        workspaceId: "primary-workspace",
      },
      {
        anythingElse: body.anythingElse,
        expectedRevision: body.expectedRevision,
        sessionDate,
        technicalRecap: body.technicalRecap,
        tomorrowsFocus: body.tomorrowsFocus,
        whatNeedsWork: body.whatNeedsWork,
        whatWorked: body.whatWorked,
      },
    );
    return traderIntelligencePrivateJson({ data: note });
  } catch (error) {
    const conflict =
      error instanceof Error && error.message.includes("revision_conflict");
    return traderIntelligencePrivateJson(
      {
        error: {
          code: conflict
            ? "ti_v3_day_session_notes_revision_conflict"
            : "ti_v3_day_session_notes_invalid",
          message: conflict
            ? "These notes changed in another request. Refresh and try again."
            : "The daily notes were not accepted.",
        },
      },
      { status: conflict ? 409 : 400 },
    );
  } finally {
    repository.close();
  }
}

export const PUT = withTraderIntelligenceOwnerRoute(modulePath, PUTHandler);
