import { TRADERLINK_COMMUNITY_CAPABILITIES } from "../contracts/traderlink-community-contracts";
import type { TraderLinkCommunityDashboardSnapshot } from "../contracts/traderlink-community-platform-contracts";

const COMMUNITY_ID = "10000000-0000-4000-8000-000000000001";
const OWNER_ID = "10000000-0000-4000-8000-000000000002";
const COACH_ID = "10000000-0000-4000-8000-000000000003";
const STUDENT_ID = "10000000-0000-4000-8000-000000000004";
const EVERYONE_ID = "10000000-0000-4000-8000-000000000005";
const PREMIUM_ID = "10000000-0000-4000-8000-000000000006";
const COACH_PROFILE_ID = "10000000-0000-4000-8000-000000000007";
const PLAN_ID = "10000000-0000-4000-8000-000000000008";
const RELATIONSHIP_ID = "10000000-0000-4000-8000-000000000009";

export function createTraderLinkCommunityReviewFixture(): TraderLinkCommunityDashboardSnapshot {
  const now = "2026-09-05T14:30:00.000Z";
  const snapshot: TraderLinkCommunityDashboardSnapshot = {
    community: { communityId: COMMUNITY_ID, discordGuildId:"900001", slug: "review", displayName: "Momentum Trading Room", status: "active", isOwner: true, memberCount: 1842 },
    viewer: { userId: OWNER_ID, displayName: "Jordan", capabilities: TRADERLINK_COMMUNITY_CAPABILITIES, discordRoleIds: ["910001", "910002"] },
    alerts: Object.freeze([
      { alertId:"10000000-0000-4000-8000-000000000010",communityId:COMMUNITY_ID,slug:"nvda-opening-range",authorUserId:OWNER_ID,authorName:"Jordan",title:"NVDA opening range reclaim",symbol:"NVDA",body:"Watching the 119.40 reclaim with volume. The idea is invalid below the opening range low.",status:"published",audienceId:PREMIUM_ID,publishedAtUtc:now,createdAtUtc:now,updatedAtUtc:now },
      { alertId:"10000000-0000-4000-8000-000000000011",communityId:COMMUNITY_ID,slug:"spy-afternoon-levels",authorUserId:COACH_ID,authorName:"Maya Chen",title:"SPY afternoon levels",symbol:"SPY",body:"Key decision area is 548.20–548.60. Waiting for confirmation; no active trade call.",status:"published",audienceId:EVERYONE_ID,publishedAtUtc:"2026-09-05T12:10:00.000Z",createdAtUtc:now,updatedAtUtc:now },
    ]),
    watchlists: Object.freeze([
      { placementId:"10000000-0000-4000-8000-000000000012",communityId:COMMUNITY_ID,watchlistId:"10000000-0000-4000-8000-000000000013",authorUserId:OWNER_ID,authorName:"Jordan",title:"Friday momentum watch",audienceId:PREMIUM_ID,status:"published",sharedAtUtc:now },
      { placementId:"10000000-0000-4000-8000-000000000014",communityId:COMMUNITY_ID,watchlistId:"10000000-0000-4000-8000-000000000015",authorUserId:STUDENT_ID,authorName:"TinaTrades",title:"Community earnings ideas",audienceId:EVERYONE_ID,status:"published",sharedAtUtc:"2026-09-04T20:00:00.000Z" },
    ]),
    coaches: Object.freeze([
      { coachProfileId:COACH_PROFILE_ID,slug:"maya-chen",communityId:COMMUNITY_ID,userId:COACH_ID,displayName:"Maya Chen",headline:"Process-first momentum coaching",biography:"I help developing traders turn scattered ideas into repeatable preparation, execution, and review habits.",deliverySummary:"Weekly call, private Discord check-ins, and four detailed trade reviews each month.",capacity:18,activeStudents:14,status:"active" },
      { coachProfileId:"10000000-0000-4000-8000-000000000016",slug:"jordan",communityId:COMMUNITY_ID,userId:OWNER_ID,displayName:"Jordan",headline:"Small-cap execution reviews",biography:"Focused feedback for active small-cap traders.",deliverySummary:"Two review sessions each month plus written notes.",capacity:10,activeStudents:10,status:"paused" },
    ]),
    plans: Object.freeze([
      { planId:PLAN_ID,coachProfileId:COACH_PROFILE_ID,communityId:COMMUNITY_ID,name:"Momentum Accountability",description:"A practical monthly coaching relationship built around preparation, execution, and review.",cadence:"monthly",tradeReviewLimit:4,priceLabel:"$149 / month",paymentInstructions:"Payment and the coaching role are handled in the Momentum Trading Room Discord.",audienceId:PREMIUM_ID,status:"active" },
      { planId:"10000000-0000-4000-8000-000000000017",coachProfileId:COACH_PROFILE_ID,communityId:COMMUNITY_ID,name:"Weekly Trade Review",description:"One focused review each week for traders who want regular feedback.",cadence:"weekly",tradeReviewLimit:1,priceLabel:"$55 / week",paymentInstructions:"Contact the coaching team in Discord to arrange access.",audienceId:EVERYONE_ID,status:"active" },
    ]),
    relationships: Object.freeze([{ relationshipId:RELATIONSHIP_ID,communityId:COMMUNITY_ID,coachProfileId:COACH_PROFILE_ID,coachUserId:COACH_ID,studentUserId:STUDENT_ID,planId:PLAN_ID,status:"active",startedAtUtc:"2026-08-12T15:00:00.000Z",endedAtUtc:null }]),
    journalGrants: Object.freeze([{ grantId:"10000000-0000-4000-8000-000000000018",relationshipId:RELATIONSHIP_ID,communityId:COMMUNITY_ID,coachUserId:COACH_ID,studentUserId:STUDENT_ID,journalAccountId:"10000000-0000-4000-8000-000000000019",dataScope:"trades",status:"active",grantedAtUtc:"2026-08-12T15:05:00.000Z",revokedAtUtc:null }]),
    audiences: Object.freeze([
      { audienceId:EVERYONE_ID,communityId:COMMUNITY_ID,name:"Everyone",mode:"everyone",discordRoleIds:[],status:"active" },
      { audienceId:PREMIUM_ID,communityId:COMMUNITY_ID,name:"Premium members",mode:"discord_roles",discordRoleIds:["910002"],status:"active" },
    ]),
    channels: Object.freeze([
      { destinationId:"10000000-0000-4000-8000-000000000020",communityId:COMMUNITY_ID,name:"trade-alerts",discordChannelId:"920001",contentType:"alerts",status:"active" },
      { destinationId:"10000000-0000-4000-8000-000000000021",communityId:COMMUNITY_ID,name:"daily-watchlists",discordChannelId:"920002",contentType:"watchlists",status:"active" },
    ]),
    members: Object.freeze([
      { userId:OWNER_ID,displayName:"Jordan",membershipStatus:"active",lastVerifiedAtUtc:now,lastActiveAtUtc:now,roles:["Server owner"],capabilities:TRADERLINK_COMMUNITY_CAPABILITIES },
      { userId:COACH_ID,displayName:"Maya Chen",membershipStatus:"active",lastVerifiedAtUtc:now,lastActiveAtUtc:"2026-09-05T13:55:00.000Z",roles:["Analyst","Coach"],capabilities:["community.view","community.alerts.create","community.watchlists.publish_staff","community.coaching.offer","community.coaching.students"] },
      { userId:STUDENT_ID,displayName:"TinaTrades",membershipStatus:"active",lastVerifiedAtUtc:now,lastActiveAtUtc:"2026-09-05T12:42:00.000Z",roles:[],capabilities:["community.view","community.watchlists.share_own"] },
    ]),
    staffRoles:Object.freeze([
      {roleId:"10000000-0000-4000-8000-000000000024",name:"Admin",capabilities:["community.manage","community.team.manage","community.roles.manage","community.members.view","community.member_activity.view","community.analytics.view","community.discord.manage","community.alerts.create","community.alerts.manage_all","community.watchlists.publish_staff","community.watchlists.manage_all","community.coaching.manage_all","community.referrals.view"],discordRoleIds:["910001"]},
      {roleId:"10000000-0000-4000-8000-000000000025",name:"Trade Analyst",capabilities:["community.alerts.create","community.watchlists.publish_staff","community.analytics.view"],discordRoleIds:["910003"]},
      {roleId:"10000000-0000-4000-8000-000000000026",name:"Coach",capabilities:["community.coaching.offer","community.coaching.students"],discordRoleIds:["910004"]},
    ]),
    analytics: { views30Days:12840,uniqueMembers30Days:1261,alertViews30Days:5624,watchlistViews30Days:3988,coachingViews30Days:1042,topPages:Object.freeze([{path:"/communities/review/alerts",views:5624,uniqueMembers:1108},{path:"/communities/review/watchlists",views:3988,uniqueMembers:864},{path:"/communities/review/coaches",views:1042,uniqueMembers:412}]) },
    referrals: { attributedMembers:476,tier2Members:82,estimatedEarningsMinor:184650,currency:"USD",commissionLabel:"20%" },
  };
  return Object.freeze(snapshot);
}
