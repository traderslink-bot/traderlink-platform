import 'server-only';
import type Database from 'better-sqlite3';
import { withReadonlyPlatformDatabase } from '@/src/modules/platform/server/database/open-readonly-platform-database';
import { withJournalAdminDatabase } from '@/src/modules/platform/server/administration/platform-admin-authorization';
import { requireTraderLinkPlatformDiscordMemberRequestIdentity } from '@/src/modules/platform/server/authentication/require-platform-request-scope';
import { hasPlatformDiscordPremiumAccess } from './platform-discord-watchlist-entitlement';
import { analysisVisibilitySymbol } from './watchlist-analysis-visibility';

export function readLevelsPremiumOnly(db: Database.Database, symbol: string): boolean {
  if (!analysisVisibilitySymbol.test(symbol)) throw Error('Invalid ticker.');
  const row=db.prepare<[string],{premium_only:number}>('SELECT premium_only FROM platform_watchlist_levels_visibility WHERE symbol=?').get(symbol);
  if(row && row.premium_only!==0 && row.premium_only!==1) throw Error('Invalid access setting.');
  return row?.premium_only===1;
}
export function saveLevelsPremiumOnly(db: Database.Database,input:{symbol:string;premiumOnly:boolean;actorUserId:string}):void {
  if(!analysisVisibilitySymbol.test(input.symbol)||typeof input.premiumOnly!=='boolean')throw Error('Invalid access setting.');
  db.transaction(()=>{
    const previous=readLevelsPremiumOnly(db,input.symbol),now=new Date().toISOString();
    db.prepare(`INSERT INTO platform_watchlist_levels_visibility(symbol,premium_only,updated_at_utc,updated_by_user_id)
      VALUES(?,?,?,?) ON CONFLICT(symbol) DO UPDATE SET premium_only=excluded.premium_only,updated_at_utc=excluded.updated_at_utc,updated_by_user_id=excluded.updated_by_user_id`)
      .run(input.symbol,Number(input.premiumOnly),now,input.actorUserId);
    db.prepare('INSERT INTO platform_watchlist_levels_visibility_audit(symbol,previous_premium_only,premium_only,changed_at_utc,actor_user_id) VALUES(?,?,?,?,?)')
      .run(input.symbol,Number(previous),Number(input.premiumOnly),now,input.actorUserId);
  })();
}
export function canViewWatchlistLevels(headers:Headers,symbol:string):boolean {
  try{if(withJournalAdminDatabase(headers,()=>true))return true;}catch{/* Ordinary member. */}
  try{
    const identity=requireTraderLinkPlatformDiscordMemberRequestIdentity(headers);
    if(identity.discord && hasPlatformDiscordPremiumAccess(identity.discord))return true;
    return !withReadonlyPlatformDatabase({},db=>readLevelsPremiumOnly(db,symbol.toUpperCase()));
  }catch{return false;}
}
