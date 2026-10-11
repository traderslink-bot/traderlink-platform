"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState, type ReactNode } from "react";
import { parseWatchlistBudgetUsd, watchlistBudgetUsdInput } from "@/src/modules/platform/contracts/membership-watchlist-budget";
import type { MembershipPlanPrice, MembershipPlanTrial, MembershipPlanDiscord, MembershipPlanProvider } from "@/src/modules/platform/contracts/membership-plan-editor";
import { membershipPriceRequiresProvider } from "@/src/modules/platform/contracts/membership-plan-editor";
import { PlanDiscordSelector } from "./unified-plan-discord-selector";

export function EditorGrid({ children }: { children: ReactNode }) {
  return <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2,minmax(0,1fr))" }, gap: 1.5, alignItems: "start" }}>{children}</Box>;
}
export function EditorText({ label, value, onChange, type = "text", hint, multiline = false }: {
  label: string; value: string; onChange: (value: string) => void; type?: string; hint?: string; multiline?: boolean;
}) {
  return <TextField fullWidth size="small" label={label} value={value} onChange={event => onChange(event.target.value)}
    type={type} helperText={hint} multiline={multiline} minRows={multiline ? 2 : undefined} />;
}
export function EditorCount({ label, value, onChange, hint }: { label: string; value: number | null; onChange: (value: number | null) => void; hint?: string }) {
  return <TextField fullWidth size="small" label={label} value={value === null ? "" : String(value)} type="number" helperText={hint}
    slotProps={{ htmlInput: { min: 0, step: 1, max: Number.MAX_SAFE_INTEGER } }}
    onChange={event => onChange(event.target.value === "" ? null : Number(event.target.value))} />;
}
export function EditorDelay({ value, onChange }: { value: number | null; onChange: (value: number | null) => void }) {
  const [unit, setUnit] = useState<"seconds" | "minutes">(() => value !== null && value % 60 !== 0 ? "seconds" : "minutes");
  const factor = unit === "minutes" ? 60 : 1;
  return <Stack direction="row" sx={{ gap: 1 }}>
    <TextField fullWidth size="small" label="Delay" type="number" value={value === null ? "" : value / factor}
      helperText="0 or blank: immediate."
      slotProps={{ htmlInput: { min: 0, step: "any", max: Math.floor(Number.MAX_SAFE_INTEGER / factor) } }}
      onChange={event => {
        const raw = event.target.value;
        const seconds = raw === "" ? null : Number(raw) * factor;
        event.target.setCustomValidity(seconds !== null && (!Number.isSafeInteger(seconds) || seconds < 0) ? "Choose a duration measured in whole seconds." : "");
        onChange(seconds);
      }} />
    <EditorSelect label="Time unit" value={unit} onChange={setUnit} options={[{ value: "minutes", label: "Minutes" }, { value: "seconds", label: "Seconds" }]} />
  </Stack>;
}
export function EditorBudget({ value, onChange }: { value: number | null; onChange: (value: number | null) => void }) {
  const [raw, setRaw] = useState(() => watchlistBudgetUsdInput(value));
  return <TextField fullWidth size="small" label="Generation budget (USD)" value={raw}
    helperText="Blank: unlimited. 0: none." onChange={event => {
      const next = event.target.value; setRaw(next);
      try { const parsed = parseWatchlistBudgetUsd(next); event.target.setCustomValidity(""); onChange(parsed); }
      catch { event.target.setCustomValidity("Enter a non-negative USD amount with at most six decimal places."); }
    }} />;
}
export function EditorSelect<T extends string>({ label, value, options, onChange }: {
  label: string; value: T; options: readonly { value: T; label: string }[]; onChange: (value: T) => void;
}) {
  return <TextField select fullWidth size="small" label={label} value={value} onChange={event => onChange(event.target.value as T)}>
    {options.map(option => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
  </TextField>;
}
export function EditorCheck({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <FormControlLabel sx={{ m: 0, alignItems: "center" }} control={<Checkbox size="small" checked={checked} onChange={event => onChange(event.target.checked)} />} label={label} />;
}

function TrialFields({ trial, onChange, remove }: { trial: MembershipPlanTrial; onChange: (value: MembershipPlanTrial) => void; remove: () => void }) {
  const set = <K extends keyof MembershipPlanTrial>(key: K, value: MembershipPlanTrial[K]) => onChange({ ...trial, [key]: value });
  return <Stack spacing={1.5} sx={{ border: 1, borderColor: "divider", borderRadius: 1, p: 1.5 }}>
    <EditorCheck label="Trial available" checked={trial.enabled} onChange={v => set("enabled", v)} />
    <EditorGrid>
      <EditorText label="Trial name" value={trial.name} onChange={v => set("name", v)} />
      <EditorCount label="Trial duration (days)" value={trial.durationDays} onChange={v => set("durationDays", v)} />
      <EditorText label="Trial price" value={trial.price} hint="0 for free; uses this option's currency." onChange={v => set("price", v)} />
      <EditorSelect label="After the trial" value={trial.endBehavior} onChange={v => set("endBehavior", v)} options={[
        { value: "end_access", label: "End trial access" }, { value: "renew", label: "Continue at this option's recurring price" }]} />
      <EditorSelect label="Who can repeat this trial?" value={trial.eligibility} onChange={v => set("eligibility", v)} options={[
        { value: "once_per_campaign", label: "Once for this trial" }, { value: "once_ever", label: "Once across all trials" },
        { value: "unlimited", label: "No repeat restriction" }, { value: "owner_only", label: "Only when I grant access" }]} />
      <EditorCount label="Maximum enrollments" value={trial.capacity} hint="Blank: unlimited." onChange={v => set("capacity", v)} />
      <EditorText label="Trial enrollment starts (UTC)" value={trial.startsAt} onChange={v => set("startsAt", v)} hint="Optional date and time." />
      <EditorText label="Trial enrollment ends (UTC)" value={trial.endsAt} onChange={v => set("endsAt", v)} hint="Optional date and time." />
    </EditorGrid>
    <EditorCheck label="Require a payment method" checked={trial.paymentMethodRequired} onChange={v => set("paymentMethodRequired", v)} />
    <EditorText label="External trial checkout link" value={trial.checkoutUrl} onChange={v => set("checkoutUrl", v)} hint="For external providers; must match these trial terms." />
    <Button color="error" onClick={remove} sx={{ alignSelf: "flex-start" }}>Remove trial from this configuration</Button>
  </Stack>;
}

function DiscordFields({ rule, onChange, remove }: { rule: MembershipPlanDiscord; onChange: (value: MembershipPlanDiscord) => void; remove: () => void }) {
  const set = <K extends keyof MembershipPlanDiscord>(key: K, value: MembershipPlanDiscord[K]) => onChange({ ...rule, [key]: value });
  return <Stack spacing={1.5} sx={{ border: 1, borderColor: "divider", borderRadius: 1, p: 1.5 }}>
    <EditorCheck label="Discord access enabled" checked={rule.enabled} onChange={v => set("enabled", v)} />
    <EditorGrid>
      <PlanDiscordSelector rule={rule} onChange={onChange} />
      <EditorSelect label="Access arrangement" value={rule.access} onChange={v => set("access", v)} options={[
        { value: "automatic_grant", label: "Automatically grant plan access" }, { value: "eligible_to_purchase", label: "Allow purchase at this price" }]} />
      <EditorSelect label="Payment arrangement" value={rule.funding} onChange={v => set("funding", v)} options={[
        { value: "sponsored", label: "Sponsored access" }, { value: "server_license", label: "Server license" }, { value: "member_paid", label: "Member pays" }]} />
      <EditorText label="Access starts (UTC)" value={rule.startsAt} onChange={v => set("startsAt", v)} />
      <EditorText label="Access ends (UTC)" value={rule.endsAt} onChange={v => set("endsAt", v)} />
    </EditorGrid>
    <details><summary>Discord verification</summary><EditorCount label="Refresh verification after (seconds)" value={rule.verificationSeconds} onChange={v => set("verificationSeconds", v ?? 300)} /></details>
    <Button color="error" onClick={remove} sx={{ alignSelf: "flex-start" }}>Remove Discord rule from this configuration</Button>
  </Stack>;
}

export function PlanPriceFields({ price, providers, onChange, remove }: { price: MembershipPlanPrice; providers: readonly MembershipPlanProvider[];
  onChange: (value: MembershipPlanPrice) => void; remove: () => void }) {
  const set = <K extends keyof MembershipPlanPrice>(key: K, value: MembershipPlanPrice[K]) => onChange({ ...price, [key]: value });
  return <Stack spacing={1.5} sx={{ border: 1, borderColor: "divider", borderRadius: 1, p: 2 }}>
    <EditorGrid>
      <EditorText label="Price or access option name" value={price.name} onChange={v => set("name", v)} />
      <EditorSelect label="Availability" value={price.channel} onChange={v => set("channel", v)} options={[
        { value: "website", label: "Website" }, { value: "discord", label: "Discord" }, { value: "both", label: "Website and Discord" }, { value: "private", label: "Private pages only" }]} />
      <EditorSelect label="Payment type" value={price.billing} onChange={v => onChange({ ...price, billing: v,
        accessDays: ["free", "one_time"].includes(v) ? price.accessDays : null })} options={[
        { value: "free", label: "Free" }, { value: "one_time", label: "One-time payment" }, { value: "recurring", label: "Recurring" }, { value: "lifetime", label: "Lifetime" }]} />
      <EditorCheck label="Available for new signups when published" checked={price.enabled} onChange={v => set("enabled", v)} />
      {membershipPriceRequiresProvider(price) ? <>
        <EditorSelect label="Payment provider" value={price.provider} options={[{ value: "", label: "Select provider" }, ...providers.map(p => ({ value: p.key, label: `${p.label} · ${p.state}` }))]} onChange={v => set("provider", v)} />
        <EditorText label="Currency" value={price.currency} onChange={v => set("currency", v.toUpperCase())} />
        {price.billing !== "free" ? <EditorText label="Initial price" value={price.initialPrice} onChange={v => set("initialPrice", v)} /> : null}
      </> : null}
      {price.billing === "recurring" ? <>
        <EditorText label="Renewal price" value={price.renewalPrice} onChange={v => set("renewalPrice", v)} />
        <EditorCount label="Bill every" value={price.intervalCount} onChange={v => set("intervalCount", v)} />
        <EditorSelect label="Billing period" value={price.interval} onChange={v => set("interval", v)} options={[
          { value: "day", label: "Days" }, { value: "week", label: "Weeks" }, { value: "month", label: "Months" }, { value: "year", label: "Years" }]} />
      </> : null}
      {["free", "one_time"].includes(price.billing) ? <EditorCount label="Access duration (days)" value={price.accessDays} hint="Blank: no expiry." onChange={v => set("accessDays", v)} /> : null}
    </EditorGrid>
    {membershipPriceRequiresProvider(price) ? <details><summary>Checkout connection</summary><Stack spacing={1.5} sx={{ mt: 1 }}>
      <EditorText label="Provider product reference" value={price.productRef} onChange={v => set("productRef", v)} />
      <EditorText label="Provider price reference" value={price.priceRef} onChange={v => set("priceRef", v)} />
      <EditorText label="Checkout link" value={price.checkoutUrl} onChange={v => set("checkoutUrl", v)} />
      <Typography variant="caption">Provider configuration is not proof of a completed payment test. Existing customers are not charged by saving this plan.</Typography>
    </Stack></details> : null}
    <Typography component="h3" variant="subtitle1">Trials</Typography>
    {price.trials.map((trial, index) => <TrialFields key={trial.id} trial={trial} onChange={value => set("trials", price.trials.map((t, i) => i === index ? value : t))} remove={() => set("trials", price.trials.filter((_, i) => i !== index))} />)}
    <Button sx={{ alignSelf: "flex-start" }} onClick={() => set("trials", [...price.trials, { id: crypto.randomUUID(), name: "", enabled: true,
      durationDays: 7, price: "0", paymentMethodRequired: false, eligibility: "once_per_campaign", capacity: null,
      startsAt: "", endsAt: "", checkoutUrl: "", endBehavior: "end_access" }])}>Add trial</Button>
    <Typography component="h3" variant="subtitle1">Discord access</Typography>
    {price.discord.map((rule, index) => <DiscordFields key={rule.id} rule={rule} onChange={value => set("discord", price.discord.map((r, i) => i === index ? value : r))} remove={() => set("discord", price.discord.filter((_, i) => i !== index))} />)}
    <Button sx={{ alignSelf: "flex-start" }} onClick={() => set("discord", [...price.discord, { id: crypto.randomUUID(), guildId: "", guildName: "", roleIds: [], roleNames: [],
      enabled: true, access: "eligible_to_purchase", funding: "member_paid", verificationSeconds: 300, startsAt: "", endsAt: "" }])}>Add Discord access</Button>
    <Button color="error" sx={{ alignSelf: "flex-start" }} onClick={remove}>Remove price or access option</Button>
  </Stack>;
}
