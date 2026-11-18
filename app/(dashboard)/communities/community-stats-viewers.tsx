"use client";
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import {useEffect,useId,useState} from "react";
import type {CommunityStatsReport} from "@/src/modules/communities/contracts/community-stats-contracts";
import {CommunityStatsTable} from "./community-stats-tables";
import {communityStatsPresentation} from "./community-stats-presentation";

export type StatsViewerSelection=Readonly<{title:string;contentId?:string;authorId?:string}>;

/** A scoped detail view, not a separate report tab. Named access is also checked by the API. */
export function CommunityStatsViewers({selection,endpoint,queryText,onClose}:{selection:StatsViewerSelection;endpoint:string;queryText:string;onClose:()=>void}){
  const headingId=useId(),[page,setPage]=useState(1),[reload,setReload]=useState(0);
  const [result,setResult]=useState<{key:string;report:CommunityStatsReport}|null>(null);
  const [error,setError]=useState<{key:string;message:string}|null>(null);
  const query=new URLSearchParams(queryText);
  query.set("tab","visits");query.set("page",String(page));
  for(const key of ["member","memberPage","segment","hourlyContent","hourlyAuthor","hourlySearch","format","section","timeline"])query.delete(key);
  if(selection.contentId)query.set("content",selection.contentId);else query.delete("content");
  if(selection.authorId)query.set("author",selection.authorId);else query.delete("author");
  const requestQuery=query.toString(),requestKey=JSON.stringify([endpoint,requestQuery,reload]);
  const report=result?.key===requestKey?result.report:null,message=error?.key===requestKey?error.message:"",loading=!report&&!message;
  useEffect(()=>{
    const controller=new AbortController();
    void fetch(`${endpoint}?${requestQuery}`,{signal:controller.signal,cache:"no-store",credentials:"same-origin"}).then(async response=>{
      if(!response.ok)throw new Error("Unable to load viewer history.");
      const value=await response.json() as CommunityStatsReport;
      if(!value.ready||!value.canReadNamed||value.scope==="own_content"||value.tab!=="visits")throw new Error("Viewer history is unavailable for this account.");
      return value;
    }).then(value=>{if(!controller.signal.aborted)setResult({key:requestKey,report:value});}).catch(reason=>{
      if(!controller.signal.aborted)setError({key:requestKey,message:reason instanceof Error?reason.message:"Unable to load viewer history."});
    });
    return()=>controller.abort();
  },[endpoint,requestQuery,requestKey]);
  return <Dialog open onClose={onClose} fullWidth maxWidth="lg" aria-labelledby={headingId}>
    <Box sx={theme=>({...communityStatsPresentation(theme),p:{xs:2,sm:3}})} aria-busy={loading}>
      <div className="cs-title"><h2 id={headingId}>Viewer history: {selection.title}</h2><div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        {report?.canExport?<><a className="cs-action" href={`${endpoint}?${requestQuery}&format=xlsx`}>Export Excel</a><a className="cs-action" href={`${endpoint}?${requestQuery}&format=csv`}>Export CSV</a></>:null}
        <button type="button" className="cs-action" onClick={onClose}>Close</button>
      </div></div>
      {loading?<p className="cs-note" role="status">Loading viewer history…</p>:null}
      {message?<div className="cs-error" role="alert">{message} <button type="button" className="cs-action" onClick={()=>setReload(value=>value+1)}>Retry</button></div>:null}
      {report?<><CommunityStatsTable columns={report.columns} rows={report.rows} emptyMessage="No views in the selected dates."/>
        {report.totalRows>report.pageSize?<div className="cs-pager"><button type="button" className="cs-action" disabled={page<=1} onClick={()=>setPage(value=>value-1)}>Previous</button><span className="cs-note">Page {page} of {Math.ceil(report.totalRows/report.pageSize)}</span><button type="button" className="cs-action" disabled={page*report.pageSize>=report.totalRows} onClick={()=>setPage(value=>value+1)}>Next</button></div>:null}
      </>:null}
    </Box>
  </Dialog>;
}
