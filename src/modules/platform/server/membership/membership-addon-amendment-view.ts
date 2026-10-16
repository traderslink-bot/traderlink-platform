import { z } from "zod";
import type { AddonAmendmentRow } from "./membership-addon-amendment-repository";
import type { MembershipAddonAmendmentView } from "../../contracts/membership-addon-amendment";
export function membershipAddonAmendmentView(row: AddonAmendmentRow): MembershipAddonAmendmentView {
  return { id: row.amendment_id,subscriptionId:row.provider_subscription_id,state: row.state,currency: row.currency,chargeMinor: row.charge_minor,
    monthlyMinor: row.target_monthly_minor,addonOfferIds:z.array(z.uuid()).parse(JSON.parse(row.addon_offer_ids_json)),addonNames:z.array(z.string()).parse(JSON.parse(row.addon_names_json)),renewalAt: row.period_end_utc,expiresAt: row.expires_at_utc,paymentUrl: row.hosted_invoice_url };
}
