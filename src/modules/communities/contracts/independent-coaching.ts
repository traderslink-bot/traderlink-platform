import {submissionAllowanceLabel} from './coaching-request-submission-limits';
import {requiresTradeReviewQuantity} from './coaching-trade-review-selection-policy';
import type { CoachingAgreement, CoachingAgreementTerms } from "./coaching-agreements";
import type { CoachingReviewKind, CoachingFocusFeedback } from "./coaching-review-workspace";
import {COACHING_REVIEW_FOCUS,coachingServiceFocus,reviewKindForPlanItem} from "./coaching-review-workspace";
import type {TraderLinkCommunityCoachingPlanItem} from "./traderlink-community-platform-contracts";
import type {MailboxAcknowledgement} from './independent-coaching-messages';
import type {IndependentCoachSocialLinks} from './independent-coaching-profile';
export {parseIndependentCoachProfile,parseIndependentCoachSocialLinks,parseIndependentCoachSocialUrl} from './independent-coaching-profile';
export type {IndependentCoachSocialLinks} from './independent-coaching-profile';

export type IndependentCoachProfile = Readonly<{displayName:string;headline:string;biography:string;deliverySummary:string;socialLinks?:IndependentCoachSocialLinks}>;
export type IndependentCoachingEnrollment = Readonly<{enrollmentId:string;contextId:string;planId:string;coachUserId:string;studentUserId:string;studentName:string;status:"pending"|"active"|"declined"|"ended"}>;
export type IndependentCoachingPlan = Readonly<{planId:string;contextId:string;revision:number;status:"draft"|"active"|"paused"|"archived";terms:CoachingAgreementTerms}>;
export type IndependentCoachingReviewDraft = Readonly<{performanceEvaluation?:import('./coaching-trade-evaluation').TradeEvaluation;overall?:string;nextSteps?:string;privateNotes?:string;focusFeedback?:CoachingFocusFeedback;goals?:string;daySessionFeedback?:import('./coaching-trading-day-evaluation').DaySessionFeedback;dayAssessments?:Readonly<Record<string,string>>}>;
export type IndependentCoachingReview = Readonly<{earlySubmissionAllowed?:boolean;reviewId:string;enrollmentId:string;agreementId:string;planItemId:string;occurrenceIndex:number;kind:CoachingReviewKind;journalAccountId:string|null;periodStart:string|null;periodEnd:string|null;dueAtUtc:string|null;submittedAtUtc:string|null;status:"awaiting_submission"|"ready"|"draft"|"delivered"|"cancelled";selectedDays:readonly string[];draft:IndependentCoachingReviewDraft;delivered:(Omit<IndependentCoachingReviewDraft,"privateNotes">&{performanceSnapshot?:import('./coaching-performance-evaluation').PerformanceSnapshot})|null;deliveredAtUtc:string|null}>;
/** Editor-only metadata; generic reviews, directory cards and student projections never acquire these fields. */
export type IndependentCoachingEditorBaselines=Readonly<{reviewId:string;fingerprint:string;selectionFingerprint?:string;trades:readonly Readonly<{roundTripId:string;fingerprint:string}>[]}>;
export type IndependentCoachingInsertedTrade=Readonly<{roundTripId:string;logicalTradeId:string;selectionSource:'coach';feedback:Record<string,unknown>;completed:boolean;fingerprint:string}>;
export type IndependentCoachingSelectedTrade=Omit<IndependentCoachingInsertedTrade,'selectionSource'>&Readonly<{selectionSource:'coach'|'student'|'unknown'}>;
export type IndependentCoachingFeedbackCommit=
 | Readonly<{kind:'review';reviewId:string;fingerprint:string;trades:readonly Readonly<{roundTripId:string;fingerprint:string;completed:boolean}>[]}>
 | Readonly<{kind:'trade';reviewId:string;roundTripId:string;fingerprint:string;completed:boolean}>
 | Readonly<{kind:'selection';reviewId:string;removedRoundTripId:string;selectionFingerprint:string;rows:readonly IndependentCoachingSelectedTrade[]}>
 | Readonly<{kind:'append';reviewId:string;requestedRoundTripIds:readonly string[];rows:readonly IndependentCoachingInsertedTrade[]}>;
export type IndependentCoachingFeedbackAcknowledgement=IndependentCoachingFeedbackCommit&Readonly<{protocol:'traderlink.coaching.feedback.v1';requestId:string}>;
export type IndependentCoachingActionResult={href?:string}|IndependentCoachingFeedbackAcknowledgement|MailboxAcknowledgement;
export type IndependentCoachingWorkspace = Readonly<{contextId:string;coachUserId:string;profile:IndependentCoachProfile;plans:readonly IndependentCoachingPlan[];enrollments:readonly IndependentCoachingEnrollment[];agreements:readonly CoachingAgreement[];reviews:readonly IndependentCoachingReview[]}>;

/** Display accepted service kinds without mislabelling included work as a review. */
export function independentCoachingServiceLabel(type:string):string{
 const labels:Readonly<Record<string,string>>={trade_review:'Trade review',trading_day_review:'Trading-day review',performance_review:'Performance review',strategy_review:'Strategy review',rules_review:'Rules review',risk_review:'Risk review',goal_review:'Goals review',journal_review:'Journal review',private_session:'One-to-one session',group_lesson:'Included lesson',questions:'Student questions',student_check_in:'Check-in',review_follow_up:'Review follow-up',custom_task:'Custom coaching'};
 return labels[type]??'Coaching service';
}

/** Describe this exact offer/agreement snapshot without consulting a newer plan. */
export function independentCoachingServicePresentation(terms:CoachingAgreementTerms,item:TraderLinkCommunityCoachingPlanItem,presentation:'offer'|'agreement'='agreement'):Readonly<{summary:string;details:readonly string[];reviewLimits:readonly string[]}>{
 const units:Record<TraderLinkCommunityCoachingPlanItem['measurementKind'],readonly [string,string]>={trades:['trade','trades'],trading_days:['trading day','trading days'],reviews:['review','reviews'],check_ins:['check-in','check-ins'],sessions:['session','sessions'],lessons:['lesson','lessons'],questions:['question','questions'],custom:['unit','units']};
 const unit=units[item.measurementKind]??units.custom,numbered=`${item.quantity} ${unit[item.quantity===1?0:1]}`;
 const tradeCount=item.itemType==='trade_review'&&item.measurementKind==='trades',dayCount=item.itemType==='trading_day_review'&&item.measurementKind==='trading_days';
 const requestLimits=!item.timelineEnabled?terms.builderConfig?.offers[item.itemType]?.submissionLimits:undefined;
 const quantity=tradeCount&&requestLimits?submissionAllowanceLabel(requestLimits.perPeriod,item.frequency):tradeCount?`${numbered} per review`:dayCount?`Up to ${numbered} per review`:item.itemType==='questions'&&item.measurementKind==='questions'?`${numbered} per period`:numbered;
 const positive=(value:unknown):value is number=>typeof value==='number'&&Number.isSafeInteger(value)&&value>0;
 const days=(value:number)=>`${value} ${value===1?'day':'days'}`;
 const offer=terms.builderConfig?.offers[item.itemType],isDay=item.itemType==='trading_day_review',review=reviewKindForPlanItem(item.itemType)!==null;
 const cap=isDay?offer?.tradeCap:undefined;
 const capLabel=isDay?(cap&&positive(cap.quantity)&&['per_day','per_review'].includes(cap.basis)?`Maximum ${cap.quantity} ${cap.quantity===1?'trade':'trades'} per ${cap.basis==='per_day'?'day':'review'}`:'Trade limit not specified'):null;
 const dayJournal=isDay?(item.reviewDepth==='complete_day'||offer?.includeDayJournal===true?'Trading-day Journal included':item.reviewDepth==='trades_only'?'Trades only':null):null;
 const summary=[offer?.tradeReviewFormat==='pack'?'Trade Review Pack':offer?.tradeReviewFormat==='recurring'?'Recurring Trade Reviews':independentCoachingServiceLabel(item.itemType),quantity,capLabel].filter(Boolean).join(' · '),details:string[]=[];
 if(tradeCount&&requestLimits)details.push('Send one or more trades at a time within the period allowance and any daily cap. Each submitted batch has its own deadline.');
 else if(tradeCount)details.push(presentation==='offer'||requiresTradeReviewQuantity(terms.tradeReviewSelectionPolicy,item)?'The stated number is required when enough eligible, previously unreviewed trades are available. The agreed shortage rule applies when fewer are available.':`This existing agreement sets a maximum of ${numbered} per review; a full selection is not required.`);
 const focus=coachingServiceFocus(item).map(key=>COACHING_REVIEW_FOCUS[key]).filter(Boolean);
 const depthAndFocus=[dayJournal,focus.length?`Focus: ${focus.join(', ')}`:null].filter(Boolean).join(' · ');
 if(depthAndFocus)details.push(depthAndFocus);
 const frequencies:Record<TraderLinkCommunityCoachingPlanItem['frequency'],string>={once:'One-time',weekly:'Weekly',every_two_weeks:'Every 2 weeks',monthly:'Monthly',custom:positive(terms.customIntervalDays)?`Every ${days(terms.customIntervalDays)}`:'Custom schedule'};
 const coverage:Record<TraderLinkCommunityCoachingPlanItem['coveragePeriod'],string>={single_item:item.itemType==='trade_review'?'Selected trades':isDay?'Selected trading days':'Selected review period',previous_7_days:'Previous 7 days',since_last_review:'Since the previous review',calendar_week:'Previous calendar week',previous_month:'Previous month',custom:positive(terms.coverageDays?.[item.planItemId])?`${terms.coverageDays![item.planItemId]}-day review period`:'Custom review period'};
 const selector:Record<TraderLinkCommunityCoachingPlanItem['selectionMode'],string>={not_applicable:'',student:'Student selects the work',coach:'Coach selects the work',coach_or_student:'Coach or student selects the work'};
 // Frequency remains an agreed fact even when automatic timeline creation is off.
 const schedule=[frequencies[item.frequency],review||item.coveragePeriod!=='single_item'?`Period: ${coverage[item.coveragePeriod]}`:null,review?selector[item.selectionMode]:null].filter(Boolean).join(' · ');
 if(schedule)details.push(offer?.reviewSchedule==='student_choice'?`${frequencies[item.frequency]} · Student chooses the review schedule when accepting`:schedule);
 if(item.itemType==='trade_review'&&!item.timelineEnabled&&offer?.submissionLimits){details.push(offer.tradeReviewFormat==='pack'?`Reviews in pack: ${offer.submissionLimits.perPeriod}`:`Trade allowance: ${submissionAllowanceLabel(offer.submissionLimits.perPeriod,item.frequency)}`);if(offer.submissionLimits.perDay!==undefined)details.push(`Maximum trades submitted per day: ${offer.submissionLimits.perDay}`);}
 if(offer?.reviewSchedule==='student_choice')details.push(`Deliver within: ${days(item.dueOffsetDays)} after the period ends or after work is sent, depending on the student’s choice`);
 else if(review&&positive(item.dueOffsetDays))details.push(`Turnaround: ${days(item.dueOffsetDays)} after ${item.timelineEnabled?(offer?.submissionSchedule?"the submission cutoff":"the scheduled period ends"):"submission"}`);
 if(offer?.deliveryDayCount)details.push(`Delivery days: ${offer.deliveryDayCount==='weekdays'?'Weekdays (Monday–Friday; weekends skipped)':'Calendar days (including weekends)'}`);
 if(item.timelineEnabled&&offer?.weeklySchedule==='monday'&&['weekly','every_two_weeks'].includes(item.frequency))details.push(offer.submissionSchedule?'Trading dates: Monday–Friday':'Review weeks: Monday–Sunday');
 if(item.timelineEnabled&&offer?.submissionSchedule&&['weekly','every_two_weeks'].includes(item.frequency))details.push(`Submission cutoff: ${offer.deliveryDayCount==='weekdays'?'Sunday':'Friday'} evening. You may start after submission; the deadline does not change.`);
 if(positive(item.plannedMinutes))details.push(`${item.plannedMinutes} ${item.plannedMinutes===1?'minute':'minutes'} per ${unit[0]}`);
 if((review||item.itemType==='review_follow_up')&&positive(item.followUpDays))details.push(`Follow-up window: ${days(item.followUpDays)} after the student marks the review read`);
 const description=offer?.details.trim();
 if(description&&description!==terms.description.trim()&&description!==summary&&!details.includes(description))details.push(description);
 return {summary,details,reviewLimits:[quantity,capLabel,dayJournal,...details.filter(detail=>detail.startsWith('Trade allowance:')||detail.startsWith('Reviews in pack:')||detail.startsWith('Maximum trades submitted per day:'))].filter((value):value is string=>Boolean(value))};
}
