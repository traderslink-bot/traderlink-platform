"use client";
import {useState,useEffect,useRef,type ReactNode} from "react";
import type {CommunityStatsReport,CommunityStatsTableRow} from "@/src/modules/communities/contracts/community-stats-contracts";

/** Vertical columns preserve calendar gaps; long date series use bounded adjacent buckets. */
export function StatsMessageColumns({rows,label,value="Messages"}:{rows:readonly CommunityStatsTableRow[];label:string;value?:string}){
  const plot=useRef<HTMLDivElement|null>(null),[plotWidth,setPlotWidth]=useState(600);
  useEffect(()=>{const element=plot.current;if(!element)return;const observer=new ResizeObserver(entries=>{const width=entries[0]?.contentRect.width;if(width)setPlotWidth(Math.max(240,width));});observer.observe(element);return()=>observer.disconnect();},[]);
  const size=Math.max(1,Math.ceil(rows.length/90)),groups: {label:string;value:number|null}[]=[];
  for(let index=0;index<rows.length;index+=size){
    const slice=rows.slice(index,index+size),known=slice.filter(row=>typeof row[value]==="number");
    groups.push({label:size===1?String(slice[0][label]):`${slice[0][label]} – ${slice[slice.length-1][label]}`,value:known.length?known.reduce((sum,row)=>sum+Number(row[value]),0):null});
  }
  const maximum=Math.max(1,...groups.map(row=>row.value??0)),width=plotWidth,step=(width-70)/Math.max(1,groups.length),tickEvery=Math.max(1,Math.ceil(groups.length/6));
  return <div ref={plot} role="region" tabIndex={0} aria-label={`${value} chart`}>{rows.length?<svg viewBox={`0 0 ${width} 290`} style={{width:"100%",height:290}} role="img" aria-label={`${value} by ${label.replace(/ UTC$/u,"")}`}>
    {[0,.5,1].map(fraction=><g key={fraction}><line x1="45" x2={width-15} y1={235-fraction*205} y2={235-fraction*205} stroke="currentColor" opacity=".12"/><text x="39" y={239-fraction*205} textAnchor="end" fontSize="10" fill="currentColor">{Math.round(maximum*fraction).toLocaleString()}</text></g>)}
    {groups.map((row,index)=><g key={`${row.label}-${index}`}><title>{`${row.label}: ${row.value===null?"n/a":row.value.toLocaleString()} ${value.toLowerCase()}`}</title>{row.value!==null?<rect x={45+index*step+step*.18} y={235-row.value/maximum*205} width={step*.64} height={row.value/maximum*205} rx="3" fill="var(--cs-chart-0)"/>:null}{groups.length<=10&&row.value!==null?<text x={45+(index+.5)*step} y={228-row.value/maximum*205} textAnchor="middle" fontSize="11" fill="currentColor">{row.value.toLocaleString()}</text>:null}{index%tickEvery===0?<text x={45+(index+.5)*step} y="257" textAnchor="middle" fontSize="10" fill="currentColor">{row.label.length>17?`${row.label.slice(0,16)}…`:row.label}</text>:null}</g>)}
  </svg>:<p className="cs-note">{value==="Messages"?"No recorded messages.":"No matching members."}</p>}</div>;
}

export function StatsMessageCharts({report,renderCsv}:{report:CommunityStatsReport;renderCsv:(title:string,columns:readonly string[],rows:readonly CommunityStatsTableRow[])=>ReactNode}){
  const [channel,setChannel]=useState("");
  return <div className="cs-report-grid">{report.messageCharts?.map(chart=>{
    const isChannel=chart.title==="Channel trends";
    const choices=isChannel?[...new Map(chart.rows.map(row=>[String(row.channelId),String(row.Channel)])).entries()]:[];
    const current=choices.some(([id])=>id===channel)?channel:choices[0]?.[0];
    const channelRows=isChannel?chart.rows.filter(row=>row.channelId===current):chart.rows;
    // Give the chosen channel the same complete month axis as the all-channel monthly chart.
    const months=isChannel?report.messageCharts?.find(item=>item.title==="Messages by month")?.rows:undefined;
    const values=new Map(channelRows.map(row=>[String(row["Month UTC"]),row.Messages]));
    const rows=months?.map(row=>({"Month UTC":row["Month UTC"],Messages:values.get(String(row["Month UTC"]))??null}))??channelRows;
    return <section className={`cs-panel ${chart.title==="Messages by date"?"cs-report-card-wide":""}`} key={chart.title}><div className="cs-panel-head"><h2>{chart.title}</h2>{renderCsv(chart.title,isChannel?["Channel","Month UTC","Messages"]:chart.columns,isChannel?rows.map(row=>({Channel:choices.find(([id])=>id===current)?.[1]??"",...row})):rows)}</div>{isChannel?<label className="cs-field">Channel<select value={current??""} onChange={event=>setChannel(event.target.value)}>{choices.map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label>:null}<StatsMessageColumns rows={rows} label={isChannel?"Month UTC":chart.columns[0]}/></section>;
  })}</div>;
}
