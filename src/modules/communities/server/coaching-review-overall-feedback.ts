import type Database from 'better-sqlite3';
import {performancePrimitive} from '../contracts/coaching-performance-evaluation';
import {validateCoachingTradeFeedback} from '../contracts/coaching-trade-feedback';
import {coachingReviewService} from './coaching-review-service-binding';

/** Called only after the existing mutation's coach authorization and draft guard. */
export function communityPerformanceFeedback(db:Database.Database,reviewId:string,feedback:string):string|null{
 const service=coachingReviewService(db,reviewId);
 const template=service?.terms.performanceEvaluationTemplates?.[service.item.planItemId];
 return template?validateCoachingTradeFeedback(feedback,performancePrimitive(template)):null;
}
