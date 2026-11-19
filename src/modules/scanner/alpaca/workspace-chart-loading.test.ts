import {act,createElement} from 'react';
import {createRoot} from 'react-dom/client';
import {expect,it,vi} from 'vitest';
import {ScannerCompactChart} from '@/app/(dashboard)/screeners/workspace/scanner-compact-chart';
import {ChartPreferencesContext} from '@/app/(dashboard)/charts/use-chart-preferences';
import {DEFAULT_CHART_PREFERENCES} from './chart-preferences';

it('shows an actionable error instead of an endless skeleton when initial preferences fail',async()=>{
 vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT',true);
 vi.stubGlobal('requestAnimationFrame',()=>1);vi.stubGlobal('cancelAnimationFrame',()=>{});
 vi.stubGlobal('ResizeObserver',class{observe(){}unobserve(){}disconnect(){}});
 vi.stubGlobal('IntersectionObserver',class{observe(){}unobserve(){}disconnect(){}});
 const node=document.createElement('div');document.body.append(node);const root=createRoot(node);
 const chart=createElement(ScannerCompactChart,{symbol:null,layout:null,onLayoutChange:vi.fn(),defaultTimeframe:'5m',slot:'slot-6'});
 const initial={preferences:DEFAULT_CHART_PREFERENCES,ready:false,message:'Chart preferences could not load. Reload the page to try again.',change:vi.fn()};
 try{
  await act(async()=>root.render(createElement(ChartPreferencesContext.Provider,{value:initial},chart)));
  const error=node.querySelector('[role="alert"]');expect(error).not.toBeNull();expect(error!.textContent).toContain('Chart settings could not load.');expect([...error!.querySelectorAll('button')].some(button=>button.textContent==='Reload page')).toBe(true);
  await act(async()=>root.render(createElement(ChartPreferencesContext.Provider,{value:{...initial,message:''}},chart)));expect(node.querySelector('[role="alert"]')).toBeNull();
 }finally{await act(async()=>root.unmount());node.remove();vi.unstubAllGlobals();}
});
