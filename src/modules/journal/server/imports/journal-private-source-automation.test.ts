import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import Database from "better-sqlite3";

import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import {
  DEVELOPMENT_OWNER_SEED_AUTH_PROVIDER,
  DEVELOPMENT_OWNER_SEED_AUTH_SUBJECT,
} from "@/src/modules/platform/server/bootstrap/development-owner-seed-authorization";
import { openPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { TRADERLINK_PLATFORM_DB_PATH_ENV } from "@/src/modules/platform/server/database/platform-database-config";
import {
  createCanonicalUuidV4,
  isTraderLinkPlatformError,
} from "@/src/modules/platform/server/database/platform-migration-contract";
import { runPlatformMigrations } from "@/src/modules/platform/server/database/run-platform-migrations";
import { PlatformUserRepository } from "@/src/modules/platform/server/identity/platform-user-repository";
import { PlatformWorkspaceRepository } from "@/src/modules/platform/server/identity/platform-workspace-repository";
import { runTraderLinkPlatformJournalSourceImport } from "@/src/scripts/import-traderlink-platform-journal-source";
import { runTraderLinkPlatformJournalIntegrityVerification } from "@/src/scripts/verify-traderlink-platform-journal-integrity";
import {
  ACCOUNT_FINGERPRINT_SCHEME_VERSION,
  JournalAccountService,
} from "../accounts/journal-account-service";
import { JournalAccountRepository } from "../accounts/journal-account-repository";
import {
  IBKR_SOURCE_ACCOUNT_CANONICALIZERS,
  IBKR_SOURCE_ACCOUNT_CANONICALIZATION_VERSION,
} from "../accounts/ibkr-source-account-canonicalizer";
import {
  JOURNAL_SOURCE_IMPORT_ACTION,
  importTraderLinkPlatformJournalSource,
  type TraderLinkJournalSourceImportOptions,
} from "./journal-private-source-import";
import {
  JOURNAL_INTEGRITY_VERIFICATION_ACTION,
  verifyTraderLinkPlatformJournalIntegrity,
} from "../verification/journal-integrity-verifier";
import {
  promoteJournalEvidenceObject,
  resolveJournalEvidenceVaultBoundary,
  TRADERLINK_PLATFORM_JOURNAL_EVIDENCE_VAULT_ROOT_ENV,
  TRADERLINK_PLATFORM_JOURNAL_PROTECTED_STORAGE_ROOTS_JSON_ENV,
} from "./journal-evidence-vault";
import {
  previewTraderLinkPlatformJournalImport,
  TRADERLINK_PLATFORM_JOURNAL_IMPORT_SOURCE_PATH_ENV,
} from "./journal-import-source-preview";

const roots: string[] = [];

function expectStableFailure(
  operation: () => unknown,
  code: string,
  check?: string,
): Readonly<{ code: string; safeContext: Readonly<Record<string, unknown>> }> {
  let thrown: unknown;
  try {
    operation();
  } catch (error) {
    thrown = error;
  }
  expect(isTraderLinkPlatformError(thrown)).toBe(true);
  const failure = thrown as {
    code: string;
    safeContext: Readonly<Record<string, unknown>>;
  };
  expect(failure.code).toBe(code);
  if (check !== undefined) expect(failure.safeContext.check).toBe(check);
  return failure;
}

function expectNoTemporaryVaultObjects(rootPath: string): void {
  const objectDirectory = join(rootPath, "ibkr");
  if (!existsSync(objectDirectory)) return;
  expect(readdirSync(objectDirectory).filter((name) => name.endsWith(".tmp")))
    .toEqual([]);
}

function expectNoPendingWal(databasePath: string): void {
  const walPath = `${databasePath}-wal`;
  if (existsSync(walPath)) expect(statSync(walPath).size).toBe(0);
}

afterEach(() => {
  for (const root of roots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

function acceptedShapeStatement(): string {
  const tradeHeader =
    "Trades,Header,DataDiscriminator,Asset Category,Currency,Symbol,Date/Time,Quantity,T. Price,Comm/Fee,TradeID";
  let fillIndex = 0;
  const stockTrades: string[] = [];
  const appendFill = (symbol: string, quantity: "1" | "-1"): void => {
    const timestamp = new Date(Date.UTC(2026, 0, 2, 9, 30, fillIndex));
    const hours = String(timestamp.getUTCHours()).padStart(2, "0");
    const minutes = String(timestamp.getUTCMinutes()).padStart(2, "0");
    const seconds = String(timestamp.getUTCSeconds()).padStart(2, "0");
    stockTrades.push(
      `Trades,Data,Order,Stocks,USD,${symbol},"2026-01-02, ${hours}:${minutes}:${seconds}",${quantity},10,,SYNTH-FILL-${fillIndex}`,
    );
    fillIndex += 1;
  };
  for (let roundTripIndex = 0; roundTripIndex < 331; roundTripIndex += 1) {
    const symbol = `S${String(roundTripIndex % 113).padStart(3, "0")}`;
    if (roundTripIndex < 204) {
      appendFill(symbol, "1");
      appendFill(symbol, "1");
      appendFill(symbol, "-1");
      appendFill(symbol, "-1");
    } else {
      appendFill(symbol, "1");
      appendFill(symbol, "-1");
    }
  }
  appendFill("S000", "1");
  appendFill("S001", "1");
  expect(stockTrades).toHaveLength(1_072);
  const unsupportedTrades = Array.from({ length: 542 }, (_, index) =>
    `Trades,Data,Order,Forex,USD,EUR.USD,"2026-01-15, 11:00:00",1,1,,SYNTH-FX-${index}`);
  const markToMarketRows = Array.from({ length: 115 }, (_, index) => {
    const symbolIndex = index < 113 ? index : index === 113 ? 0 : 112;
    const priorQuantity = index < 113 ? "0" : index === 113 ? "0.0" : "0.00";
    const currentQuantity = index === 0 ? "1" : priorQuantity;
    return `Mark-to-Market Performance Summary,Data,Stocks,USD,S${String(symbolIndex).padStart(3, "0")},${priorQuantity},${currentQuantity}`;
  });
  const automaticRows = Array.from({ length: 547 }, (_, index) => {
    const uniqueIndex = index === 546 ? 545 : index;
    return `${tradeHeader},Unused${uniqueIndex}`;
  });
  const rows = [
    "Statement,Header,Field Name,Field Value",
    'Statement,Data,Period,"January 1, 2026 - January 31, 2026"',
    "Account Information,Header,Field Name,Field Value",
    "Account Information,Data,Account,SYNTH-ACCOUNT",
    tradeHeader,
    ...stockTrades,
    ...unsupportedTrades,
    "Mark-to-Market Performance Summary,Header,Asset Category,Currency,Symbol,Prior Quantity,Current Quantity",
    ...markToMarketRows,
    "Open Positions,Header,DataDiscriminator,Asset Category,Currency,Symbol,Quantity",
    "Open Positions,Data,Summary,Stocks,USD,S000,1",
    ...automaticRows,
  ];
  expect(rows).toHaveLength(2_284);
  return rows.join("\r\n");
}

type Harness = Readonly<{
  root: string;
  repositoryRoot: string;
  sourcePath: string;
  sourceText: string;
  databasePath: string;
  vaultRoot: string;
  protectedRoots: readonly string[];
  environment: NodeJS.ProcessEnv;
  importArguments: readonly string[];
  importOptions: TraderLinkJournalSourceImportOptions;
}>;

function createHarness(options: Readonly<{ linkIdentity?: boolean }> = {}): Harness {
  const root = mkdtempSync(join(tmpdir(), "traderlink-private-import-"));
  roots.push(root);
  const repositoryRoot = join(root, "replacement-repository");
  const sourceRoot = join(root, "preserved-source");
  const sourcePath = join(sourceRoot, "synthetic-statement.csv");
  const databasePath = join(root, "database", "development.sqlite");
  const vaultRoot = join(root, "journal-vault");
  const protectedRoots = Object.freeze([
    join(root, "backup-target"),
    join(root, "restore-target"),
    join(root, "verification-target"),
  ]);
  for (const path of [
    repositoryRoot,
    sourceRoot,
    join(root, "database"),
    vaultRoot,
    ...protectedRoots,
  ]) mkdirSync(path, { recursive: true });
  const sourceText = acceptedShapeStatement();
  writeFileSync(sourcePath, sourceText, "utf8");
  const accountKey = Buffer.alloc(32, 17).toString("base64");
  const journalKey = Buffer.alloc(32, 29).toString("base64");
  const environment: NodeJS.ProcessEnv = {
    NODE_ENV: "development",
    TRADERLINK_PLATFORM_ALLOW_JOURNAL_SOURCE_IMPORT: "1",
    [TRADERLINK_PLATFORM_DB_PATH_ENV]: databasePath,
    [TRADERLINK_PLATFORM_JOURNAL_IMPORT_SOURCE_PATH_ENV]: sourcePath,
    [TRADERLINK_PLATFORM_JOURNAL_EVIDENCE_VAULT_ROOT_ENV]: vaultRoot,
    [TRADERLINK_PLATFORM_JOURNAL_PROTECTED_STORAGE_ROOTS_JSON_ENV]:
      JSON.stringify(protectedRoots),
    TRADERLINK_PLATFORM_ACCOUNT_IDENTITY_ACTIVE_KEY_VERSION: "accountkey",
    TRADERLINK_PLATFORM_ACCOUNT_IDENTITY_HMAC_KEYS_JSON: JSON.stringify({
      accountkey: accountKey,
    }),
    TRADERLINK_PLATFORM_JOURNAL_HMAC_ACTIVE_KEY_VERSION: "journalkey",
    TRADERLINK_PLATFORM_JOURNAL_HMAC_KEYS_JSON: JSON.stringify({
      journalkey: journalKey,
    }),
  };
  const database = openPlatformDatabase({
    mode: "initializer",
    databasePath,
    forbiddenRepositoryRoots: [],
  });
  runPlatformMigrations(database, {
    now: () => new Date("2026-08-01T12:00:00.000Z"),
  });
  const userId = createCanonicalUuidV4();
  const workspaceId = createCanonicalUuidV4();
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
    {
      activeKeyVersion: "accountkey",
      keysBase64: { accountkey: accountKey },
      activeCanonicalizationVersion: IBKR_SOURCE_ACCOUNT_CANONICALIZATION_VERSION,
      canonicalizers: IBKR_SOURCE_ACCOUNT_CANONICALIZERS,
    },
  );
  const creationScope: WorkspaceAccessScope = Object.freeze({
    userId,
    workspaceId,
    workspaceRole: "owner",
    allowedAccountIds: Object.freeze([]),
    activeAccountId: null,
  });
  const account = accountService.createAccount(creationScope, {
    workspaceId,
    displayName: "Synthetic journal",
    baseCurrency: "USD",
    tradingTimezone: "America/New_York",
    now: new Date(timestamp),
  });
  if (options.linkIdentity !== false) {
    accountService.confirmSourceIdentityLinkRecord(
      Object.freeze({
        ...creationScope,
        allowedAccountIds: Object.freeze([account.accountId]),
        activeAccountId: account.accountId,
      }),
      {
        accountId: account.accountId,
        sourceSystem: "ibkr",
        rawSourceAccountId: "SYNTH-ACCOUNT",
        privacySafeDisplay: "Broker source",
        now: new Date("2026-08-01T12:02:00.000Z"),
      },
    );
  }
  database.close();
  const preview = previewTraderLinkPlatformJournalImport({
    sourcePath,
    sourceTimezone: "America/New_York",
    additionalForbiddenRepositoryRoot: repositoryRoot,
  });
  const importArguments = Object.freeze([
    `--action=${JOURNAL_SOURCE_IMPORT_ACTION}`,
    "--source-timezone=America/New_York",
    `--expected-sha256=${preview.evidence.sourceFileSha256}`,
    `--expected-size-bytes=${preview.evidence.sourceFileSizeBytes}`,
    `--expected-preview-sha256=${preview.evidence.aggregatePreviewSha256}`,
  ]);
  const importOptions: TraderLinkJournalSourceImportOptions = Object.freeze({
    sourcePath,
    sourceTimezone: "America/New_York",
    confirmationAction: JOURNAL_SOURCE_IMPORT_ACTION,
    additionalForbiddenRepositoryRoot: repositoryRoot,
    databasePath,
    forbiddenRepositoryRoots: Object.freeze([]),
    protectedStorageRoots: protectedRoots,
    environment,
    expectedEvidence: preview.evidence,
    now: () => new Date("2026-08-01T12:03:00.000Z"),
  });
  return Object.freeze({
    root,
    repositoryRoot,
    sourcePath,
    sourceText,
    databasePath,
    vaultRoot,
    protectedRoots,
    environment,
    importArguments,
    importOptions,
  });
}

function count(databasePath: string, tableName: string): number {
  const database = new Database(databasePath, { readonly: true, fileMustExist: true });
  try {
    return (database.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get() as {
      count: number;
    }).count;
  } finally {
    database.close();
  }
}

function withWriteDatabase<T>(
  databasePath: string,
  operation: (database: Database.Database) => T,
): T {
  const database = new Database(databasePath);
  try {
    return operation(database);
  } finally {
    database.close();
  }
}

function verificationOptions(
  harness: Harness,
  importBatchId: string,
) {
  const preview = previewTraderLinkPlatformJournalImport({
    sourcePath: harness.sourcePath,
    sourceTimezone: "America/New_York",
    additionalForbiddenRepositoryRoot: harness.repositoryRoot,
  });
  return Object.freeze({
    sourcePath: harness.sourcePath,
    sourceTimezone: "America/New_York",
    expectedSourceFileSha256: preview.evidence.sourceFileSha256,
    expectedSourceFileSizeBytes: preview.evidence.sourceFileSizeBytes,
    expectedAggregatePreviewSha256: preview.evidence.aggregatePreviewSha256,
    expectedFirstImportBatchId: importBatchId,
    expectedReimportBatchId: importBatchId,
    environment: harness.environment,
    databasePath: harness.databasePath,
    forbiddenRepositoryRoots: Object.freeze([]),
    protectedStorageRoots: harness.protectedRoots,
  });
}

describe("private Journal source import and verification automation", () => {
  it("loads the source path only from environment and rejects source arguments", () => {
    const harness = createHarness();
    expect(() => runTraderLinkPlatformJournalSourceImport(
      [...harness.importArguments, "--source=synthetic.csv"],
      harness.environment,
      {
        databasePath: harness.databasePath,
        forbiddenRepositoryRoots: [],
        protectedStorageRoots: harness.protectedRoots,
        additionalForbiddenRepositoryRoot: harness.repositoryRoot,
      },
    )).toThrowError("TRADERLINK_JOURNAL_SOURCE_IMPORT_ARGUMENT_INVALID");
    expect(() => runTraderLinkPlatformJournalIntegrityVerification(
      [
        `--action=${JOURNAL_INTEGRITY_VERIFICATION_ACTION}`,
        "--source-timezone=America/New_York",
        "--expected-sha256=0" + "0".repeat(63),
        "--expected-size-bytes=1",
        "--expected-preview-sha256=0" + "0".repeat(63),
        `--first-import-batch-id=${createCanonicalUuidV4()}`,
        `--reimport-batch-id=${createCanonicalUuidV4()}`,
        "--source=synthetic.csv",
      ],
      harness.environment,
    )).toThrowError("TRADERLINK_JOURNAL_INTEGRITY_ARGUMENT_INVALID");
  });

  it("rejects vault overlap, path escape, and reparse-point boundaries", () => {
    const harness = createHarness();
    for (const forbiddenRoot of [
      harness.repositoryRoot,
      join(harness.root, "database"),
      join(harness.root, "preserved-source"),
      harness.protectedRoots[0] as string,
    ]) {
      const environment = {
        ...harness.environment,
        [TRADERLINK_PLATFORM_JOURNAL_EVIDENCE_VAULT_ROOT_ENV]: forbiddenRoot,
      };
      expect(() => resolveJournalEvidenceVaultBoundary({
        sourcePath: harness.sourcePath,
        databasePath: harness.databasePath,
        environment,
        additionalForbiddenRepositoryRoots: [harness.repositoryRoot],
        protectedStorageRoots: harness.protectedRoots,
      })).toThrowError("TRADERLINK_JOURNAL_EVIDENCE_VAULT_CONFIGURATION_INVALID");
    }
    const reparseRoot = join(harness.root, "vault-link");
    symlinkSync(harness.vaultRoot, reparseRoot, "junction");
    expect(() => resolveJournalEvidenceVaultBoundary({
      sourcePath: harness.sourcePath,
      databasePath: harness.databasePath,
      environment: {
        ...harness.environment,
        [TRADERLINK_PLATFORM_JOURNAL_EVIDENCE_VAULT_ROOT_ENV]: reparseRoot,
      },
      protectedStorageRoots: harness.protectedRoots,
    })).toThrowError("TRADERLINK_JOURNAL_EVIDENCE_VAULT_CONFIGURATION_INVALID");
  });

  it("promotes hash-addressed evidence idempotently and fails on conflicts or write stages", () => {
    const harness = createHarness();
    const sourceBytes = Buffer.from("synthetic evidence", "utf8");
    const digest = createHash("sha256").update(sourceBytes).digest("hex");
    const boundary = Object.freeze({ rootPath: harness.vaultRoot });
    const input = {
      sourceBytes,
      sourceFileSha256: digest,
      sourceFileSizeBytes: sourceBytes.byteLength,
    };
    expect(promoteJournalEvidenceObject(boundary, input).status).toBe("created");
    expect(promoteJournalEvidenceObject(boundary, input).status).toBe("already_present");
    writeFileSync(join(harness.vaultRoot, "ibkr", `${digest}.csv`), "conflict", "utf8");
    expect(() => promoteJournalEvidenceObject(boundary, input))
      .toThrowError("TRADERLINK_JOURNAL_EVIDENCE_VAULT_CONFLICT");

    for (const hookName of [
      "afterTemporaryWrite",
      "afterTemporaryFlush",
      "beforePromotion",
    ] as const) {
      const rootPath = join(harness.root, `vault-${hookName}`);
      mkdirSync(rootPath);
      expect(() => promoteJournalEvidenceObject(
        Object.freeze({ rootPath }),
        {
          ...input,
          testHooks: {
            [hookName]: () => {
              throw new Error("synthetic private write failure");
            },
          },
        },
      )).toThrowError("TRADERLINK_JOURNAL_EVIDENCE_VAULT_WRITE_FAILED");
      expectNoTemporaryVaultObjects(rootPath);
    }

    const raceRoot = join(harness.root, "vault-identical-race");
    mkdirSync(raceRoot);
    expect(promoteJournalEvidenceObject(
      Object.freeze({ rootPath: raceRoot }),
      {
        ...input,
        testHooks: {
          beforePromotion: () => {
            writeFileSync(
              join(raceRoot, "ibkr", `${digest}.csv`),
              sourceBytes,
            );
          },
        },
      },
    ).status).toBe("already_present");
    expectNoTemporaryVaultObjects(raceRoot);

    const failedPromotionRoot = join(harness.root, "vault-promotion-failure");
    mkdirSync(failedPromotionRoot);
    expectStableFailure(
      () => promoteJournalEvidenceObject(
        Object.freeze({ rootPath: failedPromotionRoot }),
        {
          ...input,
          testHooks: {
            beforePromotion: () => {
              mkdirSync(
                join(failedPromotionRoot, "ibkr", `${digest}.csv`),
              );
            },
          },
        },
      ),
      "TRADERLINK_JOURNAL_EVIDENCE_VAULT_CONFLICT",
    );
    expectNoTemporaryVaultObjects(failedPromotionRoot);

    const promotedFailureRoot = join(harness.root, "vault-promoted-failure");
    mkdirSync(promotedFailureRoot);
    const promotedFailure = expectStableFailure(
      () => promoteJournalEvidenceObject(
        Object.freeze({ rootPath: promotedFailureRoot }),
        {
          ...input,
          testHooks: {
            afterPromotion: () => {
              throw new Error("synthetic post-promotion failure");
            },
          },
        },
      ),
      "TRADERLINK_JOURNAL_SOURCE_IMPORT_ORPHANED_EVIDENCE",
    );
    expect(promotedFailure.safeContext).toEqual({
      evidenceObjectKey: `ibkr/${digest}.csv`,
      orphanState: "vault_object_unreferenced",
    });
    expectNoTemporaryVaultObjects(promotedFailureRoot);
    expect(readFileSync(
      join(promotedFailureRoot, "ibkr", `${digest}.csv`),
    )).toEqual(sourceBytes);
  });

  it("fails before promotion on evidence, identity, or HMAC authority mismatch", () => {
    const wrongEvidence = createHarness();
    expect(() => importTraderLinkPlatformJournalSource({
      ...wrongEvidence.importOptions,
      expectedEvidence: {
        ...wrongEvidence.importOptions.expectedEvidence,
        aggregatePreviewSha256: "0".repeat(64),
      },
    })).toThrowError("TRADERLINK_JOURNAL_IMPORT_SOURCE_EVIDENCE_MISMATCH");

    const noIdentity = createHarness({ linkIdentity: false });
    expect(() => importTraderLinkPlatformJournalSource(noIdentity.importOptions))
      .toThrowError("TRADERLINK_JOURNAL_SOURCE_IMPORT_PRECONDITION_FAILED");

    const noJournalAuthority = createHarness();
    expect(() => importTraderLinkPlatformJournalSource({
      ...noJournalAuthority.importOptions,
      environment: {
        ...noJournalAuthority.environment,
        TRADERLINK_PLATFORM_JOURNAL_HMAC_KEYS_JSON: undefined,
      },
    })).toThrowError("TRADERLINK_JOURNAL_PRIVACY_CONFIGURATION_INVALID");

    for (const nodeEnvironment of [undefined, "test", "production"] as const) {
      const wrongEnvironment = createHarness();
      expect(() => importTraderLinkPlatformJournalSource({
        ...wrongEnvironment.importOptions,
        environment: {
          ...wrongEnvironment.environment,
          NODE_ENV: nodeEnvironment,
        },
      })).toThrowError(
        "TRADERLINK_JOURNAL_SOURCE_IMPORT_AUTHORIZATION_REQUIRED",
      );
    }
  });

  it("imports through the normal command service and exact reimport is a no-write result", () => {
    const harness = createHarness();
    const first = runTraderLinkPlatformJournalSourceImport(
      harness.importArguments,
      harness.environment,
      {
        databasePath: harness.databasePath,
        forbiddenRepositoryRoots: [],
        protectedStorageRoots: harness.protectedRoots,
        additionalForbiddenRepositoryRoot: harness.repositoryRoot,
        now: harness.importOptions.now,
      },
    );
    const countsBefore = Object.freeze({
      batches: count(harness.databasePath, "journal_import_batches"),
      rows: count(harness.databasePath, "journal_source_rows"),
      executions: count(harness.databasePath, "journal_executions"),
    });
    const second = importTraderLinkPlatformJournalSource(harness.importOptions);
    expect(first.status).toBe("journal_source_import_committed_verification_required");
    expect(second).toMatchObject({
      status: "journal_source_already_imported",
      vaultObjectStatus: "already_present",
      importBatchId: first.importBatchId,
      postImportVerification: "required",
    });
    expect({
      batches: count(harness.databasePath, "journal_import_batches"),
      rows: count(harness.databasePath, "journal_source_rows"),
      executions: count(harness.databasePath, "journal_executions"),
    }).toEqual(countsBefore);
    expectNoPendingWal(harness.databasePath);
    expect(
      verifyTraderLinkPlatformJournalIntegrity(
        verificationOptions(harness, second.importBatchId),
      ),
    ).toMatchObject({
      status: "journal_integrity_verified",
      importBatchId: first.importBatchId,
      counts: {
        sourceRows: 2_284,
        executions: 1_072,
        readyClosedRoundTrips: 331,
        legitimateOpenRoundTrips: 0,
        needsDecisionRoundTrips: 2,
      },
    });
    expectNoPendingWal(harness.databasePath);
    const serialized = JSON.stringify([first, second]);
    for (const privateValue of [
      harness.sourcePath,
      "SYNTH-ACCOUNT",
      "SYNTH-FILL-0",
      "S000",
      "2026-01-01",
      "10:00:00",
    ]) expect(serialized).not.toContain(privateValue);
  });

  it("rolls back the database after promotion and reports only recoverable orphan metadata", () => {
    const harness = createHarness();
    let thrown: unknown;
    try {
      importTraderLinkPlatformJournalSource({
        ...harness.importOptions,
        testHooks: {
          afterDatabaseMutationBeforeCommit: () => {
            throw new Error("SYNTH-ACCOUNT private database failure");
          },
        },
      });
    } catch (error) {
      thrown = error;
    }
    expect(isTraderLinkPlatformError(thrown)).toBe(true);
    expect((thrown as { code: string }).code).toBe(
      "TRADERLINK_JOURNAL_SOURCE_IMPORT_ORPHANED_EVIDENCE",
    );
    expect((thrown as { safeContext: Record<string, unknown> }).safeContext)
      .toEqual({
        evidenceObjectKey:
          `ibkr/${harness.importOptions.expectedEvidence.sourceFileSha256}.csv`,
        orphanState: "vault_object_unreferenced",
      });
    expect(count(harness.databasePath, "journal_import_batches")).toBe(0);
    expect(count(harness.databasePath, "journal_source_rows")).toBe(0);
    expect(count(harness.databasePath, "journal_executions")).toBe(0);
    expect(JSON.stringify(thrown)).not.toContain(harness.sourcePath);
    expect(JSON.stringify(thrown)).not.toContain("SYNTH-ACCOUNT");

    const resumedFailure = expectStableFailure(
      () => importTraderLinkPlatformJournalSource({
        ...harness.importOptions,
        testHooks: {
          afterDatabaseMutationBeforeCommit: () => {
            throw new Error("synthetic retry failure");
          },
        },
      }),
      "TRADERLINK_JOURNAL_SOURCE_IMPORT_ORPHANED_EVIDENCE",
    );
    expect(resumedFailure.safeContext).toEqual({
      evidenceObjectKey:
        `ibkr/${harness.importOptions.expectedEvidence.sourceFileSha256}.csv`,
      orphanState: "vault_object_reference_unverified",
    });
  });

  it("fails closed on relationship, fork, allocation, rebuild, and evidence corruption", () => {
    const harness = createHarness();
    const imported = importTraderLinkPlatformJournalSource(harness.importOptions);
    expect(importTraderLinkPlatformJournalSource(harness.importOptions).status)
      .toBe("journal_source_already_imported");
    const options = verificationOptions(harness, imported.importBatchId);
    const requireCleanVerification = (): void => {
      expectNoPendingWal(harness.databasePath);
      expect(verifyTraderLinkPlatformJournalIntegrity(options).status)
        .toBe("journal_integrity_verified");
      expectNoPendingWal(harness.databasePath);
    };
    requireCleanVerification();

    const sourceIdentityFingerprint = withWriteDatabase(
      harness.databasePath,
      (database) => {
        const row = database.prepare(`SELECT source_identity_id,
       source_account_fingerprint
FROM journal_account_source_identities
WHERE source_system = 'ibkr' AND status <> 'superseded'
ORDER BY source_identity_id LIMIT 1`).get() as {
          source_identity_id: string;
          source_account_fingerprint: string;
        };
        database.prepare(`UPDATE journal_account_source_identities
SET source_account_fingerprint = ? WHERE source_identity_id = ?`)
          .run("0".repeat(64), row.source_identity_id);
        return row;
      },
    );
    expectStableFailure(
      () => verifyTraderLinkPlatformJournalIntegrity(options),
      "TRADERLINK_JOURNAL_INTEGRITY_VERIFICATION_FAILED",
      "vault_source_account_identity_resolution",
    );
    withWriteDatabase(harness.databasePath, (database) => {
      database.prepare(`UPDATE journal_account_source_identities
SET source_account_fingerprint = ? WHERE source_identity_id = ?`)
        .run(
          sourceIdentityFingerprint.source_account_fingerprint,
          sourceIdentityFingerprint.source_identity_id,
        );
    });
    requireCleanVerification();

    withWriteDatabase(harness.databasePath, (database) => {
      database.prepare(`UPDATE journal_import_batches
SET preserved_row_count = preserved_row_count + 1`).run();
    });
    expectStableFailure(
      () => verifyTraderLinkPlatformJournalIntegrity(options),
      "TRADERLINK_JOURNAL_INTEGRITY_VERIFICATION_FAILED",
      "import_aggregate_counts",
    );
    withWriteDatabase(harness.databasePath, (database) => {
      database.prepare(`UPDATE journal_import_batches
SET preserved_row_count = preserved_row_count - 1`).run();
    });

    const sourceRow = withWriteDatabase(harness.databasePath, (database) => {
      const row = database.prepare(`SELECT source_row_id, raw_record_sha256
FROM journal_source_rows ORDER BY record_ordinal LIMIT 1`).get() as {
        source_row_id: string;
        raw_record_sha256: string;
      };
      database.prepare(`UPDATE journal_source_rows SET raw_record_sha256 = ?
WHERE source_row_id = ?`).run("0".repeat(64), row.source_row_id);
      return row;
    });
    expectStableFailure(
      () => verifyTraderLinkPlatformJournalIntegrity(options),
      "TRADERLINK_JOURNAL_INTEGRITY_VERIFICATION_FAILED",
      "stored_source_row_evidence",
    );
    withWriteDatabase(harness.databasePath, (database) => {
      database.prepare(`UPDATE journal_source_rows SET raw_record_sha256 = ?
WHERE source_row_id = ?`)
        .run(sourceRow.raw_record_sha256, sourceRow.source_row_id);
    });

    const positionFact = withWriteDatabase(harness.databasePath, (database) => {
      const row = database.prepare(`SELECT position_fact_id, quantity_decimal
FROM journal_position_facts ORDER BY position_fact_id LIMIT 1`).get() as {
        position_fact_id: string;
        quantity_decimal: string;
      };
      database.prepare(`UPDATE journal_position_facts SET quantity_decimal = '999'
WHERE position_fact_id = ?`).run(row.position_fact_id);
      return row;
    });
    expectStableFailure(
      () => verifyTraderLinkPlatformJournalIntegrity(options),
      "TRADERLINK_JOURNAL_INTEGRITY_VERIFICATION_FAILED",
      "stored_position_fact_evidence",
    );
    withWriteDatabase(harness.databasePath, (database) => {
      database.prepare(`UPDATE journal_position_facts SET quantity_decimal = ?
WHERE position_fact_id = ?`)
        .run(positionFact.quantity_decimal, positionFact.position_fact_id);
    });

    const executionVersion = withWriteDatabase(harness.databasePath, (database) => {
      const row = database.prepare(`SELECT execution_version_id, price_decimal
FROM journal_execution_versions ORDER BY execution_version_id LIMIT 1`).get() as {
        execution_version_id: string;
        price_decimal: string;
      };
      database.prepare(`UPDATE journal_execution_versions SET price_decimal = '999'
WHERE execution_version_id = ?`).run(row.execution_version_id);
      return row;
    });
    expectStableFailure(
      () => verifyTraderLinkPlatformJournalIntegrity(options),
      "TRADERLINK_JOURNAL_INTEGRITY_VERIFICATION_FAILED",
      "stored_execution_content",
    );
    withWriteDatabase(harness.databasePath, (database) => {
      database.prepare(`UPDATE journal_execution_versions SET price_decimal = ?
WHERE execution_version_id = ?`)
        .run(executionVersion.price_decimal, executionVersion.execution_version_id);
    });

    const provenance = withWriteDatabase(harness.databasePath, (database) => {
      const row = database.prepare(`SELECT execution_provenance_id,
       provider_identity_sha256
FROM journal_execution_provenance
WHERE provider_identity_sha256 IS NOT NULL
ORDER BY execution_provenance_id LIMIT 1`).get() as {
        execution_provenance_id: string;
        provider_identity_sha256: string;
      };
      database.prepare(`UPDATE journal_execution_provenance
SET provider_identity_sha256 = ? WHERE execution_provenance_id = ?`)
        .run("0".repeat(64), row.execution_provenance_id);
      return row;
    });
    expectStableFailure(
      () => verifyTraderLinkPlatformJournalIntegrity(options),
      "TRADERLINK_JOURNAL_INTEGRITY_VERIFICATION_FAILED",
      "stored_execution_provenance_evidence",
    );
    withWriteDatabase(harness.databasePath, (database) => {
      database.prepare(`UPDATE journal_execution_provenance
SET provider_identity_sha256 = ? WHERE execution_provenance_id = ?`)
        .run(
          provenance.provider_identity_sha256,
          provenance.execution_provenance_id,
        );
    });

    const allocation = withWriteDatabase(harness.databasePath, (database) => {
      const row = database.prepare(`SELECT allocation_id, quantity_decimal
FROM journal_round_trip_execution_allocations LIMIT 1`).get() as {
        allocation_id: string;
        quantity_decimal: string;
      };
      database.prepare(`UPDATE journal_round_trip_execution_allocations
SET quantity_decimal = '999' WHERE allocation_id = ?`).run(row.allocation_id);
      return row;
    });
    expectStableFailure(
      () => verifyTraderLinkPlatformJournalIntegrity(options),
      "TRADERLINK_JOURNAL_INTEGRITY_VERIFICATION_FAILED",
      "allocation_conservation",
    );
    withWriteDatabase(harness.databasePath, (database) => {
      database.prepare(`UPDATE journal_round_trip_execution_allocations
SET quantity_decimal = ? WHERE allocation_id = ?`)
        .run(allocation.quantity_decimal, allocation.allocation_id);
    });

    const rebuildId = createCanonicalUuidV4();
    withWriteDatabase(harness.databasePath, (database) => {
      database.prepare(`INSERT INTO journal_chain_rebuilds (
  rebuild_id, workspace_id, account_id, instrument_id, trade_currency,
  chain_key_sha256, trigger_kind, trigger_import_event_id,
  trigger_decision_event_id, maintenance_reason_code, previous_rebuild_id,
  algorithm_version, ordered_input_sha256, output_sha256, coverage_state,
  ready_closed_count, legitimate_open_count, needs_decision_count,
  excluded_count, first_execution_at_utc, last_execution_at_utc,
  completed_at_utc
)
SELECT ?, workspace_id, account_id, instrument_id, trade_currency,
  chain_key_sha256, 'maintenance', NULL, NULL, 'synthetic_fork',
  previous_rebuild_id, algorithm_version, ordered_input_sha256, output_sha256,
  coverage_state, ready_closed_count, legitimate_open_count,
  needs_decision_count, excluded_count, first_execution_at_utc,
  last_execution_at_utc, completed_at_utc
FROM journal_chain_rebuilds LIMIT 1`).run(rebuildId);
    });
    expectStableFailure(
      () => verifyTraderLinkPlatformJournalIntegrity(options),
      "TRADERLINK_JOURNAL_INTEGRITY_VERIFICATION_FAILED",
      "rebuild_latest_fork",
    );
    withWriteDatabase(harness.databasePath, (database) => {
      database.prepare("DELETE FROM journal_chain_rebuilds WHERE rebuild_id = ?")
        .run(rebuildId);
    });

    const rebuild = withWriteDatabase(harness.databasePath, (database) => {
      const row = database.prepare(`SELECT rebuild_id, ordered_input_sha256
FROM journal_chain_rebuilds LIMIT 1`).get() as {
        rebuild_id: string;
        ordered_input_sha256: string;
      };
      database.prepare(`UPDATE journal_chain_rebuilds
SET ordered_input_sha256 = ? WHERE rebuild_id = ?`)
        .run("0".repeat(64), row.rebuild_id);
      return row;
    });
    expectStableFailure(
      () => verifyTraderLinkPlatformJournalIntegrity(options),
      "TRADERLINK_JOURNAL_INTEGRITY_VERIFICATION_FAILED",
      "stale_chain_rebuild",
    );
    withWriteDatabase(harness.databasePath, (database) => {
      database.prepare(`UPDATE journal_chain_rebuilds
SET ordered_input_sha256 = ? WHERE rebuild_id = ?`)
        .run(rebuild.ordered_input_sha256, rebuild.rebuild_id);
    });
    const objectPath = join(
      harness.vaultRoot,
      "ibkr",
      `${harness.importOptions.expectedEvidence.sourceFileSha256}.csv`,
    );
    const original = readFileSync(objectPath);
    writeFileSync(objectPath, Buffer.from("synthetic corruption", "utf8"));
    expectStableFailure(
      () => verifyTraderLinkPlatformJournalIntegrity(options),
      "TRADERLINK_JOURNAL_EVIDENCE_VAULT_CONFLICT",
    );
    expect(original.byteLength).toBe(harness.importOptions.expectedEvidence.sourceFileSizeBytes);
  });

  it("requires retained account and Journal HMAC authority without leaking raw values", () => {
    const harness = createHarness();
    const imported = importTraderLinkPlatformJournalSource(harness.importOptions);
    const options = verificationOptions(harness, imported.importBatchId);
    const historicalIdentityId = createCanonicalUuidV4();
    withWriteDatabase(harness.databasePath, (database) => {
      database.prepare(`INSERT INTO journal_account_source_identities (
  source_identity_id, workspace_id, account_id, source_system,
  fingerprint_scheme_version, source_account_canonicalization_version,
  hmac_key_version, source_account_fingerprint, privacy_safe_display,
  status, first_seen_at_utc, last_seen_at_utc
)
SELECT ?, workspace_id, account_id, source_system,
  fingerprint_scheme_version, source_account_canonicalization_version,
  'historicalkey', ?, 'Historical broker source', 'superseded',
  first_seen_at_utc, last_seen_at_utc
FROM journal_account_source_identities
WHERE status <> 'superseded' LIMIT 1`)
        .run(historicalIdentityId, "0".repeat(64));
    });
    expectStableFailure(
      () => verifyTraderLinkPlatformJournalIntegrity(options),
      "TRADERLINK_ACCOUNT_IDENTITY_RECOVERY_REQUIRED",
    );
    withWriteDatabase(harness.databasePath, (database) => {
      database.prepare(`DELETE FROM journal_account_source_identities
WHERE source_identity_id = ?`).run(historicalIdentityId);
    });

    const missingAuthority = {
      ...options,
      environment: {
        ...harness.environment,
        TRADERLINK_PLATFORM_JOURNAL_HMAC_ACTIVE_KEY_VERSION: "newkey",
        TRADERLINK_PLATFORM_JOURNAL_HMAC_KEYS_JSON: JSON.stringify({
          newkey: Buffer.alloc(32, 41).toString("base64"),
        }),
      },
    };
    let thrown: unknown;
    try {
      verifyTraderLinkPlatformJournalIntegrity(missingAuthority);
    } catch (error) {
      thrown = error;
    }
    expect(isTraderLinkPlatformError(thrown)).toBe(true);
    const serialized = JSON.stringify(thrown);
    expect(serialized).not.toContain(harness.sourcePath);
    expect(serialized).not.toContain("SYNTH-ACCOUNT");
    expect(serialized).not.toContain("SYNTH-FILL-0");
    expect(serialized).not.toContain(ACCOUNT_FINGERPRINT_SCHEME_VERSION + ":");
  });
});
