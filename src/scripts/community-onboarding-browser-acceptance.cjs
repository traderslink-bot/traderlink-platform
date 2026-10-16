// Actual MUI components in an isolated browser; no app server or hosted requests.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const {build} = require('esbuild');
const {chromium} = require('playwright');
async function main() {
  const root=path.resolve(__dirname,'../..');
  const artifacts=fs.mkdtempSync(path.join(os.tmpdir(),'community-onboarding-qa-'));
  const bundle=await build({absWorkingDir:root,bundle:true,write:false,format:'iife',platform:'browser',jsx:'automatic',define:{'process.env.NODE_ENV':'"production"','process.env':'{}'},
    stdin:{resolveDir:root,loader:'tsx',contents:`
      import React from 'react'; import {createRoot} from 'react-dom/client';
      import {ThemeProvider,CssBaseline,Box,Typography} from '@mui/material';
      import {createTraderMaterialTheme} from './app/mui-theme';
      import {CommunityConnectForm} from './app/(dashboard)/communities/community-connect-form';
      import {Channels} from './app/(dashboard)/communities/community-dashboard';
      const params=new URLSearchParams(location.search);
      const snapshot={community:{slug:'qa-room',discordGuildId:'100'},channels:[],deliveries:[],viewer:{capabilities:[]}};
      createRoot(document.getElementById('root')).render(<ThemeProvider theme={createTraderMaterialTheme(params.get('theme')==='dark'?'dark':'light')}><CssBaseline/>
        <Box component="main" sx={{p:2,maxWidth:1000,mx:'auto'}}><Typography component="h1" variant="h1">Connect a Discord community</Typography>
          <CommunityConnectForm clientId="123456" guilds={[{guildId:'100',guildName:'Connected QA server',connectedSlug:'qa-room'},{guildId:'200',guildName:'New QA server'}]}/>
          <Box sx={{mt:3}}><Channels snapshot={snapshot} isReview={false} discordClientId="123456" discordResources={{roles:[],channels:[{id:'1',name:'private',canPublish:false},{id:'2',name:'allowed',canPublish:true}]}}/></Box>
        </Box></ThemeProvider>);
    `},plugins:[{name:'isolated-actions',setup(builder){
      builder.onLoad({filter:/actions\.ts$/},args=>{
        const source=fs.readFileSync(args.path,'utf8'); if(!source.startsWith('"use server"'))return;
        return {contents:[...source.matchAll(/export async function (\w+)/g)].map(match=>`export async function ${match[1]}(){throw new Error('No server actions in isolated QA')}`).join('\n'),loader:'ts'};
      });
      builder.onLoad({filter:/community-dashboard\.tsx$/},args=>({contents:fs.readFileSync(args.path,'utf8')+'\nexport {Channels};',loader:'tsx'}));
      builder.onResolve({filter:/^next\/navigation$/},()=>({path:'navigation',namespace:'qa'}));
      builder.onLoad({filter:/.*/,namespace:'qa'},()=>({contents:'export const useRouter=()=>({push(){},refresh(){},replace(){}});export const useSearchParams=()=>new URLSearchParams();export const usePathname=()=>"/communities";'}));
    }}]});
  const browser=await chromium.launch({headless:true});
  try{
    for(const theme of ['light','dark'])for(const width of [1440,390]){
      const context=await browser.newContext({viewport:{width,height:900}});
      const errors=[]; const requests=[];
      await context.route('**/*',route=>{
        const url=new URL(route.request().url());
        if(url.hostname!=='onboarding-qa.invalid'){requests.push(url.hostname);return route.abort();}
        if(url.pathname==='/bundle.js')return route.fulfill({contentType:'text/javascript',body:bundle.outputFiles[0].text});
        return route.fulfill({contentType:'text/html',body:'<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><div id="root"></div><script src="/bundle.js"></script>'});
      });
      const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
      await page.goto(`https://onboarding-qa.invalid/?theme=${theme}`);
      await page.getByRole('link',{name:'Manage community',exact:true}).waitFor();
      assert.equal(await page.getByRole('link',{name:'Manage community',exact:true}).getAttribute('href'),'/communities/qa-room/manage');
      assert.equal(await page.getByRole('button',{name:'Connect server',exact:true}).count(),0);
      await page.getByRole('combobox',{name:'Discord server',exact:true}).click();
      await page.getByRole('option',{name:'New QA server',exact:true}).click();
      await page.getByRole('button',{name:'Connect server',exact:true}).waitFor();
      assert.equal(await page.getByRole('link',{name:'Manage community',exact:true}).count(),0);
      assert.equal(await page.locator('input[name="discordGuildId"]').inputValue(),'200');
      await page.getByRole('combobox',{name:'Discord server',exact:true}).click();
      await page.getByRole('option',{name:'Connected QA server',exact:true}).click();
      await page.getByRole('link',{name:'Manage community',exact:true}).focus();
      assert(await page.getByRole('link',{name:'Manage community',exact:true}).evaluate(el=>el===document.activeElement));
      await page.getByRole('combobox',{name:'Discord channel',exact:true}).click();
      assert.equal(await page.getByRole('option',{name:'#private — Bot access required',exact:true}).getAttribute('aria-disabled'),'true');
      await page.keyboard.press('Escape');
      assert(await page.getByText(/For channels marked/).isVisible());
      assert(await page.getByRole('button',{name:'Save channel',exact:true}).isEnabled());
      await page.getByRole('combobox',{name:'Discord channel',exact:true}).click();
      await page.getByRole('option',{name:'#allowed',exact:true}).click();
      await page.locator('[role=listbox]').waitFor({state:'detached'});
      assert(await page.getByText('Discord app detected',{exact:true}).isVisible());
      assert.equal(await page.getByRole('link',{name:'Install TraderLink Discord app',exact:true}).count(),0);
      assert.equal(await page.locator('input[name="discordChannelId"]').inputValue(),'2');
      await page.screenshot({path:path.join(artifacts,`${theme}-${width}.png`),fullPage:true});
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No horizontal overflow');
      assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);
      console.log(`PASS: ${theme} ${width}, server switching/manage focus, named channel selection/disabled option, guidance, no overflow/page errors/external requests`);
      await context.close();
    }
  }finally{await browser.close();}
  console.log(JSON.stringify({artifacts,evidence:'isolated actual-component browser proof; not staging/full-app acceptance'}));
}
main().catch(error=>{console.error(error);process.exitCode=1;});
