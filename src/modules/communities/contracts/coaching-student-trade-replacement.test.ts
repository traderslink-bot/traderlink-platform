import React,{act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {afterEach,beforeEach,describe,it,expect,vi} from 'vitest';
import {ThemeProvider,CssBaseline} from '@mui/material';
import {writeFileSync} from 'node:fs';
import {createTraderMaterialTheme} from '../../../../app/mui-theme';
import type {StudentTradeReplacementState} from './coaching-student-trade-replacement';
const api=vi.hoisted(()=>({load:vi.fn(),replace:vi.fn(),refresh:vi.fn()}));
vi.mock('next/navigation',()=>({useRouter:()=>({refresh:api.refresh})}));
vi.mock('@/app/(dashboard)/communities/community-actions',()=>({loadCommunityStudentTradeReplacementsAction:api.load,replaceCommunityStudentTradeAction:api.replace}));
import {CoachingStudentTradeReplacement} from '../../../../app/coaching-student-trade-replacement';
const state:StudentTradeReplacementState={kind:'trade',selected:[{roundTripId:'a',label:'ABC · 2026-11-02 · long',tradingDate:'2026-11-02',canReplace:true},{roundTripId:'b',label:'DEF · 2026-11-02 · short',tradingDate:'2026-11-02',canReplace:false}],choices:[{roundTripId:'c',label:'GHI · 2026-11-03 · long',tradingDate:'2026-11-03'}]};
let root:Root,host:HTMLDivElement;
beforeEach(()=>{vi.clearAllMocks();(globalThis as typeof globalThis&{IS_REACT_ACT_ENVIRONMENT:boolean}).IS_REACT_ACT_ENVIRONMENT=true;host=document.createElement('div');document.body.append(host);root=createRoot(host);api.load.mockResolvedValue(state);api.replace.mockResolvedValue(undefined);});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();});
const button=(name:string)=>[...host.querySelectorAll('button')].find(node=>node.textContent===name)!;
async function choose(index:number,value:string){await act(async()=>host.querySelectorAll('[role="combobox"]')[index].dispatchEvent(new MouseEvent('mousedown',{bubbles:true,button:0})));await act(async()=>(document.querySelector(`[role="option"][data-value="${value}"]`) as HTMLElement).click());}
async function render(mode:'light'|'dark'='light',disabled=false){await act(async()=>root.render(React.createElement(ThemeProvider,{theme:createTraderMaterialTheme(mode)},React.createElement(CssBaseline),React.createElement(CoachingStudentTradeReplacement,{reviewId:'review',communitySlug:'community',relationshipId:'relationship',disabled}))));}
describe('student replacement controls',()=>{
 it.each(['light','dark'] as const)('shows per-trade locks and completes a one-for-one replacement in %s',async mode=>{
  await render(mode);await act(async()=>button('Choose a trade to replace').click());await choose(0,'a');
  const locked=document.querySelector('[role="option"][data-value="b"]');if(locked)expect(locked.getAttribute('aria-disabled')).toBe('true');
  await choose(1,'c');expect(button('Replace trade').disabled).toBe(false);
  if(process.env.COACHING_REPLACEMENT_PREVIEW==='1'){
   const css=[...document.styleSheets].flatMap(sheet=>{try{return [...sheet.cssRules].map(rule=>rule.cssText);}catch{return [];}}).join('\n');
   writeFileSync(`/tmp/coaching-student-replacement-${mode}.html`,`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style></head><body style="margin:0;padding:16px"><div style="max-width:760px;margin:auto">${host.innerHTML}</div></body></html>`);
  }
  api.load.mockResolvedValue({...state,selected:[{...state.choices[0],canReplace:true},state.selected[1]],choices:[state.selected[0]]});
  await act(async()=>button('Replace trade').click());
  expect(api.replace).toHaveBeenCalledOnce();const form=api.replace.mock.calls[0][0] as FormData;expect(form.get('removeRoundTripId')).toBe('a');expect(form.get('replacementRoundTripId')).toBe('c');expect(host.textContent).toContain('deadline and review allowance have not changed');expect(api.refresh).toHaveBeenCalledOnce();
 });
 it('keeps the selection on a coach-save conflict and does not submit while disabled',async()=>{
  await render('light',true);expect(button('Choose a trade to replace').disabled).toBe(true);expect(api.load).not.toHaveBeenCalled();
  await render();await act(async()=>button('Choose a trade to replace').click());await choose(0,'a');await choose(1,'c');api.replace.mockRejectedValue(new Error('Your coach has saved work on this trade.'));
  await act(async()=>button('Replace trade').click());expect(host.textContent).toContain('coach has saved work');expect(api.refresh).not.toHaveBeenCalled();expect(host.querySelectorAll('input')[0].value).toBe('a');
 });
});
