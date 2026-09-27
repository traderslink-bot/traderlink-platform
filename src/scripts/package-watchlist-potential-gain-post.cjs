// Build only this feature's existing-file edits from an immutable integration base.
const fs=require('node:fs'),cp=require('node:child_process'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const base='a741710f53503339b7df1882b472b00f8c0f56cb';
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'watchlist-gain-patch-'));let patch='';
const normalize=s=>s.replace(/\r\n/g,'\n');
function replace(s,a,b){assert.equal(s.split(a).length,2,'Unique anchor: '+a.slice(0,90));return s.replace(a,b);}
function produce(file,transform){
 const before=normalize(cp.execFileSync('git',['show',`${base}:${file}`],{encoding:'utf8'}));const after=transform(before);assert.notEqual(after,before);
 const a=path.join(tmp,'before'),b=path.join(tmp,'after');fs.writeFileSync(a,before);fs.writeFileSync(b,after);
 let diff;try{diff=cp.execFileSync('git',['diff','--no-index','--',a,b],{encoding:'utf8'});}catch(error){assert.equal(error.status,1);diff=error.stdout;}
 patch+=normalize(diff).replace(/^diff --git .*$/m,`diff --git a/${file} b/${file}`).replace(/^--- .*$/m,`--- a/${file}`).replace(/^\+\+\+ .*$/m,`+++ b/${file}`);
}
produce('app/watchlist/live-watchlist-client.tsx',s=>replace(s,'function PotentialGainCard({ symbol }','export function PotentialGainCard({ symbol }'));
produce('app/(dashboard)/admin/watchlist/watchlist-runtime-admin-client.tsx',s=>{
 s=replace(s,'const IndicatorAuditPanel = dynamic(() => import("./watchlist-indicator-audit-panel"));','const IndicatorAuditPanel = dynamic(() => import("./watchlist-indicator-audit-panel"));\nconst PotentialGainPost = dynamic(() => import("./watchlist-potential-gain-post").then(module => module.WatchlistPotentialGainPost));');
 s=replace(s,'  const [editingSymbol, setEditingSymbol] = useState<string | null>(null);','  const [editingSymbol, setEditingSymbol] = useState<string | null>(null);\n  const [gainPostSymbol, setGainPostSymbol] = useState<string | null>(null);');
 s=replace(s,'card?: unknown; dipBuyPlanVisible?: unknown','card?: unknown; dipBuyPlanVisible?: unknown; symbol?: unknown');
 s=replace(s,'      if (message.type === "navigation-ready") { syncNavigation(); return; }','      if (message.type === "navigation-ready") { syncNavigation(); return; }\n      if (message.type === "post-potential-gain" && typeof message.symbol === "string" && /^[A-Z][A-Z0-9]{0,9}(?:[.-][A-Z0-9]{1,2})?$/.test(message.symbol)) { setGainPostSymbol(message.symbol); return; }');
 return replace(s,'  return (\n    <>','  return (\n    <>\n      {gainPostSymbol && <PotentialGainPost key={gainPostSymbol} symbol={gainPostSymbol} onClose={() => setGainPostSymbol(null)} />}');
});
produce('src/modules/platform/server/database/platform-migration-manifest.ts',s=>{
 s='import { watchlistPotentialGainPostsMigration } from "./migrations/0147_watchlist_potential_gain_posts";\n'+s;
 const end=s.indexOf('\nexport const platformMigrationManifest =');const at=s.lastIndexOf('  ]);',end);assert.ok(at>0);
 s=s.slice(0,at)+'    Object.freeze({ sourcePath: "src/modules/platform/server/database/migrations/0147_watchlist_potential_gain_posts.ts", migration: watchlistPotentialGainPostsMigration }),\n'+s.slice(at);
 return replace(s,'const managedTablesByMigrationId: Readonly<Record<string, readonly string[]>> =\n  Object.freeze({','const managedTablesByMigrationId: Readonly<Record<string, readonly string[]>> =\n  Object.freeze({\n    "0147_watchlist_potential_gain_posts": Object.freeze(["platform_watchlist_potential_gain_posts"]),');
});
produce('src/modules/help/watchlist-guides.ts',s=>{
 const anchor=s.split('\n').find(l=>l.includes('blocks: [{')&&l.includes('Uncheck Generate analysis'));assert.ok(anchor);
 return replace(s,anchor,anchor+'\n      { kind: "paragraph", text: "Post potential gain opens an image preview for that ticker in Watchlist Admin. Add an optional message, then choose Send to Discord to post that exact image to the separate potential gain channel. Every potential gain post tags @everyone, including posts without an optional message. It uses the existing potential gain card, does not generate analysis, and does not send email or push notifications. The image does not update after posting. If delivery cannot be confirmed, check Discord before posting again." },');
});
fs.writeFileSync('docs/migration/watchlist-potential-gain-discord-platform.patch',patch);
fs.unlinkSync(path.join(tmp,'before'));fs.unlinkSync(path.join(tmp,'after'));fs.rmdirSync(tmp);
console.log('Packaged four existing-file changes on '+base+'; new files delivered separately.');
