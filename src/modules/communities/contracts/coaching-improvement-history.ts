import {tradeCriterionKey,type TradeCriterion,type TradeEvaluation,type TradeEvaluationTemplate} from './coaching-trade-evaluation';
export type DeliveredTradeEvaluation=Readonly<{reviewId:string;roundTripId:string;logicalTradeId:string;accountId:string;tradeAtUtc:string;tradingDate:string;symbol:string;deliveredAtUtc:string;template:TradeEvaluationTemplate;evaluation:TradeEvaluation}>;
export type ImprovementObservation=Readonly<{id:string;trade:DeliveredTradeEvaluation;value:string|number|null;excludedReason:string|null}>;
export type ImprovementEvent=Readonly<{id:string;kind:'detected'|'early'|'continued'|'confirmed'|'recurring';label:string;atUtc:string;rule:string;minimum:number;matched:number;total:number;window:readonly ImprovementObservation[]}>;
export type StoredImprovementEvent=Readonly<{criterionKey:string;recordedAtUtc:string;sourceReviewId:string;event:ImprovementEvent}>;
export type ImprovementStatus='gathering'|'clear'|'attention'|'improving'|'confirmed'|'recurring';
export type CriterionHistory=Readonly<{key:string;criterion:TradeCriterion;template:TradeEvaluationTemplate;status:ImprovementStatus;observations:readonly ImprovementObservation[];numeric:readonly ImprovementObservation[];events:readonly ImprovementEvent[]}>;
export const IMPROVEMENT_STATUS_LABELS:Record<ImprovementStatus,string>={gathering:'Gathering evidence',clear:'No repeated low-score pattern detected',attention:'Needs attention',improving:'Early improvement',confirmed:'Improvement confirmed',recurring:'Recurring issue'};
/** Pure replay over immutable delivered snapshots; never writes, reads Journal or analyzes prose/P&L. */
export function projectImprovementHistory(delivered:readonly DeliveredTradeEvaluation[]):readonly CriterionHistory[]{
 const ordered=[...delivered].sort((a,b)=>a.tradeAtUtc.localeCompare(b.tradeAtUtc)||a.logicalTradeId.localeCompare(b.logicalTradeId)||a.deliveredAtUtc.localeCompare(b.deliveredAtUtc)||a.reviewId.localeCompare(b.reviewId)||a.roundTripId.localeCompare(b.roundTripId));
 const groups=new Map<string,{criterion:TradeCriterion;template:TradeEvaluationTemplate;observations:ImprovementObservation[];seen:Set<string>}>();
 for(const trade of ordered)for(const criterion of trade.template.criteria){const key=JSON.stringify([trade.accountId,tradeCriterionKey(trade.template,criterion)]);let group=groups.get(key);if(!group){group={criterion,template:trade.template,observations:[],seen:new Set()};groups.set(key,group);}
  const identity=JSON.stringify([trade.accountId,trade.logicalTradeId]);if(group.seen.has(identity))continue;group.seen.add(identity);
  const value=Object.hasOwn(trade.evaluation.answers,criterion.id)?trade.evaluation.answers[criterion.id]:null;
  const excludedReason=criterion.kind!=='rating'?'This field is retained as a response, not a numeric rating.':value===null?'Not assessed':value==='insufficient_information'?'Insufficient information':value==='not_assessed'?'Not assessed':typeof value!=='number'?'Not a numeric rating':null;
  group.observations.push({id:JSON.stringify([trade.reviewId,trade.roundTripId,criterion.id]),trade,value,excludedReason});
 }
 return [...groups].map(([key,group])=>{
  const numeric:ImprovementObservation[]=[],events:ImprovementEvent[]=[];let status:ImprovementStatus='gathering',onset=-1;
  const event=(kind:ImprovementEvent['kind'],label:string,window:readonly ImprovementObservation[],rule:string,minimum:number,high:boolean)=>{events.push({id:JSON.stringify([key,kind,window.map(item=>item.id)]),kind,label,atUtc:window.at(-1)!.trade.tradeAtUtc,rule,minimum,matched:window.filter(o=>typeof o.value==='number'&&(high?o.value>=4:o.value<=3)).length,total:window.length,window:[...window]});};
  for(const observation of group.observations){if(observation.excludedReason)continue;numeric.push(observation);const recent=numeric.slice(-6),low=recent.filter(o=>Number(o.value)<=3).length;
   if(status==='gathering'&&numeric.length>=6)status='clear';
   const wasConfirmed:boolean=(status as ImprovementStatus)==='confirmed';
   if(numeric.length>=6&&low>=5&&(status==='clear'||wasConfirmed)){const recurring:boolean=wasConfirmed;status=recurring?'recurring':'attention';onset=numeric.length-1;event(recurring?'recurring':'detected',recurring?'Issue recurred':'Repeated issue detected',recent,'At least 5 of the latest 6 comparable numeric scores are 3 or below.',6,false);continue;}
   if(onset>=0&&status!=='confirmed'){const later=numeric.slice(onset+1),last5=later.slice(-5),last3=later.slice(-3);
    if(later.length>=5&&last5.filter(o=>Number(o.value)>=4).length>=4){status='confirmed';event('confirmed','Improvement confirmed',last5,'At least 4 of the latest 5 post-detection scores are 4–5; at least 5 later observations.',5,true);}
    else if(later.length>=3&&last3.every(o=>Number(o.value)>=4)){if(status!=='improving')event('early','Early improvement',last3,'3 consecutive later comparable ratings are 4–5 after detection.',3,true);status='improving';}
    else if(status==='improving'){status='attention';event('continued','Issue remains open',last3,'The later high-score sequence did not continue; the original issue remains open.',3,true);}
   }
  }
  return {key,criterion:group.criterion,template:group.template,status,observations:group.observations,numeric,events};
 });
}
