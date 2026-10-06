const cp=require('node:child_process'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..');
const runtime='C:/Users/jerac/Documents/TraderLink/levels-system-post-mtf-handoff-stability';
const platformParent='c4b87986de09bb97438c719dc1910ba7212d7ff6';
const runtimeParent='c926b396e5f71e347583e23b65321e9b93e58fb1';
const git=(cwd,args,input,index)=>cp.execFileSync('git',['-c',`safe.directory=${cwd}`,...args],{cwd,input,encoding:'utf8',maxBuffer:12e6,env:{...process.env,...(index?{GIT_INDEX_FILE:index}:{})}}).trimEnd();
const base=(cwd,parent,file)=>git(cwd,['show',`${parent}:${file}`])+'\n';
const replace=(s,a,b)=>{assert.equal(s.split(a).length,2,`Unique anchor ${a.slice(0,80)}`);return s.replace(a,b);};
function helper(s){
 s=replace(s,'  automatic: boolean;','  automatic: boolean;\n  hasPreviousAnalysis?: boolean;');
 s=replace(s,'/** Prices come only',`/** A listing-only approval is not an analysis, even if the ticker is public. */
function containsPublishedAnalysis(event: Record<string, unknown>): boolean {
  const body = record(event.body);
  const website = record(record(body.publication).website);
  if (body.draftRevision === 0 || website.tradersLinkAiReadCardVisible === false) return false;
  const card = record(record(website.cards).tradersLinkAiRead);
  try { return Object.keys(record(JSON.parse(String(card.body)))).length > 0; } catch { return false; }
}

/** Prices come only`);
 s=replace(s,'if (current && frozen) return { ...frozen, automatic:', 'if (current && frozen) return { ...frozen, hasPreviousAnalysis: frozen.hasPreviousAnalysis ?? approvals.some(event => Number(event.revision) < approvalRevision && containsPublishedAnalysis(event)), automatic:');
 s=replace(s,'    automatic: current?.actor', '    hasPreviousAnalysis: approvals.some(event => Number(event.revision) < approvalRevision && containsPublishedAnalysis(event)),\n    automatic: current?.actor');
 s=replace(s,'return { ...(typeof item.categoryMoveNote','return { ...(typeof item.hasPreviousAnalysis === "boolean" ? { hasPreviousAnalysis: item.hasPreviousAnalysis } : {}), ...(typeof item.categoryMoveNote');
 if(s.includes('export function analysisUpdateContextForDraft'))s=replace(s,'return { automatic:false,firstAnalysisPrice','return { hasPreviousAnalysis: approvals.some(containsPublishedAnalysis), automatic:false,firstAnalysisPrice');
 return s;
}
function prepare(){
 const changes=new Map(),platform=new Map();
 const rh='src/lib/ai/watchlist-analysis-update-context.ts',ph='src/modules/watchlist/server/notifications/watchlist-analysis-update-copy.ts';
 changes.set(rh,helper(base(runtime,runtimeParent,rh)));platform.set(ph,helper(base(root,platformParent,ph)));
 const preview='src/lib/ai/traderslink-ai-read-publication-preview.ts';let s=base(runtime,runtimeParent,preview);
 s=replace(s,'  return [appendDiscordMentions(analysisUpdate ?', '  const firstAnalysis = analysisUpdate && context?.hasPreviousAnalysis === false;\n  return [appendDiscordMentions(firstAnalysis ? `${read.symbol} Analysis published\\nThe first analysis is now available. View the setups and levels in the app.` + linked.slice(linked.indexOf("\\n\\n")) : analysisUpdate ?');
 changes.set(preview,s);
 const contract='src/modules/watchlist/server/notifications/watchlist-publication-notification-contract.ts';s=base(root,platformParent,contract);
 s=replace(s,'  const attribution = ownerApproved ?', '  const firstAnalysis = kind === "analysis" && context?.hasPreviousAnalysis === false;\n  const analysisTitle = firstAnalysis ? `${ticker} Analysis published` : `${ticker} Analysis updated`;\n  const analysisBody = firstAnalysis ? "The first analysis is now available. View the setups and levels in the app." : ANALYSIS_UPDATE_EXPLANATION;\n  const attribution = ownerApproved ?');
 s=replace(s,'kind === "analysis" && context?.automatic ?', 'kind === "analysis" && !firstAnalysis && context?.automatic ?');
 s=replace(s,'const comparison = analysisUpdateComparison(context);','const comparison = firstAnalysis ? null : analysisUpdateComparison(context);');
 s=s.replaceAll('kind === "analysis" ? `${ticker} Analysis updated`','kind === "analysis" ? analysisTitle').replace('comparison ?? ANALYSIS_UPDATE_EXPLANATION','comparison ?? analysisBody').replace('context?.categoryMoveNote,comparison, ANALYSIS_UPDATE_EXPLANATION','context?.categoryMoveNote,comparison, analysisBody');
 platform.set(contract,s);
 const help='src/modules/help/watchlist-guides.ts';
 platform.set(help,replace(base(root,platformParent,help),'announce it, or leave it unchecked to publish silently.','announce it, or leave it unchecked to publish silently. The first published analysis is announced as Analysis published; later published analyses use Analysis updated. Listing a ticker without analysis does not count as an earlier analysis.'));
 for(const file of ['docs/migration/watchlist-first-analysis-notification-plan.md','docs/migration/watchlist-first-analysis-notification-progress.md','src/scripts/package-watchlist-first-analysis.cjs','src/scripts/verify-watchlist-first-analysis.cjs']) platform.set(file,require('node:fs').readFileSync(path.join(root,file),'utf8'));
 return {changes,platform};
}
function commit(cwd,parent,files,label){const index=path.join(root,`data/first-analysis-${label}.index`);git(cwd,['read-tree',parent],undefined,index);for(const[file,text]of files){const blob=git(cwd,['hash-object','-w','--stdin'],text,index);git(cwd,['update-index','--add','--cacheinfo',`100644,${blob},${file}`],undefined,index);}git(cwd,['diff','--cached','--check',parent],undefined,index);const tree=git(cwd,['write-tree'],undefined,index);const sha=git(cwd,['commit-tree',tree,'-p',parent,'-m','Distinguish first published analysis from follow-up notifications'],undefined,index);git(cwd,['update-ref',`refs/codex/watchlist-first-analysis-${label}`,sha],undefined,index);return sha;}
module.exports={prepare,root,runtime,platformParent,runtimeParent,base,commit};
if(require.main===module){const {changes,platform}=prepare();console.log(JSON.stringify({runtimeParent,platformParent,runtimeFiles:[...changes.keys()],platformFiles:[...platform.keys()]}));if(process.argv.includes('--commit'))console.log(JSON.stringify({runtime:commit(runtime,runtimeParent,changes,'runtime'),platform:commit(root,platformParent,platform,'platform')}));}
