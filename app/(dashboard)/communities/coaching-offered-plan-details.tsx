"use client";
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type {TraderLinkCommunityDashboardSnapshot as Snapshot} from '@/src/modules/communities/contracts/traderlink-community-platform-contracts';
import {PLAN_OFFERS,initialOfferSettings,offerSummary,type OfferSettings} from './coaching-plan-offers';
import {TradeEvaluationTemplateSummary} from '@/app/(member)/coaching/evaluation-template-summary';
import {PerformanceTemplateSummary} from '@/app/(member)/coaching/performance-template-editor';

export function CoachingOfferedPlanDetails({plan,showDeadlineRule=true}:{plan:Pick<Snapshot['plans'][number],'items'|'builderConfig'>;showDeadlineRule?:boolean}){
 return <Stack spacing={2}>{plan.items.map(item=>{
  const offer=PLAN_OFFERS.find(offer=>offer.type===item.itemType);
  if(!offer)return <Stack spacing={.5} key={item.planItemId}><Typography sx={{fontWeight:700}}>{item.itemType.replaceAll('_',' ')}</Typography><Typography>{item.quantity} {item.measurementKind.replaceAll('_',' ')}</Typography></Stack>;
  const config=plan.builderConfig?.offers[item.itemType];
  const settings:OfferSettings={...initialOfferSettings(offer),frequency:item.frequency,coverage:item.coveragePeriod,
   submissionSchedule:config?.submissionSchedule,weeklySchedule:config?.weeklySchedule,deliveryDayCount:config?.deliveryDayCount,tradeReviewFormat:config?.tradeReviewFormat,reviewSchedule:config?.reviewSchedule,quantity:String(item.quantity),dueDays:String(item.dueOffsetDays),minutes:item.plannedMinutes===null?'':String(item.plannedMinutes),
   maxTradesSubmittedPerDay:plan.builderConfig?.offers[item.itemType]?.submissionLimits?.perDay===undefined?"":String(plan.builderConfig.offers[item.itemType]!.submissionLimits!.perDay),selection:item.selectionMode==='not_applicable'?'coach_or_student':item.selectionMode,depth:item.reviewDepth,
   followUpEnabled:item.itemType!=='review_follow_up'&&item.followUpDays>0,followUpDays:String(item.followUpDays||3),focus:[...item.focusAreas??[]],timeline:item.timelineEnabled,
   tradeCapBasis:config?.tradeCap?.basis??'per_day',tradeCapQuantity:String(config?.tradeCap?.quantity??5),details:config?.details??'',resources:[...config?.resources??[]]};
  const tradeTemplate=plan.builderConfig?.tradeEvaluationTemplates?.[item.itemType],performanceTemplate=plan.builderConfig?.performanceEvaluationTemplates?.[item.itemType];
  return <Stack spacing={.5} key={item.planItemId}>
   <Typography component="h3" variant="h3">{offer.label}</Typography>
   {offerSummary(offer,settings).filter(line=>showDeadlineRule||!line.startsWith('Review due:')).map((line,index)=>{const colon=line.indexOf(':');return <Typography variant="body2" key={index}>{colon<0?line:<><Box component="span" sx={{fontWeight:700}}>{line.slice(0,colon)}:</Box>{line.slice(colon+1)}</>}</Typography>;})}
   {tradeTemplate?<Box component="details"><Box component="summary" sx={{cursor:'pointer',fontWeight:700}}>{tradeTemplate.name} details</Box><TradeEvaluationTemplateSummary hideTitle presentation="offer" templates={{[item.itemType]:tradeTemplate}}/></Box>:null}
   {performanceTemplate?<Box component="details"><Box component="summary" sx={{cursor:'pointer',fontWeight:700}}>{performanceTemplate.name} details</Box><PerformanceTemplateSummary hideTitle presentation="offer" template={performanceTemplate}/></Box>:null}
  </Stack>;
 })}</Stack>;
}
