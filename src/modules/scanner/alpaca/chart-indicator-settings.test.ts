// @vitest-environment node
import {expect,it} from 'vitest';
import {DEFAULT_CHART_PREFERENCES,defaultVwapBands,parseChartPreferences,setAllIndicatorOverlayWidths,withoutOverlayWidthOverrides,type ChartIndicator} from './chart-preferences';
import {indicatorValues,indicatorHistogramColor,indicatorPlotStyle,movingAverage,visibleSessionBars} from './chart-indicators';
import type {Candle} from './candles';
const study=(type:ChartIndicator['type'],options:Partial<ChartIndicator>={}):ChartIndicator=>({id:'test',type,period:3,color:'#ff9900',width:2,...options});
const bars=(values:number[]):Candle[]=>values.map((close,index)=>({time:Date.parse('2026-11-06T15:00Z')/1000+index*60,open:close-0.2,high:close+1,low:close-1,close,volume:(index+1)*10}));
it('preserves multiple independent EMA/SMA lengths and all supported settings through parsing',()=>{
 const indicators=[study('EMA',{id:'ema9',period:9}),study('EMA',{id:'ema200',period:200,source:'hlc3',plots:{main:{visible:false,color:'#123456',width:4,style:2}},smoothing:{type:'WMA',length:20,deviation:2}}),study('SMA',{id:'sma20',period:20}),study('SMA',{id:'sma50',period:50}),study('MACD',{id:'macd',fastLength:5,slowLength:13,signalLength:4,oscillatorMa:'SMA',signalMa:'EMA'}),study('Bollinger',{id:'bb',deviation:1.5,basisMa:'VWMA'}),study('RSI',{id:'rsi',levels:{upper:80,middle:50,lower:20}})];
 expect(parseChartPreferences({...DEFAULT_CHART_PREFERENCES,indicators}).indicators).toEqual(indicators);
 expect(parseChartPreferences({...DEFAULT_CHART_PREFERENCES,indicators:[study('SMA',{period:1})]}).indicators[0].period).toBe(1);
 for(const options of [{source:'invented'},{signalLength:0},{basisMa:'invalid'},{deviation:-1},{levels:{upper:20,middle:50,lower:80}},{plots:{main:{color:'red'}}},{smoothing:{type:'EMA',length:0,deviation:2}}])expect(()=>parseChartPreferences({...DEFAULT_CHART_PREFERENCES,indicators:[study('EMA',options as Partial<ChartIndicator>)]})).toThrow();
});
it('honours independently selected MA periods and price sources',()=>{
 const input=bars([1,2,4,8]);
 expect(indicatorValues(input,study('SMA',{period:2}))[0].points.map(p=>p.value)).toEqual([1.5,3,6]);
 expect(indicatorValues(input,study('SMA',{period:3}))[0].points.map(p=>p.value)).toEqual([7/3,14/3]);
 expect(indicatorValues(input,study('SMA',{period:1,source:'high'}))[0].points.map(p=>p.value)).toEqual([2,3,5,9]);
 expect(movingAverage([1,2,4],2,'WMA')).toEqual([null,5/3,10/3]);
 expect(movingAverage([1,2,4],2,'VWMA',[1,3,2])).toEqual([null,7/4,14/5]);
});
it('applies editable MACD lengths and MA types to all three outputs',()=>{
 const values=indicatorValues(bars([1,2,4,8,16]),study('MACD',{fastLength:2,slowLength:3,signalLength:2,oscillatorMa:'SMA',signalMa:'SMA'}));
 expect(values[0].points.map(p=>p.value)).toEqual([3-7/3,6-14/3,12-28/3]);
 expect(values[1].points[0].value).toBeCloseTo(1);
 expect(values[2].points[0].value).toBeCloseTo(1/3);
});
it('uses the configurable Bollinger basis and source population deviation separately',()=>{
 const values=indicatorValues(bars([1,2,4]),study('Bollinger',{period:3,basisMa:'WMA',deviation:1}));
 const basis=17/6,sd=Math.sqrt(14/9);
 expect(values[0].points[0].value).toBeCloseTo(basis);
 expect(values[1].points[0].value).toBeCloseTo(basis+sd);
 expect(values[2].points[0].value).toBeCloseTo(basis-sd);
});
it('draws configurable RSI reference levels and optional smoothing independently',()=>{
 const parts=indicatorValues(bars([1,2,3,4,5,6]),study('RSI',{period:2,levels:{upper:80,middle:50,lower:20},smoothing:{type:'SMA',length:2,deviation:2}}));
 expect(parts.map(p=>p.key)).toEqual(['main','upper','middle','lower','smoothing']);
 expect(parts[1].points.map(p=>p.value)).toEqual([80,80]);
 expect(parts[4].points.map(p=>p.value)).toEqual([100,100,100]);
 expect(indicatorPlotStyle(study('MACD',{plots:{signal:{color:'#123456',width:4,style:1,visible:false}}}),'signal')).toMatchObject({color:'#123456',width:4,style:1,visible:false});
 expect(indicatorHistogramColor(study('MACD',{plots:{'positive-falling':{color:'#abcdef'}}}),2,3,'#00ff00','#ff0000')).toBe('#abcdef');
});
it('uses plain VWAP with cumulative HLC3/volume from visible session start, before and after DST',()=>{
 for(const [day,start,regular]of [['2026-10-30','08:00','13:30'],['2026-11-06','09:00','14:30']]){
  const input=bars([10,20,30]);input[0].time=Date.parse(`${day}T${start}:00Z`)/1000;input[1].time=Date.parse(`${day}T${regular}:00Z`)/1000;input[2].time=input[1].time+60;
  input[0].high=13;input[0].low=7;input[0].volume=100;input[1].high=24;input[1].low=16;input[1].volume=200;input[2].volume=0;
  const extended=indicatorValues(input,study('VWAP'))[0];
  expect(extended.label).toBe('VWAP');expect(extended.points[1].value).toBeCloseTo(50/3);expect(extended.points[2].value).toBeCloseTo(50/3);
  const regularOnly=visibleSessionBars(input,{...DEFAULT_CHART_PREFERENCES,premarket:false,postmarket:false});
  expect(indicatorValues(regularOnly,study('VWAP'))[0].points.map(p=>p.value)).toEqual([20,20]);
 }
});

it("defaults to free movement and preserves new crosshair choices", () => {
  expect(parseChartPreferences(DEFAULT_CHART_PREFERENCES).crosshairMode).toBe("normal");
  for (const crosshairMode of ["price", "normal", "nearest", "indicator:ema9:main"] as const) {
    expect(parseChartPreferences({ ...DEFAULT_CHART_PREFERENCES, crosshairMode }).crosshairMode).toBe(crosshairMode);
  }
  expect(() => parseChartPreferences({ ...DEFAULT_CHART_PREFERENCES, crosshairMode: "indicator:" })).toThrow();
});

it('starts every existing price overlay plot and legacy saved preset at 1 px', () => {
 const indicators = [
  study('EMA', {id:'ema',plots:{main:{width:4,color:'#123456',style:2}}}),
  study('SMA', {id:'sma',width:3}),
  study('Bollinger', {id:'bb',plots:{upper:{width:3}, lower:{width:4}}}),
  study('VWAP', {id:'vwap',vwapBands:defaultVwapBands(),plots:{main:{width:3},'upper-1':{width:4}}}),
 ];
 const legacy = parseChartPreferences({
  ...DEFAULT_CHART_PREFERENCES, indicators,
  savedIndicatorPresets:[{id:'saved-ema',name:'Old EMA',type:'EMA',indicators:[indicators[0]]}],
 });
 for (const indicator of legacy.indicators) {
  for (const plot of indicatorValues([],indicator)) {
   expect(indicatorPlotStyle(indicator,plot.key).width).toBe(1);
  }
 }
 expect(indicatorPlotStyle(legacy.savedIndicatorPresets![0].indicators[0],'main'))
  .toMatchObject({width:1,color:'#123456',style:2});
});

it('replaces current and saved overlay widths, keeps other styles and allows later line edits', () => {
 const ema = study('EMA',{id:'ema',plots:{main:{overlayWidth:4,color:'#123456',style:2}}});
 const rsi = study('RSI',{id:'rsi',plots:{main:{width:3}}});
 const preferences = parseChartPreferences({
  ...DEFAULT_CHART_PREFERENCES, indicators:[ema,rsi],
  savedIndicatorPresets:[{id:'mine',name:'My EMA',type:'EMA',indicators:[ema]}],
 });
 expect(indicatorPlotStyle(preferences.indicators[0],'main').width).toBe(4);
 const applied = parseChartPreferences(setAllIndicatorOverlayWidths(preferences,2));
 expect(applied.indicatorOverlayLineWidth).toBe(2);
 for (const indicator of [applied.indicators[0],applied.savedIndicatorPresets![0].indicators[0]]) {
  expect(indicator.plots?.main.overlayWidth).toBeUndefined();
  expect(indicatorPlotStyle(indicator,'main',applied.indicatorOverlayLineWidth))
   .toMatchObject({width:2,color:'#123456',style:2});
 }
 expect(indicatorPlotStyle(applied.indicators[1],'main',applied.indicatorOverlayLineWidth).width).toBe(3);
 expect(indicatorPlotStyle(ema,'main',applied.indicatorOverlayLineWidth).width).toBe(4);
 expect(withoutOverlayWidthOverrides(ema)).toEqual(withoutOverlayWidthOverrides(applied.indicators[0]));
 expect(() => parseChartPreferences({...preferences,indicatorOverlayLineWidth:5})).toThrow('invalid_preferences');
 expect(() => parseChartPreferences({...preferences,indicators:[study('EMA',{plots:{main:{overlayWidth:0 as 1}}})]})).toThrow('invalid_preferences');
});
