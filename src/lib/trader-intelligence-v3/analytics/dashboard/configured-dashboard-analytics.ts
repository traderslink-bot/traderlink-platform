import "server-only";

import { readFileSync } from "node:fs";
import { isAbsolute, join, resolve } from "node:path";

import type { TraderIntelligenceOwnerContext } from "../../domain";
import type { CanonicalContentDigest } from "../../domain/identity";
import type {
  TraderIntelligenceDeploymentConfig,
  TraderIntelligenceEnvironment,
} from "../../deployment";
import {
  resolveConfiguredServerRawBrokerCsvImportService,
  type PersistedExecutionAnalyticsAuthorityAttachment,
} from "../../ingestion";
import { buildAnalyticalPartitionReceipt } from "../dataset";
import {
  createSnapshotTradeQueryDatasetSource,
  tradeQueryAuthorityInput,
  TRADE_QUERY_PLAN_KEY,
  TRADE_QUERY_PLAN_SEMANTIC_VERSION,
  TRADE_QUERY_PLAN_VERSION,
  TRADE_QUERY_POLICY,
  type TradeQueryFilter,
  type TradeQueryGrouping,
  type TradeQueryMetricKey,
  type VerifiedTradeQueryDatasetSource,
} from "../query";
import {
  createServerExecutionAnalyticsDashboardAdapter,
  type ServerExecutionAnalyticsDashboardAdapter,
} from "./server-execution-analytics-dashboard-adapter";

export const CONFIGURED_DASHBOARD_ANALYTICS_BINDING_VERSION =
  "ti_v3_configured_dashboard_analytics_binding_v1" as const;

export type ConfiguredDashboardAnalyticsFailure = Readonly<{
  code:
    | "ti_v3_dashboard_analytics_binding_missing"
    | "ti_v3_dashboard_analytics_binding_invalid"
    | "ti_v3_dashboard_analytics_source_unavailable"
    | "ti_v3_dashboard_analytics_query_authority_unavailable";
  path: string;
}>;

export interface ConfiguredDashboardAnalytics {
  readonly source: VerifiedTradeQueryDatasetSource;
  readonly adapter: ServerExecutionAnalyticsDashboardAdapter;
  readonly currencies: readonly string[];
  /**
   * Accepted broker executions from the same fixed V3 authority that powers
   * analytics. These are activity facts, not a claim that every execution can
   * be paired into a completed round trip or a realized P/L result.
   */
  readonly executionActivity: readonly DashboardExecutionActivityRow[];
}

export interface DashboardExecutionActivityRow {
  readonly executionDigest: string;
  readonly executedAt: string;
  readonly date: string;
  readonly time: string;
  readonly symbol: string;
  readonly side: "buy" | "sell";
  readonly quantity: string;
  readonly price: string;
  readonly currency: string;
  readonly chargeCoverageState: "complete" | "unknown";
}

export interface DashboardQueryPlanSelection {
  readonly filters?: readonly TradeQueryFilter[];
  readonly grouping?: TradeQueryGrouping;
  readonly metrics: readonly TradeQueryMetricKey[];
}

type BindingDocument = Readonly<{
  schemaVersion: typeof CONFIGURED_DASHBOARD_ANALYTICS_BINDING_VERSION;
  persistenceDigests: readonly CanonicalContentDigest[];
  attachment: PersistedExecutionAnalyticsAuthorityAttachment;
}>;

let cachedAnalytics: Readonly<{
  key: string;
  value: ConfiguredDashboardAnalytics;
}> | null = null;

function failure(
  code: ConfiguredDashboardAnalyticsFailure["code"],
  path: string,
): { readonly ok: false; readonly error: ConfiguredDashboardAnalyticsFailure } {
  return { ok: false, error: { code, path } };
}

function bindingPath(
  environment: TraderIntelligenceEnvironment,
  config: TraderIntelligenceDeploymentConfig,
): string | null {
  if (config.persistence.kind !== "file") return null;
  const configured = environment.TRADER_INTELLIGENCE_V3_ANALYTICS_BINDING_PATH?.trim();
  if (configured !== undefined && configured.length > 0) {
    if (!isAbsolute(configured)) return null;
    return resolve(configured);
  }
  return join(
    config.persistence.parentPath,
    "trader-intelligence-v3-execution-analytics",
    "current-authority.json",
  );
}

function readBinding(path: string): BindingDocument | null {
  try {
    const value: unknown = JSON.parse(readFileSync(path, "utf8"));
    if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
    const record = value as Record<string, unknown>;
    if (
      record.schemaVersion !== CONFIGURED_DASHBOARD_ANALYTICS_BINDING_VERSION ||
      !Array.isArray(record.persistenceDigests) ||
      record.persistenceDigests.length === 0 ||
      record.persistenceDigests.some((digest) =>
        typeof digest !== "string" ||
        !/^ti_v3:canonical_content:v1:sha256:[0-9a-f]{64}$/.test(digest)) ||
      typeof record.attachment !== "object" ||
      record.attachment === null ||
      Array.isArray(record.attachment)
    ) return null;
    return value as BindingDocument;
  } catch {
    return null;
  }
}

/**
 * Resolves one fixed local execution authority. Owner/account scope and the
 * binding path remain server-held; the browser can never select either.
 */
export function resolveConfiguredDashboardAnalytics(args: {
  readonly owner: TraderIntelligenceOwnerContext;
  readonly config: TraderIntelligenceDeploymentConfig;
  readonly environment: TraderIntelligenceEnvironment;
}): { readonly ok: true; readonly value: ConfiguredDashboardAnalytics } | {
  readonly ok: false;
  readonly error: ConfiguredDashboardAnalyticsFailure;
} {
  const path = bindingPath(args.environment, args.config);
  if (path === null) return failure("ti_v3_dashboard_analytics_binding_invalid", "$.bindingPath");
  const binding = readBinding(path);
  if (binding === null) return failure("ti_v3_dashboard_analytics_binding_missing", "$.binding");
  const cacheKey = JSON.stringify({
    ownerId: args.owner.identity.ownerId,
    bindingPath: path,
    persistenceDigests: binding.persistenceDigests,
    attachment: binding.attachment,
  });
  if (cachedAnalytics?.key === cacheKey) {
    return { ok: true, value: cachedAnalytics.value };
  }
  const imports = resolveConfiguredServerRawBrokerCsvImportService(args);
  if (!imports.ok) return failure("ti_v3_dashboard_analytics_source_unavailable", imports.error.path);
  const authority = imports.value.createAnalyticsAuthoritySource(
    binding.persistenceDigests,
    binding.attachment,
  );
  if (!authority.ok) return failure("ti_v3_dashboard_analytics_source_unavailable", authority.error.path);
  const baseSource = createSnapshotTradeQueryDatasetSource(authority.value);
  let derivedDataset: ReturnType<typeof baseSource.readVerifiedDataset> | null = null;
  const source: VerifiedTradeQueryDatasetSource = Object.freeze({
    ...baseSource,
    readVerifiedDataset: () => {
      derivedDataset ??= baseSource.readVerifiedDataset();
      return derivedDataset;
    },
  });
  const acceptedExecutions = authority.value.readAcceptedExecutionActivity?.();
  if (acceptedExecutions === undefined || acceptedExecutions.length === 0) {
    return failure("ti_v3_dashboard_analytics_source_unavailable", "$.source");
  }
  const currencies = Object.freeze(
    [...new Set(acceptedExecutions.map((execution) => execution.content.currency))].sort(),
  );
  if (currencies.length === 0) {
    return failure("ti_v3_dashboard_analytics_source_unavailable", "$.currencies");
  }
  const executionActivity = Object.freeze(
    [...acceptedExecutions]
      .sort((left, right) =>
        right.content.executedAt.localeCompare(left.content.executedAt) ||
        right.canonicalContentDigest.localeCompare(left.canonicalContentDigest))
      .map((execution) => Object.freeze({
        executionDigest: execution.canonicalContentDigest,
        executedAt: execution.content.executedAt,
        date: execution.content.executedAt.slice(0, 10),
        time: `${execution.content.executedAt.slice(11, 19)} UTC`,
        symbol: execution.content.rawBrokerSymbol,
        side: execution.content.side,
        quantity: execution.content.quantity,
        price: execution.content.price,
        currency: execution.content.currency,
        chargeCoverageState: execution.content.chargeCoverageState,
      })),
  );
  const value = Object.freeze({
      source,
      adapter: createServerExecutionAnalyticsDashboardAdapter(source),
      currencies,
      executionActivity,
  });
  cachedAnalytics = Object.freeze({ key: cacheKey, value });
  return { ok: true, value };
}

/** Injects exact server authority into a safe dashboard query selection. */
export function buildConfiguredDashboardQueryPlan(
  analytics: ConfiguredDashboardAnalytics,
  currency: string,
  selection: DashboardQueryPlanSelection,
): { readonly ok: true; readonly value: unknown } | {
  readonly ok: false;
  readonly error: ConfiguredDashboardAnalyticsFailure;
} {
  const verified = analytics.source.readVerifiedDataset();
  if (!verified.ok) return failure("ti_v3_dashboard_analytics_query_authority_unavailable", "$.source");
  const partition = buildAnalyticalPartitionReceipt({
    schemaVersion: "ti_v3_analytical_partition_v1",
    datasetReceipt: verified.value.datasetReceipt,
    currency,
  });
  if (!partition.ok) return failure("ti_v3_dashboard_analytics_query_authority_unavailable", "$.currency");
  const authority = {
    datasetReceipt: verified.value.datasetReceipt,
    datasetDerivationReceipt: verified.value.derivationReceipt,
    partitionReceipt: partition.value,
  };
  return {
    ok: true,
    value: Object.freeze({
      schemaVersion: TRADE_QUERY_PLAN_VERSION,
      queryPlanKey: TRADE_QUERY_PLAN_KEY,
      queryPlanVersion: TRADE_QUERY_PLAN_SEMANTIC_VERSION,
      authority: tradeQueryAuthorityInput(authority),
      filters: selection.filters ?? [],
      grouping: selection.grouping ?? { kind: "aggregate" },
      metrics: selection.metrics,
      ordering: [{ by: "group_identity", metricKey: null, direction: "ascending" }],
      limits: {
        groupLimit: "256",
        resultRowLimit: "256",
        evidencePerGroup: "8",
        totalEvidenceLimit: "512",
        diagnosticLimit: "128",
      },
      policies: TRADE_QUERY_POLICY,
    }),
  };
}
