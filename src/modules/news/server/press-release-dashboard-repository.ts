import "server-only";

import type Database from "better-sqlite3";

import {
  PRESS_RELEASE_CHANNELS,
  PRESS_RELEASE_PUSH_CHANNELS,
  type PressReleaseArticle,
  type PressReleaseChannel,
  type PressReleasePushChannel,
  type PressReleaseUnreadCounts,
  isPressReleasePushChannel,
} from "../contracts/press-release-dashboard-contracts";
import type { WorkspaceAccessScope } from "../../platform/contracts/workspace-access-scope";
import {
  assertCanonicalUtcTimestamp,
  platformFailure,
} from "../../platform/server/database/platform-migration-contract";

type ArticleRow = Readonly<{
  article_text: string | null;
  event_type: string | null;
  headline: string;
  id: string;
  is_read: number;
  metadata_json: string;
  negatives_json: string;
  positives_json: string;
  published_at: string;
  risk_flags_json: string;
  route_tag: string | null;
  slug: string;
  source_url: string | null;
  summary: string | null;
  ticker: string;
}>;

const ALL_ELIGIBLE_ROUTE_TAGS = Object.freeze([
  "default",
  "spike",
  "market_cap_under_30m",
  "market_cap_30m_to_50m",
  "market_cap_50m_to_100m",
] as const);

function routeTags(channel: PressReleaseChannel): readonly string[] {
  switch (channel) {
    case "all": return ALL_ELIGIBLE_ROUTE_TAGS;
    case "news_filtered": return Object.freeze(["default", "spike"]);
    case "market_cap_all": return Object.freeze([
      "market_cap_under_30m",
      "market_cap_30m_to_50m",
      "market_cap_50m_to_100m",
    ]);
    case "market_cap_under_30m": return Object.freeze([channel]);
    case "market_cap_30m_to_50m": return Object.freeze([channel]);
    case "market_cap_50m_to_100m": return Object.freeze([channel]);
  }
}
function placeholders(values: readonly unknown[]): string {
  return values.map(() => "?").join(", ");
}

function parseRecord(value: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(value) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : {};
  } catch {
    return {};
  }
}

function parseStrings(value: string): readonly string[] {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed)
      ? Object.freeze(parsed.filter((item): item is string => typeof item === "string" && item.trim().length > 0))
      : Object.freeze([]);
  } catch {
    return Object.freeze([]);
  }
}

function cleanDisplayText(value: unknown, maximum: number): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value.replace(/\s+/gu, " ").trim();
  return cleaned ? cleaned.slice(0, maximum) : null;
}

function supportResistanceLevels(metadata: Record<string, unknown>): readonly string[] {
  const value = metadata.supportResistanceLevels;
  if (typeof value === "string") {
    return Object.freeze(value.split(/\r?\n/gu).map((part) => part.trim()).filter(Boolean));
  }
  if (Array.isArray(value)) {
    return Object.freeze(value.filter((part): part is string => typeof part === "string" && part.trim().length > 0));
  }
  return Object.freeze([]);
}

function rowToArticle(row: ArticleRow): PressReleaseArticle {
  const metadata = parseRecord(row.metadata_json);
  return Object.freeze({
    articleText: row.article_text,
    eventType: row.event_type,
    headline: row.headline,
    id: row.id,
    isRead: row.is_read === 1,
    marketCap: cleanDisplayText(metadata.marketCap, 80),
    negatives: parseStrings(row.negatives_json),
    positives: parseStrings(row.positives_json),
    publishedAt: row.published_at,
    publicPath: `/news/${encodeURIComponent(row.ticker)}/${encodeURIComponent(row.slug)}`,
    riskFlags: parseStrings(row.risk_flags_json),
    routeTag: row.route_tag,
    sourceUrl: row.source_url,
    summary: row.summary,
    supportResistanceLevels: supportResistanceLevels(metadata),
    ticker: row.ticker,
  });
}

function assertActiveUser(database: Database.Database, scope: WorkspaceAccessScope): void {
  const active = database.prepare<[string, string], { found: number }>(`SELECT 1 AS found
FROM platform_workspace_memberships membership
JOIN platform_users user ON user.user_id = membership.user_id
JOIN platform_workspaces workspace ON workspace.workspace_id = membership.workspace_id
WHERE membership.user_id = ? AND membership.workspace_id = ?
  AND membership.status = 'active' AND user.status = 'active'
  AND workspace.status = 'active'`).get(scope.userId, scope.workspaceId);
  if (!active) platformFailure("TRADERLINK_WORKSPACE_ACCESS_DENIED");
}

export class PressReleaseDashboardRepository {
  constructor(private readonly database: Database.Database) {}

  list(input: Readonly<{
    channel: PressReleaseChannel;
    limit?: number;
    scope: WorkspaceAccessScope;
  }>): readonly PressReleaseArticle[] {
    assertActiveUser(this.database, input.scope);
    const tags = routeTags(input.channel);
    const limit = Math.max(1, Math.min(250, input.limit ?? 100));
    const rows = this.database.prepare(`SELECT
  article.id, article.ticker, article.slug, article.headline, article.summary,
  article.article_text, article.source_url, article.event_type, article.route_tag,
  article.published_at, article.metadata_json, article.positives_json,
  article.negatives_json, article.risk_flags_json,
  CASE WHEN receipt.article_id IS NULL THEN 0 ELSE 1 END AS is_read
FROM news_articles article
LEFT JOIN news_article_read_receipts receipt
  ON receipt.article_id = article.id AND receipt.user_id = ?
WHERE article.route_tag IN (${placeholders(tags)})
ORDER BY article.published_at DESC, article.id
LIMIT ?`).all(input.scope.userId, ...tags, limit) as ArticleRow[];
    return Object.freeze(rows.map(rowToArticle));
  }

  find(input: Readonly<{
    articleId: string;
    channel: PressReleaseChannel;
    scope: WorkspaceAccessScope;
  }>): PressReleaseArticle | null {
    assertActiveUser(this.database, input.scope);
    const tags = routeTags(input.channel);
    const row = this.database.prepare(`SELECT
  article.id, article.ticker, article.slug, article.headline, article.summary,
  article.article_text, article.source_url, article.event_type, article.route_tag,
  article.published_at, article.metadata_json, article.positives_json,
  article.negatives_json, article.risk_flags_json,
  CASE WHEN receipt.article_id IS NULL THEN 0 ELSE 1 END AS is_read
FROM news_articles article
LEFT JOIN news_article_read_receipts receipt
  ON receipt.article_id = article.id AND receipt.user_id = ?
WHERE article.id = ? AND article.route_tag IN (${placeholders(tags)})
LIMIT 1`).get(input.scope.userId, input.articleId, ...tags) as ArticleRow | undefined;
    return row ? rowToArticle(row) : null;
  }

  unreadCounts(scope: WorkspaceAccessScope): PressReleaseUnreadCounts {
    assertActiveUser(this.database, scope);
    const counts = Object.fromEntries(PRESS_RELEASE_CHANNELS.map((channel) => {
      const tags = routeTags(channel);
      const count = this.database.prepare(`SELECT COUNT(*) AS count
FROM news_articles article
LEFT JOIN news_article_read_receipts receipt
  ON receipt.article_id = article.id AND receipt.user_id = ?
WHERE receipt.article_id IS NULL
  AND article.route_tag IN (${placeholders(tags)})`).get(scope.userId, ...tags) as { count: number };
      return [channel, count.count];
    })) as Record<PressReleaseChannel, number>;
    return Object.freeze(counts);
  }

  markRead(input: Readonly<{
    articleId: string;
    readAtUtc: string;
    scope: WorkspaceAccessScope;
  }>): void {
    assertActiveUser(this.database, input.scope);
    assertCanonicalUtcTimestamp(input.readAtUtc, "newsArticleReadAt");
    const eligible = this.database.prepare(`SELECT 1 AS found FROM news_articles
WHERE id = ? AND route_tag IN (${placeholders(ALL_ELIGIBLE_ROUTE_TAGS)})`).get(
      input.articleId,
      ...ALL_ELIGIBLE_ROUTE_TAGS,
    );
    if (!eligible) platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED");
    this.database.prepare(`INSERT OR IGNORE INTO news_article_read_receipts (
  article_id, user_id, read_at_utc
) VALUES (?, ?, ?)`).run(input.articleId, input.scope.userId, input.readAtUtc);
  }

  markChannelRead(input: Readonly<{
    channel: PressReleaseChannel;
    readAtUtc: string;
    scope: WorkspaceAccessScope;
  }>): number {
    assertActiveUser(this.database, input.scope);
    assertCanonicalUtcTimestamp(input.readAtUtc, "newsChannelReadAt");
    const tags = routeTags(input.channel);
    const result = this.database.prepare(`INSERT OR IGNORE INTO news_article_read_receipts (
  article_id, user_id, read_at_utc
)
SELECT article.id, ?, ? FROM news_articles article
WHERE article.route_tag IN (${placeholders(tags)})`).run(
      input.scope.userId,
      input.readAtUtc,
      ...tags,
    );
    return result.changes;
  }

  readPushPreferences(scope: WorkspaceAccessScope): readonly PressReleasePushChannel[] {
    assertActiveUser(this.database, scope);
    const rows = this.database.prepare<[string], { channel: string }>(`SELECT channel
FROM news_press_release_push_preferences
WHERE user_id = ? AND enabled = 1 ORDER BY channel`).all(scope.userId);
    return Object.freeze(rows.map((row) => row.channel).filter(isPressReleasePushChannel));
  }

  replacePushPreferences(input: Readonly<{
    channels: readonly string[];
    scope: WorkspaceAccessScope;
    updatedAtUtc: string;
  }>): readonly PressReleasePushChannel[] {
    assertActiveUser(this.database, input.scope);
    assertCanonicalUtcTimestamp(input.updatedAtUtc, "newsPushPreferenceUpdatedAt");
    const requested = new Set<PressReleasePushChannel>();
    for (const channel of input.channels) {
      if (!isPressReleasePushChannel(channel)) {
        platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED");
      }
      requested.add(channel);
    }
    this.database.transaction(() => {
      for (const channel of PRESS_RELEASE_PUSH_CHANNELS) {
        this.database.prepare(`INSERT INTO news_press_release_push_preferences (
  user_id, channel, enabled, updated_at_utc
) VALUES (?, ?, ?, ?)
ON CONFLICT(user_id, channel) DO UPDATE SET
  enabled = excluded.enabled, updated_at_utc = excluded.updated_at_utc`).run(
          input.scope.userId,
          channel,
          requested.has(channel) ? 1 : 0,
          input.updatedAtUtc,
        );
      }
    }).immediate();
    return Object.freeze([...requested].sort());
  }
}
