/** Reconcile delayed observer snapshots against the card's current, clipped layout. */
export function workspaceChartHasVisibleArea(node:HTMLElement):boolean{
 const win=node.ownerDocument.defaultView;
 if(!win)return false;
 const rect=node.getBoundingClientRect();
 let left=Math.max(0,rect.left),top=Math.max(0,rect.top),right=Math.min(win.innerWidth,rect.right),bottom=Math.min(win.innerHeight,rect.bottom);
 if(rect.width<=0||rect.height<=0||right<=left||bottom<=top)return false;
 for(let element:HTMLElement|null=node;element;element=element.parentElement){
  const style=win.getComputedStyle(element);
  if(style.display==='none'||style.visibility==='hidden'||style.visibility==='collapse')return false;
  if(element===node)continue;
  const clipX=/^(auto|scroll|hidden|clip)$/.test(style.overflowX||style.overflow);
  const clipY=/^(auto|scroll|hidden|clip)$/.test(style.overflowY||style.overflow);
  if(!clipX&&!clipY)continue;
  const bounds=element.getBoundingClientRect();
  if(clipX){left=Math.max(left,bounds.left);right=Math.min(right,bounds.right);}
  if(clipY){top=Math.max(top,bounds.top);bottom=Math.min(bottom,bounds.bottom);}
  if(right<=left||bottom<=top)return false;
 }
 return true;
}
