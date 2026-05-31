import type { ExecutionAnalysisLevelContextInput } from "./execution-level-context-input";

export const EXECUTION_LEVEL_CONTEXT_PIPELINE_FIELD = "levelAnalysisContext" as const;

export interface ExecutionLevelContextPipelineAttachment {
  sourceType: "execution-analysis-level-context-input";
  fieldName: typeof EXECUTION_LEVEL_CONTEXT_PIPELINE_FIELD;
  factualOnly: true;
  context: ExecutionAnalysisLevelContextInput;
}

export type ExecutionLevelContextPipelineCarrier = {
  [EXECUTION_LEVEL_CONTEXT_PIPELINE_FIELD]?: ExecutionLevelContextPipelineAttachment;
};

export interface ExecutionLevelContextPipelineAdapterInput<
  TInput extends Record<string, unknown>,
> {
  pipelineInput: TInput;
  levelContext?: ExecutionAnalysisLevelContextInput | null;
}

export type ExecutionLevelContextPipelineAdapterResult<
  TInput extends Record<string, unknown>,
> =
  | {
      status: "attached";
      pipelineInput: TInput & Required<ExecutionLevelContextPipelineCarrier>;
      attachment: ExecutionLevelContextPipelineAttachment;
    }
  | {
      status: "unchanged";
      pipelineInput: TInput;
      reason: "no_level_context_provided";
    };

const PROHIBITED_FIELD_NAMES = new Set([
  "grade",
  "tradeGrade",
  "coaching",
  "coach",
  "pnl",
  "pAndL",
  "giveback",
  "behaviorScore",
  "behaviorScoring",
  "recommendation",
  "entryDecision",
  "exitDecision",
  "tradeAdvice",
  "mistake",
  "discipline",
]);

const PROHIBITED_LANGUAGE_PATTERNS: Array<[string, RegExp]> = [
  ["grading", /\bgrading\b/i],
  ["coaching", /\bcoaching\b/i],
  ["coach", /\bcoach\b/i],
  ["p/l", /\bp\/l\b|\bpnl\b/i],
  ["giveback", /\bgiveback\b/i],
  ["behavior score", /\bbehavior score\b|\bbehavior scoring\b/i],
  ["recommendation", /\brecommendation\b/i],
  ["buy/sell/hold", /\bbuy\b|\bsell\b|\bhold\b/i],
  ["entry decision", /\bentry decision\b/i],
  ["exit decision", /\bexit decision\b/i],
  ["trade advice", /\btrade advice\b/i],
  ["mistake", /\bmistake\b/i],
  ["discipline", /\bdiscipline\b/i],
];

function collectObjectKeys(value: unknown, out: string[] = []): string[] {
  if (Array.isArray(value)) {
    for (const item of value) {
      collectObjectKeys(item, out);
    }
    return out;
  }

  if (typeof value === "object" && value !== null) {
    for (const [key, item] of Object.entries(value)) {
      out.push(key);
      collectObjectKeys(item, out);
    }
  }

  return out;
}

function collectStringValues(value: unknown, out: string[] = []): string[] {
  if (typeof value === "string") {
    out.push(value);
    return out;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectStringValues(item, out);
    }
    return out;
  }

  if (typeof value === "object" && value !== null) {
    for (const item of Object.values(value)) {
      collectStringValues(item, out);
    }
  }

  return out;
}

function isPipelineAttachment(value: unknown): value is ExecutionLevelContextPipelineAttachment {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as ExecutionLevelContextPipelineAttachment).sourceType ===
      "execution-analysis-level-context-input" &&
    (value as ExecutionLevelContextPipelineAttachment).fieldName ===
      EXECUTION_LEVEL_CONTEXT_PIPELINE_FIELD &&
    (value as ExecutionLevelContextPipelineAttachment).factualOnly === true &&
    typeof (value as ExecutionLevelContextPipelineAttachment).context === "object" &&
    (value as ExecutionLevelContextPipelineAttachment).context !== null
  );
}

export function assertExecutionLevelContextIsFactualOnly(
  context: ExecutionAnalysisLevelContextInput,
): void {
  const prohibitedKeys = collectObjectKeys(context).filter((key) =>
    PROHIBITED_FIELD_NAMES.has(key),
  );
  const text = collectStringValues(context).join("\n");
  const prohibitedLanguage = PROHIBITED_LANGUAGE_PATTERNS
    .filter(([, pattern]) => pattern.test(text))
    .map(([label]) => label);

  if (prohibitedKeys.length > 0 || prohibitedLanguage.length > 0) {
    throw new Error(
      [
        "ExecutionAnalysisLevelContextInput must remain factual-only.",
        prohibitedKeys.length > 0
          ? `Prohibited fields: ${prohibitedKeys.join(", ")}.`
          : null,
        prohibitedLanguage.length > 0
          ? `Prohibited language: ${prohibitedLanguage.join(", ")}.`
          : null,
      ]
        .filter(Boolean)
        .join(" "),
    );
  }
}

export function attachExecutionLevelContextToPipelineInput<
  TInput extends Record<string, unknown>,
>(
  input: ExecutionLevelContextPipelineAdapterInput<TInput>,
): ExecutionLevelContextPipelineAdapterResult<TInput> {
  if (!input.levelContext) {
    return {
      status: "unchanged",
      pipelineInput: { ...input.pipelineInput },
      reason: "no_level_context_provided",
    };
  }

  assertExecutionLevelContextIsFactualOnly(input.levelContext);

  const attachment: ExecutionLevelContextPipelineAttachment = {
    sourceType: "execution-analysis-level-context-input",
    fieldName: EXECUTION_LEVEL_CONTEXT_PIPELINE_FIELD,
    factualOnly: true,
    context: input.levelContext,
  };

  return {
    status: "attached",
    attachment,
    pipelineInput: {
      ...input.pipelineInput,
      [EXECUTION_LEVEL_CONTEXT_PIPELINE_FIELD]: attachment,
    },
  };
}

export function hasExecutionLevelContext(
  input: Record<string, unknown>,
): input is Record<string, unknown> & Required<ExecutionLevelContextPipelineCarrier> {
  return isPipelineAttachment(input[EXECUTION_LEVEL_CONTEXT_PIPELINE_FIELD]);
}

export function extractExecutionLevelContextFromPipelineInput(
  input: Record<string, unknown>,
): ExecutionAnalysisLevelContextInput | null {
  if (!hasExecutionLevelContext(input)) {
    return null;
  }

  return input[EXECUTION_LEVEL_CONTEXT_PIPELINE_FIELD].context;
}

export function stripExecutionLevelContextFromPipelineInput<
  TInput extends Record<string, unknown>,
>(
  input: TInput & ExecutionLevelContextPipelineCarrier,
): Omit<TInput, typeof EXECUTION_LEVEL_CONTEXT_PIPELINE_FIELD> {
  const {
    [EXECUTION_LEVEL_CONTEXT_PIPELINE_FIELD]: _levelAnalysisContext,
    ...rest
  } = input;

  return rest as Omit<TInput, typeof EXECUTION_LEVEL_CONTEXT_PIPELINE_FIELD>;
}
