const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const ts=require('typescript');
const root=path.resolve(__dirname,'../..');
const jsx=(type,props,key)=>({type,props,key});
let state=[],cursor=0,saveError="";
function load(file,imports){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(root,file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText,{exports,require:imports});return exports;}
const offers=load('app/(dashboard)/communities/coaching-plan-offers.ts',id=>id.endsWith('/styles')?{darken:value=>value}:new Proxy({},{get:()=>({500:'#123456',700:'#123456'})}));
const builder=load('app/(dashboard)/communities/coaching-plan-builder.tsx',id=>{
 if(id==='react/jsx-runtime')return {jsx,jsxs:jsx};
 if(id==='react')return {useActionState:()=>[{error:saveError},()=>{},false],useMemo:fn=>fn(),useState:initial=>{const i=cursor++;if(!(i in state))state[i]=typeof initial==='function'?initial():initial;return [state[i],value=>{state[i]=typeof value==='function'?value(state[i]):value;}];}};
 if(id==='./coaching-plan-offers')return offers;
 return new Proxy({},{get:(_target,key)=>String(key)});
});
function nodes(tree){if(!tree||typeof tree!=='object')return [];if(Array.isArray(tree))return tree.flatMap(nodes);return [tree,...nodes(tree.props?.children)];}
const snapshot={community:{slug:'test'},audiences:[{discordRoleIds:['alerts-role']}],staffRoles:[{name:'Coach access',discordRoleIds:['coach-role']}],coachingRoleOptions:[{id:'student-role',name:'Coaching Students'}]};
const render=plan=>{cursor=0;return nodes(builder.CoachingPlanBuilder({snapshot,coachProfileId:'coach',plan}));};
let tree=render();
assert.equal(tree.find(n=>n.props?.name==='requiredDiscordRoleId').props.value,'','Never choose the first unrelated Discord role');
assert.equal(tree.find(n=>n.props?.value==='publish').props.disabled,true);
state=[];
tree=render({name:'Existing',items:[],requiredDiscordRoleId:'saved-role',studentCapacity:10});
const role=tree.find(n=>n.props?.name==='requiredDiscordRoleId');
assert.equal(role.props.value,'saved-role');
assert.ok(nodes(role).some(n=>n.props?.value==='saved-role'),'Preserve an existing role even if it is no longer listed in mappings');
assert.ok(nodes(role).some(n=>n.props?.children==='Coach access'),'Show the known role name');
assert.ok(nodes(role).some(n=>n.props?.children==='Coaching Students'),'Ordinary coach sees mapped Discord names');
assert.ok(!nodes(role).some(n=>n.props?.children==='saved-role'),'Never display raw IDs');
console.log('PASS: explicit role selection, empty-role publish blocked, existing role preserved, known role names');

for(const [field,value] of [['paymentInstructions','Keep my instructions'],['autoArchiveAfterDays','60']]){
 const input=tree.find(n=>n.props?.name===field);
 assert.equal(typeof input.props.onChange,'function');
 input.props.onChange({target:{value}});
 tree=render({name:'Existing',items:[],requiredDiscordRoleId:'saved-role',studentCapacity:10});
 assert.equal(tree.find(n=>n.props?.name===field).props.value,value,'Failed action resets must not discard optional settings');
}
console.log('PASS: optional plan settings stay controlled and retain edits');

saveError='Keep errors by the save controls';
tree=render({name:'Existing',items:[],requiredDiscordRoleId:'saved-role',studentCapacity:10});
assert(tree.some(n=>Array.isArray(n.props?.children)&&n.props.children.some(child=>child?.props?.role==='alert')&&n.props.children.some(child=>child?.props?.value==='save')),'Save errors must appear in the same control stack as Save changes');
console.log('PASS: plan failure feedback stays beside its save controls');
