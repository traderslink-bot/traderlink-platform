import assert from "node:assert/strict";
import { test } from "vitest";
import { matchesExecutionIndicatorFilter, readExecutionIndicatorFilterContext, saveExecutionIndicatorFilterContext } from "./trend-momentum-execution-filter";

const event = { eventId: "private-execution", executedAtUtc: "2026-09-11T14:00:30.000Z" };
const at = Date.parse(event.executedAtUtc) / 1000;
const source = { ...event, oneMinute: { observedAt: at - 30, alignment: "above", rsiBand: "above_70" },
  fiveMinute: { observedAt: at - 30, alignment: "below", rsiBand: "below_30" } } as Parameters<typeof saveExecutionIndicatorFilterContext>[0];

test("saved filter context is bound to the exact execution and drops identifying metadata when read", () => {
  const saved = saveExecutionIndicatorFilterContext(source);
  const context = readExecutionIndicatorFilterContext(saved, event)!;
  assert.equal(context.oneMinute!.alignment, "above");
  assert.equal(context.fiveMinute!.alignment, "below");
  assert.ok(!JSON.stringify(context).includes(event.eventId));
  assert.equal(readExecutionIndicatorFilterContext(saved, { ...event, eventId: "other" }), null);
  assert.equal(readExecutionIndicatorFilterContext(saved, { ...event, executedAtUtc: "2026-09-11T14:01:30.000Z" }), null);
  assert.equal(readExecutionIndicatorFilterContext({ ...saved, calculationVersion: "older" }, event), null);
});

test("malformed or future optional frames do not invalidate the other frame", () => {
  const saved = saveExecutionIndicatorFilterContext(source);
  const future = readExecutionIndicatorFilterContext({ ...saved, oneMinute: { ...saved.oneMinute, observedAt: at + 1 } }, event)!;
  assert.equal(future.oneMinute, null);
  assert.equal(future.fiveMinute!.alignment, "below");
  const invalid = readExecutionIndicatorFilterContext({ ...saved, oneMinute: { observedAt: at - 30, alignment: "invented", rsiBand: "above_70" } }, event)!;
  assert.equal(invalid.oneMinute!.alignment, null);
  assert.equal(invalid.oneMinute!.rsiBand, "above_70");
});

test("filters preserve default rows and require matching same-frame evidence", () => {
  const context = readExecutionIndicatorFilterContext(saveExecutionIndicatorFilterContext(source), event)!;
  assert.equal(matchesExecutionIndicatorFilter(null, { interval: "1m", alignment: "any", rsiBand: "any" }), true);
  assert.equal(matchesExecutionIndicatorFilter(null, { interval: "1m", alignment: "above", rsiBand: "any" }), null);
  assert.equal(matchesExecutionIndicatorFilter(context, { interval: "1m", alignment: "above", rsiBand: "above_70" }), true);
  assert.equal(matchesExecutionIndicatorFilter(context, { interval: "5m", alignment: "above", rsiBand: "above_70" }), false);
  assert.equal(matchesExecutionIndicatorFilter(context, { interval: "1m", alignment: "above", rsiBand: "below_30" }), false);
});
