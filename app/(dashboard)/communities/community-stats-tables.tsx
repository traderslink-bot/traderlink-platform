"use client";
import type {CommunityStatsTableRow} from "@/src/modules/communities/contracts/community-stats-contracts";
import {communityStatsValues,statsDisplayUtc} from "./community-stats-presentation";

export function CommunityStatsTable({columns,rows,onMember,onContent,onAuthor}:{columns:readonly string[];rows:readonly CommunityStatsTableRow[];onMember?:(id:string)=>void;onContent?:(id:string)=>void;onAuthor?:(id:string)=>void}){
  if(!rows.length)return <p className="cs-note">No observations match this report.</p>;
  return <table className="cs-table"><thead><tr>{columns.map(column=><th key={column} scope="col">{column[0].toUpperCase()+column.slice(1)}</th>)}</tr></thead><tbody>{rows.map((row,index)=><tr key={String(row.memberId??row.userId??row.contentId??row.authorId??index)}>{columns.map(column=>{
    const enumColumn=["Participation","Surface","Activity","source","status","Status","Mode","Outcome","Kind","Evidence","Type","Current state","Destination state"].includes(column);
    const value=row[column],text=value===null||value===undefined?"Unavailable":column.endsWith("UTC")?statsDisplayUtc(String(value)):enumColumn?communityStatsValues[String(value)]??String(value):String(value);
    return <td key={column} data-label={column}>{column==="Effective permissions"&&value?<details className="cs-permissions"><summary>{String(value).split("; ").length} permissions</summary><ul>{String(value).split("; ").map(permission=><li key={permission}>{permission}</li>)}</ul></details>:column==="Discord username"&&row.memberId&&onMember?<button type="button" className="cs-link" onClick={()=>onMember(String(row.memberId))}>{text}</button>:column==="Page"&&row.contentId&&onContent?<button type="button" className="cs-link" onClick={()=>onContent(String(row.contentId))}>{text}</button>:column==="Author"&&row.authorId&&onAuthor?<button type="button" className="cs-link" onClick={()=>onAuthor(String(row.authorId))}>{text}</button>:text}</td>;
  })}</tr>)}</tbody></table>;
}
