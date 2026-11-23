import type Database from "better-sqlite3";

export const NEWS_ROUTE_TAGS = Object.freeze([
  "default", "spike", "market_cap_under_30m", "market_cap_30m_to_50m", "market_cap_50m_to_100m",
  "market_cap_100m_to_300m", "market_cap_300m_to_500m",
] as const);

export function newsMembershipsInstalled(database: Database.Database): boolean {
  return !!database.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='news_article_category_memberships'").get();
}

/** EXISTS preserves one row per article even when several memberships match.
 * Legacy read compatibility is required before the separately approved migration. */
export function newsCategoryPredicate(database: Database.Database, tags: readonly string[], alias = "article"): string {
  const placeholders = tags.map(() => "?").join(", ");
  return newsMembershipsInstalled(database)
    ? `EXISTS (SELECT 1 FROM news_article_category_memberships membership WHERE membership.article_id = ${alias}.id AND membership.route_tag IN (${placeholders}))`
    : `${alias}.route_tag IN (${placeholders})`;
}
