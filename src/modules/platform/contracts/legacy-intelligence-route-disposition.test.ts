import {
  LEGACY_INTELLIGENCE_ROUTE_COUNT,
  LEGACY_INTELLIGENCE_ROUTE_DISPOSITIONS,
  legacyIntelligenceRedirects,
} from "./legacy-intelligence-route-disposition";

describe("legacy Intelligence route disposition", () => {
  it("maps every legacy page exactly once without returning to V3", () => {
    expect(LEGACY_INTELLIGENCE_ROUTE_DISPOSITIONS).toHaveLength(
      LEGACY_INTELLIGENCE_ROUTE_COUNT,
    );
    expect(
      new Set(LEGACY_INTELLIGENCE_ROUTE_DISPOSITIONS.map(({ source }) => source))
        .size,
    ).toBe(LEGACY_INTELLIGENCE_ROUTE_COUNT);
    expect(
      LEGACY_INTELLIGENCE_ROUTE_DISPOSITIONS.some(({ destination }) =>
        destination.startsWith("/intelligence"),
      ),
    ).toBe(false);
  });

  it("uses temporary redirects and orders static routes before dynamic matches", () => {
    const redirects = legacyIntelligenceRedirects();
    expect(redirects.every(({ permanent }) => permanent === false)).toBe(true);
    const firstDynamicIndex = redirects.findIndex(({ source }) =>
      source.includes(":"),
    );
    expect(firstDynamicIndex).toBeGreaterThan(0);
    expect(
      redirects.slice(firstDynamicIndex).every(({ source }) => source.includes(":")),
    ).toBe(true);
  });

  it("keeps test and operations tools outside the product dashboard", () => {
    const operations = LEGACY_INTELLIGENCE_ROUTE_DISPOSITIONS.filter(
      ({ kind }) => kind === "operations_only",
    );
    expect(operations).toHaveLength(5);
    expect(
      operations.every(({ destination }) =>
        destination.startsWith("/workspace/readiness?capability="),
      ),
    ).toBe(true);
    expect(
      LEGACY_INTELLIGENCE_ROUTE_DISPOSITIONS.find(
        ({ source }) => source === "/intelligence/trader-intelligence",
      ),
    ).toMatchObject({
      destination: "/workspace",
      kind: "owner_rejected_test_surface",
    });
  });
});
