import { reconcileChartTickers, selectedChart, singleChart } from "../alpaca/chart-multiview";
import {expect,it} from 'vitest';
import {EMPTY_CHART_WORKSPACE,replaceScannerChartPanel,scannerChartWorkspace,type ScannerChartWorkspace} from '@/app/(dashboard)/screeners/scanner-chart-workspace';
const open=(state:ScannerChartWorkspace,symbol:string)=>scannerChartWorkspace(state,{type:'open',chart:{symbol,exchange:'NASDAQ',showDetails:true}});
it('selects duplicates and keeps existing charts unchanged when the fourth slot is filled',()=>{
 let state=EMPTY_CHART_WORKSPACE;
 for(const symbol of ['A','B','C','D'])state=open(state,symbol);
 const charts=state.charts;state=open(state,'B');expect(state.charts).toBe(charts);expect(state.selectedSymbol).toBe('B');
 state=open(state,'E');expect(state.charts).toBe(charts);expect(state.limitReached).toBe(true);expect(state.selectedSymbol).toBe('B');
 state=scannerChartWorkspace(state,{type:'remove',symbol:'B'});expect(state.selectedSymbol).toBe('C');expect(state.limitReached).toBe(false);
 state=open(state,'E');expect(state.charts.map(c=>c.symbol)).toEqual(['A','C','D','E']);
 expect(scannerChartWorkspace(state,{type:'close'})).toEqual(EMPTY_CHART_WORKSPACE);
});
it('opening only a ticker replaces a full workspace and clears its limit warning',()=>{
 let state=EMPTY_CHART_WORKSPACE;
 for(const symbol of ['A','B','C','D','E'])state=open(state,symbol);
 expect(state.limitReached).toBe(true);
 state=scannerChartWorkspace(state,{type:'replace',chart:{symbol:'B',exchange:'NASDAQ'}});
 expect(state.charts.map(chart=>chart.symbol)).toEqual(['B']);expect(state.selectedSymbol).toBe('B');expect(state.charts[0].showDetails).toBe(true);expect(state.limitReached).toBe(false);
 state=open(state,'C');expect(state.charts.map(chart=>chart.symbol)).toEqual(['B','C']);
});

it("replaces only the selected slot and opens the new symbol at the default timeframe", () => {
  const layout = reconcileChartTickers(singleChart("POAS", "1m"), ["POAS", "SMX", "OMH", "NXXT"], "5m");
  const slot = layout.groups[1].panels[0];
  expect(replaceScannerChartPanel(layout, "missing", "QQQ", "15m")).toBe(layout);
  expect(replaceScannerChartPanel(layout, slot.id, "POAS", "15m")).toBe(layout);
  const next = replaceScannerChartPanel(layout, slot.id, "QQQ", "15m");
  expect(next.groups.flatMap(group => group.panels.map(panel => [group.symbol, panel.timeframe])))
    .toEqual([["POAS", "1m"], ["OMH", "5m"], ["NXXT", "5m"], ["QQQ", "15m"]]);
  expect(selectedChart(next)?.group.symbol).toBe("QQQ");
});
