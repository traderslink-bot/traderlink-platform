import { existsSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { PlatformDiscordSignInService } from "@/src/modules/platform/server/authentication/platform-discord-sign-in-service";
import { openPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { runPlatformMigrations } from "@/src/modules/platform/server/database/run-platform-migrations";
import {
  beginJournalImportAttempt,
  finishJournalImportPreview,
} from "../administration/journal-import-attempt-service";
import { mappingContractFromSupportTable } from "../imports/journal-generic-mapped-statement-adapter";
import {
  createJournalMappingSupportPackage,
  createJournalMappingSupportPackageV2,
  sanitizeJournalInternalMappingContractForV2,
} from "./journal-mapping-support-package";
import {
  commitJournalGenericMappedUpload,
  previewJournalGenericMappedUpload,
} from "./journal-import-product-service";

const roots: string[] = [];
const START = new Date("2026-08-03T08:30:00.000Z");
const BROWSER_REF = "50000000-0000-4000-8000-000000000005";

afterEach(() => {
  vi.unstubAllEnvs();
  for (const root of roots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

function setup(): Readonly<{
  databasePath: string;
  evidenceRoot: string;
  scope: WorkspaceAccessScope;
}> {
  const root = mkdtempSync(join(tmpdir(), "traderlink-product-import-"));
  roots.push(root);
  const databaseRoot = join(root, "database");
  const evidenceRoot = join(root, "evidence");
  const stagingRoot = join(root, "staging");
  const protectedRoot = join(root, "protected");
  for (const path of [databaseRoot, evidenceRoot, stagingRoot, protectedRoot]) {
    mkdirSync(path);
  }
  const databasePath = join(databaseRoot, "test.sqlite");
  const database = openPlatformDatabase({
    mode: "initializer",
    databasePath,
    forbiddenRepositoryRoots: [],
  });
  runPlatformMigrations(database, { now: () => START });
  const signIn = new PlatformDiscordSignInService(database, {
    now: () => START,
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
  database.close();
  vi.stubEnv("TRADERLINK_PLATFORM_DB_PATH", databasePath);
  vi.stubEnv("TRADERLINK_PLATFORM_JOURNAL_HMAC_ACTIVE_KEY_VERSION", "key1");
  vi.stubEnv(
    "TRADERLINK_PLATFORM_JOURNAL_HMAC_KEYS_JSON",
    JSON.stringify({ key1: Buffer.alloc(32, 11).toString("base64") }),
  );
  vi.stubEnv("TRADERLINK_PLATFORM_APPLICATION_VERSION", "product-import-test");
  vi.stubEnv("TRADERLINK_PLATFORM_ACCOUNT_IDENTITY_ACTIVE_KEY_VERSION", "key1");
  vi.stubEnv(
    "TRADERLINK_PLATFORM_ACCOUNT_IDENTITY_HMAC_KEYS_JSON",
    JSON.stringify({ key1: Buffer.alloc(32, 12).toString("base64") }),
  );
  vi.stubEnv("TRADERLINK_PLATFORM_JOURNAL_UPLOAD_STAGING_ROOT", stagingRoot);
  vi.stubEnv("TRADERLINK_PLATFORM_JOURNAL_EVIDENCE_VAULT_ROOT", evidenceRoot);
  vi.stubEnv(
    "TRADERLINK_PLATFORM_JOURNAL_PROTECTED_STORAGE_ROOTS_JSON",
    JSON.stringify([protectedRoot]),
  );
  return Object.freeze({
    databasePath,
    evidenceRoot,
    scope: Object.freeze({
      userId: signIn.userId,
      workspaceId: signIn.workspaceId,
      workspaceRole: "owner" as const,
      allowedAccountIds: signIn.allowedAccountIds,
      activeAccountId: signIn.allowedAccountIds[0]!,
    }),
  });
}

describe("Journal import product service", () => {
  it("commits one previewed attempt atomically and returns the terminal retry", () => {
    const { databasePath, evidenceRoot, scope } = setup();
    const sourceBytes = Buffer.from([
      "Trade Time,Ticker,Action,Filled Qty,Fill Price,Fees",
      "2026-08-03 09:30:00,TEST,Buy,10,1.25,0.10",
      "2026-08-03 10:30:00,TEST,Sell,10,1.35,0.10",
    ].join("\n"));
    const inspection = createJournalMappingSupportPackage({
      sourceBytes,
      brokerName: "Example Broker",
      failureCode: "none",
    });
    const browserPackage = createJournalMappingSupportPackageV2(inspection);
    const mapping = mappingContractFromSupportTable({
      brokerName: "Example Broker",
      sourceTimezone: "America/New_York",
      defaultCurrency: "USD",
      table: inspection.tables[0]!,
      delimiter: inspection.detectedDelimiter,
      columns: {
        timestamp: "Trade Time",
        symbol: "Ticker",
        side: "Action",
        quantity: "Filled Qty",
        price: "Fill Price",
        fees: "Fees",
      },
    });
    const context = beginJournalImportAttempt(scope, {
      sourceBytes,
      browserIdempotencyRef: BROWSER_REF,
      now: START,
    });
    const preview = previewJournalGenericMappedUpload(scope, {
      sourceBytes,
      mapping,
      attemptBindingSha256: context.attemptBindingSha256,
    });
    expect(preview).toMatchObject({ canCommit: true, mappedExecutionCount: 2 });
    finishJournalImportPreview(scope, {
      context,
      package: browserPackage,
      preview,
      safeMappingContract: sanitizeJournalInternalMappingContractForV2(
        mapping,
        inspection,
        browserPackage,
      ),
      now: new Date("2026-08-03T08:30:01.000Z"),
    });

    const committed = commitJournalGenericMappedUpload(scope, {
      sourceBytes,
      mapping,
      previewRef: preview.previewRef,
      attemptBindingSha256: context.attemptBindingSha256,
      attemptCorrelationSha256: context.correlationRefSha256,
    });
    expect(committed).toMatchObject({
      status: "committed",
      createdExecutionCount: 2,
      matchedExecutionCount: 0,
    });
    const retried = commitJournalGenericMappedUpload(scope, {
      sourceBytes,
      mapping,
      previewRef: preview.previewRef,
      attemptBindingSha256: context.attemptBindingSha256,
      attemptCorrelationSha256: context.correlationRefSha256,
    });
    expect(retried).toMatchObject({
      status: "already_imported",
      createdExecutionCount: 0,
      matchedExecutionCount: 2,
    });

    const database = openPlatformDatabase({
      mode: "initializer",
      databasePath,
      forbiddenRepositoryRoots: [],
    });
    try {
      expect(database.prepare(`SELECT current_state, committed_import_batch_id
FROM journal_import_attempts`).get()).toMatchObject({
        current_state: expect.stringMatching(/^committed(?:_with_decisions)?$/u),
        committed_import_batch_id: expect.any(String),
      });
      expect(database.prepare("SELECT COUNT(*) AS count FROM journal_import_batches").get())
        .toEqual({ count: 1 });
      expect(database.prepare("SELECT COUNT(*) AS count FROM journal_executions").get())
        .toEqual({ count: 2 });
      expect(database.prepare("SELECT COUNT(*) AS count FROM journal_round_trips").get())
        .toEqual({ count: 1 });
    } finally {
      database.close();
    }
    expect(existsSync(join(
      evidenceRoot,
      "mapped_csv",
      `${context.attempt.sourceFileSha256}.csv`,
    ))).toBe(true);
  });
});
