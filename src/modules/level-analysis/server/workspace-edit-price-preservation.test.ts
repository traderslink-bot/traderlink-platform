import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "vitest";
import { submittedWorkspaceTradePrice as submitted, updateWorkspaceTradeDraftField as update } from "@/app/(dashboard)/workspace/workspace-trade-edit-price";

const initial = () => ({ kind: "existing" as "existing" | "new", originalPriceDecimal: "0.47301999",
  priceDecimal: "0.47", priceEdited: false, localTime: "10:00:00", removed: false });

test("untouched rounded prefill preserves exact price across other-field changes and remove/undo", () => {
  let row = initial();
  row = update(row, "localTime", "10:01:00");
  row = update(row, "removed", true);
  row = update(row, "removed", false);
  assert.equal(submitted(row), "0.47301999");
  assert.equal(row.priceDecimal, "0.47");
  assert.equal(row.priceEdited, false);
});

test("intentional typed or pasted prices use exact input, including the rounded displayed value", () => {
  for (const entered of ["0.47", "0.48151234", ""]) {
    const row = update(initial(), "priceDecimal", entered);
    assert.equal(row.priceEdited, true);
    assert.equal(submitted(row), entered);
    assert.equal(submitted(update(row, "localTime", "10:02:00")), entered);
  }
});

test("new copied rows use their displayed draft and reopening restores original-price protection", () => {
  const edited = update(initial(), "priceDecimal", "0.46");
  assert.equal(submitted({ ...edited, kind: "new", priceDecimal: "0.49" }), "0.49");
  assert.equal(submitted(initial()), "0.47301999");
  assert.equal(submitted({ ...initial(), originalPriceDecimal: null, priceDecimal: "" }), "");
});

test("drawer keeps approved two-decimal display while wiring lossless submission and explicit price changes", () => {
  const source = readFileSync("app/(dashboard)/workspace/workspace-atomic-trade-edit-drawer.tsx", "utf8");
  assert.match(source, /formatJournalAnalyticsDecimal\(execution\.priceDecimal, 2, true\)/);
  assert.match(source, /originalPriceDecimal: execution\.priceDecimal, priceEdited: false/);
  assert.match(source, /updateWorkspaceTradeDraftField\(row, key, value\)/);
  assert.match(source, /priceDecimal: submittedWorkspaceTradePrice\(row\)/);
  assert.match(source, /submittedWorkspaceTradePrice\(row\) !== \(saved\.priceDecimal \?\? ""\)/);
});
