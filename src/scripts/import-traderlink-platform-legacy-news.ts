import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import Database from "better-sqlite3";

import { calculateNewsArticleContentSha256 } from "@/src/lib/news/news-article-store";
import { openPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import {
  assertCanonicalUtcTimestamp,
  isLowercaseSha256,
  isTraderLinkPlatformError,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";

type LegacyNewsRow = Readonly<Record<string, unknown>>;

function sha256(value: Buffer | string): string {
  return createHash("sha256").update(value).digest("hex");
}

function requiredEnvironmentPath(name: string): string {
  const value = process.env[name]?.trim();
  if (!value || !isAbsolute(value)) {
    platformFailure("TRADERLINK_NEWS_STORAGE_INVALID", {
      reason: `${name.toLowerCase()}_invalid`,
    });
  }
  return value;
}

function nullableText(value: unknown): string | null {
  return value === null || value === undefined ? null : String(value);
}

function requiredText(row: LegacyNewsRow, key: string): string {
  const value = nullableText(row[key]);
  if (!value) {
    platformFailure("TRADERLINK_NEWS_STORAGE_INVALID", {
      field: key,
    });
  }
  return value;
}

function requireJson(value: string, field: string): string {
  try {
    JSON.parse(value);
  } catch (error) {
    platformFailure("TRADERLINK_NEWS_STORAGE_INVALID", { field }, error);
  }
  return value;
}

function canonicalSourceKey(ticker: string, sourceUrl: string | null): string | null {
  if (!sourceUrl) return null;
  try {
    const parsed = new URL(sourceUrl);
    parsed.hash = "";
    return `${ticker}|${parsed.toString().toLowerCase()}`;
  } catch {
    return `${ticker}|${sourceUrl.toLowerCase()}`;
  }
}

function versionId(articleId: string, contentSha256: string): string {
  return sha256(`${articleId}\n1\n${contentSha256}\n`);
}

function currentContent(row: LegacyNewsRow) {
  const ticker = requiredText(row, "ticker");
  const publishedAt = requiredText(row, "published_at");
  const sourceUrl = nullableText(row.source_url);
  assertCanonicalUtcTimestamp(publishedAt, "published_at");
  return Object.freeze({
    sourceEventId: nullableText(row.source_event_id),
    canonicalSourceKey: canonicalSourceKey(ticker, sourceUrl),
    ticker,
    slug: requiredText(row, "slug"),
    headline: requiredText(row, "headline"),
    summary: nullableText(row.summary),
    articleText: nullableText(row.article_text),
    sourceUrl,
    eventType: nullableText(row.event_type),
    routeTag: nullableText(row.route_tag),
    publishedAt,
    metadataJson: requireJson(requiredText(row, "metadata_json"), "metadata_json"),
    positivesJson: requireJson(requiredText(row, "positives_json"), "positives_json"),
    negativesJson: requireJson(requiredText(row, "negatives_json"), "negatives_json"),
    riskFlagsJson: requireJson(requiredText(row, "risk_flags_json"), "risk_flags_json"),
    diagnosticsJson: requireJson(requiredText(row, "diagnostics_json"), "diagnostics_json"),
    rawPayloadJson: requireJson(requiredText(row, "raw_payload_json"), "raw_payload_json"),
  });
}

export function importLegacyNewsContent(): Readonly<Record<string, unknown>> {
  const sourcePath = requiredEnvironmentPath("TRADERLINK_LEGACY_NEWS_DB_PATH");
  const expectedSourceSha256 =
    process.env.TRADERLINK_LEGACY_NEWS_EXPECTED_SHA256?.trim().toLowerCase() ?? "";
  if (!isLowercaseSha256(expectedSourceSha256)) {
    platformFailure("TRADERLINK_NEWS_STORAGE_INVALID", {
      reason: "expected_source_sha256_invalid",
    });
  }
  const sourceSha256 = sha256(readFileSync(sourcePath));
  if (sourceSha256 !== expectedSourceSha256) {
    platformFailure("TRADERLINK_NEWS_STORAGE_INVALID", {
      reason: "source_hash_mismatch",
    });
  }

  const source = new Database(sourcePath, { readonly: true, fileMustExist: true });
  const target = openPlatformDatabase({ mode: "runtime" });
  try {
    if (source.pragma("quick_check", { simple: true }) !== "ok") {
      platformFailure("TRADERLINK_NEWS_STORAGE_INVALID", {
        reason: "source_quick_check_failed",
      });
    }
    const sourceCount = Number(
      (source.prepare("SELECT COUNT(*) AS count FROM news_articles").get() as {
        count: number;
      }).count,
    );
    if (sourceCount !== 1) {
      platformFailure("TRADERLINK_NEWS_STORAGE_INVALID", {
        reason: "unexpected_legacy_news_count",
        sourceCount,
      });
    }
    const legacyRow = source
      .prepare("SELECT * FROM news_articles ORDER BY id LIMIT 1")
      .get() as LegacyNewsRow;
    const id = requiredText(legacyRow, "id");
    const createdAt = requiredText(legacyRow, "created_at");
    const updatedAt = requiredText(legacyRow, "updated_at");
    assertCanonicalUtcTimestamp(createdAt, "created_at");
    assertCanonicalUtcTimestamp(updatedAt, "updated_at");
    const content = currentContent(legacyRow);
    const contentSha256 = calculateNewsArticleContentSha256(content);
    const importedVersionId = versionId(id, contentSha256);
    let status: "imported" | "already_present" = "imported";

    target.transaction(() => {
      const existingCount = Number(
        (target.prepare("SELECT COUNT(*) AS count FROM news_articles").get() as {
          count: number;
        }).count,
      );
      const existing = target
        .prepare("SELECT * FROM news_articles WHERE id = ?")
        .get(id) as LegacyNewsRow | undefined;
      if (existing) {
        if (
          existingCount !== 1 ||
          Number(existing.revision) !== 1 ||
          String(existing.content_sha256) !== contentSha256 ||
          calculateNewsArticleContentSha256(currentContent(existing)) !==
            contentSha256
        ) {
          platformFailure("TRADERLINK_NEWS_STORAGE_INVALID", {
            reason: "existing_article_mismatch",
          });
        }
        const version = target
          .prepare(`SELECT content_sha256, change_source
FROM news_article_versions WHERE version_id = ?`)
          .get(importedVersionId) as
          | { content_sha256: string; change_source: string }
          | undefined;
        if (
          version?.content_sha256 !== contentSha256 ||
          version.change_source !== "legacy_migration"
        ) {
          platformFailure("TRADERLINK_NEWS_STORAGE_INVALID", {
            reason: "existing_version_mismatch",
          });
        }
        status = "already_present";
        return;
      }
      if (existingCount !== 0) {
        platformFailure("TRADERLINK_NEWS_STORAGE_INVALID", {
          reason: "unexpected_replacement_news_rows",
          existingCount,
        });
      }

      target.prepare(`INSERT INTO news_articles (
  id, source_event_id, canonical_source_key, ticker, slug, headline, summary,
  article_text, source_url, event_type, route_tag, published_at, created_at,
  updated_at, metadata_json, positives_json, negatives_json, risk_flags_json,
  diagnostics_json, raw_payload_json, revision, content_sha256
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`)
        .run(
          id,
          content.sourceEventId,
          content.canonicalSourceKey,
          content.ticker,
          content.slug,
          content.headline,
          content.summary,
          content.articleText,
          content.sourceUrl,
          content.eventType,
          content.routeTag,
          content.publishedAt,
          createdAt,
          updatedAt,
          content.metadataJson,
          content.positivesJson,
          content.negativesJson,
          content.riskFlagsJson,
          content.diagnosticsJson,
          content.rawPayloadJson,
          contentSha256,
        );
      target.prepare(`INSERT INTO news_article_versions (
  version_id, article_id, revision, source_event_id, canonical_source_key,
  ticker, slug, headline, summary, article_text, source_url, event_type,
  route_tag, published_at, created_at, changed_at, metadata_json,
  positives_json, negatives_json, risk_flags_json, diagnostics_json,
  raw_payload_json, content_sha256, change_source
) VALUES (?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(
          importedVersionId,
          id,
          content.sourceEventId,
          content.canonicalSourceKey,
          content.ticker,
          content.slug,
          content.headline,
          content.summary,
          content.articleText,
          content.sourceUrl,
          content.eventType,
          content.routeTag,
          content.publishedAt,
          createdAt,
          updatedAt,
          content.metadataJson,
          content.positivesJson,
          content.negativesJson,
          content.riskFlagsJson,
          content.diagnosticsJson,
          content.rawPayloadJson,
          contentSha256,
          "legacy_migration",
        );
    })();

    return Object.freeze({
      status,
      sourceSha256,
      sourceCount,
      replacementCount: 1,
      replacementVersionCount: 1,
      contentSha256,
    });
  } finally {
    target.close();
    source.close();
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
    console.info(JSON.stringify(importLegacyNewsContent(), null, 2));
  } catch (error) {
    console.error(
      JSON.stringify({
        code: isTraderLinkPlatformError(error)
          ? error.code
          : "TRADERLINK_LEGACY_NEWS_IMPORT_FAILED",
      }),
    );
    process.exitCode = 1;
  }
}
