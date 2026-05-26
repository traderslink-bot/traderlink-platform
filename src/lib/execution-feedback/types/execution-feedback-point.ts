export type ExecutionFeedbackPointKind = "context" | "strength" | "risk";

export type ExecutionFeedbackPointSeverity = "low" | "moderate" | "high";

export type ExecutionFeedbackPointConfidence = "low" | "moderate" | "high";

export interface ExecutionFeedbackPoint {
  id: string;
  kind: ExecutionFeedbackPointKind;
  category:
    | "position_construction"
    | "size_discipline"
    | "risk_reduction"
    | "exit_structure"
    | "timing"
    | "pnl";
  label: string;
  summary: string;
  severity: ExecutionFeedbackPointSeverity;
  confidence: ExecutionFeedbackPointConfidence;
  priorityScore: number;
  evidence: Record<string, unknown>;
}

export interface ExecutionFeedbackPointSet {
  context: ExecutionFeedbackPoint[];
  strengths: ExecutionFeedbackPoint[];
  risks: ExecutionFeedbackPoint[];
  all: ExecutionFeedbackPoint[];
}
