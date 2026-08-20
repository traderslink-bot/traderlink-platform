export const PLATFORM_OFFLINE_DATABASE_NAME = "traderlink-pwa-v1" as const;
export const PLATFORM_OFFLINE_DATABASE_VERSION = 3 as const;
export const PLATFORM_OFFLINE_OUTBOX_STORE = "manualTradeOutbox" as const;
export const PLATFORM_OFFLINE_PROJECTION_STORE = "offlineProjections" as const;
export const PLATFORM_OFFLINE_DEVICE_STATE_STORE = "deviceState" as const;
export const PLATFORM_OFFLINE_PARTITION_INDEX = "partitionKey" as const;

export const PLATFORM_OFFLINE_PROJECTION_SCHEMA_VERSION = 1 as const;
export const PLATFORM_OFFLINE_PROJECTION_CONTRACT_VERSION =
  "traderlink-visible-page-projection-v1" as const;
export const PLATFORM_OFFLINE_MAX_PROJECTIONS_PER_PARTITION = 50 as const;
export const PLATFORM_OFFLINE_MAX_BLOCKS = 24 as const;
export const PLATFORM_OFFLINE_MAX_LINES_PER_BLOCK = 24 as const;
export const PLATFORM_OFFLINE_MAX_TOTAL_CHARACTERS = 40_000 as const;

export type PlatformOfflineRouteMode =
  | "full_offline_entry"
  | "last_synced"
  | "online_required"
  | "not_available";

const FULL_OFFLINE_ENTRY_ROUTES = Object.freeze([
  "/quick-trade-entry",
  "/trade-tracker",
  "/trade-tracker/swings",
]);

const LAST_SYNCED_ROUTE_PREFIXES = Object.freeze([
  "/ai-reviews",
  "/analytics",
  "/calendar",
  "/help",
  "/notifications",
  "/rules",
  "/trade-tracker",
  "/trades/candle-review",
  "/trades/open",
  "/workspace",
]);

const ONLINE_REQUIRED_ROUTE_PREFIXES = Object.freeze([
  "/account",
  "/ai-chat",
  "/charts",
  "/data-decisions",
  "/imports",
]);

function exactOrChild(pathname: string, route: string): boolean {
  return pathname === route || pathname.startsWith(`${route}/`);
}

export function normalizePlatformOfflinePathname(pathname: string): string {
  const normalized = pathname.split("?", 1)[0]?.split("#", 1)[0] ?? "";
  if (
    normalized.length < 1 ||
    normalized.length > 512 ||
    !normalized.startsWith("/") ||
    normalized.includes("//") ||
    /[\u0000-\u001f\\]/u.test(normalized)
  ) {
    return "/workspace";
  }
  return normalized.length > 1 && normalized.endsWith("/")
    ? normalized.slice(0, -1)
    : normalized;
}

export function platformOfflineRouteMode(
  pathname: string,
): PlatformOfflineRouteMode {
  const normalized = normalizePlatformOfflinePathname(pathname);
  if (normalized.startsWith("/analytics/lab")) return "online_required";
  if (FULL_OFFLINE_ENTRY_ROUTES.some((route) => exactOrChild(normalized, route))) {
    return "full_offline_entry";
  }
  if (ONLINE_REQUIRED_ROUTE_PREFIXES.some((route) => exactOrChild(normalized, route))) {
    return "online_required";
  }
  if (LAST_SYNCED_ROUTE_PREFIXES.some((route) => exactOrChild(normalized, route))) {
    return "last_synced";
  }
  return "not_available";
}

export function platformOfflineRouteCanStoreProjection(pathname: string): boolean {
  const mode = platformOfflineRouteMode(pathname);
  return mode === "full_offline_entry" || mode === "last_synced";
}

export type PlatformOfflineProjectionBlock = Readonly<{
  heading: string | null;
  lines: readonly string[];
}>;

export type PlatformOfflineProjection = Readonly<{
  accountSelectionRef: string | null;
  blocks: readonly PlatformOfflineProjectionBlock[];
  calculationVersion: string;
  contractVersion: typeof PLATFORM_OFFLINE_PROJECTION_CONTRACT_VERSION;
  coverage: Readonly<{
    unavailableLineCount: number;
  }>;
  generatedAtUtc: string;
  lastSyncedAtUtc: string;
  offlineScopeRef: string;
  partitionKey: string;
  pathname: string;
  ref: string;
  routeMode: "full_offline_entry" | "last_synced";
  schemaVersion: typeof PLATFORM_OFFLINE_PROJECTION_SCHEMA_VERSION;
  title: string;
}>;

export type PlatformOfflineNavigationItem = Readonly<{
  href: string;
  label: string;
  mode: PlatformOfflineRouteMode;
}>;

export type PlatformOfflineNavigationGroup = Readonly<{
  label: string;
  items: readonly PlatformOfflineNavigationItem[];
}>;

export type PlatformOfflineDeviceState = Readonly<{
  accountCurrency: string | null;
  accountSelectionRef: string | null;
  accountTimezone: string | null;
  key: "current";
  navigation: readonly PlatformOfflineNavigationGroup[];
  offlineScopeRef: string;
  partitionKey: string;
  updatedAtUtc: string;
  version: 2;
}>;
