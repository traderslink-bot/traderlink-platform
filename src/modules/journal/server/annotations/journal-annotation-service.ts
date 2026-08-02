import { createHash } from "node:crypto";

import type {
  JournalDailyNoteRecord,
  JournalRoundTripNoteRecord,
  JournalRuleLifecycleState,
  JournalRuleRecord,
  JournalRuleReviewRecord,
  JournalRuleReviewScope,
  JournalRuleReviewStatus,
  JournalTagRecord,
} from "@/src/modules/journal/contracts/journal-annotation-contracts";
import type { AccountScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import {
  assertCanonicalUuidV4,
  createCanonicalUtcTimestamp,
  createCanonicalUuidV4,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";

import { JournalAnnotationRepository } from "./journal-annotation-repository";
import { JournalRuleRepository } from "./journal-rule-repository";

export const JOURNAL_TAGS_PER_ROUND_TRIP_MAXIMUM = 10;
export const JOURNAL_TAGS_PER_ACCOUNT_MAXIMUM = 200;

function conflict(): never {
  return platformFailure("TRADERLINK_JOURNAL_ANNOTATION_CONFLICT");
}

function invalid(field?: string): never {
  return platformFailure(
    "TRADERLINK_JOURNAL_ANNOTATION_INVALID",
    field ? { field } : {},
  );
}

function normalizedText(
  value: unknown,
  field: string,
  maximum: number,
  required: boolean,
): string {
  if (typeof value !== "string") invalid(field);
  const normalized = value.replace(/\r\n?/gu, "\n");
  if (
    normalized.length > maximum ||
    normalized.includes("\u0000") ||
    (required && normalized.trim().length === 0)
  ) invalid(field);
  return normalized;
}

function tagName(value: unknown): Readonly<{ name: string; normalizedName: string }> {
  const name = normalizedText(value, "tagName", 40, true)
    .trim()
    .replace(/\s+/gu, " ")
    .normalize("NFKC");
  if (name.length > 40 || /[\u0000-\u001f\u007f]/u.test(name)) {
    invalid("tagName");
  }
  return Object.freeze({
    name,
    normalizedName: name.toLocaleLowerCase("en-US"),
  });
}

function expectedRevision(value: unknown, nullable = false): number | null {
  if (nullable && value === null) return null;
  if (!Number.isSafeInteger(value) || Number(value) <= 0) conflict();
  return Number(value);
}

function canonicalConfiguration(value: unknown): Readonly<{
  json: string;
  sha256: string;
}> {
  if (!value || Array.isArray(value) || typeof value !== "object") {
    invalid("configuration");
  }
  const entries = Object.entries(value);
  if (entries.length > 64) invalid("configuration");
  const normalized = Object.fromEntries(entries
    .map(([key, item]) => {
      if (!/^[a-z][a-z0-9_]{0,63}$/u.test(key) || typeof item !== "string") {
        invalid("configuration");
      }
      return [key, normalizedText(item, "configuration", 256, false)] as const;
    })
    .sort(([left], [right]) => left.localeCompare(right)));
  const json = JSON.stringify(normalized);
  return Object.freeze({
    json,
    sha256: createHash("sha256").update(`${json}\n`, "utf8").digest("hex"),
  });
}

function token(value: unknown, field: string): string {
  if (typeof value !== "string" || !/^[a-z][a-z0-9_-]{0,63}$/u.test(value)) {
    invalid(field);
  }
  return value;
}

function reviewScope(value: unknown): JournalRuleReviewScope {
  if (value !== "day" && value !== "trade" && value !== "both") {
    invalid("reviewScope");
  }
  return value;
}

function reviewStatus(value: unknown): JournalRuleReviewStatus {
  if (value !== "followed" && value !== "broken" && value !== "not_reviewed") {
    invalid("status");
  }
  return value;
}

function timestamp(now: Date | undefined): string {
  return createCanonicalUtcTimestamp(now);
}

export class JournalAnnotationService {
  constructor(
    private readonly annotations: JournalAnnotationRepository,
    private readonly rules: JournalRuleRepository,
  ) {}

  listTags(scope: AccountScope): readonly JournalTagRecord[] {
    return this.annotations.listTags(scope);
  }

  createTag(
    scope: AccountScope,
    input: Readonly<{ name: unknown; now?: Date }>,
  ): JournalTagRecord {
    const name = tagName(input.name);
    if (this.annotations.listTags(scope, true).length >= JOURNAL_TAGS_PER_ACCOUNT_MAXIMUM) {
      invalid("tagLimit");
    }
    const tagId = createCanonicalUuidV4();
    const versionId = createCanonicalUuidV4();
    try {
      return this.annotations.immediate(() => {
        this.annotations.insertTag({
          scope,
          tagId,
          versionId,
          ...name,
          timestamp: timestamp(input.now),
        });
        return this.annotations.findTag(scope, tagId)!;
      });
    } catch (error) {
      if (String(error).includes("UNIQUE")) conflict();
      throw error;
    }
  }

  renameTag(
    scope: AccountScope,
    input: Readonly<{
      tagId: string;
      expectedRevision: unknown;
      name: unknown;
      now?: Date;
    }>,
  ): JournalTagRecord {
    assertCanonicalUuidV4(input.tagId, "tagId");
    const revision = expectedRevision(input.expectedRevision)!;
    const current = this.annotations.findTag(scope, input.tagId);
    if (!current || current.revision !== revision || current.lifecycleState !== "active") {
      conflict();
    }
    const name = tagName(input.name);
    try {
      return this.annotations.immediate(() => {
        if (!this.annotations.appendTagVersion({
          scope,
          tagId: input.tagId,
          expectedRevision: revision,
          versionId: createCanonicalUuidV4(),
          eventKind: "renamed",
          ...name,
          lifecycleState: "active",
          timestamp: timestamp(input.now),
        })) conflict();
        return this.annotations.findTag(scope, input.tagId)!;
      });
    } catch (error) {
      if (String(error).includes("UNIQUE")) conflict();
      throw error;
    }
  }

  retireTag(
    scope: AccountScope,
    input: Readonly<{ tagId: string; expectedRevision: unknown; now?: Date }>,
  ): JournalTagRecord {
    assertCanonicalUuidV4(input.tagId, "tagId");
    const revision = expectedRevision(input.expectedRevision)!;
    const current = this.annotations.findTag(scope, input.tagId);
    if (!current || current.revision !== revision || current.lifecycleState !== "active") {
      conflict();
    }
    return this.annotations.immediate(() => {
      if (!this.annotations.appendTagVersion({
        scope,
        tagId: input.tagId,
        expectedRevision: revision,
        versionId: createCanonicalUuidV4(),
        eventKind: "retired",
        name: current.name,
        normalizedName: current.name.normalize("NFKC").toLocaleLowerCase("en-US"),
        lifecycleState: "retired",
        timestamp: timestamp(input.now),
      })) conflict();
      const tag = this.annotations.findTag(scope, input.tagId);
      if (!tag) conflict();
      return tag;
    });
  }

  listTagsForRoundTrips(
    scope: AccountScope,
    roundTripIds: readonly string[],
  ): Readonly<Record<string, readonly JournalTagRecord[]>> {
    return this.annotations.listTagsForRoundTrips(scope, roundTripIds);
  }

  replaceRoundTripTags(
    scope: AccountScope,
    input: Readonly<{
      roundTripId: string;
      tagIds: readonly string[];
      now?: Date;
    }>,
  ): readonly JournalTagRecord[] {
    assertCanonicalUuidV4(input.roundTripId, "roundTripId");
    const tagIds = [...new Set(input.tagIds)];
    tagIds.forEach((tagId) => assertCanonicalUuidV4(tagId, "tagId"));
    if (tagIds.length > JOURNAL_TAGS_PER_ROUND_TRIP_MAXIMUM) invalid("tagIds");
    const available = new Set(this.annotations.listTags(scope).map((tag) => tag.tagId));
    if (!this.annotations.roundTripExists(scope, input.roundTripId) ||
        tagIds.some((tagId) => !available.has(tagId))) conflict();
    const at = timestamp(input.now);
    return this.annotations.immediate(() => {
      const rows = this.annotations.listAssignmentRows(scope, input.roundTripId);
      const byTag = new Map(rows.map((row) => [row.tag_id, row]));
      const selected = new Set(tagIds);
      for (const row of rows) {
        const nextState = selected.has(row.tag_id) ? "assigned" : "removed";
        if (row.assignment_state !== nextState &&
            !this.annotations.transitionAssignment({
              scope,
              row,
              nextState,
              eventId: createCanonicalUuidV4(),
              timestamp: at,
            })) conflict();
      }
      for (const tagId of selected) {
        if (byTag.has(tagId)) continue;
        this.annotations.insertAssignment({
          scope,
          roundTripId: input.roundTripId,
          tagId,
          assignmentId: createCanonicalUuidV4(),
          eventId: createCanonicalUuidV4(),
          timestamp: at,
        });
      }
      return this.annotations.listTagsForRoundTrips(scope, [input.roundTripId])[
        input.roundTripId
      ] ?? Object.freeze([]);
    });
  }

  readDailyNote(scope: AccountScope, tradingDate: string): JournalDailyNoteRecord | null {
    if (!/^\d{4}-\d{2}-\d{2}$/u.test(tradingDate)) invalid("tradingDate");
    const tradingDayId = this.annotations.findTradingDayId(scope, tradingDate);
    return tradingDayId ? this.annotations.readDailyNote(scope, tradingDayId) : null;
  }

  resolveTradingDayId(scope: AccountScope, tradingDate: string): string | null {
    if (!/^\d{4}-\d{2}-\d{2}$/u.test(tradingDate)) invalid("tradingDate");
    return this.annotations.findTradingDayId(scope, tradingDate);
  }

  saveDailyNote(
    scope: AccountScope,
    input: Readonly<{
      tradingDate: string;
      expectedRevision: unknown;
      whatWorked: unknown;
      whatNeedsWork: unknown;
      technicalRecap: unknown;
      tomorrowsFocus: unknown;
      anythingElse: unknown;
      now?: Date;
    }>,
  ): JournalDailyNoteRecord {
    const tradingDayId = this.annotations.findTradingDayId(scope, input.tradingDate);
    if (!tradingDayId) conflict();
    const expected = expectedRevision(input.expectedRevision, true);
    const values = [
      normalizedText(input.whatWorked, "whatWorked", 10_000, false),
      normalizedText(input.whatNeedsWork, "whatNeedsWork", 10_000, false),
      normalizedText(input.technicalRecap, "technicalRecap", 10_000, false),
      normalizedText(input.tomorrowsFocus, "tomorrowsFocus", 10_000, false),
      normalizedText(input.anythingElse, "anythingElse", 10_000, false),
    ] as const;
    return this.annotations.immediate(() => {
      const current = this.annotations.readDailyNote(scope, tradingDayId);
      if ((current?.revision ?? null) !== expected) conflict();
      const revisionId = createCanonicalUuidV4();
      const at = timestamp(input.now);
      if (!current) {
        this.annotations.insertDailyNote({
          scope,
          noteId: createCanonicalUuidV4(),
          revisionId,
          tradingDayId,
          timestamp: at,
          values,
        });
      } else {
        this.annotations.insertDailyNoteRevision({
          scope,
          noteId: current.dailyNoteId,
          revisionId,
          revision: current.revision + 1,
          timestamp: at,
          values,
        });
        if (!this.annotations.updateDailyNote({
          scope,
          noteId: current.dailyNoteId,
          revisionId,
          expectedRevision: current.revision,
          timestamp: at,
        })) conflict();
      }
      return this.annotations.readDailyNote(scope, tradingDayId)!;
    });
  }

  readRoundTripNotes(
    scope: AccountScope,
    roundTripIds: readonly string[],
  ): Readonly<Record<string, JournalRoundTripNoteRecord>> {
    return this.annotations.readRoundTripNotes(scope, roundTripIds);
  }

  saveRoundTripNote(
    scope: AccountScope,
    input: Readonly<{
      roundTripId: string;
      expectedRevision: unknown;
      technicalNote: unknown;
      tradeNote: unknown;
      now?: Date;
    }>,
  ): JournalRoundTripNoteRecord {
    assertCanonicalUuidV4(input.roundTripId, "roundTripId");
    if (!this.annotations.roundTripExists(scope, input.roundTripId)) conflict();
    const expected = expectedRevision(input.expectedRevision, true);
    const technicalNote = normalizedText(
      input.technicalNote,
      "technicalNote",
      10_000,
      false,
    );
    const tradeNote = normalizedText(input.tradeNote, "tradeNote", 10_000, false);
    return this.annotations.immediate(() => {
      const current = this.annotations.readRoundTripNotes(scope, [input.roundTripId])[
        input.roundTripId
      ] ?? null;
      if ((current?.revision ?? null) !== expected) conflict();
      const revisionId = createCanonicalUuidV4();
      const at = timestamp(input.now);
      if (!current) {
        this.annotations.insertRoundTripNote({
          scope,
          noteId: createCanonicalUuidV4(),
          revisionId,
          roundTripId: input.roundTripId,
          technicalNote,
          tradeNote,
          timestamp: at,
        });
      } else {
        this.annotations.insertRoundTripNoteRevision({
          scope,
          noteId: current.roundTripNoteId,
          revisionId,
          revision: current.revision + 1,
          technicalNote,
          tradeNote,
          timestamp: at,
        });
        if (!this.annotations.updateRoundTripNote({
          scope,
          noteId: current.roundTripNoteId,
          revisionId,
          expectedRevision: current.revision,
          timestamp: at,
        })) conflict();
      }
      return this.annotations.readRoundTripNotes(scope, [input.roundTripId])[
        input.roundTripId
      ]!;
    });
  }

  listRules(scope: AccountScope): readonly JournalRuleRecord[] {
    return this.rules.list(scope);
  }

  createRule(
    scope: AccountScope,
    input: Readonly<{
      sourceKind: "template" | "custom";
      templateKey?: unknown;
      title: unknown;
      statement: unknown;
      category: unknown;
      reviewScope: unknown;
      isFocus: unknown;
      configuration: unknown;
      now?: Date;
    }>,
  ): JournalRuleRecord {
    const templateKey = input.sourceKind === "template"
      ? token(input.templateKey, "templateKey")
      : null;
    if (input.sourceKind !== "template" && input.sourceKind !== "custom") {
      invalid("sourceKind");
    }
    if (typeof input.isFocus !== "boolean") invalid("isFocus");
    const isFocus = input.isFocus;
    const configuration = canonicalConfiguration(input.configuration);
    const ruleId = createCanonicalUuidV4();
    try {
      return this.rules.immediate(() => {
        this.rules.insert({
          scope,
          ruleId,
          versionId: createCanonicalUuidV4(),
          lifecycleEventId: createCanonicalUuidV4(),
          sourceKind: input.sourceKind,
          templateKey,
          title: normalizedText(input.title, "title", 100, true).trim(),
          statement: normalizedText(input.statement, "statement", 1_000, true).trim(),
          category: token(input.category, "category"),
          reviewScope: reviewScope(input.reviewScope),
          isFocus,
          configurationJson: configuration.json,
          configurationSha256: configuration.sha256,
          timestamp: timestamp(input.now),
        });
        return this.rules.find(scope, ruleId)!;
      });
    } catch (error) {
      if (String(error).includes("UNIQUE")) conflict();
      throw error;
    }
  }

  reviseRule(
    scope: AccountScope,
    input: Readonly<{
      ruleId: string;
      expectedRevision: unknown;
      title: unknown;
      statement: unknown;
      category: unknown;
      reviewScope: unknown;
      isFocus: unknown;
      configuration: unknown;
      now?: Date;
    }>,
  ): JournalRuleRecord {
    assertCanonicalUuidV4(input.ruleId, "ruleId");
    const revision = expectedRevision(input.expectedRevision)!;
    const current = this.rules.find(scope, input.ruleId);
    if (!current || current.revision !== revision || current.lifecycleState !== "active") {
      conflict();
    }
    if (typeof input.isFocus !== "boolean") invalid("isFocus");
    const isFocus = input.isFocus;
    const configuration = canonicalConfiguration(input.configuration);
    return this.rules.immediate(() => {
      const versionId = createCanonicalUuidV4();
      const at = timestamp(input.now);
      this.rules.insertVersion({
        scope,
        ruleId: input.ruleId,
        versionId,
        versionNumber: current.versionNumber + 1,
        title: normalizedText(input.title, "title", 100, true).trim(),
        statement: normalizedText(input.statement, "statement", 1_000, true).trim(),
        category: token(input.category, "category"),
        reviewScope: reviewScope(input.reviewScope),
        isFocus,
        configurationJson: configuration.json,
        configurationSha256: configuration.sha256,
        timestamp: at,
      });
      if (!this.rules.updateCurrentVersion({
        scope,
        ruleId: input.ruleId,
        versionId,
        expectedRevision: revision,
        timestamp: at,
      })) conflict();
      return this.rules.find(scope, input.ruleId)!;
    });
  }

  transitionRule(
    scope: AccountScope,
    input: Readonly<{
      ruleId: string;
      expectedRevision: unknown;
      expectedState: unknown;
      newState: unknown;
      now?: Date;
    }>,
  ): JournalRuleRecord {
    assertCanonicalUuidV4(input.ruleId, "ruleId");
    const revision = expectedRevision(input.expectedRevision)!;
    const current = this.rules.find(scope, input.ruleId);
    const states: readonly JournalRuleLifecycleState[] = ["active", "paused", "retired"];
    if (!states.includes(input.expectedState as JournalRuleLifecycleState) ||
        !states.includes(input.newState as JournalRuleLifecycleState) ||
        !current || current.revision !== revision ||
        current.lifecycleState !== input.expectedState ||
        current.lifecycleState === "retired" || input.newState === input.expectedState) {
      conflict();
    }
    const previousState = current.lifecycleState as "active" | "paused";
    return this.rules.immediate(() => {
      if (!this.rules.transition({
        scope,
        ruleId: input.ruleId,
        expectedRevision: revision,
        previousState,
        newState: input.newState as JournalRuleLifecycleState,
        lifecycleEventId: createCanonicalUuidV4(),
        timestamp: timestamp(input.now),
      })) conflict();
      return this.rules.find(scope, input.ruleId)!;
    });
  }

  listRuleReviews(
    scope: AccountScope,
    input: Readonly<{ tradingDayId: string; roundTripIds: readonly string[] }>,
  ): readonly JournalRuleReviewRecord[] {
    return this.rules.listReviews({ scope, ...input });
  }

  saveRuleReview(
    scope: AccountScope,
    input: Readonly<{
      ruleId: string;
      ruleVersionId: string;
      targetKind: "trading_day" | "round_trip";
      targetId: string;
      status: unknown;
      expectedRevision: unknown;
      now?: Date;
    }>,
  ): JournalRuleReviewRecord {
    assertCanonicalUuidV4(input.ruleId, "ruleId");
    assertCanonicalUuidV4(input.ruleVersionId, "ruleVersionId");
    assertCanonicalUuidV4(input.targetId, "targetId");
    const expected = expectedRevision(input.expectedRevision, true);
    if ((input.targetKind === "trading_day"
      ? !this.annotations.tradingDayExists(scope, input.targetId)
      : !this.annotations.roundTripExists(scope, input.targetId)) ||
      !this.rules.ruleVersionExists(scope, input.ruleId, input.ruleVersionId)) {
      conflict();
    }
    const current = this.rules.findReview({
      scope,
      ruleId: input.ruleId,
      targetKind: input.targetKind,
      targetId: input.targetId,
    });
    if ((current?.revision ?? null) !== expected) conflict();
    const at = timestamp(input.now);
    const status = reviewStatus(input.status);
    return this.rules.immediate(() => {
      const reviewId = current?.ruleReviewId ?? createCanonicalUuidV4();
      const reviewVersionId = createCanonicalUuidV4();
      if (!current) {
        this.rules.insertReview({
          scope,
          reviewId,
          reviewVersionId,
          ruleId: input.ruleId,
          ruleVersionId: input.ruleVersionId,
          targetKind: input.targetKind,
          targetId: input.targetId,
          status,
          timestamp: at,
        });
      } else {
        this.rules.insertReviewVersion({
          scope,
          reviewId,
          reviewVersionId,
          versionNumber: current.revision + 1,
          ruleId: input.ruleId,
          ruleVersionId: input.ruleVersionId,
          status,
          timestamp: at,
        });
        if (!this.rules.updateReview({
          scope,
          reviewId,
          reviewVersionId,
          expectedRevision: current.revision,
          timestamp: at,
        })) conflict();
      }
      return this.rules.findReview({
        scope,
        ruleId: input.ruleId,
        targetKind: input.targetKind,
        targetId: input.targetId,
      })!;
    });
  }
}
