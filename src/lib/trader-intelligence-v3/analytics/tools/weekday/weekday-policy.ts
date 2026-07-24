import {
  createCanonicalContentIdentity,
  type CanonicalContentDigest,
} from "../../../domain";
import type { ExactResult } from "../../../domain/exact";
import {
  contractFailure,
  validateContractRecord,
  type AnalyticalContractFailure,
} from "../../contracts/contract-validation";
import {
  NORMALIZED_ANALYSIS_ARGUMENTS_VERSION,
  TOOL_REGISTRY_ENTRY_VERSION,
  buildNormalizedAnalysisArguments,
  buildToolRegistryEntry,
  verifyNormalizedAnalysisArguments,
  type NormalizedAnalysisArguments,
  type ToolRegistryEntry,
} from "../../registry";
import type { CanonicalWeekday } from "../../adapters/session-policy";

export const WEEKDAY_TOOL_KEY = "analyze_performance_by_weekday" as const;
export const WEEKDAY_TOOL_VERSION = "v1" as const;
export const WEEKDAY_TOOL_POLICY = Object.freeze({
  key: "ti_v3_weekday_analysis_policy",
  version: "v2",
  comparisonPolicy: "all_other_represented_weekdays_v1",
  evidenceSamplePolicy: "ti_v3_weekday_conservative_evidence_v1",
  outlierPolicy: "ti_v3_weekday_outlier_contribution_v1",
  outlierMaximumContributionNumerator: "2",
  outlierMaximumContributionDenominator: "5",
  defaultTargetWeekday: "friday",
  outlierConcentrationPolicy:
    "maximum_of_absolute_activity_and_absolute_relevant_net_contribution_v1",
  afterLossPolicy:
    "latest_strictly_completed_before_decision_same_account_currency_session_v2",
  simultaneousCompletionPolicy:
    "same_outcome_equivalent_conflicting_outcomes_unavailable_v1",
  flatTradePolicy: "flat_resets_previous_loss_state",
  firstTradePolicy: "first_trade_has_no_prior_completed_trade",
} as const);

export const WEEKDAY_EXCLUSION_CLASSIFICATION_POLICY = Object.freeze({
  policyKey: "ti_v3_weekday_exclusion_classification",
  policyVersion: "v1",
  intentional_filter: Object.freeze([
    "ti_v3_analytics_canonical_filter_excluded",
    "ti_v3_analytics_manifest_excluded",
    "ti_v3_analytics_open_or_incomplete_lifecycle",
    "ti_v3_analytics_mixed_currency",
  ]),
  evidence_coverage: Object.freeze([
    "ti_v3_analytics_round_trip_inventory_missing",
    "ti_v3_analytics_execution_evidence_missing_or_foreign",
    "ti_v3_analytics_occurrence_evidence_missing_or_foreign",
    "ti_v3_analytics_exact_financial_fact_unavailable",
  ]),
  reconstruction: Object.freeze([
    "ti_v3_analytics_reconstruction_blocked",
    "ti_v3_analytics_reconstruction_ambiguous",
    "ti_v3_analytics_catalog_reconstruction_mismatch",
  ]),
  eligibility: Object.freeze([
    "ti_v3_analytics_eligibility_blocked",
    "ti_v3_analytics_eligibility_pending",
    "ti_v3_analytics_eligibility_incompatible",
  ]),
  stale: Object.freeze(["ti_v3_analytics_eligibility_stale"]),
  authority: Object.freeze([
    "ti_v3_analytics_instrument_unresolved",
    "ti_v3_analytics_session_unprovable",
    "ti_v3_analytics_economic_order_unprovable",
    "ti_v3_analytics_duplicate_candidate_identity",
    "ti_v3_analytics_input_oversized",
  ]),
} as const);

export const WEEKDAY_LIMITATION_PROJECTION_POLICY = Object.freeze({
  policyKey: "ti_v3_weekday_limitation_projection",
  policyVersion: "v1",
  artifactVisible:
    "all_applicable_b1_and_b2_limitation_codes_on_every_exact_table",
  claimBlocking:
    "coverage_reconstruction_eligibility_stale_authority_sample_direction_and_outlier",
  informational:
    "intentional_filter_and_partial_optional_decomposition_coverage",
  seriesProjection: "exact_source_table_limitation_equality",
  claimProjection: "exact_source_table_plus_evidence_limitation_union",
  receiptProjection: "exact_artifact_limitation_union",
} as const);

export type WeekdayExclusionClass =
  | "intentional_filter"
  | "evidence_coverage"
  | "reconstruction"
  | "eligibility"
  | "stale"
  | "authority"
  | "unknown";

export function classifyWeekdayExclusionReason(
  reasonCode: string,
): WeekdayExclusionClass {
  for (const classification of [
    "intentional_filter",
    "evidence_coverage",
    "reconstruction",
    "eligibility",
    "stale",
    "authority",
  ] as const) {
    if (
      (WEEKDAY_EXCLUSION_CLASSIFICATION_POLICY[classification] as readonly string[])
        .includes(reasonCode)
    ) return classification;
  }
  return "unknown";
}

export function weekdayExclusionBlocksClaim(reasonCode: string): boolean {
  return classifyWeekdayExclusionReason(reasonCode) !== "intentional_filter";
}

export const WEEKDAY_SEMANTIC_ORDER = Object.freeze([
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const);

const WEEKDAY_SET = new Set<CanonicalWeekday>(WEEKDAY_SEMANTIC_ORDER);

const argumentSchema = createCanonicalContentIdentity(
  "canonical_content",
  "v1",
  {
    schemaKey: "ti_v3_weekday_analysis_arguments",
    schemaVersion: "v1",
    fields: [
      {
        key: "targetWeekday",
        kind: "semantic_weekday_enum",
        default: WEEKDAY_TOOL_POLICY.defaultTargetWeekday,
      },
      {
        key: "comparisonPolicy",
        kind: "literal",
        value: WEEKDAY_TOOL_POLICY.comparisonPolicy,
      },
      {
        key: "evidenceSamplePolicy",
        kind: "literal",
        value: WEEKDAY_TOOL_POLICY.evidenceSamplePolicy,
      },
      {
        key: "outlierPolicy",
        kind: "literal",
        value: WEEKDAY_TOOL_POLICY.outlierPolicy,
      },
    ],
  },
);

if (!argumentSchema.ok) {
  throw new Error(argumentSchema.error.code);
}

export const WEEKDAY_ARGUMENT_SCHEMA_DIGEST =
  argumentSchema.value.identifier;

export interface WeekdayAnalysisArguments {
  readonly targetWeekday: CanonicalWeekday;
  readonly comparisonPolicy: typeof WEEKDAY_TOOL_POLICY.comparisonPolicy;
  readonly evidenceSamplePolicy:
    typeof WEEKDAY_TOOL_POLICY.evidenceSamplePolicy;
  readonly outlierPolicy: typeof WEEKDAY_TOOL_POLICY.outlierPolicy;
}

function parseArgumentValues(
  input: unknown,
): ExactResult<WeekdayAnalysisArguments, AnalyticalContractFailure> {
  if (input === undefined) {
    return {
      ok: true,
      value: Object.freeze({
        targetWeekday: WEEKDAY_TOOL_POLICY.defaultTargetWeekday,
        comparisonPolicy: WEEKDAY_TOOL_POLICY.comparisonPolicy,
        evidenceSamplePolicy: WEEKDAY_TOOL_POLICY.evidenceSamplePolicy,
        outlierPolicy: WEEKDAY_TOOL_POLICY.outlierPolicy,
      }),
    };
  }
  const record = validateContractRecord(
    input,
    [],
    [
      "targetWeekday",
      "comparisonPolicy",
      "evidenceSamplePolicy",
      "outlierPolicy",
    ],
    "$.arguments",
  );
  if (!record.ok) return record;
  const values = record.value;
  const targetWeekday =
    values.targetWeekday ?? WEEKDAY_TOOL_POLICY.defaultTargetWeekday;
  if (
    typeof targetWeekday !== "string" ||
    !WEEKDAY_SET.has(targetWeekday as CanonicalWeekday)
  ) {
    return contractFailure(
      "ti_v3_analytics_contract_invalid",
      "$.arguments.targetWeekday",
    );
  }
  const comparisonPolicy =
    values.comparisonPolicy ?? WEEKDAY_TOOL_POLICY.comparisonPolicy;
  const evidenceSamplePolicy =
    values.evidenceSamplePolicy ?? WEEKDAY_TOOL_POLICY.evidenceSamplePolicy;
  const outlierPolicy =
    values.outlierPolicy ?? WEEKDAY_TOOL_POLICY.outlierPolicy;
  if (
    comparisonPolicy !== WEEKDAY_TOOL_POLICY.comparisonPolicy ||
    evidenceSamplePolicy !== WEEKDAY_TOOL_POLICY.evidenceSamplePolicy ||
    outlierPolicy !== WEEKDAY_TOOL_POLICY.outlierPolicy
  ) {
    return contractFailure(
      "ti_v3_analytics_contract_invalid",
      "$.arguments.policy",
    );
  }
  return {
    ok: true,
    value: Object.freeze({
      targetWeekday: targetWeekday as CanonicalWeekday,
      comparisonPolicy,
      evidenceSamplePolicy,
      outlierPolicy,
    }),
  };
}

export function normalizeWeekdayAnalysisArguments(
  input?: unknown,
): ExactResult<NormalizedAnalysisArguments, AnalyticalContractFailure> {
  const parsed = parseArgumentValues(input);
  if (!parsed.ok) return parsed;
  return buildNormalizedAnalysisArguments({
    schemaVersion: NORMALIZED_ANALYSIS_ARGUMENTS_VERSION,
    argumentSchemaDigest: WEEKDAY_ARGUMENT_SCHEMA_DIGEST,
    values: parsed.value,
  });
}

export function verifyWeekdayAnalysisArguments(
  input: unknown,
): ExactResult<
  Readonly<{
    normalized: NormalizedAnalysisArguments;
    values: WeekdayAnalysisArguments;
  }>,
  AnalyticalContractFailure
> {
  const normalized = verifyNormalizedAnalysisArguments(input);
  if (
    !normalized.ok ||
    normalized.value.argumentSchemaDigest !== WEEKDAY_ARGUMENT_SCHEMA_DIGEST
  ) {
    return contractFailure(
      "ti_v3_analytics_contract_reference_mismatch",
      "$.normalizedArguments",
    );
  }
  const parsed = parseArgumentValues(normalized.value.values);
  if (!parsed.ok) return parsed;
  const rebuilt = normalizeWeekdayAnalysisArguments(parsed.value);
  if (
    !rebuilt.ok ||
    rebuilt.value.argumentsDigest !== normalized.value.argumentsDigest
  ) {
    return contractFailure(
      "ti_v3_analytics_contract_digest_mismatch",
      "$.normalizedArguments.argumentsDigest",
    );
  }
  return {
    ok: true,
    value: Object.freeze({ normalized: rebuilt.value, values: parsed.value }),
  };
}

export function buildWeekdayToolRegistryEntry(): ExactResult<
  ToolRegistryEntry,
  AnalyticalContractFailure
> {
  return buildToolRegistryEntry({
    schemaVersion: TOOL_REGISTRY_ENTRY_VERSION,
    toolKey: WEEKDAY_TOOL_KEY,
    toolVersion: WEEKDAY_TOOL_VERSION,
    descriptionCode: "historical_weekday_performance_exact_evidence",
    requiredEligibilityCapability: "closed_trade_analytics",
    argumentSchemaDigest: WEEKDAY_ARGUMENT_SCHEMA_DIGEST,
    requiredRowFields: [
      "canonical_owner_key",
      "canonical_account_key",
      "currency",
      "first_entry_at",
      "final_exit_at",
      "session_date",
      "weekday",
      "sequence_in_partition",
      "gross_pnl",
      "signed_charges",
      "net_pnl",
      "entry_notional",
      "share_quantity",
    ],
    outputContracts: [
      "exact_table_v1",
      "validated_claim_v1",
      "chart_ready_series_v1",
      "analytical_evidence_bundle_v1",
    ],
    blockedArtifactPolicy: "diagnostics_only",
    evidencePolicyKey: WEEKDAY_TOOL_POLICY.evidenceSamplePolicy,
    evidencePolicyVersion: "v1",
    toolPolicyKey: WEEKDAY_TOOL_POLICY.key,
    toolPolicyVersion: WEEKDAY_TOOL_POLICY.version,
    minimumSamplePolicyState: "versioned_tool_policy",
    optionalOutputContractsWhenLimited: ["validated_claim_v1"],
    supportedCurrencies: ["CAD", "USD"],
    supportedTimezones: ["America/New_York", "UTC"],
    deprecationState: "active_contract",
    focusedTestKeys: [
      "weekday_grouping",
      "exact_weekday_metrics",
      "target_baseline_partition",
      "sample_and_claim_policy",
      "outlier_sensitivity",
      "after_loss_semantics",
      "artifact_graph_consistency",
      "input_permutation_invariance",
    ],
    executableState: "tool_specific_deterministic_executor",
  });
}

export function weekdayArgumentSchemaDigest(): CanonicalContentDigest {
  return WEEKDAY_ARGUMENT_SCHEMA_DIGEST;
}
