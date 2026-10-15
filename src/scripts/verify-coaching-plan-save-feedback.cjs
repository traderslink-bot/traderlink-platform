const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),ts=require('typescript');
const source=fs.readFileSync('app/(dashboard)/communities/community-actions.ts','utf8');
const fn=source.slice(source.indexOf('export async function saveCoachingPlanWithFeedbackAction'),source.indexOf('export async function createCommunityCoachingPlanAction'));
const exportsObject={};let failure;
class TraderLinkPlatformError extends Error{constructor(field){super('PRIVATE_INTERNAL_CONTEXT');this.safeContext={field};}}
const redirect=new Error('framework redirect');
vm.runInNewContext(ts.transpileModule(fn,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports:exportsObject,TraderLinkPlatformError,unstable_rethrow:e=>{if(e===redirect)throw e},createCommunityCoachingPlanAction:async()=>{throw failure;}});
(async()=>{const save=exportsObject.saveCoachingPlanWithFeedbackAction;failure=new TraderLinkPlatformError('planRevision');assert.match((await save({error:''},new FormData())).error,/another window/);failure=new Error('PRIVATE_INTERNAL_CONTEXT');const result=await save({error:''},new FormData());assert.match(result.error,/entries are still here/);assert(!result.error.includes('PRIVATE_INTERNAL_CONTEXT'));failure=redirect;await assert.rejects(save({error:''},new FormData()),e=>e===redirect);console.log('PASS: conflicts and failures are safe inline feedback; framework redirects propagate');})().catch(e=>{console.error(e);process.exitCode=1});
