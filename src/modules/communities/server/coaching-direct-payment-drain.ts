/** One bounded pass per process; durable inbox leases remain the cross-process
 * authority. Keep network waits outside database connections/transactions. */
export function createCoachingPaymentDrain(processEvent:()=>Promise<'idle'|'completed'|'retry'>){
 let running=false;
 return async function drain():Promise<{completed:number;retried:number;overlap:boolean}>{
  if(running)return {completed:0,retried:0,overlap:true};
  running=true;let completed=0,retried=0;
  try{
   for(let count=0;count<5;count++){
    const result=await processEvent();if(result==='idle')break;
    if(result==='completed')completed++;else retried++;
   }
   return {completed,retried,overlap:false};
  }finally{running=false;}
 };
}
