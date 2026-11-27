import "server-only";
import { readCompanyRecords } from "@/src/lib/news/company-data-gateway";
import { easternClock } from "../../live/sessions";
import { CoachUsEquitiesReviewCalendarService } from "@/src/modules/coach/server/market-calendar/coach-us-equities-review-calendar-service";
import type { CompanyFilingOperand, CompanyMetric, CompanyReadings } from "../audited-filters";

type Filing = { form: string; date: string; reportDate?: string; acceptedAt?: string; accession: string };
type Fact = {
  metric: string;
  scope: string;
  start: string;
  end: string;
  filed: string;
  acceptedAt?: string;
  unit: string;
  currency: string;
  value: number;
  accession: string;
  status: string;
};
type Statement = { filing: Filing; facts: Fact[] };
type Ratio = {
  state: string;
  source: string;
  sourceField: string;
  period: string;
  unit: string;
  tradingDate: string;
  value: number;
};
type RecordSource<T> = { state: string; value?: T; lastSuccessAt?: number; checkedAt?: number };
export type CompanyRecord = {
  symbol: string;
  tracked?: boolean;
  sec?: RecordSource<{
    statements: { annual?: Statement; previousAnnual?: Statement };
    filings: Filing[];
    filingCoverage?: { from: string; through: string; checkedAt: number; complete: boolean };
  }> & { health?: { pendingFiling?: Filing } };
  metrics?: RecordSource<{ valuation: Record<string, Ratio> }>;
};
type Batch = { revision: number; companies: CompanyRecord[] };
const day = 86_400_000;
const isoDay = (at: number) => new Date(at).toISOString().slice(0, 10);
const accessionPattern = /^\d{10}-\d{2}-\d{6}$/;
const calendar = new CoachUsEquitiesReviewCalendarService();
const ratios = {
  priceEarningsTtm: ["peTTM", "ttm", "x"],
  priceSalesTtm: ["psTTM", "ttm", "x"],
  priceBookQuarter: ["pbQuarterly", "quarter", "x"],
  dividendYieldTtm: ["currentDividendYieldTTM", "ttm", "percent"],
} as const;
function visible(date: string, acceptedAt: string | undefined, at: number, published?: number) {
  const today = isoDay(at);
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    date <= today &&
    (acceptedAt
      ? Date.parse(acceptedAt) <= at
      : date < today || (typeof published === "number" && Number.isSafeInteger(published) && published <= at))
  );
}
let lastTradingDate: { date: string; tradingDate?: string } | undefined;

function latestTradingDate(at: number) {
  const date = easternClock(at).date;
  if (date === lastTradingDate?.date) return lastTradingDate.tradingDate;
  let tradingDate: string | undefined;
  try {
    for (let daysBack = 0; daysBack <= 7; daysBack++) {
      const candidate = isoDay(Date.parse(date) - daysBack * day);
      if (calendar.session(candidate).state === "open") {
        tradingDate = candidate;
        break;
      }
    }
  } catch {
    // Outside verified calendar coverage, only the calendar-dependent ratios are unknown.
  }
  lastTradingDate = { date, tradingDate };
  return tradingDate;
}

export function projectCompanyRecord(record: CompanyRecord, revision: number, at: number): CompanyReadings {
  const values: CompanyReadings["values"] = {};
  const operands: Partial<Record<CompanyMetric, CompanyFilingOperand[]>> = {};
  const filingsByMetric: Partial<Record<CompanyMetric, string[]>> = {};
  if (record.tracked === false) return { values };
  const sec = record.sec;
  const published = sec?.lastSuccessAt;
  const annual = sec?.value?.statements?.annual,
    previous = sec?.value?.statements?.previousAnnual;
  const pending = sec?.health?.pendingFiling;
  const annualPending =
    pending &&
    visible(pending.date, pending.acceptedAt, at, sec?.checkedAt) &&
    /^(10-KT?|20-F|40-F)(\/A)?$/.test(pending.form);
  function field(statement: Statement | undefined, metric: string, scopes: string[], unit = "USD") {
    if (!statement || !visible(statement.filing.date, statement.filing.acceptedAt, at, published)) return;
    if (
      annualPending &&
      (!pending.reportDate ||
        !statement.filing.reportDate ||
        pending.reportDate === statement.filing.reportDate ||
        (statement === annual && pending.reportDate > statement.filing.reportDate))
    )
      return;
    const candidates = statement.facts.filter(
      (f) =>
        f.metric === metric &&
        scopes.includes(f.scope) &&
        f.unit === unit &&
        f.currency === "USD" &&
        Number.isFinite(f.value) &&
        f.start &&
        f.start < f.end &&
        f.end === statement.filing.reportDate &&
        accessionPattern.test(f.accession) &&
        (f.status === "filed" || f.status === "amended") &&
        visible(f.filed, f.acceptedAt, at, published),
    );
    return candidates.length === 1 ? candidates[0] : undefined;
  }
  function store(key: Exclude<CompanyMetric, "recentFiling">, value: number, ...facts: Fact[]) {
    if (Number.isFinite(value)) {
      values[key] = value;
      operands[key] = facts.map(({ accession, metric, scope, unit, start, end, value }) => ({
        accession,
        metric,
        scope,
        unit,
        start,
        end,
        value,
      }));
      filingsByMetric[key] = [...new Set(facts.map((f) => f.accession))];
    }
  }
  const revenue = (s?: Statement) => field(s, "revenue", ["operating", "continuing"]);
  const income = (s?: Statement) =>
    field(s, "netIncome", ["parent"]) ?? field(s, "totalNetIncome", ["consolidated"]);
  const sales = revenue(annual),
    profit = income(annual);
  const eps = field(annual, "dilutedEps", ["issuerCommon"], "USD/shares");
  if (eps) store("annualEps", eps.value, eps);
  for (const [key, growth, current, prior] of [
    ["annualRevenue", "revenueGrowth", sales, revenue(previous)],
    ["annualIncome", "incomeGrowth", profit, income(previous)],
  ] as const) {
    if (!current) continue;
    store(key, current.value, current);
    if (
      prior &&
      prior.value > 0 &&
      prior.scope === current.scope &&
      Date.parse(current.start) - Date.parse(prior.end) === day &&
      Math.abs(
        Date.parse(current.end) -
          Date.parse(current.start) -
          (Date.parse(prior.end) - Date.parse(prior.start)),
      ) <=
        8 * day
    )
      store(growth, (current.value / prior.value - 1) * 100, current, prior);
  }
  if (sales && sales.value > 0)
    for (const [key, numerator] of [
      ["annualNetMargin", profit],
      ["annualGrossMargin", field(annual, "grossProfit", ["operating"])],
    ] as const) {
      if (
        numerator &&
        sales.scope === "operating" &&
        numerator.start === sales.start &&
        numerator.end === sales.end
      )
        store(key, (numerator.value / sales.value) * 100, numerator, sales);
    }
  const valuation = record.metrics?.value?.valuation;
  const tradingDate = valuation && latestTradingDate(at);
  for (const key of Object.keys(ratios) as (keyof typeof ratios)[]) {
    const r = valuation?.[key],
      [source, period, unit] = ratios[key];
    if (
      r?.state === "available" &&
      r.source === "finnhub" &&
      r.sourceField === source &&
      r.unit === unit &&
      r.period === period &&
      tradingDate &&
      r.tradingDate === tradingDate &&
      Number.isFinite(r.value)
    )
      values[key] = r.value;
  }
  const today = isoDay(at),
    start = isoDay(at - 29 * day);
  const coverage = sec?.value?.filingCoverage;
  const filings = sec?.value?.filings?.filter(
    (f) =>
      f.date >= start && accessionPattern.test(f.accession) && visible(f.date, f.acceptedAt, at, published),
  );
  const forms = filings && [...new Set(filings.map((f) => f.form))];
  const formsComplete =
    !!coverage?.complete &&
    coverage.from <= start &&
    coverage.through >= today &&
    Number.isSafeInteger(coverage.checkedAt) &&
    coverage.checkedAt <= at;
  if (filings) filingsByMetric.recentFiling = filings.map((f) => f.accession);
  return { values, forms, formsComplete, evidence: { revision, asOf: at, filingsByMetric, operands } };
}

/** Pages in one observation must see exactly the first batch's revision. */
export async function readScannerCompanyBatch(symbols: readonly string[], at: number, pinned?: number) {
  const batch = await readCompanyRecords<Batch>(symbols, { asOf: at, revision: pinned });
  if (
    !batch ||
    !Number.isSafeInteger(batch.revision) ||
    batch.revision < 0 ||
    (pinned !== undefined && pinned !== batch.revision) ||
    !Array.isArray(batch.companies) ||
    batch.companies.length !== symbols.length
  )
    throw Error("Incomplete company snapshot");
  const records = new Map<string, CompanyReadings>();
  for (const record of batch.companies) {
    if (!symbols.includes(record.symbol) || records.has(record.symbol))
      throw Error("Unexpected company listing");
    records.set(record.symbol, projectCompanyRecord(record, batch.revision, at));
  }
  return { revision: batch.revision, records };
}

export async function verifyCompanyMatchPin(
  symbol: string,
  pin: import("../company-match-evidence").CompanyMatchPin,
) {
  try {
    const result = await readScannerCompanyBatch([symbol], pin.asOf, pin.revision);
    const record = result.records.get(symbol);
    if (!record?.evidence || !pin.fields.length) return false;
    return pin.fields.every(({ metric, value, accessions, operands }) => {
      const actual = metric === "recentFiling" ? record.forms : record.values[metric];
      return (
        JSON.stringify(actual) === JSON.stringify(value) &&
        JSON.stringify(record.evidence!.operands[metric]) === JSON.stringify(operands) &&
        JSON.stringify(record.evidence!.filingsByMetric[metric] ?? []) === JSON.stringify(accessions)
      );
    });
  } catch {
    return false;
  }
}
