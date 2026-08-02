export type JournalAllocationRole =
  | "opening"
  | "adding"
  | "reducing"
  | "closing"
  | "flip_closing"
  | "flip_opening";

export type JournalRoundTripProjectionState =
  | "ready_closed"
  | "legitimate_open"
  | "needs_decision";

export type JournalRoundTripAllocation = Readonly<{
  executionId: string;
  executionVersionId: string;
  role: JournalAllocationRole;
  quantityDecimal: string;
}>;

export type JournalRoundTripProjection = Readonly<{
  direction: "long" | "short";
  openedAtUtc: string;
  closedAtUtc: string | null;
  finalPositionDecimal: string;
  state: JournalRoundTripProjectionState;
  coverageReasonCode: string | null;
  allocations: readonly JournalRoundTripAllocation[];
  identityAliasSha256: string;
  projectionFingerprintSha256: string;
}>;

export type JournalChainRebuildResult = Readonly<{
  status: "rebuilt" | "already_current";
  rebuildId: string;
  chainKeySha256: string;
  orderedInputSha256: string;
  outputSha256: string;
  coverageState: "complete" | "partial" | "unavailable";
  readyClosedCount: number;
  legitimateOpenCount: number;
  needsDecisionCount: number;
  excludedCount: number;
  roundTripIds: readonly string[];
  decisionReasonCodes: readonly string[];
}>;
