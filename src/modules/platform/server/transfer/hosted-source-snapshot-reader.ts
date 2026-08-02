import {
  neon,
  type NeonQueryFunction,
} from "@neondatabase/serverless";

import {
  canonicalHostedTransferJson,
  hostedTransferSha256,
} from "./hosted-transfer-contract";
import { platformFailure } from "../database/platform-migration-contract";

type NeonSql = NeonQueryFunction<false, false>;

export const HOSTED_TRANSFER_ACADEMY_DATABASE_URL_ENV =
  "TRADERLINK_HOSTED_TRANSFER_ACADEMY_DATABASE_URL" as const;
export const HOSTED_TRANSFER_WATCHLIST_DATABASE_URL_ENV =
  "TRADERLINK_HOSTED_TRANSFER_WATCHLIST_DATABASE_URL" as const;
export const HOSTED_TRANSFER_NEWS_DATABASE_URL_ENV =
  "TRADERLINK_HOSTED_TRANSFER_NEWS_DATABASE_URL" as const;
export const HOSTED_TRANSFER_AFFILIATE_DATABASE_URL_ENV =
  "TRADERLINK_HOSTED_TRANSFER_AFFILIATE_DATABASE_URL" as const;

export type HostedAcademyUser = Readonly<{
  authSubject: string;
  username: string;
  globalDisplayName: string | null;
}>;

export type HostedAcademyCompletion = Readonly<{
  authSubject: string;
  lessonSlug: string;
  completedAtUtc: string;
}>;

export type HostedAcademySnapshot = Readonly<{
  users: readonly HostedAcademyUser[];
  completions: readonly HostedAcademyCompletion[];
  sha256: string;
}>;

export type HostedWatchlistSnapshot = Readonly<{
  symbols: readonly Record<string, unknown>[];
  health: readonly Record<string, unknown>[];
  archives: readonly Record<string, unknown>[];
  sha256: string;
}>;

export type HostedNewsSnapshot = Readonly<{
  articles: readonly Record<string, unknown>[];
  versions: readonly Record<string, unknown>[];
  sha256: string;
}>;

export type HostedAffiliateSnapshot = Readonly<{
  invites: readonly Record<string, unknown>[];
  attributions: readonly Record<string, unknown>[];
  pendingUnmappedRowCount: number;
  sha256: string;
}>;

export type HostedSourceSnapshots = Readonly<{
  academy: HostedAcademySnapshot;
  watchlist: HostedWatchlistSnapshot;
  news: HostedNewsSnapshot;
  affiliate: HostedAffiliateSnapshot;
}>;

function requireUrl(environment: NodeJS.ProcessEnv, key: string): string {
  const value = environment[key]?.trim();
  if (!value || !/^postgres(?:ql)?:\/\//iu.test(value)) {
    platformFailure("TRADERLINK_HOSTED_TRANSFER_INVALID", {
      field: `${key}_missing`,
    });
  }
  return value;
}

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

async function columns(sql: NeonSql, tables: readonly string[]): Promise<Set<string>> {
  const rows = (await sql`
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = ANY(${tables})
  `) as Array<{ table_name?: unknown; column_name?: unknown }>;
  return new Set(rows.map((row) => `${String(row.table_name)}.${String(row.column_name)}`));
}

function requireColumns(observed: Set<string>, required: readonly string[]): void {
  const missing = required.filter((column) => !observed.has(column));
  if (missing.length > 0) {
    platformFailure("TRADERLINK_HOSTED_TRANSFER_INVALID", {
      field: "sourceSchema",
      missingColumnCount: missing.length,
    });
  }
}

export async function readHostedAcademySnapshot(
  environment: NodeJS.ProcessEnv = process.env,
): Promise<HostedAcademySnapshot> {
  const sql = neon(requireUrl(environment, HOSTED_TRANSFER_ACADEMY_DATABASE_URL_ENV));
  const observed = await columns(sql, ["academy_users", "academy_lesson_completions"]);
  requireColumns(observed, [
    "academy_users.discord_user_id",
    "academy_users.username",
    "academy_users.global_name",
    "academy_lesson_completions.discord_user_id",
    "academy_lesson_completions.lesson_slug",
    "academy_lesson_completions.completed_at",
  ]);
  const [userRows, completionRows] = await Promise.all([
    sql`SELECT discord_user_id, username, global_name FROM academy_users ORDER BY discord_user_id`,
    sql`SELECT discord_user_id, lesson_slug, completed_at FROM academy_lesson_completions ORDER BY discord_user_id, lesson_slug`,
  ]);
  const users = Object.freeze((userRows as Array<Record<string, unknown>>).map((row) =>
    Object.freeze({
      authSubject: text(row.discord_user_id, "academyUserSubject", 255),
      username: text(row.username, "academyUsername", 120),
      globalDisplayName: optionalText(row.global_name, 120),
    })));
  const completions = Object.freeze(
    (completionRows as Array<Record<string, unknown>>).map((row) =>
      Object.freeze({
        authSubject: text(row.discord_user_id, "academyCompletionSubject", 255),
        lessonSlug: text(row.lesson_slug, "academyLessonSlug", 512),
        completedAtUtc: utc(row.completed_at, "academyCompletedAt"),
      }),
    ),
  );
  return Object.freeze({ users, completions, sha256: hostedTransferSha256({ users, completions }) });
}

export async function readHostedWatchlistSnapshot(
  environment: NodeJS.ProcessEnv = process.env,
): Promise<HostedWatchlistSnapshot> {
  const sql = neon(requireUrl(environment, HOSTED_TRANSFER_WATCHLIST_DATABASE_URL_ENV));
  const observed = await columns(sql, [
    "live_watchlist_symbols", "live_watchlist_health", "live_watchlist_archives",
  ]);
  requireColumns(observed, [
    "live_watchlist_symbols.symbol", "live_watchlist_symbols.status",
    "live_watchlist_symbols.updated_at", "live_watchlist_symbols.state_json",
    "live_watchlist_symbols.revision", "live_watchlist_health.key",
    "live_watchlist_health.market_data_status", "live_watchlist_health.market_data_updated_at",
    "live_watchlist_archives.archive_id", "live_watchlist_archives.symbol",
    "live_watchlist_archives.archived_at", "live_watchlist_archives.first_posted_at",
    "live_watchlist_archives.last_active_updated_at", "live_watchlist_archives.state_json",
  ]);
  const [symbolRows, healthRows, archiveRows] = await Promise.all([
    sql`SELECT symbol, status, updated_at, state_json, revision FROM live_watchlist_symbols ORDER BY symbol`,
    sql`SELECT key, market_data_status, market_data_updated_at FROM live_watchlist_health ORDER BY key`,
    sql`SELECT archive_id, symbol, archived_at, first_posted_at, last_active_updated_at, state_json FROM live_watchlist_archives ORDER BY archive_id`,
  ]);
  const symbols = Object.freeze((symbolRows as Array<Record<string, unknown>>).map((row) => Object.freeze({
    symbol: text(row.symbol, "watchlistSymbol", 64).toUpperCase(),
    status: text(row.status, "watchlistStatus", 32),
    updated_at: integer(row.updated_at, "watchlistUpdatedAt"),
    state_json: json(row.state_json, "watchlistState"),
    revision: integer(row.revision, "watchlistRevision"),
  })));
  const health = Object.freeze((healthRows as Array<Record<string, unknown>>).map((row) => Object.freeze({
    key: text(row.key, "watchlistHealthKey", 32),
    market_data_status: text(row.market_data_status, "watchlistHealthStatus", 32),
    market_data_updated_at: row.market_data_updated_at === null ? null : integer(row.market_data_updated_at, "watchlistHealthUpdatedAt"),
  })));
  const archives = Object.freeze((archiveRows as Array<Record<string, unknown>>).map((row) => Object.freeze({
    archive_id: text(row.archive_id, "watchlistArchiveId", 128).toUpperCase(),
    symbol: text(row.symbol, "watchlistArchiveSymbol", 64).toUpperCase(),
    archived_at: integer(row.archived_at, "watchlistArchivedAt"),
    first_posted_at: row.first_posted_at === null ? null : integer(row.first_posted_at, "watchlistFirstPostedAt"),
    last_active_updated_at: integer(row.last_active_updated_at, "watchlistLastActiveUpdatedAt"),
    state_json: json(row.state_json, "watchlistArchiveState"),
  })));
  return Object.freeze({ symbols, health, archives, sha256: hostedTransferSha256({ symbols, health, archives }) });
}

export async function readHostedNewsSnapshot(
  environment: NodeJS.ProcessEnv = process.env,
): Promise<HostedNewsSnapshot> {
  const sql = neon(requireUrl(environment, HOSTED_TRANSFER_NEWS_DATABASE_URL_ENV));
  const observed = await columns(sql, ["news_articles", "news_article_versions"]);
  const articleColumns = [
    "id", "source_event_id", "canonical_source_key", "ticker", "slug", "headline",
    "summary", "article_text", "source_url", "event_type", "route_tag", "published_at",
    "created_at", "updated_at", "metadata_json", "positives_json", "negatives_json",
    "risk_flags_json", "diagnostics_json", "raw_payload_json", "revision", "content_sha256",
  ] as const;
  const versionColumns = [
    "version_id", "article_id", "revision", "source_event_id", "canonical_source_key",
    "ticker", "slug", "headline", "summary", "article_text", "source_url", "event_type",
    "route_tag", "published_at", "created_at", "changed_at", "metadata_json",
    "positives_json", "negatives_json", "risk_flags_json", "diagnostics_json",
    "raw_payload_json", "content_sha256", "change_source",
  ] as const;
  requireColumns(observed, [
    ...articleColumns.map((column) => `news_articles.${column}`),
    ...versionColumns.map((column) => `news_article_versions.${column}`),
  ]);
  const [articleRows, versionRows] = await Promise.all([
    sql`SELECT * FROM news_articles ORDER BY id`,
    sql`SELECT * FROM news_article_versions ORDER BY article_id, revision`,
  ]);
  const normalizeRow = (row: Record<string, unknown>, keys: readonly string[]) =>
    Object.freeze(Object.fromEntries(keys.map((key) => {
      const value = row[key];
      if (key.endsWith("_json")) return [key, json(value, `news_${key}`)];
      if (key === "revision") return [key, integer(value, "newsRevision")];
      if (key.endsWith("_at")) return [key, utc(value, `news_${key}`)];
      return [key, value === null ? null : text(value, `news_${key}`, 1_000_000)];
    })));
  const articles = Object.freeze((articleRows as Array<Record<string, unknown>>).map((row) => normalizeRow(row, articleColumns)));
  const versions = Object.freeze((versionRows as Array<Record<string, unknown>>).map((row) => normalizeRow(row, versionColumns)));
  return Object.freeze({ articles, versions, sha256: hostedTransferSha256({ articles, versions }) });
}

export async function readHostedAffiliateSnapshot(
  environment: NodeJS.ProcessEnv = process.env,
): Promise<HostedAffiliateSnapshot> {
  const sql = neon(requireUrl(environment, HOSTED_TRANSFER_AFFILIATE_DATABASE_URL_ENV));
  const observed = await columns(sql, [
    "affiliate_invites", "affiliate_attributions", "affiliate_discord_referrals",
    "platform_auth_identities",
  ]);
  let invites: readonly Record<string, unknown>[] = Object.freeze([]);
  if (observed.has("affiliate_invites.invite_code")) {
    requireColumns(observed, [
      "affiliate_invites.affiliate_code", "affiliate_invites.affiliate_name",
      "affiliate_invites.active", "affiliate_invites.created_at_utc",
      "affiliate_invites.updated_at_utc", "affiliate_invites.metadata_json",
    ]);
    const rows = await sql`SELECT * FROM affiliate_invites ORDER BY invite_code`;
    invites = Object.freeze((rows as Array<Record<string, unknown>>).map((row) => Object.freeze({
      invite_code: text(row.invite_code, "affiliateInviteCode", 96),
      affiliate_code: text(row.affiliate_code, "affiliateCode", 80),
      affiliate_name: optionalText(row.affiliate_name, 120),
      active: Boolean(row.active),
      created_at_utc: utc(row.created_at_utc, "affiliateInviteCreatedAt"),
      updated_at_utc: utc(row.updated_at_utc, "affiliateInviteUpdatedAt"),
      metadata_json: json(row.metadata_json, "affiliateInviteMetadata"),
    })));
  }

  let attributions: readonly Record<string, unknown>[] = Object.freeze([]);
  const canMapAttributions = [
    "affiliate_attributions.user_id", "affiliate_attributions.affiliate_code",
    "affiliate_attributions.invite_code", "affiliate_attributions.joined_at_utc",
    "affiliate_attributions.first_seen_at_utc", "affiliate_attributions.last_seen_at_utc",
    "affiliate_attributions.source", "affiliate_attributions.created_at_utc",
    "affiliate_attributions.metadata_json", "platform_auth_identities.user_id",
    "platform_auth_identities.auth_provider", "platform_auth_identities.auth_subject",
    "platform_auth_identities.status",
  ].every((column) => observed.has(column));
  if (canMapAttributions) {
    const rows = await sql`SELECT
      identity.auth_subject,
      attribution.affiliate_code,
      attribution.invite_code,
      attribution.joined_at_utc,
      attribution.first_seen_at_utc,
      attribution.last_seen_at_utc,
      attribution.source,
      attribution.created_at_utc,
      attribution.metadata_json
    FROM affiliate_attributions attribution
    INNER JOIN platform_auth_identities identity
      ON identity.user_id = attribution.user_id
      AND identity.auth_provider = 'discord'
      AND identity.status = 'active'
    ORDER BY identity.auth_subject`;
    attributions = Object.freeze((rows as Array<Record<string, unknown>>).map((row) => Object.freeze({
      auth_subject: text(row.auth_subject, "affiliateAuthSubject", 255),
      affiliate_code: text(row.affiliate_code, "affiliateAttributionCode", 80),
      invite_code: optionalText(row.invite_code, 96),
      joined_at_utc: row.joined_at_utc === null ? null : utc(row.joined_at_utc, "affiliateJoinedAt"),
      first_seen_at_utc: utc(row.first_seen_at_utc, "affiliateFirstSeenAt"),
      last_seen_at_utc: utc(row.last_seen_at_utc, "affiliateLastSeenAt"),
      source: text(row.source, "affiliateSource", 64),
      created_at_utc: utc(row.created_at_utc, "affiliateCreatedAt"),
      metadata_json: json(row.metadata_json, "affiliateAttributionMetadata"),
    })));
  }

  let pendingUnmappedRowCount = 0;
  if (observed.has("affiliate_attributions.user_id")) {
    const rows = await sql`SELECT COUNT(*) AS count FROM affiliate_attributions`;
    const totalAttributionCount = integer(
      (rows as Array<Record<string, unknown>>)[0]?.count ?? 0,
      "affiliateAttributionCount",
    );
    pendingUnmappedRowCount += totalAttributionCount - attributions.length;
  }
  if (observed.has("affiliate_discord_referrals.discord_user_id")) {
    const rows = await sql`SELECT COUNT(*) AS count FROM affiliate_discord_referrals`;
    pendingUnmappedRowCount += integer(
      (rows as Array<Record<string, unknown>>)[0]?.count ?? 0,
      "affiliateLegacyReferralCount",
    );
  }
  const snapshot = { invites, attributions, pendingUnmappedRowCount };
  return Object.freeze({ ...snapshot, sha256: hostedTransferSha256(snapshot) });
}

export async function readHostedSourceSnapshots(
  environment: NodeJS.ProcessEnv = process.env,
): Promise<HostedSourceSnapshots> {
  const [academy, watchlist, news, affiliate] = await Promise.all([
    readHostedAcademySnapshot(environment),
    readHostedWatchlistSnapshot(environment),
    readHostedNewsSnapshot(environment),
    readHostedAffiliateSnapshot(environment),
  ]);
  return Object.freeze({ academy, watchlist, news, affiliate });
}
