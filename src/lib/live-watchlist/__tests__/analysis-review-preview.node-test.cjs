const assert = require("node:assert/strict");
const test = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const source = fs.readFileSync(path.join(__dirname, "../analysis-review-preview.ts"), "utf8");
const exportsObject = {};
vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports: exportsObject });
const read = exportsObject.readAnalysisReviewPreview;
const card = { title: "Analysis", body: "{}", source: "test", updatedAt: 1, priceWhenPosted: null };
const message = { source: "traderslink-watchlist-admin", type: "preview-analysis", card };
test("preview retains the exact saved card and explicit dip visibility", () => {
  assert.equal(read(message).card, card);
  assert.equal(read(message).dipBuyPlanVisible, true);
  assert.equal(read({ ...message, dipBuyPlanVisible: false }).dipBuyPlanVisible, false);
});
test("preview rejects malformed and oversized messages", () => {
  for (const value of [null, {}, { ...message, source: "other" }, { ...message, type: "open-usage" },
    ...[{ body: 3 }, { body: "x".repeat(2 * 1024 * 1024 + 1) }, { updatedAt: Infinity }, { priceWhenPosted: "3" }].map(patch => ({ ...message, card: { ...card, ...patch } }))]) assert.equal(read(value), null);
});
