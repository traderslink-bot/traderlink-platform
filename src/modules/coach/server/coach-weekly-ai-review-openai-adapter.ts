import { createOpenAI } from "@ai-sdk/openai";
import { generateText, Output } from "ai";
import { z } from "zod";

import {
  COACH_PERIODIC_AI_REVIEW_PROMPT_VERSION,
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
import {
  assertCoachAiReviewOutputGrounded,
  assertCoachAiReviewOutputSafe,
} from "./coach-ai-review-output-safety";
import {
  incompleteRecordFromCoachAiReviewProviderPackage,
  serializeCoachAiReviewProviderPackage,
} from
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
});

const SYSTEM_PROMPT = `You are TraderLink's weekly trading-journal reviewer. Write a direct, useful review only from the supplied weekly Journal package.

Be specific where the supplied notes, rule outcomes, focuses, or trade facts support a point. Be respectful but do not soften a supported criticism. Do not invent a setup, motive, market condition, rule outcome, missing fact, or trade result.

Do not provide trade recommendations, price targets, position-size advice, entry or exit instructions, diagnoses, certainty claims, or language that treats profit as proof of good process or a loss as proof of bad process. Do not mention the provider, AI, prompts, tokens, databases, internal systems, or internal workflow labels.

When restating a money value, use no more than two decimal places. This rule applies only to money; do not round counts or other non-money values because of it.

Use plain trading-journal language. Keep the next focuses process-oriented and limited to three. If the supplied record is incomplete, say exactly what limits the conclusion in incompleteRecord; otherwise set incompleteRecord to null.`;

const PERIODIC_SYSTEM_PROMPT_V2 = `You are TraderLink's end-of-trading-period journal reviewer. The supplied package is either one complete Monday-through-Friday market-calendar cohort or two consecutive cohorts.

Use reviewPeriodMarketFacts as the only source for current-period trade counts, P/L, win rate, rule counts, tag observations, and other statistics. completedDailyReflections and savedDailyReflections are trader-authored process evidence only for the current period. A savedDailyReflection came from a Trade Tracker review that was not marked complete when the immutable snapshot was created; use its saved words as evidence, but do not imply that the trader finalized the whole daily review. carryForwardEvidenceBundles are dated historical process context: never move their executions, P/L, rule counts, or tags into the current period and never treat a carried reflection plus its prior-review reference as two observations. priorIssuedReview is continuity context, not current-period statistical evidence.

Within reviewPeriodMarketFacts, ruleOutcomes are the exact recorded statuses that support the aggregate ruleReviews counts; each ruleRef resolves to the title, statement, and category in ruleDefinitions. A not_reviewed status is not a broken rule. Trade analysis is deterministic historical evidence from the Trade Tracker analyzer. Use it only when availability is ready, keep oneMinute and fiveMinute observations distinct, and treat greenToRed and post-exit paths as descriptions of what happened in that completed trade rather than predictions or trading instructions.

Be direct and proportionate to coverage. One saved or completed reflection may support a narrow observation but not a recurring-pattern claim. Respect reflectionCoverage and coverageNotice. Never invent a setup, motive, market condition, rule outcome, missing fact, or trade result.

When the period has verified execution facts but no reflections, tags, or reviewed rule outcomes, still provide the narrowest useful execution-only review. You may compare supplied trade/day counts, outcome distribution, repeated tickers, and supplied timing or holding facts. Do not make data entry the main feedback and do not imply that daily reviews are required. At most one next-period focus may offer optional recordkeeping; the other focuses must be useful to a low-participation trader from the verified facts that exist.

Never calculate or state a new numeric value that is not explicitly supplied in the package. Formatting an exact supplied decimal as currency or a percentage is allowed, but deriving averages, residual P/L, proportions, or holding durations from timestamps is not. If a holding duration or session is null, treat it as unavailable.

When restating a money value, use no more than two decimal places. This rule applies only to money; do not round counts or other non-money values because of it.

Do not provide trade recommendations, price targets, position-size advice, entry or exit instructions, diagnoses, certainty claims, or treat profit as proof of good process or loss as proof of bad process. Do not mention the provider, AI, prompts, tokens, databases, internal systems, or internal workflow labels.

Do not turn the trader's descriptions of a setup, pullback, level, volume, stop, time cutoff, daily goal, or re-entry into a forward-looking trading command. You may ask the trader to compare future decisions with their own saved plan, but never tell them when to enter, exit, pass, stop trading, or which market confirmation to require.

Completion, tags, saved plans, notes, and analyzer availability are evidence context, not an improvement by themselves. Never praise the trader merely for recording, preserving, tagging, or reviewing information, and do not make recordkeeping the review's main message. Do not treat a tag, an available one-minute/five-minute observation, or a completed reflection as proof of disciplined execution, setup quality, or plan follow-through. An improvement claim must explicitly compare earlier and later evidence; describing one good behavior such as respecting stops does not establish that it improved. If no supported comparison exists, say that no clear improvement was established.

Make each output field do a different job. reviewSummary states the period result and one supported takeaway. whatImproved names one specific behavior or result that genuinely improved; if the package does not support one, say that no clear improvement was established rather than praising recordkeeping. Do not list absent notes, tags, reflections, or rule reviews in whatImproved as the reason improvement was not established; TraderLink adds any coverage limitation separately from deterministic facts. whatHeldYouBack identifies the most useful supported process issue without dumping a list of rule names or outcome categories, and missing recordkeeping is not itself something that held the trader back. focusFollowThrough compares an earlier issued focus with later current-period evidence only when that earlier focus exists. When there is no earlier issued focus to compare, say so plainly instead of inventing progress.

Describe P/L and win rate only as financial or outcome results. Never call a profitable result strong execution, strong performance, discipline, quality, or improvement unless separate supplied behavioral evidence directly supports that description.

For weekly and two-week reviews, priorIssuedReview.nextPeriodFocuses is the only source of earlier issued focuses. If priorIssuedReview is null, say no earlier issued focus was available. If it is present, quote one exact item verbatim from priorIssuedReview.nextPeriodFocuses and compare it only with current-period evidence. Ignore every focus phrase embedded in priorIssuedReview.reviewSummary, whatImproved, whatHeldYouBack, focusFollowThrough, or incompleteRecord; those fields may quote an older focus and never identify the focus to evaluate now. currentFocuses is current context and never qualifies as an earlier issued focus. Never substitute a current focus, completed reflection, or recordkeeping activity for prior-review follow-through.

Use repeated-pattern language only for the same supported behavior across independent current-period evidence. Different broken rules, tags, green-to-red outcomes, adds, partial exits, and final exits are not automatically one recurring problem. Mention a rule, tag, or analyzer label only when it directly supports the one point being made, and explain that connection; never recite an inventory of available fields. Keep the three nextPeriodFocuses distinct, tied to separate supported review questions, and free of generic repetitions such as "compare with the saved plan." Do not copy a focus from the earlier issued review. If an earlier issue remains unresolved, write a materially different, more specific retrospective question using the current period's evidence.

Use plain Trade Tracker language. Keep nextPeriodFocuses process-oriented, retrospective, and limited to three. Never phrase a focus as a pre-entry checklist, a required market confirmation, or a command that must be followed before placing a trade. Coverage limitations are server-owned facts and are added separately; do not move them into the narrative sections.`;

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
  const output = Object.freeze({
    ...result.output,
    incompleteRecord: incompleteRecordFromCoachAiReviewProviderPackage(envelope.prompt),
  });
  assertCoachAiReviewOutputSafe({
    textFields: [
      output.reviewSummary,
      output.whatImproved,
      output.whatHeldYouBack,
      output.focusFollowThrough,
      output.incompleteRecord ?? "",
    ],
    nextFocuses: output.nextPeriodFocuses,
  }, usage);
  assertCoachAiReviewOutputGrounded({
    providerPackage: envelope.prompt,
    priorFocuses: input.priorIssuedReview?.nextPeriodFocuses ?? Object.freeze([]),
    previouslyIssuedFocuses:
      input.priorIssuedReview?.nextPeriodFocuses ?? Object.freeze([]),
    focusFollowThroughMayBeUnavailable: false,
    reviewSummary: output.reviewSummary,
    whatImproved: output.whatImproved,
    whatHeldYouBack: output.whatHeldYouBack,
    focusFollowThrough: output.focusFollowThrough,
    nextFocuses: output.nextPeriodFocuses,
    incompleteRecord: output.incompleteRecord,
  }, usage);
  return Object.freeze({
    output: Object.freeze({
      contractVersion: COACH_PERIODIC_AI_REVIEW_OUTPUT_CONTRACT_VERSION,
      promptVersion: COACH_PERIODIC_AI_REVIEW_PROMPT_VERSION,
      ...output,
      nextPeriodFocuses: Object.freeze([...output.nextPeriodFocuses]),
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
