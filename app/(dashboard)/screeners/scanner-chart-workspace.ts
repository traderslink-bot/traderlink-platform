import type { LiveScannerRow } from "@/src/modules/scanner/live/contracts";

export type ScannerChartTarget=Readonly<{symbol:string;exchange:"NASDAQ"|"NYSE"|"AMEX";showDetails?:boolean;addChart?:boolean;stock?:LiveScannerRow}>;
export type ScannerChartWorkspace=Readonly<{charts:readonly ScannerChartTarget[];selectedSymbol:string|null;limitReached:boolean}>;
export const EMPTY_CHART_WORKSPACE:ScannerChartWorkspace={charts:[],selectedSymbol:null,limitReached:false};
export type ScannerChartAction={type:"replace";chart:ScannerChartTarget}|{type:"open";chart:ScannerChartTarget}|{type:"select";symbol:string}|{type:"remove";symbol:string}|{type:"close"};
export function scannerChartWorkspace(state:ScannerChartWorkspace,action:ScannerChartAction):ScannerChartWorkspace {
  if(action.type==="replace")return {charts:[{...action.chart,showDetails:true}],selectedSymbol:action.chart.symbol,limitReached:false};
  if(action.type==="close")return EMPTY_CHART_WORKSPACE;
  if(action.type==="select")return state.charts.some(chart=>chart.symbol===action.symbol)?{...state,selectedSymbol:action.symbol}:state;
  if(action.type==="remove"){
    const index=state.charts.findIndex(chart=>chart.symbol===action.symbol);
    const charts=state.charts.filter(chart=>chart.symbol!==action.symbol);
    return {charts,selectedSymbol:action.symbol===state.selectedSymbol?charts[Math.min(index,charts.length-1)]?.symbol??null:state.selectedSymbol,limitReached:false};
  }
  if(state.charts.some(chart=>chart.symbol===action.chart.symbol))return {...state,selectedSymbol:action.chart.symbol,limitReached:false};
  if(state.charts[0]&&!state.charts[0].showDetails)return {charts:[action.chart],selectedSymbol:action.chart.symbol,limitReached:false};
  if(state.charts.length===4)return {...state,limitReached:true};
  return {charts:[...state.charts,{...action.chart,showDetails:state.charts.length?true:action.chart.showDetails}],selectedSymbol:action.chart.symbol,limitReached:false};
}
