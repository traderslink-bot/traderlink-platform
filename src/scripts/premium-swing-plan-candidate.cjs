// Build an explicit in-memory overlay on the coordinator-confirmed release parent.
// Does not change the checkout/index, create a worktree, or publish anything.
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const parent='63290941b32b7b41f332c7ed83cc91ff43633146';
const files=[
  'src/modules/swings/swing-plan-contract.ts',
  'src/modules/swings/swing-rich-edit.ts',
  'src/modules/swings/server/swing-plan-request.ts',
  'src/modules/swings/server/swing-plan-store.ts',
  'src/modules/swings/server/swing-plan-original.ts',
  'src/modules/swings/server/swing-plan-discord.ts',
  'src/modules/swings/server/swing-idea-visits.ts',
  'src/modules/platform/server/database/migrations/0154_platform_premium_swing_plan_authorship.ts',
  'app/admin/journal/swing-plans/page.tsx',
  'app/admin/journal/swing-plans/swing-plan-editor.tsx',
  'app/admin/journal/swing-plans/swing-rich-editor.tsx',
  'app/admin/journal/swing-plans/swing-post-editor.tsx',
  'app/admin/journal/swings/page.tsx',
  'app/api/admin/journal/swing-plans/route.ts',
  'app/api/admin/journal/swing-plans/discord/route.ts',
  'app/api/swings/visits/route.ts',
  'app/swings/[ideaId]/page.tsx',
  'app/swings/swing-plan-content.tsx',
  'app/swings/swing-locked-preview.tsx',
  'app/swings/swing-visit-recorder.tsx',
  'src/modules/help/swing-plan-owner-guide.ts',
  'src/scripts/check-swing-plan-authorship.cjs',
  'src/scripts/check-swing-plan-delivery.cjs',
  'src/scripts/check-swing-plan-page.cjs',
  'src/scripts/typecheck-swing-plan-authorship.cjs',
  'src/scripts/premium-swing-plan-candidate.cjs',
  'src/scripts/checkpoint-premium-swing-plan.cjs',
  'docs/migration/premium-swing-plan-authoring-plan.md',
  'docs/migration/premium-swing-plan-authoring-progress.md',
  'docs/migration/premium-swing-plan-authoring-handoff.md',
];
const normalize=text=>text.replace(/\r\n/g,'\n');
const baseCache=new Map();
function base(file){if(!baseCache.has(file))baseCache.set(file,execFileSync('git',['show',`${parent}:${file}`],{encoding:'utf8',maxBuffer:8*1024*1024}));return baseCache.get(file);}
function replaceOnce(text,old,next){if(text.split(old).length!==2)throw Error('Release anchor missing or duplicated: '+old.slice(0,100));return text.replace(old,next);}
function candidate(){
  const result=new Map(files.map(file=>[file,normalize(fs.readFileSync(path.resolve(file),'utf8'))]));
  const manifest='src/modules/platform/server/database/platform-migration-manifest.ts';
  let source=normalize(base(manifest));
  source='import { platformPremiumSwingPlanAuthorshipMigration } from "./migrations/0154_platform_premium_swing_plan_authorship";\n'+source;
  const predecessor='    Object.freeze({ sourcePath: "src/modules/platform/server/database/migrations/0153_platform_watchlist_category_move_notifications.ts", migration: platformWatchlistCategoryMoveNotificationsMigration }),';
  source=replaceOnce(source,predecessor,predecessor+'\n    Object.freeze({ sourcePath: "src/modules/platform/server/database/migrations/0154_platform_premium_swing_plan_authorship.ts", migration: platformPremiumSwingPlanAuthorshipMigration }),');
  source=replaceOnce(source,'  Object.freeze({\n    "0153_platform_watchlist_category_move_notifications"','  Object.freeze({\n    "0154_platform_premium_swing_plan_authorship": Object.freeze(["platform_swing_plans", "platform_swing_plan_versions", "platform_swing_plan_publications", "platform_swing_plan_deliveries"]),\n    "0153_platform_watchlist_category_move_notifications"');
  result.set(manifest,source);
  const shell='app/admin/journal/journal-admin-shell.tsx';
  const anchor='  { href: "/admin/journal/swings", label: "Swing Idea Activity", icon: <InsightsRoundedIcon /> },';
  result.set(shell,replaceOnce(normalize(base(shell)),anchor,anchor+'\n  { href: "/admin/journal/swing-plans", label: "Swing Trade Plans", icon: <InsightsRoundedIcon /> },'));
  const plan='docs/migration/premium-swing-ideas-plan.md';
  result.set(plan,normalize(base(plan))+'\n## Owner authoring extension\n\nApproved separate authoring work is controlled by [Premium swing plan authoring](premium-swing-plan-authoring-plan.md). Member navigation remains unchanged.\n');
  const register='docs/migration/migration-register.md';
  result.set(register,normalize(base(register))+'\n## Premium swing plan authoring — October 1, 2026\n\nReserved migration `0154_platform_premium_swing_plan_authorship`, exact predecessor `0153_platform_watchlist_category_move_notifications`. Adds four separate Platform authoring/publication/delivery tables; preserves migration 0139 visit records and all Watchlist storage. Registered in this candidate, unapplied at preparation. [Plan](premium-swing-plan-authoring-plan.md) · [Progress and release gates](premium-swing-plan-authoring-progress.md).\n');
  return result;
}
module.exports={parent,files,base,candidate};
if(require.main===module){const overlay=candidate();console.log(JSON.stringify({parent,files:[...overlay.keys()],count:overlay.size,writes:false},null,2));}
