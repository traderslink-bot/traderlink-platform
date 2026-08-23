import "server-only";

import { createHash } from "node:crypto";
import type Database from "better-sqlite3";

import type { WorkspaceAccessScope, WorkspaceRole } from "@/src/modules/platform/contracts/workspace-access-scope";
import {
  createCanonicalUtcTimestamp,
  createCanonicalUuidV4,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";
import { PlatformNotificationRepository } from "@/src/modules/platform/server/notifications/platform-notification-repository";

export type WeekAheadCatalystGroup = Readonly<{
  dateLabel: string;
  items: readonly Readonly<{ text: string; ticker: string }>[];
}>;

export type WeekAheadConferenceEvent = Readonly<{
  dateLabel: string;
  summary: string;
  tickers: readonly string[];
  title: string;
}>;

export type WeekAheadStructuredContent = Readonly<{
  companyCatalysts: readonly WeekAheadCatalystGroup[];
  conferenceEvents: readonly WeekAheadConferenceEvent[];
  dateRange: string;
  riskNotes: readonly string[];
  title: string;
  version: number;
}>;

export type WeekAheadIssue = Readonly<{
  articleText: string;
  catalysts: readonly string[];
  excerpt: string;
  issueId: string;
  issueSlug: string;
  publishedAtUtc: string;
  riskNotes: readonly string[];
  sourceAttribution: string;
  sourceDateLine: string;
  sourceName: string;
  sourceUrl: string;
  structuredContent: WeekAheadStructuredContent;
  tickers: readonly string[];
  title: string;
  updatedAtUtc: string;
}>;

type WeekAheadIssueRow = Readonly<{
  article_text: string;
  catalysts_json: string;
  excerpt: string;
  issue_id: string;
  issue_slug: string;
  published_at_utc: string;
  risk_notes_json: string;
  source_attribution: string;
  source_date_line: string;
  source_name: string;
  source_url: string;
  structured_content_json: string;
  tickers_json: string;
  title: string;
  updated_at_utc: string;
}>;

type StoredIssueRow = WeekAheadIssueRow & Readonly<{
  content_sha256: string;
  revision: number;
}>;

type ActiveRecipientRow = Readonly<{
  user_id: string;
  workspace_id: string;
  workspace_role: string;
}>;

type NormalizedIssue = Readonly<{
  articleText: string;
  catalysts: readonly string[];
  contentSha256: string;
  excerpt: string;
  issueSlug: string;
  publishedAtUtc: string;
  riskNotes: readonly string[];
  sourceAttribution: string;
  sourceDateLine: string;
  sourceName: string;
  sourceSlug: string;
  sourceUrl: string;
  structuredContent: WeekAheadStructuredContent;
  tickers: readonly string[];
  title: string;
}>;

function text(value: unknown, maximum: number, required = false): string {
  const normalized = typeof value === "string" ? value.replace(/\s+/gu, " ").trim() : "";
  if (required && !normalized) {
    platformFailure("TRADERLINK_NEWS_STORAGE_INVALID", { field: "weekAheadText" });
  }
  if (normalized.length > maximum) {
    platformFailure("TRADERLINK_NEWS_STORAGE_INVALID", { field: "weekAheadTextLength" });
  }
  return normalized;
}

function longText(value: unknown, maximum: number, required = false): string {
  const normalized = typeof value === "string" ? value.trim() : "";
  if (required && !normalized) {
    platformFailure("TRADERLINK_NEWS_STORAGE_INVALID", { field: "weekAheadText" });
  }
  if (normalized.length > maximum || normalized.includes("\u0000")) {
    platformFailure("TRADERLINK_NEWS_STORAGE_INVALID", { field: "weekAheadTextLength" });
  }
  return normalized;
}

function stringArray(value: unknown, maximumItems: number, maximumItemLength: number): readonly string[] {
  if (!Array.isArray(value) || value.length > maximumItems) {
    platformFailure("TRADERLINK_NEWS_STORAGE_INVALID", { field: "weekAheadArray" });
  }
  return Object.freeze(Array.from(new Set(value.map((item) => text(item, maximumItemLength, true)))));
}

function tickerArray(value: unknown): readonly string[] {
  return Object.freeze(Array.from(new Set(stringArray(value, 500, 16).map((ticker) => {
    const normalized = ticker.toUpperCase().replace(/[^A-Z0-9.-]/gu, "");
    if (!normalized) platformFailure("TRADERLINK_NEWS_STORAGE_INVALID", { field: "weekAheadTicker" });
    return normalized;
  }))));
}

function slug(value: unknown, fallback: string): string {
  const normalized = text(value, 220)
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-+|-+$/gu, "")
    .slice(0, 120)
    .replace(/-+$/gu, "");
  return normalized || fallback;
}

function sourceUrl(value: unknown): string {
  const candidate = text(value, 2048, true);
  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    platformFailure("TRADERLINK_NEWS_STORAGE_INVALID", { field: "weekAheadSourceUrl" });
  }
  if (parsed.protocol !== "https:" || !["bigtimepennystocks.com", "www.bigtimepennystocks.com"].includes(parsed.hostname.toLowerCase())) {
    platformFailure("TRADERLINK_NEWS_STORAGE_INVALID", { field: "weekAheadSourceHost" });
  }
  parsed.hash = "";
  return parsed.toString().replace(/\/$/u, "");
}

function timestamp(value: unknown): string {
  const parsed = new Date(typeof value === "string" ? value : "");
  if (!Number.isFinite(parsed.getTime())) {
    platformFailure("TRADERLINK_NEWS_STORAGE_INVALID", { field: "weekAheadPublishedAt" });
  }
  return parsed.toISOString();
}

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    platformFailure("TRADERLINK_NEWS_STORAGE_INVALID", { field: "weekAheadStructuredContent" });
  }
  return value as Record<string, unknown>;
}

function structuredContent(value: unknown): WeekAheadStructuredContent {
  const candidate = object(value);
  const companyCatalysts = Array.isArray(candidate.companyCatalysts) ? candidate.companyCatalysts : [];
  const conferenceEvents = Array.isArray(candidate.conferenceEvents) ? candidate.conferenceEvents : [];
  if (companyCatalysts.length + conferenceEvents.length === 0 || companyCatalysts.length > 100 || conferenceEvents.length > 100) {
    platformFailure("TRADERLINK_NEWS_STORAGE_INVALID", { field: "weekAheadStructuredSections" });
  }
  const catalysts = companyCatalysts.map((group) => {
    const item = object(group);
    const items = Array.isArray(item.items) ? item.items : [];
    if (items.length === 0 || items.length > 500) {
      platformFailure("TRADERLINK_NEWS_STORAGE_INVALID", { field: "weekAheadCatalystItems" });
    }
    return Object.freeze({
      dateLabel: text(item.dateLabel, 120, true),
      items: Object.freeze(items.map((entry) => {
        const catalyst = object(entry);
        const ticker = text(catalyst.ticker, 16, true).toUpperCase().replace(/[^A-Z0-9.-]/gu, "");
        if (!ticker) platformFailure("TRADERLINK_NEWS_STORAGE_INVALID", { field: "weekAheadCatalystTicker" });
        return Object.freeze({ text: text(catalyst.text, 1200, true), ticker });
      })),
    });
  });
  const conferences = conferenceEvents.map((event) => {
    const item = object(event);
    return Object.freeze({
      dateLabel: text(item.dateLabel, 120, true),
      summary: text(item.summary, 1600, true),
      tickers: tickerArray(item.tickers ?? []),
      title: text(item.title, 240, true),
    });
  });
  return Object.freeze({
    companyCatalysts: Object.freeze(catalysts),
    conferenceEvents: Object.freeze(conferences),
    dateRange: text(candidate.dateRange, 160, true),
    riskNotes: stringArray(candidate.riskNotes ?? [], 30, 500),
    title: text(candidate.title, 220, true),
    version: Number.isInteger(candidate.version) && Number(candidate.version) > 0 ? Number(candidate.version) : 1,
  });
}

function parseJsonArray(value: string): readonly string[] {
  try {
    return stringArray(JSON.parse(value), 500, 1600);
  } catch {
    platformFailure("TRADERLINK_NEWS_STORAGE_INVALID", { field: "weekAheadStoredArray" });
  }
}

function parseStructuredContent(value: string): WeekAheadStructuredContent {
  try {
    return structuredContent(JSON.parse(value));
  } catch {
    platformFailure("TRADERLINK_NEWS_STORAGE_INVALID", { field: "weekAheadStoredContent" });
  }
}

function toIssue(row: WeekAheadIssueRow): WeekAheadIssue {
  return Object.freeze({
    articleText: row.article_text,
    catalysts: parseJsonArray(row.catalysts_json),
    excerpt: row.excerpt,
    issueId: row.issue_id,
    issueSlug: row.issue_slug,
    publishedAtUtc: row.published_at_utc,
    riskNotes: parseJsonArray(row.risk_notes_json),
    sourceAttribution: row.source_attribution,
    sourceDateLine: row.source_date_line,
    sourceName: row.source_name,
    sourceUrl: row.source_url,
    structuredContent: parseStructuredContent(row.structured_content_json),
    tickers: parseJsonArray(row.tickers_json),
    title: row.title,
    updatedAtUtc: row.updated_at_utc,
  });
}

function normalize(input: unknown): NormalizedIssue {
  const candidate = object(input);
  const normalizedSourceUrl = sourceUrl(candidate.sourceUrl);
  const content = structuredContent(candidate.structuredContent);
  const normalized = Object.freeze({
    articleText: longText(candidate.rewrittenContent, 60000, true),
    catalysts: stringArray(candidate.catalystsMentioned ?? [], 100, 240),
    excerpt: text(candidate.rewrittenExcerpt, 1000, true),
    issueSlug: slug(candidate.publicSlug ?? candidate.slug ?? candidate.rewrittenTitle, "the-week-ahead"),
    publishedAtUtc: timestamp(candidate.aiProcessedAt ?? candidate.scrapedAt),
    riskNotes: stringArray(candidate.riskNotes ?? content.riskNotes, 30, 500),
    sourceAttribution: text(candidate.sourceAttribution, 1000),
    sourceDateLine: text(candidate.sourceDateLine, 160),
    sourceName: text(candidate.sourceName, 120) || "BigTime Penny Stocks",
    sourceSlug: slug(candidate.slug ?? normalizedSourceUrl, "week-ahead"),
    sourceUrl: normalizedSourceUrl,
    structuredContent: content,
    tickers: tickerArray(candidate.tickersMentioned ?? []),
    title: text(candidate.rewrittenTitle, 220, true),
  });
  const contentSha256 = createHash("sha256").update(JSON.stringify(normalized), "utf8").digest("hex");
  return Object.freeze({ ...normalized, contentSha256 });
}

function recipientScopes(database: Database.Database): readonly WorkspaceAccessScope[] {
  const rows = database.prepare<[], ActiveRecipientRow>(`SELECT
  membership.user_id, membership.workspace_id, membership.role AS workspace_role
FROM platform_workspace_memberships membership
JOIN platform_users user ON user.user_id = membership.user_id
JOIN platform_workspaces workspace ON workspace.workspace_id = membership.workspace_id
WHERE membership.status = 'active' AND user.status = 'active' AND workspace.status = 'active'`).all();
  return Object.freeze(rows.flatMap((row) => {
    if (!(["owner", "admin", "member"] as const).includes(row.workspace_role as WorkspaceRole)) return [];
    return [Object.freeze({
      activeAccountId: null,
      allowedAccountIds: Object.freeze([]),
      userId: row.user_id,
      workspaceId: row.workspace_id,
      workspaceRole: row.workspace_role as WorkspaceRole,
    })];
  }));
}

function sourceEventKey(source: string): string {
  return `week_ahead_${createHash("sha256").update(source, "utf8").digest("hex").slice(0, 48)}`;
}

export class WeekAheadRepository {
  constructor(private readonly database: Database.Database) {}

  current(): WeekAheadIssue | null {
    const row = this.database.prepare<[], WeekAheadIssueRow>(`SELECT
  issue_id, issue_slug, title, excerpt, article_text, source_url, source_name,
  source_date_line, source_attribution, tickers_json, catalysts_json,
  risk_notes_json, structured_content_json, published_at_utc, updated_at_utc
FROM news_week_ahead_issues
JOIN news_week_ahead_current_issue current_issue
  ON current_issue.state_id = 1
  AND current_issue.issue_id = news_week_ahead_issues.issue_id`).get();
    return row ? toIssue(row) : null;
  }

  publish(input: unknown): Readonly<{ issue: WeekAheadIssue; notificationCount: number; wasUpdated: boolean }> {
    const next = normalize(input);
    const saved = this.database.transaction(() => {
      const existing = this.database.prepare<[string], StoredIssueRow>(`SELECT
  issue_id, issue_slug, title, excerpt, article_text, source_url, source_name,
  source_date_line, source_attribution, tickers_json, catalysts_json,
  risk_notes_json, structured_content_json, published_at_utc, updated_at_utc,
  revision, content_sha256
FROM news_week_ahead_issues WHERE source_url = ?`).get(next.sourceUrl);
      if (existing && existing.content_sha256 === next.contentSha256) {
        return Object.freeze({ issue: toIssue(existing), wasUpdated: false });
      }
      const nowUtc = createCanonicalUtcTimestamp();
      const issueId = existing?.issue_id ?? createCanonicalUuidV4();
      const revision = (existing?.revision ?? 0) + 1;
      const issueSlug = existing?.issue_slug ?? next.issueSlug;
      this.database.prepare(`INSERT INTO news_week_ahead_issues (
  issue_id, source_url, source_slug, issue_slug, title, excerpt, article_text,
  source_name, source_date_line, source_attribution, tickers_json,
  catalysts_json, risk_notes_json, structured_content_json, published_at_utc,
  created_at_utc, updated_at_utc, revision, content_sha256
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
ON CONFLICT(issue_id) DO UPDATE SET
  title = excluded.title, excerpt = excluded.excerpt, article_text = excluded.article_text,
  source_name = excluded.source_name, source_date_line = excluded.source_date_line,
  source_attribution = excluded.source_attribution, tickers_json = excluded.tickers_json,
  catalysts_json = excluded.catalysts_json, risk_notes_json = excluded.risk_notes_json,
  structured_content_json = excluded.structured_content_json,
  published_at_utc = excluded.published_at_utc, updated_at_utc = excluded.updated_at_utc,
  revision = excluded.revision, content_sha256 = excluded.content_sha256`).run(
        issueId, next.sourceUrl, next.sourceSlug, issueSlug, next.title, next.excerpt,
        next.articleText, next.sourceName, next.sourceDateLine, next.sourceAttribution,
        JSON.stringify(next.tickers), JSON.stringify(next.catalysts), JSON.stringify(next.riskNotes),
        JSON.stringify(next.structuredContent), next.publishedAtUtc,
        existing?.updated_at_utc ?? nowUtc, nowUtc, revision, next.contentSha256,
      );
      const versionPayload = JSON.stringify(next);
      this.database.prepare(`INSERT INTO news_week_ahead_issue_versions (
  version_id, issue_id, revision, content_sha256, payload_json, created_at_utc
) VALUES (?, ?, ?, ?, ?, ?)`).run(
        createCanonicalUuidV4(), issueId, revision, next.contentSha256, versionPayload, nowUtc,
      );
      this.database.prepare(`INSERT INTO news_week_ahead_current_issue (
  state_id, issue_id, updated_at_utc
) VALUES (1, ?, ?)
ON CONFLICT(state_id) DO UPDATE SET
  issue_id = excluded.issue_id,
  updated_at_utc = excluded.updated_at_utc`).run(issueId, nowUtc);
      const savedRow = this.database.prepare<[string], WeekAheadIssueRow>(`SELECT
  issue_id, issue_slug, title, excerpt, article_text, source_url, source_name,
  source_date_line, source_attribution, tickers_json, catalysts_json,
  risk_notes_json, structured_content_json, published_at_utc, updated_at_utc
FROM news_week_ahead_issues WHERE issue_id = ?`).get(issueId);
      if (!savedRow) platformFailure("TRADERLINK_NEWS_STORAGE_INVALID", { field: "weekAheadSavedIssue" });
      return Object.freeze({ issue: toIssue(savedRow), wasUpdated: true });
    })();

    const notification = new PlatformNotificationRepository(this.database);
    const scopes = recipientScopes(this.database);
    const summary = `${saved.issue.structuredContent.dateRange} catalyst calendar is now available.`;
    const eventKey = sourceEventKey(saved.issue.sourceUrl);
    for (const scope of scopes) {
      notification.create({
        category: "market_news",
        destinationPath: "/market-news/week-ahead",
        journalAccountId: null,
        kind: "week_ahead_ready",
        occurredAtUtc: saved.issue.updatedAtUtc,
        scope,
        sourceEventKey: eventKey,
        summary,
        title: "The Week Ahead is ready",
      });
    }
    return Object.freeze({
      issue: saved.issue,
      notificationCount: scopes.length,
      wasUpdated: saved.wasUpdated,
    });
  }
}
