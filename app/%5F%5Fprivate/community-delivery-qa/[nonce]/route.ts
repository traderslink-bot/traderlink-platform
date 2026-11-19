import type {NextRequest} from "next/server";
import {startCommunityDeliveryQa} from "@/src/modules/communities/server/community-delivery-staging-qa-controller";

export const runtime="nodejs";
export async function POST(request:NextRequest,{params}:{params:Promise<{nonce:string}>}){
 try{return await startCommunityDeliveryQa(request,(await params).nonce);}
 catch{return new Response("Private test unavailable.",{status:404,headers:{"Cache-Control":"no-store"}});}
}
