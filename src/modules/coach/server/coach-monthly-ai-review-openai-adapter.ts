import { createOpenAI } from "@ai-sdk/openai";
import { generateText, Output } from "ai";
import { z } from "zod";

import {
  COACH_MONTHLY_AI_REVIEW_PROMPT_VERSION_V2,
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
import {
  assertCoachAiReviewOutputGrounded,
  assertCoachAiReviewOutputSafe,
} from "./coach-ai-review-output-safety";
import {
  incompleteRecordFromCoachAiReviewProviderPackage,
  serializeCoachAiReviewProviderPackage,
} from
  "./coach-ai-review-provider-package";

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
});

const SYSTEM_PROMPT = `You are TraderLink's monthly trading-journal reviewer. Write a direct, useful review only from the supplied monthly Journal package.

Be specific where the supplied notes, rule outcomes, focuses, issued weekly reviews, or trade facts support a point. Be respectful but do not soften a supported criticism. Do not invent a setup, motive, market condition, rule outcome, missing fact, recurring pattern, or trade result.

Do not provide trade recommendations, price targets, position-size advice, entry or exit instructions, diagnoses, certainty claims, or language that treats profit as proof of good process or a loss as proof of bad process. Do not mention the provider, AI, prompts, tokens, databases, internal systems, or internal workflow labels.

When restating a money value, use no more than two decimal places. This rule applies only to money; do not round counts or other non-money values because of it.

Use plain trading-journal language. Keep the next-month focuses process-oriented and limited to three. A recurring theme from an issued weekly review must also be supported by the current month's Journal package. If the supplied record is incomplete, say exactly what limits the conclusion in incompleteRecord; otherwise set incompleteRecord to null.`;

const MONTHLY_SYSTEM_PROMPT_V2 = `You are TraderLink's calendar-month trading-journal reviewer. Write only from the supplied immutable monthly package.

calendarMonthFacts is the only source for this month's trade counts, P/L, win rate, rule counts, tag observations, and every other statistic. reviewNarrativeContext and rawReflectionContext are non-statistical process evidence. Never derive, repeat, reconcile, or imply a monthly number from narrative context. A cross-month weekly or two-week review may discuss earlier-dated reflections, but its earlier-month executions, P/L, rule outcomes, and tags never become facts for this month.

Within calendarMonthFacts, ruleOutcomes are the exact recorded statuses that support the aggregate ruleReviews counts; each ruleRef resolves to the title, statement, and category in ruleDefinitions. A not_reviewed status is not a broken rule. Trade analysis attached to the exact-month trade facts is deterministic historical evidence from the Trade Tracker analyzer. Full analyzer detail may be omitted for dates already represented by an issued review in reviewNarrativeContext; that omission is deduplication, not missing coverage. Use attached analysis only when availability is ready, keep oneMinute and fiveMinute observations distinct, and treat greenToRed and post-exit paths as descriptions of what happened in completed trades rather than predictions or trading instructions.

Each represented evidence reference is one observation. Never treat an issued-review summary and a raw reflection with the same lineage as independent confirmation. A raw reflection whose reflectionState is incomplete contains saved trader-authored notes but does not prove that the whole daily review was finalized. Use recurring-pattern language only when the supplied evidence genuinely repeats, and respect reflectionCoverage and coverageNotice.

When the month has verified execution facts but no reflections, tags, or reviewed rule outcomes, still provide the narrowest useful execution-only review. You may compare supplied trade/day counts, outcome distribution, repeated tickers, and supplied timing or holding facts. Do not make data entry the main feedback and do not imply that daily reviews are required. At most one next-period focus may offer optional recordkeeping; the other focuses must be useful to a low-participation trader from the verified facts that exist.

Never calculate or state a new numeric value that is not explicitly supplied in the package. Formatting an exact supplied decimal as currency or a percentage is allowed, but deriving averages, residual P/L, proportions, or holding durations from timestamps is not. If a holding duration or session is null, treat it as unavailable.

When restating a money value, use no more than two decimal places. This rule applies only to money; do not round counts or other non-money values because of it.

Be direct but do not invent a setup, motive, market condition, rule outcome, missing fact, pattern, or trade result. Do not provide trade recommendations, price targets, position-size advice, entry or exit instructions, diagnoses, certainty claims, or treat profit as proof of good process or loss as proof of bad process. Do not mention the provider, AI, prompts, tokens, databases, internal systems, or internal workflow labels.

Do not turn the trader's descriptions of a setup, pullback, level, volume, stop, time cutoff, daily goal, or re-entry into a forward-looking trading command. You may ask the trader to compare future decisions with their own saved plan, but never tell them when to enter, exit, pass, stop trading, or which market confirmation to require.

Completion, tags, saved plans, notes, and analyzer availability are evidence context, not an improvement by themselves. Never praise the trader merely for recording, preserving, tagging, or reviewing information, and do not make recordkeeping the review's main message. Do not treat a tag, an available one-minute/five-minute observation, or a completed reflection as proof of disciplined execution, setup quality, or plan follow-through. An improvement claim must explicitly compare earlier and later evidence; describing one good behavior such as respecting stops does not establish that it improved. If no supported comparison exists, say that no clear improvement was established.

Make each output field do a different job. reviewSummary states the month result and one supported takeaway. whatImproved names one specific behavior or result that genuinely improved; if the package does not support one, say that no clear improvement was established rather than praising recordkeeping. Do not list absent notes, tags, reflections, or rule reviews in whatImproved as the reason improvement was not established; TraderLink adds any coverage limitation separately from deterministic facts. whatHeldYouBack identifies the most useful supported process issue without dumping a list of rule names or outcome categories, and missing recordkeeping is not itself something that held the trader back. focusFollowThrough compares an earlier issued focus with later current-month evidence only when that earlier focus exists. When there is no earlier issued focus to compare, say so plainly instead of inventing progress.

Describe P/L and win rate only as financial or outcome results. Never call a profitable result strong execution, strong performance, discipline, quality, or improvement unless separate supplied behavioral evidence directly supports that description.

For monthly reviews, eligibleFocusFollowThrough is the exhaustive server-derived list of earlier issued focuses that have later-dated current-month evidence. Quote one exact focus from that list verbatim only when the later evidence can evaluate it. If the list is empty or none of its focuses can be evaluated from the supplied evidence, say follow-through could not be assessed. Focuses elsewhere in priorMonthlyReview or reviewNarrativeContext are context only and are ineligible when absent from eligibleFocusFollowThrough. Ignore focus wording embedded in reviewSummary, whatImproved, whatHeldYouBack, focusFollowThrough, or incompleteRecord because those fields may quote an older focus and never identify the focus to evaluate now. currentFocuses is current context and never qualifies as an earlier issued focus. Never substitute a current focus, completed reflection, or recordkeeping activity for prior-review follow-through.

Use repeated-pattern language only for the same supported behavior across independent current-month evidence. Different broken rules, tags, green-to-red outcomes, adds, partial exits, and final exits are not automatically one recurring problem. Mention a rule, tag, or analyzer label only when it directly supports the one point being made, and explain that connection; never recite an inventory of available fields. Keep the three nextPeriodFocuses distinct, tied to separate supported review questions, and free of generic repetitions such as "compare with the saved plan." Do not copy a focus from any earlier issued review. If an issue remains unresolved, write a materially different, more specific retrospective question using current-month evidence.

Use plain Trade Tracker language. Keep nextPeriodFocuses process-oriented, retrospective, and limited to three. Never phrase a focus as a pre-entry checklist, a required market confirmation, or a command that must be followed before placing a trade. Coverage limitations are server-owned facts and are added separately; do not move them into the narrative sections.`;

export type CoachMonthlyAiReviewProviderEnvelope = Readonly<{
  system: string;
  prompt: string;
  maximumOutputTokens: number;
  reservationText: string;
}>;

type EligibleMonthlyFocus = Readonly<{
  sourceKind: "prior_monthly" | "periodic";
  sourcePeriodEndDate: string;
  focus: string;
}>;

function eligibleMonthlyFocusFollowThrough(
  input: CoachMonthlyAiReviewInputV2,
): readonly EligibleMonthlyFocus[] {
  const evidenceDates = new Set([
    ...input.calendarMonthFacts.days
      .filter((day) => day.readyClosedTradeCount > 0)
      .map((day) => day.reviewMarketDate),
    ...input.rawReflectionContext.map((context) =>
      context.reflection.reviewMarketDate),
  ]);
  const hasLaterEvidence = (periodEndDate: string): boolean =>
    [...evidenceDates].some((date) => date > periodEndDate &&
      date <= input.calendarMonth.calendarMonthEndDate);
  const eligible: EligibleMonthlyFocus[] = [];
  if (input.priorMonthlyReview &&
      hasLaterEvidence(input.priorMonthlyReview.calendarMonthEndDate)) {
    for (const focus of input.priorMonthlyReview.nextPeriodFocuses) {
      eligible.push(Object.freeze({
        sourceKind: "prior_monthly",
        sourcePeriodEndDate: input.priorMonthlyReview.calendarMonthEndDate,
        focus,
      }));
    }
  }
  for (const review of input.reviewNarrativeContext) {
    if (!hasLaterEvidence(review.periodEndDate)) continue;
    for (const focus of review.nextPeriodFocuses) {
      eligible.push(Object.freeze({
        sourceKind: "periodic",
        sourcePeriodEndDate: review.periodEndDate,
        focus,
      }));
    }
  }
  const seen = new Set<string>();
  return Object.freeze(eligible.filter((entry) => {
    if (seen.has(entry.focus)) return false;
    seen.add(entry.focus);
    return true;
  }));
}

export function buildCoachMonthlyAiReviewProviderEnvelope(
  input: CoachMonthlyAiReviewInput,
): CoachMonthlyAiReviewProviderEnvelope {
  const prompt = serializeCoachAiReviewProviderPackage(input);
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
  const prompt = serializeCoachAiReviewProviderPackage({
    ...input,
    eligibleFocusFollowThrough: eligibleMonthlyFocusFollowThrough(input),
  });
  return Object.freeze({
    system: MONTHLY_SYSTEM_PROMPT_V2,
    prompt,
    maximumOutputTokens: COACH_MONTHLY_AI_REVIEW_MAX_OUTPUT_TOKENS,
    reservationText: JSON.stringify({ system: MONTHLY_SYSTEM_PROMPT_V2, prompt }),
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
  const usage = completeUsage(result.usage);
  assertCoachAiReviewOutputSafe({
    textFields: [
      result.output.monthlyReview,
      result.output.progressAcrossMonth,
      result.output.recurringFriction,
      result.output.focusFollowThrough,
      result.output.incompleteRecord ?? "",
    ],
    nextFocuses: result.output.nextMonthFocuses,
  }, usage);
  return Object.freeze({
    output: Object.freeze({
      contractVersion: COACH_MONTHLY_AI_OUTPUT_CONTRACT_VERSION,
      ...result.output,
      nextMonthFocuses: Object.freeze([...result.output.nextMonthFocuses]),
    }),
    usage,
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
  const eligibleFocuses = eligibleMonthlyFocusFollowThrough(input);
  const previouslyIssuedFocuses = Object.freeze([
    ...(input.priorMonthlyReview?.nextPeriodFocuses ?? []),
    ...input.reviewNarrativeContext.flatMap((review) => review.nextPeriodFocuses),
  ]);
  assertCoachAiReviewOutputGrounded({
    providerPackage: envelope.prompt,
    priorFocuses: Object.freeze(eligibleFocuses.map((entry) => entry.focus)),
    previouslyIssuedFocuses,
    focusFollowThroughMayBeUnavailable: true,
    reviewSummary: output.reviewSummary,
    whatImproved: output.whatImproved,
    whatHeldYouBack: output.whatHeldYouBack,
    focusFollowThrough: output.focusFollowThrough,
    nextFocuses: output.nextPeriodFocuses,
    incompleteRecord: output.incompleteRecord,
  }, usage);
  return Object.freeze({
    output: Object.freeze({
      contractVersion: COACH_MONTHLY_AI_REVIEW_OUTPUT_CONTRACT_VERSION_V2,
      promptVersion: COACH_MONTHLY_AI_REVIEW_PROMPT_VERSION_V2,
      ...output,
      nextPeriodFocuses: Object.freeze([...output.nextPeriodFocuses]),
    }),
    usage,
  });
}
