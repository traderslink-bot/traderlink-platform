const assert=require('node:assert/strict'),vm=require('node:vm');
const ts=require('C:/Users/jerac/Documents/TraderLink/traderlink-platform/node_modules/typescript');
const {prepare}=require('./package-watchlist-publication-origin.cjs');
const platform=prepare('platform'),runtime=prepare('runtime');
function compile(s,f){const result=ts.transpileModule(s,{fileName:f,reportDiagnostics:true,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}});assert.equal(result.diagnostics.length,0,f);return result.outputText;}
for(const[f,s]of [...platform,...runtime])if(/\.tsx?$/.test(f))compile(s,f);
const m={exports:{}};let now=1791300000000;
class Clock extends Date { static now(){return now;} }
vm.runInNewContext(compile(platform.get('src/lib/live-watchlist/live-watchlist-store.ts'),'store.ts'),{exports:m.exports,module:m,Date:Clock,process,console,require:()=>({isTopWatchesGroup:g=>g?.startsWith('top-watches:')})});
const apply=m.exports.applyPatch;assert.equal(typeof apply,'function');
const card={title:'Prepared earlier',body:'analysis',updatedAt:now-86400000,priceWhenPosted:4,source:'test'};
const patch={symbol:'TEST',status:'live',updatedAt:now,firstPostedAt:now-5000,publicationPrice:6,cards:{snapshot:card}};
let state=apply(null,patch);
assert.equal(state.firstPostedAt,now);assert.equal(state.publication.price,6);assert.equal(state.cards.snapshot.priceWhenPosted,4);
const origin=state.firstPostedAt;now+=600000;
for(const change of [{...patch,publicationPrice:9,firstPostedAt:now},{symbol:'TEST',updatedAt:now,cards:{},watchlistGroup:'overnight'},{symbol:'TEST',updatedAt:now,cards:{snapshot:{...card,updatedAt:now,priceWhenPosted:10}}}]){
  state=apply(state,change);assert.equal(state.firstPostedAt,origin);assert.equal(state.publication.price,6);
}
state=apply({...state,status:'deactivated'}, {...patch,firstPostedAt:now,publicationPrice:11});assert.equal(state.firstPostedAt,now);assert.equal(state.publication.price,11);
const kept=apply({...state,status:'deactivated'}, {...patch,preserveExistingOnReactivation:true,publicationPrice:50});assert.equal(kept.publication.price,11);
const legacy=apply({ ...state,publication:undefined }, {...patch,publicationPrice:50});assert.equal(legacy.firstPostedAt,state.firstPostedAt);assert.equal(legacy.publication,undefined);
for(const price of [null,0,-1,NaN,Infinity])assert.equal(apply(null,{...patch,publicationPrice:price}).publication.price,null);
const manager=runtime.get('src/lib/monitoring/manual-watchlist-runtime-manager.ts');
assert.equal((manager.match(/publicationPrice: this\.publicationPrice\(symbol\)/g)||[]).length,2);
assert.match(manager,/snapshot.publicationPrice = this.publicationPrice\(symbol\)/);
assert.doesNotMatch(manager,/firstPostedAt: this.watchlistStore.getEntry\(symbol\)\?\.activatedAt/);
const start=manager.indexOf('  private publicationPrice('),end=manager.indexOf('  private buildTraderNotesCard(',start),r={exports:{}};
vm.runInNewContext(compile('export class Test {'+manager.slice(start,end)+'}','test.ts'),{module:r,exports:r.exports});
const obj=new r.exports.Test();for(const value of [6,0,NaN,undefined]){obj.watchlistStore={getEntry:()=>({lastPrice:value})};assert.equal(obj.publicationPrice('TEST'),value===6?6:null);}
assert.match(platform.get('app/watchlist/live-watchlist-client.tsx'),/formatPrice\(symbol.publication.price\)/);
assert.match(platform.get('src/lib/live-watchlist/live-watchlist-store.ts'),/publication: existing\?\.publication/);
console.log('PASS: syntax; real store first-publication time and price; old analysis unchanged; retries, moves and refreshes immutable; removal/re-add resets; preserved reactivation retains; legacy not fabricated; invalid price omitted; all three publication paths; latest available Runtime quote. No hosted calls.');
