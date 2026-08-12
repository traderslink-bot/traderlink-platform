import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { openPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { platformMigrationManifest } from "@/src/modules/platform/server/database/platform-migration-manifest";
import { isTraderLinkPlatformError } from "@/src/modules/platform/server/database/platform-migration-contract";

function requiredExpectedCount(name: string, fallback: number): number {
  const value = process.env[name];
  const parsed = value === undefined ? fallback : Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 0) {
    throw new Error("TRADERLINK_NEWS_AFFILIATE_EXPECTED_COUNT_INVALID");
  }
  return parsed;
}

export function verifyTraderLinkPlatformNewsAffiliate(): Readonly<Record<string, unknown>> {
  const database = openPlatformDatabase({ mode: "runtime" });
  try {
    const expectedNews = requiredExpectedCount(
      "TRADERLINK_EXPECTED_NEWS_ARTICLE_COUNT",
      1,
    );
    const expectedVersions = requiredExpectedCount(
      "TRADERLINK_EXPECTED_NEWS_VERSION_COUNT",
      expectedNews,
    );
    const expectedInvites = requiredExpectedCount(
      "TRADERLINK_EXPECTED_AFFILIATE_INVITE_COUNT",
      0,
    );
    const expectedAttributions = requiredExpectedCount(
      "TRADERLINK_EXPECTED_AFFILIATE_ATTRIBUTION_COUNT",
      0,
    );
    const count = (table: string): number =>
      Number(
        (database.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get() as {
          count: number;
        }).count,
      );
    const counts = Object.freeze({
      newsArticles: count("news_articles"),
      newsArticleVersions: count("news_article_versions"),
      affiliateInvites: count("affiliate_invites"),
      affiliateAttributions: count("affiliate_attributions"),
    });
    const migrationIds = database
      .prepare(`SELECT migration_id FROM platform_schema_migrations
ORDER BY execution_order`)
      .all() as Array<{ migration_id: string }>;
    const indexes = Number(
      (database.prepare(`SELECT COUNT(*) AS count FROM sqlite_schema
WHERE type = 'index' AND name IN (
  'news_articles_ticker_published_idx',
  'news_article_versions_article_revision_idx',
  'affiliate_invites_affiliate_code_idx',
  'affiliate_attributions_code_first_seen_idx'
)`).get() as { count: number }).count,
    );
    const triggers = Number(
      (database.prepare(`SELECT COUNT(*) AS count FROM sqlite_schema
WHERE type = 'trigger' AND name IN (
  'news_article_versions_no_update',
  'news_article_versions_no_delete',
  'affiliate_attributions_first_touch_immutable'
)`).get() as { count: number }).count,
    );
    const currentVersionMismatch = Number(
      (database.prepare(`SELECT COUNT(*) AS count
FROM news_articles article
LEFT JOIN news_article_versions version
  ON version.article_id = article.id
 AND version.revision = article.revision
 AND version.content_sha256 = article.content_sha256
WHERE version.version_id IS NULL`).get() as { count: number }).count,
    );
    const orphanVersions = Number(
      (database.prepare(`SELECT COUNT(*) AS count
FROM news_article_versions version
LEFT JOIN news_articles article ON article.id = version.article_id
WHERE article.id IS NULL`).get() as { count: number }).count,
    );
    if (
      migrationIds.length !== platformMigrationManifest.length ||
      migrationIds.at(-1)?.migration_id !==
        platformMigrationManifest.at(-1)?.migrationId ||
      !migrationIds.some(({ migration_id }) => migration_id === "0016_affiliate_attribution") ||
      !migrationIds.some(({ migration_id }) => migration_id === "0015_news_content") ||
      counts.newsArticles !== expectedNews ||
      counts.newsArticleVersions !== expectedVersions ||
      counts.affiliateInvites !== expectedInvites ||
      counts.affiliateAttributions !== expectedAttributions ||
      indexes !== 4 ||
      triggers !== 3 ||
      currentVersionMismatch !== 0 ||
      orphanVersions !== 0 ||
      (database.pragma("foreign_key_check") as unknown[]).length !== 0 ||
      database.pragma("quick_check", { simple: true }) !== "ok"
    ) {
      throw new Error("TRADERLINK_NEWS_AFFILIATE_VERIFICATION_FAILED");
    }
    return Object.freeze({
      status: "verified",
      migrationCount: migrationIds.length,
      counts,
      indexes,
      triggers,
      currentVersionMismatch,
      orphanVersions,
    });
  } finally {
    database.close();
  }
}

function isDirectExecution(): boolean {
  const invokedPath = process.argv[1];
  return Boolean(
    invokedPath &&
      resolve(invokedPath).toLowerCase() === fileURLToPath(import.meta.url).toLowerCase(),
  );
}

if (isDirectExecution()) {
  try {
    console.info(JSON.stringify(verifyTraderLinkPlatformNewsAffiliate(), null, 2));
  } catch (error) {
    console.error(
      JSON.stringify({
        code: isTraderLinkPlatformError(error)
          ? error.code
          : error instanceof Error
            ? error.message
            : "TRADERLINK_NEWS_AFFILIATE_VERIFICATION_FAILED",
      }),
    );
    process.exitCode = 1;
  }
}
