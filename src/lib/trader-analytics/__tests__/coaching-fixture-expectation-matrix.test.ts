import { describe, expect, it } from "vitest";
import {
  buildCoachingFixtureExpectationMatrix,
  runCoachingFixtureExpectationMatrix,
} from "../index";

describe("coaching fixture expectation matrix", () => {
  it("keeps representative sample trades aligned with expected coaching emphasis", () => {
    const matrix = buildCoachingFixtureExpectationMatrix();
    const results = runCoachingFixtureExpectationMatrix();

    expect(matrix.length).toBeGreaterThanOrEqual(16);
    expect(results).toHaveLength(matrix.length);
    expect(results.filter((item) => item.status === "fail")).toEqual([]);
  });
});
