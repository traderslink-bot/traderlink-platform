export type StudentReplacementTrade=Readonly<{roundTripId:string;label:string;tradingDate:string|null}>;
export type StudentTradeReplacementState=Readonly<{kind:'trade'|'trading_day';selected:readonly (StudentReplacementTrade&{canReplace:boolean})[];choices:readonly StudentReplacementTrade[]}>;

import {coachingPeriod,type CoachingAgreementTerms} from './coaching-agreements';
import {submissionDate} from './coaching-request-submission-limits';
/** Replacements use the agreed selection window, not the dates of the old selection. */
export function studentTradeReplacementPeriod(terms:CoachingAgreementTerms,item:CoachingAgreementTerms['items'][number],review:{occurrenceIndex:number;submittedAtUtc:string|null;periodStart:string|null;periodEnd:string|null;selectedDays:readonly string[];kind:string},atUtc:string){
 const scheduled=coachingPeriod(terms,item,review.occurrenceIndex),days=[...review.selectedDays].sort();
 return {start:review.periodStart??scheduled?.start??days[0]??terms.startDate??submissionDate(review.submittedAtUtc??atUtc),end:review.periodEnd??scheduled?.end??days.at(-1)??submissionDate(atUtc)};
}
