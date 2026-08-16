import Decimal from "decimal.js";
import type Database from "better-sqlite3";

import type { WorkspaceAccessScope } from
  "@/src/modules/platform/contracts/workspace-access-scope";
import { platformFailure } from
  "@/src/modules/platform/server/database/platform-migration-contract";

import { hasDailyTradePatternOccurrenceProjection } from
  "./daily-trade-pattern-occurrence-repository";

export type DailyTradeEvidenceMoneyBasis = "gross" | "net";
export type DailyTradePatternExecutionFilter = "all" | "entry" | "exit";
export type DailyTradePatternLocationFilter = "all" | "exact" | "before";
export type DailyTradePatternTimeframeFilter = "all" | "1m" | "5m";

export type DailyTradePatternOccurrenceRow = Readonly<{
  candlesBeforeExecution: 0 | 1 | 2;
  currency: string;
  direction: "long" | "short";
  eventKind: "entry" | "add" | "partial_exit" | "final_exit";
  executedAtUtc: string;
  executionId: string;
  occurrenceRef: string;
  pattern: string;
  patternTimeUtcSeconds: number;
  resultDecimal: string | null;
  returnPercentDecimal: string | null;
  roundTripId: string;
  symbol: string;
  timeframe: "1m" | "5m";
  trackerDate: string;
}>;

export type DailyTradePatternOccurrencePage = Readonly<{
  continuationCursor: string | null;
  rows: readonly DailyTradePatternOccurrenceRow[];
  timezone: string;
  totalRowCount: number;
}>;

export type DailyTradeAnalyzedTradeRow = Readonly<{
  closedAtUtc: string;
  direction: "long" | "short";
  executionCount: number;
  firstExecutionId: string | null;
  openedAtUtc: string;
  resultDecimal: string | null;
  returnPercentDecimal: string | null;
  roundTripId: string;
  symbol: string;
  trackerDate: string;
}>;

export type DailyTradeAnalyzedTradePage = Readonly<{
  continuationCursor: string | null;
  rows: readonly DailyTradeAnalyzedTradeRow[];
  timezone: string;
  totalRowCount: number;
}>;

type CandidateRow = Readonly<{
  account_id: string;
  candles_before_execution: 0 | 1 | 2;
  closed_at_utc: string;
  daily_trade_analysis_version_id: string;
  direction: "long" | "short";
  event_kind: "entry" | "add" | "partial_exit" | "final_exit";
  executed_at_utc: string;
  execution_id: string;
  opened_at_utc: string;
  pattern_kind: string;
  pattern_sequence: number;
  pattern_time_utc_seconds: number;
  round_trip_id: string;
  symbol: string;
  timeframe: "1m" | "5m";
  trade_currency: string;
  workspace_id: string;
}>;

type AnalyzedTradeCandidateRow = Readonly<{
  closed_at_utc: string;
  daily_trade_analysis_version_id: string;
  direction: "long" | "short";
  opened_at_utc: string;
  round_trip_id: string;
  symbol: string;
}>;

type SnapshotResultRow = Readonly<{
  daily_trade_analysis_version_id: string;
  snapshot_json: string;
}>;

type ExactResult = Readonly<{
  entryNotionalDecimal: string | null;
  executionCount: number;
  feesComplete: boolean;
  feesDecimal: string;
  firstExecutionId: string | null;
  longDirectionGrossPnlDecimal: string | null;
}>;

type OccurrenceCursor = Readonly<{
  analysisVersionId: string;
  executedAtUtc: string;
  executionId: string;
  patternSequence: number;
}>;

type TradeCursor = Readonly<{
  closedAtUtc: string;
  roundTripId: string;
}>;

const PAGE_SIZES = new Set([10, 25, 50, 100]);

function activeAccountId(scope: WorkspaceAccessScope): string {
  const accountId = scope.activeAccountId;
  if (!accountId || !scope.allowedAccountIds.includes(accountId)) {
    platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
  }
  return accountId;
}

function requirePageSize(value: number): 10 | 25 | 50 | 100 {
  if (!PAGE_SIZES.has(value)) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
      field: "pageSize",
    });
  }
  return value as 10 | 25 | 50 | 100;
}

function encodeCursor(value: OccurrenceCursor | TradeCursor): string {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

function decodedObject(value: string): Record<string, unknown> {
  try {
    const decoded = JSON.parse(
      Buffer.from(value, "base64url").toString("utf8"),
    ) as unknown;
    if (decoded === null || typeof decoded !== "object" || Array.isArray(decoded)) {
      throw new Error("invalid cursor");
    }
    return decoded as Record<string, unknown>;
  } catch {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
      field: "cursor",
    });
  }
}

function decodeOccurrenceCursor(value: string): OccurrenceCursor {
  const decoded = decodedObject(value);
  if (
    Object.keys(decoded).sort().join(",") !==
      "analysisVersionId,executedAtUtc,executionId,patternSequence" ||
    typeof decoded.analysisVersionId !== "string" ||
    typeof decoded.executedAtUtc !== "string" ||
    typeof decoded.executionId !== "string" ||
    !Number.isSafeInteger(Number(decoded.patternSequence)) ||
    Number(decoded.patternSequence) < 0
  ) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
      field: "cursor",
    });
  }
  return Object.freeze({
    analysisVersionId: decoded.analysisVersionId,
    executedAtUtc: decoded.executedAtUtc,
    executionId: decoded.executionId,
    patternSequence: Number(decoded.patternSequence),
  });
}

function decodeTradeCursor(value: string): TradeCursor {
  const decoded = decodedObject(value);
  if (
    Object.keys(decoded).sort().join(",") !== "closedAtUtc,roundTripId" ||
    typeof decoded.closedAtUtc !== "string" ||
    typeof decoded.roundTripId !== "string"
  ) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
      field: "cursor",
    });
  }
  return Object.freeze({
    closedAtUtc: decoded.closedAtUtc,
    roundTripId: decoded.roundTripId,
  });
}

function occurrenceRef(row: Pick<CandidateRow,
  "daily_trade_analysis_version_id" | "execution_id" | "pattern_sequence"
>): string {
  return Buffer.from(JSON.stringify({
    analysisVersionId: row.daily_trade_analysis_version_id,
    executionId: row.execution_id,
    patternSequence: row.pattern_sequence,
  }), "utf8").toString("base64url");
}

function decodeOccurrenceRef(value: string): Readonly<{
  analysisVersionId: string;
  executionId: string;
  patternSequence: number;
}> {
  const decoded = decodedObject(value);
  if (
    Object.keys(decoded).sort().join(",") !==
      "analysisVersionId,executionId,patternSequence" ||
    typeof decoded.analysisVersionId !== "string" ||
    typeof decoded.executionId !== "string" ||
    !Number.isSafeInteger(Number(decoded.patternSequence)) ||
    Number(decoded.patternSequence) < 0
  ) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
      field: "occurrenceRef",
    });
  }
  return Object.freeze({
    analysisVersionId: decoded.analysisVersionId,
    executionId: decoded.executionId,
    patternSequence: Number(decoded.patternSequence),
  });
}

function dateParts(value: string): Readonly<{
  day: number;
  month: number;
  year: number;
}> {
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(value)) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
      field: "dateRange",
    });
  }
  const [year, month, day] = value.split("-").map(Number);
  const candidate = new Date(Date.UTC(year, month - 1, day));
  if (
    candidate.getUTCFullYear() !== year ||
    candidate.getUTCMonth() !== month - 1 ||
    candidate.getUTCDate() !== day
  ) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
      field: "dateRange",
    });
  }
  return Object.freeze({ day, month, year });
}

function wallClockPartsAt(value: Date, timezone: string): Readonly<{
  day: number;
  hour: number;
  minute: number;
  month: number;
  second: number;
  year: number;
}> {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
    minute: "2-digit",
    month: "2-digit",
    second: "2-digit",
    timeZone: timezone,
    year: "numeric",
  }).formatToParts(value).filter((part) => part.type !== "literal")
    .map((part) => [part.type, Number(part.value)]));
  return Object.freeze({
    day: parts.day,
    hour: parts.hour,
    minute: parts.minute,
    month: parts.month,
    second: parts.second,
    year: parts.year,
  });
}

function zonedMidnightUtc(date: string, timezone: string): string {
  const expected = dateParts(date);
  const localAsUtc = Date.UTC(
    expected.year,
    expected.month - 1,
    expected.day,
    0,
    0,
    0,
    0,
  );
  let candidate = localAsUtc;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const actual = wallClockPartsAt(new Date(candidate), timezone);
    const actualAsUtc = Date.UTC(
      actual.year,
      actual.month - 1,
      actual.day,
      actual.hour,
      actual.minute,
      actual.second,
      0,
    );
    candidate += localAsUtc - actualAsUtc;
  }
  const resolved = new Date(candidate);
  const actual = wallClockPartsAt(resolved, timezone);
  if (
    actual.year !== expected.year || actual.month !== expected.month ||
    actual.day !== expected.day || actual.hour !== 0 || actual.minute !== 0 ||
    actual.second !== 0
  ) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
      field: "dateRange",
    });
  }
  return resolved.toISOString();
}

function nextDate(value: string): string {
  const parts = dateParts(value);
  const next = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + 1));
  return next.toISOString().slice(0, 10);
}

function localDate(value: string, timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: timezone,
    year: "numeric",
  }).formatToParts(new Date(value));
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${read("year")}-${read("month")}-${read("day")}`;
}

function accountTimezone(
  database: Database.Database,
  scope: WorkspaceAccessScope,
  accountId: string,
): string {
  const row = database.prepare<[string, string], { trading_timezone: string }>(`
SELECT trading_timezone
FROM journal_accounts
WHERE workspace_id = ? AND account_id = ? AND status = 'active'`)
    .get(scope.workspaceId, accountId);
  if (!row) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: row.trading_timezone }).format();
  } catch {
    platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", {
      check: "trade_analyzer_account_timezone",
    });
  }
  return row.trading_timezone;
}

function dateBounds(
  startDate: string | null,
  endDate: string | null,
  timezone: string,
): Readonly<{ endExclusiveUtc: string; startUtc: string }> | null {
  if (startDate === null && endDate === null) return null;
  if (startDate === null || endDate === null || startDate > endDate) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
      field: "dateRange",
    });
  }
  return Object.freeze({
    endExclusiveUtc: zonedMidnightUtc(nextDate(endDate), timezone),
    startUtc: zonedMidnightUtc(startDate, timezone),
  });
}

function likeValue(value: string): string {
  return `%${value.trim().replace(/[\\%_]/gu, "\\$&")}%`;
}

function exactResults(
  database: Database.Database,
  analysisVersionIds: readonly string[],
): ReadonlyMap<string, ExactResult> {
  if (analysisVersionIds.length === 0) return new Map();
  const placeholders = analysisVersionIds.map(() => "?").join(", ");
  const snapshots = database.prepare(`SELECT
  daily_trade_analysis_version_id, snapshot_json
FROM journal_round_trip_daily_trade_analysis_event_snapshots
WHERE daily_trade_analysis_version_id IN (${placeholders})
ORDER BY daily_trade_analysis_version_id,
  COALESCE(json_extract(snapshot_json, '$.event.sequence'), 0)`).all(
    ...analysisVersionIds,
  ) as SnapshotResultRow[];
  const byVersion = new Map<string, SnapshotResultRow[]>();
  for (const snapshot of snapshots) {
    const current = byVersion.get(snapshot.daily_trade_analysis_version_id) ?? [];
    current.push(snapshot);
    byVersion.set(snapshot.daily_trade_analysis_version_id, current);
  }
  const results = new Map<string, ExactResult>();
  for (const analysisVersionId of analysisVersionIds) {
    const rows = byVersion.get(analysisVersionId) ?? [];
    let gross = new Decimal(0);
    let fees = new Decimal(0);
    let entryNotional = new Decimal(0);
    let valid = rows.length > 0;
    let feesComplete = rows.length > 0;
    let firstExecutionId: string | null = null;
    for (const row of rows) {
      try {
        const snapshot = JSON.parse(row.snapshot_json) as {
          event?: {
            eventId?: unknown;
            feesDecimal?: unknown;
            kind?: unknown;
            priceDecimal?: unknown;
            quantityDecimal?: unknown;
          };
        };
        const event = snapshot.event;
        if (
          !event || typeof event.eventId !== "string" ||
          typeof event.kind !== "string" ||
          typeof event.priceDecimal !== "string" ||
          typeof event.quantityDecimal !== "string" ||
          !["entry", "add", "partial_exit", "final_exit"].includes(event.kind)
        ) {
          valid = false;
          continue;
        }
        firstExecutionId ??= event.eventId;
        const price = new Decimal(event.priceDecimal);
        const quantity = new Decimal(event.quantityDecimal);
        if (!price.isPositive() || !quantity.isPositive()) {
          valid = false;
          continue;
        }
        const increasing = event.kind === "entry" || event.kind === "add";
        const notional = price.mul(quantity);
        if (increasing) entryNotional = entryNotional.plus(notional);
        // Store an entry/exit signed delta. The query mapper reverses the sign
        // for shorts after reading this long-direction cash flow.
        gross = gross.plus(increasing ? notional.negated() : notional);
        if (typeof event.feesDecimal === "string") {
          fees = fees.plus(new Decimal(event.feesDecimal));
        } else {
          feesComplete = false;
        }
      } catch {
        valid = false;
      }
    }
    results.set(analysisVersionId, Object.freeze({
      entryNotionalDecimal: valid ? entryNotional.toString() : null,
      executionCount: rows.length,
      feesComplete: valid && feesComplete,
      feesDecimal: fees.toString(),
      firstExecutionId,
      longDirectionGrossPnlDecimal: valid ? gross.toString() : null,
    }));
  }
  return results;
}

function resultForDirection(
  result: ExactResult | undefined,
  direction: "long" | "short",
  moneyBasis: DailyTradeEvidenceMoneyBasis,
): Readonly<{ resultDecimal: string | null; returnPercentDecimal: string | null }> {
  if (!result) return Object.freeze({ resultDecimal: null, returnPercentDecimal: null });
  if (result.longDirectionGrossPnlDecimal === null) {
    return Object.freeze({ resultDecimal: null, returnPercentDecimal: null });
  }
  const gross = direction === "long"
    ? new Decimal(result.longDirectionGrossPnlDecimal)
    : new Decimal(result.longDirectionGrossPnlDecimal).negated();
  const pnl = moneyBasis === "gross"
    ? gross
    : result.feesComplete
      ? gross.plus(result.feesDecimal)
      : null;
  const returnPercent = pnl === null || result.entryNotionalDecimal === null ||
      new Decimal(result.entryNotionalDecimal).isZero()
    ? null
    : pnl.div(result.entryNotionalDecimal).mul(100).toString();
  return Object.freeze({
    resultDecimal: pnl?.toString() ?? null,
    returnPercentDecimal: returnPercent,
  });
}

function occurrenceCandidateCte(projected: boolean): string {
  const source = projected ? `
FROM journal_round_trip_daily_trade_analysis_pattern_occurrences occurrence`
    : `
FROM journal_round_trip_daily_trade_analysis_event_snapshots snapshot
JOIN json_each(snapshot.snapshot_json, '$.patterns') pattern`;
  const versionJoin = projected
    ? `JOIN journal_round_trip_daily_trade_analysis_versions version
  ON version.daily_trade_analysis_version_id =
    occurrence.daily_trade_analysis_version_id`
    : `JOIN journal_round_trip_daily_trade_analysis_versions version
  ON version.daily_trade_analysis_version_id =
    snapshot.daily_trade_analysis_version_id`;
  const selected = projected ? `
  occurrence.workspace_id,
  occurrence.account_id,
  occurrence.round_trip_id,
  occurrence.daily_trade_analysis_version_id,
  occurrence.execution_id,
  occurrence.pattern_sequence,
  occurrence.event_kind,
  occurrence.executed_at_utc,
  occurrence.pattern_kind,
  occurrence.timeframe,
  occurrence.candles_before_execution,
  occurrence.pattern_time_utc_seconds,`
    : `
  analysis.workspace_id,
  analysis.account_id,
  analysis.round_trip_id,
  snapshot.daily_trade_analysis_version_id,
  snapshot.execution_id,
  CAST(pattern.key AS INTEGER) AS pattern_sequence,
  snapshot.event_kind,
  json_extract(snapshot.snapshot_json, '$.event.executedAtUtc') AS executed_at_utc,
  json_extract(pattern.value, '$.kind') AS pattern_kind,
  json_extract(pattern.value, '$.timeframe') AS timeframe,
  json_extract(pattern.value, '$.candlesBeforeExecution') AS candles_before_execution,
  json_extract(pattern.value, '$.time') AS pattern_time_utc_seconds,`;
  const projectionScope = projected ? `
  AND occurrence.workspace_id = ? AND occurrence.account_id = ?`
    : `
  AND json_extract(pattern.value, '$.availableAtExecution') = 1
  AND json_extract(pattern.value, '$.timeframe') IN ('1m', '5m')
  AND json_extract(pattern.value, '$.candlesBeforeExecution') IN (0, 1, 2)`;
  return `WITH candidates AS (SELECT${selected}
  round_trip_version.direction,
  round_trip_version.opened_at_utc,
  round_trip_version.closed_at_utc,
  round_trip_version.trade_currency,
  instrument.normalized_symbol AS symbol
${source}
${versionJoin}
JOIN journal_round_trip_daily_trade_analyses analysis
  ON analysis.daily_trade_analysis_id = version.daily_trade_analysis_id
  AND analysis.current_revision = version.revision_number
JOIN journal_round_trips round_trip
  ON round_trip.workspace_id = analysis.workspace_id
  AND round_trip.account_id = analysis.account_id
  AND round_trip.round_trip_id = analysis.round_trip_id
  AND round_trip.current_version_id = analysis.round_trip_version_id
  AND round_trip.lifecycle_state = 'active'
JOIN journal_round_trip_versions round_trip_version
  ON round_trip_version.round_trip_version_id = analysis.round_trip_version_id
  AND round_trip_version.workspace_id = analysis.workspace_id
  AND round_trip_version.account_id = analysis.account_id
JOIN journal_instruments instrument
  ON instrument.workspace_id = round_trip_version.workspace_id
  AND instrument.instrument_id = round_trip_version.instrument_id
WHERE analysis.workspace_id = ? AND analysis.account_id = ?
  AND analysis.status = 'ready' AND version.status = 'ready'
  AND round_trip_version.projection_state = 'ready_closed'
  AND round_trip_version.closed_at_utc IS NOT NULL${projectionScope}
)`;
}

function occurrenceScopeParams(
  projected: boolean,
  workspaceId: string,
  accountId: string,
): readonly string[] {
  return projected
    ? [workspaceId, accountId, workspaceId, accountId]
    : [workspaceId, accountId];
}

export function readDailyTradePatternOccurrences(
  database: Database.Database,
  scope: WorkspaceAccessScope,
  input: Readonly<{
    afterCursor: string | null;
    currency: string;
    endDate: string | null;
    execution: DailyTradePatternExecutionFilter;
    location: DailyTradePatternLocationFilter;
    moneyBasis: DailyTradeEvidenceMoneyBasis;
    pageSize: number;
    pattern: string;
    startDate: string | null;
    ticker: string;
    timeframe: DailyTradePatternTimeframeFilter;
  }>,
): DailyTradePatternOccurrencePage {
  const accountId = activeAccountId(scope);
  const pageSize = requirePageSize(input.pageSize);
  if (!input.pattern.trim() || input.pattern.length > 120 || !/^[A-Z]{3}$/u.test(input.currency)) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
      field: "occurrenceFilters",
    });
  }
  const timezone = accountTimezone(database, scope, accountId);
  const bounds = dateBounds(input.startDate, input.endDate, timezone);
  const projected = hasDailyTradePatternOccurrenceProjection(database);
  const cte = occurrenceCandidateCte(projected);
  const filters = ["pattern_kind = ?", "trade_currency = ?"];
  const parameters: (string | number)[] = [
    ...occurrenceScopeParams(projected, scope.workspaceId, accountId),
    input.pattern,
    input.currency,
  ];
  if (bounds) {
    filters.push("executed_at_utc >= ?", "executed_at_utc < ?");
    parameters.push(bounds.startUtc, bounds.endExclusiveUtc);
  }
  if (input.ticker.trim()) {
    filters.push("symbol LIKE ? ESCAPE '\\' COLLATE NOCASE");
    parameters.push(likeValue(input.ticker));
  }
  if (input.timeframe !== "all") {
    filters.push("timeframe = ?");
    parameters.push(input.timeframe);
  }
  if (input.execution === "entry") {
    filters.push("event_kind IN ('entry', 'add')");
  } else if (input.execution === "exit") {
    filters.push("event_kind IN ('partial_exit', 'final_exit')");
  }
  if (input.location === "exact") {
    filters.push("candles_before_execution = 0");
  } else if (input.location === "before") {
    filters.push("candles_before_execution > 0");
  }
  const where = filters.join(" AND ");
  const total = database.prepare(`${cte}
SELECT COUNT(*) AS total FROM candidates WHERE ${where}`).get(
    ...parameters,
  ) as { total: number } | undefined;
  const pageParameters = [...parameters];
  let cursorFilter = "";
  if (input.afterCursor) {
    const cursor = decodeOccurrenceCursor(input.afterCursor);
    cursorFilter = ` AND (
  executed_at_utc,
  execution_id,
  pattern_sequence,
  daily_trade_analysis_version_id
) < (?, ?, ?, ?)`;
    pageParameters.push(
      cursor.executedAtUtc,
      cursor.executionId,
      cursor.patternSequence,
      cursor.analysisVersionId,
    );
  }
  pageParameters.push(pageSize + 1);
  const selected = database.prepare(`${cte}
SELECT * FROM candidates
WHERE ${where}${cursorFilter}
ORDER BY executed_at_utc DESC, execution_id DESC,
  pattern_sequence DESC, daily_trade_analysis_version_id DESC
LIMIT ?`).all(...pageParameters) as CandidateRow[];
  const hasMore = selected.length > pageSize;
  const pageRows = selected.slice(0, pageSize);
  const resultByVersion = exactResults(
    database,
    [...new Set(pageRows.map((row) => row.daily_trade_analysis_version_id))],
  );
  return Object.freeze({
    continuationCursor: hasMore && pageRows.length > 0
      ? encodeCursor({
          analysisVersionId: pageRows.at(-1)!.daily_trade_analysis_version_id,
          executedAtUtc: pageRows.at(-1)!.executed_at_utc,
          executionId: pageRows.at(-1)!.execution_id,
          patternSequence: pageRows.at(-1)!.pattern_sequence,
        })
      : null,
    rows: Object.freeze(pageRows.map((row) => {
      const result = resultForDirection(
        resultByVersion.get(row.daily_trade_analysis_version_id),
        row.direction,
        input.moneyBasis,
      );
      return Object.freeze({
        candlesBeforeExecution: row.candles_before_execution,
        currency: row.trade_currency,
        direction: row.direction,
        eventKind: row.event_kind,
        executedAtUtc: row.executed_at_utc,
        executionId: row.execution_id,
        occurrenceRef: occurrenceRef(row),
        pattern: row.pattern_kind,
        patternTimeUtcSeconds: row.pattern_time_utc_seconds,
        resultDecimal: result.resultDecimal,
        returnPercentDecimal: result.returnPercentDecimal,
        roundTripId: row.round_trip_id,
        symbol: row.symbol,
        timeframe: row.timeframe,
        trackerDate: localDate(row.opened_at_utc, timezone),
      } satisfies DailyTradePatternOccurrenceRow);
    })),
    timezone,
    totalRowCount: total?.total ?? 0,
  });
}

export function readDailyTradePatternOccurrence(
  database: Database.Database,
  scope: WorkspaceAccessScope,
  occurrenceReference: string,
  moneyBasis: DailyTradeEvidenceMoneyBasis,
): DailyTradePatternOccurrenceRow {
  const accountId = activeAccountId(scope);
  const timezone = accountTimezone(database, scope, accountId);
  const reference = decodeOccurrenceRef(occurrenceReference);
  const projected = hasDailyTradePatternOccurrenceProjection(database);
  const cte = occurrenceCandidateCte(projected);
  const row = database.prepare(`${cte}
SELECT * FROM candidates
WHERE daily_trade_analysis_version_id = ?
  AND execution_id = ? AND pattern_sequence = ?`).get(
    ...occurrenceScopeParams(projected, scope.workspaceId, accountId),
    reference.analysisVersionId,
    reference.executionId,
    reference.patternSequence,
  ) as CandidateRow | undefined;
  if (!row) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
      field: "occurrenceRef",
    });
  }
  const result = resultForDirection(
    exactResults(database, [row.daily_trade_analysis_version_id])
      .get(row.daily_trade_analysis_version_id),
    row.direction,
    moneyBasis,
  );
  return Object.freeze({
    candlesBeforeExecution: row.candles_before_execution,
    currency: row.trade_currency,
    direction: row.direction,
    eventKind: row.event_kind,
    executedAtUtc: row.executed_at_utc,
    executionId: row.execution_id,
    occurrenceRef: occurrenceReference,
    pattern: row.pattern_kind,
    patternTimeUtcSeconds: row.pattern_time_utc_seconds,
    resultDecimal: result.resultDecimal,
    returnPercentDecimal: result.returnPercentDecimal,
    roundTripId: row.round_trip_id,
    symbol: row.symbol,
    timeframe: row.timeframe,
    trackerDate: localDate(row.opened_at_utc, timezone),
  });
}

export function readDailyTradeAnalyzedTrades(
  database: Database.Database,
  scope: WorkspaceAccessScope,
  input: Readonly<{
    afterCursor: string | null;
    currency: string;
    endDate: string | null;
    moneyBasis: DailyTradeEvidenceMoneyBasis;
    pageSize: number;
    startDate: string | null;
    ticker: string;
  }>,
): DailyTradeAnalyzedTradePage {
  const accountId = activeAccountId(scope);
  const pageSize = requirePageSize(input.pageSize);
  if (!/^[A-Z]{3}$/u.test(input.currency)) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
      field: "currency",
    });
  }
  const timezone = accountTimezone(database, scope, accountId);
  const bounds = dateBounds(input.startDate, input.endDate, timezone);
  const cte = `WITH candidates AS (SELECT
  analysis.round_trip_id,
  version.daily_trade_analysis_version_id,
  round_trip_version.direction,
  round_trip_version.opened_at_utc,
  round_trip_version.closed_at_utc,
  instrument.normalized_symbol AS symbol
FROM journal_round_trip_daily_trade_analyses analysis
JOIN journal_round_trip_daily_trade_analysis_versions version
  ON version.daily_trade_analysis_id = analysis.daily_trade_analysis_id
  AND version.revision_number = analysis.current_revision
JOIN journal_round_trips round_trip
  ON round_trip.workspace_id = analysis.workspace_id
  AND round_trip.account_id = analysis.account_id
  AND round_trip.round_trip_id = analysis.round_trip_id
  AND round_trip.current_version_id = analysis.round_trip_version_id
  AND round_trip.lifecycle_state = 'active'
JOIN journal_round_trip_versions round_trip_version
  ON round_trip_version.round_trip_version_id = analysis.round_trip_version_id
  AND round_trip_version.workspace_id = analysis.workspace_id
  AND round_trip_version.account_id = analysis.account_id
JOIN journal_instruments instrument
  ON instrument.workspace_id = round_trip_version.workspace_id
  AND instrument.instrument_id = round_trip_version.instrument_id
WHERE analysis.workspace_id = ? AND analysis.account_id = ?
  AND analysis.status = 'ready' AND version.status = 'ready'
  AND round_trip_version.projection_state = 'ready_closed'
  AND round_trip_version.closed_at_utc IS NOT NULL
  AND round_trip_version.trade_currency = ?
)`;
  const filters: string[] = [];
  const parameters: (string | number)[] = [
    scope.workspaceId,
    accountId,
    input.currency,
  ];
  if (bounds) {
    filters.push("closed_at_utc >= ?", "closed_at_utc < ?");
    parameters.push(bounds.startUtc, bounds.endExclusiveUtc);
  }
  if (input.ticker.trim()) {
    filters.push("symbol LIKE ? ESCAPE '\\' COLLATE NOCASE");
    parameters.push(likeValue(input.ticker));
  }
  const where = filters.length > 0 ? `WHERE ${filters.join(" AND ")}` : "";
  const total = database.prepare(`${cte}
SELECT COUNT(*) AS total FROM candidates ${where}`).get(...parameters) as
    { total: number } | undefined;
  const pageParameters = [...parameters];
  let cursorFilter = filters.length > 0 ? " AND " : "WHERE ";
  if (input.afterCursor) {
    const cursor = decodeTradeCursor(input.afterCursor);
    cursorFilter += "(closed_at_utc, round_trip_id) < (?, ?)";
    pageParameters.push(cursor.closedAtUtc, cursor.roundTripId);
  } else {
    cursorFilter = "";
  }
  pageParameters.push(pageSize + 1);
  const selected = database.prepare(`${cte}
SELECT * FROM candidates ${where}${cursorFilter}
ORDER BY closed_at_utc DESC, round_trip_id DESC
LIMIT ?`).all(...pageParameters) as AnalyzedTradeCandidateRow[];
  const hasMore = selected.length > pageSize;
  const pageRows = selected.slice(0, pageSize);
  const resultByVersion = exactResults(
    database,
    pageRows.map((row) => row.daily_trade_analysis_version_id),
  );
  return Object.freeze({
    continuationCursor: hasMore && pageRows.length > 0
      ? encodeCursor({
          closedAtUtc: pageRows.at(-1)!.closed_at_utc,
          roundTripId: pageRows.at(-1)!.round_trip_id,
        })
      : null,
    rows: Object.freeze(pageRows.map((row) => {
      const exact = resultByVersion.get(row.daily_trade_analysis_version_id);
      const result = resultForDirection(exact, row.direction, input.moneyBasis);
      return Object.freeze({
        closedAtUtc: row.closed_at_utc,
        direction: row.direction,
        executionCount: exact?.executionCount ?? 0,
        firstExecutionId: exact?.firstExecutionId ?? null,
        openedAtUtc: row.opened_at_utc,
        resultDecimal: result.resultDecimal,
        returnPercentDecimal: result.returnPercentDecimal,
        roundTripId: row.round_trip_id,
        symbol: row.symbol,
        trackerDate: localDate(row.opened_at_utc, timezone),
      } satisfies DailyTradeAnalyzedTradeRow);
    })),
    timezone,
    totalRowCount: total?.total ?? 0,
  });
}
