// Exact-parent overlays: never copy the dirty checkout into a release.
const cp=require('node:child_process'),assert=require('node:assert/strict');
const runtime='C:/Users/jerac/Documents/TraderLink/levels-system-post-mtf-handoff-stability';
const parents={platform:'25721454e89fea5343841006aafc92700536ee90',runtime:'d10aeb996219fca02d4e607ede2eb696b79595be'};
function source(lane,file){return cp.execFileSync('git',['-c',`safe.directory=${runtime}`,...(lane==='runtime'?['-C',runtime]:[]),'show',`${parents[lane]}:${file}`],{encoding:'utf8',maxBuffer:20e6});}
function once(s,a,b){assert.equal(s.split(a).length,2,a.slice(0,120));return s.replace(a,b);}
function groupContracts(s){
 s=s.replaceAll('| "swings"','| "private" | "swings"');
 s=s.replace(/([\w.]+) === "swings"/g,'$1 === "private" || $1 === "swings"');
 s=s.replace(/([\w.]+) !== "swings"/g,'$1 !== "private" && $1 !== "swings"');
 return s;
}
function prepare(){
 const result={platform:new Map(),runtime:new Map()};
 const edit=(lane,p,fn)=>{const old=source(lane,p),next=fn(old);assert.notEqual(old,next,p);result[lane].set(p,next);};
 for(const p of ['src/lib/live-watchlist/live-watchlist-session-group.ts','src/lib/live-watchlist/live-watchlist-store.ts','src/lib/live-watchlist/live-watchlist-types.ts'])edit('platform',p,groupContracts);
 for(const p of ['src/lib/live-watchlist/live-watchlist-audit-archive.ts','src/lib/live-watchlist/live-watchlist-publisher.ts','src/lib/live-watchlist/live-watchlist-types.ts','src/lib/monitoring/monitoring-types.ts','src/lib/monitoring/watchlist-entry-session.ts','src/lib/monitoring/watchlist-state-persistence.ts','src/lib/monitoring/watchlist-store.ts','src/runtime/manual-watchlist-server.ts'])edit('runtime',p,groupContracts);
 edit('runtime','src/runtime/manual-watchlist-page.ts',s=>{
  s=groupContracts(s);
  s=once(s,'<option value="swings">Swings</option>','<option value="swings">Swings</option><option value="private">Private</option>');
  s=once(s,'<ul id="swings-list"></ul>','<ul id="swings-list"></ul></div><div class="watchlist-admin-group"><div class="watchlist-group-heading"><h3>Private</h3><button class="danger" id="remove-private-tickers-button" type="button">Clear Private</button></div><ul id="private-list"></ul>');
  s=once(s,'document.getElementById("remove-swings-tickers-button").addEventListener','document.getElementById("remove-private-tickers-button").addEventListener("click", () => deactivateTickerGroup("private", "Private"));\n    document.getElementById("remove-swings-tickers-button").addEventListener');
  s=once(s,'swings: document.getElementById("swings-list"),','swings: document.getElementById("swings-list"), private: document.getElementById("private-list"),');
  s=once(s,'["swings", "Swings"],','["swings", "Swings"], ["private", "Private"],');
  s=once(s,'swings: "No Swings tickers are active.",','swings: "No Swings tickers are active.", private: "No Private tickers are active.",');
  return s;
 });
 edit('runtime','src/lib/monitoring/manual-watchlist-runtime-manager.ts',s=>{
  s=groupContracts(s);
  s=once(s,'if (input.generateAnalysis === false) return true;','if (input.watchlistGroup === "private" || input.generateAnalysis === false) return true;');
  s=once(s,'      if (!entry?.publicationReview) return true;','      if (entry?.watchlistGroup === "private") return false;\n      if (!entry?.publicationReview) return true;');
  s=once(s,'    if (isWatchlistRemovalPatch(patch)) return true;',`    if (entry?.watchlistGroup === "private" && "watchlistGroup" in patch && patch.watchlistGroup === "private" && "cards" in patch && Object.keys(patch.cards ?? {}).length === 0) return true;
    if (entry?.watchlistGroup === "private") return false;
    if (isWatchlistRemovalPatch(patch)) return true;`);
  // All explicit approval/delivery paths recheck placement; private drafts remain editable.
  for(const signature of ['async approveTradersLinkAiReadForWebsite(', 'async publishTickerWithoutAnalysis(', 'async publishApprovedTradersLinkAiReadToDiscord(', 'async exportFreeChatPublication(']){
   const at=s.indexOf(signature);assert(at>=0,signature);
   const anchor='    const symbol = normalizeSymbol(input.symbol);',pos=s.indexOf(anchor,at);assert(pos>at&&pos-at<1800,signature);
   s=s.slice(0,pos)+s.slice(pos).replace(anchor,anchor+'\n    if (this.watchlistStore.getEntry(symbol)?.watchlistGroup === "private") throw new Error("Move this ticker out of Private before publishing.");');
  }
  s=once(s,'    if (input.publish && !listed)', '    if (entry.watchlistGroup === "private") input = { ...input, publish: false };\n    if (input.publish && !listed)');
  s=once(s,'notifyUsers: alreadyListed ? input.notifyUsers === true : true,','notifyUsers: alreadyListed ? input.notifyUsers === true : input.notifyUsers !== false,');
  s=once(s,'website: { ...preview.publication.website,','website: { ...preview.publication.website, watchlistGroup: entry.watchlistGroup,');
  s=once(s,'    delete snapshot.cards.tradersLinkAiRead;','    snapshot.watchlistGroup = entry.watchlistGroup;\n    delete snapshot.cards.tradersLinkAiRead;');
  // Publish an empty private marker before any asynchronous quote or generation work.
  s=once(s,'    const assertCurrent = () => {',`    if (input.watchlistGroup === "private") await this.liveWatchlistPublisher?.publish({symbol,updatedAt:now,watchlistGroup:"private",cards:{}});
    const assertCurrent = () => {`);
  // Private transitions never enter ordinary moved-from category notification code.
  const old='moveCategory(input:{symbol:string;id:string;to:string;notify:boolean;actor:string;messageId?:string;discordText?:string}){return this.categoryMoves().execute(input);}';
  s=once(s,old,`async moveCategory(input:{symbol:string;id:string;to:string;notify:boolean;actor:string;messageId?:string;discordText?:string}){
    const symbol=normalizeSymbol(input.symbol),entry=this.watchlistStore.getEntry(symbol);
    if(watchlistGroupForActivation({symbol,watchlistGroup:input.to as WatchlistGroup})!==input.to)throw new Error("Invalid Watchlist category.");
    if(input.to!=="private"&&entry?.watchlistGroup!=="private")return this.categoryMoves().execute(input);
    await this.moveSymbolToWatchlistGroup(symbol,input.to as WatchlistGroup);
    return {notice:input.to==="private"?"Moved to Private. Only you can see this ticker.":"Moved. Review and publish when ready.",destination:"skipped"};
  }`);
  s=once(s,'    // Moving changes placement only:',`    if (watchlistGroup === "private") {
      const store=this.options.tradersLinkAiReadReviewStore;
      if(!store || !this.liveWatchlistPublisher) throw new Error("Private storage is unavailable.");
      const previous=this.getTradersLinkAiReadReview(symbol),draft=previous?.draft;
      const cycleId=randomUUID();store.begin(cycleId,symbol,true,"runtime:private:"+(previous?.cycleId??""));
      if(draft && (draft.body.kind==="original"||draft.body.kind==="edit")) store.saveDraft({cycleId,expectedHead:store.read(cycleId)!.head,actor:"runtime:private",payload:draft.body.payload});
      const now=this.options.now?.()??Date.now();
      const moved=this.watchlistStore.patchEntry(symbol,{watchlistGroup,publicationReview:{cycleId,required:true},discordThreadId:null})!;
      this.persistWatchlist();
      await this.liveWatchlistPublisher.publish({symbol,updatedAt:now,watchlistGroup:"private",cards:{}});
      return moved;
    }
    // Moving changes placement only:`);
  s=once(s,'    for (const item of removalReviews) queueDiscordRemoval(item.symbol,item.review);',`    for (const item of removalReviews) {
      queueDiscordRemoval(item.symbol,item.review);
      let ancestor=item.review;const seen=new Set<string>();
      while(ancestor){
        const actor=ancestor.events[0]?.actor??"";
        const previous=actor.startsWith("runtime:private:")?actor.slice("runtime:private:".length):"";
        if(!previous||seen.has(previous))break;seen.add(previous);
        ancestor=this.options.tradersLinkAiReadReviewStore?.read(previous)??null;
        if(ancestor){queueDiscordRemoval(item.symbol,ancestor);queueCategoryMoveRemovals(item.symbol,this.categoryMoves().removalReceipts(item.symbol,ancestor.cycleId));}
      }
    }`);
  return s;
 });
 // Existing row/editor stays available; publication buttons are not meaningful in Private.
 edit('runtime','src/runtime/manual-watchlist-row-review.ts',s=>{
  s=once(s,'function attachX(entry, actions, state, more = actions) {','function attachX(entry, actions, state, more = actions) {\n  if(entry.watchlistGroup === "private")return;');
  s=once(s,'more.append(gainPost);','if(entry.watchlistGroup !== "private") more.append(gainPost);');
  s=once(s,'more.append(free);','if(entry.watchlistGroup !== "private") more.append(free);');
  s=once(s,'if(state?.canReview&&hasPublishableDraft(state)){','if(entry.watchlistGroup !== "private" && state?.canReview&&hasPublishableDraft(state)){');
  s=once(s,'if (state?.canReview && hasPublishableDraft(state)) {','if (entry.watchlistGroup !== "private" && state?.canReview && hasPublishableDraft(state)) {');
  s=once(s,'  function attach(entry, actions, more = actions, options = actions, header = actions, listing = actions) {','  function attach(entry, actions, more = actions, options = actions, header = actions, listing = actions) {\n    if(entry.watchlistGroup === "private"){listing.hidden=true;const note=document.createElement("small");note.textContent="Private — only you can see this ticker. Move it to another list to publish.";header.append(note);}');
  s=once(s,'if (ready || pending.has(entry.symbol)) actions.append(approve);','if (entry.watchlistGroup !== "private" && (ready || pending.has(entry.symbol))) actions.append(approve);');
  s=once(s,'      listing.prepend(list);','      if(entry.watchlistGroup !== "private") listing.prepend(list);');
  return s;
 });
 edit('platform','src/modules/watchlist/server/access/watchlist-analysis-visibility.ts',s=>{
  s='import { withJournalAdminDatabase } from "@/src/modules/platform/server/administration/platform-admin-authorization";\n'+s;
  s=once(s,'{ all: boolean; restricted: ReadonlySet<string> } | null','{ all: boolean; owner: boolean; privateSymbols: ReadonlySet<string>; restricted: ReadonlySet<string> } | null');
  s=once(s,'if (hasWatchlistDashboardNavigationAccess(requireTraderLinkPlatformRequestIdentity(requestHeaders))) return { all: true, restricted: new Set() };','if (withJournalAdminDatabase(requestHeaders, () => true)) return { all: true, owner: true, privateSymbols: new Set(), restricted: new Set() };');
  s=once(s,'return { all: Boolean(identity.discord && hasPlatformDiscordPremiumAccess(identity.discord)), restricted:',`const privateSymbols = withReadonlyPlatformDatabase({}, db => db.prepare<[], {symbol:string}>("SELECT symbol FROM live_watchlist_symbols WHERE json_extract(state_json,'$.watchlistGroup')='private'").all());
    return { owner: false, privateSymbols: new Set(privateSymbols.map(row=>row.symbol)), all: Boolean(identity.discord && hasPlatformDiscordPremiumAccess(identity.discord)), restricted:`);
  s=once(s,'return Boolean(policy && (policy.all || !policy.restricted.has(symbol.toUpperCase())));','return Boolean(policy && (policy.owner || !policy.privateSymbols.has(symbol.toUpperCase())) && (policy.all || !policy.restricted.has(symbol.toUpperCase())));');
  s+=`\nexport function isPrivateWatchlistTicker(symbol: string): boolean {
  return withReadonlyPlatformDatabase({}, db => {
    const row=db.prepare<[string],{state_json:string}>("SELECT state_json FROM live_watchlist_symbols WHERE symbol=?").get(symbol.toUpperCase());
    return row ? JSON.parse(row.state_json).watchlistGroup === "private" : false;
  });
}\n`;
  s+=`\nexport function canViewPrivateWatchlistTicker(headers: Headers, symbol:string):boolean {
  try { if(withJournalAdminDatabase(headers,()=>true))return true; }catch{}
  try { return !isPrivateWatchlistTicker(symbol); }catch{return false;}
}\n`;
  return s;
 });
 edit('platform','src/modules/watchlist/server/access/watchlist-ticker-projection.ts',s=>{
  s=once(s,'return canViewWatchlistTicker(headers, item.symbol) ? item : concealWatchlistTicker(item);',`const policy=readWatchlistTickerPolicy(headers);
  if(!policy || (!policy.owner && (item.watchlistGroup === "private" || policy.privateSymbols.has(item.symbol)))) return {symbol:"watchlist-refresh",status:"deactivated",updatedAt:0,firstPostedAt:null,latestPrice:null};
  return canViewWatchlistTicker(headers, item.symbol) ? item : concealWatchlistTicker(item);`);
  s=once(s,'symbols: payload.symbols.map(', 'symbols: payload.symbols.filter(item => policy && (policy.owner || (item.watchlistGroup !== "private" && !policy.privateSymbols.has(item.symbol)))).map(');
  return s;
 });
 edit('platform','src/modules/watchlist/server/notifications/watchlist-notification-delivery.ts',s=>{
  s=once(s,"symbol=? AND status<>'deactivated'","symbol=? AND status<>'deactivated' AND COALESCE(json_extract(state_json,'$.watchlistGroup'),'main')<>'private'");
  return s;
 });
 edit('platform','src/modules/watchlist/server/notifications/watchlist-x-runtime.ts',s=>'import { isPrivateWatchlistTicker } from "../access/watchlist-analysis-visibility";\n'+once(s,'    for (let post of posts) {','    for (let post of posts) {\n      if(isPrivateWatchlistTicker(post.ticker)){dbRun(db=>setXState(db,post.post_key,\'cancelled\',\'Ticker is Private.\'));continue;}'));
 edit('platform','src/modules/watchlist/server/notifications/watchlist-potential-gain-post.ts',s=>'import { isPrivateWatchlistTicker } from "../access/watchlist-analysis-visibility";\n'+once(s,'  validateGainPost(input);','  if(isPrivateWatchlistTicker(input.symbol))throw Error("Move this ticker out of Private before publishing.");\n  validateGainPost(input);'));
 edit('platform','src/modules/watchlist/server/notifications/watchlist-category-move-notifications.ts',s=>{
  s='import { isPrivateWatchlistTicker } from "../access/watchlist-analysis-visibility";\n'+s;
  s=once(s,'const input=JSON.parse(body);if(input.notify!==true)return;','const input=JSON.parse(body);if(input.notify!==true || input.to===\'private\' || (typeof input.symbol===\'string\' && isPrivateWatchlistTicker(input.symbol)))return;');
  return once(s,"symbol=? AND status<>'deactivated'","symbol=? AND status<>'deactivated' AND COALESCE(json_extract(state_json,'$.watchlistGroup'),'main')<>'private'");
 });
 for(const p of ['app/watchlist/[symbol]/page.tsx','app/watchlist/archive/[archiveId]/page.tsx'])edit('platform',p,s=>{
  s='import { canViewPrivateWatchlistTicker } from "@/src/modules/watchlist/server/access/watchlist-analysis-visibility";\n'+s;
  const needle=p.includes('archive')?'  if (!canViewWatchlistTicker(await headers(), archive.symbol))':'  if (!canViewWatchlistTicker(requestHeaders, symbol))';
  return once(s,needle,(p.includes('archive')?'  if (!canViewPrivateWatchlistTicker(await headers(), archive.symbol) || archive.state.watchlistGroup === "private") notFound();\n':'  if (!canViewPrivateWatchlistTicker(requestHeaders, symbol)) notFound();\n')+needle);
 });
 for(const p of ['app/api/live-watchlist/symbols/[symbol]/route.ts','app/api/live-watchlist/symbols/[symbol]/analysis-history/route.ts','app/api/live-watchlist/symbols/[symbol]/indicators/route.ts'])edit('platform',p,s=>'import { canViewPrivateWatchlistTicker } from "@/src/modules/watchlist/server/access/watchlist-analysis-visibility";\n'+once(s,'  if (!canViewWatchlistTicker(request.headers, symbol))','  if (!canViewPrivateWatchlistTicker(request.headers, symbol)) return Response.json({error:"Not found."},{status:404,headers:{"Cache-Control":"private, no-store"}});\n  if (!canViewWatchlistTicker(request.headers, symbol))'));
 edit('platform','app/watchlist/archive/page.tsx',s=>once(s,'archives.filter(item => canViewWatchlistTicker(viewerHeaders, item.symbol))','archives.filter(item => item.state.watchlistGroup !== "private" && canViewWatchlistTicker(viewerHeaders, item.symbol))'));
 edit('platform','app/api/admin/watchlist/runtime/[...path]/route.ts',s=>{
  s='import { isPrivateWatchlistTicker } from "@/src/modules/watchlist/server/access/watchlist-analysis-visibility";\n'+s;
  s=once(s,'const GET_PATHS = new Set([','const GET_PATHS = new Set([\n  "/api/watchlist/analysis-review/discord-text",');
  const anchor='  if (pathname === "/api/watchlist/analysis-review/x-post" && reviewActor) {';
  return once(s,anchor,`  if(pathname === "/api/watchlist/analysis-review/category-move" && method === "POST" && reviewActor && body) {
    try {
      const input=JSON.parse(body);
      if(typeof input.symbol === "string" && input.to !== "private" && isPrivateWatchlistTicker(input.symbol)) {
        const moved=await requestWatchlistRuntimeRaw({method:"POST",reviewActor,contentType:"application/json",path:pathname,body:JSON.stringify({...input,notify:false})});
        if(!moved.ok)return new Response(moved.body,{status:moved.status,headers:{"content-type":moved.contentType,"cache-control":"private, no-store"}});
        const current=await requestWatchlistRuntimeRaw({method:"GET",reviewActor,path:"/api/watchlist/analysis-review?symbol="+encodeURIComponent(input.symbol)});
        if(!current.ok)throw new Error("Review unavailable.");
        const review=JSON.parse(current.body).review;
        if(!review || review.cancelled)throw new Error("Review unavailable.");
        const hasDraft=Boolean(review.draft && ["original","edit"].includes(review.draft.body?.kind));
        const approval={symbol:input.symbol,cycleId:review.cycleId,expectedHead:review.head,notifyUsers:input.notify===true,
          ...(hasDraft?{draftRevision:review.draft.revision,previewHash:""}:{})};
        recordWatchlistApprovalNotificationIntent(JSON.stringify(approval),reviewActor,!hasDraft);
        const published=await requestWatchlistRuntimeRaw({method:"POST",reviewActor,contentType:"application/json",path:"/api/watchlist/analysis-review/"+(hasDraft?"approve":"publish-without-analysis"),body:JSON.stringify(approval)});
        if(!published.ok)return new Response(published.body,{status:published.status,headers:{"content-type":published.contentType,"cache-control":"private, no-store"}});
        return Response.json({ok:true,move:{destination:"skipped",notice:input.notify?"Ticker published. Check its notification delivery status.":"Ticker published. No notifications sent."}},{headers:{"cache-control":"private, no-store"}});
      }
    }catch{return Response.json({error:"Publication could not complete. Your saved analysis is preserved; check the ticker before retrying."},{status:409,headers:{"cache-control":"private, no-store"}});}
  }
`+anchor);
 });
 for(const [p,anchor,symbol] of [
  ['src/modules/watchlist/server/notifications/watchlist-x-admin.ts','  const review=await readFreeChatReview(input.symbol,owner);','input.symbol'],
  ['src/modules/watchlist/server/notifications/watchlist-free-chat-admin.ts','  const review = await readFreeChatReview(input.symbol,ownerUserId);','input.symbol'],
  ['src/modules/watchlist/server/notifications/watchlist-free-chat-delivery.ts','  const payload = freeChatPayload(publication);','publication.symbol'],
 ])edit('platform',p,s=>'import { isPrivateWatchlistTicker } from "../access/watchlist-analysis-visibility";\n'+once(s,anchor,`  if(isPrivateWatchlistTicker(${symbol})) throw new Error("Move this ticker out of Private before publishing.");\n`+anchor));
 edit('platform','src/modules/help/watchlist-guides.ts',s=>once(s,'Owners can select General Watchlist','Private is an owner-only category in Watchlist Admin. Private tickers are not available to members, including Premium members, and cannot send member notifications or social posts. Notes and analysis can be prepared privately. Moving out of Private publishes as a normal new listing, without mentioning its private origin. The notify-users choice controls notifications. Public post time starts when published. Moving a previously public ticker into Private does not recall existing external posts. Owners can select General Watchlist'));
 return result;
}
module.exports={prepare,source,parents,runtime};
if(require.main===module){const r=prepare();console.log(JSON.stringify(Object.fromEntries(Object.entries(r).map(([k,v])=>[k,[...v.keys()]])),null,2));}
