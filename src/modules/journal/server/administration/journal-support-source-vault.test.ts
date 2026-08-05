import { existsSync, mkdtempSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  purgeJournalSupportSource,
  readJournalSupportSource,
  resolveJournalSupportSourceVault,
  writeJournalSupportSource,
} from "./journal-support-source-vault";

const roots: string[] = [];

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("Journal support source vault", () => {
  it("stores, verifies and permanently purges a consent-only source outside other storage", () => {
    const root = mkdtempSync(join(tmpdir(), "traderlink-support-vault-"));
    roots.push(root);
    const databaseRoot = join(root, "database");
    const evidenceRoot = join(root, "evidence");
    const stagingRoot = join(root, "staging");
    const supportRoot = join(root, "support");
    for (const path of [databaseRoot, evidenceRoot, stagingRoot, supportRoot]) {
      mkdirSync(path);
    }
    const vault = resolveJournalSupportSourceVault({
      databasePath: join(databaseRoot, "development.sqlite"),
      environment: {
        NODE_ENV: "test",
        TRADERLINK_PLATFORM_JOURNAL_SUPPORT_SOURCE_ROOT: supportRoot,
        TRADERLINK_PLATFORM_JOURNAL_EVIDENCE_VAULT_ROOT: evidenceRoot,
        TRADERLINK_PLATFORM_JOURNAL_UPLOAD_STAGING_ROOT: stagingRoot,
      },
    });
    const bytes = Buffer.from("private test statement");
    const stored = writeJournalSupportSource(vault, bytes);
    expect(readJournalSupportSource({
      vault,
      objectKey: stored.objectKey,
      expectedSha256: stored.sourceFileSha256,
      expectedSizeBytes: stored.sourceFileSizeBytes,
    })).toEqual(bytes);
    const receipt = purgeJournalSupportSource({
      vault,
      objectKey: stored.objectKey,
      expectedSha256: stored.sourceFileSha256,
      expectedSizeBytes: stored.sourceFileSizeBytes,
      purgedAtUtc: "2026-08-03T09:00:00.000Z",
    });
    expect(receipt).toMatch(/^[0-9a-f]{64}$/u);
    expect(existsSync(join(supportRoot, stored.objectKey))).toBe(false);
    expect(() => readJournalSupportSource({
      vault,
      objectKey: stored.objectKey,
      expectedSha256: stored.sourceFileSha256,
      expectedSizeBytes: stored.sourceFileSizeBytes,
    })).toThrowError("TRADERLINK_JOURNAL_EVIDENCE_VAULT_CONFLICT");
  });

  it("rejects a support root that overlaps database storage", () => {
    const root = mkdtempSync(join(tmpdir(), "traderlink-support-overlap-"));
    roots.push(root);
    const storageRoot = join(root, "storage");
    mkdirSync(storageRoot);
    expect(() => resolveJournalSupportSourceVault({
      databasePath: join(storageRoot, "development.sqlite"),
      environment: {
        NODE_ENV: "test",
        TRADERLINK_PLATFORM_JOURNAL_SUPPORT_SOURCE_ROOT: storageRoot,
      },
    })).toThrowError("TRADERLINK_JOURNAL_EVIDENCE_VAULT_CONFIGURATION_INVALID");
  });
});
