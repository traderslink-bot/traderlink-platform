import { describe, expect, it } from "vitest";

import {
  buildWatchlistHighRiskWarning,
  getWatchlistHighRiskCountry,
} from "../watchlist-high-risk-warning";

describe("watchlist high-risk warning", () => {
  it("recognizes China, Hong Kong, Malaysia, and Singapore aliases with full display names", () => {
    expect(getWatchlistHighRiskCountry("CN")).toBe("China");
    expect(getWatchlistHighRiskCountry("Hong Kong SAR China")).toBe("Hong Kong");
    expect(getWatchlistHighRiskCountry("my")).toBe("Malaysia");
    expect(getWatchlistHighRiskCountry("Singapore")).toBe("Singapore");
    expect(getWatchlistHighRiskCountry("SG")).toBe("Singapore");
  });

  it("shows a country-only warning for every covered ticker", () => {
    expect(
      buildWatchlistHighRiskWarning({ country: "Hong Kong" }),
    ).toEqual({
      countryName: "Hong Kong",
      message: "This ticker is associated with Hong Kong, a high-risk country.",
    });

    expect(buildWatchlistHighRiskWarning({ country: "Malaysia" })).toEqual({
      countryName: "Malaysia",
      message: "This ticker is associated with Malaysia, a high-risk country.",
    });

    expect(buildWatchlistHighRiskWarning({ country: "Singapore" })).toMatchObject({
      countryName: "Singapore",
    });
  });

  it("does not create a warning for countries outside the high-risk list", () => {
    expect(buildWatchlistHighRiskWarning({ country: "United States" })).toBeNull();
  });
});
