import type { JournalManualTradeEntry, JournalTradeStyle } from "./journal-manual-trade-capture-contracts";

export type JournalWorkspaceTradeEditExistingRow = Readonly<{
  kind: "existing";
  executionRef: string;
  removed: boolean;
  entry: JournalManualTradeEntry | null;
}>;

export type JournalWorkspaceTradeEditNewRow = Readonly<{
  kind: "new";
  entry: JournalManualTradeEntry;
}>;

export type JournalWorkspaceTradeEditDraft = Readonly<{
  snapshotRef: string;
  rows: readonly (
    | JournalWorkspaceTradeEditExistingRow
    | JournalWorkspaceTradeEditNewRow
  )[];
  tradeStyle: JournalTradeStyle | null;
}>;

export type JournalWorkspaceTradeEditConsequence =
  | "keeps_closed"
  | "leaves_open"
  | "deletes_trade"
  | "creates_multiple"
  | "merges"
  | "changes_nearby_boundaries";

export type JournalWorkspaceTradeEditPreview = Readonly<{
  previewRef: string;
  expiresAtUtc: string;
  consequence: JournalWorkspaceTradeEditConsequence;
  consequenceCopy: string;
}>;

export type JournalWorkspaceTradeEditCommit = Readonly<{
  previewRef: string;
  idempotencyKey: string;
}>;

export type JournalWorkspaceTradeEditCommitResult = Readonly<{
  consequence: JournalWorkspaceTradeEditConsequence;
  acceptedNewExecutionCount: number;
  correctedExecutionCount: number;
  removedExecutionCount: number;
  rebuildCount: number;
}>;
