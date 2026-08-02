import { createHash } from "node:crypto";
import { readFileSync, rmSync } from "node:fs";
import { resolve } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { GET as getAdminTradeLink } from "@/app/api/admin/level-analysis/trade-links/[linkId]/route";
import { POST as persistTradeLink } from "@/app/api/level-analysis/trade-links/route";
import { POST as resolveTradeLink } from "@/app/api/level-analysis/trade-links/resolve/route";
import { GET as getTradeLevelAnalysis } from "@/app/api/trades/[tradeId]/level-analysis/route";
import { GET as getTradeDetailLevelFacts } from "@/app/api/trades/[tradeId]/level-analysis/facts/route";
import { openPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { LevelAnalysisDeliveryRepository } from "@/src/modules/level-analysis/server/level-analysis-delivery-repository";
import { LevelAnalysisDeliveryService } from "@/src/modules/level-analysis/server/level-analysis-delivery-service";
import {
  createPlatformRouteTestFoundation,
  createPlatformRouteTestRequest,
  installPlatformRouteTestEnvironment,
  type PlatformRouteTestFoundation,
} from "@/src/test/traderlink-platform-route";

let foundation: PlatformRouteTestFoundation;
let restoreEnvironment: () => void;

function id(sequence: number): string {
  return `20000000-0000-4000-8000-${String(sequence).padStart(12, "0")}`;
}

function digest(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function fixture(name: string): unknown {
  return JSON.parse(readFileSync(resolve(
    process.cwd(),
    `src/lib/level-analysis/__fixtures__/${name}`,
  ), "utf8")) as unknown;
}

function post(path: string, body: unknown): Request {
  return createPlatformRouteTestRequest(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function seedDelivery(payload: unknown): Readonly<{
  status: string;
  deliveryId?: string;
}> {
  const database = openPlatformDatabase({
    mode: "runtime",
    databasePath: foundation.databasePath,
    forbiddenRepositoryRoots: [],
  });
  try {
    return new LevelAnalysisDeliveryService(
      new LevelAnalysisDeliveryRepository(database),
      ["ibkr", "fixture"],
      () => new Date("2026-08-02T12:00:00.000Z"),
    ).ingest(payload);
  } finally {
    database.close();
  }
}

function seedRoundTrip(
  sequence: number,
  symbol = "DEVS",
  closedAtUtc = "2026-08-02T14:00:00.000Z",
): string {
  const database = openPlatformDatabase({
    mode: "runtime",
    databasePath: foundation.databasePath,
    forbiddenRepositoryRoots: [],
  });
  const instrumentId = id(sequence);
  const rebuildId = id(sequence + 1);
  const roundTripId = id(sequence + 2);
  const versionId = id(sequence + 3);
  const openedAtUtc = new Date(
    Date.parse(closedAtUtc) - 30 * 60 * 1_000,
  ).toISOString();
  const now = "2026-08-02T12:00:00.000Z";
  try {
    database.transaction(() => {
      database.prepare(`INSERT INTO journal_instruments (
  instrument_id, workspace_id, asset_class, normalized_symbol, quote_currency,
  venue, identity_scheme_version, provider_identity_sha256, status,
  created_at_utc, updated_at_utc
) VALUES (?, ?, 'stock', ?, 'USD', NULL, NULL, NULL, 'active', ?, ?)`)
        .run(instrumentId, foundation.workspaceId, symbol, now, now);
      database.prepare(`INSERT INTO journal_chain_rebuilds (
  rebuild_id, workspace_id, account_id, instrument_id, trade_currency,
  chain_key_sha256, trigger_kind, trigger_import_event_id,
  trigger_decision_event_id, maintenance_reason_code, previous_rebuild_id,
  algorithm_version, ordered_input_sha256, output_sha256, coverage_state,
  ready_closed_count, legitimate_open_count, needs_decision_count,
  excluded_count, first_execution_at_utc, last_execution_at_utc,
  completed_at_utc
) VALUES (?, ?, ?, ?, 'USD', ?, 'maintenance', NULL, NULL,
  'level_analysis_route_test', NULL, 'round_trip_v1', ?, ?, 'complete',
  1, 0, 0, 0, ?, ?, ?)`)
        .run(
          rebuildId,
          foundation.workspaceId,
          foundation.accountId,
          instrumentId,
          digest(`chain-${sequence}`),
          digest(`input-${sequence}`),
          digest(`output-${sequence}`),
          openedAtUtc,
          closedAtUtc,
          now,
        );
      database.prepare(`INSERT INTO journal_round_trips (
  round_trip_id, workspace_id, account_id, current_version_id,
  lifecycle_state, created_at_utc, updated_at_utc
) VALUES (?, ?, ?, ?, 'active', ?, ?)`)
        .run(
          roundTripId,
          foundation.workspaceId,
          foundation.accountId,
          versionId,
          now,
          now,
        );
      database.prepare(`INSERT INTO journal_round_trip_versions (
  round_trip_version_id, workspace_id, account_id, round_trip_id,
  version_number, rebuild_id, instrument_id, trade_currency,
  chain_key_sha256, direction, opened_at_utc, closed_at_utc,
  final_position_decimal, projection_state, coverage_reason_code,
  projection_fingerprint_sha256, created_at_utc
) VALUES (?, ?, ?, ?, 1, ?, ?, 'USD', ?, 'long', ?, ?, '0',
  'ready_closed', NULL, ?, ?)`)
        .run(
          versionId,
          foundation.workspaceId,
          foundation.accountId,
          roundTripId,
          rebuildId,
          instrumentId,
          digest(`chain-${sequence}`),
          openedAtUtc,
          closedAtUtc,
          digest(`projection-${sequence}`),
          now,
        );
    }).immediate();
  } finally {
    database.close();
  }
  return roundTripId;
}

function linkInput(
  roundTripId: string,
  overrides: Readonly<Record<string, unknown>> = {},
): Record<string, unknown> {
  return {
    roundTripId,
    expectedAccountSelectionRef: foundation.accountSelectionRef,
    provider: "ibkr",
    ...overrides,
  };
}

function expectNoRawPayload(value: unknown): void {
  if (Array.isArray(value)) {
    for (const item of value) expectNoRawPayload(item);
    return;
  }
  if (!value || typeof value !== "object") return;
  expect(Object.hasOwn(value, "rawPayload")).toBe(false);
  for (const item of Object.values(value)) expectNoRawPayload(item);
}

beforeEach(() => {
  foundation = createPlatformRouteTestFoundation("traderlink-level-link-route-");
  restoreEnvironment = installPlatformRouteTestEnvironment(
    foundation.databasePath,
    {
      TRADERLINK_LEVEL_ANALYSIS_ALLOWED_PROVIDERS: "ibkr,fixture",
      TRADERLINK_LEVEL_ANALYSIS_RAW_DEBUG_ENABLED: "true",
    },
  );
});

afterEach(() => {
  restoreEnvironment();
  rmSync(foundation.root, { recursive: true, force: true });
});

describe("replacement Journal Level Analysis route boundaries", () => {
  it("resolves, persists, deduplicates and reads an account-scoped link", async () => {
    const delivery = seedDelivery(fixture(
      "level-analysis-journal-delivery-package-v1.compact.json",
    ));
    expect(delivery.status).toBe("accepted");
    const roundTripId = seedRoundTrip(100);

    const resolveResponse = await resolveTradeLink(post(
      "/api/level-analysis/trade-links/resolve",
      linkInput(roundTripId),
    ));
    expect(resolveResponse.status).toBe(200);
    const resolution = await resolveResponse.json();
    expect(resolution).toMatchObject({
      status: "matched",
      savedTradeId: roundTripId,
      symbol: "DEVS",
      provider: "ibkr",
      candidate: { deliveryId: delivery.deliveryId },
    });

    const persistResponse = await persistTradeLink(post(
      "/api/level-analysis/trade-links",
      linkInput(roundTripId),
    ));
    expect(persistResponse.status).toBe(200);
    const linked = await persistResponse.json();
    expect(linked).toMatchObject({
      status: "linked",
      savedTradeId: roundTripId,
      deliveryId: delivery.deliveryId,
      duplicate: false,
    });
    const duplicate = await (
      await persistTradeLink(post(
        "/api/level-analysis/trade-links",
        linkInput(roundTripId),
      ))
    ).json();
    expect(duplicate).toMatchObject({
      status: "linked",
      linkId: linked.linkId,
      duplicate: true,
    });

    const trade = await (
      await getTradeLevelAnalysis(
        createPlatformRouteTestRequest(
          `/api/trades/${roundTripId}/level-analysis`,
        ),
        { params: Promise.resolve({ tradeId: roundTripId }) },
      )
    ).json();
    expect(trade).toMatchObject({
      status: "found",
      savedTradeId: roundTripId,
      link: { linkStatus: "linked" },
    });

    const facts = await (
      await getTradeDetailLevelFacts(
        createPlatformRouteTestRequest(
          `/api/trades/${roundTripId}/level-analysis/facts`,
        ),
        { params: Promise.resolve({ tradeId: roundTripId }) },
      )
    ).json();
    expect(facts).toMatchObject({
      savedTradeId: roundTripId,
      availability: { availability: "attached" },
      attachedFacts: { symbol: "DEVS", provider: "ibkr" },
    });
    expectNoRawPayload({ resolution, linked, trade, facts });

    const admin = await (
      await getAdminTradeLink(
        createPlatformRouteTestRequest(
          `/api/admin/level-analysis/trade-links/${linked.linkId}`,
        ),
        { params: Promise.resolve({ linkId: linked.linkId }) },
      )
    ).json();
    expect(admin).toMatchObject({
      status: "found",
      linkId: linked.linkId,
      deliveryId: delivery.deliveryId,
    });
  });

  it("rejects a forged account selection before writing", async () => {
    seedDelivery(fixture("level-analysis-journal-delivery-package-v1.compact.json"));
    const roundTripId = seedRoundTrip(200);
    const response = await persistTradeLink(post(
      "/api/level-analysis/trade-links",
      linkInput(roundTripId, { expectedAccountSelectionRef: "f".repeat(64) }),
    ));
    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      code: "TRADERLINK_ACCOUNT_ACCESS_DENIED",
    });
  });

  it("blocks a delivery whose market facts occur after the trade boundary", async () => {
    seedDelivery(fixture("level-analysis-journal-delivery-package-v1.compact.json"));
    const roundTripId = seedRoundTrip(
      300,
      "DEVS",
      "2026-05-01T14:00:00.000Z",
    );
    const response = await resolveTradeLink(post(
      "/api/level-analysis/trade-links/resolve",
      linkInput(roundTripId),
    ));
    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toMatchObject({
      status: "blocked",
      matchResult: { reason: "as_of_after_allowed_boundary" },
    });
  });

  it("links the accepted historical snapshot through explicit selection", async () => {
    const delivery = seedDelivery(fixture(
      "journal-connector-level-analysis-snapshot-v1.json",
    ));
    const roundTripId = seedRoundTrip(400, "SNAP");
    const response = await persistTradeLink(post(
      "/api/level-analysis/trade-links",
      linkInput(roundTripId, {
        provider: "fixture",
        deliveryId: delivery.deliveryId,
        linkSource: "manual_review",
      }),
    ));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      status: "linked",
      savedTradeId: roundTripId,
      deliveryId: delivery.deliveryId,
      symbol: "SNAP",
      provider: "fixture",
    });
  });

  it("returns a factual not-checked state for an unlinked round trip", async () => {
    const roundTripId = seedRoundTrip(500);
    const response = await getTradeDetailLevelFacts(
      createPlatformRouteTestRequest(
        `/api/trades/${roundTripId}/level-analysis/facts`,
      ),
      { params: Promise.resolve({ tradeId: roundTripId }) },
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      savedTradeId: roundTripId,
      availability: { availability: "not_checked" },
      display: { shouldShowFactsPanel: false },
    });
  });

  it("fails closed without providers and hides raw debug when disabled", async () => {
    const roundTripId = seedRoundTrip(600);
    delete process.env.TRADERLINK_LEVEL_ANALYSIS_ALLOWED_PROVIDERS;
    const unavailable = await getTradeDetailLevelFacts(
      createPlatformRouteTestRequest(
        `/api/trades/${roundTripId}/level-analysis/facts`,
      ),
      { params: Promise.resolve({ tradeId: roundTripId }) },
    );
    expect(unavailable.status).toBe(503);

    delete process.env.TRADERLINK_LEVEL_ANALYSIS_RAW_DEBUG_ENABLED;
    const hidden = await getAdminTradeLink(
      createPlatformRouteTestRequest(
        `/api/admin/level-analysis/trade-links/${id(999)}`,
      ),
      { params: Promise.resolve({ linkId: id(999) }) },
    );
    expect(hidden.status).toBe(404);
    await expect(hidden.json()).resolves.toEqual({
      ok: false,
      code: "feature_disabled",
    });
  });
});
