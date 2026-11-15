import type {DeliveryDayCount} from './coaching-delivery-calendar';
type ReviewDeadlineTerms=Readonly<{
 dueOffsetDays:number;
 selectionMode:"not_applicable"|"coach"|"student"|"coach_or_student";
 timelineEnabled:boolean;
}>;

function days(value:number,count?:DeliveryDayCount){if(count==='weekdays')return `${value} ${value===1?'weekday':'weekdays'} (Monday–Friday)`;return `${value} ${value===1?"day":"days"}`;}

export function coachingReviewDeadlineSentence(item:ReviewDeadlineTerms,count?:DeliveryDayCount,submissionSchedule?:'weekend_choice'):string{
 const deadline=days(item.dueOffsetDays,count);
 if(!item.timelineEnabled)return `${deadline} after the student submits the work.`;
 return `${deadline} after ${submissionSchedule?'the submission cutoff':'the review period ends'}.`;
}

export function coachingSubmittedReviewDeadlineSentence(value:number,count?:DeliveryDayCount):string{
 return `${days(value,count)} after the student submits the work.`;
}
