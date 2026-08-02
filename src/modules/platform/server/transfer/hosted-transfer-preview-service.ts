import type Database from "better-sqlite3";

import {
  getAcademyLesson,
  isAcademyLessonLaunchReady,
} from "@/src/lib/academy/academy-content";
import { getCanonicalProgressLessonSlug } from "@/src/lib/academy/academy-progress-slugs";

import {
  buildHostedTransferPreview,
  canonicalHostedTransferJson,
  hostedTransferSha256,
  type HostedTransferModuleCounts,
  type HostedTransferModulePreview,
  type HostedTransferPreview,
} from "./hosted-transfer-contract";
import type {
  HostedAcademySnapshot,
  HostedAffiliateSnapshot,
  HostedNewsSnapshot,
  HostedSourceSnapshots,
  HostedWatchlistSnapshot,
} from "./hosted-source-snapshot-reader";
import { platformFailure } from "../database/platform-migration-contract";

type TargetIdentityRow = Readonly<{
  auth_subject: string;
  user_id: string;
}>;

export type PreparedAcademyCompletion = Readonly<{
  authSubject: string;
  lessonSlug: string;
  completedAtUtc: string;
}>;

export type PreparedHostedTransfer = Readonly<{
  preview: HostedTransferPreview;
  sources: HostedSourceSnapshots;
  academy: Readonly<{
    provisionSubjects: ReadonlySet<string>;
    completions: readonly PreparedAcademyCompletion[];
  }>;
}>;

function counts(input: HostedTransferModuleCounts): HostedTransferModuleCounts {
  return Object.freeze(input);
}

function modulePreview(
  module: HostedTransferModulePreview["module"],
  sourceSnapshotSha256: string,
  moduleCounts: HostedTransferModuleCounts,
): HostedTransferModulePreview {
  const digestInput = Object.freeze({ module, sourceSnapshotSha256, counts: moduleCounts });
  return Object.freeze({
    ...digestInput,
    previewSha256: hostedTransferSha256(digestInput),
  });
}

function targetDiscordIdentities(database: Database.Database): Map<string, string> {
  const rows = database.prepare<[], TargetIdentityRow>(`SELECT auth_subject, user_id
FROM platform_auth_identities
WHERE auth_provider = 'discord' AND status = 'active'
ORDER BY auth_subject COLLATE BINARY`).all();
  return new Map(rows.map((row) => [row.auth_subject, row.user_id]));
}

function prepareAcademy(
  database: Database.Database,
  source: HostedAcademySnapshot,
  protectedOwnerSubject: string | undefined,
): Readonly<{
  preview: HostedTransferModulePreview;
  provisionSubjects: ReadonlySet<string>;
  completions: readonly PreparedAcademyCompletion[];
}> {
  const identities = targetDiscordIdentities(database);
  const usersBySubject = new Map(source.users.map((user) => [user.authSubject, user]));
  const duplicateUserCount = source.users.length - usersBySubject.size;
  let accepted = 0;
  let unchanged = 0;
  const pending = 0;
  let conflicts = duplicateUserCount;
  const provisionSubjects = new Set<string>();

  for (const user of usersBySubject.values()) {
    if (identities.has(user.authSubject)) {
      unchanged += 1;
    } else if (user.authSubject === protectedOwnerSubject) {
      conflicts += 1;
    } else {
      accepted += 1;
      provisionSubjects.add(user.authSubject);
    }
  }

  const canonicalCompletions = new Map<string, PreparedAcademyCompletion>();
  let completionConflictCount = 0;
  let canonicalDuplicateCount = 0;
  for (const completion of source.completions) {
    if (!usersBySubject.has(completion.authSubject)) {
      completionConflictCount += 1;
      continue;
    }
    const lessonSlug = getCanonicalProgressLessonSlug(completion.lessonSlug);
    const lesson = getAcademyLesson(lessonSlug);
    if (!lesson || !isAcademyLessonLaunchReady(lesson)) {
      completionConflictCount += 1;
      continue;
    }
    const key = `${completion.authSubject}\u0000${lessonSlug}`;
    const current = canonicalCompletions.get(key);
    if (current) canonicalDuplicateCount += 1;
    if (!current || completion.completedAtUtc < current.completedAtUtc) {
      canonicalCompletions.set(key, Object.freeze({
        authSubject: completion.authSubject,
        lessonSlug,
        completedAtUtc: completion.completedAtUtc,
      }));
    }
  }
  conflicts += completionConflictCount;
  unchanged += canonicalDuplicateCount;

  for (const completion of canonicalCompletions.values()) {
    const userId = identities.get(completion.authSubject);
    if (!userId) {
      if (provisionSubjects.has(completion.authSubject)) accepted += 1;
      else conflicts += 1;
      continue;
    }
    const row = database.prepare<[string, string], { completed_at_utc: string }>(`SELECT completed_at_utc
FROM academy_lesson_completions
WHERE user_id = ? AND lesson_slug = ?`).get(userId, completion.lessonSlug);
    if (!row) accepted += 1;
    else if (row.completed_at_utc === completion.completedAtUtc) unchanged += 1;
    else conflicts += 1;
  }

  const sourceCount = source.users.length + source.completions.length;
  const accounted = accepted + unchanged + pending + conflicts;
  if (accounted !== sourceCount) {
    platformFailure("TRADERLINK_HOSTED_TRANSFER_VERIFICATION_FAILED", {
      module: "academy",
      sourceCount,
      accounted,
    });
  }
  return Object.freeze({
    preview: modulePreview("academy", source.sha256, counts({
      source: sourceCount, accepted, unchanged, pending, conflicts,
    })),
    provisionSubjects: Object.freeze(provisionSubjects),
    completions: Object.freeze([...canonicalCompletions.values()]),
  });
}

function normalizedTargetRow(
  row: Record<string, unknown>,
  keys: readonly string[],
): Record<string, unknown> {
  return Object.fromEntries(keys.map((key) => {
    const value = row[key];
    if (key.endsWith("_json")) {
      let parsed: unknown;
      try {
        parsed = JSON.parse(String(value));
      } catch (error) {
        platformFailure("TRADERLINK_HOSTED_TRANSFER_VERIFICATION_FAILED", { field: key }, error);
      }
      return [key, canonicalHostedTransferJson(parsed).trimEnd()];
    }
    if (key === "active") return [key, Boolean(Number(value))];
    return [key, value];
  }));
}

function compareKeyedRows(input: Readonly<{
  database: Database.Database;
  sourceRows: readonly Record<string, unknown>[];
  table: string;
  key: string;
  columns: readonly string[];
}>): Readonly<{ accepted: number; unchanged: number; conflicts: number }> {
  if (!/^[a-z][a-z0-9_]*$/u.test(input.table) || !/^[a-z][a-z0-9_]*$/u.test(input.key)) {
    platformFailure("TRADERLINK_HOSTED_TRANSFER_INVALID", { field: "targetTable" });
  }
  if (input.columns.some((column) => !/^[a-z][a-z0-9_]*$/u.test(column))) {
    platformFailure("TRADERLINK_HOSTED_TRANSFER_INVALID", { field: "targetColumn" });
  }
  const observedKeys = new Set<string>();
  let accepted = 0;
  let unchanged = 0;
  let conflicts = 0;
  const statement = input.database.prepare(`SELECT ${input.columns.join(", ")}
FROM ${input.table} WHERE ${input.key} = ?`);
  for (const sourceRow of input.sourceRows) {
    const keyValue = String(sourceRow[input.key] ?? "");
    if (!keyValue || observedKeys.has(keyValue)) {
      conflicts += 1;
      continue;
    }
    observedKeys.add(keyValue);
    const target = statement.get(keyValue) as Record<string, unknown> | undefined;
    if (!target) {
      accepted += 1;
      continue;
    }
    if (
      hostedTransferSha256(normalizedTargetRow(target, input.columns)) ===
      hostedTransferSha256(sourceRow)
    ) unchanged += 1;
    else conflicts += 1;
  }
  return Object.freeze({ accepted, unchanged, conflicts });
}

function prepareWatchlist(
  database: Database.Database,
  source: HostedWatchlistSnapshot,
): HostedTransferModulePreview {
  const symbols = compareKeyedRows({
    database, sourceRows: source.symbols, table: "live_watchlist_symbols", key: "symbol",
    columns: ["symbol", "status", "updated_at", "state_json", "revision"],
  });
  const health = compareKeyedRows({
    database, sourceRows: source.health, table: "live_watchlist_health", key: "key",
    columns: ["key", "market_data_status", "market_data_updated_at"],
  });
  const archives = compareKeyedRows({
    database, sourceRows: source.archives, table: "live_watchlist_archives", key: "archive_id",
    columns: ["archive_id", "symbol", "archived_at", "first_posted_at", "last_active_updated_at", "state_json"],
  });
  const sourceCount = source.symbols.length + source.health.length + source.archives.length;
  return modulePreview("watchlist", source.sha256, counts({
    source: sourceCount,
    accepted: symbols.accepted + health.accepted + archives.accepted,
    unchanged: symbols.unchanged + health.unchanged + archives.unchanged,
    pending: 0,
    conflicts: symbols.conflicts + health.conflicts + archives.conflicts,
  }));
}

function prepareNews(
  database: Database.Database,
  source: HostedNewsSnapshot,
): HostedTransferModulePreview {
  const articleColumns = source.articles[0]
    ? Object.keys(source.articles[0])
    : ["id"];
  const versionColumns = source.versions[0]
    ? Object.keys(source.versions[0])
    : ["version_id"];
  const articles = compareKeyedRows({
    database, sourceRows: source.articles, table: "news_articles", key: "id",
    columns: articleColumns,
  });
  const versions = compareKeyedRows({
    database, sourceRows: source.versions, table: "news_article_versions", key: "version_id",
    columns: versionColumns,
  });
  return modulePreview("news", source.sha256, counts({
    source: source.articles.length + source.versions.length,
    accepted: articles.accepted + versions.accepted,
    unchanged: articles.unchanged + versions.unchanged,
    pending: 0,
    conflicts: articles.conflicts + versions.conflicts,
  }));
}

function prepareAffiliate(
  database: Database.Database,
  source: HostedAffiliateSnapshot,
  academyProvisionSubjects: ReadonlySet<string>,
): HostedTransferModulePreview {
  const invites = compareKeyedRows({
    database, sourceRows: source.invites, table: "affiliate_invites", key: "invite_code",
    columns: ["invite_code", "affiliate_code", "affiliate_name", "active", "created_at_utc", "updated_at_utc", "metadata_json"],
  });
  const identities = targetDiscordIdentities(database);
  let accepted = invites.accepted;
  let unchanged = invites.unchanged;
  let pending = source.pendingUnmappedRowCount;
  let conflicts = invites.conflicts;
  const seenSubjects = new Set<string>();
  const availableInviteCodes = new Set(
    source.invites.map((invite) => String(invite.invite_code)),
  );
  for (const row of database.prepare<[], { invite_code: string }>(
    "SELECT invite_code FROM affiliate_invites",
  ).all()) availableInviteCodes.add(row.invite_code);
  for (const attribution of source.attributions) {
    const subject = String(attribution.auth_subject ?? "");
    if (!subject || seenSubjects.has(subject)) {
      conflicts += 1;
      continue;
    }
    seenSubjects.add(subject);
    const inviteCode = attribution.invite_code;
    if (inviteCode !== null && !availableInviteCodes.has(String(inviteCode))) {
      conflicts += 1;
      continue;
    }
    const userId = identities.get(subject);
    if (!userId && !academyProvisionSubjects.has(subject)) {
      pending += 1;
      continue;
    }
    if (!userId) {
      accepted += 1;
      continue;
    }
    const target = database.prepare<[string], Record<string, unknown>>(`SELECT
  affiliate_code, invite_code, joined_at_utc, first_seen_at_utc,
  last_seen_at_utc, source, created_at_utc, metadata_json
FROM affiliate_attributions WHERE user_id = ?`).get(userId);
    if (!target) {
      accepted += 1;
      continue;
    }
    const sourceWithoutSubject = Object.fromEntries(
      Object.entries(attribution).filter(([key]) => key !== "auth_subject"),
    );
    if (
      hostedTransferSha256(normalizedTargetRow(target, Object.keys(sourceWithoutSubject))) ===
      hostedTransferSha256(sourceWithoutSubject)
    ) unchanged += 1;
    else conflicts += 1;
  }
  return modulePreview("affiliate", source.sha256, counts({
    source: source.invites.length + source.attributions.length + source.pendingUnmappedRowCount,
    accepted, unchanged, pending, conflicts,
  }));
}

export function prepareHostedTransfer(
  database: Database.Database,
  sources: HostedSourceSnapshots,
  options: Readonly<{ protectedInitialOwnerAuthSubject?: string }> = {},
): PreparedHostedTransfer {
  const academy = prepareAcademy(
    database,
    sources.academy,
    options.protectedInitialOwnerAuthSubject,
  );
  const modulePreviews = Object.freeze([
    academy.preview,
    prepareWatchlist(database, sources.watchlist),
    prepareNews(database, sources.news),
    prepareAffiliate(database, sources.affiliate, academy.provisionSubjects),
  ]);
  return Object.freeze({
    preview: buildHostedTransferPreview(modulePreviews),
    sources,
    academy: Object.freeze({
      provisionSubjects: academy.provisionSubjects,
      completions: academy.completions,
    }),
  });
}
