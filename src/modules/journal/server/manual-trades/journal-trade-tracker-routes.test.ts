import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { vi } from "vitest";

import { DASHBOARD_NAVIGATION_HREFS } from "@/app/dashboard-navigation";
import { JOURNAL_MUTATION_REQUEST_HEADER } from "@/src/modules/platform/contracts/journal-request-security";
import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";

const scope: WorkspaceAccessScope = Object.freeze({
  userId: "00000000-0000-4000-8000-000000000001",
  workspaceId: "00000000-0000-4000-8000-000000000002",
  workspaceRole: "owner",
  allowedAccountIds: Object.freeze(["00000000-0000-4000-8000-000000000003"]),
  activeAccountId: "00000000-0000-4000-8000-000000000003",
});

const selectionRef = "b".repeat(64);
const positionRef = "c".repeat(64);
const groupRef = "a".repeat(64);
const accountScope = Object.freeze({
  userId: scope.userId,
  workspaceId: scope.workspaceId,
  accountId: scope.activeAccountId!,
});

const preview = Object.freeze({
  previewRef: "p".repeat(80),
  expiresAtUtc: "2026-08-03T16:00:00.000Z",
  tracker: "day" as const,
  affectedDates: Object.freeze(["2026-08-03"]),
  executionCount: 1,
  groups: Object.freeze([]),
});

const mocks = vi.hoisted(() => ({
  commit: vi.fn(),
  preview: vi.fn(),
  requireExpectedJournalAccountSelection: vi.fn(),
  requireTraderLinkPlatformRequestScope: vi.fn(),
  saveSwingNote: vi.fn(),
  tradeStyleAccountScope: vi.fn(),
  changeTradeStyle: vi.fn(),
  withReadonlyJournalIntegrityRuntime: vi.fn(),
  withWritableJournalIntegrityRuntime: vi.fn(),
}));

vi.mock(
  "@/src/modules/platform/server/authentication/require-platform-request-scope",
  () => ({
    requireExpectedJournalAccountSelection:
      mocks.requireExpectedJournalAccountSelection,
    requireTraderLinkPlatformRequestScope:
      mocks.requireTraderLinkPlatformRequestScope,
  }),
);

vi.mock(
  "@/src/modules/journal/server/journal-integrity-runtime",
  () => ({
    withReadonlyJournalIntegrityRuntime:
      mocks.withReadonlyJournalIntegrityRuntime,
    withWritableJournalIntegrityRuntime:
      mocks.withWritableJournalIntegrityRuntime,
  }),
);

import { POST as commitManualTrade } from "@/app/api/platform/journal/manual-trades/commit/route";
import { POST as previewManualTrade } from "@/app/api/platform/journal/manual-trades/preview/route";
import { POST as saveSwingNote } from "@/app/api/platform/journal/swings/[positionRef]/notes/route";
import { POST as changeTradeStyle } from "@/app/api/platform/journal/trade-style/[positionRef]/route";

function request(body: Record<string, unknown>, secure = true): Request {
  const headers = new Headers({
    "content-type": "application/json",
    host: "127.0.0.1:3010",
    origin: "http://127.0.0.1:3010",
    "sec-fetch-site": "same-origin",
  });
  if (secure) headers.set(JOURNAL_MUTATION_REQUEST_HEADER, "1");
  return new Request("http://127.0.0.1:3010/api/platform/journal/test", {
    body: JSON.stringify(body),
    headers,
    method: "POST",
  });
}

const entry = Object.freeze({
  clientRowRef: "route-row-1",
  date: "2026-08-03",
  time: "09:31:00",
  sourceTimezone: "America/New_York",
  symbol: "TEST",
  currency: "USD",
  side: "buy",
  quantity: "100.0000",
  price: "12.3400",
  fees: "1.2500",
});

describe("Day and Swing Trade Tracker mutation routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireTraderLinkPlatformRequestScope.mockReturnValue(scope);
    mocks.requireExpectedJournalAccountSelection.mockReturnValue(selectionRef);
    mocks.tradeStyleAccountScope.mockReturnValue(accountScope);
    mocks.preview.mockReturnValue(preview);
    mocks.commit.mockReturnValue({
      status: "accepted",
      executionIds: Object.freeze(["execution-id"]),
      createdExecutionCount: 1,
      matchedExecutionCount: 0,
      relatedDecisionIds: Object.freeze([]),
      rebuilds: Object.freeze([{}]),
      styledTradeCount: 1,
      affectedDates: Object.freeze(["2026-08-03"]),
      affectedPositionRefs: Object.freeze([positionRef]),
    });
    mocks.saveSwingNote.mockReturnValue({
      positionRef,
      reviewDate: "2026-08-03",
      note: "Held the planned risk level.",
      nextSessionPlan: null,
      revision: 1,
      createdAtUtc: "2026-08-03T15:00:00.000Z",
      updatedAtUtc: "2026-08-03T15:00:00.000Z",
      addedRetrospectively: false,
    });
    mocks.changeTradeStyle.mockReturnValue({
      positionRef,
      revision: 1,
      tradeStyle: "swing",
      openStatus: "swing",
      plannedFromEntry: true,
      claimedEffectiveAtUtc: "2026-08-03T13:31:00.000Z",
      declaredAtUtc: "2026-08-03T15:00:00.000Z",
      lifecycleState: "active",
      updatedAtUtc: "2026-08-03T15:00:00.000Z",
    });
    mocks.withReadonlyJournalIntegrityRuntime.mockImplementation(
      (_scope: WorkspaceAccessScope, operation: (journal: unknown) => unknown) =>
        operation({ manualTradePreviews: { preview: mocks.preview } }),
    );
    mocks.withWritableJournalIntegrityRuntime.mockImplementation(
      (_scope: WorkspaceAccessScope, operation: (journal: unknown) => unknown) =>
        operation({
          manualTrades: { commit: mocks.commit },
          swingNotes: { save: mocks.saveSwingNote },
          tradeStyles: {
            accountScope: mocks.tradeStyleAccountScope,
            change: mocks.changeTradeStyle,
          },
        }),
    );
  });

  it("previews normalized broker-style execution values through the selected account", async () => {
    const response = await previewManualTrade(request({
      expectedAccountSelectionRef: selectionRef,
      tracker: "day",
      entries: [entry],
    }));
    const packet = await response.json() as Record<string, unknown>;

    expect(response.status).toBe(200);
    expect(packet).toEqual({ status: "ready", preview });
    expect(mocks.requireExpectedJournalAccountSelection)
      .toHaveBeenCalledWith(scope, selectionRef);
    expect(mocks.preview).toHaveBeenCalledWith(scope, {
      accountSelectionRef: selectionRef,
      tracker: "day",
      entries: [{
        clientRowRef: "route-row-1",
        localDate: "2026-08-03",
        localTime: "09:31:00",
        sourceTimezone: "America/New_York",
        normalizedSymbol: "TEST",
        tradeCurrency: "USD",
        side: "buy",
        quantityDecimal: "100",
        priceDecimal: "12.34",
        feesDecimal: "1.25",
      }],
    });
  });

  it("commits a confirmed manual trade and returns only safe affected references", async () => {
    const response = await commitManualTrade(request({
      tracker: "day",
      entries: [entry],
      previewRef: preview.previewRef,
      expectedAccountSelectionRef: selectionRef,
      idempotencyKey: "manual-route-commit-0001",
      confirmations: [{
        groupRef,
        relationship: "start_new_trade",
        style: "day_trade",
        existingPositionRef: null,
        completeExecutionSetConfirmed: true,
      }],
    }));
    const packet = await response.json() as Record<string, unknown>;

    expect(response.status).toBe(200);
    expect(packet).toEqual({
      status: "ready",
      result: {
        importStatus: "accepted",
        acceptedExecutionCount: 1,
        createdExecutionCount: 1,
        matchedExecutionCount: 0,
        pendingDecisionCount: 0,
        rebuildCount: 1,
        styledTradeCount: 1,
        affectedDates: ["2026-08-03"],
        affectedPositionRefs: [positionRef],
      },
    });
    expect(JSON.stringify(packet)).not.toContain("execution-id");
    expect(mocks.commit).toHaveBeenCalledWith(
      scope,
      selectionRef,
      expect.objectContaining({ tracker: "day" }),
    );
  });

  it("saves a dated swing note against the selected account and route position", async () => {
    const response = await saveSwingNote(
      request({
        expectedAccountSelectionRef: selectionRef,
        reviewDate: "2026-08-03",
        note: "Held the planned risk level.",
        nextSessionPlan: null,
        expectedRevision: null,
        idempotencyKey: "swing-note-route-0001",
      }),
      { params: Promise.resolve({ positionRef }) },
    );

    expect(response.status).toBe(200);
    expect(mocks.tradeStyleAccountScope).toHaveBeenCalledWith(scope);
    expect(mocks.saveSwingNote).toHaveBeenCalledWith(accountScope, {
      positionRef,
      reviewDate: "2026-08-03",
      note: "Held the planned risk level.",
      nextSessionPlan: null,
      expectedRevision: null,
      idempotencyKey: "swing-note-route-0001",
    });
  });

  it("changes the position-level style through the shared account authority", async () => {
    const response = await changeTradeStyle(
      request({
        expectedAccountSelectionRef: selectionRef,
        expectedRevision: null,
        tradeStyle: "swing",
        openStatus: "swing",
        plannedFromEntry: true,
        claimedEffectiveAtUtc: "2026-08-03T13:31:00.000Z",
        reason: "planned_from_entry",
        sourceUi: "swing_trade_tracker",
        idempotencyKey: "trade-style-route-0001",
      }),
      { params: Promise.resolve({ positionRef }) },
    );

    expect(response.status).toBe(200);
    expect(mocks.changeTradeStyle).toHaveBeenCalledWith(accountScope, {
      positionRef,
      expectedRevision: null,
      tradeStyle: "swing",
      openStatus: "swing",
      plannedFromEntry: true,
      claimedEffectiveAtUtc: "2026-08-03T13:31:00.000Z",
      reason: "planned_from_entry",
      sourceUi: "swing_trade_tracker",
      idempotencyKey: "trade-style-route-0001",
    });
  });

  it("rejects a cross-site or unmarked mutation before any Journal operation", async () => {
    const response = await previewManualTrade(request({
      expectedAccountSelectionRef: selectionRef,
      tracker: "day",
      entries: [entry],
    }, false));
    const packet = await response.json() as Record<string, unknown>;

    expect(response.status).toBe(401);
    expect(packet).toEqual({
      status: "unavailable",
      code: "TRADERLINK_WORKSPACE_ACCESS_DENIED",
    });
    expect(mocks.preview).not.toHaveBeenCalled();
  });

  it("rejects invalid position classifications before changing Journal facts", async () => {
    const response = await changeTradeStyle(
      request({
        expectedAccountSelectionRef: selectionRef,
        expectedRevision: null,
        tradeStyle: "automatic_swing",
        openStatus: "swing",
        plannedFromEntry: true,
        claimedEffectiveAtUtc: "2026-08-03T13:31:00.000Z",
        reason: "planned_from_entry",
        sourceUi: "swing_trade_tracker",
        idempotencyKey: "trade-style-route-0002",
      }),
      { params: Promise.resolve({ positionRef }) },
    );
    const packet = await response.json() as Record<string, unknown>;

    expect(response.status).toBe(400);
    expect(packet).toEqual({
      status: "unavailable",
      code: "TRADERLINK_TRADE_STYLE_INVALID",
    });
    expect(mocks.changeTradeStyle).not.toHaveBeenCalled();
  });

  it("keeps the static Swing route, dated Day route, navigation, and private headers aligned", () => {
    const root = process.cwd();
    const dayRoute = join(
      root,
      "app",
      "(dashboard)",
      "trade-tracker",
      "[sessionDate]",
      "page.tsx",
    );
    const swingRoute = join(
      root,
      "app",
      "(dashboard)",
      "trade-tracker",
      "swings",
      "page.tsx",
    );

    expect(existsSync(dayRoute)).toBe(true);
    expect(existsSync(swingRoute)).toBe(true);
    expect(readFileSync(dayRoute, "utf8")).toContain(
      "if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(sessionDate)) notFound();",
    );
    expect(DASHBOARD_NAVIGATION_HREFS).toContain("/trade-tracker");
    expect(DASHBOARD_NAVIGATION_HREFS).toContain("/trade-tracker/swings");
    expect(DASHBOARD_NAVIGATION_HREFS).toContain("/trades/open");

    const nextConfig = readFileSync(join(root, "next.config.ts"), "utf8");
    for (const privateRoute of [
      '"/trade-tracker/:path*"',
      '"/trades/:path*"',
      '"/data-decisions/:path*"',
      '"/admin/journal/:path*"',
      '"/api/platform/journal/:path*"',
    ]) {
      expect(nextConfig).toContain(privateRoute);
    }
  });
});
