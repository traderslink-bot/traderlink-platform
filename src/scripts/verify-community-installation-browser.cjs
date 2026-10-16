// Actual React/MUI form, isolated server transports. No app server or hosted provider calls.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {build}=require('esbuild'),{chromium}=require('playwright');
async function main(){
 const root=path.resolve(__dirname,'../..'),artifacts=fs.mkdtempSync(path.join(os.tmpdir(),'community-installation-qa-'));
 const bundle=await build({absWorkingDir:root,bundle:true,write:false,format:'iife',platform:'browser',jsx:'automatic',define:{'process.env.NODE_ENV':'"production"','process.env':'{}'},stdin:{resolveDir:root,loader:'tsx',contents:`
  import React from 'react';import {createRoot} from 'react-dom/client';import {ThemeProvider,CssBaseline,Box} from '@mui/material';
  import {createTraderMaterialTheme} from './app/mui-theme';import {CommunityConnectForm} from './app/(dashboard)/communities/community-connect-form';
  window.mode='not_installed';window.checks=[];window.connections=[];
  createRoot(document.getElementById('root')).render(<ThemeProvider theme={createTraderMaterialTheme(new URLSearchParams(location.search).get('theme')==='dark'?'dark':'light')}><CssBaseline/><Box sx={{p:2,maxWidth:1000,mx:'auto'}}><CommunityConnectForm clientId="123456" guilds={[{guildId:'100',guildName:'QA existing',connectedSlug:'existing-room'},{guildId:'200',guildName:'QA new'},{guildId:'300',guildName:'QA other new'}]}/></Box></ThemeProvider>);
 `},plugins:[{name:'isolated-status-transports',setup(b){
  b.onLoad({filter:/community-installation-actions\.ts$/},()=>({loader:'ts',contents:`import {COMMUNITY_INSTALLATION_MESSAGES as M} from '${root}/src/modules/communities/contracts/community-installation-status';export async function checkCommunityInstallation(form){window.checks.push(form.get('discordGuildId'));if(window.mode==='slow')return new Promise(resolve=>window.finishCheck=()=>resolve({state:'ready',message:M.ready}));if(window.mode==='throw')throw new Error('PRIVATE-SENTINEL');return {state:window.mode,message:M[window.mode],...(window.mode==='connected'?{href:'/communities/new-room/manage'}:{})};}`}));
  b.onLoad({filter:/community-setup-feedback-actions\.ts$/},()=>({loader:'ts',contents:`export async function connectCommunityWithFeedback(form){window.connections.push(form.get('discordGuildId'));return {status:'success',message:'QA connection confirmed'};}`}));
 }}]});
 const browser=await chromium.launch({headless:true});try{
 for(const theme of ['light','dark'])for(const width of [1440,390]){
  const context=await browser.newContext({viewport:{width,height:900}}),errors=[],external=[];
  await context.route('**/*',route=>{
   const url=new URL(route.request().url());
   if(url.hostname==='discord.com')return route.fulfill({contentType:'text/html',body:'QA cancelled authorization; no provider contacted'});
   if(url.hostname!=='installation-qa.invalid'){external.push(url.hostname);return route.abort();}
   return route.fulfill(url.pathname==='/bundle.js'?{contentType:'text/javascript',body:bundle.outputFiles[0].text}:{contentType:'text/html',body:'<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><div id="root"></div><script src="/bundle.js"></script>'});
  });
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`https://installation-qa.invalid/?theme=${theme}`);
  await page.getByRole('link',{name:'Manage community',exact:true}).waitFor();assert.equal(await page.evaluate(()=>window.checks.length),0);
  async function choose(name){await page.getByRole('combobox',{name:'Discord server'}).click();await page.getByRole('option',{name,exact:true}).click();}
  await choose('QA new');const connect=page.getByRole('button',{name:'Connect server',exact:true}),recheck=page.getByRole('button',{name:'Recheck installation',exact:true});
  assert(await connect.isDisabled());
  const popupPromise=page.waitForEvent('popup');await page.getByRole('link',{name:'Install TraderLink Discord app',exact:true}).click();const popup=await popupPromise;await popup.close();
  assert(await connect.isDisabled());assert.equal(await page.evaluate(()=>window.checks.length),0,'Opening/cancelling authorization cannot confirm installation');
  for(const state of ['not_installed','unavailable','owner_required','ready']){
   await page.evaluate(value=>window.mode=value,state);await recheck.click();
   const role=state==='unavailable'||state==='owner_required'?'alert':'status';
   await page.getByRole(role).filter({hasText:state==='ready'?'installed and ready':state==='not_installed'?'not installed':state==='owner_required'?'own this server':'couldn\'t verify the Discord app'}).waitFor();
   assert.equal(await connect.isEnabled(),state==='ready');assert(await recheck.isEnabled());await recheck.focus();assert(await recheck.evaluate(el=>el===document.activeElement));
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   await page.screenshot({path:path.join(artifacts,`${theme}-${width}-${state}.png`),fullPage:true});
  }
  assert.equal(await page.getByRole('link',{name:'Install TraderLink Discord app',exact:true}).count(),0);
  await connect.click();await page.getByRole('status').filter({hasText:'QA connection confirmed'}).waitFor();assert.deepEqual(await page.evaluate(()=>window.connections),['200']);
  await page.evaluate(()=>window.mode='throw');await recheck.click();await page.getByRole('alert').filter({hasText:'couldn\'t verify'}).waitFor();assert(!(await page.locator('body').innerText()).includes('PRIVATE-SENTINEL'));assert(await connect.isDisabled());
  await page.evaluate(()=>window.mode='slow');await recheck.click();assert(await recheck.isDisabled());assert(await connect.isDisabled());
  await choose('QA other new');await page.evaluate(()=>window.finishCheck());assert(await connect.isDisabled());assert(!(await page.locator('body').innerText()).includes('installed and ready'));
  await page.evaluate(()=>window.mode='connected');await recheck.click();await page.getByRole('link',{name:'Manage community',exact:true}).waitFor();assert.equal(await connect.count(),0);
  await choose('QA existing');assert.equal(await page.getByRole('link',{name:'Manage community',exact:true}).getAttribute('href'),'/communities/existing-room/manage');
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);await context.close();
  console.log(`PASS: ${theme}/${width} actual form: four states, cancellation/recheck, connect gating, safe failures, pending controls, selection race and connected preservation`);
 }
 }finally{await browser.close();}
 console.log(JSON.stringify({artifacts,evidence:'Isolated actual-component browser proof, not staging/Discord installation acceptance'}));
}
main().catch(e=>{console.error(e);process.exitCode=1;});
