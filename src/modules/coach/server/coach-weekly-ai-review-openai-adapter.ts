import { createOpenAI } from "@ai-sdk/openai";
import { generateText, Output } from "ai";
import { z } from "zod";

import {
  COACH_WEEKLY_AI_OUTPUT_CONTRACT_VERSION,
  type CoachWeeklyAiReviewOutput,
} from "../contracts/weekly-ai-review-output-contracts";
import type { CoachWeeklyAiReviewInput } from "../contracts/weekly-ai-review-input-contracts";
import type { CoachAiGenerationUsage } from "./coach-ai-review-repository";

export const LOCAL_COACH_WEEKLY_AI_MODEL = "gpt-5.6-sol" as const;
export const COACH_WEEKLY_AI_REVIEW_MAX_OUTPUT_TOKENS = 4_096;

export type CoachWeeklyAiReviewGeneration = Readonly<{
  output: CoachWeeklyAiReviewOutput;
  usage: CoachAiGenerationUsage;
}>;

const weeklyReviewSchema = z.object({
  weeklyReview: z.string().min(1).max(1_800),
  whatImproved: z.string().min(1).max(1_500),
  whatHeldYouBack: z.string().min(1).max(1_500),
  focusFollowThrough: z.string().min(1).max(1_500),
  nextWeekFocuses: z.array(z.string().min(1).max(280)).min(1).max(3),
  incompleteRecord: z.string().min(1).max(1_000).nullable(),
});

const SYSTEM_PROMPT = `You are TraderLink's weekly trading-journal reviewer. Write a direct, useful review only from the supplied weekly Journal package.

Be specific where the supplied notes, rule outcomes, focuses, or trade facts support a point. Be respectful but do not soften a supported criticism. Do not invent a setup, motive, market condition, rule outcome, missing fact, or trade result.

Do not provide trade recommendations, price targets, position-size advice, entry or exit instructions, diagnoses, certainty claims, or language that treats profit as proof of good process or a loss as proof of bad process. Do not mention the provider, AI, prompts, tokens, databases, internal systems, or data-decision codes.

Use plain trading-journal language. Keep the next focuses process-oriented and limited to three. If the supplied record is incomplete, say exactly what limits the conclusion in incompleteRecord; otherwise set incompleteRecord to null.`;

export type CoachWeeklyAiReviewProviderEnvelope = Readonly<{
  system: string;
  prompt: string;
  maximumOutputTokens: number;
  reservationText: string;
}>;

export function buildCoachWeeklyAiReviewProviderEnvelope(
  input: CoachWeeklyAiReviewInput,
): CoachWeeklyAiReviewProviderEnvelope {
  const prompt = JSON.stringify(input);
  return Object.freeze({
    system: SYSTEM_PROMPT,
    prompt,
    maximumOutputTokens: COACH_WEEKLY_AI_REVIEW_MAX_OUTPUT_TOKENS,
    reservationText: JSON.stringify({ system: SYSTEM_PROMPT, prompt }),
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

export async function generateCoachWeeklyAiReview(
  input: CoachWeeklyAiReviewInput,
  options: Readonly<{
    modelId: string;
    environment?: NodeJS.ProcessEnv;
  }>,
): Promise<CoachWeeklyAiReviewGeneration> {
  const openai = createOpenAI({ apiKey: localOpenAiApiKey(options.environment ?? process.env) });
  const envelope = buildCoachWeeklyAiReviewProviderEnvelope(input);
  const result = await generateText({
    model: openai(options.modelId),
    maxOutputTokens: envelope.maximumOutputTokens,
    output: Output.object({ schema: weeklyReviewSchema }),
    system: envelope.system,
    prompt: envelope.prompt,
  });
  if (!result.output) throw new Error("TRADERLINK_COACH_OPENAI_NO_OUTPUT");
  return Object.freeze({
    output: Object.freeze({
      contractVersion: COACH_WEEKLY_AI_OUTPUT_CONTRACT_VERSION,
      ...result.output,
      nextWeekFocuses: Object.freeze([...result.output.nextWeekFocuses]),
    }),
    usage: completeUsage(result.usage),
  });
}

export async function generateLocalCoachWeeklyAiReview(
  input: CoachWeeklyAiReviewInput,
  environment: NodeJS.ProcessEnv = process.env,
): Promise<CoachWeeklyAiReviewOutput> {
  return (await generateCoachWeeklyAiReview(input, {
    modelId: LOCAL_COACH_WEEKLY_AI_MODEL,
    environment,
  })).output;
}
