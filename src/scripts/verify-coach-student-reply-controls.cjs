const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const source = fs.readFileSync(path.resolve(__dirname, '../../app/(dashboard)/communities/[communitySlug]/workspace/students/[relationshipId]/page.tsx'), 'utf8');
const output = {};
const jsx = (type, props, key) => ({type, props, key});
const relationship = {relationshipId:'student',coachUserId:'coach',status:'active',accessStatus:'active'};
const states = ['draft','delivered','viewed','follow_up','completed','cancelled'];
const snapshot = {viewer:{userId:'coach'},relationships:[relationship],coachingTasks:[],coachingMessages:[],coachingRecords:[],coachingSessions:[],coachingAttachments:[],journalGrants:[],reviewReplies:[],plans:[],tradeReviews:states.map(deliveryState=>({relationshipId:'student',reviewId:deliveryState,deliveryState,status:'requested',deliveredAtUtc:deliveryState==='draft'?null:'2026-10-10T12:00:00Z'}))};
vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText,{
 exports:output,Intl,
 require(id){
  if(id==='react/jsx-runtime')return {jsx,jsxs:jsx};
  if(id.endsWith('/community-dashboard-loader'))return {loadCommunityDashboard:async()=>({snapshot})};
  return new Proxy({},{get:(_target,key)=>String(key)});
 },
});
function nodes(tree){if(!tree||typeof tree!=='object')return [];if(Array.isArray(tree))return tree.flatMap(nodes);return [tree,...nodes(tree.props?.children)];}
(async()=>{
 const render=async()=>nodes(await output.default({params:Promise.resolve({communitySlug:'test',relationshipId:'student'}),searchParams:Promise.resolve({})}));
 let tree=await render();
 const forms=tree.filter(n=>n.props?.action==='replyCommunityReviewAction');
 assert.deepEqual(forms.map(form=>nodes(form).find(n=>n.props?.name==='reviewId').props.value),['delivered','viewed','follow_up']);
 assert.ok(forms.every(form=>nodes(form).find(n=>n.props?.name==='body').props.required));
 assert.ok(tree.some(n=>n.props?.label==='Completed'));
 assert.ok(tree.some(n=>n.props?.label==='Viewed'));
 relationship.accessStatus='access_paused';
 tree=await render();
 assert.ok(tree.filter(n=>n.props?.children==='Reply').every(n=>n.props.disabled));
 console.log('PASS: replies only for delivered/viewed/follow-up work, required body, paused access disabled, readable labels');
})().catch(error=>{console.error(error);process.exitCode=1;});
