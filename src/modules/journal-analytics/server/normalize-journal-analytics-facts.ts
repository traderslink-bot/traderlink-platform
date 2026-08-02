import { createHash } from "node:crypto";

import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";
import type {
  JournalAnalyticsAllocationFact,
  JournalAnalyticsFactSet,
  JournalAnalyticsRoundTripFact,
} from "@/src/modules/journal/contracts/journal-analytics-fact-set";

import type { JournalAnalyticsOutcome, JournalAnalyticsProvenanceGroup } from "../contracts/analytics-query";
import {
  allocateExecutionCharges,
  type AllocatedExecutionCharge,
} from "./allocate-execution-charges";
import {
  absoluteExactDecimal,
  addExactDecimals,
  compareExactDecimals,
  multiplyExactDecimals,
  negateExactDecimal,
  subtractExactDecimals,
} from "./exact-analytics-math";

export const JOURNAL_ANALYTICS_NORMALIZATION_VERSION =
  "journal_analytics_normalization_v1" as const;

export type JournalAnalyticsLocalTimeFact = Readonly<{
  localDate: string;
  weekday: "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";
  hour: number;
  minute: number;
  bucket30Minute: string;
}>;

export type NormalizedJournalAnalyticsRow = Readonly<{
  roundTripId: string;
  roundTripVersionId: string;
  accountId: string;
  instrumentId: string;
  displayedSymbol: string;
  tradeCurrency: string;
  tradingTimezone: string;
  direction: "long" | "short";
  openedAtUtc: string;
  closedAtUtc: string;
  entryLocal: JournalAnalyticsLocalTimeFact;
  closeLocal: JournalAnalyticsLocalTimeFact;
  holdingDurationMilliseconds: number;
  isOvernight: boolean;
  uniqueExecutionCount: number;
  allocationCount: number;
  provenanceGroup: JournalAnalyticsProvenanceGroup;
  hasOverlapEvidence: boolean;
  grossPnlDecimal: string;
  grossOutcome: JournalAnalyticsOutcome;
  chargeCoverage: "complete" | "unavailable";
  chargeUnavailableReasonCodes: readonly string[];
  chargeCostDecimal: string | null;
  chargeCreditDecimal: string | null;
  netPnlDecimal: string | null;
  netOutcome: JournalAnalyticsOutcome | null;
  enteredQuantityDecimal: string;
  maximumPositionQuantityDecimal: string;
  entryNotionalDecimal: string;
  exitNotionalDecimal: string;
}>;

export type JournalAnalyticsUnavailableRoundTrip = Readonly<{
  roundTripId: string;
  accountId: string;
  instrumentId: string;
  displayedSymbol: string;
  tradeCurrency: string;
  tradingTimezone: string;
  direction: "long" | "short";
  openedAtUtc: string;
  closedAtUtc: string | null;
  provenanceGroup: JournalAnalyticsProvenanceGroup;
  projectionState: JournalAnalyticsRoundTripFact["projectionState"];
  reasonCode: "instrument_value_convention_missing";
}>;

export type NormalizedJournalAnalyticsSet = Readonly<{
  normalizationVersion: typeof JOURNAL_ANALYTICS_NORMALIZATION_VERSION;
  factSetRevisionSha256: string;
  normalizationDigestSha256: string;
  accounts: JournalAnalyticsFactSet["accounts"];
  realizedRows: readonly NormalizedJournalAnalyticsRow[];
  legitimateOpenRoundTrips: readonly JournalAnalyticsRoundTripFact[];
  needsDecisionRoundTrips: readonly JournalAnalyticsRoundTripFact[];
  unavailableRoundTrips: readonly JournalAnalyticsUnavailableRoundTrip[];
}>;

type AllocationChargeState =
  | Readonly<{ state: "complete"; charge: AllocatedExecutionCharge; feeCurrency: string }>
  | Readonly<{ state: "unavailable"; reasonCode: string }>;

const dateTimeFormatters = new Map<string, Intl.DateTimeFormat>();

function formatter(timeZone: string): Intl.DateTimeFormat {
  const existing = dateTimeFormatters.get(timeZone);
  if (existing) return existing;
  const created = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  dateTimeFormatters.set(timeZone, created);
  return created;
}

export function journalAnalyticsLocalTimeFact(
  atUtc: string,
  timeZone: string,
): JournalAnalyticsLocalTimeFact {
  const values = Object.fromEntries(
    formatter(timeZone).formatToParts(new Date(atUtc))
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );
  const weekdays = Object.freeze({
    Mon: "monday",
    Tue: "tuesday",
    Wed: "wednesday",
    Thu: "thursday",
    Fri: "friday",
    Sat: "saturday",
    Sun: "sunday",
  } as const);
  const weekday = weekdays[values.weekday as keyof typeof weekdays];
  const hour = Number(values.hour);
  const minute = Number(values.minute);
  if (
    !weekday ||
    !Number.isInteger(hour) ||
    !Number.isInteger(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", {
      check: "analytics_local_time",
    });
  }
  const bucketMinute = Math.floor(minute / 30) * 30;
  return Object.freeze({
    localDate: `${values.year}-${values.month}-${values.day}`,
    weekday,
    hour,
    minute,
    bucket30Minute: `${String(hour).padStart(2, "0")}:${String(bucketMinute).padStart(2, "0")}`,
  });
}

function outcome(value: string): JournalAnalyticsOutcome {
  const comparison = compareExactDecimals(value, "0");
  return comparison > 0 ? "win" : comparison < 0 ? "loss" : "flat";
}

export function classifyJournalAnalyticsProvenance(
  allocations: readonly JournalAnalyticsAllocationFact[],
): Readonly<{
  group: JournalAnalyticsProvenanceGroup;
  hasOverlapEvidence: boolean;
}> {
  const kinds = new Set(allocations.flatMap((allocation) =>
    allocation.provenanceKinds));
  const origins = ["broker", "manual", "correction"].filter((kind) =>
    kinds.has(kind as "broker" | "manual" | "correction"));
  const group = origins.length === 0
    ? "unknown"
    : origins.length > 1
      ? "mixed"
      : `${origins[0]}_only` as JournalAnalyticsProvenanceGroup;
  return Object.freeze({
    group,
    hasOverlapEvidence: kinds.has("overlap_match"),
  });
}

function groupExecutionAllocations(
  factSet: JournalAnalyticsFactSet,
): ReadonlyMap<string, readonly JournalAnalyticsAllocationFact[]> {
  const grouped = new Map<string, JournalAnalyticsAllocationFact[]>();
  for (const roundTrip of factSet.roundTrips) {
    for (const allocation of roundTrip.allocations) {
      const key = JSON.stringify([
        roundTrip.accountId,
        allocation.executionVersionId,
      ]);
      const entries = grouped.get(key) ?? [];
      entries.push(allocation);
      grouped.set(key, entries);
    }
  }
  return new Map([...grouped.entries()].map(([key, allocations]) => [
    key,
    Object.freeze([...allocations].sort((left, right) =>
      left.executedAtUtc.localeCompare(right.executedAtUtc) ||
      left.sourceOrderKey.localeCompare(right.sourceOrderKey) ||
      left.allocationSequence - right.allocationSequence ||
      left.allocationId.localeCompare(right.allocationId))),
  ]));
}

function allocateAllCharges(
  factSet: JournalAnalyticsFactSet,
): ReadonlyMap<string, AllocationChargeState> {
  const result = new Map<string, AllocationChargeState>();
  for (const allocations of groupExecutionAllocations(factSet).values()) {
    const first = allocations[0];
    const stableFacts = JSON.stringify({
      executionId: first.executionId,
      executionVersionId: first.executionVersionId,
      executionQuantityDecimal: first.executionQuantityDecimal,
      feesDecimal: first.feesDecimal,
      feeCurrency: first.feeCurrency,
      feeSignConvention: first.feeSignConvention,
      feePolicyCandidates: first.feePolicyCandidates,
    });
    if (allocations.some((allocation) => JSON.stringify({
      executionId: allocation.executionId,
      executionVersionId: allocation.executionVersionId,
      executionQuantityDecimal: allocation.executionQuantityDecimal,
      feesDecimal: allocation.feesDecimal,
      feeCurrency: allocation.feeCurrency,
      feeSignConvention: allocation.feeSignConvention,
      feePolicyCandidates: allocation.feePolicyCandidates,
    }) !== stableFacts)) {
      platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", {
        check: "analytics_execution_fact_mismatch",
      });
    }
    const allocated = allocateExecutionCharges({
      executionId: first.executionId,
      executionVersionId: first.executionVersionId,
      executionQuantityDecimal: first.executionQuantityDecimal,
      feesDecimal: first.feesDecimal,
      feeCurrency: first.feeCurrency,
      feeSignConvention: first.feeSignConvention,
      feePolicyCandidates: first.feePolicyCandidates,
      allocations: Object.freeze(allocations.map((allocation) => Object.freeze({
        allocationId: allocation.allocationId,
        allocationSequence: allocation.allocationSequence,
        quantityDecimal: allocation.allocatedQuantityDecimal,
      }))),
    });
    if (allocated.state === "complete") {
      for (const charge of allocated.allocations) {
        if (result.has(charge.allocationId)) {
          platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", {
            check: "analytics_allocation_id_duplicate",
          });
        }
        result.set(charge.allocationId, Object.freeze({
          state: "complete" as const,
          charge,
          feeCurrency: allocated.feeCurrency,
        }));
      }
    } else {
      for (const allocation of allocations) {
        result.set(allocation.allocationId, Object.freeze({
          state: "unavailable" as const,
          reasonCode: allocated.reasonCode,
        }));
      }
    }
  }
  return result;
}

function normalizeReadyClosed(
  roundTrip: JournalAnalyticsRoundTripFact,
  tradingTimezone: string,
  chargeByAllocation: ReadonlyMap<string, AllocationChargeState>,
): NormalizedJournalAnalyticsRow {
  if (roundTrip.closedAtUtc === null) {
    platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", {
      check: "analytics_ready_closed_time",
    });
  }
  let grossPnlDecimal = "0";
  let enteredQuantityDecimal = "0";
  let entryNotionalDecimal = "0";
  let exitNotionalDecimal = "0";
  let runningPositionDecimal = "0";
  let maximumPositionQuantityDecimal = "0";
  let chargeCostDecimal = "0";
  let chargeCreditDecimal = "0";
  const chargeReasons = new Set<string>();
  const increasingRoles = new Set(["opening", "adding", "flip_opening"]);
  for (const allocation of roundTrip.allocations) {
    if (allocation.priceDecimal === null) {
      platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", {
        check: "analytics_ready_closed_price",
      });
    }
    const notional = multiplyExactDecimals(
      allocation.allocatedQuantityDecimal,
      allocation.priceDecimal,
    );
    grossPnlDecimal = addExactDecimals(
      grossPnlDecimal,
      allocation.side === "sell" ? notional : negateExactDecimal(notional),
    );
    const signedQuantity = allocation.side === "buy"
      ? allocation.allocatedQuantityDecimal
      : negateExactDecimal(allocation.allocatedQuantityDecimal);
    runningPositionDecimal = addExactDecimals(
      runningPositionDecimal,
      signedQuantity,
    );
    const absolutePosition = absoluteExactDecimal(runningPositionDecimal);
    if (
      compareExactDecimals(
        absolutePosition,
        maximumPositionQuantityDecimal,
      ) > 0
    ) {
      maximumPositionQuantityDecimal = absolutePosition;
    }
    if (increasingRoles.has(allocation.allocationRole)) {
      enteredQuantityDecimal = addExactDecimals(
        enteredQuantityDecimal,
        allocation.allocatedQuantityDecimal,
      );
      entryNotionalDecimal = addExactDecimals(entryNotionalDecimal, notional);
    } else {
      exitNotionalDecimal = addExactDecimals(exitNotionalDecimal, notional);
    }
    const charge = chargeByAllocation.get(allocation.allocationId);
    if (!charge) {
      platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", {
        check: "analytics_charge_allocation_missing",
      });
    }
    if (charge.state === "unavailable") {
      chargeReasons.add(charge.reasonCode);
    } else if (charge.feeCurrency !== roundTrip.tradeCurrency) {
      chargeReasons.add("fee_currency_mismatch");
    } else {
      chargeCostDecimal = addExactDecimals(
        chargeCostDecimal,
        charge.charge.chargeCostDecimal,
      );
      chargeCreditDecimal = addExactDecimals(
        chargeCreditDecimal,
        charge.charge.chargeCreditDecimal,
      );
    }
  }
  if (compareExactDecimals(runningPositionDecimal, "0") !== 0) {
    platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", {
      check: "analytics_ready_closed_position",
    });
  }
  const openedAt = Date.parse(roundTrip.openedAtUtc);
  const closedAt = Date.parse(roundTrip.closedAtUtc);
  const holdingDurationMilliseconds = closedAt - openedAt;
  if (
    !Number.isSafeInteger(holdingDurationMilliseconds) ||
    holdingDurationMilliseconds < 0
  ) {
    platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", {
      check: "analytics_holding_duration",
    });
  }
  const chargeUnavailableReasonCodes = Object.freeze([...chargeReasons].sort());
  const chargeCoverage = chargeReasons.size === 0 ? "complete" : "unavailable";
  const netPnlDecimal = chargeCoverage === "complete"
    ? addExactDecimals(
        subtractExactDecimals(grossPnlDecimal, chargeCostDecimal),
        chargeCreditDecimal,
      )
    : null;
  const entryLocal = journalAnalyticsLocalTimeFact(
    roundTrip.openedAtUtc,
    tradingTimezone,
  );
  const closeLocal = journalAnalyticsLocalTimeFact(
    roundTrip.closedAtUtc,
    tradingTimezone,
  );
  const source = classifyJournalAnalyticsProvenance(roundTrip.allocations);
  return Object.freeze({
    roundTripId: roundTrip.roundTripId,
    roundTripVersionId: roundTrip.roundTripVersionId,
    accountId: roundTrip.accountId,
    instrumentId: roundTrip.instrumentId,
    displayedSymbol: roundTrip.displayedSymbol,
    tradeCurrency: roundTrip.tradeCurrency,
    tradingTimezone,
    direction: roundTrip.direction,
    openedAtUtc: roundTrip.openedAtUtc,
    closedAtUtc: roundTrip.closedAtUtc,
    entryLocal,
    closeLocal,
    holdingDurationMilliseconds,
    isOvernight: entryLocal.localDate !== closeLocal.localDate,
    uniqueExecutionCount: new Set(roundTrip.allocations.map((allocation) =>
      allocation.executionId)).size,
    allocationCount: roundTrip.allocations.length,
    provenanceGroup: source.group,
    hasOverlapEvidence: source.hasOverlapEvidence,
    grossPnlDecimal,
    grossOutcome: outcome(grossPnlDecimal),
    chargeCoverage,
    chargeUnavailableReasonCodes,
    chargeCostDecimal: chargeCoverage === "complete" ? chargeCostDecimal : null,
    chargeCreditDecimal: chargeCoverage === "complete" ? chargeCreditDecimal : null,
    netPnlDecimal,
    netOutcome: netPnlDecimal === null ? null : outcome(netPnlDecimal),
    enteredQuantityDecimal,
    maximumPositionQuantityDecimal,
    entryNotionalDecimal,
    exitNotionalDecimal,
  });
}

function normalizationDigest(input: Readonly<{
  factSetRevisionSha256: string;
  realizedRows: readonly NormalizedJournalAnalyticsRow[];
  legitimateOpenRoundTrips: readonly JournalAnalyticsRoundTripFact[];
  needsDecisionRoundTrips: readonly JournalAnalyticsRoundTripFact[];
  unavailableRoundTrips: readonly JournalAnalyticsUnavailableRoundTrip[];
}>): string {
  return createHash("sha256").update(JSON.stringify({
    normalizationVersion: JOURNAL_ANALYTICS_NORMALIZATION_VERSION,
    ...input,
  }), "utf8").digest("hex");
}

export function normalizeJournalAnalyticsFacts(
  factSet: JournalAnalyticsFactSet,
): NormalizedJournalAnalyticsSet {
  const accountById = new Map(factSet.accounts.map((account) => [
    account.accountId,
    account,
  ]));
  const chargeByAllocation = allocateAllCharges(factSet);
  const realizedRows: NormalizedJournalAnalyticsRow[] = [];
  const legitimateOpenRoundTrips: JournalAnalyticsRoundTripFact[] = [];
  const needsDecisionRoundTrips: JournalAnalyticsRoundTripFact[] = [];
  const unavailableRoundTrips: JournalAnalyticsUnavailableRoundTrip[] = [];
  for (const roundTrip of factSet.roundTrips) {
    const account = accountById.get(roundTrip.accountId);
    if (!account) {
      platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", {
        check: "analytics_round_trip_account",
      });
    }
    if (roundTrip.projectionState === "legitimate_open") {
      legitimateOpenRoundTrips.push(roundTrip);
      continue;
    }
    if (roundTrip.projectionState === "needs_decision") {
      needsDecisionRoundTrips.push(roundTrip);
      continue;
    }
    if (roundTrip.assetClass !== "stock") {
      const source = classifyJournalAnalyticsProvenance(roundTrip.allocations);
      unavailableRoundTrips.push(Object.freeze({
        roundTripId: roundTrip.roundTripId,
        accountId: roundTrip.accountId,
        instrumentId: roundTrip.instrumentId,
        displayedSymbol: roundTrip.displayedSymbol,
        tradeCurrency: roundTrip.tradeCurrency,
        tradingTimezone: account.tradingTimezone,
        direction: roundTrip.direction,
        openedAtUtc: roundTrip.openedAtUtc,
        closedAtUtc: roundTrip.closedAtUtc,
        provenanceGroup: source.group,
        projectionState: roundTrip.projectionState,
        reasonCode: "instrument_value_convention_missing" as const,
      }));
      continue;
    }
    realizedRows.push(normalizeReadyClosed(
      roundTrip,
      account.tradingTimezone,
      chargeByAllocation,
    ));
  }
  const frozenRows = Object.freeze(realizedRows);
  const frozenOpen = Object.freeze(legitimateOpenRoundTrips);
  const frozenDecisions = Object.freeze(needsDecisionRoundTrips);
  const frozenUnavailable = Object.freeze(unavailableRoundTrips);
  return Object.freeze({
    normalizationVersion: JOURNAL_ANALYTICS_NORMALIZATION_VERSION,
    factSetRevisionSha256: factSet.sourceRevisionSha256,
    normalizationDigestSha256: normalizationDigest({
      factSetRevisionSha256: factSet.sourceRevisionSha256,
      realizedRows: frozenRows,
      legitimateOpenRoundTrips: frozenOpen,
      needsDecisionRoundTrips: frozenDecisions,
      unavailableRoundTrips: frozenUnavailable,
    }),
    accounts: factSet.accounts,
    realizedRows: frozenRows,
    legitimateOpenRoundTrips: frozenOpen,
    needsDecisionRoundTrips: frozenDecisions,
    unavailableRoundTrips: frozenUnavailable,
  });
}
