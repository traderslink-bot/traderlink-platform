import { randomBytes } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import type Database from "better-sqlite3";

import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { openPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { createCanonicalUuidV4 } from "@/src/modules/platform/server/database/platform-migration-contract";
import { runPlatformMigrations } from "@/src/modules/platform/server/database/run-platform-migrations";
import { PlatformUserRepository } from "@/src/modules/platform/server/identity/platform-user-repository";
import { PlatformWorkspaceRepository } from "@/src/modules/platform/server/identity/platform-workspace-repository";
import { JournalAccountRepository } from "../accounts/journal-account-repository";
import { JournalAccountService } from "../accounts/journal-account-service";
import { JOURNAL_SOURCE_ACCOUNT_CANONICALIZERS } from "../accounts/mapped-statement-source-account-canonicalizer";
import { JournalExecutionRepository } from "../executions/journal-execution-repository";
import { JournalExecutionService } from "../executions/journal-execution-service";
import {
  createJournalPrivacyDigester,
  JournalImportService,
  type JournalPrivacyHmacConfiguration,
  type ManualExecutionInput,
} from "./journal-import-service";
import {
  type ExistingImportBatch,
  JournalImportRepository,
} from "./journal-import-repository";
import { mappingContractFromSupportTable } from "./journal-generic-mapped-statement-adapter";
import { createJournalMappingSupportPackage } from "../product/journal-mapping-support-package";
import { JournalExecutionReconciliationRepository } from "../reconciliation/journal-execution-reconciliation-repository";
import { syntheticIbkrStatement } from "./synthetic-ibkr-fixtures";

const roots: string[] = [];
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });

function createAccountService(
  database: Database.Database,
  privacyConfiguration: JournalPrivacyHmacConfiguration,
): JournalAccountService {
  return new JournalAccountService(new JournalAccountRepository(database), {
    ...privacyConfiguration,
    activeCanonicalizationVersion: "ibkr_v1",
    canonicalizers: {
      ibkr_v1: (value) => value.trim().toUpperCase(),
      ...JOURNAL_SOURCE_ACCOUNT_CANONICALIZERS,
    },
  });
}

function createImportService(
  database: Database.Database,
  accounts: JournalAccountService,
  privacyConfiguration: JournalPrivacyHmacConfiguration,
  imports = new JournalImportRepository(database),
): JournalImportService {
  return new JournalImportService(
    imports,
    new JournalExecutionRepository(database),
    accounts,
    createJournalPrivacyDigester(privacyConfiguration),
    new JournalExecutionReconciliationRepository(database),
  );
}

function setup(
  configuredPrivacy?: JournalPrivacyHmacConfiguration,
): Readonly<{
  database: Database.Database; scope: WorkspaceAccessScope; accountId: string;
  service: JournalImportService; accounts: JournalAccountService;
  privacyConfiguration: JournalPrivacyHmacConfiguration;
}> {
  const root = mkdtempSync(join(tmpdir(), "traderlink-journal-import-"));
  roots.push(root);
  const database = openPlatformDatabase({ mode: "initializer", databasePath: join(root, "journal.sqlite"), forbiddenRepositoryRoots: [] });
  runPlatformMigrations(database);
  const users = new PlatformUserRepository(database, { allowedAuthProviders: ["test"] });
  const workspaces = new PlatformWorkspaceRepository(database);
  const privacyConfiguration = configuredPrivacy ?? Object.freeze({
    activeKeyVersion: "testkey",
    keysBase64: Object.freeze({ testkey: randomBytes(32).toString("base64") }),
  });
  const accounts = createAccountService(database, privacyConfiguration);
  const now = "2026-08-01T12:00:00.000Z";
  const userId = createCanonicalUuidV4();
  const workspaceId = createCanonicalUuidV4();
  users.createUser({ userId, authProvider: "test", authSubject: "owner", displayName: "Owner", createdAtUtc: now, updatedAtUtc: now });
  workspaces.createWorkspaceWithOwner({ workspaceId, ownerUserId: userId, displayName: "Workspace", defaultTradingTimezone: "America/New_York", createdAtUtc: now });
  const creationScope: WorkspaceAccessScope = { userId, workspaceId, workspaceRole: "owner", allowedAccountIds: [], activeAccountId: null };
  const account = accounts.createAccount(creationScope, { workspaceId, displayName: "Journal", baseCurrency: "USD", tradingTimezone: "America/New_York", now: new Date(now) });
  const scope: WorkspaceAccessScope = { ...creationScope, allowedAccountIds: [account.accountId], activeAccountId: account.accountId };
  accounts.confirmSourceIdentityLinkRecord(scope, { accountId: account.accountId, sourceSystem: "ibkr", rawSourceAccountId: "SYNTH-ACCOUNT", privacySafeDisplay: "Synthetic account", now: new Date(now) });
  const service = createImportService(database, accounts, privacyConfiguration);
  return Object.freeze({
    database,
    scope,
    accountId: account.accountId,
    service,
    accounts,
    privacyConfiguration,
  });
}

class HideFirstImportIdentityLookupRepository extends JournalImportRepository {
  private hideFileDigestLookup: boolean;
  private hideManualIdempotencyLookup: boolean;

  constructor(
    database: Database.Database,
    input: Readonly<{
      hideFileDigest?: boolean;
      hideManualIdempotency?: boolean;
      brokerAccountIdOverride?: string;
    }>,
  ) {
    super(database);
    this.hideFileDigestLookup = input.hideFileDigest ?? false;
    this.hideManualIdempotencyLookup = input.hideManualIdempotency ?? false;
    this.brokerAccountIdOverride = input.brokerAccountIdOverride;
  }

  private readonly brokerAccountIdOverride: string | undefined;

  override findByFileDigest(
    workspaceId: string,
    sourceSystem: string,
    digest: string,
  ): ExistingImportBatch | null {
    if (this.hideFileDigestLookup) {
      this.hideFileDigestLookup = false;
      return null;
    }
    const prior = super.findByFileDigest(workspaceId, sourceSystem, digest);
    return prior && this.brokerAccountIdOverride
      ? Object.freeze({ ...prior, accountId: this.brokerAccountIdOverride })
      : prior;
  }

  override findByManualIdempotency(
    workspaceId: string,
    accountId: string,
    key: string,
  ): ExistingImportBatch | null {
    if (this.hideManualIdempotencyLookup) {
      this.hideManualIdempotencyLookup = false;
      return null;
    }
    return super.findByManualIdempotency(workspaceId, accountId, key);
  }
}

function count(database: Database.Database, table: string, where = "", parameters: readonly unknown[] = []): number {
  const row = database.prepare(`SELECT COUNT(*) AS count FROM ${table} ${where}`).get(...parameters) as { count: number };
  return row.count;
}

function ibkrCsv(trades: readonly string[], period = "January 1, 2026 - January 31, 2026"): string {
  return [
    "Statement,Header,Field Name,Field Value", `Statement,Data,Period,"${period}"`,
    "Account Information,Header,Field Name,Field Value", "Account Information,Data,Account,SYNTH-ACCOUNT",
    "Trades,Header,DataDiscriminator,Asset Category,Currency,Symbol,Date/Time,Quantity,T. Price,Comm/Fee,TradeID",
    ...trades,
  ].join("\r\n");
}

function brokerCommit(
  context: Pick<ReturnType<typeof setup>, "scope" | "service">,
  csvText: string,
) {
  const sourceBytes = Buffer.from(csvText, "utf8");
  const preview = context.service.previewIbkr(sourceBytes, "America/New_York");
  return context.service.commitIbkrStatement(context.scope, {
    sourceBytes, sourceTimezone: "America/New_York", privacySafeAccountDisplay: "Synthetic account",
    sourceDisplayLabel: "Synthetic statement", evidenceObjectKey: `ibkr/${preview.sourceFileSha256}.csv`,
    now: new Date("2026-08-01T13:00:00.000Z"),
  });
}

const manualEntry: ManualExecutionInput = Object.freeze({
  sourceTimestampText: "2026-01-08, 09:35:00", sourceTimezone: "America/New_York",
  normalizedSymbol: "MANU", tradeCurrency: "USD", side: "buy", quantityDecimal: "50",
  priceDecimal: "7.5", feesDecimal: null, feeCurrency: null, feeSignConvention: "not_reported",
});

describe("Journal import service", () => {
  it("validates the complete versioned privacy-key map and preserves purpose separation", () => {
    const activeKey = Buffer.alloc(32, 17).toString("base64");
    const retainedKey = Buffer.alloc(32, 29).toString("base64");
    expect(() => createJournalPrivacyDigester({
      activeKeyVersion: "activekey",
      keysBase64: {},
    })).toThrowError("TRADERLINK_JOURNAL_PRIVACY_CONFIGURATION_INVALID");
    expect(() => createJournalPrivacyDigester({
      activeKeyVersion: "activekey",
      keysBase64: { activekey: Buffer.alloc(31, 17).toString("base64") },
    })).toThrowError("TRADERLINK_JOURNAL_PRIVACY_CONFIGURATION_INVALID");
    expect(() => createJournalPrivacyDigester({
      activeKeyVersion: "activekey",
      keysBase64: { activekey: `${activeKey}=`, retainedkey: retainedKey },
    })).toThrowError("TRADERLINK_JOURNAL_PRIVACY_CONFIGURATION_INVALID");
    expect(() => createJournalPrivacyDigester({
      activeKeyVersion: "ActiveKey",
      keysBase64: { ActiveKey: activeKey },
    })).toThrowError("TRADERLINK_JOURNAL_PRIVACY_CONFIGURATION_INVALID");
    const maximumKeyVersion = `k${"v".repeat(47)}`;
    const overlongKeyVersion = `k${"v".repeat(48)}`;
    expect(createJournalPrivacyDigester({
      activeKeyVersion: maximumKeyVersion,
      keysBase64: { [maximumKeyVersion]: activeKey },
    }).activeSchemeVersion).toHaveLength(64);
    expect(() => createJournalPrivacyDigester({
      activeKeyVersion: overlongKeyVersion,
      keysBase64: { [overlongKeyVersion]: activeKey },
    })).toThrowError("TRADERLINK_JOURNAL_PRIVACY_CONFIGURATION_INVALID");

    const digester = createJournalPrivacyDigester({
      activeKeyVersion: "activekey",
      keysBase64: { retainedkey: retainedKey, activekey: activeKey },
    });
    expect(digester.activeSchemeVersion).toBe("journal_hmac_v1_activekey");
    expect(digester.schemeVersions).toEqual([
      "journal_hmac_v1_activekey",
      "journal_hmac_v1_retainedkey",
    ]);
    expect(digester.candidateDigests("broker_execution", "synthetic-value")).toHaveLength(2);
    expect(digester.activeDigest("broker_execution", "synthetic-value").digestSha256)
      .not.toBe(digester.activeDigest("execution_content", "synthetic-value").digestSha256);
  });

  it("returns a privacy-safe aggregate preview rather than parsed private rows", () => {
    const context = setup();
    try {
      const preview = context.service.previewIbkr(
        Buffer.from(syntheticIbkrStatement, "utf8"),
        "America/New_York",
      );
      expect(preview).toMatchObject({
        canCommit: true,
        hasSourceAccountIdentity: true,
        preservedRowCount: 12,
        mappedExecutionCount: 2,
        unsupportedRowCount: 1,
      });
      expect(preview).not.toHaveProperty("rawSourceAccountId");
      expect(preview).not.toHaveProperty("rows");
      expect(preview).not.toHaveProperty("executions");
      expect(JSON.stringify(preview)).not.toContain("SYNTH-ACCOUNT");
      expect(JSON.stringify(preview)).not.toContain("ALPHA");
      const identityBefore = context.database.prepare(`SELECT last_seen_at_utc
FROM journal_account_source_identities`).get();
      const scoped = context.service.previewIbkrForWorkspace(context.scope, {
        sourceBytes: Buffer.from(syntheticIbkrStatement, "utf8"),
        sourceTimezone: "America/New_York",
      });
      expect(scoped).toMatchObject({
        accountId: context.accountId,
        exactReimport: false,
        plannedNewExecutionCount: 2,
        plannedMatchedExecutionCount: 0,
        plannedAmbiguousExecutionCount: 0,
        expectedPendingSourceDecisionCount: 0,
      });
      expect(JSON.stringify(scoped)).not.toContain("SYNTH-ACCOUNT");
      expect(JSON.stringify(scoped)).not.toContain("ALPHA");
      expect(context.database.prepare(`SELECT last_seen_at_utc
FROM journal_account_source_identities`).get()).toEqual(identityBefore);
      const timezoneMismatch = context.service.previewIbkrForWorkspace(context.scope, {
        sourceBytes: Buffer.from(syntheticIbkrStatement, "utf8"),
        sourceTimezone: "UTC",
      });
      expect(timezoneMismatch.expectedPendingSourceDecisionCount).toBe(1);
      expect(timezoneMismatch.issues).toContainEqual(expect.objectContaining({
        issueCode: "source_timezone_differs_from_account",
        count: 1,
      }));
    } finally { context.database.close(); }
  });

  it("learns an exact account-scoped mapping without hiding valid rows", () => {
    const context = setup();
    try {
      const firstBytes = new TextEncoder().encode([
        "Trade Date,Trade Time,Ticker,Action,Shares,Fill Price,Commission,Fill ID",
        "2026-07-01,09:30:00,AAA,BUY,10.5000,1.2300,0.4500,FILL-1",
        "2026-07-01,not-a-time,AAA,SELL,2,1.4,0.12,FILL-2",
      ].join("\n"));
      const support = createJournalMappingSupportPackage({
        sourceBytes: firstBytes,
        brokerName: "Example Broker",
        failureCode: "TRADERLINK_JOURNAL_IMPORT_MAPPING_FAILED",
      });
      const table = support.tables[0];
      if (!table) throw new Error("expected_mapping_table");
      const mapping = mappingContractFromSupportTable({
        brokerName: "Example Broker",
        sourceTimezone: "America/New_York",
        defaultCurrency: "USD",
        table,
        delimiter: support.detectedDelimiter,
        columns: {
          date: "Trade Date",
          time: "Trade Time",
          symbol: "Ticker",
          side: "Action",
          quantity: "Shares",
          price: "Fill Price",
          fees: "Commission",
          executionId: "Fill ID",
        },
      });
      const preview = context.service.previewGenericMappedForWorkspace(context.scope, {
        sourceBytes: firstBytes,
        accountId: context.accountId,
        mapping,
      });
      expect(preview).toMatchObject({
        mappedExecutionCount: 1,
        canCommit: true,
        plannedNewExecutionCount: 1,
      });
      const committed = context.service.commitGenericMappedStatement(context.scope, {
        sourceBytes: firstBytes,
        accountId: context.accountId,
        mapping,
        sourceDisplayLabel: "Example Broker mapped statement",
        evidenceObjectKey: `mapped_csv/${preview.sourceFileSha256}.csv`,
        now: new Date("2026-08-01T12:05:00.000Z"),
      });
      expect(committed.createdExecutionCount).toBe(1);
      expect(committed.pendingSourceDecisionCount).toBeGreaterThan(0);
      const saved = context.service.findSavedGenericMappingForWorkspace(context.scope, {
        accountId: context.accountId,
        structuralSignatureSha256: table.structuralSignatureSha256,
        brokerName: "Example Broker",
      });
      expect(saved).toEqual(mapping);
      if (!saved) throw new Error("expected_saved_mapping");
      expect(context.service.findSavedGenericMappingForWorkspace(context.scope, {
        accountId: context.accountId,
        structuralSignatureSha256: table.structuralSignatureSha256,
        brokerName: "Different Broker",
      })).toBeNull();

      const laterBytes = new TextEncoder().encode([
        "Trade Date,Trade Time,Ticker,Action,Shares,Fill Price,Commission,Fill ID",
        "2026-07-02,10:15:00,BBB,SELL,3,8.75,0.20,FILL-3",
      ].join("\n"));
      const laterSupport = createJournalMappingSupportPackage({
        sourceBytes: laterBytes,
        brokerName: "Example Broker",
        failureCode: "none",
      });
      expect(laterSupport.tables[0]?.structuralSignatureSha256)
        .toBe(table.structuralSignatureSha256);
      expect(context.service.previewGenericMappedForWorkspace(context.scope, {
        sourceBytes: laterBytes,
        accountId: context.accountId,
        mapping: saved,
      }).mappedExecutionCount).toBe(1);

      const second = context.accounts.createAccount(context.scope, {
        workspaceId: context.scope.workspaceId,
        displayName: "Second journal",
        baseCurrency: "USD",
        tradingTimezone: "America/New_York",
      });
      const twoAccountScope: WorkspaceAccessScope = {
        ...context.scope,
        allowedAccountIds: [context.accountId, second.accountId],
      };
      expect(context.service.findSavedGenericMappingForWorkspace(twoAccountScope, {
        accountId: second.accountId,
        structuralSignatureSha256: table.structuralSignatureSha256,
        brokerName: "Example Broker",
      })).toBeNull();

      const changedSupport = createJournalMappingSupportPackage({
        sourceBytes: new TextEncoder().encode([
          "Trade Date,Trade Time,Ticker,Action,Shares,Average Fill Price,Commission,Fill ID",
          "2026-07-03,10:15:00,CCC,BUY,1,2.5,0.10,FILL-4",
        ].join("\n")),
        brokerName: "Example Broker",
        failureCode: "none",
      });
      const changedTable = changedSupport.tables[0];
      if (!changedTable) throw new Error("expected_changed_mapping_table");
      expect(changedSupport.tables[0]?.structuralSignatureSha256)
        .not.toBe(table.structuralSignatureSha256);
      expect(context.service.findSavedGenericMappingForWorkspace(context.scope, {
        accountId: context.accountId,
        structuralSignatureSha256: changedTable.structuralSignatureSha256,
        brokerName: "Example Broker",
      })).toBeNull();
    } finally { context.database.close(); }
  });

  it("commits every source record and makes exact file reimport idempotent", () => {
    const context = setup();
    try {
      const first = brokerCommit(context, syntheticIbkrStatement);
      const second = brokerCommit(context, syntheticIbkrStatement);
      expect(first.status).toBe("committed");
      expect(second).toMatchObject({ status: "already_imported", importBatchId: first.importBatchId });
      expect(count(context.database, "journal_import_batches")).toBe(1);
      expect(count(context.database, "journal_source_rows")).toBe(12);
      expect(count(context.database, "journal_executions")).toBe(2);
      expect(context.service.previewIbkrForWorkspace(context.scope, {
        sourceBytes: Buffer.from(syntheticIbkrStatement, "utf8"),
        sourceTimezone: "America/New_York",
      })).toMatchObject({
        exactReimport: true,
        existingImportBatchId: first.importBatchId,
        plannedNewExecutionCount: 0,
        plannedMatchedExecutionCount: 2,
      });
    } finally { context.database.close(); }
  });

  it("links a newly recognized IBKR account only after explicit selected-account confirmation", () => {
    const context = setup();
    try {
      context.database.prepare("DELETE FROM journal_account_source_identities").run();
      const sourceBytes = Buffer.from(syntheticIbkrStatement, "utf8");
      expect(() => context.service.previewIbkrForWorkspace(context.scope, {
        sourceBytes,
        sourceTimezone: "America/New_York",
      })).toThrowError("TRADERLINK_ACCOUNT_IDENTITY_CONFIRMATION_REQUIRED");
      const preview = context.service.previewIbkrForWorkspace(context.scope, {
        sourceBytes,
        sourceTimezone: "America/New_York",
        allowSelectedAccountIdentityConfirmation: true,
      });
      expect(preview).toMatchObject({
        accountId: context.accountId,
        canCommit: true,
        sourceIdentityConfirmationRequired: true,
      });
      const input = {
        sourceBytes,
        sourceTimezone: "America/New_York",
        privacySafeAccountDisplay: "Synthetic account",
        sourceDisplayLabel: "Synthetic statement",
        evidenceObjectKey: `ibkr/${preview.sourceFileSha256}.csv`,
        now: new Date("2026-08-01T13:00:00.000Z"),
      } as const;
      expect(() => context.service.commitIbkrStatement(context.scope, input))
        .toThrowError("TRADERLINK_ACCOUNT_IDENTITY_CONFIRMATION_REQUIRED");
      expect(context.service.commitIbkrStatement(context.scope, {
        ...input,
        confirmedSourceIdentityAccountId: context.accountId,
      }).status).toBe("committed");
      expect(count(context.database, "journal_account_source_identities")).toBe(1);
    } finally { context.database.close(); }
  });

  it("preserves raw unsupported rows whose derived metadata exceeds storage bounds", () => {
    const context = setup();
    try {
      const longSectionName = "S".repeat(121);
      const csvText = `${syntheticIbkrStatement}\r\n${longSectionName},Header,Field`;
      const result = brokerCommit(context, csvText);
      expect(result).toMatchObject({
        status: "committed",
        preservedRowCount: 13,
      });
      const preserved = context.database.prepare(`SELECT section_name, raw_fields_json
FROM journal_source_rows
WHERE record_ordinal = 13`).get() as {
        section_name: string | null;
        raw_fields_json: string;
      };
      expect(preserved.section_name).toBeNull();
      expect(JSON.parse(preserved.raw_fields_json)).toEqual([
        longSectionName,
        "Header",
        "Field",
      ]);
    } finally { context.database.close(); }
  });

  it("rejects a private broker account token in the evidence object key", () => {
    const context = setup();
    try {
      const preview = context.service.previewIbkr(
        Buffer.from(syntheticIbkrStatement, "utf8"),
        "America/New_York",
      );
      expect(() => context.service.commitIbkrStatement(context.scope, {
        sourceBytes: Buffer.from(syntheticIbkrStatement, "utf8"),
        sourceTimezone: "America/New_York",
        privacySafeAccountDisplay: "Synthetic account",
        sourceDisplayLabel: "Synthetic statement",
        evidenceObjectKey: `ibkr/synth-account/${preview.sourceFileSha256}.csv`,
      })).toThrowError("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED");
      expect(() => context.service.commitIbkrStatement(context.scope, {
        sourceBytes: Buffer.from(syntheticIbkrStatement, "utf8"),
        sourceTimezone: "America/New_York",
        privacySafeAccountDisplay: "Synthetic account",
        sourceDisplayLabel: "Synthetic statement",
        evidenceObjectKey: `ibkr/${"x".repeat(255)}/${preview.sourceFileSha256}.csv`,
      })).toThrowError("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED");
      expect(() => context.accounts.confirmSourceIdentityLinkRecord(context.scope, {
        accountId: context.accountId,
        sourceSystem: "ibkr",
        rawSourceAccountId: "SYNTH-ACCOUNT",
        privacySafeDisplay: "Broker account SYNTH-ACCOUNT",
      })).toThrowError("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED");
      expect(() => context.service.commitIbkrStatement(context.scope, {
        sourceBytes: Buffer.from(syntheticIbkrStatement, "utf8"),
        sourceTimezone: "America/New_York",
        privacySafeAccountDisplay: "Synthetic account",
        sourceDisplayLabel: "SYNTH%2DACCOUNT statement",
        evidenceObjectKey: `ibkr/${preview.sourceFileSha256}.csv`,
      })).toThrowError("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED");
      expect(() => context.service.commitIbkrStatement(context.scope, {
        sourceBytes: Buffer.from(syntheticIbkrStatement, "utf8"),
        sourceTimezone: "America/New_York",
        privacySafeAccountDisplay: "Synthetic account",
        sourceDisplayLabel: "Synthetic statement",
        evidenceObjectKey: `ibkr/synth_account/${preview.sourceFileSha256}.csv`,
      })).toThrowError("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED");
      expect(() => context.service.commitIbkrStatement(context.scope, {
        sourceBytes: Buffer.from(syntheticIbkrStatement, "utf8"),
        sourceTimezone: "America/New_York",
        privacySafeAccountDisplay: "Synthetic account",
        sourceDisplayLabel: "Synthetic statement",
        evidenceObjectKey: `/ibkr/${preview.sourceFileSha256}.csv`,
      })).toThrowError("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED");
      expect(() => context.service.commitIbkrStatement(context.scope, {
        sourceBytes: Buffer.from(syntheticIbkrStatement, "utf8"),
        sourceTimezone: "America/New_York",
        privacySafeAccountDisplay: "Synthetic account",
        sourceDisplayLabel: "Synthetic statement",
        evidenceObjectKey: `${["private", "data"].join("-")}/${preview.sourceFileSha256}.csv`,
      })).toThrowError("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED");
      expect(() => context.accounts.confirmSourceIdentityLinkRecord(context.scope, {
        accountId: context.accountId,
        sourceSystem: "ibkr",
        rawSourceAccountId: "SYNTH-ACCOUNT",
        privacySafeDisplay: "ＳＹＮＴＨ＿ＡＣＣＯＵＮＴ",
      })).toThrowError("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED");
      expect(count(context.database, "journal_import_batches")).toBe(0);
    } finally { context.database.close(); }
  });

  it("reconciles overlapping statements by strong fill identity independent of upload order", () => {
    for (const reverse of [false, true]) {
      const context = setup();
      try {
        const january = ibkrCsv([
          'Trades,Data,Order,Stocks,USD,AAA,"2026-01-05, 09:30:00",10,5,,FILL-A',
          'Trades,Data,Order,Stocks,USD,BBB,"2026-01-30, 10:30:00",20,6,,FILL-B',
        ]);
        const february = ibkrCsv([
          'Trades,Data,Order,Stocks,USD,BBB,"2026-01-30, 10:30:00",20,6,,FILL-B',
          'Trades,Data,Order,Stocks,USD,CCC,"2026-02-02, 11:30:00",30,7,,FILL-C',
        ], "January 30, 2026 - February 28, 2026");
        for (const csv of reverse ? [february, january] : [january, february]) brokerCommit(context, csv);
        expect(count(context.database, "journal_executions")).toBe(3);
        expect(count(context.database, "journal_execution_provenance")).toBe(4);
        expect(count(context.database, "journal_source_coverage_intervals", "WHERE asset_class = 'stock'")).toBe(2);
      } finally { context.database.close(); }
    }
  });

  it("matches retained-key aliases after rotation and establishes active execution identities", () => {
    const oldKey = Buffer.alloc(32, 41).toString("base64");
    const activeKey = Buffer.alloc(32, 43).toString("base64");
    const oldConfiguration = Object.freeze({
      activeKeyVersion: "oldkey",
      keysBase64: Object.freeze({ oldkey: oldKey }),
    });
    const context = setup(oldConfiguration);
    try {
      const fill = 'Trades,Data,Order,Stocks,USD,ROTATE,"2026-01-05, 09:30:00",10,5,,ROTATE-FILL';
      expect(brokerCommit(context, ibkrCsv([fill]))).toMatchObject({
        createdExecutionCount: 1,
        matchedExecutionCount: 0,
      });

      const rotatedConfiguration = Object.freeze({
        activeKeyVersion: "activekey",
        keysBase64: Object.freeze({ oldkey: oldKey, activekey: activeKey }),
      });
      const rotatedAccounts = createAccountService(context.database, rotatedConfiguration);
      const rotatedContext = Object.freeze({
        scope: context.scope,
        service: createImportService(context.database, rotatedAccounts, rotatedConfiguration),
      });
      expect(brokerCommit(
        rotatedContext,
        ibkrCsv([fill], "January 1, 2026 - February 1, 2026"),
      )).toMatchObject({
        createdExecutionCount: 0,
        matchedExecutionCount: 1,
        pendingSourceDecisionCount: 0,
      });
      const contentOnlyFill =
        'Trades,Data,Order,Stocks,USD,ROTATE,"2026-01-05, 09:30:00",10,5,,';
      expect(brokerCommit(
        rotatedContext,
        ibkrCsv([contentOnlyFill], "January 1, 2026 - March 1, 2026"),
      )).toMatchObject({
        createdExecutionCount: 0,
        matchedExecutionCount: 1,
        pendingSourceDecisionCount: 0,
      });

      expect(count(context.database, "journal_executions")).toBe(1);
      expect(context.database.prepare(`SELECT alias_type, alias_scheme_version,
 COUNT(*) AS count FROM journal_execution_identity_aliases
WHERE alias_type IN ('broker_fill', 'content_occurrence') AND status = 'active'
GROUP BY alias_type, alias_scheme_version
ORDER BY alias_type, alias_scheme_version`).all()).toEqual([
        { alias_type: "broker_fill", alias_scheme_version: "journal_hmac_v1_activekey", count: 1 },
        { alias_type: "broker_fill", alias_scheme_version: "journal_hmac_v1_oldkey", count: 1 },
        { alias_type: "content_occurrence", alias_scheme_version: "journal_hmac_v1_activekey", count: 1 },
        { alias_type: "content_occurrence", alias_scheme_version: "journal_hmac_v1_oldkey", count: 1 },
      ]);
    } finally { context.database.close(); }
  });

  it("fails closed before insertion when a referenced execution HMAC key is unavailable", () => {
    const oldKey = Buffer.alloc(32, 47).toString("base64");
    const activeKey = Buffer.alloc(32, 53).toString("base64");
    const context = setup({
      activeKeyVersion: "oldkey",
      keysBase64: { oldkey: oldKey },
    });
    try {
      const fill = 'Trades,Data,Order,Stocks,USD,RECOVERY,"2026-01-05, 09:30:00",10,5,,RECOVERY-FILL';
      brokerCommit(context, ibkrCsv([fill]));
      const accountRecoveryConfiguration = Object.freeze({
        activeKeyVersion: "activekey",
        keysBase64: Object.freeze({ oldkey: oldKey, activekey: activeKey }),
      });
      const rotatedAccounts = createAccountService(
        context.database,
        accountRecoveryConfiguration,
      );
      const incompleteExecutionConfiguration = Object.freeze({
        activeKeyVersion: "activekey",
        keysBase64: Object.freeze({ activekey: activeKey }),
      });
      const incompleteContext = Object.freeze({
        scope: context.scope,
        service: createImportService(
          context.database,
          rotatedAccounts,
          incompleteExecutionConfiguration,
        ),
      });

      expect(() => brokerCommit(
        incompleteContext,
        ibkrCsv([fill], "January 1, 2026 - February 1, 2026"),
      )).toThrowError("TRADERLINK_ACCOUNT_IDENTITY_RECOVERY_REQUIRED");
      expect(count(context.database, "journal_import_batches")).toBe(1);
      expect(count(context.database, "journal_executions")).toBe(1);
    } finally { context.database.close(); }
  });

  it("fails closed when retained and active provider aliases resolve one identity differently", () => {
    const oldKey = Buffer.alloc(32, 59).toString("base64");
    const activeKey = Buffer.alloc(32, 61).toString("base64");
    const context = setup({
      activeKeyVersion: "oldkey",
      keysBase64: { oldkey: oldKey },
    });
    try {
      const retainedFill = 'Trades,Data,Order,Stocks,USD,CONFLICT,"2026-01-05, 09:30:00",10,5,,CONFLICT-FILL';
      brokerCommit(context, ibkrCsv([retainedFill]));
      const rotatedConfiguration = Object.freeze({
        activeKeyVersion: "activekey",
        keysBase64: Object.freeze({ oldkey: oldKey, activekey: activeKey }),
      });
      const rotatedAccounts = createAccountService(context.database, rotatedConfiguration);
      const rotatedContext = Object.freeze({
        scope: context.scope,
        service: createImportService(context.database, rotatedAccounts, rotatedConfiguration),
      });
      brokerCommit(rotatedContext, ibkrCsv([
        'Trades,Data,Order,Stocks,USD,CONFLICT,"2026-01-05, 09:30:00",10,5,,OTHER-FILL',
      ], "January 1, 2026 - February 1, 2026"));
      const rotatedDigester = createJournalPrivacyDigester(rotatedConfiguration);
      const executionRepository = new JournalExecutionRepository(context.database);
      const otherIdentity = rotatedDigester.activeDigest("broker_execution", "OTHER-FILL");
      const otherAlias = executionRepository.findActiveAlias({
        workspaceId: context.scope.workspaceId,
        accountId: context.accountId,
        aliasType: "broker_fill",
        aliasSchemeVersion: otherIdentity.schemeVersion,
        aliasSha256: otherIdentity.digestSha256,
        occurrenceOrdinal: null,
      });
      expect(otherAlias).not.toBeNull();
      const activeIdentity = rotatedDigester.activeDigest("broker_execution", "CONFLICT-FILL");
      executionRepository.insertAlias({
        executionAliasId: createCanonicalUuidV4(),
        workspaceId: context.scope.workspaceId,
        accountId: context.accountId,
        executionId: otherAlias!.executionId,
        aliasType: "broker_fill",
        aliasSchemeVersion: activeIdentity.schemeVersion,
        aliasSha256: activeIdentity.digestSha256,
        occurrenceOrdinal: null,
        timestamp: "2026-08-01T14:00:00.000Z",
      });

      expect(() => brokerCommit(rotatedContext, ibkrCsv(
        [retainedFill],
        "January 1, 2026 - March 1, 2026",
      ))).toThrowError("TRADERLINK_JOURNAL_EXECUTION_CONFLICT");
      expect(count(context.database, "journal_import_batches")).toBe(2);
      expect(count(context.database, "journal_executions")).toBe(2);
    } finally { context.database.close(); }
  });

  it("keeps different provider fill identities distinct even when their facts are identical", () => {
    const context = setup();
    try {
      const fillA = ibkrCsv([
        'Trades,Data,Order,Stocks,USD,SAME,"2026-01-05, 09:30:00",10,5,,FILL-SAME-A',
      ]);
      const fillB = ibkrCsv([
        'Trades,Data,Order,Stocks,USD,SAME,"2026-01-05, 09:30:00",10,5,,FILL-SAME-B',
      ], "January 1, 2026 - February 1, 2026");
      const overlappingFillB = ibkrCsv([
        'Trades,Data,Order,Stocks,USD,SAME,"2026-01-05, 09:30:00",10,5,,FILL-SAME-B',
      ], "January 1, 2026 - March 1, 2026");

      expect(brokerCommit(context, fillA)).toMatchObject({
        createdExecutionCount: 1,
        matchedExecutionCount: 0,
        pendingSourceDecisionCount: 0,
      });
      expect(brokerCommit(context, fillB)).toMatchObject({
        createdExecutionCount: 1,
        matchedExecutionCount: 0,
        pendingSourceDecisionCount: 0,
      });
      expect(brokerCommit(context, overlappingFillB)).toMatchObject({
        createdExecutionCount: 0,
        matchedExecutionCount: 1,
        pendingSourceDecisionCount: 0,
      });
      expect(count(context.database, "journal_executions")).toBe(2);
      expect(count(
        context.database,
        "journal_execution_identity_aliases",
        "WHERE alias_type = 'broker_fill' AND status = 'active'",
      )).toBe(2);
      expect(count(context.database, "journal_execution_provenance")).toBe(3);
    } finally { context.database.close(); }
  });

  it("keeps a content-only overlap ambiguous across provider-distinct identical fills", () => {
    const context = setup();
    try {
      const fillA =
        'Trades,Data,Order,Stocks,USD,AMBIG,"2026-01-05, 09:30:00",10,5,,AMBIG-FILL-A';
      const fillB =
        'Trades,Data,Order,Stocks,USD,AMBIG,"2026-01-05, 09:30:00",10,5,,AMBIG-FILL-B';
      const contentOnly =
        'Trades,Data,Order,Stocks,USD,AMBIG,"2026-01-05, 09:30:00",10,5,,';
      brokerCommit(context, ibkrCsv([fillA]));
      brokerCommit(context, ibkrCsv(
        [fillB],
        "January 1, 2026 - February 1, 2026",
      ));

      const ambiguous = brokerCommit(context, ibkrCsv(
        [contentOnly],
        "January 1, 2026 - March 1, 2026",
      ));
      expect(ambiguous).toMatchObject({
        createdExecutionCount: 1,
        matchedExecutionCount: 0,
        pendingSourceDecisionCount: 1,
      });
      expect(count(context.database, "journal_executions")).toBe(3);
      expect(count(
        context.database,
        "journal_executions",
        "WHERE current_state = 'accepted'",
      )).toBe(2);
      expect(count(
        context.database,
        "journal_executions",
        "WHERE current_state = 'needs_decision'",
      )).toBe(1);
      expect(count(
        context.database,
        "journal_source_row_issues",
        "WHERE issue_code = 'overlap_count_ambiguous'",
      )).toBe(1);
    } finally { context.database.close(); }
  });

  it("uses the provider identity while containing changed core facts", () => {
    const context = setup();
    try {
      brokerCommit(context, ibkrCsv([
        'Trades,Data,Order,Stocks,USD,CHANGED,"2026-01-05, 09:30:00",10,5,,FILL-CHANGED',
      ]));
      const conflict = brokerCommit(context, ibkrCsv([
        'Trades,Data,Order,Stocks,USD,CHANGED,"2026-01-05, 09:30:00",10,6,,FILL-CHANGED',
      ], "January 1, 2026 - February 1, 2026"));

      expect(conflict).toMatchObject({
        createdExecutionCount: 0,
        matchedExecutionCount: 1,
        pendingSourceDecisionCount: 1,
      });
      expect(count(context.database, "journal_executions")).toBe(1);
      expect(count(
        context.database,
        "journal_executions",
        "WHERE current_state = 'needs_decision'",
      )).toBe(1);
      expect(count(context.database, "journal_execution_provenance")).toBe(2);
      expect(count(
        context.database,
        "journal_source_row_issues",
        "WHERE issue_code = 'overlap_fact_conflict'",
      )).toBe(1);
    } finally { context.database.close(); }
  });

  it("retains explicit coverage gaps rather than inventing a no-trading month", () => {
    const context = setup();
    try {
      brokerCommit(context, ibkrCsv(['Trades,Data,Order,Stocks,USD,GAP,"2026-01-05, 09:30:00",1,5,,GAP-A']));
      brokerCommit(context, ibkrCsv(['Trades,Data,Order,Stocks,USD,GAP,"2026-03-05, 09:30:00",-1,6,,GAP-B'], "March 1, 2026 - March 31, 2026"));
      const periods = context.database.prepare(`SELECT local_start_date, local_end_date FROM journal_source_coverage_intervals ORDER BY local_start_date`).all();
      expect(periods).toEqual([
        { local_start_date: "2026-01-01", local_end_date: "2026-01-31" },
        { local_start_date: "2026-03-01", local_end_date: "2026-03-31" },
      ]);
    } finally { context.database.close(); }
  });

  it("reconstructs chronological ledger order from contiguous statements uploaded in reverse", () => {
    const context = setup();
    try {
      const january = ibkrCsv([
        'Trades,Data,Order,Stocks,USD,ORDER,"2026-01-31, 15:00:00",10,5,,ORDER-A',
      ]);
      const february = ibkrCsv([
        'Trades,Data,Order,Stocks,USD,ORDER,"2026-02-01, 09:30:00",-10,6,,ORDER-B',
      ], "February 1, 2026 - February 28, 2026");
      brokerCommit(context, february);
      brokerCommit(context, january);
      const chronology = context.database.prepare(`SELECT executed_at_utc
FROM journal_execution_versions ORDER BY executed_at_utc, source_order_key`).all();
      expect(chronology).toEqual([
        { executed_at_utc: "2026-01-31T20:00:00.000Z" },
        { executed_at_utc: "2026-02-01T14:30:00.000Z" },
      ]);
    } finally { context.database.close(); }
  });

  it("keeps a manual execution active while a later broker candidate waits for confirmation", () => {
    const context = setup();
    try {
      const manual = context.service.commitManualExecutions(context.scope, {
        accountId: context.accountId, idempotencyKey: "manual-batch-00000001",
        sourceDisplayLabel: "Manual trading day", entries: [manualEntry],
        now: new Date("2026-08-01T13:00:00.000Z"),
      });
      const broker = brokerCommit(context, ibkrCsv([
        'Trades,Data,Order,Stocks,USD,MANU,"2026-01-08, 09:36:00",50,7.5,,MANU-FILL-1',
      ]));
      expect(manual.createdExecutionCount).toBe(1);
      expect(broker).toMatchObject({
        createdExecutionCount: 1,
        matchedExecutionCount: 0,
        pendingSourceDecisionCount: 1,
      });
      expect(count(context.database, "journal_executions")).toBe(2);
      expect(count(context.database, "journal_execution_provenance")).toBe(2);
      expect(count(context.database, "journal_source_coverage_intervals", "WHERE coverage_kind = 'point_only'")).toBe(1);
      expect(count(context.database, "journal_execution_reconciliation_sets", "WHERE state = 'pending'")).toBe(1);
      expect(count(context.database, "journal_execution_reconciliation_members")).toBe(3);
      expect(count(context.database, "journal_source_row_issues", "WHERE issue_code = 'manual_broker_possible_duplicate'")).toBe(1);
      expect(context.database.prepare(`SELECT current_state, COUNT(*) AS count
FROM journal_executions GROUP BY current_state ORDER BY current_state`).all()).toEqual([
        { current_state: "accepted", count: 1 },
        { current_state: "needs_decision", count: 1 },
      ]);
    } finally { context.database.close(); }
  });

  it("preserves trader-authored day-trade or swing intent with the manual source facts", () => {
    const context = setup();
    try {
      context.service.commitManualExecutions(context.scope, {
        accountId: context.accountId,
        idempotencyKey: "manual-swing-intent-0001",
        sourceDisplayLabel: "Manual swing execution",
        entries: [{ ...manualEntry, tradeIntent: "swing" }],
      });
      const row = context.database.prepare(`SELECT raw_fields_json
FROM journal_source_rows WHERE section_name = 'Manual Executions'`).get() as {
        raw_fields_json: string;
      };
      const fields: unknown = JSON.parse(row.raw_fields_json);
      expect(Array.isArray(fields) ? fields[15] : null).toBe("swing");
    } finally { context.database.close(); }
  });

  it("assigns manual coverage and review issues by the account trading date", () => {
    const context = setup();
    try {
      const committed = context.service.commitManualExecutions(context.scope, {
        accountId: context.accountId,
        idempotencyKey: "manual-timezone-coverage-0001",
        sourceDisplayLabel: "Two timezone trading days",
        entries: [
          manualEntry,
          {
            ...manualEntry,
            sourceTimestampText: "2026-01-08, 01:00:00",
            sourceTimezone: "UTC",
            normalizedSymbol: "UTCX",
          },
        ],
      });
      expect(committed.pendingSourceDecisionCount).toBe(2);
      expect(context.database.prepare(`SELECT local_start_date, local_end_date,
 source_timezone FROM journal_source_coverage_intervals
WHERE coverage_kind = 'point_only'
ORDER BY local_start_date`).all()).toEqual([
        {
          local_start_date: "2026-01-07",
          local_end_date: "2026-01-07",
          source_timezone: "America/New_York",
        },
        {
          local_start_date: "2026-01-08",
          local_end_date: "2026-01-08",
          source_timezone: "America/New_York",
        },
      ]);
      expect(count(
        context.database,
        "journal_source_row_issues",
        "WHERE issue_code = 'manual_trading_day_coverage_unconfirmed'",
      )).toBe(2);
    } finally { context.database.close(); }
  });

  it("does not enrich an exact manual match until the trader confirms the broker overlap", () => {
    const context = setup();
    try {
      context.service.commitManualExecutions(context.scope, {
        accountId: context.accountId, idempotencyKey: "manual-enrichment-0001",
        sourceDisplayLabel: "Manual execution", entries: [manualEntry],
        now: new Date("2026-08-01T12:30:00.000Z"),
      });
      const broker = brokerCommit(context, ibkrCsv([
        'Trades,Data,Order,Stocks,USD,MANU,"2026-01-08, 09:35:00",50,7.5,-0.5,MANU-FILL-FEE',
      ]));
      expect(broker).toMatchObject({
        createdExecutionCount: 1,
        matchedExecutionCount: 0,
        pendingSourceDecisionCount: 1,
      });
      expect(count(context.database, "journal_executions")).toBe(2);
      expect(count(context.database, "journal_execution_versions")).toBe(2);
      expect(context.database.prepare(`SELECT member.member_role, version.fees_decimal
FROM journal_execution_reconciliation_members member
JOIN journal_executions execution ON execution.execution_id = member.execution_id
JOIN journal_execution_versions version
  ON version.execution_version_id = execution.current_version_id
WHERE member.member_role IN ('manual_execution', 'provisional_imported_execution')
ORDER BY member.member_role`).all()).toEqual([
        { member_role: "manual_execution", fees_decimal: null },
        { member_role: "provisional_imported_execution", fees_decimal: "-0.5" },
      ]);
    } finally { context.database.close(); }
  });

  it("does not restore a trader-excluded execution during broker enrichment", () => {
    const context = setup();
    try {
      const manual = context.service.commitManualExecutions(context.scope, {
        accountId: context.accountId,
        idempotencyKey: "manual-excluded-enrichment-0001",
        sourceDisplayLabel: "Excluded manual execution",
        entries: [manualEntry],
        now: new Date("2026-08-01T12:30:00.000Z"),
      });
      const executionId = manual.executionIds[0]!;
      const repository = new JournalExecutionRepository(context.database);
      const current = repository.current(
        executionId,
        context.scope.workspaceId,
        context.accountId,
      )!;
      repository.updateState({
        executionId,
        workspaceId: context.scope.workspaceId,
        accountId: context.accountId,
        expectedCurrentVersionId: current.currentVersionId,
        state: "excluded_by_trader",
        timestamp: "2026-08-01T12:45:00.000Z",
      });

      const broker = brokerCommit(context, ibkrCsv([
        'Trades,Data,Order,Stocks,USD,MANU,"2026-01-08, 09:35:00",50,7.5,-0.5,MANU-FILL-EXCLUDED',
      ]));
      expect(broker.matchedExecutionCount).toBe(1);
      expect(repository.current(
        executionId,
        context.scope.workspaceId,
        context.accountId,
      )?.currentState).toBe("excluded_by_trader");
      expect(repository.currentVersion(
        executionId,
        context.scope.workspaceId,
        context.accountId,
      )?.feesDecimal).toBe("-0.5");
    } finally { context.database.close(); }
  });

  it("keeps repeated manual occurrences distinct and makes batch retries idempotent", () => {
    const context = setup();
    try {
      const input = { accountId: context.accountId, idempotencyKey: "manual-batch-00000002", sourceDisplayLabel: "Two fills", entries: [manualEntry, manualEntry] } as const;
      const first = context.service.commitManualExecutions(context.scope, input);
      const second = context.service.commitManualExecutions(context.scope, input);
      expect(first.createdExecutionCount).toBe(2);
      expect(second.status).toBe("already_imported");
      expect(count(context.database, "journal_executions")).toBe(2);
      const orderKeys = context.database.prepare(`SELECT source_order_key
FROM journal_execution_versions ORDER BY source_order_key`).all() as Array<{
        source_order_key: string;
      }>;
      expect(orderKeys.every((row) => row.source_order_key.includes("|unverified|")))
        .toBe(true);
      expect(orderKeys.some((row) => row.source_order_key.includes("|manual|")))
        .toBe(false);
      expect(() => context.service.commitManualExecutions(context.scope, {
        ...input,
        entries: [manualEntry, { ...manualEntry, priceDecimal: "7.75" }],
      })).toThrowError("TRADERLINK_JOURNAL_IMPORT_CONFLICT");
      expect(count(context.database, "journal_executions")).toBe(2);
    } finally { context.database.close(); }
  });

  it("rechecks broker and manual import identity after the immediate write lock is held", () => {
    const context = setup();
    try {
      const brokerCsv = ibkrCsv([
        'Trades,Data,Order,Stocks,USD,LOCK,"2026-01-08, 09:35:00",50,7.5,-0.5,LOCK-FILL-1',
      ]);
      const firstBroker = brokerCommit(context, brokerCsv);
      const importCountAfterBroker = count(context.database, "journal_import_batches");
      const executionCountAfterBroker = count(context.database, "journal_executions");
      const brokerRaceService = createImportService(
        context.database,
        context.accounts,
        context.privacyConfiguration,
        new HideFirstImportIdentityLookupRepository(context.database, {
          hideFileDigest: true,
        }),
      );
      const brokerRetry = brokerCommit(
        { scope: context.scope, service: brokerRaceService },
        brokerCsv,
      );
      expect(brokerRetry).toMatchObject({
        status: "already_imported",
        importBatchId: firstBroker.importBatchId,
        executionIds: firstBroker.executionIds,
      });
      expect(count(context.database, "journal_import_batches")).toBe(importCountAfterBroker);
      expect(count(context.database, "journal_executions")).toBe(executionCountAfterBroker);

      const conflictingBrokerService = createImportService(
        context.database,
        context.accounts,
        context.privacyConfiguration,
        new HideFirstImportIdentityLookupRepository(context.database, {
          hideFileDigest: true,
          brokerAccountIdOverride: createCanonicalUuidV4(),
        }),
      );
      let brokerConflict: unknown;
      try {
        brokerCommit({ scope: context.scope, service: conflictingBrokerService }, brokerCsv);
      } catch (error) {
        brokerConflict = error;
      }
      expect(brokerConflict).toMatchObject({
        code: "TRADERLINK_JOURNAL_IMPORT_CONFLICT",
        safeContext: { reason: "broker_file_digest_account_mismatch" },
      });
      expect(count(context.database, "journal_import_batches")).toBe(importCountAfterBroker);

      const manualInput = Object.freeze({
        accountId: context.accountId,
        idempotencyKey: "manual-under-lock-0001",
        sourceDisplayLabel: "Under-lock manual retry",
        entries: Object.freeze([manualEntry]),
      });
      const firstManual = context.service.commitManualExecutions(context.scope, manualInput);
      const importCountAfterManual = count(context.database, "journal_import_batches");
      const executionCountAfterManual = count(context.database, "journal_executions");
      const manualRaceService = createImportService(
        context.database,
        context.accounts,
        context.privacyConfiguration,
        new HideFirstImportIdentityLookupRepository(context.database, {
          hideManualIdempotency: true,
        }),
      );
      const manualRetry = manualRaceService.commitManualExecutions(
        context.scope,
        manualInput,
      );
      expect(manualRetry).toMatchObject({
        status: "already_imported",
        importBatchId: firstManual.importBatchId,
        executionIds: firstManual.executionIds,
      });
      expect(count(context.database, "journal_import_batches")).toBe(importCountAfterManual);
      expect(count(context.database, "journal_executions")).toBe(executionCountAfterManual);

      const mismatchedManualRaceService = createImportService(
        context.database,
        context.accounts,
        context.privacyConfiguration,
        new HideFirstImportIdentityLookupRepository(context.database, {
          hideManualIdempotency: true,
        }),
      );
      let manualConflict: unknown;
      try {
        mismatchedManualRaceService.commitManualExecutions(context.scope, {
          ...manualInput,
          entries: [{ ...manualEntry, quantityDecimal: "51" }],
        });
      } catch (error) {
        manualConflict = error;
      }
      expect(manualConflict).toMatchObject({
        code: "TRADERLINK_JOURNAL_IMPORT_CONFLICT",
        safeContext: { reason: "manual_idempotency_payload_mismatch" },
      });
      expect(count(context.database, "journal_import_batches")).toBe(importCountAfterManual);
      expect(count(context.database, "journal_executions")).toBe(executionCountAfterManual);
    } finally { context.database.close(); }
  });

  it("accepts a trader-verified UTC instant for a repeated local clock time", () => {
    const context = setup();
    try {
      const repeatedClockEntry: ManualExecutionInput = {
        ...manualEntry,
        sourceTimestampText: "2026-11-01, 01:30:00",
        executedAtUtc: "2026-11-01T05:30:00.000Z",
      };
      expect(() => context.service.commitManualExecutions(context.scope, {
        accountId: context.accountId,
        idempotencyKey: "manual-repeated-time-invalid",
        sourceDisplayLabel: "Invalid repeated-time correction",
        entries: [{
          ...repeatedClockEntry,
          executedAtUtc: "2026-11-01T07:30:00.000Z",
        }],
      })).toThrowError("TRADERLINK_JOURNAL_IMPORT_MAPPING_FAILED");
      const committed = context.service.commitManualExecutions(context.scope, {
        accountId: context.accountId,
        idempotencyKey: "manual-repeated-time-valid-01",
        sourceDisplayLabel: "Verified repeated-time correction",
        entries: [repeatedClockEntry],
      });
      expect(committed.createdExecutionCount).toBe(1);
      expect(context.database.prepare(`SELECT executed_at_utc, time_parser_version
FROM journal_execution_versions`).get()).toEqual({
        executed_at_utc: "2026-11-01T05:30:00.000Z",
        time_parser_version: "manual_explicit_utc_v1",
      });
    } finally { context.database.close(); }
  });

  it("contains count-disagreement ambiguity without hiding the earlier execution", () => {
    const context = setup();
    try {
      const row = 'Trades,Data,Order,Stocks,USD,DUP,"2026-01-09, 09:30:00",10,5,,';
      brokerCommit(context, ibkrCsv([row]));
      const result = brokerCommit(context, ibkrCsv([row, row], "January 1, 2026 - February 1, 2026"));
      expect(result.pendingSourceDecisionCount).toBe(2);
      expect(count(context.database, "journal_executions")).toBe(3);
      expect(count(context.database, "journal_executions", "WHERE current_state = 'needs_decision'")).toBe(2);
      expect(count(context.database, "journal_executions", "WHERE current_state = 'accepted'")).toBe(1);
    } finally { context.database.close(); }
  });

  it("isolates identical manual facts by workspace and account scope", () => {
    const context = setup();
    try {
      context.service.commitManualExecutions(context.scope, {
        accountId: context.accountId, idempotencyKey: "manual-isolation-0001",
        sourceDisplayLabel: "First workspace", entries: [manualEntry],
      });
      const users = new PlatformUserRepository(context.database, { allowedAuthProviders: ["test"] });
      const workspaces = new PlatformWorkspaceRepository(context.database);
      const userId = createCanonicalUuidV4();
      const workspaceId = createCanonicalUuidV4();
      const now = "2026-08-01T14:00:00.000Z";
      users.createUser({ userId, authProvider: "test", authSubject: "other-owner", displayName: "Other", createdAtUtc: now, updatedAtUtc: now });
      workspaces.createWorkspaceWithOwner({ workspaceId, ownerUserId: userId, displayName: "Other workspace", defaultTradingTimezone: "America/New_York", createdAtUtc: now });
      const baseScope: WorkspaceAccessScope = { userId, workspaceId, workspaceRole: "owner", allowedAccountIds: [], activeAccountId: null };
      const account = context.accounts.createAccount(baseScope, { workspaceId, displayName: "Other journal", baseCurrency: "USD", tradingTimezone: "America/New_York" });
      const otherScope: WorkspaceAccessScope = { ...baseScope, allowedAccountIds: [account.accountId], activeAccountId: account.accountId };
      context.service.commitManualExecutions(otherScope, {
        accountId: account.accountId, idempotencyKey: "manual-isolation-0001",
        sourceDisplayLabel: "Second workspace", entries: [manualEntry],
      });
      expect(count(context.database, "journal_executions")).toBe(2);
      const grouped = context.database.prepare(`SELECT workspace_id, COUNT(*) AS count FROM journal_executions GROUP BY workspace_id`).all();
      expect(grouped).toHaveLength(2);
      const firstAlias = context.database.prepare(`SELECT execution_alias_id, last_seen_at_utc
FROM journal_execution_identity_aliases
WHERE workspace_id = ? AND account_id = ?
ORDER BY execution_alias_id LIMIT 1`).get(
        context.scope.workspaceId,
        context.accountId,
      ) as { execution_alias_id: string; last_seen_at_utc: string };
      expect(() => new JournalExecutionRepository(context.database).touchAlias({
        workspaceId,
        accountId: account.accountId,
        executionAliasId: firstAlias.execution_alias_id,
        timestamp: "2026-08-01T15:00:00.000Z",
      })).toThrowError("TRADERLINK_JOURNAL_EXECUTION_CONFLICT");
      expect(context.database.prepare(`SELECT last_seen_at_utc
FROM journal_execution_identity_aliases
WHERE execution_alias_id = ?`).get(firstAlias.execution_alias_id)).toEqual({
        last_seen_at_utc: firstAlias.last_seen_at_utc,
      });
    } finally { context.database.close(); }
  });

  it("isolates identical manual facts between two accounts in one workspace", () => {
    const context = setup();
    try {
      const second = context.accounts.createAccount(context.scope, {
        workspaceId: context.scope.workspaceId, displayName: "Second journal",
        baseCurrency: "USD", tradingTimezone: "America/New_York",
      });
      const twoAccountScope: WorkspaceAccessScope = {
        ...context.scope,
        allowedAccountIds: [context.accountId, second.accountId],
      };
      for (const accountId of [context.accountId, second.accountId]) {
        context.service.commitManualExecutions(twoAccountScope, {
          accountId, idempotencyKey: "manual-account-scope-01",
          sourceDisplayLabel: "Scoped execution", entries: [manualEntry],
        });
      }
      expect(count(context.database, "journal_executions")).toBe(2);
      const grouped = context.database.prepare(`SELECT account_id, COUNT(*) AS count
FROM journal_executions GROUP BY account_id`).all();
      expect(grouped).toHaveLength(2);
    } finally { context.database.close(); }
  });

  it("appends corrections as immutable versions and advances only the current pointer", () => {
    const context = setup();
    try {
      context.service.commitManualExecutions(context.scope, {
        accountId: context.accountId, idempotencyKey: "manual-correction-0001",
        sourceDisplayLabel: "Original entry", entries: [manualEntry],
        now: new Date("2026-08-01T12:30:00.000Z"),
      });
      const execution = context.database.prepare(`SELECT e.execution_id, e.current_version_id, v.*
FROM journal_executions e JOIN journal_execution_versions v
ON v.execution_version_id = e.current_version_id`).get() as Record<string, string>;
      const evidence = context.database.prepare(`SELECT import_batch_id, source_row_id FROM journal_source_rows LIMIT 1`).get() as { import_batch_id: string; source_row_id: string };
      const service = new JournalExecutionService(new JournalExecutionRepository(context.database));
      const corrected = service.appendCorrection({
        userId: context.scope.userId, workspaceId: context.scope.workspaceId,
        workspaceRole: "owner", accountId: context.accountId,
      }, {
        executionId: execution.execution_id,
        expectedCurrentVersionId: execution.current_version_id,
        state: "accepted",
        facts: {
          instrumentId: execution.instrument_id, tradeCurrency: execution.trade_currency,
          sourceTimestampText: execution.source_timestamp_text,
          sourceTimezone: execution.source_timezone, timeParserVersion: execution.time_parser_version,
          executedAtUtc: execution.executed_at_utc, sourceOrderKey: execution.source_order_key,
          side: execution.side as "buy" | "sell", quantityDecimal: execution.quantity_decimal,
          priceDecimal: "7.75", feesDecimal: null, feeCurrency: null,
          feeSignConvention: "not_reported", factCompleteness: "complete",
        },
        changeReasonCode: "trader_price_correction",
        importBatchId: evidence.import_batch_id, sourceRowId: evidence.source_row_id,
        now: new Date("2026-08-01T15:00:00.000Z"),
      });
      expect(corrected.versionNumber).toBe(2);
      expect(count(context.database, "journal_execution_versions")).toBe(2);
      const versions = context.database.prepare(`SELECT version_number, price_decimal FROM journal_execution_versions ORDER BY version_number`).all();
      expect(versions).toEqual([{ version_number: 1, price_decimal: "7.5" }, { version_number: 2, price_decimal: "7.75" }]);
      expect((context.database.prepare(`SELECT current_version_id FROM journal_executions`).get() as { current_version_id: string }).current_version_id).toBe(corrected.executionVersionId);
    } finally { context.database.close(); }
  });
});
