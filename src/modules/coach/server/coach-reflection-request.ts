import type { CoachReflectionPeriod } from "../contracts/reflection-loop-contracts";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/u;
const CURRENCY_PATTERN = /^[A-Z]{3}$/u;

export type CoachReflectionRequest = Readonly<{
  period: CoachReflectionPeriod;
  anchorDate: string | null;
  currency: string | null;
}>;

function first(value: string | string[] | null | undefined): string | null {
  return typeof value === "string" ? value : null;
}

function calendarDate(value: string): boolean {
  if (!DATE_PATTERN.test(value)) return false;
  const parsed = new Date(`${value}T12:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value;
}

export function parseCoachReflectionRequest(
  input: Readonly<{
    period?: string | string[] | null;
    date?: string | string[] | null;
    currency?: string | string[] | null;
  }>,
): CoachReflectionRequest {
  const requestedPeriod = first(input.period);
  const period: CoachReflectionPeriod = requestedPeriod === "weekly" ||
      requestedPeriod === "monthly"
    ? requestedPeriod
    : "daily";
  const requestedDate = first(input.date);
  const anchorDate = requestedDate && calendarDate(requestedDate)
    ? requestedDate
    : null;
  const requestedCurrency = first(input.currency)?.toUpperCase() ?? null;
  const currency = requestedCurrency && CURRENCY_PATTERN.test(requestedCurrency)
    ? requestedCurrency
    : null;
  return Object.freeze({ period, anchorDate, currency });
}
