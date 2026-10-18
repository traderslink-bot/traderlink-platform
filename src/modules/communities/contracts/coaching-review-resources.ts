export const COACHING_RESOURCE_GROUPS=[
 {label:"Analytics",items:[{id:"overview",label:"Overview",path:"/analytics"},{id:"ticker",label:"Ticker",path:"/analytics/results"},{id:"timing",label:"Timing",path:"/analytics/timing"},{id:"breakdown",label:"Trade Breakdown",path:"/analytics/execution"}]},
 {label:"Trade Explorer",items:[{id:"explorer",label:"Trade Explorer",path:"/analytics/trade-explorer"}]},
 {label:"Compare Trades",items:[{id:"compare",label:"Compare Trades",path:"/analytics/trade-explorer/compare"}]},
 {label:"Rules analytics",items:[{id:"rules",label:"Rules analytics",path:"/rules/results"}]},
 {label:"Trade Analyzer",items:[{id:"day",label:"Day Trade Analysis",path:"/analytics/trade-analyzer/day"},{id:"entry-exit",label:"Entries and exits",path:"/analytics/trade-analyzer/day/entry-exit"},{id:"mfe-mae",label:"Room after entry",path:"/analytics/trade-analyzer/day/mfe-mae"},{id:"green-to-red",label:"Green to red",path:"/analytics/trade-analyzer/day/green-to-red"},{id:"scaling-out",label:"Scaling out",path:"/analytics/trade-analyzer/day/scaling-out"},{id:"candle-patterns",label:"Candle patterns",path:"/analytics/trade-analyzer/day/candle-patterns"},{id:"trend-momentum",label:"Trend & Momentum",path:"/analytics/trade-analyzer/day/trend-momentum"},{id:"trades",label:"Analyzed trades",path:"/analytics/trade-analyzer/day/trades"}]},
 {label:"Analytics Lab",items:[{id:"lab",label:"Analytics Lab",path:"/analytics/lab"},{id:"candles",label:"Trade candle analysis",path:"/analytics/lab/trade-candle-analysis"}]},
] as const;
export type CoachingResourceId=typeof COACHING_RESOURCE_GROUPS[number]['items'][number]['id'];
export type CoachingResource=typeof COACHING_RESOURCE_GROUPS[number]["items"][number];
export const COACHING_RESOURCES=COACHING_RESOURCE_GROUPS.reduce<CoachingResource[]>((items,group)=>[...items,...group.items],[]);
export const coachingResource=(id:string)=>COACHING_RESOURCES.find(item=>item.id===id);
