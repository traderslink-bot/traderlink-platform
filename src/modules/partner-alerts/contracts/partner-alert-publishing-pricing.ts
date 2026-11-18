import {
  PartnerAlertValidationError,
  type PartnerAlertCurrency,
  type PartnerAlertPublishingQuote,
  type PartnerAlertPublishingTerms,
} from "./partner-alert-contracts";
import {
  PARTNER_ALERT_MAX_SELECTION,
  parsePartnerAlertCurrency,
  parsePartnerAlertPublishingTerms,
  partnerAlertExactKeys,
  partnerAlertId,
  partnerAlertInteger,
  partnerAlertRecord,
} from "./partner-alert-validation";

export type PartnerAlertPricingCapabilities = Readonly<{
  /** Supplied by a qualified server provider adapter, never by a purchase form. */
  currencies: readonly PartnerAlertCurrency[];
  calendarMonthCadence: boolean;
}>;

/** Parse editable decimal text without float rounding, exponents or currency assumptions. */
export function partnerAlertAmountToMinor(value: unknown, currencyValue: unknown): number {
  const currency = parsePartnerAlertCurrency(currencyValue);
  if (typeof value !== "string" || value.length > 24
    || !/^(0|[1-9][0-9]*)(\.[0-9]+)?$/u.test(value)) {
    throw new PartnerAlertValidationError("amount", "Enter a valid price.");
  }
  const [whole, fraction = ""] = value.split(".");
  if (fraction.length > currency.minorUnitDigits) {
    throw new PartnerAlertValidationError("amount", "Use the currency’s supported decimal places.");
  }
  const digits = whole + fraction.padEnd(currency.minorUnitDigits, "0");
  const amount = Number(digits);
  return partnerAlertInteger(amount, "amount");
}

export function formatPartnerAlertAmount(amountMinor: number, currencyValue: unknown): string {
  const currency = parsePartnerAlertCurrency(currencyValue);
  const digits = String(partnerAlertInteger(amountMinor, "amountMinor"))
    .padStart(currency.minorUnitDigits + 1, "0");
  const amount = currency.minorUnitDigits === 0 ? digits
    : `${digits.slice(0, -currency.minorUnitDigits)}.${digits.slice(-currency.minorUnitDigits)}`;
  return `${amount} ${currency.code}`;
}

/** Contracted slots, not currently online mappings. This function does not bill anyone. */
export function quotePartnerAlertPublishing(input: Readonly<{
  terms: unknown;
  contractedChannels: number;
  capabilities: PartnerAlertPricingCapabilities;
}>): PartnerAlertPublishingQuote {
  const terms = parsePartnerAlertPublishingTerms(input.terms);
  const channels = partnerAlertInteger(input.contractedChannels, "contractedChannels", 1,
    PARTNER_ALERT_MAX_SELECTION);
  if (!Array.isArray(input.capabilities.currencies) || input.capabilities.currencies.length > 250
    || typeof input.capabilities.calendarMonthCadence !== "boolean") {
    throw new PartnerAlertValidationError("providerCapabilities");
  }
  const currencies = input.capabilities.currencies.map(parsePartnerAlertCurrency);
  if (!currencies.some(currency => currency.code === terms.currency.code
    && currency.minorUnitDigits === terms.currency.minorUnitDigits)) {
    throw new PartnerAlertValidationError("currency", "This currency needs provider verification.");
  }
  if (terms.cadence.unit === "calendar_month" && !input.capabilities.calendarMonthCadence) {
    throw new PartnerAlertValidationError("cadence", "Verify calendar-month billing or choose an explicit day interval.");
  }
  const additionalChannels = Math.max(0, channels - terms.includedChannels);
  if (additionalChannels > 0 && terms.additionalChannelAmountMinor
    > Math.floor((Number.MAX_SAFE_INTEGER - terms.firstChannelAmountMinor) / additionalChannels)) {
    throw new PartnerAlertValidationError("amount", "The total price is outside the supported range.");
  }
  const additionalTotalMinor = terms.additionalChannelAmountMinor * additionalChannels;
  const totalMinor = partnerAlertInteger(terms.firstChannelAmountMinor + additionalTotalMinor, "totalMinor");
  return Object.freeze({ termsId: terms.termsId, communityId: terms.communityId,
    termsVersion: terms.version, pricingSource: terms.pricingSource,
    contractedChannels: channels, includedChannels: terms.includedChannels, additionalChannels,
    firstChannelAmountMinor: terms.firstChannelAmountMinor,
    additionalChannelAmountMinor: terms.additionalChannelAmountMinor,
    additionalTotalMinor, totalMinor, currency: terms.currency, cadence: terms.cadence });
}

/** Preserve accepted standard terms; a negotiated revision is a separate immutable value. */
export function createPartnerAlertPrivateTerms(input: Readonly<{
  previousTerms: unknown;
  newTermsId: string;
  newVersion: number;
  overrides: unknown;
}>): PartnerAlertPublishingTerms {
  const previous = parsePartnerAlertPublishingTerms(input.previousTerms);
  const termsId = partnerAlertId(input.newTermsId, "newTermsId");
  const version = partnerAlertInteger(input.newVersion, "newVersion", 1);
  if (termsId === previous.termsId || version <= previous.version) {
    throw new PartnerAlertValidationError("newVersion", "Create a new agreement revision.");
  }
  const overrides = partnerAlertRecord(input.overrides, "overrides");
  partnerAlertExactKeys(overrides, ["currency", "firstChannelAmountMinor", "additionalChannelAmountMinor",
    "includedChannels", "cadence"], "overrides");
  return parsePartnerAlertPublishingTerms({ ...previous, ...overrides,
    termsId, version, pricingSource: "private" });
}

export function partnerAlertCadenceLabel(cadence: PartnerAlertPublishingTerms["cadence"]): string {
  // Reuse only integer validation here; never rename a 30-day interval to monthly.
  const count = partnerAlertInteger(cadence.count, "cadence.count", 1,
    cadence.unit === "calendar_month" ? 120 : 3660);
  if (cadence.unit === "day") return `every ${count} ${count === 1 ? "day" : "days"}`;
  if (cadence.unit === "calendar_month") return `every ${count} calendar ${count === 1 ? "month" : "months"}`;
  throw new PartnerAlertValidationError("cadence");
}
