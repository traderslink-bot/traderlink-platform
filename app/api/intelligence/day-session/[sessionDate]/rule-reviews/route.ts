import { getGovernedTradeTagTarget } from "@/app/(dashboard)/trade-tracker/trade-tracker-data";
import {
  requireTraderIntelligenceOwnerPageAccess,
  traderIntelligencePrivateJson,
  withTraderIntelligenceOwnerRoute,
} from "@/src/lib/trader-intelligence-v3/auth";
import { SqliteDaySessionJournalRepository } from "@/src/lib/trader-intelligence-day-session-journal";
import { readTradingRulesDashboard } from "@/src/lib/trader-intelligence-rules";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const modulePath =
  "app/api/intelligence/day-session/[sessionDate]/rule-reviews/route.ts";

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
          code: "ti_v3_day_session_rule_review_invalid_json",
          message: "The rule review could not be read.",
        },
      },
      { status: 400 },
    );
  }
  const { sessionDate } = await context.params;
  const rules = readTradingRulesDashboard(owner);
  const ruleId = typeof body.ruleId === "string" ? body.ruleId : "";
  const ruleVersion =
    typeof body.ruleVersion === "string" ? body.ruleVersion : "";
  const applicability = body.applicability;
  const targetRoundTripKey =
    typeof body.targetRoundTripKey === "string"
      ? body.targetRoundTripKey
      : null;
  const preset = rules.packet.rules.find(
    (candidate) => candidate.ruleInstanceId === ruleId,
  );
  const manual = rules.manualRules.find(
    (candidate) => candidate.ruleId === ruleId,
  );
  const validRule =
    (preset?.status === "active" &&
      preset.currentVersion.versionOrdinal === ruleVersion &&
      applicability === "day") ||
    (manual?.status === "active" &&
      manual.versionOrdinal === ruleVersion &&
      ((applicability === "day" &&
        (manual.reviewScope === "day_session" ||
          manual.reviewScope === "both")) ||
        (applicability === "trade" &&
          (manual.reviewScope === "trade" || manual.reviewScope === "both"))));
  const validTarget =
    applicability !== "trade" ||
    (targetRoundTripKey !== null &&
      (await getGovernedTradeTagTarget(
        sessionDate,
        targetRoundTripKey,
      )) !== null);
  if (!validRule || !validTarget) {
    return traderIntelligencePrivateJson(
      {
        error: {
          code: "ti_v3_day_session_rule_review_unavailable",
          message: "This rule review is unavailable.",
        },
      },
      { status: 404 },
    );
  }

  const repository = new SqliteDaySessionJournalRepository();
  try {
    const review = repository.saveRuleReview(
      {
        userId: owner.identity.ownerId,
        workspaceId: "primary-workspace",
      },
      sessionDate,
      {
        applicability,
        expectedRevision: body.expectedRevision,
        ruleId,
        ruleVersion,
        status: body.status,
        targetRoundTripKey,
      },
    );
    return traderIntelligencePrivateJson({ data: review });
  } catch (error) {
    const conflict =
      error instanceof Error && error.message.includes("revision_conflict");
    return traderIntelligencePrivateJson(
      {
        error: {
          code: conflict
            ? "ti_v3_day_session_rule_review_revision_conflict"
            : "ti_v3_day_session_rule_review_invalid",
          message: conflict
            ? "This review changed in another request. Refresh and try again."
            : "The rule review was not accepted.",
        },
      },
      { status: conflict ? 409 : 400 },
    );
  } finally {
    repository.close();
  }
}

export const PUT = withTraderIntelligenceOwnerRoute(modulePath, PUTHandler);
