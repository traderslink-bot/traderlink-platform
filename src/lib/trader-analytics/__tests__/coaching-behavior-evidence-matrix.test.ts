import { describe, expect, it } from "vitest";
import {
  buildCoachingBehaviorEvidenceMatrix,
  runCoachingBehaviorEvidenceMatrix,
} from "../index";

describe("coaching behavior evidence matrix", () => {
  it("defines backed and stale cases for protected behavior labels", () => {
    const matrix = buildCoachingBehaviorEvidenceMatrix();

    expect(matrix.map((testCase) => testCase.id)).toEqual([
      "poor_profit_protection_backed",
      "poor_profit_protection_stale",
      "premature_exit_backed",
      "premature_exit_stale",
      "adding_into_weakness_backed",
      "adding_into_weakness_stale",
      "undersized_winner_backed",
      "undersized_winner_stale",
      "captured_exit_clean",
      "captured_exit_contradiction",
    ]);
    expect(
      matrix.every((testCase) =>
        testCase.review.insights.some(
          (insight) => insight.id === "trade_window_excursion_measured",
        ),
      ),
    ).toBe(true);
  });

  it("keeps behavior-label evidence invariants explicit", () => {
    const results = runCoachingBehaviorEvidenceMatrix();
    const failures = results.flatMap((result) =>
      result.failedExpectations.map(
        (failure) => `${result.id}: ${failure}`,
      ),
    );

    expect(failures).toEqual([]);
    expect(results.map((result) => [result.id, result.status])).toEqual(
      results.map((result) => [result.id, "pass"]),
    );
  });

  it("keeps backed behavior labels out of stale buckets", () => {
    const backed = runCoachingBehaviorEvidenceMatrix().filter((result) =>
      result.id.endsWith("_backed") || result.id === "captured_exit_clean",
    );

    expect(
      backed.every(
        (result) =>
          result.summary.contradictoryProfitProtectionAndCapturedExitCount === 0 &&
          result.summary.stalePoorProfitProtectionFixFirstCount === 0 &&
          result.summary.stalePrematureExitFixFirstCount === 0 &&
          result.summary.staleAddingIntoWeaknessFixFirstCount === 0 &&
          result.summary.staleUndersizedWinnerFixFirstCount === 0,
      ),
    ).toBe(true);
  });
});
