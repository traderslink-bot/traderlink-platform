import { randomBytes } from "node:crypto";

import { neon } from "@neondatabase/serverless";
import DatabaseConstructor from "better-sqlite3";
import type Database from "better-sqlite3";

import { affiliateAttributionMigration } from "@/src/modules/affiliate/server/database/migrations/0016_affiliate_attribution";
import { platformIdentityMigration } from "@/src/modules/platform/server/database/migrations/0001_platform_identity";
import { openPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import {
  assertCanonicalUtcTimestamp,
  assertCanonicalUuidV4,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";
import { requirePlatformSingleNodeSqliteStorage } from "@/src/modules/platform/server/database/platform-storage-backend";

type SqliteDatabase = Database.Database;
type NeonSql = ReturnType<typeof neon>;

export interface AffiliateInviteRecord {
  active: boolean;
  affiliateCode: string;
  affiliateName: string | null;
  createdAtUtc: string;
  inviteCode: string;
  updatedAtUtc: string;
}

export interface AffiliateAttributionRecord {
  affiliateCode: string;
  createdAtUtc: string;
  firstSeenAtUtc: string;
  inviteCode: string | null;
  joinedAtUtc: string | null;
  lastSeenAtUtc: string;
  platformUserId: string;
  source: string;
}

let sharedSqliteDatabase: SqliteDatabase | null = null;
let sharedNeonSql: NeonSql | null = null;
let sharedNeonSchemaPromise: Promise<void> | null = null;

export function normalizeAffiliateCode(value: string | null | undefined): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "";

  try {
    const parsed = new URL(raw);
    const affiliateParam = parsed.searchParams.get("a");
    if (affiliateParam) return normalizeAffiliateCode(affiliateParam);
  } catch {
    const match = raw.match(/[?&]a=([^&#\s]+)/i);
    if (match?.[1]) return normalizeAffiliateCode(decodeURIComponent(match[1]));
  }

  return raw
    .replace(/^@+/, "")
    .replace(/^\?a=/i, "")
    .replace(/[^a-zA-Z0-9_.-]/g, "")
    .slice(0, 80);
}

export function normalizeInviteCode(value: string | null | undefined): string {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return "";

  try {
    const parsed = new URL(trimmed);
    const parts = parsed.pathname.split("/").filter(Boolean);
    return String(parts.at(-1) ?? "")
      .replace(/[^a-zA-Z0-9_-]/g, "")
      .slice(0, 96);
  } catch {
    return trimmed
      .replace(
        /^https?:\/\/(www\.)?(discord\.gg|discord(app)?\.com\/invite)\//i,
        "",
      )
      .replace(/[^a-zA-Z0-9_-]/g, "")
      .slice(0, 96);
  }
}

export function buildWhopCheckoutUrl(args: {
  affiliateCode?: string | null;
  baseUrl?: string | null;
}): string {
  const fallback =
    "https://whop.com/traderslink-app/filtered-news-momentum-scanner-access/";
  const baseUrl = String(
    args.baseUrl || process.env.TRADERSLINK_WHOP_PRODUCT_URL || fallback,
  ).trim();
  const affiliateCode = normalizeAffiliateCode(args.affiliateCode);
  const url = new URL(baseUrl || fallback);
  if (affiliateCode) url.searchParams.set("a", affiliateCode);
  return url.toString();
}

function databaseUrl(): string | undefined {
  return process.env.AFFILIATE_REFERRAL_DATABASE_URL?.trim() || undefined;
}

function shouldUseSqlite(): boolean {
  if (
    process.env.NODE_ENV === "test" &&
    process.env.AFFILIATE_REFERRAL_STORAGE === "neon"
  ) {
    if (!databaseUrl()) {
      platformFailure("TRADERLINK_AFFILIATE_STORAGE_INVALID", {
        reason: "hosted_url_missing",
      });
    }
    return false;
  }
  requirePlatformSingleNodeSqliteStorage("TRADERLINK_AFFILIATE_STORAGE_INVALID");
  return true;
}

function explicitTestDatabasePath(): string | undefined {
  const configured = process.env.AFFILIATE_REFERRAL_DB_PATH?.trim();
  if (configured && process.env.NODE_ENV !== "test") {
    platformFailure("TRADERLINK_AFFILIATE_STORAGE_INVALID", {
      reason: "isolated_sqlite_path_test_only",
    });
  }
  return configured || undefined;
}

function initializeAffiliateTestDatabase(database: SqliteDatabase): void {
  database.pragma("foreign_keys = ON");
  database.pragma("busy_timeout = 5000");
  for (const statement of [
    ...platformIdentityMigration.statements,
    ...affiliateAttributionMigration.statements,
  ]) {
    database.exec(statement);
  }
}

async function getSqliteDatabase(): Promise<SqliteDatabase> {
  if (sharedSqliteDatabase) return sharedSqliteDatabase;
  const testPath = explicitTestDatabasePath();
  if (testPath) {
    const database = new DatabaseConstructor(testPath);
    initializeAffiliateTestDatabase(database);
    sharedSqliteDatabase = database;
    return database;
  }
  sharedSqliteDatabase = openPlatformDatabase({ mode: "runtime" });
  return sharedSqliteDatabase;
}

function getNeonSql(): NeonSql {
  const url = databaseUrl();
  if (!url) {
    platformFailure("TRADERLINK_AFFILIATE_STORAGE_INVALID", {
      reason: "hosted_url_missing",
    });
  }
  sharedNeonSql ??= neon(url);
  return sharedNeonSql;
}

async function verifyNeonSchema(): Promise<void> {
  if (sharedNeonSchemaPromise) return sharedNeonSchemaPromise;
  const sql = getNeonSql();
  sharedNeonSchemaPromise = Promise.all([
    sql`
      SELECT table_name, column_name
      FROM information_schema.columns
      WHERE table_schema = current_schema()
        AND table_name IN ('affiliate_invites', 'affiliate_attributions')
    `,
    sql`
      SELECT indexname
      FROM pg_indexes
      WHERE schemaname = current_schema()
        AND indexname IN (
          'affiliate_invites_affiliate_code_idx',
          'affiliate_attributions_code_first_seen_idx'
        )
    `,
  ]).then(([columnRows, indexRows]) => {
    const columns = new Set(
      (columnRows as Array<{ table_name?: unknown; column_name?: unknown }>).map(
        (row) => `${String(row.table_name)}.${String(row.column_name)}`,
      ),
    );
    const required = [
      "affiliate_invites.invite_code",
      "affiliate_invites.affiliate_code",
      "affiliate_attributions.user_id",
      "affiliate_attributions.affiliate_code",
      "affiliate_attributions.first_seen_at_utc",
      "affiliate_attributions.last_seen_at_utc",
    ];
    if (
      required.some((column) => !columns.has(column)) ||
      (indexRows as Array<unknown>).length !== 2
    ) {
      platformFailure("TRADERLINK_AFFILIATE_STORAGE_INVALID", {
        reason: "hosted_schema_incomplete",
      });
    }
  });
  return sharedNeonSchemaPromise;
}

export function resetAffiliateReferralStoreForTests(): void {
  sharedSqliteDatabase?.close();
  sharedSqliteDatabase = null;
  sharedNeonSql = null;
  sharedNeonSchemaPromise = null;
}

function isSensitiveMetadataKey(key: string): boolean {
  return /(authorization|cookie|password|secret|token|webhook|raw[_-]?user)/iu.test(
    key,
  );
}

function sanitizeMetadata(value: unknown, depth = 0): unknown {
  if (depth > 6) return null;
  if (!value || typeof value !== "object") return value;
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeMetadata(item, depth + 1));
  }
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !isSensitiveMetadataKey(key))
      .map(([key, nested]) => [key, sanitizeMetadata(nested, depth + 1)]),
  );
}

function safeMetadataJson(value: unknown): string {
  return JSON.stringify(sanitizeMetadata(value ?? {}));
}

function normalizeSource(value: string | null | undefined): string {
  const source = String(value || "discord_invite").trim().toLowerCase();
  if (!/^[a-z][a-z0-9_-]{0,63}$/u.test(source)) {
    platformFailure("TRADERLINK_AFFILIATE_STORAGE_INVALID", {
      field: "source",
    });
  }
  return source;
}

function normalizeOptionalTimestamp(value: string | null | undefined): string | null {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return null;
  const date = new Date(trimmed);
  if (!Number.isFinite(date.getTime())) {
    platformFailure("TRADERLINK_AFFILIATE_STORAGE_INVALID", {
      field: "joinedAtUtc",
    });
  }
  const timestamp = date.toISOString();
  assertCanonicalUtcTimestamp(timestamp, "joinedAtUtc");
  return timestamp;
}

function rowToInvite(row: Record<string, unknown>): AffiliateInviteRecord {
  return Object.freeze({
    active: Boolean(Number(row.active)),
    affiliateCode: String(row.affiliate_code),
    affiliateName:
      typeof row.affiliate_name === "string" ? row.affiliate_name : null,
    createdAtUtc: String(row.created_at_utc),
    inviteCode: String(row.invite_code),
    updatedAtUtc: String(row.updated_at_utc),
  });
}

function rowToAttribution(
  row: Record<string, unknown>,
): AffiliateAttributionRecord {
  return Object.freeze({
    affiliateCode: String(row.affiliate_code),
    createdAtUtc: String(row.created_at_utc),
    firstSeenAtUtc: String(row.first_seen_at_utc),
    inviteCode: typeof row.invite_code === "string" ? row.invite_code : null,
    joinedAtUtc: typeof row.joined_at_utc === "string" ? row.joined_at_utc : null,
    lastSeenAtUtc: String(row.last_seen_at_utc),
    platformUserId: String(row.user_id),
    source: String(row.source),
  });
}

export class AffiliateReferralStore {
  async upsertInvite(args: {
    affiliateCode: string;
    affiliateName?: string | null;
    active?: boolean;
    inviteCode: string;
    metadata?: unknown;
  }): Promise<AffiliateInviteRecord> {
    const affiliateCode = normalizeAffiliateCode(args.affiliateCode);
    const inviteCode = normalizeInviteCode(args.inviteCode);
    if (!affiliateCode || !inviteCode) {
      platformFailure("TRADERLINK_AFFILIATE_STORAGE_INVALID", {
        field: "invite",
      });
    }
    const now = new Date().toISOString();
    const active = args.active ?? true;
    const metadataJson = safeMetadataJson(args.metadata);

    if (!shouldUseSqlite()) {
      await verifyNeonSchema();
      const sql = getNeonSql();
      await sql`INSERT INTO affiliate_invites (
  invite_code, affiliate_code, affiliate_name, active, created_at_utc,
  updated_at_utc, metadata_json
) VALUES (
  ${inviteCode}, ${affiliateCode}, ${args.affiliateName ?? null}, ${active},
  ${now}, ${now}, CAST(${metadataJson} AS jsonb)
) ON CONFLICT (invite_code) DO UPDATE SET
  affiliate_code = EXCLUDED.affiliate_code,
  affiliate_name = EXCLUDED.affiliate_name,
  active = EXCLUDED.active,
  updated_at_utc = EXCLUDED.updated_at_utc,
  metadata_json = EXCLUDED.metadata_json`;
      return (await this.findInvite(inviteCode)) as AffiliateInviteRecord;
    }

    const database = await getSqliteDatabase();
    database.prepare(`INSERT INTO affiliate_invites (
  invite_code, affiliate_code, affiliate_name, active, created_at_utc,
  updated_at_utc, metadata_json
) VALUES (?, ?, ?, ?, ?, ?, ?)
ON CONFLICT(invite_code) DO UPDATE SET
  affiliate_code = excluded.affiliate_code,
  affiliate_name = excluded.affiliate_name,
  active = excluded.active,
  updated_at_utc = excluded.updated_at_utc,
  metadata_json = excluded.metadata_json`)
      .run(
        inviteCode,
        affiliateCode,
        args.affiliateName ?? null,
        active ? 1 : 0,
        now,
        now,
        metadataJson,
      );
    return (await this.findInvite(inviteCode)) as AffiliateInviteRecord;
  }

  async findInvite(inviteCode: string): Promise<AffiliateInviteRecord | null> {
    const normalized = normalizeInviteCode(inviteCode);
    if (!normalized) return null;
    if (!shouldUseSqlite()) {
      await verifyNeonSchema();
      const sql = getNeonSql();
      const rows = (await sql`SELECT * FROM affiliate_invites
WHERE invite_code = ${normalized} LIMIT 1`) as Array<Record<string, unknown>>;
      return rows[0] ? rowToInvite(rows[0]) : null;
    }
    const database = await getSqliteDatabase();
    const row = database
      .prepare("SELECT * FROM affiliate_invites WHERE invite_code = ? LIMIT 1")
      .get(normalized) as Record<string, unknown> | undefined;
    return row ? rowToInvite(row) : null;
  }

  async recordAttribution(args: {
    affiliateCode?: string | null;
    platformUserId: string;
    inviteCode?: string | null;
    joinedAtUtc?: string | null;
    metadata?: unknown;
    source?: string | null;
  }): Promise<AffiliateAttributionRecord> {
    assertCanonicalUuidV4(args.platformUserId, "platformUserId");
    const inviteCode = normalizeInviteCode(args.inviteCode);
    let affiliateCode = normalizeAffiliateCode(args.affiliateCode);
    if (!affiliateCode && inviteCode) {
      const invite = await this.findInvite(inviteCode);
      if (invite?.active) affiliateCode = invite.affiliateCode;
    }
    if (!affiliateCode) {
      platformFailure("TRADERLINK_AFFILIATE_STORAGE_INVALID", {
        field: "affiliateCode",
      });
    }
    const now = new Date().toISOString();
    const joinedAtUtc = normalizeOptionalTimestamp(args.joinedAtUtc);
    const source = normalizeSource(args.source);
    const metadataJson = safeMetadataJson(args.metadata);

    try {
      if (!shouldUseSqlite()) {
        await verifyNeonSchema();
        const sql = getNeonSql();
        await sql`INSERT INTO affiliate_attributions (
  user_id, affiliate_code, invite_code, joined_at_utc, first_seen_at_utc,
  last_seen_at_utc, source, created_at_utc, metadata_json
) VALUES (
  ${args.platformUserId}, ${affiliateCode}, ${inviteCode || null},
  ${joinedAtUtc}, ${now}, ${now}, ${source}, ${now},
  CAST(${metadataJson} AS jsonb)
) ON CONFLICT (user_id) DO UPDATE SET
  last_seen_at_utc = GREATEST(
    affiliate_attributions.last_seen_at_utc,
    EXCLUDED.last_seen_at_utc
  ),
  joined_at_utc = COALESCE(
    affiliate_attributions.joined_at_utc,
    EXCLUDED.joined_at_utc
  )`;
      } else {
        const database = await getSqliteDatabase();
        database.prepare(`INSERT INTO affiliate_attributions (
  user_id, affiliate_code, invite_code, joined_at_utc, first_seen_at_utc,
  last_seen_at_utc, source, created_at_utc, metadata_json
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
ON CONFLICT(user_id) DO UPDATE SET
  last_seen_at_utc = CASE
    WHEN excluded.last_seen_at_utc > affiliate_attributions.last_seen_at_utc
      THEN excluded.last_seen_at_utc
    ELSE affiliate_attributions.last_seen_at_utc
  END,
  joined_at_utc = COALESCE(
    affiliate_attributions.joined_at_utc,
    excluded.joined_at_utc
  )`)
          .run(
            args.platformUserId,
            affiliateCode,
            inviteCode || null,
            joinedAtUtc,
            now,
            now,
            source,
            now,
            metadataJson,
          );
      }
    } catch (error) {
      platformFailure("TRADERLINK_AFFILIATE_ATTRIBUTION_CONFLICT", {}, error);
    }
    return (await this.findAttributionByPlatformUserId(
      args.platformUserId,
    )) as AffiliateAttributionRecord;
  }

  async findAttributionByPlatformUserId(
    platformUserId: string | null | undefined,
  ): Promise<AffiliateAttributionRecord | null> {
    const normalized = String(platformUserId ?? "").trim();
    if (!normalized) return null;
    assertCanonicalUuidV4(normalized, "platformUserId");
    if (!shouldUseSqlite()) {
      await verifyNeonSchema();
      const sql = getNeonSql();
      const rows = (await sql`SELECT * FROM affiliate_attributions
WHERE user_id = ${normalized} LIMIT 1`) as Array<Record<string, unknown>>;
      return rows[0] ? rowToAttribution(rows[0]) : null;
    }
    const database = await getSqliteDatabase();
    const row = database
      .prepare("SELECT * FROM affiliate_attributions WHERE user_id = ? LIMIT 1")
      .get(normalized) as Record<string, unknown> | undefined;
    return row ? rowToAttribution(row) : null;
  }
}

export function createReferralIngestId(): string {
  return `affiliate_referral_${randomBytes(10).toString("base64url")}`;
}
