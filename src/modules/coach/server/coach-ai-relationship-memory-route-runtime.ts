import type {
  CoachAiMeetLinksMemory,
  CoachAiRelationshipMemoryCategory,
  CoachAiRelationshipMemoryScope,
  CoachAiRelationshipMemorySourceKind,
  CoachAiRelationshipMemoryWrite,
} from "@/src/modules/coach/contracts/ai-relationship-memory-contracts";
import {
  COACH_AI_RELATIONSHIP_MEMORY_CATEGORIES,
  COACH_AI_RELATIONSHIP_MEMORY_SOURCE_KINDS,
} from "@/src/modules/coach/contracts/ai-relationship-memory-contracts";
import { CoachAiRelationshipMemoryRepository } from
  "@/src/modules/coach/server/coach-ai-relationship-memory-repository";
import type { WorkspaceAccessScope } from
  "@/src/modules/platform/contracts/workspace-access-scope";
import { assertCanonicalUtcTimestamp, assertCanonicalUuidV4, platformFailure } from
  "@/src/modules/platform/server/database/platform-migration-contract";
import { withPlatformDatabase } from
  "@/src/modules/platform/server/database/open-platform-database";
import { withReadonlyPlatformDatabase } from
  "@/src/modules/platform/server/database/open-readonly-platform-database";

function invalid(field: string): never {
  platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, expected: readonly string[]): boolean {
  const keys = Object.keys(value);
  return keys.length === expected.length && expected.every((key) => keys.includes(key));
}

function parseScope(value: unknown): CoachAiRelationshipMemoryScope {
  if (!isRecord(value) || typeof value.kind !== "string") invalid("memoryScope");
  if (value.kind === "user" && hasExactKeys(value, ["kind"])) {
    return Object.freeze({ kind: "user" });
  }
  if (value.kind === "account" && hasExactKeys(value, ["kind", "accountId"]) &&
      typeof value.accountId === "string") {
    assertCanonicalUuidV4(value.accountId, "memoryAccountId");
    return Object.freeze({ kind: "account", accountId: value.accountId });
  }
  invalid("memoryScope");
}

function parseCategory(value: unknown): CoachAiRelationshipMemoryCategory {
  if (typeof value !== "string" ||
      !(COACH_AI_RELATIONSHIP_MEMORY_CATEGORIES as readonly string[]).includes(value)) {
    invalid("memoryCategory");
  }
  return value as CoachAiRelationshipMemoryCategory;
}

function parseSourceKind(value: unknown): CoachAiRelationshipMemorySourceKind {
  if (typeof value !== "string" ||
      !(COACH_AI_RELATIONSHIP_MEMORY_SOURCE_KINDS as readonly string[]).includes(value) ||
      value === "meet_links" || value === "user_edit" || value === "reconfirmation") {
    invalid("memorySourceKind");
  }
  return value as CoachAiRelationshipMemorySourceKind;
}

function parseOptionalTimestamp(value: unknown, field: string): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") invalid(field);
  assertCanonicalUtcTimestamp(value, field);
  return value;
}

function parseOptionalUuid(value: unknown, field: string): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") invalid(field);
  assertCanonicalUuidV4(value, field);
  return value;
}

export function parseCreateRelationshipMemoryBody(
  body: Record<string, unknown>,
): CoachAiRelationshipMemoryWrite {
  const expected = [
    "scope", "category", "text", "sourceKind",
    ...(body.sourceConversationId === undefined ? [] : ["sourceConversationId"]),
    ...(body.sourceMessageId === undefined ? [] : ["sourceMessageId"]),
    ...(body.reviewDueAtUtc === undefined ? [] : ["reviewDueAtUtc"]),
  ];
  if (!hasExactKeys(body, expected) || typeof body.text !== "string") invalid("memory");
  return Object.freeze({
    scope: parseScope(body.scope),
    category: parseCategory(body.category),
    text: body.text,
    sourceKind: parseSourceKind(body.sourceKind),
    sourceConversationId: parseOptionalUuid(body.sourceConversationId, "sourceConversationId"),
    sourceMessageId: parseOptionalUuid(body.sourceMessageId, "sourceMessageId"),
    reviewDueAtUtc: parseOptionalTimestamp(body.reviewDueAtUtc, "reviewDueAtUtc"),
  });
}

export function parseRelationshipMemorySettingsBody(
  body: Record<string, unknown>,
): Readonly<{ action: "set_enabled"; enabled: boolean }> |
  Readonly<{ action: "forget_all" }> {
  if (body.action === "set_enabled" && hasExactKeys(body, ["action", "enabled"]) &&
      typeof body.enabled === "boolean") {
    return Object.freeze({ action: "set_enabled", enabled: body.enabled });
  }
  if (body.action === "forget_all" && hasExactKeys(body, ["action"])) {
    return Object.freeze({ action: "forget_all" });
  }
  invalid("memorySettingsAction");
}

export function parseRelationshipMemoryPatchBody(
  body: Record<string, unknown>,
): Readonly<{ text: string; reviewDueAtUtc: string | null; reconfirm: boolean }> {
  const expected = [
    "text",
    ...(body.reviewDueAtUtc === undefined ? [] : ["reviewDueAtUtc"]),
    ...(body.reconfirm === undefined ? [] : ["reconfirm"]),
  ];
  if (!hasExactKeys(body, expected) || typeof body.text !== "string" ||
      (body.reconfirm !== undefined && typeof body.reconfirm !== "boolean")) {
    invalid("memoryUpdate");
  }
  return Object.freeze({
    text: body.text,
    reviewDueAtUtc: parseOptionalTimestamp(body.reviewDueAtUtc, "reviewDueAtUtc"),
    reconfirm: body.reconfirm === true,
  });
}

export function parseMeetLinksBody(
  body: Record<string, unknown>,
): Readonly<{ action: "skip" }> |
  Readonly<{ action: "complete"; memories: readonly CoachAiMeetLinksMemory[] }> {
  if (body.action === "skip" && hasExactKeys(body, ["action"])) {
    return Object.freeze({ action: "skip" });
  }
  if (body.action !== "complete" || !hasExactKeys(body, ["action", "memories"]) ||
      !Array.isArray(body.memories) || body.memories.length > 16) {
    invalid("meetLinks");
  }
  const memories = body.memories.map((item): CoachAiMeetLinksMemory => {
    if (!isRecord(item)) invalid("meetLinksMemory");
    const expected = [
      "scope", "category", "text",
      ...(item.reviewDueAtUtc === undefined ? [] : ["reviewDueAtUtc"]),
    ];
    if (!hasExactKeys(item, expected) || typeof item.text !== "string") {
      invalid("meetLinksMemory");
    }
    return Object.freeze({
      scope: parseScope(item.scope),
      category: parseCategory(item.category),
      text: item.text,
      reviewDueAtUtc: parseOptionalTimestamp(item.reviewDueAtUtc, "reviewDueAtUtc"),
    });
  });
  return Object.freeze({ action: "complete", memories: Object.freeze(memories) });
}

export function parseRelationshipMemoryId(value: unknown): string {
  if (typeof value !== "string") invalid("memoryId");
  assertCanonicalUuidV4(value, "memoryId");
  return value;
}

export function withReadonlyRelationshipMemoryRepository<T>(
  scope: WorkspaceAccessScope,
  operation: (repository: CoachAiRelationshipMemoryRepository) => T,
): T {
  return withReadonlyPlatformDatabase({}, (database) =>
    operation(new CoachAiRelationshipMemoryRepository(database)));
}

export function withWritableRelationshipMemoryRepository<T>(
  scope: WorkspaceAccessScope,
  operation: (repository: CoachAiRelationshipMemoryRepository) => T,
): T {
  return withPlatformDatabase({ mode: "runtime" }, (database) =>
    operation(new CoachAiRelationshipMemoryRepository(database)));
}
