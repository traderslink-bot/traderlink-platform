export interface CoachingLanguageQualityInput {
  sourceId: string;
  text: string;
  requiresEvidenceBasis?: boolean;
  basis?:
    | "execution_only"
    | "saved_execution"
    | "saved_import"
    | "repaired_import"
    | "duplicate_review"
    | "open_trade"
    | "market_context_available"
    | "market_context_unavailable"
    | "analysis_failed"
    | "sample";
}

export interface CoachingLanguageQualityViolation {
  id: string;
  sourceId: string;
  kind: "forbidden_phrase" | "missing_evidence_basis" | "context_overclaim";
  detail: string;
  text: string;
}

export interface CoachingLanguageQualityAudit {
  passed: boolean;
  checkedTextCount: number;
  violations: CoachingLanguageQualityViolation[];
}

const FORBIDDEN_COACHING_LANGUAGE = [
  "guaranteed",
  "would have made",
  "proves",
  "prediction",
  "certain",
  "can't lose",
  "risk-free",
  "definitely",
  "you should have bought",
  "you should have sold",
  "bad trade",
  "buy signal",
  "sell signal",
  "trade call",
  "financial advice",
  "short-seller coaching",
  "short seller coaching",
  "short squeeze alert",
  "short squeeze alerts",
  "borrow/locate",
  "borrow or locate",
  "short-specific trade signal",
  "short-specific trade signals",
] as const;

const EVIDENCE_BASIS_PATTERNS = [
  /execution-only/i,
  /saved execution/i,
  /saved import/i,
  /saved trade/i,
  /replay/i,
  /review prompt/i,
  /linked trade/i,
  /linked .*trades/i,
  /sample/i,
  /market context/i,
  /levels-system/i,
  /decision-review/i,
  /diagnostic/i,
  /completed-trade coaching/i,
  /position is flat/i,
  /repaired CSV/i,
  /duplicate-like/i,
  /limited short execution import support/i,
  /short execution import/i,
  /partial exits/i,
  /profitable reduction/i,
  /adverse price/i,
  /prior average entry/i,
  /returned to flat/i,
  /final exit/i,
] as const;

const MARKET_CONTEXT_OVERCLAIM_PATTERNS = [
  /support held/i,
  /resistance held/i,
  /level held/i,
  /breakout confirmed/i,
  /setup failed/i,
  /candle-confirmed/i,
  /dip area worked/i,
] as const;

function basisAllowsMarketContextClaim(
  basis: CoachingLanguageQualityInput["basis"],
): boolean {
  return basis === "market_context_available";
}

export function buildCoachingLanguageQualityAudit(args: {
  texts: CoachingLanguageQualityInput[];
}): CoachingLanguageQualityAudit {
  const violations: CoachingLanguageQualityViolation[] = [];

  for (const entry of args.texts) {
    const lower = entry.text.toLowerCase();

    for (const phrase of FORBIDDEN_COACHING_LANGUAGE) {
      if (lower.includes(phrase)) {
        violations.push({
          id: `coaching-language:${entry.sourceId}:${phrase}`,
          sourceId: entry.sourceId,
          kind: "forbidden_phrase",
          detail: `Forbidden coaching phrase: ${phrase}`,
          text: entry.text,
        });
      }
    }

    if (
      entry.requiresEvidenceBasis &&
      !EVIDENCE_BASIS_PATTERNS.some((pattern) => pattern.test(entry.text))
    ) {
      violations.push({
        id: `coaching-language:${entry.sourceId}:missing-evidence-basis`,
        sourceId: entry.sourceId,
        kind: "missing_evidence_basis",
        detail:
          "Coaching copy should name execution-only evidence, saved executions, replay, linked trades, sample limits, or review-prompt status.",
        text: entry.text,
      });
    }

    if (!basisAllowsMarketContextClaim(entry.basis)) {
      const overclaim = MARKET_CONTEXT_OVERCLAIM_PATTERNS.find((pattern) =>
        pattern.test(entry.text),
      );

      if (overclaim) {
        violations.push({
          id: `coaching-language:${entry.sourceId}:context-overclaim`,
          sourceId: entry.sourceId,
          kind: "context_overclaim",
          detail:
            "Market-context wording requires an explicit levels-system market context basis.",
          text: entry.text,
        });
      }
    }
  }

  return {
    passed: violations.length === 0,
    checkedTextCount: args.texts.length,
    violations,
  };
}
