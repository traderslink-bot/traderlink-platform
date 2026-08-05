import { createHash } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { JOURNAL_ADMIN_PERMISSIONS } from "@/src/modules/platform/contracts/journal-admin-scope";
import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { PlatformDiscordSignInService } from "@/src/modules/platform/server/authentication/platform-discord-sign-in-service";
import { openPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { runPlatformMigrations } from "@/src/modules/platform/server/database/run-platform-migrations";
import {
  createJournalMappingSupportPackage,
  createJournalMappingSupportPackageV2,
} from "../product/journal-mapping-support-package";
import { JournalImportAttemptRepository } from "./journal-import-attempt-repository";
import { JournalConsentedSourceDownloadService } from "./journal-consented-source-download-service";
import { JournalDeveloperPackageService } from "./journal-developer-package-service";
import { JournalStatementFormatRepository } from "./journal-statement-format-repository";
import { JournalStatementFormatCommandService } from "./journal-statement-format-command-service";
import { JournalSupportConsentRepository } from "./journal-support-consent-repository";

const roots: string[] = [];
const NOW = "2026-08-03T12:00:00.000Z";

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

function setup() {
  const root = mkdtempSync(join(tmpdir(), "traderlink-admin-format-command-"));
  roots.push(root);
  const databasePath = join(root, "test.sqlite");
  const database = openPlatformDatabase({
    mode: "initializer",
    databasePath,
    forbiddenRepositoryRoots: [],
  });
  runPlatformMigrations(database, { now: () => new Date(NOW) });
  const signIn = new PlatformDiscordSignInService(database, {
    now: () => new Date(NOW),
  }).signIn({
    authSubject: "123456789012345678",
    username: "owner",
    globalDisplayName: "Journal Owner",
    avatarHash: null,
    guildId: "987654321098765432",
    roleIds: [],
    guildOwner: true,
    joinedAtUtc: null,
  });
  const journalScope: WorkspaceAccessScope = Object.freeze({
    userId: signIn.userId,
    workspaceId: signIn.workspaceId,
    workspaceRole: "owner",
    allowedAccountIds: signIn.allowedAccountIds,
    activeAccountId: signIn.allowedAccountIds[0]!,
  });
  const adminScope = Object.freeze({
    userId: signIn.userId,
    role: "development_journal_owner_admin" as const,
    mode: "local_development_owner" as const,
    authorizedAtUtc: NOW,
    discordOwnerVerifiedAtUtc: null,
    permissions: JOURNAL_ADMIN_PERMISSIONS,
  });
  new JournalImportAttemptRepository(database).activateEpoch({
    applicationVersion: "format-command-test",
    timestamp: NOW,
  });
  return { database, databasePath, journalScope, adminScope };
}

function observe(
  database: ReturnType<typeof openPlatformDatabase>,
  scope: WorkspaceAccessScope,
  ordinal: string,
  source: string,
) {
  const attempt = new JournalImportAttemptRepository(database).admit({
    scope,
    requestIdempotencySha256: ordinal.repeat(64),
    sourceFileSha256: ordinal.toUpperCase().repeat(64).toLowerCase(),
    sourceFileSizeBytes: Buffer.byteLength(source),
    fileKind: "csv",
    safeBrokerLabel: "Example Broker",
    correlationRefSha256: (ordinal === "a" ? "c" : "d").repeat(64),
    timestamp: NOW,
  });
  const package_ = createJournalMappingSupportPackageV2(
    createJournalMappingSupportPackage({
      sourceBytes: Buffer.from(source, "utf8"),
      brokerName: "Example Broker",
      failureCode: "none",
    }),
  );
  const observed = new JournalStatementFormatRepository(database)
    .recordAttemptObservation({
      scope,
      importAttemptId: attempt.importAttemptId,
      package: package_,
      outcome: "manual_mapping",
      safeMappingContract: package_.tables[0]?.suggestedMapping ?? {},
      timestamp: NOW,
    });
  return { candidateId: observed.candidateId!, package_ };
}

describe("Journal statement format commands", () => {
  it("downloads only an active consented source and records one completed disclosure", () => {
    const { database, databasePath, journalScope, adminScope } = setup();
    try {
      const sourceBytes = Buffer.from(
        "Symbol,Date,Side,Quantity,Price\nABCD,2026-08-01,Buy,10,12.34\n",
        "utf8",
      );
      const sourceFileSha256 = createHash("sha256").update(sourceBytes).digest("hex");
      const attempt = new JournalImportAttemptRepository(database).admit({
        scope: journalScope,
        requestIdempotencySha256: "e".repeat(64),
        sourceFileSha256,
        sourceFileSizeBytes: sourceBytes.byteLength,
        fileKind: "csv",
        safeBrokerLabel: "Example Broker",
        correlationRefSha256: "f".repeat(64),
        timestamp: NOW,
      });
      const consents = new JournalSupportConsentRepository(database);
      const supportObjectId = consents.createSupportObject({
        scope: journalScope,
        importAttemptId: attempt.importAttemptId,
        objectKey: "safe_support_object_key_1234567890",
        sourceFileSha256,
        sourceFileSizeBytes: sourceBytes.byteLength,
        sourceMimeType: "text/csv",
        expiresAtUtc: "2026-09-01T12:00:00.000Z",
        timestamp: NOW,
      });
      consents.grant({
        scope: journalScope,
        sourceKind: "support_object",
        importBatchId: null,
        supportObjectId,
        expiresAtUtc: "2026-09-01T12:00:00.000Z",
        timestamp: NOW,
      });
      const service = new JournalConsentedSourceDownloadService({
        database,
        databasePath,
        scope: adminScope,
        sourceReader: () => sourceBytes,
      });
      const result = service.download({
        kind: "import_attempt",
        internalId: attempt.importAttemptId,
        importRef: "jadmin1.import_attempt.test.safe-reference",
        reasonCode: "importer_diagnostics",
        correlationRefSha256: "0".repeat(64),
        timestamp: "2026-08-03T12:00:01.000Z",
      });
      expect(Buffer.from(result.bytes)).toEqual(sourceBytes);
      expect(result.filename).not.toContain(attempt.importAttemptId);
      expect(result.replayed).toBe(false);
      expect(service.download({
        kind: "import_attempt",
        internalId: attempt.importAttemptId,
        importRef: "jadmin1.import_attempt.test.safe-reference",
        reasonCode: "importer_diagnostics",
        correlationRefSha256: "0".repeat(64),
        timestamp: "2026-08-03T12:00:01.000Z",
      }).replayed).toBe(true);
      expect(database.prepare(`SELECT completed_download_count, revision
FROM journal_statement_support_consents`).get()).toEqual({
        completed_download_count: 1,
        revision: 2,
      });
      expect(database.prepare(`SELECT COUNT(*) AS count
FROM journal_statement_support_consent_events`).get()).toEqual({ count: 3 });
      expect(database.prepare(`SELECT COUNT(*) AS count
FROM platform_admin_audit_events
WHERE action = 'consented_source_downloaded' AND outcome = 'success'`).get())
        .toEqual({ count: 1 });
    } finally {
      database.close();
    }
  });

  it("creates a fixed privacy-safe package without statement values", () => {
    const { database, journalScope, adminScope } = setup();
    try {
      const { candidateId } = observe(
        database,
        journalScope,
        "a",
        "Symbol,Date,Time,Side,Quantity,Price\nPRIVATE,2026-08-01,09:30:00,Buy,27,432.19\n",
      );
      const service = new JournalDeveloperPackageService({
        database,
        scope: adminScope,
      });
      const result = service.create({
        candidateId,
        candidateRef: "jadmin1.statement_format.test.safe-reference",
        expectedRevision: 1,
        correlationRefSha256: "9".repeat(64),
        timestamp: "2026-08-03T12:00:09.000Z",
      });
      const archiveText = Buffer.from(result.bytes).toString("utf8");
      expect(Buffer.from(result.bytes).subarray(0, 2).toString("ascii")).toBe("PK");
      expect(archiveText).toContain("manifest.json");
      expect(archiveText).toContain("fixture-skeleton.csv");
      expect(archiveText).toContain("SYMBOL");
      expect(archiveText).not.toContain("PRIVATE");
      expect(archiveText).not.toContain("432.19");
      expect(archiveText).not.toContain(journalScope.userId);
      expect(archiveText).not.toContain(journalScope.workspaceId);
      expect(archiveText).not.toContain(journalScope.activeAccountId!);
      expect(service.create({
        candidateId,
        candidateRef: "jadmin1.statement_format.test.safe-reference",
        expectedRevision: 1,
        correlationRefSha256: "9".repeat(64),
        timestamp: "2026-08-03T12:00:09.000Z",
      }).replayed).toBe(true);
      expect(database.prepare(`SELECT COUNT(*) AS count
FROM platform_admin_audit_events
WHERE action = 'developer_package_created'`).get()).toEqual({ count: 1 });
    } finally {
      database.close();
    }
  });

  it("advances only with evidence, replays safely and gates supported on deployed code", () => {
    const { database, journalScope, adminScope } = setup();
    try {
      const { candidateId, package_ } = observe(
        database,
        journalScope,
        "a",
        "Symbol,Date,Time,Side,Quantity,Price\nABCD,2026-08-01,09:30:00,Buy,10,12.34\n",
      );
      const service = new JournalStatementFormatCommandService({
        database,
        scope: adminScope,
      });
      const mapping = service.transition({
        candidateId,
        expectedRevision: 1,
        newState: "mapping_available",
        correlationRefSha256: "1".repeat(64),
        timestamp: "2026-08-03T12:00:01.000Z",
      });
      expect(mapping).toEqual({ state: "mapping_available", revision: 2, replayed: false });
      expect(service.transition({
        candidateId,
        expectedRevision: 1,
        newState: "mapping_available",
        correlationRefSha256: "1".repeat(64),
        timestamp: "2026-08-03T12:00:01.000Z",
      })).toEqual({ state: "mapping_available", revision: 2, replayed: true });
      expect(() => service.transition({
        candidateId,
        expectedRevision: 1,
        newState: "mapping_available",
        correlationRefSha256: "2".repeat(64),
        timestamp: "2026-08-03T12:00:02.000Z",
      })).toThrowError("TRADERLINK_JOURNAL_ADMIN_AUTHORITY_CONFLICT");

      const ready = service.transition({
        candidateId,
        expectedRevision: 2,
        newState: "ready_for_development",
        correlationRefSha256: "3".repeat(64),
        timestamp: "2026-08-03T12:00:03.000Z",
      });
      const developing = service.transition({
        candidateId,
        expectedRevision: ready.revision,
        newState: "in_development",
        correlationRefSha256: "4".repeat(64),
        timestamp: "2026-08-03T12:00:04.000Z",
      });
      const validating = service.transition({
        candidateId,
        expectedRevision: developing.revision,
        newState: "validating",
        correlationRefSha256: "5".repeat(64),
        timestamp: "2026-08-03T12:00:05.000Z",
      });
      expect(() => service.transition({
        candidateId,
        expectedRevision: validating.revision,
        newState: "supported",
        correlationRefSha256: "6".repeat(64),
        timestamp: "2026-08-03T12:00:06.000Z",
      })).toThrowError("TRADERLINK_JOURNAL_ADMIN_AUTHORITY_CONFLICT");

      const deployed = new JournalStatementFormatCommandService({
        database,
        scope: adminScope,
        registry: [{
          statementLayoutSha256: package_.statementLayoutSignatureSha256!,
          tableSignatures: package_.tables.map((table) => table.structuralSignatureSha256),
          adapterId: "example_csv",
          adapterVersion: "example_csv_v1",
          fixtureSha256: "f".repeat(64),
        }],
      }).transition({
        candidateId,
        expectedRevision: validating.revision,
        newState: "supported",
        correlationRefSha256: "7".repeat(64),
        timestamp: "2026-08-03T12:00:07.000Z",
      });
      expect(deployed).toEqual({ state: "supported", revision: 6, replayed: false });
      expect(database.prepare(`SELECT COUNT(*) AS count
FROM platform_admin_audit_events
WHERE action = 'statement_format_transitioned'`).get()).toEqual({ count: 5 });
    } finally {
      database.close();
    }
  });

  it("aliases a duplicate without moving observations and rejects a stale merge", () => {
    const { database, journalScope, adminScope } = setup();
    try {
      const duplicate = observe(
        database,
        journalScope,
        "a",
        "Symbol,Date,Side,Quantity,Price\nABCD,2026-08-01,Buy,10,12.34\n",
      );
      const retained = observe(
        database,
        journalScope,
        "b",
        "Ticker,Date,Action,Shares,Price\nABCD,2026-08-01,Buy,10,12.34\n",
      );
      const service = new JournalStatementFormatCommandService({
        database,
        scope: adminScope,
      });
      const result = service.merge({
        duplicateCandidateId: duplicate.candidateId,
        retainedCandidateId: retained.candidateId,
        expectedDuplicateRevision: 1,
        expectedRetainedRevision: 1,
        correlationRefSha256: "8".repeat(64),
        timestamp: "2026-08-03T12:00:08.000Z",
      });
      expect(result).toEqual({
        duplicateState: "duplicate",
        duplicateRevision: 2,
        retainedRevision: 1,
        replayed: false,
      });
      expect(service.merge({
        duplicateCandidateId: duplicate.candidateId,
        retainedCandidateId: retained.candidateId,
        expectedDuplicateRevision: 1,
        expectedRetainedRevision: 1,
        correlationRefSha256: "8".repeat(64),
        timestamp: "2026-08-03T12:00:08.000Z",
      }).replayed).toBe(true);
      expect(database.prepare(`SELECT COUNT(*) AS count
FROM journal_statement_format_observations`).get()).toEqual({ count: 2 });
      expect(database.prepare(`SELECT COUNT(*) AS count
FROM journal_statement_format_candidate_aliases`).get()).toEqual({ count: 1 });
    } finally {
      database.close();
    }
  });
});
