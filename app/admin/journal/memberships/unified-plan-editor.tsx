"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { membershipPlanReadiness, newMembershipPlanPrice, type MembershipPlanEditor,
  type MembershipPlanFeatureChoice, type MembershipPlanProvider, type MembershipPlanSaveRequest,
  type MembershipPlanSaveResult } from "@/src/modules/platform/contracts/membership-plan-editor";
import { EditorBudget, EditorCheck, EditorCount, EditorDelay, EditorGrid, EditorSelect, EditorText, PlanPriceFields } from "./unified-plan-fields";
import { UnifiedPlanPreview } from "./unified-plan-preview";
import { includedMembershipPlanNotifications, isMembershipPlanSelectableFeature } from "@/src/modules/platform/contracts/membership-plan-notifications";
import { ensureJournalPlanFoundation, membershipProductDescription, newMembershipProductFeature, toggleMembershipProduct } from "@/src/modules/platform/contracts/membership-product-features";
import { moveMembershipCardFeature } from "@/src/modules/platform/contracts/membership-plan-feature-order";

export type UnifiedPlanSaveResult = MembershipPlanSaveResult;
export type UnifiedPlanSaveRequest = MembershipPlanSaveRequest;

export function UnifiedPlanEditor({ initial, draftId, revision, features, providers, pages, memberCount, save, close }: {
  initial: MembershipPlanEditor; draftId: string | null; revision: number | null;
  features: readonly MembershipPlanFeatureChoice[]; providers: readonly MembershipPlanProvider[];
  pages: readonly { id: string; name: string }[]; memberCount: number;
  save: (request: UnifiedPlanSaveRequest) => Promise<UnifiedPlanSaveResult>; close: (message?: string) => void;
}) {
  const [plan, setPlan] = useState(() => ({ ...structuredClone(initial), features: initial.packageType === "addon" ? initial.features : ensureJournalPlanFoundation(initial.features) }));
  const [apply, setApply] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const submitted = useRef(false);
  const form = useRef<HTMLFormElement>(null);
  const retry = useRef<{ payload: string; requestId: string } | null>(null);
  const dirty = apply || JSON.stringify(plan) !== JSON.stringify(initial);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  const issues = membershipPlanReadiness(plan, providers, features);
  const blockers = issues.filter(issue => issue.blocking);
  const set = <K extends keyof MembershipPlanEditor>(key: K, value: MembershipPlanEditor[K]) => setPlan(current => ({ ...current, [key]: value }));
  function updateFeature(key: string, patch: Partial<MembershipPlanEditor["features"][number]>) {
    setPlan(current => ({ ...current, features: current.features.map(feature => feature.key === key ? { ...feature, ...patch } : feature) }));
  }
  function setting(key: string, enabled: boolean, limit: number | null = null) {
    setPlan(current => ({ ...current, features: [...current.features.filter(feature => feature.key !== key), ...(enabled ? [newMembershipProductFeature(key, limit)] : [])] }));
  }
  function submit(intent: "save" | "publish") {
    if (submitted.current) return;
    if (!form.current?.reportValidity()) return;
    if (intent === "publish" && blockers.length) { setError("Resolve the items in Preview and publish before publishing."); return; }
    const payload = JSON.stringify({ plan, intent, apply, draftId, revision });
    if (!retry.current || retry.current.payload !== payload) retry.current = { payload, requestId: crypto.randomUUID() };
    const requestId = retry.current.requestId;
    submitted.current = true; setError("");
    startTransition(async () => {
      try {
        const result = await save({ requestId, draftId, revision, document: plan, intent, applyToMembers: apply });
        if (result.error) setError(result.error);
        else close(result.message ?? (intent === "publish" ? "Plan published." : "Plan saved."));
      } catch { setError("We couldn't confirm the save. Your changes are still here. Retry without changing them to check the same request safely."); }
      finally { submitted.current = false; }
    });
  }
  function cancel() { if (!dirty || window.confirm("Discard your unsaved changes?")) close(); }
  return <Box component="form" ref={form} onSubmit={event => { event.preventDefault(); submit("save"); }}>
    <Stack spacing={2}>
      {error ? <Alert severity="error" role="alert">{error}</Alert> : null}
      {pending ? <Alert severity="info" role="status">Saving your plan…</Alert> : null}
      <Box component="fieldset" disabled={pending} sx={{ border: 0, p: 0, m: 0, minWidth: 0 }}>
        <Stack spacing={2}>
          <Typography component="h2" variant="h6">Details</Typography>
          <EditorGrid>
            <EditorSelect label="Package type" value={plan.packageType} options={[{ value: "plan", label: "Plan" }, { value: "addon", label: "Add-on" }]} onChange={packageType => { setApply(false); setPlan(current => ({ ...current, packageType,
              features: packageType === "plan" ? ensureJournalPlanFoundation(current.features) : current.features })); }} />
            <EditorText label={plan.packageType === "addon" ? "Add-on name" : "Plan name"} value={plan.name} onChange={value => set("name", value)} />
            <EditorSelect label="Visibility" value={plan.visibility} onChange={value => set("visibility", value)} options={[
              { value: "public", label: "Public plans page" }, { value: "private", label: "Private" }, { value: "unlisted", label: "Unlisted" }]} />
            <EditorText label="Plan description" value={plan.description} multiline onChange={value => set("description", value)} />
            <EditorText label="Internal note" value={plan.internalNote} multiline onChange={value => set("internalNote", value)} />
          </EditorGrid>
          <EditorCheck label="Requires a connected Discord account for Discord benefits (members can connect later)" checked={Boolean(plan.requiresDiscord)} onChange={checked => set("requiresDiscord", checked)} />
          <Typography component="h2" variant="h6">Features and allowances</Typography>
          <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap" }}>
            <Button onClick={() => set("features", features.filter(f => isMembershipPlanSelectableFeature(f.key)).reduce((current, f) => toggleMembershipProduct(current, f.key, true, plan.packageType), plan.features))}>Select all features</Button>
            <Button onClick={() => set("features", plan.packageType === "addon" ? [] : ensureJournalPlanFoundation([]))}>{plan.packageType === "addon" ? "Clear features" : "Clear optional features"}</Button>
          </Stack>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2,minmax(0,1fr))", xl: "repeat(3,minmax(0,1fr))" }, gap: 1 }}>
            {features.filter(feature => isMembershipPlanSelectableFeature(feature.key)).map(feature => {
              const selected = plan.features.find(item => item.key === feature.key);
              const privateMeter = ["private_watchlist.ticker_additions", "private_watchlist.generations", "private_watchlist.cost_microusd"].includes(feature.key);
              const dayMeter = ["trade_analyzer.analyses", "levels.generations"].includes(feature.key);
              return <Box key={feature.key} sx={{ border: 1, borderColor: selected ? "primary.main" : "divider", borderRadius: 1, p: 1, minWidth: 0 }}>
                {feature.key === "journal.access" && plan.packageType === "plan" ? <><Typography sx={{ fontWeight: 700 }}>Trading Journal</Typography><Typography variant="caption">Included in every plan</Typography></> : <EditorCheck label={feature.label} checked={Boolean(selected)} onChange={checked => setPlan(current => ({ ...current,
                  features: toggleMembershipProduct(current.features, feature.key, checked, current.packageType) }))} />}
                {selected ? <Stack spacing={1} sx={{ mt: 1 }}>
                  {feature.key === "news.access" ? <>
                    <Typography variant="body2">Press release delay</Typography>
                    <EditorDelay value={plan.features.find(f => f.key === "news.visibility_delay_seconds")?.limit ?? 0} onChange={limit => setting("news.visibility_delay_seconds", true, limit)} />
                    <EditorCheck label="Allow press release notifications" checked={plan.features.some(f => f.key === "notifications.press_release")} onChange={enabled => setting("notifications.press_release", enabled)} />
                    {plan.features.some(f => f.key === "notifications.press_release") ? <><Typography variant="body2">Notification delay</Typography><EditorDelay value={plan.features.find(f => f.key === "news.notification_delay_seconds")?.limit ?? 0} onChange={limit => setting("news.notification_delay_seconds", true, limit)} /></> : null}
                  </> : null}
                  {feature.key === "journal.access" && plan.packageType === "plan" ? <>
                    <EditorCount label="Journal account allowance" value={plan.features.find(f => f.key === "journal.accounts")?.limit ?? (plan.features.some(f => f.key === "journal.accounts") ? null : 1)} hint="Blank: unlimited." onChange={limit => setting("journal.accounts", true, limit)} />
                    <Typography variant="body2">Manual trade entry is included.</Typography>
                    <Typography sx={{ fontWeight: 700 }} variant="body2">Trading Rules</Typography>
                    <EditorCheck label="Allow preset rules" checked={plan.features.some(f => f.key === "journal.preset_rules")} onChange={enabled => setting("journal.preset_rules", enabled)} />
                    <EditorCount label="Custom rule allowance" value={plan.features.find(f => f.key === "journal.custom_rules")?.limit ?? (plan.features.some(f => f.key === "journal.custom_rules") ? null : 0)} hint="Across all Journal accounts. Blank: unlimited. 0: none." onChange={limit => setting("journal.custom_rules", true, limit)} />
                    <Typography sx={{ fontWeight: 700 }} variant="body2">Tags</Typography>
                    <Typography variant="body2">Preset tags are included.</Typography>
                    <EditorCount label="Custom tag allowance" value={plan.features.find(f => f.key === "journal.custom_tags")?.limit ?? (plan.features.some(f => f.key === "journal.custom_tags") ? null : 0)} hint="Across all Journal accounts. Blank: unlimited. 0: none." onChange={limit => setting("journal.custom_tags", true, limit)} />
                  </> : null}
                  {feature.key === "journal.calendar" ? <>
                    <EditorCheck label="Monthly calendar" checked={plan.features.some(f => f.key === "journal.calendar_month")} onChange={enabled => setting("journal.calendar_month", enabled)} />
                    <EditorCheck label="Weekly calendar" checked={plan.features.some(f => f.key === "journal.calendar_week")} onChange={enabled => setting("journal.calendar_week", enabled)} />
                  </> : null}
                  {feature.key === "watchlist.access" ? <>
                    {[["watchlist.ticker_details", "Ticker details"], ["watchlist.trade_analysis", "Trade analysis"], ["watchlist.levels", "Support and Resistance"], ["watchlist.indicators", "Indicator card"]].map(([key, label]) => <EditorCheck key={key} label={label} checked={plan.features.some(f => f.key === key)} onChange={enabled => setting(key, enabled)} />)}
                  </> : null}
                  {feature.key === "analytics.trade_explorer" ? <EditorCheck label="Allow reports and exports" checked={plan.features.some(f => f.key === "analytics.exports")} onChange={enabled => setting("analytics.exports", enabled)} /> : null}
                  {feature.key === "private_watchlist.cost_microusd" ? <EditorBudget value={selected.limit} onChange={limit => updateFeature(feature.key, { limit })} />
                    : feature.key.includes("delay_seconds") ? <EditorDelay value={selected.limit} onChange={limit => updateFeature(feature.key, { limit })} /> : feature.kind === "limit" ? <EditorCount label="Allowance"
                    value={selected.limit} hint="Blank: unlimited. 0: none."
                    onChange={limit => updateFeature(feature.key, { limit })} /> : null}
                  {dayMeter ? <EditorCount label="Reset every (days)" value={selected.resetDays} hint="Blank: no reset." onChange={resetDays => updateFeature(feature.key, { resetDays })} /> : null}
                  {privateMeter ? <>
                    <EditorSelect label="Allowance period" value={selected.period?.kind ?? "calendar_month"} options={[
                      { value: "calendar_month", label: "Calendar month" }, { value: "days", label: "Custom days" }, { value: "lifetime", label: "No reset" }]}
                      onChange={kind => updateFeature(feature.key, { period: { kind, days: selected.period?.days ?? null } })} />
                    {selected.period?.kind === "days" ? <EditorCount label="Days per period" value={selected.period.days} onChange={days => updateFeature(feature.key, { period: { kind: "days", days } })} /> : null}
                  </> : null}
                  <details><summary>Descriptions</summary><Stack spacing={1} sx={{ mt: 1 }}>
                    <EditorText label="Brief description" value={selected.brief ?? membershipProductDescription(feature.key, plan.features, feature.brief)} multiline onChange={brief => updateFeature(feature.key, { brief })} />
                    <EditorText label="Expandable details" value={selected.details ?? feature.details} multiline onChange={details => updateFeature(feature.key, { details })} />
                    <Button onClick={() => updateFeature(feature.key, { brief: null, details: null })}>Use shared descriptions</Button>
                  </Stack></details>
                </Stack> : null}
              </Box>;
            })}
          </Box>
          <Alert severity="info">Stock Press Releases includes your chosen delay and notification settings. Week Ahead includes its notifications. Other features include their associated notifications automatically. Allowed notifications default to on; members can turn them off.
            {includedMembershipPlanNotifications(plan.features).length ? ` Included: ${includedMembershipPlanNotifications(plan.features).map(item => item.label).join(", ")}.` : " No notification features selected."}
          </Alert>
          <Typography component="h2" variant="h6">Prices and access</Typography>
          {plan.prices.map((price, index) => <PlanPriceFields key={price.id} price={price} providers={providers}
            onChange={value => set("prices", plan.prices.map((p, i) => i === index ? value : p))}
            remove={() => set("prices", plan.prices.filter((_, i) => i !== index))} />)}
          <Button variant="outlined" sx={{ alignSelf: "flex-start" }} onClick={() => set("prices", [...plan.prices, newMembershipPlanPrice(crypto.randomUUID())])}>Add price or access option</Button>
          <Typography component="h2" variant="h6">Private pages</Typography>
          {pages.length ? pages.map(page => <EditorCheck key={page.id} label={page.name} checked={plan.privatePageIds.includes(page.id)}
            onChange={checked => set("privatePageIds", checked ? [...plan.privatePageIds, page.id] : plan.privatePageIds.filter(id => id !== page.id))} />)
            : <Typography color="text.secondary">No private pages yet. Private links remains available for creating and managing multi-plan pages.</Typography>}
          <Typography component="h2" variant="h6">Preview and publish</Typography>
          <EditorCheck label="Display only — show the plan without enabling purchases" checked={plan.displayOnly} onChange={value => set("displayOnly", value)} />
          {plan.packageType !== "addon" ? <EditorCheck label="Show optional add-ons on this plan card" checked={plan.showOptionalAddons ?? false} onChange={value => set("showOptionalAddons", value)} /> : null}
          <Typography component="h3" variant="subtitle2">Plan card feature order</Typography>
          <Stack component="ol" spacing={1} sx={{ listStyle: "none", p: 0, m: 0 }}>
            {plan.features.filter(feature => isMembershipPlanSelectableFeature(feature.key)).map((feature, index, ordered) => {
              const label = features.find(item => item.key === feature.key)?.label ?? "Unavailable feature";
              return <Box component="li" key={feature.key} sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", justifyContent: "space-between", gap: 1 }}>
                <Typography>{index + 1}. {label}</Typography>
                <Stack direction="row" spacing={1}>
                  <Button size="small" variant="outlined" aria-label={`Move ${label} up`} disabled={index === 0} onClick={() => setPlan(current => ({ ...current, features: moveMembershipCardFeature(current.features, feature.key, "up") }))}>Move up</Button>
                  <Button size="small" variant="outlined" aria-label={`Move ${label} down`} disabled={index === ordered.length - 1} onClick={() => setPlan(current => ({ ...current, features: moveMembershipCardFeature(current.features, feature.key, "down") }))}>Move down</Button>
                </Stack>
              </Box>;
            })}
          </Stack>
          <UnifiedPlanPreview plan={plan} features={features} />
          {issues.length ? <Stack spacing={0.5}>{issues.map((issue, index) => <Alert key={`${issue.path}:${index}`} severity={issue.blocking ? "warning" : "info"}>{issue.message}</Alert>)}</Stack>
            : <Alert severity="success">Configuration checks passed. Payment-provider transaction testing is a separate verification.</Alert>}
          {initial.planId && plan.packageType === "plan" ? <>
            <EditorCheck label={`Apply feature/access changes to existing members (${memberCount})`} checked={apply} onChange={setApply} />
            <Typography variant="body2">{apply ? "Updates this plan's member access when published. Existing charges, expiry dates, usage and unrelated grants remain unchanged." : "Existing members keep their current access. New signups use the published settings."}</Typography>
          </> : null}
          {error ? <Alert severity="error" role="alert">{error}</Alert> : null}
          {initial.planId && plan.packageType === "addon" ? <Typography variant="body2">Existing purchases keep their saved package features and price. Publishing changes updates new selections.</Typography> : null}
          <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap", position: "sticky", bottom: 0, bgcolor: "background.paper", py: 1.5, borderTop: 1, borderColor: "divider" }}>
            <Button type="submit" variant="outlined">Save draft and close</Button>
            <Button type="button" variant="contained" onClick={() => submit("publish")}>Save and publish</Button>
            <Button type="button" onClick={cancel}>Cancel</Button>
          </Stack>
        </Stack>
      </Box>
    </Stack>
  </Box>;
}
