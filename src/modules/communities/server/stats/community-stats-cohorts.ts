import type {
  CommunityStatsActivation, CommunityStatsCohortMember, CommunityStatsCohortRow,
  CommunityStatsMemberEvidence, CommunityStatsSurface, CommunityStatsWindow,CommunityStatsReturnCell,
} from "../../contracts/community-stats-contracts";
import {
  COMMUNITY_STATS_DAY_MS, resolveStatsWindow, statsDateAt, statsDateMs, statsMedian,
  statsMemberEligible, statsMemberPoints, statsSourceObserved, statsUtcMs,
} from "./community-stats-coverage";

type WebReturnRow=Readonly<{offsetDays:1|7|30;cohortMembers:number;pendingMembers:number;web:CommunityStatsReturnCell}>;
const emptyReturn=():CommunityStatsReturnCell=>({eligibleMembers:0,returnedMembers:0,unknownMembers:0,unlinkedMembers:0,ineligibleMembers:0});
function addReturn(left:CommunityStatsReturnCell,right:CommunityStatsReturnCell):CommunityStatsReturnCell{return {eligibleMembers:left.eligibleMembers+right.eligibleMembers,returnedMembers:left.returnedMembers+right.returnedMembers,unknownMembers:left.unknownMembers+right.unknownMembers,unlinkedMembers:left.unlinkedMembers+right.unlinkedMembers,ineligibleMembers:left.ineligibleMembers+right.ineligibleMembers};}

/** First recorded web visit within retained history; never a lifetime-first claim. */
export function calculateCommunityStatsWebReturnCohorts(communityId:string,evidence:CommunityStatsMemberEvidence,window:CommunityStatsWindow):readonly WebReturnRow[]{
  const bounds=resolveStatsWindow(window),observations=followupWindow(window),points=statsMemberPoints(evidence,observations).filter(point=>point.surface==="web"),first=points[0];
  const eligibleOrigin=evidence.communityId===communityId&&first&&statsUtcMs(first.occurredAtUtc)>=bounds.start&&statsUtcMs(first.occurredAtUtc)<bounds.end;
  return ([1,7,30] as const).map(offsetDays=>{
    const web={...emptyReturn()};if(!eligibleOrigin)return {offsetDays,cohortMembers:0,pendingMembers:0,web};
    const target=statsDateMs(first.occurredAtUtc.slice(0,10))+offsetDays*COMMUNITY_STATS_DAY_MS,until=target+COMMUNITY_STATS_DAY_MS;
    if(until>bounds.asOf)return {offsetDays,cohortMembers:1,pendingMembers:1,web};
    if(points.some(point=>point.occurredAtUtc.slice(0,10)===statsDateAt(target))){web.eligibleMembers=1;web.returnedMembers=1;return {offsetDays,cohortMembers:1,pendingMembers:0,web};}
    if(!statsMemberEligible(evidence,"web",target,until)){
      if(evidence.webLinkState==="unlinked")web.unlinkedMembers=1;else if(evidence.webLinkState==="verified")web.ineligibleMembers=1;else web.unknownMembers=1;
    }else if(!statsSourceObserved(evidence.coverage,communityId,"web",target,until))web.unknownMembers=1;
    else{web.eligibleMembers=1;if(points.some(point=>point.occurredAtUtc.slice(0,10)===statsDateAt(target)))web.returnedMembers=1;}
    return {offsetDays,cohortMembers:1,pendingMembers:0,web};
  });
}

/** Keep only counts and one delay per person, rather than every member's 90-day evidence in RAM. */
export class CommunityStatsCohortAccumulator{
  private nativeSeen=new Set<string>();private webSeen=new Set<string>();
  private native:readonly CommunityStatsCohortRow[];
  private web:readonly WebReturnRow[]=([1,7,30] as const).map(offsetDays=>({offsetDays,cohortMembers:0,pendingMembers:0,web:emptyReturn()}));
  private activation:{-readonly[K in keyof CommunityStatsActivation]:CommunityStatsActivation[K]};
  private discordDelays:number[]=[];private webDelays:number[]=[];private sequenceDelays:number[]=[];
  constructor(private readonly communityId:string,private readonly window:CommunityStatsWindow){this.native=calculateCommunityStatsReturnCohorts(communityId,[],window);this.activation={...calculateCommunityStatsActivation(communityId,[],window)};}
  addWebEvidence(evidence:CommunityStatsMemberEvidence):void{
    if(evidence.communityId!==this.communityId||this.webSeen.has(evidence.discordUserId))return;this.webSeen.add(evidence.discordUserId);
    const next=calculateCommunityStatsWebReturnCohorts(this.communityId,evidence,this.window);
    this.web=this.web.map((row,index)=>({...row,cohortMembers:row.cohortMembers+next[index].cohortMembers,pendingMembers:row.pendingMembers+next[index].pendingMembers,web:addReturn(row.web,next[index].web)}));
  }
  add(member:CommunityStatsCohortMember):void{
    if(this.nativeSeen.has(member.join.discordUserId))return;
    const one=calculateCommunityStatsActivation(this.communityId,[member],this.window);if(!one.observedJoinMembers)return;
    this.nativeSeen.add(member.join.discordUserId);
    for(const key of ["observedJoinMembers","discordActivatedMembers","webActivatedMembers","discordThenWebWithin7Days","webThenDiscordWithin7Days","simultaneousFirstObservations","bothObservedMoreThan7DaysApart","missingFirstObservationMembers","pendingCrossSurfaceMembers","unlinkedCrossSurfaceMembers","unknownCrossSurfaceMembers"] as const)this.activation[key]+=one[key];
    if(one.medianObservedJoinToDiscordHours!==null)this.discordDelays.push(one.medianObservedJoinToDiscordHours);
    if(one.medianObservedJoinToWebHours!==null)this.webDelays.push(one.medianObservedJoinToWebHours);
    if(one.medianDiscordThenWebHours!==null)this.sequenceDelays.push(one.medianDiscordThenWebHours);
    const next=calculateCommunityStatsReturnCohorts(this.communityId,[member],this.window);
    this.native=this.native.map((row,index)=>({...row,cohortMembers:row.cohortMembers+next[index].cohortMembers,pendingMembers:row.pendingMembers+next[index].pendingMembers,discord:addReturn(row.discord,next[index].discord),web:addReturn(row.web,next[index].web),membership:{eligibleMembers:row.membership.eligibleMembers+next[index].membership.eligibleMembers,retainedMembers:row.membership.retainedMembers+next[index].membership.retainedMembers,unknownMembers:row.membership.unknownMembers+next[index].membership.unknownMembers}}));
  }
  read():Readonly<{cohorts:readonly CommunityStatsCohortRow[];webCohorts:readonly WebReturnRow[];activation:CommunityStatsActivation}>{return {cohorts:this.native,webCohorts:this.web,activation:{...this.activation,medianObservedJoinToDiscordHours:statsMedian(this.discordDelays),medianObservedJoinToWebHours:statsMedian(this.webDelays),medianDiscordThenWebHours:statsMedian(this.sequenceDelays)}};}
}

function cohortMembers(
  communityId: string, members: readonly CommunityStatsCohortMember[], window: CommunityStatsWindow,
): readonly CommunityStatsCohortMember[] {
  const bounds = resolveStatsWindow(window);
  const result = new Map<string, CommunityStatsCohortMember>();
  for (const member of members) {
    const join = member.join, evidence = member.evidence;
    if (join.communityId !== communityId || evidence.communityId !== communityId
      || evidence.discordUserId !== join.discordUserId || join.kind !== "observed_join") continue;
    const joined = statsUtcMs(join.joinedAtUtc);
    if (joined < bounds.start || joined >= bounds.end) continue;
    // One observed initial join per person. Rejoin cohorts must be requested separately.
    const previous = result.get(join.discordUserId);
    if (!previous || previous.join.joinedAtUtc > join.joinedAtUtc) result.set(join.discordUserId, member);
  }
  return Object.freeze([...result.values()]);
}

function membershipAt(member: CommunityStatsCohortMember, at: number): boolean {
  return member.membership.some(interval => interval.communityId === member.join.communityId
    && interval.discordUserId === member.join.discordUserId
    && statsUtcMs(interval.fromUtc) <= at
    && (interval.untilUtc === null || statsUtcMs(interval.untilUtc) > at));
}

function followupWindow(window: CommunityStatsWindow): CommunityStatsWindow {
  // The date filter selects JOINERS. Follow-up can continue after that interval
  // until the actual as-of cutoff; otherwise a historical cohort never matures.
  return Object.freeze({ ...window, throughDate: statsDateAt(statsUtcMs(window.asOfUtc) - 1) });
}

/** Original join cohort, not current-member population; exact target UTC dates, never 'within N'. */
export function calculateCommunityStatsReturnCohorts(
  communityId: string, members: readonly CommunityStatsCohortMember[], window: CommunityStatsWindow,
): readonly CommunityStatsCohortRow[] {
  const bounds = resolveStatsWindow(window), cohort = cohortMembers(communityId, members, window);
  const observations = followupWindow(window);
  return Object.freeze(([1, 7, 30] as const).map(offsetDays => {
    const discord = { eligibleMembers: 0, returnedMembers: 0, unknownMembers: 0, unlinkedMembers: 0, ineligibleMembers: 0 };
    const web = { eligibleMembers: 0, returnedMembers: 0, unknownMembers: 0, unlinkedMembers: 0, ineligibleMembers: 0 };
    const membership = { eligibleMembers: 0, retainedMembers: 0, unknownMembers: 0 };
    let pendingMembers = 0;
    for (const member of cohort) {
      const evidence = member.evidence;
      const joined = statsUtcMs(member.join.joinedAtUtc);
      const target = statsDateMs(member.join.joinedAtUtc.slice(0, 10)) + offsetDays * COMMUNITY_STATS_DAY_MS;
      const until = target + COMMUNITY_STATS_DAY_MS;
      if (until > bounds.asOf) { pendingMembers += 1; continue; }
      const membershipKnown = statsSourceObserved(evidence.coverage, communityId, "membership", joined, until);
      if (membershipKnown) {
        membership.eligibleMembers += 1;
        if (membershipAt(member, until - 1)) membership.retainedMembers += 1;
      } else membership.unknownMembers += 1;
      const points = statsMemberPoints(evidence, observations);
      for (const surface of ["discord", "web"] as const) {
        const cell = surface === "discord" ? discord : web;
        const returned=points.some(point=>point.surface===surface&&point.occurredAtUtc.slice(0,10)===statsDateAt(target));
        if(returned){cell.eligibleMembers+=1;cell.returnedMembers+=1;continue;}
        const observed = statsSourceObserved(evidence.coverage, communityId, surface, target, until);
        if(surface==="discord"&&membershipKnown&&!statsMemberEligible(evidence,"discord",target,until)){cell.ineligibleMembers+=1;continue;}
        // Historical web linkage/access must cover the target date; current linkage is not a backfill.
        const webEligible = surface !== "web" || statsMemberEligible(evidence, "web", target, until);
        if (surface === "web" && !webEligible) {
          if (evidence.webLinkState === "unlinked") cell.unlinkedMembers += 1;
          else if (evidence.webLinkState === "verified") cell.ineligibleMembers += 1;
          else cell.unknownMembers += 1;
          continue;
        }
        if (!membershipKnown || !observed || !webEligible) { cell.unknownMembers += 1; continue; }
        cell.eligibleMembers += 1;
        if (points.some(point => point.surface === surface && point.occurredAtUtc.slice(0, 10) === statsDateAt(target))) cell.returnedMembers += 1;
      }
    }
    return Object.freeze({ offsetDays, cohortMembers: cohort.length, pendingMembers,
      discord: Object.freeze(discord), web: Object.freeze(web), membership: Object.freeze(membership) });
  }));
}

function firstObserved(
  evidence: CommunityStatsMemberEvidence, window: CommunityStatsWindow, surface: CommunityStatsSurface, joined: number,
): number | null {
  const point = statsMemberPoints(evidence, window).find(row => row.surface === surface && statsUtcMs(row.occurredAtUtc) >= joined);
  return point ? statsUtcMs(point.occurredAtUtc) : null;
}

/** Delays describe first OBSERVED activity. Continuity is required before calling a sequence known. */
export function calculateCommunityStatsActivation(
  communityId: string, members: readonly CommunityStatsCohortMember[], window: CommunityStatsWindow,
): CommunityStatsActivation {
  const bounds = resolveStatsWindow(window), cohort = cohortMembers(communityId, members, window);
  const observations = followupWindow(window);
  const discordDelays: number[] = [], webDelays: number[] = [], sequenceDelays: number[] = [];
  let discordActivatedMembers = 0, webActivatedMembers = 0, discordThenWebWithin7Days = 0;
  let webThenDiscordWithin7Days = 0, simultaneousFirstObservations = 0;
  let bothObservedMoreThan7DaysApart = 0, missingFirstObservationMembers = 0;
  let pendingCrossSurfaceMembers = 0, unlinkedCrossSurfaceMembers = 0, unknownCrossSurfaceMembers = 0;
  for (const member of cohort) {
    const evidence = member.evidence, joined = statsUtcMs(member.join.joinedAtUtc);
    const discord = firstObserved(evidence, observations, "discord", joined);
    const web = firstObserved(evidence, observations, "web", joined);
    if (discord !== null) { discordActivatedMembers += 1; discordDelays.push((discord - joined) / 3_600_000); }
    if (web !== null) { webActivatedMembers += 1; webDelays.push((web - joined) / 3_600_000); }
    const finish = discord !== null && web !== null ? Math.max(discord, web) + 1 : bounds.asOf;
    const known = finish > joined && statsSourceObserved(evidence.coverage, communityId, "discord", joined, finish)
      && statsSourceObserved(evidence.coverage, communityId, "web", joined, finish)
      && statsMemberEligible(evidence, "web", joined, finish)
      && statsMemberEligible(evidence, "discord", joined, finish);
    if (!known) {
      if (evidence.webLinkState === "unlinked" && !statsMemberEligible(evidence, "web", joined, finish)) unlinkedCrossSurfaceMembers += 1;
      else unknownCrossSurfaceMembers += 1;
      continue;
    }
    if (discord === null || web === null) {
      const origin = discord ?? web ?? joined;
      if (origin + 7 * COMMUNITY_STATS_DAY_MS > bounds.asOf) pendingCrossSurfaceMembers += 1;
      else missingFirstObservationMembers += 1;
      continue;
    }
    const delay = web - discord;
    if (delay === 0) simultaneousFirstObservations += 1;
    else if (delay > 0 && delay <= 7 * COMMUNITY_STATS_DAY_MS) {
      discordThenWebWithin7Days += 1; sequenceDelays.push(delay / 3_600_000);
    } else if (delay < 0 && -delay <= 7 * COMMUNITY_STATS_DAY_MS) webThenDiscordWithin7Days += 1;
    else bothObservedMoreThan7DaysApart += 1;
  }
  return Object.freeze({
    observedJoinMembers: cohort.length, discordActivatedMembers, webActivatedMembers,
    medianObservedJoinToDiscordHours: statsMedian(discordDelays), medianObservedJoinToWebHours: statsMedian(webDelays),
    discordThenWebWithin7Days, webThenDiscordWithin7Days, simultaneousFirstObservations,
    bothObservedMoreThan7DaysApart, missingFirstObservationMembers,
    pendingCrossSurfaceMembers, unlinkedCrossSurfaceMembers, unknownCrossSurfaceMembers,
    medianDiscordThenWebHours: statsMedian(sequenceDelays), attribution: "observed_sequence_only",
  });
}
