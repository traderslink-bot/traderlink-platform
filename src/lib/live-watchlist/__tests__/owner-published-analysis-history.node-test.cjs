const assert=require('node:assert/strict'),{test}=require('node:test');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
require.extensions['.ts']=(mod,file)=>mod._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
const {ownerPublishedAnalysisHistory}=require('../owner-published-analysis-history.ts');
const fixture=fs.readFileSync(path.join(__dirname,'traderslink-ai-read.test.ts'),'utf8').match(/function validBody\(\) \{[\s\S]*?\n\}/)[0];
const base=()=>JSON.parse(vm.runInNewContext(fixture+';validBody()'));
const symbol=base().symbol;
function publication(text='Original',overrides={}) {
 const read={...base(),currentRead:text,...overrides};
 return {website:{cards:{tradersLinkAiRead:{title:'TradersLink Analysis',body:JSON.stringify(read),updatedAt:1000,priceWhenPosted:read.currentPrice,source:'saved'},traderNotes:{body:'Original notes'}}}};
}
const event=(revision,body,cycleId='current')=>({cycleId,revision,at:100000+revision,actor:'owner',body});
const approve=(revision,pub=publication(),extra={})=>event(revision,{kind:'approve',draftRevision:revision-1,publication:pub,...extra});
const receipt=(revision,approvalRevision,status='acknowledged',channel='website')=>event(revision,{kind:'delivery',approvalRevision,status,channel});
const response=events=>({review:{symbol,cycleId:'current',events}});
test('only acknowledged published cards in the current activation appear',()=>{
 const events=[event(1,{kind:'edit',payload:base()}),approve(2),receipt(3,2),approve(4,publication('Unpublished draft')),receipt(5,4,'failed'),approve(6,publication('Update')),receipt(7,6),event(8,{kind:'approve',draftRevision:7,publication:publication('Old activation')},'old'),{...receipt(9,8),cycleId:'old'}];
 const value=ownerPublishedAnalysisHistory(response(events),symbol);
 assert.equal(value.versions.length,2);assert.equal(JSON.parse(value.versions[0].card.body).currentRead,'Original');assert.equal(JSON.parse(value.versions[1].card.body).currentRead,'Update');
 assert.equal(value.versions[0].historyRows.length,1);assert.equal(value.versions[1].historyRows.length,2);
 assert.equal(value.versions[0].historyRows[0].publishedAt,100003);
});
test('owner-edited published text and all price fields remain byte-identical and immutable',()=>{
 const pub=publication('Owner correction',{currentPrice:9.8765});
 const input=response([approve(2,pub),receipt(3,2)]),before=JSON.stringify(input);
 const saved=ownerPublishedAnalysisHistory(input,symbol).versions[0];
 assert.equal(saved.card.body,pub.website.cards.tradersLinkAiRead.body);assert.equal(saved.traderNotes,'Original notes');assert.equal(JSON.stringify(input),before);
});
test('listing-only, hidden analysis and Discord-only delivery are not historical reads',()=>{
 const hidden=publication();hidden.website.tradersLinkAiReadCardVisible=false;
 const value=ownerPublishedAnalysisHistory(response([approve(2,publication(),{draftRevision:0}),receipt(3,2),approve(4,hidden),receipt(5,4),approve(6),receipt(7,6,'acknowledged','discord')]),symbol);
 assert.equal(value.versions.length,0);
});
test('duplicate receipts and unchanged approval retries do not duplicate cards',()=>{
 const pub=publication();const value=ownerPublishedAnalysisHistory(response([approve(2,pub),receipt(3,2),receipt(4,2),approve(5,pub),receipt(6,5)]),symbol);
 assert.equal(value.versions.length,1);assert.equal(value.versions[0].revision,2);
});
test('published notes/visibility changes remain separately available',()=>{
 const first=publication(),second=publication();second.website.cards.traderNotes.body='New notes';second.website.tradersLinkAiReadDipBuyPlanVisible=false;
 const result=ownerPublishedAnalysisHistory(response([approve(2,first),receipt(3,2),approve(4,second),receipt(5,4)]),symbol);
 assert.equal(result.versions.length,2);assert.equal(result.versions[0].traderNotes,'Original notes');assert.equal(result.versions[1].traderNotes,'New notes');assert.equal(result.versions[1].dipBuyPlanVisible,false);
});
test('simple format snapshot remains simple with original target/pullback prices',()=>{
 const pub=publication('Simple',{version:3,pullbackPlans:{shallow:null,deep:null},failureRecovery:null,analysisFormat:'simple',simpleAnalysis:{setup:'Saved setup',pullbacks:[{low:1,high:1.1,explanation:'Dip',confirmation:'Wait',invalidation:null}],upside:[{low:3,high:4,explanation:'Target'}],invalidation:null}});
 const value=ownerPublishedAnalysisHistory(response([approve(2,pub),receipt(3,2)]),symbol);
 assert.equal(value.versions.length,1);assert.equal(JSON.parse(value.versions[0].card.body).simpleAnalysis.upside[0].high,4);
});
test('malformed/wrong-ticker snapshots cannot be substituted with a draft or current data',()=>{
 const malformed=publication();malformed.website.cards.tradersLinkAiRead.body='not json';
 const wrong=publication('Wrong',{symbol:'OTHER'});
 const value=ownerPublishedAnalysisHistory(response([approve(2,malformed),receipt(3,2),approve(4,wrong),receipt(5,4)]),symbol);
 assert.equal(value.versions.length,0);assert.equal(value.incomplete,true);
 assert.throws(()=>ownerPublishedAnalysisHistory(response([]),'OTHER'));
 assert.equal(ownerPublishedAnalysisHistory({review:null},symbol).versions.length,0);
});
test('private/replacement continuity is explicitly incomplete and never traversed',()=>{
 const input=response([event(1,{kind:'begin'})]);input.review.events[0].actor='runtime:private:old-cycle';
 assert.equal(ownerPublishedAnalysisHistory(input,symbol).incomplete,true);
});
test('viewer performs GET only, has no editing/delivery controls and uses the shared card',()=>{
 const root=path.resolve(__dirname,'../../../..');
 const source=fs.readFileSync(path.join(root,'app/(dashboard)/admin/watchlist/watchlist-analysis-history.tsx'),'utf8');
 assert.match(source,/method:"GET"/);assert.match(source,/historicalRows=\{version.historyRows\}/);
 assert.match(source,/module.TradersLinkAiReadCard/);assert.doesNotMatch(source,/method:"POST"|renderSectionEditor|\/approve|\/save|\/generate/);
 const lines=fs.readFileSync(path.join(root,'app/watchlist/analysis-history-lines.tsx'),'utf8');
 assert.match(lines,/if \(preview \|\| historicalRows !== undefined\) return;/);
});
function viewerHarness(payload,expectedCycleId='current') {
 const root=path.resolve(__dirname,'../../../..'),React=require('react');
 const source=fs.readFileSync(path.join(root,'app/(dashboard)/admin/watchlist/watchlist-analysis-history.tsx'),'utf8');
 const exports={},slots=[],effects=[],requests=[];let cursor=0,effectUsed=false,closed=false;
 const hooks={useState:initial=>{const index=cursor++;if(!(index in slots))slots[index]=initial;return [slots[index],value=>{slots[index]=typeof value==='function'?value(slots[index]):value;}];},useEffect:callback=>{if(!effectUsed){effects.push(callback);effectUsed=true;}}};
 vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,{exports,require:name=>name==='react'?hooks:name==='react/jsx-runtime'?require(name):name==='next/dynamic'?()=> 'ActualAnalysisCard':name.startsWith('@mui/')?name.split('/').at(-1):name.includes('owner-published-analysis-history')?require('../owner-published-analysis-history.ts'):name.includes('analysis-publication-history')?require('../analysis-publication-history.ts'):require(name),AbortController,setTimeout,clearTimeout,Error,fetch:async(url,options)=>{requests.push({url,options});return {ok:true,json:async()=>payload};}});
 const render=()=>{cursor=0;return exports.WatchlistAnalysisHistory({symbol,expectedCycleId,onClose:()=>closed=true});};
 const all=(node,type)=>!React.isValidElement(node)?[]:[...(node.type===type?[node]:[]),...React.Children.toArray(node.props.children).flatMap(child=>all(child,type))];
 return {render,all,requests,effects,slots,isClosed:()=>closed};
}
test('actual viewer loads GET once, selects frozen versions, and close aborts without posting',async()=>{
 const first=publication(),second=publication('Published update');
 const harness=viewerHarness(response([approve(2,first),receipt(3,2),approve(4,second),receipt(5,4)]));
 harness.render();const cleanup=harness.effects[0]();await new Promise(resolve=>setImmediate(resolve));
 assert.equal(harness.requests.length,1);assert.equal(harness.requests[0].options.method,'GET');assert.ok(!harness.requests[0].url.includes('cycleId='));
 let tree=harness.render(),card=harness.all(tree,'ActualAnalysisCard')[0];
 assert.equal(card.props.card.body,first.website.cards.tradersLinkAiRead.body);assert.equal(card.props.livePrice,null);assert.equal(card.props.renderSectionEditor,undefined);assert.equal(card.props.historicalRows.length,1);
 harness.all(tree,'TextField')[0].props.onChange({target:{value:'1'}});tree=harness.render();card=harness.all(tree,'ActualAnalysisCard')[0];
 assert.equal(card.props.card.body,second.website.cards.tradersLinkAiRead.body);assert.equal(card.props.historicalRows.length,2);
 harness.all(tree,'Dialog')[0].props.onClose();assert.equal(harness.isClosed(),true);cleanup();assert.equal(harness.requests[0].options.signal.aborted,true);assert.equal(harness.requests.length,1);
});
test('stale ticker-row activation cannot display a replacement activation',async()=>{
 const harness=viewerHarness(response([approve(2),receipt(3,2)]),'previous-activation');
 harness.render();const cleanup=harness.effects[0]();await new Promise(resolve=>setImmediate(resolve));
 const tree=harness.render();assert.equal(harness.all(tree,'ActualAnalysisCard').length,0);
 assert.match(harness.slots[2],/Close this view/);cleanup();
});
test('real Simple card renders the selected original timeline, notes and prices',()=>{
 const React=require('react'),{renderToStaticMarkup}=require('react-dom/server'),root=path.resolve(__dirname,'../../../..');
 const load=file=>{const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(root,'app/watchlist',file),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,{exports,require:name=>name==='react'||name==='react/jsx-runtime'?require(name):name.endsWith('.css')?{}:name==='./analysis-history-lines'?load('analysis-history-lines.tsx'):name==='./analysis-trader-notes'?load('analysis-trader-notes.tsx'):name.includes('analysis-publication-history')?require('../analysis-publication-history.ts'):require(name),Date});return exports;};
 const read={...base(),version:3,analysisFormat:'simple',simpleAnalysis:{setup:'Original saved setup',pullbacks:[],upside:[{low:3,high:4,explanation:'Original target'}],invalidation:null}};
 const rows=[{generatedAt:Date.UTC(2026,9,20,13,25),publishedAt:Date.UTC(2026,9,20,13,30),price:2.50}];
 const html=renderToStaticMarkup(React.createElement(load('simple-analysis-card.tsx').SimpleAnalysisCard,{read,traderNotes:'Original notes',historicalRows:rows}));
 assert.match(html,/Analysis posted: Oct 20, 9:30 AM ET/);assert.match(html,/\$2.50/);assert.match(html,/Original target/);assert.match(html,/Original notes/);assert.doesNotMatch(html,/Analysis preview:/);
});
