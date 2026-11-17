import { PlatformPremiumError, premiumInteger, premiumRef, premiumScope, premiumTicket, premiumUtc, samePremiumScope,
  type PlatformPremiumScope, type PlatformPremiumTicket } from "../../contracts/platform-premium-access";

type Common = Readonly<{ ticket: PlatformPremiumTicket; authorityKey: string; authorityRevision: number;
  scope: PlatformPremiumScope; observedAtUtc: string }>;
export type PlatformPremiumPeriodEligibilityEvent = Common & Readonly<{
  basis?: "payment_period"; paidEligible: boolean; validUntilUtc: string | null; paidThroughUtc: string | null;
}>;
export type PlatformPremiumCurrentAccessEligibilityEvent = Common & Readonly<{
  protocol: "platform_premium_current_access_event_v1"; basis: "current_provider_access";
  state: "paid" | "not_paid" | "unknown"; paidEligible: boolean | null; validUntilUtc: string; paidThroughUtc: null;
  realm: "live" | "sandbox"; nativeObservationRefs: readonly string[];
}>;
export type PlatformPremiumEligibilityEvent = PlatformPremiumPeriodEligibilityEvent | PlatformPremiumCurrentAccessEligibilityEvent;
const invalid = (): never => { throw new PlatformPremiumError("invalid"); };
function record(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== "object" || Array.isArray(input)) return invalid();
  return input as Record<string, unknown>;
}
/** Canonical pure copying parser, not origin/admission/payment qualification.
 * Unknown is null and cannot be coerced to a false period event. */
export function parsePlatformPremiumEligibilityEvent(input: unknown): PlatformPremiumEligibilityEvent {
  const value = record(input), rawScope = record(value.scope);
  const scope = premiumScope({ authorityKey: rawScope.authorityKey as string, userId: rawScope.userId as string,
    discordUserId: rawScope.discordUserId as string | null, guildId: rawScope.guildId as string,
    identityGeneration: rawScope.identityGeneration as number, entitlementGeneration: rawScope.entitlementGeneration as number,
    erasureGeneration: rawScope.erasureGeneration as number, policyGeneration: rawScope.policyGeneration as number });
  const ticket = premiumTicket(value.ticket as PlatformPremiumTicket), observedAtUtc = premiumUtc(value.observedAtUtc as string);
  const authorityKey = premiumRef(value.authorityKey as string), authorityRevision = premiumInteger(value.authorityRevision as number);
  const validUntilUtc = value.validUntilUtc === null ? null : premiumUtc(value.validUntilUtc as string);
  const paidThroughUtc = value.paidThroughUtc === null ? null : premiumUtc(value.paidThroughUtc as string);
  if (authorityKey !== scope.authorityKey || authorityRevision !== ticket.authorityRevision || !samePremiumScope(scope,ticket.scope)
    || observedAtUtc < ticket.observedAtUtc || observedAtUtc >= ticket.validUntilUtc
    || (validUntilUtc !== null && validUntilUtc > ticket.validUntilUtc)) return invalid();
  const common = { ticket, authorityKey, authorityRevision, scope, observedAtUtc };
  if (value.basis === "current_provider_access") {
    if (value.protocol !== "platform_premium_current_access_event_v1" || !["paid","not_paid","unknown"].includes(value.state as string)
      || value.paidEligible !== (value.state === "unknown" ? null : value.state === "paid")
      || paidThroughUtc !== null || validUntilUtc === null || validUntilUtc <= observedAtUtc
      || !["live","sandbox"].includes(value.realm as string) || !Array.isArray(value.nativeObservationRefs)
      || value.nativeObservationRefs.length > 50 || (value.state === "paid" && value.nativeObservationRefs.length < 1)) return invalid();
    const nativeObservationRefs = value.nativeObservationRefs.map(item => premiumRef(item as string));
    if (new Set(nativeObservationRefs).size !== nativeObservationRefs.length) return invalid();
    return Object.freeze({ ...common, protocol: "platform_premium_current_access_event_v1", basis: "current_provider_access",
      state: value.state as PlatformPremiumCurrentAccessEligibilityEvent["state"], paidEligible: value.paidEligible as boolean | null,
      validUntilUtc, paidThroughUtc: null, realm: value.realm as "live" | "sandbox", nativeObservationRefs: Object.freeze(nativeObservationRefs) });
  }
  // A damaged current event cannot fall back to a false period event merely
  // because its basis was dropped. Old legitimate period events have none of
  // these fields; do not discard them while reconstructing a legacy shape.
  if (["protocol","state","realm","nativeObservationRefs"].some(key => key in value)) return invalid();
  if ((value.basis !== undefined && value.basis !== "payment_period") || typeof value.paidEligible !== "boolean"
    || (value.paidEligible ? validUntilUtc === null || validUntilUtc <= observedAtUtc || paidThroughUtc === null || paidThroughUtc <= observedAtUtc
      : validUntilUtc !== null || paidThroughUtc !== null)) return invalid();
  return Object.freeze({ ...common, paidEligible: value.paidEligible, validUntilUtc, paidThroughUtc,
    ...(value.basis === "payment_period" ? { basis: "payment_period" as const } : {}) });
}
