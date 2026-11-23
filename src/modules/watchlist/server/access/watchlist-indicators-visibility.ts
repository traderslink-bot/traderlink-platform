import 'server-only';
import type Database from 'better-sqlite3';
import { withReadonlyPlatformDatabase } from '@/src/modules/platform/server/database/open-readonly-platform-database';
import { withWatchlistAdminDatabase } from './watchlist-admin-authorization';
import { requireTraderLinkPlatformAuthenticatedRequestIdentity } from '@/src/modules/platform/server/authentication/require-platform-request-scope';
import { hasPlatformDiscordPremiumAccess } from './platform-discord-watchlist-entitlement';
import { analysisVisibilitySymbol } from './watchlist-analysis-visibility';
import { hasWatchlistPremiumPlanAccess, readWatchlistDefaultPremiumOnly } from './watchlist-plan-policy';

export function readIndicatorsPremiumOnly(db:Database.Database,symbol:string):boolean {
 if (!analysisVisibilitySymbol.test(symbol)) throw Error('Invalid ticker.');
 // Compatible reads before the additive migration; writes never silently succeed.
 if (!db.prepare("SELECT 1 FROM sqlite_schema WHERE type='table' AND name='platform_watchlist_indicators_visibility'").get()) return readWatchlistDefaultPremiumOnly(db, symbol);
 const row=db.prepare<[string],{premium_only:number}>('SELECT premium_only FROM platform_watchlist_indicators_visibility WHERE symbol=?').get(symbol);
 if(row && row.premium_only!==0 && row.premium_only!==1)throw Error('Invalid access setting.');
 return row ? row.premium_only===1 : readWatchlistDefaultPremiumOnly(db, symbol);
}
export function saveIndicatorsPremiumOnly(db:Database.Database,input:{symbol:string;premiumOnly:boolean;actorUserId:string}):void {
 if(!analysisVisibilitySymbol.test(input.symbol)||typeof input.premiumOnly!=='boolean')throw Error('Invalid access setting.');
 db.transaction(()=>{
  const previous=readIndicatorsPremiumOnly(db,input.symbol),now=new Date().toISOString();
  db.prepare(`INSERT INTO platform_watchlist_indicators_visibility(symbol,premium_only,updated_at_utc,updated_by_user_id) VALUES(?,?,?,?) ON CONFLICT(symbol) DO UPDATE SET premium_only=excluded.premium_only,updated_at_utc=excluded.updated_at_utc,updated_by_user_id=excluded.updated_by_user_id`).run(input.symbol,Number(input.premiumOnly),now,input.actorUserId);
  db.prepare('INSERT INTO platform_watchlist_indicators_visibility_audit(symbol,previous_premium_only,premium_only,changed_at_utc,actor_user_id) VALUES(?,?,?,?,?)').run(input.symbol,Number(previous),Number(input.premiumOnly),now,input.actorUserId);
 })();
}
/** Additional per-ticker restriction. Existing plan entitlements remain required at callers. */
export function canViewWatchlistIndicators(headers:Headers,symbol:string):boolean {
 try {if(withWatchlistAdminDatabase(headers,()=>true))return true;}catch{/* Ordinary member. */}
 try {
  const identity=requireTraderLinkPlatformAuthenticatedRequestIdentity(headers,{membershipFeatures:['watchlist.access']});
  return withReadonlyPlatformDatabase({},db=> !readIndicatorsPremiumOnly(db,symbol.toUpperCase()) || Boolean(identity.discord && hasPlatformDiscordPremiumAccess(identity.discord)) ||
    hasWatchlistPremiumPlanAccess(db, identity.scope.userId, "indicators"));
 }catch{return false;}
}
