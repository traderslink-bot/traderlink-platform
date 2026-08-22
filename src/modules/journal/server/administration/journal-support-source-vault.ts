import { createHash, randomBytes, randomUUID } from "node:crypto";
import {
  chmodSync,
  closeSync,
  existsSync,
  fsyncSync,
  lstatSync,
  openSync,
  readdirSync,
  readFileSync,
  realpathSync,
  renameSync,
  unlinkSync,
  writeSync,
} from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";

import {
  ACTIVE_TRADERLINK_PLATFORM_REPOSITORY_ROOT,
  isPathWithinRoot,
} from "@/src/modules/platform/server/database/platform-database-config";
import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";

export const TRADERLINK_PLATFORM_JOURNAL_SUPPORT_SOURCE_ROOT_ENV =
  "TRADERLINK_PLATFORM_JOURNAL_SUPPORT_SOURCE_ROOT" as const;

export type JournalSupportSourceVault = Readonly<{
  rootPath: string;
}>;

function overlap(left: string, right: string): boolean {
  return isPathWithinRoot(left, right) || isPathWithinRoot(right, left);
}

function safeRoot(value: unknown): string {
  if (typeof value !== "string" || !isAbsolute(value) || value.trim() !== value) {
    platformFailure("TRADERLINK_JOURNAL_EVIDENCE_VAULT_CONFIGURATION_INVALID", {
      check: "support_source_root",
    });
  }
  const root = resolve(value);
  if (!existsSync(root) || lstatSync(root).isSymbolicLink() ||
    !lstatSync(root).isDirectory() || realpathSync(root) !== root) {
    platformFailure("TRADERLINK_JOURNAL_EVIDENCE_VAULT_CONFIGURATION_INVALID", {
      check: "support_source_root_identity",
    });
  }
  return root;
}

export function resolveJournalSupportSourceVault(input: Readonly<{
  databasePath: string;
  environment?: NodeJS.ProcessEnv;
}>): JournalSupportSourceVault {
  const environment = input.environment ?? process.env;
  const rootPath = safeRoot(
    environment[TRADERLINK_PLATFORM_JOURNAL_SUPPORT_SOURCE_ROOT_ENV],
  );
  const forbidden = [
    ACTIVE_TRADERLINK_PLATFORM_REPOSITORY_ROOT,
    // A single-node host commonly keeps its SQLite file and purpose-separated
    // vault folders on one persistent volume.  Reject the database file (and
    // any enclosing support root), while allowing a sibling vault directory.
    resolve(input.databasePath),
    environment.TRADERLINK_PLATFORM_JOURNAL_EVIDENCE_VAULT_ROOT,
    environment.TRADERLINK_PLATFORM_JOURNAL_UPLOAD_STAGING_ROOT,
  ].filter((value): value is string => typeof value === "string" && value.length > 0)
    .map((value) => resolve(value));
  if (forbidden.some((path) => overlap(rootPath, path))) {
    platformFailure("TRADERLINK_JOURNAL_EVIDENCE_VAULT_CONFIGURATION_INVALID", {
      check: "support_source_root_overlap",
    });
  }
  return Object.freeze({ rootPath });
}

function objectPath(vault: JournalSupportSourceVault, objectKey: string): string {
  if (!/^[A-Za-z0-9_-]{32,160}$/u.test(objectKey)) {
    platformFailure("TRADERLINK_JOURNAL_EVIDENCE_VAULT_CONFLICT", {
      check: "support_object_key",
    });
  }
  const path = resolve(join(vault.rootPath, objectKey));
  if (!isPathWithinRoot(path, vault.rootPath) || dirname(path) !== vault.rootPath) {
    platformFailure("TRADERLINK_JOURNAL_EVIDENCE_VAULT_CONFLICT", {
      check: "support_object_boundary",
    });
  }
  return path;
}

export function writeJournalSupportSource(
  vault: JournalSupportSourceVault,
  sourceBytes: Uint8Array,
): Readonly<{
  objectKey: string;
  sourceFileSha256: string;
  sourceFileSizeBytes: number;
}> {
  if (sourceBytes.byteLength < 1 || sourceBytes.byteLength > 50 * 1024 * 1024) {
    platformFailure("TRADERLINK_JOURNAL_IMPORT_CONFLICT", {
      reason: "support_source_size",
    });
  }
  const objectKey = randomBytes(32).toString("base64url");
  const finalPath = objectPath(vault, objectKey);
  const temporaryPath = objectPath(
    vault,
    `${randomBytes(24).toString("base64url")}_${randomUUID().replaceAll("-", "")}`,
  );
  let handle: number | null = null;
  try {
    handle = openSync(temporaryPath, "wx", 0o600);
    let offset = 0;
    while (offset < sourceBytes.byteLength) {
      offset += writeSync(handle, sourceBytes, offset, sourceBytes.byteLength - offset);
    }
    fsyncSync(handle);
    closeSync(handle);
    handle = null;
    chmodSync(temporaryPath, 0o600);
    renameSync(temporaryPath, finalPath);
    const status = lstatSync(finalPath);
    if (status.isSymbolicLink() || !status.isFile() ||
      status.size !== sourceBytes.byteLength || realpathSync(finalPath) !== finalPath) {
      platformFailure("TRADERLINK_JOURNAL_EVIDENCE_VAULT_WRITE_FAILED", {
        check: "support_source_verification",
      });
    }
    return Object.freeze({
      objectKey,
      sourceFileSha256: createHash("sha256").update(sourceBytes).digest("hex"),
      sourceFileSizeBytes: sourceBytes.byteLength,
    });
  } catch (error) {
    if (handle !== null) closeSync(handle);
    if (existsSync(temporaryPath)) unlinkSync(temporaryPath);
    if (existsSync(finalPath)) unlinkSync(finalPath);
    platformFailure("TRADERLINK_JOURNAL_EVIDENCE_VAULT_WRITE_FAILED", {
      check: "support_source_write",
    }, error);
  }
}

export function readJournalSupportSource(input: Readonly<{
  vault: JournalSupportSourceVault;
  objectKey: string;
  expectedSha256: string;
  expectedSizeBytes: number;
}>): Uint8Array {
  const path = objectPath(input.vault, input.objectKey);
  if (!existsSync(path) || lstatSync(path).isSymbolicLink() ||
    !lstatSync(path).isFile() || realpathSync(path) !== path) {
    platformFailure("TRADERLINK_JOURNAL_EVIDENCE_VAULT_CONFLICT", {
      check: "support_source_missing",
    });
  }
  const bytes = readFileSync(path);
  if (bytes.byteLength !== input.expectedSizeBytes ||
    createHash("sha256").update(bytes).digest("hex") !== input.expectedSha256) {
    platformFailure("TRADERLINK_JOURNAL_EVIDENCE_VAULT_CONFLICT", {
      check: "support_source_mismatch",
    });
  }
  return bytes;
}

export function purgeJournalSupportSource(input: Readonly<{
  vault: JournalSupportSourceVault;
  objectKey: string;
  expectedSha256: string;
  expectedSizeBytes: number;
  purgedAtUtc: string;
}>): string {
  readJournalSupportSource(input);
  const path = objectPath(input.vault, input.objectKey);
  unlinkSync(path);
  if (existsSync(path)) platformFailure(
    "TRADERLINK_JOURNAL_EVIDENCE_VAULT_WRITE_FAILED",
    { check: "support_source_purge" },
  );
  return createHash("sha256").update(JSON.stringify([
    "journal-support-source-purge-v1",
    input.objectKey,
    input.expectedSha256,
    input.expectedSizeBytes,
    input.purgedAtUtc,
  ]), "utf8").digest("hex");
}

export function listJournalSupportSourceOrphanCandidates(input: Readonly<{
  vault: JournalSupportSourceVault;
  olderThan: Date;
}>): readonly string[] {
  const cutoff = input.olderThan.getTime();
  if (!Number.isFinite(cutoff)) {
    platformFailure("TRADERLINK_JOURNAL_EVIDENCE_VAULT_CONFLICT", {
      check: "support_orphan_cutoff",
    });
  }
  const candidates: string[] = [];
  for (const entry of readdirSync(input.vault.rootPath, { withFileTypes: true })) {
    if (!/^[A-Za-z0-9_-]{32,160}$/u.test(entry.name)) {
      platformFailure("TRADERLINK_JOURNAL_EVIDENCE_VAULT_CONFLICT", {
        check: "support_orphan_entry",
      });
    }
    const path = objectPath(input.vault, entry.name);
    const status = lstatSync(path);
    if (!entry.isFile() || entry.isSymbolicLink() || status.isSymbolicLink() ||
      realpathSync(path) !== path) {
      platformFailure("TRADERLINK_JOURNAL_EVIDENCE_VAULT_CONFLICT", {
        check: "support_orphan_entry_identity",
      });
    }
    if (status.mtimeMs <= cutoff) candidates.push(entry.name);
  }
  return Object.freeze(candidates.sort());
}

export function purgeUnreferencedJournalSupportSource(input: Readonly<{
  vault: JournalSupportSourceVault;
  objectKey: string;
  purgedAtUtc: string;
}>): string {
  const path = objectPath(input.vault, input.objectKey);
  if (!existsSync(path) || lstatSync(path).isSymbolicLink() ||
    !lstatSync(path).isFile() || realpathSync(path) !== path) {
    platformFailure("TRADERLINK_JOURNAL_EVIDENCE_VAULT_CONFLICT", {
      check: "support_orphan_missing",
    });
  }
  const bytes = readFileSync(path);
  return purgeJournalSupportSource({
    vault: input.vault,
    objectKey: input.objectKey,
    expectedSha256: createHash("sha256").update(bytes).digest("hex"),
    expectedSizeBytes: bytes.byteLength,
    purgedAtUtc: input.purgedAtUtc,
  });
}
