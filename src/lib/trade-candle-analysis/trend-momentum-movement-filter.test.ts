import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { filterSavedTradeMovement, readMovementFilters } from "./trend-momentum-movement-filter";
import { MovementIndicatorFilters } from "../../../app/(dashboard)/analytics/trend-momentum-movement-filters";

type Input = Parameters<typeof filterSavedTradeMovement>[0];
const row = (id: string, context: unknown) => ({ roundTripId: id, executionSequence: 1, direction: "long", eventKind: "Entry",
  favorableMoveDecimal: "2", adverseMoveDecimal: "1", favorableMovePercent: 20, adverseMovePercent: 10, indicatorFilterContext: context });
const context = { calculationVersion: "trade_indicator_context_v1", oneMinute: { observedAt: 1, alignment: "above", rsiBand: "above_70" }, fiveMinute: { observedAt: 1, alignment: "below", rsiBand: "below_30" } };
const rows = [row("match", context), row("unknown", null), row("outside", { ...context, oneMinute: context.fiveMinute })] as unknown as Input["excursions"];
const input: Input = { excursions: rows, eventPaths: rows.flatMap((row) => [5, 15, 30, 60].map((minutesAfterEvent) => ({ ...row, eventSequence: 1, minutesAfterEvent }))) as unknown as Input["eventPaths"] };

test("movement filters share one execution population across summaries and timed paths", () => {
  const result = filterSavedTradeMovement(input, readMovementFilters(new URLSearchParams("movement_alignment=above&movement_rsi=above_70")));
  assert.deepEqual(result.excursions.map((row) => row.roundTripId), ["match"]);
  assert.equal(result.eventPaths.length, 4);
  assert.equal(result.entryOpportunityRisk.measuredExecutionCount, 1);
  assert.deepEqual(result.coverage.long, { matched: 1, notMatched: 1, unavailable: 1 });
});

test("default and invalid query values preserve observations; timeframe never substitutes", () => {
  const all = filterSavedTradeMovement(input, readMovementFilters(new URLSearchParams("movement_alignment=invalid&movement_rsi=invalid")));
  assert.equal(all.excursions.length, 3);
  assert.equal(all.coverage.long.matched, 3);
  const five = filterSavedTradeMovement(input, readMovementFilters(new URLSearchParams("movement_interval=5m&movement_alignment=above")));
  assert.equal(five.excursions.length, 0);
  assert.equal(five.coverage.long.unavailable, 1);
});

test("filter controls name the indicator timeframe and explain their complete page effect", () => {
  const html = renderToStaticMarkup(createElement(MovementIndicatorFilters, { queryString: "", onChange: () => {}, coverage: { matched: 1, notMatched: 2, unavailable: 3 } }));
  for (const copy of ["Indicator timeframe", "EMA alignment", "RSI range", "movement cards and both tables", "does not mean price must reverse"]) assert.ok(html.includes(copy), copy);
  const patternHtml = renderToStaticMarkup(createElement(MovementIndicatorFilters, { mode: "patterns", queryString: "", onChange: () => {}, coverage: { matched: 1, notMatched: 2, unavailable: 3 } }));
  assert.ok(patternHtml.includes("pattern summaries and their evidence rows"));
  assert.ok(patternHtml.includes("pattern timeframe stays unchanged"));
  assert.ok(!patternHtml.includes("movement cards and both tables"));
});
