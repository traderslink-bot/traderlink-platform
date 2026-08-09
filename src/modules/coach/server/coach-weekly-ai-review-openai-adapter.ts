import { createOpenAI } from "@ai-sdk/openai";
import { generateText, Output } from "ai";
import { z } from "zod";

import {
  COACH_PERIODIC_AI_REVIEW_OUTPUT_CONTRACT_VERSION,
  COACH_WEEKLY_AI_OUTPUT_CONTRACT_VERSION,
  type CoachPeriodicAiReviewOutputV2,
  type CoachWeeklyAiReviewOutput,
} from "../contracts/weekly-ai-review-output-contracts";
import type {
  CoachPeriodicAiReviewInputV2,
  CoachWeeklyAiReviewInput,
} from "../contracts/weekly-ai-review-input-contracts";
import type { CoachAiGenerationUsage } from "./coach-ai-review-repository";
import { assertCoachAiReviewOutputSafe } from "./coach-ai-review-output-safety";
import { serializeCoachAiReviewProviderPackage } from
  "./coach-ai-review-provider-package";

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

const periodicReviewSchemaV2 = z.object({
  reviewSummary: z.string().min(1).max(1_800),
  whatImproved: z.string().min(1).max(1_500),
  whatHeldYouBack: z.string().min(1).max(1_500),
  focusFollowThrough: z.string().min(1).max(1_500),
  nextPeriodFocuses: z.array(z.string().min(1).max(280)).min(1).max(3),
  incompleteRecord: z.string().min(1).max(1_000).nullable(),
});

const SYSTEM_PROMPT = `You are TraderLink's weekly trading-journal reviewer. Write a direct, useful review only from the supplied weekly Journal package.

Be specific where the supplied notes, rule outcomes, focuses, or trade facts support a point. Be respectful but do not soften a supported criticism. Do not invent a setup, motive, market condition, rule outcome, missing fact, or trade result.

Do not provide trade recommendations, price targets, position-size advice, entry or exit instructions, diagnoses, certainty claims, or language that treats profit as proof of good process or a loss as proof of bad process. Do not mention the provider, AI, prompts, tokens, databases, internal systems, or internal workflow labels.

Use plain trading-journal language. Keep the next focuses process-oriented and limited to three. If the supplied record is incomplete, say exactly what limits the conclusion in incompleteRecord; otherwise set incompleteRecord to null.`;

const PERIODIC_SYSTEM_PROMPT_V2 = `You are TraderLink's end-of-trading-period journal reviewer. The supplied package is either one complete Monday-through-Friday market-calendar cohort or two consecutive cohorts.

Use reviewPeriodMarketFacts as the only source for current-period trade counts, P/L, win rate, rule counts, tag observations, and other statistics. completedDailyReflections and savedDailyReflections are trader-authored process evidence only for the current period. A savedDailyReflection came from a Trade Tracker review that was not marked complete when the immutable snapshot was created; use its saved words as evidence, but do not imply that the trader finalized the whole daily review. carryForwardEvidenceBundles are dated historical process context: never move their executions, P/L, rule counts, or tags into the current period and never treat a carried reflection plus its prior-review reference as two observations. priorIssuedReview is continuity context, not current-period statistical evidence.

Within reviewPeriodMarketFacts, ruleOutcomes are the exact recorded statuses that support the aggregate ruleReviews counts; each ruleRef resolves to the title, statement, and category in ruleDefinitions. A not_reviewed status is not a broken rule. Trade analysis is deterministic historical evidence from the Trade Tracker analyzer. Use it only when availability is ready, keep oneMinute and fiveMinute observations distinct, and treat greenToRed and post-exit paths as descriptions of what happened in that completed trade rather than predictions or trading instructions.

Be direct and proportionate to coverage. One saved or completed reflection may support a narrow observation but not a recurring-pattern claim. Respect reflectionCoverage and coverageNotice. Never invent a setup, motive, market condition, rule outcome, missing fact, or trade result.

When the period has verified execution facts but no reflections, tags, or reviewed rule outcomes, still provide the narrowest useful execution-only review. You may compare supplied trade/day counts, outcome distribution, repeated tickers, and supplied timing or holding facts. Do not make data entry the main feedback and do not imply that daily reviews are required. At most one next-period focus may offer optional recordkeeping; the other focuses must be useful to a low-participation trader from the verified facts that exist.

Never calculate or state a new numeric value that is not explicitly supplied in the package. Formatting an exact supplied decimal as currency or a percentage is allowed, but deriving averages, residual P/L, proportions, or holding durations from timestamps is not. If a holding duration or session is null, treat it as unavailable.

Do not provide trade recommendations, price targets, position-size advice, entry or exit instructions, diagnoses, certainty claims, or treat profit as proof of good process or loss as proof of bad process. Do not mention the provider, AI, prompts, tokens, databases, internal systems, or internal workflow labels.

Do not turn the trader's descriptions of a setup, pullback, level, volume, stop, time cutoff, daily goal, or re-entry into a forward-looking trading command. You may ask the trader to compare future decisions with their own saved plan, but never tell them when to enter, exit, pass, stop trading, or which market confirmation to require.

Use plain Trade Tracker language. Keep nextPeriodFocuses process-oriented, retrospective, and limited to three. Never phrase a focus as a pre-entry checklist, a required market confirmation, or a command that must be followed before placing a trade. If coverage limits any conclusion, state the supplied public-language limitation in incompleteRecord; otherwise set incompleteRecord to null.`;

export type CoachWeeklyAiReviewProviderEnvelope = Readonly<{
  system: string;
  prompt: string;
  maximumOutputTokens: number;
  reservationText: string;
}>;

export function buildCoachWeeklyAiReviewProviderEnvelope(
  input: CoachWeeklyAiReviewInput,
): CoachWeeklyAiReviewProviderEnvelope {
  const prompt = serializeCoachAiReviewProviderPackage(input);
  return Object.freeze({
    system: SYSTEM_PROMPT,
    prompt,
    maximumOutputTokens: COACH_WEEKLY_AI_REVIEW_MAX_OUTPUT_TOKENS,
    reservationText: JSON.stringify({ system: SYSTEM_PROMPT, prompt }),
  });
}

export function buildCoachPeriodicAiReviewProviderEnvelopeV2(
  input: CoachPeriodicAiReviewInputV2,
): CoachWeeklyAiReviewProviderEnvelope {
  const prompt = serializeCoachAiReviewProviderPackage(input);
  return Object.freeze({
    system: PERIODIC_SYSTEM_PROMPT_V2,
    prompt,
    maximumOutputTokens: COACH_WEEKLY_AI_REVIEW_MAX_OUTPUT_TOKENS,
    reservationText: JSON.stringify({ system: PERIODIC_SYSTEM_PROMPT_V2, prompt }),
  });
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
  const usage = completeUsage(result.usage);
  assertCoachAiReviewOutputSafe({
    textFields: [
      result.output.weeklyReview,
      result.output.whatImproved,
      result.output.whatHeldYouBack,
      result.output.focusFollowThrough,
      result.output.incompleteRecord ?? "",
    ],
    nextFocuses: result.output.nextWeekFocuses,
  }, usage);
  return Object.freeze({
    output: Object.freeze({
      contractVersion: COACH_WEEKLY_AI_OUTPUT_CONTRACT_VERSION,
      ...result.output,
      nextWeekFocuses: Object.freeze([...result.output.nextWeekFocuses]),
    }),
    usage,
  });
}

export async function generateCoachPeriodicAiReviewV2(
  input: CoachPeriodicAiReviewInputV2,
  options: Readonly<{
    modelId: string;
    environment?: NodeJS.ProcessEnv;
  }>,
): Promise<Readonly<{
  output: CoachPeriodicAiReviewOutputV2;
  usage: CoachAiGenerationUsage;
}>> {
  const openai = createOpenAI({ apiKey: localOpenAiApiKey(options.environment ?? process.env) });
  const envelope = buildCoachPeriodicAiReviewProviderEnvelopeV2(input);
  const result = await generateText({
    model: openai(options.modelId),
    maxOutputTokens: envelope.maximumOutputTokens,
    output: Output.object({ schema: periodicReviewSchemaV2 }),
    system: envelope.system,
    prompt: envelope.prompt,
  });
  if (!result.output) throw new Error("TRADERLINK_COACH_OPENAI_NO_OUTPUT");
  const usage = completeUsage(result.usage);
  assertCoachAiReviewOutputSafe({
    textFields: [
      result.output.reviewSummary,
      result.output.whatImproved,
      result.output.whatHeldYouBack,
      result.output.focusFollowThrough,
      result.output.incompleteRecord ?? "",
    ],
    nextFocuses: result.output.nextPeriodFocuses,
  }, usage);
  return Object.freeze({
    output: Object.freeze({
      contractVersion: COACH_PERIODIC_AI_REVIEW_OUTPUT_CONTRACT_VERSION,
      ...result.output,
      nextPeriodFocuses: Object.freeze([...result.output.nextPeriodFocuses]),
    }),
    usage,
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
