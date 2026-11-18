// @vitest-environment node
import { createHash, generateKeyPairSync, sign } from "node:crypto";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import Database from "better-sqlite3";
import { afterEach, expect, it, vi } from "vitest";
import { registerTraderLinkHostedNodeRuntime } from "@/instrumentation-node";

const { maintenance, workers, retention } = vi.hoisted(() => ({ maintenance: vi.fn(), workers: vi.fn(), retention: vi.fn() }));
vi.mock("@/src/modules/partner-alerts/server/partner-alert-retention-runtime", () => ({
  startConfiguredPartnerAlertRetention: retention,
}));
vi.mock("@/src/modules/platform/server/database/run-hosted-platform-migration-maintenance", () => ({
  runHostedPlatformMigrationMaintenance: maintenance,
}));
vi.mock("@/src/modules/platform/server/readiness/platform-hosted-runtime-readiness", () => ({
  verifyPlatformHostedRuntimeReadiness: () => ({ migrationCount: 159, storage: "fixture" }),
}));
vi.mock("@/src/modules/platform/server/privacy/platform-erasure-worker-supervisor", () => ({
  startCommittedErasureRecovery: vi.fn(),
}));
vi.mock("@/src/modules/platform/server/observability/platform-runtime-delay-observability", () => ({
  startPlatformRuntimeDelayObservability: vi.fn(),
}));
vi.mock("@/src/modules/platform/server/runtime/traderlink-hosted-background-workers", () => ({
  startTraderLinkHostedBackgroundWorkers: workers,
}));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

it("holds startup before opening maintenance when restore proof is missing", async () => {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("TRADERLINK_PLATFORM_RESTORE_STARTUP", "required");
  vi.stubEnv("TRADERLINK_PLATFORM_DB_PATH", "/unused-fixture.sqlite");
  vi.stubEnv("PARTNER_ALERT_STRIPE_RETENTION_REVIEW_PATH", "/unused-review.json");
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(process, "exit").mockImplementation(() => { throw new Error("startup held"); });
  await expect(registerTraderLinkHostedNodeRuntime()).rejects.toThrow("startup held");
  expect(maintenance).not.toHaveBeenCalled();
  expect(workers).not.toHaveBeenCalled();
  expect(retention).not.toHaveBeenCalled();
});

it("verifies an independently signed fixture image before normal hosted startup", async () => {
  const directory = mkdtempSync(join(tmpdir(), "paid-hosted-restore-"));
  try {
    const db = new Database(":memory:");
    db.exec("CREATE TABLE sample(value TEXT)");
    const bytes = db.serialize();
    db.close();
    const path = join(directory, "fixture.sqlite");
    writeFileSync(path, bytes, { mode: 0o600 });
    const keys = generateKeyPairSync("ed25519");
    const ledgerSha256 = "a".repeat(64), keyringSha256 = "b".repeat(64), inventorySha256 = "c".repeat(64);
    const payload = JSON.stringify({ version: 1, databaseSha256: createHash("sha256").update(bytes).digest("hex"),
      ledgerSha256, keyringSha256, inventorySha256, expiresAtUtc: new Date(Date.now()+60_000).toISOString() });
    for (const [key,value] of Object.entries({ NODE_ENV: "production", TRADERLINK_PLATFORM_DB_PATH: path,
      TRADERLINK_PLATFORM_RESTORE_STARTUP: "required", TRADERLINK_PLATFORM_RESTORE_PAYLOAD: payload,
      PARTNER_ALERT_STRIPE_RETENTION_REVIEW_PATH: join(directory, "review.json"),
      TRADERLINK_PLATFORM_RESTORE_SIGNATURE: sign(null, Buffer.from(payload), keys.privateKey).toString("base64url"),
      TRADERLINK_PLATFORM_RESTORE_PUBLIC_KEY: keys.publicKey.export({ type: "spki", format: "pem" }).toString(),
      TRADERLINK_PLATFORM_RESTORE_LEDGER_SHA256: ledgerSha256,
      TRADERLINK_PLATFORM_RESTORE_KEYRING_SHA256: keyringSha256,
      TRADERLINK_PLATFORM_RESTORE_INVENTORY_SHA256: inventorySha256,
    })) vi.stubEnv(key,value);
    vi.spyOn(console, "info").mockImplementation(() => {});
    await registerTraderLinkHostedNodeRuntime();
    expect(maintenance).toHaveBeenCalledOnce();
    expect(workers).toHaveBeenCalledOnce();
    expect(retention).toHaveBeenCalledExactlyOnceWith(path);
  } finally { rmSync(directory,{recursive:true,force:true}); }
});
