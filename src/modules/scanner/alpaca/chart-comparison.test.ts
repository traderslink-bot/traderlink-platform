import {expect,it} from "vitest";
import {parseChartMultiview, singleChart, type ChartMultiview} from "./chart-multiview";
import {initialChartTabs,parseChartTabs,closeSelectedChartTab,MAX_CHART_TABS} from "./chart-tabs";

const legacy:ChartMultiview={
 version:1,selectedPanel:"smx-15m",mobileLayout:"tabs",comparisonPanels:["omh-1m","smx-1m"],
 groups:["OMH","SMX"].map(symbol=>({id:symbol,symbol,panels:(["1m","5m","15m","1h"] as const).map(timeframe=>({id:`${symbol.toLowerCase()}-${timeframe}`,timeframe}))})),
};
const facts=(tabs:ReturnType<typeof parseChartTabs>["tabs"])=>tabs.flatMap(tab=>tab.layout.groups.flatMap(g=>g.panels.map(p=>g.symbol+" "+p.timeframe))).sort();
it("enforces four charts for every new saved view, same ticker or mixed",()=>{
 expect(()=>parseChartTabs(initialChartTabs(legacy))).toThrow();
 expect(()=>parseChartMultiview(legacy)).toThrow();
 const layout={...singleChart("OMH"),mobileLayout:"stack" as const};
 expect(parseChartTabs(initialChartTabs(layout)).tabs[0].layout).toEqual(layout);
});
it("splits previous oversized views without losing any ticker/timeframe, selection or original source",()=>{
 const old=initialChartTabs(legacy),serialized=JSON.stringify(old);
 const migrated=parseChartTabs(old,true);
 expect(migrated.tabs).toHaveLength(2);
 expect(facts(migrated.tabs)).toEqual(facts(old.tabs));
 expect(migrated.selectedTab).toBe(migrated.tabs[1].id);
 expect(migrated.tabs[1].layout.selectedPanel).toBe("smx-15m");
 expect(migrated.tabs.every(t=>!t.layout.comparisonPanels)).toBe(true);
 expect(JSON.stringify(old)).toBe(serialized);
 expect(parseChartTabs(migrated)).toEqual(migrated);
});
it("preserves every previous maximum-sized view and resolves generated ID collisions",()=>{
 const groups=Array.from({length:10},(_,i)=>({...legacy.groups[0],id:"g"+i,symbol:"T"+i,panels:legacy.groups[0].panels.map((p,j)=>({...p,id:`p${i}-${j}`}))}));
 const layout={version:1 as const,groups,selectedPanel:"p0-0"};
 const old={version:1,tabs:Array.from({length:8},(_,i)=>({id:i?"split-"+i:"original",name:"",layout})),selectedTab:"split-3"};
 const migrated=parseChartTabs(old,true);
 expect(migrated.tabs).toHaveLength(MAX_CHART_TABS);
 expect(new Set(migrated.tabs.map(t=>t.id)).size).toBe(MAX_CHART_TABS);
 expect(facts(migrated.tabs)).toEqual(facts(old.tabs));
 expect(parseChartTabs(migrated)).toEqual(migrated);
});
it("last view closes to a plain single chart at the selected ticker/timeframe",()=>{
 const migrated=parseChartTabs(initialChartTabs(legacy),true);
 const last={...migrated,tabs:[migrated.tabs[1]],selectedTab:migrated.tabs[1].id};
 const plain=closeSelectedChartTab(last);
 expect(plain.plain).toBe(true);
 expect(facts(plain.tabs)).toEqual(["SMX 15m"]);
 expect(parseChartTabs(plain)).toEqual(plain);
});
