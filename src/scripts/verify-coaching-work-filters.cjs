const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const ts=require('typescript');
const source=fs.readFileSync(path.resolve(__dirname,'../../app/(dashboard)/communities/coach-workspace-navigation.tsx'),'utf8');
const output={},state=[];let cursor=0;
const jsx=(type,props,key)=>({type,props,key});
vm.runInNewContext(ts.transpileModule(source+'\nexports.qaMetric=Metric;',{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText,{
 exports:output,Date,Intl,Map,Set,
 require(id){
  if(id==='react/jsx-runtime')return {jsx,jsxs:jsx};
  if(id==='react')return {useMemo:fn=>fn(),useState:initial=>{const index=cursor++;if(!(index in state))state[index]=initial;return [state[index],value=>{state[index]=typeof value==='function'?value(state[index]):value;}];}};
  if(id.endsWith('/coaching-review-workspace'))return {coachingReviewLabel:()=> 'Trade review'};
  return new Proxy({},{get:(_t,key)=>String(key)});
 },
});
const relation={relationshipId:'r',coachUserId:'coach',studentDisplayName:'Student',planName:'Plan'};
const task=(taskId,dueAtUtc,status='open')=>({taskId,relationshipId:'r',title:taskId,priority:'normal',dueAtUtc,status});
const snapshot={generatedAtUtc:'2026-10-10T12:00:00Z',community:{slug:'test'},viewer:{userId:'coach'},relationships:[relation],coaches:[{coachProfileId:'c',userId:'coach'}],plans:[{coachProfileId:'c',name:'Plan'}],coachingTasks:[task('overdue','2026-10-09T17:00:00Z'),task('today','2026-10-10T17:00:00Z'),task('tomorrow','2026-10-11T17:00:00Z'),task('later','2026-10-16T17:00:00Z'),task('done','2026-10-10T17:00:00Z','completed')],tradeReviews:[],reviewTrades:[],coachingSessions:[],teachingItems:[]};
function nodes(tree){if(!tree||typeof tree!=='object')return [];if(Array.isArray(tree))return tree.flatMap(nodes);return [tree,...nodes(tree.props?.children)];}
const render=()=>{cursor=0;return nodes(output.CoachingWorkPage({snapshot}));};
const change=(label,value)=>render().find(n=>n.props?.label===label&&n.props.onChange).props.onChange({target:{value}});
const ids=()=>[...new Set(render().filter(n=>n.props?.item).map(n=>n.props.item.id))];
const count=label=>render().find(n=>n.props?.label===label&&!n.props.onChange).props.value;
change('Number of days',1);assert.deepEqual(ids(),['task:overdue','task:today']);assert.equal(count('Total due'),'2');assert.equal(count('Plan'),'2');
change('Number of days',2);assert.ok(ids().includes('task:tomorrow'));assert.equal(count('Due soon'),'2');
change('Search','overdue');assert.deepEqual(ids(),['task:overdue']);change('Search','');
change('Work status','completed');assert.deepEqual(ids(),['task:done']);assert.equal(count('Total due'),'0');change('Work status','active');
render().find(n=>n.props?.exclusive).props.onChange(null,'custom');
change('Start date','2026-10-11');change('End date','2026-10-11');assert.deepEqual(ids(),['task:tomorrow']);assert.equal(count('Total due'),'1');
change('Start date','2026-10-09');change('End date','2026-10-16');change('Sort','due_latest');assert.deepEqual(ids(),['task:later','task:tomorrow','task:today','task:overdue']);
const metrics=render().filter(n=>n.props?.size&&nodes(n).some(child=>child.props?.label==='Total due'));
assert.equal(metrics[0].props.size.lg,3);
assert.equal(output.qaMetric({label:'Long plan name',value:'1'}).props.sx['& .MuiTypography-caption'].whiteSpace,'normal');
console.log('PASS: day range, overdue inclusion, searchable statuses, completed exclusion, exact custom dates, sorting and bounded wrapping metric grid');
