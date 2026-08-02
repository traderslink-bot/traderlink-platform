import { createHash } from "node:crypto";

import type {
  IbkrActivityStatementPreview,
  JournalAdapterExecution,
  JournalAdapterPositionFact,
  JournalAdapterSourceRow,
  JournalAssetClass,
  JournalImportIssue,
} from "../../contracts/journal-import-contracts";
import { assertJournalTimezone } from "../../contracts/journal-storage-values";
import { TraderLinkPlatformError } from "@/src/modules/platform/server/database/platform-migration-contract";
import {
  calculateSourceFileEvidence,
  decodeStrictUtf8Source,
  parseRecordPreservingCsv,
} from "./record-preserving-csv";
import {
  normalizeBrokerDecimal,
  normalizeIbkrExecutionTime,
  normalizeJournalCurrency,
  normalizeJournalStockSymbol,
} from "./journal-value-normalization";

const ADAPTER_ID = "ibkr_activity_statement" as const;
const ADAPTER_VERSION = "ibkr_activity_statement_v1" as const;
const PARSER_VERSION = "record_preserving_csv_v1" as const;
const MAPPING_VERSION = "ibkr_activity_statement_mapping_v1" as const;

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]/gu, "");
}

function normalizedAssetClass(value: string): JournalAssetClass {
  switch (normalizeHeader(value)) {
    case "stocks": return "stock";
    case "equityandindexoptions":
    case "options": return "option";
    case "forex": return "forex";
    case "futures": return "future";
    case "crypto":
    case "cryptocurrencies": return "crypto";
    default: return "other";
  }
}

function valueFor(
  row: ReadonlyMap<string, string>,
  ...aliases: readonly string[]
): string | null {
  for (const alias of aliases) {
    const value = row.get(normalizeHeader(alias));
    if (value !== undefined && value.trim() !== "") return value.trim();
  }
  return null;
}

function rowMap(fields: readonly string[], headers: readonly string[]): ReadonlyMap<string, string> {
  return new Map(headers.map((header, index) => [normalizeHeader(header), fields[index + 2] ?? ""]));
}

function isKnownSparseCodesRecord(
  normalizedSection: string,
  fields: readonly string[],
  headers: readonly string[],
): boolean {
  return normalizedSection === "codes" &&
    fields.length === 4 &&
    JSON.stringify(headers.map(normalizeHeader)) ===
      JSON.stringify(["code", "meaning", "codecont", "meaningcont"]);
}

const ENGLISH_MONTHS = Object.freeze(new Map<string, number>([
  ["january", 1], ["jan", 1], ["february", 2], ["feb", 2],
  ["march", 3], ["mar", 3], ["april", 4], ["apr", 4],
  ["may", 5], ["june", 6], ["jun", 6], ["july", 7], ["jul", 7],
  ["august", 8], ["aug", 8], ["september", 9], ["sep", 9], ["sept", 9],
  ["october", 10], ["oct", 10], ["november", 11], ["nov", 11],
  ["december", 12], ["dec", 12],
]));

function canonicalDate(year: number, month: number, day: number): string | null {
  const probe = new Date(Date.UTC(year, month - 1, day));
  if (
    year < 1900 || year > 9999 ||
    probe.getUTCFullYear() !== year ||
    probe.getUTCMonth() !== month - 1 ||
    probe.getUTCDate() !== day
  ) return null;
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function toDate(value: string): string | null {
  const normalized = value.trim();
  const iso = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/u);
  if (iso) return canonicalDate(Number(iso[1]), Number(iso[2]), Number(iso[3]));
  const compact = normalized.match(/^(\d{4})(\d{2})(\d{2})$/u);
  if (compact) {
    return canonicalDate(Number(compact[1]), Number(compact[2]), Number(compact[3]));
  }
  const slashed = normalized.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/u);
  if (slashed) {
    return canonicalDate(Number(slashed[3]), Number(slashed[1]), Number(slashed[2]));
  }
  const named = normalized.match(/^([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})$/u);
  if (!named) return null;
  const month = ENGLISH_MONTHS.get(named[1].toLowerCase());
  return month ? canonicalDate(Number(named[3]), month, Number(named[2])) : null;
}

function statementPeriod(value: string): readonly [string, string] | null {
  const normalized = value.replace(/[\u2013\u2014]/gu, "-").trim();
  const parts = normalized.split(/\s+-\s+/u);
  if (parts.length !== 2) return null;
  const start = toDate(parts[0]);
  const end = toDate(parts[1]);
  return start && end && end >= start ? Object.freeze([start, end]) : null;
}

function localDateFromSourceTimestamp(value: string): string | null {
  const compact = value.match(/^(\d{4})(\d{2})(\d{2})/u);
  if (compact) return `${compact[1]}-${compact[2]}-${compact[3]}`;
  const dashed = value.match(/^(\d{4}-\d{2}-\d{2})/u);
  if (dashed) return dashed[1];
  const slashed = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/u);
  if (!slashed) return null;
  return `${slashed[3]}-${slashed[1].padStart(2, "0")}-${slashed[2].padStart(2, "0")}`;
}

function issue(
  recordOrdinal: number | null,
  issueCode: string,
  severity: "info" | "warning" | "error",
  isBlocking = false,
  issueScope: JournalImportIssue["issueScope"] = recordOrdinal === null ? "import" : "row",
  chainHint?: JournalImportIssue["chainHint"],
): JournalImportIssue {
  return Object.freeze({
    recordOrdinal,
    issueScope,
    issueCode,
    severity,
    isBlocking,
    ...(chainHint ? { chainHint } : {}),
  });
}

function boundedSourceMetadata(
  value: string | undefined,
  maximumLength: number,
): string | null {
  const normalized = value?.trim() ?? "";
  return normalized.length >= 1 && normalized.length <= maximumLength
    ? normalized
    : null;
}

function stockExecutionChainHint(
  symbol: string | null,
  currency: string | null,
  sourceTimestampText: string | null,
  sourceTimezone: string,
): JournalImportIssue["chainHint"] | undefined {
  if (!symbol || !currency) return undefined;
  try {
    let effectiveAtUtc: string | null = null;
    if (sourceTimestampText) {
      try {
        effectiveAtUtc = normalizeIbkrExecutionTime(
          sourceTimestampText,
          sourceTimezone,
        );
      } catch (error) {
        if (!(error instanceof TraderLinkPlatformError)) throw error;
        effectiveAtUtc = null;
      }
    }
    return Object.freeze({
      normalizedSymbol: normalizeJournalStockSymbol(symbol),
      assetClass: "stock" as const,
      tradeCurrency: normalizeJournalCurrency(currency),
      effectiveAtUtc,
    });
  } catch (error) {
    if (!(error instanceof TraderLinkPlatformError)) throw error;
    return undefined;
  }
}

type PendingExecution = Omit<JournalAdapterExecution, "contentOccurrenceOrdinal">;

function mapStockExecution(
  recordOrdinal: number,
  data: ReadonlyMap<string, string>,
  sourceTimezone: string,
  issues: JournalImportIssue[],
): PendingExecution | null {
  const symbol = valueFor(data, "Symbol");
  const currencyText = valueFor(data, "Currency");
  const timestamp = valueFor(data, "Date/Time", "Trade Date", "TradeDate");
  const quantityText = valueFor(data, "Quantity", "Qty");
  const priceText = valueFor(data, "T. Price", "Trade Price", "TradePrice", "Price");
  const chainHint = stockExecutionChainHint(
    symbol,
    currencyText,
    timestamp,
    sourceTimezone,
  );
  if (!symbol || !currencyText || !timestamp || !quantityText) {
    issues.push(issue(
      recordOrdinal,
      "execution_required_fact_missing",
      "warning",
      false,
      "execution",
      chainHint,
    ));
    return null;
  }
  try {
    const signedQuantity = normalizeBrokerDecimal(quantityText, "quantityDecimal");
    if (signedQuantity === "0") {
      issues.push(issue(
        recordOrdinal,
        "execution_zero_quantity",
        "warning",
        false,
        "execution",
        chainHint,
      ));
      return null;
    }
    const side = signedQuantity.startsWith("-") ? "sell" as const : "buy" as const;
    const quantityDecimal = signedQuantity.startsWith("-") ? signedQuantity.slice(1) : signedQuantity;
    const tradeCurrency = normalizeJournalCurrency(currencyText);
    const executedAtUtc = normalizeIbkrExecutionTime(timestamp, sourceTimezone);
    let priceDecimal: string | null = null;
    if (priceText) priceDecimal = normalizeBrokerDecimal(priceText, "priceDecimal", { positive: true });
    else issues.push(issue(
      recordOrdinal,
      "execution_price_missing",
      "warning",
      false,
      "execution",
      chainHint,
    ));
    const feeText = valueFor(data, "Comm/Fee", "IBCommission", "Commission", "Fee", "Fees");
    const feesDecimal = feeText ? normalizeBrokerDecimal(feeText, "feesDecimal") : null;
    const normalizedSymbol = normalizeJournalStockSymbol(symbol);
    const content = JSON.stringify([
      "execution-content-v1", "stock", normalizedSymbol, tradeCurrency,
      executedAtUtc, side, quantityDecimal, priceDecimal,
    ]);
    const normalizedContentIdentity = sha256(content);
    const providerIdentityText = valueFor(data, "TradeID", "Trade ID", "IBExecID");
    const providerExecutionIdentity = providerIdentityText &&
      providerIdentityText.length <= 256 &&
      !/[\u0000-\u001f\u007f]/u.test(providerIdentityText)
      ? providerIdentityText
      : null;
    if (providerIdentityText && !providerExecutionIdentity) {
      issues.push(issue(
        recordOrdinal,
        "provider_execution_identity_invalid",
        "warning",
        false,
        "execution",
        chainHint,
      ));
    }
    return Object.freeze({
      recordOrdinal, normalizedSymbol, assetClass: "stock", tradeCurrency,
      sourceTimestampText: timestamp, sourceTimezone, executedAtUtc,
      timeParserVersion: "ibkr_datetime_v1",
      sourceOrderKey: `${executedAtUtc}|${normalizedContentIdentity}`,
      side, quantityDecimal, priceDecimal, feesDecimal,
      feeCurrency: feesDecimal === null ? null : tradeCurrency,
      feeSignConvention: feesDecimal === null ? "not_reported" : "broker_reported_signed",
      factCompleteness: priceDecimal === null ? "price_missing" : "complete",
      providerExecutionIdentity,
      normalizedContentIdentity,
    });
  } catch (error) {
    if (!(error instanceof TraderLinkPlatformError)) throw error;
    const issueCode = error instanceof TraderLinkPlatformError &&
      error.safeContext.reason === "local_time_ambiguous"
      ? "execution_time_ambiguous"
      : "execution_fact_invalid";
    issues.push(issue(
      recordOrdinal,
      issueCode,
      "warning",
      false,
      "execution",
      chainHint,
    ));
    return null;
  }
}

function mapPositionFacts(
  section: string,
  recordOrdinal: number,
  data: ReadonlyMap<string, string>,
  period: readonly [string, string] | null,
  sourceTimezone: string,
  executionCurrenciesBySymbol: ReadonlyMap<string, ReadonlySet<string>>,
  issues: JournalImportIssue[],
): readonly JournalAdapterPositionFact[] {
  const assetClass = normalizedAssetClass(valueFor(data, "Asset Category") ?? "");
  if (assetClass !== "stock") return Object.freeze([]);
  const normalizedSection = normalizeHeader(section);
  const candidates: Array<Readonly<{
    raw: string;
    factKind: JournalAdapterPositionFact["factKind"];
    dateIndex: 0 | 1;
    timePrecision: "day_start" | "day_end";
  }>> = [];
  const addCandidate = (
    raw: string | null,
    factKind: JournalAdapterPositionFact["factKind"],
    dateIndex: 0 | 1,
    timePrecision: "day_start" | "day_end",
  ) => {
    if (raw !== null) candidates.push({ raw, factKind, dateIndex, timePrecision });
  };
  if (normalizedSection === "marktomarketperformancesummary") {
    addCandidate(valueFor(data, "Prior Quantity"), "opening_balance", 0, "day_start");
    addCandidate(valueFor(data, "Current Quantity"), "closing_balance", 1, "day_end");
  } else if (normalizedSection === "openpositions") {
    addCandidate(valueFor(data, "Quantity"), "open_position", 1, "day_end");
  }
  if (candidates.length === 0) return Object.freeze([]);
  let normalizedSymbol: string | null = null;
  let currency: string | null = null;
  const chainHintFor = (
    candidate: typeof candidates[number],
  ): JournalImportIssue["chainHint"] | undefined => {
    if (!normalizedSymbol || !currency) return undefined;
    let effectiveAtUtc: string | null = null;
    if (period) {
      const clock = candidate.timePrecision === "day_start"
        ? "00:00:00"
        : "23:59:59";
      try {
        effectiveAtUtc = normalizeIbkrExecutionTime(
          `${period[candidate.dateIndex]}, ${clock}`,
          sourceTimezone,
        );
      } catch (error) {
        if (!(error instanceof TraderLinkPlatformError)) throw error;
        effectiveAtUtc = null;
      }
    }
    return Object.freeze({
      normalizedSymbol,
      assetClass,
      tradeCurrency: currency,
      effectiveAtUtc,
    });
  };
  const addIssues = (reason: string) => {
    for (const candidate of candidates) {
      issues.push(issue(
        recordOrdinal,
        `position_fact_${candidate.factKind}_${reason}`,
        "warning",
        false,
        "position_fact",
        chainHintFor(candidate),
      ));
    }
  };
  const symbol = valueFor(data, "Symbol");
  if (!symbol) {
    addIssues("symbol_missing");
    return Object.freeze([]);
  }
  try { normalizedSymbol = normalizeJournalStockSymbol(symbol); }
  catch (error) {
    if (!(error instanceof TraderLinkPlatformError)) throw error;
    addIssues("symbol_invalid");
    return Object.freeze([]);
  }
  const inferredCurrencies = executionCurrenciesBySymbol.get(normalizedSymbol);
  const currencyText = valueFor(data, "Currency") ??
    (inferredCurrencies?.size === 1 ? [...inferredCurrencies][0] : null);
  if (!currencyText) {
    addIssues("currency_missing");
    return Object.freeze([]);
  }
  try { currency = normalizeJournalCurrency(currencyText); }
  catch (error) {
    if (!(error instanceof TraderLinkPlatformError)) throw error;
    addIssues("currency_invalid");
    return Object.freeze([]);
  }
  if (!period) {
    addIssues("period_unresolved");
    return Object.freeze([]);
  }
  const facts: JournalAdapterPositionFact[] = [];
  for (const candidate of candidates) {
    try {
      facts.push(Object.freeze({
        recordOrdinal, normalizedSymbol, assetClass,
        currency, factKind: candidate.factKind,
        effectiveLocalDate: period[candidate.dateIndex],
        timePrecision: candidate.timePrecision,
        quantityDecimal: normalizeBrokerDecimal(candidate.raw, "positionQuantity"),
      }));
    } catch (error) {
      if (!(error instanceof TraderLinkPlatformError)) throw error;
      issues.push(issue(
        recordOrdinal,
        `position_fact_${candidate.factKind}_quantity_invalid`,
        "warning",
        false,
        "position_fact",
        chainHintFor(candidate),
      ));
    }
  }
  return Object.freeze(facts);
}

export function previewIbkrActivityStatement(input: Readonly<{
  sourceBytes: Uint8Array;
  sourceTimezone: string;
}>): IbkrActivityStatementPreview {
  assertJournalTimezone(input.sourceTimezone, "sourceTimezone");
  const evidence = calculateSourceFileEvidence(input.sourceBytes);
  const records = parseRecordPreservingCsv(decodeStrictUtf8Source(input.sourceBytes));
  const headersBySection = new Map<string, readonly string[]>();
  const issues: JournalImportIssue[] = [];
  const pendingExecutions: PendingExecution[] = [];
  const positionFacts: JournalAdapterPositionFact[] = [];
  const classifications = new Map<number, JournalAdapterSourceRow["classification"]>();
  const assetCategories = new Map<number, string>();
  const sourceAccountIds = new Map<string, string>();
  const statementPeriods = new Map<string, readonly [string, string]>();
  let invalidStatementPeriodObserved = false;
  const observedCoverageAssets = new Set<JournalAssetClass>();

  for (const record of records) {
    const section = record.fields[0]?.trim() ?? "";
    const recordType = record.fields[1]?.trim() ?? "";
    const normalizedSection = normalizeHeader(section);
    const normalizedRecordType = normalizeHeader(recordType);
    classifications.set(record.recordOrdinal, "automatic_non_execution");
    if (normalizedRecordType === "header") {
      headersBySection.set(normalizedSection, Object.freeze(record.fields.slice(2)));
      continue;
    }
    if (normalizedRecordType !== "data") continue;
    const headers = headersBySection.get(normalizedSection);
    if (!headers) {
      classifications.set(record.recordOrdinal, "needs_correction");
      issues.push(issue(record.recordOrdinal, "section_header_missing", "error", true));
      continue;
    }
    if (
      record.fields.length !== headers.length + 2 &&
      !isKnownSparseCodesRecord(normalizedSection, record.fields, headers)
    ) {
      classifications.set(record.recordOrdinal, "needs_correction");
      issues.push(issue(
        record.recordOrdinal,
        "source_record_field_count_mismatch",
        "error",
        true,
      ));
      continue;
    }
    const data = rowMap(record.fields, headers);
    const assetCategory = valueFor(data, "Asset Category");
    if (assetCategory) assetCategories.set(record.recordOrdinal, assetCategory);
    if (normalizedSection === "accountinformation") {
      const fieldName = valueFor(data, "Field Name");
      if (fieldName && normalizeHeader(fieldName) === "account") {
        const accountId = valueFor(data, "Field Value");
        if (
          accountId &&
          accountId.length <= 256 &&
          !/[\u0000-\u001f\u007f]/u.test(accountId)
        ) {
          sourceAccountIds.set(accountId.trim().toUpperCase(), accountId);
        } else {
          classifications.set(record.recordOrdinal, "needs_correction");
          issues.push(issue(
            record.recordOrdinal,
            "source_account_identity_invalid",
            "error",
            true,
            "row",
          ));
        }
      }
    }
    if (normalizedSection === "statement") {
      const fieldName = valueFor(data, "Field Name");
      if (fieldName && normalizeHeader(fieldName) === "period") {
        const value = valueFor(data, "Field Value");
        if (value) {
          const candidate = statementPeriod(value);
          if (candidate) statementPeriods.set(candidate.join("/"), candidate);
          else invalidStatementPeriodObserved = true;
        }
      }
    }
    if (normalizedSection === "trades") {
      const assetClass = normalizedAssetClass(valueFor(data, "Asset Category") ?? "");
      observedCoverageAssets.add(assetClass);
      const discriminator = normalizeHeader(valueFor(data, "DataDiscriminator") ?? "order");
      if (discriminator !== "order") continue;
      if (assetClass === "stock") {
        const execution = mapStockExecution(record.recordOrdinal, data, input.sourceTimezone, issues);
        classifications.set(record.recordOrdinal, execution ? "mapped_execution" : "needs_correction");
        if (execution) pendingExecutions.push(execution);
      } else {
        classifications.set(record.recordOrdinal, "unsupported");
        issues.push(issue(record.recordOrdinal, assetClass === "forex" ? "equity_journal_not_enabled" : "asset_class_not_enabled", "info"));
      }
    }
  }

  const rawSourceAccountId = sourceAccountIds.size === 1
    ? ([...sourceAccountIds.values()][0] ?? null)
    : null;
  if (sourceAccountIds.size === 0) {
    if (!issues.some((candidate) =>
      candidate.issueCode === "source_account_identity_invalid")) {
      issues.push(issue(null, "source_account_identity_missing", "error", true));
    }
  } else if (sourceAccountIds.size > 1) {
    issues.push(issue(null, "source_account_identity_conflict", "error", true));
  }
  const period = statementPeriods.size === 1 && !invalidStatementPeriodObserved
    ? ([...statementPeriods.values()][0] ?? null)
    : null;
  if (statementPeriods.size > 1 || (statementPeriods.size > 0 && invalidStatementPeriodObserved)) {
    issues.push(issue(null, "statement_period_conflict", "warning"));
  } else if (!period) {
    issues.push(issue(null, "statement_period_missing", "warning"));
  }

  const executionOccurrences = new Map<string, number>();
  const executions = pendingExecutions.map((execution) => {
    const contentOccurrenceOrdinal = (executionOccurrences.get(execution.normalizedContentIdentity) ?? 0) + 1;
    executionOccurrences.set(execution.normalizedContentIdentity, contentOccurrenceOrdinal);
    return Object.freeze({
      ...execution,
      sourceOrderKey: `${execution.executedAtUtc}|${execution.normalizedContentIdentity}|${String(contentOccurrenceOrdinal).padStart(8, "0")}`,
      contentOccurrenceOrdinal,
    });
  });

  const executionCurrenciesBySymbol = new Map<string, Set<string>>();
  for (const execution of executions) {
    const currencies = executionCurrenciesBySymbol.get(execution.normalizedSymbol) ?? new Set<string>();
    currencies.add(execution.tradeCurrency);
    executionCurrenciesBySymbol.set(execution.normalizedSymbol, currencies);
  }

  for (const record of records) {
    const section = record.fields[0]?.trim() ?? "";
    const normalizedSection = normalizeHeader(section);
    if (!["marktomarketperformancesummary", "openpositions"].includes(normalizedSection)) continue;
    const headers = headersBySection.get(normalizedSection);
    if (
      !headers ||
      normalizeHeader(record.fields[1] ?? "") !== "data" ||
      record.fields.length !== headers.length + 2
    ) continue;
    const issueCountBeforeMapping = issues.length;
    const mapped = mapPositionFacts(
      section,
      record.recordOrdinal,
      rowMap(record.fields, headers),
      period,
      input.sourceTimezone,
      executionCurrenciesBySymbol,
      issues,
    );
    if (mapped.length > 0) {
      positionFacts.push(...mapped);
      for (const fact of mapped) observedCoverageAssets.add(fact.assetClass);
    }
    if (issues.length > issueCountBeforeMapping) {
      classifications.set(record.recordOrdinal, "needs_correction");
    } else if (mapped.length > 0) {
      classifications.set(record.recordOrdinal, "mapped_position_fact");
    }
  }

  const sourceRows = records.map((record) => Object.freeze({
    ...record,
    sectionName: boundedSourceMetadata(record.fields[0], 120),
    recordType: boundedSourceMetadata(record.fields[1], 120),
    assetCategory: boundedSourceMetadata(
      assetCategories.get(record.recordOrdinal),
      64,
    ),
    classification: classifications.get(record.recordOrdinal) ?? "automatic_non_execution",
  }));
  const coverageIntervals = [...observedCoverageAssets].map((assetClass) => {
    const executionDates = executions.filter((execution) => execution.assetClass === assetClass)
      .map((execution) => localDateFromSourceTimestamp(execution.sourceTimestampText)).filter((value): value is string => value !== null).sort();
    const localStartDate = period?.[0] ?? executionDates[0];
    const localEndDate = period?.[1] ?? executionDates.at(-1);
    return localStartDate && localEndDate ? Object.freeze({
      assetClass, coverageKind: period ? "complete" as const : "unknown" as const,
      localStartDate, localEndDate, sourceTimezone: input.sourceTimezone,
    }) : null;
  }).filter((value): value is NonNullable<typeof value> => value !== null);

  return Object.freeze({
    adapterId: ADAPTER_ID, adapterVersion: ADAPTER_VERSION,
    parserVersion: PARSER_VERSION, mappingVersion: MAPPING_VERSION,
    mappingContract: Object.freeze({
      contractVersion: MAPPING_VERSION,
      recordIdentity: "source_file_sha256_plus_one_based_record_ordinal",
      stockExecutionSection: "Trades/Data/Order/Stocks",
      unsupportedAssetPolicy: "preserve_with_explicit_coverage",
    }),
    sourceFileSha256: evidence.sha256, sourceFileSizeBytes: evidence.sizeBytes,
    rawSourceAccountId, statementPeriodStartDate: period?.[0] ?? null,
    statementPeriodEndDate: period?.[1] ?? null, sourceTimezone: input.sourceTimezone,
    rows: Object.freeze(sourceRows), issues: Object.freeze(issues),
    coverageIntervals: Object.freeze(coverageIntervals),
    executions: Object.freeze(executions), positionFacts: Object.freeze(positionFacts),
  });
}
