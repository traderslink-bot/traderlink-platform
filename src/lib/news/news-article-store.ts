import { createHash, randomBytes } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import DatabaseConstructor from "better-sqlite3";
import type Database from "better-sqlite3";

import { newsContentMigration } from "@/src/modules/news/server/database/migrations/0015_news_content";
import { openPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";
import { requirePlatformSingleNodeSqliteStorage } from "@/src/modules/platform/server/database/platform-storage-backend";

type SqliteDatabase = Database.Database;
type NeonSql = ReturnType<typeof neon>;

export interface NewsArticleInput {
  sourceEventId?: string | null;
  ticker: string;
  headline: string;
  summary?: string | null;
  articleText?: string | null;
  sourceUrl?: string | null;
  eventType?: string | null;
  routeTag?: string | null;
  publishedAt?: string | null;
  metadata?: Record<string, unknown> | null;
  positives?: string[];
  negatives?: string[];
  riskFlags?: string[];
  diagnostics?: Record<string, unknown> | null;
  rawPayload?: unknown;
}

export interface NewsArticle {
  id: string;
  revision: number;
  contentSha256: string;
  ticker: string;
  slug: string;
  headline: string;
  summary: string | null;
  articleText: string | null;
  sourceUrl: string | null;
  eventType: string | null;
  routeTag: string | null;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, unknown>;
  positives: string[];
  negatives: string[];
  riskFlags: string[];
  diagnostics: Record<string, unknown>;
  rawPayload: unknown;
}

let sharedSqliteDatabase: SqliteDatabase | null = null;
let sharedNeonSql: NeonSql | null = null;
let sharedNeonSchemaPromise: Promise<void> | null = null;

function configuredDatabaseUrl(): string | undefined {
  return process.env.NEWS_DATABASE_URL?.trim() || undefined;
}

function shouldUseSqliteFallback(): boolean {
  if (process.env.NODE_ENV === "test" && process.env.NEWS_STORAGE === "neon") {
    if (!configuredDatabaseUrl()) {
      platformFailure("TRADERLINK_NEWS_STORAGE_INVALID", {
        reason: "hosted_url_missing",
      });
    }
    return false;
  }
  requirePlatformSingleNodeSqliteStorage("TRADERLINK_NEWS_STORAGE_INVALID");
  return true;
}

function explicitTestDatabasePath(): string | undefined {
  const configured = process.env.TRADERSLINK_NEWS_DB_PATH?.trim();
  if (configured && process.env.NODE_ENV !== "test") {
    platformFailure("TRADERLINK_NEWS_STORAGE_INVALID", {
      reason: "isolated_sqlite_path_test_only",
    });
  }
  return configured || undefined;
}

function initializeNewsTestDatabase(database: SqliteDatabase): void {
  database.pragma("foreign_keys = ON");
  database.pragma("busy_timeout = 5000");
  for (const statement of newsContentMigration.statements) {
    database.exec(statement);
  }
}

async function getSqliteDatabase(): Promise<SqliteDatabase> {
  if (sharedSqliteDatabase) {
    return sharedSqliteDatabase;
  }

  const testPath = explicitTestDatabasePath();
  if (testPath) {
    const database = new DatabaseConstructor(testPath);
    initializeNewsTestDatabase(database);
    sharedSqliteDatabase = database;
    return database;
  }
  sharedSqliteDatabase = openPlatformDatabase({ mode: "runtime" });
  return sharedSqliteDatabase;
}

function getNeonSql(): NeonSql {
  const databaseUrl = configuredDatabaseUrl();

  if (!databaseUrl) {
    platformFailure("TRADERLINK_NEWS_STORAGE_INVALID", {
      reason: "hosted_url_missing",
    });
  }

  if (!sharedNeonSql) {
    sharedNeonSql = neon(databaseUrl);
  }

  return sharedNeonSql;
}

async function verifyNeonSchema(): Promise<void> {
  if (sharedNeonSchemaPromise) {
    return sharedNeonSchemaPromise;
  }

  const sql = getNeonSql();
  sharedNeonSchemaPromise = Promise.all([
    sql`
      SELECT table_name, column_name
      FROM information_schema.columns
      WHERE table_schema = current_schema()
        AND table_name IN ('news_articles', 'news_article_versions')
    `,
    sql`
      SELECT indexname
      FROM pg_indexes
      WHERE schemaname = current_schema()
        AND indexname IN (
          'news_articles_ticker_published_idx',
          'news_article_versions_article_revision_idx'
        )
    `,
  ]).then(([columnRows, indexRows]) => {
    const columns = new Set(
      (columnRows as Array<{ table_name?: unknown; column_name?: unknown }>).map(
        (row) => `${String(row.table_name)}.${String(row.column_name)}`,
      ),
    );
    const requiredColumns = [
      "news_articles.id",
      "news_articles.canonical_source_key",
      "news_articles.ticker",
      "news_articles.slug",
      "news_articles.revision",
      "news_articles.content_sha256",
      "news_article_versions.version_id",
      "news_article_versions.article_id",
      "news_article_versions.revision",
      "news_article_versions.content_sha256",
    ];
    if (
      requiredColumns.some((column) => !columns.has(column)) ||
      (indexRows as Array<unknown>).length !== 2
    ) {
      platformFailure("TRADERLINK_NEWS_STORAGE_INVALID", {
        reason: "hosted_schema_incomplete",
      });
    }
  });

  return sharedNeonSchemaPromise;
}

export async function resetNewsDatabaseForTests(): Promise<void> {
  sharedSqliteDatabase?.close();
  sharedSqliteDatabase = null;
  sharedNeonSql = null;
  sharedNeonSchemaPromise = null;
}

function cleanText(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function normalizeTicker(value: unknown): string {
  return cleanText(value).toUpperCase().replace(/[^A-Z0-9.-]/g, "");
}

function buildCanonicalSourceKey(ticker: string, sourceUrl: string | null): string | null {
  if (!sourceUrl) return null;

  try {
    const parsed = new URL(sourceUrl);
    parsed.hash = "";
    return `${ticker}|${parsed.toString().toLowerCase()}`;
  } catch {
    return `${ticker}|${sourceUrl.toLowerCase()}`;
  }
}

function routePriority(routeTag: unknown): number {
  const normalized = cleanText(routeTag).toLowerCase();
  if (normalized === "default" || normalized === "spike") return 2;
  if (normalized.startsWith("market_cap_")) return 1;
  return 0;
}

function mergeCanonicalInput(
  normalized: ReturnType<typeof normalizeInput>,
  existing: Record<string, unknown> | null,
) {
  if (!existing || routePriority(normalized.routeTag) >= routePriority(existing.route_tag)) {
    const existingMetadata = parseJsonObject(existing?.metadata_json);
    const incomingMetadata = parseJsonObject(normalized.metadataJson);
    if (
      existingMetadata.supportResistanceLevels &&
      !incomingMetadata.supportResistanceLevels
    ) {
      normalized.metadataJson = JSON.stringify({
        ...incomingMetadata,
        supportResistanceLevels: existingMetadata.supportResistanceLevels,
      });
    }
    return normalized;
  }

  return {
    ...normalized,
    headline: String(existing.headline),
    summary: typeof existing.summary === "string" ? existing.summary : null,
    articleText:
      typeof existing.article_text === "string" ? existing.article_text : null,
    eventType:
      typeof existing.event_type === "string" ? existing.event_type : null,
    routeTag: typeof existing.route_tag === "string" ? existing.route_tag : null,
    publishedAt: toIsoString(existing.published_at),
    sourceUrl:
      typeof existing.source_url === "string" ? existing.source_url : null,
    metadataJson: JSON.stringify(parseJsonObject(existing.metadata_json)),
    positivesJson: JSON.stringify(parseJsonArray(existing.positives_json)),
    negativesJson: JSON.stringify(parseJsonArray(existing.negatives_json)),
    riskFlagsJson: JSON.stringify(parseJsonArray(existing.risk_flags_json)),
    diagnosticsJson: JSON.stringify(parseJsonObject(existing.diagnostics_json)),
    rawPayloadJson: JSON.stringify(parseJsonObject(existing.raw_payload_json)),
  };
}

export function buildNewsArticleSlug(headline: string, publishedAt: string): string {
  const base = cleanText(headline)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 88)
    .replace(/-+$/g, "");
  const datePart = cleanText(publishedAt).slice(0, 10);

  return [base || "press-release", datePart].filter(Boolean).join("-");
}

function parseJsonObject(value: unknown): Record<string, unknown> {
  if (!value) return {};
  if (typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  try {
    const parsed = JSON.parse(String(value));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function parseJsonArray(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map(cleanText).filter(Boolean);
  }

  try {
    const parsed = JSON.parse(String(value));
    return Array.isArray(parsed) ? parsed.map(cleanText).filter(Boolean) : [];
  } catch {
    return [];
  }
}

function isSensitivePayloadKey(key: string): boolean {
  return (
    /^(authorization|cookie|set-cookie|x-news-publish-token)$/i.test(key) ||
    /(api[_-]?key|access[_-]?token|auth[_-]?token|bearer|password|secret|token|webhook)/i.test(
      key,
    )
  );
}

function sanitizeRawPayload(value: unknown, depth = 0): unknown {
  if (depth > 8) return null;
  if (!value || typeof value !== "object") return value;

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeRawPayload(item, depth + 1));
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, nestedValue] of Object.entries(value)) {
    if (isSensitivePayloadKey(key)) continue;
    sanitized[key] = sanitizeRawPayload(nestedValue, depth + 1);
  }

  return sanitized;
}

function stableIdForInput(input: NewsArticleInput): string {
  if (input.sourceEventId) {
    return createHash("sha256")
      .update(String(input.sourceEventId))
      .digest("hex")
      .slice(0, 24);
  }

  return randomBytes(12).toString("hex");
}

function toIsoString(value: unknown): string {
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isFinite(date.getTime()) ? date.toISOString() : cleanText(value);
}

function rowToArticle(row: Record<string, unknown>): NewsArticle {
  return {
    id: String(row.id),
    revision: Number(row.revision),
    contentSha256: String(row.content_sha256),
    ticker: String(row.ticker),
    slug: String(row.slug),
    headline: String(row.headline),
    summary: typeof row.summary === "string" ? row.summary : null,
    articleText: typeof row.article_text === "string" ? row.article_text : null,
    sourceUrl: typeof row.source_url === "string" ? row.source_url : null,
    eventType: typeof row.event_type === "string" ? row.event_type : null,
    routeTag: typeof row.route_tag === "string" ? row.route_tag : null,
    publishedAt: toIsoString(row.published_at),
    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at),
    metadata: parseJsonObject(row.metadata_json),
    positives: parseJsonArray(row.positives_json),
    negatives: parseJsonArray(row.negatives_json),
    riskFlags: parseJsonArray(row.risk_flags_json),
    diagnostics: parseJsonObject(row.diagnostics_json),
    rawPayload: parseJsonObject(row.raw_payload_json),
  };
}

function normalizeInput(input: NewsArticleInput) {
  const ticker = normalizeTicker(input.ticker);
  const headline = cleanText(input.headline);

  if (!ticker) {
    throw new Error("ticker is required");
  }

  if (!headline) {
    throw new Error("headline is required");
  }

  const now = new Date().toISOString();
  const requestedPublishedAt = cleanText(input.publishedAt) || now;
  const publishedDate = new Date(requestedPublishedAt);
  if (!Number.isFinite(publishedDate.getTime())) {
    platformFailure("TRADERLINK_NEWS_STORAGE_INVALID", {
      field: "publishedAt",
    });
  }
  const publishedAt = publishedDate.toISOString();

  const sourceUrl = cleanText(input.sourceUrl) || null;

  return {
    id: stableIdForInput(input),
    ticker,
    headline,
    publishedAt,
    requestedSlug: buildNewsArticleSlug(headline, publishedAt),
    sourceEventId: cleanText(input.sourceEventId) || null,
    summary: cleanText(input.summary) || null,
    articleText:
      typeof input.articleText === "string" ? input.articleText.trim() || null : null,
    sourceUrl,
    canonicalSourceKey: buildCanonicalSourceKey(ticker, sourceUrl),
    eventType: cleanText(input.eventType) || null,
    routeTag: cleanText(input.routeTag) || null,
    metadataJson: JSON.stringify(input.metadata ?? {}),
    positivesJson: JSON.stringify(input.positives ?? []),
    negativesJson: JSON.stringify(input.negatives ?? []),
    riskFlagsJson: JSON.stringify(input.riskFlags ?? []),
    diagnosticsJson: JSON.stringify(input.diagnostics ?? {}),
    rawPayloadJson: JSON.stringify(sanitizeRawPayload(input.rawPayload ?? {})),
  };
}

type StoredNewsContent = Readonly<{
  sourceEventId: string | null;
  canonicalSourceKey: string | null;
  ticker: string;
  slug: string;
  headline: string;
  summary: string | null;
  articleText: string | null;
  sourceUrl: string | null;
  eventType: string | null;
  routeTag: string | null;
  publishedAt: string;
  metadataJson: string;
  positivesJson: string;
  negativesJson: string;
  riskFlagsJson: string;
  diagnosticsJson: string;
  rawPayloadJson: string;
}>;

export function calculateNewsArticleContentSha256(
  content: StoredNewsContent,
): string {
  const canonical = JSON.stringify([
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
    content.metadataJson,
    content.positivesJson,
    content.negativesJson,
    content.riskFlagsJson,
    content.diagnosticsJson,
    content.rawPayloadJson,
  ]);
  return createHash("sha256").update(`${canonical}\n`, "utf8").digest("hex");
}

function newsVersionId(
  articleId: string,
  revision: number,
  contentSha256: string,
): string {
  return createHash("sha256")
    .update(`${articleId}\n${revision}\n${contentSha256}\n`, "utf8")
    .digest("hex");
}

function storedContentFromInput(
  normalized: ReturnType<typeof normalizeInput>,
  existing: Record<string, unknown> | null,
  slug: string,
): StoredNewsContent {
  return Object.freeze({
    sourceEventId:
      typeof existing?.source_event_id === "string"
        ? existing.source_event_id
        : normalized.sourceEventId,
    canonicalSourceKey:
      typeof existing?.canonical_source_key === "string"
        ? existing.canonical_source_key
        : normalized.canonicalSourceKey,
    ticker: normalized.ticker,
    slug,
    headline: normalized.headline,
    summary: normalized.summary,
    articleText: normalized.articleText,
    sourceUrl: normalized.sourceUrl,
    eventType: normalized.eventType,
    routeTag: normalized.routeTag,
    publishedAt: normalized.publishedAt,
    metadataJson: normalized.metadataJson,
    positivesJson: normalized.positivesJson,
    negativesJson: normalized.negativesJson,
    riskFlagsJson: normalized.riskFlagsJson,
    diagnosticsJson: normalized.diagnosticsJson,
    rawPayloadJson: normalized.rawPayloadJson,
  });
}

function buildSqliteUniqueSlug(
  db: SqliteDatabase,
  ticker: string,
  requestedSlug: string,
): string {
  const exists = db
    .prepare("SELECT id FROM news_articles WHERE ticker = ? AND slug = ?")
    .get(ticker, requestedSlug);

  if (!exists) return requestedSlug;

  const suffix = randomBytes(3).toString("hex");
  return `${requestedSlug.slice(0, 96).replace(/-+$/g, "")}-${suffix}`;
}

async function buildNeonUniqueSlug(
  sql: NeonSql,
  ticker: string,
  requestedSlug: string,
): Promise<string> {
  const rows = (await sql`
    SELECT id FROM news_articles
    WHERE ticker = ${ticker}
      AND slug = ${requestedSlug}
    LIMIT 1
  `) as Array<Record<string, unknown>>;

  if (!rows.length) return requestedSlug;

  const suffix = randomBytes(3).toString("hex");
  return `${requestedSlug.slice(0, 96).replace(/-+$/g, "")}-${suffix}`;
}

async function upsertNewsArticleSqlite(
  input: NewsArticleInput,
): Promise<NewsArticle> {
  const db = await getSqliteDatabase();
  const requested = normalizeInput(input);
  let savedArticleId = "";
  db.transaction(() => {
    let normalized = requested;
    const canonicalRow = normalized.canonicalSourceKey
      ? (db
          .prepare("SELECT * FROM news_articles WHERE canonical_source_key = ?")
          .get(normalized.canonicalSourceKey) as Record<string, unknown> | undefined)
      : undefined;
    const eventRow = normalized.sourceEventId
      ? (db
          .prepare("SELECT * FROM news_articles WHERE source_event_id = ?")
          .get(normalized.sourceEventId) as Record<string, unknown> | undefined)
      : undefined;
    if (canonicalRow && eventRow && canonicalRow.id !== eventRow.id) {
      platformFailure("TRADERLINK_NEWS_STORAGE_INVALID", {
        reason: "source_identity_conflict",
      });
    }
    const existingRow = canonicalRow ?? eventRow ?? null;
    normalized = mergeCanonicalInput(normalized, existingRow);
    const slug = existingRow
      ? String(existingRow.slug)
      : buildSqliteUniqueSlug(db, normalized.ticker, normalized.requestedSlug);
    const id = existingRow ? String(existingRow.id) : normalized.id;
    savedArticleId = id;
    const now = new Date().toISOString();
    const createdAt = existingRow ? String(existingRow.created_at) : now;
    const content = storedContentFromInput(normalized, existingRow, slug);
    const contentSha256 = calculateNewsArticleContentSha256(content);
    if (existingRow && String(existingRow.content_sha256) === contentSha256) {
      return;
    }
    const revision = existingRow ? Number(existingRow.revision) + 1 : 1;

    db.prepare(`INSERT INTO news_articles (
  id, source_event_id, canonical_source_key, ticker, slug, headline, summary,
  article_text, source_url, event_type, route_tag, published_at, created_at,
  updated_at, metadata_json, positives_json, negatives_json, risk_flags_json,
  diagnostics_json, raw_payload_json, revision, content_sha256
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
ON CONFLICT(id) DO UPDATE SET
  source_event_id = excluded.source_event_id,
  canonical_source_key = excluded.canonical_source_key,
  headline = excluded.headline,
  summary = excluded.summary,
  article_text = excluded.article_text,
  source_url = excluded.source_url,
  event_type = excluded.event_type,
  route_tag = excluded.route_tag,
  published_at = excluded.published_at,
  updated_at = excluded.updated_at,
  metadata_json = excluded.metadata_json,
  positives_json = excluded.positives_json,
  negatives_json = excluded.negatives_json,
  risk_flags_json = excluded.risk_flags_json,
  diagnostics_json = excluded.diagnostics_json,
  raw_payload_json = excluded.raw_payload_json,
  revision = excluded.revision,
  content_sha256 = excluded.content_sha256`)
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
        now,
        content.metadataJson,
        content.positivesJson,
        content.negativesJson,
        content.riskFlagsJson,
        content.diagnosticsJson,
        content.rawPayloadJson,
        revision,
        contentSha256,
      );

    db.prepare(`INSERT INTO news_article_versions (
  version_id, article_id, revision, source_event_id, canonical_source_key,
  ticker, slug, headline, summary, article_text, source_url, event_type,
  route_tag, published_at, created_at, changed_at, metadata_json,
  positives_json, negatives_json, risk_flags_json, diagnostics_json,
  raw_payload_json, content_sha256, change_source
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(
        newsVersionId(id, revision, contentSha256),
        id,
        revision,
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
        now,
        content.metadataJson,
        content.positivesJson,
        content.negativesJson,
        content.riskFlagsJson,
        content.diagnosticsJson,
        content.rawPayloadJson,
        contentSha256,
        "publisher",
      );
  })();

  const article = db
    .prepare("SELECT * FROM news_articles WHERE id = ?")
    .get(savedArticleId) as Record<string, unknown> | undefined;
  if (!article) {
    platformFailure("TRADERLINK_NEWS_STORAGE_INVALID", {
      reason: "article_not_saved",
    });
  }
  return rowToArticle(article);
}

async function upsertNewsArticleNeon(
  input: NewsArticleInput,
): Promise<NewsArticle> {
  await verifyNeonSchema();
  const sql = getNeonSql();
  let normalized = normalizeInput(input);
  const now = new Date().toISOString();
  const canonicalRows = normalized.canonicalSourceKey
    ? ((await sql`
        SELECT * FROM news_articles
        WHERE canonical_source_key = ${normalized.canonicalSourceKey}
        LIMIT 1
      `) as Array<Record<string, unknown>>)
    : [];
  const eventRows = normalized.sourceEventId
    ? ((await sql`
        SELECT * FROM news_articles
        WHERE source_event_id = ${normalized.sourceEventId}
        LIMIT 1
      `) as Array<Record<string, unknown>>)
    : [];
  if (
    canonicalRows[0] &&
    eventRows[0] &&
    canonicalRows[0].id !== eventRows[0].id
  ) {
    platformFailure("TRADERLINK_NEWS_STORAGE_INVALID", {
      reason: "source_identity_conflict",
    });
  }
  const existing = canonicalRows[0] ?? eventRows[0];
  normalized = mergeCanonicalInput(normalized, existing ?? null);
  const slug = existing
    ? String(existing.slug)
    : await buildNeonUniqueSlug(sql, normalized.ticker, normalized.requestedSlug);
  const id = existing ? String(existing.id) : normalized.id;
  const createdAt = existing ? toIsoString(existing.created_at) : now;
  const content = storedContentFromInput(normalized, existing ?? null, slug);
  const contentSha256 = calculateNewsArticleContentSha256(content);
  if (existing && String(existing.content_sha256) === contentSha256) {
    return rowToArticle(existing);
  }
  const revision = existing ? Number(existing.revision) + 1 : 1;
  const versionId = newsVersionId(id, revision, contentSha256);

  await sql.transaction((transaction) => [
    transaction`
    INSERT INTO news_articles (
      id,
      source_event_id,
      canonical_source_key,
      ticker,
      slug,
      headline,
      summary,
      article_text,
      source_url,
      event_type,
      route_tag,
      published_at,
      created_at,
      updated_at,
      metadata_json,
      positives_json,
      negatives_json,
      risk_flags_json,
      diagnostics_json,
      raw_payload_json,
      revision,
      content_sha256
    )
    VALUES (
      ${id},
      ${content.sourceEventId},
      ${content.canonicalSourceKey},
      ${content.ticker},
      ${content.slug},
      ${content.headline},
      ${content.summary},
      ${content.articleText},
      ${content.sourceUrl},
      ${content.eventType},
      ${content.routeTag},
      ${content.publishedAt},
      ${createdAt},
      ${now},
      CAST(${content.metadataJson} AS jsonb),
      CAST(${content.positivesJson} AS jsonb),
      CAST(${content.negativesJson} AS jsonb),
      CAST(${content.riskFlagsJson} AS jsonb),
      CAST(${content.diagnosticsJson} AS jsonb),
      CAST(${content.rawPayloadJson} AS jsonb),
      ${revision},
      ${contentSha256}
    )
    ON CONFLICT(id) DO UPDATE SET
      source_event_id = excluded.source_event_id,
      canonical_source_key = excluded.canonical_source_key,
      headline = excluded.headline,
      summary = excluded.summary,
      article_text = excluded.article_text,
      source_url = excluded.source_url,
      event_type = excluded.event_type,
      route_tag = excluded.route_tag,
      published_at = excluded.published_at,
      updated_at = excluded.updated_at,
      metadata_json = excluded.metadata_json,
      positives_json = excluded.positives_json,
      negatives_json = excluded.negatives_json,
      risk_flags_json = excluded.risk_flags_json,
      diagnostics_json = excluded.diagnostics_json,
      raw_payload_json = excluded.raw_payload_json,
      revision = excluded.revision,
      content_sha256 = excluded.content_sha256
    `,
    transaction`
      INSERT INTO news_article_versions (
        version_id, article_id, revision, source_event_id,
        canonical_source_key, ticker, slug, headline, summary, article_text,
        source_url, event_type, route_tag, published_at, created_at,
        changed_at, metadata_json, positives_json, negatives_json,
        risk_flags_json, diagnostics_json, raw_payload_json, content_sha256,
        change_source
      ) VALUES (
        ${versionId}, ${id}, ${revision}, ${content.sourceEventId},
        ${content.canonicalSourceKey}, ${content.ticker}, ${content.slug},
        ${content.headline}, ${content.summary}, ${content.articleText},
        ${content.sourceUrl}, ${content.eventType}, ${content.routeTag},
        ${content.publishedAt}, ${createdAt}, ${now},
        CAST(${content.metadataJson} AS jsonb),
        CAST(${content.positivesJson} AS jsonb),
        CAST(${content.negativesJson} AS jsonb),
        CAST(${content.riskFlagsJson} AS jsonb),
        CAST(${content.diagnosticsJson} AS jsonb),
        CAST(${content.rawPayloadJson} AS jsonb),
        ${contentSha256}, 'publisher'
      )
    `,
  ]);

  const article = await getNewsArticleNeon(normalized.ticker, slug);
  if (!article) {
    platformFailure("TRADERLINK_NEWS_STORAGE_INVALID", {
      reason: "article_not_saved",
    });
  }

  return article;
}

export async function upsertNewsArticle(
  input: NewsArticleInput,
): Promise<NewsArticle> {
  return shouldUseSqliteFallback()
    ? upsertNewsArticleSqlite(input)
    : upsertNewsArticleNeon(input);
}

async function getNewsArticleSqlite(
  ticker: string,
  slug: string,
): Promise<NewsArticle | null> {
  const db = await getSqliteDatabase();
  const row = db
    .prepare("SELECT * FROM news_articles WHERE ticker = ? AND slug = ?")
    .get(normalizeTicker(ticker), cleanText(slug));

  return row ? rowToArticle(row as Record<string, unknown>) : null;
}

async function getNewsArticleNeon(
  ticker: string,
  slug: string,
): Promise<NewsArticle | null> {
  await verifyNeonSchema();
  const sql = getNeonSql();
  const rows = (await sql`
    SELECT * FROM news_articles
    WHERE ticker = ${normalizeTicker(ticker)}
      AND slug = ${cleanText(slug)}
    LIMIT 1
  `) as Array<Record<string, unknown>>;

  return rows[0] ? rowToArticle(rows[0]) : null;
}

export async function getNewsArticle(
  ticker: string,
  slug: string,
): Promise<NewsArticle | null> {
  return shouldUseSqliteFallback()
    ? getNewsArticleSqlite(ticker, slug)
    : getNewsArticleNeon(ticker, slug);
}

async function listNewsArticlesByTickerSqlite(
  ticker: string,
  limit = 25,
): Promise<NewsArticle[]> {
  const db = await getSqliteDatabase();
  const rows = db
    .prepare(
      `
        SELECT * FROM news_articles
        WHERE ticker = ?
        ORDER BY published_at DESC
        LIMIT ?
      `,
    )
    .all(normalizeTicker(ticker), Math.max(1, Math.min(100, limit)));

  return rows.map((row) => rowToArticle(row as Record<string, unknown>));
}

async function listNewsArticlesByTickerNeon(
  ticker: string,
  limit = 25,
): Promise<NewsArticle[]> {
  await verifyNeonSchema();
  const sql = getNeonSql();
  const rows = (await sql`
    SELECT * FROM news_articles
    WHERE ticker = ${normalizeTicker(ticker)}
    ORDER BY published_at DESC
    LIMIT ${Math.max(1, Math.min(100, limit))}
  `) as Array<Record<string, unknown>>;

  return rows.map(rowToArticle);
}

export async function listNewsArticlesByTicker(
  ticker: string,
  limit = 25,
): Promise<NewsArticle[]> {
  return shouldUseSqliteFallback()
    ? listNewsArticlesByTickerSqlite(ticker, limit)
    : listNewsArticlesByTickerNeon(ticker, limit);
}

async function listRecentNewsArticlesSqlite(limit = 50): Promise<NewsArticle[]> {
  const db = await getSqliteDatabase();
  const rows = db
    .prepare(
      `
        SELECT * FROM news_articles
        ORDER BY published_at DESC
        LIMIT ?
      `,
    )
    .all(Math.max(1, Math.min(100, limit)));

  return rows.map((row) => rowToArticle(row as Record<string, unknown>));
}

async function listRecentNewsArticlesNeon(limit = 50): Promise<NewsArticle[]> {
  await verifyNeonSchema();
  const sql = getNeonSql();
  const rows = (await sql`
    SELECT * FROM news_articles
    ORDER BY published_at DESC
    LIMIT ${Math.max(1, Math.min(100, limit))}
  `) as Array<Record<string, unknown>>;

  return rows.map(rowToArticle);
}

export async function listRecentNewsArticles(
  limit = 50,
): Promise<NewsArticle[]> {
  return shouldUseSqliteFallback()
    ? listRecentNewsArticlesSqlite(limit)
    : listRecentNewsArticlesNeon(limit);
}
