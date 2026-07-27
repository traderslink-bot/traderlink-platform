import { compareUnicodeCodePoints } from "../../domain/canonical";
import type { CanonicalContentDigest } from "../../domain/identity";
import {
  finalizeContentAddressedAuthority,
  type AnalyticalContractFailure,
} from "../contracts";

export const EXECUTION_ANALYTICS_CAPABILITY_CATALOG_VERSION =
  "ti_v3_execution_analytics_capability_catalog_v1" as const;

export type ExecutionAnalyticsCapabilityState =
  | "available_with_exact_execution_authority"
  | "available_when_optional_execution_facts_are_complete"
  | "unsupported_without_new_execution_authority"
  | "reserved_for_future_engine";

export interface ExecutionAnalyticsCapability {
  readonly capabilityKey: string;
  readonly state: ExecutionAnalyticsCapabilityState;
  readonly requiredFacts: readonly string[];
  readonly supportedQueryFeatures: readonly string[];
  readonly limitationCodes: readonly string[];
  readonly explanation: string;
}

export interface ExecutionAnalyticsCapabilityCatalog {
  readonly schemaVersion: typeof EXECUTION_ANALYTICS_CAPABILITY_CATALOG_VERSION;
  readonly catalogKey: "ti_v3_execution_only_analytics_capabilities";
  readonly catalogVersion: "v1";
  readonly capabilities: readonly ExecutionAnalyticsCapability[];
  readonly catalogDigest: CanonicalContentDigest;
}

function capability(
  capabilityKey: string,
  state: ExecutionAnalyticsCapabilityState,
  requiredFacts: readonly string[],
  supportedQueryFeatures: readonly string[],
  limitationCodes: readonly string[],
  explanation: string,
): ExecutionAnalyticsCapability {
  return Object.freeze({
    capabilityKey,
    state,
    requiredFacts: Object.freeze([...requiredFacts].sort(compareUnicodeCodePoints)),
    supportedQueryFeatures: Object.freeze([...supportedQueryFeatures].sort(compareUnicodeCodePoints)),
    limitationCodes: Object.freeze([...limitationCodes].sort(compareUnicodeCodePoints)),
    explanation,
  });
}

const capabilities = Object.freeze([
  capability(
    "core_performance",
    "available_with_exact_execution_authority",
    ["closed round trips", "gross P/L", "signed charges", "net P/L"],
    ["aggregate metrics", "period grouping", "bounded evidence", "replay digest"],
    [],
    "Exact execution-only profitability, outcome, expectancy, and concentration metrics.",
  ),
  capability(
    "daily_and_period_performance",
    "available_with_exact_execution_authority",
    ["closed round trips", "verified session date", "net P/L"],
    ["day/week/month/year grouping", "date-range filter", "period comparison inputs"],
    [],
    "Daily and calendar performance, including per-day trade counts and outcomes.",
  ),
  capability(
    "time_and_session_performance",
    "available_with_exact_execution_authority",
    ["verified entry/exit timestamp", "verified session classification"],
    ["entry/exit time filter", "minute bucket grouping", "session filter and grouping"],
    [],
    "Time-of-day and canonical session performance without market-data inference.",
  ),
  capability(
    "sequencing_and_behavior",
    "available_with_exact_execution_authority",
    ["canonical entry order", "canonical completed-trade order", "net P/L", "stable instrument identity"],
    ["previous-outcome filter", "consecutive-streak filter", "trade-sequence grouping", "repeat-attempt grouping"],
    ["ti_v3_query_prior_streak_ambiguous_when_simultaneous_mixed_outcomes"],
    "After-win/loss, consecutive-streak, later-trade, and repeat-attempt behavior that is provable from order.",
  ),
  capability(
    "pre_entry_daily_state",
    "available_with_exact_execution_authority",
    ["canonical completed-trade order", "net P/L", "verified session date"],
    ["pre-entry green/red/flat filter", "peak-giveback path filter", "green-to-red path filter"],
    ["ti_v3_query_daily_path_ambiguous_when_simultaneous_mixed_outcomes"],
    "Performance conditioned on realized daily state before entry; no daily-goal or max-loss claim is made.",
  ),
  capability(
    "ticker_price_size_hold_direction",
    "available_when_optional_execution_facts_are_complete",
    ["stable instrument identity", "entry notional", "share quantity", "entry/exit timestamp", "direction"],
    ["symbol grouping", "price/size/hold filters", "bucket grouping", "direction grouping"],
    ["ti_v3_query_required_authority_unavailable"],
    "Ticker, entry-price, size, hold-time, and direction analytics when each required execution fact is complete.",
  ),
  capability(
    "broker_and_import_source",
    "available_when_optional_execution_facts_are_complete",
    ["uniform source identity across supporting executions", "broker code", "source evidence class"],
    ["source-identity filter and grouping", "source-kind filter and grouping", "broker-code filter and grouping"],
    ["ti_v3_analytics_mixed_source_authority", "ti_v3_query_source_authority_unavailable"],
    "Broker and import-source analytics never attribute a mixed-source round trip to a single source.",
  ),
  capability(
    "giveback_and_drawdown",
    "available_with_exact_execution_authority",
    ["canonical completed-trade order", "net P/L", "verified session date"],
    ["maximum realized drawdown", "peak-profit giveback", "trough-to-recovery magnitude", "green-to-red and red-to-green day counts"],
    ["ti_v3_query_daily_path_ambiguous_when_simultaneous_mixed_outcomes"],
    "Realized intraday path analytics only; it does not estimate unrealized drawdown.",
  ),
  capability(
    "charges_and_fee_impact",
    "available_when_optional_execution_facts_are_complete",
    ["gross P/L", "net P/L", "signed charges", "complete charge-kind allocation for named fees"],
    ["gross/net difference", "signed-charge total", "average and median signed charges", "commission total/average/median"],
    ["ti_v3_query_required_authority_unavailable", "ti_v3_query_charge_kind_coverage_unknown"],
    "Charge metrics are exact only when the imported execution records carry charge authority; named commission metrics additionally require a reconciled per-kind allocation.",
  ),
  capability(
    "deterministic_findings_and_samples",
    "available_with_exact_execution_authority",
    ["verified query result", "bounded query evidence", "included-trade counts"],
    ["content-addressed finding packet", "sufficient/insufficient/metric-unavailable sample state", "non-causal rule-to-test"],
    ["ti_v3_query_finding_sample_insufficient", "ti_v3_query_finding_net_pnl_unavailable"],
    "Agents can consume signed, evidence-linked findings with explicit sample status; the packet never presents a correlation as a causal conclusion.",
  ),
  capability(
    "tags_and_import_metadata",
    "unsupported_without_new_execution_authority",
    ["persisted setup/mistake/tag/import-batch facts in the v3 analytical row"],
    [],
    ["setup_tags_required", "mistake_tags_required", "import_metadata_authority_required"],
    "The current exact row intentionally does not expose legacy tags, notes, or import metadata as analytics authority.",
  ),
  capability(
    "market_and_exit_quality",
    "reserved_for_future_engine",
    ["market/candle evidence or alternative-outcome authority"],
    [],
    ["candle_data_required", "market_data_required", "exit_quality_or_alternative_outcome_authority_required"],
    "Chart context, setup quality, optimal exits, and counterfactual claims belong to later governed engines.",
  ),
].sort((left, right) => compareUnicodeCodePoints(left.capabilityKey, right.capabilityKey)));

const built = finalizeContentAddressedAuthority(
  "execution_analytics_capability_catalog",
  {
    schemaVersion: EXECUTION_ANALYTICS_CAPABILITY_CATALOG_VERSION,
    catalogKey: "ti_v3_execution_only_analytics_capabilities" as const,
    catalogVersion: "v1" as const,
    capabilities,
  },
  "catalogDigest",
);

if (!built.ok) {
  throw new Error(`${(built.error as AnalyticalContractFailure).code}:${built.error.path}`);
}

export const EXECUTION_ANALYTICS_CAPABILITY_CATALOG =
  built.value as ExecutionAnalyticsCapabilityCatalog;

export function getExecutionAnalyticsCapability(
  capabilityKey: string,
): ExecutionAnalyticsCapability | null {
  return EXECUTION_ANALYTICS_CAPABILITY_CATALOG.capabilities.find(
    (capability) => capability.capabilityKey === capabilityKey,
  ) ?? null;
}
