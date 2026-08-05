import "server-only";

import Decimal from "decimal.js";

import type { JournalCalendarReadModel } from "@/src/modules/journal-analytics/contracts/journal-dashboard-read-models";
import { openPlatformDatabase } from "../database/open-platform-database";
import type { PlatformReportingCurrency } from "../identity/platform-user-preference-repository";
import {
  convertUsdReportingAmount,
  loadUsdReportingRates,
} from "./bank-of-canada-fx-rate-service";

const ReportingDecimal = Decimal.clone({ precision: 40, rounding: Decimal.ROUND_HALF_UP });

export type WorkspaceReportingSummary = Readonly<{
  reportingCurrency: PlatformReportingCurrency;
  status: "native_usd" | "ready" | "unavailable";
  convertedNetPnlDecimal: string | null;
  convertedTradingDayCount: number;
  tradingDayCount: number;
}>;

function sumExactDecimals(values: readonly string[]): string {
  const total = values.reduce(
    (sum, value) => sum.plus(value),
    new ReportingDecimal(0),
  );
  const fixed = total.toFixed();
  return fixed.includes(".")
    ? fixed.replace(/0+$/u, "").replace(/\.$/u, "")
    : fixed;
}

export async function getWorkspaceReportingSummary(
  calendar: JournalCalendarReadModel,
  reportingCurrency: PlatformReportingCurrency,
): Promise<WorkspaceReportingSummary> {
  const usdTradingDays = calendar.currency === "USD"
    ? calendar.days.filter((day) => day.pnlDecimal !== null)
    : [];
  if (reportingCurrency === "USD") {
    return Object.freeze({
      reportingCurrency,
      status: "native_usd",
      convertedNetPnlDecimal: null,
      convertedTradingDayCount: 0,
      tradingDayCount: usdTradingDays.length,
    });
  }
  if (calendar.currency !== "USD" || usdTradingDays.length === 0) {
    return Object.freeze({
      reportingCurrency,
      status: "unavailable",
      convertedNetPnlDecimal: null,
      convertedTradingDayCount: 0,
      tradingDayCount: usdTradingDays.length,
    });
  }
  try {
    const database = openPlatformDatabase({ mode: "runtime" });
    try {
      const rates = await loadUsdReportingRates(database, {
        targetCurrency: reportingCurrency,
        sourceDates: usdTradingDays.map((day) => day.date),
      });
      const converted = usdTradingDays.flatMap((day) => {
        const rate = rates.get(day.date);
        return rate ? [convertUsdReportingAmount(day.pnlDecimal as string, rate)] : [];
      });
      return Object.freeze({
        reportingCurrency,
        status: converted.length === usdTradingDays.length ? "ready" : "unavailable",
        convertedNetPnlDecimal: converted.length === usdTradingDays.length
          ? sumExactDecimals(converted)
          : null,
        convertedTradingDayCount: converted.length,
        tradingDayCount: usdTradingDays.length,
      });
    } finally {
      database.close();
    }
  } catch {
    return Object.freeze({
      reportingCurrency,
      status: "unavailable",
      convertedNetPnlDecimal: null,
      convertedTradingDayCount: 0,
      tradingDayCount: usdTradingDays.length,
    });
  }
}
