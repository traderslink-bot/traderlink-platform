import {notFound} from "next/navigation";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import {DashboardPage,DashboardPanel} from "@/app/dashboard-ui";
import {requireTraderLinkPlatformServerComponentPageIdentity} from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import {withReadonlyPlatformDatabase} from "@/src/modules/platform/server/database/open-readonly-platform-database";
import {CommunityLifecycleControls} from "../../community-lifecycle-controls";
export default async function CommunityRecoveryPage({params}:{params:Promise<{communitySlug:string}>}){
 const {communitySlug}=await params;const identity=await requireTraderLinkPlatformServerComponentPageIdentity();
 const row=withReadonlyPlatformDatabase({},db=>db.prepare(`SELECT c.display_name,c.discord_guild_id,l.removed_at_utc,l.recover_until_utc,l.configuration_purged_at_utc,l.bot_state FROM traderlink_communities c LEFT JOIN traderlink_community_lifecycle l ON l.community_id=c.community_id WHERE c.slug=? AND c.owner_user_id=?`).get(communitySlug,identity.scope.userId) as {display_name:string;discord_guild_id:string;removed_at_utc:string|null;recover_until_utc:string|null;configuration_purged_at_utc:string|null;bot_state:string|null}|undefined);
 if(!row)notFound();const clientId=process.env.TRADERLINK_COMMUNITIES_DISCORD_CLIENT_ID?.trim();const installUrl=clientId?`https://discord.com/oauth2/authorize?client_id=${encodeURIComponent(clientId)}&scope=bot%20applications.commands&permissions=3072&guild_id=${encodeURIComponent(row.discord_guild_id)}&disable_guild_select=true`:null;const recoverable=Boolean(row.removed_at_utc&&row.recover_until_utc&&row.recover_until_utc>new Date().toISOString()&&!row.configuration_purged_at_utc);
 return <DashboardPage><DashboardPanel title={row.display_name}><Stack spacing={2}><Typography>{row.removed_at_utc?recoverable?`Community removed. Settings can be recovered until ${row.recover_until_utc} (UTC).`:"Community removed. The settings recovery window has ended.":`Discord connection: ${row.bot_state??"not verified"}`}</Typography><Typography>Personal Journals remain untouched. Original coach/student participants retain read-only history.</Typography>{installUrl?<Button href={installUrl} target="_blank" rel="noreferrer">Install TraderLink Discord app</Button>:null}<CommunityLifecycleControls slug={communitySlug} removed={Boolean(row.removed_at_utc)} recoverable={recoverable}/><Button href="/communities">Back to Communities</Button><Button href={`/api/auth/discord/login?prompt=consent&returnTo=${encodeURIComponent(`/communities/${communitySlug}/recovery`)}`}>Refresh Discord ownership</Button></Stack></DashboardPanel></DashboardPage>;
}
