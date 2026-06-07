import { describe, expect, it } from "vitest";
import attachedReadModelFixture from "../__fixtures__/trade-detail-level-facts-contract/trade-detail-level-facts.attached.compact.json";
import oldSnapshotReadModelFixture from "../__fixtures__/trade-detail-level-facts-contract/trade-detail-level-facts.old-snapshot-attached.compact.json";
import blockedReadModelFixture from "../__fixtures__/trade-detail-level-facts-contract/trade-detail-level-facts.blocked-asof.compact.json";
import notCheckedReadModelFixture from "../__fixtures__/trade-detail-level-facts-contract/trade-detail-level-facts.not-checked.compact.json";
import featureDisabledReadModelFixture from "../__fixtures__/trade-detail-level-facts-contract/trade-detail-level-facts.feature-disabled.compact.json";
import attachedUiFixture from "../__fixtures__/trade-detail-level-facts-ui-contract/trade-detail-level-facts-ui.attached.compact.json";
import oldSnapshotUiFixture from "../__fixtures__/trade-detail-level-facts-ui-contract/trade-detail-level-facts-ui.old-snapshot-attached.compact.json";
import blockedUiFixture from "../__fixtures__/trade-detail-level-facts-ui-contract/trade-detail-level-facts-ui.blocked-asof.compact.json";
import notCheckedUiFixture from "../__fixtures__/trade-detail-level-facts-ui-contract/trade-detail-level-facts-ui.not-checked.compact.json";
import featureDisabledUiFixture from "../__fixtures__/trade-detail-level-facts-ui-contract/trade-detail-level-facts-ui.feature-disabled.compact.json";
import {
  assertTradeDetailLevelFactsUiContractIsFactualOnly,
  buildTradeDetailLevelFactsUiContract,
  summarizeTradeDetailLevelFactsUiContract,
  type TradeDetailLevelFactsUiContract,
} from "../level-analysis-trade-detail-level-facts-ui-contract";
import type { TradeDetailLevelFactsReadModel } from "../level-analysis-trade-detail-level-facts-contract";

type MutableRecord = Record<string, unknown>;

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function asReadModel(value: unknown): TradeDetailLevelFactsReadModel {
  return value as TradeDetailLevelFactsReadModel;
}

function collectObjectKeys(value: unknown, out: string[] = []): string[] {
  if (Array.isArray(value)) {
    for (const item of value) {
      collectObjectKeys(item, out);
    }
    return out;
  }

  if (typeof value === "object" && value !== null) {
    for (const [key, item] of Object.entries(value)) {
      out.push(key);
      collectObjectKeys(item, out);
    }
  }

  return out;
}

function collectStringValues(value: unknown, out: string[] = []): string[] {
  if (typeof value === "string") {
    out.push(value);
    return out;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectStringValues(item, out);
    }
    return out;
  }

  if (typeof value === "object" && value !== null) {
    for (const item of Object.values(value)) {
      collectStringValues(item, out);
    }
  }

  return out;
}

function expectNoRawPayload(value: unknown): void {
  for (const key of collectObjectKeys(value)) {
    expect(key).not.toBe("rawPayload");
    expect(key).not.toBe("rawPayloadHash");
  }
}

function expectNoAdviceLanguage(value: unknown): void {
  const text = collectStringValues(value).join("\n").toLowerCase();

  for (const [label, pattern] of [
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

function expectFixtureSectionCounts(
  fixture: TradeDetailLevelFactsUiContract,
): void {
  expect(fixture.summary.sectionCount).toBe(fixture.factsPanel.sections.length);
}

function findRowValue(
  contract: TradeDetailLevelFactsUiContract,
  rowId: string,
): unknown {
  for (const section of contract.factsPanel.sections) {
    const row = section.rows.find((item) => item.id === rowId);
    if (row) {
      return row.value.value;
    }
  }

  return undefined;
}

describe("trade detail level-facts UI contract", () => {
  it("keeps compact UI contract fixtures factual and internally consistent", () => {
    for (const fixture of [
      attachedUiFixture,
      oldSnapshotUiFixture,
      blockedUiFixture,
      notCheckedUiFixture,
      featureDisabledUiFixture,
    ] as TradeDetailLevelFactsUiContract[]) {
      assertTradeDetailLevelFactsUiContractIsFactualOnly(fixture);
      expectFixtureSectionCounts(fixture);
      expectNoRawPayload(fixture);
      expectNoAdviceLanguage(fixture);
    }
  });

  it("builds an attached packaged delivery UI contract with exact placement and factual sections", () => {
    const contract = buildTradeDetailLevelFactsUiContract(
      asReadModel(attachedReadModelFixture),
    ).contract;

    expect(contract).toMatchObject({
      contractVersion: "trade_detail_level_facts_ui_contract_v1",
      sourceReadModelContractVersion: "trade_detail_level_facts_read_model_v1",
      factualOnly: true,
      savedTradeId: "trade_DEVS_2026_06_01_001",
      status: "attached",
      placement: {
        availabilityTargetTestId: "trade-feedback-scope",
        factsTargetTestId: "trade-supporting-details",
        availabilityPosition: "below_scope_detail_before_next_action",
        factsPosition: "supporting_evidence_before_product_evidence_cards",
      },
      availabilityLine: {
        shouldRender: true,
        label: "Level facts attached",
        tone: "success",
      },
      factsPanel: {
        shouldRender: true,
        title: "Level Facts",
      },
      summary: {
        shouldShowFactsPanel: true,
        sectionCount: 6,
        limitationCount: 1,
        diagnosticCount: 2,
        sourceFileCount: 4,
        contextOnly15m: true,
      },
    });
    expect(contract.factsPanel.sections.map((section) => section.id)).toEqual([
      "header",
      "nearest_levels",
      "context_summaries",
      "coverage_and_diagnostics",
      "source_integrity",
      "limitations",
    ]);
    expect(findRowValue(contract, "nearest_levels.support.price")).toBe(0.27);
    expect(findRowValue(contract, "density.classification")).toBe(
      "dense_clustered",
    );
    expect(findRowValue(contract, "candidateInventory.overall")).toBe("no_gap");
    expect(findRowValue(contract, "volumeSession.outcome")).toBe(
      "surfaced_has_more_session_volume_context",
    );
    expect(findRowValue(contract, "sourceIntegrity.mismatchCount")).toBe(0);
    expect(findRowValue(contract, "sourceIntegrity.fifteenMinuteContextOnly")).toBe(
      true,
    );
    expect(findRowValue(contract, "source_integrity.sourceFile.15m")).toContain(
      "/15m/",
    );
    expectNoRawPayload(contract);
    expectNoAdviceLanguage(contract);
  });

  it("keeps old LevelAnalysisSnapshot v1 display compatibility", () => {
    const contract = buildTradeDetailLevelFactsUiContract(
      asReadModel(oldSnapshotReadModelFixture),
    ).contract;

    expect(contract.status).toBe("attached");
    expect(contract.factsPanel.shouldRender).toBe(true);
    expect(contract.factsPanel.sections[0]?.badges).toEqual(
      expect.arrayContaining([
        { id: "sourceKind", label: "single snapshot v1", tone: "info" },
        { id: "contextOnly15m", label: "not_supplied", tone: "safety" },
      ]),
    );
    expect(contract.summary).toMatchObject({
      missingFactCount: 3,
      contextOnly15m: false,
    });
    expect(findRowValue(contract, "density.present")).toBe(false);
    expect(findRowValue(contract, "candidateInventory.present")).toBe(false);
    expect(findRowValue(contract, "missingFacts")).toEqual([
      "density_metric",
      "candidate_inventory_gap_summary",
      "cache_fingerprint_summary",
    ]);
    expectNoRawPayload(contract);
    expectNoAdviceLanguage(contract);
  });

  it("does not render attached facts for blocked not-checked or disabled states", () => {
    const blocked = buildTradeDetailLevelFactsUiContract(
      asReadModel(blockedReadModelFixture),
    ).contract;
    const notChecked = buildTradeDetailLevelFactsUiContract(
      asReadModel(notCheckedReadModelFixture),
    ).contract;
    const disabled = buildTradeDetailLevelFactsUiContract(
      asReadModel(featureDisabledReadModelFixture),
    ).contract;

    expect(blocked).toMatchObject({
      status: "blocked_by_as_of_policy",
      availabilityLine: {
        shouldRender: true,
        label: "Level facts blocked by as-of policy",
      },
      factsPanel: {
        shouldRender: false,
        sections: [],
      },
    });
    expect(notChecked).toMatchObject({
      status: "not_checked",
      availabilityLine: {
        shouldRender: true,
        label: "Level facts not checked",
      },
      factsPanel: {
        shouldRender: false,
        sections: [],
      },
    });
    expect(disabled).toMatchObject({
      status: "feature_disabled",
      availabilityLine: {
        shouldRender: false,
        label: "Level facts disabled",
      },
      factsPanel: {
        shouldRender: false,
        sections: [],
      },
    });
  });

  it("summarizes the UI contract for render tests without exposing source internals", () => {
    const contract = buildTradeDetailLevelFactsUiContract(
      asReadModel(attachedReadModelFixture),
    ).contract;

    expect(summarizeTradeDetailLevelFactsUiContract(contract)).toEqual({
      status: "attached",
      savedTradeId: "trade_DEVS_2026_06_01_001",
      shouldShowFactsPanel: true,
      sectionIds: [
        "header",
        "nearest_levels",
        "context_summaries",
        "coverage_and_diagnostics",
        "source_integrity",
        "limitations",
      ],
      limitationCount: 1,
      missingFactCount: 0,
      diagnosticCount: 2,
      contextOnly15m: true,
    });
  });

  it("rejects raw payloads prohibited fields prohibited sections and invalid read models", () => {
    const unsafeContract = clone(attachedUiFixture) as MutableRecord;
    unsafeContract.rawPayload = { copied: true };
    unsafeContract.factsPanel = {
      sections: [
        {
          id: "recommendation",
          rows: [],
        },
      ],
    };

    expect(() =>
      assertTradeDetailLevelFactsUiContractIsFactualOnly(unsafeContract),
    ).toThrow(/factual-only|prohibited|raw payload/i);

    const invalidReadModel = clone(attachedReadModelFixture) as MutableRecord;
    invalidReadModel.rawPayload = { copied: true };

    expect(() =>
      buildTradeDetailLevelFactsUiContract(
        invalidReadModel as unknown as TradeDetailLevelFactsReadModel,
      ),
    ).toThrow(/Invalid trade detail level-facts read model/);
  });
});
