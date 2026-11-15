import type {CoachingAgreementTerms} from '@/src/modules/communities/contracts/coaching-agreements';
import {requiresTradeReviewQuantity} from '@/src/modules/communities/contracts/coaching-trade-review-selection-policy';
import type {TraderLinkCommunityCoachingItemType, TraderLinkCommunityCoachingPlanItem} from '@/src/modules/communities/contracts/traderlink-community-platform-contracts';
import {COACHING_REVIEW_FOCUS, coachingServiceFocus, reviewKindForPlanItem} from '@/src/modules/communities/contracts/coaching-review-workspace';

export type AcceptedServicePresentation = Readonly<{
  planItemId: string;
  title: string;
  quantity: string;
  cadence: string;
  coverage: string | null;
  selection: string | null;
  turnaround: string | null;
  duration: string | null;
  followUpWindow: string | null;
  tradeLimit: string | null;
  journalCoverage: string | null;
  focus: readonly string[];
  details: string | null;
}>;

export type AcceptedServicesPresentation = Readonly<{
  description: string | null;
  commonCadence: string | null;
  services: readonly AcceptedServicePresentation[];
}>;

const TITLES: Record<TraderLinkCommunityCoachingItemType, string> = {
  trade_review: 'Trade review', trading_day_review: 'Trading-day review',
  performance_review: 'Performance review', journal_review: 'Journal review',
  rules_review: 'Rules review', strategy_review: 'Strategy review',
  risk_review: 'Risk review', goal_review: 'Goals review',
  student_check_in: 'Check-ins', review_follow_up: 'Review follow-up',
  private_session: 'One-to-one sessions', group_lesson: 'Lessons',
  questions: 'Student questions', custom_task: 'Custom coaching',
};
// Fulfillment and submission enforce these service units independently of a
// legacy measurement descriptor. Quantity never purchases N review records.
const UNITS: Record<TraderLinkCommunityCoachingItemType, readonly [string, string]> = {
  trade_review: ['trade', 'trades'], trading_day_review: ['trading day', 'trading days'],
  performance_review: ['review', 'reviews'], journal_review: ['review', 'reviews'],
  rules_review: ['review', 'reviews'], strategy_review: ['review', 'reviews'],
  risk_review: ['review', 'reviews'], goal_review: ['review', 'reviews'],
  student_check_in: ['check-in', 'check-ins'], review_follow_up: ['follow-up activity', 'follow-up activities'],
  private_session: ['session', 'sessions'], group_lesson: ['lesson', 'lessons'],
  questions: ['question', 'questions'], custom_task: ['activity', 'activities'],
};
const positive = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
const counted = (value: number, singular: string, plural: string) => `${value} ${value === 1 ? singular : plural}`;

function serviceCadence(terms: CoachingAgreementTerms, item: TraderLinkCommunityCoachingPlanItem): string {
  const labels: Record<typeof item.frequency, string> = {
    once: 'Once', weekly: 'Every week', every_two_weeks: 'Every 2 weeks', monthly: 'Every month',
    custom: positive(terms.customIntervalDays) ? `Every ${counted(terms.customIntervalDays, 'day', 'days')}` : 'Custom schedule not specified',
  };
  return labels[item.frequency];
}

function serviceCoverage(terms: CoachingAgreementTerms, item: TraderLinkCommunityCoachingPlanItem): string {
  const days = terms.coverageDays?.[item.planItemId];
  const labels: Record<typeof item.coveragePeriod, string> = {
    single_item: item.itemType === 'trade_review' ? 'Selected trades' : item.itemType === 'trading_day_review' ? 'Selected trading days' : 'Selected review period',
    previous_7_days: 'Previous 7 days', since_last_review: 'Since the previous review',
    calendar_week: 'Previous calendar week', previous_month: 'Previous month',
    custom: positive(days) ? `${days}-day period` : 'Custom period not specified',
  };
  return labels[item.coveragePeriod];
}

/** Presentation of the supplied accepted snapshot only; no newer plan or entitlement inference. */
export function presentAcceptedService(terms: CoachingAgreementTerms, item: TraderLinkCommunityCoachingPlanItem): AcceptedServicePresentation {
  const review = reviewKindForPlanItem(item.itemType) !== null;
  const unit = UNITS[item.itemType];
  let quantity = positive(item.quantity) ? counted(item.quantity, unit[0], unit[1]) : 'Not specified';
  if (positive(item.quantity)) {
    if (item.itemType === 'trade_review') quantity = requiresTradeReviewQuantity(terms.tradeReviewSelectionPolicy, item)
      ? `${quantity} per review when available; fewer only if fewer eligible trades are available.`
      : `Up to ${quantity} per review`;
    if (item.itemType === 'trading_day_review') quantity = `Up to ${quantity} per review`;
    if (review && item.itemType !== 'trade_review' && item.itemType !== 'trading_day_review') quantity = '1 review per agreed occurrence';
    if (item.itemType === 'questions') quantity = `Up to ${quantity} per agreed allowance`;
    if (item.itemType === 'review_follow_up') quantity = counted(item.quantity, 'follow-up activity', 'follow-up activities');
  }
  const subject = item.itemType === 'trade_review' ? 'trades' : item.itemType === 'trading_day_review' ? 'trading days and trades' : 'review period';
  const selectors: Record<typeof item.selectionMode, string> = {
    student: `The student selects and submits the ${subject}.`,
    coach: `The coach selects and submits the ${subject}.`,
    coach_or_student: `Either the coach or student selects and submits the ${subject}.`,
    not_applicable: 'Selection responsibility is not specified.',
  };
  const offer = terms.builderConfig?.offers[item.itemType];
  const dayReview = item.itemType === 'trading_day_review';
  const cap = dayReview ? offer?.tradeCap : undefined;
  const tradeLimit = dayReview
    ? cap && positive(cap.quantity) ? `Maximum ${counted(cap.quantity, 'trade', 'trades')} per ${cap.basis === 'per_day' ? 'day' : 'review'}` : 'Trade limit not specified'
    : null;
  const journalCoverage = dayReview
    ? item.reviewDepth === 'complete_day' || offer?.includeDayJournal === true ? 'Trading-day Journal' : item.reviewDepth === 'trades_only' ? 'Selected trades only' : null
    : null;
  const details = offer?.details;
  return {
    planItemId: item.planItemId, title: TITLES[item.itemType], quantity,
    cadence: serviceCadence(terms, item),
    coverage: review || item.coveragePeriod !== 'single_item' ? serviceCoverage(terms, item) : null,
    selection: review ? selectors[item.selectionMode] : null,
    turnaround: review && positive(item.dueOffsetDays)
      ? `Within ${counted(item.dueOffsetDays, 'day', 'days')} (${item.dueOffsetDays * 24} hours) of the first submission.` : null,
    duration: positive(item.plannedMinutes) ? `${counted(item.plannedMinutes, 'minute', 'minutes')} per ${unit[0]}` : null,
    followUpWindow: item.itemType === 'review_follow_up' && positive(item.followUpDays)
      ? `${counted(item.followUpDays, 'day', 'days')} after the student marks a delivered review as read.` : null,
    tradeLimit, journalCoverage,
    focus: review ? coachingServiceFocus(item).map(key => COACHING_REVIEW_FOCUS[key]) : [],
    details: details?.trim() && details.trim() !== terms.description.trim() ? details : null,
  };
}

export function presentAcceptedServices(terms: CoachingAgreementTerms): AcceptedServicesPresentation {
  const services = terms.items.map(item => presentAcceptedService(terms, item));
  const cadence = services[0]?.cadence ?? null;
  return {
    description: terms.description.trim() ? terms.description : null,
    commonCadence: cadence && services.every(service => service.cadence === cadence) ? cadence : null,
    services,
  };
}
