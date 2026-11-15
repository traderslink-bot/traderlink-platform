import { defaultPositions, widgets, type DesktopPositions } from "./scanner-desktop-layout";
import type { ScannerWorkspaceWidget as Widget } from "../scanner-workspace-layout";

export type Tile = Widget | { axis:"x"|"y"; ratio:number; first:Tile; second:Tile };
export type Rect = { x:number; y:number; w:number; h:number };
export const GAP = 8;
export const split = (axis:"x"|"y", first:Tile, second:Tile, ratio=0.5):Tile => ({axis,first,second,ratio});
export function cards(tile:Tile):Widget[] {
  return typeof tile==="string"?[tile]:[...cards(tile.first),...cards(tile.second)];
}

export function remove(tile:Tile, widget:Widget):Tile|null {
  if(typeof tile==="string")return tile===widget?null:tile;
  const first=remove(tile.first,widget), second=remove(tile.second,widget);
  return first&&second?{...tile,first,second}:first??second;
}

export function replace(tile:Tile, callback:(widget:Widget)=>Tile):Tile {
  return typeof tile==="string"?callback(tile):{...tile,first:replace(tile.first,callback),second:replace(tile.second,callback)};
}

export type Edge = "left"|"right"|"top"|"bottom";
export function dock(tile:Tile, widget:Widget, target:Widget|null, edge:Edge|"center"):Tile {
  if(target===widget)return tile;
  if(edge==="center")return target?replace(tile,key=>key===widget?target:key===target?widget:key):tile;
  const remaining=remove(tile,widget);
  if(!remaining)return widget;
  const insert=(other:Tile)=>edge==="left"||edge==="top"
    ?split(edge==="left"?"x":"y",widget,other)
    :split(edge==="right"?"x":"y",other,widget);
  return target?replace(remaining,key=>key===target?insert(key):key):insert(remaining);
}

export function minimum(tile:Tile, gap=GAP):{w:number;h:number} {
  if(typeof tile==="string")return tile==="ticker-workspace"?{w:300,h:200}:{w:180,h:124};
  const a=minimum(tile.first,gap),b=minimum(tile.second,gap);
  return tile.axis==="x"?{w:a.w+b.w+gap,h:Math.max(a.h,b.h)}:{w:Math.max(a.w,b.w),h:a.h+b.h+gap};
}

export type Divider = { path:string; axis:"x"|"y"; rect:Rect; available:number; lower:number; upper:number; size:number };
export function geometry(tile:Tile, bounds:Rect, gap=GAP) {
  const panels:Partial<Record<Widget,Rect>>={};
  const dividers:Divider[]=[];
  function visit(node:Tile,rect:Rect,path:string) {
    if(typeof node==="string"){panels[node]=rect;return;}
    const horizontal=node.axis==="x", dimension=horizontal?"w":"h";
    const available=rect[dimension]-gap;
    const lower=minimum(node.first,gap)[dimension], upper=available-minimum(node.second,gap)[dimension];
    const size=Math.max(lower,Math.min(upper,available*node.ratio));
    const divider=horizontal?{...rect,x:rect.x+size,w:gap}:{...rect,y:rect.y+size,h:gap};
    dividers.push({path,axis:node.axis,rect:divider,available,lower,upper,size});
    visit(node.first,{...rect,[dimension]:size},path+"0");
    visit(node.second,horizontal?{...rect,x:divider.x+gap,w:available-size}:{...rect,y:divider.y+gap,h:available-size},path+"1");
  }
  visit(tile,bounds,"");
  return {panels,dividers,bounds};
}

export function resize(tile:Tile,path:string,ratio:number):Tile {
  if(typeof tile==="string")return tile;
  if(!path)return {...tile,ratio};
  return path[0]==="0"?{...tile,first:resize(tile.first,path.slice(1),ratio)}:{...tile,second:resize(tile.second,path.slice(1),ratio)};
}

export function validTile(value:unknown):value is Tile {
  const seen=new Set<Widget>();
  function visit(node:unknown,depth:number):boolean {
    if(typeof node==="string"){
      const widget=node as Widget;
      if(!widgets.includes(widget)||seen.has(widget))return false;
      seen.add(widget);
      return true;
    }
    if(!node||typeof node!=="object"||depth>=widgets.length)return false;
    const {axis,ratio,first,second}=node as Exclude<Tile,Widget>;
    return (axis==="x"||axis==="y")&&Number.isFinite(ratio)&&ratio>0&&ratio<1&&visit(first,depth+1)&&visit(second,depth+1);
  }
  return visit(value,0);
}

export function fromGrid(positions:DesktopPositions,visible:Widget[]):Tile {
  if(visible.length===1)return visible[0];
  for(const axis of ["y","x"] as const){
    const dimension=axis==="x"?"w":"h";
    const lo=Math.min(...visible.map(key=>positions[key][axis]));
    const hi=Math.max(...visible.map(key=>positions[key][axis]+positions[key][dimension]));
    for(let cut=lo+1;cut<hi;cut++){
      const first=visible.filter(key=>positions[key][axis]+positions[key][dimension]<=cut);
      const second=visible.filter(key=>positions[key][axis]>=cut);
      if(first.length&&second.length&&first.length+second.length===visible.length)
        return split(axis,fromGrid(positions,first),fromGrid(positions,second),(cut-lo)/(hi-lo));
    }
  }
  const columns=[visible.slice(0,Math.ceil(visible.length/2)),visible.slice(Math.ceil(visible.length/2))];
  const stack=(items:Widget[]):Tile=>items.length===1?items[0]:split("y",items[0],stack(items.slice(1)),1/items.length);
  return split("x",stack(columns[0]),stack(columns[1]));
}

export const defaultTile=fromGrid(defaultPositions,widgets);
const column=(a:Widget,b:Widget,c?:Widget)=>c?split("y",a,split("y",b,c),1/3):split("y",a,b);
export const presets=[
  {name:"Chart + 3 cards",tile:split("x",split("x","gainers",column("momentum","top-losers")),"ticker-workspace")},
  {name:"Chart + 4 cards",tile:split("x",split("x",column("gainers","momentum"),column("top-losers","high-drops")),"ticker-workspace")},
  {name:"Chart + 6 cards",tile:split("x",split("x",column("gainers","momentum","market-events"),column("top-losers","high-drops","breakouts")),"ticker-workspace")},
];
