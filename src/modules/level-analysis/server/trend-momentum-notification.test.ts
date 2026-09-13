import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import ts from "typescript";
import { logicalTradeFailureNotice } from "./logical-trade-analyzer-notification-service";
import { tradeAnalysisAvailabilityMessage } from "../../../lib/trade-candle-analysis/analysis-availability";

test("unavailable candle messages distinguish missing coverage from failed retrieval", () => {
  assert.match(logicalTradeFailureNotice("no_coverage").summary, /Not enough candle data/);
  assert.match(logicalTradeFailureNotice("no_coverage").summary, /can happen/);
  assert.match(logicalTradeFailureNotice("provider_unavailable").summary, /couldn't retrieve/);
  assert.doesNotMatch(logicalTradeFailureNotice().summary, /volume|execution details/);
  assert.equal(logicalTradeFailureNotice("no_coverage").summary, tradeAnalysisAvailabilityMessage("no_coverage"));
  assert.equal(logicalTradeFailureNotice().summary, tradeAnalysisAvailabilityMessage("provider_unavailable"));
  assert.match(tradeAnalysisAvailabilityMessage("pending"), /collecting/);
  assert.doesNotMatch(tradeAnalysisAvailabilityMessage("unknown"), /very little|volume/);
});

test("Analyzer notification service never modifies delivery preferences", () => {
  const source = ts.createSourceFile("notifications.ts", readFileSync("src/modules/level-analysis/server/logical-trade-analyzer-notification-service.ts", "utf8"), ts.ScriptTarget.Latest, true);
  const called = new Set<string>();
  const visit = (node: ts.Node) => {
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) called.add(node.expression.name.text);
    ts.forEachChild(node, visit);
  };
  visit(source);
  assert.ok(called.has("create"));
  for (const method of ["replaceEmailCategories", "replaceDiscordDmCategories", "replaceWebPushCategories"]) assert.equal(called.has(method), false);
});
