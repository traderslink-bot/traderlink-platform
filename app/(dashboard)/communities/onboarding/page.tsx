import Button from "@mui/material/Button";

import Stack from "@mui/material/Stack";

import Typography from "@mui/material/Typography";
import { DashboardPage, DashboardPanel } from "@/app/dashboard-ui";
import { requireTraderLinkPlatformServerComponentPageIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { isApprovedCommunityGuild } from "@/src/modules/communities/server/community-launch-policy";
import { CommunityConnectForm } from "../community-connect-form";

export default async function CommunityOnboardingPage() {
  const identity = await requireTraderLinkPlatformServerComponentPageIdentity();
  const guilds = withReadonlyPlatformDatabase({}, database => (
    database.prepare("SELECT discord_guild_id guildId,guild_name guildName FROM traderlink_community_discord_guild_candidates WHERE user_id=? AND guild_owner=1 ORDER BY guild_name")
      .all(identity.scope.userId) as { guildId: string; guildName: string }[]
  ).filter(guild => isApprovedCommunityGuild(guild.guildId)));
  const clientId = process.env.TRADERLINK_COMMUNITIES_DISCORD_CLIENT_ID?.trim();
  return <DashboardPage>
    <Typography component="h1" variant="h1">Connect a Discord community</Typography>
    <DashboardPanel title="Server owner setup">
      <Stack spacing={2}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          <Button href="/api/auth/discord/login?prompt=consent&returnTo=%2Fcommunities%2Fonboarding" variant="outlined">Refresh Discord servers</Button>
        </Stack>
        {guilds.length ? <CommunityConnectForm guilds={guilds} clientId={clientId ?? null}/> : <Typography>No approved server available</Typography>}
      </Stack>
    </DashboardPanel>
  </DashboardPage>;
}
