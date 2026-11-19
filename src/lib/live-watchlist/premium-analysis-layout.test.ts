import { describe,it,expect,vi } from 'vitest';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {buildPremiumAnalysisPreview,concealAnalysisNumbers,HIDDEN_ANALYSIS_PRICE} from './premium-analysis-preview';
import {PremiumAnalysisCard} from '@/app/watchlist/premium-analysis-card';
import {SimpleAnalysisCard} from '@/app/watchlist/simple-analysis-card';
vi.mock('@/app/watchlist/analysis-history-lines',()=>({AnalysisHistoryLines:()=>null}));
const fixture=readFileSync('src/lib/live-watchlist/__tests__/traderslink-ai-read.test.ts','utf8').match(/function validBody\(\) \{[\s\S]*?\n\}/)![0];
function read(){return {...JSON.parse(vm.runInNewContext(fixture+';validBody()')),version:3,analysisFormat:'simple',generatedAt:Date.parse('2026-11-19T00:17:00Z'),simpleAnalysis:{setup:'Nov. 18 at 6:58 p.m. price $3.85 with 30% upside.',pullbacks:[{low:3,high:3.17,explanation:'Lower $3.17',confirmation:'Hold $3',invalidation:null},{low:3.66,high:3.72,explanation:'Upper $3.72',confirmation:'Hold $3.66',invalidation:null}],breakout:{price:4.08,explanation:'Above $4.08',confirmation:'Hold $4.08'},upside:[{low:3.94,high:3.94,explanation:'Local $3.94'},{low:4.08,high:4.18,explanation:'Range $4.08–$4.18'},{low:4.56,high:4.56,explanation:'Daily $4.56'},{low:5.062,high:5.062,explanation:'More than 30% above'}],invalidation:null},catalystRealityCheck:{status:'conditional',summary:'Nov. 13 merger at $2.14 with 1:1 conversion.',sourceUrls:['https://example.test/news'],dayTradeRelevance:''},riskSummary:['$1.00 financing on Nov. 13.']};}
describe('Premium preview matches original composition',()=>{
 it('uses one target heading, original section order, bottom sidebar, visible catalyst/risk and dates',()=>{
  const value=read(),before=JSON.stringify(value),preview=buildPremiumAnalysisPreview(value);
  const html=renderToStaticMarkup(createElement(PremiumAnalysisCard,{preview,symbol:value.symbol}));
  const free=document.createElement('div');free.innerHTML=html;
  expect([...free.querySelectorAll('h3')].map(n=>n.textContent)).toEqual(['Pullback 1','Pullback 2','Breakout','Potential Targets (Volume Dependent)','Catalyst / recent news','Risk notes']);
  expect(free.querySelectorAll('.watchlist-ai-read-targets li')).toHaveLength(4);
  expect(html).toContain('Nov. 18 at 6:58 p.m.');expect(html).toContain('30%');
  expect(html).toContain(value.catalystRealityCheck.summary);expect(html).toContain(value.riskSummary[0]);
  for(const price of ['3.66','3.72','3.94','4.08','4.18','4.56','5.062','3.85'])expect(html).not.toContain(price);
  expect(JSON.stringify(preview.simpleRead)).not.toContain('5.062');expect(JSON.stringify(value)).toBe(before);
  const original=document.createElement('div');original.innerHTML=renderToStaticMarkup(createElement(SimpleAnalysisCard,{read:value}));
  expect([...original.querySelectorAll('h3')].map(n=>n.textContent)).toEqual([...free.querySelectorAll('h3')].map(n=>n.textContent));
  expect(preview.simpleRead!.simpleAnalysis!.pullbacks[0].explanation).toBe('Upper '+HIDDEN_ANALYSIS_PRICE);
 });
 it('preserves hidden sections and rows and keeps detailed targets grouped',()=>{
  const value=read();value.ownerHiddenSections=['breakoutContinuation'];value.simpleAnalysis.pullbacks[0].hidden=true;
  const html=renderToStaticMarkup(createElement(PremiumAnalysisCard,{preview:buildPremiumAnalysisPreview(value),symbol:value.symbol}));
  expect(html).not.toContain('<h3>Breakout</h3>');expect(html).not.toContain('Lower');
  const detailed={...value,pullbackPlans:{shallow:null,deep:null},analysisFormat:'detailed',targets:[{price:3.94,condition:'At $3.94'},{price:4.56,condition:'Next $4.56'}]};
  expect(buildPremiumAnalysisPreview(detailed).sections.filter(s=>s.title==='Potential Targets (Volume Dependent)')).toHaveLength(1);
 });
 it('conceals prices while preserving dates, candle lengths, percentages and times',()=>{
  const input='Nov 18, 2026 at 6:58 PM; 2026-11-18; 5min; 30%; above 4; $3.94 to 4.18.';
  const safe=concealAnalysisNumbers(input);for(const text of ['Nov 18, 2026','6:58 PM','2026-11-18','5min','30%'])expect(safe).toContain(text);
  expect(safe).not.toContain('3.94');expect(safe).not.toContain('4.18');expect(safe).toContain('above '+HIDDEN_ANALYSIS_PRICE);
 });
});
