import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import type Database from "better-sqlite3";

import { openPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { runPlatformMigrations } from "@/src/modules/platform/server/database/run-platform-migrations";

import { LevelAnalysisDeliveryRepository } from "./level-analysis-delivery-repository";
import {
  LEVEL_ANALYSIS_DELIVERY_MAX_BYTES,
  readBoundedLevelAnalysisDeliveryPayload,
  readConfiguredLevelAnalysisProviders,
} from "./level-analysis-delivery-request";
import { LevelAnalysisDeliveryService } from "./level-analysis-delivery-service";

const roots: string[] = [];
afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

function setup(): Database.Database {
  const root = mkdtempSync(join(tmpdir(), "traderlink-level-delivery-"));
  roots.push(root);
  const database = openPlatformDatabase({
    mode: "initializer",
    databasePath: join(root, "platform.sqlite"),
    forbiddenRepositoryRoots: [],
  });
  runPlatformMigrations(database, { now: () => new Date("2026-08-02T12:00:00.000Z") });
  return database;
}

function fixture(): unknown {
  return JSON.parse(readFileSync(resolve(
    process.cwd(),
    "src/lib/level-analysis/__fixtures__/level-analysis-journal-delivery-package-v1.compact.json",
  ), "utf8")) as unknown;
}

describe("replacement Level Analysis delivery boundary", () => {
  it("takes the provider allowlist only from strict server configuration", () => {
    expect(readConfiguredLevelAnalysisProviders({
      TRADERLINK_LEVEL_ANALYSIS_ALLOWED_PROVIDERS: "ibkr,yahoo_chart,ibkr",
    })).toEqual(["ibkr", "yahoo_chart"]);
    expect(readConfiguredLevelAnalysisProviders({})).toEqual([]);
    expect(() => readConfiguredLevelAnalysisProviders({
      TRADERLINK_LEVEL_ANALYSIS_ALLOWED_PROVIDERS: "IBKR",
    })).toThrowError("TRADERLINK_LEVEL_ANALYSIS_CONFIGURATION_INVALID");
  });

  it("bounds JSON before validation and rejects request-owned authority", async () => {
    await expect(readBoundedLevelAnalysisDeliveryPayload(new Request("http://local", {
      method: "POST",
      headers: { "content-length": String(LEVEL_ANALYSIS_DELIVERY_MAX_BYTES + 1) },
      body: "{}",
    }))).rejects.toThrowError("TRADERLINK_LEVEL_ANALYSIS_DELIVERY_INVALID");

    await expect(readBoundedLevelAnalysisDeliveryPayload(new Request("http://local", {
      method: "POST",
      body: JSON.stringify({ payload: {}, allowedPackagedProviders: ["fixture"] }),
    }))).rejects.toThrowError("TRADERLINK_LEVEL_ANALYSIS_DELIVERY_INVALID");

    await expect(readBoundedLevelAnalysisDeliveryPayload(new Request("http://local", {
      method: "POST",
      body: JSON.stringify({ payload: { schemaVersion: "test" } }),
    }))).resolves.toEqual({ schemaVersion: "test" });
  });

  it("stores accepted delivery evidence and symbol facts immutably and idempotently", () => {
    const database = setup();
    try {
      const repository = new LevelAnalysisDeliveryRepository(database);
      const service = new LevelAnalysisDeliveryService(
        repository,
        ["ibkr"],
        () => new Date("2026-08-02T12:00:00.000Z"),
      );
      expect(service.validate(fixture()).status).toBe("accepted");
      const first = service.ingest(fixture());
      const duplicate = service.ingest(fixture());
      expect(first).toMatchObject({ status: "accepted", duplicate: false });
      expect(duplicate).toMatchObject({
        status: "accepted",
        duplicate: true,
        deliveryId: first.deliveryId,
      });
      expect(database.prepare("SELECT COUNT(*) AS count FROM level_analysis_deliveries").get())
        .toEqual({ count: 1 });
      expect(database.prepare("SELECT COUNT(*) AS count FROM level_analysis_delivery_symbol_facts").get())
        .toEqual({ count: 2 });
      expect(service.latest("ibkr")).toMatchObject({ status: "found", deliveryId: first.deliveryId });
      expect(service.latestSymbol("DEVS", "ibkr")).toMatchObject({
        status: "found",
        deliveryId: first.deliveryId,
        symbol: "DEVS",
      });
      expect(() => database.prepare(
        "UPDATE level_analysis_deliveries SET provider = 'changed'",
      ).run()).toThrow();
      expect(() => database.prepare(
        "DELETE FROM level_analysis_delivery_symbol_facts",
      ).run()).toThrow();
    } finally {
      database.close();
    }
  });

  it("quarantines a package whose provider is not enabled and publishes no symbol facts", () => {
    const database = setup();
    try {
      const response = new LevelAnalysisDeliveryService(
        new LevelAnalysisDeliveryRepository(database),
        ["yahoo_chart"],
        () => new Date("2026-08-02T12:00:00.000Z"),
      ).ingest(fixture());
      expect(response).toMatchObject({ status: "quarantined" });
      expect(database.prepare(`
SELECT validation_status
FROM level_analysis_deliveries`).get()).toEqual({
        validation_status: "quarantined",
      });
      expect(database.prepare(
        "SELECT COUNT(*) AS count FROM level_analysis_delivery_symbol_facts",
      ).get()).toEqual({ count: 0 });
    } finally {
      database.close();
    }
  });
});
