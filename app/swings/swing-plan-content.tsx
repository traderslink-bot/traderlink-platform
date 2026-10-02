import type { ReactNode } from "react";
import { hasSwingContent, swingSafeUrl, type SwingBlock, type SwingPlanDocument } from "@/src/modules/swings/swing-plan-contract";
import styles from "./swing-idea.module.css";

export function SwingRichContent({blocks}:{blocks:readonly SwingBlock[]}) {
  return <>{blocks.map((block,index)=>{
    if(block.kind==="image")return swingSafeUrl(block.src)?<figure key={block.id}>
      {/* Owner-supplied research image; do not proxy protected images through a public optimizer. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={block.src} alt={block.alt} loading="lazy" referrerPolicy="no-referrer" style={{maxWidth:"100%",height:"auto"}}/>
      {block.alt&&<figcaption>{block.alt}</figcaption>}</figure>:null;
    const content=block.runs.map((run,index)=>{
      let node:ReactNode=run.text;
      if(run.bold)node=<strong>{node}</strong>;if(run.italic)node=<em>{node}</em>;if(run.underline)node=<u>{node}</u>;
      if(run.href&&swingSafeUrl(run.href))node=<a href={run.href} target="_blank" rel="noopener noreferrer">{node}</a>;
      return <span key={index}>{node}</span>;
    });
    if(!block.runs.some(run=>run.text.trim()))return null;
    if(block.kind==="heading")return <h3 key={block.id}>{content}</h3>;
    if(block.kind==="bullet")return <ul key={block.id}><li>{content}</li></ul>;
    if(block.kind==="numbered"){
      let number=1;for(let i=index-1;i>=0&&blocks[i].kind==='numbered';i--)number++;
      return <ol start={number} key={block.id}><li>{content}</li></ol>;
    }
    return <p key={block.id} style={{whiteSpace:"pre-wrap"}}>{content}</p>;
  })}</>;
}
export function SwingPlanContent({document:d}:{document:SwingPlanDocument}) {
  return <><h1>{d.title||d.ticker}</h1><p className={styles.note}>{d.ticker} · {d.status==="closed"?"Closed":"Open"}</p>
    {d.company.visible&&d.company.fields.some(f=>f.value.trim())&&<section className={styles.panel}><h2>Company details</h2><dl>{d.company.fields.filter(f=>f.value.trim()).map((f,i)=><div key={i}><dt><strong>{f.label}</strong></dt><dd>{f.value}</dd></div>)}</dl></section>}
    {d.sections.filter(s=>s.visible&&hasSwingContent(s.blocks)).map(s=><section className={styles.panel} key={s.id}>{s.title&&<h2>{s.title}</h2>}<SwingRichContent blocks={s.blocks}/></section>)}
    {d.updates.some(u=>hasSwingContent(u.blocks))&&<section className={styles.panel}><h2>Dated updates</h2>{d.updates.filter(u=>hasSwingContent(u.blocks)).map(u=><section key={u.id}><h3>{u.title}</h3><p className={styles.note}>{new Intl.DateTimeFormat("en-US",{timeZone:"America/New_York",month:"short",day:"numeric",year:"numeric",hour:"numeric",minute:"2-digit"}).format(u.at)} ET</p><SwingRichContent blocks={u.blocks}/></section>)}</section>}
    {d.status==="closed"&&hasSwingContent(d.closingSummary)&&<section className={styles.panel}><h2>Closing summary</h2><SwingRichContent blocks={d.closingSummary}/></section>}
  </>;
}
