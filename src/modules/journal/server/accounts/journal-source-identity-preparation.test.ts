import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import Database from "better-sqlite3";

import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import {
  DEVELOPMENT_OWNER_SEED_AUTH_PROVIDER,
  DEVELOPMENT_OWNER_SEED_AUTH_SUBJECT,
} from "@/src/modules/platform/server/bootstrap/development-owner-seed-authorization";
import { openPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import {
  createCanonicalUuidV4,
  isTraderLinkPlatformError,
} from "@/src/modules/platform/server/database/platform-migration-contract";
import { runPlatformMigrations } from "@/src/modules/platform/server/database/run-platform-migrations";
import {
  ACTIVE_TRADERLINK_PLATFORM_REPOSITORY_ROOT,
  TRADERLINK_PLATFORM_DB_PATH_ENV,
} from "@/src/modules/platform/server/database/platform-database-config";
import { PlatformUserRepository } from "@/src/modules/platform/server/identity/platform-user-repository";
import { PlatformWorkspaceRepository } from "@/src/modules/platform/server/identity/platform-workspace-repository";
import { runTraderLinkPlatformJournalSourceIdentityPreparation } from "@/src/scripts/prepare-traderlink-platform-journal-source-identity";
import { runTraderLinkPlatformJournalImportPreview } from "@/src/scripts/preview-traderlink-platform-journal-import";
import {
  previewTraderLinkPlatformJournalImport,
  TRADERLINK_PLATFORM_JOURNAL_IMPORT_SOURCE_PATH_ENV,
  type TraderLinkJournalImportPreviewResult,
} from "../imports/journal-import-source-preview";
import { syntheticIbkrStatement } from "../imports/synthetic-ibkr-fixtures";
import {
  IBKR_SOURCE_ACCOUNT_CANONICALIZERS,
  IBKR_SOURCE_ACCOUNT_CANONICALIZATION_VERSION,
} from "./ibkr-source-account-canonicalizer";
import { JournalAccountRepository } from "./journal-account-repository";
import {
  JOURNAL_SOURCE_IDENTITY_PREPARATION_ACTION,
  JOURNAL_SOURCE_IDENTITY_PREPARATION_ENABLE_ENV,
  prepareTraderLinkPlatformJournalSourceIdentity,
  type TraderLinkJournalSourceIdentityPreparationOptions,
} from "./journal-source-identity-preparation";
import {
  JournalAccountService,
  loadAccountIdentityConfiguration,
} from "./journal-account-service";

const roots: string[] = [];

afterEach(() => {
  for (const root of roots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

type Harness = Readonly<{
  root: string;
  repositoryRoot: string;
  sourcePath: string;
  databasePath: string;
  userId: string | null;
  workspaceId: string | null;
  accountIds: readonly string[];
  preview: TraderLinkJournalImportPreviewResult;
  environment: NodeJS.ProcessEnv;
}>;

function testEnvironment(
  activeKeyVersion = "active-key",
  keysBase64: Readonly<Record<string, string>> = {
    "active-key": Buffer.alloc(32, 11).toString("base64"),
  },
): NodeJS.ProcessEnv {
  return {
    NODE_ENV: "development",
    [JOURNAL_SOURCE_IDENTITY_PREPARATION_ENABLE_ENV]: "1",
    TRADERLINK_PLATFORM_ACCOUNT_IDENTITY_ACTIVE_KEY_VERSION: activeKeyVersion,
    TRADERLINK_PLATFORM_ACCOUNT_IDENTITY_HMAC_KEYS_JSON:
      JSON.stringify(keysBase64),
  };
}

function createHarness(
  options: Readonly<{
    seedOwner?: boolean;
    accountCount?: number;
    sourceText?: string;
  }> = {},
): Harness {
  const root = mkdtempSync(join(tmpdir(), "traderlink-source-preparation-"));
  roots.push(root);
  const repositoryRoot = join(root, "replacement-repository");
  const preservedSourceRoot = join(root, "preserved-backup");
  const sourcePath = join(preservedSourceRoot, "statement.csv");
  const databasePath = join(root, "storage", "development.sqlite");
  mkdirSync(repositoryRoot, { recursive: true });
  mkdirSync(preservedSourceRoot, { recursive: true });
  writeFileSync(sourcePath, options.sourceText ?? syntheticIbkrStatement, "utf8");

  const database = openPlatformDatabase({
    mode: "initializer",
    databasePath,
    forbiddenRepositoryRoots: [],
  });
  runPlatformMigrations(database, {
    now: () => new Date("2026-08-01T12:00:00.000Z"),
  });
  let userId: string | null = null;
  let workspaceId: string | null = null;
  const accountIds: string[] = [];
  if (options.seedOwner !== false) {
    userId = createCanonicalUuidV4();
    workspaceId = createCanonicalUuidV4();
    const timestamp = "2026-08-01T12:01:00.000Z";
    new PlatformUserRepository(database, {
      allowedAuthProviders: [DEVELOPMENT_OWNER_SEED_AUTH_PROVIDER],
    }).createUser({
      userId,
      authProvider: DEVELOPMENT_OWNER_SEED_AUTH_PROVIDER,
      authSubject: DEVELOPMENT_OWNER_SEED_AUTH_SUBJECT,
      displayName: "Development owner",
      createdAtUtc: timestamp,
      updatedAtUtc: timestamp,
    });
    new PlatformWorkspaceRepository(database).createWorkspaceWithOwner({
      workspaceId,
      ownerUserId: userId,
      displayName: "Development workspace",
      defaultTradingTimezone: "America/New_York",
      createdAtUtc: timestamp,
    });
    const accountService = new JournalAccountService(
      new JournalAccountRepository(database),
    );
    const creationScope: WorkspaceAccessScope = Object.freeze({
      userId,
      workspaceId,
      workspaceRole: "owner",
      allowedAccountIds: Object.freeze([]),
      activeAccountId: null,
    });
    for (let index = 0; index < (options.accountCount ?? 1); index += 1) {
      accountIds.push(accountService.createAccount(creationScope, {
        workspaceId,
        displayName: `Synthetic journal ${index + 1}`,
        baseCurrency: "USD",
        tradingTimezone: "America/New_York",
        now: new Date(timestamp),
      }).accountId);
    }
  }
  database.close();

  const preview = previewTraderLinkPlatformJournalImport({
    sourcePath,
    sourceTimezone: "America/New_York",
    additionalForbiddenRepositoryRoot: repositoryRoot,
  });
  const environment = Object.freeze({
    ...testEnvironment(),
    [TRADERLINK_PLATFORM_DB_PATH_ENV]: databasePath,
    [TRADERLINK_PLATFORM_JOURNAL_IMPORT_SOURCE_PATH_ENV]: sourcePath,
  });
  return Object.freeze({
    root,
    repositoryRoot,
    sourcePath,
    databasePath,
    userId,
    workspaceId,
    accountIds: Object.freeze(accountIds),
    preview,
    environment,
  });
}

function preparationOptions(
  harness: Harness,
  overrides: Partial<TraderLinkJournalSourceIdentityPreparationOptions> = {},
): TraderLinkJournalSourceIdentityPreparationOptions {
  return {
    sourcePath: harness.sourcePath,
    sourceTimezone: "America/New_York",
    additionalForbiddenRepositoryRoot: harness.repositoryRoot,
    databasePath: harness.databasePath,
    forbiddenRepositoryRoots: [],
    environment: harness.environment,
    expectedEvidence: harness.preview.evidence,
    now: () => new Date("2026-08-01T12:02:00.000Z"),
    ...overrides,
  };
}

function sourceIdentityRows(databasePath: string): readonly Readonly<{
  source_identity_id: string;
  account_id: string;
  hmac_key_version: string;
  last_seen_at_utc: string;
}>[] {
  const database = openPlatformDatabase({
    mode: "runtime",
    databasePath,
    forbiddenRepositoryRoots: [],
  });
  try {
    return database.prepare(`SELECT
  source_identity_id, account_id, hmac_key_version, last_seen_at_utc
FROM journal_account_source_identities
WHERE source_system = 'ibkr' AND status <> 'superseded'
ORDER BY source_identity_id`).all() as readonly Readonly<{
      source_identity_id: string;
      account_id: string;
      hmac_key_version: string;
      last_seen_at_utc: string;
    }>[];
  } finally {
    database.close();
  }
}

function createIdentityForAccount(
  harness: Harness,
  accountId: string,
  environment = harness.environment,
): void {
  const database = openPlatformDatabase({
    mode: "runtime",
    databasePath: harness.databasePath,
    forbiddenRepositoryRoots: [],
  });
  try {
    const configuration = loadAccountIdentityConfiguration(
      environment,
      IBKR_SOURCE_ACCOUNT_CANONICALIZERS,
      IBKR_SOURCE_ACCOUNT_CANONICALIZATION_VERSION,
    );
    const service = new JournalAccountService(
      new JournalAccountRepository(database),
      configuration,
    );
    const scope: WorkspaceAccessScope = Object.freeze({
      userId: harness.userId as string,
      workspaceId: harness.workspaceId as string,
      workspaceRole: "owner",
      allowedAccountIds: harness.accountIds,
      activeAccountId: accountId,
    });
    service.confirmSourceIdentityLinkRecord(scope, {
      accountId,
      sourceSystem: "ibkr",
      rawSourceAccountId: "SYNTH-ACCOUNT",
      privacySafeDisplay: "Broker source",
      now: new Date("2026-08-01T12:02:00.000Z"),
    });
  } finally {
    database.close();
  }
}

describe("Journal source identity preparation automation", () => {
  it("loads the source path only from injected environment and rejects source arguments", () => {
    const harness = createHarness();
    const previewArguments = [
      "--source-timezone=America/New_York",
      `--expected-sha256=${harness.preview.evidence.sourceFileSha256}`,
      `--expected-size-bytes=${harness.preview.evidence.sourceFileSizeBytes}`,
    ];
    expect(runTraderLinkPlatformJournalImportPreview(
      previewArguments,
      harness.environment,
    )).toEqual(harness.preview);
    expect(() => runTraderLinkPlatformJournalImportPreview(
      [...previewArguments, "--source=forbidden.csv"],
      harness.environment,
    )).toThrowError("TRADERLINK_JOURNAL_IMPORT_PREVIEW_ARGUMENT_INVALID");
    expect(() => runTraderLinkPlatformJournalImportPreview(
      previewArguments,
      {},
    )).toThrowError("TRADERLINK_JOURNAL_IMPORT_SOURCE_PATH_INVALID");

    const preparationArguments = [
      `--action=${JOURNAL_SOURCE_IDENTITY_PREPARATION_ACTION}`,
      "--source-timezone=America/New_York",
      `--expected-sha256=${harness.preview.evidence.sourceFileSha256}`,
      `--expected-size-bytes=${harness.preview.evidence.sourceFileSizeBytes}`,
      `--expected-preview-sha256=${harness.preview.evidence.aggregatePreviewSha256}`,
    ];
    expect(runTraderLinkPlatformJournalSourceIdentityPreparation(
      preparationArguments,
      harness.environment,
    )).toMatchObject({
      status: "journal_source_identity_prepared",
      activeWorkspaceCount: 1,
      identityMutation: "created",
    });
    expect(() => runTraderLinkPlatformJournalSourceIdentityPreparation(
      [...preparationArguments, "--source=forbidden.csv"],
      harness.environment,
    )).toThrowError(
      "TRADERLINK_JOURNAL_SOURCE_IDENTITY_PREPARATION_ARGUMENT_INVALID",
    );
    expect(sourceIdentityRows(harness.databasePath)).toHaveLength(1);
  });

  it("returns only allowlisted aggregate evidence and accepts an explicit preserved-backup CSV", () => {
    const harness = createHarness();
    const serialized = JSON.stringify(harness.preview);
    expect(Object.keys(harness.preview).sort()).toEqual([
      "aggregatePreview",
      "evidence",
      "identifiersRedacted",
      "status",
    ]);
    expect(serialized).not.toContain(harness.sourcePath);
    expect(serialized).not.toContain("SYNTH-ACCOUNT");
    expect(serialized).not.toContain("SYNTH-FILL-1");
    expect(serialized).not.toContain("ALPHA");
    expect(serialized).not.toContain("10.0000");
  });

  it("rejects repository-contained, non-CSV, non-file, and database-content inputs without disclosing paths", () => {
    const harness = createHarness();
    const repositorySource = join(harness.repositoryRoot, "source.csv");
    const nonCsvSource = join(harness.root, "source.txt");
    const databaseContentSource = join(harness.root, "database.csv");
    writeFileSync(repositorySource, syntheticIbkrStatement, "utf8");
    writeFileSync(nonCsvSource, syntheticIbkrStatement, "utf8");
    writeFileSync(databaseContentSource, "SQLite format 3\u0000", "utf8");
    for (const sourcePath of [
      repositorySource,
      nonCsvSource,
      harness.root,
      databaseContentSource,
    ]) {
      let thrown: unknown;
      try {
        previewTraderLinkPlatformJournalImport({
          sourcePath,
          sourceTimezone: "America/New_York",
          additionalForbiddenRepositoryRoot: harness.repositoryRoot,
        });
      } catch (error) {
        thrown = error;
      }
      expect(isTraderLinkPlatformError(thrown)).toBe(true);
      expect(JSON.stringify(thrown)).not.toContain(sourcePath);
    }
  });

  it("cannot bypass the active repository exclusion and rejects malformed path values with a stable code", () => {
    const harness = createHarness();
    const activeRepositorySource = join(
      ACTIVE_TRADERLINK_PLATFORM_REPOSITORY_ROOT,
      "synthetic-source.csv",
    );
    for (const sourcePath of [
      activeRepositorySource,
      null,
      `${harness.sourcePath}\n`,
    ]) {
      expect(() => previewTraderLinkPlatformJournalImport({
        sourcePath: sourcePath as string,
        sourceTimezone: "America/New_York",
        additionalForbiddenRepositoryRoot: harness.repositoryRoot,
      })).toThrowError("TRADERLINK_JOURNAL_IMPORT_SOURCE_PATH_INVALID");
    }
  });

  it("rejects source hash, size, or accepted aggregate evidence mismatch before a write", () => {
    const harness = createHarness();
    expect(() => previewTraderLinkPlatformJournalImport({
      sourcePath: harness.sourcePath,
      sourceTimezone: "America/New_York",
      additionalForbiddenRepositoryRoot: harness.repositoryRoot,
      expectedSourceFileSha256: "0".repeat(64),
    })).toThrowError("TRADERLINK_JOURNAL_IMPORT_SOURCE_EVIDENCE_MISMATCH");
    expect(() => previewTraderLinkPlatformJournalImport({
      sourcePath: harness.sourcePath,
      sourceTimezone: "America/New_York",
      additionalForbiddenRepositoryRoot: harness.repositoryRoot,
      expectedSourceFileSizeBytes: harness.preview.evidence.sourceFileSizeBytes + 1,
    })).toThrowError("TRADERLINK_JOURNAL_IMPORT_SOURCE_EVIDENCE_MISMATCH");
    expect(() => prepareTraderLinkPlatformJournalSourceIdentity(
      preparationOptions(harness, {
        expectedEvidence: {
          ...harness.preview.evidence,
          aggregatePreviewSha256: "0".repeat(64),
        },
      }),
    )).toThrowError("TRADERLINK_JOURNAL_IMPORT_SOURCE_EVIDENCE_MISMATCH");
    expect(sourceIdentityRows(harness.databasePath)).toHaveLength(0);
  });

  it("fails closed on a non-current six-migration history", () => {
    const harness = createHarness();
    const database = new Database(harness.databasePath);
    database.prepare(`UPDATE platform_schema_migrations
SET migration_id = '0006_unaccepted_history'
WHERE execution_order = 6`).run();
    database.close();
    expect(() => prepareTraderLinkPlatformJournalSourceIdentity(
      preparationOptions(harness),
    )).toThrowError(/TRADERLINK_MIGRATION_|TRADERLINK_PLATFORM_/u);
  });

  it("requires exactly one globally active workspace, its development owner, and one active Journal account", () => {
    const noOwner = createHarness({ seedOwner: false });
    const noAccount = createHarness({ accountCount: 0 });
    const multipleAccounts = createHarness({ accountCount: 2 });
    for (const harness of [noOwner, noAccount, multipleAccounts]) {
      expect(() => prepareTraderLinkPlatformJournalSourceIdentity(
        preparationOptions(harness),
      )).toThrowError("TRADERLINK_JOURNAL_SOURCE_IDENTITY_PRECONDITION_FAILED");
    }

    const multipleWorkspaces = createHarness();
    const database = openPlatformDatabase({
      mode: "runtime",
      databasePath: multipleWorkspaces.databasePath,
      forbiddenRepositoryRoots: [],
    });
    const secondUserId = createCanonicalUuidV4();
    const workspaceId = createCanonicalUuidV4();
    new PlatformUserRepository(database, {
      allowedAuthProviders: ["synthetic"],
    }).createUser({
      userId: secondUserId,
      authProvider: "synthetic",
      authSubject: "second-owner",
      displayName: "Second owner",
      createdAtUtc: "2026-08-01T12:03:00.000Z",
      updatedAtUtc: "2026-08-01T12:03:00.000Z",
    });
    new PlatformWorkspaceRepository(database).createWorkspaceWithOwner({
      workspaceId,
      ownerUserId: secondUserId,
      displayName: "Second workspace",
      defaultTradingTimezone: "America/New_York",
      createdAtUtc: "2026-08-01T12:03:00.000Z",
    });
    database.close();
    expect(() => prepareTraderLinkPlatformJournalSourceIdentity(
      preparationOptions(multipleWorkspaces),
    )).toThrowError("TRADERLINK_JOURNAL_SOURCE_IDENTITY_PRECONDITION_FAILED");
  });

  it("fails closed when the sole existing identity belongs to another account", () => {
    const harness = createHarness({ accountCount: 2 });
    createIdentityForAccount(harness, harness.accountIds[0] as string);
    const database = openPlatformDatabase({
      mode: "runtime",
      databasePath: harness.databasePath,
      forbiddenRepositoryRoots: [],
    });
    database.prepare(`UPDATE journal_accounts
SET status = 'archived'
WHERE account_id = ?`).run(harness.accountIds[0]);
    database.close();
    expect(() => prepareTraderLinkPlatformJournalSourceIdentity(
      preparationOptions(harness),
    )).toThrowError("TRADERLINK_ACCOUNT_IDENTITY_CONFLICT");
  });

  it("rolls back an initial link if the locked post-write operation fails", () => {
    const harness = createHarness();
    let thrown: unknown;
    try {
      prepareTraderLinkPlatformJournalSourceIdentity(preparationOptions(harness, {
        testHooks: {
          afterIdentityMutation: () => {
            throw new Error("SYNTH-ACCOUNT private failure");
          },
        },
      }));
    } catch (error) {
      thrown = error;
    }
    expect(isTraderLinkPlatformError(thrown)).toBe(true);
    expect((thrown as { code: string }).code).toBe(
      "TRADERLINK_JOURNAL_SOURCE_IDENTITY_PREPARATION_FAILED",
    );
    expect(JSON.stringify(thrown)).not.toContain("SYNTH-ACCOUNT");
    expect(sourceIdentityRows(harness.databasePath)).toHaveLength(0);
  });

  it("creates exactly one identity, then resumes without mutating it", () => {
    const harness = createHarness();
    const created = prepareTraderLinkPlatformJournalSourceIdentity(
      preparationOptions(harness),
    );
    expect(created).toMatchObject({
      status: "journal_source_identity_prepared",
      identityMutation: "created",
      nonSupersededSourceIdentityCount: 1,
      identifiersRedacted: true,
    });
    const before = sourceIdentityRows(harness.databasePath);
    expect(before).toHaveLength(1);
    const resumed = prepareTraderLinkPlatformJournalSourceIdentity(
      preparationOptions(harness, {
        now: () => new Date("2026-08-01T13:00:00.000Z"),
      }),
    );
    expect(resumed).toMatchObject({
      status: "journal_source_identity_already_prepared",
      identityMutation: "none",
      nonSupersededSourceIdentityCount: 1,
    });
    expect(sourceIdentityRows(harness.databasePath)).toEqual(before);
    expect(JSON.stringify(resumed)).not.toContain(harness.accountIds[0]);
  });

  it("rejects multiple non-superseded identities and missing retained HMAC authority", () => {
    const multiple = createHarness();
    createIdentityForAccount(multiple, multiple.accountIds[0] as string, testEnvironment(
      "old-key",
      {
        "old-key": Buffer.alloc(32, 17).toString("base64"),
        "new-key": Buffer.alloc(32, 23).toString("base64"),
      },
    ));
    createIdentityForAccount(multiple, multiple.accountIds[0] as string, testEnvironment(
      "new-key",
      {
        "old-key": Buffer.alloc(32, 17).toString("base64"),
        "new-key": Buffer.alloc(32, 23).toString("base64"),
      },
    ));
    expect(() => prepareTraderLinkPlatformJournalSourceIdentity(
      preparationOptions(multiple, {
        environment: testEnvironment("new-key", {
          "old-key": Buffer.alloc(32, 17).toString("base64"),
          "new-key": Buffer.alloc(32, 23).toString("base64"),
        }),
      }),
    )).toThrowError("TRADERLINK_JOURNAL_SOURCE_IDENTITY_PRECONDITION_FAILED");

    const missingAuthority = createHarness();
    createIdentityForAccount(
      missingAuthority,
      missingAuthority.accountIds[0] as string,
      testEnvironment("retained-key", {
        "retained-key": Buffer.alloc(32, 29).toString("base64"),
      }),
    );
    expect(() => prepareTraderLinkPlatformJournalSourceIdentity(
      preparationOptions(missingAuthority, {
        environment: testEnvironment("active-key", {
          "active-key": Buffer.alloc(32, 31).toString("base64"),
        }),
      }),
    )).toThrowError("TRADERLINK_ACCOUNT_IDENTITY_RECOVERY_REQUIRED");
  });

  it("returns stable redacted failures for missing authorization and private causes", () => {
    const harness = createHarness();
    const privateValues = [
      harness.sourcePath,
      "SYNTH-ACCOUNT",
      "SYNTH-FILL-1",
      "ALPHA",
    ];
    for (const operation of [
      () => prepareTraderLinkPlatformJournalSourceIdentity(preparationOptions(harness, {
        environment: testEnvironment(),
        testHooks: { afterIdentityMutation: () => {
          throw new Error(privateValues.join("|"));
        } },
      })),
      () => prepareTraderLinkPlatformJournalSourceIdentity(preparationOptions(harness, {
        environment: { NODE_ENV: "production" },
      })),
    ]) {
      let thrown: unknown;
      try {
        operation();
      } catch (error) {
        thrown = error;
      }
      expect(isTraderLinkPlatformError(thrown)).toBe(true);
      const serialized = JSON.stringify(thrown);
      for (const privateValue of privateValues) {
        expect(serialized).not.toContain(privateValue);
      }
    }
  });
});
