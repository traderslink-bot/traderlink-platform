import {hasSharedChartDataAccess} from "@/src/modules/market-data/server/chart-dashboard-access";
import {hasSharedWorkspaceAccess} from "@/src/modules/market-data/server/market-tools-dashboard-access";
import {dirname,join} from 'node:path';
import {currentJournalAccountSelectionRef,requireTraderLinkPlatformRequestIdentity} from '@/src/modules/platform/server/authentication/require-platform-request-scope';
import {requirePlatformMutationRequest} from '@/src/modules/platform/server/authentication/platform-mutation-request-security';
import {withReadonlyPlatformDatabase} from '@/src/modules/platform/server/database/open-readonly-platform-database';
import {evaluateMembershipFeature} from '@/src/modules/platform/server/membership/platform-membership-access';
import {resolvePlatformDatabaseConfig} from '@/src/modules/platform/server/database/platform-database-config';
import {MAX_CHART_PREFERENCE_BYTES} from '@/src/modules/scanner/alpaca/chart-preferences';
import {chartPreferenceOwnerKey,readChartPreferences,writeChartPreferences} from '@/src/modules/scanner/alpaca/chart-preference-store';
export const runtime='nodejs';export const dynamic='force-dynamic';
const reply=(value:unknown,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'private, no-store'}});
function scope(request:Request){const identity=requireTraderLinkPlatformRequestIdentity(request.headers);if(!hasSharedChartDataAccess(identity)&&!hasSharedWorkspaceAccess(identity))throw Error('chart_access_denied');return {identity,user:identity.scope.userId,directory:join(dirname(resolvePlatformDatabaseConfig().databasePath),'chart-preferences-v1')};}
export async function GET(request:Request){let s:ReturnType<typeof scope>;try{s=scope(request);}catch(error){return error instanceof Error&&error.message==='chart_access_denied'?reply({error:'chart_access_denied'},403):reply({error:'not_authenticated'},401);}try{
 const {scope,mode}=s.identity;
 const journalAccountRef=scope.activeAccountId&&(mode==='local_development'||withReadonlyPlatformDatabase({},db=>evaluateMembershipFeature(db,scope.userId,'journal.access').allowed))
  ?currentJournalAccountSelectionRef(scope):undefined;
 return reply({...readChartPreferences(s.directory,s.user),ownerKey:chartPreferenceOwnerKey(s.user),journalAccountRef});
}catch{return reply({error:'preferences_unavailable'},503);}}
export async function POST(request:Request){let s:ReturnType<typeof scope>;try{s=scope(request);}catch(error){return error instanceof Error&&error.message==='chart_access_denied'?reply({error:'chart_access_denied'},403):reply({error:'not_authenticated'},401);}try{requirePlatformMutationRequest(request);}catch{return reply({error:'invalid_request'},403);}
 try{const reader=request.body?.getReader();if(!reader)return reply({error:'invalid_preferences'},400);const chunks:Uint8Array[]=[];let size=0;try{for(;;){const p=await reader.read();if(p.done)break;size+=p.value.length;if(size>MAX_CHART_PREFERENCE_BYTES){await reader.cancel();return reply({error:'invalid_preferences'},400);}chunks.push(p.value);}}finally{reader.releaseLock();}const body=JSON.parse(Buffer.concat(chunks).toString('utf8'));if(body.ownerKey!==chartPreferenceOwnerKey(s.user))return reply({error:'preferences_owner_changed'},409);return reply({...writeChartPreferences(s.directory,s.user,body.revision,body.preferences),ownerKey:chartPreferenceOwnerKey(s.user)});}catch(e){const message=e instanceof Error?e.message:'';return reply({error:message==='preferences_conflict'?'preferences_conflict':'preferences_not_saved'},message==='preferences_conflict'?409:message==='invalid_preferences'||e instanceof SyntaxError?400:503);}}
