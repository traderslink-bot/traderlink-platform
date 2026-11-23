// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it, vi } from 'vitest';
import { ChartIndicatorEditor } from '@/app/(dashboard)/charts/chart-indicator-editor';

it('keeps the account-wide overlay setting separate and confirms before saving', async () => {
 const host=document.createElement('div');
 document.body.append(host);
 const root=createRoot(host);
 const onOverlayLineWidthChange=vi.fn();
 vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT',true);
 try {
  await act(async()=>root.render(createElement(ChartIndicatorEditor,{
   ticker:'TEST',
   indicators:[{id:'ema',type:'EMA',period:9,color:'#ff9900',width:3}],
   onChange:vi.fn(),savedPresets:[],onPresetsChange:vi.fn(),
   overlayLineWidth:1,onOverlayLineWidthChange,
   defaultPriceScaleLabels:false,display:{},
   onDisplayChange:vi.fn(),onAccountDisplayChange:vi.fn(),
  })));
  const scope=host.querySelector('[role="radiogroup"][aria-label="Apply indicator changes to"]')!;
  expect([...scope.querySelectorAll('label')].map(label=>label.textContent)).toEqual(['TEST chart','All charts']);
  expect(scope.querySelector<HTMLInputElement>('input[value="current"]')?.checked).toBe(true);
  const field=[...host.querySelectorAll('[role="combobox"]')].find(element=>
   element.getAttribute('aria-labelledby')?.split(' ').some(id=>document.getElementById(id)?.textContent==='Line width over candles'))!;
  expect(field.textContent).toBe('1 px');
  const button = (label:string) => [...document.querySelectorAll('button')].find(element=>element.textContent===label)!;
  const chooseWidth=async()=>{
   await act(async()=>field.dispatchEvent(new MouseEvent('mousedown',{bubbles:true,button:0})));
   const option=[...document.querySelectorAll<HTMLElement>('[role="option"]')].find(element=>element.textContent==='3 px');
   await act(async()=>option!.click());
   await act(async()=>button('Apply to all lines').click());
  };
  await chooseWidth();
  expect(document.querySelector('[role="dialog"]')?.textContent).toContain('This replaces individual line widths on all your charts and in your saved presets.');
  expect(onOverlayLineWidthChange).not.toHaveBeenCalled();
  await act(async()=>button('Cancel').click());
  expect(onOverlayLineWidthChange).not.toHaveBeenCalled();
  expect(field.textContent).toBe('1 px');
  await chooseWidth();
  await act(async()=>button('Apply width').click());
  expect(onOverlayLineWidthChange).toHaveBeenCalledExactlyOnceWith(3);
 } finally {
  await act(async()=>root.unmount());
  host.remove();
  vi.unstubAllGlobals();
 }
});
