"use client";
import {useEffect,useState} from "react";
import type {CommunityStatsReport} from "@/src/modules/communities/contracts/community-stats-contracts";
import {CommunityStatsTable} from "./community-stats-tables";

type Section=CommunityStatsReport["sections"][number];
/** Paging one supplementary card must not move the main table or its neighbouring cards. */
export function StatsSectionTable({section,endpoint,queryText,onMember}:{section:Section;endpoint:string;queryText:string;onMember?:(id:string)=>void}){
  const base=new URLSearchParams(queryText);base.delete("page");base.delete("sectionPage");
  const filterKey=base.toString();
  const [selection,setSelection]=useState({key:filterKey,page:1});
  const page=selection.key===filterKey?selection.page:1;
  const requestKey=`${filterKey}:${section.title}:${page}`;
  const [loaded,setLoaded]=useState<{key:string;section:Section}|null>(null),[error,setError]=useState<string|null>(null);
  useEffect(()=>{
    if(page===1)return;
    const controller=new AbortController();
    const query=new URLSearchParams(filterKey);query.set("sectionPage",String(page));
    void fetch(`${endpoint}?${query}`,{signal:controller.signal,cache:"no-store",credentials:"same-origin"}).then(async response=>{
      if(!response.ok)throw new Error("Unable to load this page.");
      const report=await response.json() as CommunityStatsReport;
      const value=report.sections.find(item=>item.title===section.title);
      if(!report.ready||!value)throw new Error("Unable to load this page.");
      if(!controller.signal.aborted)setLoaded({key:requestKey,section:value});
    }).catch(()=>{if(!controller.signal.aborted)setError(requestKey);});
    return()=>controller.abort();
  },[endpoint,filterKey,page,requestKey,section.title]);
  const current=page===1?section:loaded?.key===requestKey?loaded.section:null;
  const failed=error===requestKey,pending=!current&&!failed;
  const total=current?.totalRows??section.totalRows??0,pageSize=current?.pageSize??section.pageSize??25;
  const choose=(next:number)=>{setLoaded(null);setError(null);setSelection({key:filterKey,page:next});};
  return <><div aria-busy={pending}>{failed?<p role="alert" className="cs-error">Unable to load this page. <button className="cs-action" onClick={()=>choose(1)}>Back to first page</button></p>:pending?<p role="status" className="cs-note">Loading…</p>:current?<CommunityStatsTable columns={current.columns} rows={current.rows} onMember={onMember} emptyMessage={section.title==="Server Bots"?"No recorded bot messages.":undefined} timeColumns={section.title==="Shared alert deliveries"?["Updated UTC"]:[]}/>:null}</div>{total>pageSize||page>1?<div className="cs-pager"><button className="cs-action" disabled={page<=1||pending} onClick={()=>choose(page-1)}>Previous</button><span className="cs-note">Page {page} of {Math.max(page,Math.ceil(total/pageSize))}</span><button className="cs-action" disabled={pending||page*pageSize>=total} onClick={()=>choose(page+1)}>Next</button></div>:null}</>;
}
