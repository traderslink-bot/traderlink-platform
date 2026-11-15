"use client";

import EditOutlined from "@mui/icons-material/EditOutlined";
import ChevronRight from "@mui/icons-material/ChevronRight";
import SettingsOutlined from "@mui/icons-material/SettingsOutlined";
import { Box, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, Divider, FormControlLabel, IconButton, Menu, MenuItem, TextField } from "@mui/material";
import { useEffect, useId, useRef, useState, useSyncExternalStore, type PointerEvent } from "react";
import { anchorCounts, applyDrawingChanges, drawingStoragePrefix, positionDefaultColor, drawingsNeedSaving, drawingTools, drawingStamps, isDrawingStamp, isPatternTool, fibonacciStyleControls, fibonacciStyleValue, isFibonacciCurve, isFibonacciDrawing, isFibonacciProjection, validFibonacciBase, validFibonacciChannelWidth, validFibonacciCurveBase, validFibonacciWedge, gannFixedCorner, gannStyleControls, gannStyleValue, isGann, validGannAnchors, isAnnotation, isFreehand, isPolyline, isPosition, isPitchfork, isTextDrawing, positionLevels, validPositionAnchor, MAX_PATH_POINTS, MAX_STROKE_POINTS,
  persistDrawings, readDrawings, saveDrawings, serverDrawings, subscribeDrawings, viewportPosition,
  type Anchor, type ChartDrawings, type Drawing, type FibonacciStyle, type GannStyle, type Point, type Tool } from "./chart-drawings";

import { drawingGroups } from "./chart-drawing-groups";
import { patternLabels } from "./chart-drawing-patterns";
import { defaultRegression, regressionSources, validDeviation, type RegressionSettings } from "./chart-drawing-regression";

export function useDrawingControls(engine:ChartDrawings|null, owner:string|undefined, ticker:string, compact:boolean,alwaysShowToolbar:boolean,autosave:boolean){
  const key=`${drawingStoragePrefix}${owner??"local"}:${ticker.toUpperCase()}`;
  const drawings=useSyncExternalStore(subscribeDrawings,()=>readDrawings(key),serverDrawings);
  const drawingButton=useRef<HTMLButtonElement>(null);
  const [menu,setMenu]=useState<HTMLElement|null>(null);
  const [group,setGroup]=useState<string>();
  const [viewOptions,setViewOptions]=useState<{key:string;hidden?:boolean;locked?:boolean;keepDrawing?:boolean;magnet?:"off"|"weak"|"strong"}>();
  const options=viewOptions?.key===key?viewOptions:undefined;
  const visibleDrawings=options?.hidden?serverDrawings():drawings;
  const [confirmRemove,setConfirmRemove]=useState<string>();
  const dialogId=useId();

  const [localToolbar,setLocalToolbar]=useState<{key:string;shown:boolean;defaultShown:boolean}>();
  const hasLocalToolbar=localToolbar?.key===key&&localToolbar.defaultShown===alwaysShowToolbar;
  const toolbarShown=hasLocalToolbar?localToolbar.shown:alwaysShowToolbar;
  if(localToolbar&&!hasLocalToolbar)setLocalToolbar(undefined);
  const [session,setSession]=useState<{key:string;tool:Tool|"select";anchors?:Anchor[];selected?:string;draft?:Drawing;pattern?:Drawing;action?:"measure"|"zoom"|"erase"}|null>(null);
  if(session&&(session.key!==key||!toolbarShown))setSession(null);
  const current=toolbarShown&&session?.key===key?session:null;
  const draft=current?.draft;
  const selection=current?.action?undefined:draft??drawings.find(d=>d.id===current?.selected);
  const drag=useRef<({drawing:Drawing;index?:number;next:Drawing;origin:Point;pointerId:number}&
    ({start:Anchor;space:"data"}|{start:Point;space:"viewport"}))|null>(null);
  const pendingFrame=useRef(0);
  const stroke=useRef<{drawing:Drawing;last:Point;pointerId:number;spacing:number}|null>(null);
  const [saveError,setSaveError]=useState("");
  const [placementError,setPlacementError]=useState("");
  const [text,setText]=useState("");
  const [color,setColor]=useState("#38bdf8");
  const [drawingOptions,setDrawingOptions]=useState(false);
  const [gannStyle,setGannStyle]=useState<GannStyle>();
  const [fibonacciStyle,setFibonacciStyle]=useState<FibonacciStyle>();
  const [source,setSource]=useState<RegressionSettings["source"]>("close");
  const [upper,setUpper]=useState("2");
  const [lower,setLower]=useState("2");
  const invalidUpper=upper.trim()===""||!validDeviation(Number(upper));
  const invalidLower=lower.trim()===""||!validDeviation(Number(lower));
  const setDrawingFields=(drawing:Drawing)=>{
    setDrawingOptions(false);
    setGannStyle(drawing.gann);
    setFibonacciStyle(drawing.fibonacci);
    if(drawing.tool!=="regressionTrend")return;
    const settings=drawing.regression??defaultRegression;
    setSource(settings.source);
    setUpper(String(settings.upper));
    setLower(String(settings.lower));
  };
  const [undo,setUndo]=useState<{key:string;before:readonly Drawing[];after:readonly Drawing[]}[]>([]);
  const selectedId=selection?.id??"";
  useEffect(()=>{engine?.update(draft?[...visibleDrawings,draft]:visibleDrawings,selectedId);},[engine,visibleDrawings,draft,selectedId]);
  useEffect(()=>()=>{
    cancelAnimationFrame(pendingFrame.current);
    pendingFrame.current=0;
    drag.current=null;
    stroke.current=null;
  },[engine,key]);
  const commit=(next:readonly Drawing[])=>{
    const before=readDrawings(key);
    const after=applyDrawingChanges(before,drawings,next);
    setUndo(previous=>[...previous.slice(-19),{key,before,after}]);
    const saved=saveDrawings(key,after,autosave);
    setSaveError(autosave&&!saved?"Drawings could not be saved in this browser.":"");
  };
  const update=(drawing:Drawing)=>commit(drawings.map(d=>d.id===drawing.id?drawing:d));
  const addDrawing=(tool:Tool,anchors:Anchor[],closed=false,viewportAnchor?:Point)=>{
    if(current?.action==="zoom"){
      if(engine)engine.zoomTo(anchors[0],anchors[1]);
      setSession(null);
      return;
    }
    const drawing:Drawing={id:crypto.randomUUID(),tool,anchors,color:isPosition(tool)?positionDefaultColor:"#38bdf8",text:tool==="text"?"Text":isDrawingStamp(tool)?drawingStamps[tool][0]:"",
      ...(closed?{closed:true}:{}),...(viewportAnchor?{viewportAnchor}:{})};
    if(current?.action==="measure"){
      setSession({key,tool:"select",action:"measure",draft:drawing});
      return;
    }
    if(tool==="ghostFeed"&&engine)drawing.ghost=engine.getGhostSettings(anchors[0],anchors[1]);
    if(tool==="fixedRangeProfile"&&engine){
      drawing.volumeInterval=engine.interval;
      if(engine.calendarFrame)drawing.volumeTimeframe=engine.calendarFrame;
    }
    setText(drawing.text);
    setColor(drawing.color);
    setDrawingFields(drawing);
    if(isAnnotation(tool)&&isTextDrawing(tool)||tool==="table"){
      setSession({key,tool:"select",draft:drawing});
      return;
    }
    commit([...drawings,drawing]);
    setSession(options?.keepDrawing?{key,tool}:{key,tool:"select",selected:drawing.id});
  };
  const finishPolyline=(closed=false)=>{
    if(current&&isPolyline(current.tool)&&current.anchors&&current.anchors.length>=(closed?3:2)){
      cancelAnimationFrame(pendingFrame.current);
      pendingFrame.current=0;
      addDrawing(current.tool,current.anchors,closed);
    }
  };
  const point=(event:PointerEvent<HTMLDivElement>):Point=>{
    const r=event.currentTarget.getBoundingClientRect();
    return {x:event.clientX-r.left,y:event.clientY-r.top};
  };
  const constrainedCorner=(pointer:Point,origin:Anchor,reference?:Anchor):Point=>{
    if(!engine)return pointer;
    const from=engine.project(origin,true,true);
    if(!from)return pointer;
    const to=reference?engine.project(reference,true,true):undefined;
    const ratio=to?Math.abs((to.y-from.y)/(to.x-from.x)):1;
    if(!(ratio>0&&Number.isFinite(ratio)))return pointer;
    const {w,h}=engine.size();
    return gannFixedCorner(from,pointer,ratio,w,h);
  };
  const channelHasWidth=(a:Anchor,b:Anchor,c:Anchor)=>{
    const first=engine?.project(a,true,true),second=engine?.project(b,true,true),third=engine?.project(c,true,true);
    return Boolean(first&&second&&third&&validFibonacciChannelWidth(first,second,third));
  };
  const wedgeHasWidth=(a:Anchor,b:Anchor,c:Anchor)=>{
    const origin=engine?.project(a,true,true),edge=engine?.project(b,true,true),side=engine?.project(c,true,true);
    return Boolean(origin&&edge&&side&&validFibonacciWedge(origin,edge,side));
  };
  const place=(event:PointerEvent<HTMLDivElement>)=>{
    if(!engine||!current||current.draft||event.button!==0)return;
    const p=point(event),size=engine.size();
    if(p.x<0||p.y<0||p.x>=size.w||p.y>=size.h)return;
    if(current.tool==="anchoredNote"){
      event.preventDefault();
      addDrawing(current.tool,[],false,viewportPosition(p,size.w,size.h));
      return;
    }
    if(current.tool==="select"){
      event.preventDefault();
      event.currentTarget.focus({preventScroll:true});
      const hit=engine.hit(p,selection?.id??"");
      const drawing=drawings.find(d=>d.id===hit?.id);
      if(current.action==="erase"){
        if(drawing)commit(drawings.filter(item=>item.id!==drawing.id));
        return;
      }
      const anchor=drawing?.viewportAnchor?viewportPosition(p,size.w,size.h):undefined;
      const timePrice=drawing&&!anchor?engine.anchor(p,isFreehand(drawing.tool)||isGann(drawing.tool)||isFibonacciCurve(drawing.tool),
        allowsFutureAnchor(drawing.tool)||drawing.tool==="barsPattern"||drawing.tool==="anchoredVolumeProfile"):undefined;
      setSession({...current,selected:drawing?.id});
      if(drawing){
        if(drawing.id!==selectedId){
          setText(drawing.text);
          setColor(drawing.color);
          setDrawingFields(drawing);
        }
        if(!options?.locked&&(anchor||timePrice)){
          drag.current={drawing,index:hit?.index,next:drawing,origin:p,pointerId:event.pointerId,
            ...(anchor?{start:anchor,space:"viewport"}:{start:timePrice!,space:"data"})};
          event.currentTarget.setPointerCapture(event.pointerId);
        }
      }
      return;
    }
    const fixedAnchor=current.tool==="signpost"?current.anchors?.[0]
      :current.tool==="projection"?current.anchors?.[1]:undefined;
    const first=current.anchors?.[0];
    const constrain=current.tool==="gannSquareFixed"||current.tool==="fibCircles"&&event.shiftKey;
    const snapped=current.action||constrain?p:engine.snapDrawingPoint(p,options?.magnet??"off");
    const anchorPoint=constrain&&first?constrainedCorner(p,first):snapped;
    const anchor=fixedAnchor
      ? engine.anchor({x:engine.project(fixedAnchor,false,current.tool==="projection")?.x??p.x,y:p.y},
        false,current.tool==="projection")
      : engine.anchor(anchorPoint,isFreehand(current.tool)||isGann(current.tool)||isFibonacciCurve(current.tool),allowsFutureAnchor(current.tool)||Boolean(current.pattern));
    if(!anchor)return;
    event.preventDefault();
    event.currentTarget.focus({preventScroll:true});
    if(isFreehand(current.tool)){
      if(stroke.current)return;
      const drawing={id:crypto.randomUUID(),tool:current.tool,anchors:[anchor],
        color:current.tool==="highlighter"?"#facc15":"#38bdf8",text:""};
      stroke.current={drawing,last:p,pointerId:event.pointerId,spacing:2};
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }
    if(current.tool==="barsPattern"){
      if(current.pattern){
        const drawing={...current.pattern,anchors:[anchor]};
        commit([...drawings,drawing]);
        setColor(drawing.color);
        setSession(options?.keepDrawing?{key,tool:"barsPattern"}:{key,tool:"select",selected:drawing.id});
      }else if(current.anchors?.length){
        const range=engine.capturePattern(current.anchors[0].time,anchor.time);
        if(range.error!==undefined){setPlacementError(range.error);return;}
        setSession({...current,pattern:{id:crypto.randomUUID(),tool:"barsPattern",anchors:[range.origin],
          pattern:range.bars,color:"#38bdf8",text:""}});
      }else setSession({...current,anchors:[anchor]});
      setPlacementError("");
      return;
    }
    if(isPolyline(current.tool)){
      event.currentTarget.focus({preventScroll:true});
      const previous=current.anchors??[];
      if(current.tool==="polyline"&&previous.length>=3){
        const start=engine.project(previous[0]);
        if(start&&Math.hypot(start.x-p.x,start.y-p.y)<10){
          finishPolyline(true);
          return;
        }
      }
      const last=previous.at(-1);
      if(last?.time===anchor.time&&last.price===anchor.price)return;
      const anchors=[...previous,anchor];
      if(anchors.length>=MAX_PATH_POINTS)addDrawing(current.tool,anchors);
      else {
        setSession({...current,anchors});
        if(anchors.length>=2)engine.update([...visibleDrawings,{id:"draft",tool:current.tool,anchors,color:"#38bdf8",text:""}],"");
      }
      return;
    }
    const placed=current.anchors??[];
    if(current.tool==="positionForecast"&&(anchor.price<=0||placed.length&&anchor.time<=placed[0].time)){
      setPlacementError(placed.length?"Place the target after the entry":"Place the entry above zero");
      return;
    }
    if(isPatternTool(current.tool)&&placed.length&&anchor.time<=placed[placed.length-1].time){
      setPlacementError("Place the next point to the right");
      return;
    }
    if((requiresTimeInterval(current.tool)||current.action==="zoom")&&placed[0]?.time===anchor.time){
      setPlacementError("Choose a different time");
      return;
    }
    if(current.tool==="sector"&&placed.length===1&&placed[0].time===anchor.time&&placed[0].price===anchor.price){
      setPlacementError("Choose a different point");
      return;
    }
    if(current.tool==="sector"&&placed.length===2&&!wedgeHasWidth(placed[0],placed[1],anchor)){
      setPlacementError("Move the third point away from the first edge");
      return;
    }
    if(isFibonacciCurve(current.tool)&&placed.length===1&&!validFibonacciCurveBase(current.tool,placed[0],anchor)){
      setPlacementError(current.tool==="fibCircles"?"Choose a different time and price":"Choose a different point");
      return;
    }
    if(current.tool==="fibWedge"&&placed.length===2&&!wedgeHasWidth(placed[0],placed[1],anchor)){
      setPlacementError("Move the third point away from the first edge");
      return;
    }
    if(isFibonacciProjection(current.tool)&&placed.length===1&&!validFibonacciBase(current.tool,placed[0],anchor)){
      setPlacementError(current.tool==="fibSpeedResistanceFan"?"Choose a different time and price":"Choose a different time");
      return;
    }
    if(current.tool==="fibChannel"&&placed.length===2&&!channelHasWidth(placed[0],placed[1],anchor)){
      setPlacementError("Place the third point away from the trend line");
      return;
    }
    if(isGann(current.tool)&&placed[0]&&!validGannAnchors(placed[0],anchor)){
      setPlacementError("Choose a different time and price");
      return;
    }
    if(current.tool==="regressionTrend"&&placed[0]?.time===anchor.time){
      setPlacementError("Select another bar to end the regression");
      return;
    }
    if(current.tool==="ghostFeed"&&(anchor.price<=0||placed[0]?.time===anchor.time)){
      setPlacementError(placed.length?"Place the end on another bar above zero":"Place the start above zero");
      return;
    }
    if(current.tool==="projection"&&(anchor.price<=0&&(placed.length!==1)||
      placed.length===1&&anchor.time<=placed[0].time)){
      setPlacementError(placed.length===1?"Place the deadline to the right of the start":"Select a price above zero");
      return;
    }
    if(isPosition(current.tool)&&!validPositionAnchor(current.tool,placed,anchor)){
      setPlacementError(placed.length===1&&placed[0].time===anchor.time
        ?"Place the target on another bar to set the width"
        :placementHint(current.tool,placed.length));
      return;
    }
    setPlacementError("");
    const anchors=appendDrawingAnchor(current.tool,placed,anchor);
    if(anchors.length<anchorCounts[current.tool]){
      setSession({...current,anchors});return;
    }
    addDrawing(current.tool,anchors);
  };
  const collectStrokePoint=(p:Point,terminal=false)=>{
    const active=stroke.current;
    if(!engine||!active)return;
    const distance=Math.hypot(p.x-active.last.x,p.y-active.last.y);
    if(distance<(terminal?0.5:active.spacing))return;
    const {w,h}=engine.size();
    const anchor=engine.anchor({x:Math.max(0,Math.min(w-1,p.x)),y:Math.max(0,Math.min(h-1,p.y))},true);
    if(!anchor)return;
    if(active.drawing.anchors.length>=MAX_STROKE_POINTS){
      active.drawing.anchors=active.drawing.anchors.filter((_,index)=>index%2===0);
      active.spacing*=1.5;
    }
    active.drawing.anchors.push(anchor);
    active.last=p;
  };
  const applyDrag=(p:Point,preserveRatio:boolean,paint:boolean)=>{
    const active=drag.current;
    if(!engine||!active)return;
    const viewportAnchor=active.drawing.viewportAnchor;
    if(active.space==="viewport"&&viewportAnchor){
      const {w,h}=engine.size();
      const nextAnchor=viewportPosition({
        x:viewportAnchor.x*w+p.x-active.start.x*w,
        y:viewportAnchor.y*h+p.y-active.start.y*h,
      },w,h);
      active.next=nextAnchor.x===viewportAnchor.x&&nextAnchor.y===viewportAnchor.y
        ?active.drawing:{...active.drawing,viewportAnchor:nextAnchor};
      if(paint)engine.update(visibleDrawings.map(d=>d.id===active.drawing.id?active.next:d),active.drawing.id);
      return;
    }
    if(active.space!=="data")return;
    const tool=active.drawing.tool;
    const index=active.index;
    let anchorPoint=p;
    if(index!==undefined&&(tool==="gannSquareFixed"||tool==="gannSquare"&&preserveRatio)){
      anchorPoint=constrainedCorner(p,active.drawing.anchors[1-index],active.drawing.anchors[index]);
    }else if(index!==undefined&&tool==="fibCircles"&&preserveRatio){
      anchorPoint=constrainedCorner(p,active.drawing.anchors[1-index]);
    }
    const anchor=engine.anchor(anchorPoint,isGann(tool)||isFibonacciCurve(tool)||isFreehand(tool),
      allowsFutureAnchor(tool)||tool==="barsPattern"||tool==="anchoredVolumeProfile"&&index===undefined);
    if(!anchor)return;
    const {drawing,start}=active;
    const anchors=drawing.anchors.map((a,i)=>index===undefined?
      {time:a.time+anchor.time-start.time,price:a.price+anchor.price-start.price}:
      index===i?anchor:a);
    if(isPosition(drawing.tool)){
      if(index===1||index===2){
        const other=index===1?2:1;
        anchors[other]={...anchors[other],time:anchors[index].time};
      }
      const [entry,target,stop]=anchors;
      if(entry.time===target.time||!positionLevels(drawing.tool,entry.price,target.price,stop.price))return;
    }
    if(drawing.tool==="positionForecast"&&(anchors[1].time<=anchors[0].time||
      anchors.some(point=>point.price<=0)))return;
    if(isPatternTool(drawing.tool)&&anchors.some((point,i)=>i>0&&point.time<=anchors[i-1].time))return;
    if(requiresTimeInterval(drawing.tool)&&anchors[0].time===anchors[1].time)return;
    if(drawing.tool==="sector"&&index!==undefined&&!wedgeHasWidth(anchors[0],anchors[1],anchors[2]))return;
    if(isFibonacciCurve(drawing.tool)&&!validFibonacciCurveBase(drawing.tool,anchors[0],anchors[1]))return;
    if(drawing.tool==="fibWedge"&&index!==undefined&&!wedgeHasWidth(anchors[0],anchors[1],anchors[2]))return;
    if(isFibonacciProjection(drawing.tool)&&!validFibonacciBase(drawing.tool,anchors[0],anchors[1]))return;
    if(drawing.tool==="fibChannel"&&index!==undefined&&!channelHasWidth(anchors[0],anchors[1],anchors[2]))return;
    if(isGann(drawing.tool)&&!validGannAnchors(anchors[0],anchors[1]))return;
    if(drawing.tool==="regressionTrend"&&anchors[0].time===anchors[1].time)return;
    if(drawing.tool==="ghostFeed"&&(anchors[0].time===anchors[1].time||anchors.some(point=>point.price<=0)))return;
    if(drawing.tool==="projection"){
      const [origin,deadline,target]=anchors;
      if(deadline.time<=origin.time||origin.price<=0||target.price<=0)return;
      anchors[1]={time:deadline.time,price:origin.price};
      anchors[2]={time:deadline.time,price:target.price};
    }
    if(drawing.tool==="signpost")anchors[1]={...anchors[1],time:anchors[0].time};
    if(tool==="anchoredVolumeProfile"&&!engine.hasVolumeAnchor(anchors[0].time))return;
    active.next=anchors.some((a,i)=>a.time!==drawing.anchors[i].time||a.price!==drawing.anchors[i].price)
      ?{...drawing,anchors}:drawing;
    if(paint)engine.update(visibleDrawings.map(d=>d.id===drawing.id?active.next:d),drawing.id);
  };
  const move=(event:PointerEvent<HTMLDivElement>)=>{
    const p=point(event), preserveRatio=event.shiftKey;
    const freehand=stroke.current;
    if(freehand){
      if(freehand.pointerId!==event.pointerId)return;
      collectStrokePoint(p);
      if(!pendingFrame.current)pendingFrame.current=requestAnimationFrame(()=>{
        pendingFrame.current=0;
        if(freehand.drawing.anchors.length>1)engine?.update([...visibleDrawings,freehand.drawing],"");
      });
      return;
    }
    const active=drag.current;
    if(!engine||active&&active.pointerId!==event.pointerId||!active&&!current?.anchors?.length)return;
    cancelAnimationFrame(pendingFrame.current);
    pendingFrame.current=requestAnimationFrame(()=>{
      pendingFrame.current=0;
      if(active){applyDrag(p,preserveRatio,true);return;}
      if(!current?.anchors?.length||current.tool==="select")return;
      const tool=current.tool;
      let anchorPoint=current.action?p:engine.snapDrawingPoint(p,options?.magnet??"off");
      if(tool==="gannSquareFixed"||tool==="fibCircles"&&preserveRatio){
        anchorPoint=constrainedCorner(p,current.anchors[0]);
      }
      const anchor=engine.anchor(anchorPoint,isGann(tool)||isFibonacciCurve(tool),
        allowsFutureAnchor(tool)||tool==="barsPattern"&&Boolean(current.pattern));
      if(!anchor)return;
      const preview:Drawing=current.pattern?{...current.pattern,anchors:[anchor]}
        :{id:"draft",tool:current.tool==="barsPattern"||current.tool==="fixedRangeProfile"||current.tool==="regressionTrend"?"dateRange":current.tool,
          anchors:appendDrawingAnchor(current.tool,current.anchors,anchor),color:"#38bdf8",text:""};
      if(preview.tool==="ghostFeed"){
        const [start,end]=preview.anchors;
        if(start.time===end.time||end.price<=0){engine.update(visibleDrawings,"");return;}
        preview.ghost=engine.getGhostSettings(start,end);
      }
      engine.update([...visibleDrawings,preview],preview.id);
    });
  };
  const finish=(commitDrag:boolean,event?:PointerEvent<HTMLDivElement>)=>{
    const freehand=stroke.current;
    const active=drag.current;
    if(event&&(freehand&&event.pointerId!==freehand.pointerId||active&&event.pointerId!==active.pointerId))return;
    cancelAnimationFrame(pendingFrame.current);
    pendingFrame.current=0;
    if(freehand){
      if(commitDrag&&event)collectStrokePoint(point(event),true);
      stroke.current=null;
      if(commitDrag&&freehand.drawing.anchors.length>=2){
        const drawing=freehand.drawing;
        commit([...drawings,drawing]);
        setColor(drawing.color);
        setSession(options?.keepDrawing?{key,tool:drawing.tool}:{key,tool:"select",selected:drawing.id});
      }else engine?.update(visibleDrawings,selection?.id??"");
      return;
    }
    if(commitDrag&&active&&event){
      const p=point(event);
      if(active.next!==active.drawing||p.x!==active.origin.x||p.y!==active.origin.y)applyDrag(p,event.shiftKey,false);
    }
    drag.current=null;
    if(commitDrag&&active&&active.next!==active.drawing)update(active.next);
    else engine?.update(visibleDrawings,selection?.id??"");
  };
  const done=()=>{finish(false);setPlacementError("");setSession(null);};
  const saveSelection=()=>{
    if(!selection)return;
    const drawing={...selection,text:isTextDrawing(selection.tool)||isDrawingStamp(selection.tool)?text.trim()||(selection.tool==="text"?"Text":""):selection.text,color};
    if(selection.tool==="regressionTrend"){
      if(invalidUpper||invalidLower)return;
      drawing.regression={source,upper:Number(upper),lower:Number(lower)};
    }
    if(isGann(selection.tool)&&gannStyle)drawing.gann=gannStyle;
    if(isFibonacciDrawing(selection.tool)&&fibonacciStyle)drawing.fibonacci=fibonacciStyle;
    if(draft)commit([...drawings,drawing]);
    else if(JSON.stringify(selection)!==JSON.stringify(drawing))update(drawing);
    if(draft&&options?.keepDrawing)setSession({key,tool:drawing.tool});
    else done();
  };
  const toggleToolbar=()=>{
    if(toolbarShown){done();setMenu(null);}
    setLocalToolbar({key,shown:!toolbarShown,defaultShown:alwaysShowToolbar});
  };
  const changeViewOptions=(change:Partial<NonNullable<typeof options>>)=>{
    done();
    setMenu(null);
    setViewOptions({...options,...change,key});
  };
  const beginTool=(tool:Tool|"select",action?:"measure"|"zoom"|"erase")=>{
    finish(false);
    setPlacementError("");
    if(options?.hidden&&!action)setViewOptions({...options,hidden:false,key});
    setSession({key,tool,action});
    setMenu(null);
  };
  const shownGroup=drawingGroups.find(([name])=>name===group);
  const toolbar=toolbarShown?<>
    <IconButton ref={drawingButton} aria-label={`Drawings for ${ticker}`} title="Drawings" aria-haspopup="menu" disabled={!engine}
      aria-pressed={Boolean(current)} onClick={event=>{setGroup(undefined);setMenu(event.currentTarget);}}
      sx={{width:compact?30:34,height:compact?28:34,flexShrink:0}}>
      <EditOutlined fontSize="small"/>
    </IconButton>
    <Menu anchorEl={menu} open={Boolean(menu)} transitionDuration={0} onClose={()=>setMenu(null)}>
      {shownGroup||group==="Drawing options"?<MenuItem autoFocus onClick={()=>setGroup(undefined)}>Back to drawing tools</MenuItem>:null}
      {shownGroup?.[1].map(tool=><MenuItem key={tool} onClick={()=>beginTool(tool)}>{drawingTools[tool]}</MenuItem>)}
      {!group&&drawingGroups.map(([name],index)=><MenuItem key={name} autoFocus={index===0} onClick={()=>setGroup(name)}
        sx={{display:"flex",justifyContent:"space-between",gap:2}}>{name}<ChevronRight fontSize="small"/></MenuItem>)}
      {!group&&<Divider/>}
      {!group&&<MenuItem onClick={()=>beginTool("datePriceRange","measure")}>Measure</MenuItem>}
      {!group&&<MenuItem onClick={()=>beginTool("dateRange","zoom")}>Zoom to range</MenuItem>}
      {!group&&<MenuItem disabled={!drawings.length||options?.locked||options?.hidden} onClick={()=>beginTool("select")}>Select drawing</MenuItem>}
      {!group&&<MenuItem disabled={!drawings.length||options?.locked||options?.hidden} onClick={()=>beginTool("select","erase")}>Eraser</MenuItem>}
      {!group&&(!autosave||drawingsNeedSaving(key))&&<MenuItem disabled={!drawingsNeedSaving(key)} onClick={()=>{
        const saved=persistDrawings(key);
        setSaveError(saved?"":"Drawings could not be saved in this browser.");
        setMenu(null);
      }}>Save drawings</MenuItem>}
      {!group&&<MenuItem disabled={!undo.some(entry=>entry.key===key)||options?.locked} onClick={()=>{
        const index=undo.findLastIndex(entry=>entry.key===key);
        if(index>=0){
          const entry=undo[index];
          const restored=applyDrawingChanges(readDrawings(key),entry.after,entry.before);
          const saved=saveDrawings(key,restored,autosave);
          setSaveError(autosave&&!saved?"Drawings could not be saved in this browser.":"");
          setUndo(undo.filter((_,i)=>i!==index));
        }
        setMenu(null);done();
      }}>Undo drawing change</MenuItem>}
      {!group&&<MenuItem onClick={()=>setGroup("Drawing options")}
        sx={{display:"flex",justifyContent:"space-between",gap:2}}>Drawing options<ChevronRight fontSize="small"/></MenuItem>}
      {group==="Drawing options"&&[
        <MenuItem key="hide" onClick={()=>changeViewOptions({hidden:!options?.hidden})}>{options?.hidden?"Show drawings":"Hide drawings"}</MenuItem>,
        <MenuItem key="lock" onClick={()=>changeViewOptions({locked:!options?.locked})}>{options?.locked?"Unlock drawings":"Lock drawings"}</MenuItem>,
        <MenuItem key="keep" role="menuitemcheckbox" aria-checked={Boolean(options?.keepDrawing)}
          onClick={()=>changeViewOptions({keepDrawing:!options?.keepDrawing})}>Stay in drawing mode</MenuItem>,
        <Divider key="separator"/>,
        ...(["off","weak","strong"] as const).map(magnet=><MenuItem key={magnet} role="menuitemradio"
          aria-checked={(options?.magnet??"off")===magnet} selected={(options?.magnet??"off")===magnet}
          onClick={()=>changeViewOptions({magnet})}>{magnet==="off"?"Magnet off":magnet==="weak"?"Weak magnet":"Strong magnet"}</MenuItem>),
        <Divider key="remove-separator"/>,
        <MenuItem key="remove" disabled={!drawings.length||options?.locked} sx={{color:"error.main"}}
          onClick={()=>{setMenu(null);setConfirmRemove(key);}}>Remove all drawings</MenuItem>,
      ]}
    </Menu>
    <Dialog open={confirmRemove===key} onClose={()=>setConfirmRemove(undefined)} aria-labelledby={`confirm-drawings-${dialogId}`}>
      <DialogTitle id={`confirm-drawings-${dialogId}`}>Remove all drawings for {ticker}?</DialogTitle>
      <DialogContent>This removes {drawings.length} {drawings.length===1?"drawing":"drawings"} for this ticker.</DialogContent>
      <DialogActions>
        <Button onClick={()=>setConfirmRemove(undefined)} autoFocus>Cancel</Button>
        <Button color="error" onClick={()=>{commit([]);done();setConfirmRemove(undefined);}}>Remove drawings</Button>
      </DialogActions>
    </Dialog>
  </>:null;
  const overlay=current&&engine?<Box
    onKeyDown={event=>{
      if(event.key!=="Escape"||event.defaultPrevented)return;
      event.preventDefault();
      event.stopPropagation();
      done();
      drawingButton.current?.focus({preventScroll:true});
    }}
    sx={{position:"absolute",inset:0,zIndex:3,pointerEvents:"none"}}>
    <Box tabIndex={0} role="region" aria-label={`Drawing canvas for ${ticker}`}
      onKeyDown={event=>{
        if((event.key==="Delete"||event.key==="Backspace")&&selection&&!options?.locked&&!draft){
          event.preventDefault();
          commit(drawings.filter(item=>item.id!==selection.id));
          done();
        }
        if(event.key==="Enter"&&isPolyline(current.tool)){event.preventDefault();finishPolyline();}
      }}
      onDoubleClick={()=>finishPolyline()} onPointerDown={place} onPointerMove={move}
      onPointerUp={event=>{if(!isPolyline(current.tool))finish(true,event);}} onPointerCancel={event=>finish(false,event)}
      onLostPointerCapture={event=>{if(stroke.current||drag.current)finish(false,event);}}
      sx={{position:"absolute",inset:0,pointerEvents:"auto",touchAction:"none",cursor:current.action==="erase"?"crosshair":current.tool==="select"?"default":"crosshair"}}/>
    <Box sx={{position:"absolute",top:4,left:4,right:4,display:"flex",alignItems:"center",flexWrap:"wrap",gap:.5,
      width:"fit-content",maxWidth:"100%",bgcolor:"background.paper",border:1,borderColor:"divider",p:.25,pointerEvents:"auto"}}>
      {selection&&<>
        {isDrawingStamp(selection.tool)&&<TextField select size="small" label={drawingTools[selection.tool]} value={text}
          onChange={event=>setText(event.target.value)} sx={{width:76}}>
          {drawingStamps[selection.tool].map(mark=><MenuItem key={mark} value={mark}>{mark}</MenuItem>)}
        </TextField>}
        {isTextDrawing(selection.tool)&&<TextField key={selection.id} size="small" label={selection.tool==="table"?"Rows (comma-separated cells)":selection.tool==="priceNote"||selection.tool==="pin"||selection.tool==="arrowMarker"?"Drawing text (optional)":"Drawing text"} value={text}
          onChange={event=>setText(event.target.value)} autoFocus={Boolean(draft)} multiline={isAnnotation(selection.tool)||selection.tool==="table"} maxRows={3}
          slotProps={{htmlInput:{maxLength:selection.tool==="table"?400:200}}} sx={{width:selection.tool==="table"?220:isAnnotation(selection.tool)?165:115,maxWidth:"100%"}}/>}
        <input type="color" aria-label="Drawing color" value={color} onChange={event=>setColor(event.target.value)}/>
        {(selection.tool==="regressionTrend"||isGann(selection.tool)||isFibonacciDrawing(selection.tool))&&<IconButton size="small"
          aria-label={selection.tool==="regressionTrend"?"Regression settings":`${drawingTools[selection.tool]} settings`}
          title={selection.tool==="regressionTrend"?"Regression settings":`${drawingTools[selection.tool]} settings`}
          aria-expanded={drawingOptions} onClick={()=>setDrawingOptions(open=>!open)}>
          <SettingsOutlined fontSize="small"/>
        </IconButton>}
        <Button size="small" disabled={Boolean(draft)&&draft?.tool!=="priceNote"&&!text.trim()||
          selection.tool==="regressionTrend"&&(invalidUpper||invalidLower)} onClick={saveSelection}>{autosave?"Save":"Apply"}</Button>
        {!draft&&!options?.locked&&<Button size="small" color="error" onClick={()=>{commit(drawings.filter(d=>d.id!==selection.id));done();}}>Delete</Button>}
      </>}
      {!selection&&current.tool!=="select"&&<Box role="status" sx={{fontSize:11,px:.5}}>
        {placementError||(current.action==="measure"||current.action==="zoom"?current.anchors?.length?"Place the end":"Place the start":
          current.pattern?"Place the copied bars":placementHint(current.tool,current.anchors?.length??0))}
      </Box>}
      {isPolyline(current.tool)&&(current.anchors?.length??0)>=2&&<Button size="small"
        onClick={()=>finishPolyline()}>{current.tool==="path"?"Finish path":"Finish polyline"}</Button>}
      {current.tool==="polyline"&&(current.anchors?.length??0)>=3&&<Button size="small"
        onClick={()=>finishPolyline(true)}>Close shape</Button>}
      <Button size="small" onClick={done}>{current.action==="measure"&&draft||!draft&&(selection||current.tool==="select")?"Done":"Cancel"}</Button>
      {selection?.tool==="regressionTrend"&&drawingOptions&&<Box sx={{display:"flex",flexWrap:"wrap",flexBasis:"100%",gap:1,px:.5,pt:.75}}>
        <TextField select size="small" label="Source" value={source}
          onChange={event=>setSource(event.target.value as RegressionSettings["source"])} sx={{width:91}}>
          {Object.entries(regressionSources).map(([value,label])=><MenuItem key={value} value={value}>{label}</MenuItem>)}
        </TextField>
        <TextField size="small" label="Upper deviation" value={upper} error={invalidUpper}
          onChange={event=>setUpper(event.target.value)} type="number"
          slotProps={{htmlInput:{min:0,step:.1}}} sx={{width:115}}/>
        <TextField size="small" label="Lower deviation" value={lower} error={invalidLower}
          onChange={event=>setLower(event.target.value)} type="number"
          slotProps={{htmlInput:{min:0,step:.1}}} sx={{width:115}}/>
        <Box sx={{flexBasis:"100%",fontSize:11,color:"text.secondary"}}>Set a deviation to 0 to hide that band.</Box>
      </Box>}
      {selection&&isGann(selection.tool)&&drawingOptions&&<Box sx={{display:"flex",flexWrap:"wrap",flexBasis:"100%",columnGap:1,px:.75}}>
        {gannStyleControls(selection.tool).map(([setting,label])=><FormControlLabel key={setting}
          sx={{m:0,"& .MuiFormControlLabel-label":{fontSize:12}}} label={label}
          control={<Checkbox size="small" sx={{p:.5}} checked={gannStyleValue(gannStyle,setting)}
            onChange={event=>setGannStyle(previous=>({...previous,[setting]:event.target.checked}))}/>}/>)}
      </Box>}
      {selection&&isFibonacciDrawing(selection.tool)&&drawingOptions&&<Box sx={{display:"flex",flexWrap:"wrap",flexBasis:"100%",columnGap:1,px:.75}}>
        {fibonacciStyleControls(selection.tool).map(([setting,label])=><FormControlLabel key={setting}
          sx={{m:0,"& .MuiFormControlLabel-label":{fontSize:12}}} label={label}
          control={<Checkbox size="small" sx={{p:.5}} checked={fibonacciStyleValue(fibonacciStyle,setting)}
            onChange={event=>setFibonacciStyle(previous=>({...previous,[setting]:event.target.checked}))}/>}/>)}
      </Box>}
    </Box>
  </Box>:null;
  return {toolbar,overlay,toolbarShown,toggleToolbar,saveError};
}


function placementHint(tool: Tool,count:number){
  if(isFreehand(tool))return "Drag to draw";
  if(tool==="path")return count?"Place another point or finish the path":"Place the starting point";
  if(tool==="polyline")return count?"Place another point or finish the polyline":"Place the starting point";
  if(isPatternTool(tool))return `Place ${patternLabels[tool][count]}`;
  if(tool==="pitchfan")return ["Place the trend start","Place the trend end","Place the end of the pullback"][count];
  if(tool==="sector")return ["Place the sector center","Set the first edge and radius","Set the second edge"][count];
  if(tool==="cyclicLines"||tool==="timeCycles")return count?"Set the cycle interval":"Place the start of the cycle";
  if(tool==="sineLine")return count?"Place the next peak or trough":"Place the first peak or trough";
  if(tool==="fibCircles")return count?"Place the opposite corner":"Place the first corner";
  if(tool==="fibSpiral")return count?"Set the radius and direction":"Place the center";
  if(tool==="fibSpeedResistanceArcs")return count?"Set the 1.0 arc":"Place the center of the arcs";
  if(tool==="fibWedge")return ["Place the wedge origin","Set the first edge and radius","Set the second edge"][count];
  if(tool==="fibTimeZone")return count?"Set the base time interval":"Place the first time marker";
  if(tool==="fibChannel")return ["Place the start of the trend line","Place the end of the trend line","Set the channel width"][count];
  if(tool==="trendBasedFibTime")return ["Place the start of the trend line","Place the end of the trend line","Place the projection start"][count];
  if(tool==="fibSpeedResistanceFan")return count?"Place the end of the trend line":"Place the start of the fan";
  if(isGann(tool)){
    if(tool==="gannFan")return count?"Set the 1/1 angle":"Place the start of the fan";
    return count?tool==="gannSquareFixed"?"Set the size and direction":"Place the opposite corner":"Place the starting corner";
  }
  if(isPitchfork(tool))return ["Place the first swing point","Place the second swing point","Place the third swing point"][count];
  if(tool==="rotatedRectangle")return ["Place the first corner","Place the end of the first edge","Set the width"][count];
  if(tool==="arc")return ["Place the start","Place the end","Place a point on the arc"][count];
  if(tool==="curve")return ["Place the start","Place the end","Set the bend"][count];
  if(tool==="doubleCurve")return ["Place the start","Place the end","Set the first bend","Set the second bend"][count];
  if(isPosition(tool)){
    if(!count)return "Place the entry";
    if(count===1)return tool==="longPosition"?"Place the target above entry":"Place the target below entry";
    return tool==="longPosition"?"Place the stop below entry":"Place the stop above entry";
  }
  if(tool==="anchoredVolumeProfile")return "Select the first bar for the volume profile";
  if(tool==="regressionTrend")return count?"Select the last bar for the regression":"Select the first bar for the regression";
  if(tool==="anchoredVwap")return "Select the VWAP starting bar";
  if(tool==="fixedRangeProfile")return count?"Select the last bar in the range":"Select the first bar in the range";
  if(tool==="ghostFeed")return count?"Set the end time and price":"Place the start of the ghost candles";
  if(tool==="projection")return ["Place the projection start","Set the deadline to the right","Place the target price"][count];
  if(tool==="positionForecast")return count?"Place the target at the deadline":"Place the forecast entry";
  if(tool==="barsPattern")return count?"Select the end of the source range":"Select the start of the source range";
  if(tool==="priceNote")return count?"Place the price note box":"Select the price to note";
  if(tool==="signpost")return count?"Set the height of the signpost":"Place the signpost pin";
  if(tool==="comment")return "Place the comment pointer";
  if(tool==="flagMark")return "Place the flag";
  if(tool==="callout")return count?"Place the callout box":"Place the callout pointer";
  if(tool==="note")return "Place the note at a price";
  if(tool==="anchoredNote")return "Place the note on the chart";
  if(tool==="priceLabel")return "Select a price on the chart";
  if(tool==="circle")return count?"Set the radius":"Place the center";
  if(tool==="ellipse")return ["Place the first end","Place the other end","Set the width"][count];
  if(tool==="triangle")return ["Place the first corner","Place the second corner","Place the third corner"][count];
  if(count===2)return tool==="fibExtension"?"Place the end of the pullback":"Place the second boundary";
  return count?"Place the end":`Place ${drawingTools[tool].toLowerCase()}`;
}


function appendDrawingAnchor(tool: Tool,anchors:Anchor[],anchor:Anchor):Anchor[]{
  if(tool==="projection"&&anchors.length===1)return [...anchors,{time:anchor.time,price:anchors[0].price}];
  if(tool==="projection"&&anchors.length===2)return [...anchors,{time:anchors[1].time,price:anchor.price}];
  if(tool==="signpost"&&anchors.length)return [anchors[0],{...anchor,time:anchors[0].time}];
  if(isPosition(tool)&&anchors.length===2)return [...anchors,{...anchor,time:anchors[1].time}];
  return [...anchors,anchor];
}


function requiresTimeInterval(tool:Tool){
  return tool==="cyclicLines"||tool==="timeCycles"||tool==="sineLine"||tool==="pitchfan";
}

function allowsFutureAnchor(tool: Tool|"select"|undefined){
  return (tool!==undefined&&tool!=="select"&&(isPatternTool(tool)||requiresTimeInterval(tool)))||
    isGann(tool)||isFibonacciDrawing(tool)||tool==="positionForecast"||tool==="projection"||tool==="ghostFeed";
}
