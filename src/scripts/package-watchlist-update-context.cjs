const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const runtime = 'C:/Users/jerac/Documents/TraderLink/levels-system-post-mtf-handoff-stability';
const platformParent = 'a8a0a2e43ab014e578ae9d4ea0bd9841983b04c9';
const runtimeParent = '6e08f2a313513830e6f00a1769abfe38b74a52e6';
const git = (cwd,args,input,index) => execFileSync('git',args,{cwd,input,encoding:'utf8',maxBuffer:12e6,env:{...process.env,...(index?{GIT_INDEX_FILE:index}:{})}}).trimEnd();
const read = file => fs.readFileSync(path.join(root,file),'utf8');
const base = (cwd,parent,file) => git(cwd,['show',`${parent}:${file}`])+'\n';
const replace = (source,from,to) => { assert.equal(source.split(from).length,2,`Unique anchor: ${from.slice(0,80)}`); return source.replace(from,to); };
function prepare() {
  const platform = new Map();
  const prefix = 'src/modules/watchlist/server/notifications/';
  for(const file of ['watchlist-analysis-update-copy.ts','watchlist-publication-notification-contract.ts','watchlist-publication-notification-store.ts','watchlist-notification-delivery.ts']) platform.set(prefix+file,read(prefix+file));
  // Exclude an older local-only listing-consent restriction: this slice changes
  // copy/context only and must preserve the exact released acceptance behavior.
  const contractFile=prefix+'watchlist-publication-notification-contract.ts';
  platform.set(contractFile,platform.get(contractFile).replace('typeof event.notifyUsers !== "boolean" ||\n    (event.notificationKind === "listing" && event.notifyUsers !== true)', 'typeof event.notifyUsers !== "boolean"').replace('typeof event.notifyUsers !== "boolean" ||\r\n    (event.notificationKind === "listing" && event.notifyUsers !== true)', 'typeof event.notifyUsers !== "boolean"'));
  const migration='src/modules/platform/server/database/migrations/0152_platform_watchlist_notification_update_context.ts';
  platform.set(migration,read(migration));
  const manifest='src/modules/platform/server/database/platform-migration-manifest.ts';
  let manifestSource=base(root,platformParent,manifest);
  manifestSource='import { platformWatchlistNotificationUpdateContextMigration } from "./migrations/0152_platform_watchlist_notification_update_context";\n'+manifestSource;
  const previous='migration: platformWatchlistXPublicationsMigration }),';
  manifestSource=replace(manifestSource,previous,previous+'\n    Object.freeze({ sourcePath: "src/modules/platform/server/database/migrations/0152_platform_watchlist_notification_update_context.ts", migration: platformWatchlistNotificationUpdateContextMigration }),');
  platform.set(manifest,manifestSource);
  const register='docs/migration/migration-register.md';
  platform.set(register,base(root,platformParent,register)+'\n\n## Reserved 0152 — Watchlist update context\n\n`0152_platform_watchlist_notification_update_context`, order 152, follows `0151_platform_watchlist_x_publications`. Additive nullable JSON column on immutable Watchlist notification events; no backfill or deliveries. Registered, not applied. See [plan](watchlist-update-context-plan.md).\n');
  const help='src/modules/help/watchlist-guides.ts';
  let helpSource=base(root,platformParent,help);
  const helpAnchor='Potential Gain keeps the original Watchlist starting price; it does not restart when the analysis changes.';
  helpSource=replace(helpSource,helpAnchor,helpAnchor+' Updated-analysis notifications identify automatic AI updates or approval by "This Guy" and compare the first published analysis price with the updated analysis price when both are available. That comparison is separate from Potential Gain.');
  // The existing Help prose is a quoted TypeScript string.
  helpSource=helpSource.replace('approval by "This Guy" and compare','approval by \\"This Guy\\" and compare');
  platform.set(help,helpSource);
  for(const file of ['docs/migration/watchlist-update-context-plan.md','docs/migration/watchlist-update-context-progress.md','src/scripts/package-watchlist-update-context.cjs','src/scripts/verify-watchlist-update-context.cjs']) platform.set(file,read(file));

  const changes=new Map();
  const helper='src/lib/ai/watchlist-analysis-update-context.ts';
  let helperSource=read(prefix+'watchlist-analysis-update-copy.ts');
  helperSource += `\n/** Freeze the first acknowledged analysis price before a new draft is published. */
export function analysisUpdateContextForDraft(value: unknown, updatedPrice: unknown): AnalysisUpdateContext {
  const review = record(value);
  const events = Array.isArray(review.events) ? review.events.map(record) : [];
  const delivered = new Set(events.filter(event => { const body=record(event.body); return body.kind === "delivery" && body.channel === "website" && body.status === "acknowledged"; }).map(event => record(event.body).approvalRevision));
  const approvals=events.filter(event => record(event.body).kind === "approve" && delivered.has(event.revision)).sort((a,b)=>Number(a.revision)-Number(b.revision));
  let firstAnalysisPrice: number | null = null;
  for (const event of approvals) {
    try { const publication=record(record(event.body).publication); const card=record(record(record(publication.website).cards).tradersLinkAiRead); firstAnalysisPrice=price(record(JSON.parse(String(card.body))).currentPrice); } catch { /* Listing without analysis. */ }
    if(firstAnalysisPrice !== null) break;
  }
  return { automatic:false,firstAnalysisPrice,updatedAnalysisPrice:price(updatedPrice) };
}\n`;
  changes.set(helper,helperSource);
  const preview='src/lib/ai/traderslink-ai-read-publication-preview.ts';
  let source=base(runtime,runtimeParent,preview);
  source='import { analysisUpdateComparison, ANALYSIS_UPDATE_EXPLANATION, type AnalysisUpdateContext } from "./watchlist-analysis-update-context.js";\n'+source;
  source=replace(source,'export type ReviewPublication = {','export type ReviewPublication = {\n  analysisUpdateContext?: AnalysisUpdateContext;');
  source=replace(source,'audience?: WatchlistDiscordAudience): string[] {','audience?: WatchlistDiscordAudience, context?: AnalysisUpdateContext): string[] {');
  source=replace(source,'`${read.symbol} Analysis updated` + linked.slice(linked.indexOf("\\n\\n"))','[`${read.symbol} Analysis updated`, analysisUpdateComparison(context), ANALYSIS_UPDATE_EXPLANATION].filter(Boolean).join("\\n") + linked.slice(linked.indexOf("\\n\\n"))');
  source=replace(source,'  if (!/^platform-owner:[0-9a-f-]{36}$/i.test(actor)) return chunks;',`  if (actor === "runtime:automatic-boundary") return chunks.map((chunk,index) => index === 0
    ? chunk.replace(/^(\\S+ Analysis updated)(\\r?\\n|$)/, '$1 — Auto updated by AI$2') : chunk);
  if (!/^platform-owner:[0-9a-f-]{36}$/i.test(actor)) return chunks;`);
  changes.set(preview,source);
  const manager='src/lib/monitoring/manual-watchlist-runtime-manager.ts';
  source=base(runtime,runtimeParent,manager);
  source='import { analysisUpdateContextForDraft } from "../ai/watchlist-analysis-update-context.js";\n'+source;
  source=replace(source,'    const publication: ReviewPublication = frozenPublication','    const analysisUpdateContext = alreadyListed ? analysisUpdateContextForDraft(review, read.currentPrice) : undefined;\n    const publication: ReviewPublication = frozenPublication');
  source=replace(source,'renderApprovedAnalysisDiscord(read, alreadyListed, audience),','renderApprovedAnalysisDiscord(read, alreadyListed, audience, analysisUpdateContext), analysisUpdateContext,');
  source=replace(source,'      discordChunks: attributeOwnerApprovedDiscord(preview.publication.discordChunks, input.actor),','      ...(preview.publication.analysisUpdateContext ? { analysisUpdateContext: { ...preview.publication.analysisUpdateContext, automatic: input.actor === "runtime:automatic-boundary" } } : {}),\n      discordChunks: attributeOwnerApprovedDiscord(preview.publication.discordChunks, input.actor),');
  changes.set(manager,source);
  return {platform,changes};
}
function commit(cwd,parent,files,label) {
  const index=path.join(root,`data/update-context-${label}.index`);
  git(cwd,['read-tree',parent],undefined,index);
  for(const [file,content] of files) { const blob=git(cwd,['hash-object','-w','--stdin'],content,index); git(cwd,['update-index','--add','--cacheinfo',`100644,${blob},${file}`],undefined,index); }
  git(cwd,['diff','--cached','--check',parent],undefined,index);
  const tree=git(cwd,['write-tree'],undefined,index);
  const sha=git(cwd,['commit-tree',tree,'-p',parent,'-m','Preserve analysis update attribution and original-price context'],undefined,index);
  git(cwd,['update-ref',`refs/codex/watchlist-update-context-${label}`,sha],undefined,index);
  return sha;
}
module.exports={prepare,root,runtime,platformParent,runtimeParent};
if(require.main===module) { const {platform,changes}=prepare(); console.log(JSON.stringify({platformParent,runtimeParent,platform:[...platform.keys()],runtime:[...changes.keys()]},null,2)); if(process.argv.includes('--commit')) console.log(JSON.stringify({platform:commit(root,platformParent,platform,'platform'),runtime:commit(runtime,runtimeParent,changes,'runtime')})); }
