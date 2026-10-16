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


test("membership copy distinguishes excluded access, exhausted uses and unlimited without beta limits", () => {
  const render = (membership: NonNullable<SharedAnalyzerAvailability["membership"]>) => renderToStaticMarkup(
    createElement(ManualTradePostEntryReview, { analyzerGroupRefs: [], analyzerUses: { ...ordinary, membership },
      groups: [], merges: [], onAnalyzerGroupRefsChange: () => {}, onError: () => {}, onMergesChange: () => {} }));
  const excluded=render({ included:false, remaining:0, resetsAtUtc:null, resetDays:null });
  assert.match(excluded,/See what your trades are telling you/);
  assert.match(excluded,/Start Analyzing your trades now!/);
  const exhausted=render({ included:true, remaining:0, resetsAtUtc:"2026-10-20T12:00:00.000Z", resetDays:5 });
  assert.match(exhausted,/0 analyses available/);assert.match(exhausted,/Increase your Analyzer usage/);
  const unlimited=render({ included:true, remaining:null, resetsAtUtc:null, resetDays:null });
  assert.match(unlimited,/Unlimited analyses/);assert.doesNotMatch(unlimited,/available today|available this period/);
});

test("trade-entry Analyze control stays visible with a nearby upgrade link when excluded", () => {
  const html=renderToStaticMarkup(createElement(ManualTradePostEntryReview, {
    analyzerGroupRefs: [], analyzerUses: { ...ordinary, membership: { included:false, remaining:0, resetsAtUtc:null, resetDays:null } },
    groups: [{ groupRef:'group', symbol:'QA', currency:'USD', direction:'long', openedAtUtc:'2026-10-14T13:30:00.000Z',
      lastExecutionAtUtc:'2026-10-14T14:15:00.000Z', state:'complete_trade', remainingQuantityDecimal:'0',
      allocations:[{clientRowRef:'open',role:'opening',quantityDecimal:'10'},{clientRowRef:'close',role:'closing',quantityDecimal:'10'}],
      existingPosition:null, allowedRelationships:['start_new_trade'], allowedStyles:['day_trade'], suggestedStyle:'day_trade' }],
    merges:[], onAnalyzerGroupRefsChange:()=>{}, onError:()=>{}, onMergesChange:()=>{},
  }));
  assert.match(html,/Analyze/);assert.match(html,/disabled=""/);
  assert.match(html,/Upgrade for Trade Analyzer/);assert.match(html,/plans\?feature=trade_analyzer.analyses/);
});
