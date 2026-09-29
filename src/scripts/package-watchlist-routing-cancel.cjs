const cp=require('node:child_process'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const runtime='C:/Users/jerac/.codex/worktrees/watchlist-source-selector/levels-system-post-mtf-handoff-stability';
const parents={runtime:'eeb2411e6f9c1d24c7a5d618aeee6e32976746bc',platform:'6985731dbd6b2ab96cffa59d84fcffb62e9be470'},changes={runtime:new Map(),platform:new Map()};
function git(cwd,args,input,index){return cp.execFileSync('git',['-c','safe.directory='+cwd.replaceAll('\\','/'),...args],{cwd,encoding:'utf8',input,env:{...process.env,...(index?{GIT_INDEX_FILE:index}:{})}});}
function one(s,a,b){assert.equal(s.split(a).length,2,a);return s.replace(a,b);}
function edit(lane,file,fn){const raw=git(lane==='runtime'?runtime:process.cwd(),['show',parents[lane]+':'+file]);changes[lane].set(file,{raw,body:fn(raw.replace(/\r\n/g,'\n'))});}
edit('runtime','src/lib/ai/traderslink-ai-read-service.ts',s=>{
 s=one(s,'  canStartFallback?: () => boolean;','  canStartFallback?: () => boolean;\n  signal?: AbortSignal;');
 s=one(s,'    const controller = new AbortController();','    input.signal?.throwIfAborted();\n    const controller = new AbortController();\n    const cancel = () => controller.abort(input.signal?.reason);\n    input.signal?.addEventListener("abort", cancel, { once: true });');
 s=one(s,'      const timedError = controller.signal.aborted','      const timedError = input.signal?.aborted\n        ? new Error("Analysis cancelled by owner.") as TimedRequestError\n        : controller.signal.aborted');
 s=one(s,'      clearTimeout(timeout);','      clearTimeout(timeout);\n      input.signal?.removeEventListener("abort", cancel);');
 s=one(s,'      if (!fallback || !failedAttempt || input.canStartFallback?.() === false) throw error;','      if (input.signal?.aborted || !fallback || !failedAttempt || input.canStartFallback?.() === false) throw error;');
 return s;
});
edit('runtime','src/lib/monitoring/manual-watchlist-runtime-manager.ts',s=>{
 const anchor='  private async generateTradersLinkAiRead(';
 s=one(s,anchor,`  private readonly cancellableAnalysis = new Map<string, { runId: string; startedAt: number; controller: AbortController }>();
  private readonly cancelledAutomaticAnalysis = new Map<string, number | undefined>();
  getAnalysisGeneration(symbolInput: string) {
    const run = this.cancellableAnalysis.get(normalizeSymbol(symbolInput));
    return run ? { runId: run.runId, startedAt: run.startedAt, cancelling: run.controller.signal.aborted } : null;
  }
  cancelAnalysisGeneration(symbolInput: string, runId: string) {
    const symbol = normalizeSymbol(symbolInput), run = this.cancellableAnalysis.get(symbol);
    if (!run || run.runId !== runId) throw new Error("That analysis is no longer running. Refresh the ticker controls.");
    this.cancelledAutomaticAnalysis.set(symbol, this.watchlistStore.getEntry(symbol)?.tradersLinkAiReadBoundaryState?.generatedAt);
    run.controller.abort(new Error("Analysis cancelled by owner."));
    this.recordTradersLinkAiReadRunOutcome({ symbol, trigger: "manual", stage: "request", outcome: "skipped", runId, reason: "Analysis cancelled by owner. No replacement will be published." });
    return { cancelled: true };
  }

`+anchor);
 s=one(s,'    const requestActivationEpoch = this.activationEpochs.get(symbol);',`    const requestActivationEpoch = this.activationEpochs.get(symbol);
    if (requestedTrigger === "manual" || requestedTrigger === "activation") this.cancelledAutomaticAnalysis.delete(symbol);
    else if (this.cancelledAutomaticAnalysis.has(symbol) && this.cancelledAutomaticAnalysis.get(symbol) === this.watchlistStore.getEntry(symbol)?.tradersLinkAiReadBoundaryState?.generatedAt) return null;`);
 s=one(s,'    this.aiReadInFlight.add(symbol);','    this.aiReadInFlight.add(symbol);\n    const cancellation = new AbortController();\n    this.cancellableAnalysis.set(symbol, { runId, startedAt: Date.now(), controller: cancellation });');
 s=one(s,'      if (!requestAvailability.allowed || activationChanged) {','      cancellation.signal.throwIfAborted();\n      if (!requestAvailability.allowed || activationChanged) {');
 s=one(s,'        read = await service.generate({','        read = await service.generate({\n          signal: cancellation.signal,');
 s=one(s,'      if (reviewCycleId) this.options.tradersLinkAiReadReviewStore!.recordGeneration(reviewCycleId, { ...generationAudit, status: "completed" });','      cancellation.signal.throwIfAborted();\n      this.cancellableAnalysis.delete(symbol); // Generation is complete; publication is no longer cancellable.\n      if (reviewCycleId) this.options.tradersLinkAiReadReviewStore!.recordGeneration(reviewCycleId, { ...generationAudit, status: "completed" });');
 s=one(s,'      this.aiReadInFlight.delete(symbol);','      this.aiReadInFlight.delete(symbol);\n      if (this.cancellableAnalysis.get(symbol)?.runId === runId) this.cancellableAnalysis.delete(symbol);');
 s=one(s,'discordAudience: audience, analysisImageVersion: 1','discordAudience: audience, discordWatchlistGroup: this.watchlistStore.getEntry(read.symbol)?.watchlistGroup, analysisImageVersion: 1');
 s=one(s,'website: snapshot as unknown as Record<string,unknown>, discordChunks:', 'discordWatchlistGroup: entry.watchlistGroup, website: snapshot as unknown as Record<string,unknown>, discordChunks:');
 s=one(s,'content: claim.content, audience: approval.body.publication.discordAudience,','content: claim.content, audience: approval.body.publication.discordAudience, watchlistGroup: approval.body.publication.discordWatchlistGroup,');
 s=one(s,'{ symbol, content, deliveryKey: claim.body.deliveryKey }','{ symbol, content, deliveryKey: claim.body.deliveryKey, watchlistGroup: approval.body.kind === "approve" ? approval.body.publication?.discordWatchlistGroup : undefined }');
 return s;
});
edit('runtime','src/lib/ai/traderslink-ai-read-publication-preview.ts',s=>one(s,'export type ReviewPublication = {','export type ReviewPublication = {\n  discordWatchlistGroup?: string;'));
edit('runtime','src/lib/alerts/alert-router.ts',s=>one(s,'export type ApprovedAnalysisDiscordChunk = {','export type ApprovedAnalysisDiscordChunk = {\n  watchlistGroup?: string;'));
edit('runtime','src/runtime/manual-watchlist-server.ts',s=>one(s,'activeEntries: manager.getActiveEntries().map((entry) => ({','activeEntries: manager.getActiveEntries().map((entry) => ({\n          analysisGeneration: manager.getAnalysisGeneration(entry.symbol),'));
edit('runtime','src/runtime/manual-watchlist-analysis-review-api.ts',s=>{
 s=one(s,'"getAutomaticAnalysisEvents" | "exportFreeChatPublication" |','"getAutomaticAnalysisEvents" | "exportFreeChatPublication" | "cancelAnalysisGeneration" |');
 s=one(s,'export const ANALYSIS_REVIEW_PATHS = new Set([','export const ANALYSIS_REVIEW_PATHS = new Set([\n  "/api/watchlist/analysis-review/cancel-generation",');
 const a='  const settingsRequest = input.pathname.endsWith("/settings");';
 return one(s,a,`  if (input.pathname.endsWith("/cancel-generation")) {
    if (input.method !== "POST") return { status: 405, body: { error: "Method not allowed." } };
    const body = input.body as { symbol?: unknown; runId?: unknown } | undefined;
    if (typeof body?.symbol !== "string" || !/^[A-Z0-9][A-Z0-9.-]{0,19}$/.test(body.symbol) || typeof body.runId !== "string" || body.runId.length > 200) return { status: 400, body: { error: "Invalid cancellation request." } };
    try { return { status: 200, body: manager.cancelAnalysisGeneration(body.symbol, body.runId) }; }
    catch { return { status: 409, body: { error: "That analysis is no longer running. Refresh the ticker controls." } }; }
  }
`+a);
});
edit('platform','app/api/admin/watchlist/runtime/[...path]/route.ts',s=>one(s,'const POST_PATHS = new Set([','const POST_PATHS = new Set([\n  "/api/watchlist/analysis-review/cancel-generation",'));
edit('runtime','src/runtime/manual-watchlist-row-review.ts',s=>one(s,'  function attach(entry, actions) {',`  function attach(entry, actions) {
    if (entry.analysisGeneration) {
      const run = entry.analysisGeneration;
      const elapsed = Math.max(0, Math.floor((Date.now() - run.startedAt) / 1000));
      const status = document.createElement('span'); status.textContent = 'Analysis running · ' + Math.floor(elapsed / 60) + 'm ' + (elapsed % 60) + 's';
      const cancel = document.createElement('button'); cancel.type = 'button'; cancel.className = 'secondary'; cancel.textContent = run.cancelling ? 'Cancelling…' : 'Cancel analysis'; cancel.disabled = run.cancelling;
      cancel.onclick = async () => { cancel.disabled = true; try { await request('/cancel-generation',{symbol:entry.symbol,runId:run.runId}); status.textContent = 'Analysis cancelled. Previous approved analysis is unchanged.'; } catch(error) { status.textContent = String(error.message || error); cancel.disabled = false; } };
      actions.append(status,cancel);
    }`));
edit('runtime','src/lib/alerts/discord-rest-thread-gateway.ts',s=>{
 s='import { DiscordPreparationFailure } from "./discord-preparation-failure.js";\n'+s;
 s=one(s,'  constructor(options: DiscordRestThreadGatewayOptions) {',`  private readonly categoryGateways = new Map<string, Promise<DiscordRestThreadGateway>>();
  private readonly categoryOptions: DiscordRestThreadGatewayOptions;
  private async categoryGateway(group?: string): Promise<DiscordRestThreadGateway | null> {
    const variable = group === "postmarket" || group?.startsWith("top_watches:") ? "WATCHLIST_POSTMARKET_DISCORD_WEBHOOK_URL"
      : group === "swings" ? "WATCHLIST_SWINGS_DISCORD_WEBHOOK_URL"
      : group === "general" ? "WATCHLIST_GENERAL_DISCORD_WEBHOOK_URL" : null;
    if (!variable) return null;
    const cached = this.categoryGateways.get(variable); if (cached) return cached;
    const pending = (async () => {
      const raw = process.env[variable]?.trim();
      let url: URL;
      try { url = new URL(raw || ""); } catch { throw new DiscordPreparationFailure("Watchlist destination webhook is missing or invalid."); }
      if (url.origin !== "https://discord.com" || url.username || url.password || url.search || url.hash ||
        !/^\\/api\\/(?:v10\\/)?webhooks\\/\\d{17,20}\\/[A-Za-z0-9_-]+$/.test(url.pathname)) throw new DiscordPreparationFailure("Watchlist destination webhook is missing or invalid.");
      let channel: unknown;
      try {
        const response = await this.fetchImpl(url.toString(), { signal: AbortSignal.timeout(8000), redirect: "error" });
        if (!response.ok) throw new Error("Webhook unavailable");
        const metadata = await response.json() as { channel_id?: unknown; guild_id?: unknown };
        if (this.guildId && metadata.guild_id !== this.guildId) throw new Error("Webhook server mismatch");
        channel = metadata.channel_id;
      } catch { throw new DiscordPreparationFailure("Watchlist destination could not be verified. No post was sent; retry when its connection is available."); }
      if (typeof channel !== "string" || !/^\\d{17,20}$/.test(channel)) throw new DiscordPreparationFailure("Watchlist destination channel is invalid. No post was sent.");
      return new DiscordRestThreadGateway({ ...this.categoryOptions, watchlistChannelId: channel, webhookUrl: url.toString() });
    })();
    this.categoryGateways.set(variable,pending);
    try { return await pending; } catch(error) { this.categoryGateways.delete(variable); throw error; }
  }

  constructor(options: DiscordRestThreadGatewayOptions) {
    this.categoryOptions = { ...options };`);
 s=one(s,'  async sendApprovedAnalysisChunk(chunk: ApprovedAnalysisDiscordChunk): Promise<ApprovedAnalysisDiscordReceipt> {','  async sendApprovedAnalysisChunk(chunk: ApprovedAnalysisDiscordChunk): Promise<ApprovedAnalysisDiscordReceipt> {\n    const routed = await this.categoryGateway(chunk.watchlistGroup);\n    if (routed) return routed.sendApprovedAnalysisChunk({ ...chunk, watchlistGroup: undefined });');
 s=one(s,'  async verifyApprovedAnalysisMessage(chunk: ApprovedAnalysisDiscordChunk, messageId: string, notBefore: number): Promise<ApprovedAnalysisDiscordReceipt> {','  async verifyApprovedAnalysisMessage(chunk: ApprovedAnalysisDiscordChunk, messageId: string, notBefore: number): Promise<ApprovedAnalysisDiscordReceipt> {\n    const routed = await this.categoryGateway(chunk.watchlistGroup);\n    if (routed) return routed.verifyApprovedAnalysisMessage({ ...chunk, watchlistGroup: undefined }, messageId, notBefore);');
 return s;
});
changes.runtime.set('src/lib/alerts/discord-preparation-failure.ts',{raw:'',body:'/** Confirmed local pre-send failure, not a Discord response or uncertain send. */\nexport class DiscordPreparationFailure extends Error {}\n'});
const managerChange=changes.runtime.get('src/lib/monitoring/manual-watchlist-runtime-manager.ts');
managerChange.body='import { DiscordPreparationFailure } from "../alerts/discord-preparation-failure.js";\n'+managerChange.body;
managerChange.body=one(managerChange.body,'        if (error instanceof DiscordConfirmedRejection) {\n          store.rejectDiscordChunk', '        if (error instanceof DiscordPreparationFailure) {\n          store.rejectDiscordChunk(input.cycleId, store.read(input.cycleId)!.head, approval.revision, index, 400);\n        }\n        if (error instanceof DiscordConfirmedRejection) {\n          store.rejectDiscordChunk');
// Parent and iframe share an origin. Position the Free Chat dialog in the visible
// intersection of the embedded console and the owner's viewport, not iframe center.
const row=changes.runtime.get('src/runtime/manual-watchlist-row-review.ts');
row.body=one(row.body,'dialog.append(heading,message,close); dialog.addEventListener(\'close\',()=>dialog.remove()); document.body.append(dialog); dialog.showModal();',`dialog.append(heading,message,close); dialog.addEventListener('close',()=>dialog.remove()); document.body.append(dialog); dialog.showModal();
      const position = () => {
        if (window.parent === window || !window.frameElement) return;
        const frame = window.frameElement.getBoundingClientRect();
        const top = Math.max(0, -frame.top), bottom = Math.min(window.innerHeight, window.parent.innerHeight - frame.top);
        dialog.style.position = 'fixed'; dialog.style.margin = '0 auto'; dialog.style.left = '0'; dialog.style.right = '0';
        dialog.style.maxHeight = Math.max(120, bottom - top - 24) + 'px';
        dialog.style.top = Math.max(top + 12, top + (bottom - top - dialog.offsetHeight) / 2) + 'px';
      };
      position(); window.parent.addEventListener('scroll',position,true); window.parent.addEventListener('resize',position);
      dialog.addEventListener('close',()=>{window.parent.removeEventListener('scroll',position,true);window.parent.removeEventListener('resize',position);});`);
row.body=one(row.body,'dialog.insertBefore(label,close); dialog.insertBefore(send,close); dialog.insertBefore(check,close); show();','dialog.insertBefore(label,close); dialog.insertBefore(send,close); dialog.insertBefore(check,close); show(); position();');
edit('platform','src/modules/help/watchlist-guides.ts',s=>one(s,'    id: "free-chat", title:',`    id: "analysis-cancellation", title: "Cancel analysis", summary: "Stop a pending analysis without changing the published read.",
    keywords: ["cancel", "generation", "Discord channels"],
    blocks: [{kind:"paragraph",text:"While an analysis is running, Watchlist Admin shows its elapsed time and Cancel analysis. Cancelling prevents that request from replacing the published analysis or starting a fallback request. You can manually refresh again. Work already processed by the provider may still be charged. The same automatic boundary request is paused until a manual refresh, a new published read or a runtime restart."}, {kind:"paragraph",text:"Approved Discord posts use the channel configured for their Watchlist category: Main and Top Regular, Post-Market and Overnight Watches, Swings, or General. Moving a ticker does not redirect a post already approved for delivery. Free Chat remains a separate choice."}],
  }, {
    id: "free-chat", title:`));
module.exports={changes,parents,runtime,git};
const ts=require('C:/Users/jerac/Documents/TraderLink/traderlink-platform/node_modules/typescript');
for(const files of Object.values(changes))for(const [file,{body}]of files){assert.equal(ts.transpileModule(body,{fileName:file,reportDiagnostics:true,compilerOptions:{target:99,module:1,jsx:4}}).diagnostics.filter(d=>d.category===1).length,0,file);}
console.log('Candidate exact-parent transforms and syntax pass.');
if(process.argv.includes('--commit'))for(const lane of ['platform','runtime']){
 const cwd=lane==='runtime'?runtime:process.cwd(),parent=parents[lane],index=path.join(process.cwd(),'data/watchlist-routing-cancel-'+lane+'.index');
 git(cwd,['read-tree',parent],undefined,index);
 function write(file,body){const blob=git(cwd,['hash-object','-w','--stdin'],body,index).trim();git(cwd,['update-index','--add','--cacheinfo','100644,'+blob+','+file],undefined,index);}
 for(const [file,{raw,body}]of changes[lane])write(file,raw.includes('\r\n')?body.replace(/\n/g,'\r\n'):body);
 if(lane==='platform'){
   for(const file of ['docs/migration/watchlist-routing-cancellation-plan.md','docs/migration/watchlist-routing-cancellation-progress.md','src/scripts/package-watchlist-routing-cancel.cjs','src/scripts/verify-watchlist-routing-cancel.cjs'])write(file,fs.readFileSync(file));
   const plan='docs/migration/watchlist-top-watches-plan.md';write(plan,git(cwd,['show',parent+':'+plan])+'\n\nOwner-approved routing, cancellation and Free Chat dialog correction: [plan](watchlist-routing-cancellation-plan.md), [progress](watchlist-routing-cancellation-progress.md).\n');
 }
 git(cwd,['diff','--cached','--check',parent],undefined,index);
 console.log(git(cwd,['diff','--cached','--stat',parent],undefined,index));
 const tree=git(cwd,['write-tree'],undefined,index).trim(),sha=git(cwd,['commit-tree',tree,'-p',parent,'-m','Add Watchlist category delivery routing and cancellable analysis'],undefined,index).trim();
 git(cwd,['update-ref','refs/codex/watchlist-routing-cancel-'+lane,sha],undefined,index);console.log(lane+' '+sha);
}
