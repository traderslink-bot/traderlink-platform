const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),runtime='C:/Users/jerac/Documents/TraderLink/levels-system-post-mtf-handoff-stability';
const platformParent='e1adaf37e644099007563174850564c01359c313',runtimeParent='0a418a01488d52c2f1425fbaa7111dd679ed7b55';
const git=(cwd,args,input,index)=>cp.execFileSync('git',['-c',`safe.directory=${cwd.replaceAll('\\','/')}`,...args],{cwd,input,encoding:'utf8',maxBuffer:20e6,env:{...process.env,...(index?{GIT_INDEX_FILE:index}:{})}}).trimEnd();
const source=(cwd,parent,file)=>git(cwd,['show',`${parent}:${file}`])+'\n';
const edit=(text,from,to)=>{assert.equal(text.split(from).length,2,from);return text.replace(from,to);};
function prepare(){
 const platform=new Map(),changes=new Map();
 for(const name of ['state','store','receipts','service']){const file=`src/scripts/fixtures/watchlist-category-move-${name}.ts`;const text=fs.readFileSync(path.join(root,file),'utf8');platform.set(file,text);changes.set(`src/lib/alerts/watchlist-category-move-${name}.ts`,text);}
 const manager='src/lib/monitoring/manual-watchlist-runtime-manager.ts';let text=source(runtime,runtimeParent,manager);
 text='import { CategoryMoveService } from "../alerts/watchlist-category-move-service.js";\n'+text;
 text=edit(text,'  async moveSymbolToWatchlistGroup(',`  private categoryMoveService?: CategoryMoveService;
  private categoryMoves(){
    return this.categoryMoveService ??= new CategoryMoveService({
      entry:symbol=>this.watchlistStore.getEntry(symbol),review:symbol=>this.getTradersLinkAiReadReview(symbol)??null,
      place:(symbol,group)=>this.moveSymbolToWatchlistGroup(symbol,group as WatchlistGroup),
      send:input=>this.options.discordAlertRouter.routeApprovedAnalysisChunk(input),
      verify:(input,messageId,at)=>this.options.discordAlertRouter.verifyApprovedAnalysisMessage(input,messageId,at),
    });
  }
  getCategoryMoves(symbol:string){return this.categoryMoves().status(normalizeSymbol(symbol));}
  moveCategory(input:{symbol:string;id:string;to:string;notify:boolean;actor:string;messageId?:string}){return this.categoryMoves().execute(input);}

  async moveSymbolToWatchlistGroup(`);
 text=edit(text,'    const publication: ReviewPublication = frozenPublication','    const categoryMoveNote = this.categoryMoves().analysisNote(read.symbol,review.cycleId,review.approved?.at ?? 0);\n    const publication: ReviewPublication = frozenPublication');
 text=edit(text,'    const analysisUpdateContext = alreadyListed ? analysisUpdateContextForDraft(review, read.currentPrice) : undefined;\n    const categoryMoveNote = this.categoryMoves().analysisNote(read.symbol,review.cycleId,review.approved?.at ?? 0);','    const categoryMoveNote = this.categoryMoves().analysisNote(read.symbol,review.cycleId,review.approved?.at ?? 0);\n    const analysisUpdateContext = alreadyListed ? {...analysisUpdateContextForDraft(review, read.currentPrice), ...(categoryMoveNote ? {categoryMoveNote} : {})} : undefined;');
 text=edit(text,'discordChunks: renderApprovedAnalysisDiscord(read, alreadyListed, audience, analysisUpdateContext),','discordChunks: renderApprovedAnalysisDiscord(read, alreadyListed, audience, analysisUpdateContext).map((chunk,index)=>index===0&&categoryMoveNote ? chunk.replace("\\n", "\\n"+categoryMoveNote+"\\n") : chunk),');
 changes.set(manager,text);
 text=edit(text,'      store.acknowledgeDiscordChunk(input.cycleId, store.read(input.cycleId)!.head, approval.revision, index, receipt);',`      store.acknowledgeDiscordChunk(input.cycleId, store.read(input.cycleId)!.head, approval.revision, index, receipt);
      try{await this.categoryMoves().recordLateReceipt(symbol,input.cycleId,approval.body.publication.discordWatchlistGroup ?? 'main',receipt);}catch{console.warn('Late Discord receipt cleanup could not complete.');}`);
 changes.set(manager,text);
 const removal='src/lib/alerts/watchlist-discord-removal.ts';
 let removalText=source(runtime,runtimeParent,removal);
 removalText+=`\nexport function queueCategoryMoveRemovals(symbol:string,receipts:{channelId:string;messageId:string}[]){
  try{const state=read();if(!state.enabled)return;
  for(const receipt of receipts){if(!id(receipt.channelId)||!id(receipt.messageId))continue;if(!state.jobs.some(job=>job.channelId===receipt.channelId&&job.messageId===receipt.messageId))state.jobs.push({symbol,...receipt,state:'pending',message:''});}
  save(state);void drainDiscordRemovals();}catch{console.warn('Category move deletion receipts could not be queued.');}
}\n`;
 changes.set(removal,removalText);
 text=changes.get(manager).replace('import { queueDiscordRemoval }','import { queueDiscordRemoval, queueCategoryMoveRemovals }');
 text=edit(text,'    for (const item of removalReviews) queueDiscordRemoval(item.symbol,item.review);', '    for(const item of removalReviews)if(item.review)queueCategoryMoveRemovals(item.symbol,this.categoryMoves().removalReceipts(item.symbol,item.review.cycleId));\n    for (const item of removalReviews) queueDiscordRemoval(item.symbol,item.review);');
 changes.set(manager,text);
 const api='src/runtime/manual-watchlist-analysis-review-api.ts';text=source(runtime,runtimeParent,api);
 text=edit(text,'  "getTradersLinkAiReadReview" |','  "getCategoryMoves" | "moveCategory" | "getTradersLinkAiReadReview" |');
 text=edit(text,'export const ANALYSIS_REVIEW_PATHS = new Set([','export const ANALYSIS_REVIEW_PATHS = new Set([\n  "/api/watchlist/analysis-review/category-move",');
 const anchor='  if (input.pathname.endsWith("/discord-mentions")) {';
 text=edit(text,anchor,`  if(input.pathname.endsWith('/category-move')){
    try{
      if(input.method==='GET')return {status:200,body:{moves:manager.getCategoryMoves(input.searchParams.get('symbol')??'')}};
      if(input.method!=='POST')return {status:405,body:{error:'Method not allowed.'}};
      const body=input.body as Record<string,unknown>;
      if(!body||typeof body.symbol!=='string'||typeof body.id!=='string'||typeof body.to!=='string'||typeof body.notify!=='boolean'||(body.messageId!==undefined&&typeof body.messageId!=='string'))return {status:400,body:{error:'Invalid move request.'}};
      const move=await manager.moveCategory({symbol:body.symbol,id:body.id,to:body.to,notify:body.notify,actor:input.actor,messageId:body.messageId as string|undefined});
      return {status:200,body:{ok:true,move}};
    }catch{return {status:400,body:{error:'Move could not complete. Refresh the ticker list and check move delivery status before retrying.'}};}
  }
`+anchor);
 changes.set(api,text);
 // Existing move controls call the owner-authorized endpoint; identity survives polling/retry.
 const page='src/runtime/manual-watchlist-page.ts';text=source(runtime,runtimeParent,page);
 text=edit(text,'const pendingMoveGroups = new Map();','const pendingMoveGroups = new Map();\n    const moveNotifyChoices = new Map();\n    const moveRequests = new Map();');
 text=edit(text,'          const moveButton = document.createElement("button");',`          const notifyLabel=document.createElement('label'),notifyMove=document.createElement('input');
          notifyMove.type='checkbox';notifyMove.style.width='auto';notifyMove.checked=moveNotifyChoices.get(entry.symbol)===true;
          notifyMove.onchange=()=>moveNotifyChoices.set(entry.symbol,notifyMove.checked);
          notifyLabel.append(notifyMove,document.createTextNode(' Move Discord post and notify users'));
          actionGroups.move.append(notifyLabel);
          const moveButton = document.createElement("button");`);
 text=edit(text,'const response = await fetch("/api/watchlist/move-to-list", {',`let request=moveRequests.get(entry.symbol);
              if(!request||request.to!==moveSelect.value||request.notify!==notifyMove.checked){request={symbol:entry.symbol,id:crypto.randomUUID(),to:moveSelect.value,notify:notifyMove.checked};moveRequests.set(entry.symbol,request);}
              const response = await fetch("/api/watchlist/analysis-review/category-move", {`);
 text=edit(text,'body: JSON.stringify({\n                  symbol: entry.symbol,\n                  watchlistGroup: moveSelect.value,\n                }),','body: JSON.stringify(request),');
 text=edit(text,'const response = await fetch("/api/watchlist/analysis-review/category-move", {\n                method: "POST",\n                headers: { "Content-Type": "application/json" },','const response = await fetch("/api/watchlist/analysis-review/category-move", {\n                method: "POST",\n                headers: { "Content-Type": "application/json", "x-traderlink-journal-admin-request":"1" },');
 text=edit(text,'"Moved " + payload.entry.symbol + " to " +\n                moveSelect.options[moveSelect.selectedIndex].text +\n                " without deactivating it.",','payload.move.notice || "Moved " + entry.symbol + " to " + moveSelect.options[moveSelect.selectedIndex].text,');
 text=edit(text,'                pendingMoveGroups.delete(entry.symbol);',`                if(payload.move.destination==='confirmed'||payload.move.destination==='skipped'){moveRequests.delete(entry.symbol);moveNotifyChoices.delete(entry.symbol);}
                pendingMoveGroups.delete(entry.symbol);`);
 text=edit(text,'          actionGroups.move.appendChild(moveButton);',`          actionGroups.move.appendChild(moveButton);
          const moveDetails=document.createElement('button');moveDetails.type='button';moveDetails.className='secondary';moveDetails.textContent='Move delivery details';
          moveDetails.onclick=async()=>{
            const dialog=document.createElement('dialog');dialog.style.maxWidth='min(520px,92vw)';
            const heading=document.createElement('h2');heading.textContent=entry.symbol+' — Move delivery';
            const message=document.createElement('p');message.setAttribute('role','status');message.textContent='Loading…';
            const retry=document.createElement('button');retry.type='button';retry.textContent='Retry move delivery';retry.hidden=true;
            const receipt=document.createElement('input');receipt.placeholder='Discord message ID';receipt.setAttribute('aria-label','Existing Discord message ID');receipt.hidden=true;
            const verify=document.createElement('button');verify.type='button';verify.textContent='Confirm existing Discord post';verify.hidden=true;
            const refresh=document.createElement('button');refresh.type='button';refresh.textContent='Refresh status';
            const close=document.createElement('button');close.type='button';close.textContent='Close';close.onclick=()=>dialog.close();
            dialog.append(heading,message,retry,receipt,verify,refresh,close);document.body.append(dialog);dialog.addEventListener('close',()=>dialog.remove());dialog.showModal();
            const position=()=>{if(window.parent===window||!window.frameElement)return;const frame=window.frameElement.getBoundingClientRect(),top=Math.max(0,-frame.top),bottom=Math.min(window.innerHeight,window.parent.innerHeight-frame.top);dialog.style.position='fixed';dialog.style.margin='0 auto';dialog.style.left='0';dialog.style.right='0';dialog.style.top=(top+12)+'px';dialog.style.maxHeight=Math.max(120,bottom-top-24)+'px';};position();
            let latest,busy=false;
            const load=async(body)=>{if(busy)return;busy=true;retry.disabled=verify.disabled=refresh.disabled=true;
              try{const response=await fetch('/api/watchlist/analysis-review/category-move'+(body?'':'?symbol='+encodeURIComponent(entry.symbol)),{method:body?'POST':'GET',cache:'no-store',headers:body?{'Content-Type':'application/json','x-traderlink-journal-admin-request':'1'}:{},body:body?JSON.stringify(body):undefined});const result=await response.json();if(!response.ok)throw Error(result.error||'Move status unavailable.');
                if(body){message.textContent=result.move.notice;return;}
                latest=result.moves.at(-1);message.textContent=latest?(latest.notice||'Move delivery is pending.'):'No move delivery recorded.';
                retry.hidden=!latest||!latest.current||!latest.notify||!latest.published||['sending','uncertain','skipped'].includes(latest.destination)||latest.destination==='confirmed'&&!latest.cleanupFailed&&latest.notification==='confirmed';
                retry.textContent=latest?.destination==='confirmed'?'Retry cleanup':'Retry move delivery';receipt.hidden=verify.hidden=!latest||!latest.current||!['sending','uncertain'].includes(latest.destination);
              }catch(error){message.textContent=String(error.message||error);}finally{busy=false;retry.disabled=verify.disabled=refresh.disabled=false;position();}
            };
            retry.onclick=async()=>{if(latest){await load({symbol:entry.symbol,id:latest.id,to:latest.to,notify:latest.notify});await load();}};
            verify.onclick=async()=>{if(latest&&/^\\d{17,20}$/.test(receipt.value.trim())){await load({symbol:entry.symbol,id:latest.id,to:latest.to,notify:latest.notify,messageId:receipt.value.trim()});await load();}};
            refresh.onclick=()=>load();await load();
          };actionGroups.more.append(moveDetails);`);
 changes.set(page,text);
 // Owner-authorized proxy + durable member intent before the runtime side effect.
 const proxy='app/api/admin/watchlist/runtime/[...path]/route.ts';text=source(root,platformParent,proxy);
 text='import { recordCategoryMoveIntent } from "@/src/modules/watchlist/server/notifications/watchlist-category-move-notifications";\n'+text;
 text=edit(text,'const GET_PATHS = new Set([','const GET_PATHS = new Set([\n  "/api/watchlist/analysis-review/category-move",');
 text=edit(text,'const POST_PATHS = new Set([','const POST_PATHS = new Set([\n  "/api/watchlist/analysis-review/category-move",');
 text=edit(text,'  const result = await requestWatchlistRuntimeRaw({',`  if(pathname==='/api/watchlist/analysis-review/category-move'&&method==='POST'&&reviewActor&&body){
    try{recordCategoryMoveIntent(body,reviewActor);}catch{return Response.json({error:'Member notification request could not be saved. Move with notifications off, or retry.'},{status:503});}
  }
  const result = await requestWatchlistRuntimeRaw({`);
 platform.set(proxy,text);
 for(const [cwd,parent,map,file] of [[root,platformParent,platform,'src/modules/watchlist/server/notifications/watchlist-analysis-update-copy.ts'],[runtime,runtimeParent,changes,'src/lib/ai/watchlist-analysis-update-context.ts']]){
  let helper=source(cwd,parent,file);helper=edit(helper,'  automatic: boolean;','  automatic: boolean;\n  categoryMoveNote?: string;');
  helper=edit(helper,'return { automatic: item.automatic, firstAnalysisPrice:', 'return { ...(typeof item.categoryMoveNote === "string" && /^Now on (Overnight Watches|Main Session|Top Regular Hour Watches|Post-Market|General Watchlist|Swings)\\.$/.test(item.categoryMoveNote) ? {categoryMoveNote:item.categoryMoveNote} : {}), automatic: item.automatic, firstAnalysisPrice:');
  map.set(file,helper);
 }
 const contract='src/modules/watchlist/server/notifications/watchlist-publication-notification-contract.ts';text=source(root,platformParent,contract);
 text=edit(text,'comparison ?? ANALYSIS_UPDATE_EXPLANATION','[context?.categoryMoveNote,comparison ?? ANALYSIS_UPDATE_EXPLANATION].filter(Boolean).join("\\n")');
 text=edit(text,'[comparison, ANALYSIS_UPDATE_EXPLANATION]','[context?.categoryMoveNote,comparison, ANALYSIS_UPDATE_EXPLANATION]');platform.set(contract,text);
 const transport='src/modules/watchlist/server/notifications/watchlist-notification-delivery.ts';text=source(root,platformParent,transport);
 text=edit(text,'async function send(database: Database.Database, row: Delivery): Promise<SendResult> {','export async function sendWatchlistNotification(database: Database.Database, row: Delivery, override?: ReturnType<typeof watchlistPublicationNotificationCopy>): Promise<SendResult> {');
 text=edit(text,'const copy = watchlistPublicationNotificationCopy(', 'const copy = override ?? watchlistPublicationNotificationCopy(');
 text=edit(text,'= send,','= sendWatchlistNotification,');platform.set(transport,text);
 const workers='src/modules/platform/server/runtime/traderlink-hosted-background-workers.ts';text=source(root,platformParent,workers);
 text='import { runCategoryMoveNotifications } from "@/src/modules/watchlist/server/notifications/watchlist-category-move-notifications";\n'+text;
 text=edit(text,'const runWatchlistDelivery = () => void runWatchlistNotificationDelivery().catch(', 'const runWatchlistDelivery = () => { void runCategoryMoveNotifications().catch(() => console.error("Watchlist move notifications failed.")); return void runWatchlistNotificationDelivery().catch(');
 text=edit(text,'console.error("Watchlist notification delivery check failed."));','console.error("Watchlist notification delivery check failed.")); };');platform.set(workers,text);
 const migration='src/modules/platform/server/database/migrations/0153_platform_watchlist_category_move_notifications.ts';platform.set(migration,fs.readFileSync(path.join(root,migration),'utf8'));
 const manifest='src/modules/platform/server/database/platform-migration-manifest.ts';text=source(root,platformParent,manifest);
 text='import { platformWatchlistCategoryMoveNotificationsMigration } from "./migrations/0153_platform_watchlist_category_move_notifications";\n'+text;
 const predecessor='migration: platformWatchlistNotificationUpdateContextMigration }),';
 text=edit(text,predecessor,predecessor+'\n    Object.freeze({ sourcePath: "'+migration+'", migration: platformWatchlistCategoryMoveNotificationsMigration }),');platform.set(manifest,text);
 for(const file of ['src/modules/watchlist/server/notifications/watchlist-category-move-notifications.ts','src/scripts/package-watchlist-category-move.cjs','src/scripts/verify-watchlist-category-move-state.cjs','src/scripts/verify-watchlist-category-move-integration.cjs','src/scripts/verify-watchlist-category-move-types.cjs','docs/migration/watchlist-admin-interaction-audit.md','docs/migration/watchlist-editor-and-category-move-plan.md','docs/migration/watchlist-editor-and-category-move-progress.md'])platform.set(file,fs.readFileSync(path.join(root,file),'utf8'));
 const help='src/modules/help/watchlist-guides.ts';text=source(root,platformParent,help);
 text=edit(text,'Potential Gain keeps the original Watchlist starting price;', 'Moving a ticker normally changes its list only. Select Move Discord post and notify users to announce its destination and notify opted-in members; source-category Discord posts are deleted after the new post is confirmed. Free Chat and X are unchanged. Move delivery details provides delivery and cleanup retry controls. An analysis update after a move keeps its original/update price context and identifies the new list. Potential Gain keeps the original Watchlist starting price;');platform.set(help,text);
 const register='docs/migration/migration-register.md';platform.set(register,source(root,platformParent,register)+'\n\n## Reserved 0153 — Watchlist category move notifications\n\n`0153_platform_watchlist_category_move_notifications`, order153, predecessor0152. Two additive empty tables for explicit category-move intents and member deliveries. No historical sends or changes to analysis/listing event identities. Registered, not applied.\n');
 return {platform,changes};
}
module.exports={prepare,root,runtime,platformParent,runtimeParent};
function checkpoint(cwd,parent,files,label){
 const index=path.join(root,`data/category-move-${label}.index`);git(cwd,['read-tree',parent],undefined,index);
 for(const[file,text]of files){const blob=git(cwd,['hash-object','-w','--stdin'],text,index);git(cwd,['update-index','--add','--cacheinfo',`100644,${blob},${file}`],undefined,index);}
 git(cwd,['diff','--cached','--check',parent],undefined,index);
 const sha=git(cwd,['commit-tree',git(cwd,['write-tree'],undefined,index),'-p',parent,'-m','Add optional category move delivery and preserve analysis update context'],undefined,index);
 git(cwd,['update-ref',`refs/codex/watchlist-category-move-${label}`,sha],undefined,index);return sha;
}
if(require.main===module){const{platform,changes}=prepare();console.log(JSON.stringify({platformParent,runtimeParent,platform:[...platform.keys()],runtime:[...changes.keys()]}));if(process.argv.includes('--commit'))console.log(JSON.stringify({platform:checkpoint(root,platformParent,platform,'platform'),runtime:checkpoint(runtime,runtimeParent,changes,'runtime')}));}
