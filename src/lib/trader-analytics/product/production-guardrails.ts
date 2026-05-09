import type {
  ProductionAnalyticsGuardrailCheck,
  ProductionAnalyticsSurfaceAudit,
  ProductionAnalyticsSurfaceAuditInput,
} from "./types";

export const PRODUCTION_ANALYTICS_NO_EXPORT_CHECKLIST: ProductionAnalyticsGuardrailCheck[] =
  [
    {
      id: "no_raw_json_panel",
      label: "Production route has no raw JSON panel.",
      required: true,
    },
    {
      id: "no_export_control",
      label: "Production route has no JSON, CSV, spreadsheet, or raw-data export control.",
      required: true,
    },
    {
      id: "no_debug_route_copy",
      label: "Production route avoids debug route, contract, provider, and raw payload language.",
      required: true,
    },
    {
      id: "sample_data_labeled",
      label: "Any fixture-backed or sample report is clearly labeled as sample data.",
      required: true,
    },
    {
      id: "in_app_navigation",
      label: "Report history, comparisons, drill-downs, and notes stay inside the app.",
      required: true,
    },
  ];

export const DEBUG_RAW_JSON_COPY =
  "Debug raw JSON is for development and QA only. Do not include raw report payloads or export controls on production end-user analytics routes.";

export function auditProductionAnalyticsSurface(
  input: ProductionAnalyticsSurfaceAuditInput,
): ProductionAnalyticsSurfaceAudit {
  const issues: string[] = [];

  if (input.hasRawJsonPanel) {
    issues.push("Production route must not include a raw JSON panel.");
  }

  if (input.hasExportControl) {
    issues.push("Production route must not include export controls.");
  }

  if (input.hasDebugCopy) {
    issues.push("Production route must not include debug or route-contract copy.");
  }

  if (input.fixtureBacked !== false && !input.hasFixtureOnlyDataLabel) {
    issues.push("Fixture-backed production views must be labeled as sample data.");
  }

  return {
    route: input.route,
    passed: issues.length === 0,
    issues,
  };
}
