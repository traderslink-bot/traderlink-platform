import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { GET as getAdminTradeLink } from "../../../../app/api/admin/level-analysis/trade-links/[linkId]/route";
import { POST as persistTradeLink } from "../../../../app/api/level-analysis/trade-links/route";
import { POST as resolveTradeLink } from "../../../../app/api/level-analysis/trade-links/resolve/route";
import { GET as getTradeLevelAnalysis } from "../../../../app/api/trades/[tradeId]/level-analysis/route";
import { resetTraderIntelligenceDatabaseForTests } from "../../trader-analytics/product/import-commit/sqlite-import-commit-repository";
import deliveryFixture from "../__fixtures__/level-analysis-journal-delivery-package-v1.compact.json";
import oldSnapshotFixture from "../__fixtures__/journal-connector-level-analysis-snapshot-v1.json";
import { ingestJournalLevelAnalysisDeliveryForApi } from "../level-analysis-journal-delivery-api-service";
import {
  LEVEL_ANALYSIS_DELIVERY_API_FEATURE_FLAG,
} from "../level-analysis-journal-delivery-persistence-storage";
import {
  LEVEL_ANALYSIS_TRADE_LINK_ADMIN_DEBUG_FEATURE_FLAG,
  LEVEL_ANALYSIS_TRADE_LINK_API_FEATURE_FLAG,
} from "../level-analysis-journal-delivery-trade-link-storage";

let tempDir = "";
let originalDbPath: string | undefined;
let originalDeliveryApiFlag: string | undefined;
let originalTradeLinkApiFlag: string | undefined;
let originalTradeLinkAdminFlag: string | undefined;

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function jsonRequest(path: string, body: unknown): Request {
  return new Request(`http://localhost${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function collectStringValues(value: unknown, out: string[] = []): string[] {
  if (typeof value === "string") {
    out.push(value);
    return out;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectStringValues(item, out);
    }
    return out;
  }

  if (typeof value === "object" && value !== null) {
    for (const item of Object.values(value)) {
      collectStringValues(item, out);
    }
  }

  return out;
}

function expectNoAdviceLanguage(value: unknown): void {
  const text = collectStringValues(value).join("\n").toLowerCase();

  for (const [label, pattern] of [
    ["grading", /\bgrading\b|\btrade grade\b/],
    ["coaching", /\bcoaching\b|\bcoach\b/],
    ["p/l", /\bp\/l\b|\bpnl\b/],
    ["giveback", /\bgiveback\b/],
    ["behavior scoring", /\bbehavior score\b|\bbehavior scoring\b/],
    ["recommendation", /\brecommendation\b/],
    ["buy/sell/hold", /\bbuy\b|\bsell\b|\bhold\b/],
    ["trade advice", /\btrade advice\b/],
  ] as const) {
    expect(pattern.test(text), `Unexpected ${label} language`).toBe(false);
  }
}

function expectNoRawPayload(value: unknown): void {
  if (Array.isArray(value)) {
    for (const item of value) {
      expectNoRawPayload(item);
    }
    return;
  }

  if (typeof value !== "object" || value === null) {
    return;
  }

  expect(Object.hasOwn(value, "rawPayload")).toBe(false);
  for (const item of Object.values(value)) {
    expectNoRawPayload(item);
  }
}

beforeEach(() => {
  originalDbPath = process.env.TRADER_INTELLIGENCE_DB_PATH;
  originalDeliveryApiFlag = process.env[LEVEL_ANALYSIS_DELIVERY_API_FEATURE_FLAG];
  originalTradeLinkApiFlag = process.env[LEVEL_ANALYSIS_TRADE_LINK_API_FEATURE_FLAG];
  originalTradeLinkAdminFlag =
    process.env[LEVEL_ANALYSIS_TRADE_LINK_ADMIN_DEBUG_FEATURE_FLAG];
  tempDir = mkdtempSync(join(tmpdir(), "level-analysis-trade-link-api-"));
  process.env.TRADER_INTELLIGENCE_DB_PATH = join(tempDir, "test.sqlite");
  process.env[LEVEL_ANALYSIS_DELIVERY_API_FEATURE_FLAG] = "1";
  process.env[LEVEL_ANALYSIS_TRADE_LINK_API_FEATURE_FLAG] = "1";
  process.env[LEVEL_ANALYSIS_TRADE_LINK_ADMIN_DEBUG_FEATURE_FLAG] = "1";
  resetTraderIntelligenceDatabaseForTests();
});

afterEach(() => {
  resetTraderIntelligenceDatabaseForTests();
  if (originalDbPath === undefined) {
    delete process.env.TRADER_INTELLIGENCE_DB_PATH;
  } else {
    process.env.TRADER_INTELLIGENCE_DB_PATH = originalDbPath;
  }
  if (originalDeliveryApiFlag === undefined) {
    delete process.env[LEVEL_ANALYSIS_DELIVERY_API_FEATURE_FLAG];
  } else {
    process.env[LEVEL_ANALYSIS_DELIVERY_API_FEATURE_FLAG] = originalDeliveryApiFlag;
  }
  if (originalTradeLinkApiFlag === undefined) {
    delete process.env[LEVEL_ANALYSIS_TRADE_LINK_API_FEATURE_FLAG];
  } else {
    process.env[LEVEL_ANALYSIS_TRADE_LINK_API_FEATURE_FLAG] = originalTradeLinkApiFlag;
  }
  if (originalTradeLinkAdminFlag === undefined) {
    delete process.env[LEVEL_ANALYSIS_TRADE_LINK_ADMIN_DEBUG_FEATURE_FLAG];
  } else {
    process.env[LEVEL_ANALYSIS_TRADE_LINK_ADMIN_DEBUG_FEATURE_FLAG] =
      originalTradeLinkAdminFlag;
  }
  rmSync(tempDir, { recursive: true, force: true });
});

describe("level-analysis journal trade-link API routes", () => {
  it("resolves, persists, deduplicates, and retrieves a trade link", async () => {
    const delivery = ingestJournalLevelAnalysisDeliveryForApi({
      payload: clone(deliveryFixture),
      createdAt: "2026-06-06T19:40:00.000Z",
    });
    expect(delivery.status).toBe("accepted");

    const requestBody = {
      savedTradeId: "trade_DEVS_2026_06_01_001",
      workspaceId: "local-demo-workspace",
      accountId: "local-demo-account",
      userId: "local-demo-user",
      importBatchId: "import_batch_2026_06_01_001",
      symbol: "DEVS",
      provider: "ibkr",
      tradeEndedAt: "2026-06-01T16:05:00.000Z",
      createdAt: "2026-06-06T19:45:00.000Z",
    };

    const resolveResponse = await resolveTradeLink(
      jsonRequest("/api/level-analysis/trade-links/resolve", requestBody),
    );
    const resolveBody = await resolveResponse.json();

    expect(resolveResponse.status).toBe(200);
    expect(resolveBody).toMatchObject({
      contractVersion: "journal_level_analysis_trade_link_resolution_api_v1",
      status: "matched",
      savedTradeId: requestBody.savedTradeId,
      symbol: "DEVS",
      provider: "ibkr",
      candidate: {
        deliveryId: delivery.deliveryId,
        fifteenMinuteContextOnlyStatus: "context_only",
      },
    });

    const persistResponse = await persistTradeLink(
      jsonRequest("/api/level-analysis/trade-links", requestBody),
    );
    const persistBody = await persistResponse.json();

    expect(persistResponse.status).toBe(200);
    expect(persistBody).toMatchObject({
      contractVersion: "journal_level_analysis_trade_link_api_v1",
      status: "linked",
      savedTradeId: requestBody.savedTradeId,
      deliveryId: delivery.deliveryId,
      symbol: "DEVS",
      provider: "ibkr",
      duplicate: false,
    });

    const duplicateBody = await (
      await persistTradeLink(jsonRequest("/api/level-analysis/trade-links", requestBody))
    ).json();
    expect(duplicateBody).toMatchObject({
      status: "linked",
      duplicate: true,
      linkId: persistBody.linkId,
    });

    const tradeBody = await (
      await getTradeLevelAnalysis(
        new Request(
          `http://localhost/api/trades/${requestBody.savedTradeId}/level-analysis`,
        ),
        { params: Promise.resolve({ tradeId: requestBody.savedTradeId }) },
      )
    ).json();
    expect(tradeBody).toMatchObject({
      contractVersion: "journal_trade_level_analysis_api_v1",
      status: "found",
      savedTradeId: requestBody.savedTradeId,
      link: {
        linkStatus: "linked",
        linkedSymbolSummary: {
          densityMetricSummary: {
            classification: "dense_clustered",
          },
          candidateInventoryGapSummary: {
            overall: "no_gap",
          },
          volumeSessionContextSummary: {
            outcome: "surfaced_has_more_session_volume_context",
          },
        },
      },
    });

    const adminBody = await (
      await getAdminTradeLink(
        new Request(
          `http://localhost/api/admin/level-analysis/trade-links/${persistBody.linkId}`,
        ),
        { params: Promise.resolve({ linkId: persistBody.linkId }) },
      )
    ).json();
    expect(adminBody).toMatchObject({
      contractVersion: "journal_level_analysis_trade_link_api_v1",
      status: "found",
      linkId: persistBody.linkId,
      savedTradeId: requestBody.savedTradeId,
      rawPayloadHash: delivery.rawPayloadHash,
    });

    expectNoRawPayload({ resolveBody, persistBody, duplicateBody, tradeBody, adminBody });
    expectNoAdviceLanguage({ resolveBody, persistBody, duplicateBody, tradeBody });
  });

  it("blocks candidates after the selected as-of boundary", async () => {
    ingestJournalLevelAnalysisDeliveryForApi({
      payload: clone(deliveryFixture),
      createdAt: "2026-06-06T19:50:00.000Z",
    });

    const response = await resolveTradeLink(
      jsonRequest("/api/level-analysis/trade-links/resolve", {
        savedTradeId: "trade_DEVS_2026_06_01_early",
        symbol: "DEVS",
        provider: "ibkr",
        tradeEndedAt: "2026-06-01T15:00:00.000Z",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body).toMatchObject({
      status: "blocked",
      matchResult: {
        reason: "as_of_after_allowed_boundary",
      },
    });
    expect(body.candidate).toBeUndefined();
  });

  it("persists old LevelAnalysisSnapshot v1 trade links through manual selection", async () => {
    const delivery = ingestJournalLevelAnalysisDeliveryForApi({
      payload: clone(oldSnapshotFixture),
      createdAt: "2026-06-06T19:55:00.000Z",
    });
    expect(delivery.status).toBe("accepted");

    const response = await persistTradeLink(
      jsonRequest("/api/level-analysis/trade-links", {
        savedTradeId: "trade_SNAP_2026_05_01_001",
        symbol: "SNAP",
        provider: "fixture",
        deliveryId: delivery.deliveryId,
        linkSource: "manual_review",
        matchPolicy: {
          providerMatch: "explicit_provider",
          asOfPolicy: "manual_delivery_selection",
        },
        createdAt: "2026-06-06T20:00:00.000Z",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      status: "linked",
      deliveryId: delivery.deliveryId,
      symbol: "SNAP",
      provider: "fixture",
    });
  });

  it("keeps trade-link routes behind the feature flag", async () => {
    delete process.env[LEVEL_ANALYSIS_TRADE_LINK_API_FEATURE_FLAG];

    const response = await resolveTradeLink(
      jsonRequest("/api/level-analysis/trade-links/resolve", {
        savedTradeId: "trade_DEVS_2026_06_01_001",
        symbol: "DEVS",
        provider: "ibkr",
        tradeEndedAt: "2026-06-01T16:05:00.000Z",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toMatchObject({
      ok: false,
      code: "feature_disabled",
    });
  });
});
