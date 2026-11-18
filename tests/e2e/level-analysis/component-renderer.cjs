const path = require("node:path");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");

/** Preserved component coverage, explicitly separate from current route UI. */
function renderLegacyFactsHarness(facts) {
  const unregister = require("tsx/cjs/api").register();
  try {
    const root = process.cwd();
    const { buildTradeDetailLevelFactsUiContract } = require(path.join(root,
      "src/lib/level-analysis/level-analysis-trade-detail-level-facts-ui-contract.ts"));
    const { TradeDetailLevelFactsAvailabilityLine, TradeDetailLevelFactsPanel } = require(path.join(root,
      "app/intelligence/trades/[tradeId]/trade-detail-level-facts.tsx"));
    const { contract } = buildTradeDetailLevelFactsUiContract(facts);
    const body = React.createElement("main", null,
      React.createElement("h1", null, "Preserved Level Facts component — test harness"),
      React.createElement("p", { role: "note" },
        "This tests the unchanged legacy component. The current Journal page does not render this panel."),
      React.createElement(TradeDetailLevelFactsAvailabilityLine, { contract }),
      React.createElement(TradeDetailLevelFactsPanel, { contract }));
    return "<!doctype html><html><head><meta charset=\"utf-8\"><title>Preserved component contract test</title></head><body>" +
      renderToStaticMarkup(body) + "</body></html>";
  } finally { unregister(); }
}

module.exports = { renderLegacyFactsHarness };
