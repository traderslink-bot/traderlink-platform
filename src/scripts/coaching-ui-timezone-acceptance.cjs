/* Isolated component/browser QA. No app server, hosted requests, or customer data. */
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { build } = require('esbuild');
const { chromium } = require('playwright');

async function run() {
  const root = path.resolve(__dirname, '../..');
  const artifacts = fs.mkdtempSync(path.join(os.tmpdir(), 'coaching-ui-qa-'));
  const bundle = await build({
    absWorkingDir: root, bundle: true, write: false, format: 'iife', platform: 'browser',
    jsx: 'automatic', define: { 'process.env.NODE_ENV': '"production"', 'process.env': '{}'  },
    stdin: { resolveDir: root, loader: 'tsx', contents: `
      import React from 'react';
      import { createRoot } from 'react-dom/client';
      import { ThemeProvider, CssBaseline, Box, Button, Stack, Typography } from '@mui/material';
      import { createTraderMaterialTheme } from './app/mui-theme';
      import { PwaUpdateNotice } from './app/pwa/pwa-update-notice';
      import { WorkspaceTradeDrawer } from './app/(dashboard)/workspace/workspace-trade-library-client';
      import { ManualTradePostEntryReview } from './app/(dashboard)/trade-tracker/manual-trade-post-entry-review';
      import { queueManualTradeSubmission, listManualTradeOutbox } from './src/modules/platform/client/pwa/manual-trade-outbox';
      window.outbox = { queueManualTradeSubmission, listManualTradeOutbox };
      const params = new URLSearchParams(location.search);
      function Fixture() {
        const [timezone, setTimezone] = React.useState('UTC');
        const [drawer, setDrawer] = React.useState(false);
        const group = { groupRef:'synthetic', symbol:'QAONLY', currency:'USD', direction:'long',
          state:'complete_trade', openedAtUtc:'2026-10-15T14:00:00.000Z', lastExecutionAtUtc:'2026-10-15T14:01:00.000Z',
          allocations:[{role:'opening',quantityDecimal:'1'}], suggestedStyle:'day' };
        return <ThemeProvider theme={createTraderMaterialTheme(params.get('appearance') === 'dark' ? 'dark' : 'light')}>
          <CssBaseline/><Box component="main" sx={{px:{xs:1.5,sm:2.5},pt:2,ml:{md:'240px'},minWidth:0}}>
            <PwaUpdateNotice/>
            <Stack spacing={2}>
              <Typography variant="h4">Isolated coaching component QA</Typography>
              <Typography>Journal access is off. Ask the student to share eligible trades.</Typography>
              <Typography>Trade reviews saved: 0 of 1.</Typography>
              <Button id="draft" onClick={()=>{localStorage.setItem('qa-saved-draft','synthetic saved draft');}}>Save synthetic draft</Button>
              <Button onClick={()=>setTimezone(timezone === 'UTC' ? 'America/New_York' : 'UTC')}>Switch synthetic account</Button>
              <Button onClick={()=>setDrawer(true)}>Open actual Add trade</Button>
              <ManualTradePostEntryReview timezone={timezone} groups={[group]} merges={[]} analyzerGroupRefs={[]} analyzerUses={null} onAnalyzerGroupRefsChange={()=>{}} onError={()=>{}} onMergesChange={()=>{}}/>
              <Box sx={{height:700}}/>
              <Button id="return" component="a" href="/workspace">Return to workspace</Button>
            </Stack>
            {drawer ? <WorkspaceTradeDrawer key={timezone} accountCurrency="USD" accountTimezone={timezone} expectedAccountSelectionRef={(timezone==='UTC'?'a':'b').repeat(64)} offlineScopeRef={'c'.repeat(64)} addTradeOpen onClose={()=>setDrawer(false)}/> : null}
          </Box>
        </ThemeProvider>;
      }
      createRoot(document.getElementById('root')).render(<Fixture/>);
    ` },
    plugins: [{ name: 'isolated-client-fixture', setup(builder) {
      builder.onLoad({ filter: /actions\.ts$/ }, args => {
        const source=fs.readFileSync(args.path,'utf8');
        if (!source.startsWith('"use server"')) return;
        const names=[...source.matchAll(/export async function (\w+)/g)].map(match=>match[1]);
        return { contents:names.map(name=>'export async function '+name+'(){throw new Error("Server action disabled in isolated QA")}').join('\n'), loader:'ts' };
      });
      builder.onResolve({ filter: /^next\/navigation$/ }, () => ({ path: 'navigation', namespace: 'nav' }));
      builder.onLoad({ filter: /.*/, namespace: 'nav' }, () => ({ contents: 'export const useRouter=()=>({push(){},replace(){},refresh(){}});export const useSearchParams=()=>new URLSearchParams();export const usePathname=()=>"/workspace";' }));
    } }],
  });
  const browser = await chromium.launch({ headless: true });
  const results = [];
  try {
    for (const appearance of ['light', 'dark']) for (const viewport of [{width:1440,height:900},{width:390,height:844}]) {
      console.log('Checking',appearance,viewport.width);
      const context = await browser.newContext({ viewport, hasTouch: viewport.width < 500 });
      await context.route('**/*', route => {
        const url = new URL(route.request().url());
        if (url.hostname !== 'coaching-ui-qa.invalid') return route.abort();
        if (url.pathname === '/bundle.js') return route.fulfill({ contentType:'text/javascript', body:bundle.outputFiles[0].text });
        if (url.pathname === '/api/platform/daily-trade-analyzer/allowance') return route.fulfill({status:503,contentType:'application/json',body:'{}'});
        if (url.pathname.startsWith('/api/')) return route.abort();
        return route.fulfill({ contentType:'text/html', body:'<!doctype html><meta name="viewport" content="width=device-width, initial-scale=1"><div id="root"></div><script src="/bundle.js"></script>' });
      });
      await context.addInitScript(() => {
        const container = new EventTarget();
        const worker = new EventTarget();
        worker.state = 'installed';
        worker.postMessage = message => { window.lastWorkerMessage=message; };
        container.controller = {state:'activated'};
        const registration = Object.assign(new EventTarget(), {
          waiting:worker, installing:null, active:{state:'activated'}, update:async()=>{}, sync:{register:async()=>{}},
        });
        container.ready = Promise.resolve(registration);
        Object.defineProperty(navigator,'serviceWorker',{value:container,configurable:true});
        window.activateQaUpdate = () => {
          registration.waiting=null;
          worker.state='activated';
          container.controller={state:'activated'};
          worker.dispatchEvent(new Event('statechange'));
          container.dispatchEvent(new Event('controllerchange'));
        };
        sessionStorage.setItem('qa-loads',String(Number(sessionStorage.getItem('qa-loads')||0)+1));
      });
      const page = await context.newPage();
      const errors=[]; page.on('pageerror',error=>{errors.push(error.message);console.error('Browser error:',error.message);});
      await page.goto('https://coaching-ui-qa.invalid/final?appearance='+appearance);
      const notice=page.getByRole('alert');
      await notice.getByRole('button',{name:'Update app',exact:true}).waitFor();
      await page.getByText('Journal access is off.',{exact:false}).waitFor();
      assert.match(await notice.innerText(),/Save any edits before updating/);
      async function hit(locator) {
        await locator.scrollIntoViewIfNeeded();
        assert.equal(await locator.evaluate(el=>{const r=el.getBoundingClientRect();return el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}),true);
      }
      await hit(page.locator('#draft')); await page.locator('#draft').click();
      await hit(page.locator('#return')); await page.locator('#return').click();
      await page.waitForURL('**/workspace');
      await page.goto('https://coaching-ui-qa.invalid/final?appearance='+appearance);
      await notice.waitFor(); await page.locator('#return').focus(); await page.keyboard.press('Enter'); await page.waitForURL('**/workspace');
      await page.goto('https://coaching-ui-qa.invalid/final?appearance='+appearance);
      await notice.waitFor();
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
      const preview=page.getByText('Times shown in your account timezone: UTC.',{exact:true});
      await preview.waitFor();
      assert.match(await page.locator('main').innerText(),/Oct 15, 2026, 2:00 PM GMT/);
      await page.getByRole('button',{name:'Open actual Add trade'}).click();
      await page.getByText('Times use your account timezone: UTC.',{exact:true}).waitFor();
      await page.getByRole('button',{name:'Close',exact:true}).click();
      await page.getByRole('button',{name:'Switch synthetic account'}).click();
      await page.getByText('Times shown in your account timezone: America/New_York.',{exact:true}).waitFor();
      assert.match(await page.locator('main').innerText(),/Oct 15, 2026, 10:00 AM GMT-4/);
      await page.getByRole('button',{name:'Open actual Add trade'}).click();
      await page.getByText('Times use your account timezone: America/New_York.',{exact:true}).waitFor();
      await page.getByRole('button',{name:'Close',exact:true}).click();
      const partition={offlineScopeRef:'c'.repeat(64),accountSelectionRef:'a'.repeat(64)};
      await page.evaluate(async partition=>{
        await window.outbox.queueManualTradeSubmission({offlineScopeRef:partition.offlineScopeRef,submission:{
          tracker:'workspace',expectedAccountSelectionRef:partition.accountSelectionRef,idempotencyKey:'isolated-update-qa',
          entries:[{clientRowRef:'qa',localDate:'2026-10-15',localTime:'14:00:00',sourceTimezone:'UTC',normalizedSymbol:'QAONLY',tradeCurrency:'USD',side:'buy',quantityDecimal:'1',priceDecimal:'10',feesDecimal:null}],
        }});
      },partition);
      const before=await page.evaluate(()=>sessionStorage.getItem('qa-loads'));
      await hit(notice.getByRole('button',{name:'Update app',exact:true}));
      await notice.getByRole('button',{name:'Update app',exact:true}).focus();
      await page.keyboard.press('Enter');
      await page.getByRole('button',{name:'Updating…'}).waitFor();
      assert.equal(await page.getByRole('button',{name:'Updating…'}).isDisabled(),true);
      assert.deepEqual(await page.evaluate(()=>window.lastWorkerMessage),{type:'SKIP_WAITING'});
      assert.equal(await page.evaluate(()=>sessionStorage.getItem('qa-loads')),before);
      await page.evaluate(()=>window.activateQaUpdate());
      await page.waitForFunction(before=>sessionStorage.getItem('qa-loads')!==before,before);
      await page.waitForFunction(()=>!!window.outbox);
      assert.equal(await page.evaluate(()=>localStorage.getItem('qa-saved-draft')),'synthetic saved draft');
      const records=await page.evaluate(partition=>window.outbox.listManualTradeOutbox(partition),partition);
      assert.equal(records.length,1); assert.equal(records[0].entries[0].localTime,'14:00:00'); assert.equal(records[0].state,'saved_on_device');
      // Another tab activating a worker must leave this page alone until requested.
      await notice.waitFor(); const externalBefore=await page.evaluate(()=>sessionStorage.getItem('qa-loads'));
      await page.evaluate(()=>window.activateQaUpdate());
      await page.getByRole('button',{name:'Reload app',exact:true}).waitFor();
      assert.equal(await page.evaluate(()=>sessionStorage.getItem('qa-loads')),externalBefore);
      assert.deepEqual(errors,[]);
      await page.screenshot({path:path.join(artifacts,appearance+'-'+viewport.width+'.png'),fullPage:true});
      results.push({appearance,viewport,status:'passed',checks:'pointer/keyboard hit tests, wrapping, actual Add trade account switch, dated timezone confirmation, explicit update, saved draft and IndexedDB outbox persistence, external activation stays manual'});
      await context.close();
    }
    console.log(JSON.stringify({artifacts,results},null,2));
  } finally { await browser.close(); }
}
run().catch(error=>{console.error(error);process.exitCode=1;});
