import {CHART_TIMEFRAMES,type ChartTimeframe} from './candles';
export const MAX_CHART_PREFERENCE_BYTES=64*1024;
export const INDICATOR_TYPES=['EMA','SMA','VWAP','RSI','MACD','Bollinger'] as const;
export type IndicatorType=typeof INDICATOR_TYPES[number];
export const PRICE_SOURCES=["close","open","high","low","hl2","hlc3","ohlc4","hlcc4"] as const;
export const VWAP_ANCHORS=["Session","Week","Month","Quarter","Year","Decade","Century","Splits","Dividends"] as const;
export const MA_TYPES=["SMA","EMA","RMA","WMA","VWMA"] as const;
export type PriceSource=typeof PRICE_SOURCES[number];
export type MaType=typeof MA_TYPES[number];
export type VwapBandLevel={enabled:boolean;multiplier:number;fillVisible:boolean;fillColor:string;fillOpacity:number};
export type VwapBands={mode:'Standard deviation'|'Percentage';levels:[VwapBandLevel,VwapBandLevel,VwapBandLevel]};
export const VWAP_BAND_COLORS=['#4caf50','#808000','#089981'] as const;
export function defaultVwapBands(firstEnabled=true):VwapBands{
 const level=(index:number):VwapBandLevel=>({enabled:index===0&&firstEnabled,multiplier:index+1,fillVisible:true,fillColor:VWAP_BAND_COLORS[index],fillOpacity:5});
 return {mode:'Standard deviation',levels:[level(0),level(1),level(2)]};
}
export type PlotStyle={visible?:boolean;color?:string;width?:1|2|3|4;style?:0|1|2};
export type IndicatorOutput={precision?:number;priceScaleLabels?:boolean;statusLineValues:boolean};
export type ChartIndicator={output?:IndicatorOutput;id:string;type:IndicatorType;period:number;color:string;width:1|2|3;anchor?:typeof VWAP_ANCHORS[number];hideOnDaily?:boolean;vwapBands?:VwapBands;offset?:number;calculationTimeframe?:ChartTimeframe;waitForClose?:boolean;timeframes?:ChartTimeframe[];source?:PriceSource;visible?:boolean;fastLength?:number;slowLength?:number;signalLength?:number;oscillatorMa?:"SMA"|"EMA";signalMa?:"SMA"|"EMA";deviation?:number;basisMa?:MaType;levels?:{upper:number;middle:number;lower:number};smoothing?:{type:MaType|"None"|"SMA+BB";length:number;deviation:number};plots?:Record<string,PlotStyle>};
export const MAX_SAVED_INDICATOR_PRESETS = 20;
export const MAX_SAVED_INDICATOR_PRESET_BYTES = 32 * 1024;
export const MAX_INDICATOR_PRESET_NAME_LENGTH = 60;
export type SavedIndicatorPreset = { id: string; name: string; type: IndicatorType; indicators: ChartIndicator[] };
export type ChartPreferences={version:1;timeframe:ChartTimeframe;theme:'auto'|'light'|'dark';kind:'candles'|'bars'|'line';grid:boolean;volume:boolean;volumeHeight:number;logarithmic:boolean;autoScale:boolean;scalePriceOnly?:boolean;indicatorPriceScaleLabels?:boolean;timezone:'America/New_York'|'UTC'|'America/Toronto';upColor:string;downColor:string;premarket:boolean;regular:boolean;postmarket:boolean;indicators:ChartIndicator[];savedIndicatorPresets?:SavedIndicatorPreset[]};
export const DEFAULT_CHART_PREFERENCES:ChartPreferences={version:1,timeframe:'1m',theme:'auto',kind:'candles',grid:true,volume:true,volumeHeight:20,logarithmic:false,autoScale:true,timezone:'America/New_York',upColor:'#16a085',downColor:'#e45757',premarket:true,regular:true,postmarket:true,indicators:[]};
export function indicatorPriceScaleLabels(preferences:ChartPreferences,indicator:ChartIndicator):boolean {
 return indicator.output?.priceScaleLabels??preferences.indicatorPriceScaleLabels??false;
}
export function setAllIndicatorPriceScaleLabels(preferences:ChartPreferences,visible:boolean):ChartPreferences {
 return {...preferences,indicatorPriceScaleLabels:visible,indicators:preferences.indicators.map(indicator=>
  indicator.output?.priceScaleLabels===undefined?indicator:{...indicator,output:{...indicator.output,priceScaleLabels:undefined}})};
}
export function parseChartPreferences(value:unknown):ChartPreferences{
 if(!value||typeof value!=='object')throw Error('invalid_preferences');const p=value as ChartPreferences;
 if(p.version!==1||!CHART_TIMEFRAMES.includes(p.timeframe)||!['auto','light','dark'].includes(p.theme)||!['candles','bars','line'].includes(p.kind)||!['America/New_York','America/Toronto','UTC'].includes(p.timezone)||!Number.isInteger(p.volumeHeight)||p.volumeHeight<10||p.volumeHeight>40)throw Error('invalid_preferences');
 for(const key of ['grid','volume','logarithmic','autoScale','premarket','regular','postmarket'] as const)if(typeof p[key]!=='boolean')throw Error('invalid_preferences');
 if(!p.premarket&&!p.regular&&!p.postmarket)throw Error('invalid_preferences');
 const color=(s:unknown)=>typeof s==='string'&&/^#[a-f0-9]{6}$/i.test(s);
 if(p.indicatorPriceScaleLabels!==undefined&&typeof p.indicatorPriceScaleLabels!=='boolean')throw Error('invalid_preferences');
 if(p.scalePriceOnly!==undefined&&typeof p.scalePriceOnly!=='boolean')throw Error('invalid_preferences');
 if(!color(p.upColor)||!color(p.downColor)||!Array.isArray(p.indicators)||p.indicators.length>20)throw Error('invalid_preferences');
 const presets = p.savedIndicatorPresets === undefined ? undefined : parseSavedIndicatorPresets(p.savedIndicatorPresets);
 return {version:1,timeframe:p.timeframe,theme:p.theme,kind:p.kind,grid:p.grid,volume:p.volume,volumeHeight:p.volumeHeight,logarithmic:p.logarithmic,autoScale:p.autoScale,...(p.indicatorPriceScaleLabels!==undefined?{indicatorPriceScaleLabels:p.indicatorPriceScaleLabels}:{}),...(p.scalePriceOnly!==undefined?{scalePriceOnly:p.scalePriceOnly}:{}),timezone:p.timezone,upColor:p.upColor,downColor:p.downColor,premarket:p.premarket,regular:p.regular,postmarket:p.postmarket,indicators:parseIndicators(p.indicators),...(presets?.length ? {savedIndicatorPresets:presets} : {})};
}

function parseIndicators(indicators: ChartIndicator[]): ChartIndicator[] {
 const color=(s:unknown)=>typeof s==='string'&&/^#[a-f0-9]{6}$/i.test(s);
 const ids=new Set<string>();for(const i of indicators){if(!i||typeof i.id!=='string'||!/^[-a-zA-Z0-9]{1,80}$/.test(i.id)||ids.has(i.id)||!INDICATOR_TYPES.includes(i.type)||!Number.isInteger(i.period)||i.period<1||i.period>10000||!color(i.color)||![1,2,3].includes(i.width))throw Error('invalid_preferences');ids.add(i.id);
 if(i.output!==undefined&&(!i.output||typeof i.output!=='object'||i.output.priceScaleLabels!==undefined&&typeof i.output.priceScaleLabels!=='boolean'||typeof i.output.statusLineValues!=='boolean'||i.output.precision!==undefined&&(!Number.isInteger(i.output.precision)||i.output.precision<0||i.output.precision>16)))throw Error('invalid_preferences');
 if(i.vwapBands!==undefined){
  const bands=i.vwapBands;
  if(i.type!=='VWAP'||!bands||!['Standard deviation','Percentage'].includes(bands.mode)||!Array.isArray(bands.levels)||bands.levels.length!==3)throw Error('invalid_preferences');
  for(const level of bands.levels)if(!level||typeof level.enabled!=='boolean'||!Number.isFinite(level.multiplier)||level.multiplier<0||typeof level.fillVisible!=='boolean'||!color(level.fillColor)||!Number.isFinite(level.fillOpacity)||level.fillOpacity<0||level.fillOpacity>100)throw Error('invalid_preferences');
 }
 if(i.offset!==undefined&&(!Number.isInteger(i.offset)||i.offset< -500||i.offset>500)||i.calculationTimeframe!==undefined&&!CHART_TIMEFRAMES.includes(i.calculationTimeframe)||i.waitForClose!==undefined&&typeof i.waitForClose!=='boolean')throw Error('invalid_preferences');
 if(i.timeframes!==undefined&&(!Array.isArray(i.timeframes)||i.timeframes.length>CHART_TIMEFRAMES.length||new Set(i.timeframes).size!==i.timeframes.length||i.timeframes.some(frame=>!CHART_TIMEFRAMES.includes(frame))))throw Error("invalid_preferences");
 if(i.anchor!==undefined&&!VWAP_ANCHORS.includes(i.anchor)||i.hideOnDaily!==undefined&&typeof i.hideOnDaily!=='boolean')throw Error('invalid_preferences');
 if(i.source!==undefined&&!PRICE_SOURCES.includes(i.source))throw Error('invalid_preferences');
 if(i.visible!==undefined&&typeof i.visible!=='boolean')throw Error('invalid_preferences');
 for(const key of ['fastLength','slowLength','signalLength'] as const)if(i[key]!==undefined&&(!Number.isInteger(i[key])||i[key]!<1||i[key]!>10000))throw Error('invalid_preferences');
 if(i.oscillatorMa!==undefined&&!['SMA','EMA'].includes(i.oscillatorMa)||i.signalMa!==undefined&&!['SMA','EMA'].includes(i.signalMa)||i.basisMa!==undefined&&!MA_TYPES.includes(i.basisMa))throw Error('invalid_preferences');
 if(i.deviation!==undefined&&(!Number.isFinite(i.deviation)||i.deviation<=0||i.deviation>100))throw Error('invalid_preferences');
 if(i.levels!==undefined&&(!i.levels||typeof i.levels!=='object'||![i.levels.upper,i.levels.middle,i.levels.lower].every(v=>Number.isFinite(v)&&v>=0&&v<=100)||i.levels.lower>=i.levels.middle||i.levels.middle>=i.levels.upper))throw Error('invalid_preferences');
 if(i.smoothing!==undefined&&(!i.smoothing||typeof i.smoothing!=='object'||![...MA_TYPES,"None","SMA+BB"].includes(i.smoothing.type)||!Number.isInteger(i.smoothing.length)||i.smoothing.length<1||i.smoothing.length>10000||!Number.isFinite(i.smoothing.deviation)||i.smoothing.deviation<=0||i.smoothing.deviation>100))throw Error("invalid_preferences");
 if(i.plots!==undefined){if(!i.plots||typeof i.plots!=='object'||Array.isArray(i.plots)||Object.keys(i.plots).length>16)throw Error('invalid_preferences');for(const [key,plot]of Object.entries(i.plots)){if(!/^[a-z0-9-]{1,30}$/.test(key)||!plot||typeof plot!=='object'||plot.visible!==undefined&&typeof plot.visible!=='boolean'||plot.color!==undefined&&!color(plot.color)||plot.width!==undefined&&![1,2,3,4].includes(plot.width)||plot.style!==undefined&&![0,1,2].includes(plot.style))throw Error('invalid_preferences');}}
 }
 return indicators.map(i=>({id:i.id,type:i.type,period:i.period,color:i.color,width:i.width,
 ...(i.output?{output:{...(i.output.priceScaleLabels!==undefined?{priceScaleLabels:i.output.priceScaleLabels}:{}),statusLineValues:i.output.statusLineValues,...(i.output.precision!==undefined?{precision:i.output.precision}:{})}}:{}),
 ...(i.vwapBands?{vwapBands:{mode:i.vwapBands.mode,levels:i.vwapBands.levels.map(level=>({enabled:level.enabled,multiplier:level.multiplier,fillVisible:level.fillVisible,fillColor:level.fillColor,fillOpacity:level.fillOpacity})) as VwapBands['levels']}}:{}),
 ...(i.offset!==undefined?{offset:i.offset}:{}),...(i.calculationTimeframe!==undefined?{calculationTimeframe:i.calculationTimeframe}:{}),...(i.waitForClose!==undefined?{waitForClose:i.waitForClose}:{}),
 ...(i.timeframes!==undefined?{timeframes:[...i.timeframes]}:{}),
 ...(i.anchor!==undefined?{anchor:i.anchor}:{}),...(i.hideOnDaily!==undefined?{hideOnDaily:i.hideOnDaily}:{}),
 ...(i.source!==undefined?{source:i.source}:{}),...(i.visible!==undefined?{visible:i.visible}:{}),
 ...Object.fromEntries((['fastLength','slowLength','signalLength','oscillatorMa','signalMa','deviation','basisMa'] as const).filter(key=>i[key]!==undefined).map(key=>[key,i[key]])),
 ...(i.smoothing?{smoothing:{type:i.smoothing.type,length:i.smoothing.length,deviation:i.smoothing.deviation}}:{}),
 ...(i.levels?{levels:{upper:i.levels.upper,middle:i.levels.middle,lower:i.levels.lower}}:{}),
 ...(i.plots?{plots:Object.fromEntries(Object.entries(i.plots).map(([key,value])=>[key,{...(value.visible!==undefined?{visible:value.visible}:{}),...(value.color!==undefined?{color:value.color}:{}),...(value.width!==undefined?{width:value.width}:{}),...(value.style!==undefined?{style:value.style}:{})}]))}:{})}));
}

function parseSavedIndicatorPresets(value: unknown): SavedIndicatorPreset[] {
 if (!Array.isArray(value) || value.length > MAX_SAVED_INDICATOR_PRESETS) throw Error('invalid_preferences');
 const ids = new Set<string>(), names = new Set<string>();
 const presets = value.map((preset): SavedIndicatorPreset => {
  if (!preset || typeof preset !== 'object' || typeof preset.id !== 'string' ||
      !/^[-a-zA-Z0-9]{1,80}$/.test(preset.id) || ids.has(preset.id) ||
      typeof preset.name !== 'string' || !INDICATOR_TYPES.includes(preset.type) ||
      !Array.isArray(preset.indicators) || !preset.indicators.length || preset.indicators.length > 20) {
   throw Error('invalid_preferences');
  }
  const name = preset.name.trim(), key = `${preset.type}:${name.toLowerCase()}`;
  if (!name || name.length > MAX_INDICATOR_PRESET_NAME_LENGTH || /[\u0000-\u001f\u007f]/u.test(name) || names.has(key)) {
   throw Error('invalid_preferences');
  }
  const indicators = parseIndicators(preset.indicators);
  if (indicators.some(indicator => indicator.type !== preset.type)) throw Error('invalid_preferences');
  ids.add(preset.id);
  names.add(key);
  return { id: preset.id, name, type: preset.type, indicators };
 });
 if (new TextEncoder().encode(JSON.stringify(presets)).length > MAX_SAVED_INDICATOR_PRESET_BYTES) {
  throw Error('invalid_preferences');
 }
 return presets;
}
