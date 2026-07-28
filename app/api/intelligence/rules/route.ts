import {
  requireTraderIntelligenceOwnerPageAccess,
  traderIntelligencePrivateJson,
  withTraderIntelligenceOwnerRoute,
} from "@/src/lib/trader-intelligence-v3/auth";
import {
  mutateTradingRulesDashboard,
  type TradingRulesMutation,
} from "@/src/lib/trader-intelligence-rules";

function parseMutation(input: unknown): TradingRulesMutation | null {
  if (typeof input !== "object" || input === null || !("action" in input)) {
    return null;
  }
  const candidate = input as Record<string, unknown>;
  if (
    candidate.action === "create" &&
    typeof candidate.templateId === "string" &&
    "configuration" in candidate
  ) {
    return {
      action: "create",
      templateId: candidate.templateId,
      configuration: candidate.configuration,
    };
  }
  if (
    candidate.action === "revise" &&
    typeof candidate.ruleInstanceId === "string" &&
    "configuration" in candidate
  ) {
    return {
      action: "revise",
      ruleInstanceId: candidate.ruleInstanceId,
      configuration: candidate.configuration,
    };
  }
  if (
    candidate.action === "transition" &&
    typeof candidate.ruleInstanceId === "string" &&
    (candidate.expectedCurrentStatus === "active" ||
      candidate.expectedCurrentStatus === "paused" ||
      candidate.expectedCurrentStatus === "retired") &&
    (candidate.newStatus === "active" ||
      candidate.newStatus === "paused" ||
      candidate.newStatus === "retired")
  ) {
    return {
      action: "transition",
      ruleInstanceId: candidate.ruleInstanceId,
      expectedCurrentStatus: candidate.expectedCurrentStatus,
      newStatus: candidate.newStatus,
    };
  }
  const validManualDefinition =
    typeof candidate.title === "string" &&
    typeof candidate.statement === "string" &&
    (candidate.category === "process" ||
      candidate.category === "setup" ||
      candidate.category === "mindset" ||
      candidate.category === "review") &&
    (candidate.reviewScope === "day_session" ||
      candidate.reviewScope === "trade" ||
      candidate.reviewScope === "both") &&
    typeof candidate.isFocus === "boolean";
  if (candidate.action === "create_manual" && validManualDefinition) {
    return {
      action: "create_manual",
      title: candidate.title as string,
      statement: candidate.statement as string,
      category: candidate.category as "process" | "setup" | "mindset" | "review",
      reviewScope: candidate.reviewScope as "day_session" | "trade" | "both",
      isFocus: candidate.isFocus as boolean,
    };
  }
  if (
    candidate.action === "revise_manual" &&
    typeof candidate.ruleId === "string" &&
    typeof candidate.expectedVersionOrdinal === "string" &&
    validManualDefinition
  ) {
    return {
      action: "revise_manual",
      ruleId: candidate.ruleId,
      expectedVersionOrdinal: candidate.expectedVersionOrdinal,
      title: candidate.title as string,
      statement: candidate.statement as string,
      category: candidate.category as "process" | "setup" | "mindset" | "review",
      reviewScope: candidate.reviewScope as "day_session" | "trade" | "both",
      isFocus: candidate.isFocus as boolean,
    };
  }
  if (
    candidate.action === "transition_manual" &&
    typeof candidate.ruleId === "string" &&
    (candidate.expectedCurrentStatus === "active" ||
      candidate.expectedCurrentStatus === "paused" ||
      candidate.expectedCurrentStatus === "retired") &&
    (candidate.newStatus === "active" ||
      candidate.newStatus === "paused" ||
      candidate.newStatus === "retired")
  ) {
    return {
      action: "transition_manual",
      ruleId: candidate.ruleId,
      expectedCurrentStatus: candidate.expectedCurrentStatus,
      newStatus: candidate.newStatus,
    };
  }
  return null;
}

export const POST = withTraderIntelligenceOwnerRoute(
  "app/api/intelligence/rules/route.ts",
  async (request) => {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return traderIntelligencePrivateJson(
        {
          ok: false,
          error: {
            code: "ti_v3_rules_invalid_json",
            message: "The rule change could not be read.",
          },
        },
        { status: 400 },
      );
    }
    const mutation = parseMutation(body);
    if (mutation === null) {
      return traderIntelligencePrivateJson(
        {
          ok: false,
          error: {
            code: "ti_v3_rules_invalid_mutation",
            message: "The rule change is incomplete or invalid.",
          },
        },
        { status: 400 },
      );
    }
    const owner =
      await requireTraderIntelligenceOwnerPageAccess(
        "app/api/intelligence/rules/route.ts",
      );
    try {
      return traderIntelligencePrivateJson({
        ok: true,
        data: mutateTradingRulesDashboard(owner, mutation),
      });
    } catch (error) {
      const detail =
        error instanceof Error ? error.message : "ti_v3_rules_mutation_failed";
      const conflict =
        detail.includes("reference_mismatch") ||
        detail.includes("duplicate_identity");
      return traderIntelligencePrivateJson(
        {
          ok: false,
          error: {
            code: conflict
              ? "ti_v3_rules_change_conflict"
              : "ti_v3_rules_mutation_rejected",
            message: conflict
              ? "This rule changed in another request. Refresh and try again."
              : "The rule change was not accepted.",
          },
        },
        { status: conflict ? 409 : 400 },
      );
    }
  },
);
