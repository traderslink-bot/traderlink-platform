import type {CommunityStatsReport} from "../../contracts/community-stats-contracts";

/** Synthetic design-review input only. Never imported by collection, production routes or reporting. */
export function createCommunityStatsReviewFixture():CommunityStatsReport{
  return {tab:"overview",window:{fromDate:"2026-10-01",throughDate:"2026-10-18",asOfUtc:"2026-10-18T12:00:00.000Z",timezone:"UTC",quietDays:7,calendar:"calendar_days"},communityName:"Synthetic review community",ready:true,scope:"community",canReadNamed:true,canReadMembers:true,canReadTeam:false,canExport:false,isOwner:false,
    sources:[{source:"web",status:"collecting","Since UTC":"2026-10-01T00:00:00.000Z","Checked UTC":"2026-10-18T12:00:00.000Z","Last event UTC":"2026-10-18T11:58:32.000Z",reason:null},{source:"discord",status:"gap","Since UTC":"2026-10-01T00:00:00.000Z","Checked UTC":"2026-10-18T12:00:00.000Z","Last event UTC":"2026-10-18T11:59:12.000Z",reason:"Synthetic reconnect interval"}],
    metrics:[{label:"Webpage visits",value:73,unit:"visits",previous:null},{label:"Webpage viewers",value:16,unit:"people",previous:null},{label:"Discord contributors",value:21,unit:"people",previous:null},{label:"Discord messages",value:148,unit:"messages",previous:null}],
    columns:["Discord username","Display name at visit","Page","Visited UTC"],rows:[{"Discord username":"review_member","Display name at visit":"Review member",Page:"Synthetic watchlist","Visited UTC":"2026-10-18T11:58:32.000Z"}],totalRows:1,page:1,pageSize:25,
    trend:[{date:"2026-10-16",web:19,discord:41},{date:"2026-10-17",web:24,discord:57},{date:"2026-10-18",web:30,discord:50}],segments:{both:9,discord_only:12,web_only:7,neither_observed:5,unlinked:3,insufficient_coverage:4},cohorts:[],activation:null,member:null,catalog:[],catalogTotal:0,catalogMatchTotal:0,sections:[],roles:[],notes:["All figures and identities in this fixture are synthetic. Native coverage includes a deliberate gap."]};
}
