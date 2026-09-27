// Reproducible, allowlisted patch generation from immutable production parent.
const fs=require('node:fs'),cp=require('node:child_process'),os=require('node:os'),path=require('node:path');
const assert=require('node:assert/strict');
const base='a741710f53503339b7df1882b472b00f8c0f56cb';
const root=process.cwd(),tmp=fs.mkdtempSync(path.join(os.tmpdir(),'watchlist-auto-patch-'));
const normalize=s=>s.replace(/\r\n/g,'\n');
const local=p=>normalize(fs.readFileSync(p,'utf8'));
let patch='';
function replace(s,before,after){assert.equal(s.split(before).length,2,`Unique anchor: ${before.slice(0,70)}`);return s.replace(before,after);}
function produce(file,transform){
  const before=normalize(cp.execFileSync('git',['show',`${base}:${file}`],{encoding:'utf8'}));
  const after=transform(before);assert.notEqual(after,before,file);
  const a=path.join(tmp,'before'),b=path.join(tmp,'after');fs.writeFileSync(a,before);fs.writeFileSync(b,after);
  let diff;try{diff=cp.execFileSync('git',['diff','--no-index','--',a,b],{encoding:'utf8'});}catch(e){assert.equal(e.status,1);diff=e.stdout;}
  diff=normalize(diff).replace(/^diff --git .*$/m,`diff --git a/${file} b/${file}`).replace(/^--- .*$/m,`--- a/${file}`).replace(/^\+\+\+ .*$/m,`+++ b/${file}`);
  patch+=diff;
}
const notification='src/modules/watchlist/server/notifications/watchlist-notification-runtime.ts';
produce(notification,s=>{
  s=replace(s,'import { WatchlistPublicationNotificationStore } from "./watchlist-publication-notification-store";',
    'import { WatchlistPublicationNotificationStore } from "./watchlist-publication-notification-store";\nimport { readAutomaticAnalysisEvents, reconcileOwnerReviewNotifications } from "./watchlist-automatic-notifications";');
  const content=local(notification),start=content.indexOf('    const automatic = await readAutomaticAnalysisEvents()'),end=content.indexOf('    const now = new Date();',start);
  assert.ok(start>0&&end>start);
  s=replace(s,'    database = openPlatformDatabase({ mode: "runtime" });\n',content.slice(start,end));
  return replace(s,"WHERE state='pending' AND next_check_at_utc<=? ORDER BY requested_at_utc LIMIT 3","WHERE state='pending' AND actor!='runtime:automatic-boundary' AND next_check_at_utc<=? ORDER BY requested_at_utc LIMIT 3");
});
const route='app/api/admin/watchlist/runtime/[...path]/route.ts';
produce(route,s=>{
  const anchor='import { recordWatchlistApprovalNotificationIntent } from "@/src/modules/watchlist/server/notifications/watchlist-notification-runtime";';
  s=replace(s,anchor,anchor+'\nimport { ownerReviewDeliveryStatus } from "@/src/modules/watchlist/server/notifications/watchlist-automatic-notifications";');
  const content=local(route),start=content.indexOf('  let responseBody = result.body;'),end=content.indexOf('    headers: {',start);
  assert.ok(start>0&&end>start);
  return replace(s,'  return new Response(result.body, {\n',content.slice(start,end));
});
produce('src/modules/platform/server/database/platform-migration-manifest.ts',s=>{
  s='import { watchlistOwnerReviewNotificationsMigration } from "./migrations/0146_watchlist_owner_review_notifications";\n'+s;
  const end=s.indexOf('\nexport const platformMigrationManifest =');const pos=s.lastIndexOf('  ]);',end);assert.ok(pos>0);
  s=s.slice(0,pos)+'    Object.freeze({ sourcePath: "src/modules/platform/server/database/migrations/0146_watchlist_owner_review_notifications.ts", migration: watchlistOwnerReviewNotificationsMigration }),\n'+s.slice(pos);
  return replace(s,'const managedTablesByMigrationId: Readonly<Record<string, readonly string[]>> =\n  Object.freeze({','const managedTablesByMigrationId: Readonly<Record<string, readonly string[]>> =\n  Object.freeze({\n    "0146_watchlist_owner_review_notifications": Object.freeze(["platform_watchlist_owner_review_deliveries"]),');
});
produce('src/modules/help/watchlist-guides.ts',s=>{
  const paragraphs=local('src/modules/help/watchlist-guides.ts').split('\n').filter(l=>l.includes('text: "Automatically publish refreshed analyses')||l.includes('text: "Notify me when an analysis needs review'));
  assert.equal(paragraphs.length,2);
  const anchor=s.split('\n').find(l=>l.includes('blocks: [{')&&l.includes('Uncheck Generate analysis'));assert.ok(anchor);
  return replace(s,anchor,anchor+'\n'+paragraphs.join('\n'));
});
for (const name of ['watchlist-publication-notification-contract.ts','watchlist-publication-notification-store.ts','watchlist-notification-delivery.ts']) {
  const file='src/modules/watchlist/server/notifications/'+name;
  produce(file,()=>name==='watchlist-publication-notification-contract.ts'
    ? local(file).replace('typeof event.notifyUsers !== "boolean" ||\n    (event.notificationKind === "listing" && event.notifyUsers !== true)', 'typeof event.notifyUsers !== "boolean"')
    : local(file));
}
fs.writeFileSync(path.join(root,'docs/migration/watchlist-automatic-refresh-platform.patch'),patch);
console.log('Generated exact seven-file patch on '+base+'; new helper and migration delivered separately.');
// Only the two known generated files inside our uniquely-created temporary directory.
fs.unlinkSync(path.join(tmp,'before'));fs.unlinkSync(path.join(tmp,'after'));fs.rmdirSync(tmp);
