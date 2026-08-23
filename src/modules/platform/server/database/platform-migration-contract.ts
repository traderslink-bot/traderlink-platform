import { createHash, randomUUID } from "node:crypto";

export type PlatformMigrationModuleNamespace =
  | "platform"
  | "journal"
  | "level_analysis"
  | "academy"
  | "watchlist"
  | "news"
  | "affiliate"
  | "coach"
  | "community";

export type PlatformMigration = Readonly<{
  moduleNamespace: PlatformMigrationModuleNamespace;
  migrationId: string;
  executionOrder: number;
  statements: readonly string[];
}>;

export type TraderLinkPlatformErrorCode =
  | "TRADERLINK_PLATFORM_DB_PATH_MISSING"
  | "TRADERLINK_PLATFORM_DB_PATH_INVALID"
  | "TRADERLINK_PLATFORM_DB_PATH_REPOSITORY_FORBIDDEN"
  | "TRADERLINK_PLATFORM_DATABASE_MISSING"
  | "TRADERLINK_PLATFORM_DATABASE_EMPTY"
  | "TRADERLINK_PLATFORM_UNMANAGED_SCHEMA"
  | "TRADERLINK_PLATFORM_MIGRATIONS_PENDING"
  | "TRADERLINK_PLATFORM_SCHEMA_MISMATCH"
  | "TRADERLINK_PLATFORM_INTEGRITY_FAILED"
  | "TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED"
  | "TRADERLINK_MIGRATION_ORDER_CONFLICT"
  | "TRADERLINK_MIGRATION_ID_CONFLICT"
  | "TRADERLINK_MIGRATION_FILE_ID_MISMATCH"
  | "TRADERLINK_MIGRATION_CHECKSUM_MISMATCH"
  | "TRADERLINK_MIGRATION_UNKNOWN_APPLIED"
  | "TRADERLINK_MIGRATION_FAILED"
  | "TRADERLINK_WORKSPACE_ACCESS_DENIED"
  | "TRADERLINK_WORKSPACE_NOT_FOUND"
  | "TRADERLINK_AUTH_IDENTITY_CONFLICT"
  | "TRADERLINK_AUTH_SESSION_INVALID"
  | "TRADERLINK_BROKER_CONNECTION_CONFIGURATION_INVALID"
  | "TRADERLINK_BROKER_CONNECTION_ACCESS_DENIED"
  | "TRADERLINK_BROKER_CONNECTION_OAUTH_INVALID"
  | "TRADERLINK_BROKER_CONNECTION_STORAGE_INVALID"
  | "TRADERLINK_WEB_PUSH_CONFIGURATION_INVALID"
  | "TRADERLINK_WEB_PUSH_STORAGE_INVALID"
  | "TRADERLINK_WEB_PUSH_UNAVAILABLE"
  | "TRADERLINK_DISCORD_MEMBERSHIP_INVALID"
  | "TRADERLINK_PUBLIC_IDENTITY_PROVISIONING_FAILED"
  | "TRADERLINK_INITIAL_OWNER_LINK_REQUIRED"
  | "TRADERLINK_INITIAL_OWNER_LINK_PRECONDITION_FAILED"
  | "TRADERLINK_INITIAL_OWNER_LINK_CONFIRMATION_INVALID"
  | "TRADERLINK_HOSTED_TRANSFER_INVALID"
  | "TRADERLINK_HOSTED_TRANSFER_CONFLICT"
  | "TRADERLINK_HOSTED_TRANSFER_AUTHORIZATION_REQUIRED"
  | "TRADERLINK_HOSTED_TRANSFER_VERIFICATION_FAILED"
  | "TRADERLINK_ACCOUNT_ACCESS_DENIED"
  | "TRADERLINK_ACCOUNT_SELECTION_CONFLICT"
  | "TRADERLINK_ACCOUNT_IDENTITY_CONFLICT"
  | "TRADERLINK_ACCOUNT_IDENTITY_RECOVERY_REQUIRED"
  | "TRADERLINK_ACCOUNT_IDENTITY_CONFIRMATION_REQUIRED"
  | "TRADERLINK_ACCOUNT_IDENTITY_CONFIGURATION_INVALID"
  | "TRADERLINK_ACCOUNT_NOT_FOUND"
  | "TRADERLINK_ACCOUNT_ERASURE_CONFIRMATION_INVALID"
  | "TRADERLINK_ACCOUNT_ERASURE_CONFLICT"
  | "TRADERLINK_ACCOUNT_ERASURE_FAILED"
  | "TRADERLINK_DEVELOPMENT_OWNER_SEED_AUTHORIZATION_REQUIRED"
  | "TRADERLINK_DEVELOPMENT_OWNER_SEED_CONFIGURATION_INVALID"
  | "TRADERLINK_DEVELOPMENT_OWNER_SEED_CONFIRMATION_INVALID"
  | "TRADERLINK_DEVELOPMENT_OWNER_SEED_ALREADY_COMPLETED"
  | "TRADERLINK_DEVELOPMENT_OWNER_SEED_FAILED"
  | "TRADERLINK_JOURNAL_IMPORT_PARSE_FAILED"
  | "TRADERLINK_JOURNAL_IMPORT_MAPPING_FAILED"
  | "TRADERLINK_JOURNAL_IMPORT_CONFLICT"
  | "TRADERLINK_JOURNAL_IMPORT_SOURCE_PATH_INVALID"
  | "TRADERLINK_JOURNAL_IMPORT_SOURCE_EVIDENCE_MISMATCH"
  | "TRADERLINK_JOURNAL_SOURCE_IDENTITY_PREPARATION_AUTHORIZATION_REQUIRED"
  | "TRADERLINK_JOURNAL_SOURCE_IDENTITY_PRECONDITION_FAILED"
  | "TRADERLINK_JOURNAL_SOURCE_IDENTITY_PREPARATION_FAILED"
  | "TRADERLINK_JOURNAL_SOURCE_IMPORT_AUTHORIZATION_REQUIRED"
  | "TRADERLINK_JOURNAL_SOURCE_IMPORT_PRECONDITION_FAILED"
  | "TRADERLINK_JOURNAL_SOURCE_IMPORT_FAILED"
  | "TRADERLINK_JOURNAL_SOURCE_IMPORT_ORPHANED_EVIDENCE"
  | "TRADERLINK_JOURNAL_EVIDENCE_VAULT_CONFIGURATION_INVALID"
  | "TRADERLINK_JOURNAL_EVIDENCE_VAULT_CONFLICT"
  | "TRADERLINK_JOURNAL_EVIDENCE_VAULT_WRITE_FAILED"
  | "TRADERLINK_JOURNAL_PRIVACY_CONFIGURATION_INVALID"
  | "TRADERLINK_JOURNAL_INTEGRITY_VERIFICATION_FAILED"
  | "TRADERLINK_JOURNAL_EXECUTION_CONFLICT"
  | "TRADERLINK_MANUAL_TRADE_PREVIEW_INVALID"
  | "TRADERLINK_MANUAL_TRADE_RECENT_ENTRY_REQUIRED"
  | "TRADERLINK_MANUAL_TRADE_SINGLE_DAY_REQUIRED"
  | "TRADERLINK_MANUAL_TRADE_RELATIONSHIP_CONFLICT"
  | "TRADERLINK_MANUAL_TRADE_COMMIT_CONFLICT"
  | "TRADERLINK_MANUAL_TRADE_OFFLINE_DUPLICATE_CONFLICT"
  | "TRADERLINK_MANUAL_EXECUTION_EDIT_INVALID"
  | "TRADERLINK_MANUAL_EXECUTION_EDIT_CONFLICT"
  | "TRADERLINK_MANUAL_EXECUTION_EDIT_REQUIRES_DECISION"
  | "TRADERLINK_TRADE_STYLE_INVALID"
  | "TRADERLINK_TRADE_STYLE_CONFLICT"
  | "TRADERLINK_TRADING_DAY_REVIEW_INVALID"
  | "TRADERLINK_TRADING_DAY_REVIEW_CONFLICT"
  | "TRADERLINK_TRADING_DAY_REVIEW_OPEN_POSITION_CLASSIFICATION_REQUIRED"
  | "TRADERLINK_SWING_NOTE_INVALID"
  | "TRADERLINK_SWING_NOTE_CONFLICT"
  | "TRADERLINK_JOURNAL_ADMIN_ACCESS_DENIED"
  | "TRADERLINK_JOURNAL_ADMIN_AUTHORITY_CONFLICT"
  | "TRADERLINK_JOURNAL_ADMIN_AUDIT_FAILED"
  | "TRADERLINK_JOURNAL_ADMIN_MUTATION_INVALID"
  | "TRADERLINK_JOURNAL_ADMIN_RATE_LIMITED"
  | "TRADERLINK_JOURNAL_ANNOTATION_CONFLICT"
  | "TRADERLINK_JOURNAL_ANNOTATION_INVALID"
  | "TRADERLINK_ANALYTICS_SAVED_VIEW_CONFLICT"
  | "TRADERLINK_ANALYTICS_SAVED_VIEW_INVALID"
  | "TRADERLINK_TRADE_EXPLORER_STUDY_CONFLICT"
  | "TRADERLINK_TRADE_EXPLORER_STUDY_INVALID"
  | "TRADERLINK_RULE_IDEA_CONFLICT"
  | "TRADERLINK_RULE_IDEA_INVALID"
  | "TRADERLINK_CANDLE_REVIEW_CONFLICT"
  | "TRADERLINK_CANDLE_REVIEW_INVALID"
  | "TRADERLINK_CANDLE_REVIEW_PROVIDER_UNAVAILABLE"
  | "TRADERLINK_COACH_CHAT_UNAVAILABLE"
  | "TRADERLINK_LEVEL_ANALYSIS_CONFIGURATION_INVALID"
  | "TRADERLINK_LEVEL_ANALYSIS_DELIVERY_INVALID"
  | "TRADERLINK_LEVEL_ANALYSIS_DELIVERY_CONFLICT"
  | "TRADERLINK_LEVEL_ANALYSIS_LINK_INVALID"
  | "TRADERLINK_LEVEL_ANALYSIS_LINK_CONFLICT"
  | "TRADERLINK_ACADEMY_PROGRESS_INVALID"
  | "TRADERLINK_ACADEMY_PROGRESS_CONFLICT"
  | "TRADERLINK_WATCHLIST_STORAGE_INVALID"
  | "TRADERLINK_WATCHLIST_ACCESS_DENIED"
  | "TRADERLINK_NEWS_STORAGE_INVALID"
  | "TRADERLINK_NEWS_PUBLISH_UNAUTHORIZED"
  | "TRADERLINK_AFFILIATE_STORAGE_INVALID"
  | "TRADERLINK_AFFILIATE_ATTRIBUTION_CONFLICT"
  | "TRADERLINK_DATA_DECISION_CONFLICT"
  | "TRADERLINK_DATA_DECISION_INVALID_ACTION"
  | "TRADERLINK_BACKUP_PATH_INVALID"
  | "TRADERLINK_BACKUP_TARGET_EXISTS"
  | "TRADERLINK_BACKUP_VERIFICATION_FAILED";

export class TraderLinkPlatformError extends Error {
  readonly code: TraderLinkPlatformErrorCode;
  readonly safeContext: Readonly<Record<string, string | number | boolean>>;

  constructor(
    code: TraderLinkPlatformErrorCode,
    safeContext: Readonly<Record<string, string | number | boolean>> = {},
    options?: ErrorOptions,
  ) {
    super(code, options);
    this.name = "TraderLinkPlatformError";
    this.code = code;
    this.safeContext = Object.freeze({ ...safeContext });
  }
}

export function platformFailure(
  code: TraderLinkPlatformErrorCode,
  safeContext: Readonly<Record<string, string | number | boolean>> = {},
  cause?: unknown,
): never {
  throw new TraderLinkPlatformError(code, safeContext, { cause });
}

const MODULE_NAMESPACE_PATTERN = /^[a-z][a-z0-9_]*$/u;
const MIGRATION_ID_PATTERN = /^[0-9]{4}_[a-z0-9_]+$/u;
const LOWERCASE_SHA256_PATTERN = /^[0-9a-f]{64}$/u;
const CANONICAL_UUID_V4_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;
const CANONICAL_UTC_TIMESTAMP_PATTERN =
  /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z$/u;
const LOWERCASE_TOKEN_PATTERN = /^[a-z][a-z0-9_-]*$/u;

export function normalizePlatformLineEndings(value: string): string {
  return value.replace(/\r\n?/gu, "\n");
}

export function canonicalizePlatformMigrationStatements(
  statements: readonly string[],
): string {
  if (statements.length === 0 || statements.some((statement) => statement.length === 0)) {
    platformFailure("TRADERLINK_MIGRATION_CHECKSUM_MISMATCH");
  }
  const joined = statements
    .map(normalizePlatformLineEndings)
    .join("\n-- traderlink-statement-boundary --\n")
    .replace(/\n+$/u, "");
  return `${joined}\n`;
}

export function calculatePlatformMigrationChecksum(
  migration: PlatformMigration,
): string {
  return createHash("sha256")
    .update(canonicalizePlatformMigrationStatements(migration.statements), "utf8")
    .digest("hex");
}

export function validatePlatformMigrationManifest(
  manifest: readonly PlatformMigration[],
): readonly PlatformMigration[] {
  const ids = new Set<string>();
  const orders = new Set<number>();
  for (const migration of manifest) {
    if (
      !MODULE_NAMESPACE_PATTERN.test(migration.moduleNamespace) ||
      !MIGRATION_ID_PATTERN.test(migration.migrationId) ||
      !Number.isSafeInteger(migration.executionOrder) ||
      migration.executionOrder <= 0 ||
      migration.statements.length === 0 ||
      migration.statements.some((statement) => statement.length === 0)
    ) {
      platformFailure("TRADERLINK_MIGRATION_CHECKSUM_MISMATCH", {
        migrationId: migration.migrationId,
      });
    }
    if (ids.has(migration.migrationId)) {
      platformFailure("TRADERLINK_MIGRATION_ID_CONFLICT", {
        migrationId: migration.migrationId,
      });
    }
    if (orders.has(migration.executionOrder)) {
      platformFailure("TRADERLINK_MIGRATION_ORDER_CONFLICT", {
        executionOrder: migration.executionOrder,
      });
    }
    ids.add(migration.migrationId);
    orders.add(migration.executionOrder);
  }
  return Object.freeze([...manifest].sort((left, right) => left.executionOrder - right.executionOrder));
}

export function isLowercaseSha256(value: string): boolean {
  return LOWERCASE_SHA256_PATTERN.test(value);
}

export function isCanonicalUuidV4(value: string): boolean {
  return CANONICAL_UUID_V4_PATTERN.test(value);
}

export function assertCanonicalUuidV4(value: string, field: string): void {
  if (!isCanonicalUuidV4(value)) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field });
  }
}

export function createCanonicalUuidV4(): string {
  const value = randomUUID();
  assertCanonicalUuidV4(value, "generatedUuid");
  return value;
}

export function isCanonicalUtcTimestamp(value: string): boolean {
  if (!CANONICAL_UTC_TIMESTAMP_PATTERN.test(value)) return false;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString() === value;
}

export function assertCanonicalUtcTimestamp(value: string, field: string): void {
  if (!isCanonicalUtcTimestamp(value)) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field });
  }
}

export function createCanonicalUtcTimestamp(date = new Date()): string {
  const value = date.toISOString();
  assertCanonicalUtcTimestamp(value, "generatedTimestamp");
  return value;
}

export function assertLowercaseToken(
  value: string,
  field: string,
  maximumLength = 64,
): void {
  if (value.length > maximumLength || !LOWERCASE_TOKEN_PATTERN.test(value)) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field });
  }
}

export function isTraderLinkPlatformError(
  error: unknown,
): error is TraderLinkPlatformError {
  return error instanceof TraderLinkPlatformError;
}
