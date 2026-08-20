export const PLATFORM_OFFLINE_SAVED_VIEW_SCHEMA_VERSION = 1 as const;
export const PLATFORM_OFFLINE_SAVED_VIEW_STORE = "savedViews" as const;
export const PLATFORM_OFFLINE_MAX_SAVED_VIEWS_PER_PARTITION = 75 as const;
export const PLATFORM_OFFLINE_MAX_SAVED_VIEW_BYTES = 2_000_000 as const;

export type PlatformOfflineJsonValue =
  | boolean
  | null
  | number
  | string
  | readonly PlatformOfflineJsonValue[]
  | Readonly<{ [key: string]: PlatformOfflineJsonValue }>;

export type PlatformOfflineCoverageFact = Readonly<{
  key: string;
  label: string;
  reason: string | null;
  status: "available" | "unavailable";
}>;

export type PlatformOfflineSavedView<
  TModel = PlatformOfflineJsonValue,
> = Readonly<{
  accountSelectionRef: string | null;
  accountTimezone: string | null;
  calculationVersion: string;
  coverage: readonly PlatformOfflineCoverageFact[];
  generatedAtUtc: string;
  model: TModel;
  offlineScopeRef: string;
  partitionKey: string;
  pathname: string;
  queryIdentity: string;
  ref: string;
  reportingCurrency: string | null;
  routeViewVersion: string;
  savedAtUtc: string;
  schemaVersion: typeof PLATFORM_OFFLINE_SAVED_VIEW_SCHEMA_VERSION;
  viewKey: string;
}>;
