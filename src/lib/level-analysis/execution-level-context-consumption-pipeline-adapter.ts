import {
  EXECUTION_LEVEL_CONTEXT_OBSERVATIONS_PIPELINE_FIELD,
  stripExecutionLevelContextAndObservationsFromPipelineInput,
  type ExecutionLevelContextObservationsPipelineCarrier,
} from "./execution-level-context-observation-pipeline-adapter";
import {
  EXECUTION_LEVEL_CONTEXT_PIPELINE_FIELD,
  type ExecutionLevelContextPipelineCarrier,
} from "./execution-level-context-pipeline-adapter";
import {
  assertExecutionLevelContextConsumptionViewIsAllowed,
  type ExecutionLevelContextAllowedConsumptionView,
} from "./execution-level-context-consumption-adapter";

export const EXECUTION_LEVEL_CONTEXT_CONSUMPTION_VIEW_PIPELINE_FIELD =
  "levelAnalysisConsumptionView" as const;

export interface ExecutionLevelContextConsumptionViewPipelineAttachment {
  sourceType: "execution-level-context-allowed-consumption-view";
  fieldName: typeof EXECUTION_LEVEL_CONTEXT_CONSUMPTION_VIEW_PIPELINE_FIELD;
  factualOnly: true;
  view: ExecutionLevelContextAllowedConsumptionView;
}

export type ExecutionLevelContextConsumptionViewPipelineCarrier = {
  [EXECUTION_LEVEL_CONTEXT_CONSUMPTION_VIEW_PIPELINE_FIELD]?: ExecutionLevelContextConsumptionViewPipelineAttachment;
};

export interface ExecutionLevelContextConsumptionViewPipelineAdapterInput<
  TInput extends Record<string, unknown>,
> {
  pipelineInput: TInput;
  view?: ExecutionLevelContextAllowedConsumptionView | null;
}

export type ExecutionLevelContextConsumptionViewPipelineAdapterResult<
  TInput extends Record<string, unknown>,
> =
  | {
      status: "attached";
      pipelineInput: TInput &
        Required<ExecutionLevelContextConsumptionViewPipelineCarrier>;
      attachment: ExecutionLevelContextConsumptionViewPipelineAttachment;
    }
  | {
      status: "unchanged";
      pipelineInput: TInput;
      reason: "no_level_consumption_view_provided";
    };

function isConsumptionViewPipelineAttachment(
  value: unknown,
): value is ExecutionLevelContextConsumptionViewPipelineAttachment {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as ExecutionLevelContextConsumptionViewPipelineAttachment).sourceType ===
      "execution-level-context-allowed-consumption-view" &&
    (value as ExecutionLevelContextConsumptionViewPipelineAttachment).fieldName ===
      EXECUTION_LEVEL_CONTEXT_CONSUMPTION_VIEW_PIPELINE_FIELD &&
    (value as ExecutionLevelContextConsumptionViewPipelineAttachment).factualOnly ===
      true &&
    typeof (value as ExecutionLevelContextConsumptionViewPipelineAttachment).view ===
      "object" &&
    (value as ExecutionLevelContextConsumptionViewPipelineAttachment).view !== null
  );
}

export function attachExecutionLevelContextConsumptionViewToPipelineInput<
  TInput extends Record<string, unknown>,
>(
  input: ExecutionLevelContextConsumptionViewPipelineAdapterInput<TInput>,
): ExecutionLevelContextConsumptionViewPipelineAdapterResult<TInput> {
  if (!input.view) {
    return {
      status: "unchanged",
      pipelineInput: { ...input.pipelineInput },
      reason: "no_level_consumption_view_provided",
    };
  }

  assertExecutionLevelContextConsumptionViewIsAllowed(input.view);

  const attachment: ExecutionLevelContextConsumptionViewPipelineAttachment = {
    sourceType: "execution-level-context-allowed-consumption-view",
    fieldName: EXECUTION_LEVEL_CONTEXT_CONSUMPTION_VIEW_PIPELINE_FIELD,
    factualOnly: true,
    view: input.view,
  };

  return {
    status: "attached",
    attachment,
    pipelineInput: {
      ...input.pipelineInput,
      [EXECUTION_LEVEL_CONTEXT_CONSUMPTION_VIEW_PIPELINE_FIELD]: attachment,
    },
  };
}

export function hasExecutionLevelContextConsumptionView(
  input: Record<string, unknown>,
): input is Record<string, unknown> &
  Required<ExecutionLevelContextConsumptionViewPipelineCarrier> {
  return isConsumptionViewPipelineAttachment(
    input[EXECUTION_LEVEL_CONTEXT_CONSUMPTION_VIEW_PIPELINE_FIELD],
  );
}

export function extractExecutionLevelContextConsumptionViewFromPipelineInput(
  input: Record<string, unknown>,
): ExecutionLevelContextAllowedConsumptionView | null {
  if (!hasExecutionLevelContextConsumptionView(input)) {
    return null;
  }

  return input[EXECUTION_LEVEL_CONTEXT_CONSUMPTION_VIEW_PIPELINE_FIELD].view;
}

export function stripExecutionLevelContextConsumptionViewFromPipelineInput<
  TInput extends Record<string, unknown>,
>(
  input: TInput & ExecutionLevelContextConsumptionViewPipelineCarrier,
): Omit<TInput, typeof EXECUTION_LEVEL_CONTEXT_CONSUMPTION_VIEW_PIPELINE_FIELD> {
  const {
    [EXECUTION_LEVEL_CONTEXT_CONSUMPTION_VIEW_PIPELINE_FIELD]: _levelAnalysisConsumptionView,
    ...rest
  } = input;

  return rest as Omit<
    TInput,
    typeof EXECUTION_LEVEL_CONTEXT_CONSUMPTION_VIEW_PIPELINE_FIELD
  >;
}

export function stripAllLevelAnalysisCarriersFromPipelineInput<
  TInput extends Record<string, unknown>,
>(
  input: TInput &
    ExecutionLevelContextPipelineCarrier &
    ExecutionLevelContextObservationsPipelineCarrier &
    ExecutionLevelContextConsumptionViewPipelineCarrier,
): Omit<
  TInput,
  | typeof EXECUTION_LEVEL_CONTEXT_PIPELINE_FIELD
  | typeof EXECUTION_LEVEL_CONTEXT_OBSERVATIONS_PIPELINE_FIELD
  | typeof EXECUTION_LEVEL_CONTEXT_CONSUMPTION_VIEW_PIPELINE_FIELD
> {
  const withoutConsumptionView =
    stripExecutionLevelContextConsumptionViewFromPipelineInput(input);

  return stripExecutionLevelContextAndObservationsFromPipelineInput(
    withoutConsumptionView as typeof withoutConsumptionView &
      ExecutionLevelContextPipelineCarrier &
      ExecutionLevelContextObservationsPipelineCarrier,
  ) as Omit<
    TInput,
    | typeof EXECUTION_LEVEL_CONTEXT_PIPELINE_FIELD
    | typeof EXECUTION_LEVEL_CONTEXT_OBSERVATIONS_PIPELINE_FIELD
    | typeof EXECUTION_LEVEL_CONTEXT_CONSUMPTION_VIEW_PIPELINE_FIELD
  >;
}
