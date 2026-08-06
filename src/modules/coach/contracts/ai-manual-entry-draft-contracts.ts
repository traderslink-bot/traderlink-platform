export const COACH_AI_MANUAL_ENTRY_DRAFT_CONTRACT_VERSION =
  "traderlink_coach_ai_manual_entry_draft_v1" as const;

export type CoachAiManualEntryDraftState =
  | "draft"
  | "ready_for_confirmation"
  | "confirmed_by_trader"
  | "commit_pending"
  | "committed"
  | "write_failed"
  | "expired"
  | "archived";

export type CoachAiManualEntryDraftWriteState =
  | "not_written"
  | "commit_pending"
  | "committed"
  | "write_failed";

export type CoachAiManualExecutionDraftSide = "buy" | "sell";

/**
 * The provider-neutral, editable portion of a proposed execution. A missing
 * required fact remains null until the trader supplies it; it is never guessed.
 */
export type CoachAiManualExecutionExtractionRow = Readonly<{
  clientRowRef: string;
  localDate: string | null;
  localTime: string | null;
  normalizedSymbol: string | null;
  side: CoachAiManualExecutionDraftSide | null;
  quantityDecimal: string | null;
  priceDecimal: string | null;
  feesDecimal: string | null;
}>;

/** A provider-neutral structured extraction, before any Journal action. */
export type CoachAiManualExecutionExtraction = Readonly<{
  state: "draft" | "ready_for_confirmation";
  rows: readonly CoachAiManualExecutionExtractionRow[];
  missingFields: readonly string[];
  followUpQuestion: string | null;
}>;

/**
 * The canonical persisted draft row. Timezone and currency are server-supplied
 * account values; the remaining nullable facts stay editable until confirmation.
 */
export type CoachAiManualExecutionDraftRow = Readonly<
  CoachAiManualExecutionExtractionRow & {
    sourceTimezone: string;
    tradeCurrency: string;
  }
>;

export type CoachAiReadyManualExecutionDraftRow = Readonly<
  Omit<CoachAiManualExecutionDraftRow, "localDate" | "localTime" | "normalizedSymbol" | "side" | "quantityDecimal" | "priceDecimal"> & {
    localDate: string;
    localTime: string;
    normalizedSymbol: string;
    side: CoachAiManualExecutionDraftSide;
    quantityDecimal: string;
    priceDecimal: string;
  }
>;

export type CoachAiManualEntryDraft = Readonly<{
  contractVersion: typeof COACH_AI_MANUAL_ENTRY_DRAFT_CONTRACT_VERSION;
  draftId: string;
  conversationId: string;
  sourceMessageId: string;
  state: CoachAiManualEntryDraftState;
  journalWriteState: CoachAiManualEntryDraftWriteState;
  canonicalJournalCommand: "journal_manual_execution_commit" | null;
  canonicalJournalReference: string | null;
  writeFailureCode: string | null;
  rows: readonly CoachAiManualExecutionDraftRow[];
  createdAtUtc: string;
  updatedAtUtc: string;
  expiresAtUtc: string | null;
  finalizedAtUtc: string | null;
}>;

const TERMINAL_STATES = new Set<CoachAiManualEntryDraftState>([
  "committed",
  "write_failed",
  "expired",
  "archived",
]);

const TRANSITIONS: Readonly<Record<CoachAiManualEntryDraftState, readonly CoachAiManualEntryDraftState[]>> = {
  draft: ["draft", "ready_for_confirmation", "expired", "archived"],
  ready_for_confirmation: ["ready_for_confirmation", "confirmed_by_trader", "expired", "archived"],
  confirmed_by_trader: ["confirmed_by_trader", "commit_pending", "expired", "archived"],
  commit_pending: ["committed", "write_failed"],
  committed: [],
  write_failed: [],
  expired: [],
  archived: [],
};

export function isCoachAiManualEntryDraftTerminalState(
  state: CoachAiManualEntryDraftState,
): boolean {
  return TERMINAL_STATES.has(state);
}

export function canTransitionCoachAiManualEntryDraftState(
  current: CoachAiManualEntryDraftState,
  next: CoachAiManualEntryDraftState,
): boolean {
  return TRANSITIONS[current].includes(next);
}

export function isCoachAiManualExecutionDraftRowReady(
  row: CoachAiManualExecutionDraftRow,
): row is CoachAiReadyManualExecutionDraftRow {
  return row.localDate !== null && row.localTime !== null &&
    row.normalizedSymbol !== null && row.side !== null &&
    row.quantityDecimal !== null && row.priceDecimal !== null;
}

export function areCoachAiManualExecutionDraftRowsReady(
  rows: readonly CoachAiManualExecutionDraftRow[],
): rows is readonly CoachAiReadyManualExecutionDraftRow[] {
  return rows.length > 0 && rows.every(isCoachAiManualExecutionDraftRowReady);
}
