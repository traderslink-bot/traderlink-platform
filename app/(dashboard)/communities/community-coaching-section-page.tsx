import Button from "@mui/material/Button";
import {loadCommunityRetainedHistory} from "./community-dashboard-loader";
import {CommunityRetainedHistoryPage} from "./community-retained-history";
import {isCoachingStaff} from "@/src/modules/communities/contracts/coaching-audience";
import {notFound,redirect} from "next/navigation";
import {CommunityDashboard} from "./community-dashboard";
import {loadCommunityDashboard} from "./community-dashboard-loader";
import {CommunityManagementDashboard} from "./community-management-dashboard";
import {readCommunityDiscordResources} from "@/src/modules/communities/server/community-discord-resources";
type SelectedSection="coaches"|"coaching"|"workspace"|"manage"|"roles"|"settings";
function resolveSection(parts:readonly string[]):SelectedSection{if(parts[0]==="manage"){if(parts.length===1)return "manage";if(parts.length===2&&(parts[1]==="roles"||parts[1]==="settings"))return parts[1];notFound();}if(parts.length!==1||!["coaches","coaching","workspace"].includes(parts[0]))notFound();return parts[0] as SelectedSection;}
export default async function CommunitySectionPage({params}:{params:Promise<{communitySlug:string;section:string[]}>}){
 const retainedHistory=await loadCommunityRetainedHistory();
 if(retainedHistory)return <CommunityRetainedHistoryPage history={retainedHistory}/>;
 const {communitySlug,section}=await params,resolved=resolveSection(section),loaded=await loadCommunityDashboard(communitySlug,`/communities/${communitySlug}/${section.join("/")}`),capabilities=loaded.snapshot.viewer.capabilities;
 if(resolved==="manage"||resolved==="roles"||resolved==="settings"){
  const allowed=loaded.snapshot.community.isOwner||capabilities.includes(resolved==="roles"?"community.roles.manage":"community.manage");
  if(!allowed)notFound();
  const discordResources=!loaded.isReview&&(resolved==="roles"||resolved==="settings")?await readCommunityDiscordResources(loaded.snapshot.community.discordGuildId,process.env.TRADERLINK_DISCORD_BOT_TOKEN??"", fetch, "community-owner-review").catch(()=>null):null;
  return <CommunityManagementDashboard snapshot={loaded.snapshot} section={resolved} isReview={loaded.isReview} discordResources={discordResources}/>;
 }
 if(resolved==="coaching"&&isCoachingStaff(capabilities))redirect(`/communities/${communitySlug}/workspace`);
 const allowed=(resolved==="coaches"&&(capabilities.includes("community.coaching.view")||capabilities.includes("community.coaching.offer")||capabilities.includes("community.coaching.manage_all")))||(resolved==="coaching"&&loaded.snapshot.relationships.some(item=>item.studentUserId===loaded.snapshot.viewer.userId))||(resolved==="workspace"&&(capabilities.includes("community.coaching.offer")||capabilities.includes("community.coaching.students")));
 if(!allowed)notFound();return <><CommunityDashboard isReview={loaded.isReview} section={resolved} snapshot={loaded.snapshot}/>{resolved==="coaching"?<Button href={`/communities/${communitySlug}/coaching?view=history`} variant="outlined">Open coaching history</Button>:null}</>;
}
