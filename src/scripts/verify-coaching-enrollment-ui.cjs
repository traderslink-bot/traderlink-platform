const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
let view = 'requests';
const jsx = (type, props) => ({type, props});
const output = {};
const source = fs.readFileSync(path.resolve(__dirname,'../../app/(dashboard)/communities/coach-workspace-navigation.tsx'),'utf8');
vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText,{
 exports:output,
 require(id){
  if(id==='react')return {useState:()=>[view,()=>{}]};
  if(id==='react/jsx-runtime')return {jsx,jsxs:jsx};
  return new Proxy({},{get:(_target,key)=>String(key)});
 },
});
function nodes(value){if(Array.isArray(value))return value.flatMap(nodes);if(!value||typeof value!=='object')return [];return [value,...nodes(value.props?.children)];}
const relation=(id,coach,status)=>({relationshipId:id,coachUserId:coach,studentDisplayName:id,planName:'Plan',status,accessStatus:'active',archivedAtUtc:null});
const snapshot={community:{slug:'qa-coaching'},viewer:{userId:'coach'},relationships:[relation('own-request','coach','pending'),relation('foreign-request','other','pending'),relation('active-student','coach','active'),relation('ended-student','coach','ended')],coachingTasks:[],tradeReviews:[],journalGrants:[]};
let tree=nodes(output.StudentsPage({snapshot}));
const forms=tree.filter(node=>node.props?.component==='form');
assert.equal(forms.length,2);
for(const form of forms){assert.equal(form.props.action,'setCoachingRelationshipStatusAction');assert.equal(nodes(form).find(node=>node.props?.name==='relationshipId').props.value,'own-request');}
assert.deepEqual(forms.map(form=>nodes(form).find(node=>node.props?.name==='status').props.value),['active','declined']);
assert.equal(tree.some(node=>node.props?.children==='foreign-request'),false,'A coach cannot receive another coach request');
view='active';tree=nodes(output.StudentsPage({snapshot}));
assert.equal(tree.some(node=>node.props?.children==='active-student'),true);
assert.equal(tree.some(node=>node.props?.children==='own-request'),false);
assert.equal(tree.some(node=>node.props?.action==='setCoachingRelationshipStatusAction'),false);
view='ended';tree=nodes(output.StudentsPage({snapshot}));assert.equal(tree.some(node=>node.props?.children==='ended-student'),true);
view='requests';tree=nodes(output.StudentsPage({snapshot:{...snapshot,community:{slug:'review'}}}));
for(const form of tree.filter(node=>node.props?.component==='form')){assert.equal(form.props.action,undefined);assert.equal(nodes(form).find(node=>node.props?.type==='submit').props.disabled,true);}
console.log('PASS: own pending requests, accept/decline forms, foreign-request isolation, active/ended preservation and disabled preview');
