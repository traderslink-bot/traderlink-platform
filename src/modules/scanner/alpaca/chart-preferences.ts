import {CHART_TIMEFRAMES,type ChartTimeframe} from './candles';
export const INDICATOR_TYPES=['EMA','SMA','VWAP','RSI','MACD','Bollinger'] as const;
export type IndicatorType=typeof INDICATOR_TYPES[number];
export type ChartIndicator={id:string;type:IndicatorType;period:number;color:string;width:1|2|3};
export type ChartPreferences={version:1;timeframe:ChartTimeframe;theme:'auto'|'light'|'dark';kind:'candles'|'bars'|'line';grid:boolean;volume:boolean;volumeHeight:number;logarithmic:boolean;autoScale:boolean;timezone:'America/New_York'|'UTC'|'America/Toronto';upColor:string;downColor:string;premarket:boolean;regular:boolean;postmarket:boolean;indicators:ChartIndicator[]};
export const DEFAULT_CHART_PREFERENCES:ChartPreferences={version:1,timeframe:'1m',theme:'auto',kind:'candles',grid:true,volume:true,volumeHeight:20,logarithmic:false,autoScale:true,timezone:'America/New_York',upColor:'#16a085',downColor:'#e45757',premarket:true,regular:true,postmarket:true,indicators:[]};
export function parseChartPreferences(value:unknown):ChartPreferences{
 if(!value||typeof value!=='object')throw Error('invalid_preferences');const p=value as ChartPreferences;
 if(p.version!==1||!CHART_TIMEFRAMES.includes(p.timeframe)||!['auto','light','dark'].includes(p.theme)||!['candles','bars','line'].includes(p.kind)||!['America/New_York','America/Toronto','UTC'].includes(p.timezone)||!Number.isInteger(p.volumeHeight)||p.volumeHeight<10||p.volumeHeight>40)throw Error('invalid_preferences');
 for(const key of ['grid','volume','logarithmic','autoScale','premarket','regular','postmarket'] as const)if(typeof p[key]!=='boolean')throw Error('invalid_preferences');
 if(!p.premarket&&!p.regular&&!p.postmarket)throw Error('invalid_preferences');
 const color=(s:unknown)=>typeof s==='string'&&/^#[a-f0-9]{6}$/i.test(s);
 if(!color(p.upColor)||!color(p.downColor)||!Array.isArray(p.indicators)||p.indicators.length>20)throw Error('invalid_preferences');
 const ids=new Set<string>();for(const i of p.indicators){if(!i||typeof i.id!=='string'||!/^[-a-zA-Z0-9]{1,80}$/.test(i.id)||ids.has(i.id)||!INDICATOR_TYPES.includes(i.type)||!Number.isInteger(i.period)||i.period<2||i.period>500||!color(i.color)||![1,2,3].includes(i.width))throw Error('invalid_preferences');ids.add(i.id);}
 return {version:1,timeframe:p.timeframe,theme:p.theme,kind:p.kind,grid:p.grid,volume:p.volume,volumeHeight:p.volumeHeight,logarithmic:p.logarithmic,autoScale:p.autoScale,timezone:p.timezone,upColor:p.upColor,downColor:p.downColor,premarket:p.premarket,regular:p.regular,postmarket:p.postmarket,indicators:p.indicators.map(i=>({id:i.id,type:i.type,period:i.period,color:i.color,width:i.width}))};
}
