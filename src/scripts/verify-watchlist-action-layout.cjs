const assert=require('node:assert/strict'),vm=require('node:vm');
const ts=require('C:/Users/jerac/Documents/TraderLink/traderlink-platform/node_modules/typescript');
const{prepare}=require('./package-watchlist-action-layout.cjs');const{changes}=prepare();
for(const[file,text]of changes){
 assert.equal(ts.transpileModule(text,{fileName:file,reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2022}}).diagnostics.length,0,file);
 if(file.endsWith('row-review.ts'))for(const match of text.matchAll(/<script>([\s\S]*?)<\/script>/g))new vm.Script(match[1]);
}
const page=changes.get('src/runtime/manual-watchlist-page.ts');
const row=changes.get('src/runtime/manual-watchlist-row-review.ts');
const grouping=row.slice(row.indexOf('  const expandedActions = new Set();'),row.indexOf('  function attach(entry, actions, more = actions)'));
class Element{
 constructor(tag){this.tag=tag;this.children=[];this.listeners={};this.attributes={};this.isConnected=true;this.classList={add:()=>{}};}
 append(...children){this.children.push(...children);}
 setAttribute(key,value){this.attributes[key]=value;}
 addEventListener(name,callback){this.listeners[name]=callback;}
}
const context={document:{createElement:tag=>new Element(tag)}};
vm.createContext(context);vm.runInContext(grouping+'\nglobalThis.makeGroups=groups;',context);
const root=new Element('div'),groups=context.makeGroups('TGE',root);
assert.equal(root.children.length,4);assert.equal(root.children[0],groups.review);assert.equal(root.children[1],groups.move);assert.equal(root.children[3],groups.remove);
const details=root.children[2];assert.equal(details.children[1],groups.more);assert.equal(details.open,false);
details.open=true;details.listeners.toggle();
const next=new Element('div');context.makeGroups('TGE',next);assert.equal(next.children[2].open,true,'Polling preserves More actions expansion');
const other=new Element('div');context.makeGroups('GOW',other);assert.equal(other.children[2].open,false);
for(const control of ['copyButton','repostButton','refreshButton','aiRefreshButton','aiVisibilityButton','indicatorVisibilityButton','dipBuyPlanVisibilityButton','retryButton','moveSelect','moveButton','removeFromListButton','deactivateButton']){
 assert.equal(page.split(`appendChild(${control})`).length,2,control+' stays attached exactly once');
}
console.log('PASS: grouped runtime controls retained exactly once; updated TS and row-review JavaScript syntax. Visual/mobile acceptance not yet performed.');
