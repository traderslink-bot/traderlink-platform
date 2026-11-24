import type { PlatformMigration } from "@/src/modules/platform/server/database/platform-migration-contract";

/** Additive identity/membership evidence; never rewrite published articles or versions. */
export const newsArticleIngestionMembershipsMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "news", migrationId: "0227_news_article_ingestion_memberships", executionOrder: 306,
  statements: Object.freeze([
    `CREATE TABLE news_article_source_urls (
      normalized_url TEXT PRIMARY KEY CHECK(length(normalized_url) BETWEEN 1 AND 2048),
      article_id TEXT NOT NULL REFERENCES news_articles(id) ON UPDATE RESTRICT ON DELETE RESTRICT
    ) STRICT`,
    `CREATE INDEX news_article_source_urls_article ON news_article_source_urls(article_id)`,
    // Existing cross-ticker rows are retained verbatim. The URL registry chooses
    // one deterministic target; it never merges issuer metadata or rewrites links.
    `INSERT INTO news_article_source_urls(normalized_url, article_id)
      SELECT normalized_url,id FROM (
        SELECT id,substr(canonical_source_key,instr(canonical_source_key,'|')+1) AS normalized_url,
          row_number() OVER (
            PARTITION BY substr(canonical_source_key,instr(canonical_source_key,'|')+1)
            ORDER BY CASE WHEN route_tag IN ('default','spike') THEN 0 ELSE 1 END,
              created_at ASC,id COLLATE BINARY ASC
          ) AS preferred
        FROM news_articles WHERE canonical_source_key IS NOT NULL
      ) WHERE preferred=1`,
    `CREATE TABLE news_article_source_events (
      source_event_id TEXT PRIMARY KEY CHECK(length(source_event_id) BETWEEN 1 AND 255 AND instr(source_event_id,char(0))=0),
      article_id TEXT NOT NULL REFERENCES news_articles(id) ON UPDATE RESTRICT ON DELETE RESTRICT
    ) STRICT`,
    `INSERT INTO news_article_source_events SELECT source_event_id,id FROM news_articles WHERE source_event_id IS NOT NULL`,
    `CREATE TABLE news_article_category_memberships (
      article_id TEXT NOT NULL REFERENCES news_articles(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
      route_tag TEXT NOT NULL CHECK(route_tag IN ('default','spike','market_cap_under_30m','market_cap_30m_to_50m','market_cap_50m_to_100m','market_cap_100m_to_300m','market_cap_300m_to_500m')),
      PRIMARY KEY(article_id, route_tag)
    ) STRICT`,
    `CREATE INDEX news_article_category_memberships_route ON news_article_category_memberships(route_tag,article_id)`,
    `INSERT OR IGNORE INTO news_article_category_memberships
      SELECT id,route_tag FROM news_articles WHERE route_tag IN ('default','spike','market_cap_under_30m','market_cap_30m_to_50m','market_cap_50m_to_100m','market_cap_100m_to_300m','market_cap_300m_to_500m')`,
    `INSERT OR IGNORE INTO news_article_category_memberships
      SELECT article_id,route_tag FROM news_article_versions WHERE route_tag IN ('default','spike','market_cap_under_30m','market_cap_30m_to_50m','market_cap_50m_to_100m','market_cap_100m_to_300m','market_cap_300m_to_500m')`,
  ]),
});
