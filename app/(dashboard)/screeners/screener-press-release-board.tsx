"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

import { DashboardPanel } from "@/app/dashboard-template";
import type { PressReleaseArticle } from "@/src/modules/news/contracts/press-release-dashboard-contracts";
import { markPressReleaseRead } from "../press-releases/press-release-actions";

const PressReleaseArticleDrawer = dynamic(() => import("../press-releases/press-release-article-drawer").then(module => module.PressReleaseArticleDrawer));
type Headline = Pick<PressReleaseArticle,"id"|"ticker"|"headline"|"isRead"|"marketCap">;
type HeadlineResponse = Readonly<{ articles?:readonly Headline[]; status?:string }>;
const ARTICLES_PER_COLUMN=10;
const VISIBLE_ARTICLES=30;
const number=new Intl.NumberFormat("en-US",{ maximumFractionDigits:1 });

function floatValue(input:number|undefined):string {
  if(input===undefined)return "N/A";
  if(input>=1_000_000)return `${number.format(input/1_000_000)}M`;
  if(input>=1_000)return `${number.format(input/1_000)}K`;
  return number.format(input);
}

function ArticleButton({ article,float,onOpen }: { article:Headline; float:number|undefined; onOpen:(article:Headline)=>void }) {
  return <Button aria-label={`Open ${article.ticker} article: ${article.headline}`} onClick={()=>onOpen(article)}
    sx={{ alignItems:"stretch",borderBottom:1,borderColor:"divider",borderRadius:0,display:"grid",gridTemplateColumns:"3.4rem minmax(0,1fr)",gridTemplateRows:"auto auto",minHeight:38,px:0.75,py:0.25,textAlign:"left",textTransform:"none",width:"100%",'&:last-child':{ borderBottom:0 } }}>
    <Box component="span" sx={{ alignItems:"center",alignSelf:"stretch",color:"warning.main",display:"flex",fontSize:"0.86rem",fontWeight:900,gridRow:"1 / 3",overflow:"hidden",pr:0.75,textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{article.ticker}</Box>
    <Box component="span" sx={{ alignItems:"center",display:"flex",gap:1,minWidth:0 }}>
      <Box component="span" sx={{ color:"text.secondary",fontSize:"0.66rem",fontWeight:750,whiteSpace:"nowrap" }}>{article.marketCap?`Mkt Cap ${article.marketCap}`:"Mkt Cap N/A"}</Box>
      <Box component="span" sx={{ color:"text.secondary",fontSize:"0.66rem",fontWeight:750,whiteSpace:"nowrap" }}>Float {floatValue(float)}</Box>
    </Box>
    <Typography component="span" sx={{ display:"block",fontSize:"0.72rem",fontWeight:article.isRead?600:800,gridColumn:2,lineHeight:1.2,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{article.headline}</Typography>
  </Button>;
}

export function ScreenerPressReleaseBoard() {
  const [articles,setArticles]=useState<readonly Headline[]|null>(null);
  const [floatByTicker,setFloatByTicker]=useState<Readonly<Record<string,number>>>({});
  const [selected,setSelected]=useState<PressReleaseArticle|null>(null);
  const [opening,setOpening]=useState(false);
  const [unavailable,setUnavailable]=useState(false);
  const requestRef=useRef<AbortController|null>(null);

  useEffect(()=>{
    let active=true;
    let timer:ReturnType<typeof setTimeout>|undefined;
    const load=async()=>{
      if(document.visibilityState!=="visible"||!navigator.onLine){timer=setTimeout(load,30_000);return;}
      const request=new AbortController();
      const timeout=setTimeout(()=>request.abort(),12_000);
      try{
        const response=await fetch("/api/platform/news/workspace-scanner?view=expanded-summary",{ cache:"no-store",signal:request.signal });
        if(response.status===403){if(active)setUnavailable(true);return;}
        if(!response.ok)throw Error("news_unavailable");
        const result=await response.json() as HeadlineResponse;
        const nextArticles=(result.articles??[]).slice(0,VISIBLE_ARTICLES);
        if(active&&!request.signal.aborted){setArticles(nextArticles);setUnavailable(false);}
        const symbols=[...new Set(nextArticles.map(article=>article.ticker))];
        if(symbols.length){
          const floatResponse=await fetch(`/api/admin/screeners/floats?symbols=${encodeURIComponent(symbols.join(","))}`,{ cache:"no-store",signal:request.signal });
          if(floatResponse.ok){
            const floatResult=await floatResponse.json() as { floats?:Readonly<Record<string,{ shares?:unknown }>> };
            const nextFloats=Object.fromEntries(Object.entries(floatResult.floats??{}).flatMap(([symbol,fact])=>
              Number.isSafeInteger(fact.shares)&&Number(fact.shares)>0?[[symbol,Number(fact.shares)] as const]:[]));
            if(active&&!request.signal.aborted)setFloatByTicker(nextFloats);
          }
        }else if(active)setFloatByTicker({});
      }catch{/* Keep the last successful board during a temporary failure. */}
      finally{clearTimeout(timeout);if(active)timer=setTimeout(load,30_000);}
    };
    void load();
    return()=>{active=false;clearTimeout(timer);requestRef.current?.abort();};
  },[]);

  const open=async(headline:Headline)=>{
    requestRef.current?.abort();
    const request=new AbortController();requestRef.current=request;setOpening(true);
    const timeout=setTimeout(()=>request.abort(),12_000);
    try{
      const response=await fetch(`/api/platform/news/workspace-scanner?articleId=${encodeURIComponent(headline.id)}`,{ cache:"no-store",signal:request.signal });
      if(!response.ok)throw Error("article_unavailable");
      const result=await response.json() as { article?:PressReleaseArticle };
      if(!result.article||requestRef.current!==request||request.signal.aborted)return;
      setSelected(result.article);
      if(!result.article.isRead){setArticles(current=>current?.map(article=>article.id===headline.id?{ ...article,isRead:true }:article)??current);void markPressReleaseRead(headline.id);}
    }catch{/* The headline remains available to retry. */}
    finally{clearTimeout(timeout);if(requestRef.current===request)setOpening(false);}
  };

  if(unavailable)return null;
  const visible=articles??[];
  const columns=Array.from({ length:3 },(_,index)=>visible.slice(index*ARTICLES_PER_COLUMN,(index+1)*ARTICLES_PER_COLUMN));
  return <>
    <DashboardPanel title="PR Scanner">
      {articles===null?<Box sx={{ display:"grid",minHeight:120,placeItems:"center" }}><CircularProgress aria-label="Loading latest press releases" size={24}/></Box>
        :visible.length===0?<Typography color="text.secondary" variant="body2">No recent press releases.</Typography>
        :<>
          <Box sx={{ display:{ xs:"none",md:"grid" },gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:1.5 }}>
            {columns.map((column,index)=><Box key={index} sx={{ border:1,borderColor:"divider",borderRadius:1,overflow:"hidden" }}>{column.map(article=><ArticleButton article={article} float={floatByTicker[article.ticker]} key={article.id} onOpen={open}/>)}</Box>)}
          </Box>
          <Box sx={{ display:{ xs:"block",md:"none" } }}>{visible.map(article=><ArticleButton article={article} float={floatByTicker[article.ticker]} key={article.id} onOpen={open}/>)}</Box>
        </>}
      {opening?<Typography color="text.secondary" role="status" sx={{ mt:1 }} variant="caption">Opening article…</Typography>:null}
    </DashboardPanel>
    {selected?<PressReleaseArticleDrawer article={selected} onClose={()=>setSelected(null)}/>:null}
  </>;
}
