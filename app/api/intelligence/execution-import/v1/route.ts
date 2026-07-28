import { Buffer } from "node:buffer";

import {
  authorizeTraderIntelligenceOwner,
  withTraderIntelligenceOwnerRoute,
} from "@/src/lib/trader-intelligence-v3/auth";
import {
  resolveConfiguredServerRawBrokerCsvImportService,
  type RawBrokerCsvColumnMapping,
  type ServerRawBrokerCsvImportSubmission,
} from "@/src/lib/trader-intelligence-v3/ingestion";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROUTE_PATH = "app/api/intelligence/execution-import/v1/route.ts";
const MAX_SOURCE_BYTES = 8_000_000;
const MAX_REQUEST_CHARS = 12_000_000;
const REQUIRED_MAPPING = ["symbol", "executedAt", "side", "quantity", "price"] as const;
const OPTIONAL_MAPPING = ["currency", "commission", "fees", "netCashAmount", "orderId", "executionId"] as const;
const TIMESTAMP_PRECISIONS = new Set(["date", "minute", "second", "millisecond", "microsecond", "nanosecond"]);
const SUBMISSION_FIELDS = new Set([
  "csvBase64",
  "sourceIdentity",
  "sourceSystem",
  "brokerCode",
  "columnMapping",
  "defaultCurrency",
  "timestampPrecision",
  "sourceTimezoneEvidence",
  "chargeCoverageState",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseBase64(value: unknown): Uint8Array | null {
  if (typeof value !== "string" || !/^[A-Za-z0-9+/]+={0,2}$/.test(value)) return null;
  try {
    const decoded = Buffer.from(value, "base64");
    return decoded.toString("base64") === value && decoded.length <= MAX_SOURCE_BYTES
      ? new Uint8Array(decoded)
      : null;
  } catch {
    return null;
  }
}

function parseMapping(value: unknown): RawBrokerCsvColumnMapping | null {
  if (!isRecord(value)) return null;
  const keys = Object.keys(value);
  if (!REQUIRED_MAPPING.every((field) => keys.includes(field)) || !keys.every((field) => [...REQUIRED_MAPPING, ...OPTIONAL_MAPPING].includes(field as never))) {
    return null;
  }
  if (!Object.values(value).every((header) => typeof header === "string" && header.length > 0 && header.length <= 128)) return null;
  return value as RawBrokerCsvColumnMapping;
}

function safeSlug(value: unknown, prefix?: string): value is string {
  return typeof value === "string" && new RegExp(`^${prefix ?? ""}[a-z0-9][a-z0-9_-]{0,95}$`).test(value);
}

function parseSubmission(document: unknown): ServerRawBrokerCsvImportSubmission | null {
  if (!isRecord(document)) return null;
  if (Object.keys(document).some((key) => !SUBMISSION_FIELDS.has(key))) return null;
  const csvUtf8 = parseBase64(document.csvBase64);
  const columnMapping = parseMapping(document.columnMapping);
  if (
    csvUtf8 === null ||
    columnMapping === null ||
    !safeSlug(document.sourceIdentity, "source_") ||
    !safeSlug(document.sourceSystem) ||
    !safeSlug(document.brokerCode) ||
    typeof document.timestampPrecision !== "string" ||
    !TIMESTAMP_PRECISIONS.has(document.timestampPrecision) ||
    typeof document.sourceTimezoneEvidence !== "string" ||
    document.sourceTimezoneEvidence.length === 0 ||
    document.sourceTimezoneEvidence.length > 96 ||
    (document.defaultCurrency !== undefined && (typeof document.defaultCurrency !== "string" || !/^[A-Z]{3}$/.test(document.defaultCurrency))) ||
    (document.chargeCoverageState !== undefined && document.chargeCoverageState !== "complete" && document.chargeCoverageState !== "unknown")
  ) return null;
  return {
    csvUtf8,
    sourceIdentity: document.sourceIdentity,
    sourceSystem: document.sourceSystem,
    brokerCode: document.brokerCode,
    columnMapping,
    defaultCurrency: document.defaultCurrency as string | undefined,
    timestampPrecision: document.timestampPrecision as ServerRawBrokerCsvImportSubmission["timestampPrecision"],
    sourceTimezoneEvidence: document.sourceTimezoneEvidence,
    chargeCoverageState: document.chargeCoverageState as "complete" | "unknown" | undefined,
  };
}

function errorResponse(status: number, code: string): Response {
  return Response.json({
    contractVersion: "ti_v3_execution_import_response_v1",
    error: { code, message: "Execution import was rejected." },
  }, { status });
}

async function POSTHandler(request: Request): Promise<Response> {
  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_REQUEST_CHARS) {
    return errorResponse(413, "ti_v3_execution_import_payload_too_large");
  }
  let document: unknown;
  try {
    const body = await request.text();
    if (body.length > MAX_REQUEST_CHARS) {
      return errorResponse(413, "ti_v3_execution_import_payload_too_large");
    }
    document = JSON.parse(body);
  } catch {
    return errorResponse(400, "ti_v3_execution_import_payload_invalid");
  }
  const submission = parseSubmission(document);
  if (!submission) return errorResponse(400, "ti_v3_execution_import_payload_invalid");

  const authorization = await authorizeTraderIntelligenceOwner({
    environment: process.env,
    modulePath: ROUTE_PATH,
    localRequest: { headers: request.headers, requestUrl: request.url },
  });
  if (!authorization.ok) return errorResponse(503, "ti_v3_execution_import_unavailable");
  const service = resolveConfiguredServerRawBrokerCsvImportService({
    owner: authorization.owner,
    config: authorization.config,
    environment: process.env,
  });
  if (!service.ok) return errorResponse(503, service.error.code);
  const persisted = service.value.persist(submission);
  if (!persisted.ok) return errorResponse(400, persisted.error.code);
  return Response.json({
    contractVersion: "ti_v3_execution_import_response_v1",
    status: "persisted",
    persistenceDigest: persisted.value.persistenceDigest,
    sourceDocumentDigest: persisted.value.sourceDocumentDigest,
    acceptedExecutionCount: persisted.value.acceptedExecutionCount,
    rejectedRowCount: persisted.value.rejectedRowCount,
  }, { status: 201 });
}

export const POST = withTraderIntelligenceOwnerRoute(
  "app/api/intelligence/execution-import/v1/route.ts",
  POSTHandler,
);
