export const GENERAL_NEWS_LIMITS = Object.freeze({
  batchBytes: 512 * 1024, batchItems: 25, bodyBytes: 64 * 1024,
  listItems: 50, maxArticles: 20_000, retainedBytes: 256 * 1024 * 1024,
  retentionDays: 7, replaySeconds: 300,
});
export type GeneralNewsArticle = Readonly<{
  id: string; headline: string; publishedAt: string | null; receivedAt: string;
  sourceUrl: string | null; source: string | null; symbols: readonly string[];
  tags: readonly string[]; body: string | null; bodyTruncated: boolean;
}>;
export type GeneralNewsRow = Omit<GeneralNewsArticle, "body">;
export type GeneralNewsStatus = Readonly<{
  collectedAt: string | null; deliveredAt: string | null;
  state: "fresh" | "partial" | "paused" | "unavailable";
}>;
export type GeneralNewsFeed = Readonly<{
  articles: readonly GeneralNewsRow[]; nextCursor: string | null; status: GeneralNewsStatus;
}>;
export type GeneralNewsQuery = Readonly<{
  ticker?: string; search?: string; from?: string; to?: string; cursor?: string;
}>;
export type NormalizedGeneralNews = GeneralNewsArticle & Readonly<{
  contentHash: string; collection: "general" | "ticker";
}>;
export const EMPTY_GENERAL_NEWS: GeneralNewsFeed = Object.freeze({
  articles: [], nextCursor: null,
  status: { collectedAt: null, deliveredAt: null, state: "unavailable" as const },
});
