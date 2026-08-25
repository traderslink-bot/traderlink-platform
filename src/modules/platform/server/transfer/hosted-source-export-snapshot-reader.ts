import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import { isAbsolute, join, resolve } from "node:path";

import { calculateNewsArticleContentSha256 } from "@/src/lib/news/news-article-store";

import {
  canonicalHostedTransferJson,
  hostedTransferSha256,
} from "./hosted-transfer-contract";
import type {
  HostedAcademySnapshot,
  HostedAffiliateSnapshot,
  HostedNewsSnapshot,
  HostedSourceSnapshots,
  HostedWatchlistSnapshot,
} from "./hosted-source-snapshot-reader";
import { platformFailure } from "../database/platform-migration-contract";

function text(value: unknown, field: string, maximum = 2048): string {
  const result = String(value ?? "").normalize("NFKC").trim();
  if (!result || result.length > maximum || /[\u0000-\u001f\u007f]/u.test(result)) {
    platformFailure("TRADERLINK_HOSTED_TRANSFER_INVALID", { field });
  }
  return result;
}

function optionalText(value: unknown, maximum = 4096): string | null {
  if (value === null || value === undefined || String(value).trim() === "") return null;
  const result = String(value).normalize("NFKC").trim();
  if (result.length > maximum || /[\u0000\u007f]/u.test(result)) {
    platformFailure("TRADERLINK_HOSTED_TRANSFER_INVALID", { field: "optionalText" });
  }
  return result;
}

function utc(value: unknown, field: string): string {
  const date = new Date(String(value));
  if (!Number.isFinite(date.getTime())) {
    platformFailure("TRADERLINK_HOSTED_TRANSFER_INVALID", { field });
  }
  return date.toISOString();
}

function integer(value: unknown, field: string): number {
  const result = Number(value);
  if (!Number.isSafeInteger(result) || result < 0) {
    platformFailure("TRADERLINK_HOSTED_TRANSFER_INVALID", { field });
  }
  return result;
}

function json(value: unknown, field: string): string {
  let parsed: unknown = value;
  if (typeof value === "string") {
    try {
      parsed = JSON.parse(value);
    } catch (error) {
      platformFailure("TRADERLINK_HOSTED_TRANSFER_INVALID", { field }, error);
    }
  }
  if (parsed === undefined) parsed = null;
  return canonicalHostedTransferJson(parsed).trimEnd();
}

function rows(directory: string, filename: string, required = true): readonly Record<string, unknown>[] {
  const path = join(directory, filename);
  if (!existsSync(path)) {
    if (!required) return Object.freeze([]);
    platformFailure("TRADERLINK_HOSTED_TRANSFER_INVALID", { field: `${filename}_missing` });
  }
  if (!statSync(path).isFile()) {
    platformFailure("TRADERLINK_HOSTED_TRANSFER_INVALID", { field: `${filename}_not_file` });
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    platformFailure("TRADERLINK_HOSTED_TRANSFER_INVALID", { field: `${filename}_json` }, error);
  }
  if (!Array.isArray(parsed) || parsed.some((row) => !row || typeof row !== "object" || Array.isArray(row))) {
    platformFailure("TRADERLINK_HOSTED_TRANSFER_INVALID", { field: `${filename}_rows` });
  }
  return Object.freeze(parsed.map((row) => Object.freeze({ ...(row as Record<string, unknown>) })));
}

function legacyNewsVersionId(articleId: string, contentSha256: string): string {
  return createHash("sha256")
    .update(`${articleId}\n1\n${contentSha256}\n`, "utf8")
    .digest("hex");
}

export function readHostedSourceSnapshotsFromExportDirectory(
  exportDirectory: string,
): HostedSourceSnapshots {
  if (!isAbsolute(exportDirectory)) {
    platformFailure("TRADERLINK_HOSTED_TRANSFER_INVALID", { field: "exportDirectory" });
  }
  const directory = resolve(exportDirectory);
  if (!existsSync(directory) || !statSync(directory).isDirectory()) {
    platformFailure("TRADERLINK_HOSTED_TRANSFER_INVALID", { field: "exportDirectory" });
  }

  const academyUsers = Object.freeze(rows(directory, "academy_users.json").map((row) => Object.freeze({
    authSubject: text(row.discord_user_id, "academyUserSubject", 255),
    username: text(row.username, "academyUsername", 120),
    globalDisplayName: optionalText(row.global_name, 120),
  })));
  const academyCompletions = Object.freeze(rows(directory, "academy_lesson_completions.json").map((row) => Object.freeze({
    authSubject: text(row.discord_user_id, "academyCompletionSubject", 255),
    lessonSlug: text(row.lesson_slug, "academyLessonSlug", 512),
    completedAtUtc: utc(row.completed_at, "academyCompletedAt"),
  })));
  const academy: HostedAcademySnapshot = Object.freeze({
    users: academyUsers,
    completions: academyCompletions,
    sha256: hostedTransferSha256({ users: academyUsers, completions: academyCompletions }),
  });

  const symbols = Object.freeze(rows(directory, "live_watchlist_symbols.json").map((row) => Object.freeze({
    symbol: text(row.symbol, "watchlistSymbol", 64).toUpperCase(),
    status: text(row.status, "watchlistStatus", 32),
    updated_at: integer(row.updated_at, "watchlistUpdatedAt"),
    state_json: json(row.state_json, "watchlistState"),
    revision: integer(row.revision, "watchlistRevision"),
  })));
  const health = Object.freeze(rows(directory, "live_watchlist_health.json").map((row) => Object.freeze({
    key: text(row.key, "watchlistHealthKey", 32),
    market_data_status: text(row.market_data_status, "watchlistHealthStatus", 32),
    market_data_updated_at: row.market_data_updated_at === null
      ? null
      : integer(row.market_data_updated_at, "watchlistHealthUpdatedAt"),
  })));
  const archives = Object.freeze(rows(directory, "live_watchlist_archives.json").map((row) => Object.freeze({
    archive_id: text(row.archive_id, "watchlistArchiveId", 128).toUpperCase(),
    symbol: text(row.symbol, "watchlistArchiveSymbol", 64).toUpperCase(),
    archived_at: integer(row.archived_at, "watchlistArchivedAt"),
    first_posted_at: row.first_posted_at === null
      ? null
      : integer(row.first_posted_at, "watchlistFirstPostedAt"),
    last_active_updated_at: integer(row.last_active_updated_at, "watchlistLastActiveUpdatedAt"),
    state_json: json(row.state_json, "watchlistArchiveState"),
  })));
  const watchlist: HostedWatchlistSnapshot = Object.freeze({
    symbols,
    health,
    archives,
    sha256: hostedTransferSha256({ symbols, health, archives }),
  });

  const newsArticles = Object.freeze(rows(directory, "news_articles.json").map((row) => {
    const article = Object.freeze({
      id: text(row.id, "news_id", 255),
      source_event_id: optionalText(row.source_event_id, 255),
      canonical_source_key: optionalText(row.canonical_source_key, 2048),
      ticker: text(row.ticker, "news_ticker", 32),
      slug: text(row.slug, "news_slug", 128),
      headline: text(row.headline, "news_headline", 1000),
      summary: optionalText(row.summary, 1_000_000),
      article_text: optionalText(row.article_text, 1_000_000),
      source_url: optionalText(row.source_url, 1_000_000),
      event_type: optionalText(row.event_type, 2048),
      route_tag: optionalText(row.route_tag, 2048),
      published_at: utc(row.published_at, "news_published_at"),
      created_at: utc(row.created_at, "news_created_at"),
      updated_at: utc(row.updated_at, "news_updated_at"),
      metadata_json: json(row.metadata_json, "news_metadata_json"),
      positives_json: json(row.positives_json, "news_positives_json"),
      negatives_json: json(row.negatives_json, "news_negatives_json"),
      risk_flags_json: json(row.risk_flags_json, "news_risk_flags_json"),
      diagnostics_json: json(row.diagnostics_json, "news_diagnostics_json"),
      raw_payload_json: json(row.raw_payload_json, "news_raw_payload_json"),
    });
    const contentSha256 = calculateNewsArticleContentSha256({
      sourceEventId: article.source_event_id,
      canonicalSourceKey: article.canonical_source_key,
      ticker: article.ticker,
      slug: article.slug,
      headline: article.headline,
      summary: article.summary,
      articleText: article.article_text,
      sourceUrl: article.source_url,
      eventType: article.event_type,
      routeTag: article.route_tag,
      publishedAt: article.published_at,
      metadataJson: article.metadata_json,
      positivesJson: article.positives_json,
      negativesJson: article.negatives_json,
      riskFlagsJson: article.risk_flags_json,
      diagnosticsJson: article.diagnostics_json,
      rawPayloadJson: article.raw_payload_json,
    });
    return Object.freeze({ ...article, revision: 1, content_sha256: contentSha256 });
  }));
  const versions = Object.freeze(newsArticles.map((article) => Object.freeze({
    version_id: legacyNewsVersionId(article.id, article.content_sha256),
    article_id: article.id,
    revision: 1,
    source_event_id: article.source_event_id,
    canonical_source_key: article.canonical_source_key,
    ticker: article.ticker,
    slug: article.slug,
    headline: article.headline,
    summary: article.summary,
    article_text: article.article_text,
    source_url: article.source_url,
    event_type: article.event_type,
    route_tag: article.route_tag,
    published_at: article.published_at,
    created_at: article.created_at,
    changed_at: article.updated_at,
    metadata_json: article.metadata_json,
    positives_json: article.positives_json,
    negatives_json: article.negatives_json,
    risk_flags_json: article.risk_flags_json,
    diagnostics_json: article.diagnostics_json,
    raw_payload_json: article.raw_payload_json,
    content_sha256: article.content_sha256,
    change_source: "legacy_migration",
  })));
  const news: HostedNewsSnapshot = Object.freeze({
    articles: newsArticles,
    versions,
    sha256: hostedTransferSha256({ articles: newsArticles, versions }),
  });

  const invites = Object.freeze(rows(directory, "affiliate_invites.json", false).map((row) => Object.freeze({
    invite_code: text(row.invite_code, "affiliateInviteCode", 96),
    affiliate_code: text(row.affiliate_code, "affiliateCode", 80),
    affiliate_name: optionalText(row.affiliate_name, 120),
    active: Boolean(row.active),
    created_at_utc: utc(row.created_at_utc, "affiliateInviteCreatedAt"),
    updated_at_utc: utc(row.updated_at_utc, "affiliateInviteUpdatedAt"),
    metadata_json: json(row.metadata_json, "affiliateInviteMetadata"),
  })));
  const pendingUnmappedRowCount = rows(directory, "affiliate_discord_referrals.json", false).length
    + rows(directory, "affiliate_attributions.json", false).length;
  const affiliateSnapshot = { invites, attributions: Object.freeze([]), pendingUnmappedRowCount };
  const affiliate: HostedAffiliateSnapshot = Object.freeze({
    ...affiliateSnapshot,
    sha256: hostedTransferSha256(affiliateSnapshot),
  });

  return Object.freeze({ academy, watchlist, news, affiliate });
}
