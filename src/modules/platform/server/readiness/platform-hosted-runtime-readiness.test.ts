// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const fixture = vi.hoisted(() => ({
  directories: new Set<string>(),
  symlinks: new Set<string>(),
  modes: new Map<string, number>(),
  owners: new Map<string, number>(),
  denied: new Set<string>(),
  guard: vi.fn(),
  close: vi.fn(),
  open: vi.fn(),
  ledger: vi.fn(),
}));
vi.mock("node:fs", async (original) => ({
  ...await original<typeof import("node:fs")>(),
  existsSync: (path: string) => fixture.directories.has(path),
  lstatSync: (path: string) => ({
    isSymbolicLink: () => fixture.symlinks.has(path),
    isDirectory: () => fixture.directories.has(path),
    uid: fixture.owners.get(path) ?? 0,
    mode: fixture.modes.get(path) ?? (path.includes("community-combined-review") ? 0o700 : 0o755),
  }),
  realpathSync: (path: string) => path,
  accessSync: (path: string) => {
    if (fixture.denied.has(path)) throw new Error("EACCES");
  },
}));
vi.mock("../runtime/platform-background-worker-mode", () => ({
  resolvePlatformBackgroundWorkerMode: fixture.guard,
}));
vi.mock("../database/open-readonly-platform-database", () => ({
  openReadonlyPlatformDatabase: fixture.open,
}));
vi.mock("../database/platform-migration-registry", async (original) => ({
  ...await original<typeof import("../database/platform-migration-registry")>(),
  readAppliedPlatformMigrations: fixture.ledger,
}));
import { verifyPlatformHostedRuntimeReadiness } from "./platform-hosted-runtime-readiness";

const reviewRoot = "/data/community-combined-review-20261117";
function environment(staging = false): NodeJS.ProcessEnv {
  const root = staging ? reviewRoot : "/data", journal = staging ? root + "/journal" : root;
  return {
    NODE_ENV: "production",
    TRADERLINK_PLATFORM_STORAGE_BACKEND: "sqlite_single_node",
    RAILWAY_VOLUME_MOUNT_PATH: "/data",
    TRADERLINK_PLATFORM_DB_PATH: root + (staging ? "/platform.sqlite" : "/traderlink-platform.sqlite"),
    TRADERLINK_PLATFORM_JOURNAL_EVIDENCE_VAULT_ROOT: journal + "/evidence-vault",
    TRADERLINK_PLATFORM_JOURNAL_UPLOAD_STAGING_ROOT: journal + "/upload-staging",
    TRADERLINK_PLATFORM_HOSTED_BACKUP_ROOT: root + "/backups",
    TRADERLINK_PLATFORM_JOURNAL_PROTECTED_STORAGE_ROOTS_JSON: JSON.stringify([root + "/backups"]),
    ...(staging ? { TRADERLINK_PLATFORM_BACKGROUND_WORKERS_MODE: "disabled_isolated_staging" } : {}),
  };
}
beforeEach(() => {
  vi.clearAllMocks();
  fixture.directories.clear(); fixture.symlinks.clear(); fixture.modes.clear();
  fixture.owners.clear(); fixture.denied.clear();
  for (const root of ["/data", reviewRoot, reviewRoot + "/journal",
    "/data/evidence-vault", "/data/upload-staging", "/data/backups",
    reviewRoot + "/journal/evidence-vault", reviewRoot + "/journal/upload-staging",
    reviewRoot + "/backups"]) fixture.directories.add(root);
  fixture.guard.mockReturnValue("disabled_isolated_staging");
  fixture.open.mockReturnValue({ close: fixture.close });
  fixture.ledger.mockReturnValue(Array.from({ length: 203 }, () => ({})));
});

describe("hosted readiness namespace contract", () => {
  // These tests isolate path selection and guard delegation. Actual immutable
  // guard/native database/public HTTP acceptance is a separate hosted checkpoint.
  it("keeps the existing production storage contract unchanged", () => {
    const env = environment();
    expect(verifyPlatformHostedRuntimeReadiness(env)).toEqual({
      status: "ready", migrationCount: 203, storage: "sqlite_single_node",
    });
    expect(fixture.guard).not.toHaveBeenCalled();
    expect(fixture.open).toHaveBeenCalledWith({ databasePath: "/data/traderlink-platform.sqlite", environment: env });
    expect(fixture.close).toHaveBeenCalledOnce();
  });
  it("delegates complete staging qualification before opening the exact private namespace", () => {
    const env = environment(true);
    expect(verifyPlatformHostedRuntimeReadiness(env).status).toBe("ready");
    expect(fixture.guard).toHaveBeenCalledWith(env);
    expect(fixture.open).toHaveBeenCalledWith({ databasePath: reviewRoot + "/platform.sqlite", environment: env });
    expect(fixture.close).toHaveBeenCalledOnce();
  });
  it("refuses a rejected Railway/artifact guard before opening any database", () => {
    fixture.guard.mockImplementationOnce(() => { throw new Error("artifact refused"); });
    expect(() => verifyPlatformHostedRuntimeReadiness(environment(true))).toThrow("artifact refused");
    expect(fixture.open).not.toHaveBeenCalled();
  });
  it("refuses any result other than the explicitly qualified isolated mode", () => {
    fixture.guard.mockReturnValueOnce("enabled");
    expect(() => verifyPlatformHostedRuntimeReadiness(environment(true))).toThrow("CONFIGURATION_INVALID");
    expect(fixture.open).not.toHaveBeenCalled();
  });
  it("never adopts staging paths for ordinary production", () => {
    const env = { ...environment(true), TRADERLINK_PLATFORM_BACKGROUND_WORKERS_MODE: "enabled" };
    expect(() => verifyPlatformHostedRuntimeReadiness(env)).toThrow("CONFIGURATION_INVALID");
    expect(fixture.open).not.toHaveBeenCalled();
  });
  it.each([
    ["TRADERLINK_PLATFORM_DB_PATH", "/data/traderlink-platform.sqlite"],
    ["TRADERLINK_PLATFORM_JOURNAL_EVIDENCE_VAULT_ROOT", "/data/evidence-vault"],
    ["TRADERLINK_PLATFORM_JOURNAL_UPLOAD_STAGING_ROOT", "/data/upload-staging"],
    ["TRADERLINK_PLATFORM_HOSTED_BACKUP_ROOT", "/data/backups"],
  ])("rejects mixed live/old storage through %s", (key, value) => {
    expect(() => verifyPlatformHostedRuntimeReadiness({ ...environment(true), [key]: value })).toThrow("CONFIGURATION_INVALID");
    expect(fixture.open).not.toHaveBeenCalled();
  });
  it("requires the exact isolated backup root in the protected list", () => {
    const env = { ...environment(true), TRADERLINK_PLATFORM_JOURNAL_PROTECTED_STORAGE_ROOTS_JSON: '["/data/backups"]' };
    expect(() => verifyPlatformHostedRuntimeReadiness(env)).toThrow("CONFIGURATION_INVALID");
    expect(fixture.open).not.toHaveBeenCalled();
  });
  it.each(["symlink", "shared permissions", "foreign owner", "not writable"])("rejects a private namespace that is %s", (kind) => {
    const path = reviewRoot + "/journal/evidence-vault";
    if (kind === "symlink") fixture.symlinks.add(path);
    if (kind === "shared permissions") fixture.modes.set(path, 0o755);
    if (kind === "foreign owner") fixture.owners.set(path, 987654);
    if (kind === "not writable") fixture.denied.add(path);
    expect(() => verifyPlatformHostedRuntimeReadiness(environment(true))).toThrow();
    expect(fixture.open).not.toHaveBeenCalled();
  });
  it.each([0o600, 0o500, 0o770])("requires exact traversable private mode 0700, refusing %s", (mode) => {
    fixture.modes.set(reviewRoot + "/backups", mode);
    expect(() => verifyPlatformHostedRuntimeReadiness(environment(true))).toThrow("STORAGE_INVALID");
    expect(fixture.open).not.toHaveBeenCalled();
  });
});
