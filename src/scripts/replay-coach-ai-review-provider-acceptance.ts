import { readFileSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";

import { loadEnvConfig } from "@next/env";
import Decimal from "decimal.js";

import type { CoachMonthlyAiReviewInputV2 } from
  "@/src/modules/coach/contracts/monthly-ai-review-input-contracts";
import type { CoachPeriodicAiReviewInputV2 } from
  "@/src/modules/coach/contracts/weekly-ai-review-input-contracts";
import { generateCoachMonthlyAiReviewV2 } from
  "@/src/modules/coach/server/coach-monthly-ai-review-openai-adapter";
import { generateCoachPeriodicAiReviewV2 } from
  "@/src/modules/coach/server/coach-weekly-ai-review-openai-adapter";

const CONFIRMATION = "--confirm-frozen-fixture-provider-calls";
const DEFAULT_SOURCE =
  ".local-logs/ai-review-provider-acceptance-2026-08-09T05-19-35.021Z.json";
const MODEL_PRICES = Object.freeze({
  "gpt-5.6-sol": Object.freeze({ cachedInput: "0.50", cacheWriteInput: "6.25", input: "5.00", output: "30.00" }),
  "gpt-5.6-terra": Object.freeze({ cachedInput: "0.25", cacheWriteInput: "3.125", input: "2.50", output: "15.00" }),
  "gpt-5.6-luna": Object.freeze({ cachedInput: "0.10", cacheWriteInput: "1.25", input: "1.00", output: "6.00" }),
});

type ModelId = keyof typeof MODEL_PRICES;
type FrozenScenario = Readonly<{
  label: string;
  kind: "weekly" | "two_week" | "monthly";
  input: CoachPeriodicAiReviewInputV2 | CoachMonthlyAiReviewInputV2;
}>;

function argumentValue(arguments_: readonly string[], prefix: string): string | undefined {
  return arguments_.find((argument) => argument.startsWith(prefix))?.slice(prefix.length);
}

function estimatedCost(
  modelId: ModelId,
  usage: Readonly<{
    cachedInputTokens?: number | null;
    cacheWriteInputTokens?: number | null;
    inputTokens: number | null;
    outputTokens: number | null;
  }>,
): string | null {
  const cachedInputTokens = usage.cachedInputTokens;
  const cacheWriteInputTokens = usage.cacheWriteInputTokens;
  if (cachedInputTokens === null || cachedInputTokens === undefined ||
      cacheWriteInputTokens === null || cacheWriteInputTokens === undefined ||
      usage.inputTokens === null || usage.outputTokens === null ||
      cachedInputTokens + cacheWriteInputTokens > usage.inputTokens) return null;
  const prices = MODEL_PRICES[modelId];
  return new Decimal(usage.inputTokens - cachedInputTokens - cacheWriteInputTokens)
    .mul(prices.input)
    .plus(new Decimal(cachedInputTokens).mul(prices.cachedInput))
    .plus(new Decimal(cacheWriteInputTokens).mul(prices.cacheWriteInput))
    .plus(new Decimal(usage.outputTokens).mul(prices.output))
    .div(1_000_000).toDecimalPlaces(8).toFixed(8);
}

async function main(): Promise<void> {
  const arguments_ = process.argv.slice(2);
  if (arguments_[0] !== CONFIRMATION) {
    throw new Error("ai_review_provider_replay_confirmation_required");
  }
  const modelValue = argumentValue(arguments_, "--model=") ?? "gpt-5.6-luna";
  if (!(modelValue in MODEL_PRICES)) {
    throw new Error("ai_review_provider_replay_model_not_allowed");
  }
  const modelId = modelValue as ModelId;
  const source = argumentValue(arguments_, "--source=") ?? DEFAULT_SOURCE;
  const requestedLabel = argumentValue(arguments_, "--label=");
  loadEnvConfig(process.cwd(), true);
  const frozen = JSON.parse(readFileSync(join(process.cwd(), source), "utf8")) as {
    fixtureOnly?: boolean;
    scenarios?: FrozenScenario[];
  };
  if (frozen.fixtureOnly !== true || !Array.isArray(frozen.scenarios) ||
    frozen.scenarios.length === 0) {
    throw new Error("ai_review_provider_replay_fixture_required");
  }

  const selectedScenarios = requestedLabel
    ? frozen.scenarios.filter((scenario) => scenario.label === requestedLabel)
    : frozen.scenarios;
  if (selectedScenarios.length === 0) {
    throw new Error("ai_review_provider_replay_scenario_not_found");
  }

  const results = [];
  for (const scenario of selectedScenarios) {
    if (!scenario.label || !scenario.input ||
      !["weekly", "two_week", "monthly"].includes(scenario.kind)) {
      throw new Error("ai_review_provider_replay_scenario_invalid");
    }
    process.stdout.write(`${JSON.stringify({
      status: "calling_provider",
      modelId,
      label: scenario.label,
    })}\n`);
    try {
      const generation = scenario.kind === "monthly"
        ? await generateCoachMonthlyAiReviewV2(
          scenario.input as CoachMonthlyAiReviewInputV2,
          { modelId },
        )
        : await generateCoachPeriodicAiReviewV2(
          scenario.input as CoachPeriodicAiReviewInputV2,
          { modelId },
        );
      results.push(Object.freeze({
        label: scenario.label,
        state: "generated" as const,
        output: generation.output,
        usage: generation.usage,
        estimatedCostUsd: estimatedCost(modelId, generation.usage),
      }));
    } catch (error) {
      const usage = error && typeof error === "object" && "usage" in error
        ? error.usage as Readonly<{
          cachedInputTokens?: number | null;
          cacheWriteInputTokens?: number | null;
          inputTokens: number | null;
          outputTokens: number | null;
          totalTokens: number | null;
        }>
        : null;
      results.push(Object.freeze({
        label: scenario.label,
        state: "rejected" as const,
        code: error instanceof Error ? error.message : "unknown_failure",
        usage,
        estimatedCostUsd: usage ? estimatedCost(modelId, usage) : null,
      }));
    }
  }

  const completedAtUtc = new Date().toISOString();
  const artifactName = `ai-review-provider-replay-${modelId}-${completedAtUtc
    .replaceAll(":", "-")}.json`;
  writeFileSync(join(process.cwd(), ".local-logs", artifactName), `${JSON.stringify({
    contractVersion: "traderlink_ai_review_provider_replay_v1",
    completedAtUtc,
    sourceArtifact: basename(source),
    fixtureOnly: true,
    persistedReviewCount: 0,
    modelId,
    results,
  }, null, 2)}\n`, { encoding: "utf8", flag: "wx" });

  const totalCost = results.reduce((sum, result) =>
    result.estimatedCostUsd !== null
      ? sum.plus(result.estimatedCostUsd)
      : sum, new Decimal(0)).toFixed(8);
  process.stdout.write(`${JSON.stringify({
    status: results.every((result) => result.state === "generated")
      ? "provider_boundary_passed"
      : "provider_boundary_rejected_output",
    modelId,
    providerCallCount: results.length,
    persistedReviewCount: 0,
    estimatedTotalCostUsd: totalCost,
    artifactName,
    results: results.map((result) => result.state === "generated"
      ? Object.freeze({
        label: result.label,
        state: result.state,
        usage: result.usage,
        estimatedCostUsd: result.estimatedCostUsd,
      })
      : result),
  })}\n`);
}

void main().catch((error: unknown) => {
  process.stderr.write(`${JSON.stringify({
    status: "failed",
    code: error instanceof Error ? error.message : "unknown_failure",
  })}\n`);
  process.exitCode = 1;
});
