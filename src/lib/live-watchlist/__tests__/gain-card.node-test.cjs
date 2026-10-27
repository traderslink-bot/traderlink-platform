const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
const root=path.resolve(__dirname,'../../../..');
const source=fs.readFileSync(path.join(root,'src/lib/live-watchlist/gain-starting-point.ts'),'utf8');
const mod={exports:{}};
new Function('exports','require','module',ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(mod.exports,require,mod);
const {prepareGain,observeGain,changeGainStart,gainPublicationEvidence}=mod.exports;
const initial=()=>observeGain(prepareGain({symbol:'TEST',status:'active',firstPostedAt:1000,publication:{postedAt:1000,price:10},card:{unchanged:true}}),15,2000);
const edit=(s,highPrice,extra={})=>changeGainStart(s,{publicationAt:1000,revision:s.gainTracking.revision,price:10,at:1000,highPrice,highAt:2000,...extra},3000);
test('raised and lowered highs recalculate gains and survive serialized reload',()=>{
  for(const [high,pct] of [[20,100],[12,20]]){
    const s=JSON.parse(JSON.stringify(edit(initial(),high)));
    assert.equal(prepareGain(s).potentialGain.highPrice,high);
    assert.ok(Math.abs(s.potentialGain.potentialGainPct-pct)<1e-9);
    assert.equal(observeGain(s,11,4000).potentialGain.highPrice,high);
    assert.equal(observeGain(s,25,5000).potentialGain.highPrice,25);
  }
});
test('old delayed observations cannot restore a corrected false high',()=>{
  assert.equal(observeGain(edit(initial(),12),14,2500).potentialGain.highPrice,12);
});
test('baseline edits, reset, and listing identity remain independent',()=>{
  const s=edit(initial(),20);
  assert.equal(edit(s,undefined,{price:5}).potentialGain.potentialGainPct,300);
  assert.equal(edit(s,undefined,{at:2500}).potentialGain.highPrice,10);
  assert.equal(changeGainStart(s,{publicationAt:1000,revision:1,reset:true},4000).potentialGain.highPrice,15);
  assert.throws(()=>edit(s,12,{publicationAt:999}),/listing changed/);
  assert.throws(()=>edit(s,12,{revision:0}),/changed/);
});
test('invalid highs rejected; non-gain facts and recap evidence unchanged',()=>{
  const s=initial(),copy=JSON.stringify(s),next=edit(s,20);
  for(const high of [0,-1,NaN,Infinity,'20',9])assert.throws(()=>edit(s,high),/highest price/);
  assert.equal(JSON.stringify(s),copy);
  assert.deepEqual(next.publication,s.publication);assert.deepEqual(next.card,s.card);
  assert.equal(next.firstPostedAt,s.firstPostedAt);
  assert.deepEqual(gainPublicationEvidence(next),gainPublicationEvidence(s));
  assert.equal(next.potentialGain.highPriceAt,2000);
  for(const highAt of [0,999,4000,NaN])assert.throws(()=>edit(s,20,{highAt}),/highest-price time/);
});
test('requested labels and API field wiring present; mutation authorization retained',()=>{
  const read=p=>fs.readFileSync(path.join(root,p),'utf8');
  const ui=read('app/(dashboard)/admin/watchlist/watchlist-gain-starting-point.tsx');
  assert.match(ui,/Highest after added price/);assert.match(ui,/Edit Gain Card/);
  assert.match(ui,/highPrice:!reset&&highEdited/);
  assert.match(read('src/modules/watchlist/server/runtime/watchlist-gain-start-control.ts'),/textContent = 'Edit Gain Card'/);
  const api=read('app/api/admin/watchlist/gain-starting-point/route.ts');
  assert.match(api,/highPrice:body.highPrice/);assert.match(api,/requireJournalAdminMutationRequest\(request\)/);
});
