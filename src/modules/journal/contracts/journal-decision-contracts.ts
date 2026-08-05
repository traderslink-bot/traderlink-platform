export type JournalDecisionAction =
  | "correct_execution_fact"
  | "add_missing_execution"
  | "set_execution_order"
  | "exclude_execution"
  | "restore_execution"
  | "merge_supported_duplicate"
  | "reconcile_grouped_fills"
  | "keep_distinct"
  | "supply_opening_inventory"
  | "supply_position_fact"
  | "supply_coverage_fact"
  | "correct_position_fact"
  | "confirm_legitimate_open_position"
  | "accept_source_limitation";

export type JournalDecisionEventAction =
  | "opened"
  | "superseded_by_rebuild"
  | JournalDecisionAction;

export type JournalDecisionTarget =
  | Readonly<{ kind: "source_issue"; sourceIssueId: string }>
  | Readonly<{ kind: "execution"; executionId: string }>
  | Readonly<{ kind: "position_fact"; positionFactId: string }>
  | Readonly<{ kind: "overlap_set"; overlapKeySha256: string }>
  | Readonly<{ kind: "chain"; chainKeySha256: string }>;

export type JournalDataDecisionRecord = Readonly<{
  decisionId: string;
  workspaceId: string;
  accountId: string;
  issueCode: string;
  state: "pending" | "resolved" | "superseded";
  target: JournalDecisionTarget;
  effectCode: string;
  revision: number;
  currentEventId: string;
  createdAtUtc: string;
  updatedAtUtc: string;
}>;
