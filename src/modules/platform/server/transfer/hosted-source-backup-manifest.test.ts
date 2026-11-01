// @vitest-environment node
import { describe, expect, it } from "vitest";
import { signHostedSourceBackupManifest, verifyHostedSourceBackupManifest } from "./hosted-source-backup-manifest";
import type { HostedSourceSnapshots } from "./hosted-source-snapshot-reader";
const configuration = { activeKeyVersion: "test", keysBase64: { test: Buffer.alloc(32, 7).toString("base64") } };
const now = new Date("2026-10-31T12:00:00.000Z");
const sources = Object.fromEntries(["academy", "watchlist", "news", "affiliate"].map((module, index) => [module, { sha256: String(index + 1).repeat(64) }])) as HostedSourceSnapshots;
const evidence = () => (["academy", "watchlist", "news", "affiliate"] as const).map(module => ({ module, snapshotSha256: sources[module].sha256, backupCompletedAtUtc: now.toISOString(), sourceIdentity: `synthetic-${module}` }));
describe("authentic source backup freshness", () => {
  it("accepts signed source evidence matching each module", () => {
    const result = verifyHostedSourceBackupManifest(signHostedSourceBackupManifest(evidence(), configuration), sources, configuration, now);
    expect(result.academy).toBe(now.toISOString());
  });
  it.each(["missing", "tampered", "stale", "digest", "duplicate", "future"])("rejects %s despite a fresh target backup", (variant) => {
    const entries = evidence();
    if (variant === "stale") entries[0].backupCompletedAtUtc = "2026-10-29T12:00:00.000Z";
    if (variant === "future") entries[0].backupCompletedAtUtc = "2026-11-01T12:00:00.000Z";
    if (variant === "digest") entries[0].snapshotSha256 = "0".repeat(64);
    if (variant === "duplicate") entries[0] = entries[1];
    let raw = signHostedSourceBackupManifest(entries, configuration);
    if (variant === "missing") raw = "{}";
    if (variant === "tampered") raw = raw.replace("synthetic-academy", "forged-academy");
    expect(() => verifyHostedSourceBackupManifest(raw, sources, configuration, now)).toThrow();
  });
});
