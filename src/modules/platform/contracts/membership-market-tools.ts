/** Each market tool is an independent plan choice. */
export const MARKET_TOOL_MEMBERSHIP_KEYS = {
  liveScanners: "scanners.access",
  stockScreeners: "screeners.access",
  charts: "charts.access",
} as const;

export type MarketToolMembershipKey = (typeof MARKET_TOOL_MEMBERSHIP_KEYS)[keyof typeof MARKET_TOOL_MEMBERSHIP_KEYS];

export const MARKET_TOOL_MEMBERSHIP_FEATURES = [
  { key: MARKET_TOOL_MEMBERSHIP_KEYS.liveScanners, label: "Live Scanners", kind: "boolean", module: "scanner" },
  { key: MARKET_TOOL_MEMBERSHIP_KEYS.stockScreeners, label: "Stock Screeners", kind: "boolean", module: "stock-screeners" },
  { key: MARKET_TOOL_MEMBERSHIP_KEYS.charts, label: "Market Charts", kind: "boolean", module: "charts" },
] as const;

/** Callers retain identity, provider readiness and feature-specific pilot checks. */
export function allowsMarketToolAccess(input: Readonly<{
  existingAccess: boolean;
  memberReleaseReady: boolean;
  enforcement: "off" | "shadow" | "enforced";
  hasActiveGrant: boolean;
  prePaywallAccess?: boolean;
}>): boolean {
  return input.existingAccess ||
    (input.memberReleaseReady && (
      (input.enforcement === "enforced" && input.hasActiveGrant) ||
      ((input.enforcement === "off" || input.enforcement === "shadow") && input.prePaywallAccess === true)
    ));
}
