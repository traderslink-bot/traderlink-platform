import "server-only";

import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import type {
  JournalAnalyticsAllocationFact,
  JournalAnalyticsFactSet,
  JournalAnalyticsFactSetRequest,
  JournalAnalyticsRoundTripFact,
} from "@/src/modules/journal/contracts/journal-analytics-fact-set";
import type {
  JournalAnalyticsFactSetReader,
} from "@/src/modules/journal/server/analytics/journal-analytics-fact-set-service";
import type { PlatformReportingCurrency } from
  "@/src/modules/platform/server/identity/platform-user-preference-repository";
import { convertReportingAmount } from
  "@/src/modules/platform/server/reporting/bank-of-canada-fx-rate-service";

import { journalAnalyticsLocalTimeFact } from "./normalize-journal-analytics-facts";

export type JournalReportingCurrencyContext = Readonly<{
  ratesByCurrency: ReadonlyMap<string, ReadonlyMap<string, string>>;
  reportingCurrency: PlatformReportingCurrency;
  requestedAtUtc: string;
  sourceCurrencyByRoundTrip: ReadonlyMap<string, string>;
  sourceDateByRoundTrip: ReadonlyMap<string, string>;
}>;

function reportingDate(
  roundTrip: JournalAnalyticsRoundTripFact,
  timezone: string,
  requestedAtUtc: string,
): string {
  return journalAnalyticsLocalTimeFact(
    roundTrip.closedAtUtc ?? requestedAtUtc,
    timezone,
  ).localDate;
}

function convertAllocation(
  allocation: JournalAnalyticsAllocationFact,
  sourceDate: string,
  tradeCurrency: string,
  reportingCurrency: PlatformReportingCurrency,
  context: JournalReportingCurrencyContext,
): JournalAnalyticsAllocationFact {
  const convertedPrice = allocation.priceDecimal === null
    ? null
    : journalReportingCurrencyAmount(
        allocation.priceDecimal,
        tradeCurrency,
        reportingCurrency,
        sourceDate,
        context,
      );
  const convertedFees = allocation.feesDecimal === null || allocation.feeCurrency === null
    ? allocation.feesDecimal
    : journalReportingCurrencyAmount(
        allocation.feesDecimal,
        allocation.feeCurrency,
        reportingCurrency,
        sourceDate,
        context,
      );
  return Object.freeze({
    ...allocation,
    priceDecimal: convertedPrice,
    feesDecimal: convertedFees,
    feeCurrency: allocation.feeCurrency === null
      ? null
      : reportingCurrency,
  });
}

function usdRate(
  currency: string,
  sourceDate: string,
  context: JournalReportingCurrencyContext,
): string | null {
  return currency === "USD"
    ? "1"
    : context.ratesByCurrency.get(currency)?.get(sourceDate) ?? null;
}

export function journalReportingCurrencyAmount(
  amount: string,
  sourceCurrency: string,
  targetCurrency: PlatformReportingCurrency,
  sourceDate: string,
  context: JournalReportingCurrencyContext,
): string {
  if (sourceCurrency === targetCurrency) return amount;
  const sourceRate = usdRate(sourceCurrency, sourceDate, context);
  const targetRate = usdRate(targetCurrency, sourceDate, context);
  if (sourceRate === null || targetRate === null) {
    throw new TypeError(`Reporting conversion is unavailable for ${sourceDate}.`);
  }
  return convertReportingAmount(amount, sourceRate, targetRate);
}

export function journalReportingCurrencyMultiplier(
  sourceCurrency: string,
  sourceDate: string,
  context: JournalReportingCurrencyContext,
): string {
  return journalReportingCurrencyAmount(
    "1",
    sourceCurrency,
    context.reportingCurrency,
    sourceDate,
    context,
  );
}

function convertRoundTrip(
  roundTrip: JournalAnalyticsRoundTripFact,
  timezone: string,
  context: JournalReportingCurrencyContext,
): JournalAnalyticsRoundTripFact {
  const requiresConversion = roundTrip.tradeCurrency !== context.reportingCurrency ||
    roundTrip.allocations.some((allocation) =>
      allocation.feeCurrency !== null &&
      allocation.feeCurrency !== context.reportingCurrency);
  if (!requiresConversion) return roundTrip;
  const sourceDate = reportingDate(roundTrip, timezone, context.requestedAtUtc);
  return Object.freeze({
    ...roundTrip,
    tradeCurrency: context.reportingCurrency,
    allocations: Object.freeze(roundTrip.allocations.map((allocation) =>
      convertAllocation(
        allocation,
        sourceDate,
        roundTrip.tradeCurrency,
        context.reportingCurrency,
        context,
      ))),
  });
}

export function journalReportingSourceDates(
  factSet: JournalAnalyticsFactSet,
  requestedAtUtc: string,
): readonly string[] {
  const timezoneByAccount = new Map(factSet.accounts.map((account) => [
    account.accountId,
    account.tradingTimezone,
  ]));
  return Object.freeze([...new Set(factSet.roundTrips.flatMap((roundTrip) => {
    const timezone = timezoneByAccount.get(roundTrip.accountId);
    return timezone
      ? [reportingDate(roundTrip, timezone, requestedAtUtc)]
      : [];
  }))].sort());
}

export class JournalReportingCurrencyFactSetReader implements JournalAnalyticsFactSetReader {
  private readonly cache = new Map<string, JournalAnalyticsFactSet>();

  constructor(
    private readonly source: JournalAnalyticsFactSetReader,
    private readonly context: JournalReportingCurrencyContext,
  ) {}

  getJournalAnalyticsFactSet(
    scope: WorkspaceAccessScope,
    request: JournalAnalyticsFactSetRequest,
  ): JournalAnalyticsFactSet {
    const sourceRequest = Object.freeze({
      ...request,
      currencySelection: Object.freeze({ kind: "all_partitions" as const }),
    });
    const cacheKey = JSON.stringify(sourceRequest);
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;
    const factSet = this.source.getJournalAnalyticsFactSet(scope, sourceRequest);
    const timezoneByAccount = new Map(factSet.accounts.map((account) => [
      account.accountId,
      account.tradingTimezone,
    ]));
    const reported = Object.freeze({
      ...factSet,
      requestedCurrencySelection: Object.freeze({
        kind: "single_currency" as const,
        currency: this.context.reportingCurrency,
      }),
      accounts: Object.freeze(factSet.accounts.map((account) => Object.freeze({
        ...account,
        baseCurrency: this.context.reportingCurrency,
      }))),
      roundTrips: Object.freeze(factSet.roundTrips.map((roundTrip) => {
        const timezone = timezoneByAccount.get(roundTrip.accountId);
        return timezone
          ? convertRoundTrip(roundTrip, timezone, this.context)
          : roundTrip;
      })),
    });
    this.cache.set(cacheKey, reported);
    return reported;
  }
}

export function createJournalReportingCurrencyFactSetReader(
  source: JournalAnalyticsFactSetReader,
  context: JournalReportingCurrencyContext,
): JournalAnalyticsFactSetReader {
  return new JournalReportingCurrencyFactSetReader(source, context);
}
