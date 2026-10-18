export type MembershipAddonAmendmentView = Readonly<{
  id: string; subscriptionId: string;
  state: "preparing" | "quoted" | "confirming" | "pending_payment" | "applied" | "expired" | "failed" | "reconciliation_required";
  addonOfferIds: readonly string[]; addonNames: readonly string[];
  currency: string; chargeMinor: number | null; monthlyMinor: number; renewalAt: string; expiresAt: string; paymentUrl: string | null;
}>;
export type MembershipAddonAmendmentResult = { ok: true; amendment: MembershipAddonAmendmentView } | { ok: false; message: string };
export type MembershipAmendmentAddonChoice = Readonly<{ offerId: string; name: string; monthlyMinor: number; currency: string; free: boolean }>;
export type MembershipAmendmentSubscriptionChoice = Readonly<{ id: string; name: string; currency: string }>;
