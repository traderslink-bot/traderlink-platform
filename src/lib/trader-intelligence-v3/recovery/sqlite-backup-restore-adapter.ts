import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";

import Database from "better-sqlite3";

import type { CanonicalUtcTimestamp } from "../domain/canonical";
import type { ExactResult } from "../domain/exact";
import { validateCanonicalDigest, validateCanonicalTimestamp } from "../domain/foundation";
import { createCanonicalContentIdentity, type CanonicalContentDigest } from "../domain/identity";

export interface RestoreTruthProbeResult {
  readonly executionDigests: readonly CanonicalContentDigest[];
  readonly manifestDigests: readonly CanonicalContentDigest[];
  readonly snapshotDigests: readonly CanonicalContentDigest[];
  readonly exactReconstructionDigest: CanonicalContentDigest;
}

export interface SqliteRestoreTestRecord {
  readonly schemaVersion: "ti_v3_restore_test_record_v1";
  readonly testedAt: CanonicalUtcTimestamp;
  readonly integrityStatus: "ok";
  readonly executionDigests: readonly CanonicalContentDigest[];
  readonly manifestDigests: readonly CanonicalContentDigest[];
  readonly snapshotDigests: readonly CanonicalContentDigest[];
  readonly exactReconstructionDigest: CanonicalContentDigest;
  readonly restoreTestDigest: CanonicalContentDigest;
}

export type BackupRestoreFailureCode =
  | "ti_v3_backup_source_missing"
  | "ti_v3_backup_path_not_absolute"
  | "ti_v3_backup_repository_path_forbidden"
  | "ti_v3_backup_temp_path_forbidden"
  | "ti_v3_backup_overwrite_forbidden"
  | "ti_v3_backup_same_path_forbidden"
  | "ti_v3_backup_sqlite_failed"
  | "ti_v3_restore_integrity_failed"
  | "ti_v3_restore_truth_mismatch"
  | "ti_v3_restore_probe_invalid";

export type BackupRestoreResult<T> = ExactResult<T, { readonly code: BackupRestoreFailureCode; readonly path: "$source" | "$destination" | "$restore" }>;

function failure<T>(code: BackupRestoreFailureCode, path: "$source" | "$destination" | "$restore"): BackupRestoreResult<T> {
  return { ok: false, error: { code, path } };
}

function comparable(path: string): string {
  const absolute = resolve(path);
  return process.platform === "win32" ? absolute.toLowerCase() : absolute;
}

function within(path: string, root: string): boolean {
  const child = comparable(path);
  const parent = comparable(root);
  return child === parent || child.startsWith(`${parent}${sep}`);
}

function validatePaths(args: { readonly sourcePath: string; readonly destinationPath: string; readonly repositoryRoot: string; readonly syntheticTestMode?: boolean }): BackupRestoreResult<{ readonly sourcePath: string; readonly destinationPath: string }> {
  if (!isAbsolute(args.sourcePath)) return failure("ti_v3_backup_path_not_absolute", "$source");
  if (!isAbsolute(args.destinationPath)) return failure("ti_v3_backup_path_not_absolute", "$destination");
  const sourcePath = resolve(args.sourcePath);
  const destinationPath = resolve(args.destinationPath);
  if (comparable(sourcePath) === comparable(destinationPath)) return failure("ti_v3_backup_same_path_forbidden", "$destination");
  if (!existsSync(sourcePath)) return failure("ti_v3_backup_source_missing", "$source");
  if (existsSync(destinationPath)) return failure("ti_v3_backup_overwrite_forbidden", "$destination");
  if (within(sourcePath, args.repositoryRoot) || within(destinationPath, args.repositoryRoot)) return failure("ti_v3_backup_repository_path_forbidden", "$destination");
  if (!args.syntheticTestMode && (within(sourcePath, tmpdir()) || within(destinationPath, tmpdir()))) return failure("ti_v3_backup_temp_path_forbidden", "$destination");
  if (!existsSync(dirname(destinationPath)) || relative(dirname(destinationPath), destinationPath) === "") return failure("ti_v3_backup_path_not_absolute", "$destination");
  return { ok: true, value: { sourcePath, destinationPath } };
}

function validateProbe(probe: RestoreTruthProbeResult): BackupRestoreResult<RestoreTruthProbeResult> {
  const fields = [probe.executionDigests, probe.manifestDigests, probe.snapshotDigests];
  for (const values of fields) {
    for (const value of values) {
      if (!validateCanonicalDigest(value, "$").ok) return failure("ti_v3_restore_probe_invalid", "$restore");
    }
  }
  if (!validateCanonicalDigest(probe.exactReconstructionDigest, "$").ok) return failure("ti_v3_restore_probe_invalid", "$restore");
  return { ok: true, value: { ...probe, executionDigests: Object.freeze([...probe.executionDigests].sort()), manifestDigests: Object.freeze([...probe.manifestDigests].sort()), snapshotDigests: Object.freeze([...probe.snapshotDigests].sort()) } };
}

export async function createWalSafeSqliteBackup(args: { readonly sourcePath: string; readonly destinationPath: string; readonly repositoryRoot: string; readonly syntheticTestMode?: boolean }): Promise<BackupRestoreResult<{ readonly backupPath: string }>> {
  const paths = validatePaths(args);
  if (!paths.ok) return paths;
  let source: Database.Database | null = null;
  try {
    source = new Database(paths.value.sourcePath, { readonly: true, fileMustExist: true });
    await source.backup(paths.value.destinationPath);
    return { ok: true, value: { backupPath: paths.value.destinationPath } };
  } catch {
    return failure("ti_v3_backup_sqlite_failed", "$destination");
  } finally {
    source?.close();
  }
}

export async function restoreAndVerifySqliteBackup(args: { readonly backupPath: string; readonly isolatedDestinationPath: string; readonly repositoryRoot: string; readonly testedAt: CanonicalUtcTimestamp; readonly syntheticTestMode?: boolean; readonly probe: (database: Database.Database) => RestoreTruthProbeResult }): Promise<BackupRestoreResult<{ readonly restoredPath: string; readonly record: SqliteRestoreTestRecord }>> {
  const paths = validatePaths({ sourcePath: args.backupPath, destinationPath: args.isolatedDestinationPath, repositoryRoot: args.repositoryRoot, syntheticTestMode: args.syntheticTestMode });
  if (!paths.ok) return paths;
  const testedAt = validateCanonicalTimestamp(args.testedAt, "$.testedAt");
  if (!testedAt.ok) return failure("ti_v3_restore_probe_invalid", "$restore");
  let backup: Database.Database | null = null;
  let restored: Database.Database | null = null;
  try {
    backup = new Database(paths.value.sourcePath, { readonly: true, fileMustExist: true });
    const sourceProbe = validateProbe(args.probe(backup));
    if (!sourceProbe.ok) return sourceProbe;
    await backup.backup(paths.value.destinationPath);
    restored = new Database(paths.value.destinationPath, { readonly: true, fileMustExist: true });
    const integrity = restored.pragma("integrity_check") as Array<{ integrity_check: string }>;
    if (integrity.length !== 1 || integrity[0]?.integrity_check !== "ok") return failure("ti_v3_restore_integrity_failed", "$restore");
    const restoredProbe = validateProbe(args.probe(restored));
    if (!restoredProbe.ok) return restoredProbe;
    if (JSON.stringify(sourceProbe.value) !== JSON.stringify(restoredProbe.value)) return failure("ti_v3_restore_truth_mismatch", "$restore");
    const content = { schemaVersion: "ti_v3_restore_test_record_v1" as const, testedAt: testedAt.value, integrityStatus: "ok" as const, ...restoredProbe.value };
    const identity = createCanonicalContentIdentity("restore_test_record", "v1", content);
    if (!identity.ok) return failure("ti_v3_restore_probe_invalid", "$restore");
    return { ok: true, value: { restoredPath: paths.value.destinationPath, record: Object.freeze({ ...content, restoreTestDigest: identity.value.identifier }) } };
  } catch {
    return failure("ti_v3_backup_sqlite_failed", "$restore");
  } finally {
    restored?.close();
    backup?.close();
  }
}
