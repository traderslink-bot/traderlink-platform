import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import attachedUiFixture from "../__fixtures__/trade-detail-level-facts-ui-contract/trade-detail-level-facts-ui.attached.compact.json";
import blockedUiFixture from "../__fixtures__/trade-detail-level-facts-ui-contract/trade-detail-level-facts-ui.blocked-asof.compact.json";
import featureDisabledUiFixture from "../__fixtures__/trade-detail-level-facts-ui-contract/trade-detail-level-facts-ui.feature-disabled.compact.json";
import oldSnapshotUiFixture from "../__fixtures__/trade-detail-level-facts-ui-contract/trade-detail-level-facts-ui.old-snapshot-attached.compact.json";
import type { TradeDetailLevelFactsUiContract } from "../level-analysis-trade-detail-level-facts-ui-contract";
import {
  LEVEL_ANALYSIS_TRADE_DETAIL_LEVEL_FACTS_UI_FEATURE_FLAG,
  isLevelAnalysisTradeDetailLevelFactsUiEnabled,
} from "../level-analysis-journal-delivery-trade-link-storage";
import {
  TradeDetailLevelFactsAvailabilityLine,
  TradeDetailLevelFactsPanel,
} from "../../../../app/intelligence/trades/[tradeId]/trade-detail-level-facts";

function asContract(value: unknown): TradeDetailLevelFactsUiContract {
  return value as TradeDetailLevelFactsUiContract;
}

function asEnv(value: Record<string, string>): NodeJS.ProcessEnv {
  return value as unknown as NodeJS.ProcessEnv;
}

function renderFacts(contract: TradeDetailLevelFactsUiContract | null): string {
  return renderToStaticMarkup(
    createElement(
      "div",
      null,
      createElement(TradeDetailLevelFactsAvailabilityLine, { contract }),
      createElement(TradeDetailLevelFactsPanel, { contract }),
    ),
  );
}

function expectNoRawPayloadOrAdviceLanguage(markup: string): void {
  const text = markup.toLowerCase();

  for (const [label, pattern] of [
    ["raw payload", /rawpayload|raw payload|rawpayloadhash|raw payload hash/],
    ["grading", /\bgrading\b|\btrade grade\b/],
    ["coaching", /\bcoaching\b|\bcoach\b/],
    ["p/l", /\bp\/l\b|\bpnl\b/],
    ["giveback", /\bgiveback\b/],
    ["behavior scoring", /\bbehavior score\b|\bbehavior scoring\b/],
    ["recommendation", /\brecommendation\b/],
    ["buy/sell/hold", /\bbuy\b|\bsell\b|\bhold\b/],
    ["entry decision", /\bentry decision\b/],
    ["exit decision", /\bexit decision\b/],
    ["trade advice", /\btrade advice\b/],
    ["should have", /\bshould have\b|\bshould enter\b|\bshould exit\b/],
  ] as const) {
    expect(pattern.test(text), `Unexpected ${label} language`).toBe(false);
  }
}

describe("trade detail level-facts UI implementation", () => {
  it("renders attached packaged delivery facts inside the approved trade detail targets", () => {
    const markup = renderFacts(asContract(attachedUiFixture));

    expect(markup).toContain("trade-detail-level-facts-availability");
    expect(markup).toContain("trade-detail-level-facts-panel");
    expect(markup).toContain("Level facts attached");
    expect(markup).toContain("Level Facts");
    expect(markup).toContain("DEVS");
    expect(markup).toContain("Nearest support");
    expect(markup).toContain("0.27");
    expect(markup).toContain("dense_clustered");
    expect(markup).toContain("no_gap");
    expect(markup).toContain("surfaced_has_more_session_volume_context");
    expect(markup).toContain("15m context-only");
    expect(markup).toContain("ibkr/DEVS/15m/100-1780329600000.json");
    expectNoRawPayloadOrAdviceLanguage(markup);
  });

  it("renders old LevelAnalysisSnapshot v1 attached facts without requiring new delivery fields", () => {
    const markup = renderFacts(asContract(oldSnapshotUiFixture));

    expect(markup).toContain("SNAP");
    expect(markup).toContain("single snapshot v1");
    expect(markup).toContain("not_supplied");
    expect(markup).toContain("density_metric");
    expect(markup).toContain("candidate_inventory_gap_summary");
    expectNoRawPayloadOrAdviceLanguage(markup);
  });

  it("renders blocked availability without rendering an attached facts panel", () => {
    const markup = renderFacts(asContract(blockedUiFixture));

    expect(markup).toContain("Level facts blocked by as-of policy");
    expect(markup).not.toContain("trade-detail-level-facts-panel");
    expect(markup).not.toContain("Nearest support");
    expectNoRawPayloadOrAdviceLanguage(markup);
  });

  it("hides disabled or missing contracts", () => {
    expect(renderFacts(null)).toBe("<div></div>");
    expect(renderFacts(asContract(featureDisabledUiFixture))).toBe("<div></div>");
  });

  it("keeps the trade-detail facts UI behind the dedicated UI feature flag", () => {
    expect(
      isLevelAnalysisTradeDetailLevelFactsUiEnabled(
        asEnv({
          [LEVEL_ANALYSIS_TRADE_DETAIL_LEVEL_FACTS_UI_FEATURE_FLAG]: "1",
        }),
      ),
    ).toBe(true);
    expect(
      isLevelAnalysisTradeDetailLevelFactsUiEnabled(
        asEnv({
          [LEVEL_ANALYSIS_TRADE_DETAIL_LEVEL_FACTS_UI_FEATURE_FLAG]: "true",
        }),
      ),
    ).toBe(true);
    expect(isLevelAnalysisTradeDetailLevelFactsUiEnabled(asEnv({}))).toBe(false);
  });
});
