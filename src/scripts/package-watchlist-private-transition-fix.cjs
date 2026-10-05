const cp=require('node:child_process'),assert=require('node:assert/strict');
const runtime='C:/Users/jerac/Documents/TraderLink/levels-system-post-mtf-handoff-stability';
const parent='d34c6aed9079496701f4453c57ddb019a1b67f2a';
const file='src/lib/monitoring/manual-watchlist-runtime-manager.ts';
function once(s,a,b){assert.equal(s.split(a).length,2,a);return s.replace(a,b);}
function prepare(){
 let s=cp.execFileSync('git',['-c',`safe.directory=${runtime}`,'-C',runtime,'show',`${parent}:${file}`],{encoding:'utf8',maxBuffer:20e6});
 s=once(s,'export class ManualWatchlistRuntimeManager {','export class ManualWatchlistRuntimeManager {\n  private readonly privateTransitionMarkers = new Map<string, LiveWatchlistCardPatch>();');
 s=once(s,'      if (entry?.watchlistGroup === "private") return false;','      if (this.privateTransitionMarkers.has(symbol) || entry?.watchlistGroup === "private") return false;');
 s=once(s,'    if (entry?.watchlistGroup === "private" && "watchlistGroup" in patch',`    const privateMarker = "watchlistGroup" in patch && patch.watchlistGroup === "private";
    if (this.privateTransitionMarkers.has(patch.symbol)) return this.privateTransitionMarkers.get(patch.symbol) === patch;
    if (privateMarker && entry?.watchlistGroup !== "private") return false;
    if (entry?.watchlistGroup === "private" && "watchlistGroup" in patch`);
 s=once(s,'      const existingGroup = getWatchlistEntrySessionGroup(existing);',`      const existingGroup = getWatchlistEntrySessionGroup(existing);
      if (requestedGroup === "private" || existingGroup === "private") {
        return this.moveSymbolToWatchlistGroup(symbol, requestedGroup);
      }`);
 const start=s.indexOf('    if (watchlistGroup === "private") {',s.indexOf('async moveSymbolToWatchlistGroup('));
 const end=s.indexOf('    // Moving changes placement only:',start);assert(start>0&&end>start);
 s=s.slice(0,start)+`    if (this.privateTransitionMarkers.has(symbol)) throw new Error("A Private move is already in progress. Check the ticker before retrying.");
    if (watchlistGroup === "private") {
      if (existing.watchlistGroup === "private") return existing;
      const store=this.options.tradersLinkAiReadReviewStore;
      if(!store || !this.liveWatchlistPublisher) throw new Error("Private storage is unavailable.");
      const marker: LiveWatchlistCardPatch = {symbol,updatedAt:this.options.now?.()??Date.now(),watchlistGroup:"private",cards:{}};
      // The website must acknowledge concealment before changing the local
      // category or review cycle. Only this exact marker may publish meanwhile.
      this.privateTransitionMarkers.set(symbol,marker);
      try {
        await this.liveWatchlistPublisher.publish(marker);
        const current=this.watchlistStore.getEntry(symbol);
        if(!current?.active || current.lifecycle!=="active") throw new Error("Ticker changed while moving. The website remains hidden; check the ticker before retrying.");
        const previous=this.getTradersLinkAiReadReview(symbol),draft=previous?.draft;
        const cycleId=randomUUID();
        store.begin(cycleId,symbol,true,"runtime:private:"+(previous?.cycleId??""));
        if(draft && (draft.body.kind==="original"||draft.body.kind==="edit")) store.saveDraft({cycleId,expectedHead:store.read(cycleId)!.head,actor:"runtime:private",payload:draft.body.payload});
        const moved=this.watchlistStore.patchEntry(symbol,{watchlistGroup,publicationReview:{cycleId,required:true},discordThreadId:null})!;
        this.persistWatchlist();
        return moved;
      } finally {
        // Failed outbox markers cannot replay later against a public entry.
        this.privateTransitionMarkers.delete(symbol);
      }
    }
`+s.slice(end);
 return s;
}
module.exports={prepare,runtime,parent,file};
