import type { CanonicalUtcTimestamp } from "../canonical";
import type { ExactResult } from "../exact";
import { validateCanonicalDigest, validateCanonicalTimestamp, validateEnum, validateExactRecord, validateExactRecordWithAuthorities, validateStringSet, type FoundationValidationFailure } from "../foundation";
import { createCanonicalContentIdentity, type CanonicalContentDigest } from "../identity";
import type { OpenPositionPolicy } from "../temporal";

export const CANONICAL_FILTER_VERSION = "ti_v3_canonical_filter_v1" as const;
export const DATE_RESOLUTION_RECEIPT_VERSION = "ti_v3_date_resolution_receipt_v1" as const;

export type DateBasis = "execution_date" | "trade_close_date" | "statement_date";
export type TimeBasis = "utc" | "exchange_local" | "owner_local";
export type CalendarBasis = "calendar_day" | "trading_session";
export type RangeBoundary = "inclusive" | "exclusive";
export type DirectionFilter = "long" | "short";
export type SessionFilter = "premarket" | "regular" | "after_hours" | "overnight";
export type OutcomeFilter = "gain" | "loss" | "flat" | "unknown";

export interface ResolvedAbsoluteRange { readonly startAt: CanonicalUtcTimestamp; readonly endAt: CanonicalUtcTimestamp }
export interface SetupFilterContract { readonly contractVersion: "v1"; readonly setupKeys: readonly string[]; readonly match: "any" | "all" }

export interface TradingSessionEvidence {
  readonly sessionDate: string;
  readonly state: "regular" | "holiday" | "early_close";
  readonly openAt: CanonicalUtcTimestamp | null;
  readonly closeAt: CanonicalUtcTimestamp | null;
  readonly closureReasonCode: string | null;
}

export interface DateResolutionReceipt {
  readonly schemaVersion: typeof DATE_RESOLUTION_RECEIPT_VERSION;
  readonly dateBasis: DateBasis;
  readonly timeBasis: TimeBasis;
  readonly timezone: string;
  readonly requestedStartDate: string;
  readonly requestedEndDate: string;
  readonly startBoundary: RangeBoundary;
  readonly endBoundary: RangeBoundary;
  readonly calendarBasis: CalendarBasis;
  readonly relativeDateAnchorAt: CanonicalUtcTimestamp | null;
  readonly fixedClockAt: CanonicalUtcTimestamp;
  readonly resolvedAbsoluteRange: ResolvedAbsoluteRange;
  readonly calendarPolicyKey: string;
  readonly calendarPolicyVersion: string;
  readonly sessionEvidence: readonly TradingSessionEvidence[];
  readonly receiptDigest: CanonicalContentDigest;
}

export interface CanonicalQueryFilter {
  readonly schemaVersion: typeof CANONICAL_FILTER_VERSION;
  readonly dateBasis: DateBasis;
  readonly timeBasis: TimeBasis;
  readonly timezone: string;
  readonly requestedStartDate: string;
  readonly requestedEndDate: string;
  readonly startBoundary: RangeBoundary;
  readonly endBoundary: RangeBoundary;
  readonly calendarBasis: CalendarBasis;
  readonly relativeDateAnchorAt: CanonicalUtcTimestamp | null;
  readonly resolvedAbsoluteRange: ResolvedAbsoluteRange;
  readonly dateResolutionReceiptDigest: CanonicalContentDigest;
  readonly accountFilters: readonly string[];
  readonly instrumentFilters: readonly string[];
  readonly directionFilters: readonly DirectionFilter[];
  readonly sessionFilters: readonly SessionFilter[];
  readonly lifecycleFilters: readonly string[];
  readonly setupFilter: SetupFilterContract | null;
  readonly outcomeFilters: readonly OutcomeFilter[];
  readonly currencyFilters: readonly string[];
  readonly evidenceCapabilityFilters: readonly string[];
  readonly openPositionPolicy: OpenPositionPolicy;
  readonly correctionCutoffAt: CanonicalUtcTimestamp;
  readonly analysisCutoffAt: CanonicalUtcTimestamp;
  readonly boundSnapshotDigest: CanonicalContentDigest | null;
  readonly filterDigest: CanonicalContentDigest;
}

export type CanonicalFilterFailure = FoundationValidationFailure | { readonly code: "ti_v3_filter_timezone_invalid" | "ti_v3_filter_date_invalid" | "ti_v3_filter_range_invalid" | "ti_v3_filter_contradictory" | "ti_v3_filter_relative_unresolved" | "ti_v3_filter_unverified"; readonly path: string };

const DATE_BASES = new Set<DateBasis>(["execution_date", "trade_close_date", "statement_date"]);
const TIME_BASES = new Set<TimeBasis>(["utc", "exchange_local", "owner_local"]);
const CALENDAR_BASES = new Set<CalendarBasis>(["calendar_day", "trading_session"]);
const BOUNDARIES = new Set<RangeBoundary>(["inclusive", "exclusive"]);
const DIRECTIONS = new Set<DirectionFilter>(["long", "short"]);
const SESSIONS = new Set<SessionFilter>(["premarket", "regular", "after_hours", "overnight"]);
const OUTCOMES = new Set<OutcomeFilter>(["gain", "loss", "flat", "unknown"]);
const OPEN_POLICIES = new Set<OpenPositionPolicy>(["exclude_from_closed_trade_analytics", "execution_review_only"]);
const verifiedFilters = new WeakSet<CanonicalQueryFilter>();
const verifiedDateReceipts = new WeakSet<DateResolutionReceipt>();
const SESSION_STATES = new Set<TradingSessionEvidence["state"]>([
  "regular",
  "holiday",
  "early_close",
]);

function failure(code: CanonicalFilterFailure["code"], path: string): ExactResult<never, CanonicalFilterFailure> { return { ok: false, error: { code, path } }; }
function validateDate(value: unknown, path: string): ExactResult<string, CanonicalFilterFailure> {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return failure("ti_v3_filter_date_invalid", path);
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? { ok: true, value } : failure("ti_v3_filter_date_invalid", path);
}
function validateTimezone(value: unknown): ExactResult<string, CanonicalFilterFailure> {
  if (typeof value !== "string" || value.length > 80 || !/^[A-Za-z_+-]+(?:\/[A-Za-z0-9_+-]+)+$|^UTC$/.test(value)) return failure("ti_v3_filter_timezone_invalid", "$.timezone");
  try { new Intl.DateTimeFormat("en-US", { timeZone: value }).format(0); } catch { return failure("ti_v3_filter_timezone_invalid", "$.timezone"); }
  return { ok: true, value };
}
function enumSet<T extends string>(input: unknown, path: string, allowed: ReadonlySet<T>): ExactResult<readonly T[], CanonicalFilterFailure> {
  const values = validateStringSet(input, path, { maxItems: allowed.size });
  if (!values.ok) return values;
  return values.value.some((value) => !allowed.has(value as T)) ? failure("ti_v3_validation_enum_invalid", path) : { ok: true, value: values.value as readonly T[] };
}
function setupContract(input: unknown): ExactResult<SetupFilterContract | null, CanonicalFilterFailure> {
  if (input === null) return { ok: true, value: null };
  const record = validateExactRecord(input, ["contractVersion", "setupKeys", "match"], [], "$.setupFilter"); if (!record.ok) return record;
  const keys = validateStringSet(record.value.setupKeys, "$.setupFilter.setupKeys", { pattern: /^[a-z0-9][a-z0-9:_-]{0,127}$/, maxItems: 128 }); if (!keys.ok) return keys;
  return record.value.contractVersion === "v1" && keys.value.length > 0 && (record.value.match === "any" || record.value.match === "all") ? { ok: true, value: { contractVersion: "v1", setupKeys: keys.value, match: record.value.match } } : failure("ti_v3_filter_contradictory", "$.setupFilter");
}

function localDateAt(timestamp: CanonicalUtcTimestamp, timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(timestamp));
  const value = (type: "year" | "month" | "day") =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

function parseSessionEvidence(
  input: unknown,
  path: string,
  timezone: string,
  requestedStartDate: string,
  requestedEndDate: string,
  resolvedStartAt: CanonicalUtcTimestamp,
  resolvedEndAt: CanonicalUtcTimestamp,
): ExactResult<TradingSessionEvidence, CanonicalFilterFailure> {
  const record = validateExactRecord(
    input,
    ["sessionDate", "state", "openAt", "closeAt", "closureReasonCode"],
    [],
    path,
  );
  if (!record.ok) return record;
  const sessionDate = validateDate(record.value.sessionDate, `${path}.sessionDate`);
  if (!sessionDate.ok) return sessionDate;
  const state = validateEnum(record.value.state, SESSION_STATES, `${path}.state`);
  if (!state.ok) return state;
  if (
    sessionDate.value < requestedStartDate ||
    sessionDate.value > requestedEndDate
  ) {
    return failure("ti_v3_filter_range_invalid", `${path}.sessionDate`);
  }
  const parseNullable = (
    value: unknown,
    itemPath: string,
  ): ExactResult<CanonicalUtcTimestamp | null, CanonicalFilterFailure> => {
    if (value === null) return { ok: true, value: null };
    return validateCanonicalTimestamp(value, itemPath);
  };
  const open = parseNullable(record.value.openAt, `${path}.openAt`);
  if (!open.ok) return open;
  const close = parseNullable(record.value.closeAt, `${path}.closeAt`);
  if (!close.ok) return close;
  const reason = record.value.closureReasonCode;
  if (
    reason !== null &&
    (typeof reason !== "string" || !/^ti_v3_[a-z0-9_]{1,120}$/.test(reason))
  ) {
    return failure("ti_v3_validation_string_invalid", `${path}.closureReasonCode`);
  }
  if (state.value === "holiday") {
    if (open.value !== null || close.value !== null || reason === null) {
      return failure("ti_v3_filter_contradictory", path);
    }
  } else {
    const weekday = new Date(`${sessionDate.value}T00:00:00.000Z`).getUTCDay();
    if (
      weekday === 0 ||
      weekday === 6 ||
      open.value === null ||
      close.value === null ||
      open.value >= close.value ||
      open.value < resolvedStartAt ||
      close.value > resolvedEndAt ||
      localDateAt(open.value, timezone) !== sessionDate.value ||
      localDateAt(close.value, timezone) !== sessionDate.value ||
      (state.value === "regular" && reason !== null) ||
      (state.value === "early_close" && reason === null)
    ) {
      return failure("ti_v3_filter_contradictory", path);
    }
  }
  return {
    ok: true,
    value: {
      sessionDate: sessionDate.value,
      state: state.value,
      openAt: open.value,
      closeAt: close.value,
      closureReasonCode: reason as string | null,
    },
  };
}

export interface DateResolutionRequest {
  readonly dateBasis: DateBasis;
  readonly timeBasis: TimeBasis;
  readonly timezone: string;
  readonly requestedStartDate: string | null;
  readonly requestedEndDate: string | null;
  readonly startBoundary: RangeBoundary;
  readonly endBoundary: RangeBoundary;
  readonly calendarBasis: CalendarBasis;
  readonly relativeRange: "today" | "yesterday" | "last_7_calendar_days" | "last_5_trading_sessions" | null;
}
export type RelativeDateResolutionRequest = DateResolutionRequest;
export interface RelativeDateResolver {
  resolve(request: DateResolutionRequest, fixedClockAt: CanonicalUtcTimestamp): ExactResult<{ readonly requestedStartDate: string; readonly requestedEndDate: string; readonly startAt: CanonicalUtcTimestamp; readonly endAt: CanonicalUtcTimestamp; readonly calendarPolicyKey: string; readonly calendarPolicyVersion: string; readonly sessionEvidence: readonly TradingSessionEvidence[] }, CanonicalFilterFailure>;
}

export function resolveRelativeDateRange(args: { readonly request: DateResolutionRequest; readonly now: CanonicalUtcTimestamp; readonly resolver: RelativeDateResolver }): ExactResult<DateResolutionReceipt, CanonicalFilterFailure> {
  const now = validateCanonicalTimestamp(args.now, "$.now"); if (!now.ok) return now;
  const timezone = validateTimezone(args.request.timezone); if (!timezone.ok) return timezone;
  if (!DATE_BASES.has(args.request.dateBasis) || !TIME_BASES.has(args.request.timeBasis) || !CALENDAR_BASES.has(args.request.calendarBasis) || !BOUNDARIES.has(args.request.startBoundary) || !BOUNDARIES.has(args.request.endBoundary)) return failure("ti_v3_validation_enum_invalid", "$.request");
  if (args.request.timeBasis === "utc" && timezone.value !== "UTC") return failure("ti_v3_filter_contradictory", "$.timezone");
  if ((args.request.relativeRange === null) !== (args.request.requestedStartDate !== null && args.request.requestedEndDate !== null)) return failure("ti_v3_filter_relative_unresolved", "$.request");
  const resolved = args.resolver.resolve({ ...args.request, timezone: timezone.value }, now.value); if (!resolved.ok) return resolved;
  const resolvedRecord = validateExactRecord(resolved.value, ["requestedStartDate", "requestedEndDate", "startAt", "endAt", "calendarPolicyKey", "calendarPolicyVersion", "sessionEvidence"], [], "$.resolved"); if (!resolvedRecord.ok) return resolvedRecord;
  const startDate = validateDate(resolvedRecord.value.requestedStartDate, "$.resolved.requestedStartDate"); if (!startDate.ok) return startDate;
  const endDate = validateDate(resolvedRecord.value.requestedEndDate, "$.resolved.requestedEndDate"); if (!endDate.ok) return endDate;
  if (startDate.value > endDate.value || (args.request.requestedStartDate !== null && (startDate.value !== args.request.requestedStartDate || endDate.value !== args.request.requestedEndDate))) return failure("ti_v3_filter_range_invalid", "$.resolved");
  const startAt = validateCanonicalTimestamp(resolvedRecord.value.startAt, "$.resolved.startAt"); if (!startAt.ok) return startAt;
  const endAt = validateCanonicalTimestamp(resolvedRecord.value.endAt, "$.resolved.endAt"); if (!endAt.ok) return endAt;
  if (startAt.value >= endAt.value || endAt.value > now.value || typeof resolvedRecord.value.calendarPolicyKey !== "string" || !/^ti_v3_[a-z0-9_]{1,120}$/.test(resolvedRecord.value.calendarPolicyKey) || typeof resolvedRecord.value.calendarPolicyVersion !== "string" || !/^v[1-9][0-9]*$/.test(resolvedRecord.value.calendarPolicyVersion)) return failure("ti_v3_filter_range_invalid", "$.resolved");
  if (!Array.isArray(resolvedRecord.value.sessionEvidence) || resolvedRecord.value.sessionEvidence.length > 2_000 || (args.request.calendarBasis === "trading_session" && resolvedRecord.value.sessionEvidence.length === 0) || (args.request.calendarBasis === "calendar_day" && resolvedRecord.value.sessionEvidence.length > 0)) return failure("ti_v3_filter_unverified", "$.resolved.sessionEvidence");
  const sessionEvidence: TradingSessionEvidence[] = [];
  for (let index = 0; index < resolvedRecord.value.sessionEvidence.length; index += 1) {
    const session = parseSessionEvidence(resolvedRecord.value.sessionEvidence[index], `$.resolved.sessionEvidence[${index}]`, timezone.value, startDate.value, endDate.value, startAt.value, endAt.value);
    if (!session.ok) return session;
    sessionEvidence.push(session.value);
  }
  if (new Set(sessionEvidence.map((session) => session.sessionDate)).size !== sessionEvidence.length) return failure("ti_v3_filter_contradictory", "$.resolved.sessionEvidence");
  sessionEvidence.sort((left, right) => left.sessionDate < right.sessionDate ? -1 : left.sessionDate > right.sessionDate ? 1 : 0);
  const relativeDateAnchorAt = args.request.relativeRange === null ? null : now.value;
  const content = { schemaVersion: DATE_RESOLUTION_RECEIPT_VERSION, dateBasis: args.request.dateBasis, timeBasis: args.request.timeBasis, timezone: timezone.value, requestedStartDate: startDate.value, requestedEndDate: endDate.value, startBoundary: args.request.startBoundary, endBoundary: args.request.endBoundary, calendarBasis: args.request.calendarBasis, relativeDateAnchorAt, fixedClockAt: now.value, resolvedAbsoluteRange: { startAt: startAt.value, endAt: endAt.value }, calendarPolicyKey: resolvedRecord.value.calendarPolicyKey, calendarPolicyVersion: resolvedRecord.value.calendarPolicyVersion, sessionEvidence };
  const identity = createCanonicalContentIdentity("date_resolution_receipt", "v1", content); if (!identity.ok) return failure(identity.error.code, identity.error.path);
  const canonical = identity.value.canonicalValue as unknown as Omit<DateResolutionReceipt, "receiptDigest">;
  const receipt = Object.freeze({ ...canonical, receiptDigest: identity.value.identifier });
  verifiedDateReceipts.add(receipt);
  return { ok: true, value: receipt };
}

export function buildCanonicalQueryFilter(input: unknown): ExactResult<CanonicalQueryFilter, CanonicalFilterFailure> {
  const record = validateExactRecordWithAuthorities(input, ["dateResolutionReceipt", "accountFilters", "instrumentFilters", "directionFilters", "sessionFilters", "lifecycleFilters", "setupFilter", "outcomeFilters", "currencyFilters", "evidenceCapabilityFilters", "openPositionPolicy", "correctionCutoffAt", "analysisCutoffAt", "boundSnapshotDigest"], [], { dateResolutionReceipt: (value) => typeof value === "object" && value !== null && verifiedDateReceipts.has(value as DateResolutionReceipt) }); if (!record.ok) return record;
  if (typeof record.value.dateResolutionReceipt !== "object" || record.value.dateResolutionReceipt === null || !verifiedDateReceipts.has(record.value.dateResolutionReceipt as DateResolutionReceipt)) return failure("ti_v3_filter_unverified", "$.dateResolutionReceipt");
  const receipt = record.value.dateResolutionReceipt as DateResolutionReceipt;
  const accounts = validateStringSet(record.value.accountFilters, "$.accountFilters", { pattern: /^account_[a-z0-9][a-z0-9_-]{0,87}$/, maxItems: 128 }); if (!accounts.ok) return accounts;
  const instruments = validateStringSet(record.value.instrumentFilters, "$.instrumentFilters", { pattern: /^[A-Z0-9][A-Z0-9.-]{0,31}$/, maxItems: 1_000 }); if (!instruments.ok) return instruments;
  const directions = enumSet(record.value.directionFilters, "$.directionFilters", DIRECTIONS); if (!directions.ok) return directions;
  const sessions = enumSet(record.value.sessionFilters, "$.sessionFilters", SESSIONS); if (!sessions.ok) return sessions;
  const lifecycle = validateStringSet(record.value.lifecycleFilters, "$.lifecycleFilters", { pattern: /^[a-z][a-z0-9_]{0,79}$/, maxItems: 32 }); if (!lifecycle.ok) return lifecycle;
  const setup = setupContract(record.value.setupFilter); if (!setup.ok) return setup;
  const outcomes = enumSet(record.value.outcomeFilters, "$.outcomeFilters", OUTCOMES); if (!outcomes.ok) return outcomes;
  const currencies = validateStringSet(record.value.currencyFilters, "$.currencyFilters", { pattern: /^[A-Z]{3}$/, maxItems: 32 }); if (!currencies.ok) return currencies;
  const capabilities = validateStringSet(record.value.evidenceCapabilityFilters, "$.evidenceCapabilityFilters", { pattern: /^[a-z][a-z0-9_]{0,79}$/, maxItems: 32 }); if (!capabilities.ok) return capabilities;
  const openPolicy = validateEnum(record.value.openPositionPolicy, OPEN_POLICIES, "$.openPositionPolicy"); if (!openPolicy.ok) return openPolicy;
  const correction = validateCanonicalTimestamp(record.value.correctionCutoffAt, "$.correctionCutoffAt"); if (!correction.ok) return correction;
  const analysis = validateCanonicalTimestamp(record.value.analysisCutoffAt, "$.analysisCutoffAt"); if (!analysis.ok) return analysis;
  if (correction.value > analysis.value || receipt.resolvedAbsoluteRange.endAt > analysis.value || receipt.fixedClockAt > analysis.value) return failure("ti_v3_filter_contradictory", "$.analysisCutoffAt");
  let boundSnapshot: CanonicalContentDigest | null = null;
  if (record.value.boundSnapshotDigest !== null) { const parsed = validateCanonicalDigest(record.value.boundSnapshotDigest, "$.boundSnapshotDigest", "analysis_snapshot"); if (!parsed.ok) return parsed; boundSnapshot = parsed.value; }
  const content = { schemaVersion: CANONICAL_FILTER_VERSION, dateBasis: receipt.dateBasis, timeBasis: receipt.timeBasis, timezone: receipt.timezone, requestedStartDate: receipt.requestedStartDate, requestedEndDate: receipt.requestedEndDate, startBoundary: receipt.startBoundary, endBoundary: receipt.endBoundary, calendarBasis: receipt.calendarBasis, relativeDateAnchorAt: receipt.relativeDateAnchorAt, resolvedAbsoluteRange: receipt.resolvedAbsoluteRange, dateResolutionReceiptDigest: receipt.receiptDigest, accountFilters: accounts.value, instrumentFilters: instruments.value, directionFilters: directions.value, sessionFilters: sessions.value, lifecycleFilters: lifecycle.value, setupFilter: setup.value, outcomeFilters: outcomes.value, currencyFilters: currencies.value, evidenceCapabilityFilters: capabilities.value, openPositionPolicy: openPolicy.value, correctionCutoffAt: correction.value, analysisCutoffAt: analysis.value, boundSnapshotDigest: boundSnapshot };
  const identity = createCanonicalContentIdentity("canonical_filter", "v1", content); if (!identity.ok) return failure(identity.error.code, identity.error.path);
  const canonical = identity.value.canonicalValue as unknown as Omit<CanonicalQueryFilter, "filterDigest">;
  const filter = Object.freeze({ ...canonical, filterDigest: identity.value.identifier }); verifiedFilters.add(filter); return { ok: true, value: filter };
}

export function verifyCanonicalQueryFilter(input: unknown): ExactResult<CanonicalQueryFilter, CanonicalFilterFailure> {
  return typeof input === "object" && input !== null && verifiedFilters.has(input as CanonicalQueryFilter) ? { ok: true, value: input as CanonicalQueryFilter } : failure("ti_v3_filter_unverified", "$");
}

export function verifyDateResolutionReceipt(input: unknown): ExactResult<DateResolutionReceipt, CanonicalFilterFailure> {
  return typeof input === "object" && input !== null && verifiedDateReceipts.has(input as DateResolutionReceipt)
    ? { ok: true, value: input as DateResolutionReceipt }
    : failure("ti_v3_filter_unverified", "$");
}
