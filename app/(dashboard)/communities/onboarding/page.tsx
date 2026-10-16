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
    database.prepare(`SELECT candidate.discord_guild_id guildId,candidate.guild_name guildName,
      community.slug connectedSlug FROM traderlink_community_discord_guild_candidates candidate
      LEFT JOIN traderlink_communities community ON community.discord_guild_id=candidate.discord_guild_id
        AND community.owner_user_id=candidate.user_id
      WHERE candidate.user_id=? AND candidate.guild_owner=1 ORDER BY candidate.guild_name`)
      .all(identity.scope.userId) as { guildId: string; guildName: string; connectedSlug: string | null }[]
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
