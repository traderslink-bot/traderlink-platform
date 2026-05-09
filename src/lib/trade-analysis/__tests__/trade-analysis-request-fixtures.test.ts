import { describe, expect, it } from "vitest";
import invalidRequest from "../../../docs/trade-analysis-request-fixtures/invalid-request.json";
import invalidExecutionOnlyRequests from "../../../docs/trade-analysis-request-fixtures/invalid-execution-only-requests.json";
import inconsistentShareSizing from "../../../docs/trade-analysis-request-fixtures/inconsistent-share-sizing.json";
import longLoser from "../../../docs/trade-analysis-request-fixtures/long-loser.json";
import longWinner from "../../../docs/trade-analysis-request-fixtures/long-winner.json";
import openPosition from "../../../docs/trade-analysis-request-fixtures/open-position.json";
import partialExits from "../../../docs/trade-analysis-request-fixtures/partial-exits.json";
import providerFailureExample from "../../../docs/trade-analysis-request-fixtures/provider-failure-example.json";
import rapidFireExecutionCluster from "../../../docs/trade-analysis-request-fixtures/rapid-fire-execution-cluster.json";
import repeatedAddsBeforeReduction from "../../../docs/trade-analysis-request-fixtures/repeated-adds-before-reduction.json";
import shortLoser from "../../../docs/trade-analysis-request-fixtures/short-loser.json";
import shortWinner from "../../../docs/trade-analysis-request-fixtures/short-winner.json";
import {
  parseTradeAnalysisRequestDocument,
  validateTradeAnalysisRequest,
} from "../request/trade-analysis-request-contract";

describe("trade analysis request fixtures", () => {
  it.each([
    ["long winner", longWinner],
    ["long loser", longLoser],
    ["short winner", shortWinner],
    ["short loser", shortLoser],
    ["partial exits", partialExits],
    ["provider failure example", providerFailureExample],
    ["repeated adds before reduction", repeatedAddsBeforeReduction],
    ["inconsistent share sizing", inconsistentShareSizing],
    ["rapid fire execution cluster", rapidFireExecutionCluster],
  ])("keeps %s fixture on the public request contract", (_name, fixture) => {
    const validation = validateTradeAnalysisRequest(fixture);

    expect(validation.valid).toBe(true);
    expect(validation.issues.filter((issue) => issue.severity === "error")).toEqual(
      [],
    );
    expect(validation.request).toMatchObject({
      symbol: fixture.symbol,
      tradeDirection: fixture.tradeDirection,
    });
  });

  it("keeps the open-position fixture valid but warning-bearing", () => {
    const validation = validateTradeAnalysisRequest(openPosition);

    expect(validation.valid).toBe(true);
    expect(validation.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          severity: "warning",
          code: "open_position",
        }),
      ]),
    );
  });

  it("keeps the intentionally invalid fixture invalid", () => {
    const validation = validateTradeAnalysisRequest(invalidRequest);

    expect(validation.valid).toBe(false);
    expect(validation.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          severity: "error",
          code: "missing_symbol",
        }),
      ]),
    );
  });

  it("keeps execution-only invalid request fixtures invalid", () => {
    const requests =
      parseTradeAnalysisRequestDocument(invalidExecutionOnlyRequests).requests;

    expect(requests).toHaveLength(3);

    const validations = requests.map(validateTradeAnalysisRequest);

    expect(validations.every((validation) => !validation.valid)).toBe(true);
    expect(
      validations.flatMap((validation) =>
        validation.issues.map((issue) => issue.code),
      ),
    ).toEqual(
      expect.arrayContaining([
        "exit_before_entry",
        "mixed_execution_symbols",
        "invalid_execution_timestamp",
        "invalid_execution_side",
        "invalid_execution_shares",
        "invalid_execution_price",
      ]),
    );
  });
});
