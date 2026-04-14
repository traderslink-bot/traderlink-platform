// 2026-04-14
// PURPOSE:
// Defines the trade-relevant structural context window used by the
// support/resistance lane.

export interface StructuralContextWindow {
  firstExecutionTimestamp: string;
  lastExecutionTimestamp: string;
  preEntryContextStartTimestamp: string;
  postExitContextEndTimestamp: string;
  includedTimeframes: string[];
}
