/** Real composer script + real copy builder, isolated browser/transport only. */
const assert=require('node:assert/strict'), fs=require('node:fs'), path=require('node:path'), os=require('node:os'), vm=require('node:vm');
const ts=require('typescript'), {chromium}=require('@playwright/test');
const root=path.resolve(__dirname,'../..'), runtime=path.resolve(root,'../watchlist-alpaca-runtime-qa');
function load(file) {
  const exports={};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText,
    {exports,require:id=>{if(id==='server-only')return {};if(id==='./manual-watchlist-json-response.js')return load(path.join(path.dirname(file),'manual-watchlist-json-response.ts'));throw Error('Unexpected import: '+id);}});
  return exports;
}
const rowSource=fs.readFileSync(path.join(runtime,'src/runtime/manual-watchlist-row-review.ts'),'utf8');
const row=load(path.join(runtime,'src/runtime/manual-watchlist-row-review.ts')).WATCHLIST_ROW_REVIEW;
const script=row.match(/<script>([\s\S]*?)<\/script>/)[1];
const css=row.match(/<style>([\s\S]*?)<\/style>/)[1];
const {freeChatPreview}=load(path.join(root,'src/modules/watchlist/server/notifications/watchlist-free-chat-delivery.ts'));
const output=fs.mkdtempSync(path.join(os.tmpdir(),'watchlist-free-chat-images-'));
(async()=>{
  const browser=await chromium.launch({headless:true});
  let cases=0,unexpected=0;
  try {
    for(const [name,width,height] of [['desktop',1440,900],['portrait',390,844],['landscape',844,390]]) {
      for(const flags of (name==='desktop'?[0,1,2,3,4,5,6,7]:[0,1,2])) for(const mode of ['manual','approval','move','published']) {
        const visibility={ticker:!!(flags&1),analysis:!!(flags&2),levels:!!(flags&4)};
        const page=await browser.newPage({viewport:{width,height}}),writes=[];
        let saved=null;
        const preview=()=>freeChatPreview('TEST',true,visibility,undefined,false,mode==='move'?'postmarket':undefined,saved?.includeImages===true);
        await page.route('**/*',async route=>{
          const request=route.request(),url=new URL(request.url());
          if(url.origin!=='https://watchlist-images.test'){unexpected++;return route.abort();}
          if(url.pathname==='/')return route.fulfill({contentType:'text/html',body:'<style>'+css+'</style><main id="actions"></main>'});
          if(url.pathname.endsWith('/queue'))return route.fulfill({json:{tickers:[]}});
          if(!url.pathname.endsWith('/free-chat')){unexpected++;return route.abort();}
          if(request.method()==='POST'){const input=request.postDataJSON();writes.push(input);saved??={message:input.message,includeImages:input.includeImages};}
          return route.fulfill({json:{preview:preview(),cycleId:'cycle',draftRevision:2,approvalRevision:3,
            savedMessage:saved?.message,savedIncludeImages:saved?.includeImages??false,automaticEnabled:false,delivery:saved?{state:'pending'}:null}});
        });
        await page.goto('https://watchlist-images.test/');
        await page.addScriptTag({content:script});
        if(mode==='manual') {
          await page.evaluate(()=>window.watchlistRowReview.attach({symbol:'TEST',watchlistGroup:'main',publicationReview:{cycleId:'cycle',required:false}},document.querySelector('#actions')));
          await page.getByRole('button',{name:'Post to Free Chat',exact:true}).click();
        } else {
          await page.evaluate(mode=>{window.choice=window.watchlistConfirmFreeChat('TEST',mode,mode==='published'?3:undefined,mode==='move'?'postmarket':undefined);},mode);
        }
        const dialog=page.getByRole('dialog'),images=dialog.getByRole('checkbox',{name:'Include analysis images',exact:true});
        await images.waitFor();
        assert.equal(await images.isChecked(),false);
        assert.equal(await images.isDisabled(),flags!==0);
        assert.equal(writes.length,0);
        assert(!(await dialog.innerText()).includes('Analysis images will be attached'));
        const text=dialog.locator('textarea');
        if(mode==='manual'||mode==='approval')await text.fill('My custom comment.');
        if(flags===0)await images.check();
        if(mode==='manual'||mode==='approval')assert.equal(await text.inputValue(),'My custom comment.');
        await dialog.getByRole('button',{name:'Confirm Free Chat post',exact:true}).click();
        if(mode==='manual') {
          await page.waitForFunction(()=>document.querySelector('[role="status"]')?.textContent.includes('Queued'));
          assert.equal(writes.length,1);assert.equal(writes[0].includeImages,flags===0);
          assert.equal(writes[0].message,'My custom comment.');
          assert.equal(await images.isDisabled(),true);
        } else {
          const selected=await page.evaluate(async()=>{const confirmed=await window.choice;return{confirmed,copy:window.watchlistConfirmedFreeChatCopy('TEST')};});
          assert.equal(selected.confirmed,true);assert.equal(selected.copy.includeImages,flags===0);
          if(mode==='approval')assert.equal(selected.copy.message,'My custom comment.');
          assert.equal(writes.length,0,'Confirmation alone must not enqueue publication');
        }
        if(flags===0&&mode==='manual')await page.screenshot({path:path.join(output,name+'.png'),fullPage:true});
        await page.close();cases++;
      }
    }
    assert.equal(unexpected,0);
    const result={cases,unexpectedRequests:unexpected,realDeliveryRequests:0,output,rowSourceBytes:Buffer.byteLength(rowSource)};
    fs.writeFileSync(path.join(output,'result.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
