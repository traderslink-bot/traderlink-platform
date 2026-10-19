"use client";
import type {CommunityStatsTableRow} from "@/src/modules/communities/contracts/community-stats-contracts";
import {communityStatsValues} from "./community-stats-presentation";

export type StatsChartData=Readonly<{kind:"bars"|"donut";label:string;series:readonly string[];rows:readonly CommunityStatsTableRow[];scope:string}>;
const palette=(index:number)=>`var(--cs-chart-${index%8})`;
const number=(value:unknown):number|null=>typeof value==="number"&&Number.isFinite(value)?value:null;
const display=(value:number|null)=>value===null?"Unavailable":value.toLocaleString(undefined,{maximumFractionDigits:2});

/** Charts consume only the card's authorized rows; pagination never masquerades as a report total. */
export function statsCardChart(title:string,columns:readonly string[],rows:readonly CommunityStatsTableRow[],totalRows?:number):StatsChartData|null{
  if(!rows.length||columns.includes("Hour UTC"))return null;
  const scope=totalRows!==undefined&&totalRows>rows.length?`Current page · ${rows.length.toLocaleString()} of ${totalRows.toLocaleString()} records`:"Selected report filters";
  const label=["Category","Population","Page","Author","Channel","Team member","Return date","Prior → current segment","Measure","Discord username"].find(key=>columns.includes(key));
  if(title==="Webpage categories")return {kind:"donut",label:"Category",series:["Visits"],rows,scope:"Share of recorded webpage visits"};
  if(title==="Webpage audience")return {kind:"donut",label:"Population",series:["People"],rows,scope};
  const series=[
    ["Visits"],["Messages","Reactions"],["Alerts published","Server watchlists published"],
    ["Discord messages"],["Completed sessions","Delivered reviews"],["Discord returned","Webpage returned"],
    ["Discord gap days","Webpage gap days"],["Current members"],["Complete active dates"],["Members"],
  ].find(keys=>keys.every(key=>columns.includes(key)));
  if(label&&series&&rows.length>1)return {kind:"bars",label,series,rows,scope};
  const group=columns.includes("Status")?"Status":columns.includes("Current state")?"Current state":columns.includes("Type")&&columns.includes("Visited UTC")?"Type":null;
  if(group){
    const counts=new Map<string,number>();for(const row of rows){const key=String(row[group]??"Unknown");counts.set(key,(counts.get(key)??0)+1);}
    return {kind:"donut",label:group,series:["Records"],rows:[...counts].map(([key,value])=>({[group]:communityStatsValues[key]??key,Records:value})),scope:totalRows!==undefined&&totalRows>rows.length?`Current page only · ${rows.length} of ${totalRows} records`:"Recorded rows in selected filters"};
  }
  return null;
}

export function StatsDataChart({data}:{data:StatsChartData|null}){
  if(!data)return null;
  if(data.kind==="donut")return <StatsDonut data={data}/>;
  const score=(row:CommunityStatsTableRow)=>Math.max(-1,...data.series.map(key=>{const value=number(row[key]);return value===null?-1:Math.abs(value);}));
  const ranked=[...data.rows].sort((a,b)=>score(b)-score(a));
  const rows=ranked.slice(0,8),values=rows.flatMap(row=>data.series.map(key=>number(row[key])).filter((value):value is number=>value!==null));
  if(!values.length)return <figure className="cs-card-chart" data-chart-state="unavailable">{data.scope?<figcaption className="cs-chart-caption">{data.scope}</figcaption>:null}<p className="cs-note">No measured values are available for this chart.</p></figure>;
  const minimum=Math.min(0,...values),maximum=Math.max(1,...values),x=(value:number)=>12+(value-minimum)/(maximum-minimum)*350;
  return <figure className="cs-card-chart" aria-label={`${data.series.join(" and ")} by ${data.label}`}>
    <figcaption className="cs-chart-caption">{data.scope}{ranked.length>8?` · Showing 8 largest rows of ${ranked.length}`:""}</figcaption>
    <div className="cs-chart-legend">{data.series.map((key,index)=><span key={key}><i style={{background:palette(index)}}/>{key}</span>)}</div>
    <div className="cs-bar-list">{rows.map((row,index)=>{
      const label=String(row[data.label]??"Unknown");return <div className="cs-bar-row" key={`${label}-${index}`}>
        <span className="cs-bar-label" title={label}>{label}</span>
        <div className="cs-bar-series">{data.series.map((key,seriesIndex)=>{const value=number(row[key]);return <div className="cs-bar-value" key={key}>
          <svg viewBox="0 0 374 22" role="img" aria-label={`${label}: ${key} ${display(value)}`}><title>{`${key}: ${display(value)}`}</title><line x1={x(0)} x2={x(0)} y1="0" y2="22" stroke="currentColor" opacity=".2"/>{value!==null?<rect x={Math.min(x(0),x(value))} y="4" width={Math.abs(x(value)-x(0))} height="14" rx="3" fill={palette(seriesIndex)}/>:null}</svg>
          <span>{display(value)}</span>
        </div>;})}</div>
      </div>;
    })}</div>
  </figure>;
}

function StatsDonut({data}:{data:StatsChartData}){
  const key=data.series[0];let colorIndex=0;
  const allItems=data.rows.map(row=>{const value=number(row[key]);return {label:communityStatsValues[String(row[data.label])]??String(row[data.label]??"Unknown"),value,color:value!==null&&value>0?palette(colorIndex++):"var(--cs-chart-5)"};});
  const items=allItems.length>8?[...allItems.slice(0,7),{label:"Other",value:allItems.slice(7).reduce((sum,item)=>sum+(item.value??0),0),color:palette(7)}]:allItems;
  // Negative deltas and overlapping populations are never interpreted as shares.
  if(items.some(item=>item.value!==null&&item.value<0))return <StatsDataChart data={{...data,kind:"bars"}}/>;
  const total=items.reduce((sum,item)=>sum+(item.value??0),0),circumference=2*Math.PI*58;let offset=0;
  return <figure className="cs-card-chart" aria-label={`${key} distribution`}>
    {data.scope?<figcaption className="cs-chart-caption">{data.scope}</figcaption>:null}
    <div className="cs-donut-layout"><svg viewBox="0 0 180 180" role="img" aria-label={total?`${total.toLocaleString()} recorded ${key.toLowerCase()}`:items.some(item=>item.value===null)?"Data unavailable":"No observed activity"}>
      <circle cx="90" cy="90" r="58" fill="none" stroke="currentColor" strokeWidth="22" opacity=".1"/>
      {total>0?items.map((item,index)=>{if(!item.value)return null;const length=item.value/total*circumference,start=offset;offset+=length;return <circle key={index} cx="90" cy="90" r="58" fill="none" stroke={item.color} strokeWidth="22" strokeDasharray={`${length} ${circumference-length}`} strokeDashoffset={-start} transform="rotate(-90 90 90)"><title>{`${item.label}: ${display(item.value)} (${(item.value/total*100).toFixed(1)}%)`}</title></circle>;}):null}
      <text x="90" y="88" textAnchor="middle" fill="currentColor" fontSize="25" fontWeight="700">{total?total.toLocaleString():items.some(item=>item.value===null)?"—":"0"}</text><text x="90" y="110" textAnchor="middle" fill="currentColor" fontSize="10">{key}</text>
    </svg><ul className="cs-donut-legend">{items.map((item,index)=><li key={`${item.label}-${index}`}><i style={{background:item.color}}/><span>{item.label}</span><strong>{display(item.value)}{item.value!==null&&total>0?<small> ({(item.value/total*100).toFixed(1)}%)</small>:null}</strong></li>)}</ul></div>
    {items.some(item=>item.value===null)?<p className="cs-note">Unavailable values are excluded from the ring.</p>:null}
  </figure>;
}
