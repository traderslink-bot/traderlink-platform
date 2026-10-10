import type Database from "better-sqlite3";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import { MembershipForm } from "./membership-form";
import { manageMembershipAction } from "./membership-actions";
import { MembershipMemberPicker } from "./member-picker";
import { formatPrivateWatchlistPeriod, type PrivateWatchlistPeriod } from "@/src/modules/platform/contracts/membership-private-watchlist-features";
import { formatWatchlistBudget } from "@/src/modules/platform/contracts/membership-watchlist-budget";

const meters = [
  ["ticker_additions", "Ticker additions"], ["generations", "Generations"],
  ["cost_microusd", "Generation budget (USD)"],
] as const;
function PeriodFields({ period = { kind: "calendar_month", days: null } }: { period?: PrivateWatchlistPeriod }) {
  return <>
    <TextField select name="periodKind" label="Allowance period" defaultValue={period.kind}>
      <MenuItem value="calendar_month">Calendar month (UTC)</MenuItem>
      <MenuItem value="days">Custom number of days</MenuItem>
      <MenuItem value="lifetime">No reset</MenuItem>
    </TextField>
    <TextField name="periodDays" label="Days per period" type="number" defaultValue={period.days ?? ""} slotProps={{ htmlInput: { min: 1, step: 1 } }} helperText="Used only for a custom-day period." />
  </>;
}

export function PrivateWatchlistAllowanceSettings({ database }: { database: Database.Database }) {
  if (!database.prepare("SELECT 1 FROM sqlite_schema WHERE type='table' AND name='platform_private_watchlist_plan_periods'").get()) {
    return <Typography sx={{ mb: 2 }}>Private Watchlist allowance settings require the pending storage migration. Private generation is not yet available.</Typography>;
  }
  const drafts = database.prepare(`SELECT v.plan_version_id id,p.name||' · version '||v.version_number label
FROM platform_membership_plan_versions v JOIN platform_membership_plans p ON p.plan_id=v.plan_id
WHERE v.lifecycle_state='draft' ORDER BY p.name,v.version_number`).all() as { id: string; label: string }[];
  const savedPeriods = database.prepare("SELECT plan_version_id,meter,period_kind kind,period_days days FROM platform_private_watchlist_plan_periods").all() as (PrivateWatchlistPeriod & { plan_version_id: string; meter: string })[];
  const overrides = database.prepare(`SELECT o.user_id,u.display_name,u.created_at_utc joined,o.meter,o.limit_value,
o.period_kind kind,o.period_days days,o.starts_at_utc,o.ends_at_utc FROM platform_private_watchlist_member_overrides o
JOIN platform_users u ON u.user_id=o.user_id ORDER BY u.display_name,o.meter`).all() as (PrivateWatchlistPeriod & {
    user_id: string; display_name: string; joined: string; meter: string; limit_value: number | null; starts_at_utc: string; ends_at_utc: string | null;
  })[];
  return <Stack spacing={3} sx={{ mb: 3 }}>
    <details><summary>Private Watchlist allowance periods</summary>
      <Typography>Set quantities in the plan draft. Metered allowances default to calendar months; active ticker slots do not reset.</Typography>
      {drafts.length ? drafts.map(draft => <details key={draft.id}><summary>{draft.label}</summary>{meters.map(([meter, label]) => {
        const period = savedPeriods.find(row => row.plan_version_id === draft.id && row.meter === meter);
        return <MembershipForm key={`${meter}:${period?.kind}:${period?.days}`} action={manageMembershipAction} label={`Save ${label.toLowerCase()} period`}>
        <input type="hidden" name="operation" value="private_watchlist_period" />
        <input type="hidden" name="planVersionId" value={draft.id} /><input type="hidden" name="meter" value={meter} />
        <Typography>{label}</Typography><PeriodFields period={period} />
      </MembershipForm>;
      })}</details>) : <Typography>Create a draft plan to configure its periods.</Typography>}
    </details>
    <details><summary>Private Watchlist member overrides</summary>
      <Typography>An override replaces this member&apos;s allowance for the chosen meter. It does not grant private Watchlist or card access.</Typography>
      <details><summary>Saved member overrides ({overrides.length})</summary>
        {overrides.length ? <ul>{overrides.map(row => <li key={`${row.user_id}:${row.meter}`}>
          {row.display_name} · joined {row.joined.slice(0, 10)} · {row.meter === "active_tickers" ? "Active ticker slots" : meters.find(([key]) => key === row.meter)?.[1]}:
          {" "}{row.meter === "cost_microusd" ? formatWatchlistBudget(row.limit_value) : row.limit_value ?? "Unlimited"}
          {row.meter !== "active_tickers" ? ` · ${formatPrivateWatchlistPeriod(row)}` : ""}
          {` · from ${row.starts_at_utc} · ${row.ends_at_utc ? `until ${row.ends_at_utc}` : "no expiry"}`}
        </li>)}</ul> : <Typography>No member overrides are saved.</Typography>}
      </details>
      {[...meters, ["active_tickers", "Active ticker slots"] as const].map(([meter, label]) => <details key={meter}><summary>{label}</summary><MembershipForm action={manageMembershipAction} label="Save member override">
        <input type="hidden" name="operation" value="private_watchlist_override" />
        <input type="hidden" name="meter" value={meter} /><input type="hidden" name="budgetUnit" value="USD" />
        <MembershipMemberPicker />
        <TextField name="limitValue" type="number" label={label} helperText="Blank: unlimited. 0: none."
          slotProps={{ htmlInput: { min: 0, step: meter === "cost_microusd" ? "0.000001" : 1 } }} />
        {meter === "active_tickers" ? <input type="hidden" name="periodKind" value="lifetime" /> : <PeriodFields />}
        <TextField name="startsAtUtc" label="Starts at (UTC)" helperText="Blank: now. Example 2026-10-06T12:00:00.000Z" />
        <TextField name="endsAtUtc" label="Ends at (UTC)" helperText="Blank: no expiry." />
      </MembershipForm></details>)}
      <MembershipForm action={manageMembershipAction} label="Remove member override">
        <input type="hidden" name="operation" value="private_watchlist_override_remove" />
        <MembershipMemberPicker />
        <TextField select name="meter" label="Allowance to restore to plan rules" defaultValue="ticker_additions">
          {meters.map(([key, label]) => <MenuItem key={key} value={key}>{label}</MenuItem>)}
          <MenuItem value="active_tickers">Active ticker slots</MenuItem>
        </TextField>
      </MembershipForm>
    </details>
  </Stack>;
}
