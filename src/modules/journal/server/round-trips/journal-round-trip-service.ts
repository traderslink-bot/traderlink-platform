import { createHash } from "node:crypto";

import type { AccountScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import {
  createCanonicalUtcTimestamp,
  createCanonicalUuidV4,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";
import type {
  JournalChainRebuildResult,
  JournalRoundTripAllocation,
  JournalRoundTripProjection,
} from "../../contracts/journal-round-trip-contracts";
import { normalizeIbkrExecutionTime } from "../imports/journal-value-normalization";
import {
  absoluteDecimal,
  addDecimal,
  compareDecimal,
  negateDecimal,
  subtractDecimal,
} from "./journal-decimal-math";
import {
  type JournalChainDescriptor,
  type JournalExecutionChainRow,
  type JournalPositionCheckpointRow,
  JournalRoundTripRepository,
} from "./journal-round-trip-repository";

const ALGORITHM_VERSION = "zero_to_zero_v3" as const;
const CHAIN_DECISION_REASON_PRIORITY = Object.freeze([
  "position_fact_mismatch",
  "conflicting_position_facts",
  "execution_order_ambiguous",
  "position_evidence_unavailable",
  "opening_inventory_required",
  "opening_execution_outside_coverage",
  "closing_position_unconfirmed",
  "source_coverage_incomplete",
  "round_trip_identity_ambiguous",
] as const);

export type JournalRoundTripDecisionFinding = Readonly<{
  chainKeySha256: string;
  issueCode: typeof CHAIN_DECISION_REASON_PRIORITY[number];
}>;

type JournalRebuildTrigger = Readonly<{
  kind: "import_event" | "decision_event" | "maintenance";
  triggerId?: string;
  maintenanceReasonCode?: string;
  now?: Date;
}>;

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function utcForCheckpoint(fact: JournalPositionCheckpointRow): string {
  if (fact.effectiveAtUtc) return fact.effectiveAtUtc;
  const clock = fact.timePrecision === "day_start" || fact.factKind === "opening_balance"
    ? "00:00:00"
    : "23:59:59";
  return normalizeIbkrExecutionTime(
    `${fact.effectiveLocalDate}, ${clock}`,
    fact.sourceTimezone,
  );
}

function localDateAt(utc: string, timezone: string): string {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date(utc)).filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function nextDate(value: string): string {
  const date = new Date(`${value}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

type CoverageRange = Readonly<{ start: string; end: string }>;

function completeRanges(
  rows: readonly Readonly<{
    coverageKind: string;
    localStartDate: string;
    localEndDate: string;
    sourceTimezone: string;
  }>[],
  tradingTimezone: string,
): readonly CoverageRange[] {
  const sorted = rows.filter((row) =>
    row.coverageKind === "complete" &&
    row.sourceTimezone === tradingTimezone)
    .map((row) => ({ start: row.localStartDate, end: row.localEndDate }))
    .sort((left, right) => left.start.localeCompare(right.start));
  const merged: Array<{ start: string; end: string }> = [];
  for (const range of sorted) {
    const prior = merged.at(-1);
    if (!prior || range.start > nextDate(prior.end)) merged.push({ ...range });
    else if (range.end > prior.end) prior.end = range.end;
  }
  return Object.freeze(merged.map((range) => Object.freeze({ ...range })));
}

function rangeCovered(ranges: readonly CoverageRange[], start: string, end: string): boolean {
  return ranges.some((range) => range.start <= start && range.end >= end);
}

type ActiveProjection = {
  direction: "long" | "short";
  openedAtUtc: string;
  allocations: JournalRoundTripAllocation[];
  reasonCode: string | null;
  identityFallbackKey: string;
  confirmedPositionOnly: boolean;
  manualBoundaryConfirmed: boolean;
};

function allocation(
  execution: JournalExecutionChainRow,
  role: JournalRoundTripAllocation["role"],
  quantityDecimal: string,
): JournalRoundTripAllocation {
  return Object.freeze({
    executionId: execution.executionId,
    executionVersionId: execution.executionVersionId,
    role,
    quantityDecimal,
  });
}

function projectionIdentity(active: ActiveProjection): string {
  if (active.allocations.length === 0) {
    return sha256(JSON.stringify([
      "round-trip-position-only-v1",
      active.identityFallbackKey,
      active.direction,
      active.openedAtUtc,
    ]));
  }
  return sha256(JSON.stringify([
    "round-trip-execution-set-v1",
    ...active.allocations.map((entry) => [entry.executionId, entry.role, entry.quantityDecimal]),
  ]));
}

function makeProjection(input: Readonly<{
  active: ActiveProjection;
  closedAtUtc: string | null;
  finalPositionDecimal: string;
  openState: "closed" | "open";
  reasonCode: string | null;
}>): JournalRoundTripProjection {
  const reasonCode = input.active.reasonCode ?? input.reasonCode;
  const state = reasonCode
    ? "needs_decision" as const
    : input.openState === "closed"
      ? "ready_closed" as const
      : "legitimate_open" as const;
  const identityAliasSha256 = projectionIdentity(input.active);
  const content = {
    algorithmVersion: ALGORITHM_VERSION,
    direction: input.active.direction,
    openedAtUtc: input.active.openedAtUtc,
    closedAtUtc: input.closedAtUtc,
    finalPositionDecimal: input.finalPositionDecimal,
    state,
    coverageReasonCode: reasonCode,
    allocations: input.active.allocations,
  };
  return Object.freeze({
    direction: input.active.direction,
    openedAtUtc: input.active.openedAtUtc,
    closedAtUtc: input.closedAtUtc,
    finalPositionDecimal: input.finalPositionDecimal,
    state,
    coverageReasonCode: reasonCode,
    allocations: Object.freeze([...input.active.allocations]),
    identityAliasSha256,
    projectionFingerprintSha256: sha256(JSON.stringify(content)),
  });
}

function withReason(
  projection: JournalRoundTripProjection,
  reasonCode: string,
): JournalRoundTripProjection {
  const revised = makeProjection({
    active: {
      direction: projection.direction,
      openedAtUtc: projection.openedAtUtc,
      allocations: [...projection.allocations],
      reasonCode,
      identityFallbackKey: projection.identityAliasSha256,
      confirmedPositionOnly: false,
      manualBoundaryConfirmed: false,
    },
    closedAtUtc: projection.closedAtUtc,
    finalPositionDecimal: projection.finalPositionDecimal,
    openState: projection.closedAtUtc ? "closed" : "open",
    reasonCode,
  });
  return Object.freeze({
    ...revised,
    identityAliasSha256: projection.identityAliasSha256,
  });
}

type TimelineEvent =
  | Readonly<{ kind: "execution"; atUtc: string; rank: 1; execution: JournalExecutionChainRow }>
  | Readonly<{ kind: "checkpoint"; atUtc: string; rank: 0 | 2; facts: readonly JournalPositionCheckpointRow[] }>;

function hasAuthoritativeSameTimeOrder(execution: JournalExecutionChainRow): boolean {
  return /\|(broker|provider|trader)\|/u.test(execution.sourceOrderKey);
}

function allocationSignature(
  openingPosition: string,
  executions: readonly JournalExecutionChainRow[],
): string {
  let position = openingPosition;
  const allocations = new Map<string, readonly (readonly string[])[]>();
  for (const execution of executions) {
    const signedQuantity = execution.side === "buy"
      ? execution.quantityDecimal
      : negateDecimal(execution.quantityDecimal);
    const priorPosition = position;
    const nextPosition = addDecimal(position, signedQuantity);
    if (priorPosition === "0") {
      allocations.set(execution.executionId, Object.freeze([
        Object.freeze(["opening", execution.quantityDecimal]),
      ]));
    } else if (
      compareDecimal(priorPosition, "0") === compareDecimal(signedQuantity, "0")
    ) {
      allocations.set(execution.executionId, Object.freeze([
        Object.freeze(["adding", execution.quantityDecimal]),
      ]));
    } else {
      const comparison = compareDecimal(
        execution.quantityDecimal,
        absoluteDecimal(priorPosition),
      );
      if (comparison < 0) {
        allocations.set(execution.executionId, Object.freeze([
          Object.freeze(["reducing", execution.quantityDecimal]),
        ]));
      } else if (comparison === 0) {
        allocations.set(execution.executionId, Object.freeze([
          Object.freeze(["closing", execution.quantityDecimal]),
        ]));
      } else {
        const closingQuantity = absoluteDecimal(priorPosition);
        allocations.set(execution.executionId, Object.freeze([
          Object.freeze(["flip_closing", closingQuantity]),
          Object.freeze([
            "flip_opening",
            subtractDecimal(execution.quantityDecimal, closingQuantity),
          ]),
        ]));
      }
    }
    position = nextPosition;
  }
  return JSON.stringify([...allocations.entries()].sort(([left], [right]) =>
    left.localeCompare(right)));
}

function sameTimeOrderChangesAllocation(
  openingPosition: string,
  executions: readonly JournalExecutionChainRow[],
): boolean {
  const included = executions.filter((execution) =>
    execution.currentState !== "excluded_by_trader");
  if (
    included.length < 2 ||
    new Set(included.map((execution) => execution.side)).size < 2 ||
    included.every(hasAuthoritativeSameTimeOrder)
  ) return false;
  const stable = (side: "buy" | "sell") => included
    .filter((execution) => execution.side === side)
    .sort((left, right) => left.sourceOrderKey.localeCompare(right.sourceOrderKey) ||
      left.executionVersionId.localeCompare(right.executionVersionId));
  return allocationSignature(openingPosition, [...stable("buy"), ...stable("sell")]) !==
    allocationSignature(openingPosition, [...stable("sell"), ...stable("buy")]);
}

function checkpointEvents(facts: readonly JournalPositionCheckpointRow[]): readonly TimelineEvent[] {
  const groups = new Map<string, JournalPositionCheckpointRow[]>();
  for (const fact of facts) {
    const atUtc = utcForCheckpoint(fact);
    const rank = fact.timePrecision === "day_start" || fact.factKind === "opening_balance" ? 0 : 2;
    const key = `${atUtc}\u001f${rank}`;
    const group = groups.get(key) ?? [];
    group.push(fact);
    groups.set(key, group);
  }
  return Object.freeze([...groups.entries()].map(([key, grouped]) => {
    const [atUtc, rank] = key.split("\u001f");
    return Object.freeze({ kind: "checkpoint" as const, atUtc, rank: Number(rank) as 0 | 2, facts: Object.freeze(grouped) });
  }));
}

function buildLogicalProjections(input: Readonly<{
  executions: readonly JournalExecutionChainRow[];
  positionFacts: readonly JournalPositionCheckpointRow[];
  completeCoverage: readonly CoverageRange[];
  sourceChainLimitations: readonly Readonly<{
    issueCode: string;
    decisionState: "pending" | "accepted_limitation";
    effectiveAtUtc: string | null;
  }>[];
  tradingTimezone: string;
  chainIdentity: string;
}>): Readonly<{
  projections: readonly JournalRoundTripProjection[];
  excludedCount: number;
  chainReasonCodes: readonly string[];
}> {
  const timeline: TimelineEvent[] = [
    ...input.executions.map((execution) => Object.freeze({
      kind: "execution" as const,
      atUtc: execution.executedAtUtc,
      rank: 1 as const,
      execution,
    })),
    ...checkpointEvents(input.positionFacts),
  ];
  timeline.sort((left, right) =>
    left.atUtc.localeCompare(right.atUtc) || left.rank - right.rank ||
    (left.kind === "execution" && right.kind === "execution"
      ? left.execution.sourceOrderKey.localeCompare(right.execution.sourceOrderKey) ||
        left.execution.executionVersionId.localeCompare(right.execution.executionVersionId)
      : 0));

  const projections: JournalRoundTripProjection[] = [];
  let active: ActiveProjection | null = null;
  let position = "0";
  let positionKnown = false;
  let carriedPositionReason: string | null = null;
  let excludedCount = 0;
  let latestSupportedOpenQuantity: string | null = null;
  const chainReasonCodes = new Set<string>();
  let evaluatedExecutionTimestamp: string | null = null;
  let currentTimestampOrderIsAmbiguous = false;

  const closeActive = (atUtc: string, finalPosition: string, reasonCode: string | null) => {
    if (!active) return;
    const startDate = localDateAt(active.openedAtUtc, input.tradingTimezone);
    const endDate = localDateAt(atUtc, input.tradingTimezone);
    const coverageReason = active.manualBoundaryConfirmed || rangeCovered(input.completeCoverage, startDate, endDate)
      ? null
      : "source_coverage_incomplete";
    projections.push(makeProjection({
      active,
      closedAtUtc: atUtc,
      finalPositionDecimal: finalPosition,
      openState: "closed",
      reasonCode: reasonCode ?? coverageReason,
    }));
    active = null;
  };

  for (const event of timeline) {
    if (event.kind === "checkpoint") {
      const quantities = [...new Set(event.facts.map((fact) => fact.quantityDecimal))];
      if (quantities.length !== 1) {
        chainReasonCodes.add("conflicting_position_facts");
        if (active && !active.reasonCode) active.reasonCode = "conflicting_position_facts";
        positionKnown = false;
        carriedPositionReason = "conflicting_position_facts";
        continue;
      }
      const assertedPosition = quantities[0];
      if (!positionKnown) {
        if (active) {
          closeActive(
            event.atUtc,
            position,
            carriedPositionReason ?? active.reasonCode ?? "position_evidence_unavailable",
          );
        }
        position = assertedPosition;
        positionKnown = true;
        carriedPositionReason = assertedPosition === "0" ? null : "opening_execution_outside_coverage";
      } else if (compareDecimal(position, assertedPosition) !== 0) {
        chainReasonCodes.add("position_fact_mismatch");
        closeActive(event.atUtc, position, "position_fact_mismatch");
        position = assertedPosition;
        positionKnown = true;
        carriedPositionReason = assertedPosition === "0" ? null : "opening_execution_outside_coverage";
      }
      if (
        position !== "0" &&
        event.facts.some((fact) => fact.factKind === "open_position" || fact.factKind === "closing_balance")
      ) latestSupportedOpenQuantity = position;
      else if (position === "0") latestSupportedOpenQuantity = null;
      if (!active && position !== "0") {
        const reasonCode = "opening_execution_outside_coverage";
        const confirmedPositionOnly = event.facts.some((fact) =>
          fact.factSource === "trader_correction" &&
          fact.factVersion === "trader_confirmed_open_v1");
        active = {
          direction: compareDecimal(position, "0") > 0 ? "long" : "short",
          openedAtUtc: event.atUtc,
          allocations: [],
          reasonCode,
          identityFallbackKey: `${input.chainIdentity}\u001f${event.atUtc}`,
          confirmedPositionOnly,
          manualBoundaryConfirmed: false,
        };
        if (!confirmedPositionOnly) chainReasonCodes.add(reasonCode);
      }
      continue;
    }

    const execution = event.execution;
    if (execution.executedAtUtc !== evaluatedExecutionTimestamp) {
      const sameTimeExecutions = input.executions.filter((candidate) =>
        candidate.executedAtUtc === execution.executedAtUtc);
      currentTimestampOrderIsAmbiguous = positionKnown &&
        sameTimeOrderChangesAllocation(position, sameTimeExecutions);
      evaluatedExecutionTimestamp = execution.executedAtUtc;
      if (currentTimestampOrderIsAmbiguous) {
        chainReasonCodes.add("execution_order_ambiguous");
      }
    }
    latestSupportedOpenQuantity = null;
    if (execution.currentState === "excluded_by_trader") {
      excludedCount += 1;
      continue;
    }
    const signedQuantity = execution.side === "buy"
      ? execution.quantityDecimal
      : negateDecimal(execution.quantityDecimal);
    const priorPosition = position;
    const nextPosition = addDecimal(position, signedQuantity);
    const executionReason = currentTimestampOrderIsAmbiguous
      ? "execution_order_ambiguous"
      : execution.factCompleteness === "price_missing"
      ? "execution_price_missing"
      : execution.factCompleteness === "order_ambiguous"
        ? "execution_order_ambiguous"
        : execution.currentState === "needs_decision"
          ? "execution_needs_decision"
          : null;

    if (priorPosition === "0") {
      active = {
        direction: compareDecimal(signedQuantity, "0") > 0 ? "long" : "short",
        openedAtUtc: execution.executedAtUtc,
        allocations: [allocation(execution, "opening", execution.quantityDecimal)],
        reasonCode: positionKnown || execution.manualBoundaryConfirmed
          ? executionReason
          : (executionReason ?? "opening_inventory_required"),
        identityFallbackKey: `${input.chainIdentity}\u001f${execution.executionId}`,
        confirmedPositionOnly: false,
        manualBoundaryConfirmed: execution.manualBoundaryConfirmed,
      };
      position = nextPosition;
      continue;
    }

    if (!active) {
      active = {
        direction: compareDecimal(priorPosition, "0") > 0 ? "long" : "short",
        openedAtUtc: execution.executedAtUtc,
        allocations: [],
        reasonCode: carriedPositionReason ??
          (positionKnown || execution.manualBoundaryConfirmed ? null : "opening_inventory_required"),
        identityFallbackKey: `${input.chainIdentity}\u001f${execution.executionId}`,
        confirmedPositionOnly: false,
        manualBoundaryConfirmed: execution.manualBoundaryConfirmed,
      };
    }
    if (execution.manualBoundaryConfirmed) active.manualBoundaryConfirmed = true;
    if (!active.reasonCode && executionReason) active.reasonCode = executionReason;
    const sameDirection = compareDecimal(priorPosition, "0") === compareDecimal(signedQuantity, "0");
    if (sameDirection) {
      active.allocations.push(allocation(execution, "adding", execution.quantityDecimal));
      position = nextPosition;
      continue;
    }

    const comparison = compareDecimal(execution.quantityDecimal, absoluteDecimal(priorPosition));
    if (comparison < 0) {
      active.allocations.push(allocation(execution, "reducing", execution.quantityDecimal));
      position = nextPosition;
      continue;
    }
    if (comparison === 0) {
      active.allocations.push(allocation(execution, "closing", execution.quantityDecimal));
      position = "0";
      closeActive(execution.executedAtUtc, "0", null);
      carriedPositionReason = null;
      continue;
    }

    const closingQuantity = absoluteDecimal(priorPosition);
    const openingQuantity = subtractDecimal(execution.quantityDecimal, closingQuantity);
    active.allocations.push(allocation(execution, "flip_closing", closingQuantity));
    closeActive(execution.executedAtUtc, "0", null);
    active = {
      direction: execution.side === "buy" ? "long" : "short",
      openedAtUtc: execution.executedAtUtc,
      allocations: [allocation(execution, "flip_opening", openingQuantity)],
      reasonCode: positionKnown || execution.manualBoundaryConfirmed
        ? executionReason
        : (executionReason ?? "opening_inventory_required"),
      identityFallbackKey: `${input.chainIdentity}\u001f${execution.executionId}\u001fflip`,
      confirmedPositionOnly: false,
      manualBoundaryConfirmed: execution.manualBoundaryConfirmed,
    };
    position = nextPosition;
  }

  if (active) {
    const lastAt = input.executions.at(-1)?.executedAtUtc ?? active.openedAtUtc;
    const startDate = localDateAt(active.openedAtUtc, input.tradingTimezone);
    const endDate = localDateAt(lastAt, input.tradingTimezone);
    const coverageReason = active.manualBoundaryConfirmed || rangeCovered(input.completeCoverage, startDate, endDate)
      ? null
      : "source_coverage_incomplete";
    const supportedOpen = latestSupportedOpenQuantity !== null &&
      compareDecimal(latestSupportedOpenQuantity, position) === 0;
    const confirmedPositionOnly = active.confirmedPositionOnly &&
      active.allocations.length === 0 && supportedOpen;
    projections.push(makeProjection({
      active: confirmedPositionOnly
        ? { ...active, reasonCode: null }
        : active,
      closedAtUtc: null,
      finalPositionDecimal: position,
      openState: "open",
      reasonCode: confirmedPositionOnly || active.manualBoundaryConfirmed
        ? null
        : active.reasonCode ?? coverageReason ??
        (supportedOpen ? null : "closing_position_unconfirmed"),
    }));
  }

  const checkpointBoundaries = checkpointEvents(input.positionFacts)
    .filter((event): event is Extract<TimelineEvent, { kind: "checkpoint" }> =>
      event.kind === "checkpoint" &&
      new Set(event.facts.map((fact) => fact.quantityDecimal)).size === 1)
    .map((event) => Object.freeze({ atUtc: event.atUtc, rank: event.rank }))
    .sort((left, right) => left.atUtc.localeCompare(right.atUtc) || left.rank - right.rank);
  const limitationAffectsProjection = (
    limitation: typeof input.sourceChainLimitations[number],
    projection: JournalRoundTripProjection,
  ): boolean => {
    if (!limitation.effectiveAtUtc) return true;
    const issueAtUtc = limitation.effectiveAtUtc;
    const containmentEnd = checkpointBoundaries.find((boundary) =>
      boundary.atUtc > issueAtUtc ||
      (boundary.atUtc === issueAtUtc && boundary.rank === 2))
      ?.atUtc ?? null;
    const projectionEnd = projection.closedAtUtc ?? "9999-12-31T23:59:59.999Z";
    return projectionEnd >= issueAtUtc &&
      (containmentEnd === null || projection.openedAtUtc < containmentEnd);
  };
  const scopedProjections = projections.map((projection) => {
    const applicable = input.sourceChainLimitations.filter((limitation) =>
      limitationAffectsProjection(limitation, projection));
    const sourceLimitationReason = applicable.some((entry) =>
      entry.decisionState === "pending")
      ? "source_chain_issue_pending"
      : applicable.length > 0
        ? "source_chain_limitation_accepted"
        : null;
    return sourceLimitationReason
      ? withReason(projection, sourceLimitationReason)
      : projection;
  });
  return Object.freeze({
    projections: Object.freeze(scopedProjections),
    excludedCount,
    chainReasonCodes: Object.freeze([...chainReasonCodes]),
  });
}

function assertAllocationConservation(
  executions: readonly JournalExecutionChainRow[],
  projections: readonly JournalRoundTripProjection[],
): void {
  const allocated = new Map<string, string>();
  for (const projection of projections) {
    for (const entry of projection.allocations) {
      allocated.set(
        entry.executionId,
        addDecimal(allocated.get(entry.executionId) ?? "0", entry.quantityDecimal),
      );
    }
  }
  for (const execution of executions) {
    const expected = execution.currentState === "excluded_by_trader"
      ? "0"
      : execution.quantityDecimal;
    if (compareDecimal(allocated.get(execution.executionId) ?? "0", expected) !== 0) {
      platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", {
        check: "round_trip_allocation_conservation",
      });
    }
  }
}

function orderedInputDigest(input: Readonly<{
  executions: readonly JournalExecutionChainRow[];
  facts: readonly JournalPositionCheckpointRow[];
  coverage: readonly unknown[];
  sourceChainLimitations: readonly unknown[];
}>): string {
  return sha256(JSON.stringify({
    algorithmVersion: ALGORITHM_VERSION,
    executions: input.executions.map((entry) => ({
      executionId: entry.executionId,
      executionVersionId: entry.executionVersionId,
      state: entry.currentState,
      manualBoundaryConfirmed: entry.manualBoundaryConfirmed,
      facts: {
        instrumentId: entry.instrumentId,
        currency: entry.tradeCurrency,
        executedAtUtc: entry.executedAtUtc,
        sourceOrderKey: entry.sourceOrderKey,
        side: entry.side,
        quantityDecimal: entry.quantityDecimal,
        priceDecimal: entry.priceDecimal,
        feesDecimal: entry.feesDecimal,
      },
    })),
    positionFacts: input.facts,
    coverage: input.coverage,
    sourceChainLimitations: input.sourceChainLimitations,
  }));
}

export class JournalRoundTripService {
  constructor(private readonly repository: JournalRoundTripRepository) {}

  hasChainTarget(scope: AccountScope, chainKeySha256: string): boolean {
    return this.repository.hasChainKey(
      scope.workspaceId,
      scope.accountId,
      chainKeySha256,
    );
  }

  accountTradingTimezone(scope: AccountScope): string {
    const timezone = this.repository.accountTimezone(
      scope.workspaceId,
      scope.accountId,
    );
    if (!timezone) platformFailure("TRADERLINK_ACCOUNT_NOT_FOUND");
    return timezone;
  }

  listDecisionFindings(
    rebuilds: readonly JournalChainRebuildResult[],
  ): readonly JournalRoundTripDecisionFinding[] {
    const priority = new Map<string, number>(
      CHAIN_DECISION_REASON_PRIORITY.map((reason, index) => [reason, index]),
    );
    const selected = new Map<string, JournalRoundTripDecisionFinding>();
    const rawFindings = rebuilds.flatMap((rebuild) =>
      rebuild.decisionReasonCodes.map((reasonCode) => ({
        chainKeySha256: rebuild.chainKeySha256,
        reasonCode,
      })));
    for (const finding of rawFindings) {
      const candidatePriority = priority.get(finding.reasonCode);
      if (candidatePriority === undefined) continue;
      const prior = selected.get(finding.chainKeySha256);
      if (
        !prior || candidatePriority < priority.get(prior.issueCode)!
      ) {
        selected.set(finding.chainKeySha256, Object.freeze({
          chainKeySha256: finding.chainKeySha256,
          issueCode: finding.reasonCode as JournalRoundTripDecisionFinding["issueCode"],
        }));
      }
    }
    return Object.freeze([...selected.values()].sort((left, right) =>
      left.chainKeySha256.localeCompare(right.chainKeySha256)));
  }

  rebuildAccount(
    scope: AccountScope,
    trigger: JournalRebuildTrigger,
  ): readonly JournalChainRebuildResult[] {
    return this.repository.immediate(() => {
      this.repository.supersedeRoundTripsWhoseExecutionsMovedChains(
        scope.workspaceId,
        scope.accountId,
        createCanonicalUtcTimestamp(trigger.now),
      );
      const rebuilds = Object.freeze(
        this.repository.listChains(scope.workspaceId, scope.accountId)
          .map((chain) => this.rebuildChainUnderLock(scope, chain, trigger)),
      );
      this.repository.refreshWorkspaceTradeLibraryProjection(
        scope,
        createCanonicalUtcTimestamp(trigger.now),
      );
      return rebuilds;
    });
  }

  rebuildAffectedExecutionChains(
    scope: AccountScope,
    executionIds: readonly string[],
    trigger: JournalRebuildTrigger,
  ): readonly JournalChainRebuildResult[] {
    if (executionIds.length === 0) return Object.freeze([]);
    return this.repository.immediate(() => {
      const rebuilds = Object.freeze(this.repository.listChainsForExecutionIds(
        scope.workspaceId,
        scope.accountId,
        executionIds,
      ).map((chain) => this.rebuildChainUnderLock(scope, chain, trigger)));
      this.repository.refreshWorkspaceTradeLibraryProjection(
        scope,
        createCanonicalUtcTimestamp(trigger.now),
      );
      return rebuilds;
    });
  }

  verifyAccountRebuildsCurrent(scope: AccountScope): Readonly<{
    verifiedChainCount: number;
  }> {
    const chains = this.repository.listChains(scope.workspaceId, scope.accountId);
    for (const chain of chains) {
      this.rebuildChainUnderLock(
        scope,
        chain,
        {
          kind: "maintenance",
          maintenanceReasonCode: "read_only_integrity_verification",
        },
        true,
      );
    }
    return Object.freeze({ verifiedChainCount: chains.length });
  }

  rebuildChain(
    scope: AccountScope,
    chain: JournalChainDescriptor,
    trigger: JournalRebuildTrigger,
  ): JournalChainRebuildResult {
    return this.repository.immediate(() => {
      const rebuild = this.rebuildChainUnderLock(scope, chain, trigger);
      this.repository.refreshWorkspaceTradeLibraryProjection(
        scope,
        createCanonicalUtcTimestamp(trigger.now),
      );
      return rebuild;
    });
  }

  private rebuildChainUnderLock(
    scope: AccountScope,
    chain: JournalChainDescriptor,
    trigger: JournalRebuildTrigger,
    verificationOnly = false,
  ): JournalChainRebuildResult {
    const tradingTimezone = this.repository.accountTimezone(scope.workspaceId, scope.accountId);
    if (!tradingTimezone) platformFailure("TRADERLINK_ACCOUNT_NOT_FOUND");
    if (
      (trigger.kind === "maintenance") !== Boolean(trigger.maintenanceReasonCode) ||
      (trigger.kind !== "maintenance") !== Boolean(trigger.triggerId)
    ) platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "rebuildTrigger" });
    const executions = this.repository.listExecutions(
      scope.workspaceId, scope.accountId, chain.instrumentId, chain.tradeCurrency,
    );
    const facts = this.repository.listCurrentPositionFacts(
      scope.workspaceId, scope.accountId, chain.instrumentId, chain.tradeCurrency,
    );
    const coverage = this.repository.listCoverage(scope.workspaceId, scope.accountId, chain.assetClass);
    const sourceChainLimitations = this.repository.listSourceChainLimitations(
      scope.workspaceId,
      scope.accountId,
      chain.instrumentId,
      chain.tradeCurrency,
    );
    const ranges = completeRanges(coverage, tradingTimezone);
    const built = buildLogicalProjections({
      executions,
      positionFacts: facts,
      completeCoverage: ranges,
      sourceChainLimitations,
      tradingTimezone,
      chainIdentity: `${chain.instrumentId}\u001f${chain.tradeCurrency}`,
    });
    assertAllocationConservation(executions, built.projections);
    const decisionReasonCodes = Object.freeze([
      ...new Set([
        ...built.chainReasonCodes,
        ...built.projections
          .map((projection) => projection.coverageReasonCode)
          .filter((reason): reason is string => Boolean(reason)),
      ].filter((reason) => CHAIN_DECISION_REASON_PRIORITY.includes(
        reason as typeof CHAIN_DECISION_REASON_PRIORITY[number],
      ))),
    ]);
    const orderedInputSha256 = orderedInputDigest({
      executions,
      facts,
      coverage,
      sourceChainLimitations,
    });
    const chainKeySha256 = sha256(JSON.stringify([
      "journal-chain-v1", scope.workspaceId, scope.accountId,
      chain.instrumentId, chain.tradeCurrency,
    ]));

    const usedRoundTripIds = new Set<string>();
    const identities = built.projections.map((projection) => {
      const exact = this.repository.findRoundTripByAlias(
        scope.workspaceId, scope.accountId, projection.identityAliasSha256,
      );
      if (exact && !usedRoundTripIds.has(exact.roundTripId)) {
        usedRoundTripIds.add(exact.roundTripId);
        const retainedProjection = exact.coverageReasonCode === "round_trip_identity_ambiguous"
          ? withReason(projection, "round_trip_identity_ambiguous")
          : projection;
        return {
          projection: retainedProjection,
          roundTripId: exact.roundTripId,
          versionNumber: exact.versionNumber + 1,
          attachAlias: true,
        };
      }
      const candidates = this.repository.findOverlapCandidates(
        scope.workspaceId,
        scope.accountId,
        [...new Set(projection.allocations.map((entry) => entry.executionId))],
      ).filter((candidate) => !usedRoundTripIds.has(candidate));
      if (candidates.length === 1) {
        const roundTripId = candidates[0];
        const current = this.repository.roundTripCurrent(roundTripId, scope.workspaceId, scope.accountId);
        if (!current) platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", { check: "round_trip_identity" });
        usedRoundTripIds.add(roundTripId);
        return {
          projection,
          roundTripId,
          versionNumber: current.versionNumber + 1,
          attachAlias: true,
        };
      }
      const finalProjection = candidates.length > 1 || Boolean(exact)
        ? withReason(projection, "round_trip_identity_ambiguous")
        : projection;
      const roundTripId = createCanonicalUuidV4();
      usedRoundTripIds.add(roundTripId);
      return {
        projection: finalProjection,
        roundTripId,
        versionNumber: 1,
        attachAlias: !exact,
      };
    });
    const outputSha256 = sha256(JSON.stringify(
      identities.map((entry) => entry.projection.projectionFingerprintSha256).sort(),
    ));
    const coverageState = coverage.length === 0
      ? "unavailable" as const
      : executions.length > 0 && rangeCovered(
          ranges,
          localDateAt(executions[0].executedAtUtc, tradingTimezone),
          localDateAt(executions.at(-1)!.executedAtUtc, tradingTimezone),
        )
        ? "complete" as const
        : "partial" as const;
    const readyClosedCount = identities.filter((entry) => entry.projection.state === "ready_closed").length;
    const legitimateOpenCount = identities.filter((entry) => entry.projection.state === "legitimate_open").length;
    const needsDecisionCount = identities.filter((entry) => entry.projection.state === "needs_decision").length;
    const latest = this.repository.latestRebuild(
      scope.workspaceId, scope.accountId, chain.instrumentId, chain.tradeCurrency,
    );
    if (
      latest?.algorithmVersion === ALGORITHM_VERSION &&
      latest.orderedInputSha256 === orderedInputSha256 &&
      latest.outputSha256 === outputSha256 &&
      latest.coverageState === coverageState &&
      latest.readyClosedCount === readyClosedCount &&
      latest.legitimateOpenCount === legitimateOpenCount &&
      latest.needsDecisionCount === needsDecisionCount &&
      latest.excludedCount === built.excludedCount
    ) {
      return Object.freeze({
        status: "already_current", rebuildId: latest.rebuildId, chainKeySha256,
        orderedInputSha256, outputSha256, coverageState: latest.coverageState,
        readyClosedCount: latest.readyClosedCount,
        legitimateOpenCount: latest.legitimateOpenCount,
        needsDecisionCount: latest.needsDecisionCount,
        excludedCount: latest.excludedCount,
        roundTripIds: Object.freeze([...usedRoundTripIds]),
        decisionReasonCodes,
      });
    }

    if (verificationOnly) {
      platformFailure("TRADERLINK_JOURNAL_INTEGRITY_VERIFICATION_FAILED", {
        check: latest ? "stale_chain_rebuild" : "missing_chain_rebuild",
      });
    }

    const rebuildId = createCanonicalUuidV4();
    const timestamp = createCanonicalUtcTimestamp(trigger.now);
    this.repository.immediate(() => {
      this.repository.insertRebuild({
        rebuildId, workspaceId: scope.workspaceId, accountId: scope.accountId,
        instrumentId: chain.instrumentId, tradeCurrency: chain.tradeCurrency,
        chainKeySha256, triggerKind: trigger.kind,
        triggerId: trigger.triggerId ?? null,
        maintenanceReasonCode: trigger.maintenanceReasonCode ?? null,
        previousRebuildId: latest?.rebuildId ?? null,
        algorithmVersion: ALGORITHM_VERSION, orderedInputSha256, outputSha256,
        coverageState, readyClosedCount, legitimateOpenCount, needsDecisionCount,
        excludedCount: built.excludedCount,
        firstExecutionAtUtc: executions[0]?.executedAtUtc ?? null,
        lastExecutionAtUtc: executions.at(-1)?.executedAtUtc ?? null,
        timestamp,
      });
      for (const identity of identities) {
        const roundTripVersionId = createCanonicalUuidV4();
        this.repository.createRoundTrip({
          roundTripId: identity.roundTripId, roundTripVersionId,
          workspaceId: scope.workspaceId, accountId: scope.accountId,
          rebuildId, instrumentId: chain.instrumentId,
          tradeCurrency: chain.tradeCurrency, chainKeySha256,
          direction: identity.projection.direction,
          openedAtUtc: identity.projection.openedAtUtc,
          closedAtUtc: identity.projection.closedAtUtc,
          finalPositionDecimal: identity.projection.finalPositionDecimal,
          projectionState: identity.projection.state,
          coverageReasonCode: identity.projection.coverageReasonCode,
          projectionFingerprintSha256: identity.projection.projectionFingerprintSha256,
          versionNumber: identity.versionNumber,
          timestamp,
        });
        identity.projection.allocations.forEach((entry, index) => {
          this.repository.insertAllocation({
            allocationId: createCanonicalUuidV4(), workspaceId: scope.workspaceId,
            accountId: scope.accountId, roundTripVersionId,
            executionVersionId: entry.executionVersionId,
            allocationSequence: index + 1, allocationRole: entry.role,
            quantityDecimal: entry.quantityDecimal, timestamp,
          });
        });
        if (identity.attachAlias) {
          this.repository.insertAliasIfMissing({
            roundTripAliasId: createCanonicalUuidV4(), workspaceId: scope.workspaceId,
            accountId: scope.accountId, roundTripId: identity.roundTripId,
            aliasKeySha256: identity.projection.identityAliasSha256, timestamp,
          });
        }
      }
      this.repository.supersedeMissingRoundTrips(
        scope.workspaceId, scope.accountId, chain.instrumentId,
        chain.tradeCurrency, [...usedRoundTripIds], timestamp,
      );
      for (const execution of executions) {
        this.repository.upsertTradingDay({
          tradingDayId: createCanonicalUuidV4(), workspaceId: scope.workspaceId,
          accountId: scope.accountId,
          tradingDate: localDateAt(execution.executedAtUtc, tradingTimezone),
          tradingTimezone, timestamp,
        });
      }
      this.repository.refreshWorkspaceTradeLibraryProjection(scope, timestamp);
    });
    return Object.freeze({
      status: "rebuilt", rebuildId, chainKeySha256, orderedInputSha256,
      outputSha256, coverageState, readyClosedCount, legitimateOpenCount,
      needsDecisionCount, excludedCount: built.excludedCount,
      roundTripIds: Object.freeze([...usedRoundTripIds]),
      decisionReasonCodes,
    });
  }
}
