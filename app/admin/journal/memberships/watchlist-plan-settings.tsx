import type Database from "better-sqlite3";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import { MembershipForm } from "./membership-form";
import { MembershipCheckbox } from "./membership-checkbox";
import { manageMembershipAction } from "./membership-actions";

export function WatchlistPlanSettings({ database }: { database: Database.Database }) {
  const plans = database.prepare("SELECT plan_id,name FROM platform_membership_plans ORDER BY name,plan_id").all() as { plan_id: string; name: string }[];
  const available = database.prepare("SELECT 1 FROM sqlite_schema WHERE type='table' AND name='platform_watchlist_plan_policies'").get();
  const policies = available ? database.prepare("SELECT symbol,control,mode FROM platform_watchlist_plan_policies ORDER BY symbol,control").all() as { symbol: string; control: string; mode: string }[] : [];
  const labels: Record<string, string> = { ticker: "Ticker visibility", analysis: "Trade analysis & preparation", levels: "Support, resistance & full ladder" };
  function form(policy?: (typeof policies)[number]) {
    const selected = policy ? (database.prepare("SELECT plan_id FROM platform_watchlist_plan_policy_plans WHERE symbol=? AND control=?").all(policy.symbol, policy.control) as { plan_id: string }[]).map(row => row.plan_id) : [];
    return <MembershipForm action={manageMembershipAction} label="Save ticker access">
      <input type="hidden" name="operation" value="watchlist_plan_policy" />
      {policy ? <><input type="hidden" name="symbol" value={policy.symbol} /><input type="hidden" name="control" value={policy.control} /></>
        : <><TextField required name="symbol" label="Ticker" /><TextField required select name="control" label="Feature" defaultValue="ticker">
          {Object.entries(labels).map(([key, label]) => <MenuItem key={key} value={key}>{label}</MenuItem>)}</TextField></>}
      <TextField required select name="mode" label="Access rule" defaultValue={policy?.mode ?? "legacy"}>
        <MenuItem value="legacy">Keep existing Premium setting</MenuItem>
        <MenuItem value="plans">Require any selected plan</MenuItem>
      </TextField>
      <Stack>{plans.map(plan => <MembershipCheckbox key={plan.plan_id} name="planId" value={plan.plan_id} label={plan.name} defaultChecked={selected.includes(plan.plan_id)} />)}</Stack>
      <Typography>Selected plans replace only this ticker&apos;s Premium rule for this feature. Website, Discord and owner-granted access to any selected plan count. Existing and future versions count. Selecting no plans allows only the owner. App-wide feature permissions still apply; owner-private tickers remain private.</Typography>
    </MembershipForm>;
  }
  return <details><summary>Watchlist ticker access</summary><Stack spacing={2} sx={{ my: 2 }}>
    {!available ? <Typography>Saving requires the Watchlist plan-control migration.</Typography> : null}
    <details><summary>Add or replace a ticker rule</summary>{form()}</details>
    {policies.map(policy => <details key={`${policy.symbol}:${policy.control}`}><summary>{policy.symbol} · {labels[policy.control]} · {policy.mode === "plans" ? "Selected plans" : "Existing Premium setting"}</summary>{form(policy)}</details>)}
  </Stack></details>;
}
