import type { SwingText } from "./swing-plan-contract";
export function sliceSwingRuns(runs:SwingText[],start:number,end:number):SwingText[]{
  let offset=0;return runs.flatMap(run=>{const from=Math.max(0,start-offset),to=Math.min(run.text.length,end-offset);offset+=run.text.length;return to>from?[{...run,text:run.text.slice(from,to)}]:[];});
}
export function replaceSwingText(runs:SwingText[],text:string):SwingText[]{
  const old=runs.map(r=>r.text).join("");let first=0,last=0;
  while(first<Math.min(old.length,text.length)&&old[first]===text[first])first++;
  while(last<Math.min(old.length-first,text.length-first)&&old[old.length-1-last]===text[text.length-1-last])last++;
  const inherited=sliceSwingRuns(runs,first?first-1:0,first||1)[0];
  return [...sliceSwingRuns(runs,0,first),{...inherited,text:text.slice(first,text.length-last)},...sliceSwingRuns(runs,old.length-last,old.length)].filter(r=>r.text);
}
export function markSwingText(runs:SwingText[],start:number,end:number,mark:Partial<SwingText>):SwingText[]{
  if(start===end)return runs;
  return [...sliceSwingRuns(runs,0,start),...sliceSwingRuns(runs,start,end).map(r=>({...r,...mark})),...sliceSwingRuns(runs,end,Infinity)];
}
