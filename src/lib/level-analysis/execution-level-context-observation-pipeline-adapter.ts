import {
  EXECUTION_LEVEL_CONTEXT_PIPELINE_FIELD,
  stripExecutionLevelContextFromPipelineInput,
  type ExecutionLevelContextPipelineCarrier,
} from "./execution-level-context-pipeline-adapter";
import type { ExecutionLevelContextObservationSet } from "./execution-level-context-observations";
import { assertExecutionLevelContextObservationsAreFactualOnly } from "./execution-level-context-observations";

export const EXECUTION_LEVEL_CONTEXT_OBSERVATIONS_PIPELINE_FIELD =
  "levelAnalysisObservations" as const;

export interface ExecutionLevelContextObservationsPipelineAttachment {
  sourceType: "execution-level-context-observations";
  fieldName: typeof EXECUTION_LEVEL_CONTEXT_OBSERVATIONS_PIPELINE_FIELD;
  factualOnly: true;
  observationSet: ExecutionLevelContextObservationSet;
}

export type ExecutionLevelContextObservationsPipelineCarrier = {
  [EXECUTION_LEVEL_CONTEXT_OBSERVATIONS_PIPELINE_FIELD]?: ExecutionLevelContextObservationsPipelineAttachment;
};

export interface ExecutionLevelContextObservationsPipelineAdapterInput<
  TInput extends Record<string, unknown>,
> {
  pipelineInput: TInput;
  observations?: ExecutionLevelContextObservationSet | null;
}

export type ExecutionLevelContextObservationsPipelineAdapterResult<
  TInput extends Record<string, unknown>,
> =
  | {
      status: "attached";
      pipelineInput: TInput &
        Required<ExecutionLevelContextObservationsPipelineCarrier>;
      attachment: ExecutionLevelContextObservationsPipelineAttachment;
    }
  | {
      status: "unchanged";
      pipelineInput: TInput;
      reason: "no_level_observations_provided";
    };

function isObservationsPipelineAttachment(
  value: unknown,
): value is ExecutionLevelContextObservationsPipelineAttachment {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as ExecutionLevelContextObservationsPipelineAttachment).sourceType ===
      "execution-level-context-observations" &&
    (value as ExecutionLevelContextObservationsPipelineAttachment).fieldName ===
      EXECUTION_LEVEL_CONTEXT_OBSERVATIONS_PIPELINE_FIELD &&
    (value as ExecutionLevelContextObservationsPipelineAttachment).factualOnly ===
      true &&
    typeof (value as ExecutionLevelContextObservationsPipelineAttachment)
      .observationSet === "object" &&
    (value as ExecutionLevelContextObservationsPipelineAttachment)
      .observationSet !== null
  );
}

export function attachExecutionLevelContextObservationsToPipelineInput<
  TInput extends Record<string, unknown>,
>(
  input: ExecutionLevelContextObservationsPipelineAdapterInput<TInput>,
): ExecutionLevelContextObservationsPipelineAdapterResult<TInput> {
  if (!input.observations) {
    return {
      status: "unchanged",
      pipelineInput: { ...input.pipelineInput },
      reason: "no_level_observations_provided",
    };
  }

  assertExecutionLevelContextObservationsAreFactualOnly(input.observations);

  const attachment: ExecutionLevelContextObservationsPipelineAttachment = {
    sourceType: "execution-level-context-observations",
    fieldName: EXECUTION_LEVEL_CONTEXT_OBSERVATIONS_PIPELINE_FIELD,
    factualOnly: true,
    observationSet: input.observations,
  };

  return {
    status: "attached",
    attachment,
    pipelineInput: {
      ...input.pipelineInput,
      [EXECUTION_LEVEL_CONTEXT_OBSERVATIONS_PIPELINE_FIELD]: attachment,
    },
  };
}

export function hasExecutionLevelContextObservations(
  input: Record<string, unknown>,
): input is Record<string, unknown> &
  Required<ExecutionLevelContextObservationsPipelineCarrier> {
  return isObservationsPipelineAttachment(
    input[EXECUTION_LEVEL_CONTEXT_OBSERVATIONS_PIPELINE_FIELD],
  );
}

export function extractExecutionLevelContextObservationsFromPipelineInput(
  input: Record<string, unknown>,
): ExecutionLevelContextObservationSet | null {
  if (!hasExecutionLevelContextObservations(input)) {
    return null;
  }

  return input[EXECUTION_LEVEL_CONTEXT_OBSERVATIONS_PIPELINE_FIELD].observationSet;
}

export function stripExecutionLevelContextObservationsFromPipelineInput<
  TInput extends Record<string, unknown>,
>(
  input: TInput & ExecutionLevelContextObservationsPipelineCarrier,
): Omit<TInput, typeof EXECUTION_LEVEL_CONTEXT_OBSERVATIONS_PIPELINE_FIELD> {
  const {
    [EXECUTION_LEVEL_CONTEXT_OBSERVATIONS_PIPELINE_FIELD]: _levelAnalysisObservations,
    ...rest
  } = input;

  return rest as Omit<
    TInput,
    typeof EXECUTION_LEVEL_CONTEXT_OBSERVATIONS_PIPELINE_FIELD
  >;
}

export function stripExecutionLevelContextAndObservationsFromPipelineInput<
  TInput extends Record<string, unknown>,
>(
  input: TInput &
    ExecutionLevelContextPipelineCarrier &
    ExecutionLevelContextObservationsPipelineCarrier,
): Omit<
  TInput,
  | typeof EXECUTION_LEVEL_CONTEXT_PIPELINE_FIELD
  | typeof EXECUTION_LEVEL_CONTEXT_OBSERVATIONS_PIPELINE_FIELD
> {
  const withoutObservations =
    stripExecutionLevelContextObservationsFromPipelineInput(input);

  return stripExecutionLevelContextFromPipelineInput(
    withoutObservations as typeof withoutObservations &
      ExecutionLevelContextPipelineCarrier,
  ) as Omit<
    TInput,
    | typeof EXECUTION_LEVEL_CONTEXT_PIPELINE_FIELD
    | typeof EXECUTION_LEVEL_CONTEXT_OBSERVATIONS_PIPELINE_FIELD
  >;
}
