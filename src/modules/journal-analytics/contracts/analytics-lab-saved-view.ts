export const ANALYTICS_LAB_SAVED_VIEW_QUERY_VERSION = "analytics_lab_view_v1";

export type JournalAnalyticsSavedViewLifecycleState = "active" | "retired";

export type JournalAnalyticsSavedViewRecord = Readonly<{
  savedViewId: string;
  name: string;
  queryVersion: typeof ANALYTICS_LAB_SAVED_VIEW_QUERY_VERSION;
  normalizedQueryJson: string;
  querySha256: string;
  lifecycleState: JournalAnalyticsSavedViewLifecycleState;
  revision: number;
  createdAtUtc: string;
  updatedAtUtc: string;
}>;

export type JournalAnalyticsSavedViewPayload = Readonly<{
  queryVersion: typeof ANALYTICS_LAB_SAVED_VIEW_QUERY_VERSION;
  normalizedQueryJson: string;
  querySha256: string;
}>;
