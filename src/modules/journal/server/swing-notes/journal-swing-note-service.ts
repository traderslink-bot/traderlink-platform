import type {
  JournalSwingDailyNoteChange,
  JournalSwingDailyNoteRecord,
} from "@/src/modules/journal/contracts/journal-swing-note-contracts";
import type { AccountScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import {
  createCanonicalUtcTimestamp,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";
import type { JournalTradeStyleService } from "../trade-style/journal-trade-style-service";
import {
  JournalSwingNoteRepository,
  type JournalSwingNoteRow,
} from "./journal-swing-note-repository";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/u;
const IDEMPOTENCY_PATTERN = /^[A-Za-z0-9._:-]{8,200}$/u;

function localDateAt(value: string | Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: timezone,
    year: "numeric",
  }).formatToParts(value instanceof Date ? value : new Date(value));
  const part = (type: "day" | "month" | "year") =>
    parts.find((candidate) => candidate.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function normalizeText(value: string, maximum: number, required: boolean): string {
  const normalized = value.replace(/\r\n?/gu, "\n");
  if (
    normalized.length > maximum ||
    normalized.includes("\u0000") ||
    (required && normalized.trim().length === 0)
  ) platformFailure("TRADERLINK_SWING_NOTE_INVALID");
  return normalized;
}

export class JournalSwingNoteService {
  constructor(
    private readonly repository: JournalSwingNoteRepository,
    private readonly styles: JournalTradeStyleService,
  ) {}

  private record(
    scope: AccountScope,
    row: JournalSwingNoteRow,
    timezone: string,
  ): JournalSwingDailyNoteRecord {
    return Object.freeze({
      positionRef: this.styles.positionRef(scope, row.roundTripId),
      reviewDate: row.reviewDate,
      note: row.note,
      nextSessionPlan: row.nextSessionPlan,
      revision: row.revision,
      createdAtUtc: row.createdAtUtc,
      updatedAtUtc: row.updatedAtUtc,
      addedRetrospectively: row.reviewDate < localDateAt(row.createdAtUtc, timezone),
    });
  }

  list(
    scope: AccountScope,
    positionRef: string,
  ): readonly JournalSwingDailyNoteRecord[] {
    const position = this.styles.resolvePosition(scope, positionRef);
    return Object.freeze(this.repository.list(scope, position.roundTripId)
      .map((row) => this.record(scope, row, position.timezone)));
  }

  read(
    scope: AccountScope,
    positionRef: string,
    reviewDate: string,
  ): JournalSwingDailyNoteRecord | null {
    const position = this.styles.resolvePosition(scope, positionRef);
    const row = this.repository.find(scope, position.roundTripId, reviewDate);
    return row ? this.record(scope, row, position.timezone) : null;
  }

  save(
    scope: AccountScope,
    input: JournalSwingDailyNoteChange,
    now = new Date(),
  ): JournalSwingDailyNoteRecord {
    const position = this.styles.resolvePosition(scope, input.positionRef);
    if (
      position.tradeStyle !== "swing" ||
      position.styleLifecycleState === "needs_relink" ||
      !DATE_PATTERN.test(input.reviewDate) ||
      input.reviewDate > localDateAt(now, position.timezone) ||
      !IDEMPOTENCY_PATTERN.test(input.idempotencyKey)
    ) platformFailure("TRADERLINK_SWING_NOTE_INVALID");
    const note = normalizeText(input.note, 12_000, true);
    const nextSessionPlan = input.nextSessionPlan === null || input.nextSessionPlan.trim() === ""
      ? null
      : normalizeText(input.nextSessionPlan, 12_000, false);
    const row = this.repository.immediate(() => this.repository.save({
      scope,
      roundTripId: position.roundTripId,
      reviewDate: input.reviewDate,
      note,
      nextSessionPlan,
      expectedRevision: input.expectedRevision,
      idempotencyKey: input.idempotencyKey,
      timestamp: createCanonicalUtcTimestamp(now),
    }));
    return this.record(scope, row, position.timezone);
  }
}
