const PRIOR_CONSENT_COUNTRY_CODES = new Set([
  "AT",
  "BE",
  "BG",
  "CY",
  "CZ",
  "DE",
  "DK",
  "EE",
  "ES",
  "FI",
  "FR",
  "GB",
  "GR",
  "HR",
  "HU",
  "IE",
  "IS",
  "IT",
  "LI",
  "LT",
  "LU",
  "LV",
  "MT",
  "NL",
  "NO",
  "PL",
  "PT",
  "RO",
  "SE",
  "SI",
  "SK",
]);

const UNKNOWN_COUNTRY_CODES = new Set(["", "XX", "T1"]);

export type AnalyticsConsentLocation = Readonly<{
  countryCode: string | null;
  regionCode: string | null;
}>;

export function requiresPriorAnalyticsConsent(
  location: AnalyticsConsentLocation,
): boolean {
  const countryCode = normalizeCode(location.countryCode);
  const regionCode = normalizeCode(location.regionCode);

  if (UNKNOWN_COUNTRY_CODES.has(countryCode)) {
    return true;
  }

  if (PRIOR_CONSENT_COUNTRY_CODES.has(countryCode)) {
    return true;
  }

  return countryCode === "CA" && regionCode === "QC";
}

export function analyticsConsentLocationFromHeaders(
  headers: Headers,
): AnalyticsConsentLocation {
  return Object.freeze({
    countryCode: headers.get("cf-ipcountry")?.trim() || null,
    regionCode: headers.get("cf-region-code")?.trim() || null,
  });
}

function normalizeCode(value: string | null): string {
  return value?.trim().toUpperCase() ?? "";
}
