import {
  COACH_MONTHLY_AI_INPUT_CONTRACT_VERSION,
  type CoachMonthlyAiReviewInput,
} from "../contracts/monthly-ai-review-input-contracts";
import { generateCoachMonthlyAiReview } from "./coach-monthly-ai-review-openai-adapter";

const input: CoachMonthlyAiReviewInput = Object.freeze({
  contractVersion: COACH_MONTHLY_AI_INPUT_CONTRACT_VERSION,
  month: Object.freeze({
    startDate: "2026-08-01",
    endDate: "2026-08-31",
    periodCoverage: "complete_month",
    timezone: "America/New_York",
    currency: "USD",
  }),
  coverage: Object.freeze({
    periodReadyClosedCount: 0,
    accountLegitimateOpenCount: 0,
    accountNeedsDecisionCount: 0,
    accountPendingDataDecisionCount: 0,
  }),
  summary: Object.freeze({
    tradingDayCount: 0,
    readyClosedTradeCount: 0,
    netPnlDecimal: null,
    winRatePercentDecimal: null,
  }),
  priorMonthlyReview: null,
  issuedWeeklyReviews: Object.freeze([]),
  currentFocuses: Object.freeze([]),
  days: Object.freeze([]),
});

describe("Coach monthly OpenAI adapter", () => {
  it("returns an honest unavailable result before sending any package without a credential", async () => {
    await expect(generateCoachMonthlyAiReview(input, {
      modelId: "gpt-test",
      environment: {},
    })).rejects.toThrowError("TRADERLINK_COACH_OPENAI_UNAVAILABLE");
  });
});
