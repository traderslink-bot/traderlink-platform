// Render actual route components with synthetic data and inert surrounding controls.
// This verifies route counts/disabled state; it is not browser, styling or auth proof.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const ts=require('typescript'),React=require('react'),{renderToStaticMarkup}=require('react-dom/server'),{JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'../..');
let snapshot;
const cache=new Map();
const inertNames=['CoachReviewScopeFields','CoachingAnalysisDrawer','CoachReviewFocusEditor','CoachWorkspaceNavigation','CoachReviewEditor','CoachTradeReviewWorkspacePersistent','CoachReviewFollowUp'];
function element(tag){return ({children,label,disabled,href,type,name,value,role})=>React.createElement(tag,{disabled,href,type,name,value,role},tag==='input'?undefined:children??label);}
function load(file){
 if(cache.has(file))return cache.get(file);
 const output={};cache.set(file,output);
 const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
 vm.runInNewContext(code,{exports:output,require(id){
  if(id==='react/jsx-runtime')return require(id);
  if(id.startsWith('@mui/material/'))return {default:element(id.endsWith('/Button')?'button':id.endsWith('/TextField')?'input':'div'),__esModule:true};
  if(id==='next/navigation')return {notFound(){throw Error('Unexpected missing review');}};
  if(id.endsWith('/community-dashboard-loader'))return {loadCommunityDashboard:async()=>({snapshot})};
  if(id.endsWith('/open-readonly-platform-database'))return {withReadonlyPlatformDatabase(){throw Error('Unshared Journal must not be read');}};
  if(id.endsWith('/traderlink-community-coach-journal-read-service'))return {};
  if(id.endsWith('/community-actions'))return new Proxy({},{get:()=>async()=>{}});
  if(id.endsWith('/community-typography'))return {CommunityTypography:element('p')};
  if(id==='@/app/dashboard-ui')return {DashboardPage:element('main'),DashboardPanel:({title,children})=>React.createElement('section',null,React.createElement('h2',null,title),children)};
  if(inertNames.some(name=>id.endsWith('/'+name.replace(/[A-Z]/g,(c,i)=>(i?'-':'')+c.toLowerCase()))))return Object.fromEntries(inertNames.map(name=>[name,()=>null]));
  const target=id.startsWith('@/')?path.join(root,id.slice(2)):path.resolve(path.dirname(file),id);
  for(const suffix of ['.ts','.tsx'])if(fs.existsSync(target+suffix))return load(target+suffix);
  throw Error('Unexpected route dependency '+id);
 }},{filename:file});
 return output;
}
(async()=>{
 const fixture=load(path.join(root,'src/modules/communities/server/traderlink-community-review-fixture.ts')).createTraderLinkCommunityReviewFixture('coach');
 const review=fixture.tradeReviews[0],relationship=fixture.relationships[0];
 const route=path.join(root,'app/(dashboard)/communities/[communitySlug]/workspace/students/[relationshipId]/reviews/[reviewId]');
 const Workspace=load(path.join(route,'page.tsx')).default,Final=load(path.join(route,'final/page.tsx')).default;
 async function render(required,deliveryState='draft',states=[]){
  snapshot={...fixture,journalGrants:[],reviewTrades:states.map((workflowState,index)=>({...fixture.reviewTrades[index%fixture.reviewTrades.length],reviewId:review.reviewId,workflowState})),reviewActions:[],tradeReviews:[{...review,acceptanceState:'accepted',agreedTradeCount:required,coachFeedback:'Synthetic summary',deliveryState}]};
  const params=Promise.resolve({communitySlug:'test-community',relationshipId:relationship.relationshipId,reviewId:review.reviewId});
  const workspace=new JSDOM(renderToStaticMarkup(await Workspace({params}))).window.document;
  const final=new JSDOM(renderToStaticMarkup(await Final({params}))).window.document;
  return {workspace,final};
 }
 const missing=await render(1);
 assert.ok(missing.workspace.body.textContent.includes('Trade reviews saved: 0 of 1'));
 assert.ok(missing.workspace.body.textContent.includes('Final review: Not ready'));
 assert.ok(missing.final.body.textContent.includes('0 / 1'));
 for(const doc of [missing.workspace,missing.final])assert.ok(doc.body.textContent.includes('Only the student can grant Journal access'));
 const button=(doc,label)=>[...doc.querySelectorAll('button')].find(item=>item.textContent.startsWith(label));
 assert.equal(button(missing.final,'Send review').disabled,true);
 const partial=await render(2,'draft',['saved','queued']);
 assert.ok(partial.workspace.body.textContent.includes('Trade reviews saved: 1 of 2'));
 assert.ok(partial.workspace.body.textContent.includes('Final review: Not ready'));
 assert.ok(partial.final.body.textContent.includes('1 / 2'));
 assert.equal(button(partial.final,'Send review').disabled,true);
 const fulfilled=await render(1,'draft',['saved']);
 assert.ok(fulfilled.workspace.body.textContent.includes('Trade reviews saved: 1 of 1'));
 assert.ok(fulfilled.workspace.body.textContent.includes('Final review: Ready'));
 assert.ok(fulfilled.final.body.textContent.includes('1 / 1'));
 assert.equal(button(fulfilled.final,'Send review').disabled,false);
 const removed=await render(1,'draft',['removed']);
 assert.ok(removed.workspace.body.textContent.includes('Final review: Not ready'));
 assert.ok(removed.final.body.textContent.includes('0 / 1'));
 assert.equal(button(removed.final,'Send review').disabled,true);
 assert.equal(button(missing.final,'Return to workspace').getAttribute('href'),`/communities/test-community/workspace/students/${relationship.relationshipId}/reviews/${review.reviewId}`);
 const summary=await render(null);
 assert.ok(summary.workspace.body.textContent.includes('Final review: Ready'));
 assert.equal(button(summary.final,'Send review').disabled,false);
 const invalidDelivered=await render(1,'delivered');
 assert.equal(button(invalidDelivered.final,'Complete').disabled,true);
 const summaryDelivered=await render(null,'delivered');
 assert.equal(button(summaryDelivered.final,'Complete').disabled,false);
 console.log('PASS: actual workspace/final routes agree for zero, partial 1/2, fulfilled 1/1, removed required feedback, summary-only controls and Return link target (not browser navigation)');
})().catch(error=>{console.error(error);process.exitCode=1;});
