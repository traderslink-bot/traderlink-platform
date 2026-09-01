import type { ManualExecutionInput } from "@/src/modules/journal/server/imports/journal-import-service";
import { withWritableJournalIntegrityRuntime } from "@/src/modules/journal/server/journal-integrity-runtime";
import {
  requireTraderLinkPlatformRequestScope,
  requireExpectedJournalAccountSelection,
} from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { requireJournalMutationRequest } from "@/src/modules/platform/server/authentication/journal-mutation-request-security";
import { isTraderLinkPlatformError, platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function string(record: JsonRecord, field: string): string {
  const value = record[field];
  if (typeof value !== "string") {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field });
  }
  return value;
}

function canonicalDecimal(value: string, field: string, positive = false): string {
  const trimmed = value.trim();
  const match = /^(-?)(\d+)(?:\.(\d+))?$/u.exec(trimmed);
  if (!match) platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field });
  const negative = match[1] === "-";
  const whole = (match[2] ?? "0").replace(/^0+(?=\d)/u, "");
  const fraction = (match[3] ?? "").replace(/0+$/u, "");
  const unsigned = fraction ? `${whole}.${fraction}` : whole;
  const canonical = unsigned === "0" ? "0" : `${negative ? "-" : ""}${unsigned}`;
  if (positive && (canonical === "0" || canonical.startsWith("-"))) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field });
  }
  return canonical;
}

function manualEntry(value: unknown): Readonly<{
  date: string;
  execution: ManualExecutionInput;
}> {
  if (!isRecord(value)) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "entry" });
  }
  const date = string(value, "date");
  const time = string(value, "time");
  const sourceTimezone = string(value, "sourceTimezone");
  const symbol = string(value, "symbol");
  const currency = string(value, "currency").toUpperCase();
  const side = string(value, "side").toLowerCase();
  const tradeIntent = string(value, "tradeIntent").replaceAll("-", "_");
  if (
    !/^\d{4}-\d{2}-\d{2}$/u.test(date) ||
    !/^\d{2}:\d{2}(?::\d{2})?$/u.test(time) ||
    !["buy", "sell"].includes(side) ||
    !["not_set", "day_trade", "swing"].includes(tradeIntent)
  ) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
      field: "manualEntry",
    });
  }
  const feesInput = string(value, "fees").trim();
  const canonicalFee = feesInput === ""
    ? null
    : canonicalDecimal(feesInput, "fees");
  if (canonicalFee?.startsWith("-")) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
      field: "fees",
    });
  }
  return Object.freeze({
    date,
    execution: Object.freeze({
      sourceTimestampText: `${date}, ${time.length === 5 ? `${time}:00` : time}`,
      sourceTimezone,
      normalizedSymbol: symbol,
      tradeCurrency: currency,
      side: side as "buy" | "sell",
      quantityDecimal: canonicalDecimal(string(value, "quantity"), "quantity", true),
      priceDecimal: canonicalDecimal(string(value, "price"), "price", true),
      feesDecimal: canonicalFee === null
        ? null
        : canonicalFee === "0" ? "0" : `-${canonicalFee}`,
      feeCurrency: canonicalFee === null ? null : currency,
      feeSignConvention: canonicalFee === null ? "not_reported" : "cash_effect",
      tradeIntent: tradeIntent as "not_set" | "day_trade" | "swing",
    }),
  });
}

export async function POST(request: Request): Promise<Response> {
  try {
    requireJournalMutationRequest(request);
    const scope = requireTraderLinkPlatformRequestScope(request.headers);
    const body: unknown = await request.json();
    if (!isRecord(body) || !Array.isArray(body.entries)) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
        field: "manualBatch",
      });
    }
    const idempotencyKey = string(body, "idempotencyKey");
    requireExpectedJournalAccountSelection(
      scope,
      body.expectedAccountSelectionRef,
    );
    if (body.entries.length < 1 || body.entries.length > 200) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
        field: "manualBatchSize",
      });
    }
    const parsed = body.entries.map(manualEntry);
    const accountId = scope.activeAccountId;
    if (!accountId) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    const result = withWritableJournalIntegrityRuntime(scope, (runtime) =>
      runtime.command.commitManualExecutions(scope, {
        accountId,
        idempotencyKey,
        sourceDisplayLabel: "Trade Tracker manual executions",
        entries: parsed.map((entry) => entry.execution),
      }));
    const groups = [...new Map(parsed.map((entry) => [entry.date, 0])).keys()]
      .sort()
      .map((date) => Object.freeze({
        date,
        executionCount: parsed.filter((entry) => entry.date === date).length,
      }));
    return Response.json({
      status: "ready",
      result: {
        importStatus: result.status,
        acceptedExecutionCount: result.executionIds.length,
        createdExecutionCount: result.createdExecutionCount,
        matchedExecutionCount: result.matchedExecutionCount,
        pendingDecisionCount: result.relatedDecisionIds.length,
        rebuildCount: result.rebuilds.length,
        groups,
      },
    });
  } catch (error) {
    const code = isTraderLinkPlatformError(error)
      ? error.code
      : "TRADERLINK_MANUAL_EXECUTION_COMMIT_FAILED";
    const status = code === "TRADERLINK_WORKSPACE_ACCESS_DENIED"
      ? 401
      : code.includes("CONFLICT")
        ? 409
        : 400;
    return Response.json({ status: "unavailable", code }, { status });
  }
}
