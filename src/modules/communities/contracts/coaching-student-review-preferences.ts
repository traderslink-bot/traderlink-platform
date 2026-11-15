export type StudentReviewPreferences=Readonly<{olderTrades:'student_only'|'earliest_date';earliestDate?:string}>;
export function studentReviewPreferences(mode:unknown,date?:unknown):StudentReviewPreferences{
 if(mode===undefined||mode===null||mode===''||mode==='student_only')return {olderTrades:'student_only'};
 if(mode!=='earliest_date'||typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date)throw new Error('Choose the earliest date your coach may select trades from.');
 return {olderTrades:'earliest_date',earliestDate:date};
}
export function earlierTradeAllowed(preferences:StudentReviewPreferences|undefined,date:string,studentChoosing:boolean,studentSelected=false){
 return studentChoosing||studentSelected||Boolean(preferences?.olderTrades==='earliest_date'&&preferences.earliestDate&&date>=preferences.earliestDate);
}
/** An approved earliest date is an absolute coach-selection boundary. */
export function coachTradeDateAllowed(preferences:StudentReviewPreferences|undefined,date:string,periodStart:string|null,studentChoosing:boolean,studentSelected=false){
 if(studentChoosing||studentSelected)return true;
 if(preferences?.olderTrades==='earliest_date')return Boolean(preferences.earliestDate&&date>=preferences.earliestDate);
 return !periodStart||date>=periodStart;
}
