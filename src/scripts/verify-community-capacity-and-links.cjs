const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '../..');
function load(file, imports, extra='') {
  const output={};
  const source=fs.readFileSync(path.join(root,file),'utf8')+extra;
  vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText,{
    exports:output,Intl,Set,
    require(id){if(id==='react/jsx-runtime')return {jsx,jsxs:jsx};return imports(id);},
  });
  return output;
}
const jsx=(type,props,key)=>({type,props,key});
const availability=load('src/modules/communities/contracts/coaching-plan-availability.ts',id=>{throw new Error(id);});
const plan={planId:'plan',coachProfileId:'coach',status:'active',studentCapacity:10,activeStudents:1};
assert.equal(availability.coachingPlanHasSpace(plan),true);
assert.equal(availability.coachingPlanHasSpace({...plan,activeStudents:10}),false);
assert.equal(availability.coachingPlanHasSpace({...plan,status:'paused'}),false);
assert.equal(availability.coachAcceptsStudents([plan],'coach'),true);
assert.equal(availability.coachAcceptsStudents([plan],'another'),false);
const components=load('app/(dashboard)/communities/community-dashboard.tsx',id=>id.endsWith('/coaching-plan-availability')?availability:new Proxy({},{get:(_t,key)=>String(key)}),'\nexports.qaHome=Home; exports.qaCoaches=Coaches; exports.qaWatchlists=WatchlistList; exports.qaAlerts=AlertList; exports.qaLabels=communityCapabilityLabels;');
function nodes(tree){if(!tree||typeof tree!=='object')return [];if(Array.isArray(tree))return tree.flatMap(nodes);return [tree,...nodes(tree.props?.children),...nodes(tree.props?.action)];}
const snapshot={viewer:{capabilities:[]},community:{memberCount:1},alerts:[],watchlists:[],coaches:[]};
const alertSnapshot={community:{slug:'test'},viewer:{userId:'owner',capabilities:['community.alerts.create']},alerts:[{alertId:'alert',slug:'example',publishingMode:'discord_post',authorUserId:'owner',publishedAtUtc:null}]};
const alertLinks=()=>nodes(components.qaAlerts({snapshot:alertSnapshot})).filter(n=>n.props?.href);
assert.equal(alertLinks()[0].props.href,'/communities/test/alerts/example');
alertSnapshot.viewer.userId='another';assert.equal(alertLinks().length,0);
alertSnapshot.viewer.capabilities.push('community.alerts.manage_all');assert.equal(alertLinks().length,1);
alertSnapshot.viewer.capabilities=[];assert.equal(alertLinks().length,0);
alertSnapshot.alerts[0].publishingMode='tracked_page';assert.equal(alertLinks().length,1);
assert.equal(nodes(components.qaHome({snapshot,base:'/test'})).filter(n=>n.props?.href).length,0);
snapshot.viewer.capabilities=['community.alerts.view','community.watchlists.view'];
assert.deepEqual(nodes(components.qaHome({snapshot,base:'/test'})).filter(n=>n.props?.href).map(n=>n.props.href),['/test/alerts','/test/watchlists']);
const contracts=load('src/modules/communities/contracts/traderlink-community-contracts.ts',()=>new Proxy({},{get:(_t,key)=>String(key)}));
for(const capability of contracts.TRADERLINK_COMMUNITY_CAPABILITIES)assert.ok(components.qaLabels[capability],`Missing label: ${capability}`);
const watchlistSnapshot={community:{slug:'test'},viewer:{userId:'owner',capabilities:['community.watchlists.publish_staff']},watchlists:[{sourceKind:'server',publishingMode:'discord_post',authorUserId:'owner',watchlistId:'watchlist',sharedAtUtc:null}]};
assert.equal(nodes(components.qaWatchlists({snapshot:watchlistSnapshot})).filter(n=>n.props?.href).length,1,'Author can reopen a Discord-only watchlist');
watchlistSnapshot.viewer.userId='another';
assert.equal(nodes(components.qaWatchlists({snapshot:watchlistSnapshot})).filter(n=>n.props?.href).length,0,'Other publishers do not receive a management link');
watchlistSnapshot.viewer.capabilities.push('community.watchlists.manage_all');
assert.equal(nodes(components.qaWatchlists({snapshot:watchlistSnapshot})).filter(n=>n.props?.href).length,1,'Authorized manager can reopen it');
let profileSnapshot={viewer:{userId:'student'},coaches:[{coachProfileId:'coach',slug:'coach',status:'active',userId:'owner',activeStudents:2,capacity:2}],plans:[plan],relationships:[]};
const page=load('app/(dashboard)/communities/[communitySlug]/coaches/[coachSlug]/page.tsx',id=>{
  if(id.endsWith('/coaching-plan-availability'))return availability;
  if(id.endsWith('/community-dashboard-loader'))return {loadCommunityDashboard:async()=>({snapshot:profileSnapshot,isReview:false})};
  return new Proxy({},{get:(_t,key)=>String(key)});
});
(async()=>{
  const listing=(changes={})=>nodes(components.qaCoaches({snapshot:{...profileSnapshot,community:{slug:'test'},...changes},isReview:false}));
  assert.equal(listing().find(n=>n.props?.children==='Request coaching').props.disabled,false);
  assert.equal(listing({plans:[{...plan,activeStudents:10}]}).find(n=>n.props?.children==='Request coaching').props.disabled,true);
  assert.ok(listing({relationships:[{planId:'plan',studentUserId:'student',status:'pending'}]}).some(n=>n.props?.children==='View request'));
  assert.ok(!listing({plans:[{...plan,status:'draft'}]}).some(n=>n.props?.children==='Request coaching'));
  const render=async()=>nodes(await page.default({params:Promise.resolve({communitySlug:'test',coachSlug:'coach'})}));
  let tree=await render();
  assert.ok(tree.some(n=>n.props?.label==='Accepting students'));
  assert.equal(tree.find(n=>n.props?.children==='Request coaching').props.disabled,false,'Old global capacity cannot block an available plan');
  profileSnapshot.relationships=[{planId:'plan',studentUserId:'student',status:'active'}];
  tree=await render();assert.ok(tree.some(n=>n.props?.children==='My coaching'));assert.ok(!tree.some(n=>n.props?.children==='Request coaching'));
  profileSnapshot.relationships=[];profileSnapshot.plans=[{...plan,activeStudents:10}];
  tree=await render();assert.equal(tree.find(n=>n.props?.children==='Request coaching').props.disabled,true);
  console.log('PASS: per-plan capacity, legacy global capacity ignored, existing enrollment link, restricted overview links, complete capability labels');
})().catch(error=>{console.error(error);process.exitCode=1;});
