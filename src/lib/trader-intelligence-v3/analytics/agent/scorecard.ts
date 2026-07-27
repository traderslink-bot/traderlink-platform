import { compareUnicodeCodePoints } from "../../domain/canonical";
import { finalizeContentAddressedAuthority } from "../contracts";
import type { CanonicalContentDigest } from "../../domain/identity";
import type { AnalyticsAgentAnswerPacket } from "./contracts";

export const ANALYTICS_AGENT_SCORECARD_VERSION = "ti_v3_analytics_agent_scorecard_v1" as const;

export interface AnalyticsAgentScorecard {
  readonly schemaVersion: typeof ANALYTICS_AGENT_SCORECARD_VERSION;
  readonly answerDigest: CanonicalContentDigest;
  readonly resultDigest: CanonicalContentDigest | null;
  readonly sampleSize: string;
  readonly readiness: "review_ready" | "limited" | "insufficient_sample" | "needs_clarification" | "unsupported" | "data_unavailable";
  readonly limitationCodes: readonly string[];
  readonly evidenceCandidateCount: string;
  readonly counterexampleCandidateCount: string;
  readonly nextDrillDown: AnalyticsAgentAnswerPacket["drillDowns"][number] | null;
  readonly scorecardDigest: CanonicalContentDigest;
}

export function buildAnalyticsAgentScorecard(answer: AnalyticsAgentAnswerPacket): AnalyticsAgentScorecard {
  const readiness = answer.status === "answered"
    ? "review_ready"
    : answer.status === "partially_answered"
      ? "limited"
      : answer.status;
  const content = {
    schemaVersion: ANALYTICS_AGENT_SCORECARD_VERSION,
    answerDigest: answer.answerDigest,
    resultDigest: answer.resultDigest,
    sampleSize: answer.sampleSize,
    readiness,
    limitationCodes: Object.freeze([...answer.limitationCodes].sort(compareUnicodeCodePoints)),
    evidenceCandidateCount: answer.evidenceTradeReferences.length.toString(),
    counterexampleCandidateCount: answer.evidenceSummary.counterexampleTradeReferences.length.toString(),
    nextDrillDown: answer.drillDowns[0] ?? null,
  } as const;
  const built = finalizeContentAddressedAuthority("analytics_agent_scorecard", content, "scorecardDigest");
  if (!built.ok) throw new Error(`${built.error.code}:${built.error.path}`);
  return built.value as AnalyticsAgentScorecard;
}
