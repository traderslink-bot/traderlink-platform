import {requireTraderLinkPlatformRequestIdentity} from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import {openPlatformDatabase} from "@/src/modules/platform/server/database/open-platform-database";
import {assertStatsSameOrigin,authorizeCommunityStats,readCommunityStatsJson,isCommunityStatsAccessDenied} from "@/src/modules/communities/server/stats/community-stats-access";
import {recordCommunityStatsVisit} from "@/src/modules/communities/server/stats/community-stats-visits";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const headers={"Cache-Control":"private, no-store"};
export async function POST(request:Request,{params}:{params:Promise<{communitySlug:string}>}):Promise<Response>{
  if(process.env.TRADERLINK_COMMUNITY_STATS_ENABLED!=="1")return new Response(null,{status:204,headers});
  let db:ReturnType<typeof openPlatformDatabase>|null=null;
  try{
    assertStatsSameOrigin(request);const actor=requireTraderLinkPlatformRequestIdentity(request.headers);
    const body=await readCommunityStatsJson(request,1500),{communitySlug}=await params;
    db=openPlatformDatabase({mode:"runtime"});const scope=await authorizeCommunityStats(db,communitySlug,actor.scope.userId,"visit");
    const result=recordCommunityStatsVisit(db,scope,body,new Date().toISOString());
    return Response.json(result,{headers,status:202});
  }catch(error){
    if(isCommunityStatsAccessDenied(error))return new Response(null,{status:404,headers});
    if(error instanceof SyntaxError||error instanceof TypeError)return new Response(null,{status:400,headers});
    if(error instanceof RangeError)return new Response(null,{status:413,headers});
    throw error;
  }finally{db?.close();}
}
