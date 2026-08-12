import { createHash } from "node:crypto";
import { existsSync, lstatSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import Database from "better-sqlite3";

import type { JournalAnalyticsQuery } from "@/src/modules/journal-analytics/contracts/analytics-query";
import { JOURNAL_ANALYTICS_QUERY_VERSION } from "@/src/modules/journal-analytics/contracts/analytics-query";
import type {
  JournalAnalyticsMetricResult,
  JournalAnalyticsPartitionedResponse,
} from "@/src/modules/journal-analytics/contracts/analytics-result";
import { JournalAnalyticsService } from "@/src/modules/journal-analytics/server/analytics-service";
import {
  normalizeJournalAnalyticsFacts,
  type NormalizedJournalAnalyticsRow,
} from "@/src/modules/journal-analytics/server/normalize-journal-analytics-facts";
import type {
  JournalAnalyticsAllocationFact,
  JournalAnalyticsFactSet,
} from "@/src/modules/journal/contracts/journal-analytics-fact-set";
import { JournalAccountRepository } from "@/src/modules/journal/server/accounts/journal-account-repository";
import {
  deriveDevelopmentOwnerJournalScope,
  deriveDevelopmentOwnerJournalScopeForAccount,
} from "@/src/modules/journal/server/accounts/journal-development-owner-scope";
import { JournalAnalyticsFactSetRepository } from "@/src/modules/journal/server/analytics/journal-analytics-fact-set-repository";
import { JournalAnalyticsFactSetService } from "@/src/modules/journal/server/analytics/journal-analytics-fact-set-service";
import {
  resolvePlatformDatabaseConfig,
  validatePlatformDatabasePath,
} from "@/src/modules/platform/server/database/platform-database-config";
import {
  isTraderLinkPlatformError,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";
import { verifyPlatformDatabaseConnectionPragmas } from "@/src/modules/platform/server/database/open-platform-database";
import { verifyCompletedPlatformDatabase } from "@/src/modules/platform/server/database/run-platform-migrations";

export const JOURNAL_ANALYTICS_VERIFICATION_ACTION =
  "verify_journal_analytics" as const;

const EXPECTED_READY_CLOSED_COUNT = 364;
const EXPECTED_LEGITIMATE_OPEN_COUNT = 2;
const EXPECTED_NEEDS_DECISION_COUNT = 2;
const VERIFIED_METRIC_IDS = Object.freeze([
  "ready_closed_count",
  "fee_complete_trade_count",
  "fee_incomplete_trade_count",
  "gross_pnl",
  "net_pnl",
  "charge_cost",
  "charge_credit",
] as const);

type ExactParts = Readonly<{ units: bigint; scale: number }>;
type IndependentCharge = Readonly<{
  state: "complete";
  costDecimal: string;
  creditDecimal: string;
  currency: string;
}> | Readonly<{ state: "unavailable" }>;

export type IndependentAnalyticsRow = Readonly<{
  roundTripId: string;
  grossPnlDecimal: string;
  chargeCoverage: "complete" | "unavailable";
  chargeCostDecimal: string | null;
  chargeCreditDecimal: string | null;
  netPnlDecimal: string | null;
}>;

export type IndependentAnalyticsReconciliation = Readonly<{
  rows: readonly IndependentAnalyticsRow[];
  rowDigestSha256: string;
  realizedCount: number;
  feeCompleteCount: number;
  feeIncompleteCount: number;
  grossPnlDecimal: string;
  netPnlDecimal: string;
  chargeCostDecimal: string;
  chargeCreditDecimal: string;
}>;

export type TraderLinkJournalAnalyticsVerificationResult = Readonly<{
  status: "journal_analytics_verified";
  identifiersRedacted: true;
  database: Readonly<{
    fileSizeBytes: number;
    fileSha256: string;
    state: "unchanged";
    sidecars: "no_pending_wal";
  }>;
  counts: Readonly<{
    readyClosed: number;
    legitimateOpen: number;
    needsDecision: number;
    feeComplete: number;
    feeIncomplete: number;
    tableRows: number;
    serviceResponses: number;
  }>;
  digests: Readonly<{
    factSetRevisionSha256: string;
    productionNormalizationSha256: string;
    independentRowsSha256: string;
    pageServicesSha256: string;
  }>;
  reconciliation: Readonly<{
    independentRows: "matched";
    headlineMetrics: "matched";
    pageServices: "matched";
    tablePagination: "matched";
  }>;
  timingMilliseconds: Readonly<{
    total: number;
    factSetAndNormalization: number;
    servicesAndPagination: number;
  }>;
}>;

export type TraderLinkJournalAnalyticsVerificationOptions = Readonly<{
  environment?: NodeJS.ProcessEnv;
  databasePath?: string;
  forbiddenRepositoryRoots?: readonly string[];
  now?: () => Date;
}>;

function verificationFailure(check: string): never {
  return platformFailure("TRADERLINK_JOURNAL_INTEGRITY_VERIFICATION_FAILED", {
    check: `analytics_${check}`,
  });
}

function sha256Bytes(value: Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
}

function sha256Json(value: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify(value), "utf8")
    .digest("hex");
}

function requireNoPendingWal(walPath: string): void {
  if (!existsSync(walPath)) return;
  const evidence = lstatSync(walPath);
  if (!evidence.isFile() || evidence.isSymbolicLink() || evidence.size !== 0) {
    verificationFailure("database_pending_wal");
  }
}

function parseDecimal(value: string): ExactParts {
  if (
    value.length > 128 ||
    value === "-0" ||
    !/^-?(?:0|[1-9][0-9]*)(?:\.[0-9]*[1-9])?$/u.test(value)
  ) {
    verificationFailure("independent_decimal_input");
  }
  const negative = value.startsWith("-");
  const unsigned = negative ? value.slice(1) : value;
  const [whole, fraction = ""] = unsigned.split(".");
  return Object.freeze({
    units: BigInt(`${whole}${fraction}`) *
      (negative ? -BigInt(1) : BigInt(1)),
    scale: fraction.length,
  });
}

function powerOfTen(exponent: number): bigint {
  if (!Number.isSafeInteger(exponent) || exponent < 0 || exponent > 256) {
    verificationFailure("independent_decimal_scale");
  }
  return BigInt(10) ** BigInt(exponent);
}

function decimalFromUnits(originalUnits: bigint, originalScale: number): string {
  let units = originalUnits;
  let scale = originalScale;
  if (units === BigInt(0)) return "0";
  while (scale > 0 && units % BigInt(10) === BigInt(0)) {
    units /= BigInt(10);
    scale -= 1;
  }
  const negative = units < BigInt(0);
  const digits = (negative ? -units : units)
    .toString()
    .padStart(scale + 1, "0");
  const unsigned = scale === 0
    ? digits
    : `${digits.slice(0, -scale)}.${digits.slice(-scale)}`;
  return negative ? `-${unsigned}` : unsigned;
}

function addDecimals(left: string, right: string): string {
  const leftParts = parseDecimal(left);
  const rightParts = parseDecimal(right);
  const scale = Math.max(leftParts.scale, rightParts.scale);
  return decimalFromUnits(
    leftParts.units * powerOfTen(scale - leftParts.scale) +
      rightParts.units * powerOfTen(scale - rightParts.scale),
    scale,
  );
}

function multiplyDecimals(left: string, right: string): string {
  const leftParts = parseDecimal(left);
  const rightParts = parseDecimal(right);
  return decimalFromUnits(
    leftParts.units * rightParts.units,
    leftParts.scale + rightParts.scale,
  );
}

function negateDecimal(value: string): string {
  const parts = parseDecimal(value);
  return decimalFromUnits(-parts.units, parts.scale);
}

function stableExecutionFacts(allocation: JournalAnalyticsAllocationFact): string {
  return JSON.stringify({
    executionId: allocation.executionId,
    executionVersionId: allocation.executionVersionId,
    executionQuantityDecimal: allocation.executionQuantityDecimal,
    feesDecimal: allocation.feesDecimal,
    feeCurrency: allocation.feeCurrency,
    feeSignConvention: allocation.feeSignConvention,
    feePolicyCandidates: allocation.feePolicyCandidates,
  });
}

function independentFeePolicySupported(
  allocation: JournalAnalyticsAllocationFact,
): boolean {
  if (allocation.feeSignConvention === "cash_effect") return true;
  if (allocation.feeSignConvention !== "broker_reported_signed") return false;
  const brokerCandidates = allocation.feePolicyCandidates.filter(
    (candidate) => candidate.provenanceKind === "broker",
  );
  return brokerCandidates.length > 0 && brokerCandidates.every((candidate) =>
    candidate.sourceSystem === "ibkr" &&
    candidate.adapterId === "ibkr_activity_statement" &&
    candidate.adapterVersion === "ibkr_activity_statement_v1");
}

function independentlyAllocateExecutionFees(
  allocations: readonly JournalAnalyticsAllocationFact[],
): ReadonlyMap<string, IndependentCharge> {
  const result = new Map<string, IndependentCharge>();
  const grouped = new Map<string, JournalAnalyticsAllocationFact[]>();
  for (const allocation of allocations) {
    const key = JSON.stringify([allocation.executionId, allocation.executionVersionId]);
    const values = grouped.get(key) ?? [];
    values.push(allocation);
    grouped.set(key, values);
  }
  for (const values of grouped.values()) {
    const ordered = [...values].sort((left, right) =>
      left.allocationSequence - right.allocationSequence ||
      left.allocationId.localeCompare(right.allocationId));
    const first = ordered[0];
    if (
      !first ||
      ordered.some((allocation) =>
        stableExecutionFacts(allocation) !== stableExecutionFacts(first))
    ) {
      verificationFailure("independent_execution_facts");
    }
    const allocatedQuantity = ordered.reduce(
      (sum, allocation) => addDecimals(sum, allocation.allocatedQuantityDecimal),
      "0",
    );
    if (allocatedQuantity !== first.executionQuantityDecimal) {
      verificationFailure("independent_allocation_conservation");
    }
    if (
      first.feesDecimal === null ||
      first.feeCurrency === null ||
      !independentFeePolicySupported(first)
    ) {
      for (const allocation of ordered) {
        result.set(allocation.allocationId, Object.freeze({ state: "unavailable" }));
      }
      continue;
    }
    const fee = parseDecimal(first.feesDecimal);
    const absoluteFeeUnits = fee.units < BigInt(0) ? -fee.units : fee.units;
    const quantityParts = ordered.map((allocation) => ({
      allocation,
      quantity: parseDecimal(allocation.allocatedQuantityDecimal),
    }));
    if (quantityParts.some((entry) => entry.quantity.units <= BigInt(0))) {
      verificationFailure("independent_allocation_quantity");
    }
    const quantityScale = Math.max(...quantityParts.map((entry) =>
      entry.quantity.scale));
    const scaledQuantities = quantityParts.map((entry) => ({
      allocation: entry.allocation,
      units: entry.quantity.units *
        powerOfTen(quantityScale - entry.quantity.scale),
    }));
    const totalQuantityUnits = scaledQuantities.reduce(
      (sum, entry) => sum + entry.units,
      BigInt(0),
    );
    const shares = scaledQuantities.map((entry) => {
      const numerator = absoluteFeeUnits * entry.units;
      return {
        allocation: entry.allocation,
        units: numerator / totalQuantityUnits,
        remainder: numerator % totalQuantityUnits,
      };
    });
    const floorTotal = shares.reduce(
      (sum, share) => sum + share.units,
      BigInt(0),
    );
    const remaining = absoluteFeeUnits - floorTotal;
    if (remaining < BigInt(0) || remaining >= BigInt(shares.length)) {
      verificationFailure("independent_fee_remainder");
    }
    const remainderOrder = [...shares].sort((left, right) =>
      left.remainder === right.remainder
        ? left.allocation.allocationSequence - right.allocation.allocationSequence ||
          left.allocation.allocationId.localeCompare(right.allocation.allocationId)
        : left.remainder > right.remainder ? -1 : 1);
    for (let index = 0; index < Number(remaining); index += 1) {
      remainderOrder[index].units += BigInt(1);
    }
    for (const share of shares) {
      if (result.has(share.allocation.allocationId)) {
        verificationFailure("independent_allocation_identity");
      }
      result.set(share.allocation.allocationId, Object.freeze({
        state: "complete" as const,
        costDecimal: fee.units < BigInt(0)
          ? decimalFromUnits(share.units, fee.scale)
          : "0",
        creditDecimal: fee.units < BigInt(0)
          ? "0"
          : decimalFromUnits(share.units, fee.scale),
        currency: first.feeCurrency,
      }));
    }
  }
  return result;
}

function canonicalRowDigest(
  rows: readonly IndependentAnalyticsRow[],
): string {
  return sha256Json([...rows]
    .sort((left, right) => left.roundTripId.localeCompare(right.roundTripId))
    .map((row) => ({
      roundTripId: row.roundTripId,
      grossPnlDecimal: row.grossPnlDecimal,
      chargeCoverage: row.chargeCoverage,
      chargeCostDecimal: row.chargeCostDecimal,
      chargeCreditDecimal: row.chargeCreditDecimal,
      netPnlDecimal: row.netPnlDecimal,
    })));
}

export function independentlyReconstructJournalAnalytics(
  factSet: JournalAnalyticsFactSet,
): IndependentAnalyticsReconciliation {
  const allAllocations = factSet.roundTrips.flatMap((roundTrip) =>
    roundTrip.allocations);
  const charges = independentlyAllocateExecutionFees(allAllocations);
  const rows: IndependentAnalyticsRow[] = [];
  for (const roundTrip of factSet.roundTrips) {
    if (roundTrip.projectionState !== "ready_closed" || roundTrip.assetClass !== "stock") {
      continue;
    }
    if (roundTrip.closedAtUtc === null) {
      verificationFailure("independent_ready_closed_time");
    }
    let gross = "0";
    let position = "0";
    let cost = "0";
    let credit = "0";
    let chargeComplete = true;
    for (const allocation of roundTrip.allocations) {
      if (allocation.priceDecimal === null) {
        verificationFailure("independent_ready_closed_price");
      }
      const notional = multiplyDecimals(
        allocation.allocatedQuantityDecimal,
        allocation.priceDecimal,
      );
      gross = addDecimals(
        gross,
        allocation.side === "sell" ? notional : negateDecimal(notional),
      );
      position = addDecimals(
        position,
        allocation.side === "buy"
          ? allocation.allocatedQuantityDecimal
          : negateDecimal(allocation.allocatedQuantityDecimal),
      );
      const charge = charges.get(allocation.allocationId);
      if (!charge) verificationFailure("independent_charge_missing");
      if (
        charge.state === "unavailable" ||
        charge.currency !== roundTrip.tradeCurrency
      ) {
        chargeComplete = false;
      } else {
        cost = addDecimals(cost, charge.costDecimal);
        credit = addDecimals(credit, charge.creditDecimal);
      }
    }
    if (position !== "0") {
      verificationFailure("independent_ready_closed_position");
    }
    const net = chargeComplete
      ? addDecimals(addDecimals(gross, negateDecimal(cost)), credit)
      : null;
    rows.push(Object.freeze({
      roundTripId: roundTrip.roundTripId,
      grossPnlDecimal: gross,
      chargeCoverage: chargeComplete ? "complete" : "unavailable",
      chargeCostDecimal: chargeComplete ? cost : null,
      chargeCreditDecimal: chargeComplete ? credit : null,
      netPnlDecimal: net,
    }));
  }
  const frozenRows = Object.freeze(rows);
  const feeCompleteRows = frozenRows.filter((row) => row.netPnlDecimal !== null);
  return Object.freeze({
    rows: frozenRows,
    rowDigestSha256: canonicalRowDigest(frozenRows),
    realizedCount: frozenRows.length,
    feeCompleteCount: feeCompleteRows.length,
    feeIncompleteCount: frozenRows.length - feeCompleteRows.length,
    grossPnlDecimal: frozenRows.reduce(
      (sum, row) => addDecimals(sum, row.grossPnlDecimal),
      "0",
    ),
    netPnlDecimal: feeCompleteRows.reduce(
      (sum, row) => addDecimals(sum, row.netPnlDecimal!),
      "0",
    ),
    chargeCostDecimal: feeCompleteRows.reduce(
      (sum, row) => addDecimals(sum, row.chargeCostDecimal!),
      "0",
    ),
    chargeCreditDecimal: feeCompleteRows.reduce(
      (sum, row) => addDecimals(sum, row.chargeCreditDecimal!),
      "0",
    ),
  });
}

function productionRows(
  rows: readonly NormalizedJournalAnalyticsRow[],
): readonly IndependentAnalyticsRow[] {
  return Object.freeze(rows.map((row) => Object.freeze({
    roundTripId: row.roundTripId,
    grossPnlDecimal: row.grossPnlDecimal,
    chargeCoverage: row.chargeCoverage,
    chargeCostDecimal: row.chargeCostDecimal,
    chargeCreditDecimal: row.chargeCreditDecimal,
    netPnlDecimal: row.netPnlDecimal,
  })));
}

function buildVerificationQuery(
  accountId: string,
  asOfUtc: string,
  afterCursor: string | null = null,
): JournalAnalyticsQuery {
  return Object.freeze({
    queryVersion: JOURNAL_ANALYTICS_QUERY_VERSION,
    accountIds: Object.freeze([accountId]),
    metricIds: VERIFIED_METRIC_IDS,
    moneyBasis: "net" as const,
    closingDateRange: Object.freeze({ kind: "all_available" as const }),
    currency: null,
    instrumentIds: Object.freeze([]),
    symbols: Object.freeze([]),
    directions: Object.freeze([]),
    tradeClassifications: Object.freeze([]),
    provenance: Object.freeze([]),
    outcomes: Object.freeze([]),
    entryWeekdays: Object.freeze([]),
    entryTimeBuckets: Object.freeze([]),
    holdingDurationRange: Object.freeze({
      minimumMillisecondsInclusive: null,
      maximumMillisecondsInclusive: null,
    }),
    enteredQuantityRange: Object.freeze({
      minimumInclusive: null,
      maximumInclusive: null,
    }),
    maximumPositionRange: Object.freeze({
      minimumInclusive: null,
      maximumInclusive: null,
    }),
    entryNotionalRange: Object.freeze({
      minimumInclusive: null,
      maximumInclusive: null,
    }),
    groupings: Object.freeze([
      "closing_day" as const,
      "instrument" as const,
      "entry_time_bucket" as const,
    ]),
    entryTimeBucketMinutes: 30 as const,
    asOfUtc,
    table: Object.freeze({ pageSize: 200, afterCursor }),
  });
}

function requireSinglePartition(
  response: JournalAnalyticsPartitionedResponse,
): JournalAnalyticsPartitionedResponse["partitions"][number] {
  if (response.partitions.length !== 1 || !response.partitions[0]) {
    verificationFailure("single_partition_baseline");
  }
  return response.partitions[0];
}

function metric(
  response: JournalAnalyticsPartitionedResponse,
  metricId: string,
): JournalAnalyticsMetricResult {
  const values = requireSinglePartition(response).metrics.filter((entry) =>
    entry.metricId === metricId);
  if (values.length !== 1 || !values[0]) {
    verificationFailure("headline_metric_cardinality");
  }
  return values[0];
}

function requireIntegerMetric(
  response: JournalAnalyticsPartitionedResponse,
  metricId: string,
  expected: number,
): void {
  const value = metric(response, metricId).value;
  if (value?.kind !== "integer" || value.value !== expected) {
    verificationFailure("headline_integer_metric");
  }
}

function requireDecimalMetric(
  response: JournalAnalyticsPartitionedResponse,
  metricId: string,
  expected: string,
): void {
  const value = metric(response, metricId).value;
  if (value?.kind !== "decimal" || value.valueDecimal !== expected) {
    verificationFailure("headline_decimal_metric");
  }
}

function serviceDigest(
  responses: readonly JournalAnalyticsPartitionedResponse[],
): string {
  return sha256Json(responses.map((response) => ({
    factSetRevisionSha256: response.factSetRevisionSha256,
    registryVersion: response.registryVersion,
    partitions: response.partitions.map((partition) => ({
      currency: partition.currency,
      timezone: partition.timezone,
      coverage: partition.coverage,
      reconciliation: partition.reconciliation,
      metricDigests: partition.metrics.map((entry) => ({
        metricId: entry.metricId,
        resultDigestSha256: entry.resultDigestSha256,
      })),
      groupingDigests: partition.groups.map((group) => ({
        grouping: group.grouping,
        groupKey: group.groupKey,
        metricDigests: group.metrics.map((entry) => ({
          metricId: entry.metricId,
          resultDigestSha256: entry.resultDigestSha256,
        })),
      })),
    })),
  })));
}

function verifyTraderLinkPlatformJournalAnalyticsInternal(
  options: TraderLinkJournalAnalyticsVerificationOptions,
): TraderLinkJournalAnalyticsVerificationResult {
  const startedAt = performance.now();
  const environment = options.environment ?? process.env;
  const databasePath = options.databasePath
    ? validatePlatformDatabasePath(options.databasePath, {
        forbiddenRepositoryRoots: options.forbiddenRepositoryRoots,
      })
    : resolvePlatformDatabaseConfig({
        environment,
        forbiddenRepositoryRoots: options.forbiddenRepositoryRoots,
      }).databasePath;
  const walPath = `${databasePath}-wal`;
  requireNoPendingWal(walPath);
  const initialSize = statSync(databasePath).size;
  const initialSha256 = sha256Bytes(readFileSync(databasePath));
  const fixedNow = options.now?.() ?? new Date();
  let database: Database.Database | null = null;
  try {
    database = new Database(databasePath, {
      readonly: true,
      fileMustExist: true,
      timeout: 5_000,
    });
    database.pragma("foreign_keys = ON");
    database.pragma("busy_timeout = 5000");
    database.pragma("query_only = ON");
    verifyCompletedPlatformDatabase(database);
    verifyPlatformDatabaseConnectionPragmas(database);
    const ownerBoundary = deriveDevelopmentOwnerJournalScope(database);
    const ibkrIdentities = new JournalAccountRepository(database)
      .listNonSupersededSourceIdentities(ownerBoundary.scope.workspaceId, "ibkr");
    const activeIbkrIdentities = ibkrIdentities.filter((identity) =>
      identity.status === "active_current");
    const ibkrAccountIds = new Set(ibkrIdentities.map((identity) => identity.accountId));
    if (
      activeIbkrIdentities.length !== 1 ||
      !activeIbkrIdentities[0] ||
      ibkrAccountIds.size !== 1
    ) {
      verificationFailure("accepted_ibkr_identity_cardinality");
    }
    const owner = deriveDevelopmentOwnerJournalScopeForAccount(
      database,
      activeIbkrIdentities[0].accountId,
    );
    const accountId = owner.accountId;
    if (!accountId) verificationFailure("accepted_account_scope");
    const factSetService = new JournalAnalyticsFactSetService(
      new JournalAnalyticsFactSetRepository(database, () => fixedNow),
    );
    const factSet = factSetService.getJournalAnalyticsFactSet(owner.scope, {
      accountIds: Object.freeze([accountId]),
      closingDateRange: Object.freeze({ kind: "all_available" as const }),
      currencySelection: Object.freeze({ kind: "all_partitions" as const }),
    });
    const readyClosed = factSet.roundTrips.filter((roundTrip) =>
      roundTrip.projectionState === "ready_closed").length;
    const legitimateOpen = factSet.roundTrips.filter((roundTrip) =>
      roundTrip.projectionState === "legitimate_open").length;
    const needsDecision = factSet.roundTrips.filter((roundTrip) =>
      roundTrip.projectionState === "needs_decision").length;
    const pendingDecisionIds = new Set(
      factSet.pendingDecisions.map((decision) => decision.decisionId),
    );
    const decisionCoverageComplete = factSet.roundTrips
      .filter((roundTrip) => roundTrip.projectionState === "needs_decision")
      .every((roundTrip) =>
        roundTrip.pendingDecisionIds.length > 0 &&
        roundTrip.pendingDecisionReasonCodes.length > 0 &&
        roundTrip.pendingDecisionIds.every((decisionId) =>
          pendingDecisionIds.has(decisionId)));
    if (
      readyClosed !== EXPECTED_READY_CLOSED_COUNT ||
      legitimateOpen !== EXPECTED_LEGITIMATE_OPEN_COUNT ||
      needsDecision !== EXPECTED_NEEDS_DECISION_COUNT ||
      !decisionCoverageComplete
    ) {
      verificationFailure("accepted_projection_counts");
    }
    const independent = independentlyReconstructJournalAnalytics(factSet);
    const normalized = normalizeJournalAnalyticsFacts(factSet);
    const productionDigest = canonicalRowDigest(
      productionRows(normalized.realizedRows),
    );
    if (
      independent.realizedCount !== EXPECTED_READY_CLOSED_COUNT ||
      normalized.realizedRows.length !== EXPECTED_READY_CLOSED_COUNT ||
      normalized.legitimateOpenRoundTrips.length !== EXPECTED_LEGITIMATE_OPEN_COUNT ||
      normalized.needsDecisionRoundTrips.length !== EXPECTED_NEEDS_DECISION_COUNT ||
      normalized.unavailableRoundTrips.length !== 0 ||
      independent.rowDigestSha256 !== productionDigest
    ) {
      verificationFailure("independent_row_reconciliation");
    }
    const factSetAndNormalizationAt = performance.now();
    const query = buildVerificationQuery(
      accountId,
      fixedNow.toISOString(),
    );
    const analytics = new JournalAnalyticsService(factSetService);
    const responses = Object.freeze([
      analytics.getWorkspaceJournalAnalyticsSummary(owner.scope, query),
      analytics.getAnalyticsOverview(owner.scope, query),
      analytics.getPerformanceAnalytics(owner.scope, query),
      analytics.getResultAnalytics(owner.scope, query),
      analytics.getTimingAnalytics(owner.scope, query),
      analytics.getExecutionAnalytics(owner.scope, query),
    ]);
    const revisions = new Set(responses.map((response) =>
      response.factSetRevisionSha256));
    if (
      revisions.size !== 1 ||
      !revisions.has(factSet.sourceRevisionSha256) ||
      responses.some((response) =>
        response.crossPartitionCounts.readyClosedCount !==
          EXPECTED_READY_CLOSED_COUNT ||
        response.crossPartitionCounts.legitimateOpenCount !==
          EXPECTED_LEGITIMATE_OPEN_COUNT ||
        response.crossPartitionCounts.needsDecisionCount !==
          EXPECTED_NEEDS_DECISION_COUNT ||
        requireSinglePartition(response).reconciliation.status !== "reconciled")
    ) {
      verificationFailure("page_service_reconciliation");
    }
    const overview = responses[1];
    requireIntegerMetric(
      overview,
      "ready_closed_count",
      independent.realizedCount,
    );
    requireIntegerMetric(
      overview,
      "fee_complete_trade_count",
      independent.feeCompleteCount,
    );
    requireIntegerMetric(
      overview,
      "fee_incomplete_trade_count",
      independent.feeIncompleteCount,
    );
    requireDecimalMetric(
      overview,
      "gross_pnl",
      independent.grossPnlDecimal,
    );
    requireDecimalMetric(
      overview,
      "net_pnl",
      independent.netPnlDecimal,
    );
    requireDecimalMetric(
      overview,
      "charge_cost",
      independent.chargeCostDecimal,
    );
    requireDecimalMetric(
      overview,
      "charge_credit",
      independent.chargeCreditDecimal,
    );
    const firstResponseDigest = sha256Json({
      coverage: responses[0].crossPartitionCounts,
      metrics: requireSinglePartition(responses[0]).metrics.map((entry) => ({
        metricId: entry.metricId,
        resultDigestSha256: entry.resultDigestSha256,
      })),
      groups: requireSinglePartition(responses[0]).groups.map((group) => ({
        grouping: group.grouping,
        groupKey: group.groupKey,
        metricDigests: group.metrics.map((entry) => entry.resultDigestSha256),
      })),
    });
    if (responses.some((response) => sha256Json({
      coverage: response.crossPartitionCounts,
      metrics: requireSinglePartition(response).metrics.map((entry) => ({
        metricId: entry.metricId,
        resultDigestSha256: entry.resultDigestSha256,
      })),
      groups: requireSinglePartition(response).groups.map((group) => ({
        grouping: group.grouping,
        groupKey: group.groupKey,
        metricDigests: group.metrics.map((entry) => entry.resultDigestSha256),
      })),
    }) !== firstResponseDigest)) {
      verificationFailure("page_service_result_digest");
    }
    let afterCursor: string | null = null;
    let tableRows = 0;
    let expectedTotalRows: number | null = null;
    const tableIds = new Set<string>();
    do {
      const table = analytics.getRoundTripAnalyticsTable(
        owner.scope,
        buildVerificationQuery(accountId, fixedNow.toISOString(), afterCursor),
      );
      if (
        table.factSetRevisionSha256 !== factSet.sourceRevisionSha256 ||
        (expectedTotalRows !== null && table.totalRowCount !== expectedTotalRows)
      ) {
        verificationFailure("table_revision_or_total");
      }
      expectedTotalRows = table.totalRowCount;
      for (const row of table.rows) {
        if (tableIds.has(row.roundTripId)) {
          verificationFailure("table_duplicate_row");
        }
        tableIds.add(row.roundTripId);
      }
      tableRows += table.rows.length;
      afterCursor = table.continuationCursor;
    } while (afterCursor !== null);
    if (
      expectedTotalRows !== independent.feeCompleteCount ||
      tableRows !== independent.feeCompleteCount ||
      tableIds.size !== independent.feeCompleteCount
    ) {
      verificationFailure("table_pagination_reconciliation");
    }
    const servicesAndPaginationAt = performance.now();
    database.close();
    database = null;
    requireNoPendingWal(walPath);
    const finalSize = statSync(databasePath).size;
    const finalSha256 = sha256Bytes(readFileSync(databasePath));
    if (finalSize !== initialSize || finalSha256 !== initialSha256) {
      verificationFailure("database_changed_during_verification");
    }
    const finishedAt = performance.now();
    return Object.freeze({
      status: "journal_analytics_verified" as const,
      identifiersRedacted: true as const,
      database: Object.freeze({
        fileSizeBytes: finalSize,
        fileSha256: finalSha256,
        state: "unchanged" as const,
        sidecars: "no_pending_wal" as const,
      }),
      counts: Object.freeze({
        readyClosed,
        legitimateOpen,
        needsDecision,
        feeComplete: independent.feeCompleteCount,
        feeIncomplete: independent.feeIncompleteCount,
        tableRows,
        serviceResponses: responses.length,
      }),
      digests: Object.freeze({
        factSetRevisionSha256: factSet.sourceRevisionSha256,
        productionNormalizationSha256: productionDigest,
        independentRowsSha256: independent.rowDigestSha256,
        pageServicesSha256: serviceDigest(responses),
      }),
      reconciliation: Object.freeze({
        independentRows: "matched" as const,
        headlineMetrics: "matched" as const,
        pageServices: "matched" as const,
        tablePagination: "matched" as const,
      }),
      timingMilliseconds: Object.freeze({
        total: Math.round(finishedAt - startedAt),
        factSetAndNormalization: Math.round(factSetAndNormalizationAt - startedAt),
        servicesAndPagination: Math.round(
          servicesAndPaginationAt - factSetAndNormalizationAt,
        ),
      }),
    });
  } catch (error) {
    if (isTraderLinkPlatformError(error)) throw error;
    return platformFailure(
      "TRADERLINK_JOURNAL_INTEGRITY_VERIFICATION_FAILED",
      { check: "analytics_unexpected_verifier_failure" },
      error,
    );
  } finally {
    database?.close();
  }
}

export function verifyTraderLinkPlatformJournalAnalytics(
  options: TraderLinkJournalAnalyticsVerificationOptions = {},
): TraderLinkJournalAnalyticsVerificationResult {
  try {
    return verifyTraderLinkPlatformJournalAnalyticsInternal(options);
  } catch (error) {
    if (isTraderLinkPlatformError(error)) throw error;
    platformFailure(
      "TRADERLINK_JOURNAL_INTEGRITY_VERIFICATION_FAILED",
      { check: "analytics_unexpected_verifier_boundary_failure" },
      error,
    );
  }
}

function isDirectExecution(): boolean {
  const invokedPath = process.argv[1];
  if (!invokedPath) return false;
  return resolve(invokedPath).toLowerCase() ===
    fileURLToPath(import.meta.url).toLowerCase();
}

if (isDirectExecution()) {
  const action = process.argv.slice(2);
  if (
    action.length !== 1 ||
    action[0] !== `--action=${JOURNAL_ANALYTICS_VERIFICATION_ACTION}`
  ) {
    console.error(JSON.stringify({
      code: "TRADERLINK_JOURNAL_ANALYTICS_ARGUMENT_INVALID",
    }));
    process.exitCode = 1;
  } else {
    try {
      console.info(JSON.stringify(
        verifyTraderLinkPlatformJournalAnalytics(),
        null,
        2,
      ));
    } catch (error) {
      console.error(JSON.stringify({
        code: isTraderLinkPlatformError(error)
          ? error.code
          : "TRADERLINK_JOURNAL_ANALYTICS_VERIFICATION_FAILED",
      }));
      process.exitCode = 1;
    }
  }
}
