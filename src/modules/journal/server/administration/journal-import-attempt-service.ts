import { createHash } from "node:crypto";

import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { withPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import {
  createCanonicalUtcTimestamp,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";
import type { JournalImportMappingPreview } from "../product/journal-import-product-service";
import type { JournalMappingSupportPackageV2 } from "../product/journal-mapping-support-package";
import { loadJournalPrivacyHmacConfiguration } from "../imports/journal-import-service";
import { normalizeJournalConfirmedBrokerName } from "../imports/journal-generic-mapped-statement-adapter";
import { deriveJournalImportAttemptDigests } from "./journal-import-attempt-authority";
import {
  JournalImportAttemptRepository,
  type JournalImportAttemptRecord,
} from "./journal-import-attempt-repository";
import {
  JournalStatementFormatRepository,
  type JournalStatementFormatObservationOutcome,
} from "./journal-statement-format-repository";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export type JournalImportAttemptContext = Readonly<{
  attempt: JournalImportAttemptRecord;
  attemptBindingSha256: string;
  correlationRefSha256: string;
}>;

function applicationVersion(environment: NodeJS.ProcessEnv): string {
  const value = environment.TRADERLINK_PLATFORM_APPLICATION_VERSION ??
    environment.VERCEL_GIT_COMMIT_SHA ??
    environment.npm_package_version ??
    "local_development";
  return value.trim().slice(0, 120) || "local_development";
}

export function resolveJournalImportAttemptDigests(
  scope: WorkspaceAccessScope,
  browserIdempotencyRef: string,
): Readonly<{
  requestIdempotencySha256: string;
  correlationRefSha256: string;
}> {
  return deriveJournalImportAttemptDigests({
    configuration: loadJournalPrivacyHmacConfiguration(),
    scope,
    browserIdempotencyRef,
  });
}

export function beginJournalImportAttempt(
  scope: WorkspaceAccessScope,
  input: Readonly<{
    sourceBytes: Uint8Array;
    browserIdempotencyRef: string;
    safeBrokerLabel?: string | null;
    now?: Date;
    environment?: NodeJS.ProcessEnv;
  }>,
): JournalImportAttemptContext {
  const timestamp = createCanonicalUtcTimestamp(input.now ?? new Date());
  const environment = input.environment ?? process.env;
  const digests = deriveJournalImportAttemptDigests({
    configuration: loadJournalPrivacyHmacConfiguration(environment),
    scope,
    browserIdempotencyRef: input.browserIdempotencyRef,
  });
  const sourceFileSha256 = createHash("sha256")
    .update(input.sourceBytes)
    .digest("hex");
  return withPlatformDatabase({ mode: "runtime" }, (database) => {
    const repository = new JournalImportAttemptRepository(database);
    return repository.immediate(() => {
      repository.activateEpoch({
        applicationVersion: applicationVersion(environment),
        timestamp,
      });
      let attempt = repository.admit({
        scope,
        requestIdempotencySha256: digests.requestIdempotencySha256,
        sourceFileSha256,
        sourceFileSizeBytes: input.sourceBytes.byteLength,
        fileKind: "text_csv",
        safeBrokerLabel: input.safeBrokerLabel === null || input.safeBrokerLabel === undefined
          ? null
          : normalizeJournalConfirmedBrokerName(input.safeBrokerLabel),
        correlationRefSha256: digests.correlationRefSha256,
        timestamp,
      });
      if (["received", "awaiting_mapping", "preview_ready"].includes(
        attempt.currentState,
      )) {
        attempt = repository.transition({
          scope,
          importAttemptId: attempt.importAttemptId,
          expectedRevision: attempt.revision,
          nextState: "inspecting",
          reasonCode: attempt.currentState === "received"
            ? "inspection_started"
            : "inspection_resumed",
          correlationRefSha256: digests.correlationRefSha256,
          timestamp,
        });
      } else if (attempt.currentState !== "inspecting") {
        platformFailure("TRADERLINK_JOURNAL_IMPORT_CONFLICT", {
          reason: "attempt_not_resumable",
        });
      }
      return Object.freeze({
        attempt,
        attemptBindingSha256: digests.requestIdempotencySha256,
        correlationRefSha256: digests.correlationRefSha256,
      });
    });
  });
}

function observationOutcome(
  package_: JournalMappingSupportPackageV2,
  preview: JournalImportMappingPreview | null,
): JournalStatementFormatObservationOutcome {
  if (package_.privacy.privacyReviewRequired) return "privacy_review_required";
  if (!preview) return "awaiting_mapping";
  if (preview.mappingOrigin === "verified_adapter") return "known_format";
  if (preview.mappingOrigin === "saved_exact_template") return "saved_mapping";
  return "manual_mapping";
}

export function finishJournalImportPreview(
  scope: WorkspaceAccessScope,
  input: Readonly<{
    context: JournalImportAttemptContext;
    package: JournalMappingSupportPackageV2;
    preview: JournalImportMappingPreview | null;
    safeMappingContract: unknown;
    now?: Date;
  }>,
): JournalImportAttemptRecord {
  const now = input.now ?? new Date();
  const timestamp = createCanonicalUtcTimestamp(now);
  const resumableUntilUtc = createCanonicalUtcTimestamp(
    new Date(now.getTime() + SEVEN_DAYS_MS),
  );
  return withPlatformDatabase({ mode: "runtime" }, (database) => {
    const attempts = new JournalImportAttemptRepository(database);
    const formats = new JournalStatementFormatRepository(database);
    return attempts.immediate(() => {
      const nextState = input.preview ? "preview_ready" : "awaiting_mapping";
      const preview = input.preview;
      const updated = attempts.transition({
        scope,
        importAttemptId: input.context.attempt.importAttemptId,
        expectedRevision: input.context.attempt.revision,
        nextState,
        reasonCode: input.preview ? "preview_ready" : "mapping_needed",
        correlationRefSha256: input.context.correlationRefSha256,
        timestamp,
        resumableUntilUtc,
        adapterId: preview?.commitKind === "ibkr"
          ? "ibkr_activity_statement"
          : preview ? "generic_mapped_statement" : null,
        adapterVersion: preview?.adapter ?? null,
        parserVersion: preview?.parserVersion ?? null,
        mappingVersion: preview?.mappingVersion ?? null,
        counts: preview ? {
          preserved_rows: preview.preservedRowCount,
          mapped_executions: preview.mappedExecutionCount,
          unsupported_rows: preview.unsupportedRowCount,
          issues: preview.issues.length,
          pending_decisions: preview.expectedPendingDecisionCount,
        } : {},
      });
      formats.recordAttemptObservation({
        scope,
        importAttemptId: updated.importAttemptId,
        package: input.package,
        outcome: observationOutcome(input.package, preview),
        safeMappingContract: input.safeMappingContract,
        timestamp,
      });
      return updated;
    });
  });
}

export function failJournalImportAttempt(
  scope: WorkspaceAccessScope,
  context: JournalImportAttemptContext,
  reasonCode: string,
  now: Date = new Date(),
): void {
  const timestamp = createCanonicalUtcTimestamp(now);
  withPlatformDatabase({ mode: "runtime" }, (database) => {
    const attempts = new JournalImportAttemptRepository(database);
    const current = attempts.findById(scope, context.attempt.importAttemptId);
    if (!current || current.currentState !== "inspecting") return;
    attempts.transition({
      scope,
      importAttemptId: current.importAttemptId,
      expectedRevision: current.revision,
      nextState: "system_failed",
      reasonCode: "inspection_failed",
      failureCode: reasonCode,
      correlationRefSha256: context.correlationRefSha256,
      timestamp,
    });
  });
}
