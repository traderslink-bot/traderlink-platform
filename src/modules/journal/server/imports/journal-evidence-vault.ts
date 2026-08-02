import { createHash, randomUUID } from "node:crypto";
import {
  chmodSync,
  closeSync,
  existsSync,
  fstatSync,
  fsyncSync,
  lstatSync,
  linkSync,
  mkdirSync,
  openSync,
  readFileSync,
  realpathSync,
  unlinkSync,
  writeSync,
} from "node:fs";
import {
  dirname,
  isAbsolute,
  join,
  parse,
  relative,
  resolve,
  sep,
} from "node:path";

import {
  ACTIVE_TRADERLINK_PLATFORM_REPOSITORY_ROOT,
  isPathWithinRoot,
} from "@/src/modules/platform/server/database/platform-database-config";
import {
  isLowercaseSha256,
  isTraderLinkPlatformError,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";

export const TRADERLINK_PLATFORM_JOURNAL_EVIDENCE_VAULT_ROOT_ENV =
  "TRADERLINK_PLATFORM_JOURNAL_EVIDENCE_VAULT_ROOT" as const;
export const TRADERLINK_PLATFORM_JOURNAL_PROTECTED_STORAGE_ROOTS_JSON_ENV =
  "TRADERLINK_PLATFORM_JOURNAL_PROTECTED_STORAGE_ROOTS_JSON" as const;

export type JournalEvidenceVaultBoundary = Readonly<{
  rootPath: string;
}>;

export type JournalEvidenceVaultPromotion = Readonly<{
  status: "created" | "already_present";
  evidenceObjectKey: string;
  sourceFileSha256: string;
  sourceFileSizeBytes: number;
}>;

export type JournalEvidenceVaultTestHooks = Readonly<{
  afterTemporaryWrite?: () => void;
  afterTemporaryFlush?: () => void;
  beforePromotion?: () => void;
  afterPromotion?: () => void;
}>;

function comparablePath(value: string): string {
  const absolute = resolve(value);
  return process.platform === "win32" ? absolute.toLowerCase() : absolute;
}

function pathsOverlap(left: string, right: string): boolean {
  return isPathWithinRoot(left, right) || isPathWithinRoot(right, left);
}

function sha256Bytes(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function requireAbsoluteDirectoryPath(value: unknown, check: string): string {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.trim() !== value ||
    /[\u0000-\u001f\u007f]/u.test(value) ||
    !isAbsolute(value)
  ) {
    platformFailure("TRADERLINK_JOURNAL_EVIDENCE_VAULT_CONFIGURATION_INVALID", {
      check,
    });
  }
  return resolve(value);
}

function requireNoLinkComponents(path: string): void {
  const absolute = resolve(path);
  const root = parse(absolute).root;
  let current = root;
  for (const segment of relative(root, absolute).split(sep).filter(Boolean)) {
    current = join(current, segment);
    if (existsSync(current) && lstatSync(current).isSymbolicLink()) {
      platformFailure("TRADERLINK_JOURNAL_EVIDENCE_VAULT_CONFIGURATION_INVALID", {
        check: "vault_reparse_component",
      });
    }
  }
}

function loadProtectedStorageRoots(
  environment: NodeJS.ProcessEnv,
): readonly string[] {
  const encoded = environment[
    TRADERLINK_PLATFORM_JOURNAL_PROTECTED_STORAGE_ROOTS_JSON_ENV
  ];
  if (!encoded) {
    platformFailure("TRADERLINK_JOURNAL_EVIDENCE_VAULT_CONFIGURATION_INVALID", {
      check: "protected_storage_roots_missing",
    });
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(encoded);
  } catch (error) {
    platformFailure(
      "TRADERLINK_JOURNAL_EVIDENCE_VAULT_CONFIGURATION_INVALID",
      { check: "protected_storage_roots_json" },
      error,
    );
  }
  if (!Array.isArray(parsed) || parsed.length === 0) {
    platformFailure("TRADERLINK_JOURNAL_EVIDENCE_VAULT_CONFIGURATION_INVALID", {
      check: "protected_storage_roots_cardinality",
    });
  }
  return Object.freeze(parsed.map((value) =>
    requireAbsoluteDirectoryPath(value, "protected_storage_root")));
}

export function resolveJournalEvidenceVaultBoundary(
  options: Readonly<{
    sourcePath: string;
    databasePath: string;
    environment?: NodeJS.ProcessEnv;
    additionalForbiddenRepositoryRoots?: readonly string[];
    protectedStorageRoots?: readonly string[];
  }>,
): JournalEvidenceVaultBoundary {
  const environment = options.environment ?? process.env;
  const rootPath = requireAbsoluteDirectoryPath(
    environment[TRADERLINK_PLATFORM_JOURNAL_EVIDENCE_VAULT_ROOT_ENV],
    "vault_root",
  );
  if (!existsSync(rootPath)) {
    platformFailure("TRADERLINK_JOURNAL_EVIDENCE_VAULT_CONFIGURATION_INVALID", {
      check: "vault_root_missing",
    });
  }
  requireNoLinkComponents(rootPath);
  const rootStatus = lstatSync(rootPath);
  if (
    rootStatus.isSymbolicLink() ||
    !rootStatus.isDirectory() ||
    comparablePath(realpathSync(rootPath)) !== comparablePath(rootPath)
  ) {
    platformFailure("TRADERLINK_JOURNAL_EVIDENCE_VAULT_CONFIGURATION_INVALID", {
      check: "vault_root_identity",
    });
  }
  const protectedStorageRoots = options.protectedStorageRoots
    ? options.protectedStorageRoots.map((value) =>
        requireAbsoluteDirectoryPath(value, "protected_storage_root"))
    : loadProtectedStorageRoots(environment);
  const forbiddenRoots = [
    resolve(ACTIVE_TRADERLINK_PLATFORM_REPOSITORY_ROOT),
    ...(options.additionalForbiddenRepositoryRoots ?? []).map((value) =>
      requireAbsoluteDirectoryPath(value, "forbidden_repository_root")),
    dirname(requireAbsoluteDirectoryPath(options.databasePath, "database_path")),
    dirname(requireAbsoluteDirectoryPath(options.sourcePath, "source_path")),
    ...protectedStorageRoots,
  ];
  if (forbiddenRoots.some((forbiddenRoot) => pathsOverlap(rootPath, forbiddenRoot))) {
    platformFailure("TRADERLINK_JOURNAL_EVIDENCE_VAULT_CONFIGURATION_INVALID", {
      check: "vault_root_overlap",
    });
  }
  return Object.freeze({ rootPath });
}

function readAndVerifyEvidenceFile(
  filePath: string,
  sourceFileSha256: string,
  sourceFileSizeBytes: number,
): Uint8Array {
  if (!existsSync(filePath)) {
    platformFailure("TRADERLINK_JOURNAL_EVIDENCE_VAULT_CONFLICT", {
      check: "evidence_object_missing",
    });
  }
  requireNoLinkComponents(filePath);
  const status = lstatSync(filePath);
  if (
    status.isSymbolicLink() ||
    !status.isFile() ||
    status.size !== sourceFileSizeBytes ||
    comparablePath(realpathSync(filePath)) !== comparablePath(filePath)
  ) {
    platformFailure("TRADERLINK_JOURNAL_EVIDENCE_VAULT_CONFLICT");
  }
  const descriptor = openSync(filePath, "r");
  try {
    const before = fstatSync(descriptor);
    if (
      before.dev !== status.dev ||
      before.ino !== status.ino ||
      before.size !== status.size ||
      before.mtimeMs !== status.mtimeMs
    ) {
      platformFailure("TRADERLINK_JOURNAL_EVIDENCE_VAULT_CONFLICT");
    }
    const bytes = readFileSync(descriptor);
    const after = fstatSync(descriptor);
    if (
      before.dev !== after.dev ||
      before.ino !== after.ino ||
      before.size !== after.size ||
      before.mtimeMs !== after.mtimeMs ||
      bytes.byteLength !== sourceFileSizeBytes ||
      sha256Bytes(bytes) !== sourceFileSha256
    ) {
      platformFailure("TRADERLINK_JOURNAL_EVIDENCE_VAULT_CONFLICT");
    }
    return bytes;
  } finally {
    closeSync(descriptor);
  }
}

export function promoteJournalEvidenceObject(
  boundary: JournalEvidenceVaultBoundary,
  input: Readonly<{
    sourceBytes: Uint8Array;
    sourceFileSha256: string;
    sourceFileSizeBytes: number;
    testHooks?: JournalEvidenceVaultTestHooks;
  }>,
): JournalEvidenceVaultPromotion {
  if (
    !isLowercaseSha256(input.sourceFileSha256) ||
    !Number.isSafeInteger(input.sourceFileSizeBytes) ||
    input.sourceFileSizeBytes < 1 ||
    input.sourceBytes.byteLength !== input.sourceFileSizeBytes ||
    sha256Bytes(input.sourceBytes) !== input.sourceFileSha256
  ) {
    platformFailure("TRADERLINK_JOURNAL_IMPORT_SOURCE_EVIDENCE_MISMATCH", {
      check: "vault_source_evidence",
    });
  }
  const evidenceObjectKey = `ibkr/${input.sourceFileSha256}.csv`;
  const objectDirectory = join(boundary.rootPath, "ibkr");
  const objectPath = join(objectDirectory, `${input.sourceFileSha256}.csv`);
  if (existsSync(objectPath)) {
    readAndVerifyEvidenceFile(
      objectPath,
      input.sourceFileSha256,
      input.sourceFileSizeBytes,
    );
    return Object.freeze({
      status: "already_present" as const,
      evidenceObjectKey,
      sourceFileSha256: input.sourceFileSha256,
      sourceFileSizeBytes: input.sourceFileSizeBytes,
    });
  }

  mkdirSync(objectDirectory, { recursive: true, mode: 0o700 });
  requireNoLinkComponents(objectDirectory);
  if (
    !lstatSync(objectDirectory).isDirectory() ||
    comparablePath(realpathSync(objectDirectory)) !== comparablePath(objectDirectory)
  ) {
    platformFailure("TRADERLINK_JOURNAL_EVIDENCE_VAULT_CONFIGURATION_INVALID", {
      check: "vault_object_directory",
    });
  }
  const temporaryPath = join(
    objectDirectory,
    `.${input.sourceFileSha256}.${randomUUID()}.tmp`,
  );
  let descriptor: number | null = null;
  let promoted = false;
  let stage = "temporary_open";
  try {
    descriptor = openSync(temporaryPath, "wx", 0o600);
    chmodSync(temporaryPath, 0o600);
    stage = "temporary_write";
    let offset = 0;
    while (offset < input.sourceBytes.byteLength) {
      const written = writeSync(
        descriptor,
        input.sourceBytes,
        offset,
        input.sourceBytes.byteLength - offset,
      );
      if (written <= 0) {
        platformFailure("TRADERLINK_JOURNAL_EVIDENCE_VAULT_WRITE_FAILED", {
          stage,
        });
      }
      offset += written;
    }
    input.testHooks?.afterTemporaryWrite?.();
    stage = "temporary_flush";
    fsyncSync(descriptor);
    input.testHooks?.afterTemporaryFlush?.();
    closeSync(descriptor);
    descriptor = null;
    readAndVerifyEvidenceFile(
      temporaryPath,
      input.sourceFileSha256,
      input.sourceFileSizeBytes,
    );
    stage = "promotion";
    input.testHooks?.beforePromotion?.();
    try {
      linkSync(temporaryPath, objectPath);
    } catch (error) {
      if (!existsSync(objectPath)) throw error;
      readAndVerifyEvidenceFile(
        objectPath,
        input.sourceFileSha256,
        input.sourceFileSizeBytes,
      );
      unlinkSync(temporaryPath);
      return Object.freeze({
        status: "already_present" as const,
        evidenceObjectKey,
        sourceFileSha256: input.sourceFileSha256,
        sourceFileSizeBytes: input.sourceFileSizeBytes,
      });
    }
    promoted = true;
    unlinkSync(temporaryPath);
    readAndVerifyEvidenceFile(
      objectPath,
      input.sourceFileSha256,
      input.sourceFileSizeBytes,
    );
    input.testHooks?.afterPromotion?.();
    return Object.freeze({
      status: "created" as const,
      evidenceObjectKey,
      sourceFileSha256: input.sourceFileSha256,
      sourceFileSizeBytes: input.sourceFileSizeBytes,
    });
  } catch (error) {
    if (descriptor !== null) {
      try {
        closeSync(descriptor);
      } catch {
        // The stable vault error below remains the public failure boundary.
      }
    }
    try {
      if (existsSync(temporaryPath)) unlinkSync(temporaryPath);
    } catch (cleanupError) {
      platformFailure(
        "TRADERLINK_JOURNAL_EVIDENCE_VAULT_WRITE_FAILED",
        { stage: "temporary_cleanup" },
        cleanupError,
      );
    }
    if (isTraderLinkPlatformError(error)) throw error;
    if (promoted) {
      platformFailure(
        "TRADERLINK_JOURNAL_SOURCE_IMPORT_ORPHANED_EVIDENCE",
        {
          evidenceObjectKey,
          orphanState: "vault_object_unreferenced",
        },
        error,
      );
    }
    platformFailure(
      "TRADERLINK_JOURNAL_EVIDENCE_VAULT_WRITE_FAILED",
      { stage },
      error,
    );
  }
}

export function verifyJournalEvidenceObject(
  boundary: JournalEvidenceVaultBoundary,
  input: Readonly<{
    evidenceObjectKey: string;
    sourceFileSha256: string;
    sourceFileSizeBytes: number;
  }>,
): void {
  const expectedObjectKey = `ibkr/${input.sourceFileSha256}.csv`;
  if (input.evidenceObjectKey !== expectedObjectKey) {
    platformFailure("TRADERLINK_JOURNAL_EVIDENCE_VAULT_CONFLICT");
  }
  readAndVerifyEvidenceFile(
    join(boundary.rootPath, "ibkr", `${input.sourceFileSha256}.csv`),
    input.sourceFileSha256,
    input.sourceFileSizeBytes,
  );
}

export function readVerifiedJournalEvidenceObject(
  boundary: JournalEvidenceVaultBoundary,
  input: Readonly<{
    evidenceObjectKey: string;
    sourceFileSha256: string;
    sourceFileSizeBytes: number;
  }>,
): Uint8Array {
  const expectedObjectKey = `ibkr/${input.sourceFileSha256}.csv`;
  if (input.evidenceObjectKey !== expectedObjectKey) {
    platformFailure("TRADERLINK_JOURNAL_EVIDENCE_VAULT_CONFLICT");
  }
  return readAndVerifyEvidenceFile(
    join(boundary.rootPath, "ibkr", `${input.sourceFileSha256}.csv`),
    input.sourceFileSha256,
    input.sourceFileSizeBytes,
  );
}
