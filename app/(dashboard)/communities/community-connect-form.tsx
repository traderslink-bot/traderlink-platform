"use client";

import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { CommunityPublicationForm } from "./community-publication-form";
import { connectCommunityWithFeedback } from "./community-setup-feedback-actions";

export function CommunityConnectForm({ guilds, clientId }: {
  guilds: readonly { guildId: string; guildName: string; connectedSlug?: string | null }[];
  clientId: string | null;
}) {
  const [guildId, setGuildId] = useState(guilds[0]?.guildId ?? "");
  const installUrl = clientId && /^\d{1,32}$/.test(clientId) && guildId
    ? `https://discord.com/oauth2/authorize?client_id=${clientId}&scope=bot%20applications.commands&permissions=3072&guild_id=${guildId}&disable_guild_select=true` : null;
  const connectedSlug = guilds.find(guild => guild.guildId === guildId)?.connectedSlug;
  return <Stack spacing={2}>
    <TextField label="Discord server" select required value={guildId} onChange={event => setGuildId(event.target.value)}>
      {guilds.map(guild => <MenuItem key={guild.guildId} value={guild.guildId}>{guild.guildName}</MenuItem>)}
    </TextField>
    {connectedSlug ? <Stack spacing={1}>
      <Typography role="status">Server connected</Typography>
      <Button href={`/communities/${encodeURIComponent(connectedSlug)}/manage`} variant="contained">Manage community</Button>
    </Stack> : <CommunityPublicationForm key={guildId} action={connectCommunityWithFeedback} disabled={!guilds.length}>
      <input name="discordGuildId" type="hidden" value={guildId}/>
      <Stack spacing={2}>
        {installUrl ? <Button href={installUrl} rel="noopener noreferrer" target="_blank" variant="outlined">Install TraderLink Discord app</Button> : <Typography>Discord installation is unavailable. Contact TraderLink support.</Typography>}
        <Button type="submit" variant="contained">Connect server</Button>
      </Stack>
    </CommunityPublicationForm>}
  </Stack>;
}
