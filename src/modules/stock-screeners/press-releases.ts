import "server-only";

import type Database from "better-sqlite3";
import { publicNewsUrl } from "../news/contracts/public-news-url";
import { hasPressReleaseDashboardAccess } from "../news/server/press-release-dashboard-access";
import type { TraderLinkPlatformRequestIdentity } from "../platform/server/authentication/require-platform-request-scope";
import { withReadonlyPlatformDatabase } from "../platform/server/database/open-readonly-platform-database";
import { readMembershipNewsDelaySeconds } from "../platform/server/membership/membership-news-delay";
import { assertMembershipFeature } from "../platform/server/membership/platform-membership-access";
import { PRESS_RELEASE_LOOKBACK_HOURS, type NewsHeadline } from "./contracts";

export const HOUR_MS = 3_600_000;
const MEMBER_NEWS_ROUTES = "'default', 'spike', 'market_cap_under_30m', 'market_cap_30m_to_50m', 'market_cap_50m_to_100m'";
type ArticleRow = { ticker: string; published_at: string; headline: string; slug: string };

function headline(row: ArticleRow): NewsHeadline {
  return {
    publishedAt: Date.parse(row.published_at), headline: row.headline,
    url: publicNewsUrl(`/news/${encodeURIComponent(row.ticker)}/${encodeURIComponent(row.slug)}`),
  };
}

function visiblePressReleaseRows(database: Database.Database, symbols: readonly string[], asOf: number,
  delaySeconds: number, lookbackHours: number, policyAt = asOf) {
  const from = asOf - lookbackHours * HOUR_MS;
  const visibleThrough = Math.min(asOf, policyAt - delaySeconds * 1000);
  if (visibleThrough < from) return [];
  return (database.prepare(`
    SELECT release.id, release.ticker, release.published_at, release.headline, release.slug
    FROM json_each(@symbols) symbol
    JOIN news_articles release ON release.id = (
      SELECT article.id
      FROM news_articles article
      WHERE article.ticker = symbol.value AND article.published_at BETWEEN @from AND @visibleThrough
        AND article.created_at <= @visibleThrough
        AND article.route_tag IN (${MEMBER_NEWS_ROUTES})
        AND article.event_type GLOB 'press_release*'
      ORDER BY article.published_at DESC, article.id
      LIMIT 1
    )
  `).all({
    symbols: JSON.stringify(symbols), from: new Date(from).toISOString(), visibleThrough: new Date(visibleThrough).toISOString(),
  }) as (ArticleRow & { id: string })[]).flatMap(row => {
    const article = headline(row);
    return article.publishedAt >= from && article.publishedAt <= visibleThrough
      ? [[row.ticker, { id: row.id, ...article }] as const] : [];
  });
}

/** Look up the newest visible release with one indexed query over the screener universe. */
export function latestPressReleases(database: Database.Database, symbols: readonly string[], now: number, delaySeconds: number) {
  return new Map(visiblePressReleaseRows(database, symbols, now, delaySeconds, PRESS_RELEASE_LOOKBACK_HOURS)
    .map(([ticker, { publishedAt, headline, url }]) => [ticker, { publishedAt, headline, url }] as const));
}

function recentArticles(database: Database.Database, ticker: string, now: number, delaySeconds: number): NewsHeadline[] {
  const from = now - PRESS_RELEASE_LOOKBACK_HOURS * HOUR_MS;
  const visibleThrough = now - delaySeconds * 1000;
  if (visibleThrough < from) return [];
  const rows = database.prepare(`
    SELECT ticker, published_at, headline, slug
    FROM news_articles
    WHERE ticker = @ticker AND published_at BETWEEN @from AND @visibleThrough AND created_at <= @visibleThrough
      AND route_tag IN (${MEMBER_NEWS_ROUTES})
    ORDER BY published_at DESC, id
    LIMIT 12
  `).all({ ticker, from: new Date(from).toISOString(), visibleThrough: new Date(visibleThrough).toISOString() }) as ArticleRow[];
  return rows.map(headline);
}

function withPressReleaseAccess<T>(identity: TraderLinkPlatformRequestIdentity, now: number,
  read: (database: Database.Database, delaySeconds: number) => T): T | undefined {
  if (!hasPressReleaseDashboardAccess(identity)) return undefined;
  try {
    return withReadonlyPlatformDatabase({}, database => {
      const { userId } = identity.scope;
      assertMembershipFeature(database, userId, "news.access");
      const delaySeconds = readMembershipNewsDelaySeconds(database, userId, "news.visibility_delay_seconds", new Date(now).toISOString());
      return read(database, delaySeconds);
    });
  } catch {
    return undefined;
  }
}

export function memberPressReleases(identity: TraderLinkPlatformRequestIdentity, symbols: readonly string[], now: number) {
  return withPressReleaseAccess(identity, now, (database, delaySeconds) => ({
    delaySeconds, releases: latestPressReleases(database, symbols, now, delaySeconds),
  }));
}

export function memberScannerPressReleaseRecords(
  identity: TraderLinkPlatformRequestIdentity, symbols: readonly string[], asOf: number, lookbackHours: number, policyAt = asOf,
) {
  if (!Number.isFinite(lookbackHours) || lookbackHours <= 0) return;
  return withPressReleaseAccess(identity, policyAt, (database, delay) =>
    new Map(visiblePressReleaseRows(database, symbols, asOf, delay, lookbackHours, policyAt)));
}

export function memberRecentArticles(identity: TraderLinkPlatformRequestIdentity, ticker: string, now: number) {
  return withPressReleaseAccess(identity, now, (database, delay) => recentArticles(database, ticker, now, delay));
}

export function canReadPressReleaseRun(identity: TraderLinkPlatformRequestIdentity, delayAtRun: number, now: number) {
  return withPressReleaseAccess(identity, now, (_, delay) => delay <= delayAtRun) === true;
}
