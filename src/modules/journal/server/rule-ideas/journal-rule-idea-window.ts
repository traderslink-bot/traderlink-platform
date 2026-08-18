import type { JournalTradingDayReadModel } from "@/src/modules/journal-analytics/contracts/journal-dashboard-read-models";
import type { JournalRuleIdeaEvidence } from "@/src/modules/journal/contracts/journal-rule-idea-contracts";

import { detectJournalRuleIdeas } from "./journal-rule-idea-detector";

function dayTradeCount(model: JournalTradingDayReadModel, swings: ReadonlySet<string>): number {
  return model.tickers.flatMap((ticker) => ticker.roundTrips).filter((trade) =>
    !swings.has(trade.roundTripId) && trade.entryAtUtc.slice(0, 10) <= model.date && trade.exitAtUtc.slice(0, 10) >= model.date,
  ).length;
}

function initialWindowStart(models: readonly JournalTradingDayReadModel[], swings: ReadonlySet<string>): number {
  if (models.length === 0) return 0;
  const latest = Date.parse(`${models.at(-1)!.date}T00:00:00.000Z`);
  let first = models.findIndex((model) => latest - Date.parse(`${model.date}T00:00:00.000Z`) <= 13 * 86_400_000);
  if (first < 0) first = models.length - 1;
  while (first > 0) {
    const selected = models.slice(first);
    const days = selected.filter((model) => dayTradeCount(model, swings) > 0).length;
    const trades = selected.reduce((count, model) => count + dayTradeCount(model, swings), 0);
    const executions = new Set(selected.flatMap((model) => model.executionActivity
      .filter((execution) => !execution.needsDecision && execution.projectionStates.includes("ready_closed"))
      .map((execution) => execution.executionVersionId))).size;
    if (days >= 3 && trades >= 20 && executions >= 50) break;
    first -= 1;
  }
  return first;
}

export function detectJournalRuleIdeasInRepresentativeWindow(input: Readonly<{
  models: readonly JournalTradingDayReadModel[];
  swingRoundTripIds: ReadonlySet<string>;
  activeTemplateIds?: ReadonlySet<string>;
  asOfUtc: string;
}>): readonly JournalRuleIdeaEvidence[] {
  const models = [...input.models]
    .filter((model) => model.currency !== null)
    .sort((left, right) => left.date.localeCompare(right.date));
  let first = initialWindowStart(models, input.swingRoundTripIds);
  while (true) {
    const evidence = detectJournalRuleIdeas({ ...input, models: models.slice(first) });
    if (evidence.length > 0 || first === 0) return evidence;
    first = Math.max(0, first - 14);
  }
}
