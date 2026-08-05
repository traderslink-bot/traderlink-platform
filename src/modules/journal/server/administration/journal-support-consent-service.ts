import { createHash } from "node:crypto";

import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { resolvePlatformDatabaseConfig } from "@/src/modules/platform/server/database/platform-database-config";
import {
  createCanonicalUtcTimestamp,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";
import { withPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { JournalImportAttemptRepository } from "./journal-import-attempt-repository";
import {
  JournalSupportConsentRepository,
  type JournalSupportConsentRecord,
} from "./journal-support-consent-repository";
import {
  purgeJournalSupportSource,
  resolveJournalSupportSourceVault,
  writeJournalSupportSource,
} from "./journal-support-source-vault";

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_CONSENT_DAYS = 90;
const SUPPORTED_MIME_TYPES = new Set([
  "text/csv",
  "text/plain",
  "application/csv",
] as const);

export type JournalSupportConsentSummary = Readonly<{
  supportConsentId: string;
  sourceKind: JournalSupportConsentRecord["sourceKind"];
  state: JournalSupportConsentRecord["state"];
  revision: number;
  expiresAtUtc: string;
  purgeState: "not_applicable" | "active" | "purge_pending" | "purged" |
    "purge_failed";
}>;

function expiry(now: Date, retentionDays = DEFAULT_CONSENT_DAYS): string {
  if (!Number.isSafeInteger(retentionDays) || retentionDays < 1 ||
    retentionDays > DEFAULT_CONSENT_DAYS) {
    platformFailure("TRADERLINK_JOURNAL_IMPORT_CONFLICT", {
      reason: "support_consent_retention",
    });
  }
  return createCanonicalUtcTimestamp(new Date(now.getTime() + retentionDays * DAY_MS));
}

function summary(
  repository: JournalSupportConsentRepository,
  scope: WorkspaceAccessScope,
  consent: JournalSupportConsentRecord,
): JournalSupportConsentSummary {
  const object = consent.sourceKind === "support_object"
    ? repository.findOwnedSupportObject(scope, consent.supportConsentId)
    : null;
  return Object.freeze({
    supportConsentId: consent.supportConsentId,
    sourceKind: consent.sourceKind,
    state: consent.state,
    revision: consent.revision,
    expiresAtUtc: consent.expiresAtUtc,
    purgeState: object?.purgeState ?? "not_applicable",
  });
}

function sourceMimeType(value: string): "text/csv" | "text/plain" | "application/csv" {
  if (!SUPPORTED_MIME_TYPES.has(value as "text/csv")) {
    platformFailure("TRADERLINK_JOURNAL_IMPORT_CONFLICT", {
      reason: "support_source_mime_type",
    });
  }
  return value as "text/csv" | "text/plain" | "application/csv";
}

export function grantJournalAttemptSupportConsent(
  scope: WorkspaceAccessScope,
  input: Readonly<{
    importAttemptId: string;
    sourceBytes: Uint8Array;
    sourceMimeType: string;
    retentionDays?: number;
    now?: Date;
    environment?: NodeJS.ProcessEnv;
  }>,
): JournalSupportConsentSummary {
  const now = input.now ?? new Date();
  const timestamp = createCanonicalUtcTimestamp(now);
  const expiresAtUtc = expiry(now, input.retentionDays);
  const mimeType = sourceMimeType(input.sourceMimeType);
  const sourceFileSha256 = createHash("sha256").update(input.sourceBytes).digest("hex");
  const databasePath = resolvePlatformDatabaseConfig({
    environment: input.environment,
  }).databasePath;
  const existing = withPlatformDatabase({
    mode: "runtime",
    databasePath,
  }, (database) => {
    const repository = new JournalSupportConsentRepository(database);
    const consent = repository.findActiveForAttempt(scope, input.importAttemptId);
    if (!consent) return null;
    const object = repository.findOwnedSupportObject(scope, consent.supportConsentId);
    if (!object || object.sourceFileSha256 !== sourceFileSha256 ||
      object.sourceFileSizeBytes !== input.sourceBytes.byteLength) {
      platformFailure("TRADERLINK_JOURNAL_IMPORT_CONFLICT", {
        reason: "support_source_retry_mismatch",
      });
    }
    return summary(repository, scope, consent);
  });
  if (existing) return existing;

  const vault = resolveJournalSupportSourceVault({
    databasePath,
    environment: input.environment,
  });
  const stored = writeJournalSupportSource(vault, input.sourceBytes);
  try {
    return withPlatformDatabase({ mode: "runtime", databasePath }, (database) => {
      const attempts = new JournalImportAttemptRepository(database);
      const repository = new JournalSupportConsentRepository(database);
      return repository.immediate(() => {
        const attempt = attempts.findById(scope, input.importAttemptId);
        if (!attempt || attempt.sourceFileSha256 !== stored.sourceFileSha256 ||
          attempt.sourceFileSizeBytes !== stored.sourceFileSizeBytes ||
          ["committing", "committed", "committed_with_decisions", "duplicate"]
            .includes(attempt.currentState)) {
          platformFailure("TRADERLINK_JOURNAL_IMPORT_CONFLICT", {
            reason: "support_source_attempt_unavailable",
          });
        }
        const supportObjectId = repository.createSupportObject({
          scope,
          importAttemptId: input.importAttemptId,
          objectKey: stored.objectKey,
          sourceFileSha256: stored.sourceFileSha256,
          sourceFileSizeBytes: stored.sourceFileSizeBytes,
          sourceMimeType: mimeType,
          expiresAtUtc,
          timestamp,
        });
        const consent = repository.grant({
          scope,
          sourceKind: "support_object",
          importBatchId: null,
          supportObjectId,
          expiresAtUtc,
          timestamp,
        });
        return summary(repository, scope, consent);
      });
    });
  } catch (error) {
    purgeJournalSupportSource({
      vault,
      objectKey: stored.objectKey,
      expectedSha256: stored.sourceFileSha256,
      expectedSizeBytes: stored.sourceFileSizeBytes,
      purgedAtUtc: timestamp,
    });
    throw error;
  }
}

export function grantJournalCommittedImportSupportConsent(
  scope: WorkspaceAccessScope,
  input: Readonly<{
    importBatchId: string;
    retentionDays?: number;
    now?: Date;
    environment?: NodeJS.ProcessEnv;
  }>,
): JournalSupportConsentSummary {
  const now = input.now ?? new Date();
  const timestamp = createCanonicalUtcTimestamp(now);
  return withPlatformDatabase({ mode: "runtime", environment: input.environment }, (database) => {
    const repository = new JournalSupportConsentRepository(database);
    const existing = repository.findActiveForImportBatch(scope, input.importBatchId);
    if (existing) return summary(repository, scope, existing);
    const consent = repository.grant({
      scope,
      sourceKind: "committed_evidence",
      importBatchId: input.importBatchId,
      supportObjectId: null,
      expiresAtUtc: expiry(now, input.retentionDays),
      timestamp,
    });
    return summary(repository, scope, consent);
  });
}

function purgeEndedConsent(
  scope: WorkspaceAccessScope,
  consent: JournalSupportConsentRecord,
  timestamp: string,
  environment?: NodeJS.ProcessEnv,
): JournalSupportConsentSummary {
  if (consent.sourceKind === "committed_evidence") {
    return Object.freeze({
      supportConsentId: consent.supportConsentId,
      sourceKind: consent.sourceKind,
      state: consent.state,
      revision: consent.revision,
      expiresAtUtc: consent.expiresAtUtc,
      purgeState: "not_applicable",
    });
  }
  const databasePath = resolvePlatformDatabaseConfig({ environment }).databasePath;
  const object = withPlatformDatabase({ mode: "runtime", databasePath }, (database) =>
    new JournalSupportConsentRepository(database)
      .findOwnedSupportObject(scope, consent.supportConsentId));
  if (!object) platformFailure("TRADERLINK_JOURNAL_IMPORT_CONFLICT", {
    reason: "support_object_missing",
  });
  const vault = resolveJournalSupportSourceVault({ databasePath, environment });
  let receipt: string;
  try {
    receipt = purgeJournalSupportSource({
      vault,
      objectKey: object.objectKey,
      expectedSha256: object.sourceFileSha256,
      expectedSizeBytes: object.sourceFileSizeBytes,
      purgedAtUtc: timestamp,
    });
  } catch {
    return withPlatformDatabase({ mode: "runtime", databasePath }, (database) => {
      const repository = new JournalSupportConsentRepository(database);
      repository.recordSupportObjectPurgeFailed({
        scope,
        supportConsentId: consent.supportConsentId,
        timestamp,
      });
      return summary(
        repository,
        scope,
        repository.findOwned(scope, consent.supportConsentId)!,
      );
    });
  }
  return withPlatformDatabase({ mode: "runtime", databasePath }, (database) => {
    const repository = new JournalSupportConsentRepository(database);
    repository.recordSupportObjectPurged({
      scope,
      supportConsentId: consent.supportConsentId,
      purgeReceiptSha256: receipt,
      timestamp,
    });
    return summary(
      repository,
      scope,
      repository.findOwned(scope, consent.supportConsentId)!,
    );
  });
}

export function revokeJournalSupportConsent(
  scope: WorkspaceAccessScope,
  input: Readonly<{
    supportConsentId: string;
    expectedRevision: number;
    now?: Date;
    environment?: NodeJS.ProcessEnv;
  }>,
): JournalSupportConsentSummary {
  const timestamp = createCanonicalUtcTimestamp(input.now ?? new Date());
  const consent = withPlatformDatabase({
    mode: "runtime",
    environment: input.environment,
  }, (database) =>
    new JournalSupportConsentRepository(database).revoke({
      scope,
      supportConsentId: input.supportConsentId,
      expectedRevision: input.expectedRevision,
      timestamp,
    }));
  return purgeEndedConsent(scope, consent, timestamp, input.environment);
}

export function expireJournalSupportConsent(
  scope: WorkspaceAccessScope,
  input: Readonly<{
    supportConsentId: string;
    expectedRevision: number;
    now?: Date;
    environment?: NodeJS.ProcessEnv;
  }>,
): JournalSupportConsentSummary {
  const timestamp = createCanonicalUtcTimestamp(input.now ?? new Date());
  const consent = withPlatformDatabase({
    mode: "runtime",
    environment: input.environment,
  }, (database) =>
    new JournalSupportConsentRepository(database).expire({
      scope,
      supportConsentId: input.supportConsentId,
      expectedRevision: input.expectedRevision,
      timestamp,
    }));
  return purgeEndedConsent(scope, consent, timestamp, input.environment);
}
