import { Buffer } from "node:buffer";
import { createHash } from "node:crypto";

import {
  authorizeTraderIntelligenceOwner,
  withTraderIntelligenceOwnerRoute,
} from "@/src/lib/trader-intelligence-v3/auth";
import { resolveConfiguredServerRawBrokerCsvImportService } from "@/src/lib/trader-intelligence-v3/ingestion";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const modulePath =
  "app/api/intelligence/day-session-executions/v1/route.ts";
const MAX_EXECUTIONS = 200;

type ExecutionInput = {
  fees: string;
  price: string;
  quantity: string;
  side: "BUY" | "SELL";
  symbol: string;
  time: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function execution(value: unknown): ExecutionInput | null {
  if (!isRecord(value)) return null;
  if (
    typeof value.symbol !== "string" ||
    !/^[A-Z0-9._-]{1,32}$/.test(value.symbol) ||
    (value.side !== "BUY" && value.side !== "SELL") ||
    typeof value.time !== "string" ||
    !/^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(value.time) ||
    typeof value.quantity !== "string" ||
    !/^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(value.quantity) ||
    typeof value.price !== "string" ||
    !/^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(value.price) ||
    typeof value.fees !== "string" ||
    (value.fees !== "" && !/^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(value.fees))
  ) {
    return null;
  }
  return {
    fees: value.fees,
    price: value.price,
    quantity: value.quantity,
    side: value.side,
    symbol: value.symbol,
    time: value.time,
  };
}

function cell(value: string): string {
  return /[",\r\n]/.test(value)
    ? `"${value.replaceAll('"', '""')}"`
    : value;
}

function csv(sessionDate: string, executions: readonly ExecutionInput[]): string {
  return [
    "ExecutedAt,Symbol,Side,Quantity,Price,Commission,Fees,Currency",
    ...executions.map((item) =>
      [
        `${sessionDate} ${item.time}`,
        item.symbol,
        item.side,
        item.quantity,
        item.price,
        "0",
        item.fees || "0",
        "USD",
      ]
        .map(cell)
        .join(","),
    ),
  ].join("\n");
}

function response(status: number, code: string): Response {
  return Response.json(
    {
      error: {
        code,
        message: "The executions could not be saved.",
      },
    },
    { status },
  );
}

async function POSTHandler(request: Request): Promise<Response> {
  let body: Record<string, unknown>;
  try {
    const value = await request.json();
    if (!isRecord(value)) throw new Error();
    body = value;
  } catch {
    return response(400, "ti_v3_day_session_execution_payload_invalid");
  }
  const date = typeof body.date === "string" ? body.date : "";
  const rows = Array.isArray(body.executions)
    ? body.executions.map(execution)
    : [];
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    rows.length === 0 ||
    rows.length > MAX_EXECUTIONS ||
    rows.some((row) => row === null)
  ) {
    return response(400, "ti_v3_day_session_execution_payload_invalid");
  }
  const authorization = await authorizeTraderIntelligenceOwner({
    environment: process.env,
    localRequest: { headers: request.headers, requestUrl: request.url },
    modulePath,
  });
  if (!authorization.ok) {
    return response(503, "ti_v3_day_session_execution_unavailable");
  }
  const source = csv(date, rows as ExecutionInput[]);
  const digest = createHash("sha256")
    .update(source, "utf8")
    .digest("hex")
    .slice(0, 32);
  const service = resolveConfiguredServerRawBrokerCsvImportService({
    config: authorization.config,
    environment: process.env,
    owner: authorization.owner,
  });
  if (!service.ok) return response(503, service.error.code);
  const persisted = service.value.persist({
    brokerCode: "manual_entry",
    chargeCoverageState: "complete",
    columnMapping: {
      commission: "Commission",
      currency: "Currency",
      executedAt: "ExecutedAt",
      fees: "Fees",
      price: "Price",
      quantity: "Quantity",
      side: "Side",
      symbol: "Symbol",
    },
    csvUtf8: new Uint8Array(Buffer.from(source, "utf8")),
    defaultCurrency: "USD",
    sourceIdentity: `source_manual_${digest}`,
    sourceSystem: "manual_entry",
    sourceTimezoneEvidence: "America/New_York",
    timestampPrecision: "second",
  });
  if (!persisted.ok) return response(400, persisted.error.code);
  return Response.json(
    {
      acceptedExecutionCount: persisted.value.acceptedExecutionCount,
      persistenceDigest: persisted.value.persistenceDigest,
      status: "persisted",
    },
    { status: 201 },
  );
}

export const POST = withTraderIntelligenceOwnerRoute(modulePath, POSTHandler);
