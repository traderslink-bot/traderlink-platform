// Server-rendered page checkpoint with isolated database and mocked identity/frame.
// Does not claim a real browser or hosted authentication test.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const deps='C:/Users/jerac/Documents/TraderLink/traderlink-platform/node_modules';
const ts=require(deps+'/typescript'),React=require(deps+'/react'),{renderToStaticMarkup}=require(deps+'/react-dom/server');
const db=new (require(deps+'/better-sqlite3'))(':memory:');db.pragma('foreign_keys=ON');
let premium=false,privateReads=0;const cache=new Map();
function load(file){
  file=path.resolve(file);if(!fs.existsSync(file))file+='x';if(cache.has(file))return cache.get(file);
  const compiled=ts.transpileModule(fs.readFileSync(file,'utf8'),{fileName:file,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}});
  const mod={exports:{}};cache.set(file,mod.exports);
  function req(name){
    if(name==='server-only')return {};
    if(name==='react/jsx-runtime')return require(deps+'/react/jsx-runtime');
    if(name==='next/headers')return {headers:async()=>new Headers()};
    if(name==='next/navigation')return {notFound:()=>{throw Error('NOT_FOUND');}};
    if(name.endsWith('swing-idea-access'))return {readSwingIdeaAccess:async()=>({identity:premium?{}:null,premium})};
    if(name.endsWith('open-platform-database'))return {withPlatformDatabase:(_options,fn)=>fn(db)};
    if(name.endsWith('swing-frame'))return {SwingFrame:({children})=>children};
    if(name.endsWith('swing-visit-recorder'))return {SwingVisitRecorder:()=>null};
    if(name.endsWith('.module.css'))return {default:{page:'page',panel:'panel'}};
    if(name.startsWith('@/'))return load(name.slice(2)+'.ts');
    if(name.startsWith('.'))return load(path.resolve(path.dirname(file),name+'.ts'));
    return require(name);
  }
  vm.runInNewContext(compiled.outputText,{exports:mod.exports,module:mod,require:req,URL,Date,JSON,Set,Map,Error});return mod.exports;
}
async function main(){
  const migration=load('src/modules/platform/server/database/migrations/0154_platform_premium_swing_plan_authorship.ts').platformPremiumSwingPlanAuthorshipMigration;
  for(const sql of migration.statements)db.exec(sql);
  const contract=load('src/modules/swings/swing-plan-contract.ts'),{SwingPlanStore}=load('src/modules/swings/server/swing-plan-store.ts');
  const store=new SwingPlanStore(db),document=contract.newSwingPlan();document.ticker='ZZPRIVATE';document.title='Private company thesis';
  document.sections[0].blocks=[{id:'body',kind:'paragraph',runs:[{text:'Secret research',bold:true}]}];
  const draft=store.save({expectedVersion:0,document,actor:'owner'});store.publish(draft.id,1);
  const published=SwingPlanStore.prototype.published;SwingPlanStore.prototype.published=function(id){privateReads++;return published.call(this,id);};
  const page=load('app/swings/[ideaId]/page.tsx'),params=Promise.resolve({ideaId:draft.slug});
  const metadata=JSON.stringify(await page.generateMetadata({params}));assert(!metadata.includes('ZZPRIVATE'));assert(!metadata.includes('Secret research'));
  const locked=renderToStaticMarkup(await page.default({params}));assert(!locked.includes('ZZPRIVATE'));assert(!locked.includes('Secret research'));assert(locked.includes('Sign in'));assert.equal(privateReads,0);
  premium=true;const full=renderToStaticMarkup(await page.default({params}));assert(full.includes('ZZPRIVATE'));assert(full.includes('<strong>Secret research</strong>'));assert.equal(privateReads,1);
  const next={...document,title:'UNPUBLISHED CHANGE'};store.save({id:draft.id,expectedVersion:1,document:next,actor:'owner'});
  const unchanged=renderToStaticMarkup(await page.default({params}));assert(!unchanged.includes('UNPUBLISHED CHANGE'));
  const render=load('app/swings/swing-plan-content.tsx').SwingPlanContent;
  const empty=contract.newSwingPlan();empty.ticker='EMPTY';empty.title='Empty';empty.updates=[{id:'empty-update',at:Date.now(),title:'Empty update',blocks:[]}];
  const emptyHtml=renderToStaticMarkup(React.createElement(render,{document:empty}));assert(!emptyHtml.includes('Dated updates'));assert(!emptyHtml.includes('DD &amp; research'));
  await assert.rejects(()=>page.default({params:Promise.resolve({ideaId:'unknown'})}),/NOT_FOUND/);
  console.log('PASS isolated SSR: locked content never reads private plan, metadata generic, Premium research renders, unpublished edits isolated, empty sections/updates omitted, unknown link rejected.');
}
main().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>db.close());
