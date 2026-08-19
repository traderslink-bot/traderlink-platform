import "server-only";

import { createOpenAI } from "@ai-sdk/openai";
import { generateText, Output } from "ai";
import { z } from "zod";

import {
  COACH_AI_REVIEW_PLAN_SELECTION_CONTRACT_VERSION,
  type CoachAiReviewFrozenProviderPlanPackage,
  type CoachAiReviewPlanSelectionResponse,
} from "@/src/modules/coach/contracts/coach-ai-review-plan-selection-contracts";
import type { CoachAiReviewCompletePlan } from
  "@/src/modules/coach/contracts/coach-ai-review-rendered-plan-contracts";
import type { CoachAiGenerationUsage } from "../coach-ai-review-repository";
import {
  canonicalCoachAiReviewInsightBytes,
  deepFreezeCoachAiReviewInsight,
  digestCanonicalCoachAiReviewInsight,
} from "./coach-ai-review-insight-canonical";
import { CoachAiReviewInsightInvariantError } from "./coach-ai-review-insight-normalizer";
import { resolveCoachAiReviewPlanSelection } from "./coach-ai-review-plan-selection-package";

export const COACH_AI_REVIEW_OPENAI_SELECTOR_ADAPTER_VERSION =
  "traderlink_coach_ai_review_openai_selector_v1" as const;
export const COACH_AI_REVIEW_OPENAI_INVOCATION_MANIFEST_VERSION =
  "traderlink_coach_ai_review_openai_invocation_manifest_v1" as const;
export const COACH_AI_REVIEW_OPENAI_PROVIDER_KEY = "openai_direct_v2" as const;
export const COACH_AI_REVIEW_OPENAI_RESPONSES_BASE_URL =
  "https://api.openai.com/v1" as const;
export const COACH_AI_REVIEW_OPENAI_RESPONSES_URL =
  "https://api.openai.com/v1/responses" as const;
export const COACH_AI_REVIEW_PLAN_SELECTION_MAX_OUTPUT_TOKENS = 512 as const;

const INSTALLED_AI_SDK_VERSION = "7.0.52" as const;
const INSTALLED_OPENAI_PROVIDER_VERSION = "4.0.30" as const;
const MODEL_PATTERN = /^gpt-5\.6(?:-(?:luna|terra|sol))?$/u;
const PACKAGE_KEY_PATTERN = /^[A-Za-z0-9_-]{22}$/u;
const RESPONSE_ID_PATTERN = /^[A-Za-z0-9_-]{1,160}$/u;
const CHOICE_KEYS = Object.freeze([
  "plan_1",
  "plan_2",
  "plan_3",
  "plan_4",
  "plan_5",
  "plan_6",
] as const);

const SELECTION_SYSTEM_INSTRUCTION = `Choose the clearest and most useful complete review as a whole. Every choice is already calculated and fully written by TraderLink. Do not write, edit, combine, summarize, or recalculate any review text. Return only the strict selection object with the supplied package key and one authorized choice key.`;

function invariant(condition: boolean, code: string): asserts condition {
  if (!condition) throw new CoachAiReviewInsightInvariantError(code);
}

function asRecord(value: unknown, code: string): Record<string, unknown> {
  invariant(value !== null && !Array.isArray(value) && typeof value === "object", code);
  return value as Record<string, unknown>;
}

function assertExactKeys(
  value: Record<string, unknown>,
  expected: readonly string[],
  code: string,
): void {
  const actual = Object.keys(value).sort();
  const orderedExpected = [...expected].sort();
  invariant(actual.length === orderedExpected.length && actual.every((key, index) =>
    key === orderedExpected[index]), code);
}

function canonicalEqual(left: unknown, right: unknown): boolean {
  return canonicalCoachAiReviewInsightBytes(left).equals(
    canonicalCoachAiReviewInsightBytes(right),
  );
}

function completeUsage(usage: Readonly<{
  inputTokens?: number;
  inputTokenDetails?: Readonly<{
    cacheReadTokens?: number;
    cacheWriteTokens?: number;
  }>;
  outputTokens?: number;
  totalTokens?: number;
}>): CoachAiGenerationUsage {
  const cachedInputTokens = usage.inputTokenDetails?.cacheReadTokens;
  const cacheWriteInputTokens = usage.inputTokenDetails?.cacheWriteTokens;
  const values = [
    usage.inputTokens,
    cachedInputTokens,
    cacheWriteInputTokens,
    usage.outputTokens,
    usage.totalTokens,
  ];
  if (!values.every((value) =>
    typeof value === "number" && Number.isSafeInteger(value) && value >= 0,
  ) || (cachedInputTokens as number) + (cacheWriteInputTokens as number) >
      (usage.inputTokens as number)) {
    return Object.freeze({
      inputTokens: null,
      cachedInputTokens: null,
      cacheWriteInputTokens: null,
      outputTokens: null,
      totalTokens: null,
    });
  }
  return Object.freeze({
    inputTokens: usage.inputTokens as number,
    cachedInputTokens: cachedInputTokens as number,
    cacheWriteInputTokens: cacheWriteInputTokens as number,
    outputTokens: usage.outputTokens as number,
    totalTokens: usage.totalTokens as number,
  });
}

function selectionSchema(packageKey: string) {
  invariant(PACKAGE_KEY_PATTERN.test(packageKey),
    "TRADERLINK_AI_REVIEW_SELECTOR_PACKAGE_KEY_INVALID");
  return z.object({
    contractVersion: z.literal(COACH_AI_REVIEW_PLAN_SELECTION_CONTRACT_VERSION),
    packageKey: z.literal(packageKey),
    choiceKey: z.enum(CHOICE_KEYS),
  }).strict();
}

export type CoachAiReviewOpenAiInvocationManifest = Readonly<{
  manifestVersion: typeof COACH_AI_REVIEW_OPENAI_INVOCATION_MANIFEST_VERSION;
  adapterVersion: typeof COACH_AI_REVIEW_OPENAI_SELECTOR_ADAPTER_VERSION;
  providerKey: typeof COACH_AI_REVIEW_OPENAI_PROVIDER_KEY;
  apiFamily: "responses";
  endpoint: typeof COACH_AI_REVIEW_OPENAI_RESPONSES_URL;
  aiSdkVersion: typeof INSTALLED_AI_SDK_VERSION;
  openAiProviderVersion: typeof INSTALLED_OPENAI_PROVIDER_VERSION;
  modelId: string;
  nonStreaming: true;
  maximumOutputTokens: typeof COACH_AI_REVIEW_PLAN_SELECTION_MAX_OUTPUT_TOKENS;
  maximumRetries: 0;
  timeoutMs: number;
  store: false;
  telemetryEnabled: false;
  tools: "none";
  outputRepair: "none";
  conversation: "none";
  previousResponseContinuation: "none";
  redirects: "error";
  reasoningEffort: "minimal";
  reasoningSummary: null;
  reasoningMode: "not_applicable";
  reasoningContext: "not_applicable";
  serviceTier: "default";
  textVerbosity: "low";
  strictJsonSchema: true;
  truncation: "disabled";
  selectionInstructionDigestSha256: string;
  selectionSchemaDigestSha256: string;
  providerPackageDigestSha256: string;
}>;

export type CoachAiReviewOpenAiSelectionEnvelope = Readonly<{
  system: typeof SELECTION_SYSTEM_INSTRUCTION;
  prompt: string;
  maximumOutputTokens: typeof COACH_AI_REVIEW_PLAN_SELECTION_MAX_OUTPUT_TOKENS;
  selectionSchema: unknown;
  selectionSchemaDigestSha256: string;
  invocationManifest: CoachAiReviewOpenAiInvocationManifest;
  invocationManifestDigestSha256: string;
  reservationText: string;
}>;

export async function buildCoachAiReviewOpenAiSelectionEnvelope(input: Readonly<{
  frozenPackage: CoachAiReviewFrozenProviderPlanPackage;
  modelId: string;
  timeoutMs: number;
}>): Promise<CoachAiReviewOpenAiSelectionEnvelope> {
  invariant(MODEL_PATTERN.test(input.modelId),
    "TRADERLINK_AI_REVIEW_SELECTOR_MODEL_UNSUPPORTED");
  invariant(Number.isSafeInteger(input.timeoutMs) && input.timeoutMs >= 1_000 &&
    input.timeoutMs <= 120_000, "TRADERLINK_AI_REVIEW_SELECTOR_TIMEOUT_INVALID");
  const output = Output.object({
    schema: selectionSchema(input.frozenPackage.providerPackage.packageKey),
    name: "coach_ai_review_plan_selection",
  });
  const responseFormat = await output.responseFormat;
  invariant(responseFormat?.type === "json" && responseFormat.schema !== undefined,
    "TRADERLINK_AI_REVIEW_SELECTOR_SCHEMA_UNAVAILABLE");
  const selectionSchemaDigest = digestCanonicalCoachAiReviewInsight(responseFormat.schema);
  const instructionDigest = digestCanonicalCoachAiReviewInsight(SELECTION_SYSTEM_INSTRUCTION);
  const invocationManifest: CoachAiReviewOpenAiInvocationManifest =
    deepFreezeCoachAiReviewInsight({
      manifestVersion: COACH_AI_REVIEW_OPENAI_INVOCATION_MANIFEST_VERSION,
      adapterVersion: COACH_AI_REVIEW_OPENAI_SELECTOR_ADAPTER_VERSION,
      providerKey: COACH_AI_REVIEW_OPENAI_PROVIDER_KEY,
      apiFamily: "responses",
      endpoint: COACH_AI_REVIEW_OPENAI_RESPONSES_URL,
      aiSdkVersion: INSTALLED_AI_SDK_VERSION,
      openAiProviderVersion: INSTALLED_OPENAI_PROVIDER_VERSION,
      modelId: input.modelId,
      nonStreaming: true,
      maximumOutputTokens: COACH_AI_REVIEW_PLAN_SELECTION_MAX_OUTPUT_TOKENS,
      maximumRetries: 0,
      timeoutMs: input.timeoutMs,
      store: false,
      telemetryEnabled: false,
      tools: "none",
      outputRepair: "none",
      conversation: "none",
      previousResponseContinuation: "none",
      redirects: "error",
      reasoningEffort: "minimal",
      reasoningSummary: null,
      reasoningMode: "not_applicable",
      reasoningContext: "not_applicable",
      serviceTier: "default",
      textVerbosity: "low",
      strictJsonSchema: true,
      truncation: "disabled",
      selectionInstructionDigestSha256: instructionDigest.digestSha256,
      selectionSchemaDigestSha256: selectionSchemaDigest.digestSha256,
      providerPackageDigestSha256: input.frozenPackage.providerPackageDigestSha256,
    });
  const invocationManifestDigest = digestCanonicalCoachAiReviewInsight(invocationManifest);
  const reservationText = canonicalCoachAiReviewInsightBytes(Object.freeze({
    system: SELECTION_SYSTEM_INSTRUCTION,
    prompt: input.frozenPackage.canonicalProviderPackage,
    schema: responseFormat.schema,
  })).toString("utf8");
  return deepFreezeCoachAiReviewInsight({
    system: SELECTION_SYSTEM_INSTRUCTION,
    prompt: input.frozenPackage.canonicalProviderPackage,
    maximumOutputTokens: COACH_AI_REVIEW_PLAN_SELECTION_MAX_OUTPUT_TOKENS,
    selectionSchema: responseFormat.schema,
    selectionSchemaDigestSha256: selectionSchemaDigest.digestSha256,
    invocationManifest,
    invocationManifestDigestSha256: invocationManifestDigest.digestSha256,
    reservationText,
  });
}

export type CoachAiReviewOpenAiTransportAudit = Readonly<{
  fetchCount: 1;
  requestBodyByteLength: number;
  requestBodyDigestSha256: string;
}>;

export class CoachAiReviewOpenAiSelectionError extends Error {
  readonly failureCode: string;
  readonly transportMayHaveStarted: boolean;
  readonly transportAudit: CoachAiReviewOpenAiTransportAudit | null;

  constructor(input: Readonly<{
    failureCode: string;
    transportMayHaveStarted: boolean;
    transportAudit: CoachAiReviewOpenAiTransportAudit | null;
  }>) {
    super(input.failureCode);
    this.name = "CoachAiReviewOpenAiSelectionError";
    this.failureCode = input.failureCode;
    this.transportMayHaveStarted = input.transportMayHaveStarted;
    this.transportAudit = input.transportAudit;
  }
}

function createOneShotAuditedFetch(input: Readonly<{
  envelope: CoachAiReviewOpenAiSelectionEnvelope;
  underlyingFetch: typeof globalThis.fetch;
}>): Readonly<{
  fetch: typeof globalThis.fetch;
  audit: () => CoachAiReviewOpenAiTransportAudit;
  state: () => Readonly<{
    fetchCount: number;
    transportAudit: CoachAiReviewOpenAiTransportAudit | null;
  }>;
}> {
  let fetchCount = 0;
  let transportAudit: CoachAiReviewOpenAiTransportAudit | null = null;
  const fetch: typeof globalThis.fetch = async (resource, init) => {
    fetchCount += 1;
    invariant(fetchCount === 1, "TRADERLINK_AI_REVIEW_SELECTOR_MULTIPLE_FETCHES");
    const url = resource instanceof Request ? resource.url : resource.toString();
    invariant(url === COACH_AI_REVIEW_OPENAI_RESPONSES_URL,
      "TRADERLINK_AI_REVIEW_SELECTOR_ENDPOINT_INVALID");
    invariant(init?.method === "POST", "TRADERLINK_AI_REVIEW_SELECTOR_METHOD_INVALID");
    invariant(init.redirect === undefined || init.redirect === "error",
      "TRADERLINK_AI_REVIEW_SELECTOR_REDIRECT_INVALID");
    invariant(typeof init.body === "string", "TRADERLINK_AI_REVIEW_SELECTOR_BODY_INVALID");
    let parsed: unknown;
    try {
      parsed = JSON.parse(init.body);
    } catch {
      throw new CoachAiReviewInsightInvariantError(
        "TRADERLINK_AI_REVIEW_SELECTOR_BODY_JSON_INVALID",
      );
    }
    const body = asRecord(parsed, "TRADERLINK_AI_REVIEW_SELECTOR_BODY_NOT_OBJECT");
    assertExactKeys(body, [
      "model",
      "input",
      "max_output_tokens",
      "text",
      "store",
      "service_tier",
      "include",
      "truncation",
      "reasoning",
    ], "TRADERLINK_AI_REVIEW_SELECTOR_BODY_FIELD_INVALID");
    invariant(body.model === input.envelope.invocationManifest.modelId,
      "TRADERLINK_AI_REVIEW_SELECTOR_BODY_MODEL_INVALID");
    invariant(body.max_output_tokens === COACH_AI_REVIEW_PLAN_SELECTION_MAX_OUTPUT_TOKENS,
      "TRADERLINK_AI_REVIEW_SELECTOR_BODY_OUTPUT_LIMIT_INVALID");
    invariant(body.store === false, "TRADERLINK_AI_REVIEW_SELECTOR_BODY_STORE_INVALID");
    invariant(body.service_tier === "default",
      "TRADERLINK_AI_REVIEW_SELECTOR_BODY_SERVICE_TIER_INVALID");
    invariant(body.truncation === "disabled",
      "TRADERLINK_AI_REVIEW_SELECTOR_BODY_TRUNCATION_INVALID");
    invariant(canonicalEqual(body.include, ["reasoning.encrypted_content"]),
      "TRADERLINK_AI_REVIEW_SELECTOR_BODY_INCLUDE_INVALID");
    invariant(canonicalEqual(body.reasoning, { effort: "minimal" }),
      "TRADERLINK_AI_REVIEW_SELECTOR_BODY_REASONING_INVALID");
    invariant(canonicalEqual(body.input, [
      { role: "developer", content: input.envelope.system },
      {
        role: "user",
        content: [{ type: "input_text", text: input.envelope.prompt }],
      },
    ]), "TRADERLINK_AI_REVIEW_SELECTOR_BODY_INPUT_INVALID");
    invariant(canonicalEqual(body.text, {
      format: {
        type: "json_schema",
        strict: true,
        name: "coach_ai_review_plan_selection",
        schema: input.envelope.selectionSchema,
      },
      verbosity: "low",
    }), "TRADERLINK_AI_REVIEW_SELECTOR_BODY_SCHEMA_INVALID");
    const bytes = Buffer.from(init.body, "utf8");
    transportAudit = Object.freeze({
      fetchCount: 1 as const,
      requestBodyByteLength: bytes.byteLength,
      requestBodyDigestSha256: digestCanonicalCoachAiReviewInsight(parsed).digestSha256,
    });
    return input.underlyingFetch(resource, { ...init, redirect: "error" });
  };
  return Object.freeze({
    fetch,
    audit: () => {
      invariant(transportAudit !== null && fetchCount === 1,
        "TRADERLINK_AI_REVIEW_SELECTOR_TRANSPORT_NOT_CAPTURED");
      return transportAudit;
    },
    state: () => Object.freeze({ fetchCount, transportAudit }),
  });
}

export type CoachAiReviewOpenAiPlanSelectionGeneration = Readonly<{
  selection: CoachAiReviewPlanSelectionResponse;
  selectedPlan: CoachAiReviewCompletePlan;
  usage: CoachAiGenerationUsage;
  providerResponseId: string;
  providerResponseModelId: string;
  transportAudit: CoachAiReviewOpenAiTransportAudit;
  envelope: CoachAiReviewOpenAiSelectionEnvelope;
}>;

export async function selectCoachAiReviewPlanWithOpenAi(input: Readonly<{
  frozenPackage: CoachAiReviewFrozenProviderPlanPackage;
  apiKey: string;
  modelId: string;
  timeoutMs: number;
  capturedTestFetch?: typeof globalThis.fetch;
}>): Promise<CoachAiReviewOpenAiPlanSelectionGeneration> {
  invariant(input.apiKey.trim().length > 0, "TRADERLINK_AI_REVIEW_SELECTOR_API_KEY_MISSING");
  const envelope = await buildCoachAiReviewOpenAiSelectionEnvelope(input);
  const auditedTransport = createOneShotAuditedFetch({
    envelope,
    underlyingFetch: input.capturedTestFetch ?? globalThis.fetch,
  });
  const openai = createOpenAI({
    apiKey: input.apiKey.trim(),
    baseURL: COACH_AI_REVIEW_OPENAI_RESPONSES_BASE_URL,
    fetch: auditedTransport.fetch,
  });
  const output = Output.object({
    schema: selectionSchema(input.frozenPackage.providerPackage.packageKey),
    name: "coach_ai_review_plan_selection",
  });
  try {
    const result = await generateText({
      model: openai.responses(input.modelId),
      maxOutputTokens: envelope.maximumOutputTokens,
      maxRetries: 0,
      timeout: { totalMs: input.timeoutMs },
      output,
      system: envelope.system,
      prompt: envelope.prompt,
      telemetry: { isEnabled: false },
      providerOptions: {
        openai: {
          store: false,
          strictJsonSchema: true,
          systemMessageMode: "developer",
          reasoningEffort: "minimal",
          reasoningSummary: null,
          serviceTier: "default",
          textVerbosity: "low",
          truncation: "disabled",
        },
      },
    });
    invariant(result.output !== undefined && result.output !== null,
      "TRADERLINK_AI_REVIEW_SELECTOR_NO_OUTPUT");
    invariant(RESPONSE_ID_PATTERN.test(result.response.id),
      "TRADERLINK_AI_REVIEW_SELECTOR_RESPONSE_ID_INVALID");
    invariant(result.response.modelId === input.modelId,
      "TRADERLINK_AI_REVIEW_SELECTOR_RESPONSE_MODEL_INVALID");
    const resolved = resolveCoachAiReviewPlanSelection({
      response: result.output,
      frozenPackage: input.frozenPackage,
    });
    return deepFreezeCoachAiReviewInsight({
      selection: resolved.selection,
      selectedPlan: resolved.selectedPlan,
      usage: completeUsage(result.usage),
      providerResponseId: result.response.id,
      providerResponseModelId: result.response.modelId,
      transportAudit: auditedTransport.audit(),
      envelope,
    });
  } catch (error) {
    if (error instanceof CoachAiReviewOpenAiSelectionError) throw error;
    const state = auditedTransport.state();
    const failureCode = error instanceof CoachAiReviewInsightInvariantError
      ? error.message
      : "TRADERLINK_AI_REVIEW_SELECTOR_PROVIDER_FAILED";
    throw new CoachAiReviewOpenAiSelectionError({
      failureCode,
      transportMayHaveStarted: state.transportAudit !== null,
      transportAudit: state.transportAudit,
    });
  }
}
