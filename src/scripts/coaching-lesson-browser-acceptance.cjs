// Actual editor/shared feedback form in isolated browser; no hosted actions or sessions.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {build}=require('esbuild'),{chromium}=require('playwright');
const {createLessonActionHarness}=require('./coaching-lesson-action-acceptance.cjs');
const {captureFailedRequests}=require('./coaching-failed-request-metadata.cjs');
async function main(){
 const root=path.resolve(__dirname,'../..'),artifacts=fs.mkdtempSync(path.join(os.tmpdir(),'coaching-lesson-qa-'));
 const action=createLessonActionHarness({database:{prepare:()=>({get:()=>({community_id:'fixture'})})},actor:{userId:'fixture-coach'},Service:class{updateTeachingDetails(){throw new Error('Choose students before publishing this lesson.');}},atUtc:'2026-10-15T14:00:00.000Z'});
 const form=new FormData();for(const[key,value]of Object.entries({communitySlug:'first-room',teachingId:'fixture',title:'QA ONLY lesson',deliveryKind:'resource',status:'published'}))form.set(key,value);
 const response=await action.feedback(form);assert.equal(response.status,'error');
 const bundle=await build({absWorkingDir:root,bundle:true,write:false,format:'iife',platform:'browser',jsx:'automatic',define:{'process.env.NODE_ENV':'"production"','process.env':'{}'},stdin:{resolveDir:root,loader:'tsx',contents:`
  import React from 'react';import {createRoot} from 'react-dom/client';import {ThemeProvider,CssBaseline,Box,Typography} from '@mui/material';
  import {createTraderMaterialTheme} from './app/mui-theme';import {CoachingTeachingEditor} from './app/(dashboard)/communities/coaching-teaching-editor';
  const params=new URLSearchParams(location.search);window.lessonResult=${JSON.stringify(response)};
  const item={teachingId:'fixture',title:'QA ONLY saved lesson',body:'Original saved content',deliveryKind:'resource',status:'draft',deliveryUrl:'',recordingUrl:'',scheduledAtUtc:null,availableAtUtc:null,dueAtUtc:null};
  createRoot(document.getElementById('root')).render(<ThemeProvider theme={createTraderMaterialTheme(params.get('theme')==='dark'?'dark':'light')}><CssBaseline/><Box component="main" sx={{p:2,maxWidth:1000,mx:'auto'}}><Typography component="h1" variant="h1">QA ONLY lesson</Typography><CoachingTeachingEditor communitySlug="first-room" item={item} disabled={false}/></Box></ThemeProvider>);
 `},plugins:[{name:'isolated-action-adapter',setup(builder){builder.onLoad({filter:/community-actions\.ts$/},()=>({contents:'export async function saveCoachingTeachingWithFeedbackAction(form){window.submittedLesson=Object.fromEntries(form);return window.lessonResult;}',loader:'ts'}));}}]});
 const browser=await chromium.launch({headless:true});
 try{for(const theme of ['light','dark'])for(const width of [1440,390]){
  const context=await browser.newContext({viewport:{width,height:900}}),errors=[],external=[];
  await context.route('**/*',route=>{const url=new URL(route.request().url());if(url.hostname!=='lesson-qa.invalid'){external.push(url.hostname);return route.abort();}return route.fulfill(url.pathname==='/bundle.js'?{contentType:'text/javascript',body:bundle.outputFiles[0].text}:{contentType:'text/html',body:'<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><div id="root"></div><script src="/bundle.js"></script>'});});
  const page=await context.newPage(),failedRequests=[];captureFailedRequests(page,row=>failedRequests.push(row));page.on('pageerror',error=>errors.push(error.message));await page.goto(`https://lesson-qa.invalid/?theme=${theme}`);
  await page.getByText('Edit lesson',{exact:true}).click();
  await page.getByRole('textbox',{name:/^Title/}).fill('QA ONLY unsaved title preserved');await page.getByLabel('Content',{exact:true}).fill('Unsaved content remains after rejection');
  await page.getByRole('combobox',{name:'Status',exact:true}).click();await page.getByRole('option',{name:'Published',exact:true}).click();
  const button=page.getByRole('button',{name:'Save lesson',exact:true});await button.click();
  await page.getByRole('alert').waitFor();assert((await page.getByRole('alert').innerText()).includes('Choose active students'));
  assert.equal(await page.getByRole('textbox',{name:/^Title/}).inputValue(),'QA ONLY unsaved title preserved');assert.equal(await page.getByLabel('Content',{exact:true}).inputValue(),'Unsaved content remains after rejection');
  assert.equal(await page.evaluate(()=>window.submittedLesson.status),'published');assert(await button.isEnabled());await button.focus();assert(await button.evaluate(el=>el===document.activeElement));
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
  await page.screenshot({path:path.join(artifacts,`${theme}-${width}.png`),fullPage:true});fs.writeFileSync(path.join(artifacts,`${theme}-${width}-failed-requests.json`),JSON.stringify(failedRequests,null,2));assert.deepEqual(failedRequests,[]);console.log(`PASS: ${theme}/${width} actual editor renders safe action result, preserves input, focus/retry and no overflow/page errors/external requests`);await context.close();
 }}finally{await browser.close();}
 console.log(JSON.stringify({artifacts,evidence:'isolated component/browser proof; not signed-in staging acceptance'}));
}
main().catch(error=>{console.error(error);process.exitCode=1});
