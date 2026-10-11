"use client";

import { useState, useTransition } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import type { MembershipPlanDiscord } from "@/src/modules/platform/contracts/membership-plan-editor";
import { loadPlanDiscordChoices } from "./unified-plan-discord-actions";

export function PlanDiscordSelector({ rule, onChange }: { rule: MembershipPlanDiscord; onChange: (rule: MembershipPlanDiscord) => void }) {
  const [servers, setServers] = useState<{ id: string; name: string }[]>([]);
  const [roles, setRoles] = useState<{ guild: string; items: { id: string; name: string }[] }>({ guild: "", items: [] });
  const [cursor, setCursor] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const choices = rule.guildId && !servers.some(item => item.id === rule.guildId)
    ? [{ id: rule.guildId, name: rule.guildName || `Saved server (${rule.guildId})` }, ...servers] : servers;
  function load(guildId?: string, after?: string) {
    setError("");
    start(async () => {
      try {
        const result = await loadPlanDiscordChoices({ ...(guildId ? { guildId } : {}), ...(after ? { after } : {}) });
        if (!result.value) { setError(result.error ?? "Discord discovery is unavailable."); return; }
        if (guildId) setRoles({ guild: guildId, items: result.value.items });
        else { setServers(current => after ? [...new Map([...current, ...result.value!.items].map(item => [item.id, item])).values()] : result.value!.items); setCursor(result.value.nextCursor); }
      } catch { setError("Discord discovery is unavailable. Your saved selections are unchanged."); }
    });
  }
  const availableRoles = roles.guild === rule.guildId ? roles.items : [];
  return <Stack spacing={1} sx={{ gridColumn: "1 / -1" }}>
    <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
      <TextField select size="small" fullWidth label="Discord server" value={rule.guildId} disabled={pending}
        onChange={event => { const id = event.target.value; onChange({ ...rule, guildId: id, guildName: choices.find(item => item.id === id)?.name ?? "", roleIds: [], roleNames: [] }); }}>
        <MenuItem value="">Choose a server</MenuItem>
        {choices.map(item => <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>)}
      </TextField>
      <Button disabled={pending} onClick={() => load()}>Refresh servers</Button>
      {cursor ? <Button disabled={pending} onClick={() => load(undefined, cursor)}>More servers</Button> : null}
      <Button disabled={pending || !rule.guildId} onClick={() => load(rule.guildId)}>Refresh roles</Button>
    </Stack>
    {pending ? <Alert severity="info" role="status">Loading Discord names…</Alert> : null}
    {error ? <Alert severity="warning">{error}</Alert> : null}
    <FormControlLabel label="Everyone in this server" control={<Checkbox checked={!rule.roleIds.length}
      onChange={(_, checked) => { if (checked) onChange({ ...rule, roleIds: [], roleNames: [] }); }} />} />
    {availableRoles.map(role => <FormControlLabel key={role.id} label={role.name} control={<Checkbox checked={rule.roleIds.includes(role.id)}
      onChange={(_, checked) => {
        const ids = checked ? [...rule.roleIds, role.id] : rule.roleIds.filter(id => id !== role.id);
        onChange({ ...rule, roleIds: ids, roleNames: ids.map(id => availableRoles.find(item => item.id === id)?.name ?? id) });
      }} />} />)}
    {rule.roleIds.filter(id => !availableRoles.some(role => role.id === id)).map(id => <FormControlLabel key={id}
      label={rule.roleNames[rule.roleIds.indexOf(id)] || `Saved role (${id})`} control={<Checkbox checked
        onChange={() => { const index = rule.roleIds.indexOf(id); onChange({ ...rule, roleIds: rule.roleIds.filter(value => value !== id), roleNames: rule.roleNames.filter((_, i) => i !== index) }); }} />} />)}
    <details><summary>Advanced server and role identifiers</summary>
      <Stack spacing={1} sx={{ mt: 1 }}>
        <TextField size="small" label="Server ID" value={rule.guildId} onChange={event => onChange({ ...rule, guildId: event.target.value, guildName: "", roleIds: [], roleNames: [] })} />
        <TextField size="small" label="Role IDs" value={rule.roleIds.join(", ")} helperText="Leave blank for everyone; separate IDs with commas."
          onChange={event => onChange({ ...rule, roleIds: [...new Set(event.target.value.split(/[\s,]+/).filter(Boolean))], roleNames: [] })} />
      </Stack>
    </details>
  </Stack>;
}
