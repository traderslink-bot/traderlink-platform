import {statsPublicationUnits,statsPublishedIn,statsContributorId} from "./community-stats-analysts";
import {statsSelectedChannels,statsChannelSql} from "./community-stats-channel-selection";
import "server-only";
import type Database from "better-sqlite3";
import type {CommunityStatsContent,CommunityStatsCoverage,CommunityStatsMemberEvidence,CommunityStatsReport,CommunityStatsRequestScope,CommunityStatsTableRow,CommunityStatsWindow} from "../../contracts/community-stats-contracts";
import {TraderLinkCommunityRepository} from "../traderlink-community-repository";
import {resolveStatsWindow,statsSourceObserved} from "./community-stats-coverage";

// Matches Communities > Manage > Team in traderlink-community-platform-repository.
// Classification is based on effective responsibilities, never Discord role names.
const responsibilities=new Set(["community.manage","community.team.manage","community.roles.manage","community.members.view","community.member_activity.view","community.analytics.view","community.discord.manage","community.alerts.create","community.alerts.manage_all","community.watchlists.publish_staff","community.watchlists.manage_all","community.coaching.offer","community.coaching.students","community.coaching.manage_all","community.referrals.view"]);
const permissionLabels:Readonly<Record<string,string>>={
  "community.view":"Access community","community.manage":"Manage community","community.team.manage":"Manage team","community.roles.manage":"Manage roles and access","community.members.view":"View members","community.member_activity.view":"View named activity","community.analytics.view":"View Stats","community.discord.manage":"Manage Discord publishing","community.alerts.create":"Publish alerts","community.alerts.manage_all":"Manage all alerts","community.alerts.view":"Access alerts","community.watchlists.publish_staff":"Publish server watchlists","community.watchlists.manage_all":"Manage all server watchlists","community.watchlists.view":"Access server watchlists","community.watchlists.share_own":"Share own watchlists","community.coaching.offer":"Work as a coach","community.coaching.students":"Manage coaching students","community.coaching.manage_all":"Manage community coaching","community.coaching.view":"Access coaching","community.referrals.view":"View referrals",
};
type Person={user_id:string;display_name:string;owner_user_id:string;membership_status:string|null};
type Totals={messages:number;reactions:number;visits:number;lastDiscord:string|null;lastWeb:string|null};
type Publication={n:number;last:string|null};
type Context={window:CommunityStatsWindow;page:number;pageSize:number;catalog:readonly CommunityStatsContent[];coverage:readonly CommunityStatsCoverage[];sources:readonly CommunityStatsTableRow[];evidence:(id:string)=>CommunityStatsMemberEvidence};

export function readCommunityStatsTeam(db:Database.Database,scope:CommunityStatsRequestScope,context:Context):Pick<CommunityStatsReport,"columns"|"rows"|"totalRows"|"sections"|"metrics"|"notes">{
  const selectedChannels=statsSelectedChannels(db,scope),channelScope=statsChannelSql(selectedChannels);
  const {window,page,pageSize,catalog,coverage}=context,bounds=resolveStatsWindow(window);
  const from=new Date(bounds.start).toISOString(),until=new Date(bounds.end).toISOString();
  const repository=new TraderLinkCommunityRepository(db);
  const people=db.prepare(`SELECT u.user_id,u.display_name,c.owner_user_id,m.status AS membership_status
    FROM traderlink_communities c JOIN platform_users u ON u.user_id IN (
      SELECT owner_user_id FROM traderlink_communities WHERE community_id=c.community_id
      UNION SELECT user_id FROM traderlink_community_memberships WHERE community_id=c.community_id AND status='active')
    LEFT JOIN traderlink_community_memberships m ON m.community_id=c.community_id AND m.user_id=u.user_id
    WHERE c.community_id=? ORDER BY CASE WHEN u.user_id=c.owner_user_id THEN 0 ELSE 1 END,u.display_name,u.user_id`).all(scope.communityId) as Person[];
  const team=people.map(person=>({...person,access:repository.resolveAccess(scope.communityId,person.user_id)}))
    .filter(person=>person.user_id===person.owner_user_id||person.access.capabilities.some(key=>responsibilities.has(key)));
  const selected=team.slice((page-1)*pageSize,page*pageSize),rows:CommunityStatsTableRow[]=[],publishing:CommunityStatsTableRow[]=[],participation:CommunityStatsTableRow[]=[],coaching:CommunityStatsTableRow[]=[];
  const contentIds=JSON.stringify(catalog.map(content=>content.id));
  const canManageCoaching=scope.isOwner||scope.capabilities.includes("community.coaching.manage_all");
  const observed=(source:"discord"|"web",left=bounds.start,right=bounds.end)=>statsSourceObserved(coverage,scope.communityId,source,left,right);
  const volume=(value:number,source:"discord"|"web",identity:boolean,left=bounds.start,right=bounds.end)=>identity&&(value>0||observed(source,left,right))?value:null;
  for(const person of selected){
    const identities=db.prepare(`SELECT DISTINCT auth_subject FROM platform_auth_identities WHERE user_id=? AND auth_provider='discord' AND status='active' ORDER BY auth_subject`).all(person.user_id) as {auth_subject:string}[];
    const discordId=identities.length===1?identities[0].auth_subject:null;
    const native=discordId?db.prepare(`SELECT username,display_name FROM community_stats_members WHERE community_id=? AND discord_user_id=? AND is_bot=0`).get(scope.communityId,discordId) as {username:string;display_name:string|null}|undefined:undefined;
    const assigned=db.prepare(`SELECT DISTINCT r.role_id,r.name FROM traderlink_community_roles r WHERE r.community_id=@community AND r.status='active' AND r.role_id IN (
      SELECT role_id FROM traderlink_community_member_role_assignments WHERE community_id=@community AND user_id=@user AND status='active'
      UNION SELECT mapping.role_id FROM traderlink_community_discord_role_mappings mapping JOIN platform_discord_memberships d ON d.user_id=@user AND d.guild_id=@guild
      WHERE mapping.community_id=@community AND mapping.status='active' AND(mapping.discord_role_id=@guild OR EXISTS(SELECT 1 FROM json_each(d.role_ids_json) current_role WHERE current_role.value=mapping.discord_role_id))) ORDER BY r.name,r.role_id`).all({community:scope.communityId,user:person.user_id,guild:scope.guildId}) as {role_id:string;name:string}[];
    const name=person.display_name,identity=discordId?native?.username??"n/a":"Account not linked";
    rows.push({"Team member":name,"Discord username":identity,"TraderLink roles":[...(person.user_id===person.owner_user_id?["Community owner"]:[]),...assigned.map(role=>role.name)].join("; ")||"No current role assignment","Effective permissions":person.access.capabilities.map(key=>permissionLabels[key]??key).join("; ")||"No effective permissions",Membership:person.membership_status??"Owner without active membership",userId:person.user_id});
    const units=statsPublicationUnits(catalog),cohort=units.filter(item=>statsPublishedIn(item,from,until));
    const owned=cohort.filter(item=>statsContributorId(item)===person.user_id);
    const unknown=units.some(item=>item.targetKind==="watchlist_item"&&!statsContributorId(item)&&(!item.publishedAtUtc||statsPublishedIn(item,from,until)));
    const personUnits=units.filter(item=>statsContributorId(item)===person.user_id);
    const alerts=owned.filter(item=>item.type==="alert"),watchlists=owned.filter(item=>item.type==="watchlist");
    publishing.push({"Team member":name,"Alerts published":personUnits.some(item=>item.type==="alert"&&!item.publishedAtUtc)?null:alerts.length,"Watchlists published":unknown||personUnits.some(item=>item.type==="watchlist"&&!item.publishedAtUtc)?null:watchlists.length,
      "Last alert published UTC":alerts.map(item=>item.publishedAtUtc!).sort().at(-1)??null,"Last watchlist published UTC":watchlists.map(item=>item.publishedAtUtc!).sort().at(-1)??null});
    const count=(left:string,right:string)=>db.prepare(`SELECT coalesce(sum(surface='discord' AND kind IN('message','thread_reply','forum_post')),0) AS messages,coalesce(sum(surface='discord' AND kind='reaction_add'),0) AS reactions,coalesce(sum(surface='web'),0) AS visits,max(CASE WHEN surface='discord' THEN occurred_at_utc END) AS lastDiscord,max(CASE WHEN surface='web' THEN occurred_at_utc END) AS lastWeb FROM community_stats_events WHERE ${channelScope} AND community_id=@community AND occurred_at_utc>=@from AND occurred_at_utc<@until AND((surface='discord' AND discord_user_id=@discord) OR(surface='web' AND platform_user_id=@user AND content_id IN(SELECT value FROM json_each(@contents))))`).get({community:scope.communityId,from:left,until:right,discord:discordId,user:person.user_id,contents:contentIds}) as Totals;
    const current=count(from,until);
    participation.push({"Team member":name,"Discord username":identity,"Discord messages":volume(current.messages,"discord",!!discordId),"Webpage visits":volume(current.visits,"web",true),"Last Discord contribution UTC":current.lastDiscord,"Last webpage visit UTC":current.lastWeb});
    if(canManageCoaching){
      const plans=db.prepare(`SELECT count(*) AS n FROM traderlink_community_coaching_plans p JOIN traderlink_community_coach_profiles c ON c.community_id=p.community_id AND c.coach_profile_id=p.coach_profile_id WHERE p.community_id=? AND c.user_id=? AND p.status='active'`).get(scope.communityId,person.user_id) as {n:number};
      const students=db.prepare(`SELECT count(DISTINCT student_user_id) AS n FROM traderlink_community_coaching_relationships WHERE community_id=? AND coach_user_id=? AND status='active' AND archived_at_utc IS NULL`).get(scope.communityId,person.user_id) as {n:number};
      const sessions=db.prepare(`SELECT count(*) AS n,max(completed_at_utc) AS last FROM traderlink_community_coaching_sessions WHERE community_id=? AND coach_user_id=? AND status='completed' AND completed_at_utc>=? AND completed_at_utc<?`).get(scope.communityId,person.user_id,from,until) as Publication;
      const reviews=db.prepare(`SELECT count(*) AS n,max(v.delivered_at_utc) AS last FROM traderlink_community_coaching_trade_reviews v JOIN traderlink_community_coaching_relationships r ON r.community_id=v.community_id AND r.relationship_id=v.relationship_id WHERE v.community_id=? AND r.coach_user_id=? AND v.delivered_at_utc>=? AND v.delivered_at_utc<?`).get(scope.communityId,person.user_id,from,until) as Publication;
      coaching.push({"Team member":name,"Active coaching plans":plans.n,"Active students":students.n,"Completed sessions":sessions.n,"Delivered reviews":reviews.n,"Last completed session UTC":sessions.last,"Last delivered review UTC":reviews.last});
    }
  }
  const section=(title:string,columns:string[],items:CommunityStatsTableRow[])=>({title,columns,rows:items,totalRows:team.length,page,pageSize});
  return {columns:["Team member","Discord username","TraderLink roles","Effective permissions"],rows,totalRows:team.length,
    sections:[section("Publishing",["Team member","Alerts published","Watchlists published","Last alert published UTC","Last watchlist published UTC"],publishing),section("Team activity",["Team member","Discord username","Discord messages","Webpage visits","Last Discord contribution UTC","Last webpage visit UTC"],participation),...(canManageCoaching?[section("Coaching",["Team member","Active coaching plans","Active students","Completed sessions","Delivered reviews","Last completed session UTC","Last delivered review UTC"],coaching)]:[])],
    metrics:[{label:"Team members",value:team.length,unit:"people",previous:null}],
    notes:["All dates and times are UTC.","Includes everyone assigned a TradersLink team role, including people without activity. Roles reflect current assignments.","Activity uses the selected dates. Active coaching plans and students are current totals."]};
}
