import { PlatformPremiumError, premiumRef, premiumUtc, type PlatformPremiumDecision,
  type PlatformPremiumSnapshot } from "../../contracts/platform-premium-access";
import { parsePlatformPremiumEligibilityEvent, type PlatformPremiumCurrentAccessEligibilityEvent } from "./platform-premium-eligibility-event";
/** Creates no proof. The admitted repository still rechecks the ORIGINAL ticket.
 * Unknown has an observation recheck deadline, never an invented paid period. */
export function createPlatformPremiumCurrentAccessEvent(snapshot: PlatformPremiumSnapshot,
  decision: PlatformPremiumDecision, nowUtc: string): PlatformPremiumCurrentAccessEligibilityEvent | null {
  const current = snapshot.coverage.filter(item => item.kind === "unknown" ? item.basis === "current_provider_access"
    : item.evidence.kind === "current_paid_access" || ((item.evidence.kind === "unknown" || item.evidence.kind === "not_paid")
      && item.evidence.basis === "current_provider_access"));
  if (!current.length || (decision.partnerPaidEligible && decision.basis !== "current_provider_access")) return null;
  const state = decision.partnerPaidEligible ? "paid" : decision.paidRole === "absent" ? "not_paid" : "unknown";
  if (decision.paidThroughUtc !== null) throw new PlatformPremiumError("invalid");
  const positive = current.filter(item => item.kind === "evidence" && item.evidence.kind === "current_paid_access");
  const realms = new Set((state === "paid" ? positive : current).map(item => item.offer.environment));
  if (realms.size !== 1) throw new PlatformPremiumError("invalid");
  const realm = [...realms][0]!;
  const nativeObservationRefs = current.flatMap(item => item.kind === "evidence" && item.nativeObservationRef
    ? [premiumRef(item.nativeObservationRef)] : []);
  const value = parsePlatformPremiumEligibilityEvent({ protocol: "platform_premium_current_access_event_v1", basis: "current_provider_access",
    ticket: snapshot.ticket, scope: snapshot.scope, authorityKey: snapshot.scope.authorityKey, authorityRevision: snapshot.authorityRevision,
    observedAtUtc: premiumUtc(nowUtc), state, paidEligible: state === "unknown" ? null : state === "paid", paidThroughUtc: null,
    validUntilUtc: state === "unknown" ? snapshot.validUntilUtc : decision.validUntilUtc, realm,
    nativeObservationRefs: [...new Set(nativeObservationRefs)] });
  if (value.basis !== "current_provider_access") throw new PlatformPremiumError("invalid");
  return value;
}
