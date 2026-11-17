"use client";
import type {CommunityStatsReport} from "@/src/modules/communities/contracts/community-stats-contracts";
import {CommunityStatsTable} from "./community-stats-tables";
import {statsDisplayDateUtc} from "./community-stats-presentation";

export function CommunityStatsMemberDetail({member,onClose,onPage,timelineExportUrl}:{member:NonNullable<CommunityStatsReport["member"]>;onClose:()=>void;onPage:(page:number)=>void;timelineExportUrl?:string}){
  return <section className="cs-panel" aria-label={`Activity for ${member.name}`}><div className="cs-panel-head"><h2>{member.name}</h2>{timelineExportUrl?<a className="cs-action" href={timelineExportUrl}>Export member timeline</a>:null}<button className="cs-action" onClick={onClose}>Close member</button></div>
    <dl><dt>Last Discord contribution</dt><dd>{statsDisplayDateUtc(member.participation.discord.lastObservedAtUtc)}</dd><dt>Last webpage visit</dt><dd>{statsDisplayDateUtc(member.participation.web.lastObservedAtUtc)}</dd></dl><h2>Activity totals</h2><CommunityStatsTable columns={["Measure","Current"]} rows={member.measures}/><h2>Activity timeline</h2><CommunityStatsTable columns={["Surface","Activity","Time UTC","Page","Name at event"]} rows={member.events}/><div className="cs-pager"><button className="cs-action" disabled={member.eventPage<=1} onClick={()=>onPage(member.eventPage-1)}>Previous activity</button><span className="cs-note">Page {member.eventPage} of {Math.max(1,Math.ceil(member.totalEvents/25))}</span><button className="cs-action" disabled={member.eventPage*25>=member.totalEvents} onClick={()=>onPage(member.eventPage+1)}>Next activity</button></div>
  </section>;
}
