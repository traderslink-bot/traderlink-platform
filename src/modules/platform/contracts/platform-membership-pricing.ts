export type MembershipPrice = {
  billingKind: string;
  currency: string | null;
  initialAmountMinor: number | null;
  renewalAmountMinor: number | null;
  billingPeriodDays: number | null;
  billingInterval?: string | null;
  billingIntervalCount?: number | null;
};

export function currencyDecimals(currency: string): number {
  if (!/^[A-Z]{3}$/.test(currency) || !Intl.supportedValuesOf("currency").includes(currency)) {
    throw new Error("Choose a valid currency.");
  }
  return new Intl.NumberFormat("en-CA", { style: "currency", currency }).resolvedOptions().maximumFractionDigits ?? 2;
}

export function parseMembershipAmount(value: string, currency: string): number {
  const digits = currencyDecimals(currency);
  if (!/^\d+(?:\.\d+)?$/.test(value) || (value.split(".")[1]?.length ?? 0) > digits) {
    throw new Error(`Enter a price with no more than ${digits} decimal places.`);
  }
  const [whole, fraction = ""] = value.split(".");
  const amount = Number(BigInt(whole) * BigInt(10) ** BigInt(digits) + BigInt(fraction.padEnd(digits, "0") || "0"));
  if (!Number.isSafeInteger(amount)) throw new Error("The price is too large to store exactly.");
  return amount;
}

export function formatMembershipMoney(amount: number | null, currency: string | null): string {
  if (amount === null || currency === null) return "Price not configured";
  return new Intl.NumberFormat("en-CA", { style: "currency", currency, currencyDisplay: "code" })
    .format(amount / 10 ** currencyDecimals(currency));
}

export function membershipOfferPrice(offer: MembershipPrice): string {
  if (offer.billingKind === "free") return "Free";
  const initial = formatMembershipMoney(offer.initialAmountMinor, offer.currency);
  if (offer.billingKind !== "recurring") return `${initial} ${offer.billingKind === "lifetime" ? "lifetime" : "once"}`;
  const count = offer.billingIntervalCount ?? offer.billingPeriodDays;
  const unit = offer.billingInterval ?? "day";
  const period = count ? `every ${count} ${unit}${count === 1 ? "" : "s"}` : "period not configured";
  const renewal = formatMembershipMoney(offer.renewalAmountMinor, offer.currency);
  return offer.initialAmountMinor !== offer.renewalAmountMinor
    ? `${initial} initially; then ${renewal} ${period}` : `${renewal} ${period}`;
}
