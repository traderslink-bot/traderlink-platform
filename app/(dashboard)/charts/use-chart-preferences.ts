"use client";
import {useEffect,useRef,useState} from 'react';
import {DEFAULT_CHART_PREFERENCES,parseChartPreferences,type ChartPreferences} from '@/src/modules/scanner/alpaca/chart-preferences';
import {PLATFORM_MUTATION_REQUEST_HEADER} from '@/src/modules/platform/contracts/platform-request-security';
const eventName='traderlink-chart-preferences';
export function useChartPreferences(){
 const [preferences,setPreferences]=useState<ChartPreferences>(DEFAULT_CHART_PREFERENCES),[ready,setReady]=useState(false),[message,setMessage]=useState('');
 const [viewOwner,setViewOwner]=useState<string>();
 const ownerKey=useRef(''),revision=useRef(0),sequence=useRef(0),alive=useRef(true),pending=useRef(false),saving=useRef(Promise.resolve());
 useEffect(()=>{alive.current=true;const abort=new AbortController();void fetch('/api/charts/preferences',{cache:'no-store',signal:abort.signal}).then(async r=>{if(!r.ok)throw Error();return r.json();}).then(p=>{ownerKey.current=p.ownerKey;setViewOwner(p.ownerKey);revision.current=p.revision;setPreferences(parseChartPreferences(p.preferences));setReady(true);}).catch(()=>{if(!abort.signal.aborted)setMessage('Chart preferences could not load. Reload the page to try again.');});
 const receive=(event:Event)=>{if(pending.current)return;const p=(event as CustomEvent).detail;if(p.ownerKey!==ownerKey.current||p.revision<revision.current)return;revision.current=p.revision;setPreferences(old=>JSON.stringify(old)===JSON.stringify(p.preferences)?old:parseChartPreferences(p.preferences));};window.addEventListener(eventName,receive);
 return()=>{alive.current=false;abort.abort();window.removeEventListener(eventName,receive);};},[]);
 const change=(next:ChartPreferences)=>{const validated=parseChartPreferences(next);setPreferences(validated);pending.current=true;const serial=++sequence.current;setMessage('Saving…');
 saving.current=saving.current.then(async()=>{try{const r=await fetch('/api/charts/preferences',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json',[PLATFORM_MUTATION_REQUEST_HEADER]:'1'},body:JSON.stringify({ownerKey:ownerKey.current,revision:revision.current,preferences:validated}),keepalive:true});if(!r.ok)throw Error(r.status===409?'Chart preferences changed elsewhere. Reload before editing again.':'Preferences were not saved. Change the setting again to retry.');const p=await r.json();revision.current=p.revision;if(serial===sequence.current)pending.current=false;window.dispatchEvent(new CustomEvent(eventName,{detail:p}));if(alive.current&&serial===sequence.current)setMessage('Saved');}catch(e){if(alive.current&&serial===sequence.current)setMessage(e instanceof Error?e.message:'Preferences were not saved.');}});
 };
 return {preferences,ready,message,change,ownerKey:viewOwner};
}
