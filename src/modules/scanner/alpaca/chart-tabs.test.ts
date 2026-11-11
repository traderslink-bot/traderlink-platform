import {expect,it} from "vitest";
import {initialChartTabs,parseChartTabs,chartTabLabel,chartTabDisplayLabel,chartTabsInventory,chartWorkspaceViews,openMultiTicker,MAX_CHART_TABS} from "./chart-tabs";
import {singleChart} from "./chart-multiview";
import {ChartViewMemory,type ChartViewSnapshot} from "@/app/(dashboard)/charts/chart-view-memory";
it("migrates the existing layout losslessly, derives ticker labels and preserves custom names",()=>{
 const layout=singleChart("OMH"),book=initialChartTabs(layout);expect(book.tabs[0].layout).toEqual(layout);expect(chartTabLabel(book.tabs[0])).toBe("OMH");
 const tab={...book.tabs[0],layout:{...layout,groups:["OMH","SMX","TANH","GPUS"].map((symbol,i)=>({id:`g${i}`,symbol,panels:[{id:`p${i}`,timeframe:"1m" as const}]})),selectedPanel:"p0"}};
 expect(chartTabLabel(tab,true)).toBe("OMH · SMX +2");expect(chartTabLabel({...tab,name:"Comparisons"},true)).toBe("Comparisons");
 expect(chartTabLabel({...tab,layout:{...layout,groups:[{...layout.groups[0],panels:[...layout.groups[0].panels,{id:"five",timeframe:"5m"}]}]}})).toBe("OMH");
});
it("allows independent mixed layouts and duplicate tickers across tabs, but validates limits and identity",()=>{
 const original=initialChartTabs(singleChart("OMH"));const book={...original,tabs:[...original.tabs,{id:"another",name:"Other",layout:singleChart("OMH","5m")}]};
 expect(parseChartTabs(book).tabs).toHaveLength(2);
 const duplicate={...book,tabs:[book.tabs[0],{...book.tabs[1],name:""}]};expect(chartTabDisplayLabel(duplicate,duplicate.tabs[1])).toBe("OMH (2)");
 for(const value of [{...book,selectedTab:"missing"},{...book,tabs:[book.tabs[0],book.tabs[0]]},{...book,tabs:Array.from({length:MAX_CHART_TABS+1},(_,i)=>({...book.tabs[0],id:`t${i}`}))},{...book,admin:true},{...book,tabs:[{...book.tabs[0],name:"x".repeat(33)}]}])expect(()=>parseChartTabs(value)).toThrow();
 const inventory=chartTabsInventory(book);expect(new Set(inventory.groups.flatMap(g=>g.panels.map(p=>p.id))).size).toBe(2);
});
it("retains inactive tab snapshots, scopes reused panel IDs and removes only closed-tab state",()=>{
 const book=initialChartTabs(singleChart("OMH"));book.tabs.push({id:"two",name:"",layout:singleChart("OMH")});
 const memory=new ChartViewMemory(()=>undefined);memory.retain("o","main",chartTabsInventory(book));
 const snapshot:ChartViewSnapshot={symbol:"OMH",timeframe:"1m",sessions:"s",basisDate:"2026-11-10",range:{from:100,to:200},logicalRange:{from:1,to:10},axis:{first:100,last:200,count:11,sessions:"s"},anchor:{time:100,offset:0},priceRange:null,autoScale:true,preferenceAutoScale:true,logarithmic:false};
 memory.write("o","main","chart-1",snapshot);memory.write("o","main","two--chart-1",{...snapshot,logicalRange:{from:2,to:5}});
 memory.retain("o","main",chartTabsInventory({...book,selectedTab:"two"}));expect(memory.read("o","main","chart-1","OMH","1m","s")?.logicalRange.to).toBe(10);
 expect(memory.read("o","main","two--chart-1","OMH","1m","s")?.logicalRange.to).toBe(5);
 memory.retain("o","main",chartTabsInventory({...book,tabs:[book.tabs[1]],selectedTab:"two"}));memory.write("o","main","chart-1",snapshot);
 expect(memory.read("o","main","chart-1","OMH","1m","s")).toBeNull();expect(memory.read("o","main","two--chart-1","OMH","1m","s")).not.toBeNull();
});

it("shows every distinct ticker view and retains older duplicate views",()=>{
 const book=initialChartTabs(singleChart("OMH"));
 book.tabs.push(...["SMX","TANH","GPUS","MI","OMH"].map((symbol,i)=>({id:"extra-"+i,name:"",layout:singleChart(symbol)})));
 const multi={id:"multi",name:"",kind:"multi" as const,layout:singleChart("OMH","5m")};
 book.tabs.push(multi);
 const saved=parseChartTabs(book),views=chartWorkspaceViews(saved);
 expect(views.tickers.map(tab=>tab.layout.groups[0].symbol)).toEqual(["OMH","SMX","TANH","GPUS","MI"]);
 expect(views.multi).toEqual(multi);
 expect(views.earlier.map(tab=>tab.id)).toEqual(["extra-4"]);
 expect(()=>parseChartTabs({...book,tabs:[...book.tabs,{...multi,id:"second-multi"}]})).toThrow();
});


it("seeds Multi-ticker with four charts and includes the active ticker beyond the first four", () => {
 const book = initialChartTabs(singleChart("OMH"));
 book.tabs.push(...["SMX", "TANH", "GPUS", "MI", "NWGL"].map(symbol => ({ id: symbol, name: "", layout: singleChart(symbol) })));
 const next = openMultiTicker({ ...book, selectedTab: "NWGL" }, "multi");
 expect(parseChartTabs(next).tabs.at(-1)?.layout.groups.map(group => group.symbol)).toEqual(["OMH", "SMX", "TANH", "NWGL"]);
 expect(chartWorkspaceViews(next).tickers).toHaveLength(6);
});
