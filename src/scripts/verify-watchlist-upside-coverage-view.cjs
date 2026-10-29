// Offline actual-component QA. No app server, provider, session or delivery.
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const ts = require('typescript'), {build} = require('esbuild'), {chromium} = require('playwright');
const root = path.resolve(__dirname, '../..');
(async () => {
  const fixtureText = fs.readFileSync(path.join(root,'src/lib/live-watchlist/__tests__/traderslink-ai-read.test.ts'),'utf8');
  const ast = ts.createSourceFile('fixture.ts',fixtureText,ts.ScriptTarget.Latest,true);
  const fixtureFunctions = ast.statements.filter(n=>ts.isFunctionDeclaration(n)&&['validBody','validV3Body'].includes(n.name?.text)).map(n=>n.getText(ast)).join('\n');
  const fixture = vm.runInNewContext(fixtureFunctions+'\nJSON.parse(validV3Body())');
  fixture.symbol='SAMPLE'; fixture.generatedAt=fixture.dataAsOf=Date.UTC(2026,9,28,19);
  const bundle = await build({stdin:{resolveDir:root,loader:'tsx',contents:`
    import React from 'react'; import {createRoot} from 'react-dom/client';
    import {TradersLinkAiReadCard} from './app/watchlist/live-watchlist-client';
    import {PremiumAnalysisCard} from './app/watchlist/premium-analysis-card';
    import {watchlistDetailProjection} from './src/lib/live-watchlist/watchlist-member-projection';
    import {evaluateUpsideCoverage} from './src/lib/live-watchlist/watchlist-upside-coverage';
    import {mergeAnalysisEdit} from './src/lib/live-watchlist/analysis-inline-edit';
    const original=${JSON.stringify(fixture)};
    const at=original.dataAsOf,bar=t=>({timestamp:t,open:1,high:1.3,low:.9,close:1.2});
    const coverage=evaluateUpsideCoverage({symbol:'SAMPLE',currentPrice:2,dataAsOf:at,
      priceAction:{recentDailyBars:[bar(at-3*86400000),bar(at-86400000)],recentFiveMinuteBars:[bar(at-900000),bar(at-600000)]}});
    const root=createRoot(document.getElementById('root'));
    window.mount=(format='simple',theme='light',variant='exhausted')=>{
      let read=structuredClone(original);read.analysisFormat=format;
      read.simpleAnalysis={setup:'An active move above earlier supply.',pullbacks:[{low:1.1,high:1.2,explanation:'Earlier base.',confirmation:'Fresh buyer defense.',invalidation:null}],
        upside:[],breakout:null,invalidation:null};
      read.targets=[];read.upsideCoverage=coverage;
      let context,editor;
      if(['legacy','editor'].includes(variant)){
        delete read.upsideCoverage;read.targets=[{label:'Original',price:1.8,condition:'Original observed high.'}];
        read.simpleAnalysis.upside=[{low:1.8,high:1.8,explanation:'Original observed high.'}];
        context={analysisGeneratedAt:at,analysisReferencePrice:read.currentPrice,targetPrices:[1.8],coverage};
        if(variant==='editor')editor=()=>null;
      }
      if(variant==='owner')read=mergeAnalysisEdit(read,format==='simple'?{simpleAnalysis:{...read.simpleAnalysis,upside:[{low:3.25,high:3.25,explanation:'My target.'}]}}:
        {targets:[{label:'My target',price:3.25,condition:'Owner plan.'}]});
      if(variant==='hidden')read.ownerHiddenSections=['targets'];
      if(variant==='unavailable')read.upsideCoverage={...coverage,status:'HISTORY_UNAVAILABLE',upperRefreshPolicy:'DEFAULT'};
      const state={symbol:'SAMPLE',cards:{tradersLinkAiRead:{body:JSON.stringify(read),updatedAt:at}},analysisUpsideContext:context};
      const denied=watchlistDetailProjection(state,true,false);
      root.render(<div className="academy-shell" data-academy-theme={theme} style={{padding:16,minHeight:'100vh'}}>
        <div className="watchlist-card-grid">{variant==='denied'?<PremiumAnalysisCard preview={denied.premiumAnalysisPreview} symbol="SAMPLE"/>:
          <TradersLinkAiReadCard card={state.cards.tradersLinkAiRead} symbol={{marketDataStatus:'closed',analysisUpsideContext:context}} livePrice={2}
            renderSectionEditor={editor} historicalRows={[]}/>}</div></div>);
      window.currentRead=read;
    };window.mount();
  `},bundle:true,write:false,outdir:path.join(root,'artifacts/upside-coverage/bundle'),platform:'browser',format:'iife',logLevel:'silent',loader:{'.svg':'dataurl'},define:{'process.env.NODE_ENV':'"production"'},
    plugins:[{name:'isolate-actual-analysis-component',setup(build){
      build.onLoad({filter:/[/\\]live-watchlist-client\.tsx$/},args=>{
        // Keep the actual exported card and its transitive lexical helpers.
        // Other page features import server-owned contracts; they are outside
        // this offline component harness, not replaced by fake UI.
        const source=ts.createSourceFile(args.path,fs.readFileSync(args.path,'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
        const named=source.statements.filter(n=>!ts.isImportDeclaration(n));
        const names=n=>ts.isVariableStatement(n)?n.declarationList.declarations.flatMap(d=>ts.isIdentifier(d.name)?[d.name.text]:[]):n.name&&ts.isIdentifier(n.name)?[n.name.text]:[];
        const refs=new Set(['TradersLinkAiReadCard']),selected=new Set();
        let changed=true;
        while(changed){changed=false;for(const statement of named)if(!selected.has(statement)&&names(statement).some(n=>refs.has(n))){
          selected.add(statement);changed=true;const visit=n=>{if(ts.isIdentifier(n))refs.add(n.text);ts.forEachChild(n,visit)};visit(statement);
        }}
        const imports=source.statements.filter(ts.isImportDeclaration).filter(n=>{
          const clause=n.importClause;
          if(!clause)return /flag-icons/.test(n.moduleSpecifier.text);
          return clause.name&&refs.has(clause.name.text)||clause.namedBindings&&
            (ts.isNamespaceImport(clause.namedBindings)?refs.has(clause.namedBindings.name.text):clause.namedBindings.elements.some(e=>refs.has(e.name.text)));
        });
        return {contents:[...imports,...selected].map(n=>n.getText(source)).join('\n'),loader:'tsx',resolveDir:path.dirname(args.path)};
      });
    }}]});
  const browser=await chromium.launch({headless:true}),errors=[],requests=[];
  try {
    const page=await browser.newPage(),output=path.join(root,'artifacts/upside-coverage');
    fs.mkdirSync(output,{recursive:true});
    page.on('pageerror',e=>errors.push(e.message));
    await page.route('**/*',route=>{
      if(route.request().url()==='https://coverage-view.invalid/')return route.fulfill({contentType:'text/html',body:'<div id="root"></div>'});
      requests.push(route.request().url());return route.abort();
    });
    await page.goto('https://coverage-view.invalid/');
    await page.addStyleTag({content:fs.readFileSync(path.join(root,'node_modules/tailwindcss/preflight.css'),'utf8')});
    await page.addStyleTag({content:fs.readFileSync(path.join(root,'app/globals.css'),'utf8').replace('@import "tailwindcss";','')});
    await page.addScriptTag({content:'globalThis.process={env:{NODE_ENV:"production"}};'});
    for(const file of bundle.outputFiles.filter(f=>f.path.endsWith('.css')))await page.addStyleTag({content:file.text});
    await page.addScriptTag({content:bundle.outputFiles.find(f=>f.path.endsWith('.js')).text});
    const noHigher='No higher resistance is identified in the supplied price history.';
    for(const format of ['simple','current'])for(const theme of ['light','dark'])for(const width of [1100,390]){
      await page.setViewportSize({width,height:900});
      await page.evaluate(args=>window.mount(...args),[format,theme,'exhausted']);
      await page.getByText(noHigher,{exact:true}).waitFor();
      assert.equal(await page.getByRole('heading',{name:'Potential Targets (Volume Dependent)',exact:true}).count(),1);
      const geometry=await page.locator('body').evaluate(e=>({scroll:e.scrollWidth,width:innerWidth}));
      assert.ok(geometry.scroll<=geometry.width+1,JSON.stringify({format,theme,...geometry}));
      const colors=await page.getByText(noHigher,{exact:true}).evaluate(e=>({text:getComputedStyle(e).color,background:getComputedStyle(e.closest('article')).backgroundColor}));
      assert.notEqual(colors.text,colors.background);
      if(width===390)await page.screenshot({path:path.join(output,format+'-'+theme+'.png'),fullPage:true});
    }
    for(const format of ['simple','current']){
      await page.evaluate(args=>window.mount(...args),[format,'light','legacy']);
      await page.getByText('Current market context — the original analysis is unchanged.',{exact:true}).waitFor();
      await page.evaluate(args=>window.mount(...args),[format,'light','editor']);
      await page.getByText(/^\$1\.80?$/).waitFor();assert.equal(await page.getByText(noHigher,{exact:true}).count(),0);
      await page.evaluate(args=>window.mount(...args),[format,'light','owner']);
      await page.getByText('$3.25',{exact:true}).waitFor();assert.equal(await page.getByText(noHigher,{exact:true}).count(),0);
      await page.evaluate(args=>window.mount(...args),[format,'light','unavailable']);
      await page.getByText('Higher targets could not be determined from the available price data.',{exact:true}).waitFor();
      await page.evaluate(args=>window.mount(...args),[format,'light','hidden']);
      await page.waitForFunction(()=>!document.body.innerText.includes('Potential Targets (Volume Dependent)'));
      await page.evaluate(args=>window.mount(...args),[format,'light','denied']);
      await page.getByText('View plans with this feature',{exact:true}).waitFor();
      assert.equal(await page.getByText(noHigher,{exact:true}).count(),0);
    }
    assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);
    console.log('PASS: actual simple/detailed cards, desktop/mobile Light/Navy Dark, deterministic empty/unavailable panels, current-context label, frozen editor, owner targets, hidden section and Premium projection. Zero provider/network effects.');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
