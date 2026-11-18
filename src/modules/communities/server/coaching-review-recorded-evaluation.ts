import type Database from 'better-sqlite3';
import type {TradeEvaluationTemplate} from '../contracts/coaching-trade-evaluation';
import type {PerformanceTemplate} from '../contracts/coaching-performance-evaluation';
import type {CoachingDayAssessment} from '../contracts/coaching-review-workspace';
import {coachingReviewService} from './coaching-review-service-binding';
import {coachingDayAssessments} from './coaching-review-day-assessments';

export type CommunityRecordedEvaluation=Readonly<{tradeEvaluationTemplate?:TradeEvaluationTemplate;performanceEvaluationTemplate?:PerformanceTemplate;dayAssessments:readonly CoachingDayAssessment[]}>;
/** Saved agreement and event evidence only: no live Journal or readiness evaluation. */
export function communityRecordedEvaluation(db:Database.Database,reviewId:string):CommunityRecordedEvaluation{
 const service=coachingReviewService(db,reviewId),id=service?.item.planItemId;
 const tradeEvaluationTemplate=id?service?.terms.tradeEvaluationTemplates?.[id]:undefined;
 const performanceEvaluationTemplate=id?service?.terms.performanceEvaluationTemplates?.[id]:undefined;
 return {...(tradeEvaluationTemplate?{tradeEvaluationTemplate}:{}),...(performanceEvaluationTemplate?{performanceEvaluationTemplate}:{}),dayAssessments:coachingDayAssessments(db,reviewId)};
}
