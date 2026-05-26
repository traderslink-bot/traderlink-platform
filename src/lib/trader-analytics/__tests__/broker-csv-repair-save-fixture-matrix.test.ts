import { describe, expect, it } from "vitest";
import {
  buildBrokerCsvRepairSaveFixtureMatrix,
  runBrokerCsvRepairSaveFixtureMatrix,
} from "../index";

describe("broker CSV repair/save fixture matrix", () => {
  it("defines messy import cases that exercise repair and save readiness", () => {
    const matrix = buildBrokerCsvRepairSaveFixtureMatrix();

    expect(matrix.map((fixture) => fixture.id)).toEqual([
      "mixed_dates_fees_partial_exit",
      "odd_headers_bot_sld_partial_fills",
      "sell_short_buy_to_cover_closed",
      "zero_and_blank_quantities_repaired_to_save",
      "missing_symbol_repaired_to_save",
      "missing_quantity_repaired_to_save",
      "non_filled_rows_safely_skipped",
      "short_open_position_review_gate",
      "duplicate_like_fill_acknowledged_save",
    ]);
    expect(
      matrix.every(
        (fixture) =>
          fixture.broker === "generic_execution_csv" &&
          fixture.rawCsvText.split("\n")[0].split(/[,;\t]/).length >= 5,
      ),
    ).toBe(true);
  });

  it("keeps repair/save fixture expectations stable", () => {
    const results = runBrokerCsvRepairSaveFixtureMatrix();
    const failures = results.flatMap((result) =>
      result.failedExpectations.map((failure) => `${result.id}: ${failure}`),
    );

    expect(failures).toEqual([]);
    expect(results.map((result) => [result.id, result.status])).toEqual(
      results.map((result) => [result.id, "pass"]),
    );
  });

  it("proves repaired blocked rows can become saved trades", () => {
    const byId = new Map(
      runBrokerCsvRepairSaveFixtureMatrix().map((result) => [result.id, result]),
    );

    expect(byId.get("missing_symbol_repaired_to_save")?.actual).toMatchObject({
      initialStatus: "blocked",
      finalCommitStatus: "ready_to_commit",
      committedTradeCount: 1,
      savedTradeSymbols: ["MSRP"],
    });
    expect(byId.get("missing_quantity_repaired_to_save")?.actual).toMatchObject({
      initialStatus: "blocked",
      finalCommitStatus: "ready_to_commit",
      committedTradeCount: 1,
      savedTradeSymbols: ["MQTY"],
    });
    expect(
      byId.get("zero_and_blank_quantities_repaired_to_save")?.actual,
    ).toMatchObject({
      initialStatus: "blocked",
      finalCommitStatus: "ready_to_commit",
      committedTradeCount: 1,
      savedTradeSymbols: ["ZBQT"],
    });
    expect(
      byId.get("zero_and_blank_quantities_repaired_to_save")?.actual
        .requiredInitialIssueCodes,
    ).toEqual(expect.arrayContaining(["row_invalid_quantity", "row_missing_quantity"]));
  });

  it("keeps review-only edge cases explicit before launch", () => {
    const byId = new Map(
      runBrokerCsvRepairSaveFixtureMatrix().map((result) => [result.id, result]),
    );

    expect(byId.get("short_open_position_review_gate")?.actual).toMatchObject({
      initialStatus: "needs_review",
      savedTradeDirections: ["short"],
      savedTradeLifecycleStatuses: ["open"],
    });
    expect(
      byId.get("duplicate_like_fill_acknowledged_save")?.actual.requiredAnomalyTypes,
    ).toContain("duplicate_like_fill");
    expect(
      byId.get("non_filled_rows_safely_skipped")?.actual.requiredFinalIssueCodes,
    ).toContain("non_filled_order_skipped");
  });

  it("covers generic broker aliases without broker-specific mappings", () => {
    const byId = new Map(
      runBrokerCsvRepairSaveFixtureMatrix().map((result) => [result.id, result]),
    );

    expect(byId.get("odd_headers_bot_sld_partial_fills")?.actual).toMatchObject({
      finalAcceptedExecutionCount: 4,
      savedTradeSymbols: ["ALTX"],
      savedTradeDirections: ["long"],
      savedTradeLifecycleStatuses: ["closed"],
    });
    expect(byId.get("sell_short_buy_to_cover_closed")?.actual).toMatchObject({
      finalAcceptedExecutionCount: 3,
      savedTradeSymbols: ["CVRS"],
      savedTradeDirections: ["short"],
      savedTradeLifecycleStatuses: ["closed"],
    });
  });
});
