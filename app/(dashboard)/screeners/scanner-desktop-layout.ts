import type { ScannerWorkspaceWidget } from "./scanner-workspace-layout";

export type CardPosition = { x:number; y:number; w:number; h:number };
export type DesktopPositions = Record<ScannerWorkspaceWidget,CardPosition>;
export const defaultPositions:DesktopPositions = {
  gainers:{x:0,y:0,w:1,h:1}, momentum:{x:1,y:0,w:1,h:1},
  "top-losers":{x:2,y:0,w:1,h:1}, "high-drops":{x:3,y:0,w:1,h:1},
  "market-events":{x:0,y:1,w:1,h:1}, breakouts:{x:1,y:1,w:1,h:1},
  "ticker-workspace":{x:2,y:1,w:2,h:1},
};
export const widgetNames = {
  gainers:"Top Gainers",momentum:"Momentum","top-losers":"Top Losers","high-drops":"HOD Drops",
  "market-events":"Market Events",breakouts:"Breakouts","ticker-workspace":"Chart",
};
export const widgets = Object.keys(defaultPositions) as ScannerWorkspaceWidget[];
export const desktopRows=(positions:DesktopPositions)=>Math.max(2,...widgets.map(key=>positions[key].y+positions[key].h));
const intersects=(a:CardPosition,b:CardPosition)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
export function validPositions(value:unknown):value is DesktopPositions {
  if(!value||typeof value!=="object")return false;
  const positions=value as DesktopPositions;
  return widgets.every((key,index)=>{
    const p=positions[key];
    return p&&[p.x,p.y,p.w,p.h].every(Number.isInteger)&&p.x>=0&&p.y>=0&&p.w>0&&p.h>0&&p.x+p.w<=4&&p.y+p.h<=4
      &&widgets.slice(0,index).every(other=>!intersects(p,positions[other]));
  });
}

export function placeCard(positions:DesktopPositions,widget:ScannerWorkspaceWidget,target:CardPosition,resize:boolean) {
  const collisions=widgets.filter(key=>key!==widget&&intersects(target,positions[key]));
  const next={...positions,[widget]:target};
  if(!resize&&collisions.length===1){
    const other=collisions[0];
    const {x,y}=positions[widget];
    next[other]={...positions[other],x,y};
  }
  if(resize&&collisions.length){
    const occupied=widgets.filter(key=>!collisions.includes(key)).map(key=>next[key]);
    for(const key of collisions){
      const original=positions[key];
      let replacement:CardPosition|undefined;
      for(let cell=0;cell<16&&!replacement;cell++){
        const candidate={...original,x:cell%4,y:Math.floor(cell/4)};
        if(candidate.x+candidate.w<=4&&candidate.y+candidate.h<=4&&!occupied.some(p=>intersects(p,candidate)))replacement=candidate;
      }
      if(!replacement)return null;
      next[key]=replacement;
      occupied.push(replacement);
    }
  }
  return validPositions(next)?next:null;
}
