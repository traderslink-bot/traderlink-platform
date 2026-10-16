"use client";

import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useRef, useState, useTransition } from "react";
import { CommunityPublicationForm } from "./community-publication-form";
import { connectCommunityWithFeedback } from "./community-setup-feedback-actions";
import { checkCommunityInstallation } from "./community-installation-actions";
import { COMMUNITY_INSTALLATION_MESSAGES, type CommunityInstallationStatus } from "@/src/modules/communities/contracts/community-installation-status";

export function CommunityInstallationSetup({ guildId, installUrl }: {guildId: string; installUrl: string | null}) {
  const [status, setStatus] = useState<CommunityInstallationStatus | null>(null);
  const [pending, startTransition] = useTransition();
  const checking = useRef(false);
  function recheck() {
    if (checking.current) return;
    checking.current = true;
    setStatus(null);
    startTransition(async () => {
      const form = new FormData();
      form.set("discordGuildId", guildId);
      try { setStatus(await checkCommunityInstallation(form)); }
      catch { setStatus({state: "unavailable", message: COMMUNITY_INSTALLATION_MESSAGES.unavailable}); }
      finally { checking.current = false; }
    });
  }
  return <Stack spacing={2}>
    <Alert role={status?.state === "unavailable" || status?.state === "owner_required" ? "alert" : "status"}
      severity={status?.state === "ready" || status?.state === "connected" ? "success" : status?.state === "unavailable" || status?.state === "owner_required" ? "error" : "info"}>
      {pending ? "Checking Discord app installation…" : status?.message ?? "Check whether the TraderLink Discord app is installed. After Discord authorization finishes, return to this tab and choose Recheck installation."}
    </Alert>
    <Button type="button" variant="outlined" disabled={pending} onClick={recheck}>Recheck installation</Button>
    {status?.state === "connected" && status.href ? <Button href={status.href} variant="contained">Manage community</Button> : <>
      {(!status || status.state === "not_installed") && !pending ? installUrl
        ? <Button href={installUrl} rel="noopener noreferrer" target="_blank" variant="outlined">Install TraderLink Discord app</Button>
        : <Typography>Discord installation is unavailable. Contact TraderLink support.</Typography> : null}
      <CommunityPublicationForm action={connectCommunityWithFeedback} disabled={pending || status?.state !== "ready"}>
        <input name="discordGuildId" type="hidden" value={guildId}/>
        <Button type="submit" variant="contained" disabled={pending || status?.state !== "ready"}>Connect server</Button>
      </CommunityPublicationForm>
    </>}
  </Stack>;
}

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
    </Stack> : <CommunityInstallationSetup key={guildId} guildId={guildId} installUrl={installUrl}/>}
  </Stack>;
}
