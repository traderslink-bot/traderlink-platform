import { createOpenAI } from "@ai-sdk/openai";
import { generateText, Output } from "ai";
import { z } from "zod";

import {
  COACH_MONTHLY_AI_REVIEW_OUTPUT_CONTRACT_VERSION_V2,
  COACH_MONTHLY_AI_OUTPUT_CONTRACT_VERSION,
  type CoachMonthlyAiReviewOutputV2,
  type CoachMonthlyAiReviewOutput,
} from "../contracts/monthly-ai-review-output-contracts";
import type {
  CoachMonthlyAiReviewInputV2,
  CoachMonthlyAiReviewInput,
} from "../contracts/monthly-ai-review-input-contracts";
import type { CoachAiGenerationUsage } from "./coach-ai-review-repository";

export const COACH_MONTHLY_AI_REVIEW_MAX_OUTPUT_TOKENS = 4_096;

export type CoachMonthlyAiReviewGeneration = Readonly<{
  output: CoachMonthlyAiReviewOutput;
  usage: CoachAiGenerationUsage;
}>;

const monthlyReviewSchema = z.object({
  monthlyReview: z.string().min(1).max(2_400),
  progressAcrossMonth: z.string().min(1).max(1_800),
  recurringFriction: z.string().min(1).max(1_800),
  focusFollowThrough: z.string().min(1).max(1_800),
  nextMonthFocuses: z.array(z.string().min(1).max(280)).min(1).max(3),
  incompleteRecord: z.string().min(1).max(1_200).nullable(),
});

const monthlyReviewSchemaV2 = z.object({
  reviewSummary: z.string().min(1).max(2_400),
  whatImproved: z.string().min(1).max(1_800),
  whatHeldYouBack: z.string().min(1).max(1_800),
  focusFollowThrough: z.string().min(1).max(1_800),
  nextPeriodFocuses: z.array(z.string().min(1).max(280)).min(1).max(3),
  incompleteRecord: z.string().min(1).max(1_200).nullable(),
});

const SYSTEM_PROMPT = `You are TraderLink's monthly trading-journal reviewer. Write a direct, useful review only from the supplied monthly Journal package.

Be specific where the supplied notes, rule outcomes, focuses, issued weekly reviews, or trade facts support a point. Be respectful but do not soften a supported criticism. Do not invent a setup, motive, market condition, rule outcome, missing fact, recurring pattern, or trade result.

Do not provide trade recommendations, price targets, position-size advice, entry or exit instructions, diagnoses, certainty claims, or language that treats profit as proof of good process or a loss as proof of bad process. Do not mention the provider, AI, prompts, tokens, databases, internal systems, or data-decision codes.

Use plain trading-journal language. Keep the next-month focuses process-oriented and limited to three. A recurring theme from an issued weekly review must also be supported by the current month's Journal package. If the supplied record is incomplete, say exactly what limits the conclusion in incompleteRecord; otherwise set incompleteRecord to null.`;

const MONTHLY_SYSTEM_PROMPT_V2 = `You are TraderLink's calendar-month trading-journal reviewer. Write only from the supplied immutable monthly package.

calendarMonthFacts is the only source for this month's trade counts, P/L, win rate, rule counts, tag observations, and every other statistic. reviewNarrativeContext and rawReflectionContext are non-statistical process evidence. Never derive, repeat, reconcile, or imply a monthly number from narrative context. A cross-month weekly or two-week review may discuss earlier-dated reflections, but its earlier-month executions, P/L, rule outcomes, and tags never become facts for this month.

Each represented evidence reference is one observation. Never treat an issued-review summary and a raw reflection with the same lineage as independent confirmation. Use recurring-pattern language only when the supplied evidence genuinely repeats, and respect reflectionCoverage and coverageNotice.

Be direct but do not invent a setup, motive, market condition, rule outcome, missing fact, pattern, or trade result. Do not provide trade recommendations, price targets, position-size advice, entry or exit instructions, diagnoses, certainty claims, or treat profit as proof of good process or loss as proof of bad process. Do not mention the provider, AI, prompts, tokens, databases, internal systems, or data-decision codes.

Use plain trading-journal language. Keep nextPeriodFocuses process-oriented and limited to three. If coverage limits any conclusion, state the exact limitation in incompleteRecord; otherwise set incompleteRecord to null.`;

export type CoachMonthlyAiReviewProviderEnvelope = Readonly<{
  system: string;
  prompt: string;
  maximumOutputTokens: number;
  reservationText: string;
}>;

export function buildCoachMonthlyAiReviewProviderEnvelope(
  input: CoachMonthlyAiReviewInput,
): CoachMonthlyAiReviewProviderEnvelope {
  const prompt = JSON.stringify(input);
  return Object.freeze({
    system: SYSTEM_PROMPT,
    prompt,
    maximumOutputTokens: COACH_MONTHLY_AI_REVIEW_MAX_OUTPUT_TOKENS,
    reservationText: JSON.stringify({ system: SYSTEM_PROMPT, prompt }),
  });
}

export function buildCoachMonthlyAiReviewProviderEnvelopeV2(
  input: CoachMonthlyAiReviewInputV2,
): CoachMonthlyAiReviewProviderEnvelope {
  const prompt = JSON.stringify(input);
  return Object.freeze({
    system: MONTHLY_SYSTEM_PROMPT_V2,
    prompt,
    maximumOutputTokens: COACH_MONTHLY_AI_REVIEW_MAX_OUTPUT_TOKENS,
    reservationText: JSON.stringify({ system: MONTHLY_SYSTEM_PROMPT_V2, prompt }),
  });
}

function completeUsage(usage: Readonly<{
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
}>): CoachAiGenerationUsage {
  const values = [usage.inputTokens, usage.outputTokens, usage.totalTokens];
  if (!values.every((value) =>
    typeof value === "number" && Number.isSafeInteger(value) && value >= 0,
  )) {
    return Object.freeze({ inputTokens: null, outputTokens: null, totalTokens: null });
  }
  return Object.freeze({
    inputTokens: usage.inputTokens as number,
    outputTokens: usage.outputTokens as number,
    totalTokens: usage.totalTokens as number,
  });
}

function localOpenAiApiKey(environment: NodeJS.ProcessEnv): string {
  const value = environment.OPENAI_API_KEY?.trim();
  if (!value) throw new Error("TRADERLINK_COACH_OPENAI_UNAVAILABLE");
  return value;
}

export async function generateCoachMonthlyAiReview(
  input: CoachMonthlyAiReviewInput,
  options: Readonly<{
    modelId: string;
    environment?: NodeJS.ProcessEnv;
  }>,
): Promise<CoachMonthlyAiReviewGeneration> {
  const openai = createOpenAI({ apiKey: localOpenAiApiKey(options.environment ?? process.env) });
  const envelope = buildCoachMonthlyAiReviewProviderEnvelope(input);
  const result = await generateText({
    model: openai(options.modelId),
    maxOutputTokens: envelope.maximumOutputTokens,
    output: Output.object({ schema: monthlyReviewSchema }),
    system: envelope.system,
    prompt: envelope.prompt,
  });
  if (!result.output) throw new Error("TRADERLINK_COACH_OPENAI_NO_OUTPUT");
  return Object.freeze({
    output: Object.freeze({
      contractVersion: COACH_MONTHLY_AI_OUTPUT_CONTRACT_VERSION,
      ...result.output,
      nextMonthFocuses: Object.freeze([...result.output.nextMonthFocuses]),
    }),
    usage: completeUsage(result.usage),
  });
}

export async function generateCoachMonthlyAiReviewV2(
  input: CoachMonthlyAiReviewInputV2,
  options: Readonly<{
    modelId: string;
    environment?: NodeJS.ProcessEnv;
  }>,
): Promise<Readonly<{
  output: CoachMonthlyAiReviewOutputV2;
  usage: CoachAiGenerationUsage;
}>> {
  const openai = createOpenAI({ apiKey: localOpenAiApiKey(options.environment ?? process.env) });
  const envelope = buildCoachMonthlyAiReviewProviderEnvelopeV2(input);
  const result = await generateText({
    model: openai(options.modelId),
    maxOutputTokens: envelope.maximumOutputTokens,
    output: Output.object({ schema: monthlyReviewSchemaV2 }),
    system: envelope.system,
    prompt: envelope.prompt,
  });
  if (!result.output) throw new Error("TRADERLINK_COACH_OPENAI_NO_OUTPUT");
  return Object.freeze({
    output: Object.freeze({
      contractVersion: COACH_MONTHLY_AI_REVIEW_OUTPUT_CONTRACT_VERSION_V2,
      ...result.output,
      nextPeriodFocuses: Object.freeze([...result.output.nextPeriodFocuses]),
    }),
    usage: completeUsage(result.usage),
  });
}
