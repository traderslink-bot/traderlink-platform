import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { PlatformDiscordSignInService } from "@/src/modules/platform/server/authentication/platform-discord-sign-in-service";
import { openPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { runPlatformMigrations } from "@/src/modules/platform/server/database/run-platform-migrations";
import {
  createJournalMappingSupportPackage,
  createJournalMappingSupportPackageV2,
} from "../product/journal-mapping-support-package";
import { JournalImportAttemptRepository } from "./journal-import-attempt-repository";
import { JournalStatementFormatRepository } from "./journal-statement-format-repository";

const roots: string[] = [];
const START = "2026-08-03T08:00:00.000Z";
const CORRELATION = "d".repeat(64);

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

function setup(): Readonly<{
  database: ReturnType<typeof openPlatformDatabase>;
  scope: WorkspaceAccessScope;
  attempts: JournalImportAttemptRepository;
}> {
  const root = mkdtempSync(join(tmpdir(), "traderlink-format-observation-"));
  roots.push(root);
  const database = openPlatformDatabase({
    mode: "initializer",
    databasePath: join(root, "test.sqlite"),
    forbiddenRepositoryRoots: [],
  });
  runPlatformMigrations(database, { now: () => new Date(START) });
  const signIn = new PlatformDiscordSignInService(database, {
    now: () => new Date(START),
  }).signIn({
    authSubject: "123456789012345678",
    username: "journal-owner",
    globalDisplayName: "Journal Owner",
    avatarHash: null,
    guildId: "987654321098765432",
    roleIds: [],
    guildOwner: true,
    joinedAtUtc: null,
  });
  const scope: WorkspaceAccessScope = Object.freeze({
    userId: signIn.userId,
    workspaceId: signIn.workspaceId,
    workspaceRole: "owner",
    allowedAccountIds: signIn.allowedAccountIds,
    activeAccountId: signIn.allowedAccountIds[0]!,
  });
  const attempts = new JournalImportAttemptRepository(database);
  attempts.activateEpoch({ applicationVersion: "test", timestamp: START });
  return Object.freeze({ database, scope, attempts });
}

function admit(
  attempts: JournalImportAttemptRepository,
  scope: WorkspaceAccessScope,
  ordinal: string,
  timestamp: string,
): string {
  return attempts.admit({
    scope,
    requestIdempotencySha256: ordinal.repeat(64),
    sourceFileSha256: ordinal.toUpperCase().repeat(64).toLowerCase(),
    sourceFileSizeBytes: 100,
    fileKind: "csv",
    safeBrokerLabel: "Example Broker",
    correlationRefSha256: CORRELATION,
    timestamp,
  }).importAttemptId;
}

function packageFor(rows: readonly string[], brokerName = "Example Broker") {
  return createJournalMappingSupportPackageV2(createJournalMappingSupportPackage({
    sourceBytes: Buffer.from([
      "Trade Time,Ticker,Action,Filled Qty,Fill Price",
      ...rows,
    ].join("\n")),
    brokerName,
    failureCode: "none",
  }));
}

describe("Journal statement format repository", () => {
  it("groups safe observations by exact layout without duplicating retry evidence", () => {
    const { database, scope, attempts } = setup();
    try {
      const repository = new JournalStatementFormatRepository(database);
      const firstAttemptId = admit(attempts, scope, "a", START);
      const firstPackage = packageFor([
        "2026-08-03 09:30:00,TEST,Buy,10,1.25",
      ]);
      const first = repository.recordAttemptObservation({
        scope,
        importAttemptId: firstAttemptId,
        package: firstPackage,
        outcome: "awaiting_mapping",
        safeMappingContract: null,
        timestamp: "2026-08-03T08:00:01.000Z",
      });
      expect(first.candidateId).not.toBeNull();
      expect(repository.recordAttemptObservation({
        scope,
        importAttemptId: firstAttemptId,
        package: firstPackage,
        outcome: "awaiting_mapping",
        safeMappingContract: null,
        timestamp: "2026-08-03T08:00:02.000Z",
      })).toMatchObject({ alreadyRecorded: true, candidateId: first.candidateId });

      const secondAttemptId = admit(
        attempts,
        scope,
        "b",
        "2026-08-03T08:01:00.000Z",
      );
      const second = repository.recordAttemptObservation({
        scope,
        importAttemptId: secondAttemptId,
        package: packageFor([
          "2026-08-04 10:00:00,OTHER,Sell,1,99.10",
          "2026-08-04 10:01:00,OTHER,Buy,1,98.75",
        ]),
        outcome: "manual_mapping",
        safeMappingContract: { mappingKind: "user_confirmed" },
        timestamp: "2026-08-03T08:01:01.000Z",
      });
      expect(second.candidateId).toBe(first.candidateId);
      expect(database.prepare("SELECT COUNT(*) AS count FROM journal_statement_format_candidates").get())
        .toEqual({ count: 1 });
      expect(database.prepare("SELECT COUNT(*) AS count FROM journal_statement_format_observations").get())
        .toEqual({ count: 2 });
      expect(database.prepare("SELECT COUNT(*) AS count FROM journal_statement_format_candidate_events").get())
        .toEqual({ count: 1 });
    } finally {
      database.close();
    }
  });

  it("keeps unsafe headings ungrouped with placeholders", () => {
    const { database, scope, attempts } = setup();
    try {
      const repository = new JournalStatementFormatRepository(database);
      const attemptId = admit(attempts, scope, "e", START);
      const package_ = createJournalMappingSupportPackageV2(
        createJournalMappingSupportPackage({
          sourceBytes: Buffer.from([
            "Trade Time,ACCOUNT-99887766,Ticker,Action,Filled Qty,Fill Price",
            "2026-08-03 09:30:00,private,TEST,Buy,10,1.25",
          ].join("\n")),
          brokerName: "Example Broker",
          failureCode: "none",
        }),
      );
      const recorded = repository.recordAttemptObservation({
        scope,
        importAttemptId: attemptId,
        package: package_,
        outcome: "privacy_review_required",
        safeMappingContract: null,
        timestamp: "2026-08-03T08:00:01.000Z",
      });
      expect(recorded).toMatchObject({
        candidateId: null,
        statementLayoutSha256: null,
        privacyReviewRequired: true,
      });
      const stored = database.prepare(`SELECT sanitized_structure_json
FROM journal_statement_format_observations`).get() as {
        sanitized_structure_json: string;
      };
      expect(stored.sanitized_structure_json).not.toContain("99887766");
      expect(stored.sanitized_structure_json).toContain("Column 2");
      expect(database.prepare("SELECT COUNT(*) AS count FROM journal_statement_format_candidates").get())
        .toEqual({ count: 0 });
    } finally {
      database.close();
    }
  });
});
