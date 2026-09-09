export type WatchlistHighRiskCountry = "China" | "Hong Kong" | "Malaysia" | "Singapore";

export type WatchlistHighRiskWarning = {
  countryName: WatchlistHighRiskCountry;
  message: string;
};

type BuildWatchlistHighRiskWarningArgs = {
  country: unknown;
};

function normalizeCountry(value: unknown): string {
  return typeof value === "string"
    ? value
        .toLowerCase()
        .replace(/\(high risk country\)/g, "")
        .replace(/[._-]+/g, " ")
        .replace(/\s+/g, " ")
        .trim()
    : "";
}

export function getWatchlistHighRiskCountry(value: unknown): WatchlistHighRiskCountry | null {
  const country = normalizeCountry(value);
  if (["china", "cn", "prc", "people's republic of china"].includes(country)) {
    return "China";
  }
  if (["hong kong", "hk", "hong kong sar", "hong kong sar china"].includes(country)) {
    return "Hong Kong";
  }
  if (["malaysia", "my"].includes(country)) {
    return "Malaysia";
  }
  if (["singapore", "sg"].includes(country)) {
    return "Singapore";
  }
  return null;
}

export function buildWatchlistHighRiskWarning({
  country,
}: BuildWatchlistHighRiskWarningArgs): WatchlistHighRiskWarning | null {
  const countryName = getWatchlistHighRiskCountry(country);
  if (!countryName) {
    return null;
  }

  return {
    countryName,
    message: `This ticker is associated with ${countryName}, a high-risk country.`,
  };
}
