import {
  isTraderLinkPlatformError,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";

import { readConfiguredLevelAnalysisProviders } from "./level-analysis-delivery-request";

export function requireConfiguredLevelAnalysisProviders(): readonly string[] {
  const providers = readConfiguredLevelAnalysisProviders();
  if (providers.length === 0) {
    platformFailure("TRADERLINK_LEVEL_ANALYSIS_CONFIGURATION_INVALID");
  }
  return providers;
}

export function levelAnalysisRawDebugEnabled(
  environment: Readonly<Record<string, string | undefined>> = process.env,
): boolean {
  const value = environment.TRADERLINK_LEVEL_ANALYSIS_RAW_DEBUG_ENABLED;
  return value === "1" || value === "true";
}

export function levelAnalysisErrorResponse(error: unknown): Response {
  if (isTraderLinkPlatformError(error)) {
    switch (error.code) {
      case "TRADERLINK_ACCOUNT_SELECTION_CONFLICT":
      case "TRADERLINK_LEVEL_ANALYSIS_LINK_CONFLICT":
        return Response.json({ ok: false, code: error.code,
          message: "The selected account or trade changed. Refresh and try again." }, { status: 409 });
      case "TRADERLINK_LEVEL_ANALYSIS_DELIVERY_INVALID":
      case "TRADERLINK_LEVEL_ANALYSIS_LINK_INVALID":
        return Response.json({ ok: false, code: error.code,
          message: "The Level Analysis request is invalid or unavailable." }, { status: 400 });
      case "TRADERLINK_LEVEL_ANALYSIS_CONFIGURATION_INVALID":
        return Response.json({ ok: false, code: error.code,
          message: "Level Analysis delivery support is not configured." }, { status: 503 });
      case "TRADERLINK_ACCOUNT_ACCESS_DENIED":
      case "TRADERLINK_WORKSPACE_ACCESS_DENIED":
        return Response.json({ ok: false, code: error.code,
          message: "Level Analysis access is unavailable." }, { status: 403 });
      default:
        break;
    }
  }
  return Response.json({ ok: false, code: "TRADERLINK_LEVEL_ANALYSIS_UNAVAILABLE",
    message: "Level Analysis is unavailable right now." }, { status: 503 });
}
