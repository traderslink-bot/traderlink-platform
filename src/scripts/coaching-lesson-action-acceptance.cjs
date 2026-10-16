// Actual exported actions; only request/framework adapters are isolated.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const ts=require('typescript');
function createLessonActionHarness({database,actor,Service,Permissions,atUtc,slug='first-room'}) {
 const effects=[],output={};
 const source=fs.readFileSync(path.resolve(__dirname,'../../app/(dashboard)/communities/community-actions.ts'),'utf8');
 vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports:output,Error,FormData,Date,require(id){
  if(id==='next/cache')return {revalidatePath:path=>effects.push(path),refresh:()=>effects.push('refresh')};
  if(id==='next/navigation')return {unstable_rethrow:error=>{if(error?.digest?.startsWith('NEXT_'))throw error;}};
  if(id.endsWith('/require-platform-request-scope'))return {requireTraderLinkPlatformPageIdentity:async()=>({scope:{userId:actor.userId}})};
  if(id.endsWith('/community-request-access'))return {requireCommunityRequestAccess:async input=>{assert.equal(input.userId,actor.userId);assert.equal(input.slug,slug);}};
  if(id.endsWith('/open-platform-database'))return {withPlatformDatabase:(_options,run)=>run(database)};
  if(id.endsWith('/traderlink-community-viewer'))return {resolveTraderLinkCommunityViewer:()=>actor};
  if(id.endsWith('/platform-migration-contract'))return {createCanonicalUtcTimestamp:()=>atUtc};
  if(id.endsWith('/traderlink-community-coaching-program-service'))return {TraderLinkCommunityCoachingProgramService:Service};
  if(id.endsWith('/traderlink-community-repository'))return {TraderLinkCommunityRepository:Permissions};
  return {};
 }},{filename:'actual-coaching-lesson-actions.acceptance.js'});
 return {effects,save:output.saveCoachingTeachingDetailsAction,feedback:output.saveCoachingTeachingWithFeedbackAction,archive:output.archiveCoachingStudentAction};
}
async function main(){
 const database={prepare:()=>({get:()=>({community_id:'synthetic-community'})})};
 let failure=new Error('Choose students before publishing this lesson.');
 const Service=class{updateTeachingDetails(){if(failure)throw failure;}};
 const actions=createLessonActionHarness({database,actor:{userId:'synthetic-coach'},Service,atUtc:'2026-10-15T14:00:00.000Z'});
 assert.equal(typeof actions.feedback,'function','Lesson editor needs a safe feedback action, not an uncaught server exception');
 const form=new FormData();for(const [key,value]of Object.entries({communitySlug:'first-room',teachingId:'synthetic-lesson',title:'Saved draft',deliveryKind:'resource',status:'published'}))form.set(key,value);
 let result=await actions.feedback(form);assert.equal(result.status,'error');assert.match(result.message,/active students/i);
 failure=new Error('PRIVATE-SENTINEL');result=await actions.feedback(form);assert.equal(result.status,'error');assert(!result.message.includes('PRIVATE-SENTINEL'));
 failure=Object.assign(new Error('redirect'),{digest:'NEXT_REDIRECT;replace;/login;307;'});await assert.rejects(actions.feedback(form),error=>error===failure);
 failure=null;result=await actions.feedback(form);assert.equal(result.status,'success');assert(actions.effects.length>0);
 const editor=fs.readFileSync(path.resolve(__dirname,'../../app/(dashboard)/communities/coaching-teaching-editor.tsx'),'utf8');
 assert.match(editor,/CommunityPublicationForm action=\{saveCoachingTeachingWithFeedbackAction\}/);
 console.log('PASS: actual lesson action returns safe audience error, hides internal failure details, preserves Next control flow, saves successfully and is wired to inline feedback. Framework/request adapters isolated.');
}
module.exports={createLessonActionHarness};
if(require.main===module)main().catch(error=>{console.error(error);process.exitCode=1;});
