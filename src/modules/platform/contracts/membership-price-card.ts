import type { MembershipPlanPrice } from "./membership-plan-editor";
import { currencyDecimals, formatMembershipMoney, parseMembershipAmount, type MembershipPrice } from "./platform-membership-pricing";

export function editorPriceTerms(price: MembershipPlanPrice): MembershipPrice {
  const currency = price.currency.trim().toUpperCase();
  const amount = (value: string): number | null => {
    try { return value.trim() ? parseMembershipAmount(value.trim(), currency) : null; }
    catch { return null; }
  };
  return { billingKind: price.billing, currency, initialAmountMinor: amount(price.initialPrice),
    renewalAmountMinor: amount(price.renewalPrice), billingPeriodDays: null,
    billingInterval: price.interval, billingIntervalCount: price.intervalCount };
}

export function membershipPriceCard(price: MembershipPrice) {
  const unavailable = { amount: "—", currency: "", period: "", note: "Price to be confirmed.", configured: false };
  if (price.billingKind === "free") {
    let currency = price.currency || "USD";
    try { currencyDecimals(currency); } catch { currency = "USD"; }
    return { amount: "0", currency, period: "", note: "", configured: true };
  }
  if (price.initialAmountMinor === null || !price.currency) return unavailable;
  let digits: number;
  try { digits = currencyDecimals(price.currency); } catch { return unavailable; }
  const value = price.initialAmountMinor / 10 ** digits;
  const amount = new Intl.NumberFormat("en-CA", {
    minimumFractionDigits: Number.isInteger(value) ? 0 : digits, maximumFractionDigits: digits,
  }).format(value);
  if (price.billingKind !== "recurring") return { amount, currency: price.currency,
    period: price.billingKind === "lifetime" ? "lifetime" : "one-time", note: "", configured: true };
  const count = price.billingIntervalCount ?? price.billingPeriodDays;
  const unit = price.billingInterval ?? "day";
  const period = count ? `/${count === 1 ? "" : `${count} `}${unit}${count === 1 ? "" : "s"}` : "";
  const differentRenewal = price.initialAmountMinor !== price.renewalAmountMinor;
  const note = differentRenewal
    ? price.renewalAmountMinor === null ? "Renewal price to be confirmed."
      : `Then ${formatMembershipMoney(price.renewalAmountMinor, price.currency)}${period}${count ? "" : " (billing period to be confirmed)"}.`
    : count ? "" : "Billing period to be confirmed.";
  return { amount, currency: price.currency, period: differentRenewal ? "to start" : period, note, configured: true };
}
