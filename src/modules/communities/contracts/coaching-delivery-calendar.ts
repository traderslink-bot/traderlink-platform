export type DeliveryDayCount='calendar'|'weekdays';
export function nextReviewMonday(date:string):string{
 const at=new Date(`${date}T00:00:00.000Z`);if(!Number.isFinite(at.getTime()))throw new Error('Choose a valid service start date.');
 at.setUTCDate(at.getUTCDate()+(8-at.getUTCDay())%7);return at.toISOString().slice(0,10);
}
/** Weekdays exclude Saturday and Sunday only; public holidays remain delivery days. */
export function addDeliveryDays(date:string,days:number,count:DeliveryDayCount='calendar'):string{
 if(!Number.isInteger(days)||days<0||days>366)throw new Error('Set delivery days from 0 to 366.');
 const at=new Date(`${date}T00:00:00.000Z`);if(!Number.isFinite(at.getTime()))throw new Error('Choose a valid delivery date.');
 for(let remaining=days;remaining>0;){at.setUTCDate(at.getUTCDate()+1);if(count==='calendar'||![0,6].includes(at.getUTCDay()))remaining--;}
 return at.toISOString().slice(0,10);
}
