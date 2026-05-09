import {
  buildTraderIntelligenceRouteRegistry,
  type TraderIntelligenceRouteDefinition,
} from "./platform-module";

export interface ImportFacingRoutePolicySurfaceContract {
  routeId: TraderIntelligenceRouteDefinition["routeId"];
  path: string;
  label: string;
  policyTestId: string;
  requiredText: string[];
  requiredCapabilities: Array<
    | "write_safety"
    | "gross_only_cost_policy"
    | "broker_scope"
    | "no_export_boundary"
  >;
}

export interface ImportFacingRouteContract {
  contractVersion: "import_facing_route_contract_v1";
  routes: ImportFacingRoutePolicySurfaceContract[];
  bannedSurfacePhrases: string[];
}

const IMPORT_FACING_ROUTE_IDS = [
  "import_dry_run",
  "imports",
  "import_health",
  "import_trials",
  "repair_wizard",
  "review_cockpit",
  "calibration",
] as const;

const POLICY_SURFACES: Record<
  (typeof IMPORT_FACING_ROUTE_IDS)[number],
  Omit<ImportFacingRoutePolicySurfaceContract, "path" | "label">
> = {
  import_dry_run: {
    routeId: "import_dry_run",
    policyTestId: "execution-readiness-summary",
    requiredCapabilities: [
      "write_safety",
      "gross_only_cost_policy",
      "no_export_boundary",
    ],
    requiredText: ["write safety: dry-run only", "gross-only"],
  },
  imports: {
    routeId: "imports",
    policyTestId: "imports-safety-policy",
    requiredCapabilities: [
      "write_safety",
      "gross_only_cost_policy",
      "broker_scope",
      "no_export_boundary",
    ],
    requiredText: [
      "Review-only prototype",
      "gross-only feedback",
      "does not save broker rows",
      "execution grouping",
    ],
  },
  import_health: {
    routeId: "import_health",
    policyTestId: "import-health-safety-policy",
    requiredCapabilities: [
      "write_safety",
      "gross_only_cost_policy",
      "broker_scope",
      "no_export_boundary",
    ],
    requiredText: [
      "Review-only prototype",
      "gross-only feedback",
      "does not write broker rows",
      "import facts only",
    ],
  },
  import_trials: {
    routeId: "import_trials",
    policyTestId: "import-trials-safety-policy",
    requiredCapabilities: [
      "write_safety",
      "gross_only_cost_policy",
      "broker_scope",
      "no_export_boundary",
    ],
    requiredText: [
      "synthetic dry run",
      "gross-only feedback",
      "without production writes",
      "not guaranteed live broker support",
    ],
  },
  repair_wizard: {
    routeId: "repair_wizard",
    policyTestId: "repair-wizard-safety-policy",
    requiredCapabilities: [
      "write_safety",
      "gross_only_cost_policy",
      "broker_scope",
      "no_export_boundary",
    ],
    requiredText: [
      "repair guidance only",
      "gross-only feedback",
      "does not save broker rows",
      "not a live broker guarantee",
    ],
  },
  review_cockpit: {
    routeId: "review_cockpit",
    policyTestId: "review-cockpit-safety-policy",
    requiredCapabilities: [
      "write_safety",
      "gross_only_cost_policy",
      "broker_scope",
      "no_export_boundary",
    ],
    requiredText: [
      "action planning only",
      "gross-only feedback",
      "without production broker-row writes",
      "observational only",
    ],
  },
  calibration: {
    routeId: "calibration",
    policyTestId: "calibration-safety-policy",
    requiredCapabilities: [
      "write_safety",
      "gross_only_cost_policy",
      "broker_scope",
      "no_export_boundary",
    ],
    requiredText: [
      "measurement only",
      "gross-only feedback",
      "does not save broker rows",
      "waiting for real imports",
    ],
  },
};

export function buildImportFacingRouteContract(): ImportFacingRouteContract {
  const registry = buildTraderIntelligenceRouteRegistry();
  const routes = IMPORT_FACING_ROUTE_IDS.map((routeId) => {
    const route = registry.find((candidate) => candidate.routeId === routeId);

    if (!route) {
      throw new Error(`Missing import-facing route registration: ${routeId}`);
    }

    return {
      ...POLICY_SURFACES[routeId],
      label: route.label,
      path: route.standalonePath,
    };
  });

  return {
    contractVersion: "import_facing_route_contract_v1",
    routes,
    bannedSurfacePhrases: [
      "Raw JSON",
      "Debug JSON",
      "Export button",
      "Download report",
      "Download CSV",
      "Export CSV",
      "Guaranteed broker support",
      "Certified broker support",
      "Market-validated setup",
    ],
  };
}
