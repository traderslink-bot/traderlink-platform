import {afterEach,describe,expect,it} from 'vitest';
import {workspaceChartHasVisibleArea} from '@/app/(dashboard)/screeners/workspace/workspace-chart-visibility';
function box(node:HTMLElement,left:number,top:number,width:number,height:number){node.getBoundingClientRect=()=>({left,top,width,height,right:left+width,bottom:top+height,x:left,y:top,toJSON(){return {};}});}
function card(){const root=document.createElement('div'),node=document.createElement('div');root.append(node);document.body.append(root);box(root,0,0,500,500);box(node,10,20,300,200);return {root,node};}
afterEach(()=>document.body.replaceChildren());
describe('current workspace chart visibility',()=>{
 it('allows a visible card independently of an old hidden observer snapshot',()=>{const {node}=card();expect(workspaceChartHasVisibleArea(node)).toBe(true);});
 it('waits for restored dimensions and recovers once the card has space',()=>{const {node}=card();box(node,10,20,300,0);expect(workspaceChartHasVisibleArea(node)).toBe(false);box(node,10,20,300,200);expect(workspaceChartHasVisibleArea(node)).toBe(true);});
 it('keeps genuinely offscreen cards paused',()=>{const {node}=card();box(node,10,window.innerHeight+10,300,200);expect(workspaceChartHasVisibleArea(node)).toBe(false);box(node,window.innerWidth+10,20,300,200);expect(workspaceChartHasVisibleArea(node)).toBe(false);});
 it('respects scroll-container clipping rather than just window overlap',()=>{const {root,node}=card();root.style.overflowX='hidden';root.style.overflowY='hidden';box(root,0,0,400,50);box(node,10,100,300,200);expect(workspaceChartHasVisibleArea(node)).toBe(false);box(node,10,40,300,200);expect(workspaceChartHasVisibleArea(node)).toBe(true);});
 it('does not start charts hidden by an ancestor',()=>{const {root,node}=card();root.style.visibility='hidden';expect(workspaceChartHasVisibleArea(node)).toBe(false);root.style.visibility='visible';root.style.display='none';expect(workspaceChartHasVisibleArea(node)).toBe(false);});
});
