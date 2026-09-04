"use client";

import { useActionState } from "react";
import { Alert, Box, Button, FormControlLabel, MenuItem, Stack, Switch, TextField } from "@mui/material";
import { resetAnalyzerUsage, saveAnalyzerOverride, saveAnalyzerSettings } from "./analyzer-admin-actions";

type ActionState = Readonly<{ ok: boolean; message?: string }>;
const initial: ActionState = { ok: true };

export function AnalyzerSettingsControl({ model }: { model: Readonly<{
  settings: Readonly<{ enabled: boolean; dailyLimit: number; periodLimit: number; globalRolling24HourLimit: number; requestSpacingSeconds: number }>;
  designatedConnection: string;
  connections: readonly Readonly<{ userId: string; workspaceId: string; accountId: string; label: string }>[];
}> }) {
  const [state, action, pending] = useActionState(async (_: ActionState, form: FormData): Promise<ActionState> => saveAnalyzerSettings(form), initial);
  return <Box action={action} component="form"><Stack spacing={1.5}>
    {!state.ok ? <Alert severity="error">{state.message}</Alert> : null}
    <FormControlLabel control={<Switch defaultChecked={model.settings.enabled} name="enabled" />} label="Analyzer enabled" />
    <TextField defaultValue={model.settings.dailyLimit} label="Daily allowance" name="dailyLimit" type="number" />
    <TextField defaultValue={model.settings.periodLimit} label="30-day allowance" name="periodLimit" type="number" />
    <TextField defaultValue={model.settings.globalRolling24HourLimit} label="Global rolling 24-hour ceiling" name="globalLimit" type="number" />
    <TextField defaultValue={model.settings.requestSpacingSeconds} label="Request spacing seconds" name="spacingSeconds" type="number" />
    <TextField defaultValue={model.designatedConnection} label="Shared Moomoo connection" name="connection" required select>
      {model.connections.map((connection) => <MenuItem key={`${connection.workspaceId}:${connection.accountId}`} value={`${connection.userId}:${connection.workspaceId}:${connection.accountId}`}>{connection.label}</MenuItem>)}
    </TextField>
    <Button disabled={pending} type="submit" variant="contained">Save settings</Button>
  </Stack></Box>;
}

export function AnalyzerUserControl({ users }: { users: readonly Readonly<{
  userId: string; label: string; dailyOverride: number | null; periodOverride: number | null;
  availability: Readonly<{ dailyAvailable: number; periodAvailable: number; daysUntilReset: number }>;
}>[] }) {
  const [overrideState, overrideAction, overridePending] = useActionState(async (_: ActionState, form: FormData): Promise<ActionState> => saveAnalyzerOverride(form), initial);
  const [resetState, resetAction, resetPending] = useActionState(async (_: ActionState, form: FormData): Promise<ActionState> => resetAnalyzerUsage(form), initial);
  return <Stack spacing={2}>
    <Box action={overrideAction} component="form"><Stack spacing={1.25}>
      {!overrideState.ok ? <Alert severity="error">{overrideState.message}</Alert> : null}
      <TextField label="User" name="userId" required select>{users.map((user) => <MenuItem key={user.userId} value={user.userId}>{user.label} · {user.availability.dailyAvailable} today · {user.availability.periodAvailable} / {user.availability.daysUntilReset} days</MenuItem>)}</TextField>
      <TextField label="Daily override" name="dailyLimit" type="number" />
      <TextField label="30-day override" name="periodLimit" type="number" />
      <Button disabled={overridePending} type="submit" variant="outlined">Save user allowance</Button>
    </Stack></Box>
    <Box action={resetAction} component="form"><Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
      {!resetState.ok ? <Alert severity="error">{resetState.message}</Alert> : null}
      <TextField label="User" name="userId" required select sx={{ minWidth: 240 }}>{users.map((user) => <MenuItem key={user.userId} value={user.userId}>{user.label}</MenuItem>)}</TextField>
      <TextField defaultValue="daily" label="Reset" name="kind" select sx={{ minWidth: 150 }}><MenuItem value="daily">Daily</MenuItem><MenuItem value="period">30-day period</MenuItem></TextField>
      <Button disabled={resetPending} type="submit" variant="outlined">Reset usage</Button>
    </Stack></Box>
  </Stack>;
}
