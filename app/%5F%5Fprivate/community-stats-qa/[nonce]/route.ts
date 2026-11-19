import type {NextRequest} from "next/server";
import {startCommunityStatsQa} from "@/src/modules/communities/server/stats/community-stats-staging-qa-controller";
export const runtime="nodejs";
export async function POST(request:NextRequest,{params}:{params:Promise<{nonce:string}>}){
 try{return await startCommunityStatsQa(request,(await params).nonce);}
 catch{return new Response("Private test unavailable.",{status:404,headers:{"Cache-Control":"private, no-store, max-age=0"}});}
}
