const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
const jsx=(type,props)=>({type,props});
const exportsObject={};
const source=fs.readFileSync('app/(dashboard)/communities/student-journal-sharing.tsx','utf8');
vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText,{exports:exportsObject,require:id=>id==='react/jsx-runtime'?{jsx,jsxs:jsx}:id==='react'?{useState:x=>[x,()=>{}]}:new Proxy({},{get:(_,key)=>String(key)})});
function nodes(x){return !x||typeof x!=='object'?[]:Array.isArray(x)?x.flatMap(nodes):[x,...nodes(x.props?.children)];}
const snapshot={community:{slug:'qa'},viewer:{userId:'student'},relationships:['first','second'].map(relationshipId=>({relationshipId,studentUserId:'student',status:'active',accessStatus:'active',coachDisplayName:relationshipId,planName:'plan'})),journalGrants:[{grantId:'first-grant',relationshipId:'first',studentUserId:'student',status:'active',dataScope:'trades'}]};
for(const selectedRelationshipId of ['first','second']){
 const tree=nodes(exportsObject.StudentJournalSharing({snapshot,isReview:false,selectedRelationshipId}));
 assert.equal(tree.filter(n=>n.props?.children==='Revoke').length,selectedRelationshipId==='first'?1:0);
 assert.equal(tree.find(n=>n.props?.name==='relationshipId').props.value,selectedRelationshipId);
}
console.log('PASS: Journal grant controls follow selected coaching relationship');
