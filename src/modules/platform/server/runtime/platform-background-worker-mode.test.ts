// @vitest-environment node
import { createHash } from "node:crypto";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
const files = vi.hoisted(() => ({ bytes: new Map<string, string>(), mode: 0o444, modes: new Map<string, number>(), symlink: false }));
vi.mock("node:fs", async importOriginal => {
  const original = await importOriginal<typeof import("node:fs")>();
  const stat = (path: string) => ({ isFile: () => true, isSymbolicLink: () => files.symlink,
    nlink: 1, size: Buffer.byteLength(files.bytes.get(path) ?? "x"),
    uid: process.getuid!(), mode: files.modes.get(path) ?? files.mode, dev: 1, ino: 1 });
  return { ...original, lstatSync: vi.fn(stat), fstatSync: vi.fn(stat),
    realpathSync: vi.fn((path: string) => path), openSync: vi.fn((path: string) => {
      if (!files.bytes.has(path)) throw Error("missing"); return path;
    }), closeSync: vi.fn(), readFileSync: vi.fn((path: string) => files.bytes.get(path)) };
});
import { resolvePlatformBackgroundWorkerMode, ISOLATED_STAGING_ARTIFACT } from "./platform-background-worker-mode";
const prefix = "TRADERLINK_PLATFORM_ISOLATED_STAGING_";
let env: NodeJS.ProcessEnv;
let artifact: Record<string, string>;
function receipt() {
  const bytes = JSON.stringify(artifact);
  files.bytes.set(ISOLATED_STAGING_ARTIFACT, bytes);
  env[`${prefix}ARTIFACT_SHA256`] = createHash("sha256").update(bytes).digest("hex");
}
beforeEach(() => {
  vi.spyOn(process, "cwd").mockReturnValue("/app");
  files.bytes.clear(); files.modes.clear(); files.mode = 0o444; files.symlink = false;
  artifact = { kind: "traderlink-isolated-staging-artifact-v1", role: "community-combined-review",
    projectId: "49fc9197-07c9-45c7-b528-57d0393c2cca", environmentId: "9e079dd4-f3f3-4872-9b00-adbd3000c485",
    serviceId: "4d264aca-510c-4f5e-bc28-e89e526b8008", databasePath: "/data/community-combined-review-20261117/platform.sqlite",
    sourceCommit: "a".repeat(40), sourceVectorSha256: "b".repeat(64), schemaSha256: "c".repeat(64), buildId: "review-build" };
  env = { NODE_ENV: "production", TRADERLINK_PLATFORM_BACKGROUND_WORKERS_MODE: "disabled_isolated_staging",
    RAILWAY_PROJECT_ID: artifact.projectId, RAILWAY_ENVIRONMENT_ID: artifact.environmentId,
    RAILWAY_SERVICE_ID: artifact.serviceId, RAILWAY_DEPLOYMENT_ID: "11111111-1111-4111-8111-111111111111",
    TRADERLINK_PLATFORM_DB_PATH: artifact.databasePath,
    [`${prefix}SOURCE_COMMIT`]: artifact.sourceCommit, [`${prefix}SOURCE_VECTOR_SHA256`]: artifact.sourceVectorSha256,
    [`${prefix}SCHEMA_SHA256`]: artifact.schemaSha256, [`${prefix}BUILD_ID`]: artifact.buildId };
  receipt(); files.bytes.set("/app/.next/BUILD_ID", artifact.buildId);
});
afterEach(() => vi.restoreAllMocks());
it("qualifies the exact compiled isolated staging receipt", () => {
  // File metadata is distinct for each read, as with the actual bounded reader.
  expect(resolvePlatformBackgroundWorkerMode(env)).toBe("disabled_isolated_staging");
});
it.each(["RAILWAY_PROJECT_ID", "RAILWAY_ENVIRONMENT_ID", "RAILWAY_SERVICE_ID", "TRADERLINK_PLATFORM_DB_PATH", "NODE_ENV", "RAILWAY_DEPLOYMENT_ID"])("refuses wrong or missing %s", key => {
  env[key] = "wrong"; expect(() => resolvePlatformBackgroundWorkerMode(env)).toThrow("Isolated staging");
  delete env[key]; expect(() => resolvePlatformBackgroundWorkerMode(env)).toThrow("Isolated staging");
});
it.each(["SOURCE_COMMIT", "SOURCE_VECTOR_SHA256", "SCHEMA_SHA256", "BUILD_ID", "ARTIFACT_SHA256"])("refuses missing or mismatched %s pin", key => {
  env[prefix + key] = "d".repeat(key === "SOURCE_COMMIT" ? 40 : 64);
  expect(() => resolvePlatformBackgroundWorkerMode(env)).toThrow("Isolated staging");
  delete env[prefix + key]; expect(() => resolvePlatformBackgroundWorkerMode(env)).toThrow("Isolated staging");
});
it.each(["kind", "role", "projectId", "environmentId", "serviceId", "databasePath", "sourceCommit", "sourceVectorSha256", "schemaSha256", "buildId"])("rejects a rehashed receipt with wrong %s", key => {
  artifact[key] = "wrong"; receipt(); expect(() => resolvePlatformBackgroundWorkerMode(env)).toThrow("Isolated staging");
});
it("rejects missing, altered and invalid JSON artifacts", () => {
  files.bytes.delete(ISOLATED_STAGING_ARTIFACT); expect(() => resolvePlatformBackgroundWorkerMode(env)).toThrow();
  files.bytes.set(ISOLATED_STAGING_ARTIFACT, "{"); expect(() => resolvePlatformBackgroundWorkerMode(env)).toThrow();
  env[prefix + "ARTIFACT_SHA256"] = createHash("sha256").update("{").digest("hex");
  expect(() => resolvePlatformBackgroundWorkerMode(env)).toThrow();
});
it("rejects writable or symlinked artifacts", () => {
  files.mode = 0o644; expect(() => resolvePlatformBackgroundWorkerMode(env)).toThrow();
  files.mode = 0o444; files.symlink = true; expect(() => resolvePlatformBackgroundWorkerMode(env)).toThrow();
});
it("rejects wrong cwd, conflicting maintenance and private acceptance requests", () => {
  vi.mocked(process.cwd).mockReturnValue("/runtime"); expect(() => resolvePlatformBackgroundWorkerMode(env)).toThrow();
  vi.mocked(process.cwd).mockReturnValue("/app");
  env.TRADERLINK_PLATFORM_MAINTENANCE_CONFIRM = "apply-reviewed-migration"; expect(() => resolvePlatformBackgroundWorkerMode(env)).toThrow();
  delete env.TRADERLINK_PLATFORM_MAINTENANCE_CONFIRM;
  env.TRADERLINK_PLATFORM_PRIVATE_ACCEPTANCE_RUN_ID = "fixture"; expect(() => resolvePlatformBackgroundWorkerMode(env)).toThrow();
});
it("rejects a different compiled BUILD_ID", () => {
  files.bytes.set("/app/.next/BUILD_ID", "different"); expect(() => resolvePlatformBackgroundWorkerMode(env)).toThrow();
});
it("keeps default/enabled production unchanged and rejects unrecognized modes", () => {
  expect(resolvePlatformBackgroundWorkerMode({ NODE_ENV: "production" })).toBe("enabled");
  expect(resolvePlatformBackgroundWorkerMode({ TRADERLINK_PLATFORM_BACKGROUND_WORKERS_MODE: "enabled" })).toBe("enabled");
  expect(() => resolvePlatformBackgroundWorkerMode({ TRADERLINK_PLATFORM_BACKGROUND_WORKERS_MODE: "disabled" })).toThrow();
});

it("preserves the existing fully qualified private acceptance mode", () => {
  const pins = { runId: "11111111-1111-4111-8111-111111111111", candidateSha256: "a".repeat(64), manifestSha256: "b".repeat(64), buildId: "private-build" };
  files.bytes.set("/data/private-acceptance.json", JSON.stringify({ kind: "traderlink-compiled-acceptance-v1", ...pins }));
  files.modes.set("/data/private-acceptance.json", 0o600);
  files.bytes.set("/app/private-acceptance-artifact.json", JSON.stringify({ kind: "traderlink-compiled-artifact-v1", ...pins }));
  files.bytes.set("/app/.next/BUILD_ID", pins.buildId);
  expect(resolvePlatformBackgroundWorkerMode({ NODE_ENV: "production", HOSTNAME: "127.0.0.1", PORT: "3010",
    TRADERLINK_PLATFORM_BACKGROUND_WORKERS_MODE: "disabled_private_acceptance",
    TRADERLINK_PLATFORM_DB_PATH: "/data/traderlink-platform.sqlite",
    TRADERLINK_PLATFORM_PRIVATE_ACCEPTANCE_MARKER: "/data/private-acceptance.json",
    TRADERLINK_PLATFORM_PRIVATE_ACCEPTANCE_RUN_ID: pins.runId,
    TRADERLINK_PLATFORM_PRIVATE_ACCEPTANCE_CANDIDATE_SHA256: pins.candidateSha256,
    TRADERLINK_PLATFORM_PRIVATE_ACCEPTANCE_MANIFEST_SHA256: pins.manifestSha256,
    TRADERLINK_PLATFORM_PRIVATE_ACCEPTANCE_BUILD_ID: pins.buildId,
  })).toBe("disabled_private_acceptance");
});
