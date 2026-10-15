const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
let ready=false,editingPlan=null;const output={},jsx=(type,props)=>({type,props});
vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname,'../../app/(dashboard)/communities/coach-setup-page.tsx'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText,{exports:output,document:{getElementById:()=>null},require(id){if(id==='react')return {useState:initial=>[editingPlan??initial,value=>{editingPlan=value;}],useSyncExternalStore:(_subscribe,client,server)=>ready?client():server()};if(id==='react/jsx-runtime')return {jsx,jsxs:jsx};if(id.endsWith('/coaching-plan-presentation'))return {coachingPlanPriceLabel:()=> 'USD 0.00'};return new Proxy({},{get:(_target,key)=>String(key)});}});
function nodes(v){return Array.isArray(v)?v.flatMap(nodes):v&&typeof v==='object'?[v,...nodes(v.props?.children)]:[];}
const snapshot={viewer:{userId:'coach'},community:{slug:'qa'},coaches:[{userId:'coach',coachProfileId:'profile'}],plans:[{planId:'plan',coachProfileId:'profile',name:'Plan',status:'active',billingCadence:'weekly',items:[],studentCapacity:1}],relationships:[],staffRoles:[]};
const edit=(isReview=false)=>nodes(output.CoachSetupPage({snapshot,isReview})).find(n=>n.props?.children==='Edit');
assert.equal(edit().props.disabled,true,'Edit cannot lose an early click before hydration');ready=true;assert.equal(edit().props.disabled,false,'Edit becomes available once handlers are ready');assert.equal(edit(true).props.disabled,true,'Preview stays read-only');console.log('PASS: setup Edit disabled during hydration, enabled when ready, disabled in preview');

const submitButtons=(isReview=false)=>nodes(output.CoachSetupPage({snapshot,isReview})).filter(n=>n.props?.type==='submit');
ready=false;assert(submitButtons().length>=3);assert(submitButtons().every(n=>n.props.disabled),'Profile and status submissions wait for hydration');
ready=true;assert(submitButtons().every(n=>!n.props.disabled),'Real submissions become available when ready');assert(submitButtons(true).every(n=>n.props.disabled),'Preview submissions stay blocked');
console.log('PASS: profile and plan status submissions cannot lose early clicks');

ready=true;const original=snapshot.plans[0];original.revision=1;edit().props.onClick();
const refreshed={...snapshot,plans:[{...original,name:'Changed in another window',revision:2}]};
const builder=()=>nodes(output.CoachSetupPage({snapshot:refreshed})).find(n=>n.type==='CoachingPlanBuilder');
assert.equal(builder().props.plan,original,'Background page refresh keeps the original editing snapshot and revision');
assert.equal(builder().props.plan.revision,1,'Stale drafts must not silently receive the newer revision');
builder().props.onCancel();assert.equal(builder().props.plan,undefined,'Cancel explicitly clears the editing snapshot');
nodes(output.CoachSetupPage({snapshot:refreshed})).find(n=>n.props?.children==='Edit').props.onClick();
assert.equal(builder().props.plan.revision,2,'An explicit Edit opens the current version');
console.log('PASS: background refresh preserves the editing revision; Cancel and explicit Edit load the current plan');
