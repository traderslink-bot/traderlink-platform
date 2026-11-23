import {widgets} from './scanner-desktop-layout';
import type {ScannerWorkspaceWidget as Widget} from '../scanner-workspace-layout';
import {isScannerCardSlot,scannerCardSlots,readCardSavedScanIds,readCardScanners,type CardSavedScanIds,type CardScanners} from './workspace-scanner-title';
import {readGainerSwitchPreferences,type GainerSwitchPreferences} from '@/src/modules/scanner/live/gainer-card-policy';
import type {CardViews} from './scanner-layout-editor';
import {readCardSectionPreferences,type CardSectionPreferences} from './scanner-card-sections';
import {readCardVolumePreferences,type CardVolumePreferences} from './workspace-volume';
export type MobileOrientation='portrait'|'landscape';
export type MobileLayout={order:Widget[];heights:Partial<Record<Widget,number>>;wide:Widget[];placement?:Partial<Record<Widget,1|2>>;columns:1|2;mode:'tabs'|'stacked';selected:Widget;scanners:CardScanners;savedScanIds?:CardSavedScanIds;views:CardViews;sections?:CardSectionPreferences;volumeColumns?:CardVolumePreferences;gainerAutoSwitch?:GainerSwitchPreferences};
export type MobileNamedLayout={name:string;layout:MobileLayout};
export type MobileLane={active:string;layouts:MobileNamedLayout[]};
export type MobileLayouts=Record<MobileOrientation,MobileLane>;
export function defaultMobileLayout(orientation:MobileOrientation):MobileLayout{return {order:[...widgets],heights:{},wide:[],columns:orientation==='landscape'?2:1,mode:'stacked',selected:'gainers',scanners:{},views:{}};}
export function defaultMobileLayouts():MobileLayouts{return {portrait:{active:'',layouts:[{name:'',layout:defaultMobileLayout('portrait')}]},landscape:{active:'',layouts:[{name:'',layout:defaultMobileLayout('landscape')}]}};}
export function readMobileLayout(value:unknown,orientation:MobileOrientation):MobileLayout {
 const p=value as MobileLayout;if(!p||!Array.isArray(p.order)||!p.order.length||p.order.length>widgets.length||new Set(p.order).size!==p.order.length||p.order.some(w=>!widgets.includes(w)))throw Error('invalid_mobile_layout');
 const heights:MobileLayout['heights']={};for(const [key,value] of Object.entries(p.heights??{})){if(!widgets.includes(key as Widget)||typeof value!=='number'||!Number.isFinite(value)||value<0.35||value>3)throw Error('invalid_mobile_height');heights[key as Widget]=value;}
 const views:CardViews={};for(const [key,value] of Object.entries(p.views??{}))if(isScannerCardSlot(key)&&['table','cards','two-rows'].includes(value))views[key]=value;
 return {order:[...p.order],heights,wide:Array.isArray(p.wide)?p.wide.filter((w,i,a)=>widgets.includes(w)&&a.indexOf(w)===i):[],columns:orientation==='landscape'&&p.columns===2?2:1,mode:p.mode==='stacked'?'stacked':'tabs',selected:p.order.includes(p.selected)?p.selected:p.order[0],placement:Object.fromEntries(Object.entries(p.placement??{}).filter(([w,c])=>widgets.includes(w as Widget)&&(c===1||c===2))),scanners:readCardScanners(p.scanners),views,...(p.savedScanIds?{savedScanIds:readCardSavedScanIds(p.savedScanIds)}:{}),...(p.sections?{sections:readCardSectionPreferences(p.sections)}:{}),...(p.volumeColumns?{volumeColumns:readCardVolumePreferences(p.volumeColumns)}:{}),...(p.gainerAutoSwitch?{gainerAutoSwitch:readGainerSwitchPreferences(p.gainerAutoSwitch,Object.keys(scannerCardSlots))}:{})};
}
export function readMobileLayouts(value:unknown):MobileLayouts{
 const result=defaultMobileLayouts();if(!value||typeof value!=='object')return result;
 for(const orientation of ['portrait','landscape'] as const){const lane=(value as MobileLayouts)[orientation];if(!lane||!Array.isArray(lane.layouts))continue;
 const names=new Set<string>();const layouts:MobileNamedLayout[]=[];
 for(const entry of lane.layouts){try{if(typeof entry?.name!=='string'||entry.name.length>40||names.has(entry.name))continue;const layout=readMobileLayout(entry.layout,orientation);names.add(entry.name);layouts.push({name:entry.name,layout});}catch{/* Keep unrelated valid layouts. */}}
 if(layouts.length)result[orientation]={active:layouts.some(l=>l.name===lane.active)?lane.active:layouts[0].name,layouts};
 }return result;
}
export function moveMobileCard(layout:MobileLayout,widget:Widget,target:Widget):MobileLayout{
 if(widget===target||!layout.order.includes(widget)||!layout.order.includes(target))return layout;
 const order=layout.order.filter(w=>w!==widget);order.splice(layout.order.indexOf(target),0,widget);return {...layout,order};
}
export function toggleMobileCard(layout:MobileLayout,widget:Widget):MobileLayout{
 const order=layout.order.includes(widget)?layout.order.filter(w=>w!==widget):[...layout.order,widget];
 return order.length?{...layout,order,selected:order.includes(layout.selected)?layout.selected:order[0]}:layout;
}
export function mobileCardHeight(layout:MobileLayout,widget:Widget,viewport:number,tabbed:boolean){return Math.round(viewport*(tabbed?1:layout.heights[widget]??1));}

/** Upsert only this tab's changed records, preserving newer unrelated layouts. */
export function mergeMobileLayoutSave(base:MobileLayouts,next:MobileLayouts,latest:MobileLayouts,orientation:MobileOrientation):MobileLayouts{
 const stable=(v:unknown):unknown=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b)).map(([k,value])=>[k,stable(value)])):v;
 const equal=(a:MobileNamedLayout|undefined,b:MobileNamedLayout|undefined)=>!a||!b?a===b:a.name===b.name&&JSON.stringify(stable(readMobileLayout(a.layout,orientation)))===JSON.stringify(stable(readMobileLayout(b.layout,orientation)));
 const changes=next[orientation].layouts.filter(entry=>!equal(entry,base[orientation].layouts.find(old=>old.name===entry.name)));
 for(const entry of changes){const previous=base[orientation].layouts.find(old=>old.name===entry.name),current=latest[orientation].layouts.find(old=>old.name===entry.name);if(current&&!equal(current,previous)&&!equal(current,entry))throw Error('layout_conflict');}
 const changedNames=new Set(changes.map(entry=>entry.name));
 const layouts=[...latest[orientation].layouts.filter(entry=>!changedNames.has(entry.name)),...changes];
 return {...latest,[orientation]:{active:next[orientation].active,layouts}};
}
