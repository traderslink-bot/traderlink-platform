import "server-only";

import { createHash } from "node:crypto";
import type Database from "better-sqlite3";

import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { MoomooConnectionAccessService } from "@/src/modules/platform/server/broker-connections/moomoo-connection-access-service";
import { loadMoomooCredentialKeyConfiguration } from "@/src/modules/platform/server/broker-connections/moomoo-connection-credentials";
import { MoomooConnectionRepository } from "@/src/modules/platform/server/broker-connections/moomoo-connection-repository";
import {
  decryptMoomooPrivateData,
  encryptMoomooPrivateData,
} from "@/src/modules/platform/server/broker-connections/moomoo-private-data-crypto";
import {
  MoomooTradingReadClient,
  type MoomooHistoricalFill,
  type MoomooTradeMarket,
} from "@/src/modules/platform/server/broker-connections/moomoo-trading-read-client";
import { createCanonicalUtcTimestamp, createCanonicalUuidV4 } from "@/src/modules/platform/server/database/platform-migration-contract";
import { createJournalIntegrityRuntime } from "../journal-integrity-runtime";
import {
  createJournalPrivacyDigester,
  loadJournalPrivacyHmacConfiguration,
  type JournalImportCommitResult,
  type MoomooApiFillInput,
} from "../imports/journal-import-service";
import { recordMoomooImportFailure } from "./moomoo-execution-import-observability";
import {
  MoomooExecutionImportRepository,
  type MoomooClaimedImportRange,
  type MoomooFillReceiptSeed,
} from "./moomoo-execution-import-repository";

const STALE_CLAIM_MILLISECONDS = 10 * 60 * 1_000;
const RETRY_DELAYS_MINUTES = Object.freeze([1, 5, 15, 60] as const);

const MARKET_CURRENCIES: Readonly<Record<MoomooTradeMarket, string>> = Object.freeze({
  US: "USD",
  HK: "HKD",
  SG: "SGD",
  JP: "JPY",
  AU: "AUD",
  CA: "CAD",
  BMS: "MYR",
  SH: "CNY",
  SZ: "CNY",
});

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function providerIdentity(claimed: MoomooClaimedImportRange, fill: MoomooHistoricalFill): string {
  return `${claimed.sourceIdentityId}\u001fmoomoo-deal-v1\u001f${fill.dealId}`;
}

function normalizedSymbol(market: MoomooTradeMarket, code: string): string {
  const prefixes = market === "BMS" ? ["BMS.", "MY."] : [`${market}.`];
  const prefix = prefixes.find((candidate) => code.startsWith(candidate));
  return prefix ? code.slice(prefix.length) : code;
}

function pageIdentity(input: Readonly<{
  claimed: MoomooClaimedImportRange;
  cursor: string;
  fills: readonly MoomooHistoricalFill[];
}>): string {
  return sha256(JSON.stringify({
    version: "moomoo-fill-page-v1",
    range: input.claimed.brokerImportRangeId,
    market: input.claimed.market,
    start: input.claimed.startMicroseconds,
    end: input.claimed.endMicroseconds,
    cursor: sha256(input.cursor || "first-page"),
    fills: input.fills.map((fill) => ({
      identity: sha256(providerIdentity(input.claimed, fill)),
      created: fill.createdMicroseconds,
      updated: fill.updatedMicroseconds,
      side: fill.side,
      code: fill.code,
      quantity: fill.quantityDecimal,
      price: fill.priceDecimal,
    })),
  }));
}

function scopeFor(claimed: MoomooClaimedImportRange): WorkspaceAccessScope {
  return Object.freeze({
    userId: claimed.userId,
    workspaceId: claimed.workspaceId,
    workspaceRole: claimed.workspaceRole,
    allowedAccountIds: Object.freeze([claimed.accountId]),
    activeAccountId: claimed.accountId,
  });
}

function toJournalFill(
  claimed: MoomooClaimedImportRange,
  fill: MoomooHistoricalFill,
): MoomooApiFillInput {
  return Object.freeze({
    providerExecutionIdentity: providerIdentity(claimed, fill),
    normalizedSymbol: normalizedSymbol(claimed.market, fill.code),
    tradeCurrency: MARKET_CURRENCIES[claimed.market],
    side: fill.side,
    quantityDecimal: fill.quantityDecimal,
    priceDecimal: fill.priceDecimal,
    createdMicroseconds: fill.createdMicroseconds,
    updatedMicroseconds: fill.updatedMicroseconds,
  });
}

export class MoomooExecutionImportWorker {
  private readonly repository: MoomooExecutionImportRepository;

  constructor(
    private readonly database: Database.Database,
    private readonly client: MoomooTradingReadClient = new MoomooTradingReadClient(),
    private readonly now: () => Date = () => new Date(),
  ) {
    this.repository = new MoomooExecutionImportRepository(database);
  }

  async runOne(): Promise<boolean> {
    const started = this.now();
    const claimed = this.repository.claimNextRange({
      timestamp: createCanonicalUtcTimestamp(started),
      staleBeforeTimestamp: createCanonicalUtcTimestamp(
        new Date(started.getTime() - STALE_CLAIM_MILLISECONDS),
      ),
    });
    if (!claimed) return false;

    try {
      await this.processClaim(claimed);
      return true;
    } catch (error) {
      const failedAt = this.now();
      recordMoomooImportFailure({
        database: this.database,
        error,
        stage: "worker",
        now: failedAt,
      });
      const retryDelay = RETRY_DELAYS_MINUTES[claimed.retryCount] ?? null;
      this.repository.markRangeRetry({
        claimed,
        safeErrorCode: "moomoo_import_failed",
        nextAttemptAtUtc: retryDelay === null
          ? null
          : createCanonicalUtcTimestamp(
              new Date(failedAt.getTime() + retryDelay * 60_000),
            ),
        timestamp: createCanonicalUtcTimestamp(failedAt),
      });
      return true;
    }
  }

  private async processClaim(claimed: MoomooClaimedImportRange): Promise<void> {
    const configuration = loadMoomooCredentialKeyConfiguration();
    const accountId = decryptMoomooPrivateData({
      configuration,
      purpose: "broker_account_id",
      encrypted: claimed.encryptedAccountId,
    });
    const cursor = claimed.encryptedCursor
      ? decryptMoomooPrivateData({
          configuration,
          purpose: "fill_page_cursor",
          encrypted: claimed.encryptedCursor,
        })
      : "";
    const scope = scopeFor(claimed);
    const accessToken = await new MoomooConnectionAccessService(
      new MoomooConnectionRepository(this.database),
      this.now,
    ).executionAccessToken(scope);
    const page = await this.client.historicalFills({
      accessToken,
      accountId,
      market: claimed.market,
      startMicroseconds: claimed.startMicroseconds,
      endMicroseconds: claimed.endMicroseconds,
      pageFlag: cursor,
    });
    const processedAt = this.now();
    const timestamp = createCanonicalUtcTimestamp(processedAt);
    const digester = createJournalPrivacyDigester(loadJournalPrivacyHmacConfiguration());
    const receiptIdentities: Array<Readonly<{
      schemeVersion: string;
      digestSha256: string;
    }>> = [];
    const receipts: MoomooFillReceiptSeed[] = page.fills.map((fill) => {
      const identity = digester.activeDigest(
        "broker_execution",
        providerIdentity(claimed, fill),
      );
      receiptIdentities.push(Object.freeze({
        schemeVersion: identity.schemeVersion,
        digestSha256: identity.digestSha256,
      }));
      return Object.freeze({
        brokerFillReceiptId: createCanonicalUuidV4(),
        providerIdentitySchemeVersion: identity.schemeVersion,
        providerIdentitySha256: identity.digestSha256,
        providerCreatedMicroseconds: fill.createdMicroseconds,
        providerUpdatedMicroseconds: fill.updatedMicroseconds,
        encryptedPayload: encryptMoomooPrivateData({
          configuration,
          purpose: "fill_receipt",
          plaintext: JSON.stringify(fill),
        }),
      });
    });
    this.repository.persistFillReceipts({ claimed, receipts, timestamp });

    const digest = pageIdentity({ claimed, cursor, fills: page.fills });
    const encryptedNextCursor = page.completed
      ? null
      : encryptMoomooPrivateData({
          configuration,
          purpose: "fill_page_cursor",
          plaintext: page.nextPageFlag,
        });
    this.database.transaction(() => {
      const result: JournalImportCommitResult | null = page.fills.length === 0
        ? null
        : createJournalIntegrityRuntime(this.database).imports.commitMoomooApiFills(scope, {
            accountId: claimed.accountId,
            sourceIdentityId: claimed.sourceIdentityId,
            pageIdentitySha256: digest,
            evidenceObjectKey: `moomoo_receipt_${claimed.brokerImportRangeId.replaceAll("-", "")}_${digest.slice(0, 16)}`,
            sourceDisplayLabel: claimed.privacySafeLabel,
            fills: page.fills.map((fill) => toJournalFill(claimed, fill)),
            now: processedAt,
          });
      this.repository.commitProcessedPage({
        claimed,
        receiptIdentities,
        encryptedNextCursor,
        providerCompleted: page.completed,
        receivedFillCount: page.fills.length,
        createdExecutionCount: result?.createdExecutionCount ?? 0,
        matchedExecutionCount: result?.matchedExecutionCount ?? 0,
        decisionRequiredCount: result?.pendingSourceDecisionCount ?? 0,
        timestamp,
      });
    }).immediate();
  }
}
