// @vitest-environment node
import {it,expect,vi,beforeEach} from 'vitest';
import Database from 'better-sqlite3';
import {watchlistIndicatorsVisibilityMigration} from '@/src/modules/platform/server/database/migrations/0222_watchlist_indicators_visibility';
const adapter=vi.hoisted(()=>({db:null as unknown,owner:false,signed:true,premium:false}));
vi.mock('./watchlist-admin-authorization',()=>({withWatchlistAdminDatabase:(_h:unknown,fn:()=>unknown)=>{if(!adapter.owner)throw Error('not owner');return fn();}}));
vi.mock('@/src/modules/platform/server/database/open-readonly-platform-database',()=>({withReadonlyPlatformDatabase:(_o:unknown,fn:(db:unknown)=>unknown)=>fn(adapter.db)}));
vi.mock('@/src/modules/platform/server/authentication/require-platform-request-scope',()=>({requireTraderLinkPlatformAuthenticatedRequestIdentity:()=>{if(!adapter.signed)throw Error('not signed');return {scope:{userId:'member'},discord:{guildOwner:false,roleIds:[]}};}}));
vi.mock('./platform-discord-watchlist-entitlement',()=>({hasPlatformDiscordPremiumAccess:()=>adapter.premium}));
import {readIndicatorsPremiumOnly,saveIndicatorsPremiumOnly,canViewWatchlistIndicators} from './watchlist-indicators-visibility';
let db:Database.Database;
beforeEach(()=>{db=new Database(':memory:');db.exec('CREATE TABLE platform_users(user_id TEXT PRIMARY KEY); INSERT INTO platform_users VALUES(\'owner\'); CREATE TABLE live_watchlist_symbols(symbol TEXT,state_json TEXT); INSERT INTO live_watchlist_symbols VALUES(\'TEST\',\'{"watchlistGroup":"main"}\'),(\'OTHER\',\'{"watchlistGroup":"main"}\');');for(const sql of watchlistIndicatorsVisibilityMigration.statements)db.exec(sql);adapter.db=db;adapter.owner=false;adapter.signed=true;adapter.premium=false;});
it('persists independent per-ticker state and audits each toggle',()=>{
 expect(readIndicatorsPremiumOnly(db,'TEST')).toBe(true);
 expect(readIndicatorsPremiumOnly(db,'OTHER')).toBe(true);
 expect(canViewWatchlistIndicators(new Headers(),'TEST')).toBe(false);
 adapter.premium=true;expect(canViewWatchlistIndicators(new Headers(),'TEST')).toBe(true);
 adapter.premium=false;adapter.owner=true;expect(canViewWatchlistIndicators(new Headers(),'TEST')).toBe(true);
 adapter.owner=false;saveIndicatorsPremiumOnly(db,{symbol:'TEST',premiumOnly:false,actorUserId:'owner'});
 expect(canViewWatchlistIndicators(new Headers(),'TEST')).toBe(true);
 expect(readIndicatorsPremiumOnly(db,'OTHER')).toBe(true);
 adapter.signed=false;expect(canViewWatchlistIndicators(new Headers(),'TEST')).toBe(false);
 adapter.signed=true;saveIndicatorsPremiumOnly(db,{symbol:'TEST',premiumOnly:true,actorUserId:'owner'});
 expect(canViewWatchlistIndicators(new Headers(),'TEST')).toBe(false);
 expect(db.prepare('SELECT previous_premium_only,premium_only FROM platform_watchlist_indicators_visibility_audit ORDER BY audit_id').all()).toEqual([{previous_premium_only:1,premium_only:0},{previous_premium_only:0,premium_only:1}]);
 db.close();
});
it('rejects invalid settings and rolls back failed audit writes',()=>{
 expect(()=>saveIndicatorsPremiumOnly(db,{symbol:'../bad',premiumOnly:true,actorUserId:'owner'})).toThrow();
 db.exec('DROP TABLE platform_watchlist_indicators_visibility_audit');
 expect(()=>saveIndicatorsPremiumOnly(db,{symbol:'TEST',premiumOnly:false,actorUserId:'owner'})).toThrow();
 expect(readIndicatorsPremiumOnly(db,'TEST')).toBe(true);db.close();
});
it('new preference and audit tables follow the real account erasure closure without affecting another owner',async()=>{
 const {captureErasureClosure}=await import('@/src/modules/platform/server/privacy/platform-erasure-closure');
 db.exec("INSERT INTO platform_users VALUES('other');");
 saveIndicatorsPremiumOnly(db,{symbol:'TEST',premiumOnly:true,actorUserId:'owner'});
 saveIndicatorsPremiumOnly(db,{symbol:'OTHER',premiumOnly:true,actorUserId:'other'});
 db.transaction(()=>{
  const closure=captureErasureClosure(db,[{table:'platform_users',column:'user_id',value:'owner'}]);
  try{closure.deleteRows();}finally{closure.dispose();}
 })();
 expect(db.prepare('SELECT symbol FROM platform_watchlist_indicators_visibility').all()).toEqual([{symbol:'OTHER'}]);
 expect(db.prepare('SELECT actor_user_id FROM platform_watchlist_indicators_visibility_audit').all()).toEqual([{actor_user_id:'other'}]);
 expect(db.prepare('PRAGMA foreign_key_check').all()).toEqual([]);db.close();
});
