import { describe, expect, it } from "vitest";

import {
  buildCanonicalExecution,
  classifyExecutionRelationship,
  orderCanonicalExecutions,
  parseAcceptedExecutionQuantity,
  reconstructAnalyticalPnl,
  validateExactDecimal,
} from "../domain";
import {
  GA0_A2_SYNTHETIC_FIXTURE_EXPECTATIONS,
  buildGa0A2ExecutableFixtures,
  buildSyntheticAnalyticalPnlInput,
  buildSyntheticCanonicalExecution,
  classifyCollisionWithTestHash,
  syntheticSourceDocumentDigest,
} from "../testing";

function joinedLedgerValues(
  ledgers: ReturnType<typeof reconstructAnalyticalPnl>["ledgers"],
  field: "endingQuantity" | "grossRealizedPnl" | "signedCharges" | "netAnalyticalPnl",
): string {
  const currencyOrder = new Map([
    ["USD", 0],
    ["CAD", 1],
  ]);
  return [...ledgers]
    .sort(
      (left, right) =>
        (currencyOrder.get(left.currency) ?? 99) -
        (currencyOrder.get(right.currency) ?? 99),
    )
    .map((ledger) => `${ledger.currency}=${ledger[field]}`)
    .join(";");
}

describe("Trader Intelligence v3 GA0-A2 exact synthetic fixture catalog", () => {
  const fixtures = buildGa0A2ExecutableFixtures();

  it("contains every required executable synthetic scenario exactly once", () => {
    expect(GA0_A2_SYNTHETIC_FIXTURE_EXPECTATIONS).toHaveLength(35);
    expect(fixtures).toHaveLength(35);
    expect(new Set(fixtures.map((fixture) => fixture.expectation.id)).size).toBe(35);
    expect(fixtures.map((fixture) => fixture.expectation.id).sort()).toEqual(
      GA0_A2_SYNTHETIC_FIXTURE_EXPECTATIONS.map((fixture) => fixture.id).sort(),
    );
    for (const fixture of fixtures) {
      expect(fixture.expectation.purpose.length).toBeGreaterThan(10);
      expect(fixture.expectation).toHaveProperty("expectedEndingInventory");
      expect(fixture.expectation).toHaveProperty("expectedGrossPnl");
      expect(fixture.expectation).toHaveProperty("expectedCharges");
      expect(fixture.expectation).toHaveProperty("expectedNetPnl");
      expect(fixture.expectation).toHaveProperty(
        "expectedBlockedOrLimitationState",
      );
      expect(fixture.expectation).toHaveProperty("expectedCanonicalDigests");
    }
  });

  it.each(fixtures)(
    "executes fixture authority: $expectation.id",
    (fixture) => {
      const expected = fixture.expectation;
      if (fixture.mode === "invalid_decimal") {
        const decimal =
          expected.id === "scale_overflow_rejection"
            ? parseAcceptedExecutionQuantity(fixture.invalidDecimalInput)
            : validateExactDecimal(fixture.invalidDecimalInput);
        expect(decimal).toEqual({
          ok: false,
          error: { code: expected.expectedBlockedOrLimitationState },
        });
        const canonical = buildCanonicalExecution(fixture.invalidDraft);
        expect(canonical.ok).toBe(false);
        return;
      }

      const relationship =
        fixture.relationshipPair === null
          ? null
          : fixture.collisionTestHash === undefined
            ? classifyExecutionRelationship(
                fixture.executions[fixture.relationshipPair[0]],
                fixture.executions[fixture.relationshipPair[1]],
              )
            : classifyCollisionWithTestHash(
                fixture.executions[fixture.relationshipPair[0]],
                fixture.executions[fixture.relationshipPair[1]],
                fixture.collisionTestHash,
              );
      if (relationship !== null) {
        expect(relationship.state).toBe(expected.expectedDuplicateState);
      }

      if (expected.expectedOrderingState !== "not_applicable") {
        expect(orderCanonicalExecutions(fixture.executions).state).toBe(
          expected.expectedOrderingState,
        );
      }

      if (fixture.mode === "identity") {
        expect(fixture.executions.map((item) => item.canonicalContentDigest)).toEqual(
          expected.expectedCanonicalDigests,
        );
        return;
      }

      if (fixture.collisionTestHash !== undefined) {
        expect(fixture.collisionTestHash(fixture.executions[0].canonicalBytes)).toBe(
          expected.expectedCanonicalDigests[0]?.split(":").at(-1),
        );
        return;
      }

      const result = reconstructAnalyticalPnl(
        buildSyntheticAnalyticalPnlInput(fixture.executions),
      );
      if (
        expected.expectedBlockedOrLimitationState?.startsWith(
          "ti_v3_reconstruction_",
        )
      ) {
        expect(result.blockedStates.map((state) => state.code)).toContain(
          expected.expectedBlockedOrLimitationState,
        );
        return;
      }

      expect(result.status).toBe("completed");
      if (expected.expectedEndingInventory?.includes("=")) {
        expect(joinedLedgerValues(result.ledgers, "endingQuantity")).toBe(
          expected.expectedEndingInventory,
        );
        expect(joinedLedgerValues(result.ledgers, "grossRealizedPnl")).toBe(
          expected.expectedGrossPnl,
        );
        expect(joinedLedgerValues(result.ledgers, "signedCharges")).toBe(
          expected.expectedCharges,
        );
        expect(joinedLedgerValues(result.ledgers, "netAnalyticalPnl")).toBe(
          expected.expectedNetPnl,
        );
        expect(result).not.toHaveProperty("netAnalyticalPnl");
      } else if (expected.expectedEndingInventory !== null) {
        expect(result.ledgers).toHaveLength(1);
        expect(result.ledgers[0]).toMatchObject({
          endingQuantity: expected.expectedEndingInventory,
          grossRealizedPnl: expected.expectedGrossPnl,
          signedCharges: expected.expectedCharges,
          netAnalyticalPnl: expected.expectedNetPnl,
        });
      }
      if (expected.expectedBlockedOrLimitationState === "ti_v3_open_inventory_remaining") {
        expect(result.limitations).toContain("ti_v3_open_inventory_remaining");
      }
      if (expected.expectedCanonicalDigests.length > 0) {
        expect([
          ...new Set(
            fixture.executions.map((item) => item.canonicalContentDigest),
          ),
        ]).toEqual(expected.expectedCanonicalDigests);
      }
    },
  );

  it("matches recorded identity golden vectors", () => {
    const identityFixture = GA0_A2_SYNTHETIC_FIXTURE_EXPECTATIONS.find(
      (fixture) => fixture.id === "source_economic_identity_change",
    );
    expect(identityFixture).toBeDefined();
    expect(identityFixture?.expectedCanonicalDigests).toEqual([
      buildSyntheticCanonicalExecution().canonicalContentDigest,
      buildSyntheticCanonicalExecution({
        sourceDocumentDigest: syntheticSourceDocumentDigest("changed"),
      }).canonicalContentDigest,
      buildSyntheticCanonicalExecution({ price: "1.2501" }).canonicalContentDigest,
    ]);
  });

  it("uses only explicit synthetic identity and symbol labels", () => {
    const serialized = JSON.stringify(fixtures);
    expect(serialized).not.toMatch(/\b(?:IBKR|Moomoo|Webull|Robinhood|Schwab)\b/i);
    expect(serialized).not.toMatch(/account_(?!synthetic_)/);
  });
});
