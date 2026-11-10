import {parseCalendarSessions,type ChartCalendar} from './chart-calendar';
export function parseChartCalendarYear(query:URLSearchParams):number{
 const value=query.get('year');if(!value||!/^\d{4}$/.test(value)||Number(value)<1970)throw Error('invalid_calendar_year');return Number(value);
}
/** Accept full verified years only; a partial response must not mark holidays as known. */
export function readChartCalendarYear(value:unknown,year:number):ChartCalendar{
 if(!Number.isInteger(year)||year<1970||year>9999||!value||typeof value!=='object')throw Error('invalid_calendar_year');
 const row=value as ChartCalendar,start=`${year}-01-01`,end=`${year}-12-31`;
 if(!row.available||row.start!==start||row.end!==end)throw Error('calendar_year_unavailable');
 const sessions=parseCalendarSessions(row.sessions,start,end);if(sessions.length<200)throw Error('calendar_year_incomplete');
 return {available:true,start,end,sessions};
}
