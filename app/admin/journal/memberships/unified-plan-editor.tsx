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

export type UnifiedPlanSaveResult = MembershipPlanSaveResult;
export type UnifiedPlanSaveRequest = MembershipPlanSaveRequest;

export function UnifiedPlanEditor({ initial, draftId, revision, features, providers, pages, memberCount, save, close }: {
  initial: MembershipPlanEditor; draftId: string | null; revision: number | null;
  features: readonly MembershipPlanFeatureChoice[]; providers: readonly MembershipPlanProvider[];
  pages: readonly { id: string; name: string }[]; memberCount: number;
  save: (request: UnifiedPlanSaveRequest) => Promise<UnifiedPlanSaveResult>; close: (message?: string) => void;
}) {
  const [plan, setPlan] = useState(() => structuredClone(initial));
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
            <EditorText label="Plan name" value={plan.name} onChange={value => set("name", value)} />
            <EditorSelect label="Visibility" value={plan.visibility} onChange={value => set("visibility", value)} options={[
              { value: "public", label: "Public plans page" }, { value: "private", label: "Private" }, { value: "unlisted", label: "Unlisted" }]} />
            <EditorText label="Plan description" value={plan.description} multiline onChange={value => set("description", value)} />
            <EditorText label="Internal note" value={plan.internalNote} multiline onChange={value => set("internalNote", value)} />
          </EditorGrid>
          <Typography component="h2" variant="h6">Features and allowances</Typography>
          <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap" }}>
            <Button onClick={() => set("features", features.filter(f => isMembershipPlanSelectableFeature(f.key)).map(f => plan.features.find(item => item.key === f.key)
              ?? { key: f.key, limit: f.key.includes("delay_seconds") ? 0 : null, resetDays: null, period: null, brief: null, details: null }))}>Select all features</Button>
            <Button onClick={() => set("features", [])}>Clear selection</Button>
          </Stack>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2,minmax(0,1fr))", xl: "repeat(3,minmax(0,1fr))" }, gap: 1 }}>
            {features.filter(feature => isMembershipPlanSelectableFeature(feature.key)).map(feature => {
              const selected = plan.features.find(item => item.key === feature.key);
              const privateMeter = ["private_watchlist.ticker_additions", "private_watchlist.generations", "private_watchlist.cost_microusd"].includes(feature.key);
              const dayMeter = ["trade_analyzer.analyses", "levels.generations"].includes(feature.key);
              return <Box key={feature.key} sx={{ border: 1, borderColor: selected ? "primary.main" : "divider", borderRadius: 1, p: 1, minWidth: 0 }}>
                <EditorCheck label={feature.label} checked={Boolean(selected)} onChange={checked => setPlan(current => ({ ...current,
                  features: checked ? [...current.features, { key: feature.key, limit: null, resetDays: null, period: null, brief: null, details: null }]
                    : current.features.filter(item => item.key !== feature.key) }))} />
                {selected ? <Stack spacing={1} sx={{ mt: 1 }}>
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
                    <EditorText label="Brief description" value={selected.brief ?? feature.brief} multiline onChange={brief => updateFeature(feature.key, { brief })} />
                    <EditorText label="Expandable details" value={selected.details ?? feature.details} multiline onChange={details => updateFeature(feature.key, { details })} />
                    <Button onClick={() => updateFeature(feature.key, { brief: null, details: null })}>Use shared descriptions</Button>
                  </Stack></details>
                </Stack> : null}
              </Box>;
            })}
          </Box>
          <Alert severity="info">Associated notifications are included automatically. Eligible notifications default to on; members can turn them off.
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
          <UnifiedPlanPreview plan={plan} features={features} />
          {issues.length ? <Stack spacing={0.5}>{issues.map((issue, index) => <Alert key={`${issue.path}:${index}`} severity={issue.blocking ? "warning" : "info"}>{issue.message}</Alert>)}</Stack>
            : <Alert severity="success">Configuration checks passed. Payment-provider transaction testing is a separate verification.</Alert>}
          {initial.planId ? <>
            <EditorCheck label={`Apply feature/access changes to existing members (${memberCount})`} checked={apply} onChange={setApply} />
            <Typography variant="body2">{apply ? "Updates this plan's member access when published. Existing charges, expiry dates, usage and unrelated grants remain unchanged." : "Existing members keep their current access. New signups use the published settings."}</Typography>
          </> : null}
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
