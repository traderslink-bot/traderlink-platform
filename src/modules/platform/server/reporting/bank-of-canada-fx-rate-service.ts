import "server-only";

import type Database from "better-sqlite3";
import Decimal from "decimal.js";

import {
  createCanonicalUtcTimestamp,
  createCanonicalUuidV4,
} from "../database/platform-migration-contract";
import type { PlatformReportingCurrency } from "../identity/platform-user-preference-repository";

const RATE_PROVIDER_KEY = "bank_of_canada_valet";
const USD_TO_CAD_SERIES = "FXUSDCAD";
const RATE_REQUEST_TIMEOUT_MS = 5_000;
const TARGET_SERIES: Readonly<Record<Exclude<PlatformReportingCurrency, "USD" | "CAD">, string>> = Object.freeze({
  AUD: "FXAUDCAD",
  BRL: "FXBRLCAD",
  CNY: "FXCNYCAD",
  EUR: "FXEURCAD",
  HKD: "FXHKDCAD",
  INR: "FXINRCAD",
  IDR: "FXIDRCAD",
  JPY: "FXJPYCAD",
  MYR: "FXMYRCAD",
  MXN: "FXMXNCAD",
  NZD: "FXNZDCAD",
  NOK: "FXNOKCAD",
  PEN: "FXPENCAD",
  PLN: "FXPLNCAD",
  SGD: "FXSGDCAD",
  ZAR: "FXZARCAD",
  KRW: "FXKRWCAD",
  SEK: "FXSEKCAD",
  CHF: "FXCHFCAD",
  TWD: "FXTWDCAD",
  THB: "FXTHBCAD",
  TRY: "FXTRYCAD",
  GBP: "FXGBPCAD",
});
const TradingDecimal = Decimal.clone({ precision: 40, rounding: Decimal.ROUND_HALF_UP });

type CachedRateRow = Readonly<{
  source_date: string;
  usd_to_target_decimal: string;
}>;

function isDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/u.test(value) && Number.isFinite(Date.parse(`${value}T12:00:00.000Z`));
}

function compactDecimal(value: Decimal): string {
  const fixed = value.toFixed();
  return fixed.includes(".")
    ? fixed.replace(/0+$/u, "").replace(/\.$/u, "")
    : fixed;
}

function positiveDecimal(value: unknown): string | null {
  if (typeof value !== "string" || !/^(?:0|[1-9]\d*)(?:\.\d+)?$/u.test(value)) return null;
  const parsed = new TradingDecimal(value);
  return parsed.isFinite() && parsed.greaterThan(0) ? compactDecimal(parsed) : null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function observationValue(observation: Record<string, unknown>, series: string): string | null {
  const value = asRecord(observation[series]);
  return value ? positiveDecimal(value.v) : null;
}

function existingRates(
  database: Database.Database,
  targetCurrency: Exclude<PlatformReportingCurrency, "USD">,
  dates: readonly string[],
): ReadonlyMap<string, string> {
  if (dates.length === 0) return new Map();
  const placeholders = dates.map(() => "?").join(", ");
  const rows = database.prepare<unknown[], CachedRateRow>(`SELECT
  source_date, usd_to_target_decimal
FROM platform_fx_rate_observations
WHERE provider_key = ? AND source_currency = 'USD' AND target_currency = ?
  AND source_date IN (${placeholders})`).all(
    RATE_PROVIDER_KEY,
    targetCurrency,
    ...dates,
  );
  return new Map(rows.map((row) => [row.source_date, row.usd_to_target_decimal]));
}

async function fetchMissingRates(input: Readonly<{
  targetCurrency: Exclude<PlatformReportingCurrency, "USD">;
  dates: readonly string[];
}>): Promise<readonly Readonly<{ sourceDate: string; usdToTargetDecimal: string; sourceSeries: string }>[]> {
  if (input.dates.length === 0) return Object.freeze([]);
  const targetSeries = input.targetCurrency === "CAD" ? null : TARGET_SERIES[input.targetCurrency];
  const startDate = input.dates[0];
  const endDate = input.dates.at(-1) as string;
  const requested = new Set(input.dates);
  async function fetchSeries(series: string): Promise<ReadonlyMap<string, string>> {
    const url = new URL(`https://www.bankofcanada.ca/valet/observations/${series}/json`);
    url.searchParams.set("start_date", startDate);
    url.searchParams.set("end_date", endDate);
    const response = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(RATE_REQUEST_TIMEOUT_MS),
    });
    if (!response.ok) return new Map();
    const payload = asRecord(await response.json());
    const observations = Array.isArray(payload?.observations) ? payload.observations : [];
    return new Map(observations.flatMap((candidate) => {
      const observation = asRecord(candidate);
      const sourceDate = typeof observation?.d === "string" ? observation.d : null;
      const value = observation ? observationValue(observation, series) : null;
      return sourceDate && requested.has(sourceDate) && isDate(sourceDate) && value
        ? [[sourceDate, value] as const]
        : [];
    }));
  }
  try {
    const [usdToCad, targetToCad] = await Promise.all([
      fetchSeries(USD_TO_CAD_SERIES),
      targetSeries ? fetchSeries(targetSeries) : Promise.resolve(new Map<string, string>()),
    ]);
    return Object.freeze(input.dates.flatMap((sourceDate) => {
      const usdRate = usdToCad.get(sourceDate);
      const targetRate = targetSeries ? targetToCad.get(sourceDate) : "1";
      if (!usdRate || !targetRate) return [];
      const usdToTargetDecimal = compactDecimal(
        new TradingDecimal(usdRate).dividedBy(targetRate),
      );
      return [{
        sourceDate,
        usdToTargetDecimal,
        sourceSeries: targetSeries
          ? `${USD_TO_CAD_SERIES},${targetSeries}`
          : USD_TO_CAD_SERIES,
      }];
    }));
  } catch {
    return Object.freeze([]);
  }
}

function cacheRates(
  database: Database.Database,
  targetCurrency: Exclude<PlatformReportingCurrency, "USD">,
  rates: readonly Readonly<{ sourceDate: string; usdToTargetDecimal: string; sourceSeries: string }>[],
): void {
  if (rates.length === 0) return;
  const retrievedAtUtc = createCanonicalUtcTimestamp();
  const insert = database.prepare(`INSERT OR IGNORE INTO platform_fx_rate_observations (
  fx_rate_observation_id, provider_key, source_date, source_currency,
  target_currency, usd_to_target_decimal, source_series, retrieved_at_utc
) VALUES (?, ?, ?, 'USD', ?, ?, ?, ?)`);
  const transaction = database.transaction(() => {
    for (const rate of rates) {
      insert.run(
        createCanonicalUuidV4(),
        RATE_PROVIDER_KEY,
        rate.sourceDate,
        targetCurrency,
        rate.usdToTargetDecimal,
        rate.sourceSeries,
        retrievedAtUtc,
      );
    }
  });
  transaction();
}

export async function loadUsdReportingRates(
  database: Database.Database,
  input: Readonly<{
    targetCurrency: PlatformReportingCurrency;
    sourceDates: readonly string[];
  }>,
): Promise<ReadonlyMap<string, string>> {
  if (input.targetCurrency === "USD") return new Map();
  const sourceDates = [...new Set(input.sourceDates.filter(isDate))].sort();
  const targetCurrency = input.targetCurrency;
  const cached = existingRates(database, targetCurrency, sourceDates);
  const missing = sourceDates.filter((date) => !cached.has(date));
  if (missing.length === 0) return cached;
  const fetched = await fetchMissingRates({ targetCurrency, dates: missing });
  cacheRates(database, targetCurrency, fetched);
  return existingRates(database, targetCurrency, sourceDates);
}

export function convertUsdReportingAmount(
  usdDecimal: string,
  usdToTargetDecimal: string,
): string {
  return compactDecimal(new TradingDecimal(usdDecimal).times(usdToTargetDecimal));
}
