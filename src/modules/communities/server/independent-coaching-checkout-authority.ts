import 'server-only';
import type Database from 'better-sqlite3';
import type {TraderLinkPlatformRequestIdentity} from '@/src/modules/platform/server/authentication/require-platform-request-scope';
import {readTraderLinkPlatformSessionToken} from '@/src/modules/platform/server/authentication/require-platform-request-scope';
import {PlatformSessionRepository,type ResolvedPlatformSession} from '@/src/modules/platform/server/authentication/platform-session-repository';
import {hashPlatformSessionToken} from '@/src/modules/platform/server/authentication/platform-session-service';
import {deriveAuthenticatedUserJournalScope} from '@/src/modules/platform/server/authentication/authenticated-user-journal-scope';
import {deriveDevelopmentOwnerJournalScope} from '@/src/modules/journal/server/accounts/journal-development-owner-scope';
import {deriveJournalAccountSelectionRef} from '@/src/modules/platform/contracts/journal-account-selection';
import {hasWatchlistDashboardNavigationAccessInDatabase} from '@/src/modules/watchlist/server/access/watchlist-dashboard-navigation-access';
import {requireCoachingPilotRequestIdentity} from './coaching-pilot-request-identity';

type WithDatabase=<T>(operation:(db:Database.Database)=>T)=>T;
function scopeBinding(identity:TraderLinkPlatformRequestIdentity){
 const s=identity.scope;
 return JSON.stringify([identity.mode,identity.sessionId,s.userId,s.workspaceId,s.workspaceRole,[...s.allowedAccountIds].sort(),s.activeAccountId]);
}
function sessionBinding(s:ResolvedPlatformSession){return JSON.stringify([s.sessionId,s.userId,s.authProvider,s.createdAtUtc,s.expiresAtUtc]);}
const fail=()=>{throw new Error('The original coaching sign-in or account changed. Reopen your accepted agreement before paying.');};

/** Privately constructed from the normal request boundary. This is an original
 * invocation validator, not an effect ticket or browser-supplied callback. */
export class IndependentCheckoutInvocation{
 readonly #headers:Headers;
 readonly #identity:TraderLinkPlatformRequestIdentity;
 readonly #binding:string;
 readonly #digest:string|null;
 #session:string|null=null;
 private constructor(headers:Headers,identity:TraderLinkPlatformRequestIdentity){
  this.#headers=new Headers(headers);
  this.#identity=Object.freeze({...identity,scope:Object.freeze({...identity.scope,allowedAccountIds:Object.freeze([...identity.scope.allowedAccountIds])})});
  this.#binding=scopeBinding(this.#identity);
  const token=readTraderLinkPlatformSessionToken(this.#headers);
  this.#digest=identity.mode==='platform_session'&&token?hashPlatformSessionToken(token):null;
  if(identity.mode==='platform_session'&&(!this.#digest||!identity.sessionId))fail();
 }
 static fromRequest(headers:Headers,identity:TraderLinkPlatformRequestIdentity,withDatabase:WithDatabase):IndependentCheckoutInvocation{
  const value=new IndependentCheckoutInvocation(headers,identity);
  value.revalidateRequest();
  // Capture original native session/expiry before any provider await. The
  // normal request facade has already closed its writer before this frame.
  withDatabase(db=>db.transaction(()=>value.assertInDatabase(db,new Date().toISOString())).immediate());
  return value;
 }
 get actorUserId(){return this.#identity.scope.userId;}
 revalidateRequest():void{
  if(scopeBinding(requireCoachingPilotRequestIdentity(this.#headers))!==this.#binding)fail();
 }
 assertInDatabase(db:Database.Database,nowUtc:string):void{
  if(!db.inTransaction)throw new Error('Validate checkout inside its current database transaction.');
  const identity=this.#identity,s=identity.scope;
  const selection=s.activeAccountId?deriveJournalAccountSelectionRef(s.workspaceId,s.activeAccountId):null;
  if(identity.mode==='platform_session'){
   const session=this.#digest?new PlatformSessionRepository(db).findActiveByTokenDigest(this.#digest,nowUtc):null;
   if(!session||session.sessionId!==identity.sessionId||session.userId!==s.userId)fail();
   const binding=sessionBinding(session!);
   if(this.#session===null)this.#session=binding;else if(this.#session!==binding)fail();
   if(scopeBinding({...identity,scope:deriveAuthenticatedUserJournalScope(db,s.userId,selection)})!==this.#binding)fail();
  }else if(identity.mode==='local_development'){
   if(scopeBinding({...identity,scope:deriveDevelopmentOwnerJournalScope(db,undefined,selection).scope})!==this.#binding)fail();
  }else fail();
  if(!hasWatchlistDashboardNavigationAccessInDatabase(db,identity))fail();
 }
}
