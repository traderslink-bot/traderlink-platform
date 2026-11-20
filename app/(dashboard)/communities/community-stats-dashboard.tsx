"use client";
import Box from "@mui/material/Box";
import {useEffect,useRef,useState,useSyncExternalStore,type SetStateAction} from "react";
import type {CommunityStatsReport,CommunityStatsTab} from "@/src/modules/communities/contracts/community-stats-contracts";
import {communityStatsValues,communityStatsPresentation} from "./community-stats-presentation";
import {StatsSectionTable} from "./community-stats-section";
import {CommunityStatsTable} from "./community-stats-tables";
import {StatsAnalystChart} from "./community-stats-analysts";
import {StatsMessageCharts,StatsMessageColumns} from "./community-stats-message-charts";
import {StatsDataChart} from "./community-stats-charts";
import {CommunityStatsViewers,type StatsViewerSelection} from "./community-stats-viewers";
import {CommunityStatsMemberDetail} from "./community-stats-member-detail";

const tabs:readonly [CommunityStatsTab,string][]=[["overview","Overview"],["server","Server"],["messages","Messages"],["team","Team"],["pages","Pages"],["members","Members"],["authors","Analysts"],["publishing","Publishing"]];
const day=86_400_000;
const dateBefore=(date:string,count:number)=>new Date(Date.parse(`${date}T00:00:00.000Z`)-count*day).toISOString().slice(0,10);
function StatsCardCsv({report,title,columns,rows}:{report:CommunityStatsReport;title:string;columns:readonly string[];rows:readonly object[]}){
  if(!report.canExport)return null;
  const download=()=>{
    const cell=(value:unknown)=>{let text=value===null||value===undefined?"":String(value);if(/^[\s]*[=+@-]/u.test(text))text=`'${text}`;return `"${text.replaceAll('"','""')}"`;};
    const text="\uFEFF"+[columns.map(cell).join(","),...rows.map(row=>columns.map(column=>cell((row as Record<string,unknown>)[column])).join(","))].join("\r\n");
    const url=URL.createObjectURL(new Blob([text],{type:"text/csv;charset=utf-8"})),link=document.createElement("a");
    link.href=url;link.download=`community-stats-${title.toLowerCase().replace(/[^a-z0-9]+/g,"-")}-${report.window.fromDate}-${report.window.throughDate}.csv`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  return <button className="cs-action" aria-label={`Export ${title} CSV`} onClick={download}>Export CSV</button>;
}
function StatsTrend({report,allTime=false}:{report:CommunityStatsReport;allTime?:boolean}){
  const svg=useRef<SVGSVGElement|null>(null);
  const plot=useRef<HTMLDivElement|null>(null);
  const [plotWidth,setPlotWidth]=useState(700);
  useEffect(()=>{const element=plot.current;if(!element)return;const observer=new ResizeObserver(entries=>{const width=entries[0]?.contentRect.width;if(width)setPlotWidth(Math.max(240,width));});observer.observe(element);return ()=>observer.disconnect();},[]);
  const baseline=260,plotHeight=225;
  const [style,setStyle]=useState<"bars"|"lines">("bars");
  const webOnly=report.scope==="own_content"||report.tab==="pages";
  const exportChart=()=>{if(!svg.current)return;const copy=svg.current.cloneNode(true) as SVGSVGElement;copy.style.color=getComputedStyle(svg.current).color;const originals=svg.current.querySelectorAll("*");copy.querySelectorAll("*").forEach((element,index)=>{const computed=getComputedStyle(originals[index]);if(element.hasAttribute("fill"))element.setAttribute("fill",computed.fill);if(element.hasAttribute("stroke"))element.setAttribute("stroke",computed.stroke);});copy.style.backgroundColor=getComputedStyle(svg.current.closest("section")!).backgroundColor;const url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(copy)],{type:"image/svg+xml;charset=utf-8"}));const link=document.createElement("a");link.href=url;link.download=`community-stats-${report.window.fromDate}-${report.window.throughDate}.svg`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
  const chartFrom=allTime&&report.trend.length?report.trend.reduce((first,point)=>point.date<first?point.date:first,report.trend[0].date):report.window.fromDate;
  const dates=Math.floor((Date.parse(report.window.throughDate)-Date.parse(chartFrom))/day)+1;
  const interval=Math.max(1,Math.ceil(dates/90));
  const chartTrend=interval===1?report.trend:[...report.trend.reduce((groups,point)=>{const offset=Math.floor((Date.parse(point.date)-Date.parse(chartFrom))/day/interval)*interval,date=new Date(Date.parse(chartFrom)+offset*day).toISOString().slice(0,10),prior=groups.get(date);groups.set(date,{date,web:(prior?.web??0)+point.web,discord:point.discord===null?prior?.discord??null:(prior?.discord??0)+point.discord});return groups;},new Map<string,{date:string;web:number;discord:number|null}>()).values()];
  const maximum=Math.max(1,...chartTrend.flatMap(point=>[point.web,point.discord??0]));
  const x=(date:string)=>20+(Date.parse(date)-Date.parse(chartFrom))/day*(plotWidth-40)/Math.max(1,dates-1);
  const tickCount=Math.min(6,dates);
  const ticks=Array.from({length:tickCount},(_,index)=>new Date(Date.parse(chartFrom)+Math.round(index*Math.max(0,dates-1)/Math.max(1,tickCount-1))*day).toISOString().slice(0,10));
  const tickLabel=(date:string)=>new Intl.DateTimeFormat("en",{month:"short",...(dates>90?{year:"numeric" as const}:{day:"numeric" as const}),timeZone:"UTC"}).format(new Date(date+"T00:00:00Z"));
  const line=(surface:"web"|"discord")=>{let previous:number|null=null;return chartTrend.map(point=>{const value=point[surface],date=Date.parse(point.date);if(value===null){previous=null;return "";}const connected=previous!==null&&date-previous===day*interval;previous=date;return `${connected?"L":"M"}${x(point.date)},${baseline-value/maximum*plotHeight}`;}).join(" ");};
  return <section className="cs-panel"><div className="cs-panel-head"><h2>Activity over time</h2><div className="cs-trend-tools"><div className="cs-trend-actions"><div className="cs-chart-toggle" role="group" aria-label="Activity chart style"><button className="cs-action" aria-pressed={style==="bars"} onClick={()=>setStyle("bars")}>Bars</button><button className="cs-action" aria-pressed={style==="lines"} onClick={()=>setStyle("lines")}>Lines</button></div><StatsCardCsv report={report} title="Activity over time" columns={webOnly?["UTC date","Webpage visits"]:["UTC date","Webpage visits","Discord contributions"]} rows={report.trend.map(point=>({"UTC date":point.date,"Webpage visits":point.web,"Discord contributions":point.discord}))}/>{report.canExport?<button className="cs-action" disabled={!report.trend.length} onClick={exportChart}>Export chart</button>:null}</div>
    <div className="cs-chart-legend"><span><i style={{background:"var(--cs-chart-0)"}}/>Webpage visits</span>{!webOnly?<span><i style={{background:"var(--cs-chart-1)"}}/>Discord contributions</span>:null}</div></div></div>
    <div ref={plot} className="cs-trend-plot">{report.trend.length?<svg ref={svg} xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${plotWidth} 300`} role="img" aria-label={webOnly?"Webpage visits by date":"Webpage visits and Discord contributions by date"} style={{width:"100%",height:300,color:"inherit"}}>
      <line x1="20" x2={plotWidth-20} y1={baseline} y2={baseline} stroke="currentColor" opacity=".25"/>
      {[...new Set([Math.ceil(maximum/2),maximum])].map(value=><g key={value}><line x1="20" x2={plotWidth-20} y1={baseline-value/maximum*plotHeight} y2={baseline-value/maximum*plotHeight} stroke="currentColor" opacity=".08"/><text x="20" y={baseline-4-value/maximum*plotHeight} fill="currentColor" fontSize="9" opacity=".7">{value.toLocaleString()}</text></g>)}
      {style==="lines"?<><path d={line("web")} fill="none" stroke="var(--cs-chart-0)" strokeWidth="2.5"/>{!webOnly?<path d={line("discord")} fill="none" stroke="var(--cs-chart-1)" strokeWidth="2.5" strokeDasharray="5 3"/>:null}</>:null}
      {chartTrend.map(point=><g key={point.date}><title>{`${point.date}: ${point.web} webpage visits${webOnly?"":point.discord===null?", Discord n/a":`, ${point.discord} Discord contributions`}`}</title>{style==="bars"?<><rect x={x(point.date)-4} y={baseline-point.web/maximum*plotHeight} width="5" height={point.web/maximum*plotHeight} rx="1" fill="var(--cs-chart-0)"/>{!webOnly&&point.discord!==null?<rect x={x(point.date)+2} y={baseline-point.discord/maximum*plotHeight} width="5" height={point.discord/maximum*plotHeight} rx="1" fill="var(--cs-chart-1)"/>:null}</>:<><circle cx={x(point.date)} cy={baseline-point.web/maximum*plotHeight} r="3" fill="var(--cs-chart-0)"/>{!webOnly&&point.discord!==null?<circle cx={x(point.date)} cy={baseline-point.discord/maximum*plotHeight} r="3" fill="var(--cs-chart-1)"/>:null}</>}</g>)}
      {ticks.map((date,index)=><text key={date} x={x(date)} y="286" textAnchor={index===0?"start":index===ticks.length-1?"end":"middle"} fontSize="10" fill="currentColor">{tickLabel(date)}</text>)}
    </svg>:<p className="cs-note">No recorded activity.</p>}</div>
  </section>;
}
function StatsOverviewCharts({report,onNavigate}:{report:CommunityStatsReport;onNavigate:(tab:CommunityStatsTab,analystId?:string)=>void}){
  const discord=report.sections.filter(section=>["Discord messages by channel","Discord activity by type","Current members by join month"].includes(section.title));
  const webpages=report.sections.filter(section=>["Analyst engagement","Webpage audience"].includes(section.title));
  // Independent stacks keep shorter cards from leaving a hole below a taller neighbour.
  // With only webpage access, put its two cards side by side on desktop instead.
  const columns=discord.length&&webpages.length?[discord,webpages]:[...discord,...webpages].map(section=>[section]);
  if(!columns.length)return null;
  return <div className="cs-summary-columns">{columns.map(sections=><div className="cs-summary-stack" key={sections[0].title}>{sections.map(section=><section className="cs-panel" key={section.title}><div className="cs-panel-head"><h2>{section.title}</h2>{section.title==="Analyst engagement"?<StatsCardCsv report={report} title={section.title} columns={["Analyst","Viewers"]} rows={section.rows}/>:null}<button className="cs-link" onClick={()=>onNavigate(section.title==="Analyst engagement"?"authors":section.title.startsWith("Discord")?"messages":section.title==="Current members by join month"?"server":"pages")}>{section.title==="Analyst engagement"?"View Analysts":section.title.startsWith("Discord")?"View Messages":section.title==="Current members by join month"?"View Server":"View Pages"}</button></div>{section.title==="Analyst engagement"?<StatsAnalystChart rows={section.rows} onAnalyst={id=>onNavigate("authors",id)}/>:section.title.startsWith("Discord")&&!section.rows.length&&report.metrics.some(metric=>metric.label==="Discord messages"&&metric.value===null)?<p className="cs-note">n/a</p>:section.title==="Current members by join month"?<StatsMessageColumns rows={section.rows} label="Join month UTC" value="Current members"/>:<StatsDataChart data={{kind:"donut",label:section.columns[0],series:[section.columns[1]],rows:section.rows,scope:"",maxItems:section.title==="Discord messages by channel"?5:8}}/>}</section>)}</div>)}</div>;
}

type HourlyFilters={search:string;content:string;author:string};
function StatsHourlyActivity({report,endpoint,role,filters,onFilters}:{report:CommunityStatsReport;endpoint:string;role:string;filters:HourlyFilters;onFilters:(filters:HourlyFilters)=>void}){
  const [filtered,setFiltered]=useState<{key:string;report:CommunityStatsReport}|null>(null),[error,setError]=useState<{key:string;message:string}|null>(null);
  const requestKey=JSON.stringify([report.window.fromDate,report.window.throughDate,report.window.asOfUtc,role,filters.search,filters.content,filters.author]);
  const current=filtered?.key===requestKey?filtered.report:null,currentError=error?.key===requestKey?error.message:"";
  const active=!!(filters.search||filters.content||filters.author);
  useEffect(()=>{
    if(!active)return;
    const controller=new AbortController(),query=new URLSearchParams({tab:"timing",from:report.window.fromDate,through:report.window.throughDate});
    if(role)query.set("role",role);if(filters.search)query.set("search",filters.search);if(filters.content)query.set("content",filters.content);if(filters.author)query.set("author",filters.author);
    const timer=setTimeout(()=>{void fetch(`${endpoint}?${query}`,{signal:controller.signal,cache:"no-store",credentials:"same-origin"}).then(async response=>{if(!response.ok)throw new Error("Unable to load this chart.");return response.json() as Promise<CommunityStatsReport>;}).then(value=>{if(!controller.signal.aborted){setFiltered({key:requestKey,report:value});setError(null);}}).catch(reason=>{if(!controller.signal.aborted&&reason.name!=="AbortError")setError({key:requestKey,message:"Unable to load this chart."});});},250);
    return()=>{clearTimeout(timer);controller.abort();};
  },[endpoint,active,requestKey,filters.search,filters.content,filters.author,role,report.window.fromDate,report.window.throughDate]);
  const hourly=report.hourlyActivity;if(!hourly)return null;
  const catalog=current?.catalog??report.catalog,authors=[...new Map(catalog.filter(item=>item.authorUserId||item.contributorUserId).map(item=>[item.contributorUserId??item.authorUserId!,item.contributorName??item.authorName??"n/a"])).entries()];
  return <>{hourly.columns.includes("Webpage visits")?<div className="cs-controls cs-page-filters"><label className="cs-field">Search pages or analysts<input type="search" maxLength={80} value={filters.search} onChange={event=>onFilters({...filters,search:event.target.value})}/></label><label className="cs-field">Page<select value={filters.content} onChange={event=>onFilters({...filters,content:event.target.value})}><option value="">All eligible pages</option>{catalog.map(item=><option key={item.id} value={item.id}>{item.title}</option>)}</select></label><label className="cs-field">Analyst<select value={filters.author} onChange={event=>onFilters({...filters,author:event.target.value})}><option value="">All analysts</option>{authors.map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label><button className="cs-action" onClick={()=>onFilters({search:"",content:"",author:""})}>Clear page filters</button></div>:null}<div className="cs-grid">{["Webpage visits","Discord contributions","Discord messages"].filter(label=>hourly.columns.includes(label)).map(label=>{
    const web=label==="Webpage visits",rows=web&&active?current?.rows??[]:hourly.rows,pending=web&&active&&!current&&!currentError;
    const cellWidth=Math.max(24,...rows.map(row=>typeof row[label]==="number"?Number(row[label]).toLocaleString().length*6+6:24));
    const highest=Math.max(1,...rows.map(row=>Number(row[label]))),values=new Map(rows.map(row=>[`${row["Weekday UTC"]}:${Number(row["Hour UTC"])}`,row[label]===null?null:Number(row[label])]));
    return <section className="cs-panel" key={label}><div className="cs-panel-head"><h2>{label} by time</h2>{!pending&&!(web&&currentError)?<StatsCardCsv report={web&&active&&current?current:report} title={`${label} by time`} columns={["Weekday UTC","Hour UTC",label]} rows={rows}/>:null}</div>

      {pending?<p role="status" className="cs-note">Loading chart…</p>:web&&currentError?<p role="alert" className="cs-error">{currentError}</p>:<div className="cs-heatmap-scroll" tabIndex={0} role="region" aria-label={`${label} hourly counts`}><div className="cs-heatmap" style={{gridTemplateColumns:`40px repeat(24,minmax(${cellWidth}px,1fr))`,minWidth:40+24*(cellWidth+3)}} role="img" aria-label={`${label} by weekday and hour in UTC`}><span/>{Array.from({length:24},(_,hour)=><span key={`hour-${hour}`}>{hour}</span>)}{["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].flatMap((weekday,index)=>[<span key={weekday}>{weekday}</span>,...Array.from({length:24},(_,hour)=>{const value=values.get(`${index}:${hour}`);return <span key={`${weekday}-${hour}`} title={`${weekday} ${hour}:00 UTC: ${value===undefined?"No recorded activity":value===null?"n/a":value}`} style={{height:28,borderRadius:3,display:"grid",placeItems:"center",fontVariantNumeric:"tabular-nums",background:value===undefined||value===null?"var(--cs-heatmap-empty)":`color-mix(in srgb, var(--cs-heatmap-color) ${15+85*value/highest}%, transparent)`,color:value!==undefined&&value!==null&&value/highest>.55?"var(--cs-heatmap-text)":"inherit"}}>{value===undefined?"":value===null?"n/a":value.toLocaleString()}</span>;})])}</div></div>}
    </section>;
  })}</div></>;
}
function restoreStatsNavigation(search:string,initialTab:CommunityStatsTab,today:string){
  const saved=new URLSearchParams(search),requested=saved.get("tab");
  const fallback=initialTab==="timing"?"overview":initialTab==="participation"||initialTab==="cohorts"?"members":initialTab==="visits"?"pages":initialTab;
  const tab=tabs.some(([key])=>key===requested)?requested as CommunityStatsTab:fallback;
  const state={tab,range:"30",from:dateBefore(today,29),through:today,role:"",content:"",author:"",search:"",contentKind:(tab==="authors"?"posts":"") as ""|"posts"|"alert"|"watchlist",segment:"",postingPrior:"30",postingQuiet:"14",postingDays:"3",page:1,memberPage:1,member:""};
  const validDate=(value:string|null):value is string=>typeof value==="string"&&/^\d{4}-\d{2}-\d{2}$/u.test(value)&&value>="2015-01-01"&&value<=today&&Number.isFinite(Date.parse(value+"T00:00:00Z"))&&new Date(value+"T00:00:00Z").toISOString().slice(0,10)===value;
  const from=saved.get("from"),through=saved.get("through");
  if(validDate(from)&&validDate(through)&&from<=through){state.from=from;state.through=through;state.range=from==="2015-01-01"&&through===today?"all":["7","30","90","365"].find(days=>through===today&&from===dateBefore(today,Number(days)-1))??"custom";}
  const role=saved.get("role");if(role&&/^\d{1,32}$/u.test(role)&&tab!=="team"&&tab!=="publishing")state.role=role;
  if(["pages","authors","publishing"].includes(tab)){
    for(const key of ["content","author","search"] as const){const value=saved.get(key);if(value&&value.length<=(key==="search"?80:180))state[key]=value;}
    const kind=saved.get("contentKind");if(["posts","alert","watchlist"].includes(kind??"")&&tab!=="publishing")state.contentKind=kind as "posts"|"alert"|"watchlist";
  }
  const segment=saved.get("segment");if(tab==="members"&&["stopped_posting","discord_any","web_any","both"].includes(segment??""))state.segment=segment!;
  for(const [key,allowed]of [["postingPrior",[7,30,90]],["postingQuiet",[7,14,30]],["postingDays",[1,3,5]]] as const){const value=saved.get(key);if(value&&allowed.some(number=>number===Number(value)))state[key]=value;}
  for(const key of ["page","memberPage"] as const){const value=Number(saved.get(key)??1);if(Number.isSafeInteger(value)&&value>0&&Number.isSafeInteger(value*25))state[key]=value;}
  const member=saved.get("member");if(tab==="members"&&member&&/^\d{1,32}$/u.test(member))state.member=member;
  return state;
}
const statsLocationEvent="community-stats-location";
const subscribeToInitialLocation=(notify:()=>void)=>{window.addEventListener("popstate",notify);window.addEventListener(statsLocationEvent,notify);return()=>{window.removeEventListener("popstate",notify);window.removeEventListener(statsLocationEvent,notify);};};
type StatsReturnState={community:string;href:string;scrollY:number;focusMember:string;returnHref?:string;token?:string};
function statsHistoryState(community:string,href:string):StatsReturnState|null{
  const value=window.history.state?.communityStatsNavigation as StatsReturnState|undefined;
  return value?.community===community&&value.href===href&&Number.isFinite(value.scrollY)&&value.scrollY>=0&&typeof value.focusMember==="string"?value:null;
}
/** Next's native-history adapter copies its own internals. Passing __NA/_N
 * ourselves marks the call as internal and bypasses its URL synchronization. */
function statsExternalHistoryState(value:StatsReturnState|undefined){
  const state={...window.history.state,communityStatsNavigation:value};
  delete state.__NA;delete state._N;delete state.__PRIVATE_NEXTJS_INTERNALS_TREE;
  return state;
}
function ownsStatsLocation(location:string,community:string){
  const path=location.split("?",1)[0],base=`/communities/${encodeURIComponent(community)}/stats`;
  return path===base||["activity","analysts","team"].some(report=>path===`${base}/${report}`);
}
const statsSearchFromLocation=(location:string)=>location.includes("?")?location.slice(location.indexOf("?")):"";
const clientLocationSearch=()=>window.location.pathname+window.location.search;
const serverLocationSearch=()=>null;
/** Wait for the client URL before mounting report state, keeping hydration and
 * the first request consistent without a post-render state reset. */
export function CommunityStatsDashboard(props:{communitySlug:string;initialTab?:CommunityStatsTab}){
  const location=useSyncExternalStore<string|null>(subscribeToInitialLocation,clientLocationSearch,serverLocationSearch);
  if(location===null)return <Box sx={communityStatsPresentation} aria-busy><div className="cs-title"><h1>{props.initialTab==="authors"?"Analysts":props.initialTab==="team"?"Team":"Stats"}</h1></div><p role="status" className="cs-note">Loading Stats…</p></Box>;
  if(!ownsStatsLocation(location,props.communitySlug))return null;
  const path=location.split("?",1)[0],initialTab=path.endsWith("/analysts")?"authors":path.endsWith("/team")?"team":props.initialTab??"overview";
  return <CommunityStatsDashboardReport key={props.communitySlug} {...props} initialTab={initialTab} initialLocation={location}/>;
}
function CommunityStatsDashboardReport({communitySlug,initialTab="overview",initialLocation}:{communitySlug:string;initialTab?:CommunityStatsTab;initialLocation:string}){
  const [today]=useState(()=>new Date().toISOString().slice(0,10));
  const [initial]=useState(()=>restoreStatsNavigation(statsSearchFromLocation(initialLocation),initialTab,today));
  const [navigation,setNavigation]=useState(initial);
  const {tab,range,from,through,content,author,segment,page,member,memberPage,postingPrior,postingQuiet,postingDays,role,search:catalogSearch,contentKind}=navigation;
  function change<K extends keyof typeof initial>(key:K,value:SetStateAction<(typeof initial)[K]>){setNavigation(previous=>({...previous,[key]:typeof value==="function"?(value as (old:(typeof initial)[K])=>(typeof initial)[K])(previous[key]):value}));}
  const setTab=(value:SetStateAction<CommunityStatsTab>)=>change("tab",value);
  const setRange=(value:SetStateAction<string>)=>change("range",value);
  const setFrom=(value:SetStateAction<string>)=>change("from",value);
  const setThrough=(value:SetStateAction<string>)=>change("through",value);
  const setContent=(value:SetStateAction<string>)=>change("content",value);
  const setAuthor=(value:SetStateAction<string>)=>change("author",value);
  const setSegment=(value:SetStateAction<string>)=>change("segment",value);
  const setPage=(value:SetStateAction<number>)=>change("page",value);
  const setMember=(value:SetStateAction<string>)=>change("member",value);
  const setMemberPage=(value:SetStateAction<number>)=>change("memberPage",value);
  const setPostingPrior=(value:SetStateAction<string>)=>change("postingPrior",value);
  const setPostingQuiet=(value:SetStateAction<string>)=>change("postingQuiet",value);
  const setPostingDays=(value:SetStateAction<string>)=>change("postingDays",value);
  const setRole=(value:SetStateAction<string>)=>change("role",value);
  const setCatalogSearch=(value:SetStateAction<string>)=>change("search",value);
  const setContentKind=(value:SetStateAction<""|"posts"|"alert"|"watchlist">)=>change("contentKind",value);
  const [reload,setReload]=useState(0),[response,setResponse]=useState<{key:string;report:CommunityStatsReport|null;error:string}|null>(null);
  const [viewers,setViewers]=useState<StatsViewerSelection|null>(null);
  const [hourlyFilters,setHourlyFilters]=useState<HourlyFilters>({search:"",content:"",author:""});
  const [appliedLocation,setAppliedLocation]=useState(initialLocation);
  const container=useRef<HTMLDivElement>(null),historyPush=useRef(false),ownedDetails=useRef(new Set<string>()),pendingFocus=useRef<"report"|"member"|"return"|null>(null);
  const locationChanged=appliedLocation!==initialLocation;
  // Adjust before children commit a different location, never in a URL-writing effect.
  if(locationChanged){setAppliedLocation(initialLocation);setNavigation(restoreStatsNavigation(statsSearchFromLocation(initialLocation),initialTab,today));setViewers(null);}
  useEffect(()=>{const returning=()=>{pendingFocus.current="return";setReload(value=>value+1);};window.addEventListener("popstate",returning);return()=>window.removeEventListener("popstate",returning);},[]);
  const savePosition=(focusMember="")=>{
    if(!ownsStatsLocation(window.location.pathname,communitySlug))return;
    const href=window.location.pathname+window.location.search,previous=statsHistoryState(communitySlug,href);
    const list=new URLSearchParams(window.location.search);list.delete("member");list.delete("memberPage");list.sort();
    const listHref=`/communities/${encodeURIComponent(communitySlug)}/stats/activity?${list}`;
    const origin=previous?.token&&ownedDetails.current.has(previous.token)&&previous.returnHref===listHref?{token:previous.token,returnHref:previous.returnHref}:{};
    window.history.replaceState({...window.history.state,communityStatsNavigation:{community:communitySlug,href,scrollY:window.scrollY,focusMember,...origin}},"",href);
  };
  const beginNavigation=()=>{savePosition();historyPush.current=true;pendingFocus.current="report";};
  const query=new URLSearchParams({tab,from,through,quiet:"7",calendar:"calendar_days",page:String(page)});
  if(content)query.set("content",content);if(author)query.set("author",author);if(segment&&!(member&&segment==="stopped_posting"))query.set("segment",segment);if(member){query.set("member",member);query.set("memberPage",String(memberPage));}
  if(role&&tab!=="publishing")query.set("role",role);
  if(catalogSearch&&["pages","visits","authors","publishing"].includes(tab))query.set("search",catalogSearch);
  if(contentKind&&["pages","visits","authors"].includes(tab))query.set("contentKind",contentKind);
  if(tab==="members"&&segment==="stopped_posting"){const postingFrom=Number.isFinite(Date.parse(through))?dateBefore(through,Number(postingPrior)+Number(postingQuiet)):"2015-01-01";query.set("from",postingFrom<"2015-01-01"?"2015-01-01":postingFrom);query.set("quiet",postingQuiet);query.set("calendar","calendar_days");query.set("postingPrior",postingPrior);query.set("postingQuiet",postingQuiet);query.set("postingDays",postingDays);}
  const excelQuery=new URLSearchParams(query);
  if(tab==="overview"){if(hourlyFilters.content)excelQuery.set("hourlyContent",hourlyFilters.content);if(hourlyFilters.author)excelQuery.set("hourlyAuthor",hourlyFilters.author);if(hourlyFilters.search)excelQuery.set("hourlySearch",hourlyFilters.search);}
  const queryText=query.toString(),endpoint=`/api/communities/${encodeURIComponent(communitySlug)}/stats`;
  const reportKey=JSON.stringify([endpoint,queryText,reload]);
  const report=response?.key===reportKey?response.report:null,error=response?.key===reportKey?response.error:"",loading=response?.key!==reportKey;
  useEffect(()=>{
    if(!ownsStatsLocation(window.location.pathname,communitySlug))return;
    const controller=new AbortController();
    const timer=setTimeout(()=>{if(!ownsStatsLocation(window.location.pathname,communitySlug))return;void fetch(`${endpoint}?${queryText}`,{signal:controller.signal,cache:"no-store",credentials:"same-origin"}).then(async response=>{if(!response.ok)throw new Error("This Stats report is unavailable. Check your access and date range.");return response.json() as Promise<CommunityStatsReport>;}).then(value=>{if(controller.signal.aborted)return;setResponse({key:reportKey,report:value,error:""});}).catch(reason=>{if(!controller.signal.aborted&&reason.name!=="AbortError"){setResponse(previous=>({key:reportKey,report:previous?.report??null,error:reason.message}));}});},250);
    return()=>{clearTimeout(timer);controller.abort();};
  },[endpoint,queryText,reload,reportKey,communitySlug]);
  const locationQuery=new URLSearchParams(queryText);
  // The stopped-posting API derives a wider window; the URL retains the list's original dates.
  locationQuery.set("from",from);locationQuery.set("through",through);
  if(segment)locationQuery.set("segment",segment);
  locationQuery.sort();
  const locationQueryText=locationQuery.toString();
  useEffect(()=>{
    if(locationChanged||!ownsStatsLocation(window.location.pathname,communitySlug))return;
    const path=`/communities/${encodeURIComponent(communitySlug)}/stats/${tab==="authors"?"analysts":tab==="team"?"team":"activity"}`;
    const href=`${path}?${locationQueryText}`;
    if(window.location.pathname+window.location.search!==href){
      if(historyPush.current){
        const previous=window.location.pathname+window.location.search,token=crypto.randomUUID();
        if(member)ownedDetails.current.add(token);
        window.history.pushState(statsExternalHistoryState({community:communitySlug,href,scrollY:0,focusMember:"",...(member?{returnHref:previous,token}:{})}),"",href);
      }else {
        const previous=statsHistoryState(communitySlug,window.location.pathname+window.location.search);
        window.history.replaceState(statsExternalHistoryState(member&&previous?.token?{...previous,href}:undefined),"",href);
      }
      window.dispatchEvent(new Event(statsLocationEvent));
    }
    historyPush.current=false;
  },[communitySlug,tab,member,locationQueryText,locationChanged]);
  const navigate=(next:CommunityStatsTab,analystId?:string)=>{if(!ownsStatsLocation(window.location.pathname,communitySlug))return;if(next!==tab||member||analystId)beginNavigation();if(next==="authors"&&!contentKind)setContentKind("posts");if(next==="team")setRole("");if(analystId){setAuthor(analystId);setContent("");setCatalogSearch("");}setTab(next);setPage(1);setMember("");setSegment("");if(!["pages","visits","authors","publishing"].includes(next)){setContent("");setAuthor("");setCatalogSearch("");setContentKind("");}};
  const openMember=(id:string)=>{
    if(!ownsStatsLocation(window.location.pathname,communitySlug))return;
    if(tab==="members"){savePosition(id);historyPush.current=true;}else beginNavigation();
    pendingFocus.current="member";setTab("members");setMember(id);setMemberPage(1);
    if(tab!=="members"){setContent("");setAuthor("");setCatalogSearch("");setSegment("");setPage(1);}
  };
  const closeMember=()=>{
    if(!ownsStatsLocation(window.location.pathname,communitySlug))return;
    const state=statsHistoryState(communitySlug,window.location.pathname+window.location.search),listQuery=new URLSearchParams(locationQueryText);listQuery.delete("member");listQuery.delete("memberPage");
    const listHref=`/communities/${encodeURIComponent(communitySlug)}/stats/activity?${listQuery}`;
    if(state?.token&&ownedDetails.current.has(state.token)&&state.returnHref===listHref){window.history.back();return;}
    pendingFocus.current="return";setMember("");setMemberPage(1);
  };
  useEffect(()=>{
    if(!report||error||loading||locationChanged||!pendingFocus.current||!ownsStatsLocation(window.location.pathname,communitySlug))return;
    const mode=pendingFocus.current;pendingFocus.current=null;
    const state=statsHistoryState(communitySlug,window.location.pathname+window.location.search);
    const section=container.current?.querySelector<HTMLElement>(member?'section[aria-label^="Activity for "]':"[data-stats-list]");
    let target=section?.querySelector<HTMLElement>("h2")??container.current?.querySelector<HTMLElement>("h1");
    if(mode==="return"&&!member&&state?.focusMember){const index=report.rows.findIndex(row=>String(row.memberId)===state.focusMember);if(index>=0)target=section?.querySelectorAll<HTMLElement>("tbody tr")[index]?.querySelector<HTMLElement>("button.cs-link")??target;}
    if(mode==="return"&&state)window.scrollTo({top:state.scrollY,behavior:"instant"});
    else if(mode!=="return"&&target){
      const header=[...document.querySelectorAll<HTMLElement>("header")].find(element=>{const style=getComputedStyle(element);return style.position==="fixed"&&Number.parseFloat(style.top)===0;});
      const bottom=header?.getBoundingClientRect().bottom;
      // Measure the real toolbar, including its mobile safe area and border.
      // The fallback mirrors the shell's 64px contract when layout is not ready.
      target.style.scrollMarginTop=bottom!==undefined&&Number.isFinite(bottom)&&bottom>0?`${Math.ceil(bottom)+16}px`:"calc(64px + env(safe-area-inset-top, 0px) + 16px)";
      target.scrollIntoView?.({block:"start"});
    }
    if(target){if(!target.matches("button,a,input,select"))target.tabIndex=-1;target.focus({preventScroll:true});}
  },[report,error,loading,locationChanged,member,communitySlug]);
  const chooseRange=(value:string)=>{setRange(value);setPage(1);if(value!=="custom"){setThrough(today);setFrom(value==="all"?"2015-01-01":dateBefore(today,Number(value)-1));}};
  const stoppedMode=tab==="members"&&segment==="stopped_posting";
  const webFilters=["pages","visits","authors","publishing"].includes(tab);
  const controlReport=response?.report,controlCatalog=controlReport?.catalog??[];
  const own=controlReport?.scope==="own_content";
  const availableTabs=tabs.filter(([key])=>(!own||["overview","pages","authors","publishing"].includes(key))&&(key!=="team"||controlReport?.canReadTeam)&&(key!=="members"||controlReport?.canReadMembers));
  const authors=[...new Map(controlCatalog.filter(item=>item.authorUserId||item.contributorUserId).map(item=>[item.contributorUserId??item.authorUserId!,item.contributorName??item.authorName??"n/a"])).entries()];
  const selectedPage=report?.catalog.find(item=>item.id===content);
  const participationKnown=!!report&&(Object.values(report.segments).some(count=>count>0)||report.sources.some(source=>source.source==="membership"&&source.status==="collecting"));
  const participationCounts=report?(()=>{
    const discord=(report.segments.both??0)+(report.segments.discord_only??0)+(report.segments.discord_active??0);
    const web=(report.segments.both??0)+(report.segments.web_only??0)+(report.segments.web_active??0);
    const discordKnown=report.metrics.some(metric=>metric.label==="Discord contributors"&&metric.value!==null);
    const webKnown=report.metrics.some(metric=>metric.label==="Webpage viewers"&&metric.value!==null);
    const both=report.segments.both??0;
    return {both:both>0||discordKnown&&webKnown?both:null,discord_any:discord>0||discordKnown?discord:null,web_any:web>0||webKnown?web:null};
  })():null;
  const participationLabels:Record<string,string>={both:"Discord + webpages",discord_any:"Discord contributors",web_any:"Webpage visitors"};

  return <Box ref={container} sx={communityStatsPresentation} aria-busy={loading}>
    <div className="cs-title"><h1>{tab==="authors"?"Analysts":tab==="team"?"Team":"Stats"}</h1><div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{report?.ready&&report.canExport&&!loading&&!error?<a className="cs-action" href={`${endpoint}?${excelQuery}&format=xlsx`}>Export Excel</a>:null}<button className="cs-action" onClick={()=>setReload(value=>value+1)} disabled={loading}>Refresh</button></div></div>
    <div className="cs-controls">{!stoppedMode?<><label className="cs-field">Date range<select value={range} onChange={event=>chooseRange(event.target.value)}><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option><option value="365">Last year</option><option value="all">All time</option><option value="custom">Custom</option></select></label><label className="cs-field">From UTC<input type="date" value={from} min="2015-01-01" max={through} onChange={event=>{setFrom(event.target.value);setRange("custom");setPage(1);}}/></label></>:null}<label className="cs-field">{stoppedMode?"As of UTC":"Through UTC"}<input type="date" value={through} min={stoppedMode?"2015-01-01":from} max={today} onChange={event=>{setThrough(event.target.value);setRange("custom");setPage(1);}}/></label></div>
    <nav className="cs-tabs" aria-label="Stats reports">{availableTabs.map(([key,label])=><button key={key} aria-current={tab===key?"page":undefined} onClick={()=>navigate(key)}>{label}</button>)}</nav>
    {controlReport&&tab!=="publishing"&&tab!=="team"?<div className="cs-controls cs-member-filters"><label className="cs-field">Current Discord role<select value={role} onChange={event=>{setRole(event.target.value);setPage(1);setMember("");}}><option value="">All members</option>{controlReport.roles.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label>{tab==="members"?<label className="cs-field">Member activity<select value={segment} onChange={event=>{setSegment(event.target.value);setPage(1);}}><option value="">All members</option><option value="stopped_posting">Members who stopped posting</option><option value="discord_any">Discord contributors</option><option value="web_any">Webpage visitors</option><option value="both">Discord + webpages</option></select></label>:null}</div>:null}
    {tab==="members"&&segment==="stopped_posting"?<div className="cs-controls"><label className="cs-field">Previous posting period<select value={postingPrior} onChange={event=>{setPostingPrior(event.target.value);setPage(1);}}>{[7,30,90].map(days=><option key={days} value={days}>{days} days</option>)}</select></label><label className="cs-field">Minimum posting days<select value={postingDays} onChange={event=>{setPostingDays(event.target.value);setPage(1);}}>{[1,3,5].map(days=><option key={days} value={days}>{days} days</option>)}</select></label><label className="cs-field">Then no posts for<select value={postingQuiet} onChange={event=>{setPostingQuiet(event.target.value);setPage(1);}}>{[7,14,30].map(days=><option key={days} value={days}>{days} complete days</option>)}</select></label></div>:null}
      {webFilters?<div className="cs-controls cs-page-filters">{["authors","pages","visits"].includes(tab)?<label className="cs-field">Content<select value={contentKind} onChange={event=>{setContentKind(event.target.value as ""|"posts"|"alert"|"watchlist");setContent("");setPage(1);}}>{tab!=="authors"?<option value="">All page types</option>:null}<option value="posts">Alerts &amp; Watchlists</option><option value="alert">Alerts</option><option value="watchlist">Watchlists</option></select></label>:null}<label className="cs-field">Search pages or analysts<input type="search" maxLength={80} value={catalogSearch} onChange={event=>{setCatalogSearch(event.target.value);setPage(1);}}/></label><label className="cs-field">Page<select value={content} onChange={event=>{setContent(event.target.value);setPage(1);}}><option value="">All eligible pages</option>{controlCatalog.map(item=><option key={item.id} value={item.id}>{item.title}</option>)}</select></label><label className="cs-field">Analyst<select value={author} onChange={event=>{setAuthor(event.target.value);setPage(1);}}><option value="">All analysts</option>{authors.map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label><button className="cs-action" onClick={()=>{setContent("");setAuthor("");setCatalogSearch("");setContentKind(tab==="authors"?"posts":"");setPage(1);}}>Clear page filters</button></div>:null}
    {error?<section className="cs-panel cs-error" role="alert">{error}<button className="cs-action" onClick={()=>setReload(value=>value+1)}>Retry</button></section>:null}
    {loading?<p role="status" className="cs-note">Loading Stats…</p>:null}
    {report&&!error&&!loading?<>
      {!report.ready?<section className="cs-panel"><h2>Stats n/a</h2><p>{report.notes[0]}</p></section>:<>
      {report.metrics.length?<div className="cs-metrics">{report.metrics.filter(metric=>!own||!metric.label.startsWith("Discord")).map(metric=><div className="cs-metric" key={metric.label}><span>{metric.label}</span><strong>{metric.value===null?"n/a":metric.value.toLocaleString()}</strong>{metric.previous!==null?<span>{metric.previous.toLocaleString()} in prior period</span>:null}</div>)}</div>:null}

      {tab==="overview"||tab==="pages"&&content?<StatsTrend report={report} allTime={range==="all"}/>:null}
      {tab==="messages"?<StatsMessageCharts report={report} renderCsv={(title,columns,rows)=><StatsCardCsv report={report} title={title} columns={columns} rows={rows}/>}/>:null}
      {tab==="overview"?<StatsOverviewCharts report={report} onNavigate={navigate}/>:null}
      {tab==="pages"&&selectedPage?<section className="cs-panel"><div className="cs-panel-head"><h2>{selectedPage.title}</h2>{selectedPage.state==="published"&&selectedPage.path?<a className="cs-action" href={selectedPage.path}>Open published page</a>:null}{report.canReadNamed&&!own?<button className="cs-action" onClick={()=>setViewers({title:selectedPage.title,contentId:selectedPage.id,authorId:author||undefined})}>View viewers</button>:null}</div><dl><dt>{selectedPage.targetKind==="watchlist_item"?"First published by":"Author"}</dt><dd>{selectedPage.targetKind==="watchlist_item"?selectedPage.contributorName??"n/a":selectedPage.authorName??"Community"}</dd><dt>State</dt><dd>{communityStatsValues[selectedPage.state]??selectedPage.state}</dd><dt>Publication format</dt><dd>{communityStatsValues[selectedPage.publicationMode??"unknown"]}</dd></dl></section>:null}
      {tab==="overview"||tab==="messages"?<StatsHourlyActivity report={report} endpoint={endpoint} role={role} filters={hourlyFilters} onFilters={setHourlyFilters}/>:null}
      {tab==="overview"&&!own?<section className="cs-panel"><div className="cs-panel-head"><h2>Participation</h2><span className="cs-note">Selected dates</span><StatsCardCsv report={report} title="Participation summary" columns={["Participation","Members"]} rows={Object.entries(participationCounts??{}).map(([key,value])=>({Participation:participationLabels[key],Members:value}))}/></div>{participationKnown?<><div className="cs-segments">{["discord_any","web_any","both"].map(key=><button className="cs-segment" key={key} disabled={!report.canReadMembers} onClick={()=>{navigate("members");setSegment(key);}}>{participationLabels[key]}<strong>{participationCounts?.[key as keyof typeof participationCounts]??"n/a"}</strong></button>)}</div></>:<p className="cs-note">Participation will appear once Discord members are available.</p>}</section>:null}
      {member&&report.member?<CommunityStatsMemberDetail member={report.member} onClose={closeMember} onPage={setMemberPage} timelineExportUrl={report.canExport?`${endpoint}?${queryText}&format=csv&timeline=1`:undefined}/>:null}
      {member&&!report.member?<section className="cs-panel"><h2>Member detail n/a</h2><button className="cs-action" onClick={closeMember}>Close member</button></section>:null}
      <div className="cs-report-grid">{!member&&report.columns.length&&tab!=="cohorts"&&tab!=="overview"&&tab!=="timing"?<section data-stats-list className={`cs-panel ${tab==="messages"?"cs-report-card-compact":report.columns.length<=5?"cs-report-card-compact":"cs-report-card-wide"}`}><div className="cs-panel-head"><h2>{tab==="team"?"Roles and permissions":tab==="messages"?"Server Members":tab==="members"&&segment==="stopped_posting"?"Members who stopped posting":tabs.find(([key])=>key===tab)?.[1]??"Activity"}</h2>{report.canExport?<a className="cs-action" aria-label={`Export ${tab==="team"?"roles and permissions":tabs.find(([key])=>key===tab)?.[1]??"activity"} CSV`} href={`${endpoint}?${queryText}&format=csv`}>Export CSV</a>:null}</div><CommunityStatsTable columns={report.columns} rows={report.rows} emptyMessage={report.postingStatus==="needs_tracking"?"Not enough tracking yet. Check channel tracking in Settings.":undefined} onMember={report.canReadMembers?openMember:undefined} onContent={id=>{navigate("pages");setContent(id);setTab("pages");setMember("");setMemberPage(1);setSegment("");setPage(1);}} onViewers={report.canReadNamed&&!own?row=>setViewers({title:String(row.Analyst??row.Page??"Content"),authorId:row.authorId?String(row.authorId):author||undefined,contentId:row.contentId?String(row.contentId):undefined}):undefined} onAuthor={id=>{navigate("pages");setAuthor(id);setContent("");setTab("pages");setMember("");setMemberPage(1);setSegment("");setPage(1);}}/>{report.totalRows>report.pageSize?<div className="cs-pager"><button className="cs-action" disabled={page<=1||loading} onClick={()=>setPage(value=>value-1)}>Previous</button><span className="cs-note">Page {page} of {Math.ceil(report.totalRows/report.pageSize)}</span><button className="cs-action" disabled={page*report.pageSize>=report.totalRows||loading} onClick={()=>setPage(value=>value+1)}>Next</button></div>:null}</section>:null}
      {!member&&report.sections.filter(section=>tab!=="overview"||!["Analyst engagement","Webpage audience","Discord messages by channel","Discord activity by type","Current members by join month"].includes(section.title)).map(section=><section className={`cs-panel ${section.columns.length<=5?"cs-report-card-compact":"cs-report-card-wide"}`} key={section.title}><div className="cs-panel-head"><h2>{section.title}</h2>{report.canExport?<a className="cs-action" aria-label={`Export ${section.title} CSV`} href={`${endpoint}?${queryText}&format=csv&section=${encodeURIComponent(section.title)}`}>Export CSV</a>:null}</div>{section.title==="Current members by join month"?<StatsMessageColumns rows={section.rows} label="Join month UTC" value="Current members"/>:tab!=="team"?<StatsSectionTable section={section} endpoint={endpoint} queryText={queryText} onMember={report.canReadMembers?openMember:undefined}/>:<CommunityStatsTable columns={section.columns} rows={section.rows} onMember={report.canReadMembers?openMember:undefined} emptyMessage={section.title==="Server Bots"?"n/a":undefined} timeColumns={["Shared alert deliveries","Discord corrections and announcements"].includes(section.title)?["Updated UTC"]:[]}/>}{tab==="team"&&section.totalRows!==undefined&&section.totalRows>report.pageSize?<div className="cs-pager"><button className="cs-action" disabled={page<=1} onClick={()=>setPage(value=>value-1)}>Previous report page</button><span className="cs-note">Page {page} of {Math.ceil(section.totalRows/report.pageSize)}</span><button className="cs-action" disabled={page*report.pageSize>=section.totalRows} onClick={()=>setPage(value=>value+1)}>Next report page</button></div>:null}</section>)}</div>
      <details className="cs-panel"><summary>About these stats</summary>{report.notes.map(note=><p key={note} className="cs-note" style={{marginTop:10}}>{note}</p>)}</details>
      </>}
    </>:null}
    {viewers&&report?.canReadNamed&&report.scope!=="own_content"?<CommunityStatsViewers selection={viewers} endpoint={endpoint} queryText={queryText} onClose={()=>setViewers(null)}/>:null}
  </Box>;
}
