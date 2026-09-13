import assert from "node:assert/strict";
import { test } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { hasSharedAnalyzerAllowance, type SharedAnalyzerAvailability } from "./shared-analyzer-beta-contracts";
import { ManualTradePostEntryReview } from "@/app/(dashboard)/trade-tracker/manual-trade-post-entry-review";

const unlimited: SharedAnalyzerAvailability = { enabled: true, unlimited: true,
  dailyAvailable: null, periodAvailable: null, selectableAvailable: null, daysUntilReset: 0 };
const ordinary: SharedAnalyzerAvailability = { enabled: true, dailyAvailable: 3,
  periodAvailable: 20, selectableAvailable: 3, daysUntilReset: 12 };

test("Unlimited is an explicit JSON-safe allowance, not a fabricated remaining number", () => {
  assert.deepEqual(JSON.parse(JSON.stringify(unlimited)), unlimited);
  assert.equal(hasSharedAnalyzerAllowance(unlimited), true);
  assert.equal(hasSharedAnalyzerAllowance({ ...unlimited, enabled: false }), false);
  assert.equal(hasSharedAnalyzerAllowance(ordinary), true);
  assert.equal(hasSharedAnalyzerAllowance({ ...ordinary, selectableAvailable: 0 }), false);
});

test("trade review renders Unlimited without quota/reset counts and preserves ordinary wording", () => {
  const render = (analyzerUses: SharedAnalyzerAvailability) => renderToStaticMarkup(
    createElement(ManualTradePostEntryReview, { analyzerGroupRefs: [], analyzerUses,
      groups: [], merges: [], onAnalyzerGroupRefsChange: () => {}, onError: () => {}, onMergesChange: () => {} }));
  const owner = render(unlimited), regular = render(ordinary);
  assert.match(owner, /Unlimited/);
  assert.doesNotMatch(owner, /available today|available this period|resets in/);
  assert.doesNotMatch(regular, /Unlimited/);
  assert.match(regular, /3 available today/);
  assert.match(regular, /20.*available this period/);
  assert.match(regular, /12.*days/);
});
