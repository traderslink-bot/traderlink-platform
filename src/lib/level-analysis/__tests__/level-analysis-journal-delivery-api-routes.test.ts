import { rmSync } from "node:fs";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { GET as getRawDeliveryPayload } from "@/app/api/admin/level-analysis/deliveries/[deliveryId]/raw/route";
import { POST as ingestDelivery } from "@/app/api/level-analysis/deliveries/route";
import { GET as getLatestDelivery } from "@/app/api/level-analysis/deliveries/latest/route";
import { GET as getLatestSymbolSummary } from "@/app/api/level-analysis/deliveries/latest/symbols/[symbol]/route";
import { POST as validateDelivery } from "@/app/api/level-analysis/deliveries/validate/route";
import {
  createPlatformRouteTestFoundation,
  createPlatformRouteTestRequest,
  installPlatformRouteTestEnvironment,
  type PlatformRouteTestFoundation,
} from "@/src/test/traderlink-platform-route";

import deliveryFixture from "../__fixtures__/level-analysis-journal-delivery-package-v1.compact.json";
import oldSnapshotFixture from "../__fixtures__/journal-connector-level-analysis-snapshot-v1.json";

let foundation: PlatformRouteTestFoundation;
let restoreEnvironment: () => void;

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function post(path: string, body: unknown): Request {
  return createPlatformRouteTestRequest(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  foundation = createPlatformRouteTestFoundation("traderlink-level-route-");
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

describe("replacement Level Analysis delivery API routes", () => {
  it("validates, ingests, deduplicates and reads configured delivery facts", async () => {
    const validateResponse = await validateDelivery(
      post("/api/level-analysis/deliveries/validate", clone(deliveryFixture)),
    );
    expect(validateResponse.status).toBe(200);
    await expect(validateResponse.json()).resolves.toMatchObject({
      contractVersion: "level_analysis_delivery_validate_api_v1",
      status: "accepted",
      sourceKind: "packaged_review_delivery",
      compactSummary: { provider: "ibkr" },
    });

    const ingestResponse = await ingestDelivery(
      post("/api/level-analysis/deliveries", clone(deliveryFixture)),
    );
    const ingestBody = await ingestResponse.json();
    expect(ingestResponse.status).toBe(200);
    expect(ingestBody).toMatchObject({
      contractVersion: "level_analysis_delivery_ingest_api_v1",
      status: "accepted",
      duplicate: false,
      compactSummary: { symbolCount: 2, mismatchCount: 0 },
    });

    const duplicate = await (
      await ingestDelivery(post("/api/level-analysis/deliveries", clone(deliveryFixture)))
    ).json();
    expect(duplicate).toMatchObject({
      status: "accepted",
      duplicate: true,
      deliveryId: ingestBody.deliveryId,
      rawPayloadHash: ingestBody.rawPayloadHash,
    });

    const latest = await (
      await getLatestDelivery(createPlatformRouteTestRequest(
        "/api/level-analysis/deliveries/latest?provider=ibkr",
      ))
    ).json();
    expect(latest).toMatchObject({
      status: "found",
      deliveryId: ingestBody.deliveryId,
      symbols: ["DEVS", "QUBT"],
    });

    const symbol = await (
      await getLatestSymbolSummary(
        createPlatformRouteTestRequest(
          "/api/level-analysis/deliveries/latest/symbols/qubt?provider=ibkr",
        ),
        { params: Promise.resolve({ symbol: "qubt" }) },
      )
    ).json();
    expect(symbol).toMatchObject({
      status: "found",
      deliveryId: ingestBody.deliveryId,
      symbol: "QUBT",
      summary: { fifteenMinuteContextOnlyStatus: "context_only" },
    });

    const raw = await (
      await getRawDeliveryPayload(
        createPlatformRouteTestRequest(
          `/api/admin/level-analysis/deliveries/${ingestBody.deliveryId}/raw`,
        ),
        { params: Promise.resolve({ deliveryId: ingestBody.deliveryId }) },
      )
    ).json();
    expect(raw).toMatchObject({
      status: "found",
      deliveryId: ingestBody.deliveryId,
      rawPayloadHash: ingestBody.rawPayloadHash,
      validationStatus: "accepted",
      rawPayload: deliveryFixture,
    });
  });

  it("quarantines malformed payloads without publishing symbol facts", async () => {
    const malformed = clone(deliveryFixture) as Record<string, unknown>;
    delete malformed.entries;
    const response = await ingestDelivery(
      post("/api/level-analysis/deliveries", malformed),
    );
    const body = await response.json();
    expect(response.status).toBe(422);
    expect(body).toMatchObject({ status: "quarantined" });
    expect(body.errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "missing_entries" }),
    ]));
  });

  it("keeps the accepted historical snapshot contract ingestible", async () => {
    const response = await ingestDelivery(
      post("/api/level-analysis/deliveries", clone(oldSnapshotFixture)),
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      status: "accepted",
      compactSummary: { sourceKind: "single_snapshot_v1", symbolCount: 1 },
    });
  });

  it("fails closed when the server provider allowlist is absent", async () => {
    delete process.env.TRADERLINK_LEVEL_ANALYSIS_ALLOWED_PROVIDERS;
    const response = await validateDelivery(
      post("/api/level-analysis/deliveries/validate", clone(deliveryFixture)),
    );
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      code: "TRADERLINK_LEVEL_ANALYSIS_CONFIGURATION_INVALID",
    });
  });
});
