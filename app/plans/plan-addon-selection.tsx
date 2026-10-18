"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import type { MembershipPrice } from "@/src/modules/platform/contracts/platform-membership-pricing";
import { formatMembershipMoney } from "@/src/modules/platform/contracts/platform-membership-pricing";
import { combinedMembershipPrice } from "@/src/modules/platform/contracts/membership-addons";

export type PlanAddonChoice = { requiresDiscord?: boolean; id: string; name: string; price: MembershipPrice; displayOnly: boolean; brief: string; features: readonly { label: string; brief?: string; details?: string }[] };
export function PlanAddonSelection({ basePrice, addons, preview = false }: { basePrice: MembershipPrice; addons: readonly PlanAddonChoice[]; preview?: boolean }) {
  const { pending } = useFormStatus();
  const [selected, setSelected] = useState<string[]>([]);
  const eligible = addons.filter(addon => (preview || !addon.displayOnly) && (addon.price.billingKind === "free" || addon.price.currency === basePrice.currency || basePrice.billingKind === "free"));
  if (!eligible.length || !(basePrice.billingKind === "free" || (basePrice.billingKind === "recurring" && basePrice.billingInterval === "month" && basePrice.billingIntervalCount === 1))) return null;
  let total: MembershipPrice | null = null; let error = "";
  try { total = combinedMembershipPrice([basePrice, ...eligible.filter(addon => selected.includes(addon.id)).map(addon => addon.price)]); }
  catch (failure) { error = failure instanceof Error ? failure.message : "Check your selected packages."; }
  return <fieldset disabled={pending} style={{ border: "1px solid currentColor", borderRadius: 8, padding: 12, minWidth: 0 }}>
    <legend>Optional add-ons</legend>
    {eligible.map(addon => <div key={addon.id} style={{ marginBottom: 12 }}>
      <label style={{ display: "flex", gap: 8, alignItems: "flex-start", cursor: "pointer" }}>
        <input type="checkbox" name={preview ? undefined : "addonOfferId"} value={addon.id} checked={selected.includes(addon.id)} onChange={event => setSelected(current => event.target.checked ? [...current, addon.id] : current.filter(id => id !== addon.id))} />
        <span><strong>{addon.name}</strong><br />{addon.price.billingKind === "free" ? "$0" : `${formatMembershipMoney(addon.price.renewalAmountMinor, addon.price.currency)}/month`}<br /><small>{addon.brief}</small>{addon.requiresDiscord ? <><br /><small>Discord connection required for Discord benefits. You can connect later.</small></> : null}</span>
      </label>
      {addon.features.length ? <details><summary>Included features</summary><ul>{addon.features.map((feature, index) => <li key={`${feature.label}:${index}`}><strong>{feature.label}</strong>{feature.brief ? <p>{feature.brief}</p> : null}{feature.details ? <p>{feature.details}</p> : null}</li>)}</ul></details> : null}
    </div>)}
    {error ? <p role="alert">{error}</p> : total ? <p aria-live="polite" style={{ marginBottom: 0 }}><strong>Total: {total.billingKind === "free" ? "$0" : `${formatMembershipMoney(total.renewalAmountMinor, total.currency)}/month`}</strong>
      {total.initialAmountMinor !== total.renewalAmountMinor ? <><br />First payment: {formatMembershipMoney(total.initialAmountMinor, total.currency)}</> : null}</p> : null}
  </fieldset>;
}
