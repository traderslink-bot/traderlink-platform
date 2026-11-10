type MomentEntry={value:number;mean:number;m2:number};
/** Population deviation in O(n) time/O(period) space, without subtracting
 * nearly equal squared-price totals or scanning each full rolling window. */
export function rollingDeviation(values:readonly number[],period:number):(number|null)[]{
 const incoming:MomentEntry[]=[],outgoing:MomentEntry[]=[];
 const push=(stack:MomentEntry[],value:number)=>{
  const previous=stack.at(-1),count=stack.length+1;
  const mean=previous?previous.mean+(value-previous.mean)/count:value;
  stack.push({value,mean,m2:previous?previous.m2+(value-previous.mean)*(value-mean):0});
 };
 return values.map(value=>{
  push(incoming,value);
  if(incoming.length+outgoing.length>period){
   if(!outgoing.length)while(incoming.length)push(outgoing,incoming.pop()!.value);
   outgoing.pop();
  }
  if(incoming.length+outgoing.length<period)return null;
  const a=incoming.at(-1),b=outgoing.at(-1);
  if(!a)return Math.sqrt(Math.max(0,b!.m2/period));
  if(!b)return Math.sqrt(Math.max(0,a.m2/period));
  const delta=a.mean-b.mean;
  const combined=a.m2+b.m2+delta*delta*(incoming.length/period)*outgoing.length;
  return Math.sqrt(Math.max(0,combined/period));
 });
}
