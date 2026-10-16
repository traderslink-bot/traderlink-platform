const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const source = fs.readFileSync(path.resolve(__dirname, '../../app/(dashboard)/communities/student-coaching-review.tsx'), 'utf8');
const output = {};
const jsx = (type, props, key) => ({type, props, key});
vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText,{
 exports:output,Date,
 require(id){if(id==='react/jsx-runtime')return {jsx,jsxs:jsx};return new Proxy({},{get:(_target,key)=>String(key)});},
});
const instant='2026-10-02T00:15:00.000Z';
const props={snapshot:{community:{slug:'test'},reviewTrades:[],reviewActions:[{reviewId:'review',actionId:'action',title:'Action',dueAtUtc:instant}],coachingAttachments:[],reviewReplies:[]},review:{reviewId:'review',relationshipId:'student',deliveryState:'follow_up',deliveredAtUtc:instant,viewedAtUtc:instant,followUpDueAtUtc:instant},isReview:false,paused:false,messagingEnabled:true};
function text(tree){if(tree==null||typeof tree==='boolean')return '';if(Array.isArray(tree))return tree.map(text).join('');if(typeof tree!=='object')return String(tree);return text(tree.props?.children);}
const before=process.env.TZ;
try{
 process.env.TZ='UTC';const server=text(output.StudentCoachingReview(props));
 process.env.TZ='America/Toronto';const browser=text(output.StudentCoachingReview(props));
 assert.equal(browser,server);
 for(const label of ['Due','Read','Follow-up due'])assert.ok(server.includes(`${label} 10/2/2026 UTC`));
 console.log('PASS: action due, read receipt and follow-up dates match UTC server and Toronto browser');
}finally{if(before===undefined)delete process.env.TZ;else process.env.TZ=before;}
