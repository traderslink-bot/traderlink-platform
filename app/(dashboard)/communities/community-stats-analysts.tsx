"use client";
import type {CommunityStatsTableRow} from "@/src/modules/communities/contracts/community-stats-contracts";

/** Audiences overlap between analysts, so these counts are columns, never donut shares. */
export function StatsAnalystChart({rows,onAnalyst}:{rows:readonly CommunityStatsTableRow[];onAnalyst:(id:string)=>void}){
  if(!rows.length)return <p className="cs-note">No published alerts or watchlists.</p>;
  const maximum=Math.max(1,...rows.map(row=>typeof row.Viewers==="number"?row.Viewers:0));
  return <figure className="cs-card-chart" aria-label="Top analysts by unique viewers">
    <div className="cs-analyst-chart" style={{gridTemplateColumns:`repeat(${rows.length},minmax(0,1fr))`}}>
      {rows.map(row=>{
        const viewers=typeof row.Viewers==="number"?row.Viewers:null,name=String(row.Analyst);
        return <button type="button" className="cs-analyst-column" key={String(row.authorId)} onClick={()=>onAnalyst(String(row.authorId))} aria-label={`${name}: ${viewers===null?"n/a":viewers.toLocaleString()} unique viewers. Open analyst.`}>
          <span className="cs-analyst-plot"><strong>{viewers===null?"n/a":viewers.toLocaleString()}</strong><span className="cs-analyst-bar" style={{height:viewers===null?0:`${viewers/maximum*160}px`}}/></span>
          <span className="cs-analyst-name" title={name}>{name}</span>
        </button>;
      })}
    </div>
    <figcaption className="cs-chart-caption" style={{marginTop:12}}>Unique viewers</figcaption>
  </figure>;
}
