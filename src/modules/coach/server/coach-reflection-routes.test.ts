import { vi } from "vitest";

import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import type { CoachReflectionReadModel } from "../contracts/reflection-loop-contracts";
import { COACH_REFLECTION_CONTRACT_VERSION } from "../contracts/reflection-loop-contracts";

const scope: WorkspaceAccessScope = Object.freeze({
  userId: "00000000-0000-4000-8000-000000000001",
  workspaceId: "00000000-0000-4000-8000-000000000002",
  workspaceRole: "owner",
  allowedAccountIds: Object.freeze(["00000000-0000-4000-8000-000000000003"]),
  activeAccountId: "00000000-0000-4000-8000-000000000003",
});

const model: CoachReflectionReadModel = Object.freeze({
  contractVersion: COACH_REFLECTION_CONTRACT_VERSION,
  source: "journal_facts",
  state: "ready",
  period: "weekly",
  anchorDate: "2026-02-01",
  startDate: "2026-01-26",
  endDate: "2026-02-01",
  timezone: "America/New_York",
  currency: "USD",
  availableCurrencies: Object.freeze(["USD"]),
  summary: Object.freeze({
    tradingDayCount: 2,
    readyClosedTradeCount: 2,
    netPnlDecimal: "5",
    winRatePercentDecimal: "50",
    dailyNotesSavedCount: 0,
    roundTripNotesSavedCount: 0,
    taggedTradeCount: 0,
    ruleReviews: Object.freeze({ followed: 0, broken: 0, notReviewed: 0 }),
    activeRuleCount: 0,
    focusRuleCount: 0,
    accountPendingDataDecisionCount: 2,
  }),
  coverage: Object.freeze({
    readyClosedCount: 2,
    legitimateOpenCount: 0,
    needsDecisionCount: 2,
    feeCompleteCount: 2,
    feeIncompleteCount: 0,
    limitationReasonCodes: Object.freeze([]),
    factSetRevisionSha256: "a".repeat(64),
  }),
  focusRules: Object.freeze([]),
  prompts: Object.freeze([]),
  days: Object.freeze([]),
});

const mocks = vi.hoisted(() => ({
  readCoachReflection: vi.fn(),
  requireTraderLinkPlatformRequestScope: vi.fn(),
}));

vi.mock(
  "@/src/modules/coach/server/coach-reflection-runtime",
  () => ({ readCoachReflection: mocks.readCoachReflection }),
);
vi.mock(
  "@/src/modules/platform/server/authentication/require-platform-request-scope",
  () => ({
    requireTraderLinkPlatformRequestScope:
      mocks.requireTraderLinkPlatformRequestScope,
  }),
);

import { GET as getCoach } from "@/app/api/coach/latest/route";
import { GET as getReview } from "@/app/api/review/latest/route";

describe("Coach and review replacement routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.readCoachReflection.mockReturnValue(model);
    mocks.requireTraderLinkPlatformRequestScope.mockReturnValue(scope);
  });

  it.each([
    ["coach", getCoach],
    ["review", getReview],
  ])("returns Journal facts without a sample fallback from %s", async (key, handler) => {
    const response = handler(new Request(
      "http://127.0.0.1:3010/api/test?period=weekly&date=2026-02-01&currency=usd",
    ));
    const packet = await response.json() as Record<string, unknown>;

    expect(response.status).toBe(200);
    expect(packet.source).toBe("journal_facts");
    expect(packet[key]).toEqual(model);
    expect(JSON.stringify(packet)).not.toContain("sample");
    expect(mocks.requireTraderLinkPlatformRequestScope).toHaveBeenCalledOnce();
    expect(mocks.readCoachReflection).toHaveBeenCalledWith(scope, {
      period: "weekly",
      anchorDate: "2026-02-01",
      currency: "USD",
    });
  });
});
