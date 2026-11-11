import { parseChartMultiview, selectedChart, singleChart, type ChartMultiview } from "./chart-multiview";

export const MAX_CHART_TABS = 80;
export const MAX_CHART_TABS_BYTES = 120 * 1024;
export type ChartTab = { id: string; name: string; layout: ChartMultiview; kind?: "multi"; configured?: true };
export type TickerPortrait = NonNullable<ChartMultiview["mobileLayout"]>;
export type ChartTabs = { version: 1; tabs: ChartTab[]; selectedTab: string; plain?: true; tickerPortrait?: TickerPortrait };
export function initialChartTabs(layout: ChartMultiview): ChartTabs {
  return layout.groups.length
    ? {version:1,tabs:[{id:"original",name:"",layout}],selectedTab:"original"}
    : plainChart("NWGL");
}

export function plainChart(symbol: string, timeframe?: Parameters<typeof singleChart>[1]): ChartTabs {
  return {version:1,plain:true,tabs:[{id:"plain",name:"",layout:singleChart(symbol,timeframe)}],selectedTab:"plain"};
}

export function closeSelectedChartTab(book: ChartTabs): ChartTabs {
  if(book.plain)return book;
  const index=book.tabs.findIndex(tab=>tab.id===book.selectedTab);
  if(index<0)return book;
  if(book.tabs.length===1){
    const selected=selectedChart(book.tabs[index].layout);
    return { ...plainChart(selected?.group.symbol??"NWGL",selected?.panel.timeframe), ...tickerPortraitSetting(book) };
  }
  const tabs=book.tabs.filter(tab=>tab.id!==book.selectedTab);
  const next=tabs[Math.min(index,tabs.length-1)];
  const {multi,tickers}=chartWorkspaceViews({...book,tabs});
  return {...book,tabs,selectedTab:next===multi?(tickers.at(-1)?.id??next.id):next.id};
}
export function parseChartTabs(value: unknown, legacy = false): ChartTabs {
  if(!value||typeof value!=="object")throw Error("invalid_layout");
  const book=value as ChartTabs;
  const plain=book.plain===true;
  const hasTickerPortrait=Object.hasOwn(book,"tickerPortrait");
  const keys=["selectedTab","tabs","version",...(plain?["plain"]:[]),...(hasTickerPortrait?["tickerPortrait"]:[])].sort().join();
  if((hasTickerPortrait && book.tickerPortrait!=="tabs" && book.tickerPortrait!=="stack") || Object.keys(book).sort().join()!==keys||book.version!==1||!Array.isArray(book.tabs)||!book.tabs.length||book.tabs.length>MAX_CHART_TABS)throw Error("invalid_layout");
  const ids=new Set<string>();
  let tabs=book.tabs.map(tab=>{
    if(!tab||typeof tab!=="object"||Object.keys(tab).sort().join()!==(tab.kind==="multi"?(tab.configured===true?"configured,id,kind,layout,name":"id,kind,layout,name"):"id,layout,name")||typeof tab.id!=="string"||!/^[a-zA-Z0-9_-]{1,40}$/.test(tab.id)||ids.has(tab.id)||typeof tab.name!=="string"||tab.name.length>32||/[\u0000-\u001f\u007f]/.test(tab.name))throw Error("invalid_layout");
    ids.add(tab.id);const layout=parseChartMultiview(tab.layout,legacy);if(!layout.groups.length)throw Error("invalid_layout");
    const isSeed=legacy&&tab.kind==="multi"&&!tab.configured&&layout.groups.length===1&&layout.groups[0].panels.length===1;
    return {id:tab.id,name:tab.name.trim(),layout,...(tab.kind==="multi"&&!isSeed?{kind:"multi" as const,...(tab.configured?{configured:true as const}:{})}:{})};
  });
  let selectedTab=book.selectedTab;
  if(legacy){
    tabs=tabs.flatMap(tab=>{
      const charts=tab.layout.groups.flatMap(group=>group.panels.map(panel=>({group,panel})));
      const {comparisonPanels: _comparison, ...settings}=tab.layout;
      void _comparison;
      const chunks:ChartTab[]=[];
      for(let start=0;start<charts.length;start+=4){
        const chunk=charts.slice(start,start+4);
        const groups=tab.layout.groups.map(group=>({...group,panels:chunk.filter(item=>item.group.id===group.id).map(item=>item.panel)})).filter(group=>group.panels.length);
        let id=tab.id;
        if(start){let n=1;while(ids.has("split-"+n))n++;id="split-"+n;ids.add(id);}
        const contains=chunk.some(item=>item.panel.id===tab.layout.selectedPanel);
        if(book.selectedTab===tab.id&&contains)selectedTab=id;
        chunks.push({id,...(!start&&tab.kind?{kind:tab.kind,...(tab.configured?{configured:true as const}:{})}:{}),name:tab.name&&start?tab.name.slice(0,25)+" "+(chunks.length+1):tab.name,layout:{...settings,groups,selectedPanel:contains?tab.layout.selectedPanel:chunk[0].panel.id}});
      }
      return chunks;
    });
    if(tabs.length>MAX_CHART_TABS)throw Error("invalid_layout");
  }
  if(tabs.filter(tab=>tab.kind==="multi").length>1)throw Error("invalid_layout");
  if(!ids.has(book.selectedTab))throw Error("invalid_layout");
  if(plain && (tabs.length!==1 || tabs[0].id!=="plain" || tabs[0].name!=="" || tabs[0].kind || tabs[0].layout.groups.length!==1 || tabs[0].layout.groups[0].panels.length!==1 || tabs[0].layout.comparisonPanels))throw Error("invalid_layout");
  return {version:1,tabs,selectedTab,...tickerPortraitSetting(book),...(plain?{plain:true as const}:{})};
}
export const chartTabPrefix=(id:string)=>id==="original"?"":`${id}--`;
export function chartTabLabel(tab: ChartTab, short=false) {
  if(tab.name)return tab.name;
  const symbols=tab.layout.groups.map(g=>g.symbol);
  return short&&symbols.length>2?`${symbols.slice(0,2).join(" · ")} +${symbols.length-2}`:symbols.join(" · ");
}
export const chartTabDescription=(tab:ChartTab)=>tab.layout.groups.map(g=>`${g.symbol}: ${g.panels.map(p=>p.timeframe).join(", ")}`).join("; ");
// A combined retention inventory, never a rendered layout. IDs are scoped by tab.
export function chartTabsInventory(book: ChartTabs): ChartMultiview {
  return {version:1,selectedPanel:null,groups:book.tabs.flatMap(tab=>tab.layout.groups.map(g=>({...g,panels:g.panels.map(p=>({...p,id:chartTabPrefix(tab.id)+p.id}))})))};
}

export function chartTabDisplayLabel(book:ChartTabs, tab:ChartTab, short=false){
 const label=chartTabLabel(tab,short),full=chartTabLabel(tab);
 const matching=book.tabs.filter(item=>chartTabLabel(item)===full);
 const index=matching.findIndex(item=>item.id===tab.id);
 return index>0?`${label} (${index+1})`:label;
}

export function chartWorkspaceViews(book: ChartTabs) {
  const multi = book.tabs.find(tab=>tab.kind==="multi") ?? book.tabs.find(tab=>tab.layout.groups.length>1);
  const seen = new Set<string>();
  const tickers = book.plain ? [] : book.tabs.filter(tab=>{
    if(tab===multi||tab.layout.groups.length!==1)return false;
    const symbol=tab.layout.groups[0].symbol;
    if(seen.has(symbol))return false;
    seen.add(symbol);return true;
  });
  const earlier = book.plain ? [] : book.tabs.filter(tab=>tab!==multi&&!tickers.includes(tab));
  return {multi,tickers,earlier};
}

export const tickerPortraitSetting=(book:ChartTabs):Pick<ChartTabs,"tickerPortrait">=>book.tickerPortrait?{tickerPortrait:book.tickerPortrait}:{};

export function setTickerPortrait(book:ChartTabs,tickerPortrait:TickerPortrait):ChartTabs {
  const {multi}=chartWorkspaceViews(book);
  return {...book,tickerPortrait,tabs:book.tabs.map(tab=>{
    if(tab===multi||tab.layout.groups.length!==1||!tab.layout.mobileLayout)return tab;
    const {mobileLayout: _override,...layout}=tab.layout;
    void _override;
    return {...tab,layout};
  })};
}

export function openMultiTicker(book: ChartTabs, id: string, fromCurrent = false): ChartTabs {
  const {multi,tickers}=chartWorkspaceViews(book);
  if(multi)return {...book,selectedTab:multi.id,tabs:book.tabs.map(tab=>tab===multi?{...tab,kind:"multi"}:tab)};
  if(book.tabs.length>=MAX_CHART_TABS||book.tabs.some(tab=>tab.id===id))return book;
  const current = book.tabs.find(tab => tab.id === book.selectedTab);
  const firstTickers = tickers.slice(0, 4);
  const sources = fromCurrent
    ? current ? [current] : []
    : current && tickers.includes(current) && !firstTickers.includes(current)
      ? [...firstTickers.slice(0, 3), current]
      : firstTickers;
  const groups=sources.flatMap((tab,index)=>{
    const chart=selectedChart(tab.layout);
    return chart?[{id:"multi-ticker-"+index,symbol:chart.group.symbol,panels:[{id:"multi-panel-"+index,timeframe:chart.panel.timeframe}]}]:[];
  });
  if(!groups.length)return book;
  return {version:1,...tickerPortraitSetting(book),selectedTab:id,tabs:[...book.tabs,{id,name:"",kind:"multi",layout:{version:1,groups,selectedPanel:groups[0].panels[0].id}}]};
}
