import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { DashboardPage, DashboardPanel } from "@/app/dashboard-ui";
import { requireTraderLinkPlatformServerComponentPageIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { isApprovedCommunityGuild } from "@/src/modules/communities/server/community-launch-policy";
import { onboardDiscordCommunityAction } from "../onboarding-actions";

export default async function CommunityOnboardingPage() {
  const identity = await requireTraderLinkPlatformServerComponentPageIdentity();
  const guilds = withReadonlyPlatformDatabase({}, database => (
    database.prepare("SELECT discord_guild_id guildId,guild_name guildName FROM traderlink_community_discord_guild_candidates WHERE user_id=? AND guild_owner=1 ORDER BY guild_name")
      .all(identity.scope.userId) as { guildId: string; guildName: string }[]
  ).filter(guild => isApprovedCommunityGuild(guild.guildId)));
  const clientId = process.env.TRADERLINK_COMMUNITIES_DISCORD_CLIENT_ID?.trim();
  const installUrl = clientId && /^\d{1,32}$/.test(clientId)
    ? `https://discord.com/oauth2/authorize?client_id=${clientId}&scope=bot%20applications.commands&permissions=3072`
    : null;
  return <DashboardPage>
    <Typography component="h1" variant="h1">Connect a Discord community</Typography>
    <DashboardPanel title="Server owner setup">
      <Stack spacing={2}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          {installUrl ? <Button href={installUrl} rel="noreferrer" target="_blank" variant="outlined">Install TraderLink Discord app</Button> : null}
          <Button href="/api/auth/discord/login?prompt=consent&returnTo=%2Fcommunities%2Fonboarding" variant="outlined">Refresh Discord servers</Button>
        </Stack>
        {guilds.length ? <form action={onboardDiscordCommunityAction}>
          <Stack spacing={2}>
            <TextField label="Discord server" name="discordGuildId" select required defaultValue={guilds[0].guildId}>
              {guilds.map(guild => <MenuItem key={guild.guildId} value={guild.guildId}>{guild.guildName}</MenuItem>)}
            </TextField>
            <TextField label="Community name" name="displayName" required/>
            <TextField label="URL name" name="slug" required/>
            <Button type="submit" variant="contained">Connect server</Button>
          </Stack>
        </form> : <Typography>No approved server available</Typography>}
      </Stack>
    </DashboardPanel>
  </DashboardPage>;
}
