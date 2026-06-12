export type LevelQualityDiagnosticCategory = "coverage" | "density" | "enrichment" | "synthetic" | "freshness" | "context" | "safety";
export type LevelQualityDiagnosticSeverity = "info" | "watch" | "review";
export type LevelQualityDiagnosticDescription = {
    code: string;
    category: LevelQualityDiagnosticCategory;
    severity: LevelQualityDiagnosticSeverity;
    label: string;
    description: string;
    factualOnly: true;
};
export declare const LEVEL_QUALITY_AUDIT_DIAGNOSTIC_LABELS: {
    readonly level_intelligence_report_missing: {
        readonly category: "context";
        readonly severity: "review";
        readonly label: "Level intelligence report missing";
        readonly description: "The audit did not receive LevelIntelligenceReport context for enriched level explanations.";
    };
    readonly reference_price_missing: {
        readonly category: "context";
        readonly severity: "review";
        readonly label: "Reference price missing";
        readonly description: "The audit could not compute nearest-level distances because no reference price was supplied.";
    };
    readonly no_support_below_reference: {
        readonly category: "coverage";
        readonly severity: "review";
        readonly label: "No support below reference";
        readonly description: "The audited level map has no support level below the supplied reference price.";
    };
    readonly no_resistance_above_reference: {
        readonly category: "coverage";
        readonly severity: "review";
        readonly label: "No resistance above reference";
        readonly description: "The audited level map has no resistance level above the supplied reference price.";
    };
    readonly wide_downside_support_gap: {
        readonly category: "coverage";
        readonly severity: "watch";
        readonly label: "Wide nearest support gap";
        readonly description: "The nearest support below reference is outside the configured nearby coverage threshold.";
    };
    readonly wide_overhead_resistance_gap: {
        readonly category: "coverage";
        readonly severity: "watch";
        readonly label: "Wide nearest resistance gap";
        readonly description: "The nearest resistance above reference is outside the configured nearby coverage threshold.";
    };
    readonly no_support_extension_coverage: {
        readonly category: "coverage";
        readonly severity: "review";
        readonly label: "No support extension coverage";
        readonly description: "The extension ladder contains no support extension rows for the audited snapshot.";
    };
    readonly no_resistance_extension_coverage: {
        readonly category: "coverage";
        readonly severity: "review";
        readonly label: "No resistance extension coverage";
        readonly description: "The extension ladder contains no resistance extension rows for the audited snapshot.";
    };
    readonly limited_downside_extension_coverage: {
        readonly category: "coverage";
        readonly severity: "watch";
        readonly label: "Limited downside extension coverage";
        readonly description: "The lowest support extension does not reach the configured downside coverage threshold.";
    };
    readonly limited_upside_extension_coverage: {
        readonly category: "coverage";
        readonly severity: "watch";
        readonly label: "Limited upside extension coverage";
        readonly description: "The highest resistance extension does not reach the configured upside coverage threshold.";
    };
    readonly clustered_level_areas_present: {
        readonly category: "density";
        readonly severity: "watch";
        readonly label: "Clustered level areas present";
        readonly description: "Multiple audited levels sit within the configured cluster distance threshold.";
    };
    readonly levels_without_context_present: {
        readonly category: "context";
        readonly severity: "watch";
        readonly label: "Levels without nearby context present";
        readonly description: "At least one audited level has no attached session, volume, shelf, or market context facts.";
    };
    readonly unenriched_levels_present: {
        readonly category: "enrichment";
        readonly severity: "watch";
        readonly label: "General enrichment coverage gap present";
        readonly description: "At least one audited level is missing enrichedAnalysis metadata; this broad diagnostic remains for compatibility.";
    };
    readonly unenriched_historical_levels_present: {
        readonly category: "enrichment";
        readonly severity: "watch";
        readonly label: "Historical enrichment coverage gap present";
        readonly description: "At least one historical support or resistance level is missing enrichedAnalysis metadata.";
    };
    readonly unenriched_extension_levels_present: {
        readonly category: "enrichment";
        readonly severity: "watch";
        readonly label: "Extension enrichment coverage gap present";
        readonly description: "At least one extension row is missing enrichedAnalysis metadata.";
    };
    readonly unenriched_synthetic_levels_present: {
        readonly category: "synthetic";
        readonly severity: "info";
        readonly label: "Synthetic continuation-map enrichment gap present";
        readonly description: "At least one marked synthetic continuation-map row is missing enrichedAnalysis metadata; it remains forward-planning context, not historical evidence.";
    };
    readonly session_facts_missing: {
        readonly category: "context";
        readonly severity: "info";
        readonly label: "Session facts missing";
        readonly description: "No session facts were supplied for this level context profile.";
    };
    readonly volume_facts_missing: {
        readonly category: "context";
        readonly severity: "info";
        readonly label: "Volume facts missing";
        readonly description: "No volume facts were supplied for this level context profile.";
    };
    readonly enriched_analysis_missing: {
        readonly category: "enrichment";
        readonly severity: "watch";
        readonly label: "Enriched analysis missing";
        readonly description: "The level does not include enrichedAnalysis metadata.";
    };
    readonly no_nearby_volume_shelf: {
        readonly category: "context";
        readonly severity: "info";
        readonly label: "No nearby volume shelf";
        readonly description: "No supplied volume shelf overlaps or sits near this level.";
    };
};
export declare function describeLevelQualityDiagnostic(code: string): LevelQualityDiagnosticDescription;
export declare function classifyLevelQualityDiagnostic(code: string): LevelQualityDiagnosticCategory;
export declare function isLevelQualityDiagnosticFactualOnly(code: string): boolean;
//# sourceMappingURL=level-quality-audit-wording.d.ts.map